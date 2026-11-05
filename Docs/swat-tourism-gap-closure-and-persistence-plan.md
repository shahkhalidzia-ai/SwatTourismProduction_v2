# Swat Tourism Platform — Gap Closure & Persistence Implementation Plan

**Target:** Migrate client-side `localStorage` states to durable SQLite database models & REST endpoints.  
**Scope:** 9 Functional Persistence Gaps  
**Phases:** 4 Progressive Phases  

---

## Phased Roadmap

| Phase | Focus Areas | Gaps Addressed | Key Deliverables |
| :--- | :--- | :---: | :--- |
| **Phase 1** | **Hotel Front-Desk Operations & Balance Persistence** | Gaps 1, 2, 3 | • `stay_status`, `checked_in_at`, `checked_out_at` on `bookings`<br>• `POST /bookings/{id}/check-in`, `/check-out`, `/collect-balance`<br>• Elimination of `swat_hotel_stay_states` and `swat_hotel_collected_balances` |
| **Phase 2** | **Housekeeping & Room Inventory Live Synchronization** | Gaps 1 & 2 | • `cleaning_status` and `stay_state` on `hotel_rooms`<br>• Real-time synchronization of `LiveRoomRackBoard.tsx` with DB API |
| **Phase 3** | **Transport & Fleet Persistence** | Gaps 4, 5, 6 | • `transport_vehicles` database table<br>• Real database bookings for 4x4 Jeep and Intercity routes |
| **Phase 4** | **Guest Account Conversion & Community Host DB Sync** | Gaps 7, 8, 9 | • `POST /bookings/claim` endpoint to attach offline bookings to new accounts<br>• Database-driven community host approvals |

---

## Detailed Step-by-Step Execution: Phase 1

### Step 1.1: Database Schema & Auto-Migration
- In `backend/app/main.py`: Add `stay_status VARCHAR(20) DEFAULT 'reserved'`, `checked_in_at DATETIME`, `checked_out_at DATETIME` to `auto_migrate_sqlite` for `bookings`.
- In `backend/app/modules/bookings/models.py`: Add the mapped columns with check constraint `stay_status IN ('reserved', 'checked_in', 'checked_out')`.
- In `backend/app/modules/bookings/schemas.py`: Add `stay_status`, `checked_in_at`, `checked_out_at` to `BookingOut`.

### Step 1.2: Backend Service Methods
- In `backend/app/modules/bookings/service.py`:
  - `check_in_booking(db, booking_id, user_id)`: Transitions `stay_status` to `'checked_in'`, timestamps `checked_in_at`, marks assigned room `'occupied'`, adds history entry.
  - `check_out_booking(db, booking_id, user_id)`: Transitions `stay_status` to `'checked_out'`, sets `status='completed'`, releases room to `'cleaning'`, timestamps `checked_out_at`, adds history entry, triggers review prompt.
  - `collect_balance(db, booking_id, user_id)`: Sets `payment_status='paid'`, sets `deposit_amount=total_amount`, adds balance payment history entry.

### Step 1.3: Backend API Endpoints
- In `backend/app/modules/bookings/router.py`:
  - `@router.post("/{booking_id}/check-in", response_model=BookingOut)`
  - `@router.post("/{booking_id}/check-out", response_model=BookingOut)`
  - `@router.post("/{booking_id}/collect-balance", response_model=BookingOut)`

### Step 1.4: Frontend Integration
- In `frontend/src/api/bookings.ts`: Export `checkInBookingApi`, `checkOutBookingApi`, and ensure `collectBookingBalance` points to `/bookings/{id}/collect-balance`.
- In `frontend/src/modules/business/HotelTodayScreen.tsx`: Call backend APIs on Check-In, Check-Out, and Collect Balance. Use API response to drive UI state.


---

## Detailed Step-by-Step Execution: Phase 2 (Completed)
- In `backend/app/main.py`: SQLite auto-migration for `hotel_rooms` columns (`cleaning_status`, `stay_state`).
- In `backend/app/modules/listings/models.py`: Added `cleaning_status`, `stay_state` to `HotelRoom` model with check constraints.
- In `backend/app/modules/listings/router.py`: Added status mutation endpoint `PATCH /api/v1/listings/rooms/{room_id}/status`.
- In `frontend/src/api/physicalRooms.ts`: Live synchronization with backend room status API.

---

## Detailed Step-by-Step Execution: Phase 3 (Completed)
- In `backend/app/modules/listings/models.py`: Added `TransportVehicle` model mapped to table `transport_vehicles`.
- In `backend/app/modules/listings/router.py`: Added CRUD endpoints `GET/POST/DELETE /api/v1/listings/transport/fleet`.
- In `frontend/src/api/transportFleet.ts` & `TransportFleetManager.tsx`: Interactive fleet management backed by database REST APIs.

---

## Detailed Step-by-Step Execution: Phase 4 (Completed)
- In `backend/app/modules/bookings/schemas.py`: Added `ClaimBookingsRequest` and `ClaimBookingsResponse`.
- In `backend/app/modules/bookings/service.py`: Implemented `claim_bookings()` to link guest/offline reservations to authenticated user accounts.
- In `backend/app/modules/bookings/router.py`: Added `POST /api/v1/bookings/claim` and aliased `GET /api/v1/bookings/my`.
- In `frontend/src/api/bookings.ts`: Added `claimBookingsApi()`.
- In `frontend/src/context/AuthContext.tsx`: Auto-claim guest reservations from `swat_local_bookings` upon user login/registration.
- In `backend/tests/test_phase4_guest_claim_persistence.py`: Comprehensive test suite verifying booking claiming and community host approval persistence.
