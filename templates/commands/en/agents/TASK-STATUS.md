# Task status sync (shared helper)

How commands move the issue in the task manager as the flow progresses. Read this whenever
a command reaches a **trigger** below.

## Steps

1. Read `ai.properties.md`. If `task_management_system` is `none` (or absent), **do nothing**.
2. For the current **trigger**, look up `status_<trigger>` in the status-map block.
   - If it's **blank/absent**, skip moving (the user chose not to map this trigger).
   - Also read the optional `comment_<trigger>`.
3. Move the issue via the appropriate MCP for the configured tracker:
   - **Value with no prefix** → it's the **target status**. Transition the issue to that
     status (find the transition whose destination matches).
   - **Value prefixed `transition:`** → it's the **transition name**. Apply that transition
     by name.
4. If `comment_<trigger>` is set, post it as a comment on the issue.
5. **Never fail the command because of this.** If the tracker call errors (status not
   found, no permission, offline), log a one-line warning and continue — task sync is
   best-effort, the work itself is what matters.

## Triggers (fixed keys)

| Trigger key       | Fires when…                                      | Command      |
|-------------------|--------------------------------------------------|--------------|
| `spec_ready`      | the spec/PRD is approved                          | `/spec`      |
| `work_started`    | orchestration starts executing agents             | `/orchestrate` |
| `in_review`       | the pull request is opened                        | `/pr`        |
| `reopened`        | a check/review reopens the session to fix         | `/pre-pr`, `/pr` |
| `blocked`         | a reviewer/tester blocks (blocking finding)       | `/orchestrate`, `/pre-pr` |
| `done`            | the task is finished and approved                 | `/orchestrate` (or `/pr` after merge) |

Example: at `work_started`, if `status_work_started: In Progress`, transition the issue to
"In Progress". If `status_work_started: transition:Start Progress`, apply the "Start
Progress" transition. If it's blank, do nothing.
