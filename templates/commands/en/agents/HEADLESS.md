# Headless runs and result files (shared protocol)

How a command behaves with `--headless` and `--result <file>`. Every command that lists these
flags follows this file; a **project-specific command** (e.g. your own `test-env`) can opt in by
adding a "Mode" section that points here. Contract of the files: `SESSION-STATE.md`.

`SS` = `node .claude/bin/session-state.mjs .sessions/<ISSUE-ID>` (run from the orchestrator
directory). If the helper is missing, edit `state.json` / write the files by hand with the same
fields.

## Flags

Remove the flags from the arguments before reading them — the rest is the ISSUE-ID / text.

- **`--headless`** — never ask a question. Every question or human gate becomes a `needsHuman`
  item (below), the status is set and **the command ends**. Never guess an answer and never pick
  an option on the person's behalf.
- **`--result <file>`** — when the command ends — success, stopped at a gate, or failure — its
  **last action** writes the result file (below). The path is absolute or relative to the
  current directory. Works with or without `--headless`.
- Without flags the command is interactive, exactly as before.

## Turning a question into `needsHuman`

```bash
SS need <prefix>-<slug> decision "<the question, one line>" "<options + how to answer>" <ref>
```

- **id**: `<prefix>-<slug>`, stable across re-runs (`refine-scope`, `spec-auth-model`,
  `testenv-ports`). The prefix is the command's (each command says which).
- **kind**: `decision` for a question or a choice · `approval` for a yes/no on an artifact
  (plan, refined requirements, PRD) · `access` for credentials, permissions or environment ·
  `failure` when something broke and only a person can fix it.
- **howToResolve**: the **concrete options** (`(a) … (b) … (c) …`, with the one you would
  recommend marked) **and how to answer**: *"Answer in `.sessions/<ISSUE-ID>/approval.json`
  (`approved: true`, your choice in `notes`) and re-run `/<command> <ISSUE-ID> --headless` — or
  run `/<command> <ISSUE-ID>` and answer in the conversation."*
- **ref**: a session file with the detail (e.g. `refine-questions.md`): the context, every
  question and its options — so the person can answer without reading this conversation.
- Several questions → one item per question (same file as `ref`).

## Continuing after the answer

On a re-run, if `SS show` lists pending items with this command's prefix, consume the answer
first — `SS apply-approval` — and act on its `result`:
- `approved` → the items were resolved; `notes` holds the person's answers (a choice per item,
  or adjustments). Continue from where the command stopped, applying them.
- `rejected` → the helper set `status: done` + `rejected: true`. Report the notes and stop.
- `missing` / `stale` / `invalid` → interactive: ask the pending questions in the conversation
  (then `SS resolve <id>`); `--headless`: change nothing and end (writing the result).

## Writing the result file (`--result <file>`)

```bash
SS result <file> <command>                    # the session exists: reads state.json
node .claude/bin/session-state.mjs result <file> <command> \
  --need <id> decision "<reason>" "<options + how to answer>"   # no session was created
```

- `<command>`: the command id, its path under `.claude/commands/` with `:` —
  `orchestrate`, `engineer:pre-pr`, `engineer:pr`, `engineer:merge`, `products:collect`,
  `products:refine`, `products:spec`, `engineer:test-env`.
- Written shape (one JSON object; `needsHuman` is the session's list):
  ```json
  { "command": "products:refine", "issueId": "ISSUE-42", "status": "awaiting_approval", "phase": "refine",
    "needsHuman": [{ "id": "refine-approval", "kind": "approval", "reason": "…", "since": "…", "howToResolve": "…", "ref": "refined.md" }],
    "at": "2026-10-16T12:00:00Z" }
  ```
- Options: `--issue <id>`, `--status <status>`, `--phase <phase>` override what was read;
  `--need …` / `--need-json '<json>'` add items to the result only. Without a session,
  `issueId` and `phase` are `null` unless given.
- **A finished run never reports `running`.** If the command fails unexpectedly, record it
  first — `SS need <prefix>-failed failure "<what failed>" "<how to retry>"` — then write the
  result. A run that ended cleanly leaves the status it reached (`done`, `planned`, `pr_open`…).
- Helper missing, or older than 0.16 (`unknown command "result"`): write the same JSON by hand to `<file>`.
