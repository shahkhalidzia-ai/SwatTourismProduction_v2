# Swat Tourism Platform — Database Persistence & Gap Analysis Report

**Document Version:** 1.0.0  
**Target Environment:** Production v2 (`backend/swat_tourism_prod.db`)  
**Generated Date:** November 05, 2026  
**Auditor:** Antigravity AI Engineering Team  

---

## Executive Summary

This document provides an exhaustive architectural audit of the Swat Tourism Platform (Production v2), contrasting data flows that are **permanently persisted in the SQLite relational database** against data currently stored only in **client-side storage (`localStorage`) or ephemeral component state**.

The primary deliverable is an actionable **Gap List** with precise missing database models, API endpoints, and implementation recommendations needed to achieve complete, multi-device transactional integrity across all stakeholder workflows.

---

## 1. Persisted Modules & Functions (Database Verified)

The backend SQLite database (`backend/swat_tourism_prod.db`) contains **40 active tables**. The following business modules, models, and functions are fully committed to database storage:

| Functional Module | Features & Functions | Database Tables | Backend API Endpoints | Persistence Status |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication & Identity** | Registration, login, JWT token issuance, role assignment, profile management | `users`, `tourist_profiles`, `business_profiles`, `authority_profiles`, `community_profiles` | `/api/v1/auth/register`<br>`/api/v1/auth/login`<br>`/api/v1/auth/profile` | **100% Persisted** |
| **Listings & Physical Inventory** | Hotel listings, pricing tiers, room types, physical room inventory numbers, amenities | `listings`, `listing_details`, `price_items`, `hotel_rooms` | `/api/v1/listings/*`<br>`/api/v1/places/*` | **100% Persisted** |
| **Calendar & Availability** | Daily capacity limits, booked room counts, rate overrides, date blackouts | `availability` | `GET/POST /api/v1/listings/{id}/availability` | **100% Persisted** |
| **Safety & Road Intelligence** | Live highway/road clearance, hazard alerts, weather warnings, 1122 SOS distress calls | `road_status`, `advisories`, `emergency_contacts`, `sos_events` | `/api/v1/safety/road-status`<br>`/api/v1/safety/advisories`<br>`/api/v1/safety/sos` | **100% Persisted** |
| **Reviews & Feedback Loop** | Post-stay 1–5 star ratings, category scores, verified guest badges, hotel manager responses | `reviews`, `review_replies` | `GET/POST /api/v1/reviews/*`<br>`POST /api/v1/reviews/{id}/reply` | **100% Persisted** |
| **Community & Civic Hub** | Environmental reports, civic issues, local guide posts, community engagement | `community_posts`, `issue_reports` | `/api/v1/community/posts`<br>`/api/v1/community/issues` | **100% Persisted** |
| **Finance & Billing** | Commission tiers, monthly automated invoices, operator payout batches | `commission_tiers`, `monthly_invoices`, `operator_payouts` | `/api/v1/finance/invoices`<br>`/api/v1/finance/payouts` | **100% Persisted** |
| **Trips & Itineraries** | Custom day-by-day itineraries, tourist stops, saved bookmarks | `trips`, `trip_stops`, `saved_items` | `/api/v1/trips/*`<br>`/api/v1/trips/saved-items` | **100% Persisted** (Logged-in users) |
| **Standard Core Bookings** | Room & activity bookings, itemized pricing, audit timeline | `bookings`, `booking_items`, `booking_status_history` | `/api/v1/bookings/request`<br>`/api/v1/bookings/my` | **100% Persisted** (Logged-in users) |

---

## 2. The GAP LIST: Modules & Functions NOT Persisted in Database

The audit identified **9 distinct functional gaps** where transactional data is held purely in the client's web browser (`localStorage`), preventing multi-device synchronization and creating data loss risks:

| # | Module / Function | Current Storage (`localStorage` Key) | Missing Database Tables / Columns | Operational Risk & Impact | Priority |
| :-: | :--- | :--- | :--- | :--- | :-: |
| **1** | **Housekeeping & Room Rack Live Cleaning Status** | `swat_hotel_cleaning_statuses`<br>`swat_hotel_room_cleaning_status` | Missing `cleaning_status` (`clean`, `cleaning`, `inspected`, `maintenance`) in `hotel_rooms` table | When reception or housekeeping marks a room ready on one computer, staff on another terminal or mobile device still see the old status. | **CRITICAL** |
| **2** | **Front-Desk Stay & Turnover Tracking** | `swat_hotel_stay_states` | Missing `stay_state` (`in_house`, `turnover`, `checked_out`) in `bookings` or `hotel_rooms` | Check-in and room turnover status resets if browser cache is cleared or accessed from a different computer. | **CRITICAL** |
| **3** | **Front-Desk Balance Payments (Folio Cash/Card)** | `swat_hotel_collected_balances`<br>`swat_hotel_collected_balance` | Missing `folio_payments` / `booking_payments` transaction ledger table | Cash or POS card payments collected at the reception counter are stored locally; audit logs cannot verify who accepted payment and when. | **HIGH** |
| **4** | **Instant 4x4 Jeep & Transport Ride Orders** | `swat_ride_orders` | Missing transport booking rows in `bookings` & `booking_items` | Quick ride orders placed from the tourist landing page remain in the browser and do not reach the transport operator dispatch queue. | **HIGH** |
| **5** | **Intercity Private Cabs & Shuttle Bookings** | `swat_intercity_bookings` | Missing intercity transport booking records & backend endpoints | Intercity transport requests generated from `IntercityBookingModal.tsx` remain purely client-side without backend notification. | **HIGH** |
| **6** | **Custom Transport Fleet Management** | `swat_transport_fleet_global` | Missing `transport_vehicles` table (license plate, vehicle model, capacity, driver name) | Transport operators adding new vehicles in the fleet modal cannot access their fleet list on other devices. | **MEDIUM** |
| **7** | **Guest / Offline Tourist Bookings** | `swat_local_bookings` | Missing `POST /api/v1/bookings/claim` endpoint | Bookings completed as a guest are saved only locally. When the user later registers or logs in, these bookings are not linked to their DB profile. | **MEDIUM** |
| **8** | **Guest / Offline Trip Itineraries** | `swat_local_trips` | Missing guest trip synchronization logic | Trip itineraries created prior to account login are lost if the tourist clears browser data or changes devices. | **LOW** |
| **9** | **Community Host Applications** | `swat_community_host_applications` | Client-side simulation in `UserManagementView.tsx` | Admin approvals for community hosts update mock local state rather than committing to `users` and `community_profiles`. | **LOW** |

---

## 3. Detailed Root-Cause & Implementation Plan

### Gap 1 & 2: Front-Desk Housekeeping & Stay State
- **Root Cause**: While `bookings` has `assigned_room_number`, the physical inventory table `hotel_rooms` lacks a dynamic housekeeping state column.
- **Remediation**:
  1. Add `cleaning_status VARCHAR(20) DEFAULT 'clean'` to `hotel_rooms`.
  2. Add `stay_state VARCHAR(20) DEFAULT 'reserved'` to `hotel_rooms`.
  3. Create endpoint `PATCH /api/v1/listings/{listing_id}/rooms/{room_id}/status`.
  4. Update `HotelTodayScreen.tsx` and `physicalRooms.ts` to fetch and mutate live room statuses via this API.

### Gap 3: Front-Desk Folio Payment Collections
- **Root Cause**: The UI computes remaining balance and stores payments in `swat_hotel_collected_balances`.
- **Remediation**:
  1. Create database table `folio_payments`:
     - `id` (INTEGER PRIMARY KEY)
     - `booking_id` (INTEGER, FK to bookings.id)
     - `amount` (FLOAT)
     - `payment_method` (VARCHAR: `cash`, `pos_card`, `bank_transfer`)
     - `collected_by_user_id` (INTEGER, FK to users.id)
     - `receipt_number` (VARCHAR)
     - `notes` (TEXT)
     - `created_at` (DATETIME)
  2. Implement `POST /api/v1/bookings/{id}/collect-balance` to record a ledger row.

### Gap 4 & 5: Transport & Intercity Orders
- **Root Cause**: Transport widgets bypass `bookingApi.createBookingRequest` and append directly to `localStorage`.
- **Remediation**:
  1. Standardize transport orders to call `POST /api/v1/bookings/request` with `type_code: "transport"`.
  2. Store vehicle type, pickup address, drop-off point, and passenger count inside `booking_items.details_json`.

### Gap 6: Operator Fleet Vehicles
- **Root Cause**: `listings` table represents the business offering, but individual vehicle registrations are kept in `swat_transport_fleet_global`.
- **Remediation**:
  1. Create database table `transport_vehicles`:
     - `id`, `business_id`, `vehicle_type`, `model_name`, `license_plate`, `seat_capacity`, `is_active`.
  2. Add CRUD endpoints: `GET/POST/DELETE /api/v1/listings/transport/fleet`.

### Gap 7 & 8: Guest Booking & Trip Claiming
- **Root Cause**: Unauthenticated visitors cannot obtain JWT tokens to save bookings or trips to the database.
- **Remediation**:
  1. Allow guest bookings to store `guest_email` and `guest_phone` directly on `bookings` with `user_id = NULL`.
  2. Add endpoint `POST /api/v1/bookings/claim` that queries unlinked bookings by phone/email upon user registration and sets `user_id = current_user.id`.

---

## 4. Summary Matrix

| Data Classification | Storage Medium | Total Modules | Data Loss Risk | Multi-Device Sync |
| :--- | :--- | :---: | :---: | :---: |
| **Fully Persisted** | SQLite Database (`swat_tourism_prod.db`) | 9 Modules (40 Tables) | None | Complete |
| **Partially Persisted (Gaps)** | Browser `localStorage` / Ephemeral State | 9 Specific Flows | High (on cache clear) | None (Single Browser only) |
