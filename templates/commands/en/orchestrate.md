# /orchestrate — Dynamic Ephemeral Agent Orchestration

You are the **Orchestrator**. Your job is to turn an approved spec into the **minimum
graph of ephemeral, specialized agents** and coordinate their execution — instead of
running one monolithic agent over a huge shared context.

This command REPLACES the old linear `start → plan → work` flow with a graph the
runtime derives automatically. `/plan` and `/work` may still exist as manual escape hatches.

**Argument**: `#$ARGUMENTS` (an ISSUE-ID and/or a path to a spec/task file).

---

## Golden rules

- ✅ Read `context-manifest.json` + `ai.properties.md` from the orchestrator.
- ✅ The Orchestrator's own context stays LIGHT: you coordinate, you do not implement.
- ✅ Each unit of work is done by a **subagent (Task tool)** with an **isolated context contract**.
- ✅ Never build a catalog of domain agents (no `frontend-agent`, `payments-agent`). A worker is
  compiled on the fly: `archetype + objective + repository + context contract + tools`.
- ❌ Never dump whole repos into a subagent. Select, do not dump.
- ❌ Never let a subagent modify normative specs.

---

## Step 1 — Load configuration

1. Read `context-manifest.json`. Extract `repositories[]` (each has `id`, `role`, `hints`,
   optional `context`, `testCommand`, `mainBranch`) and the `orchestration` block
   (`archetypes`, `riskSignals`, `parallelism`, `contextPolicy`, `maxFilesPerWorker`, `indexes`).
2. Read `ai.properties.md` for `base_path` and the task manager settings (if any):
   `task_management_system` + the tracker fields (jira: `jira_site`/`jira_project`;
   linear: `linear_team`; github: `github_org`/`github_repo`). Use them to locate the
   issue via MCP.
3. Locate the specs repo: the repository with `role: metaspecs` (or `specs-provider`).

## Step 2 — Load the spec

- If a task manager is configured and the argument is an ISSUE-ID, read the issue via the
  appropriate MCP. Otherwise read the spec file passed as argument, or ask the user for it.
- Read the relevant `orchestration.indexes` (the context routers) to ground yourself.
  Do NOT read the whole codebase — you are only classifying and routing here.

## Step 3 — Classify complexity (deterministic rules)

Compute against the spec text:

- **repoHits** = number of repositories whose `id` OR any of its `hints` appear in the spec.
- **risks** = number of `orchestration.riskSignals` that appear in the spec.
- If the spec's frontmatter sets `complexity: simple|medium|complex`, use it verbatim.

Otherwise:

| Condition | Level |
|---|---|
| `repoHits ≥ 3` OR `risks ≥ 2` OR very large spec | **complex** |
| `repoHits ≥ 2` OR `risks ≥ 1` OR moderately large spec | **medium** |
| otherwise | **simple** |

State the classification and the reason explicitly before continuing.

## Step 4 — Build the execution graph (DAG)

Instantiate workers from `orchestration.archetypes`. Each worker node has:
`{ id, name, archetype, objective, repository, dependsOn[], contextHints[] }`.

Besides the short `id` (`W1`, `W2`…), give each worker a **descriptive `name` =
role + target**, derived from the archetype + repo/objective. Suggested prefixes:
`impl:`, `integrate:`, `review:`, `test:`, `research:`, `plan:`. Examples:
`impl:front-audio`, `impl:back-api`, `integrate:api↔ui`, `review:security`, `test:front`.
The dashboard displays this `name` (the `id` stays internal).

- **simple**
  - `W1 implementer` on the single impacted repo
  - `W2 reviewer` (dependsOn W1) — verify against the normative spec

- **medium**
  - one `implementer` per impacted repo (these run in **parallel**, no deps between them)
  - `integrator` (dependsOn all implementers) — check cross-repo contracts/consistency
  - `tester` (dependsOn integrator) — run each repo's `testCommand`

- **complex** = medium, plus:
  - `reviewer` (dependsOn integrator) — **adversarial** review of business rules,
    security, migrations, and hidden assumptions. Prefer a specialized reviewer archetype
    if the risk signals point at one (e.g. data, integrations, tenancy).

Respect `parallelism.maxWorkers` and `maxPerRepository`. If impacted repos exceed the
cap, batch them and say so — never silently drop a repo.

Render the graph as a short table (id, archetype, repo, dependsOn) and **get user approval**
before spawning anything.

## Step 5 — Compile a Context Contract per node

For each worker, build the contract that will be pasted into its subagent prompt.
See `agents/CONTEXT-CONTRACT.md` for the exact shape. In short:

- **read**: `orchestration.indexes` + that repo's `context[]` (only files that exist)
- **mayDiscover**: references reachable from the indexes; repo files the task needs
- **mustNotAssume**: unstated business rules; unindexed external contracts; anything not in specs
- **writeBoundary**: only that repo's worktree (or session artifacts for integrator/tester)
- **limits**: `contextPolicy` (default `select-do-not-dump`), `maxFilesPerWorker`
- **return**: summary, changes, evidence, tests, unresolved questions, confidence

## Step 5b — Prepare the session worktrees (via git, not Node)

Before spawning any agent, create an **isolated git worktree per impacted repository**
(only the ones in the graph), so each implementer has a place to write without touching
the main repo. Use `base_path` (from `ai.properties.md`) and the `<ISSUE-ID>`.

For each impacted repository `<repo>` (use the manifest's `mainBranch`, default `main`):

1. If `.sessions/<ISSUE-ID>/<repo>/` already exists, **skip** (worktree ready).
2. **Update the base**: fetch the latest remote state so the worktree starts from
   up-to-date code (not the local main, which may be stale):
   ```bash
   git -C "{base_path}/<repo>" fetch origin "<mainBranch>" --quiet
   ```
3. Check whether branch `feature/<ISSUE-ID>` already exists in the repo:
   ```bash
   git -C "{base_path}/<repo>" rev-parse --verify --quiet "feature/<ISSUE-ID>"
   ```
4. Create the worktree:
   - if the branch does **not** exist — create it **from the updated `origin/<mainBranch>`**:
     ```bash
     git -C "{base_path}/<repo>" worktree add -b "feature/<ISSUE-ID>" \
         "$(pwd)/.sessions/<ISSUE-ID>/<repo>" "origin/<mainBranch>"
     ```
   - if the branch **already** exists (reuse it):
     ```bash
     git -C "{base_path}/<repo>" worktree add \
         "$(pwd)/.sessions/<ISSUE-ID>/<repo>" "feature/<ISSUE-ID>"
     ```
   If the `fetch` fails (no remote/offline), warn and fall back to local state
   (`worktree add -b feature/<ISSUE-ID> <path>` without `origin/<mainBranch>`).

Rules:
- **Never** `checkout` in the main repo (`{base_path}/<repo>`) — the worktree isolates everything.
- If `git worktree add` fails with "already exists", treat it as ready and continue.
- Only prepare worktrees for the **impacted** repos in the graph, not every repo in the manifest.
- Record in `execution-plan.md` which worktrees were created (path + branch).

After this, each agent's `writeBoundary` (`.sessions/<ISSUE-ID>/<repo>/`) actually exists.

## Step 5c — Write the initial state (for the dashboard)

Write machine-readable state into `.sessions/<ISSUE-ID>/` (format in the orchestrator's
`SESSION-STATE.md`). This feeds `context-agents dashboard`.

1. `state.json`: `{ issueId, title, complexity, status:"planned", createdAt, repos, waves }`
   (`waves` = the waves from Step 4; `title` = the human task title from the spec, so the
   dashboard shows "ISSUE-ID · title").
2. `workers/<id>.json` for each node: `{ id, name, archetype, repository, objective,
   dependsOn, status:"pending", currentStep:null, steps:[], startedAt:null,
   finishedAt:null, verdict:null }` (include the descriptive `name` from Step 4).

Keep writes small and frequent — the dashboard polls these files.

## Step 6 — Spawn ephemeral agents (Task tool)

Execute the DAG respecting `dependsOn`. **On each transition, update the state files**:

1. **When a wave starts**: for each node in the wave, set `workers/<id>.json` to
   `status:"running"`, `startedAt`, and a short `currentStep`; set `state.json.status="running"`.
   **On every step change** during execution, update `currentStep` AND append
   `{ step, at }` to the `steps[]` array (the dashboard shows this history as a pipeline).
2. **Parallel wave**: spawn all nodes in the wave **in a single message with multiple Task
   calls** so they run concurrently. Give each subagent ONLY its compiled contract +
   objective — never the whole conversation.
3. **On return**: set each `workers/<id>.json` to `status:"done"` (or `"blocked"`),
   `finishedAt`, and `verdict` if any (reviewer/tester/integrator).
4. **Next wave**: spawn nodes whose dependencies are now satisfied. Repeat until done.
5. **At the end**: `state.json.status="done"` (or `"blocked"` if any blocked).

Use the archetype prompt templates in `agents/` (implementer, reviewer, integrator,
tester, …) as the system framing for each subagent, filled with the node's objective,
repository, and context contract.

Each subagent is **ephemeral**: it does its bounded job, returns its report, and its
context is discarded. The Orchestrator only keeps the reports.

## Step 6b — Reconcile with the base (conflicts) before PR

While the agents worked, `origin/<mainBranch>` may have advanced. For each impacted repo,
check whether the worktree diverged from the base:

```bash
git -C "<worktree-path>" fetch origin "<mainBranch>" --quiet
git -C "<worktree-path>" rev-list --count "HEAD..origin/<mainBranch>"
```

- If the result is `0` (base didn't advance), **skip** — nothing to reconcile.
- If `> 0`, **spawn a `conflict-resolver` agent** (archetype in
  `agents/conflict-resolver.md`) for that repo. It rebases onto `origin/<mainBranch>`,
  resolves conflicts guided by the spec, runs the tests, and **STOPS for your approval**.
  Record its status under `workers/` like the others.
- If it returns `NEEDS-HUMAN`, do **not** proceed to PR — show the conflicts and ask.

## Step 7 — Integrate and report

- Persist artifacts under `.sessions/<ISSUE-ID>/`:
  `execution-plan.md` (the DAG), and `workers/<agent-id>.md` (each contract + return).
- Summarize: what changed per repo, evidence, tests run, unresolved questions,
  and any repo that was batched/deferred.
- If a `reviewer` or `conflict-resolver` returned blocking findings, do NOT proceed to PR —
  surface them and ask the user how to proceed.

## Escalation

If any subagent hits a Jidoka stop (ambiguity, spec conflict, missing contract), it must
return `unresolved` instead of guessing. Bubble that up to the user rather than pushing
forward.
