# Implementation Prompt: Scoping Business Portal to Authenticated Business Entity & Consolidating Master Directory to Authority Portal

## 1. Objective & Background

### 1.1 Current Issue
- Currently, when a business user logs in (e.g. **Swat Serena Hotel** via `hotel@swat.pk`), the **Business Portal -> Listings** tab shows a broad catalog of multiple different businesses (`Riverside Inn, Madyan`, `Riverside Trout Corner`, `Kalam 4x4 Mountain Jeep Safari`, `Ali Khan Alpine Guide`, `Kalam Handicrafts`, etc.).
- A logged-in business owner should **only see and manage their own specific business entity** (e.g. Swat Serena Hotel), with direct access to configure **their** Rooms, Facilities, Activities, and Operating Policies.
- The comprehensive cross-business listing management function (filtering across all categories like Hotels, Restaurants, Transport, Guides, Shops) belongs exclusively to the **Authority / Super Admin Portal** under the **Directory** tab (`activeTab === 'directory'`).

### 1.2 Target Deliverables
1. **Business Portal (`BusinessShell.tsx`)**:
   - Strict entity scoping: When logged in as Serena Hotel (or any business user), only display **that specific business/hotel**.
   - Direct Property Management View: Show the business entity card with current status (Verified, Published), property statistics, and direct action triggers for:
     - 🛏️ **Manage Rooms & Accommodations**
     - ✨ **Manage Property Facilities & Amenities**
     - 🎯 **Manage Guest Activities & Tours**
     - ⏱️ **Edit Policies, Timings & Contacts**
     - 📅 **Availability & Blackout Dates**
   - Eliminate unrelated cross-business category filter chips from the individual business owner's portal.
2. **Authority & Admin Portals (`AuthorityShell.tsx` Directory Tab)**:
   - Ensure the **Directory** tab houses the entire Swat-wide multi-category business directory.
   - Comprehensive filters (All, Hotels, Restaurants, Transport, Tour Guides, Activities, Local Shops) and valley area filter.
   - Detailed inspection drawer/modal showing all rooms, facilities, rates, and compliance docs for any business in Swat.

---

## 2. Technical Implementation Specifications

### Task A: Update `BusinessShell.tsx` (Scoped Business Entity View)

1. **Entity Identification**:
   - Retrieve `user.business_profile`:
     ```ts
     const currentBizId = user?.business_profile?.id || 'biz-hotel-1';
     const currentBizName = user?.business_profile?.business_name || 'Swat Serena Hotel';
     ```
2. **Listing Scoping**:
   - In `reloadListings()` and initial state:
     - Filter fetched listings so only listings where `l.business_id === currentBizId` or `l.title.includes(currentBizName)` or `l.business_name === currentBizName` are loaded.
     - Fallback demo data: If no custom backend listing exists for this business yet, initialize strictly with **Swat Serena Hotel** (or the matching logged-in business entity), NEVER with an array of other hotels/jeeps/shops.
     ```ts
     const DEFAULT_SERENA_LISTING: ListingRow = {
       id: 'listing-serena-hotel',
       title: 'Swat Serena Hotel',
       type: 'Luxury Heritage Hotel & Resort',
       typeCode: 'hotel',
       area: 'Saidu Sharif, Swat',
       priceRange: 'Rs 18,500 – 42,000 / night',
       status: 'published',
     };
     ```
3. **Listings Tab UI Overhaul**:
   - Replace the generic multi-item catalog with an executive **Business Property Overview Card**:
     - **Header**: Property Name (`Swat Serena Hotel`), Location (`Saidu Sharif, Swat Valley`), Registration ID (`KP-HOTEL-SERENA-001`), and Verified Badge (`✅ Government Verified`).
     - **Configured Offerings Overview**:
       - **Rooms (3 Types)**: Executive Deluxe Room (Rs 18,500), Heritage Presidential Suite (Rs 42,000), Standard Twin Room (Rs 12,000).
       - **Active Facilities**: Wi-Fi, 24/7 Hot Water, Backup Generator, Free Parking, In-house Restaurant, Heating.
       - **Offered Guest Activities**: Trout Fishing Expedition, Bonfire & Cultural Evening.
     - **Action Triggers**:
       - `[✨ Manage Services, Rooms & Facilities]` -> Opens `BusinessServicesManagerModal`.
       - `[📅 Availability & Pricing Calendar]` -> Opens `BusinessAvailabilityModal`.
       - `[✏️ Edit Listing Details]` -> Opens `ListingBuilderModal` preloaded with this business.

---

### Task B: Ensure Master Directory Functionality on Authority/Admin Portal (`AuthorityShell.tsx`)

1. **Directory Tab Accessibility**:
   - Verify that when `role === 'authority'` or `role === 'admin'` and `activeTab === 'directory'`:
     - Displays all registered tourism businesses across the Swat Valley.
     - Category filter chips: `All Types`, `Hotels & Stays`, `Restaurants & Cafes`, `Jeep & Transport`, `Tour Guides`, `Activities & Sports`, `Handicrafts & Shops`.
     - Valley area filter: `All Areas`, `Kalam`, `Malam Jabba`, `Madyan`, `Miandam`, `Saidu Sharif/Mingora`, `Behrain`.
     - Full-text search by title, owner name, address, or phone number.
2. **Inspection & Regulatory Governance**:
   - Each directory card displays:
     - Category badge, Title, Registered Owner, Valley Area, Address.
     - Services & Rates preview tags.
     - Verification status pill (`APPROVED`, `PENDING`, `REJECTED`).
   - Clicking `[Inspect Details]` opens the full inspection modal with:
     - Business license / registration number.
     - Attached price items & rooms.
     - Verification documents inspection.
     - Quick approval / rejection action buttons.

---

## 3. Data Scoping & Security Rules

| User Role | View Scope on Listings / Directory | Permitted Actions |
| :--- | :--- | :--- |
| **Business User** (`role: 'business'`) | **ONLY their own business entity** (e.g. Swat Serena Hotel) | Add/edit rooms, toggle facilities, set activities, manage rates & availability. |
| **Authority** (`role: 'authority'`) | **All registered businesses across Swat** under Directory tab | Inspect listings, review compliance documents, approve/reject verifications, issue advisories. |
| **Super Admin** (`role: 'admin'`) | **Master oversight of all businesses, listings, and directories** | Full CRUD, verification overrides, directory moderation. |

---

## 4. Verification Steps

1. **Test Business Portal Scoping**:
   - Open: `http://localhost:5180/?role=business&tab=listings`
   - **Expected Result:** Only **Swat Serena Hotel** is shown. No listings from Madyan, Kalam jeep drivers, or local shops appear.
   - Click `[✨ Manage Services, Rooms & Facilities]`:
     - Opens the dedicated manager modal.
     - Displays Serena's rooms, facilities, and activities.
2. **Test Authority Directory Tab**:
   - Open: `http://localhost:5180/?role=authority&tab=directory`
   - **Expected Result:** Master directory is displayed showing all businesses in Swat across all categories (Hotels, Restaurants, Transport, Guides, Activities, Shops).
   - Filter by `Hotels`: Serena Hotel, Riverside Inn, Alpine Lodges appear.
   - Filter by `Transport`: 4x4 Mountain Jeep Safari appears.
   - Click `[Inspect Details]`: Opens full modal with pricing, location, and owner verification.
