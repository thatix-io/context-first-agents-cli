# Start Development

This command initiates the development of a feature in the current workspace.

## 📍 IMPORTANT: Understand the Structure

**Workspace** (where you will work):
```
<orchestrator>/.sessions/<ISSUE-ID>/
├── repo-1/          # worktree with branch feature/<ISSUE-ID>
├── repo-2/          # worktree with branch feature/<ISSUE-ID>
├── context.md       # context (immutable - created by this command)
├── architecture.md  # architecture (immutable - created by this command)
└── plan.md          # plan (mutable - created by /plan)
```

**Main Repositories** (read-only):
```
{base_path}/repo-1/  # main repo (branch main/master)
{base_path}/repo-2/  # main repo (branch main/master)
```

**GOLDEN RULE**:
- ✅ Read metaspecs and code from main repositories (read-only)
- ✅ Create `context.md` and `architecture.md` in `.sessions/<ISSUE-ID>/`
- ❌ NEVER checkout main repositories
- ❌ NEVER modify code in this command (use `/work` later)

## Configuration

Read `context-manifest.json` and `ai.properties.md` from the orchestrator to get repositories, base_path, and task_management_system.

## 📚 Load MetaSpecs

**Automatically locate MetaSpecs**:
1. Read `context-manifest.json` from the orchestrator
2. Find the repository with `"role": "metaspecs"`
3. Read `ai.properties.md` to get the `base_path`
4. The metaspecs are at: `{base_path}/{metaspecs-repo-id}/`
5. Read relevant `index.md` files:
   - Business context
   - Stack, architecture, and technical patterns
   - Project conventions
   - ADRs (Architecture Decision Records)

## 🎯 Project Context

Before starting, load the context by consulting:
- `context-manifest.json` - Repository structure
- MetaSpecs (located above) - Architecture and patterns
- `workspace directory` - Current workspace information

## ⚙️ Initial Setup

1. **Verify Workspace**:
   - Confirm you are in the correct workspace (check `workspace directory`)
   - List repositories available in the workspace

2. **Check Branches**:
   - For each repository in the workspace, check the current branch
   - Confirm all branches are synchronized

3. **Load Specification**:
   - **If task manager configured**: Read the issue using the appropriate MCP
   - **Otherwise**: Ask the user for the specification file or feature description

4. **Update Status** (if task manager configured):
   - Move the issue to "In Progress"

## 📋 Analysis and Understanding

Analyze the specification and build a complete understanding by answering:

### Business
- **Why** is this being built?
- **Who** benefits?
- **Which** metric do we want to impact?

### Functional
- **What is the expected outcome?** (user behavior, system output)
- **Which components** will be created/modified in each repository?
- **Which integrations** between repositories are necessary?

### Technical
- **Approved stack?** Check against technical specifications
- **Architectural patterns?** Check ADRs (if available)
- **New dependencies?** Justify and document
- **How to test?** (according to project standards)

### Validation against MetaSpecs

If metaspecs are available, validate:
- Aligned with strategy and roadmap?
- Uses approved technology stack?
- Respects Architecture Decision Records?
- Follows documented business rules?

## 🤔 Clarification Questions

After initial analysis, formulate **3-5 most important clarifications**:

**Examples of relevant questions**:
- Which repository should contain the main logic?
- How should repositories communicate?
- Are there dependencies between changes in different repos?
- What is the recommended implementation order?
- Is there impact on APIs or contracts between services?

## 💾 Creation of Context.md

**IMPORTANT**: This file is **IMMUTABLE** after approval. It must not be modified by subsequent commands.

Create file `./.sessions/<ISSUE-ID>/context.md` with:

```markdown
# Context: [Feature Name]

## Why
[Business value, persona served, impacted metric]

## What
[Main functionalities, expected behavior]

## How
[Technical approach, components, affected repositories]

## Validation against MetaSpecs
- [x] Aligned with product strategy
- [x] Serves correct persona
- [x] Impacted metric documented
- [x] Uses approved stack
- [x] Respects ADRs
- [x] No conflicts with known limitations

## Dependencies
[Libraries, APIs, existing components]

## Constraints
[Technical limitations, performance targets, budget]

## Tests
[Critical E2E, necessary unit tests, expected coverage]
```

**After creating `context.md`, request user review and approval before proceeding.**

---

## 🏗️ Creation of Architecture.md

**IMPORTANT**: This file is **IMMUTABLE** after approval. It must not be modified by subsequent commands.

### Architectural Principles (MANDATORY)

**BEFORE creating the architecture, you MUST:**

1. **Read ADRs (Architecture Decision Records)**:
   - List ADRs in metaspecs
   - Read ALL ADRs relevant to the feature
   - Identify mandatory constraints and patterns

2. **Consult architectural patterns**:
   - Read project structure guides in metaspecs
   - Read coding patterns in metaspecs
   - Identify existing patterns in code (use Glob/Grep to find similar examples)

3. **Validate compliance with ADRs**:
   - For each relevant ADR, check if the proposed solution respects the decisions
   - Document compliance in architecture.md
   - If violation exists, justify or propose correction

4. **Analyze existing code**:
   - Use Glob/Grep to find similar components/modules
   - Understand existing patterns and structures
   - Align new implementation with project standards

### Architecture Document Structure

Create file `./.sessions/<ISSUE-ID>/architecture.md` with:

```markdown
# Architecture: [Feature Name]

## Overview
[High-level view of the system before and after the change]

## Affected Components
[List of components and their relationships, dependencies]

### Component Diagram
[Textual description or Mermaid diagram of components]

### Data Flow
1. [Step 1 of the flow]
2. [Step 2 of the flow]
3. [Step 3 of the flow]

## Proposed Directory Structure
[Based on project patterns]

```
repo-1/
├── src/
│   ├── components/
│   │   └── NewComponent.tsx (CREATE)
│   └── services/
│       └── NewService.ts (CREATE)
```

## Patterns and Best Practices
[Patterns to be maintained or introduced]

## ADR Validation
[List of consulted ADRs and compliance]

- [x] ADR-001: [Name] - Compliant
- [x] ADR-002: [Name] - Compliant

## External Dependencies
[Libraries to be used or added]

## Technical Decisions

### Decision 1: [Title]
**Context**: [Why we need to decide this]
**Options considered**:
- Option A: [Pros and cons]
- Option B: [Pros and cons]
**Decision**: [Chosen option]
**Justification**: [Why we chose this option]

## Constraints and Assumptions
[Technical limitations and premises]

## Trade-offs
[Alternatives considered and why they were not chosen]

## Consequences
**Positive**:
- [Benefit 1]
- [Benefit 2]

**Negative**:
- [Cost/limitation 1]
- [Cost/limitation 2]

## Main Files
[List of main files to be edited/created]

- `repo-1/src/components/NewComponent.tsx` (CREATE)
- `repo-1/src/services/NewService.ts` (CREATE)
- `repo-2/src/controllers/NewController.ts` (CREATE)
```

**After creating `architecture.md`, request user review and approval before proceeding.**

---

**Provided arguments**:

```
#$ARGUMENTS
```

---

## 🎯 Next Step

**After user approval of `context.md` and `architecture.md` files**:

```bash
/plan
```

This command will create the detailed technical implementation plan.

---

## ⚠️ IMPORTANT: Immutable Files

**`context.md` and `architecture.md` are IMMUTABLE after approval.**

- ✅ They can be READ by subsequent commands (`/plan`, `/work`)
- ❌ They MUST NOT be MODIFIED by any command
- ❌ If changes are needed, discuss with the user and create new files or update the issue in the task manager
