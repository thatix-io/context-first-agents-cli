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

## Step 3b — Distill the Technical Profile from the metaspecs (required for code)

Before building the graph, **consult the technical indexes** (the `/warm-up` Context Map +
`orchestration.indexes` + the impacted repos' `context[]`) and distill a **Technical
Profile** of what the metaspecs require. Invent nothing — only what the spec states.
Extract, when present:

- **Stack + idioms**: languages/frameworks and required conventions (e.g. "Vue3/Nuxt
  composition API", "NestJS + Mongoose", "ESM with `.js` imports", "pnpm/Jest").
- **Architecture**: the required pattern and its dependency rules (e.g. "Clean Architecture:
  `domain` pure, no framework; `application` via ports; `infrastructure` implements ports").
- **Detectable anti-patterns**: concrete prohibitions and how to detect them (e.g. "`domain`
  must not import `mongoose`/`@nestjs/*`", "no hardcoded values where a design token exists").
- **Design system / tokens**: if the metaspec defines a DS (e.g. `DESIGN_TOKENS_CONTRACT.md`),
  record the visual/token conformance rules to follow and validate.
- **Quality/security rules**: LGPD/PII, API contracts, mandatory tests.

This Technical Profile feeds **everything downstream**: the shape of the graph (Step 4),
each worker's guidance (Step 5), and which reviewers to create. Cite the specs consulted
(name + version/section) — that's the audit trail.

## Step 4 — Build the execution graph (DAG) — architecture-aware

Instantiate workers from `orchestration.archetypes`. Each worker node has:
`{ id, name, archetype, objective, repository, dependsOn[], contextHints[] }`.

Besides the short `id` (`W1`, `W2`…), give each worker a **descriptive `name` =
role + target**, derived from the archetype + repo/objective. Suggested prefixes:
`impl:`, `integrate:`, `review:`, `test:`, `research:`, `plan:`. Examples:
`impl:front-audio`, `impl:back-domain`, `review:arch`, `review:design-system`, `test:front`.
The dashboard displays this `name` (the `id` stays internal).

### Base by complexity
- **simple**: `implementer` on the single impacted repo → `reviewer` (dependsOn) vs. the spec.
- **medium**: one `implementer` per impacted repo (parallel) → `integrator` → `tester`.
- **complex** = medium + adversarial `reviewer` (dependsOn integrator).

### Architectural decomposition (optional — you decide if it's worth it)
Using the **Technical Profile**, judge whether to **split a repo into several workers**
following the metaspec's architecture, instead of one monolithic implementer:
- e.g. Clean Architecture: `impl:domain` → `impl:application` → (`impl:infra` ∥
  `impl:presentation`), honoring "dependencies point inward".
- e.g. by module/bounded-context/feature when the spec is organized that way.

**Judgment, not a fixed rule**: only decompose if the task is large/risky enough that the
parallelism and isolation pay off. Small task → one implementer per repo (layer
decomposition happens inside the worker). State why you decomposed (or not).

### Reviewers derived from the metaspecs
Create the reviewers/validators the **Technical Profile** justifies — each carrying the
concrete rules extracted from the spec (not generic):
- Profile has architecture/anti-patterns → `review:arch` (checks layers, dependencies, the
  detectable anti-patterns).
- Profile has a design system/tokens and the front was touched → `review:design-system`
  (validates token/component conformance).
- Profile has LGPD/security/contracts → `review:security` / `review:contract`.
With few rules you may consolidate into a single reviewer with multiple lenses — but each
lens must carry the real metaspec rules.

Respect `parallelism.maxWorkers` and `maxPerRepository` (layer decomposition counts toward
`maxPerRepository`). If you exceed it, batch and say so — never silently drop a repo/layer.

The graph table (id, archetype, repo, dependsOn) is the **starting point**, not the final
list: in live orchestration (Step 4b) the graph grows as work reveals the need.

## Step 4b — Detailed planning first (planner agent) + LIVE graph

Do NOT pre-compute all workers up front with one-line objectives (that leaves agents "raw",
re-planning everything). Instead, `/orchestrate` is a **seed**:

1. **Spawn a `planner` agent** (archetype in `agents/planner.md`) — dependsOn none. It writes
   the **detailed technical plan**, fed by the Technical Profile (Step 3b), into
   `.sessions/<ISSUE-ID>/execution-plan.md`, in the spirit of the old `plan.md`:
   - **Technical approach** and decisions (echoing the metaspec architecture).
   - **Contracts/APIs** — endpoints, types, events, fields (real names; producer/consumer).
   - **Per-repo file structure** — files to create/modify (path + what changes).
   - **Testing strategy** per repo, mapped to acceptance criteria.
   - **Risks** and **execution order**.
   - And crucially: **which workers to create** (role, repo/layer, detailed brief, deps).
2. **Present the planner's plan and get approval** — this is your control point (like
   approving the old `plan.md`).
3. **Spawn the first wave of workers** the planner defined.

### Live graph (fully dynamic)
From there the graph is **alive**: any agent may **spawn the next workers** when work reveals
the need (an implementer finds a missing service → requests a new worker; an integrator finds
a mismatch → requests a fix). When generating a new worker:
- create `workers/<id>.json` (status `pending`, with a detailed brief) and wire its `dependsOn`;
- the dashboard shows the worker **appearing live**.

**Dynamic control** (don't stop for every worker): auto-generate while **within the pattern**
(inside the approved plan's scope, within `maxWorkers`, no new risk). **STOP and ask the user
— showing the blockers** — when it goes off-pattern: outside the plan's scope, high/new risk
(unplanned migration, security, breaking change), ambiguity the spec doesn't answer, or a
reviewer's blocking finding. Never guess in those cases.

## Step 5 — Compile a Context Contract per node (with a detailed brief)

Each worker (defined by the planner or spawned live) gets, besides the contract, a
**brief cut from the plan** — its slice, dense, **not a one-liner**. That's what makes the
agent start knowing what to do. Each worker's `objective` must contain:

- **What to do** — the concrete change (not "implement audio", but "add `resolveIofAmount`
  in X; swap route Y→Z in W; parse the new envelope").
- **Target files** — that worker's files (path + what changes).
- **Contracts it produces/consumes** — the API/type slice that connects to other workers.
- **Expected tests** — the concrete cases it must cover.
- **Depends on / delivers to** — what it expects from another worker and what it hands off.

Keep the brief **scoped** (only the worker's part) — don't paste the whole plan into every
agent (breaks `select-do-not-dump`). Plan deep once; each agent gets its rich slice.

### Contract format

For each worker, build the contract that will be pasted into its subagent prompt.
See `agents/CONTEXT-CONTRACT.md` for the exact shape. In short:

- **read**: `orchestration.indexes` + that repo's `context[]` (only files that exist)
- **mayDiscover**: references reachable from the indexes; repo files the task needs
- **techProfile**: this worker's **specific technical guidance**, extracted from the
  Technical Profile (Step 3b) and scoped to it. This is what specializes the agent:
  - implementer → stack/idioms + the architecture rule for ITS layer/repo (e.g. a `domain`
    worker gets "pure, no framework, don't import mongoose/@nestjs"; a front worker gets
    "use design-system tokens, no hardcoded values"). Point at the exact indexes to consult
    (e.g. `technical/ARCHITECTURE.md`, `DESIGN_TOKENS_CONTRACT.md`).
  - reviewer/validator → the **concrete checklist** derived from the spec (anti-patterns to
    detect, tokens to check, security rules) — not "review well", but "verify X, Y, Z".
- **mustNotAssume**: unstated business rules; unindexed external contracts; anything not in specs
- **writeBoundary**: only that repo's worktree (or session artifacts for integrator/tester)
- **limits**: `contextPolicy` (default `select-do-not-dump`), `maxFilesPerWorker`
- **return**: summary, changes, evidence, tests, unresolved questions, confidence

> The `techProfile` is what makes an `implementer` produce **idiomatic, architecture-conformant**
> code, and a `reviewer` review **in the real technology's language** — all derived from the
> metaspecs, without the package knowing the stack in advance.

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
3. **Move the task in the tracker** — trigger `work_started`: follow `agents/TASK-STATUS.md`
   (best-effort; skip if there's no task manager).

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
- **Move the task in the tracker** (follow `agents/TASK-STATUS.md`):
  - trigger `blocked` if there are blocking findings;
  - trigger `done` when everything passed and the session is complete.

## Escalation

If any subagent hits a Jidoka stop (ambiguity, spec conflict, missing contract), it must
return `unresolved` instead of guessing. Bubble that up to the user rather than pushing
forward.
