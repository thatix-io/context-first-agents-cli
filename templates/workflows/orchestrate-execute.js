export const meta = {
  name: 'orchestrate-execute',
  description: 'Execute an approved /orchestrate worker graph: DAG without barriers, verified fix loops, live graph',
  whenToUse: 'Called by the /orchestrate command after the user approves the plan. Pass the compiled graph as args.',
  phases: [
    { title: 'Implement', detail: 'implementers and other producing workers, as soon as their deps finish' },
    { title: 'Integrate', detail: 'cross-repo contract checks' },
    { title: 'Review', detail: 'reviewers + adversarial verification of blocking findings' },
    { title: 'Test', detail: 'testCommand per impacted repo + acceptance-criteria coverage' },
    { title: 'Fix', detail: 'corrective implementers for verified findings, then the gate re-runs' },
  ],
}

// ─── Input (compiled by /orchestrate, see orchestrate.md → "Engine B") ────────────────────
// args = {
//   issueId, sessionDir (abs), commandsDir (abs), stateHelper (abs path of worker-state.mjs),
//   maxWorkers, maxFixRounds,
//   repos:   [{ id, worktree, testCommand }],
//   workers: [{ id, name, archetype, repository, scope?, dependsOn, brief, contract }],
//   effort?: { <archetype>: 'low'|'medium'|'high'|... },   // orchestration.agentEffort
//   model?:  { <archetype>: '<model>' },                    // orchestration.agentModel
//   completed?: { [workerId]: <previous compact result> }   // resume after a human decision
// }
// The script has no filesystem access: every agent writes its own workers/<id>.json (via the
// state helper) and its full report workers/<id>.md. The result returned to /orchestrate is
// compact on purpose — the main loop is the most expensive context; details live on disk.

const A = args || {}
if (!A.issueId || !A.sessionDir || !A.commandsDir || !Array.isArray(A.workers)) {
  throw new Error('orchestrate-execute: args must include issueId, sessionDir, commandsDir and workers[]')
}
const MAX_WORKERS = A.maxWorkers || 8
const MAX_FIX_ROUNDS = A.maxFixRounds ?? 2
const REPOS = new Map((A.repos || []).map((r) => [r.id, r]))
const GATES = new Set(['reviewer', 'tester', 'integrator'])
const FAILING = new Set(['BLOCKED', 'RED', 'MISMATCH'])
const PHASE_OF = { implementer: 'Implement', integrator: 'Integrate', reviewer: 'Review', tester: 'Test' }

// Reasoning effort per archetype. Judgment work (implementer, reviewer, verifier) inherits the
// session effort; the tester's first run maps acceptance criteria (medium), its re-runs only
// re-execute tests on the touched repos (low). Overridable via args.effort / args.model.
const EFFORT = { tester: 'medium', ...(A.effort || {}) }
const RERUN_EFFORT = { tester: 'low' }
const MODEL = A.model || {}
function opts(archetype, label, phase, schema, rerun = false) {
  const o = { label, phase, schema }
  const effort = (rerun && RERUN_EFFORT[archetype]) || EFFORT[archetype]
  if (effort) o.effort = effort
  if (MODEL[archetype]) o.model = MODEL[archetype]
  return o
}

const RETURN_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['done', 'blocked'] },
    verdict: { type: 'string', description: 'PASS | BLOCKED | GREEN | RED | CONSISTENT | MISMATCH, or empty' },
    summary: { type: 'string', description: 'at most 3 lines — the full report is in your report file' },
    changes: { type: 'array', items: { type: 'string' }, description: 'files touched (path + one-line what)' },
    commits: { type: 'array', items: { type: 'string' }, description: 'implementers: commit SHAs created' },
    unresolved: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['blocking', 'should-fix', 'nit'] },
          repository: { type: 'string', description: 'repo id that owns the fix' },
          file: { type: 'string' },
          line: { type: 'integer' },
          description: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['severity', 'description'],
      },
    },
    spawn: {
      type: 'array',
      description: 'new workers this work revealed as necessary (live graph)',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          archetype: { type: 'string' },
          repository: { type: 'string' },
          dependsOn: { type: 'array', items: { type: 'string' } },
          brief: { type: 'string' },
          inScope: { type: 'boolean', description: 'inside the approved plan scope' },
          newRisk: { type: 'boolean', description: 'introduces a risk the plan did not foresee' },
          reason: { type: 'string' },
        },
        required: ['name', 'archetype', 'brief', 'inScope', 'newRisk'],
      },
    },
  },
  required: ['status', 'summary', 'confidence'],
}

const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          index: { type: 'integer' },
          real: { type: 'boolean' },
          reason: { type: 'string' },
        },
        required: ['index', 'real', 'reason'],
      },
    },
  },
  required: ['verdicts'],
}

// ─── State ────────────────────────────────────────────────────────────────────────────────
const nodes = new Map(A.workers.map((w) => [w.id, { ...w, dependsOn: [...(w.dependsOn || [])] }]))
const runs = new Map() // id → Promise<result>
const results = new Map() // id → final result (after fix loops)
const started = new Set()
const needsHuman = []
const acceptedSpawns = []
const extraAgents = [] // fix / verify / re-run agents, for the final report
let spawnSeq = 0
// Regression guard: every completed fix batch bumps fixSeq and is logged with the repo it
// touched. A gate is re-run only if a fix newer than its last check touched a repo in its scope.
let fixSeq = 0
const validAt = new Map() // gate id → fixSeq when its last (passing) check started
const fixLog = [] // { seq, by, repo, summary, commits, changes }

const scopeOf = (w) => (w.scope && w.scope.length ? w.scope : w.repository ? [w.repository] : [...REPOS.keys()])
const trim = (list, n) => (list || []).slice(0, n)

// ─── Prompt building — stable prefix first (shared by every agent → prompt-cache friendly) ─
const SHARED = [
  `## Workflow rules (every worker of session ${A.issueId})`,
  `- You are an ephemeral worker. The context contract and brief below are your ONLY project context: select, do not dump. Never modify normative specs.`,
  `- Never guess: if essential information is missing, finish as "blocked" and explain in unresolved. In doubt, blocked — never an invented done.`,
  `- Command/test output: use quiet or summary reporters; send full output to a log file under \`${A.sessionDir}/logs/\` and bring into your context only the summary and the failures (e.g. \`tail -n 40\`, \`grep -E "FAIL|Error"\`).`,
  `- State: update your state file ONLY with the commands given at the end, at 3–5 milestone steps (not every action).`,
  `- Report: before returning, write your full report (summary / changes / evidence / tests / unresolved / confidence, plus findings) to the report path given at the end. Then return the structured result with a SHORT summary (≤ 3 lines) — details live in the report.`,
  `- Gates (reviewer/tester/integrator): report each problem in findings[]; every blocking finding MUST name the owning repository.`,
  `- Implementers: list your commit SHAs in commits[]; propose clearly-needed work outside your brief in spawn[] (honest inScope/newRisk flags) instead of doing it.`,
].join('\n')

const shq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`

function stateBlock(id, meta) {
  const file = `${A.sessionDir}/workers/${id}.json`
  const report = `${A.sessionDir}/workers/${id}.md`
  if (!A.stateHelper) {
    return `## Your files\n- State: \`${file}\` — on start set status "running" + startedAt; per milestone update currentStep and append {step, at} to steps[]; on finish status done|blocked, finishedAt, verdict (timestamps: \`date -u +%Y-%m-%dT%H:%M:%SZ\`).\n- Report: \`${report}\``
  }
  const h = `node ${shq(A.stateHelper)} ${shq(file)}`
  return [
    `## Your files`,
    `- Start:     ${h} start ${shq(JSON.stringify(meta))} "<first step>"`,
    `- Milestone: ${h} step "<what you are doing>"`,
    `- Finish:    ${h} finish done|blocked [VERDICT]`,
    `- Report:    \`${report}\``,
  ].join('\n')
}

const contractText = (w) => (typeof w.contract === 'string' ? w.contract : JSON.stringify(w.contract ?? {}))

function depDigest(w) {
  // only what downstream workers need from their inputs; the full reports are on disk
  const deps = w.dependsOn.map((d) => [d, results.get(d)]).filter(([, r]) => r && r.status !== 'skipped')
  if (!deps.length) return ''
  return (
    `\n## Inputs from the workers you depend on (full reports: ${A.sessionDir}/workers/<id>.md)\n` +
    deps
      .map(([d, r]) =>
        JSON.stringify({ id: d, name: nodes.get(d)?.name, verdict: r.verdict, summary: r.summary, changes: trim(r.changes, 20), unresolved: r.unresolved })
      )
      .join('\n')
  )
}

function workerPrompt(w, extra = '') {
  const repo = w.repository ? REPOS.get(w.repository) : null
  return [
    SHARED,
    `\n## You\nWorker ${w.id} (${w.name}) — an ephemeral \`${w.archetype}\`. Read your archetype \`${A.commandsDir}/agents/${w.archetype}.md\` and follow it (the workflow rules above replace the "Workflow mode" part of CONTEXT-CONTRACT.md — no need to open it).`,
    repo ? `Repository: ${repo.id} — worktree \`${repo.worktree}\`${repo.testCommand ? ` — testCommand: \`${repo.testCommand}\`` : ''}.` : `Session-level worker: no repository write access; write only session artifacts. Repos in scope: ${scopeOf(w).join(', ') || 'none'}.`,
    `\n## Context contract\n${contractText(w)}`,
    `\n## Brief\n${w.brief}`,
    depDigest(w),
    extra,
    `\n${stateBlock(w.id, { id: w.id, name: w.name, archetype: w.archetype, repository: w.repository ?? null, dependsOn: w.dependsOn, objective: String(w.brief).slice(0, 200) })}`,
  ].join('\n')
}

function recheckInstructions(repos, fixes) {
  const commits = fixes.flatMap((f) => (f.commits || []).map((c) => `${f.repo}@${c}`))
  return [
    `Limit the re-check to the repos the fixes touched: ${repos.join(', ')}.`,
    `- tester: run only those repos' tests.`,
    `- reviewer / integrator: review only the fix changes${commits.length ? ` (\`git -C <worktree> show <sha>\`: ${commits.join(', ')})` : ''} and what directly depends on them — not the whole feature again.`,
    `Fixes:\n${fixes.map((f) => JSON.stringify({ repo: f.repo, summary: f.summary, changes: trim(f.changes, 15) })).join('\n')}`,
  ].join('\n')
}

// ─── Execution ────────────────────────────────────────────────────────────────────────────
async function awaitDeps(w) {
  // dependsOn can grow while we wait (live graph) — loop until stable
  let seen = -1
  while (seen !== w.dependsOn.length) {
    seen = w.dependsOn.length
    await Promise.all(w.dependsOn.map(run))
  }
  return w.dependsOn.map((d) => results.get(d))
}

function run(id) {
  if (runs.has(id)) return runs.get(id)
  const p = (async () => {
    const w = nodes.get(id)
    if (!w) {
      needsHuman.push({ worker: id, reason: 'dependency id not found in the graph' })
      return finish(id, { status: 'skipped', summary: 'unknown worker id' })
    }
    if (A.completed && A.completed[id]) return finish(id, A.completed[id])

    const deps = await awaitDeps(w)
    started.add(id)
    const failedDep = w.dependsOn.find((d, i) => !deps[i] || deps[i].status !== 'done')
    if (failedDep) return finish(id, { status: 'skipped', summary: `skipped: dependency ${failedDep} did not finish` })

    const seqAtStart = fixSeq
    let r = await agent(workerPrompt(w), opts(w.archetype, w.name, PHASE_OF[w.archetype] || 'Implement', RETURN_SCHEMA))
    if (!r) r = { status: 'blocked', summary: 'agent died or was skipped', unresolved: ['agent returned no result'], confidence: 'low' }

    if (GATES.has(w.archetype)) r = await gateLoop(w, r, id, seqAtStart)
    else handleSpawns(w, r)

    if (r.status === 'blocked') needsHuman.push({ worker: id, name: w.name, verdict: r.verdict, unresolved: r.unresolved || [], findings: blocking(r), report: `${A.sessionDir}/workers/${id}.md` })
    return finish(id, r)
  })()
  runs.set(id, p)
  return p
}

function finish(id, r) {
  results.set(id, r)
  return r
}

const blocking = (r) => (r.findings || []).filter((f) => f.severity === 'blocking')
const failing = (r) => FAILING.has(String(r.verdict || '').toUpperCase()) || (r.status === 'blocked' && blocking(r).length > 0)

// Gate (reviewer/tester/integrator) → verify findings → fix per repo → scoped re-run, up to
// MAX_FIX_ROUNDS. `w.id` prefixes the extra agents' ids; `gateId` is the node whose trust is tracked.
async function gateLoop(w, first, gateId, seqAtStart) {
  let r = first
  validAt.set(gateId, seqAtStart)
  for (let round = 1; failing(r) && round <= MAX_FIX_ROUNDS; round++) {
    let findings = blocking(r)
    if (!findings.length) break // blocked without actionable findings → human

    // Reviewer findings are judgment calls → adversarial verification before anyone fixes them.
    // Tester/integrator findings come from concrete evidence (test output, contract diff).
    if (w.archetype === 'reviewer') {
      findings = await verifyFindings(w, findings, round)
      if (!findings.length) {
        log(`${w.name}: every blocking finding was refuted in round ${round} — gate passes`)
        return { ...r, status: 'done', verdict: 'PASS', summary: `${r.summary} (blocking findings refuted by verification)`, findings: (r.findings || []).filter((f) => f.severity !== 'blocking') }
      }
    }

    const unroutable = findings.filter((f) => !f.repository || !REPOS.has(f.repository))
    if (unroutable.length) {
      return { ...r, status: 'blocked', unresolved: [...(r.unresolved || []), ...unroutable.map((f) => `finding without an owning repository: ${f.description}`)] }
    }

    const byRepo = new Map()
    for (const f of findings) byRepo.set(f.repository, [...(byRepo.get(f.repository) || []), f])
    log(`${w.name}: round ${round} — fixing ${findings.length} finding(s) in ${[...byRepo.keys()].join(', ')}`)

    const fixes = await parallel(
      [...byRepo].map(([repoId, fs]) => () => {
        const fid = `${w.id}.fix${round}.${repoId}`
        const fw = { id: fid, name: `fix:${repoId}#${round}`, archetype: 'implementer', repository: repoId, dependsOn: [w.id], brief: `Corrective run: fix the verified findings raised by ${w.name} (round ${round}). Change only what is needed; add/adjust the tests that prove each fix; commit in the worktree; report per finding what changed.`, contract: w.contract }
        const extra = `\n## Findings to fix\n${fs.map((f) => JSON.stringify(f)).join('\n')}`
        return agent(workerPrompt(fw, extra), opts('implementer', fw.name, 'Fix', RETURN_SCHEMA)).then((res) => {
          const out = res || { status: 'blocked', summary: 'agent returned no result' }
          extraAgents.push({ id: fid, name: fw.name, archetype: 'implementer', repository: repoId, status: out.status, summary: out.summary })
          return { ...out, repo: repoId }
        })
      })
    )
    const brokenFix = fixes.find((f) => !f || f.status !== 'done')
    if (brokenFix !== undefined) {
      return { ...r, status: 'blocked', unresolved: [...(r.unresolved || []), `a corrective implementer could not complete round ${round}`, ...((brokenFix && brokenFix.unresolved) || [])] }
    }
    fixSeq++
    const batch = fixes.map((f) => ({ seq: fixSeq, by: w.name, repo: f.repo, summary: f.summary, commits: f.commits || [], changes: f.changes || [] }))
    fixLog.push(...batch)
    validAt.set(gateId, fixSeq)

    const rid = `${w.id}.r${round + 1}`
    const rw = { ...w, id: rid, name: `${w.name}#${round + 1}` }
    const extra = `\n## Re-run (round ${round + 1})\nConfirm each of these blocking findings is really fixed:\n${findings.map((f) => JSON.stringify(f)).join('\n')}\n${recheckInstructions([...byRepo.keys()], batch)}`
    r = (await agent(workerPrompt(rw, extra), opts(w.archetype, rw.name, PHASE_OF[w.archetype], RETURN_SCHEMA, true))) || { status: 'blocked', summary: 'agent returned no result', confidence: 'low' }
    extraAgents.push({ id: rid, name: rw.name, archetype: w.archetype, repository: w.repository ?? null, status: r.status, verdict: r.verdict || null, summary: r.summary })
  }
  if (failing(r)) {
    return { ...r, status: 'blocked', unresolved: [...(r.unresolved || []), `gate still failing after ${MAX_FIX_ROUNDS} fix round(s)`] }
  }
  return r
}

async function verifyFindings(w, findings, round) {
  const vid = `${w.id}.v${round}`
  const prompt = [
    SHARED,
    `\n## You\nAdversarial verifier (session-level, read-only). Reviewer ${w.name} raised the blocking findings below.`,
    `For each one, try to REFUTE it: open the cited file/line and the governing spec/metaspec (context contract below).`,
    `Mark real=false ONLY when you can show concrete evidence (code, spec section) that the finding is wrong or not blocking. If you cannot refute it, real=true.`,
    `\n## Context contract\n${contractText(w)}`,
    `\n## Findings\n${findings.map((f, i) => `${i}: ${JSON.stringify(f)}`).join('\n')}`,
    `\n${stateBlock(vid, { id: vid, name: `verify:${w.name}#${round}`, archetype: 'reviewer', repository: null, dependsOn: [w.id], objective: `verify blocking findings of ${w.name}` })}`,
  ].join('\n')
  const v = await agent(prompt, opts('verifier', `verify:${w.name}#${round}`, 'Review', VERIFY_SCHEMA))
  if (!v) return findings // verifier failed → keep every finding (never drop a blocker silently)
  const refuted = new Set(v.verdicts.filter((x) => !x.real).map((x) => x.index))
  extraAgents.push({ id: vid, name: `verify:${w.name}#${round}`, archetype: 'reviewer', status: 'done', summary: `${findings.length - refuted.size}/${findings.length} blocking finding(s) confirmed` })
  return findings.filter((_, i) => !refuted.has(i))
}

// Live graph: accept proposals inside the approved pattern, escalate the rest.
function handleSpawns(w, r) {
  for (const s of r.spawn || []) {
    const ok = s.inScope && !s.newRisk && nodes.size < MAX_WORKERS
    if (!ok) {
      const why = !s.inScope ? 'outside the approved plan scope' : s.newRisk ? 'introduces a new risk' : `maxWorkers (${MAX_WORKERS}) reached`
      needsHuman.push({ worker: w.id, name: w.name, proposal: s, reason: `spawn proposal escalated: ${why}` })
      continue
    }
    const id = `D${++spawnSeq}`
    const dependsOn = [w.id, ...(s.dependsOn || []).filter((d) => results.has(d))] // only finished deps → no cycles
    nodes.set(id, { id, name: s.name, archetype: s.archetype, repository: s.repository || null, dependsOn, brief: s.brief, contract: w.contract })
    acceptedSpawns.push({ id, from: w.id, name: s.name, reason: s.reason })
    log(`live graph: ${w.name} spawned ${s.name} (${id})`)

    // Everything downstream of the proposer must also wait for the new worker.
    for (const [nid, n] of nodes) {
      if (nid === id || !n.dependsOn.includes(w.id)) continue
      if (started.has(nid)) {
        needsHuman.push({ worker: nid, name: n.name, reason: `${s.name} (${id}) was spawned after ${n.name} started — re-run ${n.name} once ${id} finishes` })
      } else {
        n.dependsOn.push(id)
      }
    }
    run(id)
  }
}

// ─── Drive the graph to completion (new nodes may appear while it runs) ───────────────────
let known
do {
  known = nodes.size
  await Promise.all([...nodes.keys()].map(run))
} while (nodes.size !== known)

// ─── Regression: re-run only gates whose scope a later fix touched ────────────────────────
const newerFixes = (w) => fixLog.filter((f) => f.seq > (validAt.get(w.id) ?? 0) && scopeOf(w).includes(f.repo))
const staleGates = () => [...nodes.values()].filter((w) => GATES.has(w.archetype) && results.get(w.id)?.status === 'done' && newerFixes(w).length)

for (let pass = 1; pass <= MAX_FIX_ROUNDS && staleGates().length; pass++) {
  const stale = staleGates()
  log(`regression pass ${pass}: ${stale.map((w) => w.name).join(', ')} passed before later fixes in their scope — re-running (scoped)`)
  await parallel(
    stale.map((w) => async () => {
      const fixes = newerFixes(w)
      const repos = [...new Set(fixes.map((f) => f.repo))]
      const seqAtStart = fixSeq
      const rw = { ...w, id: `${w.id}.reg${pass}`, name: `${w.name}@reg${pass}` }
      const extra = `\n## Regression re-run\nYou already passed, but corrective fixes changed code in your scope AFTER your check.\n${recheckInstructions(repos, fixes)}`
      let r = (await agent(workerPrompt(rw, extra), opts(w.archetype, rw.name, PHASE_OF[w.archetype], RETURN_SCHEMA, true))) || { status: 'blocked', summary: 'agent returned no result', confidence: 'low' }
      r = await gateLoop(rw, r, w.id, seqAtStart)
      extraAgents.push({ id: rw.id, name: rw.name, archetype: w.archetype, repository: w.repository ?? null, status: r.status, verdict: r.verdict || null, summary: r.summary })
      if (r.status === 'blocked') needsHuman.push({ worker: w.id, name: w.name, verdict: r.verdict, unresolved: r.unresolved || [], findings: blocking(r), reason: 'regression re-run failed', report: `${A.sessionDir}/workers/${rw.id}.md` })
      results.set(w.id, r)
    })
  )
}
for (const w of staleGates()) {
  needsHuman.push({ worker: w.id, name: w.name, reason: `still unverified against the latest fixes after ${MAX_FIX_ROUNDS} regression pass(es)` })
}

// ─── Compact result for the main loop (full reports: workers/<id>.md) ─────────────────────
const report = [...nodes.values()].map((w) => {
  const r = results.get(w.id) || {}
  return { id: w.id, name: w.name, archetype: w.archetype, repository: w.repository ?? null, status: r.status, verdict: r.verdict || null, summary: r.summary, confidence: r.confidence || null }
})
const blockedAny = report.some((w) => w.status === 'blocked' || w.status === 'skipped')

return {
  issueId: A.issueId,
  status: needsHuman.length || blockedAny ? 'blocked' : 'done',
  reports: `${A.sessionDir}/workers/<id>.md`,
  workers: report,
  extraAgents,
  acceptedSpawns,
  fixRounds: fixLog.map((f) => ({ seq: f.seq, by: f.by, repo: f.repo, summary: f.summary })),
  needsHuman,
}
