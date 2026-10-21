# Implementation Prompt: Tourist Hotel Room Selection, Live Availability & Booking Popup

## Objective
Enhance the Hotel Details & Stay Booking experience so that when a tourist selects any hotel (such as Swat Serena Hotel or any hotel in Swat Valley), a comprehensive hotel modal/popup opens displaying **all configured room types** with **live availability**, **transparent pricing**, **date/night calculations**, and interactive controls allowing the tourist to choose the exact room type they wish to reserve or add to their trip.

---

## 1. Functional Requirements

### 1.1 Stay Dates & Guest Configuration
Inside the hotel popup, provide an interactive **Stay Details Bar**:
- **Check-in Date & Check-out Date pickers**:
  - Default check-in to today/tomorrow, check-out to +1 or +2 nights.
  - Automatically calculate and display the number of nights (e.g., `2 Nights`).
  - Restrict past dates and ensure `check_out > check_in`.
- **Number of Guests / Travellers selector** (1 to 10 guests) and **Number of Rooms selector** (1 to 5 rooms).

### 1.2 All Room Types with Live Availability & Pricing
Display each configured room type under the hotel (e.g., *Executive Deluxe Room*, *Deluxe Heritage Suite*, *Standard Mountain Chalet*, *Family Valley Suite*) with:
1. **Room Specifications & Badges**:
   - Room Title & Category badge (e.g., "Executive Suite", "Heritage Stay").
   - Maximum Guest Capacity (e.g., "Up to 3 Guests").
   - Bedding details (e.g., "1 King Bed + 1 Single Bed").
   - Key Room Amenities pills (e.g., "Mountain Balcony", "Heating & Hot Water", "Wi-Fi", "Complimentary Breakfast").
   - Room description detailing the stay experience.
2. **Dynamic Live Availability Indicator**:
   - Query the availability endpoint (`GET /api/v1/listings/{hotel_id}/availability?start_date=...&end_date=...`) for the selected dates.
   - For each room, determine the minimum available units across the selected date range:
     - If `units_available >= requested_rooms`: Display a green badge (e.g., `✓ 4 Rooms Available`).
     - If `units_available > 0` but `< requested_rooms`: Display an amber warning (e.g., `⚠ Only 1 Room Available for these dates`).
     - If `units_available == 0` or date is blocked: Display a red badge (e.g., `Sold Out / Closed`), and disable selection.
3. **Transparent Price & Total Breakdown**:
   - Show Rate per Night (e.g., `PKR 12,000 / night`).
   - Show Calculated Stay Total: `PKR (Rate * Nights * Rooms)` with breakdown (e.g., `PKR 24,000 for 2 nights`).

### 1.3 Interactive Room Selection & Booking Actions
For each available room type, allow the tourist to select their desired choice:
- **Radio / Card Selection**: Clearly highlight the selected room with an active border, checkmark, and accent background.
- **Action 1: "Add Room to Itinerary / Trip"**:
  - Adds the selected room type, dates, and number of guests to the tourist's current active trip plan.
  - Updates the trip stops and estimated budget.
- **Action 2: "Instant Reserve / Book Stay"**:
  - Opens a confirmation drawer/dialog or directly sends `POST /api/v1/bookings/request` with:
    - `listing_id`: Hotel listing UUID.
    - `start_date` and `end_date`: Chosen check-in and check-out dates.
    - `travellers`: Number of guests.
    - `items`: Selected room `price_item_id` and room quantity.
  - On success:
    - Generates and presents booking confirmation with reference code (e.g., `SWT-XXXXXX`).
    - The booking immediately becomes visible on both the Tourist's **Trips / Bookings** screen and the Hotel Manager's **Today / Bookings** portal (`hotel@swattourism.pk`).

---

## 2. API & Data Contracts

### 2.1 Fetching Hotel Rooms & Facilities
- `GET /api/v1/listings/{id}`:
  - Must return `price_items` where `is_bookable = true` and `unit = 'per_night'`.
  - Include item `capacity`, `default_units`, and `details` (bed configuration, amenities).

### 2.2 Live Availability Check
- `GET /api/v1/listings/{id}/availability?start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}`:
  - Returns date-by-date availability array for each room `price_item_id`.
  - Frontend matches the minimum available units over all dates in the requested range.

### 2.3 Submitting Room Booking Request
- `POST /api/v1/bookings/request`:
  ```json
  {
    "listing_id": "<hotel_uuid>",
    "start_date": "2026-10-10",
    "end_date": "2026-10-12",
    "travellers": 2,
    "special_requests": "Upper floor mountain view requested",
    "items": [
      {
        "price_item_id": "<room_price_item_uuid>",
        "quantity": 1
      }
    ]
  }
  ```

---

## 3. UI/UX Design System Guidelines

1. **Aesthetics & Styling**:
   - Modern glassmorphism header with hotel photography, star ratings, and authority-verified badges.
   - Clean tabs: **Rooms & Rates**, **Hotel Facilities**, and **Activities / Concierge**.
   - Distinctive room cards featuring subtle hover micro-interactions, responsive padding, and clear contrast.
2. **Visual Hierarchy**:
   - Prominent sticky footer displaying:
     - Currently selected room name.
     - Stay summary (e.g., `2 Nights • 2 Guests • 1 Room`).
     - Total Amount: `PKR XX,XXX`.
     - Dual CTA buttons: `Add to Trip` and `Reserve Now`.
3. **Empty / Sold-Out States**:
   - If all rooms are sold out for the chosen dates, display an informative banner recommending alternative dates or calendar browsing.

---

## 4. Verification & Testing Checklist

1. **Unit & API Testing (`backend/tests`)**:
   - Verify that all hotel room `PriceItem` records are correctly queried and serialized.
   - Test that booking dates outside availability or exceeding unit limits return `409 Conflict`.
   - Test that valid room bookings succeed with reference numbers and reserve unit counts in `availability`.
2. **Frontend Component & Build Verification**:
   - Run `npm run build` in `frontend/` to guarantee TypeScript types and bundle integrity.
3. **E2E Persona Walkthrough**:
   - Log in as `tourist@swattourism.pk` -> Explore Hotels -> Click **Swat Serena Hotel**.
   - Change check-in/check-out dates -> Verify live rates and availability update automatically.
   - Select room type (e.g., "Executive Deluxe Room") -> Click **Reserve Now**.
   - Switch to Hotel Manager (`hotel@swattourism.pk`) -> Verify the room booking appears immediately in the **Bookings & Requests** portal.
