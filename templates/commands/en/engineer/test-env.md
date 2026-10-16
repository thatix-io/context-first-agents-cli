# /test-env — Bring up a session's local test environment

Starts (or stops) the local environment of a session so the feature can be exercised by hand
or by tests: the session's worktrees running together, with ports that do not clash with other
sessions.

> **Project-specific command.** This is a generic starting point: adapt it to your stack
> (compose files, scripts, ports, seed data). `context-agents update:commands` installs it only
> when the project has no `test-env` command and **never overwrites it**.

**Argument**: `#$ARGUMENTS` — `<ISSUE-ID> [down] [--headless] [--result <file>]`.
- `down` (or `stop`) — stop the session's environment instead of starting it.
- `--headless` / `--result <file>` — protocol in `agents/HEADLESS.md` (item prefix `testenv-`).

## Configuration

Read `context-manifest.json` (repositories, `role`, `testCommand`) and `ai.properties.md`
(`base_path`, and a **test environment** section if the project documents one: base ports,
compose file, start script, health URLs, seed command).

## Session state

`SS` = `node .claude/bin/session-state.mjs .sessions/<ISSUE-ID>` (format in `SESSION-STATE.md`;
if the helper is missing, edit `state.json` by hand). This command **does not change the phase**.
- Before recording the first item, keep the current status (`SS show`) in
  `SS set '{"testEnv":{"previousStatus":"<status>"}}'` — recording an item moves the session to
  `blocked`; when the items are resolved, put it back: `SS status <previousStatus>`.
- Environment up: `SS set '{"testEnv":{"status":"up","urls":{"<service>":"<url>"},"stop":"<command>","at":"<now>"}}'`.
- Environment down: `SS set '{"testEnv":{"status":"down","at":"<now>"}}'`.

## Steps

### 1. Identify the session
- ISSUE-ID given → `.sessions/<ISSUE-ID>/` must exist.
- Missing or not found → interactive: list `.sessions/` and ask. `--headless`: nothing to
  record in (no session) — end with
  `node .claude/bin/session-state.mjs result <file> engineer:test-env --need testenv-session decision "Which session?" "(a) <ID-1> (b) <ID-2> … — re-run /test-env <ID> --headless"`.
- If `SS show` lists pending `testenv-*` items, consume the answer first (`SS apply-approval`,
  see `agents/HEADLESS.md`).

### 2. Find how this project starts its environment
In this order, and use the first that applies:
1. The project's own recipe: the test environment section of `ai.properties.md`, or scripts /
   compose files in the orchestrator (e.g. `infra/`).
2. In each session worktree (`.sessions/<ISSUE-ID>/<repo>/`; fall back to `{base_path}/<repo>`
   only for repos the session did not change): `docker-compose.yml` / `compose.yaml`, a
   `Makefile` target (`up`, `dev`), `package.json` scripts (`dev`, `start`), the README.
- Several candidates and no clear choice →
  `SS need testenv-recipe decision "How should <ISSUE-ID>'s environment start?" "(a) <candidate 1> (b) <candidate 2> — <how to answer>"`.
- Nothing found → `SS need testenv-recipe decision "No way to start the environment was found" "(a) document it in ai.properties.md (test environment section) (b) adapt .claude/commands/engineer/test-env.md — then re-run"`.
- Interactive: ask instead of recording; `--headless`: record and end.

### 3. Ports and configuration (no clash between sessions)
- Derive the ports from the project's base ports + the issue number (e.g. `3000 + 42`), or
  keep the defaults when only one session runs at a time.
- A port is taken (`lsof -i :<port>`) → `SS need testenv-ports decision "Port <port> is in use by <process>" "(a) stop <process> (b) use port <alternative> — <how to answer>"`.
- Missing secrets / `.env` values / credentials → `SS need testenv-access access "<what is missing>" "<where to put it>"`
  (never invent a secret). Copy `.env.example` → `.env` only for non-secret defaults.

### 4. Start (or stop) and check health
- Start with the recipe from step 2 (detached), then check: containers/processes running, the
  health URL (if any) answering, the logs free of startup errors.
- Fails after one reasonable fix attempt (e.g. a rebuild) →
  `SS need testenv-failed failure "<service> did not start: <one-line cause>" "<what to check/fix>"` with the
  last log lines in `.sessions/<ISSUE-ID>/test-env.log`.
- `down` → stop it with the same recipe and record `testEnv.status: "down"`.
- Up and healthy → record `testEnv` (above); if `testenv-*` items were resolved in this run,
  `SS status <previousStatus>`.

### 5. Report
URLs per service, where each repo's code comes from (worktree or base), how to see the logs,
stop, rebuild and seed. `--result <file>` → last action: `SS result <file> engineer:test-env`.
