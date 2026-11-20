# Swat Tourism Platform — Destination Search, Quick Valleys & Business Area Mapping Implementation Prompt

> **Feature Scope:** Destination Filtering, Quick Valleys Expansion (Mingora & Saidu Sharif), Business Profile Area Assignment & Address Cascading  
> **Target Audience:** Hoteliers, Business Operators, Tourists, and Platform Administrators  
> **Status:** Production Implementation & Verification Specification  
> **Target System:** FastAPI (Backend) + SQLite / PostgreSQL (Database) + React 19 / TypeScript / Vite (Frontend)

---

## 1. Executive Summary & Problem Statement

### 1.1 The Problem
During platform testing on the Swat Tourism Explore & Book Portal, **Swat Serena Hotel** (a flagship 5-star hotel situated in Amanabad, Mingora) failed to appear when tourists clicked on "Mingora" as a destination or searched for Mingora.

Detailed root-cause analysis revealed four interrelated structural gaps:
1. **Missing Destination Filter Pills:** The Quick Valleys navigation bar on the Tourist Portal only contained *Kalam, Malam Jabba, Bahrain, Mahodand, Ushu, White Palace,* and *Miandam*. Mingora (the commercial capital) and Saidu Sharif (the administrative/airport hub) were completely missing from the Quick Valleys bar.
2. **Missing Explicit Business Area Field:** In the Business Profile Editor (`BusinessShell.tsx`), business owners and hoteliers only had a freeform string field for "Premises Physical Address & Location". There was no structured selector for "Destination / Valley (Area)". Without a structured `area_id`, hotels were not linked to the geographical taxonomy of Swat.
3. **No Automatic Cascading from Business Profile to Child Listings:** In the database, `listings` had an `area_id` column, but whenever a business updated its address or location in its profile, the child listings did not inherit those updates, remaining `null` or detached.
4. **Search Filter Blindspot:** In the frontend (`TouristShell.tsx` and `TouristHomeModern.tsx`), the search query was filtering primarily on listing titles and category tags, ignoring `address_text` and `business_name`. Furthermore, common phonetic/spelling variants such as `Mingrora` were rejected by strict substring matching.

---

## 2. Architectural Solution & System Design

```
+--------------------------------------------------------------------------------------------------+
|                                    BUSINESS PROFILE LAYER                                        |
|  BusinessShell.tsx: [ Destination / Valley (Area) Dropdown ]  +  [ Physical Address Input ]       |
|  - Calls GET /api/v1/trips/areas (Populates Kalam, Mingora, Saidu Sharif, Malam Jabba, etc.)     |
|  - Submits PUT /api/v1/auth/profile with { area_id: "...", address_text: "..." }                 |
+-------------------------------------------------+------------------------------------------------+
                                                  |
                                                  v
+--------------------------------------------------------------------------------------------------+
|                                 BACKEND CASCADING & PERSISTENCE                                  |
|  accounts/service.py: update_profile()                                                          |
|  - Updates business_profiles (area_id, address_text, phone, whatsapp_number)                     |
|  - Cascades automatically: UPDATE listings SET area_id = biz.area_id, address_text = ...         |
|                                                                                                  |
|  listings/service.py: listing_to_out()                                                            |
|  - Serialization Fallback: If listing.area_id or address_text is null, inherits from parent biz   |
+-------------------------------------------------+------------------------------------------------+
                                                  |
                                                  v
+--------------------------------------------------------------------------------------------------+
|                                     TOURIST EXPLORE LAYER                                        |
|  TouristShell.tsx & TouristHomeModern.tsx:                                                       |
|  - Quick Valleys Bar: [All] [Kalam] [Malam Jabba] [Mingora 🏙️] [Saidu Sharif 🏛️] ...           |
|  - Search Bar: "Search Kalam, Mahodand, Malam Jabba, Mingora, Saidu Sharif..."                  |
|  - Smart Matching: Matches area_name, address_text, title, business_name                         |
|  - Phonetic Normalization: Automatically maps "Mingrora" <-> "Mingora" and "Amanabad"            |
+--------------------------------------------------------------------------------------------------+
```

---

## 3. Detailed Component Specifications

### 3.1 Backend: Profile Update Cascading (`accounts/service.py`)
When a business profile is saved, the backend updates the business record and cascades the `area_id` and `address_text` to all active listings:

```python
# Synchronize / cascade address, area_id, and contact phone to business listings
if biz.area_id or biz.address_text or biz.phone:
    child_listings = db.query(Listing).filter(Listing.business_id == biz.id).all()
    for child in child_listings:
        if biz.area_id:
            child.area_id = biz.area_id
        if biz.address_text and not child.address_text:
            child.address_text = biz.address_text
        if biz.phone and not child.phone:
            child.phone = biz.phone
```

### 3.2 Backend: Listing Serialization Fallback (`listings/service.py`)
`listing_to_out()` ensures that even legacy or unmigrated listings cleanly resolve their area name and address:

```python
area_name = l.area.name if l.area else None
address_text = l.address_text

# Fallback to parent business profile if listing fields are null
if l.business_profile:
    if not area_name and l.business_profile.area:
        area_name = l.business_profile.area.name
    if not address_text and l.business_profile.address_text:
        address_text = l.business_profile.address_text
```

### 3.3 Database Seed Data (`seed_demo_data.py` & SQLite)
- **Saidu Sharif Area Record:**
  - ID: `area-saidu-sharif`
  - Name: `Saidu Sharif`
  - Area Type: `city`
  - Latitude: `34.7465`, Longitude: `72.3557`
- **Mingora Destination Record:**
  - ID: `dest-mingora`
  - Name: `Mingora`
  - Type: `Valley & Cultural Hub`
- **Swat Serena Hotel Record:**
  - Business Profile ID: `biz-serena-swat`
  - Physical Address: `Amanabad, Mingora, Swat`
  - Area ID: `area-mingora`

### 3.4 Frontend: Business Shell Area Selector (`BusinessShell.tsx`)
1. Fetches area list from `GET /api/v1/trips/areas` with fallback list (`Kalam`, `Malam Jabba`, `Mingora`, `Saidu Sharif`, `Bahrain`, `Madyan`, `Miandam`, `Marghazar`).
2. Renders a styled dropdown with `data-testid="select-edit-business-area"`.
3. Dispatches `area_id` inside `handleSaveBusinessProfile()` to `PUT /api/v1/auth/profile`.

### 3.5 Frontend: Tourist Quick Valleys & Search (`TouristShell.tsx` & `TouristHomeModern.tsx`)
1. **Quick Valleys Pills**: Added `Mingora` (🏙️) and `Saidu Sharif` (🏛️).
2. **Search Placeholder**: `"Search Kalam, Mahodand, Malam Jabba, Mingora, Saidu Sharif, stays, or guides..."`.
3. **Phonetic & Multi-Field Search**:
   - Matches `l.address_text.toLowerCase().includes(q)`
   - Matches `l.business_name.toLowerCase().includes(q)`
   - Matches `l.area_name.toLowerCase().includes(q)`
   - Matches alternate terms: `altQ = q.replace(/mingrora/g, 'mingora')`

---

## 4. REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/trips/areas` | Retrieve list of all valleys, cities, and destination areas |
| `PUT` | `/api/v1/auth/profile` | Update user / business profile including `area_id` and `address_text` |
| `GET` | `/api/v1/listings/explore?q={term}` | Search listings across titles, categories, area names, and address |

---

## 5. Verification & Test Evidence

1. **Backend Integration Tests:**
   - `pytest backend/tests/test_explore_and_trips.py`
   - Result: `9 passed in 7.18s` (100% passing).
2. **Frontend Vitest Tests:**
   - `npx vitest run src/test/explore_trips.test.tsx`
   - Verified that `Mingora` and `Saidu Sharif` pills render in Quick Valleys.
   - Verified that searching `"Mingora"`, `"Mingrora"`, or `"Amanabad"` loads **Swat Serena Hotel** displaying `Amanabad, Mingora, Swat`.
   - Result: `8 passed in 9.46s`.
3. **Frontend Production Build:**
   - `tsc -b && vite build`
   - Result: Exited with code `0`, 0 TypeScript errors.
4. **Live API Query Verification:**
   - `GET /api/v1/listings/explore?q=mingora` returned:
     `Title: Swat Serena Hotel | Area: Mingora | Address: Amanabad, Mingora, Swat`.
