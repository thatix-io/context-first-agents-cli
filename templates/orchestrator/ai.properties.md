# AI Properties (local, gitignored)

Local configuration for this orchestrator. Do not commit machine-specific paths.

## base_path

Absolute path to the folder that contains your repositories (usually the parent of the
orchestrator).

```
base_path: /absolute/path/to/your/repositories
```

## Task manager (optional)

If you use an issue tracker via MCP, declare it so `/orchestrate <ISSUE-ID>` can read issues.

```
task_management_system: none   # e.g. jira | linear | github | none
```

## AI provider

```
ai_provider: claude
commands_dir: .claude/commands
```
