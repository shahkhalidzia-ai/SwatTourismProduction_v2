# Implementation Prompt: Replacing Business Portal Listing Grid with Inline Services, Rooms & Facilities Management Workspace

## 1. Executive Summary & Objective

### 1.1 Context & Current Behavior
- On the **Business Portal** (`BusinessShell.tsx`), navigating to the **Listings** tab currently displays an executive property card followed by a table/grid (`<DataTable>`), which requires the user to click `[Manage Services, Rooms & Facilities]` to open a modal popup.
- For a dedicated business operator (e.g., **Swat Serena Hotel**), having to click a button to open a popup over a 1-row table grid is redundant and introduces unnecessary modal friction.

### 1.2 Target Experience
- **Eliminate the listing table/grid** from the Listings tab on the Business Portal.
- **Display the "Manage Services, Rooms & Facilities" workspace directly inline on the page** in place of the listing grid.
- The business operator will immediately see their 4 management tabs directly on the screen:
  1. 🛏️ **Rooms & Accommodations:** Live list of configured rooms (Executive Deluxe, Presidential Suite, Standard Twin), nightly rates (PKR), guest capacity, amenities, plus the Add/Edit Room form.
  2. ✨ **Property Facilities:** Interactive toggle checklist for all hotel amenities (Wi-Fi, 24/7 Hot Water, Standby Generator, Parking, Restaurant, Central Heating) + custom facility builder.
  3. 🎯 **Guest Activities:** Interactive management of experiences (Trout Fishing, Bonfires, Guided Treks) with pricing and duration.
  4. ⏱️ **Operating Policies & Contacts:** Direct fields for Check-in / Check-out hours, direct phone, WhatsApp contact with live link, and cancellation policy.

---

## 2. Architecture & Component Blueprint

### 2.1 Component Refactor: `BusinessServicesManagerModal.tsx`
Support an **`embedded?: boolean`** prop (or create an exported `BusinessServicesManagerView` component) so that the form can render inline on the page without a fixed overlay, backdrop, or modal "X" close button:

```tsx
interface BusinessServicesManagerProps {
  embedded?: boolean;          // When true, renders directly in-page without fixed overlay/backdrop
  isOpen?: boolean;            // Used when opened as a modal (default: true if embedded)
  onClose?: () => void;        // Optional in embedded mode
  listings: ListingItem[];
  businessName?: string;
  onRefresh?: () => Promise<void> | void;
}
```

#### Behavior when `embedded === true`:
- **No backdrop:** Omit the `position: fixed, inset: 0, backgroundColor: rgba(0,0,0,0.6)` wrapper.
- **Card-level container:** Render inside a native `<Card>` or styled `<div>` that fills the available container width (`100%`).
- **No close button:** Hide the top-right `[X]` button, since the view is now the permanent page content of the tab.
- **Sticky / Tab navigation:** The 4 section tabs (`Rooms & Accommodations`, `Property Facilities`, `Guest Activities`, `Policies & Contacts`) sit cleanly at the top of the workspace.

---

### 2.2 Shell Integration: `BusinessShell.tsx`

In `BusinessShell.tsx`, under `{activeTab === 'listings'}`:
1. **Remove:**
   - The `<DataTable<ListingRow>>` grid and its mobile card fallback.
   - Any redundant "Open Popup" buttons that duplicate the inline form.
2. **Embed:**
   - Render the `BusinessServicesManagerModal` (or `BusinessServicesManagerView`) with `embedded={true}` directly as the primary body of the tab:
   ```tsx
   {activeTab === 'listings' && (
     <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
       {/* Property Header & Meta Summary */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
         <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Building2 size={22} color="var(--pri)" />
             <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, margin: 0 }}>
               {currentBizName}
             </h3>
             <Tag variant="ok">Verified Business</Tag>
           </div>
           <p style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', margin: '4px 0 0' }}>
             {user?.business_profile?.address_text || 'Saidu Sharif, Swat Valley'} • Reg # {currentBizRegNo}
           </p>
         </div>

         <div style={{ display: 'flex', gap: '8px' }}>
           <Button
             variant="secondary"
             size="sm"
             icon={<Calendar size={14} />}
             onClick={() => openAvailabilityModal()}
           >
             Availability Calendar
           </Button>
           <Button
             variant="soft"
             size="sm"
             icon={<Plus size={14} />}
             onClick={() => setIsBuilderOpen(true)}
           >
             Edit Basic Info
           </Button>
         </div>
       </div>

       {/* Inline Services, Rooms, Facilities & Activities Workspace */}
       <BusinessServicesManagerModal
         embedded={true}
         listings={listings.map(l => l.rawListing).filter(Boolean) as ListingItem[]}
         businessName={currentBizName}
         onRefresh={reloadListings}
       />
     </div>
   )}
   ```

---

## 3. Data Scoping & Functional Parity

1. **Strict Operator Scoping:**
   - All rooms, facilities, activities, and timings remain strictly scoped to the logged-in business (`user.business_profile.id`).
2. **Immediate Persistence:**
   - Adding or editing a room type immediately updates local state and synchronizes with the backend via `addPriceItem` / `updatePriceItem`.
   - Modifying property facilities updates `ListingDetail.facilities`.
   - Modifying guest activities updates `ListingDetail.activities`.
   - Modifying check-in/out times updates `opening_time` and `closing_time`.
3. **Tourist-Facing Availability:**
   - Any room added or updated in this inline form immediately reflects on the Tourist portal when selecting rooms for an itinerary stay.

---

## 4. Verification & Acceptance Criteria

1. **Direct Visibility (No Clicks to Open):**
   - Navigate to: `http://localhost:5180/?role=business&tab=listings`.
   - **Verification:** The "Rooms & Accommodations", "Property Facilities", "Guest Activities", and "Timings & Policies" tabs appear **immediately on the page**.
   - **Verification:** There is **NO listing grid table** and **NO popup backdrop/overlay**.
2. **Interactive Tab Switching:**
   - Click "Property Facilities": Facility checkboxes appear directly in-page without any modal popup.
   - Click "Guest Activities": Activity cards appear directly in-page.
   - Click "Timings & Policies": Check-in/out and WhatsApp link appear directly in-page.
3. **Add/Edit Functionality:**
   - Click `+ Add New Room Type`: Inline form expands; adding a room saves and renders it directly in the room list.
   - Toggle any facility (e.g. Wi-Fi, Generator Backup): Toast confirmation appears with zero page reloads.
