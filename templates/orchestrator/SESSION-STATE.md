# Session State Schema

The `/orchestrate` command writes machine-readable state into each session directory so
tools (like `context-agents dashboard`) can render live progress. Human-readable
`execution-plan.md` stays alongside.

```
.sessions/<ISSUE-ID>/
├── execution-plan.md      # human-readable (prose)
├── state.json             # session-level state
└── workers/
    ├── W1.json            # one file per agent/worker
    ├── W2.json
    └── ...
```

## `state.json`

```json
{
  "issueId": "ISSUE-42",
  "title": "Example feature",
  "complexity": "medium",
  "status": "running",
  "createdAt": "2026-09-13T12:10:00Z",
  "updatedAt": "2026-09-13T12:15:00Z",
  "repos": ["client-b"],
  "waves": [["W1", "W2"], ["W3"], ["W4"], ["W5"]]
}
```

- `status`: `planned` | `running` | `blocked` | `done`.
- `waves`: array of arrays of worker ids, in execution order.
- `engine` (optional): `workflow` (Engine B — the `orchestrate-execute` workflow) or `task`
  (Engine A fallback — Task-tool waves).
- `runs` (optional, Engine B): `[{ "runId": "wf_…", "startedAt": "…", "status": "…" }]`, one per
  workflow run of this session — the last `runId` is what `resumeFromRunId` uses.

**Single writer:** only the orchestrator (the `/orchestrate` main loop) writes `state.json`.

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

### Who writes `workers/<id>.json`
- **Engine B (workflow)**: the orchestrator writes every planned worker as `pending` before the
  run; from then on **each agent writes its own file** (running → steps → done/blocked) with the
  helper `.claude/bin/worker-state.mjs` (`start` / `step` / `finish`, atomic writes), plus its full
  report `workers/<id>.md`. The
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

## Update protocol (for `/orchestrate`)

1. Right after the graph is approved: write `state.json` (`status: "planned"`) and one
   `workers/<id>.json` per node (`status: "pending"`).
2. When a wave starts: set each of its workers to `running` + a short `currentStep`;
   set `state.json.status = "running"`.
3. When a worker returns: set `done` (or `blocked`), `finishedAt`, and `verdict` if any.
4. When all workers finish: set `state.json.status = "done"` (or `blocked` if any blocked).

Keep writes small and frequent — the dashboard polls these files.
