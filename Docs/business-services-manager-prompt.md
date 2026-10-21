# Implementation Prompt: Business Services, Facilities, Rooms & Activities Management Form

## Objective
Provide a dedicated, isolated management form on the **Business / Hotel Portal** where a logged-in business operator (such as a hotel owner, resort manager, or service provider) can view, add, edit, and update all services, facilities, room types, and recreational activities **strictly belonging to their own business**.

> **Important Architecture Constraint:**
> Do **NOT** modify or break any existing forms (e.g., preserve the existing listing creation modal untouched). Implement a **NEW, standalone management component/form** dedicated specifically to managing and updating business services, facilities, rooms, and activities.

---

## 1. Persona & Security Isolation Scope
- **User Persona:** Authenticated Business User (`role: 'business'`, e.g., `riverside@swat.pk`, `hotel@swat.pk`).
- **Data Scoping:** 
  - Every read and write operation MUST be scoped strictly to `user.business_profile.id`.
  - The business operator can ONLY view and edit their own business offerings. Access to any other operator's listings, rooms, or services must be denied with a 403 Forbidden error.

---

## 2. Form Architecture & Structure

Create a new component: `frontend/src/modules/business/BusinessServicesManagerModal.tsx` (or dedicated tab view inside `BusinessShell.tsx`):

### 2.1 Tabbed / Sectioned Management Layout
The form should feature a clean header showing the active Business Name (e.g., *Swat Serena Hotel* or *Riverside Inn, Madyan*) and provide 4 structured management sections:

#### Section 1: Rooms & Accommodations Manager (For Hotels & Stays)
- **Room List Table / Cards:**
  - Display all current configured rooms (e.g., *Executive Deluxe Room*, *Deluxe Family Suite*, *Standard Double Room*).
  - Show Room Name, Rate per Night (PKR), Guest Capacity, Total Units/Inventory count, and Status.
- **Add / Edit Room Sub-Form:**
  - **Room Name / Title** (e.g., "Executive Mountain View Suite").
  - **Pricing & Billing Unit** (Default: `PKR / night`).
  - **Room Capacity** (e.g., 2, 3, 4, 6 guests).
  - **Available Inventory Units** (e.g., 5 rooms of this type).
  - **Bed Configuration** (e.g., "1 King Bed", "2 Queen Beds", "Twin Singles").
  - **Room Amenities Checklist:**
    - `[x] Mountain / River Balcony`
    - `[x] Room Heating & Climate Comfort`
    - `[x] En-suite Bathroom with 24/7 Hot Water`
    - `[x] High-Speed Wi-Fi`
    - `[x] Smart LED TV`
    - `[x] Complimentary Breakfast Included`
    - `[x] Electric Kettle & Tea Setup`
  - **Room Description:** Detailed text describing the room experience.
  - **Action Buttons:** `Save Room` / `Update Room` / `Cancel`.

#### Section 2: Hotel & Property Facilities Manager
- **Categorized Facilities Checklist & Custom Additions:**
  - **Essential Utilities:**
    - 24/7 Uninterrupted Electricity / Generator Backup
    - Hot Running Water & Central / Gas Heating
    - Free High-Speed Wi-Fi in Rooms & Public Areas
    - Secure Private On-site Parking
  - **Guest Comfort & Dining:**
    - In-house Riverside / Garden Restaurant
    - 24-Hour Room Service
    - Outdoor Lawn / Terraced Garden
    - Bonfire & Barbecue Area
  - **Accessibility & Security:**
    - 24/7 Security Guards & CCTV Surveillance
    - Wheelchair Accessible Ramps
    - Daily Housekeeping & Laundry Service
  - **Add Custom Facility:** Input field allowing the manager to type custom amenities (e.g., "Kids Play Area", "Prayer Room", "Conference Hall") with an `+ Add Facility` button.

#### Section 3: Activities & Experiences Manager
- **Experience Catalog for Guests:**
  - View, add, and toggle activities offered at or arranged by the hotel:
    - *River Trout Fishing*
    - *Guided Hiking & Valley Nature Walks*
    - *Evening Bonfire & Cultural Music Night*
    - *Chairlift & Ski Excursions*
    - *4x4 Jeep Safari to Glacial Lakes (Mahodand / Kundol)*
- **Add / Edit Activity Fields:**
  - **Activity Name** (e.g., "Guided Mahodand Lake 4x4 Excursion").
  - **Duration** (e.g., "Full Day / 6 Hours").
  - **Price / Fee** (e.g., `PKR 8,500` or `Included / Free for Guests`).
  - **Guide Provided:** Yes / No toggle.
  - **Short Description:** What guests can expect.

#### Section 4: General Business Services & Contact Info
- **Operational Timings:**
  - Standard Check-in Time (e.g., `14:00`).
  - Standard Check-out Time (e.g., `12:00`).
- **Contact & WhatsApp Linkage:**
  - Direct Front Desk Phone.
  - Direct Reservation WhatsApp Number (`0300-XXXXXXX` -> auto `wa.me` links).
  - Reception / Concierge Email.
- **Payment & Booking Policies:**
  - Advance Deposit Policy.
  - Cancellation / Refund Window.

---

## 3. Backend Endpoints & Data Model

Ensure backend support under `/api/v1/business/`:

### 3.1 Fetch Current Offerings
- `GET /api/v1/business/my-services`
  - **Authorization:** `Bearer <JWT Token>` (Role must be `business`).
  - **Response:**
    ```json
    {
      "business_id": "uuid",
      "business_name": "Swat Serena Hotel",
      "primary_type": "hotel",
      "facilities": ["Free Wi-Fi", "Heating", "Hot Water", "Generator Backup", "Parking", "Restaurant"],
      "activities": [
        {
          "name": "Evening Garden Bonfire",
          "price": 0,
          "duration": "2 hours",
          "description": "Complimentary nightly fire pit in the rose gardens."
        }
      ],
      "rooms": [
        {
          "id": "uuid",
          "name": "Executive Deluxe Room",
          "price": 18500,
          "capacity": 2,
          "units": 10,
          "amenities": ["Mountain View", "Heating", "Hot Water", "Breakfast"],
          "description": "Spacious alpine room with panoramic valley balcony."
        }
      ],
      "check_in_time": "14:00",
      "check_out_time": "12:00",
      "phone": "+92-946-712345",
      "whatsapp_number": "0300-8877665"
    }
    ```

### 3.2 Update Offerings & Services
- `PUT /api/v1/business/my-services`
  - **Authorization:** `Bearer <JWT Token>`.
  - **Request Body:** JSON payload containing updated `facilities`, `activities`, and operational settings.
  - **Behavior:** Updates the business's active listing `details` json and properties atomically without touching other businesses.

### 3.3 Add / Update Specific Room Types
- `POST /api/v1/business/my-services/rooms`
  - Adds a new bookable room price item under the business's hotel listing.
- `PUT /api/v1/business/my-services/rooms/{room_id}`
  - Updates an existing room's pricing, capacity, inventory count, and amenities.
- `DELETE /api/v1/business/my-services/rooms/{room_id}`
  - Soft-deletes or archives a room type.

---

## 4. UI / UX Integration in Business Portal

1. **Trigger Button:**
   - In `BusinessShell.tsx` under the **Listings** or **Today** tab, add a prominent button:
     - `⚙️ Manage Business Services & Rooms` or `+ Edit Services & Facilities`.
2. **Visual Feedback:**
   - Toast notification upon save: *"Business services and room configurations updated successfully!"*
   - Real-time synchronization: Changes immediately reflect on the **Tourist Portal** when tourists view the hotel's room selection popup and facility badges.
3. **Design System Adherence:**
   - Use standard tokens: `--bg`, `--card`, `--ink`, `--mute`, `--pri`, `--line`, and `Tag`/`Button` components.

---

## 5. Verification & Acceptance Criteria
1. **Isolation:** Logging in as Business A (e.g., *Swat Serena Hotel*) displays only Serena's rooms and facilities. Logging in as Business B (*Riverside Inn*) shows only Riverside's data.
2. **New Form Integrity:** Existing listing creation workflows remain 100% untouched and functional.
3. **Tourist Reflection:** Adding a new room type (e.g., "Presidential Valley Suite" @ PKR 28,000) in this form immediately makes it visible and bookable in the Tourist room selection modal.
4. **Validation:** Negative rates, 0 capacity, or empty room titles are caught by client-side validation.
