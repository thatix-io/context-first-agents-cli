# Technical Planning

This command creates the detailed technical plan for the feature implementation.

## 📋 Prerequisites

- PRD created via `/spec`
- Initial analysis done via `/start`
- `context.md` and `architecture.md` files created and approved

## Configuration

Read `context-manifest.json` and `ai.properties.md` from the orchestrator to get repositories, base_path, and task_management_system.

## 📍 IMPORTANT: Understand the Structure

**Workspace**:
```
<orchestrator>/.sessions/<ISSUE-ID>/
├── repo-1/          # worktree (will be used in /work)
├── repo-2/          # worktree (will be used in /work)
├── context.md       # context (immutable - READ)
├── architecture.md  # architecture (immutable - READ)
└── plan.md          # plan (mutable - CREATE)
```

**Main repositories** (read-only):
```
{base_path}/repo-1/  # main repo (branch main/master)
{base_path}/repo-2/  # main repo (branch main/master)
```

**GOLDEN RULE**:
- ✅ Read `context.md` and `architecture.md` (immutable)
- ✅ Create `plan.md` in `.sessions/<ISSUE-ID>/`
- ✅ Read code from main repositories (read-only)
- ❌ NEVER checkout main repositories
- ❌ NEVER modify `context.md` or `architecture.md`

## ⚠️ IMPORTANT: Immutable Files

**This command must READ but NOT MODIFY:**
- ✅ **READ** `.sessions/<ISSUE-ID>/context.md` (immutable)
- ✅ **READ** `.sessions/<ISSUE-ID>/architecture.md` (immutable)
- ✅ **CREATE** `.sessions/<ISSUE-ID>/plan.md` (mutable - will be updated during `/work`)
- ❌ **DO NOT modify `context.md` or `architecture.md`**

## 📚 Load MetaSpecs

**Automatically locate MetaSpecs**:
1. Read `context-manifest.json` from the orchestrator
2. Find the repository with `"role": "metaspecs"`
3. Read `ai.properties.md` to get the `base_path`
4. The metaspecs are at: `{base_path}/{metaspecs-repo-id}/`
5. Read the relevant `index.md` files to ensure compliance with:
   - System architecture
   - Design and code patterns
   - Folder and file structure
   - Naming conventions

## 🎯 Goal

Create a detailed technical plan that will guide the implementation, dividing the work into smaller, sequential units.

## 📝 Plan Structure

### 1. Technical Overview

```markdown
# Technical Plan - [Feature Title]

## Summary
[Brief technical description of what will be implemented]

## Involved Repositories
- **<repo-1>**: [Role in this feature]
- **<repo-2>**: [Role in this feature]

## Technical Approach
[General implementation strategy]
```

### 2. Solution Architecture

```markdown
## Architecture

### Component Diagram
[Textual description or ASCII art of components and their relationships]

### Data Flow
1. [Step 1 of the flow]
2. [Step 2 of the flow]
3. [Step 3 of the flow]

### Integrations
- **<repo-1> → <repo-2>**: [How they communicate]
- **System → External API**: [If any]
```

### 3. Technical Decisions

```markdown
## Technical Decisions

### Decision 1: [Title]
**Context**: [Why we need to decide this]
**Considered options**:
- Option A: [Pros and cons]
- Option B: [Pros and cons]
**Decision**: [Chosen option]
**Justification**: [Why we chose this option]

### Decision 2: [Title]
[Same format as above]
```

### 4. Implementation Plan

Divide the work into small, sequential units:

```markdown
## Implementation Plan

### Phase 1: [Phase Name]
**Goal**: [What will be achieved in this phase]
**Repositories**: [affected repos]

#### Task 1.1: [Description]
- **Repo**: <repo-1>
- **Files**: [files to create/modify]
- **Description**: [What to do]
- **Tests**: [Tests to implement]
- **Estimate**: [estimated time]

#### Task 1.2: [Description]
- **Repo**: <repo-2>
- **Files**: [files to create/modify]
- **Description**: [What to do]
- **Tests**: [Tests to implement]
- **Estimate**: [estimated time]

### Phase 2: [Phase Name]
[Same format as above]

### Phase 3: [Phase Name]
[Same format as above]
```

### 5. File Structure

For each repository, define the structure:

```markdown
## File Structure

### <repo-1>
```
src/
├── components/
│   ├── NewComponent.tsx (CREATE)
│   └── ExistingComponent.tsx (MODIFY)
├── services/
│   └── NewService.ts (CREATE)
└── tests/
    └── NewComponent.test.tsx (CREATE)
```

### <repo-2>
```
src/
├── controllers/
│   └── NewController.ts (CREATE)
└── tests/
    └── NewController.test.ts (CREATE)
```
```

### 6. APIs and Contracts

```markdown
## APIs and Contracts

### New Endpoints

#### POST /api/resource
**Request**:
```json
{
  "field1": "string",
  "field2": "number"
}
```

**Response**:
```json
{
  "id": "string",
  "status": "string"
}
```

### Modified Endpoints

#### GET /api/resource/:id
**Changes**: [What changes]
**Breaking Change**: Yes / No
```

### 7. Testing Strategy

```markdown
## Testing Strategy

### Unit Tests
- **<repo-1>**: [Components/functions to test]
- **<repo-2>**: [Components/functions to test]

### Integration Tests
- **Scenario 1**: [Description and involved repos]
- **Scenario 2**: [Description and involved repos]

### E2E Tests (if applicable)
- **Flow 1**: [Description]
- **Flow 2**: [Description]
```

### 8. Technical Risks

```markdown
## Technical Risks

### Risk 1: [Description]
- **Impact**: High / Medium / Low
- **Probability**: High / Medium / Low
- **Mitigation**: [How to mitigate]
- **Plan B**: [Alternative if it occurs]

### Risk 2: [Description]
[Same format as above]
```

### 9. Implementation Checklist

```markdown
## Implementation Checklist

### Phase 1
- [ ] Task 1.1
- [ ] Task 1.2
- [ ] Phase 1 Tests

### Phase 2
- [ ] Task 2.1
- [ ] Task 2.2
- [ ] Phase 2 Tests

### Phase 3
- [ ] Task 3.1
- [ ] Task 3.2
- [ ] Phase 3 Tests

### Finalization
- [ ] Documentation updated
- [ ] Code review
- [ ] Integration tests
- [ ] PR created
```

## 📄 Saving the Plan

Save it in `./.sessions/<ISSUE-ID>/plan.md`

## 🔍 Review

Review the plan checking:
- All tasks are clear and executable
- Dependencies between tasks are identified
- Estimates are realistic
- Risks have been considered
- Testing strategy is adequate

---

**Provided arguments**:

```
#$ARGUMENTS
```

---

## 🎯 Next Step

After plan approval:

```bash
/work
```

This command will start executing the first work unit of the plan.
