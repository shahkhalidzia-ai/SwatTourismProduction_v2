# Feature Specification & Implementation Prompt: Hotel Portal Individual Room Management & Guest Room Assignment Workflow

## 1. Feature Overview
This feature introduces **Physical Room/Key Configuration** and **Guest Room Assignment** to the Swat Tourism Hotel Portal.

Currently, hotels manage aggregate room *categories* (e.g., "Executive Deluxe - 5 units"). With this feature:
1. **Physical Room Inventory Setup**: Hotel managers/owners can configure their individual physical room numbers and keys (e.g., Room 101, 102, 103 on Floor 1; Suite 201, 202 on Floor 2) attached to each room category.
2. **Booking Acceptance & Specific Room Reservation**: When a tourist requests a stay and the manager accepts the booking, the manager can assign a specific available room number (e.g., "Assign Room 102") to that tourist's reservation.
3. **Room Status Synchronization**: 
   - The assigned physical room transitions to `Reserved` (or `Occupied` during check-in).
   - The aggregate availability count for that room category automatically updates in real-time.
   - The tourist's reservation voucher and itinerary update to show their assigned room number and floor.
4. **Interactive Key Rack / Room Status Board**: Hotel staff can view a visual, color-coded room status board (Available, Reserved, Occupied, Cleaning/Maintenance) directly on the portal.

---

## 2. User Stories & Workflows

### Workflow A: Hotel Owner Configures Physical Rooms
1. The hotel owner navigates to **Listings & Rooms** (or **Manage Rooms & Suites**).
2. Under each room category (e.g., "Executive Deluxe Room"), they can click **"Configure Physical Rooms / Keys"**.
3. They can:
   - **Quick Generate**: Specify floor and range (e.g., Floor 1, Rooms 101 to 105) to instantly create rooms.
   - **Manual Add**: Add individual rooms with custom details (Room Number, Floor/Wing, View, Bed Setup).
4. Physical rooms are stored and linked to the listing and specific price item category.

### Workflow B: Manager Accepts Booking & Assigns Specific Room
1. A tourist submits a booking request for "Executive Deluxe Room" from Oct 22 to Oct 24.
2. In the Hotel Portal **Today** tab or **Bookings** tab:
   - The manager clicks **"Accept Booking"**.
   - An intuitive **"Assign Room"** prompt or drawer appears, showing all available physical rooms for that category on those dates.
   - The manager selects **"Room 102 (Floor 1 - Mountain View)"** and confirms assignment.
3. The booking status updates with:
   - `assigned_room_number: "Room 102"`
   - `assigned_room_id: "room-102"`
   - `assigned_at: timestamp`
4. The physical room's status for those dates is marked as **Reserved** for the tourist (Sara Ahmed - BK-2041).
5. The room category's available unit count dynamically decrements by 1 on the 5-day Today matrix and the 60-day Availability calendar.

### Workflow C: Room Status Board / Key Rack on Today Screen
1. On the **Today** screen, hotel managers see an interactive **Room Rack / Key Status Grid**:
   - Filterable by Floor (All, Floor 1, Floor 2) and Status (`All`, `Available`, `Reserved`, `Occupied`, `Maintenance`).
   - Cards display room number, category, current guest name (if reserved), and quick action buttons (**Reassign**, **Mark Clean**, **Check In**).

### Workflow D: Tourist Experience
1. When the tourist views their booking in **My Trips** or opens the **Booking Voucher**:
   - The voucher clearly displays: **"Assigned Room: Room 102 (Floor 1)"**.
   - The stay card in the itinerary confirms the reserved room number.

---

## 3. Data Models & Schema Design

### 3.1 Physical Room Entity (`PhysicalRoom`)
```typescript
export interface PhysicalRoom {
  id: string;                         // e.g. "room-101"
  listing_id: string;                 // Hotel listing ID
  price_item_id: string;              // Linked room category ID (e.g. "p-deluxe")
  category_name: string;              // e.g. "Executive Deluxe Room"
  room_number: string;                // e.g. "101", "Suite 201"
  floor: number | string;             // e.g. 1, 2, "Ground"
  wing?: string;                      // e.g. "East Wing", "River Wing"
  bed_setup?: string;                 // e.g. "1 King Bed"
  status: 'available' | 'reserved' | 'occupied' | 'maintenance' | 'cleaning';
  current_booking_id?: string;        // ID of active booking occupying/reserving this room
  current_guest_name?: string;        // Guest name for quick display
  stay_dates?: string;                // e.g. "2026-10-22 – 2026-10-24"
  notes?: string;
  updated_at: string;
}
```

### 3.2 Booking Record Extension (`BookingItem`)
```typescript
// Add assigned room details to the booking record
export interface BookingItem {
  // Existing fields...
  id: string;
  reference: string;
  status: string;
  // New assignment fields:
  assigned_room_id?: string;
  assigned_room_number?: string;
  assigned_room_floor?: string | number;
  assigned_at?: string;
}
```

---

## 4. UI Components to Build / Enhance

### 4.1 Room Configuration Manager (`PhysicalRoomConfigModal.tsx`)
- Opened from **Listings & Rooms** -> `+ Configure Physical Rooms`.
- Allows bulk creation (e.g., generate rooms 101 to 105 for Floor 1) or manual addition.
- Table listing existing rooms with status toggles (`available`, `maintenance`, `cleaning`).

### 4.2 Room Assignment Modal / Drawer (`AssignRoomModal.tsx`)
- Triggered when manager clicks **"Assign Room"** or accepts a booking request.
- Displays guest name, stay dates, requested room type.
- Lists all compatible physical rooms with real-time collision detection (only rooms not already reserved for those dates can be selected).
- One-click confirmation with instant feedback toast.

### 4.3 Interactive Room Key Rack on Today Screen (`HotelTodayScreen.tsx`)
- Adds a **"Live Room Key Rack"** card below or alongside the 5-day matrix.
- Visual tiles for each room:
  - 🟢 **Available** (e.g. Room 101 - Ready)
  - 🟡 **Reserved** (e.g. Room 102 - Sara Ahmed - Oct 22-24)
  - 🔴 **Occupied** (e.g. Room 103 - In-House Guest)
  - ⚪ **Maintenance / Cleaning** (e.g. Room 104 - Turn-down)

### 4.4 Booking Card & Voucher Integration
- Updates the booking card on **Today** tab and **Trips** tab to show assigned room badge:
  `🛏️ Assigned: Room 102`.
- Option to **"Change Room"** or **"Release Room"**.

---

## 5. Implementation Steps

1. **Step 1: State & Storage Layer (`physical_rooms.ts` / LocalStorage / API)**
   - Implement storage helper for physical rooms per hotel with default seeding for demo properties.
   - Support CRUD operations: `getPhysicalRooms`, `savePhysicalRoom`, `bulkCreateRooms`, `assignRoomToBooking`, `releaseRoomAssignment`.

2. **Step 2: Room Configuration Interface (`PhysicalRoomConfigModal.tsx`)**
   - Provide a UI for hotel owners to add and manage room numbers for their room categories.

3. **Step 3: Assignment Flow on Acceptance (`AssignRoomModal.tsx` & `HotelTodayScreen.tsx`)**
   - Connect the booking acceptance action to room assignment.
   - When accepted, prompt manager to assign a room or auto-assign the first available room with manual override.

4. **Step 4: Live Key Rack & Status Visualization (`HotelTodayScreen.tsx`)**
   - Embed the interactive Room Rack on the Today tab showing real-time physical room states.

5. **Step 5: Tourist Voucher & Itinerary Display (`TripManagerView.tsx` & `BookingModal.tsx`)**
   - Ensure tourists see their assigned room number on their confirmed trip vouchers and check-in cards.

6. **Step 6: Automated Testing & Verification**
   - Write end-to-end tests for room configuration, assignment on booking acceptance, status updates, and voucher display.
   - Run Vitest suite (`npx vitest run`) and production build (`npm run build`).
