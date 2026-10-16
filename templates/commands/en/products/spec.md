# Specification Creation (PRD)

This command creates the complete specification (Product Requirements Document) for the feature.

## ⚠️ IMPORTANT: This Command DOES NOT Implement Code

**This command is ONLY for requirements documentation:**
- ✅ Create PRD (Product Requirements Document)
- ✅ Update issue in the task manager via MCP
- ✅ **READ** files from main repositories (read-only)
- ❌ **DO NOT implement code**
- ❌ **DO NOT edit code files**
- ❌ **DO NOT checkout branches in main repositories**
- ❌ **DO NOT make commits**

**Next step**: `/orchestrate <ISSUE-ID>` to derive the agent graph and execute (recommended). `/start` remains a manual escape hatch.

---

## Mode and session state

**Usage**: `/spec <ISSUE-ID> [--headless] [--result <file>]` — protocol in
`agents/HEADLESS.md` (`SS` = `node .claude/bin/session-state.mjs .sessions/<ISSUE-ID>`;
item prefix `spec-`). The PRD belongs to the product stage, so the phase stays `refine`.

- On start: `SS set '{"issueId":"<ISSUE-ID>"}'` then `SS status running refine`. If `SS show`
  lists pending `spec-*` items, consume the answer first (`SS apply-approval`, see
  `agents/HEADLESS.md`) — `notes` are the person's answers.
- Default (interactive): as always. When the PRD is saved and approved: `SS status done refine`.
- **`--headless`** — no question is asked and no stakeholder review happens in the conversation:
  - No refined requirements (`refined.md` / refined issue) →
    `SS need spec-refine-missing decision "<ISSUE-ID> has no refined requirements" "(a) run /refine <ISSUE-ID> first (recommended) (b) write the PRD from the issue as it is — <how to answer>"` and end.
  - A requirement, rule or technical choice the PRD cannot settle from the refined
    requirements and the metaspecs → write it to `.sessions/<ISSUE-ID>/spec-questions.md` and
    `SS need spec-<slug> decision "<question>" "(a) … (b) … — <how to answer>" spec-questions.md`;
    end after recording all of them.
  - Nothing open → save the PRD to `.sessions/<ISSUE-ID>/prd.md` (always, in this mode) and record
    the review gate: `SS need spec-approval approval "PRD ready for approval" "Read prd.md; approve with approval.json (approved: true, adjustments in notes) and re-run /spec <ISSUE-ID> --headless — approved: false rejects" prd.md`.
  - Re-run after `spec-approval` was approved: apply the `notes` adjustments, save to the task
    manager (step "Saving the PRD", incl. the `spec_ready` trigger) and `SS status done refine`.
- **`--result <file>`**: the last action is `SS result <file> products:spec` (success, stop or
  failure).

---

## Configuration

Read `context-manifest.json` and `ai.properties.md` from the orchestrator to get repositories, base_path, and task_management_system.

## 📋 Prerequisites

- Issue refined via `/refine`
- Approval to proceed with the feature

## 📚 Load MetaSpecs

**Automatically locate MetaSpecs**:
1. Read `context-manifest.json` from the orchestrator
2. Find the repository with `"role": "metaspecs"`
3. Read `ai.properties.md` to get the `base_path`
4. The metaspecs are located at: `{base_path}/{metaspecs-repo-id}/`
5. Read relevant `index.md` files to ensure compliance with:
   - System architecture
   - Design patterns
   - Technical constraints
   - Project conventions

## 🎯 Objective

Create a complete PRD that will serve as the single source of truth for implementation.

## 📝 PRD Structure

### 1. Overview

```markdown
# [Feature Title]

## Context
[Why are we building this? What problem does it solve?]

## Objective
[What do we want to achieve with this feature?]

## Success Metrics
- [Metric 1]: [How to measure]
- [Metric 2]: [How to measure]
```

### 2. Functional Requirements

```markdown
## Functional Requirements

### RF-01: [Requirement Name]
**Description**: [Detailed description]
**Priority**: Must Have / Should Have / Could Have
**Repositories**: [affected repos]

### RF-02: [Requirement Name]
**Description**: [Detailed description]
**Priority**: Must Have / Should Have / Could Have
**Repositories**: [affected repos]
```

### 3. Non-Functional Requirements

```markdown
## Non-Functional Requirements

### Performance
- [Performance requirement]

### Security
- [Security requirement]

### Accessibility
- [Accessibility requirement]

### Scalability
- [Scalability requirement]
```

### 4. User Flows

```markdown
## User Flows

### Main Flow
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Alternative Flows
**Scenario**: [Scenario name]
1. [Step 1]
2. [Step 2]

### Error Handling
**Error**: [Error type]
**Behavior**: [How the system should react]
```

### 5. Technical Specification

```markdown
## Technical Specification

### Architecture

#### <repo-1>
- **New components**: [list]
- **Modified components**: [list]
- **APIs**: [new/modified endpoints]

#### <repo-2>
- **New components**: [list]
- **Modified components**: [list]
- **APIs**: [new/modified endpoints]

### Integrations
- **Between repos**: [how repos communicate]
- **External**: [external APIs, if any]

### Data Model
[Describe changes to data model, if any]
```

### 6. Acceptance Criteria

```markdown
## Acceptance Criteria

### Functional
- [ ] [Specific and testable criterion]
- [ ] [Specific and testable criterion]

### Technical
- [ ] Unit tests with coverage >= X%
- [ ] Integration tests implemented
- [ ] Performance within requirements
- [ ] Documentation updated

### Quality
- [ ] Code review approved
- [ ] No regressions
- [ ] Accessibility validated
```

### 7. Out of Scope

```markdown
## Out of Scope

Features that will NOT be implemented in this version:
- [Item 1]
- [Item 2]

Justification: [Why these are deferred]
```

### 8. Risks and Mitigations

```markdown
## Risks and Mitigations

### Risk 1: [Description]
- **Probability**: High / Medium / Low
- **Impact**: High / Medium / Low
- **Mitigation**: [How to mitigate]

### Risk 2: [Description]
- **Probability**: High / Medium / Low
- **Impact**: High / Medium / Low
- **Mitigation**: [How to mitigate]
```

### 9. Dependencies

```markdown
## Dependencies

### Technical
- [Technical dependency 1]
- [Technical dependency 2]

### Business
- [Business dependency 1]
- [Business dependency 2]

### Blockers
- [Blocker 1 and plan to resolve]
```

### 10. Test Plan

```markdown
## Test Plan

### Unit Tests
- [Area 1 to be tested]
- [Area 2 to be tested]

### Integration Tests
- [Scenario 1]
- [Scenario 2]

### Manual Tests
- [Scenario 1]
- [Scenario 2]
```

## 📄 Saving the PRD

**PRIORITY 1: Use MCP (Model Context Protocol)**

- Read `ai.properties.md` from the orchestrator to identify the `task_management_system`
- Use the appropriate MCP to update the issue with the PRD:
  - Add the complete PRD as a comment on the issue
  - Or attach as a file (if the task manager supports it)
  - **Move the task** — trigger `spec_ready`: follow `agents/TASK-STATUS.md` (uses the
    status YOU mapped in `ai.properties.md`, not a fixed name; skips if no task manager).
- Inform the user: "✅ PRD added to issue [ID]"

**FALLBACK: Create .md file only if MCP fails**

If MCP is unavailable or fails:
- Save to `./.sessions/<ISSUE-ID>/prd.md`
- Inform the user: "⚠️ PRD saved locally in .sessions/ (task manager not available)"

## 🔍 Review and Approval

Before finishing:
1. Review the PRD with stakeholders
2. Validate against metaspecs (if available)
3. Obtain approval to start implementation
4. **Via MCP**: Update the issue in the task manager with status "Ready for Development"
5. **Fallback**: Document approval in `./.sessions/<ISSUE-ID>/prd.md`

---

**Provided arguments**:

```
#$ARGUMENTS
```

---

## 🎯 Next Step

After PRD approval, run:

```bash
/orchestrate <ISSUE-ID>
```

This derives the minimum agent graph from the spec and executes it. `/start` + `/plan` + `/work` remain available as manual escape hatches.

This command will start feature development.
