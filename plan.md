# Implementation Plan: Team-Matching System

## Goal

Build a **multi-variable constraint-based Team-Matching System** as a client-side web application (vanilla HTML/CSS/JS). The system enables judges to test 6 core flows: initialize goals, explore candidates, trigger matching, review explanations, dynamically adjust constraints, and verify exception handling.

---

## Proposed Changes

### Module 1 — Data Management Layer

#### [NEW] `data/candidates.json`
- ✅ **Already created** — 20 candidate profiles with multi-skill arrays, proficiency levels, experience, availability, and preferred team sizes
- Zero sensitive personal information fields (no ethnicity, religion, political views)
- Each candidate has 2-5 skills from a pool of 15 technical domains

#### [NEW] `data/project_goals.json`
- ✅ **Already created** — 3 test scenarios:
  - **Web App MVP** (easy match) — Frontend + Backend, team 2-4, min 2yr exp
  - **Secure AI Platform** (tight constraints) — ML + Cybersecurity + Cloud, team 3-5, min 8yr exp
  - **Quantum Mobile OS** (impossible match) — 4 disjoint skills, team 1-2, min 15yr exp, Expert Embedded Systems

#### [NEW] `js/dataStore.js`
- In-memory state management for candidates, project constraints, and current team
- CRUD operations for dynamically adding/removing constraints
- Schema validation ensuring no sensitive data attributes exist

---

### Module 2 — Core Matching Engine (CSP/Backtracking)

#### [NEW] `js/matchingEngine.js`

**Selected Algorithm: Constraint Satisfaction / Intelligent Backtracking** (chosen via [Tree of Thoughts analysis](file:///C:/Users/Anh%20Kiet/.gemini/antigravity/brain/01e5016d-b85a-46f3-8b7a-98dca1fe26c2/tree_of_thoughts_algorithm.md))

> [!IMPORTANT]
> Three algorithmic paradigms were evaluated: CSP/Backtracking, Greedy Filtering, and Integer Linear Programming. CSP was selected for its **correctness guarantee**, **native explainability**, and **sub-millisecond performance** on pools of 20-50 candidates.

**Architecture:**

1. **Preprocessing (Fast Fail)**
   - Global skill check: union all candidate skills → if required skills aren't a subset, immediately report missing skills
   - Filter irrelevant candidates (those with zero required skills)

2. **Recursive Backtracking Engine**
   - State: `currentTeam`, `remainingSkills`, `candidatePool`
   - Prune candidates that don't contribute uncovered skills
   - Short-circuit on first valid team found
   - Track `deepestSearchState` for failure diagnostics

3. **Validation Rules (4 mandatory conditions)**
   - No individual repeated in the team
   - Total personnel within min/max limits
   - 100% required skill coverage
   - All additional constraints satisfied

4. **Deep Failure Reporting**
   - Track closest attempt (X/Y skills covered)
   - Report exactly which skills/conditions are missing
   - Never fake data, never infinite loop, never blank screen

---

### Module 3 — Reporting & Explanation Engine

#### [NEW] `js/reportGenerator.js`
- Maps the matching engine's decision path to human-readable explanations
- **Success reports**: Shows skill → candidate mapping, why each member was selected
- **Failure reports**: Explicitly states unfulfilled constraints with specifics (e.g., "Missing required skill: Cybersecurity — no available candidate with ≥8 years experience possesses this skill")

---

### Module 4 — UI Presentation Layer

#### [NEW] `index.html`, `css/styles.css`, `js/app.js`

Interactive interface supporting all 6 judge flows:

| Flow | UI Component |
|------|-------------|
| 1. Initialize goal | Project goal form with skill picker, size sliders, constraint builder |
| 2. Explore candidates | Searchable/filterable candidate pool table with skill tags |
| 3. Trigger matching | "Find Team" button triggering the CSP engine |
| 4. Review report | Explanation panel showing skill coverage map + selection rationale |
| 5. Adjust variables | Dynamic constraint add/remove with instant re-evaluation |
| 6. Exception handling | Clear error panel showing exactly what's missing |

---

## Killer Feature: Molecular Team Crystallization

> [!TIP]
> Full proposal: [zero_to_one_feature.md](file:///C:/Users/Anh%20Kiet/.gemini/antigravity/brain/ffa772a5-7c92-48ff-ad79-b05db5ba169f/zero_to_one_feature.md)

**One-sentence pitch:** Team composition modeled as a real-time chemical bonding simulator where candidate traits act as valences that snap together or repel each other in a physics-based visual arena until an optimal, stable "molecule" (team) crystallizes.

**Cross-pollination:** Molecular Chemistry Bonding + Physics-Based Puzzle Mechanics

- Project requirements become the "Nucleus" dropped into a canvas arena
- Candidates are free-floating atoms with skill-based valences
- Spring forces model skill alignment; Coulomb forces model interpersonal chemistry
- Built with vanilla HTML5 Canvas + JS 2D physics loop — no external dependencies
- Transforms abstract team-matching into a mesmerizing, observable process

---

## Data Schema Summary

### Candidate Schema
```json
{
  "id": "string",
  "name": "string",
  "experience_years": "number (1-15)",
  "availability": "boolean",
  "skills": ["string array — 2-5 skills per candidate"],
  "proficiency_level": { "skill_name": "Beginner|Intermediate|Advanced|Expert" },
  "preferred_team_size": { "min": "number", "max": "number" },
  "past_projects_count": "number"
}
```

### Project Goal Schema
```json
{
  "project_name": "string",
  "required_skills": ["string array"],
  "team_size": { "min": "number", "max": "number" },
  "min_experience_years": "number (optional)",
  "additional_constraints": [
    { "type": "string", "value": "any", "operator": "string" }
  ],
  "priority_skills": ["string array (optional)"]
}
```

---

## Hard Rules Compliance Checklist

- [x] **No sensitive data filtering** — Schema contains zero fields for ethnicity, religion, or political views
- [x] **Multi-skill candidates** — Every candidate has 2-5 skills (no 1:1 person-skill assumption)
- [x] **Explicit failure reporting** — Missing skills/conditions are named specifically
- [x] **No fake data** — System reports errors, never fabricates results
- [x] **No infinite loops** — CSP uses pruning and bounded recursion
- [x] **No blank screens** — Every state has a defined UI output

---

## Verification Plan

### Automated Tests
- Unit tests for `matchingEngine.js`: test 100% skill coverage, no duplicates, size compliance, failure reporting
- Unit tests for `dataStore.js`: constraint CRUD, schema validation
- Unit tests for `reportGenerator.js`: success and failure report accuracy

### Manual Verification
- **Flow 1**: Create project goal "Web App MVP" → verify form populates correctly
- **Flow 2**: Browse 20 candidates → verify skill tags and filtering work
- **Flow 3**: Click "Find Team" → verify valid team returned for easy match
- **Flow 4**: Review explanation → verify skill→candidate mapping is displayed
- **Flow 5**: Add constraint "min 10yr experience" → verify team updates instantly
- **Flow 6**: Load "Quantum Mobile OS" → verify explicit error: "Cannot form team of 1-2 members with 15+ years covering Mobile Development, Embedded Systems, Data Science, UI/UX Design"

---

## Reference Artifacts

| Deliverable | Location |
|---|---|
| Plan & Solve Decomposition | [plan_and_solve_decomposition.md](file:///C:/Users/Anh%20Kiet/.gemini/antigravity/brain/3f6c54b5-75cc-4b4d-8ba7-008ceeada352/plan_and_solve_decomposition.md) |
| Tree of Thoughts Algorithm | [tree_of_thoughts_algorithm.md](file:///C:/Users/Anh%20Kiet/.gemini/antigravity/brain/01e5016d-b85a-46f3-8b7a-98dca1fe26c2/tree_of_thoughts_algorithm.md) |
| Zero-to-One Killer Feature | [zero_to_one_feature.md](file:///C:/Users/Anh%20Kiet/.gemini/antigravity/brain/ffa772a5-7c92-48ff-ad79-b05db5ba169f/zero_to_one_feature.md) |
| Candidate Data (20 profiles) | [candidates.json](file:///c:/Users/Anh%20Kiet/Downloads/SPD/data/candidates.json) |
| Project Goals (3 scenarios) | [project_goals.json](file:///c:/Users/Anh%20Kiet/Downloads/SPD/data/project_goals.json) |

---

## Approval Gate

> **Plan Approval Request:** Please review the consolidated implementation plan above — covering module decomposition, algorithm selection, killer feature, and mock data design. Reply with **"Approved"** or provide modifications. Once confirmed, I will execute Module 1 → Module 2 → Module 3 → Module 4 in sequence.
