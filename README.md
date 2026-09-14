# Context-First Agents CLI

> Evolution of [context-first-cli](https://www.npmjs.com/package/context-first-cli): the
> same project-agnostic methodology management **plus** dynamic, ephemeral AI-agent
> orchestration derived from your specs.

The Node CLI only **scaffolds and manages** (orchestrator, repos, config, worktrees-ready
sessions). All agent **orchestration intelligence lives in `.md` command templates** that
your AI tool runs — never in Node. This keeps the whole flow inside your existing
command-driven workflow.

```
spec → complexity → execution DAG → context contract per node → ephemeral agents
```

---

## What is this for?

You have a **multi-repository product** (say a backend, a web client, a mobile app, a
shared UI library, a specs repo) and you drive development with an **AI coding tool**
through slash commands.

The problem: doing a feature that touches several repos with **one AI agent** means
stuffing every repo, every spec, and the whole plan into **one giant context**. It
saturates, loses the thread, and there's no parallelism — you babysit it phase by phase.

This tool fixes that by moving one level up. You write an approved spec; the AI runs
`/orchestrate`, which:

1. **reads your `context-manifest.json`** to know your repos,
2. **figures out how big the task is** (which repos it touches, whether it's risky),
3. **builds the minimum graph of ephemeral agents** — e.g. one implementer per impacted
   repo (in parallel), then an integrator, then a tester, plus an adversarial reviewer
   when the task is risky,
4. **gives each agent a tiny, bounded "context contract"** (only the files it may read,
   only the repo it may write) and spawns them as subagents,
5. **collects their reports** and summarizes what changed.

Each agent is **ephemeral**: it does one bounded job with a clean, small context, returns
a structured report, and is discarded. The orchestrator stays light — it coordinates, it
doesn't implement. That's what keeps large, multi-repo work from collapsing under its own
context.

**Who it's for:** teams using an AI tool (Claude Code, Cursor, etc.) across several repos
who want spec-driven, parallel, context-isolated feature development — without hand-wiring
which agent runs when.

---

## What's new vs. context-first-cli

| | context-first-cli | context-first-agents-cli |
|---|---|---|
| Work decomposition | you pick which command to run, in a fixed pipeline | `/orchestrate` derives the **minimum agent graph** from the spec |
| Agents | one serial agent over one big shared context | **N ephemeral agents**, one per responsibility/repo, each with an isolated context |
| Parallelism | none (sequential phases) | implementers per repo run in parallel, joined by `dependsOn` |
| Context | everything in one bucket | **context contract per agent** (`select-do-not-dump`, `mustNotAssume`) |
| Risk review | you remember to trigger it | `riskSignals` auto-trigger an adversarial reviewer |

It stays **100% project-agnostic**: the core knows nothing about your stack or domain.
Everything specific lives in `context-manifest.json`.

---

## Install

```bash
npm install -g @thatix.io/context-first-agents-cli
# binaries: context-agents  (alias: cfa)
```

## Concepts (30 seconds)

- **Orchestrator** — a small control repo (the folder you run the CLI in). Holds
  `context-manifest.json` and the installed `.md` commands. It is the single source of
  truth for your dev process.
- **Repositories** — your actual code repos, listed in the manifest, sitting next to the
  orchestrator (`../service-a`, `../client-b`, …).
- **Metaspecs** — the repo holding your normative specs (the `role: metaspecs` entry).
- **Session** — one feature/issue. Lives in `.sessions/<ISSUE-ID>/` with the plan and each
  agent's report.
- **Ephemeral agent** — a subagent compiled on the fly from
  `archetype + objective + repository + context contract`, run once, then discarded.

## Quick start

```bash
# 1. Create an orchestrator (or run `init` inside an existing one)
context-agents create:orchestrator my-orchestrator
cd my-orchestrator

# 2. Register your repositories (with hints so the orchestrator can route)
context-agents add:repo

# 3. Validate the setup
context-agents doctor

# 4. In your AI tool, run the orchestration command:
/orchestrate <ISSUE-ID or path/to/spec.md>
```

## The development flow after install

Setup happens **once**; then it's the same short loop per feature.

**One-time setup (Node CLI):**

1. `create:orchestrator my-orchestrator` (or `cd` into an existing orchestrator and run
   `init`).
2. Edit `ai.properties.md` → set `base_path` to where your repos live.
3. `add:repo` for each repository. Give each one **`hints`** (keywords that mean "this repo
   is impacted"), an optional **`context`** list (files an agent here may read), and a
   **`testCommand`**.
4. Fill `orchestration.riskSignals` (keywords like `migration`, `payment`, `auth`) and
   `orchestration.indexes` (your spec index files).
5. `doctor` until it's all green.

**Per feature (in your AI tool) — the full command flow:**

```
/warm-up → /collect → /refine → /spec → /orchestrate
   load       gather      shape     approve    derive agent graph
  context      idea       scope      the spec    + execute
```

1. **`/warm-up`** — load project context (manifest, specs, conventions).
2. **`/collect`** → **`/refine`** → **`/spec`** — turn an idea into an **approved,
   normative spec** (PRD). These are the "product" commands.
3. **`/orchestrate <ISSUE-ID or path/to/spec.md>`** — the new engine. It will:
   - classify complexity and **show you the agent graph**,
   - wait for your **approval**,
   - spawn the ephemeral agents wave by wave (implementers in parallel, then
     integrator/tester, plus a reviewer if risky),
   - write everything to `.sessions/<ISSUE-ID>/` and summarize the result.
4. Review the summary. If the reviewer flagged blockers, fix and re-run the affected part.
5. Open the PR(s) from the per-repo worktrees (or use `/pre-pr` / `/pr`).

The classic **`/start` → `/plan` → `/work`** commands are still installed as **manual
escape hatches** — for most tasks `/orchestrate` replaces that whole sequence. Quality
commands `/observe` and `/metrics` are also included.

## Commands (Node — scaffold/management only)

| Command | Purpose |
|---|---|
| `create:orchestrator [name]` | New orchestrator (manifest + full `.md` command flow) |
| `init` | Install/refresh the full command flow in an existing orchestrator |
| `add:repo` | Add a repo to the manifest (id, role, **hints**, context, testCommand) |
| `update:commands` | Overwrite the command templates |
| `doctor` | Validate manifest, hints, indexes, and installed flow commands |
| `status` | Show repos, risk signals, and active sessions |
| `dashboard` | Serve a local web dashboard of sessions and running agents |

`--lang en|es|pt-BR` selects the language of the installed `.md` commands.

**Installed `.md` commands** (into `.claude/commands/`): `warm-up`,
`products/{collect,refine,spec,check}`, **`orchestrate`** (+ `agents/`),
`engineer/{start,plan,work,pre-pr,pr}` (escape hatches), `quality/{observe,metrics}`.

## Dashboard

`/orchestrate` writes machine-readable state per session (`state.json` +
`workers/<id>.json`, format in `SESSION-STATE.md`). Serve a live view of it:

```bash
context-agents dashboard          # → http://localhost:4517
```

The dashboard lists every session (issue), its complexity, the agent graph by wave, and
each agent's status (`pending → running → done/blocked`) with its current step and
verdict — auto-refreshing every 2s. Sessions created before state-writing still render via
an `execution-plan.md` fallback (shown without live status).

## The `.md` orchestration layer (the engine)

Installed into `.claude/commands/`:

- **`orchestrate.md`** — classifies complexity, builds the execution DAG, compiles a
  context contract per node, and spawns ephemeral subagents (Task tool) wave by wave.
- **`agents/CONTEXT-CONTRACT.md`** — the exact contract shape and the required return format.
- **`agents/{implementer,reviewer,integrator,tester}.md`** — behavioral archetypes
  (not domain agents). A concrete worker is compiled as
  `archetype + objective + repository + context contract + tools`.

## `context-manifest.json`

The single source of project truth (backwards-compatible with context-first-cli, with
additive fields). See `templates/orchestrator/context-manifest.example.json`.

```jsonc
{
  "repositories": [
    {
      "id": "service-a",
      "role": "service",
      "hints": ["api", "backend"],          // ← how the orchestrator knows a task hits this repo
      "context": ["../metaspecs/specs/api.md"], // ← what an agent here may read
      "testCommand": "npm test"
    }
  ],
  "orchestration": {
    "riskSignals": ["migration", "payment", "security"], // ← trigger adversarial review
    "indexes": ["../metaspecs/specs/index.md"],
    "contextPolicy": "select-do-not-dump",
    "parallelism": { "maxWorkers": 8, "maxPerRepository": 2 }
  }
}
```

## How complexity routing works

`/orchestrate` counts, against the spec text:
- **repoHits** — repos whose `id`/`hints` appear
- **risks** — `riskSignals` that appear

→ `simple` (1 repo: implementer + reviewer) · `medium` (impl per repo → integrator →
tester) · `complex` (medium + adversarial reviewer). A spec may force it via
`complexity:` frontmatter. Small tasks stay small by design.

---

## End-to-end example

Assume this manifest (two code repos + a specs repo):

```jsonc
{
  "project": "example",
  "repositories": [
    { "id": "metaspecs", "role": "metaspecs", "hints": ["spec", "adr"] },
    { "id": "service-a", "role": "service", "hints": ["api", "backend"],
      "context": ["../metaspecs/specs/api.md"], "testCommand": "npm test" },
    { "id": "client-b", "role": "application", "hints": ["ui", "client"],
      "context": ["../metaspecs/specs/design.md"], "testCommand": "npm test" }
  ],
  "orchestration": {
    "riskSignals": ["migration", "payment", "security"],
    "indexes": ["../metaspecs/specs/index.md"],
    "parallelism": { "maxWorkers": 8, "maxPerRepository": 2 }
  }
}
```

### 1. Write a spec — `.sessions/ISSUE-42/spec.md`

```markdown
---
id: ISSUE-42
---
# Add a `discountRate` field to the order

Expose `discountRate` in the **service-a** order API and show it on the
order screen in the **client-b** UI.
```

### 2. Run the command

```
/orchestrate .sessions/ISSUE-42/spec.md
```

### 3. What the orchestrator does

**Classification** — the spec text mentions `service-a`/`api` and `client-b`/`ui` →
**repoHits = 2**, no risk signals → **medium**.

**Proposed graph (shown for approval):**

| id | archetype | repository | dependsOn |
|----|-----------|------------|-----------|
| W1 | implementer | service-a | — |
| W2 | implementer | client-b | — |
| W3 | integrator | (session) | W1, W2 |
| W4 | tester | (session) | W3 |

**Execution** — after you approve:

- **Wave 1 (parallel):** W1 and W2 are spawned as subagents in one shot. Each gets ONLY
  its context contract — e.g. W1 may read `../metaspecs/specs/index.md` +
  `../metaspecs/specs/api.md`, may write only in `service-a`'s worktree, and is told not
  to assume anything outside the spec.
- **Wave 2:** W3 (integrator) checks that the API field W1 added matches what W2 consumes
  (name, type, nullability).
- **Wave 3:** W4 (tester) runs `npm test` in each impacted repo and maps the acceptance
  criterion ("field visible on the order screen") to a check.

**Result** — written to `.sessions/ISSUE-42/`:

```
.sessions/ISSUE-42/
├── spec.md
├── execution-plan.md         # the DAG above
└── workers/
    ├── agent-w1.md           # contract + report (service-a)
    ├── agent-w2.md           # contract + report (client-b)
    ├── agent-w3.md           # integration findings
    └── agent-w4.md           # test results
```

Each report follows a fixed shape: `summary / changes / evidence / tests / unresolved /
confidence`.

### If the task were risky

Change the spec to *"…behind a **payment** flow with a DB **migration**"*. Now
**risks = 2** → **complex**, and the graph gains a **W5 reviewer** (dependsOn integrator)
that adversarially checks business rules, security, and the migration's reversibility
before you ship. You didn't have to remember to add it — the `riskSignals` did.

---

## Design rules

- **No catalog of domain agents.** Expertise comes from selected context, not personas.
- **Select, don't dump.** Each agent's context is bounded and auditable.
- **Specs are normative.** Agents may read them; they must never modify them.

## License

MIT
