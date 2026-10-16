# /orchestrate — Dynamic Ephemeral Agent Orchestration

You are the **Orchestrator**. Your job is to turn an approved spec into the **minimum
graph of ephemeral, specialized agents** and coordinate their execution — instead of
running one monolithic agent over a huge shared context.

This command REPLACES the old linear `start → plan → work` flow with a graph the
runtime derives automatically. `/plan` and `/work` may still exist as manual escape hatches.

**Argument**: `#$ARGUMENTS` (an ISSUE-ID and/or a path to a spec/task file, plus optional flags).

**Flags** (optional — without them the command is interactive, as always):
- `--plan-only` — plan, record the plan as waiting for approval, and stop (nothing executes).
- `--resume` — continue a session stopped at a gate: reads `.sessions/<ISSUE-ID>/approval.json`
  (`{ approved, by, at, notes }`) and executes, or stops if it was rejected / is missing.
- `--headless` — no gate asks a question: every human gate records a `needsHuman` item in
  `state.json`, sets the status and **ends the command**. For non-interactive runs, e.g.
  `claude -p "/orchestrate <ISSUE-ID> --plan-only --headless"` in the orchestrator directory.

`--plan-only` and `--resume` also work without `--headless`.

---

## Golden rules

- ✅ Read `context-manifest.json` + `ai.properties.md` from the orchestrator.
- ✅ The Orchestrator's own context stays LIGHT: you coordinate, you do not implement.
- ✅ Each unit of work is done by a **subagent** with an **isolated context contract**.
- ✅ **Execution runs on Engine B — the `Workflow` tool** (script `orchestrate-execute`): the DAG,
  the fix loops, the live graph and the limits are enforced by code, not by your memory.
  **Invoking `/orchestrate` IS the user's explicit opt-in to run this workflow — do not ask
  again.** Engine A (Task/Agent tool, wave by wave) is only the fallback when the `Workflow`
  tool does not exist in this environment (see Step 6).
- ✅ Decisions stay with the user, in this main loop: plan approval, blockers, out-of-pattern
  spawns. The workflow never guesses — it ends and hands the blockers back to you.
- ✅ **Every human gate is also written to disk** (`state.json` → `needsHuman[]`, via
  `.claude/bin/session-state.mjs`), so the dashboard and other tools see "waiting on you" without
  reading this conversation. Interactive: record it, then ask. `--headless`: record it and stop.
- ✅ Never build a catalog of domain agents (no `frontend-agent`, `payments-agent`). A worker is
  compiled on the fly: `archetype + objective + repository + context contract + tools`.
- ❌ Never dump whole repos into a subagent. Select, do not dump.
- ❌ Never let a subagent modify normative specs.

---

## Step 0 — Mode and session state

1. Parse the flags from the arguments (`--plan-only`, `--resume`, `--headless`); the rest is the
   ISSUE-ID / spec path. Keep the mode in mind for every gate below.
2. **State helper.** All session-level state goes through
   `node .claude/bin/session-state.mjs .sessions/<ISSUE-ID> <command>` (abbreviated `SS` below —
   format in `SESSION-STATE.md`): `set '<json>'`, `status <status> [phase]`, `need <id> <kind>
   "<reason>" "<howToResolve>" <ref>`, `need-json -` (stdin), `resolve <id>|--all`,
   `apply-approval`, `show`. It writes `state.json` atomically and appends `events.jsonl`. If the
   helper file does not exist, edit `state.json` by hand with the same fields (and append the
   event lines to `events.jsonl`).
3. **`--resume`** — jump here instead of planning again:
   - Run `SS show`. If nothing is pending and the session is not `blocked`/`awaiting_approval`,
     say so and stop.
   - Run `SS apply-approval` and act on its `result`:
     - `missing` / `stale` / `invalid` → change nothing; tell the user (what is pending and that
       `approval.json` must be written after it) and **stop**.
     - `rejected` → the helper already set `status: done` + `rejected: true` + `notes`. Report the
       notes and **stop** (nothing executes).
     - `approved` → the pending items were resolved. Load the configuration (Step 1) and
       continue from the gate that was pending:
       `plan-approval` → `SS status running execute`, reload the approved plan
       (`execution-plan.md`) and go to **Step 5**;
       blocked workers / spawn proposals → **Step 6, "Resume after the user decides"**, using
       `notes` as the human decision; `conflict-<repo>` → **Step 7**.
4. Otherwise (new run): `SS set '{"issueId":"<ISSUE-ID>"}'` then `SS status planned plan` — the
   session shows up as being planned (re-planning an existing session also moves it back to `plan`).

## Step 1 — Load configuration

1. Read `context-manifest.json`. Extract `repositories[]` (each has `id`, `role`, `hints`,
   optional `context`, `testCommand`, `mainBranch`) and the `orchestration` block
   (`archetypes`, `riskSignals`, `parallelism`, `contextPolicy`, `maxFilesPerWorker`, `indexes`).
2. Read `ai.properties.md` for `base_path` and the task manager settings (if any):
   `task_management_system` + the tracker fields (jira: `jira_site`/`jira_project`;
   linear: `linear_team`; github: `github_org`/`github_repo`). Use them to locate the
   issue via MCP.
3. Locate the specs repo: the repository with `role: metaspecs` (or `specs-provider`).

## Step 2 — Load the spec

- If a task manager is configured and the argument is an ISSUE-ID, read the issue via the
  appropriate MCP. Otherwise read the spec file passed as argument, or ask the user for it
  (`--headless`: `SS need spec-missing decision "No spec/issue found for <ISSUE-ID>" "Provide the spec (file or tracker issue) and re-run"` and stop;
  tracker unreachable → kind `access`).
- Read the relevant `orchestration.indexes` (the context routers) to ground yourself.
  Do NOT read the whole codebase — you are only classifying and routing here.

## Step 3 — Classify complexity (deterministic rules)

Compute against the spec text:

- **repoHits** = number of repositories whose `id` OR any of its `hints` appear in the spec.
- **risks** = number of `orchestration.riskSignals` that appear in the spec.
- If the spec's frontmatter sets `complexity: simple|medium|complex`, use it verbatim.

Otherwise:

| Condition | Level |
|---|---|
| `repoHits ≥ 3` OR `risks ≥ 2` OR very large spec | **complex** |
| `repoHits ≥ 2` OR `risks ≥ 1` OR moderately large spec | **medium** |
| otherwise | **simple** |

State the classification and the reason explicitly before continuing.

## Step 3b — Distill the Technical Profile from the metaspecs (required for code)

Before building the graph, **consult the technical indexes** (the `/warm-up` Context Map +
`orchestration.indexes` + the impacted repos' `context[]`) and distill a **Technical
Profile** of what the metaspecs require. Invent nothing — only what the spec states.
Extract, when present:

- **Stack + idioms**: languages/frameworks and required conventions (e.g. "Vue3/Nuxt
  composition API", "NestJS + Mongoose", "ESM with `.js` imports", "pnpm/Jest").
- **Architecture**: the required pattern and its dependency rules (e.g. "Clean Architecture:
  `domain` pure, no framework; `application` via ports; `infrastructure` implements ports").
- **Detectable anti-patterns**: concrete prohibitions and how to detect them (e.g. "`domain`
  must not import `mongoose`/`@nestjs/*`", "no hardcoded values where a design token exists").
- **Design system / tokens**: if the metaspec defines a DS (e.g. `DESIGN_TOKENS_CONTRACT.md`),
  record the visual/token conformance rules to follow and validate.
- **Quality/security rules**: LGPD/PII, API contracts, mandatory tests.

This Technical Profile feeds **everything downstream**: the shape of the graph (Step 4),
each worker's guidance (Step 5), and which reviewers to create. Cite the specs consulted
(name + version/section) — that's the audit trail.

## Step 4 — Build the execution graph (DAG) — architecture-aware

Instantiate workers from `orchestration.archetypes`. Each worker node has:
`{ id, name, archetype, objective, repository, dependsOn[], contextHints[] }`.

Besides the short `id` (`W1`, `W2`…), give each worker a **descriptive `name` =
role + target**, derived from the archetype + repo/objective. Suggested prefixes:
`impl:`, `integrate:`, `review:`, `test:`, `research:`, `plan:`. Examples:
`impl:front-audio`, `impl:back-domain`, `review:arch`, `review:design-system`, `test:front`.
The dashboard displays this `name` (the `id` stays internal).

### Base by complexity
- **simple**: `implementer` on the single impacted repo → `reviewer` (dependsOn) vs. the spec.
- **medium**: one `implementer` per impacted repo (parallel) → `integrator` → `tester`.
- **complex** = medium + adversarial `reviewer` (dependsOn integrator).

### Architectural decomposition (optional — you decide if it's worth it)
Using the **Technical Profile**, judge whether to **split a repo into several workers**
following the metaspec's architecture, instead of one monolithic implementer:
- e.g. Clean Architecture: `impl:domain` → `impl:application` → (`impl:infra` ∥
  `impl:presentation`), honoring "dependencies point inward".
- e.g. by module/bounded-context/feature when the spec is organized that way.

**Judgment, not a fixed rule**: only decompose if the task is large/risky enough that the
parallelism and isolation pay off. Small task → one implementer per repo (layer
decomposition happens inside the worker). State why you decomposed (or not).

### Reviewers derived from the metaspecs
Create the reviewers/validators the **Technical Profile** justifies — each carrying the
concrete rules extracted from the spec (not generic):
- Profile has architecture/anti-patterns → `review:arch` (checks layers, dependencies, the
  detectable anti-patterns).
- Profile has a design system/tokens and the front was touched → `review:design-system`
  (validates token/component conformance).
- Profile has LGPD/security/contracts → `review:security` / `review:contract`.
With few rules you may consolidate into a single reviewer with multiple lenses — but each
lens must carry the real metaspec rules.

Respect `parallelism.maxWorkers` and `maxPerRepository` (layer decomposition counts toward
`maxPerRepository`). If you exceed it, batch and say so — never silently drop a repo/layer.

The graph table (id, archetype, repo, dependsOn) is the **starting point**, not the final
list: in live orchestration (Step 4b) the graph grows as work reveals the need.

## Step 4b — Detailed planning first (planner agent) + LIVE graph

Do NOT pre-compute all workers up front with one-line objectives (that leaves agents "raw",
re-planning everything). Instead, `/orchestrate` is a **seed**:

1. **Spawn a `planner` agent** (archetype in `agents/planner.md`) — dependsOn none. It writes
   the **detailed technical plan**, fed by the Technical Profile (Step 3b), into
   `.sessions/<ISSUE-ID>/execution-plan.md`, in the spirit of the old `plan.md`:
   - **Technical approach** and decisions (echoing the metaspec architecture).
   - **Contracts/APIs** — endpoints, types, events, fields (real names; producer/consumer).
   - **Per-repo file structure** — files to create/modify (path + what changes).
   - **Testing strategy** per repo, mapped to acceptance criteria.
   - **Risks** and **execution order**.
   - And crucially: **which workers to create** (role, repo/layer, detailed brief, deps).
2. **Present the planner's plan and get approval** — this is your control point (like
   approving the old `plan.md`). Nothing executes before it. First record the gate on disk:
   `SS set '{"title":"<task title>","complexity":"<level>"}'` and
   `SS need plan-approval approval "Plan ready for approval" "Approve in the conversation, or write .sessions/<ISSUE-ID>/approval.json and run /orchestrate <ISSUE-ID> --resume" execution-plan.md`
   (status becomes `awaiting_approval`). Then, by mode:
   - **interactive** (default): show the plan and ask. Approved → `SS resolve plan-approval`,
     `SS status running execute` and continue. Rejected → `SS set '{"rejected":true,"notes":"<why>"}'`, `SS resolve plan-approval`,
     `SS status done` and stop. Changes requested → adjust the plan and ask again.
   - **`--plan-only`** or **`--headless`**: do not ask. Show/summarize the plan and **stop here** —
     the session stays `awaiting_approval`; approval comes through `approval.json` + `--resume`.
3. Hand the approved graph to the execution engine (Step 6).

### Live graph (fully dynamic, enforced by the workflow)
The graph is **alive**: any worker may **propose new workers** when work reveals the need (an
implementer finds a missing service, a helper module, a migration step). Workers do not spawn
agents themselves — they return proposals in `spawn[]` with `inScope` / `newRisk` flags, and the
workflow applies the **dynamic control**:
- **within the pattern** (inside the approved plan's scope, within `maxWorkers`, no new risk) →
  the workflow creates the worker (`D1`, `D2`…), wires it before everything downstream of the
  proposer, and runs it — the dashboard shows it **appearing live**;
- **off-pattern** (outside the plan's scope, high/new risk such as an unplanned migration,
  security or breaking change, `maxWorkers` reached) → the proposal is **not** executed; it comes
  back in `needsHuman[]` and you **STOP and ask the user** (Step 6, "Handle the result").

Gates never propose workers: a reviewer/tester/integrator reports `findings[]`, and the
workflow's **fix loop** creates the corrective implementers (Step 6).

## Step 5 — Compile a Context Contract per node (with a detailed brief)

Each worker (defined by the planner or spawned live) gets, besides the contract, a
**brief cut from the plan** — its slice, dense, **not a one-liner**. That's what makes the
agent start knowing what to do. Each worker's `objective` must contain:

- **What to do** — the concrete change (not "implement audio", but "add `resolveIofAmount`
  in X; swap route Y→Z in W; parse the new envelope").
- **Target files** — that worker's files (path + what changes).
- **Contracts it produces/consumes** — the API/type slice that connects to other workers.
- **Expected tests** — the concrete cases it must cover.
- **Depends on / delivers to** — what it expects from another worker and what it hands off.

Keep the brief **scoped** (only the worker's part) — don't paste the whole plan into every
agent (breaks `select-do-not-dump`). Plan deep once; each agent gets its rich slice.

### Contract format

For each worker, build the contract that will be pasted into its subagent prompt.
See `agents/CONTEXT-CONTRACT.md` for the exact shape. In short:

- **read**: `orchestration.indexes` + that repo's `context[]` (only files that exist)
- **mayDiscover**: references reachable from the indexes; repo files the task needs
- **techProfile**: this worker's **specific technical guidance**, extracted from the
  Technical Profile (Step 3b) and scoped to it. This is what specializes the agent:
  - implementer → stack/idioms + the architecture rule for ITS layer/repo (e.g. a `domain`
    worker gets "pure, no framework, don't import mongoose/@nestjs"; a front worker gets
    "use design-system tokens, no hardcoded values"). Point at the exact indexes to consult
    (e.g. `technical/ARCHITECTURE.md`, `DESIGN_TOKENS_CONTRACT.md`).
  - reviewer/validator → the **concrete checklist** derived from the spec (anti-patterns to
    detect, tokens to check, security rules) — not "review well", but "verify X, Y, Z".
- **mustNotAssume**: unstated business rules; unindexed external contracts; anything not in specs
- **writeBoundary**: only that repo's worktree (or session artifacts for integrator/tester)
- **limits**: `contextPolicy` (default `select-do-not-dump`), `maxFilesPerWorker`
- **return**: summary, changes, evidence, tests, unresolved questions, confidence

> The `techProfile` is what makes an `implementer` produce **idiomatic, architecture-conformant**
> code, and a `reviewer` review **in the real technology's language** — all derived from the
> metaspecs, without the package knowing the stack in advance.

## Step 5b — Prepare the session worktrees (via git, not Node)

Before spawning any agent, create an **isolated git worktree per impacted repository**
(only the ones in the graph), so each implementer has a place to write without touching
the main repo. Use `base_path` (from `ai.properties.md`) and the `<ISSUE-ID>`.

For each impacted repository `<repo>` (use the manifest's `mainBranch`, default `main`):

1. If `.sessions/<ISSUE-ID>/<repo>/` already exists, **skip** (worktree ready).
2. **Update the base**: fetch the latest remote state so the worktree starts from
   up-to-date code (not the local main, which may be stale):
   ```bash
   git -C "{base_path}/<repo>" fetch origin "<mainBranch>" --quiet
   ```
3. Check whether branch `feature/<ISSUE-ID>` already exists in the repo:
   ```bash
   git -C "{base_path}/<repo>" rev-parse --verify --quiet "feature/<ISSUE-ID>"
   ```
4. Create the worktree:
   - if the branch does **not** exist — create it **from the updated `origin/<mainBranch>`**:
     ```bash
     git -C "{base_path}/<repo>" worktree add -b "feature/<ISSUE-ID>" \
         "$(pwd)/.sessions/<ISSUE-ID>/<repo>" "origin/<mainBranch>"
     ```
   - if the branch **already** exists (reuse it):
     ```bash
     git -C "{base_path}/<repo>" worktree add \
         "$(pwd)/.sessions/<ISSUE-ID>/<repo>" "feature/<ISSUE-ID>"
     ```
   If the `fetch` fails (no remote/offline), warn and fall back to local state
   (`worktree add -b feature/<ISSUE-ID> <path>` without `origin/<mainBranch>`).

Rules:
- **Never** `checkout` in the main repo (`{base_path}/<repo>`) — the worktree isolates everything.
- If `git worktree add` fails with "already exists", treat it as ready and continue.
- Only prepare worktrees for the **impacted** repos in the graph, not every repo in the manifest.
- Record in `execution-plan.md` which worktrees were created (path + branch).

After this, each agent's `writeBoundary` (`.sessions/<ISSUE-ID>/<repo>/`) actually exists.

## Step 5c — Write the initial state (for the dashboard)

Write machine-readable state into `.sessions/<ISSUE-ID>/` (format in the orchestrator's
`SESSION-STATE.md`). This feeds `context-agents dashboard`. **You are the only writer of
`state.json`**; each worker writes only its own `workers/<id>.json`.

1. `state.json` (through the helper — it keeps `status`, `phase`, `needsHuman`, `updatedAt`
   consistent): `SS set '{"issueId","title","complexity","engine","repos","waves"}'` with the
   real values (`engine` = `"workflow"` or `"task"` per Step 6; `waves` = the waves from Step 4;
   `title` = the human task title from the spec, so the dashboard shows "ISSUE-ID · title").
2. `workers/<id>.json` for each planned node: `{ id, name, archetype, repository, objective,
   dependsOn, status:"pending", currentStep:null, steps:[], startedAt:null,
   finishedAt:null, verdict:null }` (include the descriptive `name` from Step 4) — the whole
   graph shows up on the dashboard before anything runs.
3. **Move the task in the tracker** — trigger `work_started`: follow `agents/TASK-STATUS.md`
   (best-effort; skip if there's no task manager).

## Step 6 — Execute the graph

### Choose the engine
- **Engine B — Workflow (default).** If the `Workflow` tool is available in this environment,
  ALWAYS use it, for every complexity level. This is not a proposal to the user: running
  `/orchestrate` already is the opt-in.
- **Engine A — Task/Agent tool (fallback).** Only when the `Workflow` tool does not exist (e.g.
  another AI tool). Record `engine:"task"` in `state.json` and follow "Engine A" below.

If the workflow runtime warns that the graph exceeds its recommended size, tell the user they can
raise it in `/config` ("Dynamic workflow size") — never shrink the approved plan to fit.

### Engine B — run the `orchestrate-execute` workflow

1. **Compile the args** (JSON object — pass it as a real object, not a string):
   ```json
   {
     "issueId": "<ISSUE-ID>",
     "sessionDir": "<absolute path of .sessions/<ISSUE-ID>>",
     "commandsDir": "<absolute path of .claude/commands>",
     "stateHelper": "<absolute path of .claude/bin/worker-state.mjs>",
     "maxWorkers": <orchestration.parallelism.maxWorkers>,
     "maxFixRounds": 2,
     "effort": <orchestration.agentEffort, if set>,
     "model": <orchestration.agentModel, if set>,
     "repos": [{ "id": "<repo>", "worktree": "<absolute worktree path>", "testCommand": "<cmd>" }],
     "workers": [{
       "id": "W1", "name": "impl:service-a", "archetype": "implementer",
       "repository": "service-a", "dependsOn": [],
       "brief": "<the dense brief from Step 5>",
       "contract": { "<the compiled context contract from Step 5>": "..." }
     }, {
       "id": "W5", "name": "test:service-a", "archetype": "tester",
       "repository": null, "scope": ["service-a"], "dependsOn": ["W3"], "brief": "...", "contract": {}
     }]
   }
   ```
   `repos` lists only the impacted repos (the worktrees from Step 5b). **`scope`** (gates) = the
   repos a session-level gate covers — set it whenever a gate covers a subset (e.g. `test:front`,
   `review:design-system`): after a fix, only gates whose scope the fix touched re-run.
   Omitted → the gate covers every impacted repo. Omit `effort`/`model` unless the manifest sets
   them: by default judgment work inherits the session settings and only the tester is lowered.
2. **`SS status running execute`** and call the tool:
   `Workflow({ name: "orchestrate-execute", args: <the object above> })`.
   If the name does not resolve, use
   `Workflow({ scriptPath: "<absolute path of .claude/workflows/orchestrate-execute.js>", args })`.
   Record the returned `runId` in `state.json.runs[]` (`SS set '{"runs":[…]}'`). The workflow runs in the background —
   you are notified when it finishes; do not poll.
3. **What the workflow guarantees** (you do not re-implement any of it):
   - **DAG without barriers**: each worker starts as soon as ITS dependencies finish; a
     blocked worker skips only its dependents, independent branches keep going.
   - **Fix loops on every gate** (reviewer / tester / integrator): a failing verdict
     (`BLOCKED` / `RED` / `MISMATCH`) → corrective implementers per owning repo → the gate
     re-runs, up to `maxFixRounds`; then it stops as blocked.
   - **Adversarial verification** of reviewer blocking findings before anyone fixes them
     (refuted findings are dropped; a finding survives unless disproved with evidence).
   - **Scoped regression**: a gate that passed before a later fix touched a repo in its scope
     re-runs — limited to the fix changes and the touched repos' tests.
   - **Live graph** with the dynamic control from Step 4b.
   - **Instrumentation + reports on disk**: every agent writes its own `workers/<id>.json` (via
     the state helper) and its full report `workers/<id>.md` (extra agents get ids like `W4.v1`
     verify, `W4.fix1.<repo>` fix, `W4.r2` re-run, `W5.reg1` regression, `D1` spawned).
4. **Handle the result** — it is **compact on purpose** (`{ status, workers[], extraAgents[],
   acceptedSpawns[], fixRounds[], needsHuman[] }`, each worker with a ≤3-line summary); the full
   reports are the `workers/<id>.md` files. Open a report only when you need its detail (a
   blocker, a summary that doesn't explain itself) — never read them all into your context.
   - Reconcile each `workers/<id>.json` with the returned status/verdict (fix any file an agent
     left inconsistent).
   - `status: "done"` → `SS status done execute` → Step 6b.
   - `status: "blocked"` → **record every `needsHuman[]` item on disk, as returned** (they
     already have the contract shape `{ id, kind, reason, howToResolve, ref }`; extra fields are
     ignored by the helper):
     ```bash
     node .claude/bin/session-state.mjs .sessions/<ISSUE-ID> need-json - <<'JSON'
     <the workflow's needsHuman array>
     JSON
     ```
     (status becomes `blocked`, or `awaiting_approval` if every item is an approval). If the
     workflow returned `blocked` with an empty `needsHuman`, record one item per blocked worker
     (`<id>-blocked`, kind `decision`, reason = its summary, ref `workers/<id>.md`). Trigger
     `blocked` (TASK-STATUS). Then, by mode:
     - **interactive**: **STOP and show the user every item** (blocked workers + their
       `unresolved`, unverifiable findings, escalated spawn proposals). Never decide for them.
       When they decide → `SS resolve <ids>` and go to step 5.
     - **`--headless`**: do not ask — summarize the items and **end the command**. The decision
       comes back through `approval.json` (`notes` = the decision) + `/orchestrate <ID> --resume`.
5. **Resume after the user decides** (idempotent): `SS status running execute`, then call the
   workflow again with the same args plus `"completed": { "<id>": <returned result> }` for every
   worker that finished `done`, with the blocked workers' briefs updated per the user's decision
   (in `--resume`: the `notes` of `approval.json`), and any approved spawn proposal added as a new
   worker. Only pending/blocked work runs again. (After a `--resume`, rebuild `completed` from the
   `workers/<id>.json` files that are `done` and their `workers/<id>.md` reports.)
   If a run was **interrupted** (killed, crashed) and nothing changed, relaunch with
   `Workflow({ scriptPath, resumeFromRunId: "<runId>" })` — finished agents come back from cache.

### Engine A — Task/Agent tool (fallback only)

Execute the DAG respecting `dependsOn`. **On each transition, update the state files**:

1. **When a wave starts**: for each node in the wave, set `workers/<id>.json` to
   `status:"running"`, `startedAt`, and a short `currentStep`; `SS status running execute`.
   **On every step change** during execution, update `currentStep` AND append
   `{ step, at }` to the `steps[]` array (the dashboard shows this history as a pipeline).
2. **Parallel wave**: spawn all nodes in the wave **in a single message with multiple Task
   calls** so they run concurrently. Give each subagent ONLY its compiled contract +
   objective — never the whole conversation.
3. **On return**: set each `workers/<id>.json` to `status:"done"` (or `"blocked"`),
   `finishedAt`, and `verdict` if any (reviewer/tester/integrator).
4. **Gates**: if a gate fails, spawn a corrective implementer for the owning repo and re-run
   the gate (max 2 rounds), mirroring what Engine B does automatically.
5. **Next wave**: spawn nodes whose dependencies are now satisfied. Repeat until done.
6. **At the end**: `SS status done execute`; or, if any worker is blocked, one
   `SS need <id>-blocked decision "<why>" "<how to resolve>" workers/<id>.md` per blocked worker
   (`failure` when a gate still fails after the fix rounds) and handle it like Engine B step 4.

In both engines, the archetype templates in `agents/` (implementer, reviewer, integrator,
tester, …) are the system framing of each subagent, filled with the node's brief, repository,
and context contract. Each subagent is **ephemeral**: it does its bounded job, returns its
report, and its context is discarded. The Orchestrator only keeps the reports.

## Step 6b — Reconcile with the base (conflicts) before PR

While the agents worked, `origin/<mainBranch>` may have advanced. For each impacted repo,
check whether the worktree diverged from the base:

```bash
git -C "<worktree-path>" fetch origin "<mainBranch>" --quiet
git -C "<worktree-path>" rev-list --count "HEAD..origin/<mainBranch>"
```

- If the result is `0` (base didn't advance), **skip** — nothing to reconcile.
- If `> 0`, **spawn a `conflict-resolver` agent** (archetype in
  `agents/conflict-resolver.md`) for that repo. It rebases onto `origin/<mainBranch>`,
  resolves conflicts guided by the spec, runs the tests, and **STOPS for your approval**.
  Record its status under `workers/` like the others.
- `RESOLVED` → approval gate: `SS need conflict-<repo> approval "Conflicts with <mainBranch> resolved in <repo> — review the resolution" "<how to approve>" workers/<id>.md`.
  Interactive: show the resolution and ask (approved → `SS resolve conflict-<repo>`, continue).
  `--headless`: stop here (approval via `approval.json` + `--resume`).
- If it returns `NEEDS-HUMAN`, do **not** proceed to PR —
  `SS need conflict-<repo> decision "<the conflict that needs a decision>" "<how to resolve>" workers/<id>.md`;
  interactive: show the conflicts and ask; `--headless`: stop.

## Step 7 — Integrate and report

- Artifacts under `.sessions/<ISSUE-ID>/`: `execution-plan.md` (the DAG) and
  `workers/<agent-id>.md` (each agent's full report — in Engine B the agents write their own,
  including the workflow's extra agents; in Engine A you write them from each return).
- Summarize: what changed per repo, evidence, tests run, **fix rounds per gate** (what each
  gate caught and how it was fixed), findings refuted by verification, workers spawned live,
  unresolved questions, and any repo that was batched/deferred.
- If any gate or `conflict-resolver` is still blocked, do NOT proceed to PR —
  make sure it is in `needsHuman` (`SS show`), then surface the findings and ask the user how to
  proceed (`--headless`: end the command).
- Otherwise `SS status done execute` (nothing pending) — next step: `/pre-pr`.
- **Move the task in the tracker** (follow `agents/TASK-STATUS.md`):
  - trigger `blocked` if there are blocking findings;
  - trigger `done` when everything passed and the session is complete.

## Escalation

If any subagent hits a Jidoka stop (ambiguity, spec conflict, missing contract), it must
return `unresolved` instead of guessing. Bubble that up to the user rather than pushing
forward: record it with `SS need <id> decision|access|failure "<reason>" "<how to resolve>" <ref>`
(`access` for missing credentials/permissions/environment), then ask (interactive) or end the
command (`--headless`). In `--headless` **never** ask a question and never guess an answer.
