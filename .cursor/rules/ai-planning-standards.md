---
description: Unified standards for test design — test case definitions and MCP-ready test plans
globs: ["**/*.plan.md", "**/test-cases/**/*.md", "**/*.cases.md"]
alwaysApply: true
---

# Test Plan Standards

> **Purpose**: Unified standards covering both **test case definitions** (the WHAT layer) and **MCP-ready test plan specifications** (the HOW layer). A test plan is **MCP-ready** when an MCP/LLM agent can implement every test from the plan without re-discovering locators, fixtures, preconditions, data, assertions, or wait strategies.
>
> **Scope**: This document is the single source of truth for two artifact types:
> - **Test case documents** (testomat.io style — titles + coverage + tags + Test IDs)
> - **MCP-Ready test plans** (`*.plan.md` — full per-test execution specifications)

---

## Quick Overview

**Critical Blocks** (apply to entire document):

- ⚠️ No Assumptions Policy
- ⚠️ MCP-Autonomy Requirement
- ⚠️ Compliance with `ai-coding-standards.md`
- ⚠️ Cross-Cutting Reminders (also enforced in `ai-coding-standards.md`)

**Part 1 — Foundation**:

1. Purpose, Scope & Lifecycle

**Part 2 — Test Case Definition (the WHAT layer)**:

2. Test Case Title Structure
3. Test Case ID Format
4. Test Case Organization
5. Tagging Strategy
6. Test Case Clarity Principles
7. Feature-Specific Coverage Patterns
8. Test Case Documentation Structure
9. Test Case Anti-Patterns

**Part 3 — MCP-Ready Test Plan Specification (the HOW layer)**:

10. Plan Document Structure
11. Status Tracking
12. MCP-Ready Test Specifications (CORE CONTRACT)
13. Plan Organization
14. Implementation Details
15. Data & Configuration
16. Stability Contract
17. Risks & Known Issues
18. Reference Tables

**Part 4 — Operations**:

19. Debug Commands
20. Excluded Tests
21. Revision History (template)
22. Critical Rules Reference — `ai-coding-standards.md`

**Part 5 — Final Gates**:

23. Checklists Before Finalizing
24. Quick Reference Skeletons

---

## Detailed Table of Contents

### Critical Blocks (apply to entire document)

- [⚠️ No Assumptions Policy](#️-critical-no-assumptions-policy)
- [⚠️ MCP-Autonomy Requirement](#️-critical-mcp-autonomy-requirement)
- [⚠️ Compliance with `ai-coding-standards.md`](#️-critical-compliance-with-ai-coding-standardsmd)
- [⚠️ Cross-Cutting Reminders (also enforced in `ai-coding-standards.md`)](#️-critical-cross-cutting-reminders-also-enforced-in-ai-coding-standardsmd)

### Part 1 — Foundation

- [1. Purpose, Scope & Lifecycle](#1-purpose-scope--lifecycle)
  - [1.1 Two-Layer Model: Test Cases (WHAT) vs Test Plans (HOW)](#11-two-layer-model-test-cases-what-vs-test-plans-how)
  - [1.2 The Test Design Lifecycle](#12-the-test-design-lifecycle)
  - [1.3 Two-Stage Test Plan Lifecycle (Draft → MCP-Ready)](#13-two-stage-test-plan-lifecycle-draft--mcp-ready)
  - [1.4 When to Create a Test Plan](#14-when-to-create-a-test-plan)

### Part 2 — Test Case Definition (the WHAT layer)

- [2. Test Case Title Structure](#2-test-case-title-structure)
  - [2.1 Core Formula](#21-core-formula)
  - [2.2 Title Examples](#22-title-examples)
  - [2.3 Negative Test Titles](#23-negative-test-titles)
- [3. Test Case ID Format](#3-test-case-id-format)
- [4. Test Case Organization](#4-test-case-organization)
  - [4.1 Folder Structure](#41-folder-structure)
  - [4.2 Section Organization Within Feature](#42-section-organization-within-feature)
  - [4.3 Table Format](#43-table-format)
- [5. Tagging Strategy](#5-tagging-strategy)
  - [5.1 Platform Tags](#51-platform-tags)
  - [5.2 Tagging Rules](#52-tagging-rules)
- [6. Test Case Clarity Principles](#6-test-case-clarity-principles)
  - [6.1 The "5W" Rule](#61-the-5w-rule)
  - [6.2 Specificity Requirements](#62-specificity-requirements)
  - [6.3 Required vs Optional Fields](#63-required-vs-optional-fields)
- [7. Feature-Specific Coverage Patterns](#7-feature-specific-coverage-patterns)
  - [7.1 CRUD Operations](#71-crud-operations)
  - [7.2 Action Tests Must Verify Full Flow (CRITICAL)](#72-action-tests-must-verify-full-flow-critical)
  - [7.3 Form Wizard Steps](#73-form-wizard-steps)
  - [7.4 Modal Flows](#74-modal-flows)
  - [7.5 Notification Tests](#75-notification-tests)
  - [7.6 Conditional UI Elements](#76-conditional-ui-elements)
- [8. Test Case Documentation Structure](#8-test-case-documentation-structure)
  - [8.1 Feature Overview Section](#81-feature-overview-section)
  - [8.2 Summary Section](#82-summary-section)
- [9. Test Case Anti-Patterns](#9-test-case-anti-patterns)
  - [9.1 Title Anti-Patterns](#91-title-anti-patterns)
  - [9.2 Organization Anti-Patterns](#92-organization-anti-patterns)

### Part 3 — MCP-Ready Test Plan Specification (the HOW layer)

- [10. Plan Document Structure](#10-plan-document-structure)
  - [10.1 Required Header Block](#101-required-header-block)
  - [10.2 Document Section Order](#102-document-section-order)
  - [10.3 File Structure](#103-file-structure)
- [11. Status Tracking](#11-status-tracking)
  - [11.1 Status Icons](#111-status-icons)
  - [11.2 Status Summary Table](#112-status-summary-table)
  - [11.3 Two Allowed Test Spec Formats](#113-two-allowed-test-spec-formats)
- [12. MCP-Ready Test Specifications (CORE CONTRACT)](#12-mcp-ready-test-specifications-core-contract)
  - [12.1 The Full Spec Block (per test)](#121-the-full-spec-block-per-test)
  - [12.2 Required Fields in Every MCP-Ready Spec](#122-required-fields-in-every-mcp-ready-spec)
  - [12.3 Fixture Declaration](#123-fixture-declaration)
  - [12.4 Preconditions](#124-preconditions)
  - [12.5 Test Data](#125-test-data)
  - [12.6 User Journey Steps](#126-user-journey-steps)
  - [12.7 Resolved Locators (Not "to Discover")](#127-resolved-locators-not-to-discover)
  - [12.8 Assertions with Expected Values](#128-assertions-with-expected-values)
  - [12.9 Stability Notes](#129-stability-notes)
  - [12.10 Cleanup Contract](#1210-cleanup-contract)
  - [12.11 Compact Group Spec (for repetitive tests)](#1211-compact-group-spec-for-repetitive-tests)
  - [12.12 Cross-Actor Test Patterns](#1212-cross-actor-test-patterns)
- [13. Plan Organization](#13-plan-organization)
  - [13.1 Organize by Actor](#131-organize-by-actor)
  - [13.2 Organize by Workflow Phase](#132-organize-by-workflow-phase)
  - [13.3 Organize by Functionality](#133-organize-by-functionality)
  - [13.4 Test File Organization Pattern](#134-test-file-organization-pattern)
- [14. Implementation Details](#14-implementation-details)
  - [14.1 Standard Test Pattern (one-actor)](#141-standard-test-pattern-one-actor)
  - [14.2 Shared beforeAll Pattern](#142-shared-beforeall-pattern)
  - [14.3 PageObject Methods Required Table](#143-pageobject-methods-required-table)
  - [14.4 Resolved Locators Catalog (mandatory)](#144-resolved-locators-catalog-mandatory)
- [15. Data & Configuration](#15-data--configuration)
  - [15.1 Test Data Requirements](#151-test-data-requirements)
  - [15.2 Required API Methods](#152-required-api-methods)
  - [15.3 Type Definitions](#153-type-definitions)
  - [15.4 Constants and Configuration](#154-constants-and-configuration)
- [16. Stability Contract](#16-stability-contract)
  - [16.1 Shared vs. Isolated Entities](#161-shared-vs-isolated-entities)
  - [16.2 Wait Strategies Used](#162-wait-strategies-used)
  - [16.3 Forbidden Stability Anti-Patterns](#163-forbidden-stability-anti-patterns)
  - [16.4 Parallel Safety Declaration](#164-parallel-safety-declaration)
  - [16.5 3x Stability Verification](#165-3x-stability-verification)
- [17. Risks & Known Issues](#17-risks--known-issues)
  - [17.1 Flaky Locators](#171-flaky-locators)
  - [17.2 Race Conditions](#172-race-conditions)
  - [17.3 Backend Eventual Consistency](#173-backend-eventual-consistency)
  - [17.4 BLOCKED / FLAKY Tests Catalog](#174-blocked--flaky-tests-catalog)
- [18. Reference Tables](#18-reference-tables)
  - [18.1 Visibility/Access Matrix](#181-visibilityaccess-matrix)
  - [18.2 Column Types (for sorting/filtering)](#182-column-types-for-sortingfiltering)
  - [18.3 URL Patterns](#183-url-patterns)
  - [18.4 Notification Logic Matrix](#184-notification-logic-matrix)

### Part 4 — Operations

- [19. Debug Commands](#19-debug-commands)
  - [19.1 Single Test Debug](#191-single-test-debug)
  - [19.2 Category Tests](#192-category-tests)
  - [19.3 Stability Check (3x)](#193-stability-check-3x)
- [20. Excluded Tests](#20-excluded-tests)
  - [20.1 Removed Tests (feature not available)](#201-removed-tests-feature-not-available)
  - [20.2 Skipped Tests (feature not clarified)](#202-skipped-tests-feature-not-clarified)
  - [20.3 Open Questions for Product / Dev](#203-open-questions-for-product--dev)
- [21. Revision History (template)](#21-revision-history-template)
- [22. Critical Rules Reference — ai-coding-standards.md](#22-critical-rules-reference--ai-coding-standardsmd)
  - [22.1 Mandatory Rules](#221-mandatory-rules)
  - [22.2 Mandatory Patterns affecting plan content](#222-mandatory-patterns-affecting-plan-content)
  - [22.3 Locator & Stability Rules (from ai-coding-standards.md §4 Debugging Strategy)](#223-locator--stability-rules-from-ai-coding-standardsmd-4-debugging-strategy)
  - [22.4 Debugging Execution Policy](#224-debugging-execution-policy)

### Part 5 — Final Gates

- [23. Checklists Before Finalizing](#23-checklists-before-finalizing)
  - [23.1 Test Case Quality Checklist](#231-test-case-quality-checklist)
  - [23.2 Plan Draft Stage Checklist](#232-plan-draft-stage-checklist)
  - [23.3 MCP-Ready Stage Checklist](#233-mcp-ready-stage-checklist)
- [24. Quick Reference Skeletons](#24-quick-reference-skeletons)
  - [24.1 Test Case Document Skeleton](#241-test-case-document-skeleton)
  - [24.2 MCP-Ready Plan Skeleton](#242-mcp-ready-plan-skeleton)

---

## ⚠️ CRITICAL: No Assumptions Policy

**NEVER USE assumptions.** If any logic, workflow, data structure, locator, or anything else is not obvious:

1. **First**: Search the codebase for similar patterns or existing implementations
2. **Second**: Debug and explore it yourself (create temp spec file with fixtures using login storageState, run in headed mode with console.logs and browser DevTools — do NOT ask user to debug for you)
3. **Third**: If no success after reasonable attempts, **ASK the user for clarification**

**Never assume** how something works, what a locator should be, or how data flows. Wrong assumptions lead to incorrect test cases, broken plans, and flaky tests.

---

## ⚠️ CRITICAL: MCP-Autonomy Requirement

**Every test plan MUST front-load every unknown.** The plan author bears the responsibility of resolving locators, fixtures, preconditions, expected values, and stability concerns **before** the plan is considered complete.

**If your plan would force the MCP to "discover", "guess", "explore", or "find out", you are NOT done writing the plan.**

A plan that says *"locators TBD"* or *"to be discovered"* is rejected. Plan authors must:

- **Resolve** every `data-testid` (or fallback locator) by exploring the real DOM
- **Specify** the fixture for every test (`buyer`, `supplier`, `staff`, etc.)
- **Define** preconditions explicitly (which entities exist, who created them)
- **List** exact assertion targets with expected values
- **Document** wait strategies for any operation that can race

This rule exists because the MCP cannot be expected to make repeated debugging trips. Each unresolved unknown becomes either an assumption (→ flaky test), a debug detour (→ slow run), or an interruption to the user (→ broken automation).

> **Note on test cases**: This requirement applies to test plans. Test case documents (Part 2) only require titles, IDs, tags, and coverage definition — they get **promoted** to MCP-Ready specs (Part 3) before MCP execution.

---

## ⚠️ CRITICAL: Compliance with `ai-coding-standards.md`

This document MUST be compliant with `ai-coding-standards.md` (the implementation companion). The header block of every `*.plan.md` (§10.1) MUST list it.

`ai-coding-standards.md` is the authority for code-level rules — Page Objects, helpers, fixtures, debugging workflow, etc. Some of its rules also affect plan content; those are listed in §22 and reminded again in the next critical block.

If `ai-coding-standards.md` changes, this document MUST be revised within the next iteration (revision history entry required).

---

## ⚠️ CRITICAL: Cross-Cutting Reminders (also enforced in `ai-coding-standards.md`)

These rules apply to BOTH planning and implementation. Brief reminders here; full authority lives in `ai-coding-standards.md` at the linked section.

| # | Rule (1-line reminder) | Authority |
|---|------------------------|-----------|
| 1 | **Never assume** — search → debug → ask user. Wrong assumptions = flaky tests | `ai-coding-standards.md` RULE 1 |
| 2 | **Never skip tests** — every test in the plan must be implementable; no `test.skip` placeholders | `ai-coding-standards.md` RULE 2, PATTERN 17 |
| 3 | **Never modify** test names, IDs, tags, or descriptions unless user explicitly asks | `ai-coding-standards.md` RULE 5 |
| 4 | **Never combine or split** tests — one plan test = one `test()` block | `ai-coding-standards.md` RULE 4 |
| 5 | **Test name MUST include `@T...` Test ID** — defined here (§3), enforced in code | `ai-coding-standards.md` PATTERN 13 |
| 6 | **Locator priority**: `getByTestId` > `getByRole` > `getByLabel` > CSS > XPath (last resort) | `ai-coding-standards.md` §4.1 Rule 4 |
| 7 | **Never `getByText()`** for content under test — locate by stable selector, assert text separately | `ai-coding-standards.md` §4.1 Rule 4 |
| 8 | **No `waitForTimeout()`** — plan stability notes MUST specify deterministic waits | `ai-coding-standards.md` PATTERN 9 |
| 9 | **Notification tests** with multiple recipients — plan MUST require `Promise.all` (§12.12) | `ai-coding-standards.md` PATTERN 11 |
| 10 | **Tests MUST pass 3x sequentially** — plan §16.5 declares this; implementation enforces it | `ai-coding-standards.md` RULE 6 |
| 11 | **`expect()` only in tests** — never in Page Objects, helpers, or hooks | `ai-coding-standards.md` PATTERN 5 |
| 12 | **Preserve backward compatibility** when plan changes a Page Object method signature | `ai-coding-standards.md` RULE 7 |

**Implementation-only rules** (NOT duplicated here — load `ai-coding-standards.md` when writing code):

- Page Object structure (locator placement, properties block at top)
- Inline All Logic (PATTERN 2), Avoid Control Flow in Tests (PATTERN 3)
- Data Objects pattern (PATTERN 4)
- Helper function organization (§3.5)
- Code style, file organization, section separators
- Static test names for reporting (PATTERN 14)
- Discord notifications (RULE 9)

**Plan-only rules** (defined here, briefly cross-referenced in `ai-coding-standards.md`):

- Test case title formula (§2)
- MCP-Ready spec block format (§12)
- Resolved Locators Catalog format (§14.4)
- Stability Contract / Risks & Known Issues (§16, §17)
- Status icons / status summary (§11)

---

## PART 1 — FOUNDATION

## 1. Purpose, Scope & Lifecycle

### 1.1 Two-Layer Model: Test Cases (WHAT) vs Test Plans (HOW)

This document defines two complementary artifact layers:

| Layer | Artifact | Defines | Audience |
|-------|----------|---------|----------|
| **WHAT** (Part 2) | Test case documents (`*.cases.md` / testomat.io) | Test titles, coverage, organization, tags, Test IDs | QA designers, BAs, PMs |
| **HOW** (Part 3) | MCP-Ready test plan (`*.plan.md`) | Fixtures, locators, data, steps, assertions, waits, cleanup | MCP / test implementers |

**Test cases alone are NOT implementable by the MCP.** They must be promoted to MCP-Ready specs first.

### 1.2 The Test Design Lifecycle

```
Stage 1: Test Case          ──►  Stage 2: MCP-Ready Plan      ──►  Stage 3: Spec File
(testomat.io / *.cases.md)        (*.plan.md, §12 spec block)       (*.spec.ts test() block)

  • Title (Actor-Action-Object)     • Fixture                        • test() declaration
  • Test ID (@Txxxxxxxx)            • Preconditions                  • Test ID in name
  • Tags (@edge, @smoke, ...)       • Test Data (exact values)       • Implementation
  • Coverage shape                  • Numbered Steps                 • Assertions
  • Full-Flow rule (§7.2)           • Resolved Locators              • Pass 3x verified
                                    • Assertions + expected values
                                    • Stability notes
                                    • Cleanup contract
```

The Test ID (`@Txxxxxxxx`) is the **bridge** between all three stages — assigned at Stage 1, carried through Stage 2, and embedded in the `test()` name at Stage 3.

### 1.3 Two-Stage Test Plan Lifecycle (Draft → MCP-Ready)

A test plan (`*.plan.md`) progresses through two stages:

| Stage | Status | What it contains |
|-------|--------|------------------|
| **Draft** | Test names + IDs + tags only | Initial scaffold, not MCP-ready |
| **MCP-Ready** | Full per-test specs (§12) | Fixtures, preconditions, locators, assertions, waits, cleanup |

**Only MCP-Ready plans may be handed off to autonomous implementation.** Draft plans require human implementation OR must be promoted to MCP-Ready before MCP execution.

### 1.4 When to Create a Test Plan

Create a test plan for:

- New feature coverage (10+ tests)
- Complex multi-actor workflows
- Features requiring shared test data setup
- Cross-functional testing (filtering, sorting, search)

Skip test plan for:

- Simple bug fixes (1-3 tests)
- Single test additions to existing suites
- Exploratory testing

For small additions (1-3 tests), document the test cases (Part 2) directly and skip to spec.ts implementation following `ai-coding-standards.md`.

---

## PART 2 — TEST CASE DEFINITION (the WHAT layer)

> **Part 2 covers**: titles, IDs, organization, tags, coverage shapes. This is the testomat.io / `*.cases.md` artifact.
>
> **Part 2 does NOT cover**: fixtures, locators, exact data, assertions, waits, cleanup. Those live in Part 3 (MCP-Ready Test Plan Specification). Every test case here must be promoted to a Part 3 spec block before MCP execution.

## 2. Test Case Title Structure

### 2.1 Core Formula

```
[Actor] can [action] [object] [location/context]
```

| Component | Description | Examples |
|-----------|-------------|----------|
| **Actor** | Who performs the action | `Buyer`, `Supplier`, `Staff`, `Principal`, `User` |
| **Action** | What the actor does | `see`, `click`, `select`, `enter`, `submit`, `receive` |
| **Object** | What is being acted upon | `"New Inquiry" button`, `Delivery Terms dropdown`, `notification` |
| **Location** | Where the action happens | `on Terms step`, `in modal`, `on detail page`, `in Offers list` |

### 2.2 Title Examples

```markdown
GOOD - Clear and specific:
| Buyer can see "New Inquiry" button on Offers list view | @edge |
| Buyer can select Delivery Terms from dropdown on Terms step | @edge |
| Supplier can see "Submitted" status on Open Inquiry detail page | @edge |

BAD - Vague or missing context:
| Buyer can see status | (What status? Where?)
| User can click button | (Which button? Which page?)
| Supplier receives notification | (Which notification? For what event?)
```

Additional positive examples (matching the formula precisely):

```
✅ Supplier can create Inventory listing with public visibility
✅ Buyer sorts Offers by Supplier field
✅ Staff can search Order by Product name (1 word)
✅ Buyer cannot view private listing if their company is not included

❌ Test navigation and form validation (multiple actions)
❌ Create listing (missing actor)
❌ Supplier can create (missing object)
```

### 2.3 Negative Test Titles

For tests verifying something does NOT exist or cannot be done:

```markdown
GOOD:
| "New Inquiry" button is NOT visible on instance | @negative |
| Buyer cannot access Request list page via direct URL on Edge instance | @edge @negative |
| No shipping destination field appears when selecting EXW delivery term | @edge |

BAD:
| New Inquiry button not visible | (Where? Which platform?)
```

---

## 3. Test Case ID Format

Every test case MUST be assigned a unique **Test ID** at creation time.

**Format**: `@T` + 8 lowercase hex characters

```
@Td06ca024
@T1a2b3c4d
@T9580f07b
```

**Why unique**:

- Testomat.io uses it to track the test case across releases
- The Test ID is the primary key carried into the MCP-Ready test plan (§12.1)
- The same ID is later embedded in the `test()` name in `spec.ts` (per `ai-coding-standards.md` PATTERN 13)

**ID Lifecycle**:

```
testomat.io  ──►  test-cases doc  ──►  test-plan §12  ──►  spec.ts test() name
   @T...           @T...               @T...               "Test name @T..."
```

**Generation**:

- If using testomat.io: ID is auto-assigned at case creation — preserve it exactly
- Otherwise: generate 8 random lowercase hex chars (e.g., `crypto.randomBytes(4).toString("hex")`)

**Rules**:

- Never reuse an ID across different test cases
- Never modify an ID once assigned (per `ai-coding-standards.md` RULE 5: Never Modify Test Names, IDs, Tags)
- The ID is the **identity** of the test case — title may be polished for clarity, but ID is permanent
- IDs are stripped from test case titles in the testomat.io UI but MUST be present in spec.ts test names

**Where the ID Appears**:

| Artifact | Example |
|----------|---------|
| Test case table (Part 2) | `\| Buyer can submit Offer \| @edge @smoke \| @T1a2b3c4d \|` |
| Test plan §12 spec block | `### TC-01: Buyer can submit Offer @T1a2b3c4d` |
| Spec file `test()` declaration | `test("Buyer can submit Offer @T1a2b3c4d", async ({ buyer }) => { ... })` |

---

## 4. Test Case Organization

### 4.1 Folder Structure

```
/REGRESSION/[Feature]/[Category]/[Subcategory]
```

**Examples:**

```
/REGRESSION/Open Inquiries/Creation
/REGRESSION/Open Inquiries/Routing
/REGRESSION/Open Inquiries/View - Buyer
/REGRESSION/Open Inquiries/Notifications/Email
/REGRESSION/Company and Access/Accounts/Profile settings
```

### 4.2 Section Organization Within Feature

Organize by logical flow and actor perspective:

```markdown
## /REGRESSION/Feature/Creation
### Entry Point & Modals
### Form Step 1 (Terms)
### Form Step 2 (Products)
### Form Step 3 (Review)
### Submission & Redirect

## /REGRESSION/Feature/View - Buyer
### General View
### Status Display
### Available Actions

## /REGRESSION/Feature/View - Supplier
...

## /REGRESSION/Feature/Notifications
### Email Notifications
### In-App Notifications
```

### 4.3 Table Format

Always use consistent markdown table format:

```markdown
### Section Title
| Title | Tags | Test ID |
|-------|------|---------|
| Test case title here | @tag1 @tag2 | @T1a2b3c4d |
```

> **Test ID column is mandatory** — see §3. The ID is the primary key for promotion into MCP-Ready test plans.

---

## 5. Tagging Strategy

### 5.1 Platform Tags

| Tag | Meaning | Usage |
|-----|---------|-------|
| `@smoke` | Smoke test suite | Critical path tests |
| `@negative` | Negative test case | Verifies something should NOT happen |

### 5.2 Tagging Rules

1. **Single platform features**: Use the platform tag where feature exists
2. **Negative tests for missing features**: Tag with platform where tested + `@negative`
3. **Cross-platform features**: No platform tag needed (or use both if explicit)
4. **Don't mix conflicting tags**

---

## 6. Test Case Clarity Principles

### 6.1 The "5W" Rule

Every test case should clearly answer:

- **Who** performs the action (Actor)
- **What** action is performed
- **Where** the action occurs (page, modal, step)
- **When** applicable (after X, before Y)
- **What** is the expected outcome

### 6.2 Specificity Requirements

| Aspect | Vague | Specific |
|--------|-------|----------|
| Element | "button" | `"New Inquiry" button` |
| Location | "on page" | `on Terms step`, `in type selection modal` |
| Status | "status" | `"Submitted" status`, `"Cancelled" status` |
| Field | "field" | `Delivery Terms dropdown`, `Date Needed field` |
| Action result | "works" | `is redirected to detail page`, `sees confirmation message` |

### 6.3 Required vs Optional Fields

When documenting form fields, clearly indicate:

```markdown
### Terms Step (Required Fields)
| Buyer can see Delivery Terms dropdown on Terms step (required) | @edge |
| Buyer can see Payment Terms dropdown on Terms step (required) | @edge |

### Terms Step (Optional Fields)
| Buyer can see Currency Preference dropdown on Terms step (optional) | @edge |
| Buyer can see Shipping Instructions textarea on Terms step (optional) | @edge |
```

---

## 7. Feature-Specific Coverage Patterns

### 7.1 CRUD Operations

For each entity, cover:

```markdown
### Create
| Actor can create [entity] with required fields |
| Actor can create [entity] with optional fields |
| Actor is redirected to [entity] detail page after creation |

### Read/View
| Actor can see [entity] in list view |
| Actor can open [entity] detail page |
| Actor can see [field] on [entity] detail page |

### Update
| Actor can edit [field] on [entity] |
| Actor can update [entity] status |

### Delete/Cancel
| Actor can delete/cancel [entity] |
| Actor cannot delete/cancel [entity] when [condition] |
```

### 7.2 Action Tests Must Verify Full Flow (CRITICAL)

**Tests named "Actor can [action] [entity]" must test the COMPLETE action, not just button visibility.**

#### Steps Schema (carries forward to §12.6 User Journey Steps)

The numbered verification points below define the **canonical step sequence** for action tests. These steps MUST be carried over verbatim into the MCP-Ready spec block (§12.6). Each step is:

- **Atomic**: one user-perceivable action (click / fill / navigation / assertion)
- **Deterministic**: the next step depends only on the previous one's effect
- **Wait-explicit**: any wait condition is named (no `waitForTimeout`, per `ai-coding-standards.md` PATTERN 9)
- **Locator-prioritized**: per `ai-coding-standards.md` §4.1 Rule 4 (`getByTestId` > `getByRole` > `getByLabel` > CSS > XPath)

#### Required Steps by Action Type

For **Revise/Edit** actions, the test MUST verify:

1. See the Revise/Edit button on detail page
2. Click the button
3. See edit mode (redirected to edit form)
4. Make an actual change to some field
5. Proceed through form steps to Review
6. See the change reflected on Review step
7. Submit the changes
8. Verify the change is visible on the updated entity detail page

For **Cancel/Delete** actions, the test MUST verify:

1. See the Cancel/Delete button (or menu option)
2. Click the button
3. Confirm the action (if confirmation dialog appears)
4. Verify the entity status changed (e.g., "Cancelled", "Deleted")

For **Export/Print** actions, the test MUST verify:

1. See the Export/Print button
2. Click the button
3. Verify download initiated or print dialog appeared

For **Submit/Create** actions, the test MUST verify:

1. See the entry-point button (e.g., "Create", "Make Offer")
2. Navigate through every wizard step
3. Fill all required fields with valid values
4. See the Review/Confirm step show the entered data
5. Click Submit (use `Promise.all([waitForResponse, click])` per `ai-coding-standards.md` PATTERN 11)
6. Verify success state (URL change, status badge, confirmation message)
7. Verify entity exists on the list/detail page after creation

#### Code Examples

```markdown
BAD - Only checks visibility (FAKE TEST):
test("Buyer can revise offer", async () => {
  const reviseButton = page.getByRole("button", { name: /revise/i });
  expect(await reviseButton.isVisible()).toBe(true);  // ❌ Only checks button exists
});

GOOD - Tests complete flow:
test("Buyer can revise offer @T1a2b3c4d", async ({ buyer }) => {
  // 1. See button (use stable testid locator — Rule 4)
  await expect(buyer.offerPage.reviseOfferButton).toBeVisible();

  // 2. Click button
  await buyer.offerPage.reviseOfferButton.click();

  // 3. See edit mode
  await buyer.page.waitForURL(/\/edit\//);

  // 4. Make change
  await buyer.offerCreatePage.titleInput.fill("Updated Title");

  // 5-6. Proceed to review
  await buyer.offerCreatePage.continueBtn.click();
  await expect(buyer.offerCreatePage.reviewTitle).toContainText("Updated Title");

  // 7. Submit (Promise.all for async API call — PATTERN 11)
  await Promise.all([
    buyer.page.waitForResponse((r) => r.url().includes("/api/offers/") && r.status() === 200),
    buyer.offerCreatePage.submitBtn.click(),
  ]);

  // 8. Verify on detail page (assert content via stable locator — NOT getByText on the value)
  await buyer.page.waitForURL(/\/offers\/[a-f0-9-]+\/$/);
  await expect(buyer.offerPage.title).toContainText("Updated Title");  // ✅ Full flow verified
});
```

#### Cross-References

| Concern | Source rule |
|---------|-------------|
| No arbitrary timeouts | `ai-coding-standards.md` PATTERN 9 |
| `Promise.all` for async actions | `ai-coding-standards.md` PATTERN 11 |
| Test name must include `@T...` ID | `ai-coding-standards.md` PATTERN 13 |
| Implement only with full info — no skip | `ai-coding-standards.md` PATTERN 17 |
| Locator priority (`getByTestId` first) | `ai-coding-standards.md` §4.1 Rule 4 |
| Don't use `getByText()` for content under test | `ai-coding-standards.md` §4.1 Rule 4 |
| Final MCP-Ready format for these steps | §12.6 (User Journey Steps) |
| 3x stability verification | `ai-coding-standards.md` §4.2 (Phase 1-3) |

### 7.3 Form Wizard Steps

For multi-step forms, document each step:

```markdown
### Step Navigation
| Actor can see wizard stepper with steps: A, B, C, D |
| Actor can navigate between steps using Back and Continue buttons |
| Continue button is disabled until required fields are filled |

### Step 1 - [Name]
| Actor can see [title] on [step name] step |
| Actor can see [field] on [step name] step |
| Actor can [action] on [step name] step |

### Step 2 - [Name]
...
```

### 7.4 Modal Flows

```markdown
### Modal Entry
| Actor can click [trigger] and see [modal name] modal |
| Actor can see [option A] in [modal name] modal |
| Actor can see [option B] in [modal name] modal |

### Modal Actions
| Actor can select [option] in [modal name] modal |
| Actor can click Continue to proceed |
| Actor can click Back to return to previous modal |
| Actor can close modal by clicking outside |
```

### 7.5 Notification Tests

Document all notification recipients and triggers.

> **Implementation note**: Notification tests MUST use `Promise.all([waitForResponse(...), triggerAction()])` per `ai-coding-standards.md` PATTERN 11. The MCP-Ready spec format for cross-actor notification tests is detailed in §12.12.

```markdown
### Notification Logic Table (canonical version — see §18.4 for plan-level reference)
| Actor | Action | Notifications |
|-------|--------|---------------|
| Buyer user1 | Performs action | NO notification to self |
| Buyer user2 | Same company | Receives notification |
| Supplier | Counterpart | Receives notification |
| Staff | Observer | Always receives notification |

### Email Notifications
| Buyer receives "[Event]" email notification when [trigger] | @edge | @T... |
| Supplier receives "[Event]" email notification when [trigger] | @edge | @T... |

### In-App Notifications
| Buyer receives "[Event]" in-app notification | @edge | @T... |
| Staff receives "[Event]" in-app notification | @edge | @T... |
```

**Required coverage per notification trigger:**

1. Recipient list (which actors receive)
2. Non-recipients (which actors do NOT — including the actor who triggered it)
3. Channel (email, in-app, or both)
4. Notification content (title + body templates)
5. Trigger event (which action causes the notification)
6. Cross-actor verification pattern (see §12.12)

### 7.6 Conditional UI Elements

When UI changes based on selections:

```markdown
### Delivery Terms -> Shipping Destination Logic
| Buyer can see Port field when selecting FOB delivery term | @edge |
| Buyer can see Port field when selecting CIF delivery term | @edge |
| Buyer can see Address field when selecting DDP delivery term | @edge |
| No shipping destination field appears when selecting EXW delivery term | @edge |
```

---

## 8. Test Case Documentation Structure

### 8.1 Feature Overview Section

Every test case document should start with:

```markdown
# Feature Name - Test Cases @primary_tag

> Summary statement about scope and tags.

---

## General Information

### Feature Overview
Brief description of what the feature does.

### Key Differences from [Previous System]
- Point 1
- Point 2

### Test Categories Covered
| Category | Description |
|----------|-------------|
| Creation | ... |
| Viewing | ... |

### Notification Logic
[Table explaining who receives notifications]

### Related Documents
Links to related test case documents.

---

## /REGRESSION/Feature/Category
[Test cases start here]
```

### 8.2 Summary Section

End with totals:

```markdown
---

## Summary

### Test Case Count by Category

| Category | Count |
|----------|-------|
| Creation | 85 |
| View - Buyer | 19 |
| ...      | ... |
| **TOTAL** | **237** |
```

---

## 9. Test Case Anti-Patterns

### 9.1 Title Anti-Patterns

| Anti-Pattern | Correct |
|--------------|---------|
| Implementation details in title | Focus on user behavior |
| Technical jargon | Business terminology |
| Multiple actions in one test | One action per test |
| Missing actor | Always specify who |
| Missing location | Always specify where |

**Examples:**

```markdown
BAD: "API returns 200 and creates record in DB"
GOOD: "Buyer can submit Open Inquiry from Review step"

BAD: "Click dropdown, select option, verify selected"
GOOD: "Buyer can select Payment Terms from dropdown on Terms step"

BAD: "Test navigation and form validation and submission"
GOOD: "Buyer can navigate between steps using Back and Continue buttons"
GOOD: "Continue button is disabled on Terms step until all required fields are filled"
GOOD: "Buyer can submit Open Inquiry from Review step"
```

### 9.2 Organization Anti-Patterns

| Anti-Pattern | Correct |
|--------------|---------|
| Flat list without sections | Group by logical flow |
| Tests scattered by implementation | Group by user perspective |
| Missing negative tests | Include what should NOT happen |
| Inconsistent tag usage | Follow tagging rules |

---

## PART 3 — MCP-READY TEST PLAN SPECIFICATION (the HOW layer)

> **Part 3 covers**: how to specify each test so the MCP can implement it deterministically. This is the `*.plan.md` artifact.
>
> **Pre-requisite**: Test cases (Part 2) must already exist with assigned Test IDs (§3). Part 3 promotes them to MCP-Ready specs.

## 10. Plan Document Structure

### 10.1 Required Header Block

```markdown
# Test Plan: [Feature Name]

> **Feature**: [Brief description of what the feature does]
> **URL**: `[base_url]/[primary_path]/`
> **Version**: X.X | [Month Year]
> **Stage**: Draft | **MCP-Ready**
> **Compliant with**: `ai-coding-standards.md`, `ai-planning-standards.md`
> **Status**: [X PASS, Y STUB, Z Pending] (N total)
```

### 10.2 Document Section Order

```markdown
## Table of Contents (mandatory for plans with 20+ tests)
- [1. Overview](#1-overview)
- [2. File Structure](#2-file-structure)
- [3. Status Summary](#3-status-summary)
- [4. Test Cases (MCP-Ready Specs)](#4-test-cases-mcp-ready-specs)
- [5. Shared Preconditions & beforeAll Setup](#5-shared-preconditions--beforeall-setup)
- [6. Resolved Locators Catalog](#6-resolved-locators-catalog)
- [7. Data & Configuration](#7-data--configuration)
- [8. Stability Contract](#8-stability-contract)
- [9. Risks & Known Issues](#9-risks--known-issues)
- [10. Debug Commands](#10-debug-commands)
- [11. Revision History](#11-revision-history)
```

### 10.3 File Structure

```markdown
## File Structure

tests/[domain]/[feature]/
├── [feature].plan.md              # This file (MCP-ready test plan)
├── [feature]-[category].spec.ts   # Test spec file
├── [feature]-[category2].spec.ts  # Additional spec file
└── prompt.md                      # Original requirements (optional)
```

---

## 11. Status Tracking

### 11.1 Status Icons

| Icon | Status | When to Use |
|------|--------|-------------|
| (none) | Pending | Test defined in MCP-ready spec, not yet implemented |
| ✅ | PASS | Test implemented and passing 3x sequentially |
| ⏸️ | STUB | Test deferred, `test.skip()` placeholder created |
| ⏳ | In Progress | Currently being implemented |
| 🚧 | BLOCKED | External dependency missing — see §17.4 |
| ⚠️ | FLAKY | Passes inconsistently — see §17.4 |
| ❌ | FAIL | Test failing (temporary, fix immediately) |

### 11.2 Status Summary Table

```markdown
## 3. Status Summary

| Phase | Spec File | Tests | PASS | STUB | Pending | BLOCKED | FLAKY |
|-------|-----------|-------|------|------|---------|---------|-------|
| CREATE | `feature-create.spec.ts` | 15 | 12 | 2 | 1 | 0 | 0 |
| VIEW | `feature-view.spec.ts` | 10 | 10 | 0 | 0 | 0 | 0 |
| EDIT | `feature-edit.spec.ts` | 8 | 0 | 0 | 6 | 1 | 1 |
| | **TOTAL** | **33** | **22** | **2** | **7** | **1** | **1** |
```

### 11.3 Two Allowed Test Spec Formats

A plan section MUST use exactly ONE of these formats per logical group of tests:

| Format | When to use | Detail level |
|--------|-------------|--------------|
| **Full Spec Block** (§12.1) | Tests with unique flows, data, or assertions | One full block per test |
| **Compact Group Spec** (§12.11) | Repetitive tests where only the actor or one variable changes | One shared block + thin per-test rows |

**Both formats MUST contain:** fixture(s), preconditions, steps, locators (resolved), assertions (with expected values), stability notes, cleanup contract.

The minimal index table `| ID | Name | Test ID | Status |` is allowed **only as a navigational summary** — it MUST be followed by the corresponding MCP-Ready spec for each row.

---

## 12. MCP-Ready Test Specifications (CORE CONTRACT)

> **This is the core contract.** Every test in an MCP-Ready plan MUST be specified using §12.1 (Full Spec Block) or §12.11 (Compact Group Spec).

### 12.1 The Full Spec Block (per test)

```markdown
### TC-01: Buyer can submit Offer from Listing detail page @T1a2b3c4d

| Field | Value |
|-------|-------|
| **Fixture** | `buyer` |
| **Tags** | `@smoke @edge` |
| **Spec File** | `tests/workflows/Inventory-auction/offer-create/offer-create.spec.ts` |
| **Priority** | P0 (critical path) |

**Preconditions** (from Shared beforeAll OR inline):
- `listing` — created via `supplier.api.listing.createListing({ visibility: "public", products: [{ ... }] })`
- Listing has at least 1 product with `unitPrice >= 100`
- No existing offers from this buyer for this listing (isolation requirement)

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Unit price | `100.50` | inline constant |
| Quantity | `10` | inline constant |
| Delivery term | `EXW` | `OFFER_TERMS.delivery.exw` |
| Payment term | `Advance Payment` | `OFFER_TERMS.payment.advance` |

**User Journey Steps**:
1. Navigate via `buyer.listingPage.openById(listing.id)`
2. Wait for `buyer.listingPage.pageHeader` to be visible
3. Click `buyer.listingPage.makeOfferBtn` (`[data-testid="make-offer-button"]`)
4. Wait for URL match `/listings/{listingId}/offers/new/`
5. Fill Terms step using `buyer.offerCreatePage.fillTermsStep({ delivery: "EXW", payment: "Advance Payment" })`
6. Click `buyer.offerCreatePage.continueBtn` — wait for it to be **enabled** (not just visible)
7. Wait for Products step header `buyer.offerCreatePage.productsStepHeader`
8. Set unit price via `buyer.offerCreatePage.setUnitPrice(0, 100.50)`
9. Set quantity via `buyer.offerCreatePage.setQuantity(0, 10)`
10. Click Continue → Wait for Review step
11. Click `buyer.offerCreatePage.submitBtn` (`[data-testid="submit-offer-button"]`)
12. Wait for URL pattern `/offers/{newOfferId}/`

**Expected Assertions**:
| Locator (resolved) | Assertion | Expected Value |
|--------------------|-----------|----------------|
| `offerPage.status` (`[data-testid="status-label"]`) | `toContainText` | `"Submitted"` |
| `offerPage.product.unitPrice.first()` | `toContainText` | `"100.50"` |
| `offerPage.product.quantity.first()` | `toContainText` | `"10"` |
| `offerPage.shippingTerms` (`[data-testid="shipping-terms"]`) | `toContainText` | `"EXW"` |
| URL | `toMatch` | `/\/offers\/[a-f0-9-]+\/$/` |

**API Side-Effects** (when verifying or mocking):
- `POST /api/v1/offers/` → 201 Created
- Response body contains `id`, `status: "submitted"`, `listing_id: {listing.id}`

**Stability Notes**:
- Submit button uses `Promise.all([waitForURL, click])` pattern (see `ai-coding-standards.md` PATTERN 11)
- Continue button enables only after all required fields filled — assert **enabled**, not visible
- Modal dialog uses `role="dialog"` — wait for `hidden` after submit before URL assertion
- No arbitrary `waitForTimeout()` — use specific waits

**Cleanup Contract**:
- **Mutation**: Creates 1 new offer linked to shared `listing`
- **Side effects on shared state**: Listing's offer count increments by 1 (visible to other tests)
- **Parallel safety**: Safe — each test creates its own offer (read-only on listing)
- **Teardown**: None required (offers are append-only in this workflow)

**Locators Required in PageObject** (`OfferCreatePage.ts` / `OfferPage.ts`):
- `makeOfferBtn` → `[data-testid="make-offer-button"]` ✅ exists
- `continueBtn` → `[data-testid="offer-continue-button"]` ✅ exists
- `submitBtn` → `[data-testid="submit-offer-button"]` ✅ exists
- `productsStepHeader` → `[data-testid="products-step-header"]` ⚠️ TO ADD
- `setUnitPrice(idx, value)` ✅ exists
```

### 12.2 Required Fields in Every MCP-Ready Spec

| Field | Required | Why |
|-------|----------|-----|
| Fixture | ✅ | MCP needs to know which login context to use |
| Tags | ✅ | Drives test runner filtering and platform routing |
| Spec File | ✅ | MCP knows which file to write to |
| Priority | ✅ | Drives implementation order and CI scheduling |
| Preconditions | ✅ | MCP knows what state must exist before test runs |
| Test Data | ✅ | MCP uses exact values, not invented ones |
| User Journey Steps | ✅ | MCP follows exact action sequence |
| Expected Assertions | ✅ | MCP knows what `expect()` calls to write |
| Resolved Locators | ✅ | MCP uses real `data-testid`, never guesses |
| Stability Notes | ✅ | MCP avoids race conditions and arbitrary timeouts |
| Cleanup Contract | ✅ | MCP knows whether test mutates shared state |
| API Side-Effects | ⚠️ Optional | Required when test asserts API response or mocks endpoints |

### 12.3 Fixture Declaration

Every test MUST declare its fixture(s) explicitly:

```markdown
| **Fixture** | `buyer` |
```

For multi-actor tests:

```markdown
| **Fixtures** | `buyer` (creates offer), `supplier` (responds), `staff` (verifies notification) |
```

Available fixtures (verify against `tests/fixtures/`):

- `buyer`, `otherBuyer`
- `supplier`, `otherSupplier`
- `staff`
- `principal`

### 12.4 Preconditions

Preconditions MUST specify:

1. **What entity** must exist
2. **Who created it** (which fixture's API)
3. **With what configuration** (key parameters)
4. **Where it lives** (shared `beforeAll` vs. inline per-test)

```markdown
**Preconditions** (from Shared beforeAll):
- `sharedListing` — `supplier.api.listing.createListing({ visibility: "public", products: 1 })`
- `sharedOffer` — `buyer.api.offer.createOffer(sharedListing.id, { unitPrice: 100 })`

**Preconditions** (inline — created by this test):
- Fresh isolated listing — `supplier.api.listing.createListing({ visibility: "private" })`
```

### 12.5 Test Data

Test data MUST be **explicit values**, not "use sensible defaults". Reference constants from `data/constants.ts` when applicable.

```markdown
**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Title | `"QA Test Listing"` | inline (uniqueness via `nanoid()`) |
| Quantity | `100` | inline constant |
| Delivery term | `EXW` | `OFFER_TERMS.delivery.exw` from `data/constants.ts` |
```

### 12.6 User Journey Steps

Steps MUST be **numbered, deterministic, and atomic**:

- Each step is one user-perceivable action
- Page Object method calls preferred over raw locator clicks
- Wait steps are explicit (no implicit timeouts)
- Each step has at most one click/fill/navigation

❌ **Bad** (vague, multiple actions):

```
1. Fill out the form and submit
2. Verify the result
```

✅ **Good** (atomic, deterministic):

```
1. Click `buyer.offerCreatePage.deliveryTermsDropdown`
2. Select option `"EXW"` from dropdown
3. Click `buyer.offerCreatePage.continueBtn` (wait for `enabled`)
4. Wait for URL match `/offers/new/products`
```

> **See also §7.2** for the canonical step sequences for Revise/Edit, Cancel/Delete, Export/Print, Submit/Create action types. Those steps carry forward verbatim into MCP-Ready specs.

### 12.7 Resolved Locators (Not "to Discover")

**MANDATORY**: All locators MUST be resolved to real `data-testid` values (or the next-best option from `ai-coding-standards.md` §4.1 Rule 4) **before** the plan is marked MCP-Ready.

The plan author MUST have:

1. Run a temp spec in headed mode (per `ai-coding-standards.md` §4.1 Rule 3)
2. Inspected the real DOM
3. Recorded the resolved locator in the spec block AND in the §14.4 Resolved Locators Catalog

❌ **REJECTED** plan content:

- `Submit button | TBD`
- `Status badge | locator to be discovered`
- `Filter dropdown | check DOM later`

✅ **ACCEPTED** plan content:

- `Submit button | [data-testid="submit-offer-button"]` (verified 2026-04-29)
- `Status badge | [data-testid="status-label"]`
- `Filter dropdown | offerListPage.filterDropdown` → `[data-testid="filter-supplier-dropdown"]`

### 12.8 Assertions with Expected Values

Assertions MUST list:

- **Locator** to assert against (the resolved one)
- **Assertion method** (`toBeVisible`, `toContainText`, `toHaveText`, `toMatch`, etc.)
- **Expected value** (for content assertions)

```markdown
**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `orderPage.status` | `toContainText` | `"Pending"` |
| `orderPage.totalCostField` | `toContainText` | `"$1,005.00"` |
| `orderPage.viewOfferButton` | `toBeVisible` | — |
| URL | `toMatch` | `/\/orders\/[a-f0-9-]+\/$/` |
```

**Per §7.2 (Full Flow rule)**: For Revise/Edit/Cancel/Export action tests, the assertion list MUST cover the **complete flow**, not just initial button visibility.

### 12.9 Stability Notes

Stability notes MUST address:

- **Race conditions** → use `Promise.all([waitFor..., action])`
- **Element-state vs. visibility** → assert `enabled` for buttons that gate progress
- **Modal lifecycle** → wait for `role="dialog"` to be `hidden` after dismissal
- **Eventual consistency** → identify backend operations that need polling (e.g., notification arrival)
- **Arbitrary timeouts** → forbidden per `ai-coding-standards.md` PATTERN 9

```markdown
**Stability Notes**:
- Notification arrival uses `Promise.all([waitForResponse, triggerAction])` — see `ai-coding-standards.md` PATTERN 11
- Filter results render asynchronously — wait for `[data-testid="results-loading"]` to be `hidden` before counting rows
- After offer submit, listing's offer-count badge updates within 1-2s; assert via `toContainText` (built-in retry), NOT `waitForTimeout(2000)`
```

### 12.10 Cleanup Contract

Every test MUST declare its mutation surface and parallel safety:

```markdown
**Cleanup Contract**:
- **Mutation**: Creates 1 offer + sends 3 notifications (buyer, supplier, staff)
- **Shared state impact**: Listing offer count +1 (other tests reading offer count must account)
- **Parallel safety**: ✅ Safe — each test creates its own listing
- **Teardown**: None — `afterAll` handled at suite level via `cleanupCreatedEntities()`
```

| Cleanup category | Required content |
|------------------|------------------|
| **Mutation** | What entities are created/modified/deleted |
| **Shared state impact** | Effect on entities created in `beforeAll` |
| **Parallel safety** | ✅ Safe / ⚠️ Requires `test.describe.serial()` / ❌ Must run alone |
| **Teardown** | Per-test cleanup (`afterEach`) or suite-level (`afterAll`) or none |

### 12.11 Compact Group Spec (for repetitive tests)

When several tests differ only in actor or one variable, use a single shared spec block + a compact per-test table:

```markdown
### Group: Order Status View by Actor (3 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Spec File** | `order-view/order-content.spec.ts` |
| **Preconditions** | Shared `order` (Pending) from beforeAll |
| **Test Data** | None (read-only test) |
| **Steps** | 1. `actor.orderPage.openById(order.id)` → 2. Wait for `pageHeader` → 3. Assert |
| **Resolved Locators** | `orderPage.status` → `[data-testid="status-label"]` |
| **Assertion** | `orderPage.status` → `toContainText("Pending")` |
| **Stability** | Wait for `pageHeader` (`[data-testid="page-header"]`) before assertion |
| **Cleanup** | Read-only — fully parallel-safe |

**Per-Test Variants**:
| ID | Test Name | Test ID | Fixture | Tags | Status |
|----|-----------|---------|---------|------|--------|
| OS-01 | Buyer can view order status | @T30741282 | `buyer` | `@smoke` | ✅ |
| OS-02 | Supplier can view order status | @T2813eb15 | `supplier` | — | ✅ |
| OS-03 | Staff can view order status | @T17500c7d | `staff` | — | ✅ |
```

**When to use Compact Group Spec:**

- Tests share preconditions, data, steps, locators, assertions, and stability notes
- Only the **actor (fixture)** OR **one input value** differs
- Test count ≥ 3 (otherwise just use full spec blocks)

**When NOT to use:**

- Tests have different assertions per actor (e.g., Staff sees field that Buyer doesn't)
- Tests have different preconditions per case
- Tests have any flow divergence — write Full Spec Block per test

### 12.12 Cross-Actor Test Patterns

For tests where Actor A acts and Actor B observes:

```markdown
### TC-15: Supplier receives in-app notification when Buyer submits Offer @Tabcdef12

| Field | Value |
|-------|-------|
| **Fixtures** | `buyer` (action), `supplier` (observer) |
| **Spec File** | `notifications/in-app-notifications.spec.ts` |

**Preconditions**: Shared `listing` from supplier; supplier has notifications panel reachable

**User Journey Steps** (cross-actor):
1. **buyer**: `buyer.api.offer.createOffer(listing.id, { ... })` — triggers notification
2. **supplier**: `supplier.notificationsPage.goto()`
3. **supplier**: Wait for notifications list to load (`[data-testid="notifications-list"]` visible)
4. **supplier**: Use `Promise.all([waitForResponse(/notifications/), reload])` — see PATTERN 11

**Expected Assertions** (on supplier):
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `supplier.notificationsPage.firstNotificationTitle` | `toContainText` | `"New offer received"` |
| `supplier.notificationsPage.firstNotificationBody` | `toContainText` | `listing.title` |

**Stability Notes**:
- Use `Promise.all` to wait for notification API response — do NOT poll with arbitrary delays
- Notification can arrive within 0-3s; built-in retry on `toContainText` handles this
- Run sequentially with other notification tests to avoid notification noise (use `test.describe.serial()`)
```

---

## 13. Plan Organization

### 13.1 Organize by Actor

For features with multiple user roles:

```markdown
### Buyer Tests (N tests)
[Full Spec Blocks or Compact Groups]

### Supplier Tests (N tests)
[Full Spec Blocks or Compact Groups]

### Staff Tests (N tests)
[Full Spec Blocks or Compact Groups]
```

### 13.2 Organize by Workflow Phase

For features with sequential workflow:

```markdown
### Phase 1: Creation (N tests)
### Phase 2: View & Access (N tests)
### Phase 3: Edit & Update (N tests)
### Phase 4: After Actions (N tests)
```

### 13.3 Organize by Functionality

For horizontal features (filtering, sorting, search):

```markdown
### Text Column Sorting (N tests)
### Numeric Column Sorting (N tests)
### Time-Based Column Sorting (N tests)
```

### 13.4 Test File Organization Pattern

```typescript
test.describe("Feature name", () => {

  // ==================== BUYER TESTS ====================

  test("Buyer can action A @Txxxxxxxx", async ({ buyer }) => { });
  test("Buyer can action B @Tyyyyyyyy", async ({ buyer }) => { });

  // ==================== SUPPLIER TESTS ====================

  test("Supplier can action A @Tzzzzzzzz", async ({ supplier }) => { });

  // ==================== STAFF TESTS ====================

  test("Staff can action A @Tvvvvvvvv", async ({ staff }) => { });
});
```

---

## 14. Implementation Details

### 14.1 Standard Test Pattern (one-actor)

```typescript
test("Actor can perform action @Txxxxxxxx", async ({ actor }) => {
  // Setup (preconditions inlined or from beforeAll)
  const data = await actor.api.entity.createEntity();

  // Action (per User Journey Steps)
  await actor.entityPage.openById(data.id);
  await actor.entityPage.performAction();

  // Verification (per Expected Assertions)
  await expect(actor.entityPage.successIndicator).toBeVisible();
});
```

### 14.2 Shared `beforeAll` Pattern

```typescript
let sharedEntity: { id: string };

test.describe("Feature tests", () => {
  test.beforeAll(async ({ supplier }) => {
    sharedEntity = await supplier.api.entity.createEntity();
  });

  test("Actor can view entity @Tyyyyyyyy", async ({ actor }) => {
    await actor.entityPage.openById(sharedEntity.id);
    await expect(actor.entityPage.header).toBeVisible();
  });
});
```

### 14.3 PageObject Methods Required Table

For every method referenced in §12 spec blocks, list it here with a status:

```markdown
| Method | File | Status | Notes |
|--------|------|--------|-------|
| `openById(id)` | `EntityPage.ts` | ✅ exists | — |
| `performAction()` | `EntityPage.ts` | ⚠️ TO ADD | New method needed |
| `getColumnValues(col)` | `EntityListPage.ts` | ⚠️ TO ADD | Used by sorting tests |
```

### 14.4 Resolved Locators Catalog (mandatory)

A consolidated table of every locator referenced in spec blocks:

```markdown
| Locator (Page Object accessor) | Selector (resolved) | Verified On | File |
|--------------------------------|---------------------|-------------|------|
| `offerCreatePage.makeOfferBtn` | `[data-testid="make-offer-button"]` | 2026-04-29 | `OfferCreatePage.ts` |
| `offerPage.status` | `[data-testid="status-label"]` | 2026-04-29 | `OfferPage.ts` |
| `offerPage.shippingTerms` | `[data-testid="shipping-terms"]` | 2026-04-29 | `OfferPage.ts` |
```

**Verified On** — date the locator was confirmed in real DOM. If older than 30 days, re-verify before MCP runs.

---

## 15. Data & Configuration

### 15.1 Test Data Requirements

```markdown
- Source of seed data (existing environment vs. created per test)
- Uniqueness strategy (e.g., `nanoid()` suffix on titles)
- Cleanup strategy (afterEach, afterAll, or none)
- Privacy: No real PII, no real email addresses (use `@test.kommodity.local`)
```

### 15.2 Required API Methods

```typescript
async createEntity(data?: EntityTestInput): Promise<{ id: string }>;
async getEntity(id: string): Promise<EntityResponse>;

async deleteEntity(id: string): Promise<void>;
```

### 15.3 Type Definitions

```typescript
export type EntityTestInput = {
  title?: string;
  type?: EntityType;
  products?: ProductSpec[];
};
```

### 15.4 Constants and Configuration

```typescript
export const NOTIFICATION_TIMEOUT = {
  default: 5000,
  negative: 5000,
};
```

---

## 16. Stability Contract

> **Purpose**: Document the stability strategy for the entire plan in one place. Per-test stability notes (§12.9) cover specifics; this section covers cross-cutting concerns.

### 16.1 Shared vs. Isolated Entities

```markdown
| Entity | Scope | Lifetime | Why |
|--------|-------|----------|-----|
| `sharedListing` | All tests in suite | `beforeAll` → end of suite | Read-only across tests; saves N API calls |
| `inlineOffer` | Per-test | Created in `beforeEach` | Each test mutates own offer state |
| `freshOrder` | Per-test (mutating tests only) | Inline in test body | Status updates would conflict if shared |
```

### 16.2 Wait Strategies Used

```markdown
| Pattern | When to use | Example |
|---------|-------------|---------|
| `Promise.all([waitFor..., action])` | Action triggers async API call (see PATTERN 11) | Notifications, form submits |
| `expect(locator).toBeVisible()` | Static element appearance | Page header, modal open |
| `expect(locator).toBeEnabled()` | Gating element (Continue button) | Form-step gates |
| `page.waitForURL(pattern)` | Navigation completion | After form submit |
| `page.waitForResponse(/api regex/)` | Specific API call | Notification API |
```

### 16.3 Forbidden Stability Anti-Patterns

| ❌ Forbidden | ✅ Use Instead | Rule |
|-------------|----------------|------|
| `page.waitForTimeout(2000)` | Specific waits (URL, response, locator state) | `ai-coding-standards.md` PATTERN 9 |
| Increasing test timeout to mask failures | Find root cause (locator, race) | PATTERN 10 |
| `getByText()` for content under test | `getByTestId()` + `toContainText()` | `ai-coding-standards.md` §4.1 Rule 4 |

### 16.4 Parallel Safety Declaration

```markdown
| Spec File | Parallel Safe? | Rationale |
|-----------|----------------|-----------|
| `feature-create.spec.ts` | ✅ Yes | Each test creates own entities |
| `feature-edit.spec.ts` | ⚠️ Serial | Tests share `editableEntity`, mutate status |
| `feature-notifications.spec.ts` | ⚠️ Serial | Notification dedup per recipient |
```

### 16.5 3x Stability Verification

Per `ai-coding-standards.md` §4.2 (Implementation Workflow Phase 1-3) and RULE 6: every test MUST pass 3 sequential runs before status `PASS` is recorded.

```bash
npx playwright test path/to/spec.ts --project=tests --reporter=list --workers=1 --repeat-each=3
```

---

## 17. Risks & Known Issues

### 17.1 Flaky Locators

```markdown
| Locator | Issue | Workaround | Tracked In |
|---------|-------|------------|-----------|
| `[data-testid="results-table"]` | Table re-renders during sort, briefly detached | Wait for `[data-testid="results-loading"]` to be `hidden` first | KOM-1234 |
```

### 17.2 Race Conditions

```markdown
| Operation | Race | Mitigation |
|-----------|------|------------|
| Notification API after offer submit | API can lag 0-3s behind UI | Use `Promise.all([waitForResponse, action])` |
| Listing offer count update | Optimistic UI vs. server confirmation | Assert via `toContainText` (built-in retry) |
```

### 17.3 Backend Eventual Consistency

```markdown
| Endpoint | Consistency | Strategy |
|----------|-------------|----------|
| `GET /api/notifications/` | Eventual (~2s) | Use `expect.poll()` with 5s timeout |
| `GET /api/offers/{id}/` | Strong | No special handling |
```

### 17.4 BLOCKED / FLAKY Tests Catalog

```markdown
| Test ID | Test Name | Status | Reason | Tracked In |
|---------|-----------|--------|--------|-----------|
| @Txxxxxxxx | Feature X under Y | 🚧 BLOCKED | API endpoint not deployed to staging | KOM-9999 |
| @Tyyyyyyyy | Feature Z under W | ⚠️ FLAKY | Race on notification arrival, ~10% failure rate | KOM-9998 |
```

---

## 18. Reference Tables

### 18.1 Visibility/Access Matrix

```markdown
| Entity | Buyer | Supplier | Staff |
|--------|-------|----------|-------|
| Own entities | ✅ | ✅ | ✅ |
| Other's entities | ❌ | ❌ | ✅ |
| Public entities | ✅ | ✅ | ✅ |
```

### 18.2 Column Types (for sorting/filtering)

```markdown
| Column | Type | Sorting Logic |
|--------|------|---------------|
| Supplier | Text | Case-insensitive alphabetical |
| Amount | Numeric | Extract number from currency format |
| Updated | Time-based | Inverted semantics (recent = greater) |
```

### 18.3 URL Patterns

```markdown
| Page | URL |
|------|-----|
| List page | `/entities/` |
| Detail page | `/entities/{id}/` |
| Create page | `/entities/new/` |
| Edit page | `/entities/{id}/edit/` |
```

### 18.4 Notification Logic Matrix

> **Note**: This is the canonical reference table. Test case docs (§7.5) reference the same matrix.

```markdown
| Actor | Action | Notifications |
|-------|--------|---------------|
| Buyer user1 | Performs action | NO notification to self |
| Buyer user2 | Same company | Receives notification |
| Supplier | Counterpart | Receives notification |
| Staff | Observer | Always receives notification |
```

---

## PART 4 — OPERATIONS

## 19. Debug Commands

### 19.1 Single Test Debug

```bash
npx playwright test path/to/spec.ts --grep "test-name" --project=tests --headed
```

### 19.2 Category Tests

```bash
npx playwright test path/to/spec.ts --grep "Buyer" --project=tests --headed
```

### 19.3 Stability Check (3x)

```bash
npx playwright test path/to/spec.ts --project=tests --reporter=list --workers=1 --repeat-each=3
```

---

## 20. Excluded Tests

### 20.1 Removed Tests (feature not available)

```markdown
| Test ID | Test Name | Reason |
|---------|-----------|--------|
| @Txxxxxxxx | Test description | Feature not in current UI |
```

### 20.2 Skipped Tests (feature not clarified)

```markdown
| Test ID | Test Name | Reason |
|---------|-----------|--------|
| @Tyyyyyyyy | Test description | Feature unclear |
| @Tzzzzzzzz | Test description | Email verification unavailable |
```

### 20.3 Open Questions for Product / Dev

```markdown
| # | Question | Affects Tests | Status |
|---|----------|---------------|--------|
| Q1 | Should buyer see X when Y? | TC-15, TC-22 | Awaiting PM |
| Q2 | Endpoint /api/foo returns 500 — bug or restriction? | TC-30 | Awaiting backend dev |
```

---

## 21. Revision History (template)

```markdown
| Version | Date | Stage | Changes |
|---------|------|-------|---------|
| 1.0 | Jan 15, 2026 | Draft | Initial test plan with names + IDs |
| 1.1 | Jan 18, 2026 | Draft | Added 5 new test cases for filtering |
| 2.0 | Jan 23, 2026 | **MCP-Ready** | Promoted to MCP-Ready: added per-test specs, resolved locators, stability contract |
```

---

## 22. Critical Rules Reference — `ai-coding-standards.md`

> **Authority**: All rules below are defined in `ai-coding-standards.md`. They are listed here so that the plan author understands what implementation-side constraints affect plan content. The brief reminders are also at the top of this document (Cross-Cutting Reminders block).

### 22.1 Mandatory Rules

1. **No Assumptions Policy** (RULE 1) — applies to plan AND implementation
2. **Complete Test Plan Implementation** (RULE 2) — never remove or skip tests from plan
3. **Never Simplify Requirements** (RULE 3) — implement exactly as specified
4. **Never Combine or Split Tests** (RULE 4)
5. **Never Change Test Names, IDs, Tags** (RULE 5)
6. **No Flaky Tests** (RULE 6) — tests MUST pass 3x sequentially
7. **Keep Backward Compatibility** (RULE 7) — when modifying Page Objects/helpers
8. **Keep Test Plan Up to Date** (RULE 8) — update plan after locator/flow discoveries

### 22.2 Mandatory Patterns affecting plan content

- **PATTERN 9** — No Arbitrary Timeouts (plan stability notes must specify deterministic waits)
- **PATTERN 11** — Notification Tests use `Promise.all` (plan §12.12 must declare this)
- **PATTERN 13** — Test Naming & Tagging (Test ID embedded in `test()` name)
- **PATTERN 17** — Implement Only With Enough Info (no `test.skip` placeholders — leave commented in plan)

### 22.3 Locator & Stability Rules (from `ai-coding-standards.md` §4 Debugging Strategy)

- **§4.1 Rule 4 Locator Priority** — `getByTestId` > `getByRole` > `getByLabel` > `getByPlaceholder` > CSS > XPath (last resort)
- **Never use `getByText()` for content under test** — locate by stable selector, assert content separately
- **3x Stability Verification** — every test must pass 3 sequential runs before `PASS`

### 22.4 Debugging Execution Policy

**Phase 1: Single Test First**

- Run one test in headed mode
- Check if `beforeAll` needs update
- Check if common helpers work correctly

**Phase 2: One Role Tests**

- Run all tests for one actor (e.g., all Buyer tests)

**Phase 3: All Tests**

- Run all tests with `--reporter=list --workers=1 --repeat-each=3`

---

## PART 5 — FINAL GATES

## 23. Checklists Before Finalizing

### 23.1 Test Case Quality Checklist

For test case documents (Part 2 artifacts):

#### Title & Coverage Quality

- [ ] Every test title follows Actor-Action-Object-Location pattern (§2.1)
- [ ] Location/context is specific (page, modal, step, list)
- [ ] Negative tests are included where applicable (§2.3)
- [ ] Required vs optional fields are distinguished (§6.3)
- [ ] Conditional UI logic is fully covered (§7.6)
- [ ] Action tests follow the Full Flow rule (§7.2) — not just button visibility
- [ ] Notification tests cover all recipient roles (§7.5)

#### Identity & Tagging

- [ ] Every test case has a unique Test ID (`@T` + 8 hex chars) per §3
- [ ] No Test IDs are duplicated within or across test case documents
- [ ] Tags are consistent and follow platform rules (§5)
- [ ] Test ID column is present in every test case table (§4.3)

#### Organization & Documentation

- [ ] Tests are organized by logical user flow (not by implementation)
- [ ] Feature overview section is present (§8.1)
- [ ] Summary with counts is included (§8.2)

### 23.2 Plan Draft Stage Checklist

Minimum requirements for a Draft-stage plan:

- [ ] Header block: Feature, URL, Version, **Stage: Draft**, Compliant-with line, Status counts
- [ ] Overview with workflow description
- [ ] File structure defined
- [ ] Status summary table with counts (incl. BLOCKED, FLAKY columns)
- [ ] All test cases listed with Test IDs (`@Txxxxxxxx`)
- [ ] Test names follow Actor-Action-Object-Context pattern
- [ ] Tests organized by actor / phase / functionality

### 23.3 MCP-Ready Stage Checklist

Mandatory before MCP execution (in addition to §23.2):

- [ ] **Stage: MCP-Ready** in header
- [ ] Every test has a §12.1 Full Spec Block OR is part of a §12.11 Compact Group Spec
- [ ] Every spec specifies: Fixture, Tags, Spec File, Priority
- [ ] Every spec specifies: Preconditions (with API method calls)
- [ ] Every spec specifies: Test Data (exact values)
- [ ] Every spec specifies: numbered User Journey Steps
- [ ] Every spec specifies: Expected Assertions with locator + assertion + expected value
- [ ] Every spec specifies: Stability Notes (no `waitForTimeout`)
- [ ] Every spec specifies: Cleanup Contract + Parallel Safety
- [ ] §14.4 Resolved Locators Catalog populated with every locator referenced in specs
- [ ] §14.4 Locators verified in real DOM within last 30 days (date listed)
- [ ] §14.3 PageObject methods table lists every method referenced (with `exists` / `TO ADD`)
- [ ] §16 Stability Contract: Shared vs. Isolated entities documented
- [ ] §16.4 Parallel safety declared per spec file
- [ ] §17 Risks & Known Issues populated (or stated empty with reason)
- [ ] §20.3 Open Questions section either resolved or marked "no open questions"
- [ ] Cross-actor tests use `Promise.all` per `ai-coding-standards.md` PATTERN 11
- [ ] No `getByText()` used for content under test
- [ ] No "TBD" or "to be discovered" anywhere in the plan

---

## 24. Quick Reference Skeletons

### 24.1 Test Case Document Skeleton

```markdown
# Feature Name - Test Cases @primary_tag

> Summary statement about scope and tags.

---

## General Information

### Feature Overview
[Brief description]

### Test Categories Covered
| Category | Description |
|----------|-------------|
| Creation | ... |

### Notification Logic
[Table — see §18.4 for canonical matrix]

---

## /REGRESSION/Feature/Creation

### Section 1
| Title | Tags | Test ID |
|-------|------|---------|
| Buyer can [action] [object] on [location] | @edge @smoke | @T1a2b3c4d |

---

## Summary

| Category | Count |
|----------|-------|
| Creation | N |
| **TOTAL** | **N** |
```

### 24.2 MCP-Ready Plan Skeleton

```markdown
# Test Plan: [Feature Name]

> **Feature**: [Description]
> **URL**: `[url]`
> **Version**: 1.0 | [Month Year]
> **Stage**: MCP-Ready
> **Compliant with**: `ai-coding-standards.md`, `ai-planning-standards.md`
> **Status**: 0 PASS, 0 STUB, N Pending, 0 BLOCKED, 0 FLAKY (N total)

---

## 1. Overview

[Feature description, workflow diagram, key concepts, status definitions]

## 2. File Structure

```
tests/[domain]/[feature]/
├── [feature].plan.md
└── [feature].spec.ts
```

## 3. Status Summary

| Spec File | Tests | PASS | STUB | Pending | BLOCKED | FLAKY |
|-----------|-------|------|------|---------|---------|-------|
| `feature.spec.ts` | N | 0 | 0 | N | 0 | 0 |

## 4. Test Cases (MCP-Ready Specs)

### Buyer Tests (N tests)

#### TC-01: Buyer can [action] [object] @T1a2b3c4d

| Field | Value |
|-------|-------|
| **Fixture** | `buyer` |
| **Tags** | `@smoke` |
| **Spec File** | `tests/[feature]/[feature].spec.ts` |
| **Priority** | P0 |

**Preconditions**: Shared `entity` from beforeAll

**Test Data**: [exact values]

**User Journey Steps**:
1. ...
2. ...

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `entityPage.x` | `toContainText` | `"..."` |

**Stability Notes**: [waits, races]

**Cleanup Contract**: [mutation, parallel safety]

## 5. Shared Preconditions & beforeAll Setup

```typescript
let shared: { entity: { id: string } } = {};

test.beforeAll(async ({ supplier }) => {
  shared.entity = await supplier.api.entity.createEntity();
});
```

## 6. Resolved Locators Catalog

| Locator (PO accessor) | Selector | Verified On | File |
|-----------------------|----------|-------------|------|
| `entityPage.x` | `[data-testid="x"]` | YYYY-MM-DD | `EntityPage.ts` |

## 7. Data & Configuration

[API methods, types, constants]

## 8. Stability Contract

[Shared vs. isolated, parallel safety, wait strategies]

## 9. Risks & Known Issues

[Flaky locators, race conditions, BLOCKED/FLAKY catalog, open questions]

## 10. Debug Commands

```bash
npx playwright test path/to/spec.ts --project=tests --headed
npx playwright test path/to/spec.ts --project=tests --workers=1 --repeat-each=3
```

## 11. Revision History

| Version | Date | Stage | Changes |
|---------|------|-------|---------|
| 1.0 | [Date] | Draft | Initial test plan |
| 2.0 | [Date] | MCP-Ready | Promoted with full per-test specs |
```

---

*Version: 3.0 | April 2026 — Unified Test Plan Standards (Test Cases + MCP-Ready Plans)*

**Changelog:**

- v3.0 (April 2026): **Unified file** — merged `test-cases-standards.md` (627 lines) into this document as Part 2. Single detailed Table of Contents at the top. Five-part structure: Foundation → Test Cases (WHAT) → MCP-Ready Plans (HOW) → Operations → Final Gates. Eliminated duplication of No Assumptions Policy, Compliance with Sibling Rules, naming formula, lifecycle diagram, and notification matrix. 37 cross-references to sibling file removed (now internal section refs).
- v2.0 (April 2026): Major rewrite for MCP autonomy. Added MCP-Ready Test Specifications, Stability Contract, Risks & Known Issues, Open Questions. Mandated resolved locators (no "TBD"). Added Stage: Draft / MCP-Ready lifecycle.
- v1.0: Initial test plan standards.
