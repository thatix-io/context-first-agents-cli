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

## Update protocol (for `/orchestrate`)

1. Right after the graph is approved: write `state.json` (`status: "planned"`) and one
   `workers/<id>.json` per node (`status: "pending"`).
2. When a wave starts: set each of its workers to `running` + a short `currentStep`;
   set `state.json.status = "running"`.
3. When a worker returns: set `done` (or `blocked`), `finishedAt`, and `verdict` if any.
4. When all workers finish: set `state.json.status = "done"` (or `blocked` if any blocked).

Keep writes small and frequent — the dashboard polls these files.
