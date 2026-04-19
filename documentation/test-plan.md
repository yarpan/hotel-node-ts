# Auth Middleware — Pending Test Plan

Tests identified as missing from `auth.edge-cases.test.ts` and `auth.test.ts`.  
Target file for all items: `backend/tests/unit/middleware/auth.edge-cases.test.ts`

---

## `authenticate` — 10 pending tests

### ~~1. Generic 500 response body~~ ✅ DONE
**Test name:** `should respond with "Authentication failed." body on the generic 500 path`  
**Why missing:** The nbf test (line 374) asserts `status 500` but never verifies the JSON body.  
The catch-all branch `res.status(500).json({ status: 'error', message: 'Authentication failed.' })` has no body assertion anywhere.  
**Trigger:** Sign a token with `{ notBefore: '1h' }` (NotBeforeError falls to generic catch).  
**Expected:** `res.json` called with `{ status: 'error', message: 'Authentication failed.' }`

---

### ~~2. Empty-string authorization header — response body~~ ✅ DONE
**Test name:** `should respond with "No token provided. Please authenticate." body for an empty string authorization header`  
**Why missing:** The empty-string test (line 71) only asserts `status 401`. The exact body message is only verified for the *completely absent* header (line 146), not for the empty-string case.  
**Trigger:** `headers: { authorization: '' }`  
**Expected:** `res.json` called with `{ status: 'error', message: 'No token provided. Please authenticate.' }`

---

### ~~3. `Bearer ` with empty token — response body distinction~~ ✅ DONE
**Test name:** `should respond with "Invalid token." body when Bearer is present but the token part is an empty string`  
**Why missing:** `'Bearer '` passes the `startsWith('Bearer ')` guard, then `authHeader.split(' ')[1]` yields `''`, and `jwt.verify('')` throws `JsonWebTokenError` → body is `"Invalid token."`, **not** `"No token provided."`. Line 161 only checks the status; this message distinction is unverified.  
**Trigger:** `headers: { authorization: 'Bearer ' }`  
**Expected:** `res.json` called with `{ status: 'error', message: 'Invalid token.' }`

---

### ~~4. Negative userId in token~~ ✅ DONE
**Test name:** `should return 401 for a token containing a negative userId`  
**Why missing:** `userId: 0` is covered (line 328). `userId: -1` is a distinct case — a valid JWT, but `prisma.user.findUnique({ where: { id: -1 } })` returns `null` → user-not-found path.  
**Trigger:** `jwt.sign({ userId: -1, role: 'guest' }, JWT_SECRET, { expiresIn: '1h' })`  
**Expected:** `status 401`, `req.user` undefined, `next` not called

---

### ~~5. `next()` called exactly once on success~~ ✅ DONE
**Test name:** `should call next() exactly once on successful authentication`  
**Why missing:** Valid-token tests assert `next` was called but none assert `toHaveBeenCalledTimes(1)`, leaving double-invocation undetected.  
**Trigger:** Valid token for any role.  
**Expected:** `expect(next).toHaveBeenCalledTimes(1)`

---

### ~~6. `"Bearer"` with no trailing space~~ ✅ DONE
**Test name:** `should return 401 for a header value of exactly "Bearer" with no trailing space`  
**Why missing:** `'Bearer'.startsWith('Bearer ')` is `false` (the space after `Bearer` is part of the guard). This is distinct from `'bearer '` (lowercase, line 249), `'Bearer '` (with trailing space, line 161), and `'Bearer\t'` (tab, line 360). None of these cover the exact string `'Bearer'`.  
**Trigger:** `headers: { authorization: 'Bearer' }`  
**Expected:** `status 401`, body `{ status: 'error', message: 'No token provided. Please authenticate.' }`

---

### ~~7. Whitespace-only authorization header~~ ✅ DONE
**Test name:** `should return 401 for an authorization header containing only whitespace`  
**Why missing:** `'   '.startsWith('Bearer ')` is `false`, so the "no token" guard fires. Currently only `''` (empty string) and complete absence are tested. Whitespace-only is a separate falsy-ish case that a client could send accidentally.  
**Trigger:** `headers: { authorization: '   ' }`  
**Expected:** `status 401`, body `{ status: 'error', message: 'No token provided. Please authenticate.' }`

---

### 8. All-uppercase `"BEARER"` prefix
**Test name:** `should return 401 if "BEARER" prefix is all uppercase`  
**Why missing:** The lowercase variant (`'bearer'`) is already covered (line 249). The all-uppercase variant (`'BEARER token'`) is a distinct input that also fails `startsWith('Bearer ')` — the case-sensitivity test is only closed from one end.  
**Trigger:** `headers: { authorization: 'BEARER sometoken' }`  
**Expected:** `status 401`, `next` not called

---

### 9. Token payload with `userId` as a string
**Test name:** `should return 500 when token payload contains userId as a non-numeric string`  
**Why missing:** The `as { userId: number }` cast is compile-time only. At runtime `{ userId: 'abc' }` is valid JSON, so `jwt.verify` succeeds, but `prisma.user.findUnique({ where: { id: 'abc' } })` throws a Prisma type-validation error. This falls through to the generic `catch` → 500 `"Authentication failed."`. This specific runtime type-mismatch path is untested.  
**Trigger:** `jwt.sign({ userId: 'abc', role: 'guest' }, JWT_SECRET, { expiresIn: '1h' })`  
**Expected:** `status 500`, `next` not called

---

### 10. Full database record attached to `req.user`
**Test name:** `should attach all database fields to req.user after successful authentication`  
**Why missing:** All valid-token tests verify only `req.user.id` or `req.user.role`. None confirm that the remaining Prisma fields (`email`, `firstName`, `lastName`, `phone`) are also present, so a future change that strips fields before attaching would go undetected.  
**Trigger:** Valid guest token created with `createTestUser()`.  
**Expected:** `req.user.email`, `req.user.firstName`, `req.user.lastName`, `req.user.phone` all `toBeDefined()`

---

## `authorize` — 6 pending tests

### 6. User role is `null`
**Test name:** `should return 403 if user role is null`  
**Why missing:** `role: undefined` (line 421) and `user: null` (line 409) are covered, but `{ user: { role: null } }` is not. `req.user` is truthy, so the 401 guard passes; `roles.includes(null)` is `false` → 403.  
**Trigger:** `req = { user: { role: null } }`  
**Expected:** `status 403`, `next` not called

---

### 7. User role has trailing whitespace
**Test name:** `should return 403 if user role has trailing whitespace`  
**Why missing:** `Array.prototype.includes` uses strict equality — `'admin '` does not match `'admin'`. No test pins this behaviour, leaving a common data-entry bug uncaught.  
**Trigger:** `req = { user: { role: 'admin ' } }` against `authorize('admin')`  
**Expected:** `status 403`, `next` not called

---

### 8. `req.user` is not mutated on authorization failure
**Test name:** `should not mutate req.user on authorization failure`  
**Why missing:** No test verifies that `req.user` is left unchanged when a 403 is returned, leaving accidental side-effects on the request object undetected.  
**Trigger:** `req = { user: { role: 'guest', id: 42 } }` against `authorize('admin')`  
**Expected:** After middleware runs, `req.user` still deeply equals `{ role: 'guest', id: 42 }`

---

### 9. User role has leading whitespace
**Test name:** `should return 403 if user role has leading whitespace`  
**Why missing:** Plan item #7 tests trailing whitespace (`'admin '`). Leading whitespace (`' admin'`) is a separate value — `roles.includes(' admin')` with `roles = ['admin']` is `false` → 403. Both directions of padding should be pinned.  
**Trigger:** `req = { user: { role: ' admin' } }` against `authorize('admin')`  
**Expected:** `status 403`, `next` not called

---

### 10. User role is a number
**Test name:** `should return 403 if user role is a number`  
**Why missing:** `Array.prototype.includes` uses strict equality (`===`). `['admin'].includes(1)` is `false` even if `Number(1)` could coerce to something role-like. Verifies the middleware does not rely on loose equality anywhere.  
**Trigger:** `req = { user: { role: 1 } }` against `authorize('admin', 'staff', 'guest')`  
**Expected:** `status 403`, `next` not called

---

### 11. Allowed role in the list has trailing whitespace
**Test name:** `should return 403 when an allowed role has trailing whitespace`  
**Why missing:** Plan item #7 tests whitespace on the *user's* role. This tests whitespace on the *allowed-roles* side: `authorize('admin ')` vs a user with `role: 'admin'`. `'admin' === 'admin '` is `false` → 403. This catches bugs where role constants are defined with padding.  
**Trigger:** `req = { user: { role: 'admin' } }` against `authorize('admin ')`  
**Expected:** `status 403`, `next` not called
