# Test Plan: Hotel Management REST API

> **Feature**: HTTP-level integration tests for the Hotel Management backend API (Node.js + Express + Prisma + PostgreSQL).
> **URL**: `http://localhost:5000/api/`
> **Version**: 1.0 | April 2026
> **Stage**: **MCP-Ready**
> **Compliant with**: `ai-coding-standards.md`, `ai-planning-standards.md`
> **Status**: 0 PASS, 0 STUB, 149 Pending, 2 BLOCKED, 0 FLAKY (151 total)

> **Adaptation note**: `ai-planning-standards.md` was authored primarily for Playwright UI test plans. This plan adapts its CORE CONTRACT (§12) to **API integration testing** with the following 1-to-1 mapping. The contract — Fixtures, Preconditions, Test Data, Steps, Resolved Locators, Assertions, Stability, Cleanup — is preserved verbatim:
>
> | UI Concept (standard) | API Equivalent (this plan) |
> |---|---|
> | Page Object (`OfferPage.ts`) | `ApiClient` (`AuthApi.ts`, `RoomApi.ts`, …) — one class per resource |
> | Fixture (`buyer`, `supplier`, `staff`) | Authenticated supertest agent bundle (`guestClient`, `adminClient`, `staffClient`, `anonClient`) |
> | Locator (`[data-testid="..."]`) | HTTP method + URL pattern + JSON-path into the response envelope |
> | URL navigation (`page.goto`) | `request(app).method(url).set('Authorization', ...)` |
> | DOM assertion (`toContainText`) | Status-code + JSON-body assertion (`expect(res.status).toBe(...)`, `expect(res.body).toMatchObject({...})`) |
> | `Promise.all([waitForResponse, click])` | `await client.x.create(...)` — supertest already awaits the response |
> | 3x stability re-run | `--repeat-each=3` via Jest is not native — use `for (let i = 0; i < 3; i++) it(...)` OR run `jest --runInBand` 3 times sequentially via npm script |

---

## Table of Contents

- [1. Overview](#1-overview)
- [2. File Structure](#2-file-structure)
- [3. Status Summary](#3-status-summary)
- [4. Test Cases (MCP-Ready Specs)](#4-test-cases-mcp-ready-specs)
  - [4.1 Smoke & Server Wiring](#41-smoke--server-wiring)
  - [4.2 Auth — Register](#42-auth--register)
  - [4.3 Auth — Login](#43-auth--login)
  - [4.4 Auth — Get Current User (`/me`)](#44-auth--get-current-user-me)
  - [4.5 Rooms — Public Reads](#45-rooms--public-reads)
  - [4.6 Rooms — Search](#46-rooms--search)
  - [4.7 Rooms — Admin CRUD](#47-rooms--admin-crud)
  - [4.8 Bookings — Create](#48-bookings--create)
  - [4.9 Bookings — List & Detail](#49-bookings--list--detail)
  - [4.10 Bookings — Update & Cancel](#410-bookings--update--cancel)
  - [4.11 Bookings — Check-in / Check-out](#411-bookings--check-in--check-out)
  - [4.12 Guests — Admin/Staff Endpoints](#412-guests--adminstaff-endpoints)
  - [4.13 Cross-Cutting Middleware](#413-cross-cutting-middleware)
- [5. Shared Preconditions & beforeAll Setup](#5-shared-preconditions--beforeall-setup)
- [6. Resolved Endpoints & Response Catalog](#6-resolved-endpoints--response-catalog)
- [7. Data & Configuration](#7-data--configuration)
- [8. Stability Contract](#8-stability-contract)
- [9. Risks & Known Issues](#9-risks--known-issues)
- [10. Debug Commands](#10-debug-commands)
- [11. Revision History](#11-revision-history)

---

## 1. Overview

### 1.1 What is being tested

The Hotel Management API is a REST service exposing four domains under `/api`:

| Domain     | Mount point      | Auth required           | Roles                          |
|------------|------------------|-------------------------|--------------------------------|
| Auth       | `/api/auth`      | only `/me`              | any (registers as `guest`)     |
| Rooms      | `/api/rooms`     | only mutating verbs     | mutations: `admin`             |
| Bookings   | `/api/bookings`  | **all routes**          | reads/writes: any auth; `/check-in`, `/check-out`: `admin`/`staff` |
| Guests     | `/api/guests`    | **all routes**          | `admin`/`staff` only           |
| Health     | `/health`        | none                    | —                              |

### 1.2 Test approach

**HTTP-level integration tests** using `supertest` against the in-process Express `app` (imported from `backend/src/server.ts`). This is *not* a unit-test suite — every request goes through the full Express middleware stack (`helmet`, `cors`, `express.json`, route, `authenticate`, `authorize`, controller, `errorHandler`).

**Database**: a real PostgreSQL test database is used via Prisma (matches existing `tests/setup.ts`). Each test starts with a clean slate via `afterEach` truncation.

**SOLID/OOP** (per user rule): every resource has its own `ApiClient` class (`AuthApi`, `RoomApi`, `BookingApi`, `GuestApi`). Tests depend on the `ApiClient` abstractions, not on raw `request(app)` calls. Fixtures (`guestClient`, `adminClient`, `staffClient`, `anonClient`) are role-bound bundles that compose all four clients with a pre-issued JWT.

### 1.3 Out of scope (explicit)

- UI/E2E flows (covered by separate `tests-UI/` plan)
- Performance / load tests
- Swagger UI rendering verification (covered indirectly by `GET /api-docs` health-check only — not in this plan)
- WebSocket / SSE (none in this codebase)
- Email / SMTP delivery (no email code exists yet)
- Payment / Stripe flows (no payment code exists yet)

### 1.4 Workflow

```
┌─────────────────────────────────────────────────────────┐
│  Anonymous → POST /api/auth/register → 201 + token      │
│       │                                                  │
│       └──► POST /api/auth/login → 200 + token           │
│               │                                          │
│               └──► GET /api/auth/me (Bearer) → 200      │
│                                                          │
│  Guest token → POST /api/bookings → 201                 │
│              → GET  /api/bookings  → own only           │
│              → GET  /api/rooms[/search] → public read   │
│                                                          │
│  Admin/Staff token → /api/guests/*     → 200            │
│                    → /api/bookings/:id/check-{in,out}   │
│                                                          │
│  Admin token  → POST/PUT/DELETE /api/rooms/* → 2xx      │
└─────────────────────────────────────────────────────────┘
```

---

## 2. File Structure

```
backend/tests/api/
├── api-tests.plan.md              # This file (MCP-ready test plan)
├── clients/                       # ApiClient classes (Page Object equivalent)
│   ├── BaseApiClient.ts           # Common: token, request, envelope unwrap
│   ├── AuthApi.ts                 # /api/auth/*
│   ├── RoomApi.ts                 # /api/rooms/*
│   ├── BookingApi.ts              # /api/bookings/*
│   └── GuestApi.ts                # /api/guests/*
├── fixtures/                      # Role-bound client bundles
│   ├── createActor.ts             # Factory: spin up user + JWT + clients
│   └── types.ts                   # ActorClient, AuthorizedClient, AnonClient
├── data/
│   ├── roomFactory.ts             # Room test-data builders
│   ├── bookingFactory.ts          # Booking test-data builders
│   └── userFactory.ts             # User/profile test-data builders
├── helpers/
│   ├── jwtHelpers.ts              # signTokenAs / signExpiredToken / signMalformedToken
│   ├── dateHelpers.ts             # tomorrow(), daysFromNow(n), past()
│   └── envelope.ts                # SuccessEnvelope / ErrorEnvelope type guards
├── smoke.spec.ts                  # §4.1 Smoke & Server Wiring
├── auth-register.spec.ts          # §4.2 Register
├── auth-login.spec.ts             # §4.3 Login
├── auth-me.spec.ts                # §4.4 /me
├── rooms-read.spec.ts             # §4.5 + §4.6 (list/detail/search)
├── rooms-admin.spec.ts            # §4.7 (CRUD)
├── bookings-create.spec.ts        # §4.8
├── bookings-read.spec.ts          # §4.9
├── bookings-update-cancel.spec.ts # §4.10
├── bookings-checkin-checkout.spec.ts # §4.11
├── guests.spec.ts                 # §4.12
└── cross-cutting.spec.ts          # §4.13
```

---

## 3. Status Summary

| Phase                           | Spec File                              | Tests | PASS | STUB | Pending | BLOCKED | FLAKY |
|---------------------------------|----------------------------------------|-------|------|------|---------|---------|-------|
| Smoke & Server Wiring           | `smoke.spec.ts`                        |   5   |  0   |  0   |    5    |    0    |   0   |
| Auth — Register                 | `auth-register.spec.ts`                |  10   |  0   |  0   |   10    |    0    |   0   |
| Auth — Login                    | `auth-login.spec.ts`                   |   6   |  0   |  0   |    6    |    0    |   0   |
| Auth — `/me`                    | `auth-me.spec.ts`                      |   9   |  0   |  0   |    9    |    0    |   0   |
| Rooms — Public Reads (list+detail) | `rooms-read.spec.ts`                |  11   |  0   |  0   |   11    |    0    |   0   |
| Rooms — Search                  | `rooms-read.spec.ts` (same file)       |   5   |  0   |  0   |    5    |    0    |   0   |
| Rooms — Admin CRUD              | `rooms-admin.spec.ts`                  |  15   |  0   |  0   |   15    |    0    |   0   |
| Bookings — Create               | `bookings-create.spec.ts`              |  15   |  0   |  0   |   15    |    0    |   0   |
| Bookings — Read                 | `bookings-read.spec.ts`                |  12   |  0   |  0   |   12    |    0    |   0   |
| Bookings — Update / Cancel      | `bookings-update-cancel.spec.ts`       |  15   |  0   |  0   |   15    |    0    |   0   |
| Bookings — Check-in / Check-out | `bookings-checkin-checkout.spec.ts`    |  16   |  0   |  0   |   16    |    0    |   0   |
| Guests — Admin/Staff            | `guests.spec.ts`                       |  21   |  0   |  0   |   21    |    0    |   0   |
| Cross-Cutting Middleware        | `cross-cutting.spec.ts`                |  11   |  0   |  0   |    9    |    2    |   0   |
|                                 | **TOTAL**                              | **151** | **0** | **0** | **149** | **2** | **0** |

---

## 4. Test Cases (MCP-Ready Specs)

### 4.1 Smoke & Server Wiring

#### TC-SM-01: Anonymous user gets 200 from `/health` @Ta1b2c3d4

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@smoke` |
| **Spec File** | `backend/tests/api/smoke.spec.ts` |
| **Priority** | P0 (gates the whole suite) |

**Preconditions** (inline): none — `app` is imported from `src/server.ts`; the `startServer()` side-effect at the bottom of that file is **harmless under test** because Jest does not export to a network port (see §9.1 — verify the `startServer()` IIFE is not invoked during `import`).

**Test Data**: none.

**User Journey Steps**:
1. Build supertest agent: `const r = request(app);`
2. `await r.get('/health')`

**Expected Assertions**:
| Locator (response field) | Assertion | Expected Value |
|--------------------------|-----------|----------------|
| `res.status` | `toBe` | `200` |
| `res.body.status` | `toBe` | `"success"` |
| `res.body.message` | `toBe` | `"Hotel Management API is running"` |
| `res.body.timestamp` | `toMatch` | `/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/` (ISO-8601) |
| `res.headers['content-type']` | `toMatch` | `/application\/json/` |

**Stability Notes**: pure read — no DB interaction; idempotent.

**Cleanup Contract**:
- **Mutation**: none
- **Shared state impact**: none
- **Parallel safety**: ✅ Safe
- **Teardown**: none

---

#### TC-SM-02: Anonymous user gets 404 envelope for unknown route @Tb2c3d4e5

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@smoke @negative` |
| **Spec File** | `backend/tests/api/smoke.spec.ts` |
| **Priority** | P1 |

**Preconditions**: none.

**Test Data**: path = `/api/this-route-does-not-exist`.

**User Journey Steps**:
1. `await request(app).get('/api/this-route-does-not-exist')`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `res.status` | `toBe` | `404` |
| `res.body` | `toEqual` | `{ status: 'error', message: 'Route not found' }` |

**Stability Notes**: route falls through to `app.use((_req, res) => …)` 404 handler defined in `server.ts` line 69-74.

**Cleanup Contract**: none — read-only.

---

#### TC-SM-03: Helmet sets `x-content-type-options: nosniff` on all responses @Tc3d4e5f6

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@smoke @security` |
| **Spec File** | `backend/tests/api/smoke.spec.ts` |
| **Priority** | P2 |

**Preconditions**: none.

**Steps**:
1. `await request(app).get('/health')`

**Assertions**:
| Header | Expected |
|--------|----------|
| `res.headers['x-content-type-options']` | `"nosniff"` |
| `res.headers['x-dns-prefetch-control']` | `"off"` |
| `res.headers['strict-transport-security']` | matches `/max-age=\d+/` |

**Stability**: helmet defaults; verified against `helmet@8.x` defaults.

**Cleanup**: none.

---

#### TC-SM-04: CORS preflight `OPTIONS` returns `access-control-allow-origin` @Td4e5f6a7

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@smoke @security` |
| **Spec File** | `backend/tests/api/smoke.spec.ts` |
| **Priority** | P2 |

**Preconditions**: none.

**Steps**:
1. `await request(app).options('/api/rooms').set('Origin', 'http://localhost:5173').set('Access-Control-Request-Method', 'GET')`

**Assertions**:
| Header / Field | Expected |
|----------------|----------|
| `res.status` | `204` |
| `res.headers['access-control-allow-origin']` | `"*"` (default `cors()` config) |

**Stability**: depends on `app.use(cors())` in `server.ts:28` with no options. Re-verify if CORS_ORIGIN env support is added later (see §9.4).

**Cleanup**: none.

---

#### TC-SM-05: Server rejects non-JSON body with `Content-Type: application/json` parse error @Te5f6a7b8

| Field | Value |
|-------|-------|
| **Fixture** | `adminClient` |
| **Tags** | `@smoke @negative` |
| **Spec File** | `backend/tests/api/smoke.spec.ts` |
| **Priority** | P2 |

**Preconditions**: admin user exists (created in `beforeEach`).

**Steps**:
1. `await request(app).post('/api/rooms').set('Authorization', 'Bearer ' + adminToken).set('Content-Type', 'application/json').send('this is not json')`

**Assertions**:
| Locator | Expected |
|---------|----------|
| `res.status` | `400` |
| `res.body.status` | `"error"` |
| `res.body.message` | `toMatch /Unexpected token|JSON/` |

**Stability**: relies on `express.json()` body parser → `errorHandler` fallback. Verify `errorHandler.ts` returns 400 for `SyntaxError` (currently it does NOT — see §9.2 Risk).

**Cleanup**: none.

---

### 4.2 Auth — Register

#### TC-AR-01: Anonymous user can register guest with required fields only @Tf6a7b8c9

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@smoke` |
| **Spec File** | `backend/tests/api/auth-register.spec.ts` |
| **Priority** | P0 |

**Preconditions**: no user with email `register-required@test.local` exists (guaranteed by `afterEach` cleanup).

**Test Data**:
| Field | Value | Source |
|-------|-------|--------|
| email | `"register-required@test.local"` | inline |
| password | `"password123"` | inline (≥6 chars) |
| profile.firstName | `"Reg"` | inline |
| profile.lastName | `"Required"` | inline |
| profile.phone | `"+15550001"` | inline |

**User Journey Steps**:
1. `const res = await request(app).post('/api/auth/register').send(payload)`
2. (verification step) `prisma.user.findUnique({ where: { email: payload.email } })`

**Expected Assertions**:
| Locator | Assertion | Expected Value |
|---------|-----------|----------------|
| `res.status` | `toBe` | `201` |
| `res.body.status` | `toBe` | `"success"` |
| `res.body.message` | `toBe` | `"User registered successfully"` |
| `res.body.data.user.id` | `toEqual` | `expect.any(Number)` |
| `res.body.data.user.email` | `toBe` | `payload.email` |
| `res.body.data.user.role` | `toBe` | `"guest"` |
| `res.body.data.user.profile.firstName` | `toBe` | `"Reg"` |
| `res.body.data.user.profile.address.street` | `toBeNull()` | `null` |
| `res.body.data.token` | `toMatch` | `/^[\w-]+\.[\w-]+\.[\w-]+$/` (JWT 3-part) |
| **DB**: `userInDb.password` | `not.toBe` | `"password123"` (hashed) |
| **DB**: `userInDb.password` | `toMatch` | `/^\$2[aby]\$\d{1,2}\$/` (bcrypt format) |
| **DB**: `userInDb.role` | `toBe` | `"guest"` |

**Stability Notes**: bcrypt hash takes ~50–200 ms; Jest default timeout 5 s is ample.

**Cleanup Contract**:
- **Mutation**: creates 1 `User` row.
- **Shared state impact**: none (afterEach truncates).
- **Parallel safety**: ⚠️ Use `--runInBand` (already enforced by `package.json` test script).
- **Teardown**: handled by global `afterEach`.

---

#### TC-AR-02: Anonymous user can register guest with full profile address @T07b8c9d0

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@smoke` |
| **Priority** | P1 |

**Preconditions**: none.

**Test Data**: required fields + `profile.address: { street: "123 Main St", city: "Boston", state: "MA", country: "USA", zipCode: "02101" }`.

**Steps**: `POST /api/auth/register` with full payload.

**Assertions**:
| Field | Expected |
|-------|----------|
| `res.status` | `201` |
| `res.body.data.user.profile.address.street` | `"123 Main St"` |
| `res.body.data.user.profile.address.zipCode` | `"02101"` |
| **DB**: `user.street` | `"123 Main St"` |

**Stability**: as TC-AR-01.
**Cleanup**: as TC-AR-01.

---

#### TC-AR-03: Registered user can immediately authenticate `/me` with returned token @T18c9d0e1

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` (chained → token reused) |
| **Tags** | `@smoke @e2e` |
| **Priority** | P0 |

**Preconditions**: none.

**Steps**:
1. `POST /api/auth/register` → capture `token`.
2. `GET /api/auth/me` with `Authorization: Bearer ${token}`.

**Assertions** (on step 2 response):
| Field | Expected |
|-------|----------|
| `res.status` | `200` |
| `res.body.data.user.email` | matches register payload email |
| `res.body.data.user.role` | `"guest"` |

**Stability**: token signed with `JWT_SECRET` from `tests/setup.ts` (`'test-secret-key-for-testing'`) — same secret used by both `auth.controller.ts` (sign) and `auth.ts` middleware (verify).

**Cleanup**: 1 user.

---

#### TC-AR-04: Register rejects duplicate email with 409 @T29d0e1f2

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@negative` |
| **Priority** | P1 |

**Preconditions**: pre-create user with `email = "dup@test.local"` via `prisma.user.create(...)` directly in test body.

**Test Data**: same email; different password & profile.

**Steps**: `POST /api/auth/register` with duplicate email.

**Assertions**:
| Field | Expected |
|-------|----------|
| `res.status` | `409` |
| `res.body` | `toEqual({ status: 'error', message: 'User with this email already exists' })` |

**Stability**: deterministic — checked via `prisma.user.findUnique` before insert (`auth.controller.ts:26`).

**Cleanup**: 1 pre-existing user (afterEach).

---

#### TC-AR-05: Group: Register returns 500 for missing required input fields (3 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@negative @edge` |
| **Spec File** | `auth-register.spec.ts` |
| **Priority** | P2 |
| **Preconditions** | none |
| **Steps** | 1. `POST /api/auth/register` with malformed body → 2. assert |
| **Assertion shape** | `res.status === 500`, `res.body.status === 'error'`, `res.body.message` truthy string |
| **Stability** | controller has no `express-validator` chain → all field-missing failures fall to `prisma.user.findUnique({ where: { email: undefined } })` which throws `PrismaClientValidationError` → caught by generic `try/catch` returning 500. **This pins current behaviour** (see §9.2 — should be 400 in the future). |
| **Cleanup** | 0 mutations |

**Per-Test Variants**:
| ID | Test Name | Test ID | Body sent | Status |
|----|-----------|---------|-----------|--------|
| AR-05a | Register without `email` returns 500 | @T3ae1f203 | `{ password: 'p', profile: {...} }` | (pending) |
| AR-05b | Register without `password` returns 500 | @T4bf2a314 | `{ email: 'x@y.z', profile: {...} }` (bcrypt rejects undefined) | (pending) |
| AR-05c | Register without `profile` returns 500 | @T5ca3b425 | `{ email: 'x@y.z', password: 'p' }` (TypeError: cannot read 'firstName' of undefined) | (pending) |

---

#### TC-AR-06: Register stores password hashed (NOT plaintext) in DB @T6db4c536

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@security` |
| **Priority** | P0 |

**Preconditions**: none.

**Test Data**: `password = "plaintext-secret-123"`.

**Steps**:
1. `POST /api/auth/register`.
2. `const dbUser = await prisma.user.findUnique({ where: { email } })`.
3. `await bcrypt.compare(password, dbUser.password)` → assert `true`.

**Assertions**:
| Locator | Assertion | Expected |
|---------|-----------|----------|
| `dbUser.password` | `not.toBe` | `"plaintext-secret-123"` |
| `dbUser.password` | `toMatch` | `/^\$2[aby]\$10\$/` (bcrypt cost-10) |
| `bcrypt.compare(plaintext, hash)` | `toBe` | `true` |

**Stability**: bcrypt cost 10 → ~80 ms; OK in 5 s timeout.

**Cleanup**: 1 user.

---

#### TC-AR-07: Register response does not leak password hash @T7ec5d647

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@security` |
| **Priority** | P0 |

**Preconditions**: none.

**Steps**: `POST /api/auth/register`.

**Assertions**:
| Locator | Assertion | Expected |
|---------|-----------|----------|
| `res.body.data.user.password` | `toBeUndefined()` | — |
| `JSON.stringify(res.body)` | `not.toMatch` | `/\$2[aby]\$/` |

**Stability**: pinned to `auth.controller.ts:62-79` projection — re-verify if controller is refactored.

**Cleanup**: 1 user.

---

#### TC-AR-08: Register always assigns role `guest` regardless of body input @T8fd6e758

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@security @negative` |
| **Priority** | P0 (privilege-escalation prevention) |

**Preconditions**: none.

**Test Data**: payload includes `role: "admin"` (ignored), email `"escalate@test.local"`.

**Steps**: `POST /api/auth/register`.

**Assertions**:
| Locator | Expected |
|---------|----------|
| `res.body.data.user.role` | `"guest"` |
| **DB**: `user.role` | `"guest"` |

**Stability**: hard-coded in `auth.controller.ts:52` (`role: 'guest'`).

**Cleanup**: 1 user.

---

### 4.3 Auth — Login

#### TC-AL-01: Registered user can log in with valid credentials @T9aeff869

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@smoke` |
| **Spec File** | `auth-login.spec.ts` |
| **Priority** | P0 |

**Preconditions**: pre-existing user `login-ok@test.local` with bcrypt-hashed password `"correct-password"`. Created in test body via `prisma.user.create({ data: { ..., password: await bcrypt.hash('correct-password', 10) } })`.

**Test Data**: `{ email: "login-ok@test.local", password: "correct-password" }`.

**Steps**: `POST /api/auth/login`.

**Assertions**:
| Field | Expected |
|-------|----------|
| `res.status` | `200` |
| `res.body.status` | `"success"` |
| `res.body.message` | `"Login successful"` |
| `res.body.data.user.email` | `"login-ok@test.local"` |
| `res.body.data.token` | matches JWT regex |
| (decoded) `jwt.decode(token).userId` | equals DB user id |

**Stability**: bcrypt.compare ≤ 200 ms.

**Cleanup**: 1 pre-existing user.

---

#### TC-AL-02: Group: Login returns 401 for wrong/missing credentials (3 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@negative` |
| **Spec File** | `auth-login.spec.ts` |
| **Priority** | P1 |
| **Preconditions** | a user `login-fixture@test.local` exists with hashed password `"correct-password"` |
| **Steps** | 1. `POST /api/auth/login` with variant body → 2. assert |
| **Assertion shape** | `res.status === 401`, `res.body === { status: 'error', message: 'Invalid email or password' }` |
| **Stability** | login returns same generic message for both unknown-email and wrong-password (per `auth.controller.ts:108-126`) — this prevents user-enumeration |
| **Cleanup** | 1 pre-existing user |

**Per-Test Variants**:
| ID | Test Name | Test ID | Body sent | Status |
|----|-----------|---------|-----------|--------|
| AL-02a | Login with wrong password returns 401 | @T0bf17a9a | `{ email: fixture, password: 'wrong' }` | (pending) |
| AL-02b | Login with non-existent email returns 401 | @T1c028bab | `{ email: 'ghost@test.local', password: 'any' }` | (pending) |
| AL-02c | Login with empty password returns 401 | @T2d139cbc | `{ email: fixture, password: '' }` | (pending) |

---

#### TC-AL-03: Group: Login returns 400 with explicit message for missing email/password (2 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@negative` |
| **Priority** | P2 |
| **Preconditions** | none |
| **Steps** | `POST /api/auth/login` with missing field |
| **Assertion shape** | `res.status === 400`, `res.body === { status: 'error', message: 'Please provide email and password' }` |
| **Stability** | guarded explicitly at `auth.controller.ts:97-103` |
| **Cleanup** | none |

**Per-Test Variants**:
| ID | Test Name | Test ID | Body sent | Status |
|----|-----------|---------|-----------|--------|
| AL-03a | Login without email field returns 400 | @T3e24adcd | `{ password: 'x' }` | (pending) |
| AL-03b | Login without password field returns 400 | @T4f35bede | `{ email: 'a@b.c' }` | (pending) |

---

### 4.4 Auth — Get Current User (`/me`)

#### TC-AM-01: Group: Authenticated user gets own profile via `/me` (3 tests, by role)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Spec File** | `auth-me.spec.ts` |
| **Tags** | `@smoke` |
| **Preconditions** | per-test: user of given role created via `createActor(role)`; token captured |
| **Test Data** | none (read-only) |
| **Steps** | 1. `GET /api/auth/me` with `Authorization: Bearer ${token}` → 2. assert |
| **Resolved endpoint** | `GET /api/auth/me` → `auth.routes.ts:141` → `authenticate` → `getCurrentUser` |
| **Assertion shape** | `res.status === 200`, `res.body.status === 'success'`, `res.body.data.user.id === actor.user.id`, `res.body.data.user.email === actor.user.email`, `res.body.data.user.role === <role>` |
| **Stability** | deterministic; depends only on JWT verify + `prisma.user.findUnique`; no race |
| **Cleanup** | 1 user per test (actor); afterEach handles |

**Per-Test Variants**:
| ID | Test Name | Test ID | Fixture | Status |
|----|-----------|---------|---------|--------|
| AM-01a | Guest can get own profile via /me | @T5a4612c0 | `guestClient` | (pending) |
| AM-01b | Admin can get own profile via /me | @T6b5723d1 | `adminClient` | (pending) |
| AM-01c | Staff can get own profile via /me | @T7c6834e2 | `staffClient` | (pending) |

---

#### TC-AM-02: Group: `/me` returns 401 for invalid auth header (4 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` (no token) |
| **Tags** | `@negative @security` |
| **Spec File** | `auth-me.spec.ts` |
| **Priority** | P0 |
| **Preconditions** | none |
| **Steps** | `GET /api/auth/me` with variant Authorization header |
| **Assertion shape (no-token cases)** | `res.status === 401`, `res.body === { status: 'error', message: 'No token provided. Please authenticate.' }` |
| **Assertion shape (bad-token cases)** | `res.status === 401`, `res.body === { status: 'error', message: 'Invalid token.' }` |
| **Stability** | per `middleware/auth.ts:20-26` (no-token) and `:67-72` (JsonWebTokenError) |
| **Cleanup** | none |

**Per-Test Variants**:
| ID | Test Name | Test ID | Header | Expected message | Status |
|----|-----------|---------|--------|------------------|--------|
| AM-02a | /me without Authorization header returns 401 (no-token msg) | @T8d7945f3 | (omitted)              | `"No token provided. Please authenticate."` | (pending) |
| AM-02b | /me with empty Authorization returns 401 (no-token msg)     | @T9e8a5604 | `""`                   | `"No token provided. Please authenticate."` | (pending) |
| AM-02c | /me with malformed JWT returns 401 (invalid-token msg)      | @T0f9b6715 | `"Bearer not.a.jwt"`   | `"Invalid token."`                          | (pending) |
| AM-02d | /me with non-Bearer scheme returns 401 (no-token msg)       | @T1a0c7826 | `"Basic abc=="`        | `"No token provided. Please authenticate."` | (pending) |

---

#### TC-AM-03: `/me` returns 401 with "Token has expired" for expired token @T2b1d8937

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` (uses helper-signed expired token) |
| **Tags** | `@negative @security @edge` |
| **Spec File** | `auth-me.spec.ts` |
| **Priority** | P1 |

**Preconditions**: a real user `expired@test.local` exists; expired token signed via `helpers/jwtHelpers.ts → signExpiredToken(userId)` using `expiresIn: '-1s'` (already expired by 1 s).

**Test Data**: `Authorization: Bearer ${expiredToken}`.

**Steps**: `GET /api/auth/me`.

**Assertions**:
| Field | Expected |
|-------|----------|
| `res.status` | `401` |
| `res.body` | `toEqual({ status: 'error', message: 'Token has expired.' })` |

**Stability**: pinned to `middleware/auth.ts:75-80` (`TokenExpiredError` branch).

**Cleanup**: 1 user.

---

#### TC-AM-04: `/me` returns 401 when token references a deleted user @T3c2ea048

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@negative @security @edge` |
| **Priority** | P1 |

**Preconditions**: register user → capture token → `prisma.user.delete({ where: { id: userId } })`.

**Steps**: `GET /api/auth/me` with the now-orphan token.

**Assertions**:
| Field | Expected |
|-------|----------|
| `res.status` | `401` |
| `res.body` | `toEqual({ status: 'error', message: 'Invalid token. User not found.' })` |

**Stability**: per `middleware/auth.ts:55-60`.

**Cleanup**: user already deleted in setup.

---

### 4.5 Rooms — Public Reads

#### TC-RL-01: Anonymous user can list all rooms with envelope shape @T4d3fb159

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@smoke` |
| **Spec File** | `rooms-read.spec.ts` |
| **Priority** | P0 |

**Preconditions** (shared `beforeEach`): 3 rooms seeded — `R1{ type: single, status: available, price: 100, capacity: 1 }`, `R2{ type: double, status: available, price: 200, capacity: 2 }`, `R3{ type: suite, status: maintenance, price: 350, capacity: 3 }`.

**Steps**: `GET /api/rooms`.

**Assertions**:
| Locator | Assertion | Expected |
|---------|-----------|----------|
| `res.status` | `toBe` | `200` |
| `res.body.status` | `toBe` | `"success"` |
| `res.body.results` | `toBe` | `3` |
| `res.body.data.rooms` | `toHaveLength` | `3` |
| `res.body.data.rooms[0]` | `toMatchObject` | `{ id: expect.any(Number), roomNumber: expect.any(String), type: expect.stringMatching(/single|double|suite|deluxe|presidential/) }` |

**Stability**: idempotent read; results array shape pinned to `room.controller.ts:23-27`.

**Cleanup**: read-only (rooms cleaned by global `afterEach`).

---

#### TC-RL-02: Group: `/api/rooms` filters work correctly (5 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@edge` |
| **Spec File** | `rooms-read.spec.ts` |
| **Priority** | P1 |
| **Preconditions** | 6 rooms via `beforeEach`: R{single,100,cap=1,available}, R{single,80,cap=1,available}, R{double,200,cap=2,available}, R{double,250,cap=2,maintenance}, R{suite,400,cap=4,occupied}, R{suite,500,cap=4,available} |
| **Steps** | `GET /api/rooms?<query>` |
| **Assertion shape** | `res.status === 200`, `res.body.results === <expected>`, every returned room satisfies the filter predicate |
| **Stability** | filters are direct Prisma `where` clauses; deterministic |
| **Cleanup** | read-only |

**Per-Test Variants**:
| ID | Test Name | Test ID | Query | Expected count | Predicate |
|----|-----------|---------|-------|----------------|-----------|
| RL-02a | Filter rooms by `type=single` returns only singles | @T5e40c26a | `?type=single` | 2 | every `r.type === 'single'` |
| RL-02b | Filter rooms by `status=available` returns only available | @T6f51d37b | `?status=available` | 4 | every `r.status === 'available'` |
| RL-02c | Filter rooms by `minPrice=200` returns price ≥ 200 | @T7062e48c | `?minPrice=200` | 4 | every `r.pricePerNight >= 200` |
| RL-02d | Filter rooms by `maxPrice=200` returns price ≤ 200 | @T8173f59d | `?maxPrice=200` | 3 | every `r.pricePerNight <= 200` |
| RL-02e | Filter rooms by `capacity=2` returns capacity ≥ 2 | @T92840a0e | `?capacity=2` | 4 | every `r.capacity >= 2` |

---

#### TC-RL-03: `/api/rooms` combined `minPrice` + `maxPrice` filter @TaA39510f

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@edge` |
| **Priority** | P2 |

**Preconditions**: same 6 rooms as TC-RL-02.

**Steps**: `GET /api/rooms?minPrice=100&maxPrice=300`.

**Assertions**:
| Field | Expected |
|-------|----------|
| `res.status` | `200` |
| `res.body.results` | `4` |
| every `r.pricePerNight` | `>= 100 && <= 300` |

**Stability**: pinned to `room.controller.ts:15-19`.

**Cleanup**: read-only.

---

#### TC-RL-04: `/api/rooms` returns empty array when no rooms exist @TbB4a6210

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Priority** | P2 |

**Preconditions**: NO seeded rooms (override default `beforeEach`).

**Steps**: `GET /api/rooms`.

**Assertions**:
| Field | Expected |
|-------|----------|
| `res.status` | `200` |
| `res.body.results` | `0` |
| `res.body.data.rooms` | `[]` |

**Stability**: deterministic.

**Cleanup**: read-only.

---

#### TC-RD-01: Group: `GET /api/rooms/:id` retrieval contract (3 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Spec File** | `rooms-read.spec.ts` |
| **Preconditions** | 1 room `roomA{id: <captured>, roomNumber:'101', type:'single'}` |
| **Tags** | `@smoke` for happy path; `@negative` for failures |
| **Stability** | numeric coercion via `Number(req.params.id)` — non-numeric `id` becomes `NaN` and is treated as not-found per `room.controller.ts:40-43` |
| **Cleanup** | read-only |

**Per-Test Variants**:
| ID | Test Name | Test ID | Path | Expected status | Expected body |
|----|-----------|---------|------|------|------|
| RD-01a | GET /api/rooms/:id returns 200 with room when found | @TcC5b7321 | `/api/rooms/${roomA.id}` | 200 | `data.room.id === roomA.id`, `roomNumber === '101'` |
| RD-01b | GET /api/rooms/:id returns 404 when ID does not exist | @TdD6c8432 | `/api/rooms/9999999` | 404 | `{ status:'error', message:'Room not found' }` |
| RD-01c | GET /api/rooms/:id returns 404 for non-numeric ID | @TeE7d9543 | `/api/rooms/abc` | 404 | `{ status:'error', message:'Room not found' }` |

---

### 4.6 Rooms — Search

#### TC-RS-01: `GET /api/rooms/search` without dates returns all available rooms @TfF8ea654

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@smoke` |
| **Spec File** | `rooms-read.spec.ts` |
| **Priority** | P0 |

**Preconditions**: 3 rooms — `available×2`, `maintenance×1`.

**Steps**: `GET /api/rooms/search`.

**Assertions**:
| Field | Expected |
|-------|----------|
| `res.status` | `200` |
| `res.body.results` | `2` |
| every `r.status` | `"available"` |

**Stability**: per `room.controller.ts:73` (`status: 'available'` baked in).

**Cleanup**: read-only.

---

#### TC-RS-02: `GET /api/rooms/search` with dates excludes rooms whose `confirmed` booking overlaps @T0090fb65

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` (data set up via Prisma directly) |
| **Tags** | `@edge` |
| **Spec File** | `rooms-read.spec.ts` |
| **Priority** | P1 |

**Preconditions**:
- `roomBooked{capacity:2, status:available}` with a `confirmed` booking for `[2026-06-10, 2026-06-15]`.
- `roomFree{capacity:2, status:available}` with no bookings.

**Test Data**: `?checkIn=2026-06-12&checkOut=2026-06-13` (overlaps roomBooked).

**Steps**: `GET /api/rooms/search?checkIn=2026-06-12&checkOut=2026-06-13`.

**Assertions**:
| Field | Expected |
|-------|----------|
| `res.status` | `200` |
| `res.body.results` | `1` |
| `res.body.data.rooms[0].id` | `roomFree.id` |

**Stability**: overlap predicate at `room.controller.ts:88-93` (`checkInDate < checkOutDate AND checkOutDate > checkInDate`).

**Cleanup**: 2 rooms + 1 booking (afterEach).

---

#### TC-RS-03: `GET /api/rooms/search` includes a room whose only overlapping booking is `cancelled` @T11a10c76

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@edge` |
| **Priority** | P1 |

**Preconditions**: same room with overlapping booking but `status: 'cancelled'`.

**Steps**: same query as TC-RS-02.

**Assertions**: `res.body.results === 1` AND the room IS included.

**Stability**: predicate `status: { in: ['confirmed', 'checked_in'] }` (`room.controller.ts:87`) excludes `cancelled`.

**Cleanup**: as TC-RS-02.

---

#### TC-RS-04: Group: `GET /api/rooms/search` filters by type and capacity (2 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@edge` |
| **Spec File** | `rooms-read.spec.ts` |
| **Preconditions** | 4 rooms: `single/cap=1`, `single/cap=1` (occupied), `double/cap=2`, `suite/cap=4` |
| **Steps** | `GET /api/rooms/search?<query>` |
| **Assertions** | response has `results === <expected>` and every room satisfies predicate |
| **Cleanup** | read-only |

**Per-Test Variants**:
| ID | Test Name | Test ID | Query | Expected count |
|----|-----------|---------|-------|----------------|
| RS-04a | Search filters by type=double returns only doubles | @T22b21d87 | `?type=double` | 1 |
| RS-04b | Search filters by capacity=2 returns capacity ≥ 2 | @T33c32e98 | `?capacity=2` | 2 |

---

### 4.7 Rooms — Admin CRUD

#### TC-RC-01: Admin can create a room with required fields @T44d43fa9

| Field | Value |
|-------|-------|
| **Fixture** | `adminClient` |
| **Tags** | `@smoke` |
| **Spec File** | `rooms-admin.spec.ts` |
| **Priority** | P0 |

**Preconditions**: admin actor created (token + DB user).

**Test Data**:
| Field | Value |
|-------|-------|
| roomNumber | `"TEST-${Date.now()}"` (uniqueness via timestamp) |
| type | `"double"` |
| capacity | `2` |
| pricePerNight | `199.99` |
| amenities | `["WiFi", "TV"]` |
| description | `"Test double room"` |

**Steps**:
1. `POST /api/rooms` with admin token + payload.
2. Verify DB: `prisma.room.findUnique({ where: { roomNumber } })`.

**Assertions**:
| Locator | Assertion | Expected |
|---------|-----------|----------|
| `res.status` | `toBe` | `201` |
| `res.body.status` | `toBe` | `"success"` |
| `res.body.message` | `toBe` | `"Room created successfully"` |
| `res.body.data.room.id` | `toEqual` | `expect.any(Number)` |
| `res.body.data.room.roomNumber` | `toBe` | payload.roomNumber |
| `res.body.data.room.pricePerNight` | `toBe` | `199.99` |
| **DB**: `dbRoom.type` | `toBe` | `"double"` |

**Stability**: deterministic; no race.

**Cleanup**:
- **Mutation**: 1 room created.
- **Parallel safety**: ✅ (timestamp-unique room number).
- **Teardown**: `afterEach` truncates `rooms`.

---

#### TC-RC-02: Group: Non-admin cannot create rooms (3 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Tags** | `@negative @security` |
| **Spec File** | `rooms-admin.spec.ts` |
| **Priority** | P0 |
| **Preconditions** | actor of given role created |
| **Steps** | `POST /api/rooms` with valid payload + role's token |
| **Stability** | enforced by `authenticate` then `authorize('admin')` (`room.routes.ts:173`) |
| **Cleanup** | 0 rooms (rejected before creation) |

**Per-Test Variants**:
| ID | Test Name | Test ID | Fixture | Header | Expected status | Expected message |
|----|-----------|---------|---------|--------|------|------|
| RC-02a | Anonymous cannot create room (401) | @T55e540ba | `anonClient` | (no Auth) | 401 | `"No token provided. Please authenticate."` |
| RC-02b | Guest cannot create room (403) | @T66f651cb | `guestClient` | Bearer guest | 403 | `"You do not have permission to access this resource."` |
| RC-02c | Staff cannot create room (403) | @T770762dc | `staffClient` | Bearer staff | 403 | `"You do not have permission to access this resource."` |

---

#### TC-RC-03: Admin creating a room with duplicate `roomNumber` returns 409 @T881873ed

| Field | Value |
|-------|-------|
| **Fixture** | `adminClient` |
| **Tags** | `@negative` |
| **Priority** | P1 |

**Preconditions**: pre-existing room `roomNumber: "DUP-101"`.

**Steps**: `POST /api/rooms` with `roomNumber: "DUP-101"`.

**Assertions**:
| Field | Expected |
|-------|----------|
| `res.status` | `409` |
| `res.body.status` | `"error"` |
| `res.body.message` | `"Room already exists"` |

**Stability**: per `room.controller.ts:135-141` (`P2002` Prisma error).

**Cleanup**: 1 pre-existing room (afterEach).

---

#### TC-RU-01: Admin can update a room @T99298804

| Field | Value |
|-------|-------|
| **Fixture** | `adminClient` |
| **Tags** | `@smoke` |
| **Priority** | P0 |

**Preconditions**: 1 room `roomA{ pricePerNight: 100 }`.

**Test Data**: `{ pricePerNight: 175.50, status: 'maintenance' }`.

**Steps**: `PUT /api/rooms/${roomA.id}`.

**Assertions**:
| Field | Expected |
|-------|----------|
| `res.status` | `200` |
| `res.body.data.room.pricePerNight` | `175.50` |
| `res.body.data.room.status` | `"maintenance"` |
| **DB**: `dbRoom.pricePerNight` | `175.50` |

**Stability**: deterministic.

**Cleanup**: 1 room (afterEach).

---

#### TC-RU-02: Group: Non-admin / not-found PUT (4 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Tags** | `@negative` |
| **Spec File** | `rooms-admin.spec.ts` |
| **Priority** | P1 |
| **Preconditions** | 1 room `roomA` |
| **Steps** | `PUT /api/rooms/<id>` with body `{ pricePerNight: 999 }` |
| **Cleanup** | 1 room |

**Per-Test Variants**:
| ID | Test Name | Test ID | Fixture | Path | Status | Body |
|----|-----------|---------|---------|------|--------|------|
| RU-02a | Anonymous cannot update room (401) | @T0a3a9915 | `anon`  | `/api/rooms/${roomA.id}` | 401 | no-token msg |
| RU-02b | Guest cannot update room (403)     | @T1b4baa26 | `guest` | `/api/rooms/${roomA.id}` | 403 | permission msg |
| RU-02c | Staff cannot update room (403)     | @T2c5cbb37 | `staff` | `/api/rooms/${roomA.id}` | 403 | permission msg |
| RU-02d | Admin gets 404 for non-existent room | @T3d6dcc48 | `admin` | `/api/rooms/9999999`     | 404 | `"Room not found"` |

---

#### TC-RDel-01: Admin can delete a room @T4e7edd59

| Field | Value |
|-------|-------|
| **Fixture** | `adminClient` |
| **Tags** | `@smoke` |
| **Priority** | P1 |

**Preconditions**: 1 room `roomA` with no bookings.

**Steps**:
1. `DELETE /api/rooms/${roomA.id}`.
2. Verify DB: `prisma.room.findUnique({ where: { id: roomA.id } })` returns `null`.

**Assertions**:
| Field | Expected |
|-------|----------|
| `res.status` | `200` |
| `res.body.status` | `"success"` |
| `res.body.message` | `"Room deleted successfully"` |
| DB lookup | `null` |

**Stability**: deterministic.

**Cleanup**: room already deleted; afterEach idempotent.

---

#### TC-RDel-02: Group: Non-admin / not-found DELETE (4 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Tags** | `@negative` |
| **Priority** | P1 |
| **Preconditions** | 1 room `roomA` |
| **Steps** | `DELETE /api/rooms/<id>` |
| **Cleanup** | 1 room |

**Per-Test Variants**:
| ID | Test Name | Test ID | Fixture | Path | Status |
|----|-----------|---------|---------|------|--------|
| RDel-02a | Anonymous cannot delete room (401) | @T5f8fee6a | `anon` | `/api/rooms/${roomA.id}` | 401 |
| RDel-02b | Guest cannot delete room (403)     | @T6090ff7b | `guest` | `/api/rooms/${roomA.id}` | 403 |
| RDel-02c | Staff cannot delete room (403)     | @T71a1008c | `staff` | `/api/rooms/${roomA.id}` | 403 |
| RDel-02d | Admin gets 404 for non-existent room | @T82b2119d | `admin` | `/api/rooms/9999999` | 404 |

---

### 4.8 Bookings — Create

#### TC-BC-01: Guest can create a confirmed booking with valid future dates @T93c322ae

| Field | Value |
|-------|-------|
| **Fixture** | `guestClient` |
| **Tags** | `@smoke` |
| **Spec File** | `bookings-create.spec.ts` |
| **Priority** | P0 |

**Preconditions**:
- guest actor created.
- 1 room `roomA{ id, capacity: 4, pricePerNight: 100, status: available }`.
- no existing bookings on `roomA`.

**Test Data** (use helper `dateHelpers.daysFromNow`):
| Field | Value | Source |
|-------|-------|--------|
| roomId | `roomA.id` | precondition |
| checkInDate | `daysFromNow(7).toISOString()` | helper |
| checkOutDate | `daysFromNow(10).toISOString()` | helper |
| numberOfGuests | `2` | inline |
| specialRequests | `"Late check-in please"` | inline |

**User Journey Steps**:
1. `POST /api/bookings` with guest token + payload.
2. Verify DB: `prisma.booking.findUnique({ where: { id: res.body.data.booking.id } })`.

**Expected Assertions**:
| Locator | Assertion | Expected |
|---------|-----------|----------|
| `res.status` | `toBe` | `201` |
| `res.body.status` | `toBe` | `"success"` |
| `res.body.message` | `toBe` | `"Booking created successfully"` |
| `res.body.data.booking.id` | `toEqual` | `expect.any(Number)` |
| `res.body.data.booking.guestId` | `toBe` | `guest.user.id` |
| `res.body.data.booking.roomId` | `toBe` | `roomA.id` |
| `res.body.data.booking.status` | `toBe` | `"confirmed"` (defaulted by controller) |
| `res.body.data.booking.totalPrice` | `toBe` | `300` (3 nights × 100) |
| `res.body.data.booking.numberOfGuests` | `toBe` | `2` |
| `res.body.data.booking.specialRequests` | `toBe` | `"Late check-in please"` |
| `res.body.data.booking.room.roomNumber` | `toEqual` | `expect.any(String)` |
| `res.body.data.booking.guest.email` | `toBe` | `guest.user.email` |

**Stability Notes**: total-price calculation at `booking.controller.ts:77-78` uses `Math.ceil((checkOut - checkIn) / 1d)` — exactly 3 days = 3 nights.

**Cleanup Contract**:
- **Mutation**: 1 booking created.
- **Parallel safety**: ✅ each test creates its own room+booking.
- **Teardown**: afterEach (booking → room → user, in dependency order per `tests/setup.ts`).

---

#### TC-BC-02: Booking response embeds `room` (roomNumber, type) and `guest` (email, firstName, lastName) @Ta4d433bf

| Field | Value |
|-------|-------|
| **Fixture** | `guestClient` |
| **Tags** | `@smoke` |
| **Priority** | P1 |

**Preconditions**: as TC-BC-01.

**Steps**: as TC-BC-01.

**Assertions** (extra, on top of TC-BC-01):
| Locator | Expected |
|---------|----------|
| `res.body.data.booking.room.type` | matches `roomA.type` |
| `res.body.data.booking.guest.firstName` | matches `guest.user.firstName` |
| `res.body.data.booking.guest` | does NOT contain `password` field |

**Stability**: pinned to `booking.controller.ts:92-99` (Prisma `include + select`).

**Cleanup**: 1 booking + 1 room.

---

#### TC-BC-03: Booking total price equals `nights × pricePerNight` (varying nights) @Tb5e544c0

| Field | Value |
|-------|-------|
| **Fixture** | `guestClient` |
| **Tags** | `@edge` |
| **Priority** | P1 |

**Preconditions**: room `pricePerNight: 150`.

**Test Data Variants** (3 sub-cases parametrized in 1 test using `it.each`):
| Days | Expected total |
|------|----------------|
| 1 night | `150` |
| 5 nights | `750` |
| 14 nights | `2100` |

**Steps**: `POST /api/bookings` for each variant.

**Assertions**: `res.body.data.booking.totalPrice === expected`.

**Stability**: `Math.ceil` over millisecond delta → deterministic for whole-day differences.

**Cleanup**: 3 bookings.

---

#### TC-BC-04: Group: Booking validation rejects bad dates / guest counts (4 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Fixture** | `guestClient` |
| **Tags** | `@negative` |
| **Spec File** | `bookings-create.spec.ts` |
| **Priority** | P1 |
| **Preconditions** | 1 room `roomA{ capacity: 2, pricePerNight: 100 }` |
| **Steps** | `POST /api/bookings` with bad payload variant |
| **Stability** | all guarded explicitly in `booking.controller.ts:25-53` |
| **Cleanup** | 1 room (no booking created) |

**Per-Test Variants**:
| ID | Test Name | Test ID | Bad Field | Status | Message |
|----|-----------|---------|-----------|--------|---------|
| BC-04a | Cannot book with check-in in the past (400) | @Tc6f655d1 | `checkInDate: yesterday` | 400 | `"Check-in date cannot be in the past"` |
| BC-04b | Cannot book with check-out before check-in (400) | @Td7a76fe2 | `checkInDate: +5d, checkOutDate: +3d` | 400 | `"Check-out date must be after check-in date"` |
| BC-04c | Cannot book with check-out equal to check-in (400) | @Te8b870f3 | `checkInDate: +5d, checkOutDate: +5d` | 400 | `"Check-out date must be after check-in date"` |
| BC-04d | Cannot book with `numberOfGuests = 0` (400) | @Tf9c98104 | `numberOfGuests: 0` | 400 | `"Number of guests must be at least 1"` |

---

#### TC-BC-05: Cannot book with `numberOfGuests > room.capacity` (400 with capacity msg) @T0adb9215

| Field | Value |
|-------|-------|
| **Fixture** | `guestClient` |
| **Tags** | `@negative @edge` |
| **Priority** | P1 |

**Preconditions**: room `capacity: 2`.

**Test Data**: `numberOfGuests: 3` (valid dates).

**Steps**: `POST /api/bookings`.

**Assertions**:
| Field | Expected |
|-------|----------|
| `res.status` | `400` |
| `res.body.message` | `"Room capacity is 2 guests"` |

**Stability**: per `booking.controller.ts:31-37`.

**Cleanup**: 1 room.

---

#### TC-BC-06: Cannot book a non-existent room (404) @T1bec0326

| Field | Value |
|-------|-------|
| **Fixture** | `guestClient` |
| **Tags** | `@negative` |
| **Priority** | P1 |

**Preconditions**: no rooms.

**Test Data**: `roomId: 9999999`.

**Steps**: `POST /api/bookings`.

**Assertions**:
| Field | Expected |
|-------|----------|
| `res.status` | `404` |
| `res.body.message` | `"Room not found"` |

**Cleanup**: none.

---

#### TC-BC-07: Cannot book overlapping `confirmed` booking (409) @T2cfd1437

| Field | Value |
|-------|-------|
| **Fixture** | `guestClient` (2nd booking attempt by *same* guest) |
| **Tags** | `@edge @negative` |
| **Priority** | P0 |

**Preconditions**:
- room `roomA{ capacity: 2 }`.
- existing `confirmed` booking on `roomA` for `[+5d, +10d]`.

**Test Data**: same `roomA.id`, dates `[+7d, +9d]` (fully inside existing range).

**Steps**: `POST /api/bookings`.

**Assertions**:
| Field | Expected |
|-------|----------|
| `res.status` | `409` |
| `res.body.message` | `"Room is not available for selected dates"` |

**Stability**: overlap predicate `checkInDate <= checkOut AND checkOutDate >= checkIn` (`booking.controller.ts:55-66`).

**Cleanup**: 1 room + 1 pre-existing booking.

---

#### TC-BC-08: Group: Overlap edge cases (3 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Fixture** | `guestClient` |
| **Tags** | `@edge` |
| **Spec File** | `bookings-create.spec.ts` |
| **Preconditions** | room + existing `confirmed` booking on `[+5d, +10d]` |
| **Cleanup** | 1 room + 1 booking + (0 or 1) new booking |

**Per-Test Variants**:
| ID | Test Name | Test ID | New booking dates | Expected status |
|----|-----------|---------|-------------------|-----------------|
| BC-08a | Cannot book partial-overlap before existing (409) | @T3e0e2548 | `[+3d, +7d]` | 409 |
| BC-08b | Cannot book partial-overlap after existing (409) | @T4f1f3659 | `[+8d, +12d]` | 409 |
| BC-08c | Can book strictly adjacent (CRITICAL: ambiguous behaviour — see §9.3) | @T502f476a | `[+10d, +13d]` | **209 documented** — see §9.3 risk; expected = current behaviour pinned by test |

---

#### TC-BC-09: Can book on dates that overlap a `cancelled` booking @T6130587b

| Field | Value |
|-------|-------|
| **Fixture** | `guestClient` |
| **Tags** | `@edge` |
| **Priority** | P1 |

**Preconditions**: room + existing `cancelled` booking on `[+5d, +10d]`.

**Test Data**: dates `[+5d, +10d]` (fully overlapping).

**Steps**: `POST /api/bookings`.

**Assertions**:
| Field | Expected |
|-------|----------|
| `res.status` | `201` |
| `res.body.data.booking.status` | `"confirmed"` |

**Stability**: overlap excludes `cancelled` (status filter at `booking.controller.ts:58`).

**Cleanup**: 1 room + 2 bookings.

---

#### TC-BC-10: Anonymous cannot create booking (401) @T7241698c

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@negative @security` |
| **Priority** | P0 |

**Preconditions**: 1 room.

**Steps**: `POST /api/bookings` (no Authorization header).

**Assertions**:
| Field | Expected |
|-------|----------|
| `res.status` | `401` |
| `res.body.message` | `"No token provided. Please authenticate."` |

**Stability**: `router.use(authenticate)` at `booking.routes.ts:16`.

**Cleanup**: 1 room.

---

### 4.9 Bookings — List & Detail

#### TC-BL-01: Group: Booking list visibility by role (3 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Tags** | `@smoke` |
| **Spec File** | `bookings-read.spec.ts` |
| **Priority** | P0 |
| **Preconditions** | 2 guests `guest1`, `guest2`, 1 room each, 1 confirmed booking each (so 2 bookings total in DB) |
| **Steps** | `GET /api/bookings` with role's token |
| **Assertion shape** | `res.status === 200` + role-specific result count |
| **Stability** | `req.user.role === 'guest'` filter at `booking.controller.ts:124` |
| **Cleanup** | 2 guests + 2 rooms + 2 bookings |

**Per-Test Variants**:
| ID | Test Name | Test ID | Fixture | Expected `results` |
|----|-----------|---------|---------|---------------------|
| BL-01a | Guest sees only own bookings (results=1) | @T8352f99d | `guest1Client` | 1 |
| BL-01b | Admin sees all bookings (results=2) | @T9463faae | `adminClient` | 2 |
| BL-01c | Staff sees all bookings (results=2) | @Ta5740bbf | `staffClient` | 2 |

---

#### TC-BL-02: Booking list orders by `createdAt DESC` @Tb6851cc0

| Field | Value |
|-------|-------|
| **Fixture** | `adminClient` |
| **Tags** | `@edge` |
| **Priority** | P2 |

**Preconditions**: 3 bookings created with `await new Promise(r => setTimeout(r, 5))` between each (or via `prisma.booking.create` with explicit `createdAt: subDays(now, n)`).

**Steps**: `GET /api/bookings`.

**Assertions**:
| Field | Expected |
|-------|----------|
| `res.body.data.bookings[0].createdAt` | greater than `[1].createdAt` |
| `res.body.data.bookings[1].createdAt` | greater than `[2].createdAt` |

**Stability**: `orderBy: { createdAt: 'desc' }` at `booking.controller.ts:136`.

**Cleanup**: 3 bookings.

---

#### TC-BL-03: Anonymous cannot list bookings (401) @Tc7962dd1

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@negative @security` |
| **Priority** | P0 |

**Preconditions**: none.

**Steps**: `GET /api/bookings` (no Auth).

**Assertions**: `res.status === 401`, `res.body.message === "No token provided. Please authenticate."`.

**Cleanup**: none.

---

#### TC-BD-01: Group: Booking detail visibility by role (5 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Tags** | `@smoke` for happy paths, `@negative` for forbidden |
| **Spec File** | `bookings-read.spec.ts` |
| **Preconditions** | guest1's booking `bookingX{ id }`, guest2 also exists |
| **Steps** | `GET /api/bookings/${bookingX.id}` with role's token |
| **Cleanup** | 2 guests + 1 room + 1 booking |

**Per-Test Variants**:
| ID | Test Name | Test ID | Fixture | Expected status | Expected message |
|----|-----------|---------|---------|------|-----------------|
| BD-01a | Owner guest can view own booking (200) | @Td8a73ee2 | `guest1Client` | 200 | `data.booking.id === bookingX.id` |
| BD-01b | Other guest cannot view another's booking (403) | @Te9b84ff3 | `guest2Client` | 403 | `"You can only view your own bookings"` |
| BD-01c | Admin can view any booking (200) | @T0fc95004 | `adminClient` | 200 | data shape matches |
| BD-01d | Staff can view any booking (200) | @T10da6115 | `staffClient` | 200 | data shape matches |
| BD-01e | Anonymous cannot view booking (401) | @T21eb7226 | `anonClient` | 401 | no-token msg |

---

#### TC-BD-02: Group: Booking detail not-found cases (2 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Fixture** | `adminClient` |
| **Tags** | `@negative @edge` |
| **Spec File** | `bookings-read.spec.ts` |
| **Preconditions** | none |
| **Steps** | `GET /api/bookings/<id>` with admin token |
| **Cleanup** | none |

**Per-Test Variants**:
| ID | Test Name | Test ID | Path | Expected status |
|----|-----------|---------|------|------|
| BD-02a | Returns 404 for non-existent booking ID | @T32fc8337 | `/api/bookings/9999999` | 404 |
| BD-02b | Returns 404 for non-numeric booking ID | @T440d9448 | `/api/bookings/foo`     | 404 |

---

### 4.10 Bookings — Update & Cancel

#### TC-BU-01: Owner guest can update own booking @T551ea559

| Field | Value |
|-------|-------|
| **Fixture** | `guestClient` |
| **Tags** | `@smoke` |
| **Spec File** | `bookings-update-cancel.spec.ts` |
| **Priority** | P0 |

**Preconditions**: own booking `bookingX{ specialRequests: null, numberOfGuests: 1 }`.

**Test Data**: `{ specialRequests: "Vegan meal", numberOfGuests: 2 }`.

**Steps**: `PUT /api/bookings/${bookingX.id}`.

**Assertions**:
| Field | Expected |
|-------|----------|
| `res.status` | `200` |
| `res.body.data.booking.specialRequests` | `"Vegan meal"` |
| `res.body.data.booking.numberOfGuests` | `2` |

**Stability**: `prisma.booking.update` is atomic; afterEach deterministic.

**Cleanup**: 1 booking.

---

#### TC-BU-02: Group: Booking update auth/visibility (4 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Tags** | `@negative` for failure variants; `@smoke` for admin happy path |
| **Spec File** | `bookings-update-cancel.spec.ts` |
| **Preconditions** | guest1 booking `bookingX`, guest2 also exists |
| **Steps** | `PUT /api/bookings/${bookingX.id}` with `{ specialRequests: 'updated' }` |
| **Cleanup** | as TC-BU-01 |

**Per-Test Variants**:
| ID | Test Name | Test ID | Fixture | Status | Body check |
|----|-----------|---------|---------|--------|--------|
| BU-02a | Other guest cannot update another's booking (403) | @T662fb66a | `guest2Client` | 403 | `"You can only update your own bookings"` |
| BU-02b | Admin can update any booking (200) | @T7730c77b | `adminClient` | 200 | updated value reflected |
| BU-02c | Staff can update any booking (200) | @T8841d88c | `staffClient` | 200 | updated value reflected |
| BU-02d | Anonymous cannot update booking (401) | @T9952e99d | `anonClient` | 401 | no-token msg |

---

#### TC-BU-03: Update returns 404 for non-existent booking ID @TaA631fae

| Field | Value |
|-------|-------|
| **Fixture** | `adminClient` |
| **Tags** | `@negative @edge` |
| **Priority** | P2 |

**Preconditions**: none.

**Steps**: `PUT /api/bookings/9999999` with valid body.

**Assertions**: `res.status === 404`, `res.body.message === "Booking not found"`.

**Cleanup**: none.

---

#### TC-BCancel-01: Group: Cancel booking happy paths (2 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Tags** | `@smoke` |
| **Spec File** | `bookings-update-cancel.spec.ts` |
| **Preconditions** | own booking `bookingX{ status: 'confirmed' }` |
| **Steps** | `DELETE /api/bookings/${bookingX.id}` |
| **Cleanup** | 1 booking (status changed, not deleted) |

**Per-Test Variants**:
| ID | Test Name | Test ID | Fixture | Status | Body check |
|----|-----------|---------|---------|--------|--------|
| BCancel-01a | Owner guest can cancel own confirmed booking (200) | @TbB7430bf | `guestClient` | 200 | `data.booking.status === 'cancelled'`, `message === 'Booking cancelled successfully'` |
| BCancel-01b | Admin can cancel any booking (200) | @TcC85431c | `adminClient` | 200 | `data.booking.status === 'cancelled'` |

---

#### TC-BCancel-02: Group: Cancel booking forbidden state-transitions (3 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Fixture** | `guestClient` (own booking) |
| **Tags** | `@negative @edge` |
| **Spec File** | `bookings-update-cancel.spec.ts` |
| **Preconditions** | own booking with given starting status |
| **Steps** | `DELETE /api/bookings/${bookingX.id}` |
| **Stability** | per `booking.controller.ts:269-275` (state-machine guard) |
| **Cleanup** | 1 booking |

**Per-Test Variants**:
| ID | Test Name | Test ID | Initial status | Expected status | Expected message |
|----|-----------|---------|----------------|------|------|
| BCancel-02a | Cannot cancel already-cancelled booking (400) | @TdD96542d | `cancelled` | 400 | `"Booking cannot be cancelled because it is cancelled"` |
| BCancel-02b | Cannot cancel checked-in booking (400) | @TeEa7653e | `checked_in` | 400 | `"Booking cannot be cancelled because it is checked in"` (note: underscore replaced) |
| BCancel-02c | Cannot cancel checked-out booking (400) | @TfFb8764f | `checked_out` | 400 | `"Booking cannot be cancelled because it is checked out"` |

---

#### TC-BCancel-03: Other guest cannot cancel another's booking (403) @T00c98750

| Field | Value |
|-------|-------|
| **Fixture** | `guest2Client` |
| **Tags** | `@negative @security` |
| **Priority** | P0 |

**Preconditions**: guest1 owns `bookingX{ status: 'confirmed' }`; guest2 also exists.

**Steps**: `DELETE /api/bookings/${bookingX.id}` with guest2 token.

**Assertions**:
| Field | Expected |
|-------|----------|
| `res.status` | `403` |
| `res.body.message` | `"You can only cancel your own bookings"` |
| **DB**: `bookingX.status` | still `"confirmed"` (unchanged) |

**Stability**: per `booking.controller.ts:256-266`.

**Cleanup**: 2 guests + 1 room + 1 booking.

---

#### TC-BCancel-04: Cancel returns 404 for non-existent / non-numeric ID (2 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Fixture** | `adminClient` |
| **Tags** | `@negative @edge` |
| **Cleanup** | none |

**Per-Test Variants**:
| ID | Test Name | Test ID | Path | Status |
|----|-----------|---------|------|------|
| BCancel-04a | Cancel returns 404 for non-existent ID | @T11dafa61 | `/api/bookings/9999999` | 404 |
| BCancel-04b | Cancel returns 404 for non-numeric ID | @T22ebab72 | `/api/bookings/abc` | 404 |

---

#### TC-BCancel-05: Anonymous cannot cancel booking (401) @T33fcbc83

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@negative @security` |

**Preconditions**: 1 booking exists.

**Steps**: `DELETE /api/bookings/${id}` (no Auth).

**Assertions**: `res.status === 401`, no-token msg.

**Cleanup**: 1 booking (untouched).

---

### 4.11 Bookings — Check-in / Check-out

#### TC-BCI-01: Group: Authorized roles can check in `confirmed` booking (2 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Tags** | `@smoke` |
| **Spec File** | `bookings-checkin-checkout.spec.ts` |
| **Preconditions** | 1 booking `bookingX{ status: 'confirmed' }` |
| **Steps** | `POST /api/bookings/${bookingX.id}/check-in` |
| **Cleanup** | 1 booking (status changes to `checked_in`) |

**Per-Test Variants**:
| ID | Test Name | Test ID | Fixture | Status | Body check |
|----|-----------|---------|---------|--------|-------|
| BCI-01a | Admin can check in confirmed booking (200) | @T440dcd94 | `adminClient` | 200 | `data.booking.status === 'checked_in'`, `message === 'Guest checked in successfully'` |
| BCI-01b | Staff can check in confirmed booking (200) | @T551edea5 | `staffClient` | 200 | as above |

---

#### TC-BCI-02: Group: Check-in role/state failures (5 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Spec File** | `bookings-checkin-checkout.spec.ts` |
| **Tags** | `@negative` |
| **Preconditions** | 1 booking with given starting status |
| **Steps** | `POST /api/bookings/${bookingX.id}/check-in` |
| **Cleanup** | 1 booking |

**Per-Test Variants**:
| ID | Test Name | Test ID | Fixture | Initial status | Expected status | Expected message |
|----|-----------|---------|---------|---------------|------|------|
| BCI-02a | Anonymous cannot check in (401) | @T662fefb6 | `anon` | confirmed | 401 | no-token msg |
| BCI-02b | Guest cannot check in (403) | @T77300fc7 | `guest` | confirmed | 403 | permission msg |
| BCI-02c | Cannot check in already-checked-in booking (400) | @T884110d8 | `admin` | checked_in | 400 | `"Only confirmed bookings can be checked in"` |
| BCI-02d | Cannot check in cancelled booking (400) | @T995221e9 | `admin` | cancelled | 400 | as above |
| BCI-02e | Cannot check in pending booking (400) | @TaA63320a | `admin` | pending | 400 | as above |

---

#### TC-BCI-03: Check-in returns 404 for non-existent booking @TbB74431b

| Field | Value |
|-------|-------|
| **Fixture** | `adminClient` |
| **Tags** | `@negative` |

**Steps**: `POST /api/bookings/9999999/check-in`.

**Assertions**: `res.status === 404`, `res.body.message === "Booking not found"`.

**Cleanup**: none.

---

#### TC-BCO-01: Group: Authorized roles can check out `checked_in` booking (2 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Tags** | `@smoke` |
| **Preconditions** | 1 booking `bookingX{ status: 'checked_in' }` |
| **Steps** | `POST /api/bookings/${bookingX.id}/check-out` |
| **Cleanup** | 1 booking (status `checked_out`) |

**Per-Test Variants**:
| ID | Test Name | Test ID | Fixture | Status | Body check |
|----|-----------|---------|---------|--------|-----|
| BCO-01a | Admin can check out checked-in booking (200) | @TcC85542c | `adminClient` | 200 | `status === 'checked_out'`, `message === 'Guest checked out successfully'` |
| BCO-01b | Staff can check out checked-in booking (200) | @TdD96653d | `staffClient` | 200 | as above |

---

#### TC-BCO-02: Group: Check-out role/state failures (5 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Tags** | `@negative` |
| **Preconditions** | 1 booking with given starting status |
| **Steps** | `POST /api/bookings/${bookingX.id}/check-out` |
| **Cleanup** | 1 booking |

**Per-Test Variants**:
| ID | Test Name | Test ID | Fixture | Initial status | Expected status | Expected message |
|----|-----------|---------|---------|---------------|------|------|
| BCO-02a | Anonymous cannot check out (401) | @TeEa7764e | `anon` | checked_in | 401 | no-token msg |
| BCO-02b | Guest cannot check out (403) | @TfFb8875f | `guest` | checked_in | 403 | permission msg |
| BCO-02c | Cannot check out confirmed (not yet checked-in) (400) | @T00c99860 | `admin` | confirmed | 400 | `"Only checked-in bookings can be checked out"` |
| BCO-02d | Cannot check out already-checked-out booking (400) | @T11daa971 | `admin` | checked_out | 400 | as above |
| BCO-02e | Cannot check out cancelled booking (400) | @T22ebba82 | `admin` | cancelled | 400 | as above |

---

#### TC-BCO-03: Check-out returns 404 for non-existent booking @T33fccb93

| Field | Value |
|-------|-------|
| **Fixture** | `adminClient` |
| **Tags** | `@negative` |

**Steps**: `POST /api/bookings/9999999/check-out`.

**Assertions**: `res.status === 404`.

**Cleanup**: none.

---

### 4.12 Guests — Admin/Staff Endpoints

> **Visibility matrix** for §4.12 — pinned to `guest.routes.ts:13` (`router.use(authenticate, authorize('admin', 'staff'))`):
>
> | Actor          | List | Detail | Update | Bookings |
> |----------------|------|--------|--------|----------|
> | Anonymous      | 401  | 401    | 401    | 401      |
> | Guest          | 403  | 403    | 403    | 403      |
> | Staff          | 200  | 200    | 200    | 200      |
> | Admin          | 200  | 200    | 200    | 200      |

#### TC-GL-01: Group: Authorized list-guests succeeds for admin/staff (2 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Tags** | `@smoke` |
| **Spec File** | `guests.spec.ts` |
| **Preconditions** | 3 guests + 1 admin + 1 staff exist |
| **Steps** | `GET /api/guests` |
| **Assertions** | `res.status === 200`, `res.body.results === 3` (only `role: guest`), every returned `guest.role === 'guest'`, no `password` field on any |
| **Stability** | per `guest.controller.ts:7-15` (filters role + projects out password) |
| **Cleanup** | 5 users |

**Per-Test Variants**:
| ID | Test Name | Test ID | Fixture |
|----|-----------|---------|---------|
| GL-01a | Admin can list all guests | @T440ddca4 | `adminClient` |
| GL-01b | Staff can list all guests | @T551eedb5 | `staffClient` |

---

#### TC-GL-02: Group: List-guests forbidden / unauthenticated (2 tests)

**Per-Test Variants**:
| ID | Test Name | Test ID | Fixture | Expected status | Expected message |
|----|-----------|---------|---------|------|------|
| GL-02a | Anonymous cannot list guests (401) | @T662ffec6 | `anon` | 401 | no-token msg |
| GL-02b | Guest cannot list guests (403) | @T77300fd7 | `guest` | 403 | permission msg |

---

#### TC-GL-03: List-guests returns empty array when no `guest`-role users exist @T884110e8

| Field | Value |
|-------|-------|
| **Fixture** | `adminClient` |
| **Tags** | `@edge` |

**Preconditions**: only admin user exists; no guests, no staff.

**Steps**: `GET /api/guests`.

**Assertions**: `res.status === 200`, `res.body.results === 0`, `data.guests === []`.

**Cleanup**: 1 user.

---

#### TC-GD-01: Group: Get guest by ID — happy paths (2 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Tags** | `@smoke` |
| **Preconditions** | 1 guest `guestA` + admin + staff |
| **Steps** | `GET /api/guests/${guestA.id}` |
| **Cleanup** | as Preconditions |

**Per-Test Variants**:
| ID | Test Name | Test ID | Fixture | Body check |
|----|-----------|---------|---------|--------|
| GD-01a | Admin can get guest by ID (200) | @T995221f9 | `adminClient` | `data.guest.id === guestA.id`, no password |
| GD-01b | Staff can get guest by ID (200) | @TaA63330a | `staffClient` | as above |

---

#### TC-GD-02: Group: Get guest by ID — error/not-found cases (4 tests)

**Per-Test Variants**:
| ID | Test Name | Test ID | Fixture | Path | Status | Body |
|----|-----------|---------|---------|------|--------|------|
| GD-02a | Anonymous cannot get guest (401) | @TbB74441b | `anon` | `/api/guests/${guestA.id}` | 401 | no-token msg |
| GD-02b | Guest cannot use endpoint (403) | @TcC85552c | `guest` | `/api/guests/${guestA.id}` | 403 | permission msg |
| GD-02c | Returns 404 for non-existent ID | @TdD96663d | `admin` | `/api/guests/9999999` | 404 | `"Guest not found"` |
| GD-02d | Returns 404 when ID resolves to admin user (role-filtered) | @TeEa7774e | `admin` | `/api/guests/${admin.id}` | 404 | `"Guest not found"` |

---

#### TC-GU-01: Admin can update guest profile @TfFb8885f

| Field | Value |
|-------|-------|
| **Fixture** | `adminClient` |
| **Tags** | `@smoke` |

**Preconditions**: 1 guest `guestA{ firstName: "Old", lastName: "Name", phone: "111" }`.

**Test Data**: `{ firstName: "New", lastName: "Surname", phone: "999", address: { city: "Boston" } }`.

**Steps**: `PUT /api/guests/${guestA.id}`.

**Assertions**:
| Field | Expected |
|-------|----------|
| `res.status` | `200` |
| `res.body.data.guest.firstName` | `"New"` |
| `res.body.data.guest.city` | `"Boston"` |
| **DB**: `dbGuest.firstName` | `"New"` |
| `res.body.data.guest.password` | `toBeUndefined()` |

**Cleanup**: 1 guest.

---

#### TC-GU-02: Group: Update-guest forbidden / not-found cases (4 tests)

**Per-Test Variants**:
| ID | Test Name | Test ID | Fixture | Path | Status |
|----|-----------|---------|---------|------|------|
| GU-02a | Anonymous cannot update guest (401) | @T00c99970 | `anon` | `${guestA.id}` | 401 |
| GU-02b | Guest cannot use endpoint (403) | @T11daaa81 | `guest` | `${guestA.id}` | 403 |
| GU-02c | Staff can update guest (200) | @T22ebbb92 | `staff` | `${guestA.id}` | 200 |
| GU-02d | Returns 404 for non-existent guest ID | @T33fccca3 | `admin` | `9999999` | 404 |

---

#### TC-GB-01: Group: Get guest's bookings (5 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Spec File** | `guests.spec.ts` |
| **Preconditions** | guestA with 2 confirmed bookings; guestB with 0 bookings |
| **Steps** | `GET /api/guests/${id}/bookings` |
| **Cleanup** | 2 guests + 2 rooms + 2 bookings |

**Per-Test Variants**:
| ID | Test Name | Test ID | Fixture | Path | Expected status | Expected results |
|----|-----------|---------|---------|------|------|------|
| GB-01a | Admin can get guestA's 2 bookings (200) | @T440dddb4 | `admin` | `${guestA.id}/bookings` | 200 | 2 |
| GB-01b | Staff can get guestA's 2 bookings (200) | @T551eeec5 | `staff` | `${guestA.id}/bookings` | 200 | 2 |
| GB-01c | Returns empty array for guest with no bookings | @T662fffd6 | `admin` | `${guestB.id}/bookings` | 200 | 0 |
| GB-01d | Anonymous cannot use endpoint (401) | @T77300fe7 | `anon` | `${guestA.id}/bookings` | 401 | — |
| GB-01e | Guest cannot use endpoint (403) | @T884110f8 | `guest` | `${guestA.id}/bookings` | 403 | — |

---

### 4.13 Cross-Cutting Middleware

#### TC-XC-01: `authenticate` rejects negative `userId` claim with 401 @T9952210a

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` (uses helper `signTokenWithCustomPayload`) |
| **Tags** | `@negative @security @edge` |
| **Spec File** | `cross-cutting.spec.ts` |
| **Priority** | P1 |

**Preconditions**: any one user exists.

**Test Data**: token signed with payload `{ userId: -1 }`.

**Steps**: `GET /api/auth/me` with this token.

**Assertions**:
| Field | Expected |
|-------|----------|
| `res.status` | `401` |
| `res.body.message` | `"Invalid token. User not found."` |

**Stability**: per `middleware/auth.ts:42-48` (`decoded.userId <= 0` guard).

**Cleanup**: 1 user.

---

#### TC-XC-02: `authenticate` rejects token with `userId: 0` (zero) with 401 @TaA63321b

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@negative @edge` |

**Steps**: `GET /api/auth/me` with token `{ userId: 0 }`.

**Assertions**: `res.status === 401`, `message === "Invalid token. User not found."`.

**Cleanup**: none.

---

#### TC-XC-03: `authenticate` rejects token signed with wrong secret @TbB74432c

| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@negative @security` |

**Test Data**: token signed via `jwt.sign({ userId: 1 }, 'WRONG-SECRET')`.

**Steps**: `GET /api/auth/me`.

**Assertions**: `res.status === 401`, `message === "Invalid token."`.

**Stability**: `JsonWebTokenError → invalid signature` per `middleware/auth.ts:67-72`.

**Cleanup**: none.

---

#### TC-XC-04: `errorHandler` converts Prisma `P2002` to 409 conflict envelope @TcC85543d

| Field | Value |
|-------|-------|
| **Fixture** | `adminClient` |
| **Tags** | `@edge` |
| **Priority** | P2 |

**Preconditions**: pre-existing user `dup-target@test.local`.

**Test Data**: register payload with same email — but routed via a controller that does NOT pre-check (as of writing, `register` already pre-checks; the unique-constraint path is reached by another endpoint **only** when admin attempts to update guest with another's email; that endpoint does not currently exist). **This test STUBs the cross-cutting `errorHandler` P2002 branch via a deliberately-failing room-create with duplicate `roomNumber` going through the central handler.**

> **NOTE**: `room.controller.ts` actually catches P2002 directly (its own try/catch returns 409 with `"Room already exists"`). The shared `errorHandler` P2002 branch (`errorHandler.ts:28-36` returning `"<field> already exists"`) is currently **unreached by any controller**. Marked **🚧 BLOCKED** in §17.4 — needs a controller that uses `asyncHandler` and re-throws.

**Status**: 🚧 BLOCKED.

---

#### TC-XC-05: `errorHandler` converts Prisma `P2025` to 404 envelope @TdD96654e

| Field | Value |
|-------|-------|
| **Fixture** | `adminClient` |
| **Tags** | `@edge` |
| **Status** | 🚧 BLOCKED — same reasoning as TC-XC-04 (no controller currently uses `asyncHandler` to forward errors to global handler) |

---

#### TC-XC-06: 404 handler envelope shape consistent across HTTP verbs (4 tests)

**Shared Specification**:
| Field | Value |
|-------|-------|
| **Fixture** | `anonClient` |
| **Tags** | `@negative @edge` |
| **Spec File** | `cross-cutting.spec.ts` |
| **Steps** | request to unknown path with given verb |
| **Assertions** | `res.status === 404`, `res.body === { status: 'error', message: 'Route not found' }` |
| **Cleanup** | none |

**Per-Test Variants**:
| ID | Test Name | Test ID | Verb | Path |
|----|-----------|---------|------|------|
| XC-06a | GET unknown route returns 404 envelope | @TeEa7765f | GET | `/no-such-path` |
| XC-06b | POST unknown route returns 404 envelope | @TfFb88770 | POST | `/no-such-path` |
| XC-06c | PUT unknown route returns 404 envelope | @T00c99881 | PUT | `/no-such-path` |
| XC-06d | DELETE unknown route returns 404 envelope | @T11daaa92 | DELETE | `/no-such-path` |

---

#### TC-XC-07: All `error` envelopes have shape `{ status: "error", message: string }` (sweep) @T22ebbba3

| Field | Value |
|-------|-------|
| **Tags** | `@contract @edge` |
| **Priority** | P2 |

**Preconditions**: a representative request producing each error code (401, 403, 404, 409, 400).

**Steps**: trigger 5 error responses (one per code) by composing minimal failing requests; collect responses.

**Assertions** (for every collected `res`):
| Locator | Expected |
|---------|----------|
| `res.body.status` | `"error"` |
| `typeof res.body.message` | `"string"` |
| `res.body.message.length` | `> 0` |
| `res.body.password` | `undefined` |
| `res.body.stack` | `undefined` (NODE_ENV=test, not 'development') |

**Stability**: enforces the **API error envelope contract**.

**Cleanup**: per sub-request.

---

#### TC-XC-08: All `success` envelopes have shape `{ status: "success", ... }` (sweep) @T33fccca4

| Field | Value |
|-------|-------|
| **Tags** | `@contract` |
| **Priority** | P2 |

**Steps**: trigger 5 representative success responses (`/health`, `/api/rooms`, register, login, get-room-by-id).

**Assertions** (for every `res`):
| Locator | Expected |
|---------|----------|
| `res.body.status` | `"success"` |
| `res.status` | `200 \| 201` |
| collection responses | have `results: number` AND `data: object` |
| singleton responses | have `data: object` |

**Cleanup**: as setup.

---

## 5. Shared Preconditions & beforeAll Setup

### 5.1 Global setup (`tests/setup.ts` — already exists, reused)

```typescript
import 'dotenv/config';
import prisma from '../src/utils/prismaClient';

beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key-for-testing';
    process.env.NODE_ENV = 'test';
    await prisma.$connect();
});

afterAll(async () => {
    await prisma.$disconnect();
});

afterEach(async () => {
    await prisma.booking.deleteMany({});
    await prisma.room.deleteMany({});
    await prisma.user.deleteMany({});
});
```

> **Note**: `setup.ts` is **shared with unit tests**. Do NOT modify; instead add API-test-specific helpers in `backend/tests/api/helpers/`.

### 5.2 Per-spec actor factory (`fixtures/createActor.ts`)

```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../../../src/server';
import prisma from '../../../src/utils/prismaClient';
import { AuthApi } from '../clients/AuthApi';
import { RoomApi } from '../clients/RoomApi';
import { BookingApi } from '../clients/BookingApi';
import { GuestApi } from '../clients/GuestApi';

export type Role = 'guest' | 'admin' | 'staff';

export interface AuthorizedClient {
    user: { id: number; email: string; role: Role; firstName: string; lastName: string; phone: string };
    token: string;
    auth: AuthApi;
    room: RoomApi;
    booking: BookingApi;
    guest: GuestApi;
}

export interface AnonClient {
    auth: AuthApi;
    room: RoomApi;
}

export const createActor = async (role: Role): Promise<AuthorizedClient> => {
    const email = `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;
    const password = await bcrypt.hash('correct-password', 10);
    const user = await prisma.user.create({
        data: { email, password, role, firstName: 'Test', lastName: role.toUpperCase(), phone: '+15550000' },
    });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    const r = request(app);
    return {
        user: { id: user.id, email: user.email, role, firstName: user.firstName, lastName: user.lastName, phone: user.phone },
        token,
        auth: new AuthApi(r, token),
        room: new RoomApi(r, token),
        booking: new BookingApi(r, token),
        guest: new GuestApi(r, token),
    };
};

export const anonClient = (): AnonClient => {
    const r = request(app);
    return { auth: new AuthApi(r), room: new RoomApi(r) };
};
```

### 5.3 Pattern: per-test setup for booking suites

```typescript
let guest: AuthorizedClient;
let admin: AuthorizedClient;
let staff: AuthorizedClient;
let roomA: { id: number; pricePerNight: number; capacity: number; roomNumber: string };

beforeEach(async () => {
    guest = await createActor('guest');
    admin = await createActor('admin');
    staff = await createActor('staff');
    roomA = await prisma.room.create({
        data: { roomNumber: `R-${Date.now()}`, type: 'double', capacity: 4, pricePerNight: 100, amenities: [], description: 'test' },
    });
});
// afterEach inherited from tests/setup.ts → truncates everything
```

> Use `beforeEach` (NOT `beforeAll`) because the global `afterEach` truncates all tables. Sharing entities across tests in this suite is incompatible with the existing `setup.ts`.

### 5.4 ApiClient skeleton (one per resource — SOLID)

```typescript
// clients/BaseApiClient.ts
import type { Test, SuperTest } from 'supertest';

export abstract class BaseApiClient {
    constructor(protected request: SuperTest<Test>, protected token?: string) {}
    protected withAuth<T extends Test>(req: T): T {
        if (this.token) req.set('Authorization', `Bearer ${this.token}`);
        return req;
    }
}

// clients/RoomApi.ts (example)
import { BaseApiClient } from './BaseApiClient';

export interface CreateRoomInput { roomNumber: string; type?: string; capacity?: number; pricePerNight: number; description: string; amenities?: string[]; status?: string; }

export class RoomApi extends BaseApiClient {
    list(query: Record<string, string | number> = {}) { return this.withAuth(this.request.get('/api/rooms').query(query)); }
    detail(id: number | string) { return this.withAuth(this.request.get(`/api/rooms/${id}`)); }
    search(query: Record<string, string | number> = {}) { return this.withAuth(this.request.get('/api/rooms/search').query(query)); }
    create(body: CreateRoomInput) { return this.withAuth(this.request.post('/api/rooms').send(body)); }
    update(id: number, body: Partial<CreateRoomInput>) { return this.withAuth(this.request.put(`/api/rooms/${id}`).send(body)); }
    remove(id: number) { return this.withAuth(this.request.delete(`/api/rooms/${id}`)); }
}
```

> **SOLID compliance**:
> - **S**ingle Responsibility: each `XxxApi` only knows endpoints under `/api/xxx/*`.
> - **O**pen-Closed: extend via subclass for variants (e.g. an `AdminBookingApi` that wraps the base with admin-only endpoints).
> - **L**iskov: every method returns a `supertest.Test` — substitutable.
> - **I**nterface Segregation: `anonClient` does NOT receive `BookingApi` / `GuestApi` (they require auth).
> - **D**ependency Inversion: tests depend on `RoomApi`, not on `request(app)` directly.

---

## 6. Resolved Endpoints & Response Catalog

> Equivalent to §14.4 Resolved Locators Catalog in the planning standard. **Verified On**: 2026-04-29 by reading `backend/src/routes/*.ts` and `backend/src/controllers/*.ts`.

### 6.1 Endpoints

| ApiClient method | Verb | Path | Auth required | Required role(s) | Source |
|------------------|------|------|---------------|------------------|--------|
| `(top-level)` | GET | `/health` | no | — | `server.ts:51` |
| (404 fallthrough) | * | `*` (unknown) | no | — | `server.ts:69` |
| `auth.register(body)` | POST | `/api/auth/register` | no | — | `auth.routes.ts:69` |
| `auth.login(body)` | POST | `/api/auth/login` | no | — | `auth.routes.ts:112` |
| `auth.me()` | GET | `/api/auth/me` | yes | any | `auth.routes.ts:141` |
| `room.list(q)` | GET | `/api/rooms` | no | — | `room.routes.ts:59` |
| `room.search(q)` | GET | `/api/rooms/search` | no | — | `room.routes.ts:103` |
| `room.detail(id)` | GET | `/api/rooms/:id` | no | — | `room.routes.ts:136` |
| `room.create(body)` | POST | `/api/rooms` | yes | `admin` | `room.routes.ts:173` |
| `room.update(id, body)` | PUT | `/api/rooms/:id` | yes | `admin` | `room.routes.ts:218` |
| `room.remove(id)` | DELETE | `/api/rooms/:id` | yes | `admin` | `room.routes.ts:250` |
| `booking.create(body)` | POST | `/api/bookings` | yes | any (effectively guest+) | `booking.routes.ts:71` |
| `booking.list()` | GET | `/api/bookings` | yes | any | `booking.routes.ts:103` |
| `booking.detail(id)` | GET | `/api/bookings/:id` | yes | any (own for guest) | `booking.routes.ts:142` |
| `booking.update(id, body)` | PUT | `/api/bookings/:id` | yes | any (own for guest) | `booking.routes.ts:195` |
| `booking.cancel(id)` | DELETE | `/api/bookings/:id` | yes | any (own for guest) | `booking.routes.ts:234` |
| `booking.checkIn(id)` | POST | `/api/bookings/:id/check-in` | yes | `admin`, `staff` | `booking.routes.ts:275` |
| `booking.checkOut(id)` | POST | `/api/bookings/:id/check-out` | yes | `admin`, `staff` | `booking.routes.ts:316` |
| `guest.list()` | GET | `/api/guests` | yes | `admin`, `staff` | `guest.routes.ts:53` |
| `guest.detail(id)` | GET | `/api/guests/:id` | yes | `admin`, `staff` | `guest.routes.ts:92` |
| `guest.update(id, body)` | PUT | `/api/guests/:id` | yes | `admin`, `staff` | `guest.routes.ts:149` |
| `guest.bookings(id)` | GET | `/api/guests/:id/bookings` | yes | `admin`, `staff` | `guest.routes.ts:188` |

### 6.2 Response envelope shapes (canonical)

```typescript
// data envelope (singleton)
type SuccessSingleton<T> = { status: 'success'; message?: string; data: T };

// data envelope (collection)
type SuccessCollection<T> = { status: 'success'; results: number; data: T };

// error envelope
type ErrorEnvelope = { status: 'error'; message: string };
```

### 6.3 Error message catalog (verified strings)

| Code | Message | Source (file:line) |
|------|---------|----|
| 401 | `"No token provided. Please authenticate."` | `auth.ts:23` |
| 401 | `"Invalid token."` | `auth.ts:71` |
| 401 | `"Token has expired."` | `auth.ts:78` |
| 401 | `"Invalid token. User not found."` | `auth.ts:46, 58` |
| 401 | `"Authentication required."` | `auth.ts:96` |
| 401 | `"Invalid email or password"` | `auth.controller.ts:111, 122` |
| 401 | `"Not authenticated"` | `auth.controller.ts:171` |
| 400 | `"Please provide email and password"` | `auth.controller.ts:100` |
| 400 | `"Number of guests must be at least 1"` | `booking.controller.ts:26` |
| 400 | `"Room capacity is N guests"` | `booking.controller.ts:34` |
| 400 | `"Check-in date cannot be in the past"` | `booking.controller.ts:46` |
| 400 | `"Check-out date must be after check-in date"` | `booking.controller.ts:51` |
| 400 | `"Booking cannot be cancelled because it is <status>"` | `booking.controller.ts:272` |
| 400 | `"Only confirmed bookings can be checked in"` | `booking.controller.ts:308` |
| 400 | `"Only checked-in bookings can be checked out"` | `booking.controller.ts:345` |
| 403 | `"You do not have permission to access this resource."` | `auth.ts:103` |
| 403 | `"You can only view your own bookings"` | `booking.controller.ts:182` |
| 403 | `"You can only update your own bookings"` | `booking.controller.ts:218` |
| 403 | `"You can only cancel your own bookings"` | `booking.controller.ts:263` |
| 404 | `"Room not found"` | `room.controller.ts:41, 49, 154, 170, 187, 200` |
| 404 | `"Booking not found"` | `booking.controller.ts:21, 157, 171, 201, 207, 246, 252, 302, 339` |
| 404 | `"Guest not found"` | `guest.controller.ts:62, 122` |
| 404 | `"Route not found"` | `server.ts:72` |
| 409 | `"User with this email already exists"` | `auth.controller.ts:30` |
| 409 | `"Room already exists"` | `room.controller.ts:138` |
| 409 | `"Room is not available for selected dates"` | `booking.controller.ts:71` |

> **Re-verify** if controllers are refactored to use `asyncHandler` + `errorHandler` (currently each controller has its own try/catch).

---

## 7. Data & Configuration

### 7.1 Test data conventions

- **Email uniqueness**: `${role}-${Date.now()}-${random}@test.local`. Domain `@test.local` ensures no real email is contacted.
- **Phone**: `+1555` + 4 digits. No real PII.
- **Room number**: `R-${Date.now()}` or `${role}-TEST-${Date.now()}`. Unique-constrained, so timestamp suffix prevents collisions.
- **Dates** (helper):
  ```typescript
  // helpers/dateHelpers.ts
  export const daysFromNow = (n: number): Date => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(12, 0, 0, 0); return d; };
  export const past = (): Date => daysFromNow(-1);
  export const tomorrow = (): Date => daysFromNow(1);
  ```
  Always use `daysFromNow(n)` — never hard-code dates that may go stale.
- **Money**: integer or 2-decimal float; total-price assertions use exact equality (no float-tolerance because `nights × price` is integer-exact for our test prices).
- **JWT helpers**:
  ```typescript
  // helpers/jwtHelpers.ts
  export const signTokenAs = (userId: number) => jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  export const signExpiredToken = (userId: number) => jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '-1s' });
  export const signTokenWithSecret = (userId: number, secret: string) => jwt.sign({ userId }, secret, { expiresIn: '1h' });
  export const signTokenWithCustomPayload = (payload: object) => jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });
  ```

### 7.2 Required helper functions

| Function | File | Status | Notes |
|----------|------|--------|-------|
| `createActor(role)` | `fixtures/createActor.ts` | ⚠️ TO CREATE | Builds user + token + ApiClients |
| `anonClient()` | `fixtures/createActor.ts` | ⚠️ TO CREATE | Token-less client bundle |
| `signExpiredToken(userId)` | `helpers/jwtHelpers.ts` | ⚠️ TO CREATE | Used in TC-AM-03 |
| `signTokenWithCustomPayload(payload)` | `helpers/jwtHelpers.ts` | ⚠️ TO CREATE | Used in TC-XC-01, TC-XC-02 |
| `daysFromNow(n)` | `helpers/dateHelpers.ts` | ⚠️ TO CREATE | All booking-create tests |
| `expectErrorEnvelope(res, status, message)` | `helpers/envelope.ts` | ⚠️ TO CREATE | Shorthand for negative-test assertions |
| `expectSuccessEnvelope(res, status)` | `helpers/envelope.ts` | ⚠️ TO CREATE | Shorthand for positive-test assertions |
| `roomFactory.build(overrides?)` | `data/roomFactory.ts` | ⚠️ TO CREATE | Test-room data with sensible defaults |
| `bookingPayload(overrides?)` | `data/bookingFactory.ts` | ⚠️ TO CREATE | Booking payload builder |
| `userPayload(overrides?)` | `data/userFactory.ts` | ⚠️ TO CREATE | Register payload builder |

### 7.3 Required ApiClient methods (one class per resource)

| Class | Methods | File | Status |
|-------|---------|------|--------|
| `BaseApiClient` | `withAuth(req)` | `clients/BaseApiClient.ts` | ⚠️ TO CREATE |
| `AuthApi` | `register`, `login`, `me` | `clients/AuthApi.ts` | ⚠️ TO CREATE |
| `RoomApi` | `list`, `search`, `detail`, `create`, `update`, `remove` | `clients/RoomApi.ts` | ⚠️ TO CREATE |
| `BookingApi` | `create`, `list`, `detail`, `update`, `cancel`, `checkIn`, `checkOut` | `clients/BookingApi.ts` | ⚠️ TO CREATE |
| `GuestApi` | `list`, `detail`, `update`, `bookings` | `clients/GuestApi.ts` | ⚠️ TO CREATE |

### 7.4 Type definitions

```typescript
// clients/types.ts
export type Role = 'guest' | 'admin' | 'staff';
export type RoomType = 'single' | 'double' | 'suite' | 'deluxe' | 'presidential';
export type RoomStatus = 'available' | 'occupied' | 'maintenance';
export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

export interface RegisterInput {
    email: string;
    password: string;
    profile: { firstName: string; lastName: string; phone: string; address?: { street?: string; city?: string; state?: string; country?: string; zipCode?: string; } };
}
export interface LoginInput { email: string; password: string; }
export interface CreateBookingInput { roomId: number; checkInDate: string; checkOutDate: string; numberOfGuests: number; specialRequests?: string; }
export interface CreateRoomInput { roomNumber: string; type?: RoomType; capacity?: number; pricePerNight: number; description: string; amenities?: string[]; photos?: string[]; status?: RoomStatus; }
```

### 7.5 Constants

```typescript
// helpers/constants.ts
export const TEST_EMAIL_DOMAIN = '@test.local';
export const DEFAULT_PASSWORD_PLAIN = 'correct-password';
export const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{1,2}\$/;
export const JWT_REGEX = /^[\w-]+\.[\w-]+\.[\w-]+$/;
export const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
export const DEFAULT_ROOM_PRICE = 100;
```

---

## 8. Stability Contract

### 8.1 Shared vs. isolated entities

| Entity | Scope | Lifetime | Why |
|--------|-------|----------|-----|
| `app` (Express instance) | Whole test run | imported once in each spec file | Serializing across tests would impose overhead with no benefit — Express stateless on `app` itself |
| Prisma client | Whole test run | `beforeAll`/`afterAll` in `tests/setup.ts` | Single connection pool reused |
| Users / Rooms / Bookings | **Per-test** (`beforeEach`) | created in test or `beforeEach`; truncated in shared `afterEach` | The existing `tests/setup.ts` truncates all tables after every test → cannot share entities across tests in the same file |

> ⚠️ **No cross-test entity reuse** — adapt `tests/setup.ts` truncation strategy is OUT OF SCOPE for this plan. If shared `beforeAll` data is desired for a future iteration, change tracking: KOM-API-001 (see §9.5).

### 8.2 Wait strategies used

| Pattern | When to use | Example |
|---------|-------------|---------|
| `await client.x.method(...)` | Every API call | supertest already awaits the HTTP response |
| `await prisma.x.findUnique(...)` | DB verification step (post-action) | After mutating endpoint, verify DB state |
| (none — no polling) | — | API is synchronous wrt. its own DB; no eventual consistency |

### 8.3 Forbidden anti-patterns

| ❌ Forbidden | ✅ Use Instead | Rule |
|------|------|------|
| `setTimeout(...)` / `await new Promise(r => setTimeout(r, N))` to wait for state | Direct DB query immediately after the awaited HTTP response | `ai-coding-standards.md` PATTERN 9 (no arbitrary timeouts) |
| Mocking Prisma with `jest.mock(...)` | Real PostgreSQL with truncate-after-test | API integration tests must exercise the real query layer |
| `expect(res.body.message).toContain(...)` for content under test | `toBe` / `toEqual` (full string) — message strings are part of the API contract per §6.3 | `ai-coding-standards.md` §4.1 Rule 4 (analogue) |
| Sharing entities across tests | Create in `beforeEach`; rely on `afterEach` truncation | §8.1 above |
| Hard-coded calendar dates that will go stale | `daysFromNow(n)` helper | §7.1 |
| `expect(res.status).toBeGreaterThanOrEqual(200).toBeLessThan(300)` (range) | `expect(res.status).toBe(201)` (exact) | API contract is exact-status |

### 8.4 Parallel safety declaration

| Spec File | Parallel Safe? | Rationale |
|-----------|----------------|-----------|
| (any spec in this plan) | ❌ Must run **serial** with `--runInBand` | The shared `afterEach` truncate strategy in `tests/setup.ts` is destructive — parallel workers on the same DB would race. `package.json` test script already enforces `--runInBand`. |

### 8.5 3x stability verification

Per `ai-coding-standards.md` RULE 6 (every test must pass 3 sequential runs).

```bash
cd backend
# Run individual file 3 times sequentially
for /L %i in (1,1,3) do npm test -- backend/tests/api/bookings-create.spec.ts
# Or in PowerShell:
1..3 | ForEach-Object { npm test -- backend/tests/api/bookings-create.spec.ts }
```

> **Note**: Jest does not have `--repeat-each` (Playwright-only). Use the loop pattern above OR add to `package.json`:
> ```json
> "test:api:repeat": "for /L %i in (1,1,3) do (jest backend/tests/api --runInBand)"
> ```
> Status `PASS` is recorded ONLY after 3 consecutive green runs in the §11 Revision History.

---

## 9. Risks & Known Issues

### 9.1 RISK: `server.ts` bottom-of-file IIFE binds a port

`startServer()` is invoked at the bottom of `src/server.ts` (line 125), which calls `app.listen(PORT, ...)`. When the spec file does `import app from '../src/server'`, this listener will try to bind port 5000 — causing `EADDRINUSE` if anything else (dev server) is already running, or polluting the test runner with an open handle.

**Mitigation** (must implement before first spec run):

Option A — refactor `server.ts` to gate the listen on `require.main === module`:
```typescript
if (require.main === module) {
    startServer();
}
```

Option B — extract `app` into `src/app.ts` and keep `server.ts` as the entry point that imports `app` and calls `listen`. This is the canonical Express layout.

> **Plan Action**: Option B should be implemented first; track as **API-TEST-PREREQ-1**.

### 9.2 RISK: No `express-validator` chain on `register` / `login` / `createBooking`

The current controllers do their own ad-hoc validation (e.g. `auth.controller.ts` `register` does NOT validate at all; missing fields fall through to `bcrypt.hash(undefined)` → uncaught error → 500). TC-AR-05 pins this current behaviour as 500. **In the future**, when validation chains are introduced, those tests must be updated to expect 400 — track as **API-TEST-PREREQ-2** (also blocks Q1 in §20.3).

### 9.3 OPEN QUESTION: Is strictly-adjacent booking allowed?

`booking.controller.ts:60-65`: overlap predicate uses `lte`/`gte` (inclusive on both sides). So if existing booking is `[+5d, +10d]` and new is `[+10d, +13d]`, the predicate `existing.checkInDate (+5d) <= newCheckOut (+13d) AND existing.checkOutDate (+10d) >= newCheckIn (+10d)` is **TRUE** — meaning strictly-adjacent (check-in on the same day as previous check-out) is currently treated as a conflict.

In hospitality industry, day-of check-out and day-of check-in are typically considered NON-overlapping (room is cleaned between).

**Decision required**: TC-BC-08c pins **current behaviour** (409 conflict). When the product team clarifies, update TC-BC-08c expected status accordingly.

### 9.4 RISK: CORS is unconditionally `*`

`server.ts:28` calls `cors()` without options. If `CORS_ORIGIN` from `.env.example:16` is later honoured, TC-SM-04 must be updated.

### 9.5 KNOWN ISSUE: `errorHandler` Prisma branches unreached

`errorHandler.ts:28-45` has dedicated branches for `P2002` (409) and `P2025` (404). However, every controller currently catches its own errors (own try/catch + own status/json). `errorHandler` is only reached when an error is uncaught — which never happens in this codebase. Tests TC-XC-04 and TC-XC-05 are **🚧 BLOCKED** until controllers are refactored to use `asyncHandler` and re-throw to the global handler.

### 9.6 BLOCKED / FLAKY catalog

| Test ID | Test Name | Status | Reason | Tracked In |
|---------|-----------|--------|--------|-----------|
| @TcC85543d | TC-XC-04 errorHandler P2002 → 409 | 🚧 BLOCKED | No controller forwards Prisma errors to global handler | API-TEST-PREREQ-3 |
| @TdD96654e | TC-XC-05 errorHandler P2025 → 404 | 🚧 BLOCKED | Same as above | API-TEST-PREREQ-3 |

### 9.7 Open Questions for Product / Dev

| # | Question | Affects Tests | Status |
|---|----------|---------------|--------|
| Q1 | Should `register` / `login` / `createBooking` use `express-validator` and return 400 with field errors instead of falling through to 500? | TC-AR-05a/b/c | Awaiting backend team |
| Q2 | Should strictly-adjacent bookings (`existing.checkOut === new.checkIn`) be allowed? | TC-BC-08c | Awaiting product |
| Q3 | Should `register` accept `role` from body (escalation risk) — current behaviour ignores? | TC-AR-08 | Confirmed: must remain hard-coded `guest` |
| Q4 | Should there be rate limiting on `POST /api/auth/login`? `express-rate-limit` is in deps but not wired up. | New tests TBD | Awaiting product |
| Q5 | Should `cancelBooking` verify ownership BEFORE the state-transition check, or after? Current order: ownership first (lines 256-266), then state (lines 269-275). | TC-BCancel-02 / TC-BCancel-03 | Confirmed: current order is intentional |
| Q6 | Should `/api/bookings` for staff/admin be paginated? Current: returns ALL bookings unbounded. | New TBD | Future enhancement |

---

## 10. Debug Commands

> Cursor on Windows uses PowerShell — adjust shell syntax accordingly.

### 10.1 Single test debug (PowerShell)

```powershell
cd backend
npm test -- --testPathPattern="api/auth-register" --testNamePattern="Anonymous user can register guest with required fields only"
```

### 10.2 Run single spec file

```powershell
cd backend
npm test -- backend/tests/api/bookings-create.spec.ts
```

### 10.3 Run all API tests

```powershell
cd backend
npm test -- --testPathPattern="tests/api"
```

### 10.4 Stability check (3x sequential)

```powershell
cd backend
1..3 | ForEach-Object { Write-Host "===== RUN $_ ====="; npm test -- --testPathPattern="tests/api/bookings-create" }
```

### 10.5 Coverage for API tests only

```powershell
cd backend
npm test -- --testPathPattern="tests/api" --coverage
```

### 10.6 Watch mode (single file)

```powershell
cd backend
npm run test:watch -- backend/tests/api/auth-login.spec.ts
```

### 10.7 Inspect SQL during a failing test

Set `DEBUG=prisma:query` env var:

```powershell
$env:DEBUG="prisma:query"; npm test -- --testPathPattern="tests/api/bookings-create" --testNamePattern="overlap"
```

---

## 11. Revision History

| Version | Date | Stage | Changes |
|---------|------|-------|---------|
| 1.0 | Apr 29, 2026 | **MCP-Ready** | Initial MCP-Ready API test plan: 151 tests across 4 domains (Auth, Rooms, Bookings, Guests) + smoke + cross-cutting middleware. SOLID/OOP test architecture: `BaseApiClient` + 4 resource clients (`AuthApi`, `RoomApi`, `BookingApi`, `GuestApi`), role-bound fixtures (`guestClient`, `adminClient`, `staffClient`, `anonClient`), helper modules for JWT/dates/envelopes. Resolved endpoint catalog + error-message catalog (§6) from source verification of `routes/*.ts` and `controllers/*.ts`. 7 known risks + 6 open questions documented. Tests use Compact Group Specs aggressively for role-restriction repetition (negative auth/role tests dedup ~50% of test specs). **Blocked**: 2 tests (TC-XC-04/05) awaiting controller refactor to use `asyncHandler`. |

---

*This plan is compliant with `ai-planning-standards.md` v3.0 and `ai-coding-standards.md`. Adaptation note for API-vs-UI vocabulary in the header. Promoted directly to **MCP-Ready** at v1.0 because all locators (endpoints), preconditions, and error messages were verifiable from source code at plan-authoring time without DOM exploration.*
