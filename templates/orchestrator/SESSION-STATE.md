# Session State Schema (contract v0.15)

The flow commands (`/orchestrate`, `/pre-pr`, `/pr`, `/merge`) write machine-readable state
into each session directory so any tool — `context-agents dashboard`, `context-agents status
--json`, CI, a script — can tell where a session is and **whether it is waiting on a human**,
without reading the conversation. Human-readable `execution-plan.md` stays alongside.

```
.sessions/<ISSUE-ID>/
├── execution-plan.md      # human-readable (prose)
├── state.json             # session-level state (status, phase, needsHuman, …)
├── events.jsonl           # append-only log of status/phase/needsHuman changes
├── approval.json          # written by whoever approves (human, CI, another tool) — optional
└── workers/
    ├── W1.json            # one file per agent/worker
    ├── W2.json
    └── ...
```

## `state.json`

```jsonc
{
  "issueId": "ISSUE-42",
  "title": "Example feature",
  "complexity": "medium",
  "status": "awaiting_approval",     // planned | awaiting_approval | running | blocked | done | pr_open | merged
  "phase": "plan",                   // refine | plan | execute | pre-pr | pr | merge
  "createdAt": "2026-09-13T12:10:00Z",
  "updatedAt": "2026-09-13T12:15:00Z",
  "needsHuman": [{
    "id": "plan-approval",           // stable while the item is pending (W3-blocked, conflict-<repo>, …)
    "kind": "approval",              // approval | decision | access | failure
    "reason": "Plan ready for approval",
    "since": "2026-09-13T12:15:00Z",
    "howToResolve": "Write .sessions/ISSUE-42/approval.json and run /orchestrate ISSUE-42 --resume",
    "ref": "execution-plan.md"       // session file with the detail (relative to the session dir)
  }],
  "repos": ["client-b"],
  "waves": [["W1", "W2"], ["W3"], ["W4"], ["W5"]]
}
```

- `status` (normalized):
  | status | meaning |
  |---|---|
  | `planned` | session exists, nothing executing yet |
  | `awaiting_approval` | stopped at an approval gate (plan, conflict resolution, merge confirmation) |
  | `running` | agents are working (execute, or a fix loop reopened by `/pre-pr`, `/pr`, `/merge`) |
  | `blocked` | stopped on a decision, missing access or a failure only a human can unblock |
  | `done` | the current phase finished with nothing pending (or the plan was rejected — `rejected: true`) |
  | `pr_open` | pull/merge requests are open |
  | `merged` | the feature was merged |
- `phase`: `refine` → `plan` → `execute` → `pre-pr` → `pr` → `merge` (where the session is in the flow).
- `needsHuman[]`: **everything that waits on a person goes here** — the plan waiting for approval,
  blocked workers, escalated spawn proposals, `NEEDS-HUMAN` conflicts, the merge confirmation. Empty
  array when nothing is pending. `kind`: `approval` (say yes/no), `decision` (choose/answer),
  `access` (credentials, permissions, environment), `failure` (something broke and the automatic
  fix loops gave up). Any non-approval item ⇒ `status: "blocked"`; only approvals ⇒
  `"awaiting_approval"`.
- `updatedAt`: refreshed on every write.
- `rejected` / `notes` (optional): set when an approval was refused (`status: "done"`).
- `approval` (optional): the last approval consumed (`{ approved, by, at, notes }`).
- `waves`: array of arrays of worker ids, in execution order.
- `engine` (optional): `workflow` (Engine B — the `orchestrate-execute` workflow) or `task`
  (Engine A fallback — Task-tool waves).
- `runs` (optional, Engine B): `[{ "runId": "wf_…", "startedAt": "…", "status": "…" }]`, one per
  workflow run of this session — the last `runId` is what `resumeFromRunId` uses.

**Single writer:** only the orchestrator (the `/orchestrate` main loop, and `/pre-pr` / `/pr` /
`/merge` when they run) writes `state.json` — through the helper below. Workers never write it.

## `events.jsonl` — append-only

One JSON object per line, appended on every change (never rewritten):

```jsonc
{"at":"2026-09-13T12:15:00Z","type":"status","status":"awaiting_approval","phase":"plan"}
{"at":"2026-09-13T12:15:00Z","type":"needs_human","item":{"id":"plan-approval","kind":"approval","reason":"…","since":"…","howToResolve":"…","ref":"execution-plan.md"}}
{"at":"2026-09-13T12:30:00Z","type":"resolved","id":"plan-approval"}
```

- `status`: the status and/or the phase changed (both are always present).
- `needs_human`: an item was added (or its kind/reason changed).
- `resolved`: an item left `needsHuman`.

Tail it to react to changes (notifications, CI) instead of polling `state.json`.

## `approval.json` — approval outside the conversation

Written by whoever approves — a person, CI, another tool:

```json
{ "approved": true, "by": "Jane", "at": "2026-09-13T12:30:00Z", "notes": "ok — keep the old endpoint for one release" }
```

`/orchestrate <ID> --resume` (and `/merge <ID> --resume`) consume it for the pending items:
- `approved: true` → the pending items are resolved (`resolved` events) and the flow continues;
  `notes` carries the human's decision/instructions for blocked items.
- `approved: false` → `status: "done"`, `rejected: true`, `notes` copied to `state.json`; nothing runs.
- missing, invalid, or **older than the pending items** (`at`, else the file mtime) → nothing happens;
  the command says so and stops. A stale approval never answers a newer question.

## Non-interactive runs

`--plan-only`, `--resume` and `--headless` make the flow drivable without a conversation:

```bash
# in the orchestrator directory
claude -p "/orchestrate ISSUE-42 --plan-only --headless"   # plan, record plan-approval, stop
echo '{"approved":true,"by":"ci","at":"2026-09-13T12:30:00Z","notes":"ok"}' > .sessions/ISSUE-42/approval.json
claude -p "/orchestrate ISSUE-42 --resume --headless"      # execute; any gate → needsHuman + stop
claude -p "/pre-pr ISSUE-42 --headless"
```

With `--headless` no gate asks a question: every human gate records a `needsHuman` item, sets the
status and ends the command. Without flags the interactive behavior is unchanged (gates ask in the
conversation) — and the pending gate is still recorded in `state.json` while it waits.

## The helper — `.claude/bin/session-state.mjs`

Commands never hand-write `state.json` / `events.jsonl`; they call the helper, which validates the
vocabulary, keeps `since` stable per id, refreshes `updatedAt`, writes atomically and appends the
events:

```bash
S=".claude/bin/session-state.mjs"; D=".sessions/<ISSUE-ID>"
node $S $D set '{"issueId":"<ISSUE-ID>","title":"…","complexity":"medium","engine":"workflow"}'
node $S $D status running execute                 # status [phase]
node $S $D phase pre-pr
node $S $D need plan-approval approval "Plan ready for approval" "Write approval.json, run /orchestrate <ID> --resume" execution-plan.md
node $S $D need-json - <<'JSON'                   # items as returned by the workflow (array or object)
[{"id":"W3-blocked","kind":"decision","reason":"…","howToResolve":"…","ref":"workers/W3.md"}]
JSON
node $S $D resolve plan-approval                  # or: resolve --all
node $S $D approval                               # read-only: approved | rejected | missing | stale | invalid
node $S $D apply-approval                         # consume approval.json (see above)
node $S $D show
```

`need` / `need-json` also move `status` (`blocked` / `awaiting_approval`). After `resolve`, set the
next status yourself (e.g. `status running execute`). If the helper is missing (orchestrator not
updated), edit `state.json` by hand with the same fields and append the event lines.

## Inference for older sessions

Sessions created before this contract (no `phase`, or a non-normalized `status` such as
`in_review` / `executable-complete`) stay valid: `context-agents status --json` and the dashboard
infer them (`legacy: true`):
- **phase** by evidence: merge evidence (`status: merged`, `merged`/`mergedAt`/`merge` in
  state.json) → `merge` · PR evidence (`pr.md`, `prs`/`pullRequests`/`prNumber`, `in_review`) → `pr` ·
  `pre-pr-report.md` → `pre-pr` · workers running/finished → `execute` · `execution-plan.md` without
  started workers → `plan` · otherwise (`prd.md` / `refined.md`) → `refine`.
- **status**: merged → `merged` · a worker `blocked` → `blocked` · a worker `running` → `running` ·
  `in_review` → `pr_open` · `executable-complete` → `done` (`done` with PR evidence → `pr_open`).
- **needsHuman**: one item per blocked worker (`id: <Wid>-blocked`, `kind: decision`,
  `reason`: the worker's `blockedReason` / `currentStep`).

## Machine-readable listing

```bash
context-agents status --json [--project <dir>]…   # default: this orchestrator, else every dashboard project
```
→ `[{ project, issueId, title, status, phase, needsHuman, updatedAt, path, legacy }]`

## `workers/<id>.json`

```json
{
  "id": "W1",
  "name": "impl:client-b-api",
  "archetype": "implementer",
  "repository": "client-b",
  "objective": "Audio pipeline: mic+tab capture, FFT bands/RMS/onset",
  "dependsOn": [],
  "status": "running",
  "currentStep": "implementing FFT analyser",
  "steps": [
    { "step": "reading spec", "at": "2026-09-13T12:11:00Z" },
    { "step": "scaffolding controller", "at": "2026-09-13T12:12:10Z" },
    { "step": "implementing FFT analyser", "at": "2026-09-13T12:13:40Z" }
  ],
  "startedAt": "2026-09-13T12:11:00Z",
  "finishedAt": null,
  "verdict": null
}
```

- `id`: short stable id (`W1`). `name`: human-friendly **role+target**, e.g.
  `impl:client-b-api`, `review:security`, `integrate:api↔ui`, `test:client-b`. The
  dashboard shows `name` and falls back to `id`.
- `status`: `pending` | `running` | `done` | `blocked`.
- `currentStep`: the step happening now. **`steps[]`**: append each step (with `at`
  timestamp) as it happens — this is the pipeline history the dashboard shows in the
  step modal. `currentStep` should equal the last entry of `steps`.
- `verdict` (optional): for reviewer/tester/integrator, e.g. `PASS` | `BLOCKED` |
  `GREEN` | `RED` | `CONSISTENT` | `MISMATCH`.
- `blockedReason` (optional): one line on why the worker is blocked.

### Who writes `workers/<id>.json`
- **Engine B (workflow)**: the orchestrator writes every planned worker as `pending` before the
  run; from then on **each agent writes its own file** (running → steps → done/blocked) with the
  helper `.claude/bin/worker-state.mjs` (`start` / `step` / `finish`, atomic writes; `finish blocked
  [VERDICT] "<reason>"` records `blockedReason`), plus its full report `workers/<id>.md`. The
  workflow also creates extra agents, each with its own file:
  | id pattern | what it is |
  |---|---|
  | `W4.v1` | adversarial verifier of W4's blocking findings (round 1) |
  | `W4.fix1.<repo>` | corrective implementer for W4's findings in `<repo>` (round 1) |
  | `W4.r2` | W4 re-run after the fixes (round 2) |
  | `W5.reg1` | regression re-run of W5 (a later fix changed code W5 had already validated) |
  | `D1`, `D2`… | workers spawned live (proposed by a worker, inside the approved pattern) |
  After the run, the orchestrator reconciles the files with the workflow's result.
- **Engine A (task)**: the orchestrator writes all files, following the protocol below.

## Update protocol

| Moment | `status` · `phase` | needsHuman |
|---|---|---|
| `/orchestrate` starts | `planned` · `plan` | — |
| plan ready, waiting for approval | `awaiting_approval` · `plan` | `plan-approval` (approval) |
| approved (chat or `approval.json`) → execution | `running` · `execute` | resolve `plan-approval` |
| workflow ends blocked | `blocked` / `awaiting_approval` · `execute` | the workflow's `needsHuman[]` as-is |
| conflict-resolver `RESOLVED` / `NEEDS-HUMAN` | `awaiting_approval` / `blocked` · `execute` | `conflict-<repo>` |
| execution complete | `done` · `execute` | — |
| `/pre-pr` validating / fixing | `running` · `pre-pr` | failures it cannot fix |
| `/pre-pr` passed | `done` · `pre-pr` | — |
| `/pr` opened the PRs | `pr_open` · `pr` | — |
| `/merge` waiting for confirmation | `awaiting_approval` · `merge` | `merge-confirmation` (approval) |
| merged | `merged` · `merge` | — |

Workers (Engine A: the orchestrator on their behalf):
1. Right after the graph is approved: one `workers/<id>.json` per node (`status: "pending"`).
2. When a wave starts: set each of its workers to `running` + a short `currentStep`.
3. When a worker returns: set `done` (or `blocked`), `finishedAt`, and `verdict` if any.

Keep writes small and frequent — the dashboard polls these files.
