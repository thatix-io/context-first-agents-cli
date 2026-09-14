# Pull Request Preparation

This command validates that everything is ready to create Pull Requests.

## 📋 Prerequisites

- Complete implementation (all tasks from `/plan` executed)
- All commits made
- Clean and organized workspace

## Configuration

Read `context-manifest.json` and `ai.properties.md` from the orchestrator to get repositories, base_path, and task_management_system.

## 🎯 Objective

Ensure that the implementation is complete, tested, and ready for review before creating PRs.

## 🛑 CRITICAL: WHERE TO WORK

**⚠️ ATTENTION: ALL CODE (tests, fixes, adjustments) MUST BE CREATED INSIDE THE WORKTREE!**

**✅ CORRECT** - Work inside the worktree:
```
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/src/file.ts  ✅
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/tests/test.ts  ✅
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/.eslintrc.js  ✅
```

**❌ WRONG** - NEVER create code outside the worktree:
```
<orchestrator>/.sessions/test.ts  ❌
<orchestrator>/.sessions/<ISSUE-ID>/test.ts  ❌
{base_path}/<repo-name>/test.ts  ❌ (main repository!)
```

**ABSOLUTE RULE**:
- 🛑 **ALL code** (tests, fixes, configurations) **MUST be in** `<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/`
- 🛑 **NEVER modify** the main repository in `{base_path}/<repo-name>/`
- ✅ **Work ONLY** inside the worktree of the specific repository

## ✅ Validation Checklist

### 1. Implementation Completeness

```markdown
## Completeness Check

- [ ] All plan tasks have been executed
- [ ] All functional requirements from the PRD have been implemented
- [ ] All acceptance criteria have been met
- [ ] No functionality is half-done
```

### 2. Code Quality

For each modified repository:

```bash
cd <repository>

# Check status
git status

# Check linting (examples by stack):
# Node.js: npm run lint / yarn lint / pnpm lint
# Python: flake8 . / pylint src/ / black --check .
# Java: mvn checkstyle:check / gradle check
# Go: golangci-lint run / go vet ./...
# Ruby: rubocop
# Rust: cargo clippy
# PHP: ./vendor/bin/phpcs
# C#: dotnet format --verify-no-changes

# Check formatting (examples by stack):
# Node.js: npm run format:check / prettier --check .
# Python: black --check . / autopep8 --diff .
# Java: mvn formatter:validate
# Go: gofmt -l . / go fmt ./...
# Ruby: rubocop --format-only
# Rust: cargo fmt --check

# Check build (examples by stack):
# Node.js: npm run build / yarn build
# Python: python setup.py build
# Java: mvn compile / gradle build
# Go: go build ./...
# Ruby: rake build
# Rust: cargo build
```

Checklist:
```markdown
## Code Quality

### <repo-1>
- [ ] Linting without errors
- [ ] Correct formatting
- [ ] Build without errors
- [ ] No critical warnings

### <repo-2>
- [ ] Linting without errors
- [ ] Correct formatting
- [ ] Build without errors
- [ ] No critical warnings
```

### 3. Tests

For each repository:

```bash
cd <repository>

# Run unit tests (examples by stack):
# Node.js: npm run test:unit / jest / vitest
# Python: pytest tests/unit / python -m unittest
# Java: mvn test / gradle test
# Go: go test ./... -short
# Ruby: rspec spec/unit / rake test:unit
# Rust: cargo test --lib
# PHP: ./vendor/bin/phpunit --testsuite=unit
# C#: dotnet test --filter Category=Unit

# Run integration tests (examples by stack):
# Node.js: npm run test:integration
# Python: pytest tests/integration
# Java: mvn verify / gradle integrationTest
# Go: go test ./... -run Integration
# Ruby: rspec spec/integration
# Rust: cargo test --test '*'
# PHP: ./vendor/bin/phpunit --testsuite=integration

# Check coverage (examples by stack):
# Node.js: npm run test:coverage / jest --coverage
# Python: pytest --cov=src tests/
# Java: mvn jacoco:report / gradle jacocoTestReport
# Go: go test -cover ./...
# Ruby: rspec --coverage
# Rust: cargo tarpaulin
# PHP: ./vendor/bin/phpunit --coverage-html coverage/
```

Checklist:
```markdown
## Tests

### <repo-1>
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Adequate test coverage (>= X%)
- [ ] New tests added for new features

### <repo-2>
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Adequate test coverage (>= X%)
- [ ] New tests added for new features
```

### 4. Documentation

```markdown
## Documentation

- [ ] README updated (if necessary)
- [ ] Appropriate code comments
- [ ] API documentation updated (if there are changes)
- [ ] Changelog updated
- [ ] Technical documentation updated in metaspecs (if applicable)
```

### 5. Commits

```markdown
## Commits

- [ ] All commits have clear and descriptive messages
- [ ] Commits follow the project standard (conventional commits, etc.)
- [ ] No commits with generic messages ("fix", "update", etc.)
- [ ] Commits are logically organized
- [ ] No debug or temporary commits
```

### 6. Synchronization

```markdown
## Synchronization

- [ ] Branches are up to date with the base branch (main/develop)
- [ ] No merge conflicts
- [ ] Changes between repositories are synchronized
- [ ] Dependencies between repos have been tested
```

### 7. Security

```markdown
## Security

- [ ] No credentials or secrets in the code
- [ ] No sensitive data in logs
- [ ] Security dependencies have been checked
- [ ] No known vulnerabilities introduced
```

### 8. Performance

```markdown
## Performance

- [ ] No obvious performance regressions
- [ ] Costly queries/operations have been optimized
- [ ] No memory leaks introduced
- [ ] PRD performance requirements have been met
```

## 🔍 Cross Validation

If multiple repositories were modified:

```markdown
## Cross Validation

- [ ] Tested integration between repositories locally
- [ ] APIs/contracts between repos are consistent
- [ ] No undocumented breaking changes
- [ ] Deployment/merge order is clear
```

## 📄 PR Description Preparation

Create `./.sessions/<ISSUE-ID>/pr-description.md`:

```markdown
## 🎯 Objective
[Brief description of what this feature does]

## 📝 Main Changes
- [Change 1]
- [Change 2]
- [Change 3]

## 🔗 Links
- **Issue**: [ISSUE-ID]
- **PRD**: [link or path]
- **Technical Plan**: [link or path]

## ✅ Checklist
- [x] Code implemented and tested
- [x] Unit tests added/updated
- [x] Integration tests passing
- [x] Documentation updated
- [x] Linting and formatting OK
- [x] Build without errors

## 🧪 How to Test
1. [Step 1]
2. [Step 2]
3. [Expected result]

## 🔍 Notes for Reviewers
- [Point of attention 1]
- [Point of attention 2]
```

## 🚨 Issues Found → fix via agents (mini-orchestration)

If any validation fails (red tests, conflict, lint, contract break, security finding),
do **NOT** mark the task done and do **NOT** proceed to PR. Instead of fixing ad-hoc,
behave like `/orchestrate`: **reopen the session and spawn corrective agents**.

1. 🔴 **Reopen the session as ACTIVE** (so the dashboard shows work is in progress):
   - In `.sessions/<ISSUE-ID>/state.json`, set `status:"running"` and refresh `updatedAt`.
     (If missing — old-flow session — create a minimal one:
     `{ issueId, title, status:"running", createdAt, updatedAt, waves:[] }`.)
   - **Move the task** — trigger `reopened`: follow `agents/TASK-STATUS.md`.
2. 🧩 **Build a small fix graph** — one worker per problem/impacted repo, same shape as
   `/orchestrate` (archetype `implementer` to fix, `conflict-resolver` for merge conflicts,
   `tester` to revalidate). For each, create `.sessions/<ISSUE-ID>/workers/<id>.json` with
   a descriptive `name` (e.g. `fix:back-tests`, `fix:front-contract`), `status:"pending"`,
   `steps:[]`.
3. 🤖 **Spawn the agents (Task tool)** in waves, exactly like `/orchestrate`: update each
   worker's `status`/`currentStep`/`steps[]` as they work, inside the session worktree
   (never the main repo). Each agent fixes its scope and runs the tests.
4. ✅ **Only then revalidate** (run `/pre-pr` again): if it passes, mark the workers `done`,
   set `state.json.status:"done"`, and now proceed to PR. If it still fails, keep it
   `running` and repeat — the task stays ACTIVE on the dashboard until it's truly resolved.

> Golden rule: **while any fix is pending, `status` is NEVER `done`.** The task leaves the
> "active" state only when everything passes.

## 📊 Validation Report

Create `./.sessions/<ISSUE-ID>/pre-pr-report.md`:

```markdown
# Pre-PR Validation Report

**Date**: [date/time]
**Issue**: [ISSUE-ID]

## Overall Status
✅ Ready for PR / ⚠️ Pending / ❌ Blocked

## Validated Repositories
- **<repo-1>**: ✅ OK
- **<repo-2>**: ✅ OK

## Test Summary
- **Unit Tests**: X/X passing
- **Integration Tests**: Y/Y passing
- **Coverage**: Z%

## Pending Items (if any)
- [Pending item 1]
- [Pending item 2]

## Next Steps
- [x] All validations passed
- [ ] Run `/pr` to create Pull Requests
```

---

**Provided arguments**:

```
#$ARGUMENTS
```

---

## 🎯 Next Step

If all validations passed:

```bash
/pr
```

This command will create Pull Requests for all modified repositories.
