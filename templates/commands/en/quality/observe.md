# Decision Observability

This command records important decisions made during development, creating an auditable log for explainability and traceability.

## 🎯 Objective

Create a structured record of technical and product decisions, ensuring:
- **Explainability**: Why each decision was made
- **Traceability**: Which sources (PRD, metaspecs, ADRs) supported the decision
- **Audit**: Complete history of choices for future review
- **Learning**: Documentation of trade-offs and alternatives considered

**IMPORTANT**: This command DOES NOT generate new decisions. It only RECORDS decisions that have already been made during the development process.

## Configuration

Read `context-manifest.json` and `ai.properties.md` from the orchestrator to get repositories, base_path, and task_management_system.

## 📋 Prerequisites

- Have executed at least one of the commands that generate decisions:
  - `/spec` - generates PRD with product decisions
  - `/plan` - generates plan.md with technical decisions
  - `/work` - implementation generates decisions during development

## 🔍 Observation Process

### 1. Identify Relevant Decisions

Analyze the session files (`./.sessions/<ISSUE-ID>/`) to identify decisions:

**After `/spec`** - Product Decisions:
- Read `./.sessions/<ISSUE-ID>/prd.md`
- Identify decisions in:
  - Scope (what is included/excluded in the feature)
  - Personas served (who is the target audience)
  - Success metrics (how to measure results)
  - Non-functional requirements (performance, accessibility)
  - Constraints and trade-offs

**After `/plan`** - Technical Decisions:
- Read `./.sessions/<ISSUE-ID>/plan.md`
- Identify decisions in:
  - Component/module architecture
  - Choice of libraries or tools
  - Implementation patterns
  - Data structure
  - Testing strategy

**During `/work`** - Implementation Decisions:
- Read `./.sessions/<ISSUE-ID>/work.md`
- Identify decisions in:
  - Refactorings performed
  - Approach changes
  - Applied optimizations
  - Edge case handling

### 2. Document Each Decision

For each identified decision, document:

```markdown
## Decision: [Clear Title]

**Context**: [Why do we need to decide this? What is the problem or need?]

**Options Considered**:
1. **Option A**: [Description]
   - Pros: [advantages]
   - Cons: [disadvantages]
2. **Option B**: [Description]
   - Pros: [advantages]
   - Cons: [disadvantages]

**Decision**: [Chosen option]

**Justification**: [Why did we choose this option? Which criteria were most important?]

**Sources**:
- [PRD section X]
- [Metaspec Y]
- [ADR-00Z]

**Accepted Trade-offs**: [Which disadvantages did we consciously accept?]

**Reversibility**: Easy / Medium / Hard

**Date**: [decision date]
```

### 3. Create Decision Log

Save in `./.sessions/<ISSUE-ID>/decisions.md`:

```markdown
# Decision Log - [ISSUE-ID]

## Summary
[Brief summary of the main decisions made in this feature]

## Product Decisions

### [Decision 1]
[As per template above]

### [Decision 2]
[As per template above]

## Technical Decisions

### [Decision 3]
[As per template above]

### [Decision 4]
[As per template above]

## Implementation Decisions

### [Decision 5]
[As per template above]

## Lessons Learned
- [Lesson 1]
- [Lesson 2]

## Pending Decisions
- [Decision that still needs to be made]
```

## 📊 Impact Analysis

For critical decisions, document the impact:

```markdown
## Impact Analysis

**Affected Repositories**: [list]

**Impacted Components**: [list]

**Created Dependencies**: [list]

**Introduced Risks**: [list]

**Applied Mitigations**: [list]
```

## 🔄 Decision Review

Periodically review the decisions made:
- Do they still make sense?
- Have the trade-offs proven correct?
- Are there learnings to document?
- Does any decision need to be reversed?

---

**Provided arguments**:

```
#$ARGUMENTS
```

---

## 🎯 Outcome

After running this command, you will have:
- Complete decision log in `./.sessions/<ISSUE-ID>/decisions.md`
- Traceability of every choice made
- Documentation for future reference
- Basis for ADRs (if decisions are architectural)
