# Validation Against MetaSpecs

This command validates requirements, decisions, or implementations against the project's metaspecs.

## ⚠️ IMPORTANT: Mode of Operation

**This command is for VALIDATION:**
- ✅ Validate against metaspecs
- ✅ **READ** files from repositories (read-only)
- ✅ Generate validation report
- ❌ **DO NOT checkout branches in main repositories**
- ❌ **DO NOT modify code**
- ❌ **DO NOT modify `context.md` or `architecture.md`**

## Configuration

Read `context-manifest.json` and `ai.properties.md` from the orchestrator to get repositories, base_path, and task_management_system.

## 🎯 Objective

Ensure alignment with:
- Product strategy
- Technical architecture
- Standards and conventions
- ADRs (Architecture Decision Records)

## 📋 When to Use

Run this command:
- After `/spec` - validate PRD
- After `/plan` - validate technical plan
- During `/work` - validate implementation decisions
- Before `/pr` - final validation

## 📚 Load MetaSpecs

**Automatically locate MetaSpecs**:
1. Read `context-manifest.json` from the orchestrator
2. Find the repository with `"role": "metaspecs"`
3. Read `ai.properties.md` to get the `base_path`
4. The metaspecs are located at: `{base_path}/{metaspecs-repo-id}/`

## 🔍 Validation Process

### 1. Identify Available MetaSpecs

Navigate to the metaspecs directory and identify which metaspecs exist:

```bash
ls -la {base_path}/{metaspecs-repo-id}/
```

### 2. Business Validation

If business metaspecs exist (`MetaSpecs repository (business section)`):

```markdown
## Business Validation

### Product Strategy
- **File**: `MetaSpecs repository (business section)PRODUCT_STRATEGY.md`
- **Validation**: [Is this feature aligned with the strategy?]
- **Status**: ✅ Aligned / ⚠️ Partial / ❌ Misaligned
- **Notes**: [Observations]

### Personas
- **File**: `MetaSpecs repository (business section)CUSTOMER_PERSONAS.md`
- **Validation**: [Does it meet the correct persona?]
- **Status**: ✅ Aligned / ⚠️ Partial / ❌ Misaligned
- **Notes**: [Observations]

### Metrics
- **File**: `MetaSpecs repository (business section)PRODUCT_METRICS.md`
- **Validation**: [Is the success metric documented?]
- **Status**: ✅ Aligned / ⚠️ Partial / ❌ Misaligned
- **Notes**: [Observations]
```

### 3. Technical Validation

If technical metaspecs exist (`MetaSpecs repository (technical section)`):

```markdown
## Technical Validation

### Technology Stack
- **File**: `MetaSpecs repository (technical section)meta/stack.md`
- **Validation**: [Uses only approved technologies?]
- **Status**: ✅ Compliant / ⚠️ Justified exception / ❌ Non-compliant
- **Notes**: [Technologies used and justifications]

### Architecture
- **File**: `MetaSpecs repository (technical section)ARCHITECTURE.md`
- **Validation**: [Follows architectural standards?]
- **Status**: ✅ Compliant / ⚠️ Partial / ❌ Non-compliant
- **Notes**: [Observations]

### ADRs (Architecture Decision Records)
- **Directory**: `MetaSpecs repository (technical section)adr/`
- **Validation**: [Respects documented architectural decisions?]
- **Relevant ADRs**: [List of verified ADRs]
- **Status**: ✅ Compliant / ⚠️ Minor conflict / ❌ Critical conflict
- **Notes**: [Observations]

### Business Rules
- **File**: `MetaSpecs repository (technical section)BUSINESS_LOGIC.md`
- **Validation**: [Implements business rules correctly?]
- **Status**: ✅ Compliant / ⚠️ Partial / ❌ Non-compliant
- **Notes**: [Observations]
```

### 4. Standards Validation

```markdown
## Standards Validation

### Code
- **File**: `MetaSpecs repository (technical section)CODE_STANDARDS.md`
- **Validation**: [Follows code standards?]
- **Status**: ✅ Compliant / ⚠️ Minor deviations / ❌ Non-compliant

### Tests
- **File**: `MetaSpecs repository (technical section)TEST_STANDARDS.md`
- **Validation**: [Adequate testing strategy?]
- **Status**: ✅ Compliant / ⚠️ Partial / ❌ Non-compliant

### Documentation
- **File**: `MetaSpecs repository (technical section)DOC_STANDARDS.md`
- **Validation**: [Adequate documentation?]
- **Status**: ✅ Compliant / ⚠️ Partial / ❌ Non-compliant
```

### 5. Conflict Identification

If conflicts or misalignments exist:

```markdown
## Identified Conflicts

### Conflict 1: [Description]
- **Severity**: Critical / High / Medium / Low
- **Metaspec**: [Violated file]
- **Description**: [Conflict details]
- **Recommendation**: [How to resolve]

### Conflict 2: [Description]
[Same format as above]
```

### 6. Justified Exceptions

If there are justified deviations:

```markdown
## Justified Exceptions

### Exception 1: [Description]
- **Metaspec**: [Deviated file]
- **Deviation**: [What is different]
- **Justification**: [Why it is necessary]
- **Approval**: [Who approved]
- **Documentation**: [Where it was documented]
```

## 📄 Saving the Validation Report

**PRIORITY 1: Use MCP (Model Context Protocol)**

- Read `ai.properties.md` from the orchestrator to identify the `task_management_system`
- Use the appropriate MCP to add the report to the issue:
  - Add as a comment on the issue
  - Update labels/tags according to the result (e.g., "validated", "needs-adjustment", "blocked")
  - If critical conflicts exist, update the issue status
- Inform the user: "✅ Validation report added to issue [ID]"

**FALLBACK: Create .md file only if MCP fails**

If MCP is unavailable or fails, create `./.sessions/<ISSUE-ID>/check-report.md`:

```markdown
# Validation Report - [ISSUE-ID]

**Date**: [date/time]
**Phase**: [spec/plan/work/pre-pr]

## Overall Status
✅ Validated / ⚠️ Validated with reservations / ❌ Not validated

## Validations Performed
- Business: ✅ / ⚠️ / ❌
- Technical: ✅ / ⚠️ / ❌
- Standards: ✅ / ⚠️ / ❌

## Conflicts
[List of conflicts, if any]

## Exceptions
[List of justified exceptions, if any]

## Recommendations
1. [Recommendation 1]
2. [Recommendation 2]

## Approval
- [ ] Approved to proceed
- [ ] Requires adjustments
- [ ] Blocked
```

Inform the user: "⚠️ Report saved locally in .sessions/ (task manager not available)"

## 🚨 Action in Case of Conflicts

If critical conflicts are found:
1. 🛑 **STOP** the current process
2. 📝 **DOCUMENT** all conflicts
3. 💬 **ALERT** the user and stakeholders
4. **Via MCP**: Update issue status to "Blocked" or "Requires Adjustments"
5. 🔄 **ADJUST** plan/implementation as needed
6. ✅ **REVALIDATE** after adjustments

---

**Provided arguments**:

```
#$ARGUMENTS
```

---

## 🎯 Outcome

After validation:
- If ✅: Proceed to the next phase
- If ⚠️: Document reservations and proceed with approval
- If ❌: Fix conflicts before proceeding
