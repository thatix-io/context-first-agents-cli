# /merge — Integrate the feature into main (after /pr)

Closes the loop after `/pr`: updates the base, resolves conflicts with agents, confirms
with you, and merges — **provider-agnostic**.

**Argument**: `#$ARGUMENTS` (an ISSUE-ID; uses the manifest's `mainBranch`, default `main`),
plus optional flags:
- `--headless` — no question is asked: the confirmation (Step 4) and any `NEEDS-HUMAN` conflict
  are recorded in `needsHuman` and the command **ends** (nothing is merged).
- `--resume` — continue after the confirmation was given outside the conversation, through
  `.sessions/<ISSUE-ID>/approval.json` (`{ approved, by, at, notes }`).

Session state goes through the helper (`SS` = `node .claude/bin/session-state.mjs .sessions/<ISSUE-ID>`,
format in `SESSION-STATE.md`; if the helper is missing, edit `state.json` by hand). On start:
`SS phase merge`.

## Golden rules
- ✅ Merge is **irreversible** → **ALWAYS** get confirmation first (Step 4 — in the conversation,
  or through `approval.json` + `--resume`).
- ✅ Never merge with red tests or an unresolved conflict.
- ❌ Never mark the session `merged` before the merge completes.

---

## Step 0 — Load context
Read `context-manifest.json` (impacted repos + `mainBranch`) and `ai.properties.md`
(`base_path`, task manager, PR provider). Impacted repos are the session's
(`.sessions/<ISSUE-ID>/<repo>/`, each a worktree on branch `feature/<ISSUE-ID>`).

## Step 1 — Update the base in the worktrees (avoid stale code)
For each impacted repo, bring the latest `main` **before** any merge so you don't integrate
on top of a stale base:

```bash
git -C "<worktree-path>" fetch origin "<mainBranch>" --quiet
git -C "<worktree-path>" rebase "origin/<mainBranch>"
```

If the `rebase` applies cleanly → continue. If it reports a conflict → Step 2.

## Step 2 — Conflicts → analysis & fix agents
If any repo conflicts while bringing the base, do **NOT** resolve ad-hoc. Behave like
`/orchestrate`:

1. 🔴 Reopen the session as ACTIVE: `SS status running merge`. **Move the task** — trigger
   `reopened` (follow `agents/TASK-STATUS.md`).
2. 🤖 For each conflicting repo, **spawn a `conflict-resolver` agent** (archetype in
   `agents/conflict-resolver.md`) with the worktree and the spec. It rebases onto
   `origin/<mainBranch>`, resolves guided by the spec, runs the tests, and returns
   `RESOLVED` / `NEEDS-HUMAN` / `CLEAN`. Record status under `workers/<id>.json`
   (`name` e.g. `merge-fix:<repo>`), updating `currentStep`/`steps[]`.
3. If any returns `NEEDS-HUMAN`, **STOP** the merge:
   `SS need conflict-<repo> decision "<the conflict>" "<how to resolve>" workers/<id>.md`, then show
   the conflicts to the user (`--headless`: end the command).

## Step 3 — Revalidate
With the base integrated, run each impacted repo's `testCommand` (from the manifest) inside
the worktree. If anything goes red, do **NOT** continue — report and handle as in Step 2.

## Step 4 — Confirm (mandatory)
**STOP and present the merge plan** before executing:
- repos to merge and the branch (`feature/<ISSUE-ID>` → `<mainBranch>`);
- merge order (respect inter-repo dependencies, e.g. back before front);
- test results; conflicts resolved by agents.
Only proceed to Step 5 **after explicit user approval**:
- Record the gate first: `SS need merge-confirmation approval "Merge plan ready — confirm to merge into <mainBranch>" "Confirm in the conversation, or write .sessions/<ISSUE-ID>/approval.json and run /merge <ISSUE-ID> --resume" pr.md`
  (status becomes `awaiting_approval`).
- **Interactive**: ask. Confirmed → `SS resolve merge-confirmation`, `SS status running merge`, Step 5.
  Declined → `SS resolve merge-confirmation`, `SS status pr_open pr`, stop.
- **`--headless`**: do not ask — end the command here (nothing is merged).
- **`--resume`**: run `SS apply-approval` — `approved` → `SS status running merge`, redo Steps 1–3
  quickly (the base may have moved) and go to Step 5; `rejected` → `SS status pr_open pr` and stop
  (the PRs stay open); `missing`/`stale`/`invalid` → say so and stop.

## Step 5 — Do the merge (provider-agnostic)
Detect the provider from each repo's remote and use the matching path. **Prefer the PR
platform**; if there's no PR/CLI, fall back to a local merge.

- **GitHub** (`gh` available): merge the PR opened by `/pr`:
  ```bash
  gh pr merge <PR|branch> --repo <owner/repo> --squash --delete-branch
  ```
  (use `--merge`/`--rebase` per project policy). Respects GitHub checks/approvals.
- **Other provider (GitLab, Bitbucket, Azure…)**: use the **matching MCP/CLI** to merge the
  equivalent merge/pull request (e.g. `glab mr merge`, the provider's MCP).
- **No PR/provider**: local merge into the main repo and push:
  ```bash
  git -C "{base_path}/<repo>" checkout "<mainBranch>"
  git -C "{base_path}/<repo>" pull --ff-only origin "<mainBranch>"
  git -C "{base_path}/<repo>" merge --no-ff "feature/<ISSUE-ID>"
  git -C "{base_path}/<repo>" push origin "<mainBranch>"
  ```

**As soon as the merge completes**, **move the task** — trigger `in_test` (follow
`agents/TASK-STATUS.md`). Use this when the project validates post-merge (e.g. a "Test"
column on the board); if there's no such step, `status_in_test` stays blank and nothing moves.

## Step 6 — Update the base_repo and finish
- Update each merged repo's main checkout:
  ```bash
  git -C "{base_path}/<repo>" checkout "<mainBranch>"
  git -C "{base_path}/<repo>" pull --ff-only origin "<mainBranch>"
  ```
- Remove the session worktrees that were integrated
  (`git -C "{base_path}/<repo>" worktree remove ".../.sessions/<ISSUE-ID>/<repo>"`), if the
  project flow requires it.
- `SS set '{"mergedAt":"<ISO timestamp>"}'` and `SS status merged merge`.
- **Move the task** — trigger `done` (follow `agents/TASK-STATUS.md`).
- Report: merged repos, order, PRs/commits, and what agents resolved.

## Escalation
Any ambiguity (undefined merge policy, deploy dependency, unresolvable conflict) → **STOP**:
`SS need merge-<slug> <decision|access|failure> "<reason>" "<how to resolve>" <ref>`, then ask the user
(`--headless`: end the command). Never force a merge.
