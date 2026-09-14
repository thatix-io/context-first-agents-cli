# Pull Request Creation

This command creates Pull Requests for all modified repositories in the workspace.

## 📋 Prerequisites

Before creating PRs, make sure that:
- You have run `/pre-pr` and all validations passed
- All commits have been made
- All tests are passing
- Documentation is up to date

## Configuration

Read `context-manifest.json` and `ai.properties.md` from the orchestrator to get repositories, base_path, and task_management_system.

## 🛑 CRITICAL: WHERE TO WORK

**⚠️ ATTENTION: If you need to make last-minute adjustments, ALL CODE MUST BE CREATED INSIDE THE WORKTREE!**

**✅ CORRECT** - Work inside the worktree:
```
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/src/file.ts  ✅
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/README.md  ✅
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/CHANGELOG.md  ✅
```

**❌ WRONG** - NEVER create code outside the worktree:
```
<orchestrator>/.sessions/file.ts  ❌
<orchestrator>/.sessions/<ISSUE-ID>/file.ts  ❌
{base_path}/<repo-name>/file.ts  ❌ (main repository!)
```

**ABSOLUTE RULE**:
- 🛑 **Any code adjustment** (docs, changelog, fixes) **MUST be in** `<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/`
- 🛑 **NEVER modify** the main repository at `{base_path}/<repo-name>/`
- ✅ **Work ONLY** inside the worktree of the specific repository

## 🎯 PR Creation Process

### 1. Identify Modified Repositories

For each repository in the workspace, check:
```bash
cd <repository>
git status
git log origin/main..HEAD  # See unpushed commits
```

### 2. Push Branches

For each modified repository:
```bash
cd <repository>
git push origin <branch-name>
```

### 3. Create Pull Requests

For each repository, create a PR using GitHub CLI or web interface:

**Using GitHub CLI**:
```bash
cd <repository>
gh pr create --title "[ISSUE-ID] Feature Title" \
  --body "$(cat ../.sessions/<ISSUE-ID>/pr-description.md)" \
  --base main
```

**PR Description Template**:

```markdown
## 🎯 Objective

[Brief description of what this PR does]

## 📝 Changes

### Repository: <repo-name>

- [Change 1]
- [Change 2]
- [Change 3]

## 🔗 Relationships

- **Issue**: <ISSUE-ID>
- **Related PRs**:
  - <repo-1>#<PR-number>
  - <repo-2>#<PR-number>

## ✅ Checklist

- [ ] Code implemented and tested
- [ ] Unit tests added/updated
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Peer reviewed (after PR creation)

## 🧪 How to Test

1. [Step 1]
2. [Step 2]
3. [Expected result]

## 📸 Screenshots/Demos

[If applicable, add screenshots or links to demos]

## 🔍 Notes for Reviewers

- [Point of attention 1]
- [Point of attention 2]
```

### 4. Link PRs

If there are multiple PRs (one per repository):
- Add cross-links between PRs
- Document the recommended merge order
- Indicate dependencies between PRs

### 5. Update Issue in Task Manager

If task manager is configured:
- Move the issue to "In Review" or "PR Open"
- Add PR links to the issue
- Add a comment summarizing the changes

### 6. Session Documentation

Update `./.sessions/<ISSUE-ID>/pr.md`:

```markdown
# [Feature Title] - Pull Requests

## Created PRs

### <repo-1>
- **Link**: <PR URL>
- **Status**: Open
- **Commits**: X commits

### <repo-2>
- **Link**: <PR URL>
- **Status**: Open
- **Commits**: Y commits

## Recommended Merge Order

1. <repo-1> - [Justification]
2. <repo-2> - [Justification]

## Merge Notes

- [Important note 1]
- [Important note 2]
```

## 🔍 Final Checklist

Before requesting review:
- [ ] All PRs created
- [ ] Complete and clear descriptions
- [ ] PRs linked to each other
- [ ] Issue updated in task manager
- [ ] Tests passing in CI/CD
- [ ] Complete session documentation

## 📢 Communication

Notify the team about the PRs:
- Mention relevant reviewers
- Highlight critical or breaking changes
- Indicate urgency if applicable

---

**Provided arguments**:

```
#$ARGUMENTS
```

---

## 🎯 Next Steps

1. Await PR reviews
2. Respond to comments and make adjustments
3. After approval, merge in the recommended order
4. Run `context-cli feature:end <ISSUE-ID>` to clean the workspace
