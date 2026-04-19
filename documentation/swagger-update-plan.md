# Swagger Documentation — Implementation Plan

Audit of `backend/src/config/swagger.ts` + `backend/src/routes/*.ts` against the actual Prisma schema (`backend/prisma/schema.prisma`) and controllers (`backend/src/controllers/*.ts`).

The plan is ordered so each stage cleans up the most downstream noise first. Each item lists the **target file**, the **current state**, and the **fix**.

---

## Stage 1 — Component schemas (`backend/src/config/swagger.ts`)

Fixing these once propagates corrections to every `$ref` in the route files.

### 1.1 Replace `User` schema
**Current (lines 31–45):** `_id: string`, `profile.{firstName, lastName}` only.
**Fix:** match Prisma `User` model.

```yaml
User:
  type: object
  properties:
    id: { type: integer, example: 1 }
    email: { type: string, format: email }
    role: { type: string, enum: [guest, staff, admin] }
    profile:
      type: object
      properties:
        firstName: { type: string }
        lastName:  { type: string }
        phone:     { type: string }
        address:
          type: object
          properties:
            street:  { type: string, nullable: true }
            city:    { type: string, nullable: true }
            state:   { type: string, nullable: true }
            country: { type: string, nullable: true }
            zipCode: { type: string, nullable: true }
    createdAt: { type: string, format: date-time }
    updatedAt: { type: string, format: date-time }
```

### 1.2 Replace `Room` schema
**Current (lines 46–56):** `_id: string`, status enum has invalid `booked`, missing `amenities`, `photos`, `description`.
**Fix:**

```yaml
Room:
  type: object
  properties:
    id:            { type: integer }
    roomNumber:    { type: string }
    type:          { type: string, enum: [single, double, suite, deluxe, presidential] }
    capacity:      { type: integer }
    pricePerNight: { type: number, format: float }
    amenities:     { type: array, items: { type: string } }
    photos:        { type: array, items: { type: string } }
    description:   { type: string }
    status:        { type: string, enum: [available, occupied, maintenance] }
    createdAt:     { type: string, format: date-time }
    updatedAt:     { type: string, format: date-time }
```

### 1.3 Replace `Booking` schema
**Current (lines 57–68):** ID fields are `string`, status enum uses hyphens and is missing `pending`, missing `numberOfGuests`, `specialRequests`, `paymentStatus`.
**Fix:**

```yaml
Booking:
  type: object
  properties:
    id:              { type: integer }
    guestId:         { type: integer }
    roomId:          { type: integer }
    checkInDate:     { type: string, format: date-time }
    checkOutDate:    { type: string, format: date-time }
    numberOfGuests:  { type: integer }
    totalPrice:      { type: number, format: float }
    status:          { type: string, enum: [pending, confirmed, checked_in, checked_out, cancelled] }
    specialRequests: { type: string, nullable: true }
    paymentStatus:   { type: string, enum: [pending, paid, refunded] }
    createdAt:       { type: string, format: date-time }
    updatedAt:       { type: string, format: date-time }
```

### 1.4 Add reusable error + envelope schemas
Used by every controller, currently duplicated as free-text `description`s.

```yaml
Error:
  type: object
  properties:
    status:  { type: string, example: error }
    message: { type: string }

SuccessEnvelope:
  type: object
  properties:
    status:  { type: string, example: success }
    message: { type: string }
    data:    { type: object }
```

### 1.5 Add reusable response components
Add under `components.responses`:

```yaml
Unauthorized:
  description: Missing or invalid authentication token
  content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } }
Forbidden:
  description: Authenticated but not allowed to access this resource
  content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } }
NotFound:
  description: Resource not found
  content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } }
Conflict:
  description: Resource conflict (e.g. duplicate or overlap)
  content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } }
ValidationError:
  description: Invalid request body or query parameters
  content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } }
ServerError:
  description: Internal server error
  content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } }
```

### 1.6 Add global `tags` and a second `servers` entry
Cosmetic but helps Swagger UI ordering and multi-env testing.

```yaml
tags:
  - { name: Auth,     description: Registration, login, current user }
  - { name: Rooms,    description: Room catalog and admin CRUD }
  - { name: Bookings, description: Booking lifecycle }
  - { name: Guests,   description: Guest management (admin/staff) }

servers:
  - { url: http://localhost:5000, description: Development }
  - { url: https://api.example.com, description: Production (placeholder) }
```

---

## Stage 2 — Path parameter types (all route files)

**Current:** every `/{id}` parameter declares `schema: { type: string }`.
**Reality:** controllers do `Number(req.params.id)` — IDs are integers.
**Fix:** change every occurrence to:

```yaml
schema: { type: integer, minimum: 1 }
```

**Files to touch (count of `:id` params):**
- `backend/src/routes/room.routes.ts` — 3 (`GET/PUT/DELETE /:id`)
- `backend/src/routes/booking.routes.ts` — 5 (`GET/PUT/DELETE /:id`, `POST /:id/check-in`, `POST /:id/check-out`)
- `backend/src/routes/guest.routes.ts` — 3 (`GET/PUT /:id`, `GET /:id/bookings`)

---

## Stage 3 — Fix wrong request bodies (3 endpoints)

These actively misdocument the contract — clients following them will fail at runtime.

### 3.1 `POST /api/auth/register` (`auth.routes.ts:15-49`)
**Current:** flat `{ email, password, firstName, lastName }`.
**Reality (`auth.controller.ts:23,44-51`):** nested `profile` with `phone` and `address`.

```yaml
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [email, password, profile]
        properties:
          email:    { type: string, format: email }
          password: { type: string, minLength: 6 }
          profile:
            type: object
            required: [firstName, lastName, phone]
            properties:
              firstName: { type: string }
              lastName:  { type: string }
              phone:     { type: string }
              address:
                type: object
                properties:
                  street:  { type: string }
                  city:    { type: string }
                  state:   { type: string }
                  country: { type: string }
                  zipCode: { type: string }
```

Also: replace `400` with `409` for "User with this email already exists" (`auth.controller.ts:28`).

### 3.2 `POST /api/bookings` (`booking.routes.ts:26-53`)
**Current:** `$ref: Booking` (full entity).
**Reality (`booking.controller.ts:8`):** `{ roomId, checkInDate, checkOutDate, numberOfGuests, specialRequests }`.

```yaml
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [roomId, checkInDate, checkOutDate, numberOfGuests]
        properties:
          roomId:          { type: integer }
          checkInDate:     { type: string, format: date-time }
          checkOutDate:    { type: string, format: date-time }
          numberOfGuests:  { type: integer, minimum: 1 }
          specialRequests: { type: string }
```

### 3.3 `PUT /api/guests/{id}` (`guest.routes.ts:79-112`)
**Current:** `$ref: User`.
**Reality (`guest.controller.ts:84-97`):** profile-only update.

```yaml
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        properties:
          firstName: { type: string }
          lastName:  { type: string }
          phone:     { type: string }
          address:
            type: object
            properties:
              street:  { type: string }
              city:    { type: string }
              state:   { type: string }
              country: { type: string }
              zipCode: { type: string }
```

---

## Stage 4 — Add missing query parameters

### 4.1 `GET /api/rooms` (`room.routes.ts:22-40`)
**Controller (`room.controller.ts:7-18`)** supports `type`, `status`, `minPrice`, `maxPrice` — none documented.

```yaml
parameters:
  - in: query
    name: type
    schema: { type: string, enum: [single, double, suite, deluxe, presidential] }
  - in: query
    name: status
    schema: { type: string, enum: [available, occupied, maintenance] }
  - in: query
    name: minPrice
    schema: { type: number, format: float, minimum: 0 }
  - in: query
    name: maxPrice
    schema: { type: number, format: float, minimum: 0 }
```

### 4.2 `GET /api/rooms/search` (`room.routes.ts:41-78`)
**Controller (`room.controller.ts:64`)** supports `type`, but Swagger only lists `checkIn`, `checkOut`, `capacity`. Add:

```yaml
- in: query
  name: type
  schema: { type: string, enum: [single, double, suite, deluxe, presidential] }
```

Also: `checkIn`/`checkOut` are documented as `required: true`, but the controller treats them as optional (line 72 conditional). Either tighten the controller or relax `required: false` in Swagger — recommend the latter for backward compatibility.

---

## Stage 5 — Fix wrong response shapes

All controllers return `{ status, message?, data: {...} }`. Currently most routes either `$ref` the bare entity or omit the schema entirely.

### 5.1 `POST /api/auth/login` (`auth.routes.ts:51-87`)
**Current:** `{ token: string }`.
**Reality (`auth.controller.ts:130`):**

```yaml
'200':
  description: Login successful
  content:
    application/json:
      schema:
        allOf:
          - $ref: '#/components/schemas/SuccessEnvelope'
          - type: object
            properties:
              data:
                type: object
                properties:
                  user:  { $ref: '#/components/schemas/User' }
                  token: { type: string }
```

Also document **`400`** ("Please provide email and password" — `auth.controller.ts:98`).

### 5.2 `GET /api/auth/me` — wrap in `{ data: { user } }` envelope.

### 5.3 List endpoints (`GET /api/rooms`, `/api/bookings`, `/api/guests`, `/api/guests/{id}/bookings`)
Each returns `{ status, results, data: { rooms | bookings | guests } }`. Update the `200` schema:

```yaml
'200':
  description: List
  content:
    application/json:
      schema:
        type: object
        properties:
          status:  { type: string, example: success }
          results: { type: integer }
          data:
            type: object
            properties:
              rooms:  # (or bookings / guests)
                type: array
                items: { $ref: '#/components/schemas/Room' }
```

### 5.4 Single-resource GETs — wrap in `{ data: { room | booking | guest } }`.

### 5.5 Mutating endpoints (POST/PUT/DELETE) — return `{ status, message, data: { ... } }`. Use `SuccessEnvelope` + the resource ref.

---

## Stage 6 — Add missing error responses

Replace inline 401/403/404/500 with `$ref: '#/components/responses/...'` and add the missing ones.

| Endpoint | Currently missing |
|---|---|
| `POST /api/auth/register` | `409` (duplicate email) |
| `POST /api/auth/login` | `400` (missing fields) |
| `POST /api/bookings` | `404` (room not found, line 19), `409` (date conflict, line 51) |
| `GET /api/bookings/{id}` | `403` (not your booking, line 158) |
| `PUT /api/bookings/{id}` | `401`, `403` (line 190) |
| `DELETE /api/bookings/{id}` | `401`, `403` (line 231) |
| `POST /api/bookings/{id}/check-in` | `401`, `403` |
| `POST /api/bookings/{id}/check-out` | `401`, `403` |
| `PUT /api/rooms/{id}` & `DELETE /api/rooms/{id}` | already have 401/403, should `$ref` the new components |

---

## Stage 7 — Document the `/health` endpoint (optional)

Currently registered in `server.ts:34` but not in Swagger. Add a JSDoc block above it (or in a new `routes/health.routes.ts`):

```yaml
/health:
  get:
    summary: Liveness probe
    tags: [Ops]
    responses:
      '200':
        description: Server is running
        content:
          application/json:
            schema:
              type: object
              properties:
                status:    { type: string, example: success }
                message:   { type: string }
                timestamp: { type: string, format: date-time }
```

You'd also need to extend `apis` in `swagger.ts` to include `server.ts` (or move the handler to a route file, which is cleaner).

---

## Verification checklist

After each stage, run:

1. `npm run dev` (backend) and open `http://localhost:5000/api-docs` — confirm no schema validation errors in the browser console.
2. **"Try it out"** for at least one endpoint per tag — confirm the example body Swagger UI generates is accepted by the real controller.
3. `npm test` — make sure no integration tests break (none should, since this is doc-only).

## Rough effort estimate

| Stage | Files touched | Effort |
|---|---|---|
| 1. Component schemas + reusable responses | 1 | ~30 min |
| 2. Path param types (`integer`) | 3 | ~10 min |
| 3. Fix request bodies | 3 | ~20 min |
| 4. Add query parameters | 1 | ~10 min |
| 5. Fix response shapes | 4 | ~45 min |
| 6. Add missing error responses | 3 | ~20 min |
| 7. `/health` doc | 1 | ~5 min |
| **Total** | | **~2.5 hours** |
