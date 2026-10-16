# Context-First Agents CLI

> Evolution of [context-first-cli](https://www.npmjs.com/package/context-first-cli): the
> same project-agnostic methodology management **plus** dynamic, ephemeral AI-agent
> orchestration derived from your specs.

The Node CLI only **scaffolds and manages** (orchestrator, repos, config, worktrees-ready
sessions). All agent **orchestration intelligence lives in `.md` command templates** that
your AI tool runs — never in Node. This keeps the whole flow inside your existing
command-driven workflow.

```
spec → complexity → execution DAG → context contract per node → ephemeral agents
```

---

## What is this for?

You have a **multi-repository product** (say a backend, a web client, a mobile app, a
shared UI library, a specs repo) and you drive development with an **AI coding tool**
through slash commands.

The problem: doing a feature that touches several repos with **one AI agent** means
stuffing every repo, every spec, and the whole plan into **one giant context**. It
saturates, loses the thread, and there's no parallelism — you babysit it phase by phase.

This tool fixes that by moving one level up. You write an approved spec; the AI runs
`/orchestrate`, which:

1. **reads your `context-manifest.json`** to know your repos,
2. **figures out how big the task is** (which repos it touches, whether it's risky),
3. **builds the minimum graph of ephemeral agents** — e.g. one implementer per impacted
   repo (in parallel), then an integrator, then a tester, plus an adversarial reviewer
   when the task is risky,
4. **gives each agent a tiny, bounded "context contract"** (only the files it may read,
   only the repo it may write) and spawns them as subagents,
5. **collects their reports** and summarizes what changed.

Each agent is **ephemeral**: it does one bounded job with a clean, small context, returns
a structured report, and is discarded. The orchestrator stays light — it coordinates, it
doesn't implement. That's what keeps large, multi-repo work from collapsing under its own
context.

**Who it's for:** teams using an AI tool (Claude Code, Cursor, etc.) across several repos
who want spec-driven, parallel, context-isolated feature development — without hand-wiring
which agent runs when.

---

## What's new vs. context-first-cli

| | context-first-cli | context-first-agents-cli |
|---|---|---|
| Work decomposition | you pick which command to run, in a fixed pipeline | `/orchestrate` derives the **minimum agent graph** from the spec |
| Agents | one serial agent over one big shared context | **N ephemeral agents**, one per responsibility/repo, each with an isolated context |
| Parallelism | none (sequential phases) | implementers per repo run in parallel, joined by `dependsOn` |
| Context | everything in one bucket | **context contract per agent** (`select-do-not-dump`, `mustNotAssume`) |
| Risk review | you remember to trigger it | `riskSignals` auto-trigger an adversarial reviewer |

It stays **100% project-agnostic**: the core knows nothing about your stack or domain.
Everything specific lives in `context-manifest.json`.

---

## Install

```bash
npm install -g @thatix.io/context-first-agents-cli
# binaries: context-agents  (alias: cfa)
```

## Concepts (30 seconds)

- **Orchestrator** — a small control repo (the folder you run the CLI in). Holds
  `context-manifest.json` and the installed `.md` commands. It is the single source of
  truth for your dev process.
- **Repositories** — your actual code repos, listed in the manifest, sitting next to the
  orchestrator (`../service-a`, `../client-b`, …).
- **Metaspecs** — the repo holding your normative specs (the `role: metaspecs` entry).
- **Session** — one feature/issue. Lives in `.sessions/<ISSUE-ID>/` with the plan and each
  agent's report.
- **Ephemeral agent** — a subagent compiled on the fly from
  `archetype + objective + repository + context contract`, run once, then discarded.

## Quick start

```bash
# 1. Create an orchestrator (or run `init` inside an existing one)
context-agents create:orchestrator my-orchestrator
cd my-orchestrator

# 2. Register your repositories (with hints so the orchestrator can route)
context-agents add:repo

# 3. Validate the setup
context-agents doctor

# 4. In your AI tool, run the orchestration command:
/orchestrate <ISSUE-ID or path/to/spec.md>
```

## The development flow after install

Setup happens **once**; then it's the same short loop per feature.

**One-time setup (Node CLI):**

1. `create:orchestrator my-orchestrator` (or `cd` into an existing orchestrator and run
   `init`).
2. Edit `ai.properties.md` → set `base_path` to where your repos live.
3. `add:repo` for each repository. Give each one **`hints`** (keywords that mean "this repo
   is impacted"), an optional **`context`** list (files an agent here may read), and a
   **`testCommand`**.
4. Fill `orchestration.riskSignals` (keywords like `migration`, `payment`, `auth`) and
   `orchestration.indexes` (your spec index files).
5. `doctor` until it's all green.

**Per feature (in your AI tool) — the full command flow:**

```
/warm-up → /collect → /refine → /spec → /orchestrate
   load       gather      shape     approve    derive agent graph
  context      idea       scope      the spec    + execute
```

1. **`/warm-up`** — load project context (manifest, specs, conventions).
2. **`/collect`** → **`/refine`** → **`/spec`** — turn an idea into an **approved,
   normative spec** (PRD). These are the "product" commands.
3. **`/orchestrate <ISSUE-ID or path/to/spec.md>`** — the new engine. It will:
   - classify complexity and **show you the agent graph**,
   - wait for your **approval**,
   - spawn the ephemeral agents wave by wave (implementers in parallel, then
     integrator/tester, plus a reviewer if risky),
   - write everything to `.sessions/<ISSUE-ID>/` and summarize the result.
4. Review the summary. If the reviewer flagged blockers, fix and re-run the affected part.
5. Ship it: **`/pre-pr`** (validate) → **`/pr`** (open PRs) → **`/merge`** (update base,
   resolve conflicts with agents, confirm, and merge into main).

The classic **`/start` → `/plan` → `/work`** commands are still installed as **manual
escape hatches** — for most tasks `/orchestrate` replaces that whole sequence. Quality
commands `/observe` and `/metrics` are also included.

## Commands (Node — scaffold/management only)

| Command | Purpose |
|---|---|
| `create:orchestrator [name]` | New orchestrator (manifest + full `.md` command flow) |
| `init` | Install/refresh the full command flow in an existing orchestrator |
| `add:repo` | Add a repo to the manifest (id, role, **hints**, context, testCommand) |
| `update:commands` | Overwrite the command templates (project-specific ones such as `test-env` are kept) |
| `doctor` | Validate manifest, hints, indexes, and installed flow commands |
| `status [--json] [--project <dir>]… [--all]` | Sessions with normalized status / phase / "waiting on you" (`--json` for scripts and CI) |
| `dashboard` | Serve a local web dashboard of sessions and running agents |

`--lang en|es|pt-BR` selects the language of the installed `.md` commands.

**Installed `.md` commands** (into `.claude/commands/`): `warm-up`,
`products/{collect,refine,spec,check}`, **`orchestrate`** (+ `agents/`),
`engineer/{start,plan,work,pre-pr,pr,merge}` (escape hatches + ship), `engineer/test-env` (a generic
starting point, installed only if the project has no `test-env` and never overwritten),
`quality/{observe,metrics}`, and the shared protocols `agents/{TASK-STATUS,HEADLESS}.md`.
Plus the workflow engine: `.claude/workflows/orchestrate-execute.js`, `.claude/bin/worker-state.mjs`
(per-worker state) and `.claude/bin/session-state.mjs` (session state + event log).

## Dashboard

`/orchestrate` writes machine-readable state per session (`state.json` +
`workers/<id>.json`, format in `SESSION-STATE.md`). Serve a live view of it:

```bash
context-agents dashboard          # → http://localhost:4517
```

The dashboard lists every session (issue), its complexity, the agent graph by wave, and
each agent's status (`pending → running → done/blocked`) with its current step and
verdict — auto-refreshing every 2s. Sessions created before state-writing still render via
an `execution-plan.md` fallback (shown without live status).

Since 0.15 every session also shows its normalized **status** and **phase**, and sessions that
need a person (`awaiting_approval` or a non-empty `needsHuman`) are flagged **⚑ waiting on you**
with the reason and how to resolve it — on the board (sorted first), on the project cards and on
the map. `/api/map` and `/api/projects` expose `phase`, `needsHuman` and a `waiting` count.

## Machine-readable session state (0.15)

Every flow command keeps `.sessions/<ISSUE-ID>/state.json` in a documented contract
(`templates/orchestrator/SESSION-STATE.md`), so the dashboard, CI or any other tool can follow a
session without reading the conversation:

| field | values |
|---|---|
| `status` | `planned · awaiting_approval · running · blocked · done · pr_open · merged` |
| `phase` | `refine · plan · execute · pre-pr · pr · merge` |
| `needsHuman[]` | `{ id, kind: approval\|decision\|access\|failure, reason, since, howToResolve, ref }` |
| `updatedAt` | ISO timestamp of the last change |

- **Everything that waits on a person goes to disk**: the plan waiting for approval
  (`plan-approval`), blocked workers (`W3-blocked`), escalated spawn proposals, `NEEDS-HUMAN`
  conflicts (`conflict-<repo>`), the merge confirmation (`merge-confirmation`). The workflow
  engine returns its `needsHuman[]` already in this shape.
- **`events.jsonl`** — append-only, one line per change:
  `{"type":"status",…}`, `{"type":"needs_human","item":{…}}`, `{"type":"resolved","id":…}`.
- **One writer, no hand-written JSON**: commands call `.claude/bin/session-state.mjs`
  (`set`, `status`, `phase`, `need`, `need-json`, `resolve`, `approval`, `apply-approval`, `show`),
  which validates the vocabulary, writes atomically and appends the events.

### Approval outside the conversation and non-interactive runs

```bash
# in the orchestrator directory
claude -p "/orchestrate ISSUE-42 --plan-only --headless"   # plan → awaiting_approval + plan-approval, stop

# approve (a person, CI, any tool) — must be written after the pending item
echo '{"approved":true,"by":"jane","at":"2026-10-15T20:30:00Z","notes":"ok"}' \
  > .sessions/ISSUE-42/approval.json

claude -p "/orchestrate ISSUE-42 --resume --headless"      # execute; any gate → needsHuman + stop
claude -p "/pre-pr ISSUE-42 --headless"
```

- `--plan-only`: plan, record `awaiting_approval` + `plan-approval`, stop.
- `--resume`: read `approval.json` (`{ approved, by, at, notes }`): `approved: true` → continue from
  the pending gate (`resolved` events; `notes` is the human decision for blocked items);
  `false` → `status: done`, `rejected: true`, `notes` saved; missing/stale → nothing happens.
- `--headless`: no gate asks — each one records `needsHuman`, sets the status and ends the command.
  Also accepted by `/pre-pr`, `/pr` and `/merge` (`/merge` also takes `--resume` for the merge
  confirmation).
- Without flags the interactive flow is unchanged (the gate is still recorded while it asks).

### `status --json`

```bash
context-agents status --json                     # this orchestrator; outside one: every dashboard project
context-agents status --json --project ../a-orchestrator --project ../b-orchestrator
context-agents status --json --all               # every project in ~/.context-agents/dashboard.json
```

```jsonc
[{ "project": "example", "issueId": "ISSUE-42", "title": "Add discountRate", "status": "awaiting_approval",
   "phase": "plan", "needsHuman": [{ "id": "plan-approval", "kind": "approval", "reason": "Plan ready for approval",
   "since": "…", "howToResolve": "…", "ref": "execution-plan.md" }], "updatedAt": "…",
   "path": "/abs/.sessions/ISSUE-42", "legacy": false }]
```

**Older sessions stay valid.** Sessions written before 0.15 are inferred from their files
(`legacy: true`): phase by evidence (merge evidence → `merge`, `pr.md`/PR fields → `pr`,
`pre-pr-report.md` → `pre-pr`, workers started → `execute`, `execution-plan.md` → `plan`, else
`refine`); status from the workers and the old values (`in_review` → `pr_open`,
`executable-complete` → `done`, …); one `needsHuman` `decision` per blocked worker. Orchestrators
generated by 0.14 keep working; run `context-agents update:commands` in each one to get the new
command templates and helper.

## Headless product commands and result files (0.16)

Every step of the flow can now run without a conversation — and report how it ended in a file
any tool can read. Shared protocol: `.claude/commands/agents/HEADLESS.md`.

**`--headless` also in `/collect`, `/refine`, `/spec` and `/test-env`.** No question is asked:
each one becomes a `needsHuman` item of `kind: decision` whose `howToResolve` carries the
**concrete options** (`(a) … (b) …`) and how to answer, with the detail in a session file
(`refine-questions.md`, `spec-questions.md`). The command ends. To answer, write
`approval.json` (`approved: true`, the choices in `notes`) and re-run the same command — it
consumes the answer first. Without the flag nothing changes: the questions are asked in the
conversation, as before.

| command | `--headless` behavior | ends as |
|---|---|---|
| `/collect "<idea>"` | creates the issue (no approval round), opens `.sessions/<ID>/` | `planned · refine` |
| | not enough to create an issue → creates nothing | no session, `collect-input` decision |
| `/refine <ID>` | open questions / metaspec conflict / split → `refine-*` decisions | `blocked · refine` |
| | nothing open → writes `refined.md`, records `refine-approval` | `awaiting_approval · refine` |
| `/spec <ID>` | open questions → `spec-*` decisions; PRD ready → `prd.md` + `spec-approval` | `blocked` / `awaiting_approval · refine` |
| `/test-env <ID>` | ambiguous recipe, busy port, missing secret, failed start → `testenv-*` | `blocked` (phase unchanged) |

After an approved `refine-approval` / `spec-approval`, the re-run finalizes (task manager updated,
`done · refine`).

**`--result <file>` in every command that takes `--headless`** (`/orchestrate`, `/pre-pr`, `/pr`,
`/merge` and the four above). Whatever happens — success, a gate, a failure — the last action
writes:

```json
{ "command": "products:collect", "issueId": "ISSUE-43", "status": "planned", "phase": "refine",
  "needsHuman": [], "at": "2026-10-16T12:00:00Z" }
```

`issueId` is the issue `/collect` created (`null` when it could not create one, together with
`phase: null` and the `collect-input` item). The file is written by the helper — the model never
assembles the JSON:

```bash
node .claude/bin/session-state.mjs .sessions/ISSUE-42 result out/refine.json products:refine
node .claude/bin/session-state.mjs result out/collect.json products:collect \
  --need collect-input decision "Too vague to create an issue" "(a) … (b) … — re-run /collect with …"
```

```bash
# in the orchestrator directory
claude -p "/collect \"Export orders as CSV\" --headless --result out/collect.json"
claude -p "/refine ISSUE-43 --headless --result out/refine.json"
claude -p "/spec ISSUE-43 --headless --result out/spec.json"
claude -p "/orchestrate ISSUE-43 --plan-only --headless --result out/plan.json"
```

**`/test-env` is project-specific.** The installed `engineer/test-env.md` is a generic starting
point (find the project's recipe, per-session ports, health check, `down`); adapt it to your stack.
`init` / `update:commands` install it only when the project has no `test-env.md` anywhere in
`.claude/commands/`, and never overwrite it. A custom command (any name) becomes headless by adding
a "Mode" section that follows `agents/HEADLESS.md` and mentions `--headless` / `--result <file>`.

**Compatibility.** The 0.15 contract is unchanged (same statuses, phases, kinds and events);
`result` is a new, read-only helper command; older sessions and 0.15 orchestrators keep working —
run `context-agents update:commands` to get the new templates.

## The `.md` orchestration layer (the engine)

Installed into `.claude/commands/`:

- **`orchestrate.md`** — classifies complexity, has a planner write the plan, compiles a
  context contract per node, and hands the approved graph to the execution engine (below).
- **`agents/CONTEXT-CONTRACT.md`** — the exact contract shape and the required return format.
- **`agents/{implementer,reviewer,integrator,tester}.md`** — behavioral archetypes
  (not domain agents). A concrete worker is compiled as
  `archetype + objective + repository + context contract + tools`.

## Execution engine — deterministic multi-agent workflow

Once you approve the plan, `/orchestrate` does **not** drive the agents turn by turn. It runs
the bundled workflow script **`.claude/workflows/orchestrate-execute.js`** through Claude Code's
`Workflow` tool (invoking `/orchestrate` is the opt-in). The orchestration logic is code, so it
doesn't depend on the model remembering it:

- **DAG without barriers**: each worker starts as soon as *its* dependencies finish; a blocked
  worker skips only its dependents.
- **Fix loops on every gate**: reviewer `BLOCKED` / tester `RED` / integrator `MISMATCH` →
  corrective implementer per owning repo → the gate re-runs (up to `maxFixRounds`, default 2).
- **Adversarial verification**: reviewer blocking findings are challenged by a verifier before
  anyone fixes them; only findings that survive are fixed.
- **Regression pass**: a gate that passed before a later fix changed the code runs again.
- **Live graph**: workers propose new workers; in-scope/no-new-risk proposals run automatically,
  the rest come back to you.
- **Human in the loop at the edges**: plan approval before, blockers after — the workflow never
  guesses; it ends with `needsHuman[]` and `/orchestrate` resumes only the pending work.

Each agent writes its own `workers/<id>.json` (via the tiny `.claude/bin/worker-state.mjs` helper),
so the dashboard shows the fix/verify/re-run agents appearing live.

**Token economy without cutting quality:** regressions re-check only the repos a fix touched
(gates declare a `scope`); test output stays out of context (summary + failures only, full log on
disk); each agent writes its full report to `workers/<id>.md` and returns a ≤3-line summary, so
the orchestrator's context stays small; the tester runs at lower reasoning effort while judgment
work (implementers, reviewers, verifiers) keeps the session's — overridable via
`orchestration.agentEffort` / `agentModel`.

**Why a fallback exists.** `Workflow` is a tool of the Claude Code harness (the runtime that
executes the script, spawns the subagents, caps concurrency and keeps the resume journal) — not
a model feature or an open standard. In other AI tools the `.md` falls back to **Engine A**:
Task-tool subagents spawned wave by wave, with the same contracts and a best-effort fix loop.

## `context-manifest.json`

The single source of project truth (backwards-compatible with context-first-cli, with
additive fields). See `templates/orchestrator/context-manifest.example.json`.

```jsonc
{
  "repositories": [
    {
      "id": "service-a",
      "role": "service",
      "hints": ["api", "backend"],          // ← how the orchestrator knows a task hits this repo
      "context": ["../metaspecs/specs/api.md"], // ← what an agent here may read
      "testCommand": "npm test"
    }
  ],
  "orchestration": {
    "riskSignals": ["migration", "payment", "security"], // ← trigger adversarial review
    "indexes": ["../metaspecs/specs/index.md"],
    "contextPolicy": "select-do-not-dump",
    "parallelism": { "maxWorkers": 8, "maxPerRepository": 2 }
  }
}
```

## How complexity routing works

`/orchestrate` counts, against the spec text:
- **repoHits** — repos whose `id`/`hints` appear
- **risks** — `riskSignals` that appear

→ `simple` (1 repo: implementer + reviewer) · `medium` (impl per repo → integrator →
tester) · `complex` (medium + adversarial reviewer). A spec may force it via
`complexity:` frontmatter. Small tasks stay small by design.

---

## End-to-end example

Assume this manifest (two code repos + a specs repo):

```jsonc
{
  "project": "example",
  "repositories": [
    { "id": "metaspecs", "role": "metaspecs", "hints": ["spec", "adr"] },
    { "id": "service-a", "role": "service", "hints": ["api", "backend"],
      "context": ["../metaspecs/specs/api.md"], "testCommand": "npm test" },
    { "id": "client-b", "role": "application", "hints": ["ui", "client"],
      "context": ["../metaspecs/specs/design.md"], "testCommand": "npm test" }
  ],
  "orchestration": {
    "riskSignals": ["migration", "payment", "security"],
    "indexes": ["../metaspecs/specs/index.md"],
    "parallelism": { "maxWorkers": 8, "maxPerRepository": 2 }
  }
}
```

### 1. Write a spec — `.sessions/ISSUE-42/spec.md`

```markdown
---
id: ISSUE-42
---
# Add a `discountRate` field to the order

Expose `discountRate` in the **service-a** order API and show it on the
order screen in the **client-b** UI.
```

### 2. Run the command

```
/orchestrate .sessions/ISSUE-42/spec.md
```

### 3. What the orchestrator does

**Classification** — the spec text mentions `service-a`/`api` and `client-b`/`ui` →
**repoHits = 2**, no risk signals → **medium**.

**Proposed graph (shown for approval):**

| id | archetype | repository | dependsOn |
|----|-----------|------------|-----------|
| W1 | implementer | service-a | — |
| W2 | implementer | client-b | — |
| W3 | integrator | (session) | W1, W2 |
| W4 | tester | (session) | W3 |

**Execution** — after you approve:

- **Wave 1 (parallel):** W1 and W2 are spawned as subagents in one shot. Each gets ONLY
  its context contract — e.g. W1 may read `../metaspecs/specs/index.md` +
  `../metaspecs/specs/api.md`, may write only in `service-a`'s worktree, and is told not
  to assume anything outside the spec.
- **Wave 2:** W3 (integrator) checks that the API field W1 added matches what W2 consumes
  (name, type, nullability).
- **Wave 3:** W4 (tester) runs `npm test` in each impacted repo and maps the acceptance
  criterion ("field visible on the order screen") to a check.

**Result** — written to `.sessions/ISSUE-42/`:

```
.sessions/ISSUE-42/
├── spec.md
├── execution-plan.md         # the DAG above
└── workers/
    ├── agent-w1.md           # contract + report (service-a)
    ├── agent-w2.md           # contract + report (client-b)
    ├── agent-w3.md           # integration findings
    └── agent-w4.md           # test results
```

Each report follows a fixed shape: `summary / changes / evidence / tests / unresolved /
confidence`.

### If the task were risky

Change the spec to *"…behind a **payment** flow with a DB **migration**"*. Now
**risks = 2** → **complex**, and the graph gains a **W5 reviewer** (dependsOn integrator)
that adversarially checks business rules, security, and the migration's reversibility
before you ship. You didn't have to remember to add it — the `riskSignals` did.

---

## Changelog

### 0.16.0
- `--headless` in `/collect`, `/refine`, `/spec` and `/test-env`: questions become `needsHuman`
  `decision` items (options in `howToResolve`) and the command ends; answers through `approval.json`
  + re-run. `/refine` and `/spec` record `refine-approval` / `spec-approval` for the artifact review.
- `/collect --headless` creates the issue and opens `.sessions/<ID>/` (`planned · refine`); without
  enough information it creates nothing and reports a `collect-input` decision.
- `--result <file>` in every headless-capable command (`/orchestrate`, `/pre-pr`, `/pr`, `/merge`
  + the four above): `{ command, issueId, status, phase, needsHuman, at }`.
- Helper: `session-state.mjs <sessionDir> result <file> <command>` and the sessionless
  `session-state.mjs result <file> <command> [--need …]`.
- New shared protocol `agents/HEADLESS.md`; new generic `engineer/test-env.md`, installed only when the
  project has none and never overwritten by `update:commands`.
- Tests for the `result` command, the command contract in the 3 languages and the install rule.

### 0.15.0
- Machine-readable session contract: normalized `status` / `phase` / `needsHuman[]` / `updatedAt` in
  `state.json`, append-only `events.jsonl` (`SESSION-STATE.md`).
- New helper `.claude/bin/session-state.mjs`; `worker-state.mjs finish blocked [VERDICT] "<reason>"`.
- `/orchestrate --plan-only | --resume | --headless`, approval through `approval.json`;
  `--headless` also for `/pre-pr`, `/pr`, `/merge` (+ `/merge --resume`).
- Workflow engine returns `needsHuman[]` in the contract shape (`id`, `kind`, `reason`, `howToResolve`, `ref`).
- `status --json [--project <dir>]… [--all]`, with inference for older sessions.
- Dashboard: "waiting on you" (reason + how to resolve), phase and new status pills.
- `npm test` (node:test) covering inference, helpers, workflow items, `status --json`, dashboard API.

## Design rules

- **No catalog of domain agents.** Expertise comes from selected context, not personas.
- **Select, don't dump.** Each agent's context is bounded and auditable.
- **Specs are normative.** Agents may read them; they must never modify them.

## License

MIT
