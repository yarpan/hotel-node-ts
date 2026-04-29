# Hotel Management System - Detailed Implementation Plan

This is the comprehensive, step-by-step blueprint for building out the remaining features of the application, broken down into specific files, components, and API calls.

---

## Phase 1: Completing the Guest Experience

The goal of this phase is to make the Guest Cabinet fully interactive, allowing users to search for rooms effectively, cancel bookings, and edit their profiles.

### 1.1. Advanced Room Search & Filtering
**Target Files:** 
*   `frontend/src/services/room.service.ts`
*   `frontend/src/pages/GuestCabinet/BrowseRoomsPage.tsx`

**Implementation Steps:**
1.  **API Service:** Add `searchRooms(params: { checkIn?: string; checkOut?: string; type?: string; capacity?: number })` to `room.service.ts` pointing to `GET /api/rooms/search`.
2.  **UI Component (Filter Bar):** 
    *   Create a sticky or top-level `Paper` component above the grid in `BrowseRoomsPage`.
    *   Add Material-UI inputs: Date pickers for Check-in/Check-out, a `Select` dropdown for Room Type, and a number `TextField` for Capacity.
3.  **State Management:**
    *   Add `useState` hooks for each filter field.
    *   Create a `handleSearch` function that triggers the new `searchRooms` API call instead of the default `getRooms`.
    *   Update the room grid with the filtered results.

### 1.2. Booking Cancellation
**Target Files:** 
*   `frontend/src/pages/GuestCabinet/MyBookingsPage.tsx`

**Implementation Steps:**
1.  **UI Addition:** Inside the `.map()` loop for bookings, add a "Cancel Booking" `<Button color="error">` to any card where `booking.status === 'pending'` or `'confirmed'`.
2.  **Confirmation Dialog:** Implement an MUI `<Dialog>` to prevent accidental cancellations. ("Are you sure you want to cancel this booking?")
3.  **API Integration:** On confirmation, call `bookingService.cancelBooking(id)` (`DELETE /api/bookings/:id`).
4.  **State Update:** On success, immediately update the local React state (change the specific booking's status to `'cancelled'`) without requiring a full page reload.

### 1.3. Editable Guest Profile
**Target Files:** 
*   `backend/src/controllers/auth.controller.ts` & `backend/src/routes/auth.routes.ts`
*   `frontend/src/services/auth.service.ts`
*   `frontend/src/pages/GuestCabinet/MyProfilePage.tsx`

**Implementation Steps:**
1.  **Backend Gap Fix:** Create an `updateCurrentUser` controller mapping to `PUT /api/auth/me`. This controller will extract `req.user.id` and run a Prisma `user.update()` to allow users to change their own `firstName`, `lastName`, `phone`, and `address`.
2.  **Frontend Service:** Add `updateProfile(data)` to `auth.service.ts`.
3.  **UI State Toggle:** Add an `isEditing` boolean state to `MyProfilePage`. 
4.  **Form Implementation:** When `isEditing` is true, render a `<form>` with `TextField` components populated with the user's current data.
5.  **Submission:** Call the new backend endpoint on save, update the global `AuthContext` with the new user data, and toggle `isEditing` back to false.

---

## Phase 2: Building the Admin Management Panel

The goal of this phase is to turn the placeholder Admin Dashboard into a fully functional CRM and inventory management system.

### 2.0. Prerequisites & Setup
*   **Dependency:** Run `npm install @mui/x-data-grid` in the frontend. This provides high-performance data tables with built-in pagination, sorting, and filtering, which is standard for admin dashboards.
*   **Routing (`App.tsx`):** Add protected routes for `/admin/rooms`, `/admin/bookings`, and `/admin/guests`.

### 2.1. Rooms Management (`AdminRoomsPage.tsx`)
**Implementation Steps:**
1.  **Data Table:** Create a `DataGrid` displaying columns: `Room Number`, `Type`, `Capacity`, `Price ($)`, `Status`, and `Actions`.
2.  **Create/Edit Modal (`RoomFormModal.tsx`):**
    *   Build a reusable dialog utilizing `react-hook-form`.
    *   Fields required: `roomNumber`, `type` (Select), `capacity` (Number), `pricePerNight` (Number), `status` (Select), and `description` (Textarea).
    *   Wire up to `POST /api/rooms` and `PUT /api/rooms/:id`.
3.  **Delete Flow:** Add a trash-can icon in the Actions column. Opens a confirmation `<Dialog>`. Calls `DELETE /api/rooms/:id`.

### 2.2. Bookings Management (`AdminBookingsPage.tsx`)
**Implementation Steps:**
1.  **Data Table:** Create a `DataGrid` displaying: `Booking ID`, `Guest Name`, `Room #`, `Dates`, `Total Price`, `Payment Status`, and `Booking Status`.
2.  **Quick Actions (Check-in / Check-out):**
    *   In the Actions column, dynamically render "Check-in" button if status is `confirmed` (calls `POST /api/bookings/:id/check-in`).
    *   Render "Check-out" button if status is `checked_in` (calls `POST /api/bookings/:id/check-out`).
3.  **Edit Booking Modal:** Ability for admins to manually override a booking status or payment status via `PUT /api/bookings/:id`.

### 2.3. Guests Management (`AdminGuestsPage.tsx`)
**Implementation Steps:**
1.  **Data Table:** Create a `DataGrid` displaying all registered users: `ID`, `First Name`, `Last Name`, `Email`, `Phone`, `Role`.
2.  **Guest Details View (`AdminGuestDetails.tsx`):**
    *   Instead of a modal, clicking a guest navigates to `/admin/guests/:id`.
    *   **Top Section:** Detailed guest profile form. Admins can fix typos or update contact info using `PUT /api/guests/:id`.
    *   **Bottom Section:** A sub-table listing the guest's booking history by calling `GET /api/guests/:id/bookings`.

---

## Phase 3: Polish & Error Handling (Final Touches)

1.  **Global Axios Interceptor:** Ensure the frontend gracefully handles 401 Unauthorized errors by automatically logging the user out and redirecting to `/login` if their JWT expires.
2.  **Toast Notifications:** Integrate a snackbar system (like `notistack` or standard MUI Snackbars) to provide global, non-intrusive success/error alerts for actions like "Room deleted" or "Profile updated".
3.  **Loading Skeletons:** Replace standard spinners with MUI `<Skeleton>` components for smoother UI transitions during API calls on the dashboard and data tables.
4.  **Dedicated Test Database:** Configure Jest to use a separate test database (`DATABASE_URL`) during test execution to prevent `tests/setup.ts` hooks from wiping out local development data.
