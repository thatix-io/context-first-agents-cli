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

## Workflow mode (Engine B — `orchestrate-execute`)

Inside the `orchestrate-execute` workflow these rules come **in your prompt** (you don't need to
open this file); they are recorded here for reference and for Engine A.

### 1. State — one short command per milestone
Your prompt gives three ready-made commands for your `workers/<id>.json` (the dashboard reads it
live): `… start '<meta>' "<first step>"`, `… step "<what now>"`, `… finish done|blocked [VERDICT] ["<why blocked>"]`.
Use them at **3–5 milestones**, not on every action. When you finish `blocked`, give the one-line
reason (it becomes the "waiting on you" reason the human sees). Never write `state.json` or another
worker's file — the orchestrator is their only writer (it lifts your block into the session's
`needsHuman`).

### 2. Report on disk, short structured return
- Before returning, write your **full report** (summary / changes / evidence / tests / unresolved /
  confidence, plus findings) to the report path in your prompt (`workers/<id>.md`).
- Then return the structured object (the tool call enforces the schema) with a **short summary
  (≤ 3 lines)** — the orchestrator's context is the most expensive one; details live in the report.
- `status`: `done` | `blocked` — **when in doubt, `blocked`, never an invented `done`**.
- `verdict` (gates): `PASS`/`BLOCKED` (reviewer), `GREEN`/`RED` (tester), `CONSISTENT`/`MISMATCH` (integrator).
- `findings[]` (gates): `severity` (`blocking` | `should-fix` | `nit`), **`repository` (the repo
  id that owns the fix — required for blocking findings; it is how the fix loop routes it)**,
  `file`, `line`, `description`, `fix`.
- `commits[]` (implementers): the SHAs you created — re-checks review only these.
- `spawn[]` (non-gate workers, optional): `name`, `archetype`, `repository`, `dependsOn`, `brief`,
  honest `inScope` / `newRisk` flags, `reason`. In-scope/no-risk proposals run automatically,
  the rest go to the user. Propose instead of doing out-of-scope work yourself.

### 3. Lean command output (both engines)
Run tests/builds with quiet or summary reporters; send full output to a log file under
`<sessionDir>/logs/` and bring into your context only the summary and the failures
(e.g. `tail -n 40`, `grep -E "FAIL|Error"`). Failures stay complete — only noise is cut.
