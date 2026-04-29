# Test Plan: Hotel Management UI Integration Tests

> **Feature**: Browser-level integration tests for the Hotel Management frontend (React 19 + Vite + MUI v7 + react-router-dom v7) wired to the real backend (Node.js + Express + Prisma + PostgreSQL).
> **URL**: `http://localhost:3000/`
> **Version**: 1.0 | April 2026
> **Stage**: **MCP-Ready**
> **Compliant with**: `ai-coding-standards.md`, `ai-planning-standards.md`
> **Status**: 0 PASS, 0 STUB, 128 Pending, 0 BLOCKED, 0 FLAKY (128 total)

> **Companion plan**: HTTP-level API tests are specified separately in `backend/tests/api/api-tests.plan.md`. This plan is strictly for browser-driven user flows. Anything that can be asserted purely against the API belongs in that plan, not here.

---

## Table of Contents

- [1. Overview](#1-overview)
  - [1.1 What is being tested](#11-what-is-being-tested)
  - [1.2 Test approach](#12-test-approach)
  - [1.3 Out of scope (explicit)](#13-out-of-scope-explicit)
  - [1.4 Workflow](#14-workflow)
- [2. File Structure](#2-file-structure)
- [3. Status Summary](#3-status-summary)
- [4. Test Cases (MCP-Ready Specs)](#4-test-cases-mcp-ready-specs)
  - [4.1 Landing Page](#41-landing-page)
  - [4.2 Auth — Login](#42-auth--login)
  - [4.3 Auth — Register](#43-auth--register)
  - [4.4 Navbar & Navigation](#44-navbar--navigation)
  - [4.5 Protected Routes & Role Gating](#45-protected-routes--role-gating)
  - [4.6 Guest Dashboard](#46-guest-dashboard)
  - [4.7 Browse Rooms](#47-browse-rooms)
  - [4.8 Room Details & Booking](#48-room-details--booking)
  - [4.9 My Bookings](#49-my-bookings)
  - [4.10 My Profile (read-only)](#410-my-profile-read-only)
  - [4.11 Admin Dashboard (placeholder UI)](#411-admin-dashboard-placeholder-ui)
  - [4.12 Token Lifecycle & API Interceptor](#412-token-lifecycle--api-interceptor)
- [5. Shared Preconditions & beforeAll Setup](#5-shared-preconditions--beforeall-setup)
- [6. Resolved Locators Catalog](#6-resolved-locators-catalog)
- [7. Data & Configuration](#7-data--configuration)
- [8. Stability Contract](#8-stability-contract)
- [9. Risks & Known Issues](#9-risks--known-issues)
- [10. Debug Commands](#10-debug-commands)
- [11. Revision History](#11-revision-history)

---

## 1. Overview

### 1.1 What is being tested

The Hotel Management web app exposes the following surface in the current implementation:

| Area | URL | Auth required | Roles allowed | Notes |
|------|-----|---------------|---------------|-------|
| Landing | `/` | none | any | Public marketing page |
| Login | `/login` | none | any | `react-hook-form`, redirects to `state.from` after success |
| Register | `/register` | none | any | Always creates a `guest` user |
| Guest Dashboard | `/dashboard` | yes | any | Welcome banner + 3 quick-action cards |
| Browse Rooms | `/dashboard/rooms` | yes | any | Card grid of all rooms (no filters yet) |
| Room Details + Booking | `/dashboard/rooms/:id` | yes | any | Booking form with date/guest/notes |
| My Bookings | `/dashboard/bookings` | yes | any | List of own bookings (admin sees all) |
| My Profile | `/dashboard/profile` | yes | any | **Read-only** in current build |
| Admin Dashboard | `/admin` | yes | `admin` | Placeholder cards + `—` stat values |

### 1.2 Test approach

**Browser-level integration tests** using **Playwright + TypeScript**. Every spec runs through the real React app (Vite dev server on `:3000`) which proxies `/api` to the real Express server (`:5000`) which talks to a **dedicated PostgreSQL test database** seeded fresh per spec file run.

**OOP / SOLID** (per user rule): every page has its own Page Object class (`page-objects/*Page.ts`); cross-page UI lives in component objects (`page-objects/components/Navbar.ts`); fixtures (`anonymous`, `guest`, `admin`) compose the page objects with the appropriate authenticated `Page`. Spec files contain only test bodies; no inline locators, no helper definitions, no assertion logic in page objects (per `ai-coding-standards.md` PATTERN 5).

**Authentication strategy** — the project's `prisma/seed.ts` already provisions two stable users which are reused for all tests:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@hotel.com` | `password123` |
| Guest | `guest@hotel.com` | `password123` |

Tests obtain a JWT via `POST /api/auth/login` and inject it into `localStorage` via `page.addInitScript` **before** the first navigation — this matches the Playwright fast-login pattern referenced in `ai-coding-standards.md` §4.1 Rule 1.

**Locator strategy** — per the user-confirmed strategy, every UI element under test must be reachable via `data-testid` (priority 1 in `ai-coding-standards.md` §4.1 Rule 4). The current FE has `data-testid` only on `BrowseRoomsPage.tsx`; **all other pages need attributes added before this plan is implementable**. §6 Resolved Locators Catalog is the source of truth: every locator is listed with status `exists` or `TO ADD` (with the exact JSX file path where the attribute must be added). For elements where adding `data-testid` is genuinely awkward, the plan falls back to `getByRole({ name })` / `getByLabel()` per the priority order. **`getByText` is never used to locate an element whose text is the value under test** (per §4.1 Rule 4).

### 1.3 Out of scope (explicit)

- Pure HTTP-level API behaviour (covered by `backend/tests/api/api-tests.plan.md`)
- Visual regression / screenshot diffs
- Performance / load tests
- Accessibility (axe / WCAG) audits — call out for future plan
- Cross-browser matrix beyond Chromium (per user-confirmed scope)
- Mobile viewport / responsive specifics — not in current scope (single desktop viewport `1280×720`)
- Email / password-reset flows (no FE or BE code exists)
- Payment flows (no code exists)
- Features still on the roadmap (`documentation/implementation_plan.md`): profile editing, booking cancellation button, room search filter UI, admin CRUD pages — **excluded entirely from this plan** (per user-confirmed `implemented_only` scope, per `ai-coding-standards.md` PATTERN 17)
- Staff role flows — no staff user is seeded and there is no FE branch for `staff` distinct from `guest`

### 1.4 Workflow

```
┌──────────────────────────────────────────────────────────────────────┐
│  Anonymous (no token)                                                │
│    GET /                       → Landing                             │
│    GET /login                  → Login form                          │
│    GET /register               → Register form                       │
│    GET /dashboard*             → 302 to /login (state.from preserved)│
│    GET /admin                  → 302 to /login                       │
│                                                                      │
│  Guest (seeded guest@hotel.com / password123)                       │
│    GET /dashboard              → 3-card hub                          │
│    GET /dashboard/rooms        → 9 seeded rooms (1 maintenance)      │
│    GET /dashboard/rooms/:id    → details + booking form              │
│    POST booking via UI         → 201 on BE, 2s success → /bookings   │
│    GET /dashboard/bookings     → own bookings only                   │
│    GET /dashboard/profile      → read-only profile card              │
│    GET /admin                  → 302 to /dashboard (role gate)       │
│                                                                      │
│  Admin (seeded admin@hotel.com / password123)                       │
│    everything Guest can do +                                         │
│    GET /admin                  → admin banner + 3 placeholder cards  │
│    GET /dashboard/bookings     → ALL bookings (cross-guest visible)  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. File Structure

```
tests-UI/
├── test-plan.md                       # This file (MCP-ready test plan)
├── playwright.config.ts               # Playwright project + webServer config
├── global-setup.ts                    # Reset & seed test DB once per run
├── global-teardown.ts                 # Optional final cleanup
├── fixtures/
│   ├── index.ts                       # Re-exports test, expect with custom fixtures
│   ├── anonymous.ts                   # Base page, no auth
│   ├── guest.ts                       # Page with seeded guest token in localStorage
│   ├── admin.ts                       # Page with seeded admin token in localStorage
│   └── types.ts                       # ActorContext, AuthorizedActor types
├── page-objects/
│   ├── BasePage.ts                    # Shared waits, navigation helpers
│   ├── components/
│   │   └── Navbar.ts                  # AppBar/Drawer locators + actions
│   ├── LandingPage.ts                 # /
│   ├── LoginPage.ts                   # /login
│   ├── RegisterPage.ts                # /register
│   ├── GuestDashboardPage.ts          # /dashboard
│   ├── BrowseRoomsPage.ts             # /dashboard/rooms
│   ├── RoomDetailsPage.ts             # /dashboard/rooms/:id
│   ├── MyBookingsPage.ts              # /dashboard/bookings
│   ├── MyProfilePage.ts               # /dashboard/profile
│   └── AdminDashboardPage.ts          # /admin
├── helpers/
│   ├── dateHelpers.ts                 # tomorrow(), daysFromNow(n), pastDate(n)
│   ├── authApi.ts                     # loginViaApi(email, password) → token
│   ├── bookingApi.ts                  # createBookingViaApi() / cleanupBookings()
│   ├── dbHelpers.ts                   # truncateBookings() via Prisma
│   └── ui.ts                          # waitForSpinnerHidden, waitForRoute, etc.
├── data/
│   ├── credentials.ts                 # SEEDED_GUEST, SEEDED_ADMIN
│   ├── roomData.ts                    # Expected seeded room numbers / types
│   └── bookingFactory.ts              # buildBookingInput()
├── landing.spec.ts                    # §4.1
├── auth-login.spec.ts                 # §4.2
├── auth-register.spec.ts              # §4.3
├── navbar.spec.ts                     # §4.4
├── protected-routes.spec.ts           # §4.5
├── guest-dashboard.spec.ts            # §4.6
├── browse-rooms.spec.ts               # §4.7
├── room-details-booking.spec.ts       # §4.8
├── my-bookings.spec.ts                # §4.9
├── my-profile.spec.ts                 # §4.10
├── admin-dashboard.spec.ts            # §4.11
└── token-lifecycle.spec.ts            # §4.12
```

---

## 3. Status Summary

| Phase | Spec File | Tests | PASS | STUB | Pending | BLOCKED | FLAKY |
|-------|-----------|-------|------|------|---------|---------|-------|
| Landing Page                | `landing.spec.ts`               |  6  | 0 | 0 |  6  | 0 | 0 |
| Auth — Login                | `auth-login.spec.ts`            | 18  | 0 | 0 | 18  | 0 | 0 |
| Auth — Register             | `auth-register.spec.ts`         | 12  | 0 | 0 | 12  | 0 | 0 |
| Navbar & Navigation         | `navbar.spec.ts`                |  9  | 0 | 0 |  9  | 0 | 0 |
| Protected Routes            | `protected-routes.spec.ts`      | 10  | 0 | 0 | 10  | 0 | 0 |
| Guest Dashboard             | `guest-dashboard.spec.ts`       |  7  | 0 | 0 |  7  | 0 | 0 |
| Browse Rooms                | `browse-rooms.spec.ts`          |  9  | 0 | 0 |  9  | 0 | 0 |
| Room Details & Booking      | `room-details-booking.spec.ts`  | 19  | 0 | 0 | 19  | 0 | 0 |
| My Bookings                 | `my-bookings.spec.ts`           | 13  | 0 | 0 | 13  | 0 | 0 |
| My Profile                  | `my-profile.spec.ts`            |  7  | 0 | 0 |  7  | 0 | 0 |
| Admin Dashboard             | `admin-dashboard.spec.ts`       |  8  | 0 | 0 |  8  | 0 | 0 |
| Token Lifecycle             | `token-lifecycle.spec.ts`       | 10  | 0 | 0 | 10  | 0 | 0 |
|                             | **TOTAL**                       | **128** | **0** | **0** | **128** | **0** | **0** |

---

## 4. Test Cases (MCP-Ready Specs)

> **Spec format conventions** — Compact Group Spec (§12.11 of `ai-planning-standards.md`) is used where 3+ tests differ only in actor or one input value. Otherwise Full Spec Block (§12.1).

### 4.1 Landing Page

#### TC-LP-01: Anonymous can see hero section on Landing page @T7c5e1a01

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/landing.spec.ts` |
| **Priority** | P0 |

**Preconditions**: none (purely public page).

**Test Data**: none.

**User Journey Steps**:
1. `await anonymous.landingPage.goto()` — navigate to `/`
2. Wait for `landingPage.heroSection` visible

**Expected Assertions**:
| Locator (resolved) | Assertion | Expected Value |
|--------------------|-----------|----------------|
| `landingPage.heroSection` (`[data-testid="landing-hero"]`) | `toBeVisible` | — |
| `landingPage.heroTitle` (`[data-testid="landing-hero-title"]`) | `toContainText` | `"Experience Luxury"` |
| `landingPage.heroSubtitle` (`[data-testid="landing-hero-subtitle"]`) | `toContainText` | `"Discover unparalleled comfort"` |
| `landingPage.bookYourStayButton` (`[data-testid="landing-book-cta"]`) | `toBeVisible` | — |
| `landingPage.signInButton` (`[data-testid="landing-signin-cta"]`) | `toBeVisible` | — |

**Stability Notes**: Page is static SSG-style content; no async loading.

**Cleanup Contract**: read-only, fully parallel-safe.

---

#### TC-LP-02: Anonymous "Book Your Stay" CTA navigates to /register @T7c5e1a02

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/landing.spec.ts` |
| **Priority** | P0 |

**Preconditions**: none.

**User Journey Steps**:
1. `await anonymous.landingPage.goto()`
2. `await anonymous.landingPage.clickBookYourStay()`
3. Wait for `URL` to match `/register$/`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/register$/` |
| `registerPage.formHeader` (`[data-testid="register-header"]`) | `toBeVisible` | — |

**Stability Notes**: Use `page.waitForURL(/\/register$/)` after click (PATTERN 9: no `waitForTimeout`).

**Cleanup Contract**: read-only, parallel-safe.

---

#### TC-LP-03: Anonymous "Sign In" CTA navigates to /login @T7c5e1a03

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/landing.spec.ts` |
| **Priority** | P0 |

**Preconditions**: none.

**User Journey Steps**:
1. `await anonymous.landingPage.goto()`
2. `await anonymous.landingPage.clickSignIn()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/login$/` |
| `loginPage.formHeader` (`[data-testid="login-header"]`) | `toBeVisible` | — |

**Stability Notes**: `page.waitForURL(/\/login$/)`.

**Cleanup Contract**: read-only, parallel-safe.

---

#### TC-LP-04: Anonymous can see all three "Why Choose Grand Hotel" feature cards @T7c5e1a04

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/landing.spec.ts` |
| **Priority** | P1 |

**Preconditions**: none.

**User Journey Steps**:
1. `await anonymous.landingPage.goto()`
2. Scroll into view: `await anonymous.landingPage.featuresSection.scrollIntoViewIfNeeded()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `landingPage.featureCardPremiumRooms` (`[data-testid="feature-card-premium-rooms"]`) | `toBeVisible` | — |
| `landingPage.featureCardPremiumRoomsTitle` | `toHaveText` | `"Premium Rooms"` |
| `landingPage.featureCardModernAmenities` (`[data-testid="feature-card-modern-amenities"]`) | `toBeVisible` | — |
| `landingPage.featureCardModernAmenitiesTitle` | `toHaveText` | `"Modern Amenities"` |
| `landingPage.featureCardWorldClassFacilities` (`[data-testid="feature-card-world-class-facilities"]`) | `toBeVisible` | — |
| `landingPage.featureCardWorldClassFacilitiesTitle` | `toHaveText` | `"World-Class Facilities"` |

**Stability Notes**: `scrollIntoViewIfNeeded()` ensures lazy intersection animations complete before visibility assertion.

**Cleanup Contract**: read-only, parallel-safe.

---

#### TC-LP-05: Anonymous sees footer with current-year copyright @T7c5e1a05

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/landing.spec.ts` |
| **Priority** | P2 |

**Preconditions**: none.

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Expected year | `new Date().getFullYear()` | runtime via `getCurrentYear()` helper in `helpers/dateHelpers.ts` |

**User Journey Steps**:
1. `await anonymous.landingPage.goto()`
2. `await anonymous.landingPage.footer.scrollIntoViewIfNeeded()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `landingPage.footer` (`[data-testid="landing-footer"]`) | `toBeVisible` | — |
| `landingPage.footerText` (`[data-testid="landing-footer-text"]`) | `toContainText` | `` `© ${new Date().getFullYear()} Grand Hotel` `` |

**Stability Notes**: Year is computed at render — read it inside the test, not hard-coded.

**Cleanup Contract**: read-only, parallel-safe.

---

#### TC-LP-06: Authenticated guest can still see Landing page (no auto-redirect) @T7c5e1a06

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/landing.spec.ts` |
| **Priority** | P2 |

**Preconditions**: Guest is authenticated via `guest` fixture (token already in `localStorage`).

**User Journey Steps**:
1. `await guest.landingPage.goto()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/$/` (root, not redirected) |
| `landingPage.heroSection` | `toBeVisible` | — |
| `navbar.dashboardButton` (`[data-testid="navbar-dashboard-btn"]`) | `toBeVisible` | — (auth nav present) |
| `navbar.loginButton` | `toHaveCount` | `0` |

**Stability Notes**: `/` is a public route — verify it does NOT redirect logged-in users (current behaviour).

**Cleanup Contract**: read-only, parallel-safe.

---

### 4.2 Auth — Login

#### TC-AL-01: Anonymous can navigate to /login from Navbar Login button @T9b3a4f01

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/auth-login.spec.ts` |
| **Priority** | P0 |

**Preconditions**: none.

**User Journey Steps**:
1. `await anonymous.landingPage.goto()`
2. `await anonymous.navbar.clickLogin()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/login$/` |
| `loginPage.formHeader` (`[data-testid="login-header"]`) | `toBeVisible` | — |
| `loginPage.formHeader` | `toContainText` | `"Welcome Back"` |

**Stability Notes**: `waitForURL(/\/login$/)` after click.

**Cleanup Contract**: read-only, parallel-safe.

---

#### TC-AL-02: Empty form shows "Email is required" and "Password is required" errors @T9b3a4f02

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/auth-login.spec.ts` |
| **Priority** | P1 |

**Preconditions**: none.

**User Journey Steps**:
1. `await anonymous.loginPage.goto()`
2. Wait for `loginPage.submitButton` to be visible
3. `await anonymous.loginPage.submitForm()` — clicks Sign In with both fields blank

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `loginPage.emailFieldError` (`[data-testid="login-email-error"]`) | `toContainText` | `"Email is required"` |
| `loginPage.passwordFieldError` (`[data-testid="login-password-error"]`) | `toContainText` | `"Password is required"` |
| URL | `toMatch` | `/\/login$/` (no navigation) |

**Stability Notes**: `react-hook-form` validates on submit by default; no async wait needed beyond click.

**Cleanup Contract**: read-only, parallel-safe.

---

#### TC-AL-03: Malformed email shows "Invalid email" error @T9b3a4f03

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/auth-login.spec.ts` |
| **Priority** | P1 |

**Preconditions**: none.

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Email | `"not-an-email"` | inline |
| Password | `"password123"` | inline |

**User Journey Steps**:
1. `await anonymous.loginPage.goto()`
2. `await anonymous.loginPage.fillEmail("not-an-email")`
3. `await anonymous.loginPage.fillPassword("password123")`
4. `await anonymous.loginPage.submitForm()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `loginPage.emailFieldError` | `toContainText` | `"Invalid email"` |
| URL | `toMatch` | `/\/login$/` |

**Stability Notes**: synchronous form validation.

**Cleanup Contract**: read-only, parallel-safe.

---

#### TC-AL-04: Password shorter than 6 chars shows "Minimum 6 characters" error @T9b3a4f04

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/auth-login.spec.ts` |
| **Priority** | P1 |

**Preconditions**: none.

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Email | `"guest@hotel.com"` | inline (well-formed but irrelevant since password fails) |
| Password | `"abc"` | inline |

**User Journey Steps**:
1. `await anonymous.loginPage.goto()`
2. `await anonymous.loginPage.fillEmail("guest@hotel.com")`
3. `await anonymous.loginPage.fillPassword("abc")`
4. `await anonymous.loginPage.submitForm()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `loginPage.passwordFieldError` | `toContainText` | `"Minimum 6 characters"` |
| URL | `toMatch` | `/\/login$/` |

**Stability Notes**: synchronous client-side validation.

**Cleanup Contract**: read-only, parallel-safe.

---

#### TC-AL-05: Show/hide password toggle reveals & re-hides password @T9b3a4f05

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/auth-login.spec.ts` |
| **Priority** | P2 |

**Preconditions**: none.

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Password | `"password123"` | inline |

**User Journey Steps**:
1. `await anonymous.loginPage.goto()`
2. `await anonymous.loginPage.fillPassword("password123")`
3. Assert input type is `password`
4. `await anonymous.loginPage.toggleShowPassword()`
5. Assert input type is `text`
6. `await anonymous.loginPage.toggleShowPassword()`
7. Assert input type is `password` again

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `loginPage.passwordInput` (`[data-testid="login-password-input"]`) — step 3 | `toHaveAttribute("type", "password")` | — |
| `loginPage.passwordInput` — step 5 | `toHaveAttribute("type", "text")` | — |
| `loginPage.passwordInput` — step 7 | `toHaveAttribute("type", "password")` | — |

**Stability Notes**: synchronous DOM toggle.

**Cleanup Contract**: read-only, parallel-safe.

---

#### TC-AL-06: Successful login as seeded guest redirects to /dashboard @T9b3a4f06

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/auth-login.spec.ts` |
| **Priority** | P0 |

**Preconditions**: Seeded guest exists (`prisma/seed.ts` ran in `global-setup`).

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Email | `SEEDED_GUEST.email` (`"guest@hotel.com"`) | `data/credentials.ts` |
| Password | `SEEDED_GUEST.password` (`"password123"`) | `data/credentials.ts` |

**User Journey Steps**:
1. `await anonymous.loginPage.goto()`
2. `await anonymous.loginPage.fillEmail(SEEDED_GUEST.email)`
3. `await anonymous.loginPage.fillPassword(SEEDED_GUEST.password)`
4. Use `Promise.all([waitForResponse(/\/api\/auth\/login/, 200), submitForm()])`
5. `await anonymous.page.waitForURL(/\/dashboard$/)`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/dashboard$/` |
| `guestDashboard.welcomeBanner` (`[data-testid="guest-welcome-banner"]`) | `toBeVisible` | — |
| `guestDashboard.welcomeBanner` | `toContainText` | `"Welcome, Guest!"` (firstName from seed) |
| `guestDashboard.roleChip` (`[data-testid="guest-role-chip"]`) | `toHaveText` | `"GUEST"` |
| `localStorage["token"]` (via `evaluate`) | `toMatch` | `/^eyJ/` (JWT format) |

**Stability Notes**: `Promise.all([waitForResponse, submitForm])` per PATTERN 11 — login is an async API call, sequential `submitForm + waitForURL` would race against the response.

**Cleanup Contract**: read-only on DB; mutates `localStorage` but each test gets a fresh `Page` (new context per test).

---

#### TC-AL-07: Successful login as seeded admin redirects to /dashboard @T9b3a4f07

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/auth-login.spec.ts` |
| **Priority** | P0 |

**Preconditions**: Seeded admin exists.

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Email | `SEEDED_ADMIN.email` (`"admin@hotel.com"`) | `data/credentials.ts` |
| Password | `SEEDED_ADMIN.password` (`"password123"`) | `data/credentials.ts` |

**User Journey Steps**:
1. `await anonymous.loginPage.goto()`
2. `await anonymous.loginPage.fillEmail(SEEDED_ADMIN.email)`
3. `await anonymous.loginPage.fillPassword(SEEDED_ADMIN.password)`
4. `await Promise.all([waitForResponse(/\/api\/auth\/login/, 200), submitForm()])`
5. `await anonymous.page.waitForURL(/\/dashboard$/)`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/dashboard$/` (admin lands on dashboard, not /admin) |
| `guestDashboard.welcomeBanner` | `toContainText` | `"Welcome, Admin!"` |
| `guestDashboard.roleChip` | `toHaveText` | `"ADMIN"` |
| `navbar.adminButton` (`[data-testid="navbar-admin-btn"]`) | `toBeVisible` | — (admin nav appears) |

**Stability Notes**: `Promise.all` for login response; admin chip in navbar relies on `useAuth` hydration — `dashboardPage` first-render is gated on it.

**Cleanup Contract**: read-only on DB.

---

#### TC-AL-08: Login with non-existent email shows "Invalid email or password" alert @T9b3a4f08

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/auth-login.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Email `nope@nowhere.invalid` does NOT exist in DB.

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Email | `"nope@nowhere.invalid"` | inline |
| Password | `"password123"` | inline |

**User Journey Steps**:
1. `await anonymous.loginPage.goto()`
2. `await anonymous.loginPage.fillEmail("nope@nowhere.invalid")`
3. `await anonymous.loginPage.fillPassword("password123")`
4. `await Promise.all([waitForResponse(/\/api\/auth\/login/, 401), submitForm()])`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `loginPage.errorAlert` (`[data-testid="login-error-alert"]`) | `toBeVisible` | — |
| `loginPage.errorAlert` | `toContainText` | `"Invalid email or password"` |
| URL | `toMatch` | `/\/login$/` |
| `localStorage["token"]` | `toBeNull` | — |

**Stability Notes**: `Promise.all` — server returns 401 with `message: "Invalid email or password"`; FE surfaces it via `error.response.data.message`.

**Cleanup Contract**: read-only.

---

#### TC-AL-09: Login with wrong password shows "Invalid email or password" alert @T9b3a4f09

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/auth-login.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Seeded guest exists.

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Email | `SEEDED_GUEST.email` | `data/credentials.ts` |
| Password | `"wrongpassword"` | inline |

**User Journey Steps**:
1. `await anonymous.loginPage.goto()`
2. `await anonymous.loginPage.fillEmail(SEEDED_GUEST.email)`
3. `await anonymous.loginPage.fillPassword("wrongpassword")`
4. `await Promise.all([waitForResponse(/\/api\/auth\/login/, 401), submitForm()])`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `loginPage.errorAlert` | `toBeVisible` | — |
| `loginPage.errorAlert` | `toContainText` | `"Invalid email or password"` |
| URL | `toMatch` | `/\/login$/` |

**Stability Notes**: `Promise.all` for 401.

**Cleanup Contract**: read-only.

---

#### TC-AL-10: Submit button shows "Signing in…" loading state and is disabled while in flight @T9b3a4f10

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/auth-login.spec.ts` |
| **Priority** | P2 |

**Preconditions**: Seeded guest exists.

**User Journey Steps**:
1. `await anonymous.loginPage.goto()`
2. `await anonymous.loginPage.fillEmail(SEEDED_GUEST.email)`
3. `await anonymous.loginPage.fillPassword(SEEDED_GUEST.password)`
4. Throttle network to make response visible: use Playwright `route.continue({ delay })` against `/api/auth/login` (introduce 1s server-side delay)
5. Click `loginPage.submitButton`
6. Assert button text & disabled WHILE pending
7. Wait for `URL` `/dashboard$/` after response resolves

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `loginPage.submitButton` (during flight) | `toBeDisabled` | — |
| `loginPage.submitButton` (during flight) | `toContainText` | `"Signing in"` |
| `loginPage.submitButton` (after flight) | `toBeHidden` (navigated away) | — |

**Stability Notes**: Network throttling via `page.route` is the only deterministic way to observe the loading state — relying on natural latency would be flaky.

**Cleanup Contract**: read-only; route handler removed via `unroute` in `afterEach`.

---

#### TC-AL-11: "Register here" link navigates to /register @T9b3a4f11

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/auth-login.spec.ts` |
| **Priority** | P2 |

**Preconditions**: none.

**User Journey Steps**:
1. `await anonymous.loginPage.goto()`
2. `await anonymous.loginPage.clickRegisterLink()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/register$/` |
| `registerPage.formHeader` | `toBeVisible` | — |

**Stability Notes**: `waitForURL`.

**Cleanup Contract**: read-only.

---

#### TC-AL-12: Login redirects to original deep-link URL after auth @T9b3a4f12

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/auth-login.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Seeded guest.

**User Journey Steps**:
1. `await anonymous.page.goto("/dashboard/bookings")` — protected URL
2. Wait for `URL` `/login$/` — `ProtectedRoute` redirected
3. `await anonymous.loginPage.fillEmail(SEEDED_GUEST.email)`
4. `await anonymous.loginPage.fillPassword(SEEDED_GUEST.password)`
5. `await Promise.all([waitForResponse(/\/api\/auth\/login/, 200), submitForm()])`
6. Wait for `URL` `/dashboard\/bookings$/`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/dashboard\/bookings$/` (state.from preserved through redirect) |
| `myBookings.pageHeader` (`[data-testid="my-bookings-header"]`) | `toBeVisible` | — |

**Stability Notes**: `waitForURL` twice (intermediate `/login`, then final destination).

**Cleanup Contract**: may create no booking — the test only verifies redirect — read-only.

---

#### TC-AL-13: Already-authenticated user visiting /login still sees login form (no auto-redirect) @T9b3a4f13

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/auth-login.spec.ts` |
| **Priority** | P2 |

**Preconditions**: Guest already authenticated via fixture.

**User Journey Steps**:
1. `await guest.loginPage.goto()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/login$/` |
| `loginPage.formHeader` | `toBeVisible` | — — current behaviour: login route is unguarded |
| `navbar.dashboardButton` | `toBeVisible` | — (still authenticated) |

**Stability Notes**: documents current FE behaviour; if redirect logic is added later, this test must be updated (per RULE 8).

**Cleanup Contract**: read-only.

---

#### TC-AL-14: After login, navbar shows user avatar with correct initials @T9b3a4f14

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/auth-login.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Seeded admin exists (firstName `Admin`, lastName `User` per seed).

**User Journey Steps**:
1. `await anonymous.loginPage.goto()`
2. `await anonymous.loginPage.fillEmail(SEEDED_ADMIN.email)`
3. `await anonymous.loginPage.fillPassword(SEEDED_ADMIN.password)`
4. `await Promise.all([waitForResponse(/\/api\/auth\/login/, 200), submitForm()])`
5. `await anonymous.page.waitForURL(/\/dashboard$/)`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `navbar.avatar` (`[data-testid="navbar-avatar"]`) | `toBeVisible` | — |
| `navbar.avatar` | `toHaveText` | `"AU"` (Admin User initials, uppercase) |

**Stability Notes**: avatar text is computed from `useAuth.user` which hydrates after `/api/auth/me` — wait for navbar to settle (`navbar.dashboardButton` visible).

**Cleanup Contract**: read-only.

---

#### TC-AL-15: After login, Dashboard button is visible in navbar @T9b3a4f15

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/auth-login.spec.ts` |
| **Priority** | P2 |

**Preconditions**: Seeded guest exists.

**User Journey Steps**:
1. Log in as guest via UI (Steps 1-5 of TC-AL-06)

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `navbar.dashboardButton` (`[data-testid="navbar-dashboard-btn"]`) | `toBeVisible` | — |
| `navbar.dashboardButton` | `toContainText` | `"Dashboard"` |
| `navbar.loginButton` (`[data-testid="navbar-login-btn"]`) | `toHaveCount` | `0` |
| `navbar.registerButton` | `toHaveCount` | `0` |

**Stability Notes**: navbar re-renders when `useAuth.user` populates — wait for `navbar.avatar` visible as proxy for hydration completion.

**Cleanup Contract**: read-only.

---

#### TC-AL-16: After login as admin, Admin button appears in navbar @T9b3a4f16

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/auth-login.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Seeded admin exists.

**User Journey Steps**:
1. Log in as admin (Steps 1-5 of TC-AL-07)

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `navbar.adminButton` (`[data-testid="navbar-admin-btn"]`) | `toBeVisible` | — |
| `navbar.adminButton` | `toContainText` | `"Admin"` |

**Stability Notes**: as TC-AL-15.

**Cleanup Contract**: read-only.

---

#### TC-AL-17: After login as guest, Admin button does NOT appear @T9b3a4f17

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/auth-login.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Seeded guest exists.

**User Journey Steps**:
1. Log in as guest (Steps 1-5 of TC-AL-06)
2. Wait for `navbar.avatar` visible (auth hydrated)

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `navbar.adminButton` | `toHaveCount` | `0` |
| `navbar.dashboardButton` | `toBeVisible` | — (sanity: guest nav present) |

**Stability Notes**: Wait for hydration via `avatar` visibility before asserting absence (otherwise we'd assert "missing because not rendered yet").

**Cleanup Contract**: read-only.

---

#### TC-AL-18: Token persists across page reload (re-hydration via /api/auth/me) @T9b3a4f18

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/auth-login.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Seeded guest exists.

**User Journey Steps**:
1. Log in as guest (Steps 1-5 of TC-AL-06)
2. Wait for `navbar.avatar` visible
3. `await Promise.all([waitForResponse(/\/api\/auth\/me/, 200), anonymous.page.reload()])`
4. Wait for `navbar.avatar` visible again

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/dashboard$/` |
| `navbar.avatar` | `toHaveText` | `"GU"` (Guest User initials) |
| `localStorage["token"]` | `toMatch` | `/^eyJ/` |

**Stability Notes**: `Promise.all([waitForResponse(/\/api\/auth\/me/), reload()])` — the `useEffect` in `AuthContext` calls `/api/auth/me`; we must wait for that response, not just for DOM ready.

**Cleanup Contract**: read-only.

---

### 4.3 Auth — Register

#### TC-AR-01: Anonymous can navigate to /register from Navbar Register button @Tea7d2c01

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/auth-register.spec.ts` |
| **Priority** | P0 |

**Preconditions**: none.

**User Journey Steps**:
1. `await anonymous.landingPage.goto()`
2. `await anonymous.navbar.clickRegister()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/register$/` |
| `registerPage.formHeader` (`[data-testid="register-header"]`) | `toContainText` | `"Create Account"` |

**Stability Notes**: `waitForURL`.

**Cleanup Contract**: read-only.

---

#### TC-AR-02: Empty form shows all required-field errors @Tea7d2c02

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/auth-register.spec.ts` |
| **Priority** | P1 |

**Preconditions**: none.

**User Journey Steps**:
1. `await anonymous.registerPage.goto()`
2. `await anonymous.registerPage.submitForm()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `registerPage.firstNameError` (`[data-testid="register-firstName-error"]`) | `toContainText` | `"First name is required"` |
| `registerPage.lastNameError` (`[data-testid="register-lastName-error"]`) | `toContainText` | `"Last name is required"` |
| `registerPage.emailError` (`[data-testid="register-email-error"]`) | `toContainText` | `"Email is required"` |
| `registerPage.phoneError` (`[data-testid="register-phone-error"]`) | `toContainText` | `"Phone number is required"` |
| `registerPage.passwordError` (`[data-testid="register-password-error"]`) | `toContainText` | `"Password is required"` |
| `registerPage.confirmPasswordError` (`[data-testid="register-confirmPassword-error"]`) | `toContainText` | `"Please confirm your password"` |
| URL | `toMatch` | `/\/register$/` |

**Stability Notes**: synchronous form validation.

**Cleanup Contract**: read-only.

---

#### TC-AR-03: Malformed email shows "Invalid email" error @Tea7d2c03

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/auth-register.spec.ts` |
| **Priority** | P1 |

**Preconditions**: none.

**Test Data**:
| Field | Value |
|-------|-------|
| First Name | `"Test"` |
| Last Name | `"User"` |
| Email | `"not-an-email"` |
| Phone | `"1234567890"` |
| Password | `"password123"` |
| Confirm Password | `"password123"` |

**User Journey Steps**:
1. `await anonymous.registerPage.goto()`
2. `await anonymous.registerPage.fillForm({ firstName: "Test", lastName: "User", email: "not-an-email", phone: "1234567890", password: "password123", confirmPassword: "password123" })`
3. `await anonymous.registerPage.submitForm()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `registerPage.emailError` | `toContainText` | `"Invalid email"` |
| URL | `toMatch` | `/\/register$/` |

**Stability Notes**: synchronous validation.

**Cleanup Contract**: read-only.

---

#### TC-AR-04: Password shorter than 6 chars shows "Minimum 6 characters" error @Tea7d2c04

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/auth-register.spec.ts` |
| **Priority** | P1 |

**Preconditions**: none.

**Test Data**:
| Field | Value |
|-------|-------|
| All other fields | valid |
| Password | `"abc"` |
| Confirm Password | `"abc"` |

**User Journey Steps**:
1. `await anonymous.registerPage.goto()`
2. Fill all fields with valid data except password=`"abc"`/confirm=`"abc"`
3. `await anonymous.registerPage.submitForm()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `registerPage.passwordError` | `toContainText` | `"Minimum 6 characters"` |
| URL | `toMatch` | `/\/register$/` |

**Stability Notes**: synchronous validation.

**Cleanup Contract**: read-only.

---

#### TC-AR-05: Mismatched password & confirm shows "Passwords do not match" error @Tea7d2c05

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/auth-register.spec.ts` |
| **Priority** | P1 |

**Preconditions**: none.

**Test Data**:
| Field | Value |
|-------|-------|
| Password | `"password123"` |
| Confirm Password | `"password456"` |
| (others) | valid |

**User Journey Steps**:
1. `await anonymous.registerPage.goto()`
2. Fill all fields, with confirm password ≠ password
3. `await anonymous.registerPage.submitForm()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `registerPage.confirmPasswordError` | `toContainText` | `"Passwords do not match"` |
| URL | `toMatch` | `/\/register$/` |

**Stability Notes**: synchronous validation via `react-hook-form` `validate` callback.

**Cleanup Contract**: read-only.

---

#### TC-AR-06: Successful registration creates user, stores token, redirects to /dashboard @Tea7d2c06

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/auth-register.spec.ts` |
| **Priority** | P0 |

**Preconditions**: Email is unique per test (uses `nanoid()` suffix).

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Email | `` `e2e-${nanoid(8)}@test.local` `` | helper |
| First Name | `"E2E"` | inline |
| Last Name | `"Tester"` | inline |
| Phone | `"5550000000"` | inline |
| Password | `"password123"` | inline |
| Confirm Password | `"password123"` | inline |

**User Journey Steps**:
1. `await anonymous.registerPage.goto()`
2. `await anonymous.registerPage.fillForm({ ... })`
3. `await Promise.all([waitForResponse(/\/api\/auth\/register/, 201), submitForm()])`
4. `await anonymous.page.waitForURL(/\/dashboard$/)`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/dashboard$/` |
| `guestDashboard.welcomeBanner` | `toContainText` | `"Welcome, E2E!"` |
| `guestDashboard.roleChip` | `toHaveText` | `"GUEST"` |
| `localStorage["token"]` | `toMatch` | `/^eyJ/` |

**Stability Notes**: `Promise.all` per PATTERN 11 — register response status is 201.

**Cleanup Contract**:
- **Mutation**: creates 1 new user row in DB.
- **Shared state impact**: none beyond the new user (other tests do not query the user list by name).
- **Parallel safety**: ✅ Safe — unique email guarantees no collision.
- **Teardown**: `afterEach` deletes the user via Prisma helper `deleteUserByEmail()` to keep the test DB lean.

---

#### TC-AR-07: Registration with already-existing email shows 409 error alert @Tea7d2c07

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/auth-register.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Seeded `guest@hotel.com` exists.

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Email | `SEEDED_GUEST.email` | `data/credentials.ts` |
| (others) | valid | inline |

**User Journey Steps**:
1. `await anonymous.registerPage.goto()`
2. `await anonymous.registerPage.fillForm({ ..., email: SEEDED_GUEST.email })`
3. `await Promise.all([waitForResponse(/\/api\/auth\/register/, 409), submitForm()])`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `registerPage.errorAlert` (`[data-testid="register-error-alert"]`) | `toBeVisible` | — |
| `registerPage.errorAlert` | `toContainText` | `"User with this email already exists"` |
| URL | `toMatch` | `/\/register$/` |
| `localStorage["token"]` | `toBeNull` | — |

**Stability Notes**: `Promise.all` for 409.

**Cleanup Contract**: read-only.

---

#### TC-AR-08: Show/hide password toggle reveals BOTH password and confirm fields @Tea7d2c08

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/auth-register.spec.ts` |
| **Priority** | P2 |

**Preconditions**: none.

**User Journey Steps**:
1. `await anonymous.registerPage.goto()`
2. `await anonymous.registerPage.fillPassword("password123")`
3. `await anonymous.registerPage.fillConfirmPassword("password123")`
4. Assert both inputs `type="password"`
5. `await anonymous.registerPage.toggleShowPassword()`
6. Assert both inputs `type="text"`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `registerPage.passwordInput` (`[data-testid="register-password-input"]`) — step 4 | `toHaveAttribute("type", "password")` | — |
| `registerPage.confirmPasswordInput` (`[data-testid="register-confirmPassword-input"]`) — step 4 | `toHaveAttribute("type", "password")` | — |
| `registerPage.passwordInput` — step 6 | `toHaveAttribute("type", "text")` | — |
| `registerPage.confirmPasswordInput` — step 6 | `toHaveAttribute("type", "text")` | — |

**Stability Notes**: synchronous toggle.

**Cleanup Contract**: read-only.

---

#### TC-AR-09: "Sign in" link on register page navigates to /login @Tea7d2c09

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/auth-register.spec.ts` |
| **Priority** | P2 |

**Preconditions**: none.

**User Journey Steps**:
1. `await anonymous.registerPage.goto()`
2. `await anonymous.registerPage.clickSignInLink()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/login$/` |
| `loginPage.formHeader` | `toBeVisible` | — |

**Stability Notes**: `waitForURL`.

**Cleanup Contract**: read-only.

---

#### TC-AR-10: Submit button shows "Creating account…" loading state and is disabled while in flight @Tea7d2c10

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/auth-register.spec.ts` |
| **Priority** | P2 |

**Preconditions**: unique email.

**User Journey Steps**:
1. `await anonymous.registerPage.goto()`
2. Fill all fields
3. Throttle `/api/auth/register` route with 1s delay
4. Click submit
5. Assert button text/disabled WHILE pending
6. Wait for `URL` `/dashboard$/` after response

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `registerPage.submitButton` (during flight) | `toBeDisabled` | — |
| `registerPage.submitButton` (during flight) | `toContainText` | `"Creating account"` |

**Stability Notes**: `page.route()` throttle is the only deterministic way to observe loading state.

**Cleanup Contract**:
- **Mutation**: 1 new user.
- **Teardown**: `afterEach` deletes the user via API.

---

#### TC-AR-11: After registration, role chip in dashboard shows "GUEST" @Tea7d2c11

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/auth-register.spec.ts` |
| **Priority** | P1 |

**Preconditions**: unique email.

**User Journey Steps**:
1. Register (TC-AR-06 steps 1-4)
2. Wait for `guestDashboard.roleChip` visible

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `guestDashboard.roleChip` (`[data-testid="guest-role-chip"]`) | `toHaveText` | `"GUEST"` |

**Stability Notes**: `roleChip` renders only after `useAuth.user` populates from registration response.

**Cleanup Contract**: same as TC-AR-06.

---

#### TC-AR-12: Backend 500 error during register surfaces "Registration failed" alert @Tea7d2c12

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/auth-register.spec.ts` |
| **Priority** | P2 |

**Preconditions**: none.

**User Journey Steps**:
1. `await anonymous.registerPage.goto()`
2. Mock `/api/auth/register` to return 500 with `{ status: "error", message: "Registration failed" }` via `page.route()`
3. Fill all fields
4. `await Promise.all([waitForResponse(/\/api\/auth\/register/, 500), submitForm()])`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `registerPage.errorAlert` | `toContainText` | `"Registration failed"` |
| URL | `toMatch` | `/\/register$/` |

**Stability Notes**: `page.route()` mock is the only way to deterministically reproduce a 5xx in this test environment (real BE is healthy).

**Cleanup Contract**:
- **Mutation**: none (request was mocked).
- **Teardown**: `unroute` in `afterEach`.

---

### 4.4 Navbar & Navigation

#### TC-NV-01: Anonymous sees Home / Login / Register and NO authenticated buttons @Tb18a3d01

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/navbar.spec.ts` |
| **Priority** | P0 |

**Preconditions**: none.

**User Journey Steps**:
1. `await anonymous.landingPage.goto()`
2. Wait for `navbar.brandLogo` visible

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `navbar.homeButton` (`[data-testid="navbar-home-btn"]`) | `toBeVisible` | — |
| `navbar.loginButton` (`[data-testid="navbar-login-btn"]`) | `toBeVisible` | — |
| `navbar.registerButton` (`[data-testid="navbar-register-btn"]`) | `toBeVisible` | — |
| `navbar.dashboardButton` | `toHaveCount` | `0` |
| `navbar.adminButton` | `toHaveCount` | `0` |
| `navbar.avatar` | `toHaveCount` | `0` |

**Stability Notes**: navbar visibility depends on `useAuth.loading` resolving — wait for `LoadingSpinner` (data-testid `protected-loading-spinner`) to disappear OR for `navbar.loginButton` to appear.

**Cleanup Contract**: read-only.

---

#### TC-NV-02: Authenticated guest sees Home + Dashboard + Avatar (no Admin) @Tb18a3d02

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/navbar.spec.ts` |
| **Priority** | P0 |

**Preconditions**: Guest authenticated via fixture.

**User Journey Steps**:
1. `await guest.guestDashboardPage.goto()`
2. Wait for `navbar.avatar` visible

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `navbar.dashboardButton` | `toBeVisible` | — |
| `navbar.avatar` | `toBeVisible` | — |
| `navbar.adminButton` | `toHaveCount` | `0` |
| `navbar.loginButton` | `toHaveCount` | `0` |
| `navbar.registerButton` | `toHaveCount` | `0` |

**Stability Notes**: wait for `avatar` visible to confirm hydration before negative assertions on Admin button.

**Cleanup Contract**: read-only.

---

#### TC-NV-03: Authenticated admin sees Home + Dashboard + Admin + Avatar @Tb18a3d03

| Field | Value |
|-------|-------|
| **Fixture** | `admin` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/navbar.spec.ts` |
| **Priority** | P0 |

**Preconditions**: Admin authenticated via fixture.

**User Journey Steps**:
1. `await admin.guestDashboardPage.goto()`
2. Wait for `navbar.avatar` visible

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `navbar.dashboardButton` | `toBeVisible` | — |
| `navbar.adminButton` | `toBeVisible` | — |
| `navbar.avatar` | `toBeVisible` | — |
| `navbar.loginButton` | `toHaveCount` | `0` |

**Stability Notes**: as TC-NV-02.

**Cleanup Contract**: read-only.

---

#### TC-NV-04: Brand logo navigates to / @Tb18a3d04

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/navbar.spec.ts` |
| **Priority** | P2 |

**Preconditions**: Guest authenticated.

**User Journey Steps**:
1. `await guest.myBookingsPage.goto()` — start on a deep page
2. `await guest.navbar.clickBrand()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/^http:\/\/localhost:3000\/$/` |
| `landingPage.heroSection` | `toBeVisible` | — |

**Stability Notes**: `waitForURL`.

**Cleanup Contract**: read-only.

---

#### TC-NV-05: Avatar menu opens with full name + email + My Profile + Logout @Tb18a3d05

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/navbar.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Guest authenticated.

**User Journey Steps**:
1. `await guest.guestDashboardPage.goto()`
2. `await guest.navbar.openAvatarMenu()`
3. Wait for `navbar.avatarMenuPanel` visible

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `navbar.avatarMenuName` (`[data-testid="navbar-avatar-menu-name"]`) | `toContainText` | `"Guest User"` |
| `navbar.avatarMenuEmail` (`[data-testid="navbar-avatar-menu-email"]`) | `toContainText` | `"guest@hotel.com"` |
| `navbar.avatarMenuMyProfile` (`[data-testid="navbar-avatar-menu-profile"]`) | `toBeVisible` | — |
| `navbar.avatarMenuLogout` (`[data-testid="navbar-avatar-menu-logout"]`) | `toBeVisible` | — |

**Stability Notes**: MUI `<Menu>` opens via portal — locators must scope to `navbar.avatarMenuPanel` root, not `page.locator(...)` globally.

**Cleanup Contract**: read-only.

---

#### TC-NV-06: Avatar menu "My Profile" navigates to /dashboard (current behaviour) @Tb18a3d06

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/navbar.spec.ts` |
| **Priority** | P2 |

**Preconditions**: Guest authenticated.

**User Journey Steps**:
1. `await guest.myBookingsPage.goto()`
2. `await guest.navbar.openAvatarMenu()`
3. `await guest.navbar.clickAvatarMenuMyProfile()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/dashboard$/` (per `Navbar.tsx`: clicking "My Profile" actually navigates to `/dashboard`, NOT `/dashboard/profile` — this test documents current behaviour) |

**Stability Notes**: `waitForURL`. NB: The current Navbar wires "My Profile" to `/dashboard`, which appears to be a bug — see §9.2 BUG-002. This test asserts current behaviour; if that bug is fixed, this test name & expected URL must be updated (per RULE 8).

**Cleanup Contract**: read-only.

---

#### TC-NV-07: Logout clears localStorage token, hides authenticated nav, navigates to / @Tb18a3d07

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/navbar.spec.ts` |
| **Priority** | P0 |

**Preconditions**: Guest authenticated.

**User Journey Steps**:
1. `await guest.guestDashboardPage.goto()`
2. `await guest.navbar.openAvatarMenu()`
3. `await guest.navbar.clickAvatarMenuLogout()`
4. `await guest.page.waitForURL(/\/$/)`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/$/` (root) |
| `localStorage["token"]` | `toBeNull` | — |
| `navbar.loginButton` | `toBeVisible` | — (anonymous nav restored) |
| `navbar.dashboardButton` | `toHaveCount` | `0` |
| `navbar.avatar` | `toHaveCount` | `0` |

**Stability Notes**: `waitForURL` after logout; assert localStorage via `page.evaluate`.

**Cleanup Contract**: read-only.

---

#### TC-NV-08: After logout, accessing /dashboard redirects to /login @Tb18a3d08

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/navbar.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Guest authenticated.

**User Journey Steps**:
1. `await guest.guestDashboardPage.goto()`
2. Logout (TC-NV-07 steps 2-4)
3. `await guest.page.goto("/dashboard")`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/login$/` |
| `loginPage.formHeader` | `toBeVisible` | — |

**Stability Notes**: `waitForURL`.

**Cleanup Contract**: read-only.

---

#### TC-NV-09: Mobile drawer opens via hamburger and shows all nav links @Tb18a3d09

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/navbar.spec.ts` |
| **Priority** | P2 |

**Preconditions**: viewport width must be `< 900px` (MUI `md` breakpoint default).

**User Journey Steps**:
1. `await anonymous.page.setViewportSize({ width: 600, height: 800 })`
2. `await anonymous.landingPage.goto()`
3. `await anonymous.navbar.clickHamburger()`
4. Wait for `navbar.mobileDrawer` visible

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `navbar.mobileDrawer` (`[data-testid="navbar-mobile-drawer"]`) | `toBeVisible` | — |
| `navbar.mobileDrawerHomeItem` (`[data-testid="navbar-mobile-home"]`) | `toBeVisible` | — |
| `navbar.mobileDrawerLoginItem` (`[data-testid="navbar-mobile-login"]`) | `toBeVisible` | — |
| `navbar.mobileDrawerRegisterItem` (`[data-testid="navbar-mobile-register"]`) | `toBeVisible` | — |
| `navbar.hamburger` (`[data-testid="navbar-hamburger"]`) | `toBeVisible` | — |

**Stability Notes**: viewport change does NOT trigger re-render of `useMediaQuery` automatically in some Playwright timing scenarios — call `setViewportSize` BEFORE `goto`.

**Cleanup Contract**: read-only.

---

### 4.5 Protected Routes & Role Gating

> **Compact Group Spec** — TC-PR-01..06 share preconditions, steps, locators, assertions; only the protected URL changes.

#### Group: Anonymous user is redirected to /login from any protected route (6 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Spec File** | `tests-UI/protected-routes.spec.ts` |
| **Fixture** | `anonymous` |
| **Tags** | `@smoke @negative` |
| **Preconditions** | none |
| **Test Data** | per-test variant URL |
| **Steps** | 1. `await anonymous.page.goto({url})` — 2. Wait for redirect to `/login` |
| **Resolved Locators** | `loginPage.formHeader` → `[data-testid="login-header"]` |
| **Assertions** | URL `toMatch` `/\/login$/` AND `loginPage.formHeader` `toBeVisible` |
| **Stability** | `page.waitForURL(/\/login$/)` covers the redirect race |
| **Cleanup** | read-only, parallel-safe |

**Per-Test Variants**:
| ID | Test Name | Test ID | Protected URL | Status |
|----|-----------|---------|---------------|--------|
| PR-01 | Anonymous user is redirected to /login when accessing /dashboard | @Tc4f81a01 | `/dashboard` | Pending |
| PR-02 | Anonymous user is redirected to /login when accessing /dashboard/bookings | @Tc4f81a02 | `/dashboard/bookings` | Pending |
| PR-03 | Anonymous user is redirected to /login when accessing /dashboard/rooms | @Tc4f81a03 | `/dashboard/rooms` | Pending |
| PR-04 | Anonymous user is redirected to /login when accessing /dashboard/rooms/1 | @Tc4f81a04 | `/dashboard/rooms/1` | Pending |
| PR-05 | Anonymous user is redirected to /login when accessing /dashboard/profile | @Tc4f81a05 | `/dashboard/profile` | Pending |
| PR-06 | Anonymous user is redirected to /login when accessing /admin | @Tc4f81a06 | `/admin` | Pending |

---

#### TC-PR-07: Authenticated guest accessing /admin is redirected to /dashboard @Tc4f81a07

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@smoke @negative` |
| **Spec File** | `tests-UI/protected-routes.spec.ts` |
| **Priority** | P0 |

**Preconditions**: Guest authenticated.

**User Journey Steps**:
1. `await guest.page.goto("/admin")`
2. `await guest.page.waitForURL(/\/dashboard$/)`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/dashboard$/` |
| `guestDashboard.welcomeBanner` | `toBeVisible` | — |
| `adminDashboard.banner` | `toHaveCount` | `0` (admin UI not rendered) |

**Stability Notes**: `waitForURL` covers the role-gate redirect.

**Cleanup Contract**: read-only.

---

#### TC-PR-08: Authenticated admin accessing /admin renders Admin Dashboard @Tc4f81a08

| Field | Value |
|-------|-------|
| **Fixture** | `admin` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/protected-routes.spec.ts` |
| **Priority** | P0 |

**Preconditions**: Admin authenticated.

**User Journey Steps**:
1. `await admin.adminDashboardPage.goto()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/admin$/` |
| `adminDashboard.banner` (`[data-testid="admin-banner"]`) | `toBeVisible` | — |
| `adminDashboard.banner` | `toContainText` | `"Admin Dashboard"` |
| `adminDashboard.adminChip` (`[data-testid="admin-chip"]`) | `toHaveText` | `"ADMIN"` |

**Stability Notes**: `waitForURL`.

**Cleanup Contract**: read-only.

---

#### TC-PR-09: Loading spinner is visible during initial auth hydration @Tc4f81a09

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/protected-routes.spec.ts` |
| **Priority** | P2 |

**Preconditions**: Token present in `localStorage` BEFORE first navigation; `/api/auth/me` is throttled to 1.5s.

**User Journey Steps**:
1. Set `localStorage.token` via `addInitScript`
2. Throttle `/api/auth/me` route handler with `route.continue({ delay: 1500 })`
3. `await anonymous.page.goto("/dashboard")`
4. Assert `LoadingSpinner` visible WHILE `/me` pending
5. Wait for `/me` 200 → spinner hidden → dashboard rendered

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `protectedRouteSpinner` (`[data-testid="protected-loading-spinner"]`) (during throttle) | `toBeVisible` | — |
| `protectedRouteSpinner` (after 200) | `toBeHidden` | — |
| `guestDashboard.welcomeBanner` (after 200) | `toBeVisible` | — |

**Stability Notes**: `route.continue({ delay })` is the only deterministic way to observe the loading state.

**Cleanup Contract**: read-only; `unroute` in `afterEach`.

---

#### TC-PR-10: Login redirects back to original deep-link URL after auth (state.from) @Tc4f81a10

> **Note**: Same coverage as TC-AL-12 — kept here as a duplicate? **NO** — per RULE 4 do not duplicate; this slot is reserved for a related but distinct verification: the redirect chain works for any of the protected URLs, not just `/dashboard/bookings`. To avoid duplicate, we cover `/dashboard/profile`:

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/protected-routes.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Seeded guest exists.

**User Journey Steps**:
1. `await anonymous.page.goto("/dashboard/profile")` — protected
2. `await anonymous.page.waitForURL(/\/login$/)`
3. Log in as guest (TC-AL-06 steps 2-4)
4. `await anonymous.page.waitForURL(/\/dashboard\/profile$/)`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/dashboard\/profile$/` |
| `myProfile.pageHeader` (`[data-testid="my-profile-header"]`) | `toBeVisible` | — |

**Stability Notes**: `waitForURL` twice (intermediate /login → final destination).

**Cleanup Contract**: read-only.

---

### 4.6 Guest Dashboard

#### TC-GD-01: Welcome banner shows greeting with current user firstName @Td53e9b01

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/guest-dashboard.spec.ts` |
| **Priority** | P0 |

**Preconditions**: Guest authenticated (firstName=`"Guest"` from seed).

**User Journey Steps**:
1. `await guest.guestDashboardPage.goto()`
2. Wait for `welcomeBanner` visible

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `guestDashboard.welcomeBanner` (`[data-testid="guest-welcome-banner"]`) | `toContainText` | `"Welcome, Guest!"` |
| `guestDashboard.welcomeBannerSubtitle` (`[data-testid="guest-welcome-subtitle"]`) | `toContainText` | `"Manage your bookings"` |

**Stability Notes**: banner depends on `useAuth.user` — wait for `roleChip` visible as hydration proxy.

**Cleanup Contract**: read-only.

---

#### TC-GD-02: Role chip shows uppercase role for guest @Td53e9b02

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/guest-dashboard.spec.ts` |
| **Priority** | P0 |

**Preconditions**: Guest authenticated.

**User Journey Steps**:
1. `await guest.guestDashboardPage.goto()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `guestDashboard.roleChip` (`[data-testid="guest-role-chip"]`) | `toHaveText` | `"GUEST"` |

**Stability Notes**: as TC-GD-01.

**Cleanup Contract**: read-only.

---

#### TC-GD-03: Role chip shows uppercase role for admin @Td53e9b03

| Field | Value |
|-------|-------|
| **Fixture** | `admin` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/guest-dashboard.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Admin authenticated.

**User Journey Steps**:
1. `await admin.guestDashboardPage.goto()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `guestDashboard.roleChip` | `toHaveText` | `"ADMIN"` |

**Stability Notes**: as TC-GD-01.

**Cleanup Contract**: read-only.

---

#### TC-GD-04: Three quick-action cards visible — My Bookings / Browse Rooms / My Profile @Td53e9b04

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/guest-dashboard.spec.ts` |
| **Priority** | P0 |

**Preconditions**: Guest authenticated.

**User Journey Steps**:
1. `await guest.guestDashboardPage.goto()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `guestDashboard.myBookingsCard` (`[data-testid="dashboard-card-my-bookings"]`) | `toBeVisible` | — |
| `guestDashboard.myBookingsCardTitle` | `toHaveText` | `"My Bookings"` |
| `guestDashboard.browseRoomsCard` (`[data-testid="dashboard-card-browse-rooms"]`) | `toBeVisible` | — |
| `guestDashboard.browseRoomsCardTitle` | `toHaveText` | `"Browse Rooms"` |
| `guestDashboard.myProfileCard` (`[data-testid="dashboard-card-my-profile"]`) | `toBeVisible` | — |
| `guestDashboard.myProfileCardTitle` | `toHaveText` | `"My Profile"` |

**Stability Notes**: all three cards render synchronously after `useAuth.user` populates.

**Cleanup Contract**: read-only.

---

> **Compact Group Spec** — TC-GD-05..07 share everything except which card is clicked.

#### Group: Quick-action card click navigates to corresponding page (3 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Spec File** | `tests-UI/guest-dashboard.spec.ts` |
| **Tags** | `@smoke` |
| **Preconditions** | Guest authenticated |
| **Test Data** | per-variant card name + expected URL |
| **Steps** | 1. `await guest.guestDashboardPage.goto()` — 2. Click variant card — 3. `waitForURL(variantUrl)` |
| **Resolved Locators** | per variant `data-testid` |
| **Assertion** | URL `toMatch` variantUrl + destination page header visible |
| **Stability** | `waitForURL` |
| **Cleanup** | read-only, parallel-safe |

**Per-Test Variants**:
| ID | Test Name | Test ID | Card | Expected URL | Destination Locator | Status |
|----|-----------|---------|------|--------------|---------------------|--------|
| GD-05 | Guest can navigate to My Bookings via dashboard card | @Td53e9b05 | `myBookingsCard` | `/\/dashboard\/bookings$/` | `myBookings.pageHeader` | Pending |
| GD-06 | Guest can navigate to Browse Rooms via dashboard card | @Td53e9b06 | `browseRoomsCard` | `/\/dashboard\/rooms$/` | `browseRooms.pageHeader` | Pending |
| GD-07 | Guest can navigate to My Profile via dashboard card | @Td53e9b07 | `myProfileCard` | `/\/dashboard\/profile$/` | `myProfile.pageHeader` | Pending |

> **Test count**: §4.6 contains **7 tests** total — 4 standalone (GD-01..04) + 3 in the Compact Group above (GD-05..07). Aligns with §3 row "Guest Dashboard = 7".

---

### 4.7 Browse Rooms

#### TC-BR-01: Page header "Browse Rooms" visible @Te6c2d701

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/browse-rooms.spec.ts` |
| **Priority** | P0 |

**Preconditions**: Guest authenticated.

**User Journey Steps**:
1. `await guest.browseRoomsPage.goto()`
2. Wait for `pageHeader` visible

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `browseRooms.pageHeader` (`[data-testid="page-header"]`) ✅ exists | `toBeVisible` | — |
| `browseRooms.pageTitle` (`[data-testid="page-title"]`) ✅ exists | `toHaveText` | `"Browse Rooms"` |

**Stability Notes**: page header is static; appears immediately after `useEffect` start.

**Cleanup Contract**: read-only.

---

#### TC-BR-02: "Back to Dashboard" button navigates to /dashboard @Te6c2d702

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/browse-rooms.spec.ts` |
| **Priority** | P2 |

**Preconditions**: Guest authenticated.

**User Journey Steps**:
1. `await guest.browseRoomsPage.goto()`
2. `await guest.browseRoomsPage.clickBackToDashboard()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/dashboard$/` |
| `guestDashboard.welcomeBanner` | `toBeVisible` | — |

**Stability Notes**: `waitForURL`.

**Cleanup Contract**: read-only.

---

#### TC-BR-03: All 9 seeded rooms render as cards @Te6c2d703

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/browse-rooms.spec.ts` |
| **Priority** | P0 |

**Preconditions**: Database is freshly seeded with 9 rooms (per `prisma/seed.ts`).

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Expected room numbers | `["101","102","103","201","202","301","302","401","501"]` | `data/roomData.ts` SEEDED_ROOM_NUMBERS |

**User Journey Steps**:
1. `await guest.browseRoomsPage.goto()`
2. `await Promise.all([waitForResponse(/\/api\/rooms$/, 200), guest.browseRoomsPage.waitForLoaded()])`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `browseRooms.roomCards` (`[data-testid^="room-card-"]`) ✅ exists | `toHaveCount` | `9` |
| `browseRooms.roomCardByNumber("101")` (`[data-testid="room-card-101"]`) | `toBeVisible` | — |
| `browseRooms.roomCardByNumber("501")` (`[data-testid="room-card-501"]`) | `toBeVisible` | — |
| `browseRooms.loadingSpinner` (`[data-testid="loading-spinner"]`) ✅ exists | `toHaveCount` | `0` (after load) |

**Stability Notes**: `Promise.all([waitForResponse(/\/api\/rooms$/, 200), goto])` to wait for the data fetch; then verify spinner disappeared.

**Cleanup Contract**: read-only on rooms; parallel-safe (no test mutates rooms).

---

#### TC-BR-04: Room card displays full content (number, status, type, description, capacity, price, Book Now) @Te6c2d704

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/browse-rooms.spec.ts` |
| **Priority** | P0 |

**Preconditions**: Seeded room 101 exists (single, capacity 1, $89/night).

**User Journey Steps**:
1. `await guest.browseRoomsPage.goto()`
2. `await guest.browseRoomsPage.waitForLoaded()`
3. Scope to `roomCardByNumber("101")`

**Expected Assertions**:
| Locator (within room-card-101) | Assertion | Expected Value |
|--------------------------------|-----------|----------------|
| `card.locator('[data-testid="room-number"]')` | `toContainText` | `"Room 101"` |
| `card.locator('[data-testid="room-status"]')` | `toContainText` | `"available"` |
| `card.locator('[data-testid="room-type"]')` | `toContainText` | `"Single"` |
| `card.locator('[data-testid="room-description"]')` | `toContainText` | `"single room"` (substring of seed description) |
| `card.locator('[data-testid="room-capacity"]')` | `toHaveText` | `"1 guest"` (singular) |
| `card.locator('[data-testid="room-price"]')` | `toContainText` | `"$89"` |
| `card.locator('[data-testid="book-now-btn"]')` | `toBeVisible` | — |

**Stability Notes**: scope every assertion under the parent card locator — DO NOT use `getByText` globally.

**Cleanup Contract**: read-only.

---

#### TC-BR-05: Available room shows green status chip @Te6c2d705

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/browse-rooms.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Seeded room 101 has status `"available"`.

**User Journey Steps**:
1. `await guest.browseRoomsPage.goto()`
2. `await guest.browseRoomsPage.waitForLoaded()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `roomCardByNumber("101").locator('[data-testid="room-status"]')` | `toHaveAttribute("data-status", "available")` | — |
| `roomCardByNumber("101").locator('[data-testid="room-status"]')` | `toContainText` | `"available"` |
| Computed CSS class on chip | `toMatch` | `/MuiChip-colorSuccess/` (green = MUI success palette) |

**Stability Notes**: chip class is deterministic from MUI `color="success"` prop.

**Cleanup Contract**: read-only.

> **Locator-add note**: A new `data-status` attribute should be added to the status chip to avoid asserting on MUI internal class names. See §6 catalog row for `room-status` (`TO ADD: data-status`).

---

#### TC-BR-06: Maintenance room (302) shows warning status chip @Te6c2d706

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/browse-rooms.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Seeded room 302 has status `"maintenance"`.

**User Journey Steps**:
1. `await guest.browseRoomsPage.goto()`
2. `await guest.browseRoomsPage.waitForLoaded()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `roomCardByNumber("302").locator('[data-testid="room-status"]')` | `toContainText` | `"maintenance"` |
| `roomCardByNumber("302").locator('[data-testid="room-status"]')` | `toHaveAttribute("data-status", "maintenance")` | — |

**Stability Notes**: as TC-BR-05.

**Cleanup Contract**: read-only.

---

#### TC-BR-07: Capacity is rendered as "1 guest" (singular) for capacity=1 and "X guests" (plural) for capacity>1 @Te6c2d707

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/browse-rooms.spec.ts` |
| **Priority** | P2 |

**Preconditions**: Room 101 capacity=1; Room 201 capacity=2; Room 301 capacity=3.

**User Journey Steps**:
1. `await guest.browseRoomsPage.goto()`
2. `await guest.browseRoomsPage.waitForLoaded()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `roomCardByNumber("101").locator('[data-testid="room-capacity"]')` | `toHaveText` | `"1 guest"` |
| `roomCardByNumber("201").locator('[data-testid="room-capacity"]')` | `toHaveText` | `"2 guests"` |
| `roomCardByNumber("301").locator('[data-testid="room-capacity"]')` | `toHaveText` | `"3 guests"` |

**Stability Notes**: rendering pluralisation is synchronous.

**Cleanup Contract**: read-only.

---

#### TC-BR-08: Click on room card navigates to /dashboard/rooms/:id @Te6c2d708

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/browse-rooms.spec.ts` |
| **Priority** | P0 |

**Preconditions**: Seeded rooms exist.

**User Journey Steps**:
1. `await guest.browseRoomsPage.goto()`
2. `await guest.browseRoomsPage.waitForLoaded()`
3. `const roomId = await guest.browseRoomsPage.getRoomIdByNumber("101")` — reads `data-room-id` attribute (TO ADD)
4. `await guest.browseRoomsPage.clickRoomCard("101")`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `` new RegExp(`/dashboard/rooms/${roomId}$`) `` |
| `roomDetails.pageHeader` (`[data-testid="room-details-header"]`) | `toBeVisible` | — |

**Stability Notes**: room IDs are auto-incremented; cannot be hardcoded — read at runtime via `data-room-id` (TO ADD on the card).

**Cleanup Contract**: read-only.

---

#### TC-BR-09: Loading spinner is visible during initial fetch @Te6c2d709

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/browse-rooms.spec.ts` |
| **Priority** | P2 |

**Preconditions**: throttle `/api/rooms` route by 1s.

**User Journey Steps**:
1. Throttle `/api/rooms$` route with 1s delay via `page.route()`
2. `await guest.browseRoomsPage.goto()`
3. Assert `loadingSpinner` visible WHILE in flight
4. Wait for response → spinner hidden

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `browseRooms.loadingSpinner` (during throttle) | `toBeVisible` | — |
| `browseRooms.loadingSpinner` (after) | `toBeHidden` | — |
| `browseRooms.roomCards` (after) | `toHaveCount` | `9` |

**Stability Notes**: `page.route` throttle as in TC-AL-10.

**Cleanup Contract**: `unroute` in `afterEach`.

---

### 4.8 Room Details & Booking

#### TC-RD-01: Room details page renders header (number, type, status, image placeholder, description, amenities) @Tf9d3e801

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/room-details-booking.spec.ts` |
| **Priority** | P0 |

**Preconditions**: Seeded room 201 (double, $139, 5 amenities including `Wi-Fi`, `TV`, `Air Conditioning`, `Mini Bar`, `Coffee Maker`). Read its DB id at runtime.

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Room number | `"201"` | inline |
| Room id | runtime (resolved via `roomApi.getByNumber("201")`) | helper |

**User Journey Steps**:
1. Resolve room id: `const room = await roomApi.getByNumber("201")`
2. `await guest.roomDetailsPage.goto(room.id)`
3. Wait for `pageHeader` visible

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `roomDetails.pageHeader` (`[data-testid="room-details-header"]`) | `toContainText` | `"Room 201"` |
| `roomDetails.typeChip` (`[data-testid="room-details-type"]`) | `toContainText` | `"DOUBLE"` |
| `roomDetails.statusChip` (`[data-testid="room-details-status"]`) | `toContainText` | `"available"` |
| `roomDetails.imagePlaceholder` (`[data-testid="room-details-image"]`) | `toBeVisible` | — |
| `roomDetails.description` (`[data-testid="room-details-description"]`) | `toContainText` | `"Spacious double room"` (substring of seed) |
| `roomDetails.amenitiesList` (`[data-testid="room-details-amenities"]`) | `toBeVisible` | — |
| `roomDetails.amenityItem` (`[data-testid="room-details-amenity"]`) | `toHaveCount` | `5` |

**Stability Notes**: `Promise.all([waitForResponse(/\/api\/rooms\/\d+/), goto()])`.

**Cleanup Contract**: read-only.

---

#### TC-RD-02: Booking form shows all required inputs @Tf9d3e802

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/room-details-booking.spec.ts` |
| **Priority** | P0 |

**Preconditions**: room 201.

**User Journey Steps**:
1. `await guest.roomDetailsPage.goto(room201.id)`
2. Wait for `bookingForm` visible

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `roomDetails.checkInInput` (`[data-testid="booking-checkin-input"]`) | `toBeVisible` | — |
| `roomDetails.checkOutInput` (`[data-testid="booking-checkout-input"]`) | `toBeVisible` | — |
| `roomDetails.guestsInput` (`[data-testid="booking-guests-input"]`) | `toBeVisible` | — |
| `roomDetails.specialRequestsInput` (`[data-testid="booking-special-requests-input"]`) | `toBeVisible` | — |
| `roomDetails.confirmBookingButton` (`[data-testid="booking-confirm-btn"]`) | `toBeVisible` | — |
| `roomDetails.priceHeader` (`[data-testid="booking-price-header"]`) | `toContainText` | `"$139"` |
| `roomDetails.priceHeader` | `toContainText` | `"/ night"` |

**Stability Notes**: form is rendered synchronously after room data loads.

**Cleanup Contract**: read-only.

---

#### TC-RD-03: "Back to Rooms" button navigates to /dashboard/rooms @Tf9d3e803

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/room-details-booking.spec.ts` |
| **Priority** | P2 |

**Preconditions**: room 201.

**User Journey Steps**:
1. `await guest.roomDetailsPage.goto(room201.id)`
2. `await guest.roomDetailsPage.clickBackToRooms()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/dashboard\/rooms$/` |
| `browseRooms.pageTitle` | `toBeVisible` | — |

**Stability Notes**: `waitForURL`.

**Cleanup Contract**: read-only.

---

#### TC-RD-04: Total price computes correctly when both dates are selected @Tf9d3e804

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/room-details-booking.spec.ts` |
| **Priority** | P1 |

**Preconditions**: room 201 ($139/night).

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Check-in | `daysFromNow(1)` (YYYY-MM-DD) | `helpers/dateHelpers.ts` |
| Check-out | `daysFromNow(4)` (3 nights) | `helpers/dateHelpers.ts` |
| Expected total | `3 × 139 = 417` | computed |

**User Journey Steps**:
1. `await guest.roomDetailsPage.goto(room201.id)`
2. `await guest.roomDetailsPage.fillCheckIn(daysFromNow(1))`
3. `await guest.roomDetailsPage.fillCheckOut(daysFromNow(4))`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `roomDetails.totalPriceBlock` (`[data-testid="booking-total-price-block"]`) | `toBeVisible` | — |
| `roomDetails.totalPriceValue` (`[data-testid="booking-total-price"]`) | `toHaveText` | `"$417"` |

**Stability Notes**: total price is computed synchronously from local state.

**Cleanup Contract**: read-only (no booking submitted).

---

#### TC-RD-05: Total price block hidden until both dates entered @Tf9d3e805

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/room-details-booking.spec.ts` |
| **Priority** | P2 |

**Preconditions**: room 201.

**User Journey Steps**:
1. `await guest.roomDetailsPage.goto(room201.id)`
2. Fill ONLY check-in (no check-out)

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `roomDetails.totalPriceBlock` | `toHaveCount` | `0` |

**Stability Notes**: synchronous render.

**Cleanup Contract**: read-only.

---

#### TC-RD-06: Successful booking creates record, shows success alert, redirects to /dashboard/bookings after 2s @Tf9d3e806

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/room-details-booking.spec.ts` |
| **Priority** | P0 |

**Preconditions**: room 201 has NO conflicting bookings for chosen dates.

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Room | `room201` | runtime |
| Check-in | `daysFromNow(1)` | helper |
| Check-out | `daysFromNow(3)` | helper |
| Guests | `2` | inline |
| Special requests | `` `BookingTest_${nanoid(6)}` `` | helper (unique marker for cleanup) |

**User Journey Steps**:
1. `await guest.roomDetailsPage.goto(room201.id)`
2. `await guest.roomDetailsPage.fillBookingForm({ checkIn, checkOut, guests, requests })`
3. `await Promise.all([waitForResponse(/\/api\/bookings$/, 201), guest.roomDetailsPage.clickConfirmBooking()])`
4. Wait for `successAlert` visible
5. Wait for `URL` `/dashboard\/bookings$/` (FE auto-redirects after 2s — use `page.waitForURL` with default timeout, NOT `waitForTimeout`)

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `roomDetails.successAlert` (`[data-testid="booking-success-alert"]`) | `toContainText` | `"Booking confirmed"` |
| URL (after 2s redirect) | `toMatch` | `/\/dashboard\/bookings$/` |
| New booking row on `/dashboard/bookings` (filtered by `BookingTest_*` marker) | `toHaveCount` | `1` |

**Stability Notes**:
- `Promise.all([waitForResponse(/\/api\/bookings$/, 201), click])` per PATTERN 11.
- The 2-second redirect via `setTimeout` in `RoomDetailsPage.tsx` is real — `page.waitForURL` covers it deterministically (DO NOT use `waitForTimeout(2000)` per PATTERN 9).

**Cleanup Contract**:
- **Mutation**: 1 booking created.
- **Shared state impact**: room 201's offer/booking conflict window includes these dates (other tests must avoid overlap).
- **Parallel safety**: ⚠️ Serial — booking-create tests must run with `test.describe.serial` because they overlap on room 201; OR use a unique room per test (see §5 shared `beforeAll` strategy).
- **Teardown**: `afterEach` deletes the booking by special-requests marker via `bookingApi.cleanupByMarker()`.

---

#### TC-RD-07: Confirm Booking button is disabled when room status !== 'available' @Tf9d3e807

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/room-details-booking.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Seeded room 302 has status `"maintenance"`.

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Room | `room302` (maintenance) | runtime |

**User Journey Steps**:
1. `await guest.roomDetailsPage.goto(room302.id)`
2. Wait for `bookingForm` visible

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `roomDetails.confirmBookingButton` | `toBeDisabled` | — |
| `roomDetails.notAvailableMessage` (`[data-testid="booking-not-available-msg"]`) | `toContainText` | `"This room is currently not available for booking"` |

**Stability Notes**: button is disabled synchronously based on `room.status`.

**Cleanup Contract**: read-only.

---

#### TC-RD-08: Confirm Booking button is disabled and shows spinner during submission @Tf9d3e808

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/room-details-booking.spec.ts` |
| **Priority** | P2 |

**Preconditions**: room 201 free for chosen dates.

**User Journey Steps**:
1. Throttle `/api/bookings$ POST` route with 1s delay
2. `await guest.roomDetailsPage.goto(room201.id)`
3. Fill form (TC-RD-06 step 2)
4. Click confirm
5. Assert button disabled + spinner visible WHILE pending
6. Wait for response → success alert

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `roomDetails.confirmBookingButton` (during) | `toBeDisabled` | — |
| `roomDetails.confirmBookingButtonSpinner` (`[data-testid="booking-confirm-btn-spinner"]`) (during) | `toBeVisible` | — |

**Stability Notes**: `page.route` throttle.

**Cleanup Contract**:
- **Mutation**: 1 booking; clean up by marker.
- **Teardown**: `unroute` + `cleanupByMarker`.

---

#### TC-RD-09: Booking with check-in in the past returns API error and surfaces message @Tf9d3e809

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/room-details-booking.spec.ts` |
| **Priority** | P1 |

**Preconditions**: room 201.

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Check-in | `daysFromNow(-1)` (yesterday) | helper |
| Check-out | `daysFromNow(2)` | helper |

**User Journey Steps**:
1. `await guest.roomDetailsPage.goto(room201.id)`
2. Fill form with past check-in
3. `await Promise.all([waitForResponse(/\/api\/bookings$/, 400), clickConfirmBooking()])`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `roomDetails.errorAlert` (`[data-testid="booking-error-alert"]`) | `toContainText` | `"Check-in date cannot be in the past"` |
| URL | `toMatch` | `` new RegExp(`/dashboard/rooms/${room201.id}$`) `` |

**Stability Notes**: HTML `min` attribute on date input would normally prevent past dates — but JavaScript can bypass by typing directly; the test uses `fill()` which sets value programmatically and triggers BE validation.

> **Risk**: depending on browser, the HTML5 date `min` attr may visually grey out past dates but still allow programmatic `.fill()`. Verify in temp DOM debug before finalising.

**Cleanup Contract**: read-only (no booking created — server rejected).

---

#### TC-RD-10: Booking with check-out ≤ check-in returns API error @Tf9d3e810

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/room-details-booking.spec.ts` |
| **Priority** | P1 |

**Preconditions**: room 201.

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Check-in | `daysFromNow(2)` | helper |
| Check-out | `daysFromNow(2)` (same day, no night) | helper |

**User Journey Steps**:
1. Fill form
2. `await Promise.all([waitForResponse(/\/api\/bookings$/, 400), clickConfirmBooking()])`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `roomDetails.errorAlert` | `toContainText` | `"Check-out date must be after check-in date"` |

**Stability Notes**: as TC-RD-09.

**Cleanup Contract**: read-only.

---

#### TC-RD-11: Booking with guests > room.capacity returns 400 with capacity message @Tf9d3e811

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/room-details-booking.spec.ts` |
| **Priority** | P1 |

**Preconditions**: room 101 (single, capacity=1).

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Room | `room101` | runtime |
| Check-in | `daysFromNow(1)` | helper |
| Check-out | `daysFromNow(2)` | helper |
| Guests | `5` (above max) | inline |

**User Journey Steps**:
1. `await guest.roomDetailsPage.goto(room101.id)`
2. Fill form, override `guestsInput` directly to `5` (HTML `max` attr=1 will normally prevent — must use `evaluate` to forcibly set value)
3. `await Promise.all([waitForResponse(/\/api\/bookings$/, 400), clickConfirmBooking()])`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `roomDetails.errorAlert` | `toContainText` | `"Room capacity is 1 guests"` (BE message; off-by-pluralisation noted in §9) |

**Stability Notes**: HTML `max` attribute does not always block programmatic `.fill()` — that's the point of this test (the FE allows bypass; BE must catch). If browser blocks the value entirely, fall back to `roomDetails.guestsInput.evaluate(el => el.value = '5')` and dispatch `input` event.

**Cleanup Contract**: read-only.

---

#### TC-RD-12: Booking conflicting with an existing confirmed booking returns 409 @Tf9d3e812

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/room-details-booking.spec.ts` |
| **Priority** | P1 |

**Preconditions**: A confirmed booking exists on `room401` for `daysFromNow(7..9)`. Created via API in `beforeEach`.

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Room | `room401` (deluxe) | runtime |
| Existing booking | created via `bookingApi.createConfirmed({ roomId: room401.id, checkIn: daysFromNow(7), checkOut: daysFromNow(9) })` | inline `beforeEach` |
| Test booking check-in | `daysFromNow(8)` (overlaps) | helper |
| Test booking check-out | `daysFromNow(10)` | helper |

**User Journey Steps**:
1. (`beforeEach`) Create existing booking via API as the SAME guest.
2. `await guest.roomDetailsPage.goto(room401.id)`
3. Fill form with overlapping dates
4. `await Promise.all([waitForResponse(/\/api\/bookings$/, 409), clickConfirmBooking()])`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `roomDetails.errorAlert` | `toContainText` | `"Room is not available for selected dates"` |

**Stability Notes**: precondition booking must complete BEFORE form submit (await the API helper).

**Cleanup Contract**:
- **Mutation**: 1 confirmed booking precondition; cancel/delete it in `afterEach`.
- **Parallel safety**: ⚠️ Serial — booking on room 401 cannot run in parallel with other tests using room 401.
- **Teardown**: `afterEach` calls `bookingApi.cleanupByGuestAndRoom(guestId, room401.id)`.

---

#### TC-RD-13: Special requests text is sent to API and persists on booking @Tf9d3e813

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/room-details-booking.spec.ts` |
| **Priority** | P2 |

**Preconditions**: room 501 (presidential, capacity 4) — least likely to conflict.

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Special request | `` `Late checkout please ${nanoid(6)}` `` | helper (unique) |

**User Journey Steps**:
1. `await guest.roomDetailsPage.goto(room501.id)`
2. Fill all fields including specialRequests
3. `await Promise.all([waitForResponse(/\/api\/bookings$/, 201), clickConfirmBooking()])`
4. Capture the booking id from response body
5. Reload navigation to `/dashboard/bookings`
6. Wait for booking row by id

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `myBookings.bookingRow(bookingId).note` (`[data-testid="my-bookings-row-note"]`) | `toContainText` | `` `Late checkout please ${nanoid_value}` `` |

**Stability Notes**: capture the new booking id from the `Promise.all` response, then assert against that specific row, not any row matching text.

**Cleanup Contract**: same teardown by id.

---

#### TC-RD-14: Number of guests defaults to 1 @Tf9d3e814

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/room-details-booking.spec.ts` |
| **Priority** | P2 |

**Preconditions**: room 201.

**User Journey Steps**:
1. `await guest.roomDetailsPage.goto(room201.id)`
2. Wait for `guestsInput` visible

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `roomDetails.guestsInput` | `toHaveValue` | `"1"` |

**Stability Notes**: synchronous default.

**Cleanup Contract**: read-only.

---

#### TC-RD-15: Capacity helper text shows "Maximum capacity: N" @Tf9d3e815

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/room-details-booking.spec.ts` |
| **Priority** | P2 |

**Preconditions**: room 401 (deluxe, capacity=4).

**User Journey Steps**:
1. `await guest.roomDetailsPage.goto(room401.id)`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `roomDetails.guestsHelper` (`[data-testid="booking-guests-helper"]`) | `toContainText` | `"Maximum capacity: 4"` |

**Stability Notes**: synchronous.

**Cleanup Contract**: read-only.

---

#### TC-RD-16: Loading spinner displays while fetching room details @Tf9d3e816

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/room-details-booking.spec.ts` |
| **Priority** | P2 |

**Preconditions**: throttle `/api/rooms/:id`.

**User Journey Steps**:
1. Throttle `/api/rooms/\d+$` with 1s delay
2. `await guest.roomDetailsPage.goto(room201.id)`
3. Assert spinner visible
4. Wait for response

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `roomDetails.loadingSpinner` (`[data-testid="room-details-loading-spinner"]`) (during) | `toBeVisible` | — |
| `roomDetails.pageHeader` (after) | `toBeVisible` | — |
| `roomDetails.loadingSpinner` (after) | `toHaveCount` | `0` |

**Stability Notes**: `page.route` throttle.

**Cleanup Contract**: `unroute`.

---

#### TC-RD-17: Invalid room ID shows error alert "Room not found" with Back to Rooms button @Tf9d3e817

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/room-details-booking.spec.ts` |
| **Priority** | P1 |

**Preconditions**: ID `999999` does not exist.

**User Journey Steps**:
1. `await guest.page.goto("/dashboard/rooms/999999")`
2. `await Promise.all([waitForResponse(/\/api\/rooms\/999999$/, 404), guest.roomDetailsPage.errorAlert.waitFor()])`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `roomDetails.errorAlert` (`[data-testid="room-details-error-alert"]`) | `toContainText` | `"Room not found"` |
| `roomDetails.backToRoomsButton` (`[data-testid="room-details-back-btn"]`) | `toBeVisible` | — |
| `roomDetails.bookingForm` | `toHaveCount` | `0` |

**Stability Notes**: `Promise.all` for 404; FE catches `response?.data?.message` and renders the `Alert`.

**Cleanup Contract**: read-only.

---

#### TC-RD-18: Form requires both check-in and check-out (HTML5 required) @Tf9d3e818

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/room-details-booking.spec.ts` |
| **Priority** | P2 |

**Preconditions**: room 201.

**User Journey Steps**:
1. `await guest.roomDetailsPage.goto(room201.id)`
2. Click `confirmBookingButton` WITHOUT filling dates

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `roomDetails.checkInInput` | `toHaveAttribute("required", "")` (or `toHaveJSProperty("required", true)`) | — |
| `roomDetails.checkOutInput` | `toHaveJSProperty("required", true)` | — |
| URL | `toMatch` | `` new RegExp(`/dashboard/rooms/${room201.id}$`) `` (no nav, browser blocks submit) |
| Network: `/api/bookings` | not called | use `requestfailed` watcher OR check `requests` array empty |

**Stability Notes**: HTML5 form validation prevents submit; verify by absence of API call within a 1s window post-click via `page.waitForRequest` with timeout + assertion that timeout was hit.

**Cleanup Contract**: read-only.

---

#### TC-RD-19: Number of guests max attribute equals room.capacity @Tf9d3e819

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/room-details-booking.spec.ts` |
| **Priority** | P2 |

**Preconditions**: room 401 (capacity=4).

**User Journey Steps**:
1. `await guest.roomDetailsPage.goto(room401.id)`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `roomDetails.guestsInput` | `toHaveAttribute("max", "4")` | — |
| `roomDetails.guestsInput` | `toHaveAttribute("min", "1")` | — |

**Stability Notes**: synchronous.

**Cleanup Contract**: read-only.

---

### 4.9 My Bookings

#### TC-MB-01: Page header "My Bookings" visible with icon @Ta42b9c01

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/my-bookings.spec.ts` |
| **Priority** | P0 |

**Preconditions**: Guest authenticated.

**User Journey Steps**:
1. `await guest.myBookingsPage.goto()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `myBookings.pageHeader` (`[data-testid="my-bookings-header"]`) | `toContainText` | `"My Bookings"` |

**Stability Notes**: page header static.

**Cleanup Contract**: read-only.

---

#### TC-MB-02: "Back to Dashboard" button navigates to /dashboard @Ta42b9c02

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/my-bookings.spec.ts` |
| **Priority** | P2 |

**Preconditions**: Guest authenticated.

**User Journey Steps**:
1. `await guest.myBookingsPage.goto()`
2. `await guest.myBookingsPage.clickBackToDashboard()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/dashboard$/` |

**Stability Notes**: `waitForURL`.

**Cleanup Contract**: read-only.

---

#### TC-MB-03: Empty state shows "No bookings yet" + Browse Rooms CTA when guest has 0 bookings @Ta42b9c03

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/my-bookings.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Guest has 0 bookings (DB freshly truncated of bookings via `beforeEach` helper).

**User Journey Steps**:
1. `await dbHelpers.truncateBookingsForGuest(SEEDED_GUEST.id)`
2. `await guest.myBookingsPage.goto()`
3. `await Promise.all([waitForResponse(/\/api\/bookings$/, 200), guest.myBookingsPage.waitForLoaded()])`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `myBookings.emptyState` (`[data-testid="my-bookings-empty-state"]`) | `toBeVisible` | — |
| `myBookings.emptyStateText` (`[data-testid="my-bookings-empty-text"]`) | `toContainText` | `"No bookings yet"` |
| `myBookings.emptyStateBrowseButton` (`[data-testid="my-bookings-empty-browse-btn"]`) | `toBeVisible` | — |
| `myBookings.bookingRows` (`[data-testid^="my-bookings-row-"]`) | `toHaveCount` | `0` |

**Stability Notes**: `Promise.all` for the GET; truncation must happen BEFORE goto.

**Cleanup Contract**:
- **Mutation**: deletes all guest bookings.
- **Parallel safety**: ⚠️ Serial within this spec file; OR use a per-test scratch user (per §5).
- **Teardown**: none (truncation is the goal).

---

#### TC-MB-04: Browse Rooms CTA in empty state navigates to /dashboard/rooms @Ta42b9c04

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/my-bookings.spec.ts` |
| **Priority** | P2 |

**Preconditions**: Guest has 0 bookings.

**User Journey Steps**:
1. (precondition truncate)
2. `await guest.myBookingsPage.goto()`
3. `await guest.myBookingsPage.clickEmptyStateBrowseRooms()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/dashboard\/rooms$/` |

**Stability Notes**: `waitForURL`.

**Cleanup Contract**: as TC-MB-03.

---

#### TC-MB-05: Booking card shows padded ID, dates, total price, status chip @Ta42b9c05

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/my-bookings.spec.ts` |
| **Priority** | P0 |

**Preconditions**: A confirmed booking exists for guest on room 201 with totalPrice=$278 (2 nights × $139), dates known.

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Booking | created via API in `beforeEach` | helper |

**User Journey Steps**:
1. `const booking = await bookingApi.createConfirmed({ roomId: room201.id, checkIn: daysFromNow(5), checkOut: daysFromNow(7), guests: 2, asUser: SEEDED_GUEST })`
2. `await guest.myBookingsPage.goto()`
3. Wait for `bookingRow(booking.id)` visible

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `myBookings.bookingRow(booking.id)` (`[data-testid="my-bookings-row-{id}"]`) | `toBeVisible` | — |
| `bookingRow.id` (`[data-testid="my-bookings-row-id"]`) | `toContainText` | `` `Booking #${String(booking.id).padStart(6, "0")}` `` |
| `bookingRow.dates` (`[data-testid="my-bookings-row-dates"]`) | `toContainText` | locale-formatted date range (assert against `formatDate(booking.checkInDate)` helper) |
| `bookingRow.totalPrice` (`[data-testid="my-bookings-row-total"]`) | `toContainText` | `"$278"` |
| `bookingRow.status` (`[data-testid="my-bookings-row-status"]`) | `toContainText` | `"confirmed"` |

**Stability Notes**: locale-dependent date formatting — read once via `formatDate()` helper in test, do not hard-code `"2026-05-04"`.

**Cleanup Contract**:
- **Mutation**: 1 booking precondition.
- **Teardown**: `afterEach` deletes by id.

---

#### TC-MB-06: Status chip color reflects booking status (confirmed=info, pending=warning, cancelled=error) @Ta42b9c06

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/my-bookings.spec.ts` |
| **Priority** | P2 |

**Preconditions**: 3 bookings created with statuses `pending`, `confirmed`, `cancelled` (force-set via Prisma helper since the public POST endpoint creates `confirmed` only — use `dbHelpers.createBookingWithStatus()`).

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Bookings | 3 created via Prisma helper | `dbHelpers.ts` |

**User Journey Steps**:
1. Create 3 bookings (`beforeEach`)
2. `await guest.myBookingsPage.goto()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `bookingRow(idPending).status` | `toHaveAttribute("data-status", "pending")` | — |
| `bookingRow(idConfirmed).status` | `toHaveAttribute("data-status", "confirmed")` | — |
| `bookingRow(idCancelled).status` | `toHaveAttribute("data-status", "cancelled")` | — |

**Stability Notes**: requires `data-status` attribute (TO ADD on chip per §6).

**Cleanup Contract**:
- **Mutation**: 3 bookings + Prisma direct insert.
- **Teardown**: cleanup by ids.

---

#### TC-MB-07: Special requests note visible below card divider when present @Ta42b9c07

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/my-bookings.spec.ts` |
| **Priority** | P2 |

**Preconditions**: A booking with `specialRequests = "Test note 12345"` exists.

**User Journey Steps**:
1. Create booking with note (`beforeEach`)
2. `await guest.myBookingsPage.goto()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `bookingRow.note` (`[data-testid="my-bookings-row-note"]`) | `toBeVisible` | — |
| `bookingRow.note` | `toContainText` | `"Test note 12345"` |

**Stability Notes**: synchronous.

**Cleanup Contract**: cleanup by id.

---

#### TC-MB-08: Special requests note hidden when booking has no special requests @Ta42b9c08

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/my-bookings.spec.ts` |
| **Priority** | P2 |

**Preconditions**: A booking with `specialRequests = null` exists.

**User Journey Steps**:
1. Create booking with no note
2. `await guest.myBookingsPage.goto()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `bookingRow.note` | `toHaveCount` | `0` |

**Stability Notes**: synchronous.

**Cleanup Contract**: cleanup by id.

---

#### TC-MB-09: Bookings ordered descending by createdAt (newest first) @Ta42b9c09

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/my-bookings.spec.ts` |
| **Priority** | P1 |

**Preconditions**: 3 bookings created in known order with 2-second `created_at` gaps. (Force `createdAt` via Prisma helper.)

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Booking A (oldest) | `createdAt = now - 2 hours` | helper |
| Booking B | `createdAt = now - 1 hour` | helper |
| Booking C (newest) | `createdAt = now` | helper |

**User Journey Steps**:
1. Create 3 bookings with explicit `createdAt`
2. `await guest.myBookingsPage.goto()`

**Expected Assertions** (in test body, not page object):
- Read all `bookingRows` ids in DOM order
- Assert `[ids[0], ids[1], ids[2]] === [bookingC.id, bookingB.id, bookingA.id]`

| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `myBookings.bookingRowIds()` (helper returning ids array) | `toEqual` | `[bookingC.id, bookingB.id, bookingA.id]` |

**Stability Notes**: read DOM order, do NOT rely on `:first-child`.

**Cleanup Contract**: cleanup all 3 by id.

---

#### TC-MB-10: Loading spinner visible during fetch @Ta42b9c10

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/my-bookings.spec.ts` |
| **Priority** | P2 |

**Preconditions**: throttle `/api/bookings` route.

**User Journey Steps**:
1. Throttle `/api/bookings$` with 1s delay
2. `await guest.myBookingsPage.goto()`
3. Assert spinner visible during throttle
4. Wait for response

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `myBookings.loadingSpinner` (`[data-testid="my-bookings-loading-spinner"]`) (during) | `toBeVisible` | — |
| `myBookings.loadingSpinner` (after) | `toHaveCount` | `0` |

**Stability Notes**: `page.route` throttle.

**Cleanup Contract**: `unroute`.

---

#### TC-MB-11: Error alert shown on API failure @Ta42b9c11

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/my-bookings.spec.ts` |
| **Priority** | P2 |

**Preconditions**: mock `/api/bookings` to return 500.

**User Journey Steps**:
1. Mock route to return 500 with `{ status: "error", message: "DB unavailable" }`
2. `await guest.myBookingsPage.goto()`
3. Wait for `errorAlert` visible

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `myBookings.errorAlert` (`[data-testid="my-bookings-error-alert"]`) | `toContainText` | `"DB unavailable"` |
| `myBookings.bookingRows` | `toHaveCount` | `0` |

**Stability Notes**: route mock.

**Cleanup Contract**: `unroute`.

---

#### TC-MB-12: Guest sees ONLY own bookings (admin's bookings invisible) @Ta42b9c12

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@smoke @security` |
| **Spec File** | `tests-UI/my-bookings.spec.ts` |
| **Priority** | P0 |

**Preconditions**: 1 booking by admin AND 1 booking by guest, both on different rooms.

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Admin booking | created via API as admin | helper |
| Guest booking | created via API as guest | helper |

**User Journey Steps**:
1. `const adminBooking = await bookingApi.createConfirmedAs(SEEDED_ADMIN, { roomId: room401.id, ... })`
2. `const guestBooking = await bookingApi.createConfirmedAs(SEEDED_GUEST, { roomId: room201.id, ... })`
3. `await guest.myBookingsPage.goto()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `myBookings.bookingRow(guestBooking.id)` | `toBeVisible` | — |
| `myBookings.bookingRow(adminBooking.id)` | `toHaveCount` | `0` |
| `myBookings.bookingRows` | `toHaveCount` | `1` |

**Stability Notes**: BE filters by `guestId`; the test verifies the FE renders that filtered list correctly.

**Cleanup Contract**: cleanup both bookings by id.

---

#### TC-MB-13: Admin sees ALL bookings across all guests @Ta42b9c13

| Field | Value |
|-------|-------|
| **Fixture** | `admin` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/my-bookings.spec.ts` |
| **Priority** | P0 |

**Preconditions**: same 2 bookings as TC-MB-12.

**User Journey Steps**:
1. (precondition: 2 bookings created)
2. `await admin.myBookingsPage.goto()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `myBookings.bookingRow(adminBooking.id)` | `toBeVisible` | — |
| `myBookings.bookingRow(guestBooking.id)` | `toBeVisible` | — |
| `myBookings.bookingRows` count | `toBeGreaterThanOrEqual` | `2` |

**Stability Notes**: as TC-MB-12.

**Cleanup Contract**: cleanup both bookings by id.

---

### 4.10 My Profile (read-only)

#### TC-MP-01: Avatar shows correct initials (firstLetter of firstName + firstLetter of lastName, uppercase) @Tb83fa901

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/my-profile.spec.ts` |
| **Priority** | P0 |

**Preconditions**: Guest authenticated (firstName="Guest", lastName="User" per seed).

**User Journey Steps**:
1. `await guest.myProfilePage.goto()`
2. Wait for `avatar` visible

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `myProfile.avatar` (`[data-testid="my-profile-avatar"]`) | `toHaveText` | `"GU"` |

**Stability Notes**: avatar depends on `useAuth.user` — wait for it.

**Cleanup Contract**: read-only.

---

#### TC-MP-02: Profile shows full name @Tb83fa902

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/my-profile.spec.ts` |
| **Priority** | P0 |

**Preconditions**: Guest authenticated.

**User Journey Steps**:
1. `await guest.myProfilePage.goto()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `myProfile.fullName` (`[data-testid="my-profile-name"]`) | `toContainText` | `"Guest User"` |

**Stability Notes**: synchronous after hydration.

**Cleanup Contract**: read-only.

---

#### TC-MP-03: Role chip visible with uppercase role @Tb83fa903

| Field | Value |
|-------|-------|
| **Fixture** | `admin` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/my-profile.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Admin authenticated.

**User Journey Steps**:
1. `await admin.myProfilePage.goto()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `myProfile.roleChip` (`[data-testid="my-profile-role-chip"]`) | `toHaveText` | `"ADMIN"` |

**Stability Notes**: as TC-MP-01.

**Cleanup Contract**: read-only.

---

#### TC-MP-04: Email row visible with correct email @Tb83fa904

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/my-profile.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Guest authenticated.

**User Journey Steps**:
1. `await guest.myProfilePage.goto()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `myProfile.emailRow` (`[data-testid="my-profile-email"]`) | `toContainText` | `"guest@hotel.com"` |

**Stability Notes**: synchronous.

**Cleanup Contract**: read-only.

---

#### TC-MP-05: Phone row visible with correct phone @Tb83fa905

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/my-profile.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Guest authenticated (phone="0987654321" per seed).

**User Journey Steps**:
1. `await guest.myProfilePage.goto()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `myProfile.phoneRow` (`[data-testid="my-profile-phone"]`) | `toContainText` | `"0987654321"` |

**Stability Notes**: synchronous.

**Cleanup Contract**: read-only.

---

#### TC-MP-06: Address row hidden when no address fields are populated @Tb83fa906

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/my-profile.spec.ts` |
| **Priority** | P2 |

**Preconditions**: seeded guest has no address fields populated.

**User Journey Steps**:
1. `await guest.myProfilePage.goto()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `myProfile.addressRow` (`[data-testid="my-profile-address"]`) | `toHaveCount` | `0` |

**Stability Notes**: synchronous.

**Cleanup Contract**: read-only.

---

#### TC-MP-07: "Member since" date visible when user.createdAt present @Tb83fa907

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/my-profile.spec.ts` |
| **Priority** | P2 |

**Preconditions**: seeded guest has `createdAt` populated (Prisma default).

**User Journey Steps**:
1. `await guest.myProfilePage.goto()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `myProfile.memberSince` (`[data-testid="my-profile-member-since"]`) | `toContainText` | `"Member since"` |
| `myProfile.memberSince` | `toContainText` | locale-formatted date (assert via helper, not hard-coded) |

**Stability Notes**: as TC-MB-05 — read locale via helper.

**Cleanup Contract**: read-only.

---

### 4.11 Admin Dashboard (placeholder UI)

> **Scope reminder**: Admin pages for actual room/booking/guest CRUD do NOT exist yet (per `documentation/implementation_plan.md`). This section tests ONLY the placeholder admin landing page + role gate.

#### TC-AD-01: Admin Dashboard banner shows "Admin Dashboard" + ADMIN chip @Tc94db201

| Field | Value |
|-------|-------|
| **Fixture** | `admin` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/admin-dashboard.spec.ts` |
| **Priority** | P0 |

**Preconditions**: Admin authenticated.

**User Journey Steps**:
1. `await admin.adminDashboardPage.goto()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `adminDashboard.banner` (`[data-testid="admin-banner"]`) | `toBeVisible` | — |
| `adminDashboard.bannerTitle` (`[data-testid="admin-banner-title"]`) | `toContainText` | `"Admin Dashboard"` |
| `adminDashboard.adminChip` (`[data-testid="admin-chip"]`) | `toHaveText` | `"ADMIN"` |

**Stability Notes**: page header static.

**Cleanup Contract**: read-only.

---

#### TC-AD-02: Welcome message shows admin firstName @Tc94db202

| Field | Value |
|-------|-------|
| **Fixture** | `admin` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/admin-dashboard.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Admin authenticated (firstName="Admin").

**User Journey Steps**:
1. `await admin.adminDashboardPage.goto()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `adminDashboard.welcomeMessage` (`[data-testid="admin-welcome-msg"]`) | `toContainText` | `"Welcome back, Admin"` |

**Stability Notes**: depends on `useAuth.user`.

**Cleanup Contract**: read-only.

---

#### TC-AD-03: Three management cards visible @Tc94db203

| Field | Value |
|-------|-------|
| **Fixture** | `admin` |
| **Tags** | `@smoke` |
| **Spec File** | `tests-UI/admin-dashboard.spec.ts` |
| **Priority** | P0 |

**Preconditions**: Admin authenticated.

**User Journey Steps**:
1. `await admin.adminDashboardPage.goto()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `adminDashboard.roomMgmtCard` (`[data-testid="admin-card-room-mgmt"]`) | `toBeVisible` | — |
| `adminDashboard.roomMgmtCardTitle` | `toHaveText` | `"Room Management"` |
| `adminDashboard.bookingMgmtCard` (`[data-testid="admin-card-booking-mgmt"]`) | `toBeVisible` | — |
| `adminDashboard.bookingMgmtCardTitle` | `toHaveText` | `"Booking Management"` |
| `adminDashboard.guestMgmtCard` (`[data-testid="admin-card-guest-mgmt"]`) | `toBeVisible` | — |
| `adminDashboard.guestMgmtCardTitle` | `toHaveText` | `"Guest Management"` |

**Stability Notes**: synchronous.

**Cleanup Contract**: read-only.

---

#### TC-AD-04: Four placeholder stat cards show "—" @Tc94db204

| Field | Value |
|-------|-------|
| **Fixture** | `admin` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/admin-dashboard.spec.ts` |
| **Priority** | P2 |

**Preconditions**: Admin authenticated.

**User Journey Steps**:
1. `await admin.adminDashboardPage.goto()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `adminDashboard.statTotalRooms` (`[data-testid="admin-stat-total-rooms"]`) | `toHaveText` | `"—"` |
| `adminDashboard.statActiveBookings` (`[data-testid="admin-stat-active-bookings"]`) | `toHaveText` | `"—"` |
| `adminDashboard.statGuestsToday` (`[data-testid="admin-stat-guests-today"]`) | `toHaveText` | `"—"` |
| `adminDashboard.statRevenue` (`[data-testid="admin-stat-revenue"]`) | `toHaveText` | `"—"` |

**Stability Notes**: synchronous; cards are hard-coded placeholders.

**Cleanup Contract**: read-only.

---

#### TC-AD-05: Click "Room Management" card navigates to /dashboard/rooms (current placeholder behaviour) @Tc94db205

| Field | Value |
|-------|-------|
| **Fixture** | `admin` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/admin-dashboard.spec.ts` |
| **Priority** | P2 |

**Preconditions**: Admin authenticated.

**User Journey Steps**:
1. `await admin.adminDashboardPage.goto()`
2. `await admin.adminDashboardPage.clickRoomManagement()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/dashboard\/rooms$/` (current code wires to guest browse — see §9.3 BUG-003) |

**Stability Notes**: documents current FE behaviour; test name & expected URL must update if a dedicated `/admin/rooms` page is added (per RULE 8).

**Cleanup Contract**: read-only.

---

#### TC-AD-06: Click "Booking Management" card navigates to /dashboard/bookings @Tc94db206

| Field | Value |
|-------|-------|
| **Fixture** | `admin` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/admin-dashboard.spec.ts` |
| **Priority** | P2 |

**Preconditions**: Admin authenticated.

**User Journey Steps**:
1. `await admin.adminDashboardPage.goto()`
2. `await admin.adminDashboardPage.clickBookingManagement()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/dashboard\/bookings$/` |

**Stability Notes**: as TC-AD-05.

**Cleanup Contract**: read-only.

---

#### TC-AD-07: Click "Guest Management" card attempts navigation to /admin/guests (route does NOT exist; falls through with no match) @Tc94db207

| Field | Value |
|-------|-------|
| **Fixture** | `admin` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/admin-dashboard.spec.ts` |
| **Priority** | P2 |

**Preconditions**: Admin authenticated. Route `/admin/guests` does NOT exist in `App.tsx` Routes.

**User Journey Steps**:
1. `await admin.adminDashboardPage.goto()`
2. `await admin.adminDashboardPage.clickGuestManagement()`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/admin\/guests$/` (URL changes — react-router-dom does navigate even though no Route matches) |
| `adminDashboard.banner` | `toHaveCount` | `0` (no `<Routes>` child rendered) |
| `landingPage.heroSection` | `toHaveCount` | `0` |
| Body content under `<Layout />` `<Outlet />` | empty/blank | (no fallback route exists) |

**Stability Notes**: documents current "broken" behaviour. If a `/admin/guests` page is added later or a `*` fallback route is introduced, this test must be updated (RULE 8). See §9.3 BUG-003.

**Cleanup Contract**: read-only.

---

#### TC-AD-08: Non-admin guest accessing /admin is redirected to /dashboard @Tc94db208

> **Note**: same coverage as TC-PR-07 (role gate). Per RULE 4 we do NOT duplicate. This slot is reserved for the **direct page-load** variant: open `/admin` URL after admin LOG OUT to verify fresh-page redirect (vs. role-gate redirect).

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@security` |
| **Spec File** | `tests-UI/admin-dashboard.spec.ts` |
| **Priority** | P0 |

**Preconditions**: Guest authenticated.

**User Journey Steps**:
1. `await guest.page.goto("/admin")` (direct URL load, not via navbar click)
2. `await guest.page.waitForURL(/\/dashboard$/)`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/dashboard$/` |
| `adminDashboard.banner` | `toHaveCount` | `0` |
| `guestDashboard.welcomeBanner` | `toBeVisible` | — |

**Stability Notes**: `waitForURL`.

**Cleanup Contract**: read-only.

---

### 4.12 Token Lifecycle & API Interceptor

#### TC-TI-01: 401 response on protected page auto-clears token and redirects to /login @Td72f3401

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@security @negative` |
| **Spec File** | `tests-UI/token-lifecycle.spec.ts` |
| **Priority** | P0 |

**Preconditions**: An invalid (malformed) JWT is set in `localStorage` BEFORE first navigation via `addInitScript`.

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Bad token | `"this.is.not.a.real.jwt"` | inline |

**User Journey Steps**:
1. `await context.addInitScript(t => localStorage.setItem("token", t), "this.is.not.a.real.jwt")`
2. `await Promise.all([waitForResponse(/\/api\/auth\/me/, 401), anonymous.page.goto("/dashboard/bookings")])`
3. `await anonymous.page.waitForURL(/\/login$/)`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/login$/` |
| `localStorage["token"]` | `toBeNull` | — (interceptor cleared it) |
| `loginPage.formHeader` | `toBeVisible` | — |

**Stability Notes**: `Promise.all([waitForResponse, goto])` — the 401 from `/api/auth/me` triggers the interceptor; without `Promise.all`, the redirect race could outpace the response handler.

**Cleanup Contract**: read-only.

---

#### TC-TI-02: 401 response while on /login does NOT redirect @Td72f3402

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/token-lifecycle.spec.ts` |
| **Priority** | P1 |

**Preconditions**: User is on `/login` and submits invalid creds.

**User Journey Steps**:
1. `await anonymous.loginPage.goto()`
2. Submit form with wrong password (TC-AL-09 steps)

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/login$/` (no redirect cascade — the interceptor's `path !== '/login'` check works) |

**Stability Notes**: this is implicitly covered by TC-AL-09 already; here we explicitly verify the interceptor's location-aware skip.

**Cleanup Contract**: read-only.

---

#### TC-TI-03: 401 response while on /register does NOT redirect @Td72f3403

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@negative` |
| **Spec File** | `tests-UI/token-lifecycle.spec.ts` |
| **Priority** | P2 |

**Preconditions**: User on `/register`. Mock `/api/auth/register` to return 401.

**User Journey Steps**:
1. `await anonymous.registerPage.goto()`
2. Mock route `/api/auth/register` returning 401
3. Fill valid form
4. `await Promise.all([waitForResponse(/\/api\/auth\/register/, 401), submitForm()])`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/register$/` (no cascade) |

**Stability Notes**: route mock is required to artificially return 401 from register.

**Cleanup Contract**: `unroute`.

---

#### TC-TI-04: Valid token persists across page reload @Td72f3404

> Same coverage as TC-AL-18 — kept as cross-reference; not a duplicate. (TC-AL-18 lives in `auth-login.spec.ts`; here we explicitly test the interceptor side, separate from the login flow.)

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/token-lifecycle.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Guest authenticated via fixture.

**User Journey Steps**:
1. `await guest.guestDashboardPage.goto()`
2. `const tokenBefore = await guest.page.evaluate(() => localStorage.getItem("token"))`
3. `await Promise.all([waitForResponse(/\/api\/auth\/me/, 200), guest.page.reload()])`
4. `const tokenAfter = await guest.page.evaluate(() => localStorage.getItem("token"))`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `tokenAfter` | `toBe` | `tokenBefore` (same token) |
| URL | `toMatch` | `/\/dashboard$/` |
| `navbar.avatar` | `toBeVisible` | — |

**Stability Notes**: assert token equality before/after reload using `page.evaluate`.

**Cleanup Contract**: read-only.

---

#### TC-TI-05: Token expiry mid-session causes redirect on next API call @Td72f3405

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@security` |
| **Spec File** | `tests-UI/token-lifecycle.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Guest authenticated. Then we manually replace token with an EXPIRED-format JWT.

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| Expired token | signed with same secret but `exp` in the past | `helpers/authApi.ts → signExpiredToken()` |

**User Journey Steps**:
1. `await guest.guestDashboardPage.goto()`
2. Wait for hydration (avatar visible)
3. Replace localStorage token with expired token via `page.evaluate`
4. Navigate to `/dashboard/bookings` (triggers `/api/bookings` call)
5. `await Promise.all([waitForResponse(/\/api\/bookings/, 401), guest.navbar.clickDashboard()])`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL (after) | `toMatch` | `/\/login$/` |
| `localStorage["token"]` (after) | `toBeNull` | — |

**Stability Notes**: `signExpiredToken` requires reading `JWT_SECRET` from a test-specific env (only safe in dev/test environments — see §9).

**Cleanup Contract**: read-only.

---

#### TC-TI-06: Authorization header is attached to authenticated API requests @Td72f3406

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@security` |
| **Spec File** | `tests-UI/token-lifecycle.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Guest authenticated.

**User Journey Steps**:
1. `const requestPromise = guest.page.waitForRequest(req => req.url().includes("/api/bookings") && req.method() === "GET")`
2. `await guest.myBookingsPage.goto()`
3. `const req = await requestPromise`
4. `const authHeader = req.headers()["authorization"]`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `authHeader` | `toMatch` | `/^Bearer eyJ/` |

**Stability Notes**: `waitForRequest` race-free — capture the request promise before `goto`.

**Cleanup Contract**: read-only.

---

#### TC-TI-07: Public endpoints (e.g., /api/rooms) work for anonymous user (no token, no 401) @Td72f3407

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | (none) |
| **Spec File** | `tests-UI/token-lifecycle.spec.ts` |
| **Priority** | P2 |

**Preconditions**: No token in storage. The `/api/rooms` GET is public per BE.

**User Journey Steps**:
1. `await anonymous.page.goto("/")` (landing — no auth needed)
2. Trigger `/api/rooms` call programmatically via `fetch` from the browser to verify it returns 200 without auth header.
3. Verify response status

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| Response status | `toBe` | `200` |
| `localStorage["token"]` | `toBeNull` | — |

**Stability Notes**: `evaluate` to call `fetch("/api/rooms")` directly.

**Cleanup Contract**: read-only.

---

#### TC-TI-08: Protected booking endpoint returns 401 for anonymous user @Td72f3408

| Field | Value |
|-------|-------|
| **Fixture** | `anonymous` |
| **Tags** | `@negative @security` |
| **Spec File** | `tests-UI/token-lifecycle.spec.ts` |
| **Priority** | P0 |

**Preconditions**: No token.

**User Journey Steps**:
1. `await anonymous.page.goto("/")` 
2. `evaluate` `fetch("/api/bookings")` from browser
3. Verify 401

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| Response status | `toBe` | `401` |

**Stability Notes**: as TC-TI-07.

**Cleanup Contract**: read-only.

---

#### TC-TI-09: Logout clears token and subsequent API call returns 401 @Td72f3409

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@security` |
| **Spec File** | `tests-UI/token-lifecycle.spec.ts` |
| **Priority** | P1 |

**Preconditions**: Guest authenticated.

**User Journey Steps**:
1. `await guest.guestDashboardPage.goto()`
2. Logout via avatar menu
3. After redirect to `/`, `evaluate` `fetch("/api/bookings")` from browser
4. Assert 401

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| Response status | `toBe` | `401` |
| `localStorage["token"]` | `toBeNull` | — |

**Stability Notes**: `Promise.all` for logout → URL `/`; then evaluate fetch.

**Cleanup Contract**: read-only.

---

#### TC-TI-10: Reload after token expiry naturally re-routes to /login @Td72f3410

| Field | Value |
|-------|-------|
| **Fixture** | `guest` |
| **Tags** | `@security` |
| **Spec File** | `tests-UI/token-lifecycle.spec.ts` |
| **Priority** | P1 |

**Preconditions**: token replaced with expired one (as TC-TI-05).

**User Journey Steps**:
1. Replace token with expired one
2. `await Promise.all([waitForResponse(/\/api\/auth\/me/, 401), guest.page.reload()])`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| URL | `toMatch` | `/\/login$/` |
| `localStorage["token"]` | `toBeNull` | — |

**Stability Notes**: reload triggers `useEffect` in AuthContext → `/api/auth/me` → 401 → token cleared → ProtectedRoute redirects to `/login`.

**Cleanup Contract**: read-only.

---

## 5. Shared Preconditions & beforeAll Setup

### 5.1 Global setup (`global-setup.ts`)

```typescript
// pseudo-code shape
import { execSync } from "child_process";

export default async () => {
  // 1. Ensure DATABASE_URL points to test DB (set in playwright.config.ts via env)
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL!;

  // 2. Reset schema and re-apply migrations
  execSync("npx prisma migrate reset --force --skip-seed", { cwd: "./backend" });

  // 3. Run seed (creates admin@hotel.com, guest@hotel.com, 9 rooms)
  execSync("npx prisma db seed", { cwd: "./backend" });

  // 4. Optional: pre-warm token cache for fixtures
};
```

### 5.2 Per-spec / per-test cleanup

| File | beforeEach | afterEach | beforeAll | afterAll |
|------|------------|-----------|-----------|----------|
| `landing.spec.ts` | none | none | none | none |
| `auth-login.spec.ts` | none | delete users created in tests via API | none | none |
| `auth-register.spec.ts` | none | delete unique users by email | none | none |
| `navbar.spec.ts` | none | none | none | none |
| `protected-routes.spec.ts` | none | none | none | none |
| `guest-dashboard.spec.ts` | none | none | none | none |
| `browse-rooms.spec.ts` | none | none | none | none |
| `room-details-booking.spec.ts` | none | `cleanupBookingsByMarker(marker)` for tests that POSTed | (load room IDs) | none |
| `my-bookings.spec.ts` | seed/truncate bookings per test | cleanup created bookings | none | none |
| `my-profile.spec.ts` | none | none | none | none |
| `admin-dashboard.spec.ts` | none | none | none | none |
| `token-lifecycle.spec.ts` | none | `unroute` for tests that mocked | none | none |

### 5.3 Resolved room IDs

Room IDs are auto-incremented and may differ between fresh DBs. The shared `beforeAll` in any spec that hits `/dashboard/rooms/:id` must:

```typescript
// pseudo-code
let rooms: Record<string, { id: number; pricePerNight: number; capacity: number; status: string }> = {};

test.beforeAll(async () => {
  const all = await roomApi.list();              // GET /api/rooms (no auth)
  for (const r of all) {
    rooms[r.roomNumber] = { id: r.id, pricePerNight: r.pricePerNight, capacity: r.capacity, status: r.status };
  }
});
```

### 5.4 Fixture types (`fixtures/types.ts`)

```typescript
export type AnonymousActor = {
  page: Page;
  navbar: Navbar;
  landingPage: LandingPage;
  loginPage: LoginPage;
  registerPage: RegisterPage;
};

export type AuthorizedActor = AnonymousActor & {
  token: string;
  user: { id: number; email: string; role: 'guest' | 'admin' };
  guestDashboardPage: GuestDashboardPage;
  browseRoomsPage: BrowseRoomsPage;
  roomDetailsPage: RoomDetailsPage;
  myBookingsPage: MyBookingsPage;
  myProfilePage: MyProfilePage;
  adminDashboardPage: AdminDashboardPage;  // present even for guest; route-gate handled by FE
};
```

---

## 6. Resolved Locators Catalog

> **Mandatory**: per `ai-planning-standards.md` §14.4 / `ai-coding-standards.md` §4.1 Rule 4. Status `exists` means the `data-testid` is already in the JSX. Status `TO ADD` means the implementation team must add it before the test is run; the JSX file path is given.

> **Verification date**: locators marked `exists` were confirmed by reading the JSX source on **2026-04-29**. Re-verify before MCP execution if more than 30 days have elapsed.

### 6.1 Landing Page

| Locator (PO accessor) | Selector (resolved) | Status | File |
|-----------------------|---------------------|--------|------|
| `landingPage.heroSection` | `[data-testid="landing-hero"]` | TO ADD | `frontend/src/pages/Landing/LandingPage.tsx` (Hero outer `<Box>`) |
| `landingPage.heroTitle` | `[data-testid="landing-hero-title"]` | TO ADD | same |
| `landingPage.heroSubtitle` | `[data-testid="landing-hero-subtitle"]` | TO ADD | same |
| `landingPage.bookYourStayButton` | `[data-testid="landing-book-cta"]` | TO ADD | same — `<Button>` to `/register` |
| `landingPage.signInButton` | `[data-testid="landing-signin-cta"]` | TO ADD | same — `<Button>` to `/login` |
| `landingPage.featuresSection` | `[data-testid="landing-features-section"]` | TO ADD | same — `<Container>` of feature cards |
| `landingPage.featureCardPremiumRooms` | `[data-testid="feature-card-premium-rooms"]` | TO ADD | same |
| `landingPage.featureCardModernAmenities` | `[data-testid="feature-card-modern-amenities"]` | TO ADD | same |
| `landingPage.featureCardWorldClassFacilities` | `[data-testid="feature-card-world-class-facilities"]` | TO ADD | same |
| `landingPage.footer` | `[data-testid="landing-footer"]` | TO ADD | same |
| `landingPage.footerText` | `[data-testid="landing-footer-text"]` | TO ADD | same |

### 6.2 Login Page

| Locator | Selector | Status | File |
|---------|----------|--------|------|
| `loginPage.formHeader` | `[data-testid="login-header"]` | TO ADD | `frontend/src/pages/Auth/LoginPage.tsx` (Typography "Welcome Back") |
| `loginPage.emailInput` | `[data-testid="login-email-input"]` | TO ADD | same — `TextField` for email |
| `loginPage.emailFieldError` | `[data-testid="login-email-error"]` | TO ADD | derive from MUI helperText (`<TextField helperText id="...">`); easiest: wrap helperText in `<span data-testid>` or use `aria-describedby` |
| `loginPage.passwordInput` | `[data-testid="login-password-input"]` | TO ADD | same — `TextField` for password |
| `loginPage.passwordFieldError` | `[data-testid="login-password-error"]` | TO ADD | as above |
| `loginPage.showPasswordToggle` | `[data-testid="login-toggle-password"]` | TO ADD | same — `IconButton` for visibility |
| `loginPage.submitButton` | `[data-testid="login-submit-btn"]` | TO ADD | same — submit `<Button>` |
| `loginPage.errorAlert` | `[data-testid="login-error-alert"]` | TO ADD | same — top-of-form `<Alert>` |
| `loginPage.registerLink` | `[data-testid="login-register-link"]` | TO ADD | same — bottom RouterLink |

### 6.3 Register Page

| Locator | Selector | Status | File |
|---------|----------|--------|------|
| `registerPage.formHeader` | `[data-testid="register-header"]` | TO ADD | `frontend/src/pages/Auth/RegisterPage.tsx` |
| `registerPage.firstNameInput` | `[data-testid="register-firstName-input"]` | TO ADD | same |
| `registerPage.firstNameError` | `[data-testid="register-firstName-error"]` | TO ADD | same |
| `registerPage.lastNameInput` | `[data-testid="register-lastName-input"]` | TO ADD | same |
| `registerPage.lastNameError` | `[data-testid="register-lastName-error"]` | TO ADD | same |
| `registerPage.emailInput` | `[data-testid="register-email-input"]` | TO ADD | same |
| `registerPage.emailError` | `[data-testid="register-email-error"]` | TO ADD | same |
| `registerPage.phoneInput` | `[data-testid="register-phone-input"]` | TO ADD | same |
| `registerPage.phoneError` | `[data-testid="register-phone-error"]` | TO ADD | same |
| `registerPage.passwordInput` | `[data-testid="register-password-input"]` | TO ADD | same |
| `registerPage.passwordError` | `[data-testid="register-password-error"]` | TO ADD | same |
| `registerPage.confirmPasswordInput` | `[data-testid="register-confirmPassword-input"]` | TO ADD | same |
| `registerPage.confirmPasswordError` | `[data-testid="register-confirmPassword-error"]` | TO ADD | same |
| `registerPage.showPasswordToggle` | `[data-testid="register-toggle-password"]` | TO ADD | same |
| `registerPage.submitButton` | `[data-testid="register-submit-btn"]` | TO ADD | same |
| `registerPage.errorAlert` | `[data-testid="register-error-alert"]` | TO ADD | same |
| `registerPage.signInLink` | `[data-testid="register-signin-link"]` | TO ADD | same |

### 6.4 Navbar

| Locator | Selector | Status | File |
|---------|----------|--------|------|
| `navbar.brandLogo` | `[data-testid="navbar-brand"]` | TO ADD | `frontend/src/components/common/Navbar.tsx` |
| `navbar.hamburger` | `[data-testid="navbar-hamburger"]` | TO ADD | same — mobile `IconButton` |
| `navbar.homeButton` | `[data-testid="navbar-home-btn"]` | TO ADD | same — desktop `Button` to / |
| `navbar.loginButton` | `[data-testid="navbar-login-btn"]` | TO ADD | same |
| `navbar.registerButton` | `[data-testid="navbar-register-btn"]` | TO ADD | same |
| `navbar.dashboardButton` | `[data-testid="navbar-dashboard-btn"]` | TO ADD | same |
| `navbar.adminButton` | `[data-testid="navbar-admin-btn"]` | TO ADD | same |
| `navbar.avatar` | `[data-testid="navbar-avatar"]` | TO ADD | same — `Avatar` inside `IconButton` |
| `navbar.avatarMenuPanel` | `[data-testid="navbar-avatar-menu"]` | TO ADD | same — MUI `Menu` |
| `navbar.avatarMenuName` | `[data-testid="navbar-avatar-menu-name"]` | TO ADD | same |
| `navbar.avatarMenuEmail` | `[data-testid="navbar-avatar-menu-email"]` | TO ADD | same |
| `navbar.avatarMenuMyProfile` | `[data-testid="navbar-avatar-menu-profile"]` | TO ADD | same |
| `navbar.avatarMenuLogout` | `[data-testid="navbar-avatar-menu-logout"]` | TO ADD | same |
| `navbar.mobileDrawer` | `[data-testid="navbar-mobile-drawer"]` | TO ADD | same — `Drawer` |
| `navbar.mobileDrawerHomeItem` | `[data-testid="navbar-mobile-home"]` | TO ADD | same |
| `navbar.mobileDrawerLoginItem` | `[data-testid="navbar-mobile-login"]` | TO ADD | same |
| `navbar.mobileDrawerRegisterItem` | `[data-testid="navbar-mobile-register"]` | TO ADD | same |
| `navbar.mobileDrawerDashboardItem` | `[data-testid="navbar-mobile-dashboard"]` | TO ADD | same |
| `navbar.mobileDrawerAdminItem` | `[data-testid="navbar-mobile-admin"]` | TO ADD | same |
| `navbar.mobileDrawerLogoutItem` | `[data-testid="navbar-mobile-logout"]` | TO ADD | same |

### 6.5 ProtectedRoute / LoadingSpinner

| Locator | Selector | Status | File |
|---------|----------|--------|------|
| `protectedRouteSpinner` | `[data-testid="protected-loading-spinner"]` | TO ADD | `frontend/src/components/common/LoadingSpinner.tsx` |

### 6.6 Guest Dashboard

| Locator | Selector | Status | File |
|---------|----------|--------|------|
| `guestDashboard.welcomeBanner` | `[data-testid="guest-welcome-banner"]` | TO ADD | `frontend/src/pages/GuestCabinet/GuestDashboard.tsx` |
| `guestDashboard.welcomeBannerSubtitle` | `[data-testid="guest-welcome-subtitle"]` | TO ADD | same |
| `guestDashboard.roleChip` | `[data-testid="guest-role-chip"]` | TO ADD | same |
| `guestDashboard.myBookingsCard` | `[data-testid="dashboard-card-my-bookings"]` | TO ADD | same |
| `guestDashboard.myBookingsCardTitle` | `[data-testid="dashboard-card-my-bookings-title"]` | TO ADD | same |
| `guestDashboard.browseRoomsCard` | `[data-testid="dashboard-card-browse-rooms"]` | TO ADD | same |
| `guestDashboard.browseRoomsCardTitle` | `[data-testid="dashboard-card-browse-rooms-title"]` | TO ADD | same |
| `guestDashboard.myProfileCard` | `[data-testid="dashboard-card-my-profile"]` | TO ADD | same |
| `guestDashboard.myProfileCardTitle` | `[data-testid="dashboard-card-my-profile-title"]` | TO ADD | same |

### 6.7 Browse Rooms

| Locator | Selector | Status | File |
|---------|----------|--------|------|
| `browseRooms.container` | `[data-testid="browse-rooms-container"]` | ✅ exists | `frontend/src/pages/GuestCabinet/BrowseRoomsPage.tsx` |
| `browseRooms.backToDashboardButton` | `[data-testid="back-to-dashboard-btn"]` | ✅ exists | same |
| `browseRooms.pageHeader` | `[data-testid="page-header"]` | ✅ exists | same |
| `browseRooms.pageTitle` | `[data-testid="page-title"]` | ✅ exists | same |
| `browseRooms.loadingContainer` | `[data-testid="loading-container"]` | ✅ exists | same |
| `browseRooms.loadingSpinner` | `[data-testid="loading-spinner"]` | ✅ exists | same |
| `browseRooms.errorAlert` | `[data-testid="error-alert"]` | ✅ exists | same |
| `browseRooms.emptyCard` | `[data-testid="no-rooms-card"]` | ✅ exists | same |
| `browseRooms.emptyText` | `[data-testid="no-rooms-text"]` | ✅ exists | same |
| `browseRooms.roomsGrid` | `[data-testid="rooms-grid"]` | ✅ exists | same |
| `browseRooms.roomGridItem(N)` | `[data-testid="room-grid-item-{roomNumber}"]` | ✅ exists | same |
| `browseRooms.roomCardByNumber(N)` | `[data-testid="room-card-{roomNumber}"]` | ✅ exists | same |
| `roomCard.roomNumber` (within card) | `[data-testid="room-number"]` | ✅ exists | same |
| `roomCard.roomStatus` | `[data-testid="room-status"]` | ✅ exists | same |
| `roomCard.roomStatus[data-status]` | `[data-status="..."]` | TO ADD | same — add `data-status={room.status}` to the chip |
| `roomCard.roomType` | `[data-testid="room-type"]` | ✅ exists | same |
| `roomCard.roomDescription` | `[data-testid="room-description"]` | ✅ exists | same |
| `roomCard.roomCapacity` | `[data-testid="room-capacity"]` | ✅ exists | same |
| `roomCard.roomPrice` | `[data-testid="room-price"]` | ✅ exists | same |
| `roomCard.bookNowButton` | `[data-testid="book-now-btn"]` | ✅ exists | same |
| `roomCard.dataRoomId` | `[data-room-id="{id}"]` (attribute, not testid) | TO ADD | same — add `data-room-id={room.id}` to the `<Card>` so tests can resolve id from card |

### 6.8 Room Details Page

| Locator | Selector | Status | File |
|---------|----------|--------|------|
| `roomDetails.pageHeader` | `[data-testid="room-details-header"]` | TO ADD | `frontend/src/pages/GuestCabinet/RoomDetailsPage.tsx` |
| `roomDetails.typeChip` | `[data-testid="room-details-type"]` | TO ADD | same |
| `roomDetails.statusChip` | `[data-testid="room-details-status"]` | TO ADD | same |
| `roomDetails.imagePlaceholder` | `[data-testid="room-details-image"]` | TO ADD | same |
| `roomDetails.description` | `[data-testid="room-details-description"]` | TO ADD | same |
| `roomDetails.amenitiesList` | `[data-testid="room-details-amenities"]` | TO ADD | same |
| `roomDetails.amenityItem` | `[data-testid="room-details-amenity"]` | TO ADD | same — on each `Stack` item |
| `roomDetails.backToRoomsButton` | `[data-testid="room-details-back-btn"]` | TO ADD | same |
| `roomDetails.bookingForm` | `[data-testid="booking-form"]` | TO ADD | same — outer `<form>` |
| `roomDetails.priceHeader` | `[data-testid="booking-price-header"]` | TO ADD | same |
| `roomDetails.checkInInput` | `[data-testid="booking-checkin-input"]` | TO ADD | same |
| `roomDetails.checkOutInput` | `[data-testid="booking-checkout-input"]` | TO ADD | same |
| `roomDetails.guestsInput` | `[data-testid="booking-guests-input"]` | TO ADD | same |
| `roomDetails.guestsHelper` | `[data-testid="booking-guests-helper"]` | TO ADD | same |
| `roomDetails.specialRequestsInput` | `[data-testid="booking-special-requests-input"]` | TO ADD | same |
| `roomDetails.totalPriceBlock` | `[data-testid="booking-total-price-block"]` | TO ADD | same |
| `roomDetails.totalPriceValue` | `[data-testid="booking-total-price"]` | TO ADD | same |
| `roomDetails.confirmBookingButton` | `[data-testid="booking-confirm-btn"]` | TO ADD | same |
| `roomDetails.confirmBookingButtonSpinner` | `[data-testid="booking-confirm-btn-spinner"]` | TO ADD | same |
| `roomDetails.successAlert` | `[data-testid="booking-success-alert"]` | TO ADD | same |
| `roomDetails.errorAlert` | `[data-testid="booking-error-alert"]` | TO ADD | same — also covers room-details-error-alert in error branch |
| `roomDetails.notAvailableMessage` | `[data-testid="booking-not-available-msg"]` | TO ADD | same |
| `roomDetails.loadingSpinner` | `[data-testid="room-details-loading-spinner"]` | TO ADD | same |

### 6.9 My Bookings

| Locator | Selector | Status | File |
|---------|----------|--------|------|
| `myBookings.pageHeader` | `[data-testid="my-bookings-header"]` | TO ADD | `frontend/src/pages/GuestCabinet/MyBookingsPage.tsx` |
| `myBookings.backToDashboardButton` | `[data-testid="my-bookings-back-btn"]` | TO ADD | same |
| `myBookings.loadingSpinner` | `[data-testid="my-bookings-loading-spinner"]` | TO ADD | same |
| `myBookings.errorAlert` | `[data-testid="my-bookings-error-alert"]` | TO ADD | same |
| `myBookings.emptyState` | `[data-testid="my-bookings-empty-state"]` | TO ADD | same |
| `myBookings.emptyStateText` | `[data-testid="my-bookings-empty-text"]` | TO ADD | same |
| `myBookings.emptyStateBrowseButton` | `[data-testid="my-bookings-empty-browse-btn"]` | TO ADD | same |
| `myBookings.bookingRow(id)` | `[data-testid="my-bookings-row-{id}"]` | TO ADD | same |
| `bookingRow.id` | `[data-testid="my-bookings-row-id"]` | TO ADD | same |
| `bookingRow.dates` | `[data-testid="my-bookings-row-dates"]` | TO ADD | same |
| `bookingRow.totalPrice` | `[data-testid="my-bookings-row-total"]` | TO ADD | same |
| `bookingRow.status` | `[data-testid="my-bookings-row-status"]` | TO ADD | same |
| `bookingRow.status[data-status]` | `[data-status="..."]` | TO ADD | same |
| `bookingRow.note` | `[data-testid="my-bookings-row-note"]` | TO ADD | same |

### 6.10 My Profile

| Locator | Selector | Status | File |
|---------|----------|--------|------|
| `myProfile.pageHeader` | `[data-testid="my-profile-header"]` | TO ADD | `frontend/src/pages/GuestCabinet/MyProfilePage.tsx` |
| `myProfile.avatar` | `[data-testid="my-profile-avatar"]` | TO ADD | same |
| `myProfile.fullName` | `[data-testid="my-profile-name"]` | TO ADD | same |
| `myProfile.roleChip` | `[data-testid="my-profile-role-chip"]` | TO ADD | same |
| `myProfile.emailRow` | `[data-testid="my-profile-email"]` | TO ADD | same |
| `myProfile.phoneRow` | `[data-testid="my-profile-phone"]` | TO ADD | same |
| `myProfile.addressRow` | `[data-testid="my-profile-address"]` | TO ADD | same |
| `myProfile.memberSince` | `[data-testid="my-profile-member-since"]` | TO ADD | same |
| `myProfile.backToDashboardButton` | `[data-testid="my-profile-back-btn"]` | TO ADD | same |

### 6.11 Admin Dashboard

| Locator | Selector | Status | File |
|---------|----------|--------|------|
| `adminDashboard.banner` | `[data-testid="admin-banner"]` | TO ADD | `frontend/src/pages/AdminCabinet/AdminDashboard.tsx` |
| `adminDashboard.bannerTitle` | `[data-testid="admin-banner-title"]` | TO ADD | same |
| `adminDashboard.adminChip` | `[data-testid="admin-chip"]` | TO ADD | same |
| `adminDashboard.welcomeMessage` | `[data-testid="admin-welcome-msg"]` | TO ADD | same |
| `adminDashboard.roomMgmtCard` | `[data-testid="admin-card-room-mgmt"]` | TO ADD | same |
| `adminDashboard.roomMgmtCardTitle` | `[data-testid="admin-card-room-mgmt-title"]` | TO ADD | same |
| `adminDashboard.bookingMgmtCard` | `[data-testid="admin-card-booking-mgmt"]` | TO ADD | same |
| `adminDashboard.bookingMgmtCardTitle` | `[data-testid="admin-card-booking-mgmt-title"]` | TO ADD | same |
| `adminDashboard.guestMgmtCard` | `[data-testid="admin-card-guest-mgmt"]` | TO ADD | same |
| `adminDashboard.guestMgmtCardTitle` | `[data-testid="admin-card-guest-mgmt-title"]` | TO ADD | same |
| `adminDashboard.statTotalRooms` | `[data-testid="admin-stat-total-rooms"]` | TO ADD | same |
| `adminDashboard.statActiveBookings` | `[data-testid="admin-stat-active-bookings"]` | TO ADD | same |
| `adminDashboard.statGuestsToday` | `[data-testid="admin-stat-guests-today"]` | TO ADD | same |
| `adminDashboard.statRevenue` | `[data-testid="admin-stat-revenue"]` | TO ADD | same |

### 6.12 PageObject Methods Required

| Method | File | Status | Notes |
|--------|------|--------|-------|
| `BasePage.waitForRoute(re)` | `BasePage.ts` | TO ADD | Wraps `page.waitForURL` with default timeout |
| `Navbar.openAvatarMenu()` | `components/Navbar.ts` | TO ADD | Click avatar + wait for menu visible |
| `Navbar.clickLogin()`, `clickRegister()`, `clickDashboard()`, `clickAdmin()`, `clickHamburger()`, `clickBrand()` | same | TO ADD | — |
| `LoginPage.fillEmail/fillPassword/submitForm/toggleShowPassword/clickRegisterLink` | `LoginPage.ts` | TO ADD | — |
| `RegisterPage.fillForm({...})` | `RegisterPage.ts` | TO ADD | Accepts full form data object (PATTERN 4) |
| `BrowseRoomsPage.waitForLoaded()` | `BrowseRoomsPage.ts` | TO ADD | Waits for spinner hidden + roomCards count > 0 |
| `BrowseRoomsPage.getRoomIdByNumber(N)` | same | TO ADD | Reads `data-room-id` attr from card |
| `BrowseRoomsPage.clickRoomCard(N)` | same | TO ADD | — |
| `RoomDetailsPage.goto(id)` | `RoomDetailsPage.ts` | TO ADD | navigates to `/dashboard/rooms/${id}` |
| `RoomDetailsPage.fillBookingForm({checkIn,checkOut,guests,requests})` | same | TO ADD | (PATTERN 4) |
| `RoomDetailsPage.clickConfirmBooking()` | same | TO ADD | — |
| `MyBookingsPage.bookingRow(id)` | `MyBookingsPage.ts` | TO ADD | Returns scoped `Locator` |
| `MyBookingsPage.bookingRowIds()` | same | TO ADD | Returns ordered ids array |
| `dbHelpers.truncateBookingsForGuest(id)` | `helpers/dbHelpers.ts` | TO ADD | uses Prisma client |
| `bookingApi.createConfirmedAs(user, data)` | `helpers/bookingApi.ts` | TO ADD | login + POST /api/bookings |
| `bookingApi.cleanupByMarker(specialRequestsMarker)` | same | TO ADD | uses admin token to filter bookings then DELETE |
| `bookingApi.cleanupByGuestAndRoom(guestId, roomId)` | same | TO ADD | — |
| `dateHelpers.tomorrow()` / `daysFromNow(n)` / `pastDate(n)` | `helpers/dateHelpers.ts` | TO ADD | Returns YYYY-MM-DD strings |
| `dateHelpers.formatDate(d)` | same | TO ADD | Mirrors `new Date(x).toLocaleDateString()` for the test runner's locale |
| `dateHelpers.getCurrentYear()` | same | TO ADD | — |
| `authApi.loginViaApi(email, password)` | `helpers/authApi.ts` | TO ADD | Returns JWT |
| `authApi.signExpiredToken(userId)` | same | TO ADD | Reads `JWT_SECRET` from test env |

---

## 7. Data & Configuration

### 7.1 Test Data Requirements

- Source of seed data: `backend/prisma/seed.ts` (re-run via `global-setup`).
- Uniqueness strategy: dynamically created users use `nanoid()` suffixes; bookings use `BookingTest_<nanoid()>` markers in `specialRequests` for cleanup.
- Cleanup strategy: `afterEach` per spec where mutations occur (see §5.2 matrix).
- Privacy: no real PII; emails use `@test.local` TLD or the seeded `@hotel.com` domain.

### 7.2 Required API Helper Methods

```typescript
// helpers/authApi.ts
export async function loginViaApi(email: string, password: string): Promise<{ token: string; user: User }>;
export function signExpiredToken(userId: number): string;
export function signMalformedToken(): string;

// helpers/bookingApi.ts
export async function createConfirmedAs(actor: { email: string; password: string }, data: BookingInput): Promise<{ id: number }>;
export async function cleanupByMarker(marker: string): Promise<void>;
export async function cleanupByGuestAndRoom(guestId: number, roomId: number): Promise<void>;

// helpers/roomApi.ts
export async function listRooms(): Promise<Room[]>;
export async function getRoomByNumber(roomNumber: string): Promise<Room>;

// helpers/dbHelpers.ts (uses Prisma client directly)
export async function truncateBookingsForGuest(guestId: number): Promise<void>;
export async function deleteUserByEmail(email: string): Promise<void>;
export async function createBookingWithStatus(data: BookingInput, status: BookingStatus): Promise<Booking>;
```

### 7.3 Type Definitions

```typescript
// data/types.ts
export type BookingInput = {
  roomId: number;
  checkInDate: string;     // ISO
  checkOutDate: string;    // ISO
  numberOfGuests: number;
  specialRequests?: string;
};
```

### 7.4 Constants and Configuration (`data/credentials.ts` and `data/roomData.ts`)

```typescript
// data/credentials.ts
export const SEEDED_GUEST = {
  email: 'guest@hotel.com',
  password: 'password123',
  firstName: 'Guest',
  lastName: 'User',
  role: 'guest' as const,
} as const;

export const SEEDED_ADMIN = {
  email: 'admin@hotel.com',
  password: 'password123',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin' as const,
} as const;

// data/roomData.ts
export const SEEDED_ROOM_NUMBERS = [
  '101', '102', '103',  // single
  '201', '202',         // double
  '301', '302',         // suite (302 is in maintenance)
  '401',                // deluxe
  '501',                // presidential
] as const;

export const SEEDED_ROOMS = {
  '101': { type: 'single', capacity: 1, pricePerNight: 89, status: 'available' },
  '102': { type: 'single', capacity: 1, pricePerNight: 95, status: 'available' },
  '103': { type: 'single', capacity: 1, pricePerNight: 79, status: 'available' },
  '201': { type: 'double', capacity: 2, pricePerNight: 139, status: 'available' },
  '202': { type: 'double', capacity: 2, pricePerNight: 145, status: 'available' },
  '301': { type: 'suite',  capacity: 3, pricePerNight: 249, status: 'available' },
  '302': { type: 'suite',  capacity: 3, pricePerNight: 269, status: 'maintenance' },
  '401': { type: 'deluxe', capacity: 4, pricePerNight: 359, status: 'available' },
  '501': { type: 'presidential', capacity: 4, pricePerNight: 599, status: 'available' },
} as const;
```

### 7.5 Environment Variables

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `TEST_DATABASE_URL` | yes | — | dedicated test DB; never the dev DB |
| `BASE_URL` | yes | `http://localhost:3000` | Vite dev server |
| `BACKEND_URL` | yes | `http://localhost:5000` | Express server (used by helpers, not by browser) |
| `JWT_SECRET` | yes | shared with backend | required by `signExpiredToken` |

### 7.6 Playwright Project Config Outline

```typescript
// playwright.config.ts (outline; implementation to follow ai-coding-standards.md)
export default defineConfig({
  testDir: './tests-UI',
  timeout: 20_000,                     // per ai-coding-standards.md PATTERN 12
  retries: 0,                          // CI may set to 1; never higher (PATTERN 12)
  workers: 1,                          // serial by default — many tests share rooms
  reporter: [['list'], ['html']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    viewport: { width: 1280, height: 720 },
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    { command: 'npm run dev --prefix backend', url: 'http://localhost:5000/health', reuseExistingServer: !process.env.CI, timeout: 30_000 },
    { command: 'npm run dev --prefix frontend', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI, timeout: 30_000 },
  ],
  globalSetup: './tests-UI/global-setup.ts',
});
```

---

## 8. Stability Contract

### 8.1 Shared vs. Isolated Entities

| Entity | Scope | Lifetime | Why |
|--------|-------|----------|-----|
| Seeded users (`admin@hotel.com`, `guest@hotel.com`) | All specs | `global-setup` → end of run | Shared login surface; no test mutates these users |
| Seeded rooms (101–501) | All specs | `global-setup` → end of run | Shared catalog; never deleted; status of 302 (maintenance) is fixed |
| Test-created users (registration tests) | per-test | `beforeEach` (none) → `afterEach` (delete) | Each test's email is unique |
| Test-created bookings | per-test | `beforeEach` (create) → `afterEach` (delete) | Booking dates would conflict if not isolated |

### 8.2 Wait Strategies Used

| Pattern | When to use | Example |
|---------|-------------|---------|
| `Promise.all([waitForResponse, action])` | Action triggers async API call (PATTERN 11) | login submit, booking create, register |
| `expect(locator).toBeVisible()` | Static element appearance | page header, modal open |
| `expect(locator).toBeDisabled() / toBeEnabled()` | Gating element | submit button during in-flight request |
| `page.waitForURL(pattern)` | Navigation completion | after login, after redirect, after RoomDetails 2-second redirect |
| `locator.waitFor({ state: 'hidden' })` | Spinner disappearance | `loadingSpinner` after data fetch |
| `page.waitForResponse(/api regex/, { predicate: r => r.status() === 200 })` | Specific API call | `/api/auth/me` hydration |
| `page.route(url, handler)` | Throttle / mock to observe loading or error states | TC-AL-10, TC-AR-12, TC-MB-11 |

### 8.3 Forbidden Stability Anti-Patterns

| ❌ Forbidden | ✅ Use Instead | Authority |
|-------------|---------------|-----------|
| `page.waitForTimeout(2000)` (e.g., for the RoomDetails 2s redirect) | `page.waitForURL(/\/dashboard\/bookings$/)` — Playwright's default 30s applies | `ai-coding-standards.md` PATTERN 9 |
| Increasing test timeout to mask a flaky locator | Find root cause via temp spec headed mode | PATTERN 10 |
| `page.getByText("Booking confirmed")` for content under test | `roomDetails.successAlert.toContainText("Booking confirmed")` | `ai-coding-standards.md` §4.1 Rule 4 |
| `expect()` inside Page Object / hook | `waitFor()` in PO; `expect()` only in tests | PATTERN 5, RULE 6 |
| Asserting on MUI internal class names (`MuiChip-colorSuccess`) when avoidable | `data-status` attribute custom-added | §4.1 Rule 4 |

### 8.4 Parallel Safety Declaration

| Spec File | Parallel Safe? | Rationale |
|-----------|----------------|-----------|
| `landing.spec.ts` | ✅ Yes | read-only, public |
| `auth-login.spec.ts` | ✅ Yes | each test creates own context; no DB mutation |
| `auth-register.spec.ts` | ✅ Yes | unique email per test, deleted in afterEach |
| `navbar.spec.ts` | ✅ Yes | read-only |
| `protected-routes.spec.ts` | ✅ Yes | read-only |
| `guest-dashboard.spec.ts` | ✅ Yes | read-only |
| `browse-rooms.spec.ts` | ✅ Yes | read-only on rooms |
| `room-details-booking.spec.ts` | ⚠️ Serial within file | bookings on shared rooms can conflict; use `test.describe.serial` for booking-create tests OR rotate rooms |
| `my-bookings.spec.ts` | ⚠️ Serial within file | mutates shared guest's bookings list; use `test.describe.serial` |
| `my-profile.spec.ts` | ✅ Yes | read-only |
| `admin-dashboard.spec.ts` | ✅ Yes | read-only |
| `token-lifecycle.spec.ts` | ✅ Yes | per-test contexts; localStorage scoped |

**Recommended global setting**: `workers: 1` (serial across spec files) for first 3x stability run; later may parallelize the safe specs.

### 8.5 3x Stability Verification

Per `ai-coding-standards.md` §4.2 (Phase 1-3) and RULE 6: every test MUST pass 3 sequential runs before status `PASS` is recorded.

```bash
npx playwright test tests-UI/{spec}.spec.ts --reporter=list --workers=1 --repeat-each=3
```

After all spec files individually pass 3x, the **full suite must also pass 3x**:

```bash
npx playwright test tests-UI/ --reporter=list --workers=1 --repeat-each=3
```

---

## 9. Risks & Known Issues

### 9.1 Flaky Locators

| Locator | Issue | Workaround | Tracked In |
|---------|-------|------------|-----------|
| `roomCard.roomStatus` color | MUI internal class names can change between MUI versions | Custom `data-status` attribute (§6.7 row) | KOM-UI-001 |
| MUI `<Menu>` portal (avatar dropdown) | Mounts outside the navbar DOM tree; queries scoped to `navbar.*` would miss it | `navbar.avatarMenuPanel` is rooted at the portal `[data-testid="navbar-avatar-menu"]` | KOM-UI-002 |

### 9.2 BUG-002 — Avatar menu "My Profile" navigates to /dashboard, not /dashboard/profile

`Navbar.tsx` line 204: `onClick={() => { handleClose(); navigate('/dashboard'); }}` — the menu item labelled "My Profile" should navigate to `/dashboard/profile`. Test **TC-NV-06** documents the **current** broken behaviour. When fixed, update that test (RULE 8).

### 9.3 BUG-003 — Admin Dashboard cards link to wrong (or non-existent) routes

`AdminDashboard.tsx`:
- "Room Management" → `/dashboard/rooms` (the GUEST browse page)
- "Booking Management" → `/dashboard/bookings` (the GUEST bookings page)
- "Guest Management" → `/admin/guests` (route does NOT exist in App.tsx)

Tests **TC-AD-05/06/07** document current behaviour; update when admin pages are built.

### 9.4 Race Conditions

| Operation | Race | Mitigation |
|-----------|------|------------|
| Login → `useAuth.user` hydration → navbar avatar appears | navbar may render before user available | wait for `navbar.avatar` visible before assertions on auth-only nav |
| Booking submit → 2s redirect → new bookings list | `setTimeout(2000)` race between FE redirect and test's next nav | `page.waitForURL` covers determinately |
| `/api/auth/me` after reload | response can lag, intermediate render shows logged-out navbar | `Promise.all([waitForResponse, reload])` |
| HTML `min/max` date attribute | browsers may visually block but allow programmatic `.fill()` | tests rely on programmatic fill + verify BE 400 |

### 9.5 Backend Eventual Consistency

| Endpoint | Consistency | Strategy |
|----------|-------------|----------|
| `POST /api/bookings` → conflict check | Strong (synchronous Prisma query) | none needed |
| `GET /api/bookings` after POST | Strong | tests can immediately re-fetch |
| `DELETE /api/bookings/:id` propagation | Strong | none needed |

### 9.6 BLOCKED / FLAKY Tests Catalog

(Empty — no test is currently flagged BLOCKED or FLAKY. Catalog will be populated when tests are run.)

| Test ID | Test Name | Status | Reason | Tracked In |
|---------|-----------|--------|--------|-----------|
| — | — | — | — | — |

### 9.7 Open Questions for Product / Dev

| # | Question | Affects Tests | Status |
|---|----------|---------------|--------|
| Q1 | Should `getCurrentUser` (`/api/auth/me`) return `createdAt`/`updatedAt`? Currently the controller does NOT include them, but `MyProfilePage` reads `user.createdAt` for "Member since" — if absent the row is hidden. | TC-MP-07 | confirm with backend team; update plan if controller is fixed |
| Q2 | Should the avatar "My Profile" menu item navigate to `/dashboard/profile` (currently it goes to `/dashboard`)? | TC-NV-06 | confirm — bug fix would change expected URL |
| Q3 | Should the Admin "Guest Management" card link to a real `/admin/guests` page, OR be hidden until the admin pages exist? | TC-AD-07 | confirm — test asserts current broken nav |
| Q4 | When BE returns `"Room capacity is 1 guests"` (off-by-pluralisation), should FE intercept and rephrase, or is the BE message left as-is? | TC-RD-11 | confirm exact expected text |
| Q5 | Is `BackToDashboard` button on `MyProfilePage` and `MyBookingsPage` expected to be present? Both pages have it; tests assert their existence. | TC-MB-02, TC-MP — (no test for back-button on profile yet) | confirm |

---

## 10. Debug Commands

### 10.1 Single Test Debug (headed)

```bash
npx playwright test tests-UI/auth-login.spec.ts --grep "TC-AL-06" --headed --workers=1
```

### 10.2 Debug Specific File (full file)

```bash
npx playwright test tests-UI/room-details-booking.spec.ts --headed --workers=1
```

### 10.3 Stability Check (3x)

```bash
npx playwright test tests-UI/auth-login.spec.ts --reporter=list --workers=1 --repeat-each=3
```

### 10.4 Full Suite 3x (final gate before MCP-Ready completion)

```bash
npx playwright test tests-UI/ --reporter=list --workers=1 --repeat-each=3
```

### 10.5 Trace viewer for a failing run

```bash
npx playwright show-trace test-results/{test-id}/trace.zip
```

### 10.6 Reset test DB only (without re-running global-setup)

```bash
cd backend && npx prisma migrate reset --force --skip-seed && npx prisma db seed
```

---

## 11. Revision History

| Version | Date | Stage | Changes |
|---------|------|-------|---------|
| 1.0 | Apr 29, 2026 | **MCP-Ready** | Initial test plan created. 128 tests across 12 spec files covering all currently-implemented FE features (Landing, Auth, Navbar, Protected Routes, Guest Dashboard, Browse Rooms, Room Details + Booking, My Bookings, My Profile, Admin Dashboard placeholder, Token Lifecycle). All locators resolved (existing or `TO ADD`). 5 open questions (§9.7) documented; 3 known FE bugs (§9.2, §9.3) explicitly tested as "current behaviour" per RULE 8. |

---

*Compliant with: `ai-coding-standards.md` v3.x, `ai-planning-standards.md` v3.0. Companion: `backend/tests/api/api-tests.plan.md` (HTTP-level integration tests).*
