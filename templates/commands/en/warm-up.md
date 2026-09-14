# Warm-up — Context Loading (spec indexes for RAG)

Prepares the environment by loading the **spec indexes** into a navigable context map.
The goal is NOT to dump the specs into context, but to load the **indexes** so later
commands know **where to look** for each piece of information, on demand.

**Arguments**: `#$ARGUMENTS`

---

## 1. Load configuration

Read from the orchestrator:
- **`context-manifest.json`** — `repositories[]` (id, role, hints), and the
  `orchestration` block (especially `indexes`).
- **`ai.properties.md`** — `base_path`, `task_management_system`.

Locate the specs repo: the one with `role: "metaspecs"` (or `"specs-provider"`).

## 2. Discover the indexes (dynamic — requires no fixed file)

Build the list of indexes to load, in this priority order, **skipping whatever doesn't exist**:

1. Every path in the manifest's `orchestration.indexes` (if defined).
2. If none are defined, or to complement, **discover** indexes in the specs repo:
   - look for `index.md` / `INDEX.md` under `{base_path}/{metaspecs-id}/specs/` and
     subfolders (e.g. `specs/index.md`, `specs/technical/index.md`,
     `specs/business/index.md`, `specs/business/features/index.md`).
3. Also include, **if they exist**, each repository's `context[]` files from the manifest.

> Degrade gracefully: if an expected index is missing, **just note it and continue**.
> Never fail the warm-up because a specific file is absent.

## 3. Build the Context Map (the warm-up's output)

Read ONLY the discovered indexes (not the documents they point to). From them, assemble
and present a **RAG map** — the project's "routing table":

```
## Context Map (RAG)

### Loaded indexes
- specs/index.md            → navigation root
- specs/technical/index.md  → architecture, API, ADRs, conventions
- specs/business/index.md   → personas, journey, strategy
- ...(only the ones that exist)

### Where to look, on demand
| Need                          | Consult (via index)                  |
|-------------------------------|--------------------------------------|
| Architecture / decisions      | technical/index.md → ARCHITECTURE / ADRs |
| API contract                  | technical/index.md → API_SPECIFICATION   |
| Business rules / feature      | business/index.md → features/...     |
| Code conventions              | technical/index.md → code guide      |

### Repositories (from the manifest)
- <repo-id> [role] — hints: ...
```

If an index references documents that don't exist on disk, mark them as
`(referenced, missing)` — that signals an incomplete spec, not a warm-up error.

## 4. Verify repositories and session

- For each repo in the manifest, confirm it exists at `{base_path}/{repo-id}/`
  (do not read README or code now — that's on demand).
- If an ISSUE-ID was passed, check `.sessions/<ISSUE-ID>/`.

## 5. How later commands use this

Commands like `/spec`, `/orchestrate` and the agents must NOT scan the repo blindly.
They should: consult the Context Map → open the relevant index → follow the link to the
specific document. The index is what optimizes RAG: load little, navigate precisely.

## 6. Jidoka principle

If you detect a structural problem (no index found, specs-provider missing):
**STOP**, describe what's missing, and suggest how to fix it (e.g. create `specs/index.md`
or fill `orchestration.indexes`). Do not invent context.

---

**Status**: Indexes loaded and Context Map built. Awaiting the next command.
