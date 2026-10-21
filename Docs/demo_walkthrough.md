# Swat Tourism Platform — End-to-End 15-Step Prototype Demo Walkthrough

This guide details the complete 15-step journey across all four core user groups (**Businesses**, **Authorities**, **Tourists**, and **Community Members**), matching Section 11 (Step 8) of `docs/build_prompt.md`.

---

## Quick Access & Server Endpoints

- **Frontend Application:** [http://localhost:5180](http://localhost:5180)
- **Backend API Docs (Swagger):** [http://127.0.0.1:8090/docs](http://127.0.0.1:8090/docs)
- **Database Seed Command:**
  ```bash
  python -m scripts.seed_demo_data
  ```
  *(Idempotent: safe to run multiple times)*

---

## Built-in Demo Features

1. **Role Switcher & 1-Click Demo Accounts:**
   The top banner contains rapid 1-click login buttons for all four prototype personas:
   - **Tourist:** `Sara Ahmed` (`tourist@swat.pk` / `Password123!`)
   - **Business:** `Riverside Inn Owner` (`riverside@swat.pk` / `Password123!`)
   - **Community:** `Gul Zaman` (`gul.zaman@swat.pk` / `Password123!`)
   - **Authority:** `District Tourism Officer` (`authority@swat.pk` / `Password123!`)

2. **Responsive Simulation Toggle:**
   The top bar features an **Auto / Phone (390px) / Desktop (1280px)** layout toggle to verify mobile card fallbacks and desktop `DataTable` views on the fly.

3. **Interactive 15-Step Guided Tour Drawer:**
   Click the floating **"✨ Interactive 15-Step Demo"** pill in the lower-right corner to open a guided assistant that explains each step and provides a 1-click **"Switch to Screen"** button.

---

## The 15-Step Story Walkthrough

### Act I: Business Onboarding & The Verification Gate (Steps 1 – 4)

#### Step 1: Business Registration & Profile
- **Role:** Business (`riverside@swat.pk`)
- **Screen:** *Profile*
- **Action:**
  - View the registered business profile (*Riverside Hospitality & Dining* / *Kalam Heights Lodge*).
  - Inspect uploaded credentials (Hotel Registration, CNIC copy, Commercial Tax ID).

#### Step 2: Authority Reviews Credentials & Grants Verified Badge
- **Role:** Authority (`authority@swat.pk`)
- **Screen:** *Approvals* tab
- **Action:**
  - View the pending queue of business applicants.
  - Click **"Review"** on *Kalam Heights Alpine Lodge* or *Ali Khan Alpine Guide* to open the inspection modal.
  - Review submitted license documents. Click **"Approve & Publish Listings"** (or **"Ask Changes"** with revision notes).
  - The business receives the official green **"Verified"** badge.

#### Step 3: Business Creates a Listing
- **Role:** Business (`riverside@swat.pk`)
- **Screen:** *Listings* tab
- **Action:**
  - Click **"+ Create New Listing"**.
  - Select listing type (e.g., *Hotel*, *4x4 Transport*, or *Mountain Guide*).
  - Observe how form fields dynamically adapt (e.g. check-in/out times for hotels, vehicle seating for transport, languages for guides).
  - Add transparent pricing tiers (e.g. *Double Room* Rs 7,500/night, *Family Suite* Rs 11,000/night).
  - Submit the listing for quality gate review.

#### Step 4: Authority Approves Listing Quality Gate
- **Role:** Authority (`authority@swat.pk`)
- **Screen:** *Approvals* tab
- **Action:**
  - Inspect pending listings queue.
  - Click **"Approve"** to publish the listing live to travellers. Zero unverified operators can reach tourists.

---

### Act II: Tourist Experience, Itinerary & Instant Booking (Steps 5 – 7)

#### Step 5: Tourist Explores Swat Valleys
- **Role:** Tourist (`tourist@swat.pk`)
- **Screen:** *Explore* tab
- **Action:**
  - Filter listings by area using valley chips (*All Swat*, *Kalam*, *Bahrain*, *Madyan*, *Mingora*).
  - Filter by category (*Stays*, *Food*, *Transport*, *Guides*, *Activities*, *Artisans*).
  - Click on *Riverside Inn, Madyan* to view photos, amenities, price tiers, and verified badge.

#### Step 6: Trip Builder, Multi-Item Booking & Mock Pay
- **Role:** Tourist (`tourist@swat.pk`)
- **Screen:** *Trips* tab
- **Action:**
  - View the active 3-Day Autumn Itinerary.
  - Adjust traveller count (e.g. 2 travellers) to observe automatic total price calculation.
  - Click **"Pay & Confirm Trip (Mock)"** to complete reservation without real money. Status updates to `confirmed`.

#### Step 7: Business Operations & Booking Management
- **Role:** Business (`riverside@swat.pk`)
- **Screen:** *Today* screen
- **Action:**
  - Check real-time operational KPI counters (*Today Arrivals*, *Departures*, *Pending Requests*).
  - View incoming booking requests in the reactive table/card queue and click **"Accept"**.

---

### Act III: Real-Time Crisis & Emergency Safety Dispatch (Steps 8 – 11)

#### Step 8: Authority Broadcasts Weather/Flood Advisory & Road Pass Status
- **Role:** Authority (`authority@swat.pk`)
- **Screen:** *Advisories & Roads* tab
- **Action:**
  - Click **"+ Publish Advisory"**. Broadcast a Flood Alert for Kalam river banks.
  - Update road pass status (e.g. mark *Kalam to Mahodand Lake Track* as `4x4 Only`).

#### Step 9: Tourist Receives Live Warning Banner on Home
- **Role:** Tourist (`tourist@swat.pk`)
- **Screen:** *Home* tab
- **Action:**
  - Notice the amber high-priority safety alert banner displayed prominently at the top of the Home feed.
  - Click **"Check Road Status"** to view live pass accessibility.

#### Step 10: Tourist Triggers Emergency SOS (Test Mode)
- **Role:** Tourist (`tourist@swat.pk`)
- **Screen:** *Safety* tab
- **Action:**
  - Click **"🚨 Raise Emergency SOS"**.
  - Review auto-detected GPS coordinates and enter a distress message (e.g. *"Vehicle stuck in snow drift near Ushu forest"*).
  - Click **"Confirm SOS Alert"**. Red distress banner activates.

#### Step 11: Authority Control Room Dispatches Rescue 1122
- **Role:** Authority (`authority@swat.pk`)
- **Screen:** *Cases* tab -> *🚨 SOS Emergencies* sub-tab
- **Action:**
  - Distress call appears at the top of the queue with live GPS pin and caller phone.
  - Authority clicks **"Acknowledge"** and enters response note: *"Dispatched Madyan Rescue 1122 team"*.
  - When tourist is safe, click **"Resolve"** to archive the case.

---

### Act IV: Community Reporting & Artisan Inclusion (Steps 12 – 15)

#### Step 12: Citizen/Tourist Logs Community Issue Report
- **Role:** Community (`gul.zaman@swat.pk`) or Tourist
- **Screen:** *Community* -> *Report* tab
- **Action:**
  - Fill out complaint: Category `Road Blocked / Landslide`, Area `Kalam`, summary *"Fallen boulder blocking one lane near Ushu"*.
  - Submit report directly to District Municipal Authorities.

#### Step 13: Authority Assigns & Resolves Incident
- **Role:** Authority (`authority@swat.pk`)
- **Screen:** *Cases* tab -> *📋 Community Reports* sub-tab
- **Action:**
  - Community report appears in the authority triage table.
  - Authority clicks **"Assign"** to assign highway clearance crews.
  - Click **"Resolve"** with resolution notes: *"Highway clearance completed by TMA Kalam"*.

#### Step 14: Local Resident Applies for Community Host Program
- **Role:** Community (`gul.zaman@swat.pk`)
- **Screen:** *Community* -> *Hosts* tab
- **Action:**
  - Select service type: *Homestay (Village Room & Lodging)*.
  - Describe stone cottage accommodation with mountain views.
  - Submit application for official authority onboarding.

#### Step 15: Indigenous Artisan Crafts & Direct WhatsApp Links
- **Role:** Community or Tourist
- **Screen:** *Community* -> *Crafts* tab
- **Action:**
  - Browse authentic Swati hand-woven wool shawls, carved walnut jewelry boxes, and raw mountain honey.
  - Click **"Chat on WhatsApp"** to open a direct `https://wa.me/...` connection with village craftspeople, bypassing middlemen.

---

## Prototype Scope & Mock Summary

Per Section 10 of `docs/build_prompt.md`:
1. **Mock Payment:** Single-click "Pay & Confirm Trip (Mock)" updates booking payment status to `paid` without external payment gateways.
2. **WhatsApp:** Clean `https://wa.me/<number>` link triggers without external messaging daemon.
3. **Emergency SOS:** Full real-time recording, GPS capture, acknowledgment, and dispatch logging in database.
4. **Design Tokens:** Strict adherence to `--bg`, `--card`, `--ink`, `--mute`, `--pri`, `--soft`, `--acc`, `--ok`, `--bad`, `--line`.
