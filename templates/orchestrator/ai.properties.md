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

## AI provider

```
ai_provider: claude
commands_dir: .claude/commands
```
