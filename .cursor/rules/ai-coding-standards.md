---
description: Implementation standards — coding rules, framework conventions, and debugging strategy for translating MCP-Ready test plans into Playwright spec files
globs: ["tests/**/*.ts", "page-objects/**/*.ts", "controllers.api/**/*.ts", "helpers/**/*.ts", "data/**/*.ts"]
alwaysApply: true
---

# Playwright Framework Handbook

> **Purpose**: This file governs how the MCP **implements** Playwright tests in TypeScript. It is the implementation companion to `ai-planning-standards.md` (which governs how to **define** test cases and MCP-Ready test plans).
>
> **Role separation**:
>
> | File | When loaded | Governs |
> |------|-------------|---------|
> | `ai-planning-standards.md` | Creating test cases / writing test plans | WHAT tests to write, HOW to specify them in `*.plan.md` |
> | `ai-coding-standards.md` (this file) | Implementing tests / writing code | HOW to translate plan specs into `*.spec.ts` + Page Objects + helpers |
>
> The two files are typically used in **separate prompts** for **separate tasks**. Cross-cutting rules that apply to both processes are briefly reminded in both files (full detail lives in the appropriate authority).

---

## Quick Overview

**Critical Blocks** (apply to entire document):

- ⚠️ Implementation Source — Read the Test Plan First
- ⚠️ Cross-Cutting Reminders (also enforced in `ai-planning-standards.md`)

**Chapters**:

1. Mandatory Rules
2. Coding Patterns & Standards
3. Framework Structure
4. Debugging Strategy

---

## Detailed Table of Contents

### Critical Blocks (apply to entire document)

- [⚠️ Implementation Source — Read the Test Plan First](#️-critical-implementation-source--read-the-test-plan-first)
- [⚠️ Cross-Cutting Reminders (also enforced in `ai-planning-standards.md`)](#️-critical-cross-cutting-reminders-also-enforced-in-ai-planning-standardsmd)

### 1. Mandatory Rules

| #      | Rule                                                                                                        | Level        |
|--------|-------------------------------------------------------------------------------------------------------------|--------------|
| RULE 1 | [No Assumptions Policy](#rule-1-no-assumptions-policy)                                                      | 🔴 Mandatory |
| RULE 2 | [Complete Requirements — Never Skip Tests](#rule-2-complete-requirements--never-skip-tests)                 | 🔴 Mandatory |
| RULE 3 | [Never Simplify Requirements](#rule-3-never-simplify-requirements)                                          | 🔴 Mandatory |
| RULE 4 | [Never Combine or Split Tests](#rule-4-never-combine-or-split-tests)                                        | 🔴 Mandatory |
| RULE 5 | [Never Modify Test Names, IDs, Tags, Test Info](#rule-5-never-modify-test-names-ids-tags-test-info)         | 🔴 Mandatory |
| RULE 6 | [No Flaky Tests — Must Pass Sequentially](#rule-6-no-flaky-tests--must-pass-sequentially)                   | 🔴 Mandatory |
| RULE 7 | [Keep Backward Compatibility](#rule-7-keep-backward-compatibility)                                          | 🔴 Mandatory |
| RULE 8 | [Keep Test Plan Up to Date](#rule-8-keep-test-plan-up-to-date)                                              | 🔴 Mandatory |
| RULE 9 | [Notify User on Task Completion](#rule-9-notify-user-on-task-completion)                                    | ✅ Default   |

### 2. Coding Patterns & Standards

| #           | Pattern                                                                                                 | Level            |
|-------------|---------------------------------------------------------------------------------------------------------|------------------|
| PATTERN 1   | [Best Practices](#pattern-1-best-practices)                                                             | ✅ Best Practice |
| PATTERN 2   | [Inline All Logic](#pattern-2-inline-all-logic)                                                         | 🔴 Mandatory     |
| PATTERN 3   | [Avoid Control Flow in Tests](#pattern-3-avoid-control-flow-in-tests)                                   | ✅ Best Practice |
| PATTERN 4   | [Prefer Data Objects over Inline Data](#pattern-4-prefer-data-objects-over-inline-data)                 | ✅ Best Practice |
| PATTERN 5   | [Assertions in Tests Only](#pattern-5-assertions-in-tests-only)                                         | 🔴 Mandatory     |
| PATTERN 6   | [Locator Properties at Top of Page Objects](#pattern-6-locator-properties-at-top-of-page-objects)       | ⚙️ Regular       |
| PATTERN 7   | [Adding New Functions to Files](#pattern-7-adding-new-functions-to-files)                               | ⚙️ Regular       |
| PATTERN 8   | [Unify Pre-conditions When Possible](#pattern-8-unify-pre-conditions-when-possible)                     | ✅ Best Practice |
| PATTERN 9   | [No Arbitrary Timeouts](#pattern-9-no-arbitrary-timeouts)                                               | 🔴 Mandatory     |
| PATTERN 10  | [Check Timeouts for Real Root Cause](#pattern-10-check-timeouts-for-real-root-cause)                    | 🔴 Mandatory     |
| PATTERN 11  | [Notification Tests — Use Promise.all](#pattern-11-notification-tests--use-promiseall)                  | 🔴 Mandatory     |
| PATTERN 12  | [Test Execution Setup](#pattern-12-test-execution-setup)                                                | ⚙️ Regular       |
| PATTERN 13  | [Test Naming & Tagging](#pattern-13-test-naming--tagging)                                               | 🔴 Mandatory     |
| PATTERN 14  | [Static Test Names for Reporting](#pattern-14-static-test-names-for-reporting)                          | ⚙️ Regular       |
| PATTERN 15  | [When to Ask for More Information](#pattern-15-when-to-ask-for-more-information)                        | ⚙️ Regular       |
| PATTERN 16  | [Minimum Lines for Long Expressions](#pattern-16-minimum-lines-for-long-expressions)                   | ✅ Best Practice |
| PATTERN 17  | [Implement Only With Enough Info — No Skip-Tests](#pattern-17-implement-only-with-enough-info--no-skip-tests) | 🔴 Mandatory     |
| PATTERN 18  | [Partial Automation — Explicit STUB Breakpoints](#pattern-18-partial-automation--explicit-stub-breakpoints) | ⚙️ Regular       |
| PATTERN 19  | [No Outdated or Redundant Comments](#pattern-19-no-outdated-or-redundant-comments)                          | 🔴 Mandatory     |

### 3. Framework Structure

| #      | Section                                                                                   |
|--------|-------------------------------------------------------------------------------------------|
| 3.1    | [Quick Start Checklist](#31-quick-start-checklist)                                        |
| 3.2    | [Project Layout & Ownership](#32-project-layout--ownership)                               |
| 3.3    | [Fixtures & Roles](#33-fixtures--roles)                                                   |
| 3.4    | [CanoniJcal Test Pattern](#34-canonical-test-pattern)                                      |
| 3.5    | [Helper & Data Usage](#35-helper--data-usage)                                             |
| 3.5.1  | [General Helpers](#general-helpers)                                                       |
| 3.5.2  | [Spec-Level Helper Functions](#spec-level-helper-functions)                               |
| 3.6    | [Page-Object Conventions](#36-page-object-conventions)                                    |
| 3.6.1  | [Locator Placement in Page Objects](#locator-placement-in-page-objects)                   |
| 3.6.2  | [Helper Function Boundaries](#helper-function-boundaries)                                 |

### 4. Debugging Strategy

| #      | Section                                                                                   |
|--------|-------------------------------------------------------------------------------------------|
| 4.0    | [Implementation Prerequisites](#40-implementation-prerequisites)                          |
| 4.1    | [Debugging Rules](#41-debugging-rules)                                                    |
| 4.1.0  | Rule 0: Backward Compatibility Check                                                      |
| 4.1.1  | Rule 1: Always Use Fixtures for Actor Context                                             |
| 4.1.2  | Rule 2: Explore Real DOM Only. Never Assume.                                              |
| 4.1.3  | Rule 3: Temp File Protocol                                                                |
| 4.1.4  | Rule 4: Stable Locators First                                                             |
| 4.2    | [Implementation Workflow](#42-implementation-workflow)                                    |
| 4.2.1  | Phase 1: First Chunk — Incremental Development                                            |
| 4.2.2  | Phase 2: Complete Each Chunk                                                              |
| 4.2.3  | Phase 3: Final Integration                                                                |
| 4.3    | [Decision Tree: When Tests Fail](#43-decision-tree-when-tests-fail)                       |
| 4.3.1  | Locator Debugging Rule                                                                    |
| 4.4    | [Key Principles](#44-key-principles)                                                      |
| 4.5    | [Commands Quick Reference](#45-commands-quick-reference)                                  |
| 4.6    | [Workflow Summary](#46-workflow-summary)                                                  |

---

## ⚠️ CRITICAL: Implementation Source — Read the Test Plan First

**Every test you implement MUST come from an MCP-Ready test plan** (`*.plan.md`, defined in `ai-planning-standards.md §12`).

When implementing, the MCP receives **resolved input data** from the plan. You MUST find these in the plan's per-test spec block (`ai-planning-standards.md §12.1` Full Spec Block):

| Plan provides → | Implementation translates to → |
|-----------------|-------------------------------|
| **Fixture** (e.g., `buyer`) | `test("...", async ({ buyer }) => {...})` |
| **Test ID** (e.g., `@T1a2b3c4d`) | Embedded in test name: `test("Buyer can ... @T1a2b3c4d", ...)` |
| **Tags** (e.g., `@smoke @edge`) | `test("...", { tag: ["@smoke", "@edge"] }, ...)` |
| **Preconditions** (entity + creator API) | API setup at start of test or in `beforeAll` |
| **Test Data** (exact values) | Data object at top of test (PATTERN 4) |
| **User Journey Steps** (numbered, atomic) | Sequential Page Object method calls |
| **Resolved Locators** (`data-testid` listed) | Page Object property block (PATTERN 6) |
| **Expected Assertions** (locator + method + value) | `expect()` calls in test body (PATTERN 5) |
| **Stability Notes** (waits, races) | `waitFor()` in Page Objects (RULE 6); `Promise.all` for async (PATTERN 11) |
| **Cleanup Contract** | `afterEach` / `afterAll` if mutation requires it |
| **API Side-Effects** (optional) | `waitForResponse()` checks |

**If the plan is incomplete (missing fixture, locators, data, or assertions): STOP. Do NOT improvise.** Apply RULE 1 (No Assumptions) and PATTERN 17 (No Skip-Tests) — leave the test as commented stub and inform the user. The plan author owes you the resolved data; you do not invent it.

---

## ⚠️ CRITICAL: Cross-Cutting Reminders (also enforced in `ai-planning-standards.md`)

These rules apply to BOTH planning and implementation. Brief reminders here; full authority lives in the linked sections.

| # | Rule (1-line reminder) | Authority |
|---|------------------------|-----------|
| 1 | **Never assume** — search → debug → ask user. Wrong assumptions = flaky tests | [RULE 1](#rule-1-no-assumptions-policy) |
| 2 | **Never skip tests** from the plan — implement all, even if difficult | [RULE 2](#rule-2-complete-requirements--never-skip-tests), [PATTERN 17](#pattern-17-implement-only-with-enough-info--no-skip-tests) |
| 3 | **Never modify** test names, IDs, tags, or descriptions unless user explicitly asks | [RULE 5](#rule-5-never-modify-test-names-ids-tags-test-info) |
| 4 | **Never combine or split** tests — one plan test = one `test()` block | [RULE 4](#rule-4-never-combine-or-split-tests) |
| 5 | **Test name MUST include `@T...` Test ID** at the end | [PATTERN 13](#pattern-13-test-naming--tagging) + see `ai-planning-standards.md §3` |
| 6 | **Locator priority**: `getByTestId` > `getByRole` > `getByLabel` > CSS > XPath (last resort) | [§4.1 Rule 4](#rule-4--stable-locators-first-avoid-flaky-selectors) |
| 7 | **Never `getByText()`** for content under test — locate by stable selector, assert text separately | [§4.1 Rule 4](#rule-4--stable-locators-first-avoid-flaky-selectors) |
| 8 | **No `waitForTimeout()`** — use specific waits (URL, response, locator state) | [PATTERN 9](#pattern-9-no-arbitrary-timeouts) |
| 9 | **Notification tests** with multiple recipients MUST use `Promise.all` | [PATTERN 11](#pattern-11-notification-tests--use-promiseall) |
| 10 | **Tests MUST pass 3x sequentially** — `--workers=1 --repeat-each=3`, no flakiness | [RULE 6](#rule-6-no-flaky-tests--must-pass-sequentially) |
| 11 | **`expect()` only in tests** — never in Page Objects, helpers, or hooks | [PATTERN 5](#pattern-5-assertions-in-tests-only), [RULE 6](#rule-6-no-flaky-tests--must-pass-sequentially) |
| 12 | **Preserve backward compatibility** when modifying helpers / Page Object methods | [RULE 7](#rule-7-keep-backward-compatibility) |

**For planning-side enforcement** of these rules (e.g., what the plan author writes in `*.plan.md`), see `ai-planning-standards.md` — especially §12 (MCP-Ready specs), §16 (Stability Contract), §22 (Critical Rules Reference).

---

## 1. Mandatory Rules

All rules below are **MANDATORY** unless explicitly marked otherwise.

### Rule 1: No Assumptions Policy

**NEVER USE assumptions.** If any logic, workflow, data structure, locator, or anything else is not obvious:

1. **First**: Search the codebase for similar patterns or existing implementations
2. **Second**: Debug and explore it yourself (create temp spec file with fixtures using login storageState, run in headed mode with console.logs and browser DevTools - do NOT ask user to debug for you)
3. **Third**: If no success after reasonable attempts, **ASK the user for clarification**

**Never assume** how something works, what a locator should be, or how data flows. Wrong assumptions lead to flaky tests, incorrect implementations, and wasted debugging time.

---

### Rule 2: Complete Requirements — Never Skip Tests ❌🔴

**NEVER remove or skip tests from test-plan when implementing code**

- ✅ CORRECT: Implement ALL tests defined in the test plan, even if challenging
- ✅ If logic description or locators are missing — leave the test not implemented but with text steps described under comments, and a note pointing out what information is lacking
- ❌ WRONG: Skipping or removing tests because they are difficult to implement or debug
- **Why**: Test plan completeness ensures full coverage; difficulty is not a valid reason to skip tests
- **Note**: Even if it is not easy to implement or debug these tests, ALL tests must be implemented

---

### Rule 3: Never Simplify Requirements ❌🔴

**You MUST NEVER simplify or weaken test requirements**

- ✅ CORRECT: Implement requirements exactly as specified in the test plan
- ❌ WRONG: Weakening conditions to make tests easier to pass
- **Why**: Simplified requirements reduce test coverage and may miss real bugs

Examples:
```typescript
// ❌ BAD: Simplified requirement (WRONG!)
// Original: "Each row in search results must contain search text"
// Simplified to: "At least one row in search results must contain search text"
const hasMatch = rows.some(row => row.includes(searchText));
expect(hasMatch).toBe(true);

// ✅ GOOD: Exact requirement implemented
// "Each row in search results must contain search text"
for (const row of rows) {
  expect(row).toContain(searchText);
}
// OR
const allMatch = rows.every(row => row.includes(searchText));
expect(allMatch, `All rows must contain "${searchText}". Found: ${rows}`).toBe(true);
```

**Common simplification anti-patterns to avoid:**
- "Each" → "At least one" (`.every()` → `.some()`)
- "All fields" → "Some fields"
- "Exact match" → "Contains"
- "Must be sorted" → "First item is correct"
- "No errors" → "Less than N errors"

---

### Rule 4: Never Combine or Split Tests ❌🔴

**NEVER combine multiple tests into one or split one test into multiple**

- ❌ **DO NOT** combine two similar tests into one "more efficient" test
- ❌ **DO NOT** split one test into multiple smaller tests
- ✅ **ONLY** move tests between spec files/suites if it makes more logical sense
- ✅ **PRESERVE** each test as a separate, individual test exactly as provided

**Why**: Each test has a unique ID for tracking and reporting. Combining or splitting tests breaks test management systems, reporting dashboards, and test history tracking.

Examples:
```typescript
// User provides 3 separate filter tests:
// @Ta6c7537c: "Buyer can filter by product name"
// @Tbc5d1a13: "Buyer can filter by brand name"
// @Td7133231: "Buyer can filter by units"

// ❌ WRONG: Combining into one "efficient" test
test("Buyer can filter products by multiple fields @Ta6c7537c", async ({ buyer }) => {
  // Tests all three filters in one test - WRONG!
});

// ✅ CORRECT: Keep each test separate
test("Buyer can filter products by grade @Ta6c7537c", async ({ buyer }) => { });
test("Buyer can filter products by brand name @Tbc5d1a13", async ({ buyer }) => { });
test("Buyer can filter products by units @Td7133231", async ({ buyer }) => { });
```

**Acceptable changes:**
- Moving tests between spec files (e.g., from `listing-view.spec.ts` to `listing-filtering.spec.ts`)
- Reordering tests within a file for better organization
- NOT acceptable: Changing the number of tests

---

### Rule 5: Never Modify Test Names, IDs, Tags, Test Info ❌🔴

**YOU MUST NEVER change existing test names, tags, or any other provided test information — unless the user explicitly asks**

- ✅ CORRECT: Keep the original test name, tags, and structure exactly as provided/existing
- ❌ WRONG: Renaming tests to "simplify" or "clarify" them
- ❌ WRONG: Changing a test name because the original seems too long or complex
- ❌ **DO NOT** add any additional tests beyond what the user provided
- ❌ **DO NOT** remove any tests from the provided list
- ❌ **DO NOT** edit, add, remove, or modify test tags (CRUD operations on tags are forbidden)
- ❌ **DO NOT** change test descriptions or requirements
- ✅ **ONLY** modify tests when the user explicitly asks for specific changes
- **Why**: Test names and tags are used for tracking, reporting, and test management systems. Changing them breaks traceability and history.

Examples:
```typescript
// ❌ BAD: Changed test name (WRONG!)
// Original: "In-app notifications sent for new listing (supplier, staff, any buyer w listings product in preferences)"
// Changed to: "Staff receives notification with supplier name format"
test("Staff receives notification with supplier name format @T505e8e82", ...);

// ✅ GOOD: Original test name preserved exactly
test("In-app notifications sent for new listing (supplier, staff, any buyer w listings product in preferences) @T505e8e82", ...);

// User provides: "Create tests @T123, @T456, @T789"

// ❌ WRONG: Adding extra test not in user's list
test("Extra helpful test @Textra", ...);  // NOT REQUESTED!

// ❌ WRONG: Removing test because it seems redundant
// Skipping @T789 because it's similar to @T456  // WRONG!

// ❌ WRONG: Changing provided tag format
test("Test case @T_123", ...);  // Changed from @T123 - WRONG!

// ❌ WRONG: "Improving" the test name
// Original: "Supplier can create listing @T123"
// Changed to: "Supplier creates new inventory listing with products @T123"  // WRONG!

// ✅ CORRECT: Implement exactly as provided
test("Supplier can create listing @T123", ...);  // Exact name and tag preserved
```

**If something seems incorrect in the provided test list:**
- Ask the user for clarification before making changes
- Do not assume what the user "really meant"
- Implement as provided, then ask if changes are needed

---

### Rule 6: No Flaky Tests — Must Pass Sequentially ❌🔴

**Tests MUST pass when running ALL tests sequentially, not just when running one-by-one**

- ✅ CORRECT: Tests pass consistently when running the entire test suite with `--workers=1`
- ❌ WRONG: Tests that fail in full suite run but pass when run individually
- ❌ WRONG: Claiming "it's just timing flakiness" - this is NOT acceptable
- **Why**: The purpose of tests is to run them all together. A test that only passes alone is broken.

**Requirements:**
1. Always validate tests by running the FULL spec file: `npx playwright test path/to/spec.ts --workers=1`
2. If a test fails in full run but passes alone, FIX IT - add waits in Page Object methods
3. Never accept "passed on retry" as success - investigate and fix the root cause

**Waits MUST be in Page Objects, NOT in tests:**
```typescript
// ❌ BAD: Waits scattered in test files
await expect(button).toBeVisible();
await expect(button).toBeEnabled();
await button.click();

// ✅ GOOD: Page Object method with built-in waits (using waitFor, NOT expect)
// In PageObject:
async clickButton() {
  await this.button.waitFor({ state: "visible" });
  await this.button.click();
}

async continue() {
  await this.continueButton.waitFor({ state: "visible" });
  await this.continueButton.click();
}

// In test (clean):
await page.clickButton();
await page.continue();
```

**Page Object wait patterns (use `waitFor`, not `expect`):**
```typescript
// Wait for visibility before click
await this.button.waitFor({ state: "visible" });
await this.button.click();

// Wait for dropdown options to appear
await this.dropdown.click();
await this.option.first().waitFor({ state: "visible" });

// Wait for dialog to close
await this.dialogButton.click();
await this.dialogButton.waitFor({ state: "hidden" });
```

**🚨 CRITICAL: NEVER use `expect()` or assertions in Page Objects:**
- ❌ **NEVER** use `expect()` in Page Object methods
- ❌ **NEVER** use any assertion (`toBe`, `toBeVisible`, `toContain`, etc.) in Page Objects
- ✅ **ONLY** use `waitFor()` for waiting in Page Objects
- ✅ **ALL** assertions belong in test files, not Page Objects

```typescript
// ❌ BAD: Assertion in Page Object (FORBIDDEN!)
async expectListingPublished() {
  await expect(this.statusPublished).toBeVisible();  // WRONG!
}

// ✅ GOOD: Wait method in Page Object, assertion in test
// Page Object:
async waitForListingPublished() {
  await this.page.waitForURL(/\/listings\/[A-Z0-9]+/);
  await this.statusPublished.waitFor({ state: "visible" });
}

// Test:
await supplier.listingPage.waitForListingPublished();
await expect(supplier.listingPage.statusPublished).toBeVisible();
```

**⚠️ Exception (ONLY when absolutely unavoidable):**
If an assertion in Page Object is critically required and there's no other way to implement it:
1. Add a prominent comment: `// ⚠️ RULE VIOLATION: expect() in Page Object - [reason why unavoidable]`
2. Document the justification clearly
3. Consider if refactoring is possible to move assertion to test

```typescript
// ⚠️ RULE VIOLATION: expect() in Page Object - Complex state verification
// that must happen atomically before proceeding. Refactoring not possible
// because [specific technical reason].
async verifyComplexState() {
  await expect(this.element).toBeVisible();  // Documented exception
}
```

**Anti-patterns that cause flakiness:**
- Using `expect()` in Page Objects (use `waitFor()` instead)
- Not waiting for dialogs/modals to close
- Not waiting for dropdown options to load
- Race conditions with element state changes

---

### Rule 7: Keep Backward Compatibility ❌🔴

**While creating tests, you MUST use EXISTING helpers and EXISTING PageObject methods and locators.**

If a helper or method needs modification for a new test, you MUST choose one of:
- **Parametrize** the existing functionality (add an optional parameter)
- **Update all other code** that uses this helper/method to align with the new behavior
- **Do not modify** the existing helper/method at all — create a new one instead

In all cases: **backward compatibility to existing functionality MUST be preserved.**

See also: [3.6 Page-Object Conventions](#36-page-object-conventions)

---

### Rule 8: Keep Test Plan Up to Date ❌🔴

**Always keep the Test Plan up to date.** Apply updates:
- After each test implementation or refactoring
- After each new locator exploration
- After receiving new information from the user about logic, flows, or locators

---

### Rule 9: Notify User on Task Completion ✅

**Always send a Discord notification to the task channel when a task is finished**

- ✅ DEFAULT: Send notification to Discord task channel when task completes
- ✅ CORRECT: Use `npx tsx helpers/DiscordNotifications.ts "Task Name" --status completed --details "Summary"`
- ❌ SKIP ONLY IF: User explicitly asks "do not notify" or "no notification"
- **Why**: User may not be actively watching the chat; Discord notification ensures they know when work is done

**Command format:**
```bash
# Success notification
npx tsx helpers/DiscordNotifications.ts "Task Name" --status completed --details "What was done"

# Failure notification
npx tsx helpers/DiscordNotifications.ts "Task Name" --status failed --error "What went wrong"

# With files created
npx tsx helpers/DiscordNotifications.ts "Test Creation" --status completed --file "tests/new-test.spec.ts" --file "page-objects/NewPage.ts"
```

**Note**: This uses `DISCORD_TASK_WEBHOOK_URL` from `.env` file (separate channel from test reports).

---

## 2. Coding Patterns & Standards

### Pattern 1: Best Practices

1. **Imports**: Group in order—fixtures → Playwright → constants/types → helpers/data → local modules.
2. **Enums & Types**: Use enums and types from `@constants` (ShippingTerms, PaymentTerms, Currency, MainMenuItem, etc.); avoid string literals or inline union types.
3. **Dynamic Data**: Use helpers (e.g., `generateFutureDate`) instead of hardcoded values.
4. **Random Values**: Store generated random values and reuse them within the test.
5. **Setup via API**: Seed prerequisites using controllers when appropriate (e.g., create listings before testing offers).
6. **UI Creation**: Only build entities via UI when that UI flow is what you are testing.
7. **Waits**: Replace fixed delays with explicit waits (`toBeVisible`, `waitForURL`, etc.).
8. **Step Naming**: Format steps as `"Role: Action"` (e.g., `"Supplier: Publish listing"`).
9. **Test Isolation**: Each test must be self-contained, navigate to starting URL fresh, set initial state, and have no dependencies between tests. Tests must run in any order.
10. **DRY**: Extract repeated logic to helpers or page objects.
11. **Assertion Quality**: Always include descriptive context and actual values in assertion messages.
    ```typescript
    // ❌ BAD: Vague assertion
    expect(result).toBe(true);

    // ✅ GOOD: Descriptive assertion with context
    expect(ascResult.sorted, `${column} values should be sorted asc. Got: ${JSON.stringify(values.slice(0, 5))}`).toBe(true);
    ```
    **For long assertion messages**: Extract to `const failMessage` to keep expect statements on one line:
    ```typescript
    // ❌ BAD: Multi-line expect with long message
    expect(
      listingWithTwoWords,
      "Can't verify search by Listing name with 2 words, no such values found on any page"
    ).not.toBeNull();

    // ✅ GOOD: Extract message to const, keep expect on one line
    const failMessage = "Can't verify search by Listing name with 2 words, no such values found on any page";
    expect(listingWithTwoWords, failMessage).not.toBeNull();
    ```
12. **Debug Logging**: Use `debugPrint()` helper from `helpers/methods.ts` for consistent debug logging.
    ```typescript
    import { debugPrint } from "helpers/methods";

    // Log first N items for troubleshooting
    debugPrint(`${column} ASC values:`, values.slice(0, 5));
    debugPrint(`API Response status:`, response.status);
    ```
    - Automatically adds `[DEBUG]` prefix with yellow color coding
    - Only outputs when `DEBUG_MODE=true` environment variable is set
    - Accepts multiple arguments like `console.log()`
13. **Value Normalization**: Always normalize/clean data before comparisons to eliminate flaky failures from whitespace.
    ```typescript
    function normalizeValues(values: string[]): string[] {
      return values.map((value) => value.trim());
    }
    const values = normalizeValues(await page.getColumnValues(column));
    ```
14. **Test Organization**: Use clear section separators for test organization in large test files.
    ```typescript
    test.describe("Feature name", () => {
      // ==================== BUYER TESTS ====================
      test("Buyer performs action A", async ({ buyer }) => { });

      // ==================== SUPPLIER TESTS ====================
      test("Supplier performs action A", async ({ supplier }) => { });

      // ==================== STAFF TESTS ====================
      test("Staff performs action A", async ({ staff }) => { });
    });
    ```

---

### Pattern 2: Inline All Logic ❌🔴

**Tests MUST contain all steps inside them — NO hidden steps in helpers or page objects**

- ✅ CORRECT: All test logic visible in the test body (navigation, interactions, verifications)
- ❌ WRONG: Tests that only call 2-3 external functions hiding all the logic

---

### Pattern 3: Avoid Control Flow in Tests ✅

**Try to avoid `if-else`, `try-catch`, etc. blocks in tests unless absolutely necessary**

- ✅ CORRECT: Put conditional logic inside helpers and page objects
- ❌ WRONG: Tests filled with `if-else` and `try-catch` blocks
- **Why**: Tests should be linear and readable; complex control flow belongs in helpers

---

### Pattern 4: Prefer Data Objects over Inline Data ✅

**Try to avoid inline test data. Use data objects at the beginning of tests instead.**

All test data must be defined as a variable or object at the beginning of the test — not scattered inline step by step. If an update scenario is needed, have one object for initial data and another for the updated values.

- ✅ CORRECT: Define `ListingTestInput` or similar data object at test start
- ❌ WRONG: Inline values scattered throughout test steps
- **Why**: Data objects improve readability, maintainability, and enable Page Object methods to handle complex flows correctly

Examples:
```typescript
// ❌ BAD: Inline data scattered throughout test
test("Create listing with quality", async ({ supplier }) => {
  await supplier.listingCreatePage.setListingTitle(`Test ${getUniqueTitle()}`);
  await supplier.listingCreatePage.selectListingType(ListingType.Inventory);
  // ... 20 lines later
  await supplier.listingCreatePage.productQuantity.fill("1000");
  await supplier.listingCreatePage.qualityDropdown.click();
  await supplier.page.getByRole("option", { name: "Prime Grade" }).click();
  // ... more inline values
});

// ✅ GOOD: Data object at test start
test("Create listing with quality", async ({ supplier }) => {
  const listingData: ListingTestInput = {
    title: `Quality Test ${getUniqueTitle()}`,
    listingType: ListingType.Inventory,
    tradeMode: TradeMode.Auction,
    products: [
      { productName: "Testliner", quality: ProductQuality.PrimeGrade, units: ProductUnits.Reels },
      { productName: "Kraftliner", quality: ProductQuality.NonPrimeGrade, units: ProductUnits.Reels },
    ],
  };

  await supplier.listingCreatePage.setListingTitle(listingData.title!);
  await supplier.listingCreatePage.selectListingType(listingData.listingType!);
  await supplier.listingCreatePage.addProductsToInventory(listingData.products);
});
```

**Benefits of data objects:**
- Clear test data visibility at test start
- Page Object methods can properly handle complex flows (quality → defects, etc.)
- Easier to modify test data
- Reusable patterns across tests
- Better test documentation

---

### Pattern 5: Assertions in Tests Only ❌🔴

**`expect` assertions MUST be inside `test(...)` bodies only — NOT in helpers, page object methods, or any hook (`beforeAll`, `beforeEach`, `afterEach`, `afterAll`)**

- ✅ CORRECT: `expect(value).toBe(expected)` inside test body
- ❌ WRONG: `expect(value).toBe(expected)` inside helper function or page object method
- ❌ WRONG: `expect(value).toBe(expected)` inside `beforeAll`, `beforeEach`, `afterEach`, or `afterAll`

**In hooks, use `waitFor()` instead of `expect()` for all waiting:**

```typescript
// ❌ BAD: expect() in beforeEach — causes misleading failures on hook, not test
test.beforeEach(async ({ buyer }) => {
  await buyer.listingPage.openListingById(listingId);
  await expect(buyer.listingPage.viewOffersButton).toBeVisible({ timeout: 10000 }); // WRONG
  await buyer.listingPage.viewOffersButton.click();
  await expect(buyer.listingPage.offerRow.nth(1)).toBeVisible({ timeout: 10000 }); // WRONG
});

// ✅ GOOD: waitFor() in beforeEach — correct way to wait in hooks
test.beforeEach(async ({ buyer }) => {
  await buyer.listingPage.openListingById(listingId);
  await buyer.listingPage.viewOffersButton.waitFor({ state: "visible" });
  await buyer.listingPage.viewOffersButton.click();
  await buyer.listingPage.offerRow.nth(1).waitFor({ state: "visible" });
});
```

**Why:** `expect()` in hooks reports failures against the hook, not the test, making error messages misleading and breaking test reporting. Hooks are setup code — use `waitFor()` to wait for state; leave `expect()` for test assertions only.

---

### Pattern 6: Locator Properties at Top of Page Objects ⚙️

**All locator class properties must be declared in the properties block at the TOP of the class, before any methods**

- ✅ CORRECT: All `public`/`private` locator properties declared together in the property block at the start of the class body
- ❌ WRONG: Inserting locator properties between methods or at the end of the class
- **Why**: Locators are the "API surface" of a Page Object. Keeping them together at the top makes them easy to find, review, and extend without reading through method implementations

```typescript
// ✅ GOOD: All properties first, all methods after
export class FeaturePage extends BasePage {
  // Properties block
  public status = this.page.getByTestId("status-label");
  public submitButton = this.page.getByTestId("submit-btn");
  // ... more properties

  // Methods block (always AFTER all properties)
  async clickSubmit() {
    await this.submitButton.waitFor({ state: "visible" });
    await this.submitButton.click();
  }
}

// ❌ WRONG: Property declared between or after methods
export class FeaturePage extends BasePage {
  public status = this.page.getByTestId("status-label");

  async clickSubmit() { ... }

  public submitButton = this.page.getByTestId("submit-btn"); // ❌ After a method
}
```

---

### Pattern 7: Adding New Functions to Files ⚙️

**When editing helper files or page object files, add new functions to the END of the file**

- ✅ CORRECT: Append new functions at the end of the corresponding file
- ❌ WRONG: Adding new functions at the very beginning of the file
- **Why**: Maintains consistency and makes it easier to track new additions; preserves existing structure

---

### Pattern 8: Unify Pre-conditions When Possible ✅

**Always check if tests really need unique pre-conditions, or if a shared pre-condition can be used**

Before creating a dedicated pre-condition (e.g., Listing/Offer creation) per test, evaluate whether:
- A single entity created in `beforeAll`/`beforeEach` can serve the whole describe block
- Grouping tests that share the same pre-condition reduces complexity and execution time

- ✅ CORRECT: One Listing created in `beforeAll`, shared across multiple tests in the group
- ❌ WRONG: Every test creates its own Listing when they all test the same entity state

---

### Pattern 9: No Arbitrary Timeouts ❌🔴

**`page.waitForTimeout(500)` may be used for DEBUG ONLY — in ready-to-use tests it MUST be replaced**

- ✅ CORRECT: Use `waitForSelector()`, `waitForLoadState()`, `waitForResponse()`, or element state waits
- ❌ WRONG: Using `waitForTimeout()` in production tests
- **Why**: Arbitrary timeouts make tests flaky and slower; use deterministic waits instead

Examples:
```typescript
// ❌ BAD: Arbitrary timeout (DEBUG ONLY)
await page.waitForTimeout(500);  // Don't know what we're waiting for!

// ✅ GOOD: Wait for specific state/element/response
await page.waitForSelector('[role="columnheader"].sorted');
await page.waitForLoadState('networkidle');
await page.waitForResponse(response => response.url().includes('/api/'));
await expect(page.locator('.indicator')).toBeVisible();
```

---

### Pattern 10: Check Timeouts for Real Root Cause ❌🔴

**If a test fails with a timeout, do NOT just mark it as STUB or increase the timeout value.**

Steps to diagnose:
1. Make a screenshot and verify the page actually failed to load (system issue) vs. the page loaded but a locator is wrong
2. There is a high probability the page loaded correctly but the test is waiting for an incorrect locator or an unmet condition for an element to appear/be active
3. Fix the root cause (wrong locator or missing wait condition) — never mask it with a higher timeout

---

### Pattern 11: Notification Tests — Use Promise.all ❌🔴

**For notification tests with multiple actors expecting notifications, ALWAYS use Promise.all**

- ✅ CORRECT: Use `Promise.all()` to wait for all notifications in parallel
- ❌ WRONG: Sequential assertions for multiple notification recipients
- **Why**: Notifications arrive in unpredictable order. Sequential waits will fail if notifications arrive out of order.

Examples:
```typescript
// ❌ BAD: Sequential assertions (WRONG! - will fail if notifications arrive in different order)
expect(await buyer.dashboardPage.waitForNotification(expectedText)).toBe(true);
expect(await otherBuyer.dashboardPage.waitForNotification(expectedText)).toBe(true);
expect(await staff.dashboardPage.waitForNotification(expectedTextStaff)).toBe(true);

// ✅ GOOD: Parallel waits with Promise.all
const results = await Promise.all([
  buyer.dashboardPage.waitForNotification(expectedText, NOTIFICATION_TIMEOUT.default),
  otherBuyer.dashboardPage.waitForNotification(expectedText, NOTIFICATION_TIMEOUT.default),
  staff.dashboardPage.waitForNotification(expectedTextStaff, NOTIFICATION_TIMEOUT.default),
]);
expect(results, "All users should receive notification").toEqual([true, true, true]);
```

**Note**: This rule applies only when multiple actors should ALL receive notifications. For tests checking that some actors should NOT receive notifications (negative cases), sequential checks are acceptable since the order matters for the test logic.

---

### Pattern 12: Test Execution Setup ⚙️

Use the following rules every time new tests are created or updated:

- **Authentication**: `supplier`, `buyer`, and `staff` fixtures automatically authenticate via `tests-ai/seed.spec.ts`.
- **Required Header**: The `x-vercel-protection-bypass` header is already configured in `playwright.config.ts` for the `tests-ai` project (line 108). Browsers cannot open pages without it.
- **Project Configuration**: Run the suite under the `tests-ai` project unless instructed otherwise.

**Timeout Configuration**
- Default timeout: 20 seconds (site responses are consistently faster).
- If a locator is not visible within the default timeout, do **not** increase the timeout; verify the locator or choose an alternative.
- Rationale: The site is stable; timeout failures usually mean incorrect locators, not slow performance.

**Retry Configuration**
- When debugging, set retry to 1 to shorten execution time.
- The site is stable enough that more than one retry is rarely useful.

**Locator Strategy (Critical Rules)**
- Never rely on assumed locators; explore the actual page using Playwright locator tools.
- If the page cannot be inspected, stop and request access — do **not** proceed with guesses.
- Preferred locator order:
  1. `getByTestId()`
  2. `locator('[DATA-ID=...]')`
  3. `getByRole()` with accessible roles
  4. `getByLabel()` for form fields
  5. XPath or CSS selectors only as a last resort

---

### Pattern 13: Test Naming & Tagging ⚙️

- Never modify existing test names or tags.
- Do not add new tags unless the prompt explicitly requests them.
- Prompts will supply the folder name for new suites; follow Playwright best practices for file and subfolder naming (dash-separated names, consistent casing) unless directed otherwise.

---

### Pattern 14: Static Test Names for Reporting ⚙️

**Use static test names (not parameterized strings) for consistent reporting**

```typescript
// ❌ BAD: Dynamic test name (breaks reporting)
const columns = ["Supplier", "Amount", "Status"];
columns.forEach(col => {
  test(`Test sorting ${col}`, async () => { }); // Different name each time
});

// ✅ GOOD: Static test name (consistent reporting)
test("Buyer sorts Offers by Supplier field", async ({ buyer }) => { });
test("Buyer sorts Offers by Amount field", async ({ buyer }) => { });
test("Buyer sorts Offers by Status field", async ({ buyer }) => { });
```

**Recommended Pattern:**
- Format: `"{Role} {action} {entity} by {field} field"`
- Examples:
  - "Buyer sorts Offers by Supplier field"
  - "Supplier creates Listing with Amount field"
  - "Staff filters Orders by Status field"

**Benefits:**
- Consistent test names across test runs
- Easier to track test history in reporting systems
- Better test result aggregation

---

### Pattern 15: When to Ask for More Information ⚙️

Pause and ask the user if you cannot locate required details, such as:
- Additional fixtures beyond the standard set.
- Special naming conventions demanded by a team.
- Mandatory tags or metadata not documented here.

---

### Pattern 16: Minimum Lines for Long Expressions ✅

**Use the fewest lines possible when writing multi-argument expressions such as `expect()` calls.**

Place the first argument on the same line as the opening call, and close the outer parenthesis on the same line as the last argument:

- ✅ CORRECT: Opening call + first arg on one line; last arg + closing paren + assertion on the next line
- ❌ WRONG: Opening call alone on one line, each arg on its own line, closing paren on its own line

```typescript
// ✅ GOOD — 2 lines
await expect(buyer.listingPage.offerQuantity.nth(i),
  `Row ${i}: offer-quantity should be visible`,).toBeVisible({ timeout: 10000 });

// ❌ BAD — 4 lines (unnecessary vertical spread)
await expect(
  buyer.listingPage.offerSupplierCompanyName.nth(i),
  `Row ${i}: supplier-company-name should be visible`,
).toBeVisible({ timeout: 10000 });
```

**Rule:** The closing `)` of `expect(...)` must stay on the same line as the last argument, immediately before `.toBeXxx(...)`.

---

### Pattern 17: Implement Only With Enough Info — No Skip-Tests 🔴

**Implement only tests when there is enough information to implement them fully. Do not add runnable `test.skip` (or `test` bodies that only call `test.fail`) as placeholders when locators, flows, or data are still unknown.**

Collectors and CI still see skipped tests as “tests”; empty skips add noise and imply coverage that does not exist. Prefer documentation in comments until the spec is implementable.

**BAD:**

```typescript
// ❌ BAD: Skip/fail placeholder — Playwright still reports it as a test; no real automation value.
test.skip("STUB: Supplier can click on potential buyer from sidebar and open buyer's page @T06e1841a", { tag: ["@stub"] }, async ({ supplier }) => {
  test.fail(true, "Manual debug required - buyer page navigation from potential buyers");
});
```

**GOOD:**

```typescript
// ✅ GOOD: Entire test commented out — documents intent, steps, and missing pieces without a collected skip.
// test("Supplier can click on potential buyers label - if total = transacted @Tea178893", { tag: ["@stub"] }, async ({ supplier }) => {
// Steps:
// 1. Products with potential buyers (all transacted)
// 2. Click label, assert "transacted" status for all
// Assumed STUB, manual debug from user required, locators required for button "xxx"
// });
```

**When this applies:** deferred work, missing locators, unclear preconditions, or need for manual exploration — keep the case in the test plan or as comments; add a real `test(...)` only once steps and selectors are known.

---

### Pattern 18: Partial Automation — Explicit STUB Breakpoints ⚙️

**When the user asks to automate a case but details are still missing (STUB situation): do not stop at “assumed STUB” prose only.** Spell out the intended steps (numbered comments or test plan), implement everything that is already clear (navigation, API setup, known page objects and locators), then insert a **single explicit breakpoint** where work stops.

**Breakpoint format (in the spec, at the stop line):**

```text
// STUB — cannot continue: need <locator | UI flow | test data | product decision>
```

If the test would otherwise **pass with no assertion** after the last implemented step, end with a **hard stop** so CI does not look green by accident — for example `throw new Error("STUB — cannot continue: …")` or an `expect` on the last known step. Remove the throw once the missing piece is implemented.

**Complements [Pattern 17](#pattern-17-implement-only-with-enough-info--no-skip-tests):** Pattern 17 forbids skip-only placeholders; Pattern 18 is how to still **ship partial value** when the user wants automation started before everything is known.

**BAD:**

```typescript
// ❌ BAD: “Assumed STUB” in prose only, or skip/fail placeholder — nothing real runs; Playwright still counts skips as tests.
test.skip("STUB: Supplier can click on potential buyer from sidebar and open buyer's page @T06e1841a", { tag: ["@stub"] }, async ({ supplier }) => {
  test.fail(true, "Manual debug required - buyer page navigation from potential buyers");
});
```

**GOOD:**

```typescript
// ✅ GOOD: Real test, numbered intent, automated prefix, then explicit STUB breakpoint (and hard stop so the test does not pass silently).
test("Supplier can click on potential buyers label - if total = transacted @Tea178893", { tag: ["@stub"] }, async ({ staff }) => {
  // 1. Reach context where products show potential buyers (all transacted) — automate known navigation
  await staff.companyListPage.goto();
  const searchResults = await staff.companyListPage.searchCompanyByName(companyNameToEdit);
  await staff.companyListPage.openCompanyFromSearchResults(companyNameToEdit, getRandomNumber(1, searchResults - 1));

  // 2. Open surface where the label lives; next: click label + assert "transacted" for all rows
  await staff.companyDetailPage.companyEditButton.click();

  // STUB — cannot continue: need locator (and behaviour) for [potential buyers label / link to buyer profile]
  throw new Error("STUB — cannot continue: need locator for potential buyers label after company edit");
});
```

---

### Pattern 19: No Outdated or Redundant Comments ❌🔴

**NEVER add comments that describe historical status or past implementation states.** Comments should describe current behavior, not what something "used to be" or "was previously."

- ❌ WRONG: `// ==================== PREVIOUSLY INVESTIGATION STUBS — NOW FULLY IMPLEMENTED ====================`
- ❌ WRONG: `// Was broken, now fixed`
- ❌ WRONG: `// Previously used X, now uses Y`
- ❌ WRONG: `// Old implementation removed`
- ✅ CORRECT: No comment needed — if it's implemented, it's implemented
- ✅ CORRECT: Section headers that describe current organization (e.g., `// ==================== COUNTER OFFER NOTIFICATIONS ====================`)

**Why**: 
1. Version control (git) tracks history — code comments should not duplicate this
2. Outdated comments become misleading when code evolves
3. "Previously" / "now" comments add noise without value

**Clean code principle**: If a comment describes what the code *was* rather than what it *is* or *why*, delete it.

---

## 3. Framework Structure

### 3.1 Quick Start Checklist

1. Confirm the feature under test and whether data should be seeded via API or created via UI.
2. Pick a reference test from `/tests/smoke/**` that matches the desired pattern.
3. Determine the destination folder (`/tests` vs `/tests-ai`). Prompts will explicitly provide the folder name for new suites.
4. Reuse fixtures (`{ buyer, supplier, staff, … }`), page objects, and helpers; never reimplement their logic in specs.
5. Generate dynamic data via `/data` factories and `/helpers` utilities.
6. Use enums and types from `@constants`; avoid duplicated literals or local enums.
7. Structure assertions and steps so they remain deterministic (no hard waits).
8. Run the appropriate Playwright project (`--project=tests` or `--project=tests-ai`) after changes.

---

### 3.2 Project Layout & Ownership

| Area | Purpose | Primary Usage Notes |
|------|---------|---------------------|
| `/tests/trademodes/_workflows/**` | Gold-standard of "Listing and Offer" workflow works | Use it to understand logic and next step in workflow when new tests are being created |
| `/tests/trademodes/**` | Developed and Approved tests | Can be used as reference for patterns, locators and logic |
| `/helpers/**` | Shared utilities (`@utils` alias) | e.g., `generateFutureDate`, `debugPrint`, `isPlatformEdge` |
| `/data/**` | Test data factories & defaults | e.g., `listing.data.ts`, `offer.data.ts`, `company.data.ts` |
| `/page-objects/**` | Encapsulated UI interactions | Use page-object methods exclusively; add new ones here if required |
| `/controllers.api/**` | Back-end setup helpers | Seed prerequisites when the entity itself is not under test |
| `/app/constants/**` | Enums, interfaces, taxonomy | Import enums/types via `@constants` |

---

### 3.3 Fixtures & Roles

Import fixtures from `@fixtures`. Each fixture provides:
- `page` (Playwright `Page`)
- `api` (role-specific controllers)
- Page-object instances (`listingPage`, `offerCreatePage`, `dashboardPage`, etc.)

Available fixtures include `buyer`, `supplier`, `staff`, `otherBuyer`, `otherSupplier`, and `principal`.

---

### 3.4 Canonical Test Pattern

Use `/tests/smoke/inventory-auction/listing-create.spec.ts` as the reference model:

```ts
import { test } from "@fixtures";
import { expect } from "@playwright/test";

let listing: { id: string, title?: string };

test.describe("Listing create", { tag: ["@smoke"] }, () => {
  test("Supplier can create Inventory listing", async ({ supplier }) => {
    listing = await supplier.api.listing.createInventoryAuctionListing();
    await supplier.listingPage.openListingById(listing.id);

    await expect(supplier.listingPage.page).toHaveURL(new RegExp(`/listings/${listing.id}/$`));
    expect(await supplier.listingPage.productBrandName.textContent()).toBe(listing.title);
    await expect(supplier.listingPage.status).toHaveText("Published");
  });
});
```

Key points:
- `test.describe` may include tags; do so only if the prompt specifies.
- Prefer API setup when the entity itself is not the focus of the test.
- All UI interactions go through page-object methods.
- Assertions (with the keyword `expect`) live in spec files only, never in page objects.

---

### 3.5 Helper & Data Usage

#### General Helpers

- Import utilities from `@utils` (`/helpers/methods.ts`): `generateFutureDate`, `getTimestamp`, `getCurrentDate`, `getRandomNumber`, `debugPrint`, `isPlatformEdge`.
- Use `/data/*.ts` factories for domain objects rather than handcrafting data.
- Always generate dynamic dates via `generateFutureDate`; never hardcode dates.

#### Spec-Level Helper Functions

**NEVER define helper functions inside spec files.**

All helpers must live in page objects or external helper modules — never at the top of a spec file.

- **Page Object methods** — for any interaction with or assertion about a page element (even if used in only one spec)
- **`helpers/` external utilities** — for any data transformation, parsing, or generic logic

```typescript
// ✅ CORRECT — logic in page object
// page-objects/MyPage.ts
async getNumericAmount(): Promise<number> {
  const text = await this.amountLabel.textContent() ?? "";
  const match = text.match(/[\d,]+\.?\d*/);
  return match ? parseFloat(match[0].replace(/,/g, "")) : 0;
}

// ✅ CORRECT — generic utility in helpers/
// helpers/methods.ts
export function normalizeValues(values: string[]): string[] {
  return values.map((v) => v.trim());
}

// ❌ WRONG — helper defined inside spec file
function extractAmountValue(amountStr: string): number { ... }
```

**When to use Page Object methods:**
- Any logic that reads from or interacts with the page
- Verification or parsing tied to a specific page/component

**When to use external helpers (`helpers/`):**
- Generic utilities reused across multiple spec files or page objects
- Data formatting, random data generation, date helpers, etc.

---

### 3.6 Page-Object Conventions

- Do not use raw locators in specs. Add new page-object methods instead.
- Page objects must not contain Playwright assertions (`expect`).
- **Backward compatibility is mandatory**: before removing or renaming any `public` property or method, search the entire codebase for all usages. Only remove if zero external references exist (or update every reference first). Private members may be removed freely. Use this search before any deletion:
  ```
  rg "\.propertyOrMethodName" tests/ page-objects/ tests-ai/
  ```

#### Locator Placement in Page Objects

**Locators should be defined as class properties in the constructor, not inline in methods.**

```typescript
// ✅ GOOD: Locators as class properties
export class DashboardPage extends BasePage {
  readonly spinner: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.spinner = this.page.getByTestId("circular-progress-spinner");
    this.submitButton = this.page.getByRole("button", { name: "Submit" });
  }

  async waitForSpinner() {
    await this.spinner.waitFor({ state: "hidden" });
  }
}

// ❌ BAD: Raw locators inside methods
async waitForSpinner() {
  await this.page.getByTestId("circular-progress-spinner").waitFor({ state: "hidden" });
}
```

**Exceptions** - inline locators are acceptable when:
- Locator is dynamically composed from method parameters
- Locator requires runtime values that aren't available at construction time

```typescript
// ✅ ACCEPTABLE: Dynamic locator from parameter
async clickMenuItem(name: string) {
  const menuItem = this.page.getByRole("link", { name });
  await menuItem.click();
}

// ✅ ACCEPTABLE: Composed from multiple parts
async getRowByText(text: string) {
  return this.dataGrid.locator("tr").filter({ hasText: text });
}
```

#### Helper Function Boundaries

**What Helpers/Page Objects CAN Do:**
- Return data (e.g., `getColumnValues()` returns array of values)
- Return state (e.g., `isSorted()` returns boolean)
- Provide locators (e.g., `getColumnHeader()` returns locator)
- **Handle conditional logic** (e.g., `if-else`, `try-catch` blocks)
- **Encapsulate complex control flow**

**What Helpers/Page Objects CANNOT Do:**
- Contain `expect()` assertions
- Hide test logic behind function calls
- Perform verification steps

**Example:**
```typescript
// ❌ BAD: Assertions in helper
async function verifyColumnSorting(page, column) {
  const values = await getValues(page, column);
  expect(values).toBeSorted();  // ❌ expect() should NOT be in helper!
}

// ✅ GOOD: Helper returns data, test performs assertion
async function getColumnValues(page, column) {
  return await page.locator(`[data-column="${column}"]`).allTextContents();
}

// In test:
const values = await helper.getColumnValues(page, 'Supplier');
expect(values).toEqual(expectedSortedValues);  // ✅ expect() in test
```

---

## 4. Debugging Strategy

> **Note**: This chapter is the canonical debugging workflow. The previously separate `ai-debug-strategy.md` file has been merged here. All references to debug rules from `ai-planning-standards.md` and other rules point to this section.
>
> **Purpose**: Step-by-step workflow for implementing tests from an MCP-Ready test plan, including how to debug locator/data issues encountered during implementation. Focuses on **process**, not specifications (specifications come from the plan).

### 4.0 Implementation Prerequisites

Before starting implementation, confirm:

1. ✅ MCP-Ready test plan exists (`*.plan.md`) — see `ai-planning-standards.md §1.3` for Stage requirements
2. ✅ Plan is at **Stage: MCP-Ready** (not Draft) — every test has §12.1 Full Spec Block or §12.11 Compact Group Spec
3. ✅ Resolved Locators Catalog (plan §14.4) is populated and verified within last 30 days
4. ✅ All actors / fixtures the plan uses are available (`buyer`, `supplier`, `staff`, etc.)
5. ✅ Read this file (coding standards) and the plan's compliance line in the header

If any prerequisite fails, **stop and inform the user** — do not start implementation against an incomplete plan (RULE 1, PATTERN 17).

---

### 4.1 Debugging Rules

#### Rule 0 — Backward Compatibility Check

If you change something in methods or variables, first check all usages of that method or locator, then verify all callers still work. If in doubt, create a new method based on the old one and use the new one for new tests only.

#### Rule 1 — Always Use Fixtures for Actor Context

**NEVER open pages directly.** The site is protected by Vercel and requires authentication. Direct `page.goto()` calls without a logged-in session will be blocked.

Always create a **temp spec file** and use the appropriate **Actor fixture**:

```typescript
// tests/temp-debug.spec.ts
import { test } from "@fixtures";

test("debug - explore DOM", async ({ buyer }) => {
  await buyer.page.goto("/some-page");
  const html = await buyer.page.content();
  console.log(html);
});
```

Available fixtures: `buyer`, `supplier`, `staff`, `otherBuyer`, `otherSupplier`, `principal`

#### Rule 2 — Explore Real DOM Only. Never Assume.

When a locator or data structure is unclear:

- **Run** the temp spec in headed mode to observe the real page
- **Inspect** actual element structure via `page.content()`, `console.log`, or DevTools
- **Use** `debugPrint()` to log actual values at runtime

```bash
npx playwright test tests/temp-debug.spec.ts --project=tests --headed --workers=1
```

**NEVER guess locators, element attributes, or data shapes.** If you cannot see the real DOM, stop and ask the user.

#### Rule 3 — Temp File Protocol

1. Create `tests/temp-debug.spec.ts` (or similar in the relevant folder)
2. Add the required Actor fixture(s)
3. Navigate to the page under investigation
4. Log/inspect what you need
5. Delete the temp file when debugging is complete

#### Rule 4 — Stable Locators First. Avoid Flaky Selectors.

**Locator priority (most stable → last resort):**

| Priority | Locator | When to use |
|----------|---------|-------------|
| 1st | `getByTestId("...")` / `[data-testid="..."]` / `[data-id="..."]` | Whenever a `data-testid` or `data-id` attribute is present |
| 2nd | `getByRole("...", { name: "..." })` | Buttons, links, inputs by accessible role |
| 3rd | `getByLabel("...")` | Form fields with a label |
| 4th | `getByPlaceholder("...")` | Input fields — only if the placeholder is unique on the page |
| 5th | CSS selector (class, attribute) | When no semantic option exists |
| Last | XPath | **Avoid.** Use only as a last resort |

**Never use `getByText()` to locate an element whose text is the value under test.** Locate by a stable selector and assert content separately:

```typescript
// ❌ BAD: locating by the value you're testing
await expect(page.getByText("Order Confirmed")).toBeVisible();

// ✅ GOOD: stable locator → assert content separately
await expect(page.getByTestId("order-status")).toHaveText("Order Confirmed");
```

---

### 4.2 Implementation Workflow

Break the task into **logical chunks** — by actor, feature area, or test group. Each chunk goes through the same cycle before moving on.

#### Phase 1: First Chunk — Incremental Development

```
Chunk #1 → Temp File → Implement (1-3 tests) → Debug → Stabilize → Move to Ready File
```

**Step 1**: Create a temp file for the first chunk
```
tests/{feature}/temp-tests.spec.ts
```

**Step 2**: Implement the first 1–3 tests of the chunk

**Step 3**: Run in headed mode
```bash
npx playwright test tests/{feature}/temp-tests.spec.ts --project=tests --headed --workers=1
```

**Step 4**: If fails → debug with logging → fix

**Step 5**: If passes → run 3 times for stability
```bash
npx playwright test tests/{feature}/temp-tests.spec.ts --project=tests --reporter=list --workers=1 --repeat-each=3
```

**Step 6**: If stable → move tests to the ready file
```
tests/{feature}/{feature}-{chunk-name}.spec.ts
```

**Step 7**: Repeat Steps 1–6 for each remaining chunk

#### Phase 2: Complete Each Chunk

After all tests for a chunk are in the ready file:

**Step 8**: Run the full chunk suite 3 times
```bash
npx playwright test tests/{feature}/{feature}-{chunk-name}.spec.ts --project=tests --reporter=list --workers=1 --repeat-each=3
```

**Step 9**: If fails → debug and fix (see Decision Tree below)

> **Tip — when chunks share similar scenarios** (e.g., multiple actors doing the same action): implement the first chunk fully, then reuse its patterns for subsequent chunks, implementing only the parts that differ first to catch role/context-specific issues early.

#### Phase 3: Final Integration

After all chunks complete:

**Step 10**: Run ALL spec files together 3 times
```bash
npx playwright test tests/{feature}/*.spec.ts --project=tests --reporter=list --workers=1 --repeat-each=3
```

**Step 11**: Fix any cross-chunk issues discovered

---

### 4.3 Decision Tree: When Tests Fail

```
Test Fails
    │
    ├─→ First attempt: Quick fix
    │   └─→ Check locators, waits, assertions
    │
    ├─→ Second attempt: Add logging
    │   └─→ Use debugPrint() liberally
    │   └─→ Run with --headed --debug
    │
    ├─→ Third attempt: Isolate
    │   └─→ Copy failing test to temp file
    │   └─→ Simplify to minimal reproduction
    │   └─→ Add step-by-step logging
    │   └─→ Fix, then port back to main file
    │
    └─→ Locator Issues: 3 Variants Rule
        └─→ Try 3 different locator strategies
        └─→ NEVER just increase timeout
        └─→ If 3 variants fail → mark test for manual debug
        └─→ Add comment: // TODO: Manual debug required - locator issue
```

#### Locator Debugging Rule

**NEVER increase timeout to fix locator issues.** Timeout failures mean incorrect locators, not slow performance.

Try variants in stable-to-flaky order:
1. **Variant 1**: `getByTestId()`, `[data-testid="..."]`, or `[data-id="..."]`
2. **Variant 2**: `getByRole()` with accessible name
3. **Variant 3**: `getByLabel()`, `getByPlaceholder()` (unique on page), or CSS selector

If all 3 variants fail:
```typescript
test("Test name @TestId", async ({ supplier }) => {
  // TODO: Manual debug required - locator issue after 3 variants
  // Tried: getByTestId("xyz"), getByRole("button", { name: "xyz" }), locator(".xyz")
  test.skip(true, "Locator issue - requires manual debug");
});
```

---

### 4.4 Key Principles

1. **Never Skip Tests** — all tests from the plan MUST be implemented; difficulty is not a valid reason to skip
2. **Temp File First** — always develop new/risky tests in a temp file before moving to the production file
3. **Stability Before Progress** — don't move to the next chunk until the current chunk passes 3 times
4. **Differences First** — when starting a new chunk that overlaps a previous one, implement the differing parts first to catch chunk-specific issues early
5. **Debug Incrementally** — don't run all tests when one fails; isolate → fix → verify → continue
6. **Real DOM Over Guessing** — run with Actor fixtures in headed mode and inspect the actual DOM; never guess locators or data shapes

---

### 4.5 Commands Quick Reference

| Action | Command |
|--------|---------|
| Run temp file (headed) | `npx playwright test {path} --project=tests --headed --workers=1` |
| Debug mode | `npx playwright test {path} --project=tests --debug` |
| Stability check (3×) | `npx playwright test {path} --project=tests --reporter=list --workers=1 --repeat-each=3` |
| Single test by name | `npx playwright test {path} --grep "{test-name}" --project=tests` |
| With trace | `npx playwright test {path} --project=tests --trace=on` |

---

### 4.6 Workflow Summary

```
┌────────────────────────────────────────────────────────────────────┐
│                         CHUNK #1                                   │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│  │ Tests    │ →  │ Tests    │ →  │ Tests    │ →  │ Tests    │     │
│  │ 1-3      │    │ 4-6      │    │ 7-9      │    │ N...     │     │
│  │ (temp)   │    │ (temp)   │    │ (temp)   │    │ (temp)   │     │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘     │
│       ↓ pass 3x       ↓ pass 3x       ↓ pass 3x       ↓ pass 3x   │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │              Ready File: {feature}-{chunk1}.spec.ts        │   │
│  └────────────────────────────────────────────────────────────┘   │
│       ↓ all pass 3x                                               │
└────────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────────┐
│                         CHUNK #2                                   │
│  ┌──────────────┐    ┌──────────────┐                             │
│  │ Diff. tests  │ →  │ Shared tests │                             │
│  │ (temp)       │    │ (temp)       │                             │
│  └──────┬───────┘    └──────┬───────┘                             │
│         ↓ pass 3x          ↓ pass 3x                              │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │              Ready File: {feature}-{chunk2}.spec.ts        │   │
│  └────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────────┐
│                    CHUNK #N  (same pattern)                        │
└────────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────────┐
│                    FINAL: All Chunks Together                      │
│  Run all spec files 3× → Fix cross-chunk issues → DONE            │
└────────────────────────────────────────────────────────────────────┘
```

---

By following this handbook, agents can create Playwright tests that integrate seamlessly with the existing framework, respect established conventions, and remain maintainable alongside manually written suites.
