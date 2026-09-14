# Work Execution

This command executes a unit of work in the current workspace, implementing part of the technical plan.

## 📋 Prerequisites

Before executing, make sure that:
- You have run `/start` and `/plan` to have the technical plan
- You are in the correct workspace: `<orchestrator>/.sessions/<ISSUE-ID>/`
- You have the files `.sessions/<ISSUE-ID>/` available:
  - `context.md` (immutable)
  - `architecture.md` (immutable)
  - `plan.md` (mutable)

## Configuration

Read `context-manifest.json` and `ai.properties.md` from the orchestrator to get repositories, base_path, and task_management_system.

## 📍 IMPORTANT: Understand the Structure

**Workspace** (where you work):
```
<orchestrator>/.sessions/<ISSUE-ID>/
├── repo-1/          # worktree with branch feature/<ISSUE-ID>
├── repo-2/          # worktree with branch feature/<ISSUE-ID>
├── context.md       # context (immutable)
├── architecture.md  # architecture (immutable)
└── plan.md          # plan (mutable)
```

**Main repositories** (DO NOT touch):
```
{base_path}/repo-1/  # main repo (branch main/master)
{base_path}/repo-2/  # main repo (branch main/master)
```

**GOLDEN RULE**:
- ✅ Work ONLY inside `<orchestrator>/.sessions/<ISSUE-ID>/`
- ✅ Commit in the worktrees inside the workspace
- ❌ NEVER checkout branches in the main repositories
- ❌ NEVER navigate to `{base_path}/{repo-id}/`

## 🛑 CRITICAL: WHERE TO CREATE CODE

**⚠️ ATTENTION: ALL CODE MUST BE CREATED INSIDE THE REPOSITORY WORKTREE!**

**✅ CORRECT** - Create code inside the worktree:
```
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/src/file.ts  ✅
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/tests/test.ts  ✅
<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/package.json  ✅
```

**❌ WRONG** - NEVER create code directly in .sessions:
```
<orchestrator>/.sessions/src/file.ts  ❌
<orchestrator>/.sessions/<ISSUE-ID>/src/file.ts  ❌
<orchestrator>/.sessions/<ISSUE-ID>/file.ts  ❌
```

**ABSOLUTE RULE**:
- 🛑 **EVERY code file** (`.ts`, `.js`, `.py`, `.java`, etc.) **MUST be inside** `<orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/`
- 🛑 **NEVER create code** directly in `<orchestrator>/.sessions/` or `<orchestrator>/.sessions/<ISSUE-ID>/`
- ✅ **Only valid place**: Inside the repository's worktree

## ⚠️ IMPORTANT: Immutable Files

**This command must READ but NOT MODIFY:**
- ✅ **READ** `.sessions/<ISSUE-ID>/context.md` (immutable)
- ✅ **READ** `.sessions/<ISSUE-ID>/architecture.md` (immutable)
- ✅ **UPDATE** `.sessions/<ISSUE-ID>/plan.md` (mark progress)
- ✅ **IMPLEMENT** code **INSIDE THE WORKTREE**: `.sessions/<ISSUE-ID>/<repo-name>/`
- ✅ **MAKE COMMITS** in the worktrees: `.sessions/<ISSUE-ID>/<repo-name>/`
- ❌ **Do NOT modify `context.md` or `architecture.md`**
- ❌ **Do NOT checkout branches in the main repositories (outside workspace)**
- 🛑 **NEVER create code directly in `.sessions/` or `.sessions/<ISSUE-ID>/`**

## 📚 Load MetaSpecs

**Automatically locate MetaSpecs**:
1. Read `context-manifest.json` from the orchestrator
2. Find the repository with `"role": "metaspecs"`
3. Read `ai.properties.md` to get the `base_path`
4. The metaspecs are at: `{base_path}/{metaspecs-repo-id}/`
5. Read relevant `index.md` files during implementation to:
   - Follow coding standards
   - Respect defined architecture
   - Use correct conventions

## 🎯 Objective

Implement a specific unit of work from the plan, which may involve:
- Creating new files/components
- Modifying existing files
- Adding tests
- Updating documentation

## 📝 Work Process

**⚠️ IMPORTANT: PROGRESS CONTROL**

This command executes the work in **incremental phases**. After completing each **MAIN PHASE** (e.g., Phase 1 → Phase 2):

1. 🛑 **STOP** execution
2. 📊 **PRESENT** a summary of what was done
3. ❓ **ASK** the developer if they want to:
   - Review the implemented code
   - Make adjustments before continuing
   - Proceed to the next phase

**IMPORTANT**:
- ✅ **PAUSE** between main phases (Phase 1 → Phase 2 → Phase 3)
- ❌ **DO NOT pause** between subphases (Phase 1.1 → Phase 1.2 → Phase 1.3)

**DO NOT implement everything at once**. Work main phase by main phase, awaiting developer confirmation.

---

### 1. Identify Unit of Work

Based on the technical plan (`./.sessions/<ISSUE-ID>/plan.md`), identify:
- Which specific task will be implemented now
- In which repository(ies) of the workspace
- Which files will be created/modified
- Dependencies with other tasks

### 2. Implementation



**IMPORTANT**: Work ONLY inside the workspace `.sessions/<ISSUE-ID>/`

For each repository in the workspace:

```bash
# Navigate to the worktree inside the workspace
cd <orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/

# Verify you are on the correct branch
git branch  # should show * feature/<ISSUE-ID>

# Implement the code here
```

Execute the implementation following:
- **Project standards**: Consult style and architecture guides
- **Approved stack**: Use only technologies documented in the metaspecs
- **Tests**: Implement tests according to project standards
- **Documentation**: Update comments and docs when necessary



### 3. Local Validation

Before committing:
- Run unit/integration tests
- Check linting and formatting
- Confirm no existing functionality is broken



### 4. Commit

For each repository modified **inside the workspace**:

```bash
# Navigate to the worktree inside the workspace
cd <orchestrator>/.sessions/<ISSUE-ID>/<repo-name>/

# Add changes
git add .

# Commit
git commit -m "type: concise description

- Detail 1
- Detail 2

Refs: <ISSUE-ID>"
```

**Commit types**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

**⚠️ MANDATORY PAUSE**: After completing the ENTIRE main phase (identification + implementation + validation + commit + plan.md update), **STOP** and show the developer:
- Complete summary of the phase
- Files created/modified
- Commits made
- Ask if they want to review or proceed to the next phase

### 5. Update Plan.md

**FOR EACH completed task**, update `./.sessions/<ISSUE-ID>/plan.md`:

```markdown
#### 1.1 - [Task Name] [Completed ✅]
- [Detail 1]
- [Detail 2]
- [Detail 3]

**Files**:
- `path/to/file1.ts` ✅
- `path/to/file2.vue` ✅

**Tests**:
- Unit test: [Description] ✅
- Integration test: [Description] ✅

**Comments**:
- Decision: [Explanation of important technical decision]
- Learning: [Something learned during implementation]
```

**Mark task status**:
- `[Not Started ⏳]` - Task not started yet
- `[In Progress ⏰]` - Task currently being worked on
- `[Completed ✅]` - Task finished and validated

## 🔍 Quality Checklist

Before considering the unit complete:
- [ ] Code implemented and tested
- [ ] Tests passing
- [ ] Linting/formatting OK
- [ ] Documentation updated (if necessary)
- [ ] Commit made in all affected repos
- [ ] `plan.md` updated with progress and comments

## ⚠️ Jidoka Principle

If you encounter problems during implementation:
1. 🛑 **STOP** the implementation
2. 📝 **DOCUMENT** the problem found
3. 💬 **ALERT** the user and discuss solutions
4. 🔄 **ADJUST** the plan if necessary

---

**Provided arguments**:

```
#$ARGUMENTS
```

---

## 🎯 Next Steps

- **Continue implementation**: Run `/work` again for the next unit
- **Finish feature**: When everything is implemented, run `/pre-pr`

## 💡 Tips

- Work in small, incremental units
- Commit frequently (atomic commits)
- Document important decisions in the session
- Keep repositories synchronized with each other
