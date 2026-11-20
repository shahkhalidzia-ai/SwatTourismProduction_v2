import os
import shutil
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

# --- File Paths ---
DOCS_DIR = os.path.abspath("Docs")
DOWNLOADS_DIR = os.path.join(os.environ.get("USERPROFILE", "C:\\Users\\shahkhalid1"), "Downloads")

MD_FILENAME = "community-tourist-service-requests-portal-prompt.md"
DOCX_FILENAME = "Swat_Tourism_Community_Tourist_Service_Requests_Implementation_Prompt.docx"

MD_PATH = os.path.join(DOCS_DIR, MD_FILENAME)
DOCX_PATH = os.path.join(DOCS_DIR, DOCX_FILENAME)

MD_DOWNLOAD = os.path.join(DOWNLOADS_DIR, MD_FILENAME)
DOCX_DOWNLOAD = os.path.join(DOWNLOADS_DIR, DOCX_FILENAME)

# --- Markdown Content ---
MARKDOWN_CONTENT = """# Swat Tourism Platform — Community Portal Tourist Service Requests & WhatsApp Communication Implementation Prompt

> **Feature Scope:** Community Host Inbound Requests & Bookings Management with Bi-Directional WhatsApp Integration  
> **Target Audience:** Local Community Guides, Homestay Hosts, 4x4 Mountain Transport Drivers, and Adventure Operators  
> **Status:** Production Implementation Specification  
> **Target System:** FastAPI (Backend) + SQLite / PostgreSQL (Database) + React 19 / TypeScript / Vite (Frontend)

---

## 1. Executive Summary & Problem Statement

Currently on the Swat Tourism Platform, local community members (such as **Gul Zaman**, resident of Ushu/Kalam) can register and receive authority verification for four essential community offerings:
1. **Local Tourist Guides** (Alpine trail navigation, heritage walks, high-altitude safety)
2. **Village Homestays** (Traditional stone/cedarwood cottages, organic orchard stays)
3. **Local 4x4 Transport** (Jeep mountain shuttles to Mahodand Lake, Kundol Lake, Utror)
4. **Adventure Activities & Crafts** (River rafting, trekking safaris, artisan needlework)

While tourists can explore, filter, and submit instant reservation requests for these offerings through `TouristShell.tsx` and `InstantServiceReservationModal.tsx`, **two critical gaps exist:**
1. **No Incoming Requests Screen:** There is currently no screen or tab on the Community Portal (`CommunityShell.tsx`) where registered community hosts can view, manage, and respond to incoming tourist service requests.
2. **No Direct WhatsApp Communication Channel:** In remote valleys of Swat (Kalam, Ushu, Mankial, Utror) where cellular data may be spotty, tourists and local hosts rely heavily on WhatsApp for coordination (sharing live location pins, arrival timing, trail weather advisories, packing lists). Neither the tourist nor the host currently has structured WhatsApp buttons with pre-filled booking details to communicate instantly.

This document provides the definitive, production-grade architectural specification and step-by-step implementation prompt to introduce the **"Tourist Service Requests"** portal screen for community members with full database persistence, real-time lifecycle status transitions, bi-directional WhatsApp communication, and verifiable automated test coverage.

---

## 2. Core User Stories & Functional Requirements

### User Story 1: View Inbound Tourist Inquiries & Bookings
- **As a** verified community guide or homestay host,  
- **I want to** navigate to a dedicated **"Tourist Requests"** tab on my Community Portal,  
- **So that** I can see every inquiry and booking request submitted by tourists for my specific offerings.

### User Story 2: Request Action & Lifecycle Transitions
- **As a** community service provider,  
- **I want to** review tourist details (dates, number of guests, pickup location, notes) and either **Accept** or **Decline** the request,  
- **So that** the tourist is notified and the date is locked.

### User Story 3: Bi-Directional WhatsApp Communication
- **As a** community host,  
- **I want to** click a single green **"WhatsApp Tourist"** button on the request card,  
- **So that** WhatsApp opens with a structured, pre-formatted message acknowledging the tourist's booking reference, dates, pickup location, and welcome message.
- **As a** tourist submitting a reservation,  
- **I want to** click **"Chat with Host on WhatsApp"** on the confirmation screen,  
- **So that** I can immediately connect with the local host to coordinate logistics and ask questions.

### User Story 4: Service Completion & Review Trigger
- **As a** community host who has finished guiding a hike or hosting a family stay,  
- **I want to** mark the request as **"Completed"**,  
- **So that** earnings are calculated and the tourist is prompted to leave a verified review.

---

## 3. WhatsApp Communication Architecture

### 3.1 Pre-Formatted WhatsApp Message Templates

#### Host to Tourist (Initiated from Community Portal Request Card):
```
Assalam-o-Alaikum / Hello {tourist_name}! 🌟
I am {host_name}, your community host on the Swat Tourism Platform.

Regarding your booking request #{reference} for {service_title}:
📅 Dates: {start_date} to {end_date} ({duration})
👥 Guests: {travellers} person(s)
📍 Pickup / Meeting Point: {pickup_location}
⏰ Scheduled Time: {pickup_time}
💰 Total Fee: PKR {total_amount}

Status: {status}
I look forward to welcoming you to Kalam / Swat Valley! Please let me know your expected arrival time or if you have any questions.
```

#### Tourist to Host (Initiated from Reservation Modal Confirmation):
```
Assalam-o-Alaikum {host_name}! 🏔️
I am {tourist_name}. I have just submitted a reservation request on the Swat Tourism Platform (Ref: #{reference}):

• Service: {service_title}
• Dates: {start_date} to {end_date}
• Pickup: {pickup_location} at {pickup_time}
• Guests: {travellers}

Looking forward to your local hospitality and guidance!
```

### 3.2 URL Generator Specification
WhatsApp web and mobile deep-linking format:
`https://wa.me/{clean_phone}?text={url_encoded_message}`

Where:
- `clean_phone`: Digits only in international format without leading `+` or spaces (e.g., `+92 300 9990003` -> `923009990003`).
- `url_encoded_message`: `encodeURIComponent(messageTemplate)`.

---

## 4. Data Model & Database Persistence Schema

### 4.1 Database Table: `community_service_bookings`
A dedicated table linking tourists to community host applications with full status history and contact details:

```sql
CREATE TABLE community_service_bookings (
    id CHAR(32) PRIMARY KEY,                         -- UUID primary key
    reference VARCHAR(20) UNIQUE NOT NULL,           -- e.g. 'SWAT-CM-482910'
    host_user_id CHAR(32) NOT NULL,                  -- Foreign key to users.id (Community Host)
    host_application_id CHAR(32),                    -- Foreign key to host_applications.id
    tourist_user_id CHAR(32),                        -- Foreign key to users.id (Tourist)
    offer_type VARCHAR(30) NOT NULL,                 -- 'guide', 'homestay', 'transport', 'activity', 'craft'
    service_title VARCHAR(200) NOT NULL,             -- e.g. 'Gul Zaman Traditional Ushu Homestay & Orchard Stay'
    tourist_name VARCHAR(120) NOT NULL,              -- Full name of tourist
    tourist_phone VARCHAR(50) NOT NULL,             -- Contact phone / WhatsApp
    tourist_email VARCHAR(120),                      -- Contact email
    start_date DATE NOT NULL,                        -- Service start / check-in date
    end_date DATE,                                   -- Service end / check-out date
    travellers INTEGER NOT NULL DEFAULT 1,           -- Group size
    pickup_location VARCHAR(200),                   -- e.g. 'Kalam Main Bazaar', 'Fizagat Park'
    destination_valley VARCHAR(200),                -- e.g. 'Mahodand Lake', 'Ushu Forest Trail'
    pickup_time VARCHAR(50),                        -- e.g. '08:00 AM'
    special_requests TEXT,                           -- Tourist notes / dietary requirements
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,  -- Total fee in PKR
    status VARCHAR(20) NOT NULL DEFAULT 'requested', -- 'requested', 'accepted', 'declined', 'completed', 'cancelled'
    decline_reason TEXT,                             -- Reason if rejected by host
    completed_at DATETIME,                           -- When service was completed
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (host_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (host_application_id) REFERENCES host_applications(id) ON DELETE SET NULL,
    FOREIGN KEY (tourist_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_comm_bookings_host ON community_service_bookings(host_user_id);
CREATE INDEX idx_comm_bookings_status ON community_service_bookings(status);
CREATE INDEX idx_comm_bookings_ref ON community_service_bookings(reference);
```

---

## 5. Backend REST API Architecture

### 5.1 Endpoints Specification

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/v1/community/bookings/request` | Optional / Tourist | Tourist books an approved community service. |
| `GET` | `/api/v1/community/bookings/my` | Community / Host | Logged-in community member retrieves all requests for their offerings. |
| `PATCH` | `/api/v1/community/bookings/{id}/accept` | Community Host | Host accepts the tourist booking request. |
| `PATCH` | `/api/v1/community/bookings/{id}/decline` | Community Host | Host declines the request with optional note. |
| `PATCH` | `/api/v1/community/bookings/{id}/complete` | Community Host | Host marks the booking completed. |
| `GET` | `/api/v1/community/bookings/{id}` | Tourist or Host | Retrieve specific booking details. |

---

## 6. Frontend Architecture & Screen Implementation

### 6.1 Navigation Integration
In `frontend/src/layouts/navItems.ts`, add the new item with a badge counter to `ROLE_NAV_ITEMS.community`:

```typescript
  community: [
    { id: 'stories', label: 'Stories', icon: React.createElement(BookOpen, { size: 20 }) },
    { id: 'report', label: 'Report', icon: React.createElement(FileWarning, { size: 20 }) },
    { id: 'hosts', label: 'Services', icon: React.createElement(Briefcase, { size: 20 }) },
    { id: 'requests', label: 'Tourist Requests', icon: React.createElement(CalendarDays, { size: 20 }) },
    { id: 'profile', label: 'Profile', icon: React.createElement(User, { size: 20 }) },
  ]
```

### 6.2 UI Layout: `CommunityRequestsView.tsx`

The screen features:
1. **Executive Metric Cards:**
   - **Total Inquiries / Bookings** (Total count)
   - **Pending Action** (Amber alert badge with count)
   - **Confirmed / Active Stays & Treks** (Green badge)
   - **Completed Services** (Blue badge)
   - **Total Estimated Revenue** (`PKR XX,XXX`)
2. **Category & Status Filter Toolbar:**
   - Status chips: `All`, `Pending Action`, `Confirmed / Active`, `Completed`, `Declined`
   - Service Type filter: `All Services`, `Guides`, `Homestays`, `Transport`, `Activities`
   - Real-time search: Tourist name, phone, reference number, or pickup point.
3. **Structured Request Cards:**
   - **Header:** Category badge with icon + Reference code + Relative submission timestamp.
   - **Tourist Profile:** Name, Verified Tourist badge, phone number, and direct **WhatsApp** + **Call** action buttons.
   - **Trip Schedule:** Start Date, End Date, Duration ("2 Nights" / "1 Day Trek"), Number of Guests.
   - **Logistics & Preferences:** Pickup spot, Destination trail, Time slot, Tourist special requests.
   - **Financials:** Total amount in bold green (`PKR 9,000`).
   - **Interactive Action Bar:**
     - Button **"WhatsApp Tourist"** (Opens WhatsApp chat with pre-filled booking confirmation message)
     - Button **"Call Tourist"** (`tel:...`)
     - When `status === 'requested'`:
       - Button **"Accept Request"** (Primary Green, check icon)
       - Button **"Decline"** (Subtle red outline, prompts optional note modal)
     - When `status === 'accepted'`:
       - Badge **"Confirmed / In Progress"**
       - Button **"Mark Service Completed"** (Confirms completion, enables tourist review)
     - When `status === 'completed'`:
       - Badge **"Completed & Settled"** (Checkmark)
     - When `status === 'declined'`:
       - Badge **"Declined"** with reason tooltip.

---

## 7. Implementation Checklist & Acceptance Criteria

- [ ] **Database Schema:** `community_service_bookings` table created with indexes on host ID, status, and reference.
- [ ] **Backend Service & Router:** Endpoints for creating, listing, accepting, declining, and completing requests created under `/api/v1/community/bookings`.
- [ ] **WhatsApp Deep-Linking:** Pre-filled message generator helper created and attached to WhatsApp buttons on both host cards and tourist reservation modal.
- [ ] **Tourist Booking Hookup:** `InstantServiceReservationModal.tsx` seamlessly routes community listings (`is_community_service`) to the backend endpoint and fallback cache.
- [ ] **Navigation & Shell:** `CommunityShell.tsx` and `navItems.ts` updated with `requests` tab and live counter.
- [ ] **Interactive Actions:** Community member can accept, decline, complete requests, and initiate WhatsApp chats directly from the UI with zero page reload.
- [ ] **Multi-Tenant User Scoping:** Gul Zaman only sees requests belonging to his offerings; other hosts only see theirs.
- [ ] **Automated Tests:**
  - Pytest: `test_community_service_bookings_workflow` passing 100%.
  - Vitest: `community_requests_portal.test.tsx` passing 100%.

---
"""

def generate_docx():
    doc = docx.Document()

    # Page Margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)

    # Styles
    styles = doc.styles
    normal_style = styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)

    # Title
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    run_title = title_p.add_run("Swat Tourism Platform — Community Portal Tourist Service Requests & WhatsApp Integration")
    run_title.font.name = 'Segoe UI'
    run_title.font.size = Pt(22)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(0x00, 0x5A, 0x36)

    # Subtitle
    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(16)
    run_sub = sub_p.add_run("Implementation Specification & Architectural Prompt for Inbound Service Bookings (Guide, Homestay, Transport, Adventure) with Bi-Directional WhatsApp Communication")
    run_sub.font.name = 'Segoe UI'
    run_sub.font.size = Pt(12)
    run_sub.font.italic = True
    run_sub.font.color.rgb = RGBColor(0x4B, 0x55, 0x63)

    # Meta Table
    table = doc.add_table(rows=5, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    meta_data = [
        ("Feature Scope", "Community Host Inbound Requests & Bookings Management"),
        ("Communication Channels", "Bi-Directional WhatsApp Deep-Linking (Pre-Filled Itinerary & Welcome Templates) + Direct Phone Call"),
        ("Target Roles", "Local Tourist Guides, Village Homestay Hosts, 4x4 Transport Drivers, Activity Operators"),
        ("Architecture", "FastAPI (Backend) + SQLite / PostgreSQL (DB Persistence) + React 19 / TypeScript / Vite"),
        ("Deliverables", "Database Table, REST API Endpoints, UI View Component, WhatsApp Generator, Instant Booking Integration, Automated Tests"),
    ]

    col_widths = [Inches(2.0), Inches(4.6)]
    for i, (label, val) in enumerate(meta_data):
        row = table.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width, c1.width = col_widths[0], col_widths[1]
        
        # cell 0
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_after = Pt(2)
        r0 = p0.add_run(label)
        r0.font.bold = True
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = RGBColor(0x11, 0x18, 0x27)

        # cell 1
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(2)
        r1 = p1.add_run(val)
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = RGBColor(0x37, 0x41, 0x51)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Section 1
    h1 = doc.add_heading(level=1)
    r_h1 = h1.add_run("1. Executive Summary & Problem Statement")
    r_h1.font.name = 'Segoe UI'
    r_h1.font.size = Pt(15)
    r_h1.font.bold = True
    r_h1.font.color.rgb = RGBColor(0x00, 0x5A, 0x36)

    p_s1 = doc.add_paragraph(
        "On the Swat Tourism Platform, local community residents (such as Gul Zaman in Kalam/Ushu Valley) provide authentic local services across four categories:\n"
        "• Local Tourist Guides (alpine trails, glacial lakes, high-altitude trekking navigation)\n"
        "• Village Homestays (heritage stone cottages, organic orchard stays, traditional breakfasts)\n"
        "• Local 4x4 Mountain Transport (alpine jeep shuttles to Mahodand and Kundol lakes)\n"
        "• Adventure Activities & Handicrafts (white water rafting, camping expeditions, handwoven Swati shawls)\n\n"
        "While tourists are able to discover and reserve these offerings via Explore & Book, two critical gaps exist:\n"
        "1. No Incoming Requests Screen: Community hosts have NO screen on the Community Portal to view incoming tourist booking requests.\n"
        "2. No Direct WhatsApp Communication: Tourists and hosts cannot coordinate arrival times, weather gear, or live GPS pins over WhatsApp with structured pre-filled booking details."
    )
    p_s1.paragraph_format.space_after = Pt(12)

    # Section 2
    h2 = doc.add_heading(level=1)
    r_h2 = h2.add_run("2. WhatsApp Communication Architecture")
    r_h2.font.name = 'Segoe UI'
    r_h2.font.size = Pt(15)
    r_h2.font.bold = True
    r_h2.font.color.rgb = RGBColor(0x00, 0x5A, 0x36)

    doc.add_paragraph(
        "Direct WhatsApp integration utilizes deep-linking via https://wa.me/<phone>?text=<encoded_text> with formatted templates:"
    )

    wa_points = [
        ("Host-to-Tourist Template", "Assalam-o-Alaikum {tourist_name}! I am {host_name}, your community host on Swat Tourism Platform. Regarding your booking #{reference} for {service_title} on {dates}: Pickup at {pickup_location}, Fee: PKR {total_amount}. I look forward to welcoming you to Swat!"),
        ("Tourist-to-Host Template", "Assalam-o-Alaikum {host_name}! I am {tourist_name}. I have booked {service_title} on Swat Tourism Platform (Ref: #{reference}) for {dates}. Pickup at {pickup_location} at {pickup_time}. Looking forward to your guidance!"),
        ("Direct UI Triggers", "Green 'WhatsApp Tourist' button on every host request card, and 'Message Host on WhatsApp' on the tourist reservation confirmation modal.")
    ]
    for w_title, w_desc in wa_points:
        p_w = doc.add_paragraph()
        p_w.paragraph_format.left_indent = Inches(0.2)
        p_w.paragraph_format.space_after = Pt(4)
        run_w_t = p_w.add_run(f"• {w_title}: ")
        run_w_t.font.bold = True
        run_w_t.font.color.rgb = RGBColor(0x10, 0xB9, 0x81)
        p_w.add_run(w_desc)

    # Section 3
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    h3 = doc.add_heading(level=1)
    r_h3 = h3.add_run("3. Database Schema & REST API Endpoints")
    r_h3.font.name = 'Segoe UI'
    r_h3.font.size = Pt(15)
    r_h3.font.bold = True
    r_h3.font.color.rgb = RGBColor(0x00, 0x5A, 0x36)

    api_table = doc.add_table(rows=6, cols=3)
    api_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    api_headers = [("Method", Inches(1.0)), ("Endpoint", Inches(3.2)), ("Purpose", Inches(2.5))]
    hdr_row = api_table.rows[0]
    for c_idx, (hdr_text, w) in enumerate(api_headers):
        cell = hdr_row.cells[c_idx]
        cell.width = w
        p = cell.paragraphs[0]
        r = p.add_run(hdr_text)
        r.font.bold = True
        r.font.size = Pt(9.5)

    api_endpoints = [
        ("POST", "/api/v1/community/bookings/request", "Tourist books an approved community service"),
        ("GET", "/api/v1/community/bookings/my", "Host retrieves all incoming requests for their offerings"),
        ("PATCH", "/api/v1/community/bookings/{id}/accept", "Host accepts and confirms the tourist booking"),
        ("PATCH", "/api/v1/community/bookings/{id}/decline", "Host declines the request with optional reason"),
        ("PATCH", "/api/v1/community/bookings/{id}/complete", "Host marks the tour/stay completed"),
    ]
    for r_idx, (m, ep, desc) in enumerate(api_endpoints, 1):
        row = api_table.rows[r_idx]
        for c_idx, val in enumerate([m, ep, desc]):
            cell = row.cells[c_idx]
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(9)
            if c_idx == 0:
                r.font.bold = True
                if m == "POST":
                    r.font.color.rgb = RGBColor(0x10, 0xB9, 0x81)
                elif m == "GET":
                    r.font.color.rgb = RGBColor(0x02, 0x84, 0xC7)
                else:
                    r.font.color.rgb = RGBColor(0xD9, 0x77, 0x06)

    # Section 4
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    h4 = doc.add_heading(level=1)
    r_h4 = h4.add_run("4. UI Screen & Dashboard Specifications")
    r_h4.font.name = 'Segoe UI'
    r_h4.font.size = Pt(15)
    r_h4.font.bold = True
    r_h4.font.color.rgb = RGBColor(0x00, 0x5A, 0x36)

    doc.add_paragraph(
        "1. Navigation Item: Add 'Tourist Requests' ({ id: 'requests', label: 'Tourist Requests', icon: CalendarDays }) to Community Portal sidebar and role switcher.\n"
        "2. KPI Summary Cards: Display Total Inquiries, Pending Action (amber badge), Confirmed Stays/Treks (green badge), and Total Estimated Revenue in PKR.\n"
        "3. Interactive Filter Bar: Quick toggle between 'All', 'Pending', 'Confirmed', and 'Completed', plus category filters (Guides, Homestays, Transport, Activities).\n"
        "4. Actionable Cards: Each card displays tourist name, dates, group size, pickup time/point, total fee, direct Call/WhatsApp links, and Accept/Decline/Complete action buttons.\n"
        "5. WhatsApp Integration: Pre-filled WhatsApp button on both host request card and tourist confirmation modal."
    )

    doc.save(DOCX_PATH)
    print(f"[OK] Generated Word document: {DOCX_PATH}")

def main():
    with open(MD_PATH, "w", encoding="utf-8") as f:
        f.write(MARKDOWN_CONTENT)
    print(f"[OK] Generated Markdown prompt: {MD_PATH}")

    generate_docx()

    shutil.copyfile(MD_PATH, MD_DOWNLOAD)
    shutil.copyfile(DOCX_PATH, DOCX_DOWNLOAD)
    print(f"[OK] Copied markdown prompt to: {MD_DOWNLOAD}")
    print(f"[OK] Copied docx prompt to: {DOCX_DOWNLOAD}")

if __name__ == "__main__":
    main()
