# Task status sync (shared helper)

How commands move the issue in the task manager as the flow progresses. Read this whenever
a command reaches a **trigger** below.

## Steps

1. Read `ai.properties.md`. If `task_management_system` is `none` (or absent), **do nothing**.
2. For the current **trigger**, look up `status_<trigger>` in the status-map block.
   - If it's **blank/absent**, skip moving (the user chose not to map this trigger).
   - Also read the optional `comment_<trigger>`.
3. Move the issue via the appropriate MCP for the configured tracker (see per-tracker notes
   below). Two value forms:
   - **Value with no prefix** → the **target state/column**. Move the issue there.
   - **Value prefixed `transition:`** → a **transition name**. Apply that transition by name.
4. If `comment_<trigger>` is set, post it as a comment on the issue.
5. **Never fail the command because of this.** If the tracker call errors (status not
   found, no permission, offline), log a one-line warning and continue — task sync is
   best-effort, the work itself is what matters.

## Per-tracker: how to move

- **Jira / Linear / GitHub**: the value is a **workflow status** — transition the issue to
  that status (or apply the named transition).
- **Azure DevOps**: Azure boards move by **board COLUMN** (`System.BoardColumn`), and
  several columns often share the same `System.State` (e.g. "Doing", "Code Review" are both
  `Active`). So treat the value as the **board column name** and set it via the
  `System.BoardColumn` field (Azure DevOps MCP / `az boards work-item update`), NOT by
  changing the state. Only prefix with `transition:` if you really mean a state transition.

## Triggers (fixed keys)

| Trigger key       | Fires when…                                      | Command      |
|-------------------|--------------------------------------------------|--------------|
| `spec_ready`      | the spec/PRD is approved                          | `/spec`      |
| `work_started`    | orchestration starts executing agents             | `/orchestrate` |
| `in_review`       | the pull request is opened                        | `/pr`        |
| `reopened`        | a check/review reopens the session to fix         | `/pre-pr`, `/pr`, `/merge` |
| `blocked`         | a reviewer/tester blocks (blocking finding)       | `/orchestrate`, `/pre-pr` |
| `in_test`         | the branch is merged and is being validated       | `/merge`     |
| `done`            | the task is finished and approved                 | `/merge` (or `/orchestrate`) |

Example (Jira): at `work_started`, if `status_work_started: In Progress`, transition the
issue to "In Progress". Example (Azure): if `status_work_started: Doing`, set
`System.BoardColumn = "Doing"` on the work item. If a value is blank, do nothing.
