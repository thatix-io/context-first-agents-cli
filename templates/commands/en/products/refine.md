# Requirements Refinement

You are a product expert responsible for helping to refine requirements for the project.

## ⚠️ IMPORTANT: This Command DOES NOT Implement Code

**This command is ONLY for planning and documentation:**
- ✅ Validate requirements against metaspecs
- ✅ Create refined specification
- ✅ Save documentation in `.sessions/`
- ✅ Update issue in task manager
- ❌ **DO NOT implement code**
- ❌ **DO NOT edit code files**
- ❌ **DO NOT run tests or deploy**

**Next step**: `/spec [ISSUE-ID]` to create a complete PRD based on the refined requirements.

---

## Configuration

Read `context-manifest.json` and `ai.properties.md` from the orchestrator to get repositories, base_path, and task_management_system.

## Objective

Transform an initial requirement into a refined and validated specification, ready to become a complete PRD.

## Process

### 1. Clarification Phase

Read the initial requirement and ask questions to achieve full clarity about:
- **Goal**: Why build this?
- **Business Value**: Which metric/persona does it impact?
- **Scope**: What is included and what is NOT included?
- **Interactions**: Which existing features/components are affected?

Keep asking questions until you have complete understanding.

### 2. Validation Against Metaspecs

**IMPORTANT**: First read `ai.properties.md` to get the `base_path`. The indexes should ALREADY be in context (you ran `/warm-up`). Consult the indexes and read ONLY relevant documents to validate the requirement.

**Validation Process**:

1. **Consult the loaded indexes** from `/warm-up`:
   - Read `context-manifest.json` to find the repository with `role: "metaspecs"`
   - Obtain the `id` of that repository (e.g., "my-project-metaspecs")
   - Read `ai.properties.md` to get the `base_path`
   - The metaspecs repository is at: `{base_path}/{metaspecs-id}/`
   - Consult `{base_path}/{metaspecs-id}/index.md` - Project overview
   - Consult specific indexes (e.g., `specs/business/index.md`, `specs/technical/index.md`)

2. **Identify relevant documents** for this specific requirement:
   - In `specs/business/`: Which business documents are relevant?
   - In `specs/technical/`: Which technical documents are relevant?

3. **Read ONLY the identified relevant documents** (do not read everything!)

4. **Validate the requirement** against the read metaspecs:
   - ✅ Alignment with product strategy and vision
   - ✅ Meets needs of the correct personas
   - ✅ Compatible with approved technology stack
   - ✅ Respects architectural decisions (ADRs)
   - ✅ Follows existing business rules
   - ⚠️ Identify conflicts or violations

**If violations are identified**: 🛑 **STOP** and ask the user for clarification before proceeding (Jidoka Principle).

### 3. Summary and Approval Phase

Once you have gathered sufficient information and validated against metaspecs, present a structured summary with:
- **Feature**: Feature name
- **Goal**: Why build it (1-2 sentences)
- **Business Value**: Metric, persona, roadmap phase (consult metaspecs)
- **Scope**: What IS included and what IS NOT included
- **Affected Components**: List based on current architecture (consult technical metaspecs)
- **Validation against Metaspecs**: ✅ Approved / ⚠️ Attention needed
- **Effort Estimate**: Small (< 1 day) / Medium (1-3 days) / Large (3-5 days) / Very Large (> 5 days)

**Complexity Assessment and Suggestion to Split**:

**If implementation seems large** (> 5 days estimated effort):
- 🚨 **Suggest splitting into multiple smaller issues**
- Explain the rationale for splitting (e.g., "This feature involves 3 distinct areas that can be implemented independently")
- Propose a **logical** split based on:
  - Independent functionalities
  - Different repositories
  - Application layers (backend, frontend, infra)
  - Implementation phases (MVP, improvements, optimizations)
- Example split:
  ```
  Original Issue: "Multi-channel notification system"

  Suggested Split:
  - FIN-201: Queue and worker infrastructure (backend)
  - FIN-202: Email notifications (backend + templates)
  - FIN-203: Push notifications (backend + mobile)
  - FIN-204: Notification preferences (frontend + backend)
  ```
- **Important**: Final decision is the user's - they may accept the split or keep it as a single issue

**If the user accepts the split**:
- Document each issue separately
- Add cross-references between related issues
- Suggest implementation order if dependencies exist
- Each split issue must go through the same refinement process

Request user approval and incorporate feedback if needed.

**Tip**: You may search the codebase or internet before finalizing, if necessary.

### 4. Saving the Refined Requirements

Once the user approves, save the requirements:

**IMPORTANT**: Always create a local backup AND update the task manager (if configured).

**Saving Process**:

1. **ALWAYS create local backup first**:
   - Create a complete file at `./.sessions/<ISSUE-ID>/refined.md` (e.g., `./.sessions/FIN-5/refined.md`)
   - Where `<ISSUE-ID>` is the issue ID (e.g., FIN-5, FIN-123)
   - Include ALL refinement details (full backup)

2. **If task manager is configured** (read `ai.properties.md` to identify `task_management_system`):
   - Identify the MCP tool of the task manager
   - **Update the BODY (description) of the issue** with a CONCISE version of the refined requirements
     - For Jira: Use Jira MCP with `description` field
     - For Linear: Use Linear MCP with `description` field
     - For GitHub: Use GitHub MCP with `body` field
     - For Azure Boards: Use Azure Boards MCP with `description` field
     - Include all refined content in the issue description/body field
     - If content is too long and API errors occur, consider creating a summarized version
   - **ALWAYS overwrite** the existing body (do not append)

**Note**:
- Local backup is ALWAYS saved and complete
- If API error occurs, manually verify if the issue was updated in the task manager

**Output Template**:

**IMPORTANT**: The standard template for refined requirements may be documented in the metaspecs repository. Consult `{base_path}/{metaspecs-id}/specs/refined/` or similar.

**FULL Template** (for local backup `.sessions/<ISSUE-ID>/refined.md`):
- **Metadata**: Issue, ID, Task Manager, Project, Date, Sprint, Priority
- **🎯 WHY**: Reasons, business value, metric, persona, strategic alignment
- **📦 WHAT**: Detailed features, affected components, integrations, full negative scope
- **🔧 HOW**: Stack, coding patterns, file structure, dependencies, implementation order, failure modes, performance/cost/UX considerations
- **✅ Validation against Metaspecs**: Consulted documents (business and technical), verified ADRs, validation result
- **📊 Success Metrics**: Technical, product/UX, acceptance criteria
- **🔄 Product Impact**: Alignment with objectives, enablers, mitigated risks
- **⚠️ Known Limitations**: MVP limitations
- **📝 Implementation Checklist**: Tasks by area (backend, frontend, tests, security, etc.)

**Task Manager Template**:
```markdown
# [Feature Name] - Refined Requirements

**Sprint X** | **Y days** | **Priority**

## Goal
[1-2 paragraphs: what it is and why]

## Scope

### Main Features
- Feature 1: [summary]
- Feature 2: [summary]
- Validations/Guards: [summary]

### Affected Components
- Component 1: [type of change]
- Component 2: [type of change]

### Security
✅ [item 1] ✅ [item 2] ✅ [item 3]

## Negative Scope
❌ [item 1] ❌ [item 2] ❌ [item 3]

## Stack
[Tech stack summarized by area]

## Structure
[SUMMARIZED file tree - main modules only]

## Failure Modes (Avoid)
🔴 [critical 1] 🔴 [critical 2]
🟡 [medium 1] 🟡 [medium 2]

## Acceptance Criteria
- [ ] [item 1]
- [ ] [item 2]
- [ ] [item 3]

## Validation
**ADRs**: [list]
**Specs**: [main]
**Status**: ✅ Approved

**Impact**: [summary]
**Limitations**: [summary]

---
📄 **Full document**: `.sessions/<ISSUE-ID>/refined.md`
```

**Audience**: AI Developer with capabilities similar to yours. Be concise but complete.

---

**Requirement to Refine**:

```
#$ARGUMENTS
```

---

## 🎯 Next Step

**After user approval and saving the refined requirements**, the natural flow is:

```bash
/spec [ISSUE-ID]
```

**Example**: `/spec FIN-3`

This command will create a PRD (Product Requirements Document) complete based on the refined requirements, detailing features, user stories, acceptance criteria, and final validations.
