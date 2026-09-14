# AI Properties (local, gitignored)

Local configuration for this orchestrator. Do not commit machine-specific paths.

## base_path

Absolute path to the folder that contains your repositories (usually the parent of the
orchestrator).

```
base_path: /absolute/path/to/your/repositories
```

## Task manager (optional)

If you use an issue tracker via MCP, declare it so `/orchestrate <ISSUE-ID>` can read
issues. Set `task_management_system` and fill ONLY the block for the tracker you use.
Leave it `none` to pass specs as files instead.

```
task_management_system: none   # jira | linear | github | azure | none
```

### Jira
```
# jira_site: https://your-org.atlassian.net/   # your Atlassian instance URL
# jira_project: ABC                              # project key = issue prefix (ABC-123)
```

### Linear
```
# linear_team: ABC                               # team key
```

### GitHub Issues
```
# github_org: your-org
# github_repo: your-repo
```

### Azure DevOps
```
# azure_organization: your-org
# azure_project: your-project
```

## Status mapping — move tasks as the flow progresses (optional)

The flow **triggers** are fixed (below). The **values are yours**: put the EXACT status
name from YOUR board. Commands move the task via MCP at each trigger. Rules:

- Leave a line blank / omit it → the command **skips** moving on that trigger.
- A value is normally the **target status** (e.g. `In Progress`). If your Jira workflow
  requires a **transition name** instead, prefix it with `transition:` (e.g.
  `transition:Start Progress`).
- Optionally post a comment on the task at a trigger with `comment_<trigger>`.

```
# ── move the task to this status at each trigger ──
status_spec_ready:    # after /spec is approved         (e.g. Ready for Dev)
status_work_started:  # when /orchestrate starts work    (e.g. In Progress)
status_in_review:     # when /pr opens the pull request  (e.g. In Review)
status_reopened:      # when /pre-pr or /pr reopen to fix (e.g. In Progress)
status_blocked:       # when a reviewer blocks           (e.g. Blocked)
status_done:          # when the task is finished/approved(e.g. Done)

# ── optional comments posted at a trigger (leave blank to skip) ──
# comment_work_started: 🤖 Orchestration started — see the agents dashboard.
# comment_in_review:    ✅ PR opened.
# comment_done:         🎉 Done and merged.
```

## AI provider

```
ai_provider: claude
commands_dir: .claude/commands
```
