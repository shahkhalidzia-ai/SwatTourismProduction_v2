# Specification & Implementation Prompt: Business-Type Specific Screens & Workflows

**Document Version:** 1.0  
**Target:** Business Portal (`BusinessShell.tsx`, `navItems.ts`, `App.tsx`, and responsive sub-views)  
**Date:** 2026-10-13  
**Status:** Approved for Implementation

---

## 1. Executive Summary & Problem Statement

Currently, when any business operator logs in (Hotels, Transport Providers, Restaurants/Cafes, Activity/Adventure organizers, or Shopkeepers), the Business Portal predominantly renders hotel-centric tabs and interface elements:
- Tabs show generic names (`Today`, `Listings`, `Availability`, `Reviews`, `Profile`).
- The offerings command grid only displays hotel rooms (`Executive Room`, `Presidential Suite`, `Configured Rooms`).
- The booking completion action reads `Complete Stay`.
- The availability section defaults to hotel room nights.

This prompt establishes an adaptive, industry-specific interface system that dynamically contextualizes navigation tabs, KPI dashboards, offering management pillars, work-order status badges, and availability workflows based on the logged-in operator's primary category (`hotel`, `restaurant`, `transport`, `activity`, `shop`, or `guide`).

---

## 2. Architectural Design Matrix by Business Type

| Business Type | Dynamic Tabs & Labels | KPI Dashboard (`Today`) | Offerings & Inventory (`Listings`) | Calendar & Capacity (`Availability`) | Work Order Actions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **🚙 Transport Service Provider** | • **Dispatch:** `Fleet & Rides`<br>• **Fleet:** `Vehicles & Routes`<br>• **Schedule:** `Vehicle Dispatch`<br>• **Reviews:** `Passenger Reviews`<br>• **Profile:** `Permits & Fleet` | • **Active Fleet:** Available vs En Route.<br>• **Scheduled Rides:** Today's departures.<br>• **Weekly Fares:** Total ticket & charter revenue.<br>• **Pending Bookings:** Incoming ride requests. | • **Vehicles:** 4x4 Mountain Jeep, Toyota Prado, Grand Cabin Hiace, Coaster.<br>• **Routes:** Intercity (Islamabad ➔ Swat) & Valley (Kalam ➔ Mahodand).<br>• **Pricing:** Per Seat / Per Day charter. | • **Vehicle Availability:** Track which jeeps/coasters are booked or in maintenance.<br>• **Blackout Dates:** Road closure or vehicle service days. | • **Confirm Ride**<br>• **Assign Driver & Plate**<br>• **Complete Ride** |
| **🍽️ Restaurant & Cafe Provider** | • **Orders:** `Dining & Orders`<br>• **Menu:** `Menu & Dining`<br>• **Reservations:** `Table Calendar`<br>• **Reviews:** `Diner Reviews`<br>• **Profile:** `Kitchen & Hygiene` | • **Covers Today:** Expected diners & tables.<br>• **Active Orders:** Dine-in & advance vouchers.<br>• **Dining Revenue:** Weekly meal receipts.<br>• **Pending Tables:** Reservation requests. | • **Signature Dishes:** Swati River Trout, Peshawari Chapli Kebab, Shinwari Mutton, Green Tea Kahwa.<br>• **Seating Types:** Riverside Terrace, Family Hujra Cabins, Indoor Hall.<br>• **Pricing:** Per Dish / Set Menu. | • **Table Allocation:** Lunch, High Tea, and Dinner seating slots.<br>• **Banquet Bookings:** Reserve whole halls for tour groups. | • **Accept Reservation**<br>• **Reserve Table #**<br>• **Complete Meal Order** |
| **🏕️ Activities & Festival Provider** | • **Sessions:** `Events & Bookings`<br>• **Catalog:** `Activities & Passes`<br>• **Slots:** `Season Calendar`<br>• **Reviews:** `Participant Reviews`<br>• **Profile:** `Safety & Licences` | • **Registered Participants:** Headcount today.<br>• **Active Sessions:** Rafting / Ski passes.<br>• **Ticket Revenue:** Pass sales this week.<br>• **Pending Bookings:** Group reservations. | • **Activities & Passes:** Swat River Rafting, Malam Jabba Ski Pass, Mahodand Lake Eco-Camping, Kalam Summer Festival.<br>• **Equipment Inclusions:** Lifejackets, Tents, Ski gear, Certified Guide.<br>• **Pricing:** Per Person / Group Pass. | • **Slot Management:** Morning / Afternoon adventure slots.<br>• **Seasonal Scheduling:** Summer festival dates, snow season passes.<br>• **Weather Blackouts:** High river flow / snowstorm pauses. | • **Confirm Pass**<br>• **Issue Safety Waiver**<br>• **Complete Session** |
| **🏨 Hotel & Resort Provider** | • **Today:** `Occupancy & Check-ins`<br>• **Rooms:** `Rooms & Suites`<br>• **Calendar:** `Room Calendar`<br>• **Reviews:** `Guest Reviews`<br>• **Profile:** `Hotel Licenses` | • **Occupancy Rate:** Rooms filled vs vacant.<br>• **Check-ins Today:** Arriving guests.<br>• **Weekly RevPAR:** Room night earnings.<br>• **Pending Requests:** Unconfirmed stays. | • **Room Categories:** Executive Deluxe, Presidential Suite, Standard Twin, Banquet Hall.<br>• **Amenities:** Climate heating, generator, heated water, mountain balcony.<br>• **Pricing:** Per Night. | • **Nightly Room Grid:** Calendar rates, seasonal surge pricing.<br>• **Block Out:** Room renovation or private booking holds. | • **Accept Stay**<br>• **Assign Room #**<br>• **Complete Stay** |

---

## 3. Implementation Steps

1. **Dynamic Navigation Generator (`navItems.ts` & `App.tsx`):**
   - Implement `getBusinessNavItems(primaryType: ListingTypeCode)` to produce dynamic navigation tabs with category-specific labels and icons.
   - Update `App.tsx` to query dynamic nav items based on `user?.business_profile?.primary_type`.

2. **Offering Management Pillars (`BusinessShell.tsx`):**
   - Replace the hardcoded 4 pillars with category-specific cards:
     - **Transport:** Fleet Vehicles, Driver Roster, Valley Routes, Safety Equipment.
     - **Restaurant:** Signature Dishes, Dining Zones & Cabins, Meal Hours, Dietary/Halal Tags.
     - **Activity / Festival:** Adventure Sessions & Passes, Safety Gear & Rentals, Guide Roster, Weather Readiness.
     - **Hotel:** Configured Rooms, Key Facilities, Check-in/Check-out, Room Pricing.

3. **Contextual Work Order Actions & KPI Cards (`Today` Tab):**
   - Dynamic KPI counters:
     - Transport: `Active Rides Today`, `Fleet Fare Total`, `Pending Ride Requests`.
     - Restaurant: `Covers / Orders Today`, `Food & Beverage Total`, `Pending Table Reservations`.
     - Activity: `Participants Today`, `Ticket Sales Total`, `Pending Adventure Bookings`.
     - Hotel: `Bookings Today`, `Earnings This Week`, `Pending Check-in Requests`.
   - Contextual completion buttons: `Complete Ride`, `Complete Meal Order`, `Complete Session`, `Complete Stay`.

4. **Availability & Calendar Framing (`Availability` Tab):**
   - Title and labels dynamically match:
     - Transport: `Vehicle Dispatch & Route Schedule Calendar`.
     - Restaurant: `Table & Cabin Reservation Schedule`.
     - Activity: `Adventure Sessions & Festival Dates Calendar`.
     - Hotel: `Nightly Room Inventory & Blackout Calendar`.
