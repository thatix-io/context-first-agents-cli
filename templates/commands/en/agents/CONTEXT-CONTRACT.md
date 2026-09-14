# Context Contract (shape)

Every ephemeral agent is spawned with a contract. This is the exact object the
Orchestrator compiles per node and pastes into the subagent's prompt. It is what makes
each agent's context **small, bounded, and auditable** — the core of the architecture.

```json
{
  "agentId": "agent-w001",
  "archetype": "implementer",
  "objective": "<the specific, bounded goal for this worker>",
  "repository": "<repo-id or null for session-level workers>",
  "read": [
    { "type": "index", "path": "../metaspecs/specs/index.md", "reason": "project context router" },
    { "type": "hint",  "path": "../metaspecs/specs/technical/API_SPECIFICATION.md", "reason": "repo context hint" }
  ],
  "mayDiscover": [
    "references reachable from the indexes above",
    "files in this repository required to complete the objective"
  ],
  "mustNotAssume": [
    "unstated business rules",
    "unindexed external contracts",
    "requirements not present in the approved spec"
  ],
  "writeBoundary": ["assigned worktree for <repo-id>"],
  "limits": { "policy": "select-do-not-dump", "maxFiles": 20 },
  "return": ["summary", "changes", "evidence", "tests", "unresolved", "confidence"]
}
```

## Rules the Orchestrator must enforce when compiling a contract

- `read` includes ALL `orchestration.indexes` plus the repo's `context[]` — but only
  paths that actually exist on disk. Drop the rest silently.
- Session-level workers (integrator, tester, reviewer) have `repository: null` and
  `writeBoundary: ["session artifacts only"]`.
- Never expand `read` to "the whole repo". Discovery is allowed (`mayDiscover`) but
  starts from the indexes, not from a blind directory dump.
- The contract is the ONLY project context a subagent receives beyond its objective.
  Do not paste the full conversation into subagents.

## The return shape every agent must produce

```markdown
### summary
<one paragraph: what was done>

### changes
<files created/modified, per repo>

### evidence
<commands run, outputs, links>

### tests
<tests added/run and their result>

### unresolved
<questions, spec conflicts, Jidoka stops — or "none">

### confidence
<low | medium | high> + one line why
```
