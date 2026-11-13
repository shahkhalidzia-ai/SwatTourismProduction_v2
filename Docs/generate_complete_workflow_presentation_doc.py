import os
import sys
from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOC_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(DOC_DIR)
DIAGRAM_PATH = os.path.join(DOC_DIR, "swat_complete_end_to_end_architecture.png")
DIAG_1_PATH = os.path.join(DOC_DIR, "swat_diagram_1_booking_sequence.png")
DIAG_2_PATH = os.path.join(DOC_DIR, "swat_diagram_2_data_pipeline.png")
DIAG_3_PATH = os.path.join(DOC_DIR, "swat_diagram_3_initial_page_load.png")
OUTPUT_DOCX = os.path.join(DOC_DIR, "Swat_Tourism_Complete_End_to_End_Hotel_Booking_Flow_and_Architecture.docx")

# ---------------------------------------------------------------------------
# 1. GENERATE VISUAL ARCHITECTURE FLOW DIAGRAM WITH PILLOW
# ---------------------------------------------------------------------------
def generate_architecture_image():
    width, height = 1550, 1100
    img = Image.new("RGBA", (width, height), (248, 250, 252, 255))
    draw = ImageDraw.Draw(img)

    try:
        font_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 24)
        font_subtitle = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 14)
        font_box_header = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 16)
        font_subhead = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 13)
        font_path = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 11)
        font_body = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 11)
    except:
        font_title = font_subtitle = font_box_header = font_subhead = font_path = font_body = ImageFont.load_default()

    # Header Bar
    draw.rectangle([(0, 0), (width, 85)], fill=(15, 23, 42, 255))
    draw.text((40, 14), "SWAT TOURISM PLATFORM — COMPLETE END-TO-END HOTEL BOOKING & SYSTEM FLOW", fill=(255, 255, 255, 255), font=font_title)
    draw.text((40, 48), "Full Technical Flow: Site Load -> Login -> Search -> Request -> PMS Today -> Accept -> QR Voucher -> Check-in/out -> Review", fill=(148, 163, 184, 255), font=font_subtitle)

    def draw_card(x, y, w, h, bg_color, border_color, title, title_bg):
        draw.rounded_rectangle([(x, y), (x + w, y + h)], radius=10, fill=bg_color, outline=border_color, width=2)
        draw.rounded_rectangle([(x, y), (x + w, y + 38)], radius=10, fill=title_bg)
        draw.rectangle([(x, y + 20), (x + w, y + 38)], fill=title_bg)
        draw.text((x + 14, y + 9), title, fill=(255, 255, 255, 255), font=font_box_header)

    # 1. FRONTEND CLIENT LAYER
    draw_card(40, 110, 700, 440, (255, 255, 255, 255), (14, 116, 144, 255), "1. FRONTEND USER EXPERIENCE & STATE (frontend/src/)", (14, 116, 144, 255))
    items_fe = [
        ("index.html & main.tsx", "frontend/index.html & src/main.tsx", "Anti-theme flash script, Google Fonts, React 18 Concurrent root mount"),
        ("App.tsx & Context Providers", "frontend/src/App.tsx & context/AuthContext.tsx", "Global routing, JWT persistence, language & theme providers"),
        ("Tourist Shell & Search", "frontend/src/modules/tourist/TouristShell.tsx", "Hero banner, destination explorer, room tier calculator & modal"),
        ("Hotel Details & Unified Checkout", "frontend/src/modules/tourist/HotelDetailsModal.tsx", "Booking request trigger (SWT-HTL ref) & unified guarantee drawer"),
        ("Hotel PMS Today Screen", "frontend/src/modules/business/HotelTodayScreen.tsx", "Front desk PMS: pending booking accept, physical room rack sync"),
        ("Review Modal & Voucher Pass", "frontend/src/modules/tourist/ReviewModal.tsx & Voucher", "QR code verification pass, check-in folio, post-stay 5-star review")
    ]
    cur_y = 160
    for fn, path, desc in items_fe:
        draw.rounded_rectangle([(55, cur_y), (720, cur_y + 54)], radius=6, fill=(240, 249, 255, 255), outline=(186, 230, 253, 255), width=1)
        draw.text((68, cur_y + 4), fn, fill=(3, 105, 161, 255), font=font_subhead)
        draw.text((68, cur_y + 20), path, fill=(14, 116, 144, 255), font=font_path)
        draw.text((68, cur_y + 35), desc, fill=(71, 85, 105, 255), font=font_body)
        cur_y += 62

    # 2. SHARED CLIENT & API GATEWAY
    draw_card(780, 110, 720, 440, (255, 255, 255, 255), (15, 118, 110, 255), "2. SHARED CLIENT & FASTAPI API GATEWAY (FastAPI / REST)", (15, 118, 110, 255))
    items_gw = [
        ("Universal HTTP Client", "frontend/src/api/client.ts (apiRequest<T>)", "Auto Bearer JWT injection from localStorage('swat_token'), error parsing"),
        ("Vite Dev Reverse Proxy", "frontend/vite.config.ts (Port 5180 -> 8090)", "Forwards /api and /uploads to backend, eliminating CORS in dev"),
        ("FastAPI Root & Middlewares", "backend/app/main.py", "CORSMiddleware, static uploads mount, automated startup schema sync"),
        ("Auth Guard & RBAC Deps", "backend/app/core/deps.py & core/auth.py", "get_current_token_payload(), require_roles(['business', 'tourist'])"),
        ("Bookings & Listings Routers", "backend/app/modules/bookings/router.py & listings/", "POST /request, POST /accept, POST /check-in/out, GET /rooms"),
        ("Reviews & Places Routers", "backend/app/modules/reviews/router.py & places/", "POST /reviews, GET /listing/{id}, GET /places/areas & destinations")
    ]
    cur_y = 160
    for fn, path, desc in items_gw:
        draw.rounded_rectangle([(795, cur_y), (1480, cur_y + 54)], radius=6, fill=(240, 253, 250, 255), outline=(153, 246, 228, 255), width=1)
        draw.text((808, cur_y + 4), fn, fill=(15, 118, 110, 255), font=font_subhead)
        draw.text((808, cur_y + 20), path, fill=(13, 148, 136, 255), font=font_path)
        draw.text((808, cur_y + 35), desc, fill=(71, 85, 105, 255), font=font_body)
        cur_y += 62

    # 3. DOMAIN SERVICE & INTEGRATIONS LAYER
    draw_card(40, 580, 700, 480, (255, 255, 255, 255), (67, 56, 202, 255), "3. DOMAIN SERVICES & MULTI-CHANNEL DISPATCH", (67, 56, 202, 255))
    items_srv = [
        ("BookingService Engine", "backend/app/modules/bookings/service.py", "Calculates nights, generates SWT-HTL ref, enforces status transitions"),
        ("Receipt & QR Voucher Service", "backend/app/modules/bookings/receipt_service.py", "Generates printable HTML boarding voucher with verification QR code"),
        ("Listings & Room Rack Service", "backend/app/modules/listings/service.py", "Physical HotelRoom rack management, allocation & housekeeping turnover"),
        ("Multi-Channel Dispatcher", "backend/app/modules/communications/dispatcher.py", "Dispatches confirmation voucher via SMS, Email, and WhatsApp"),
        ("Notification Broadcaster", "backend/app/modules/notifications/service.py", "Writes in-app alert records for tourist booking updates & review prompts"),
        ("Review & Feedback Engine", "backend/app/modules/reviews/service.py", "Validates stay completion, publishes review, recalculates hotel rating"),
        ("Payment Gateway Manager", "backend/app/modules/bookings/payment_adapter.py", "Handles Easypaisa MA push, JazzCash, and direct bank transfer audits")
    ]
    cur_y = 630
    for fn, path, desc in items_srv:
        draw.rounded_rectangle([(55, cur_y), (720, cur_y + 53)], radius=6, fill=(245, 243, 255, 255), outline=(221, 214, 254, 255), width=1)
        draw.text((68, cur_y + 4), fn, fill=(79, 70, 229, 255), font=font_subhead)
        draw.text((68, cur_y + 20), path, fill=(99, 102, 241, 255), font=font_path)
        draw.text((68, cur_y + 35), desc, fill=(71, 85, 105, 255), font=font_body)
        cur_y += 61

    # 4. DATABASE PERSISTENCE LAYER
    draw_card(780, 580, 720, 480, (255, 255, 255, 255), (180, 83, 9, 255), "4. DATABASE PERSISTENCE & RELATIONAL SCHEMA", (180, 83, 9, 255))
    items_db = [
        ("bookings Table", "backend/app/modules/bookings/models.py", "reference, tourist_id, business_id, dates, total, status, stay_status"),
        ("booking_items Table", "backend/app/modules/bookings/models.py", "booking_id, price_item_id, nights, unit_price, line_total"),
        ("booking_status_history Table", "backend/app/modules/bookings/models.py", "Immutable audit trail of transitions (requested -> accepted -> completed)"),
        ("hotel_rooms Table", "backend/app/modules/listings/models.py", "room_number (e.g. 204), floor, cleaning_status, current_booking_id"),
        ("availability Table", "backend/app/modules/listings/models.py", "Date-level calendar matrix preventing double-bookings"),
        ("reviews & review_replies", "backend/app/modules/reviews/models.py", "rating (1-5), title, comment, status='published', hotelier reply"),
        ("notifications Table", "backend/app/modules/notifications/models.py", "user_id, type='booking', title, body, channel='in_app', is_read")
    ]
    cur_y = 630
    for fn, path, desc in items_db:
        draw.rounded_rectangle([(795, cur_y), (1480, cur_y + 53)], radius=6, fill=(255, 251, 235, 255), outline=(253, 230, 138, 255), width=1)
        draw.text((808, cur_y + 4), fn, fill=(180, 83, 9, 255), font=font_subhead)
        draw.text((808, cur_y + 20), path, fill=(217, 119, 6, 255), font=font_path)
        draw.text((808, cur_y + 35), desc, fill=(71, 85, 105, 255), font=font_body)
        cur_y += 61

    img.save(DIAGRAM_PATH, "PNG")
    print(f"[Diagram] Generated: {DIAGRAM_PATH}")

# ---------------------------------------------------------------------------
# 2. DOCX HELPER FORMATTING FUNCTIONS
# ---------------------------------------------------------------------------
def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="CBD5E1", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'  <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:left w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:right w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:insideV w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def add_callout(doc, title, text, bg_color="F8FAFC", border_color="0284C7"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.8)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'  <w:top w:val="none"/>'
        f'  <w:left w:val="single" w:sz="36" w:space="0" w:color="{border_color}"/>'
        f'  <w:bottom w:val="none"/>'
        f'  <w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(2)
    run_t = p.add_run(f"📌 {title}\n")
    run_t.bold = True
    run_t.font.name = "Arial"
    run_t.font.size = Pt(10.5)
    run_t.font.color.rgb = RGBColor(15, 23, 42)
    
    run_b = p.add_run(text)
    run_b.font.name = "Arial"
    run_b.font.size = Pt(9.5)
    run_b.font.color.rgb = RGBColor(51, 65, 85)
    
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(2)
    p_after.paragraph_format.space_after = Pt(4)

def format_table(table, col_widths, headers, rows, header_bg="0F766E"):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table, color="CBD5E1", sz="4")
    
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], header_bg)
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
        p = hdr_cells[i].paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(title)
        run.bold = True
        run.font.name = "Arial"
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(255, 255, 255)
        
    for r_idx, row_data in enumerate(rows):
        row_cells = table.rows[r_idx + 1].cells
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            row_cells[c_idx].width = col_widths[c_idx]
            set_cell_background(row_cells[c_idx], bg)
            set_cell_margins(row_cells[c_idx], top=100, bottom=100, left=140, right=140)
            p = row_cells[c_idx].paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run(str(val))
            run.font.name = "Arial"
            run.font.size = Pt(9.0)
            run.font.color.rgb = RGBColor(30, 41, 59)

# ---------------------------------------------------------------------------
# 3. BUILD COMPLETE DOCUMENT
# ---------------------------------------------------------------------------
def generate_complete_word_doc():
    doc = Document()
    
    # 1-inch margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Title Banner
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(4)
    run_main = p_title.add_run("Swat Tourism Platform (STP)")
    run_main.bold = True
    run_main.font.name = "Arial"
    run_main.font.size = Pt(22)
    run_main.font.color.rgb = RGBColor(15, 23, 42)

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(14)
    run_sub = p_sub.add_run("Complete End-to-End Hotel Booking Flow, Architecture & File Map")
    run_sub.bold = True
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(13)
    run_sub.font.color.rgb = RGBColor(14, 116, 144)

    # Document Metadata Box
    meta_headers = ["Attribute", "Value Details"]
    meta_rows = [
        ["Project Domain", "Hospitality Reservation Engine, Front Desk PMS, Financial Settlement, & Reviews"],
        ["Application Architecture", "4-Tier Architecture (React 18 UI -> FastAPI Gateway -> Domain Services -> DB Persistence)"],
        ["Workspace Root Path", "f:\\Antigravity\\SwatTourismProduction_v2"],
        ["Core Tech Stack", "React 18, TypeScript, Tailwind CSS, FastAPI, SQLAlchemy 2.0 Async, PostgreSQL/SQLite"],
        ["Lifecycle Scope", "Site Load, Auth, Search, Request, PMS Today, Acceptance, Voucher QR, Stay, Review, Data Flow"],
        ["Target Audience", "Executive Leadership, Lead Architects, Full-Stack Engineers, and QA Teams"]
    ]
    meta_tbl = doc.add_table(rows=1 + len(meta_rows), cols=2)
    format_table(meta_tbl, [Inches(2.2), Inches(4.6)], meta_headers, meta_rows, header_bg="0F172A")
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Callout: Executive Summary
    add_callout(
        doc,
        "Executive Architecture & Purpose of this Document",
        "This document provides the complete, authoritative specification of how a hotel booking flows through "
        "the Swat Tourism Platform from the millisecond a tourist opens the URL to the moment they leave a verified review. "
        "It details every frontend component, shared infrastructure utility, API router, domain service, database table, "
        "and data pipeline transfer step, with exact repository file paths referenced against the project root.",
        bg_color="F0FDF4",
        border_color="16A34A"
    )

    # Section 1: End-to-End Visual Architecture Diagram
    h1 = doc.add_heading("1. End-to-End System Architecture Diagram", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)
    for r in h1.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    p_d = doc.add_paragraph(
        "Figure 1.1 illustrates the complete interaction between the Frontend UI layer, the Shared API Gateway & Security layer, "
        "the Business Logic & Integrations layer, and the Relational Database schema, with exact file paths annotated on every block:"
    )
    p_d.paragraph_format.space_after = Pt(8)

    if os.path.exists(DIAGRAM_PATH):
        doc.add_picture(DIAGRAM_PATH, width=Inches(6.8))
        p_cap = doc.add_paragraph("Figure 1.1: Complete Architectural Flow of the Hotel Reservation Lifecycle with Repository Paths")
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(4)
        p_cap.paragraph_format.space_after = Pt(14)
        run_cap = p_cap.runs[0]
        run_cap.font.name = "Arial"
        run_cap.font.size = Pt(8.5)
        run_cap.font.italic = True
        run_cap.font.color.rgb = RGBColor(100, 116, 139)

    # Section 2: Complete 10-Stage Execution Sequence Flow
    h2 = doc.add_heading("2. Complete 10-Stage Execution Sequence Flow", level=1)
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(6)
    for r in h2.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    if os.path.exists(DIAG_1_PATH):
        doc.add_picture(DIAG_1_PATH, width=Inches(6.8))
        p_cap1 = doc.add_paragraph("Figure 2.1: Visual Sequence Diagram — Complete End-to-End Hotel Reservation Lifecycle")
        p_cap1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap1.paragraph_format.space_before = Pt(4)
        p_cap1.paragraph_format.space_after = Pt(12)
        run_cap1 = p_cap1.runs[0]
        run_cap1.font.name = "Arial"
        run_cap1.font.size = Pt(8.5)
        run_cap1.font.italic = True
        run_cap1.font.bold = True
        run_cap1.font.color.rgb = RGBColor(14, 116, 144)

    flow_steps = [
        ("Stage 1: Tourist Browses the URL & Main Screen Loads",
         "• What Happens: The browser hits the URL (http://localhost:5180/). index.html executes an inline anti-theme-flash script setting data-theme='lake'. React Concurrent root mounts main.tsx and App.tsx. App.tsx wraps the app in AuthProvider, ThemeProvider, and TranslationProvider. AuthContext inspects localStorage for active sessions (or defaults to guest tourist). TouristShell.tsx and TouristHomeModern.tsx load initial areas, destinations, and hotel listings in parallel via Promise.all.\n"
         "• Frontend Files: frontend/index.html, frontend/src/main.tsx, frontend/src/App.tsx, frontend/src/context/AuthContext.tsx, frontend/src/modules/tourist/TouristShell.tsx, frontend/src/modules/tourist/TouristHomeModern.tsx\n"
         "• Backend API & Services: backend/app/main.py, backend/app/modules/places/router.py (GET /api/v1/places/areas & /destinations), backend/app/modules/listings/router.py (GET /api/v1/listings?type=all), backend/app/modules/listings/service.py\n"
         "• Database Tables: listings, listing_media, price_items, places, destinations"),

        ("Stage 2: User Authentication (Tourist Login)",
         "• What Happens: The tourist clicks 'Sign In'. AuthModal.tsx or LoginPage.tsx captures email/phone and password, calling AuthContext.login(). The shared API client posts credentials to /api/v1/auth/login. The backend validates the password hash via passlib Bcrypt in AccountService, generates a signed JWT token with sub=user_id and role='tourist', and returns it to the client. The token is stored in localStorage('swat_token').\n"
         "• Frontend Files: frontend/src/components/AuthModal.tsx, frontend/src/components/LoginPage.tsx, frontend/src/context/AuthContext.tsx, frontend/src/api/client.ts\n"
         "• Backend API & Services: backend/app/modules/accounts/router.py (POST /api/v1/auth/login), backend/app/modules/accounts/service.py (authenticate_user), backend/app/core/auth.py (verify_password, create_access_token)\n"
         "• Database Tables: users (queries email/phone, password_hash, role, and is_active status)"),

        ("Stage 3: Hotel Search & Room Tier Discovery",
         "• What Happens: The tourist searches destination (e.g. 'Kalam'), selects check-in/check-out dates, and filters by category 'hotel'. The search bar fires GET /api/v1/listings?category=hotel&search=Kalam. Hotel cards render with starting prices and review ratings. Clicking a hotel opens HotelDetailsModal.tsx, fetching room tiers (Standard, Deluxe, Executive Suite) and live capacity.\n"
         "• Frontend Files: frontend/src/modules/tourist/TouristShell.tsx, frontend/src/modules/tourist/HotelDetailsModal.tsx, frontend/src/api/listings.ts (fetchListings, fetchListingById)\n"
         "• Backend API & Services: backend/app/modules/listings/router.py (GET /api/v1/listings, GET /api/v1/listings/{id}), backend/app/modules/listings/service.py (ListingsService)\n"
         "• Database Tables: listings, price_items (room tiers, capacity, nightly rates), availability (date-level room inventory)"),

        ("Stage 4: Booking Request Placement (Instant Book)",
         "• What Happens: The tourist selects a room category (e.g., Deluxe Room, 2 nights) and clicks 'Instant Book'. HotelDetailsModal.tsx calls createBookingRequest(). The backend validates payload types with BookingCreateRequest schema. BookingService verifies room availability, calculates nights * rate, generates a unique reference (e.g., SWT-HTL-89412), locks inventory units in availability, creates the booking record (status: 'requested', payment_status: 'unpaid', stay_status: 'reserved'), logs status history, and sends an in-app notification to the hotelier.\n"
         "• Frontend Files: frontend/src/modules/tourist/HotelDetailsModal.tsx, frontend/src/api/bookings.ts (createBookingRequest)\n"
         "• Backend API & Services: backend/app/modules/bookings/router.py (POST /api/v1/bookings/request), backend/app/modules/bookings/schemas.py (BookingCreateRequest), backend/app/modules/bookings/service.py (BookingService.create_booking), backend/app/modules/notifications/service.py\n"
         "• Database Tables: bookings (status: 'requested'), booking_items, booking_status_history, availability (increments units_booked), notifications"),

        ("Stage 5: Hotel Owner / Front Desk Authentication",
         "• What Happens: The hotelier logs in with business credentials. The backend verifies their account and checks business_profiles table. The returned JWT specifies role: 'business'. App.tsx detects role 'business' and mounts BusinessShell.tsx. The navigation menu automatically configures hotel front-desk tabs (Today Screen, Availability, Room Rack).\n"
         "• Frontend Files: frontend/src/components/AuthModal.tsx, frontend/src/components/RoleSwitcherBar.tsx, frontend/src/modules/business/BusinessShell.tsx, frontend/src/context/AuthContext.tsx\n"
         "• Backend API & Services: backend/app/modules/accounts/router.py (POST /api/v1/auth/login), backend/app/core/deps.py (require_roles(['business']))\n"
         "• Database Tables: users, business_profiles (business_name, primary_type='hotel', verification_status='approved')"),

        ("Stage 6: Front-Desk PMS 'Today Screen' Navigation",
         "• What Happens: Reception opens HotelTodayScreen.tsx. The PMS screen calls fetchBusinessBookings() and fetchHotelRooms(). It calculates live operational KPIs: Today Arrivals, Departures, In-House Guests, and Pending Booking Requests. It also renders the live visual Room Rack (LiveRoomRackBoard.tsx) synced via physicalRooms.ts.\n"
         "• Frontend Files: frontend/src/modules/business/HotelTodayScreen.tsx, frontend/src/modules/business/LiveRoomRackBoard.tsx, frontend/src/modules/business/physicalRooms.ts, frontend/src/api/bookings.ts (fetchBusinessBookings), frontend/src/api/rooms.ts (fetchHotelRooms)\n"
         "• Backend API & Services: backend/app/modules/bookings/router.py (GET /api/v1/bookings/business), backend/app/modules/listings/router.py (GET /api/v1/listings/{id}/rooms), backend/app/modules/bookings/service.py\n"
         "• Database Tables: bookings, hotel_rooms (room 101, 102, 204), price_items"),

        ("Stage 7: Accepting Booking Request & Room Allocation",
         "• What Happens: In HotelTodayScreen.tsx, staff sees the pending reservation with status 'requested' and clicks 'Accept Booking'. Reception optionally opens AssignRoomModal.tsx to assign a physical clean room (e.g. Room 204). The frontend calls acceptBooking(id, { note }). The backend verifies ownership, updates booking.status to 'accepted', assigns assigned_room_number='204', marks hotel_rooms.status='reserved', and records an immutable audit in booking_status_history.\n"
         "• Frontend Files: frontend/src/modules/business/HotelTodayScreen.tsx, frontend/src/modules/business/AssignRoomModal.tsx, frontend/src/api/bookings.ts (acceptBooking), frontend/src/api/rooms.ts (assignRoomsToBookingApi)\n"
         "• Backend API & Services: backend/app/modules/bookings/router.py (POST /api/v1/bookings/{id}/accept), backend/app/modules/listings/router.py (POST /api/v1/listings/{id}/assign-rooms), backend/app/modules/bookings/service.py (BookingService.accept_booking)\n"
         "• Database Tables: bookings (status: 'accepted', assigned_room_number: '204'), hotel_rooms (status: 'reserved', current_booking_id: booking.id), booking_status_history"),

        ("Stage 8: Instant Request Confirmation & QR Voucher Dispatch",
         "• What Happens: Upon acceptance, the backend triggers NotificationService and CommunicationDispatcher.dispatch_booking_accepted(). The system creates an in-app notification, generates an official responsive HTML voucher with dynamic QR verification code (ReceiptService), and dispatches SMS/WhatsApp alerts to the tourist. The tourist views the voucher in BookingVoucherModal.tsx or MyBookingsView.tsx and can optionally guarantee via UnifiedCheckoutModal.tsx.\n"
         "• Frontend Files: frontend/src/modules/tourist/MyBookingsView.tsx, frontend/src/components/BookingVoucherModal.tsx, frontend/src/components/UnifiedCheckoutModal.tsx\n"
         "• Backend API & Services: backend/app/modules/communications/dispatcher.py, backend/app/modules/notifications/service.py, backend/app/modules/bookings/receipt_service.py (generate_voucher_html, build_qr_code), backend/app/modules/bookings/payment_adapter.py\n"
         "• Database Tables: notifications (type: 'booking', channel: 'in_app', delivery_status: 'delivered'), booking_payments (records deposit or guarantee if paid online)"),

        ("Stage 9: Guest Arrival, Check-In, Stay Completion & Check-Out",
         "• What Happens: 1) Arrival: Guest arrives at reception and displays QR voucher. Reception scans QR and clicks 'Check In' in HotelTodayScreen.tsx. Any remaining balance is settled via HotelFolioReceiptModal.tsx. Backend updates bookings.stay_status='checked_in' and hotel_rooms.status='occupied'. 2) Stay: Guest enjoys hotel stay. 3) Departure: Reception clicks 'Check Out'. Backend executes BookingService.complete_booking(): bookings.status becomes 'completed', stay_status becomes 'checked_out', and the room transitions to 'cleaning' (housekeeping turnover). A notification is sent to the tourist prompting for a review.\n"
         "• Frontend Files: frontend/src/modules/business/HotelTodayScreen.tsx, frontend/src/modules/business/HotelFolioReceiptModal.tsx, frontend/src/api/bookings.ts (checkInBookingApi, collectBookingBalance, checkOutBookingApi, completeBooking)\n"
         "• Backend API & Services: backend/app/modules/bookings/router.py (POST /check-in, POST /collect-balance, POST /check-out, POST /complete), backend/app/modules/bookings/service.py (BookingService.complete_booking, _release_rooms_for_booking)\n"
         "• Database Tables: bookings (status: 'completed', stay_status: 'checked_out'), hotel_rooms (status: 'cleaning' -> 'available'), booking_status_history, notifications"),

        ("Stage 10: Post-Stay Rating & Review Submission",
         "• What Happens: The tourist opens MyBookingsView.tsx where the completed booking displays a 'Write Review' button. Clicking opens ReviewModal.tsx. The tourist selects 1 to 5 stars, enters a review title and comment, and clicks Submit. The API client sends payload to POST /api/v1/reviews. ReviewService verifies the booking is completed, confirms the tourist ID matches, inserts a row into reviews, and recalculates the average rating and review count on the listings table. The review appears immediately on the public hotel profile.\n"
         "• Frontend Files: frontend/src/modules/tourist/MyBookingsView.tsx, frontend/src/modules/tourist/ReviewModal.tsx, frontend/src/api/reviews.ts (createReview, getListingReviews)\n"
         "• Backend API & Services: backend/app/modules/reviews/router.py (POST /api/v1/reviews), backend/app/modules/reviews/schemas.py (ReviewCreate, ReviewOut), backend/app/modules/reviews/service.py (ReviewService.create_review)\n"
         "• Database Tables: reviews (booking_id, tourist_id, listing_id, rating, title, comment, status='published'), listings (updates rating_average and rating_count), notifications (alerts hotelier of new review)")
    ]

    for title, desc in flow_steps:
        p_st = doc.add_paragraph()
        p_st.paragraph_format.space_before = Pt(8)
        p_st.paragraph_format.space_after = Pt(2)
        r_title = p_st.add_run(f"▶ {title}")
        r_title.bold = True
        r_title.font.name = "Arial"
        r_title.font.size = Pt(10.5)
        r_title.font.color.rgb = RGBColor(14, 116, 144)

        p_desc = doc.add_paragraph(desc)
        p_desc.paragraph_format.space_before = Pt(0)
        p_desc.paragraph_format.space_after = Pt(6)
        for r in p_desc.runs:
            r.font.name = "Arial"
            r.font.size = Pt(9.5)
            r.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 3: How Data Floats Between Frontend and Database
    h3 = doc.add_heading("3. How Data Floats Between Frontend and Database", level=1)
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(6)
    for r in h3.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    if os.path.exists(DIAG_2_PATH):
        doc.add_picture(DIAG_2_PATH, width=Inches(6.8))
        p_cap2 = doc.add_paragraph("Figure 3.1: Visual Data Pipeline Flowchart — 4-Tier Architecture & Data Transition Engine")
        p_cap2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap2.paragraph_format.space_before = Pt(4)
        p_cap2.paragraph_format.space_after = Pt(12)
        run_cap2 = p_cap2.runs[0]
        run_cap2.font.name = "Arial"
        run_cap2.font.size = Pt(8.5)
        run_cap2.font.italic = True
        run_cap2.font.bold = True
        run_cap2.font.color.rgb = RGBColor(14, 116, 144)

    p3 = doc.add_paragraph(
        "Data flows through a strictly coordinated, asynchronous 4-tier pipeline. "
        "The table below details what happens to data in both the outbound request and inbound response directions:"
    )
    p3.paragraph_format.space_after = Pt(8)

    data_flow_headers = ["Pipeline Step", "Layer & Component", "Exact Action Performed on Data"]
    data_flow_rows = [
        ["1. User Action", "React UI Component\n(HotelDetailsModal.tsx)", "User inputs dates/rooms; component creates JavaScript JSON object."],
        ["2. Typed Wrapper", "Domain API Client\n(frontend/src/api/bookings.ts)", "Applies TypeScript interface validation and invokes apiRequest<T>()."],
        ["3. HTTP Client", "Shared Client\n(frontend/src/api/client.ts)", "Extracts JWT token from localStorage('swat_token'), sets Authorization: Bearer <JWT>, sets Content-Type: application/json, and calls fetch()."],
        ["4. Dev Proxy", "Vite Dev Proxy\n(frontend/vite.config.ts)", "Intercepts /api/v1/* on port 5180 and reverse proxies to backend port 8090, avoiding CORS browser blocks."],
        ["5. Gateway Ingress", "FastAPI Core Application\n(backend/app/main.py)", "CORSMiddleware validates origin against CORS_ORIGINS; global exception handler wraps uncaught errors."],
        ["6. Auth & RBAC", "Security Dependencies\n(backend/app/core/deps.py)", "Decodes JWT via jose.jwt with SECRET_KEY; validates sub=user_id and enforces required role (e.g. 'business')."],
        ["7. Session Injection", "Async DB Session\n(backend/app/core/database.py)", "FastAPI dependency get_db() yields an active AsyncSession from AsyncSessionLocal pool."],
        ["8. Validation", "Pydantic Schemas\n(backend/app/modules/*/schemas.py)", "Deserializes JSON into typed Pydantic models; validates positive rates, date ordering, and UUID foreign keys."],
        ["9. Domain Logic", "Service Engine\n(backend/app/modules/*/service.py)", "Executes business calculations (nights * rate, SWT-HTL ref, status checks, audit creation)."],
        ["10. DB Write", "SQLAlchemy 2.0 Async ORM\n(backend/app/core/database.py)", "Translates ORM operations to SQL INSERT/UPDATE statements; executes via aiosqlite/asyncpg; commits transaction."],
        ["11. DB Response", "Relational Database\n(PostgreSQL / SQLite WAL)", "Executes ACID commit; applies foreign key cascades and triggers; returns persisted row data."],
        ["12. Serialization", "FastAPI Response DTO\n(backend/app/modules/*/schemas.py)", "FastAPI serializes model to Pydantic Out schema, stripping private fields (passwords, internal keys), returning HTTP 200/201."],
        ["13. Client Receive", "Shared HTTP Client\n(frontend/src/api/client.ts)", "Validates response.ok; deserializes JSON into typed TypeScript generic Promise<T>; throws descriptive error if status >= 400."],
        ["14. UI Render", "React Component State\n(React 18 Concurrent DOM)", "Calling component receives typed object, invokes setState(), triggering virtual DOM re-render."]
    ]
    df_tbl = doc.add_table(rows=1 + len(data_flow_rows), cols=3)
    format_table(df_tbl, [Inches(1.5), Inches(2.3), Inches(3.0)], data_flow_headers, data_flow_rows, header_bg="0E7490")
    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Section 4: Master Catalog of Common Shared Infrastructure Files
    h4 = doc.add_heading("4. Master Catalog of Common & Shared Infrastructure Files", level=1)
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(6)
    for r in h4.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    p4 = doc.add_paragraph(
        "The following files provide shared cross-cutting infrastructure across all modules and applications in the platform:"
    )
    p4.paragraph_format.space_after = Pt(8)

    common_headers = ["Layer / Scope", "Exact Repository File Path", "Core Classes / Exports", "Universal System Responsibility"]
    common_rows = [
        ["Frontend (HTTP)", "frontend/src/api/client.ts", "apiRequest<T>(), getBaseUrl()", "Universal API gateway for all frontend modules. Intercepts every request, injects Bearer JWT from localStorage, normalizes backend errors."],
        ["Frontend (Auth)", "frontend/src/context/AuthContext.tsx", "AuthProvider, useAuth(), login(), logout(), refreshUser()", "Global authentication state manager. Caches user profile, manages explicit login state, resolves roles, controls multi-portal access."],
        ["Frontend (Theme)", "frontend/src/context/ThemeContext.tsx", "ThemeProvider, useTheme()", "Global theme styling engine (Light, Dark, High-Contrast Accessibility). Enforces 'lake' branding theme across all pages."],
        ["Frontend (Lang)", "frontend/src/context/TranslationContext.tsx", "TranslationProvider, useTranslation()", "Multilingual localization engine supplying translation dictionaries for English, Urdu, and Pashto across all views."],
        ["Frontend (UI)", "frontend/src/design/ (Button.tsx, Card.tsx, etc.)", "Design System Primitives (Button, Card, Badge, Modal, Input)", "Atomic UI component library guaranteeing standardized visual layout, colors, typography, and responsive spacing across all modules."],
        ["Frontend (Switch)", "frontend/src/components/RoleSwitcherBar.tsx", "RoleSwitcherBar", "Universal developer and demo persona switcher allowing instant switching between Tourist, Hotelier, and Authority dashboards."],
        ["Frontend (Proxy)", "frontend/vite.config.ts", "defineConfig(), Vite proxy config", "Configures dev server on port 5180, forwards /api and /uploads to backend port 8090, eliminating CORS issues in development."],
        ["Backend (Config)", "backend/app/core/config.py", "Settings, settings", "Central configuration hub. Loads .env parameters, builds DB connection strings, sets JWT secrets, CORS_ORIGINS, and payment credentials."],
        ["Backend (Database)", "backend/app/core/database.py", "engine, AsyncSessionLocal, Base, get_db(), TimestampMixin", "Initializes SQLAlchemy 2.0 Async engine, applies SQLite WAL mode PRAGMA connection listeners, exports get_db() session injector."],
        ["Backend (Auth)", "backend/app/core/auth.py", "verify_password(), get_password_hash(), create_access_token()", "Cryptographic security engine. Enforces Bcrypt password hashing and issues signed HMAC-SHA256 JWT bearer tokens."],
        ["Backend (Deps)", "backend/app/core/deps.py", "get_current_token_payload(), require_roles()", "Universal API gatekeeper. Enforces authentication and Role-Based Access Control (RBAC) on all protected endpoints."],
        ["Backend (Root)", "backend/app/main.py", "app = FastAPI(), lifespan(), CORSMiddleware", "Application bootstrap entrypoint. Sets CORS headers, mounts static /uploads, executes startup DB schema auto-migrations, mounts all routers."],
        ["Backend (Alerts)", "backend/app/modules/notifications/service.py", "NotificationService.create_notification()", "Cross-cutting in-app notification engine used by bookings, reviews, safety alerts, and KYC verification to persist alert records."],
        ["Backend (Dispatch)", "backend/app/modules/communications/dispatcher.py", "CommunicationDispatcher", "Multi-channel outbound communication engine orchestrating real-time dispatch across transactional Email, SMS, and WhatsApp."]
    ]
    common_tbl = doc.add_table(rows=1 + len(common_rows), cols=4)
    format_table(common_tbl, [Inches(1.4), Inches(2.2), Inches(1.8), Inches(1.8)], common_headers, common_rows, header_bg="0F766E")
    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Section 5: State Transition Matrices
    h5 = doc.add_heading("5. State Transition Lifecycle Matrices", level=1)
    h5.paragraph_format.space_before = Pt(14)
    h5.paragraph_format.space_after = Pt(6)
    for r in h5.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    p5 = doc.add_paragraph(
        "The booking master record and the physical room inventory progress through synchronized lifecycle states:"
    )
    p5.paragraph_format.space_after = Pt(8)

    # Booking states table
    b_headers = ["Lifecycle Stage", "bookings.status", "payment_status", "stay_status", "Triggering Action & File"]
    b_rows = [
        ["1. Initial Request", "requested", "unpaid", "reserved", "Tourist clicks 'Instant Book' (HotelDetailsModal.tsx)"],
        ["2. Host Acceptance", "accepted", "unpaid", "reserved", "Hotelier clicks 'Accept Booking' (HotelTodayScreen.tsx)"],
        ["3. Online Guarantee", "confirmed", "deposit_paid / paid", "reserved", "Tourist pays 20% or 100% (UnifiedCheckoutModal.tsx)"],
        ["4. Front-Desk Check-In", "confirmed", "paid", "checked_in", "Reception clicks 'Check In' & settles balance (HotelTodayScreen.tsx)"],
        ["5. Guest Check-Out", "completed", "paid", "checked_out", "Reception clicks 'Check Out' (HotelTodayScreen.tsx)"],
        ["6. Post-Stay Review", "completed", "paid", "checked_out", "Tourist submits 5-star review (ReviewModal.tsx)"]
    ]
    b_tbl = doc.add_table(rows=1 + len(b_rows), cols=5)
    format_table(b_tbl, [Inches(1.4), Inches(1.2), Inches(1.4), Inches(1.2), Inches(2.0)], b_headers, b_rows, header_bg="0369A1")
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Room states table
    r_headers = ["Room Rack State", "hotel_rooms.status", "stay_state", "cleaning_status", "PMS Trigger & File"]
    r_rows = [
        ["Vacant Clean", "available", "vacant", "ready", "Default ready state for incoming arrivals"],
        ["Allocated", "reserved", "reserved", "ready", "Reception assigns room to booking (AssignRoomModal.tsx)"],
        ["In-House Guest", "occupied", "occupied", "ready", "Check-in executed at reception (HotelTodayScreen.tsx)"],
        ["Turnover Cleaning", "cleaning", "turnover", "cleaning", "Check-out executed at departure (HotelTodayScreen.tsx)"],
        ["Sanitized Ready", "available", "vacant", "ready", "Housekeeping completes sanitization (PATCH /rooms/{id}/status)"]
    ]
    r_tbl = doc.add_table(rows=1 + len(r_rows), cols=5)
    format_table(r_tbl, [Inches(1.4), Inches(1.3), Inches(1.2), Inches(1.3), Inches(2.0)], r_headers, r_rows, header_bg="4338CA")
    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Section 6: Database Data Dictionary & Relational Schema
    h6 = doc.add_heading("6. Relational Database Data Dictionary & Tables", level=1)
    h6.paragraph_format.space_before = Pt(14)
    h6.paragraph_format.space_after = Pt(6)
    for r in h6.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    db_headers = ["Table Name & File Path", "Primary Keys & Foreign Keys", "Core Columns & Role in Flow"]
    db_rows = [
        ["bookings\n(backend/app/modules/\nbookings/models.py)", "id (UUID PK)\ntourist_id (FK users.id)\nbusiness_id (FK business_profiles.id)\nlisting_id (FK listings.id)", "reference (SWT-HTL-XXXXX, unique), status (requested/accepted/completed), payment_status, stay_status, assigned_room_number, total_amount, deposit_amount."],
        ["booking_items\n(backend/app/modules/\nbookings/models.py)", "id (UUID PK)\nbooking_id (FK bookings.id)\nprice_item_id (FK price_items.id)", "service_date, quantity, unit_price, line_total. Records exact room tier and nights booked."],
        ["booking_status_history\n(backend/app/modules/\nbookings/models.py)", "id (UUID PK)\nbooking_id (FK bookings.id)\nchanged_by (FK users.id)", "from_status, to_status, note, created_at. Immutable audit trail of every state change."],
        ["hotel_rooms\n(backend/app/modules/\nlistings/models.py)", "id (UUID PK)\nlisting_id (FK listings.id)\nprice_item_id (FK price_items.id)\ncurrent_booking_id (FK bookings.id)", "room_number (e.g. 204), floor, wing, status (available/reserved/occupied/cleaning), cleaning_status, stay_state."],
        ["availability\n(backend/app/modules/\nlistings/models.py)", "id (UUID PK)\nprice_item_id (FK price_items.id)", "date, units_total, units_booked, is_blocked. Date-level inventory preventing double-booking."],
        ["reviews & review_replies\n(backend/app/modules/\nreviews/models.py)", "id (UUID PK)\nbooking_id (FK bookings.id)\ntourist_id (FK users.id)\nlisting_id (FK listings.id)", "rating (1-5), title, comment, status ('published'). review_replies links hotelier responses."],
        ["notifications\n(backend/app/modules/\nnotifications/models.py)", "id (UUID PK)\nuser_id (FK users.id)", "type ('booking'), title, body, channel ('in_app'), is_read, sent_at, delivery_status ('delivered')."]
    ]
    db_tbl = doc.add_table(rows=1 + len(db_rows), cols=3)
    format_table(db_tbl, [Inches(1.8), Inches(2.2), Inches(3.0)], db_headers, db_rows, header_bg="9A3412")
    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # Callout: Executive Closing
    add_callout(
        doc,
        "Presentation Tip for Leadership Review",
        "When presenting this flow to executive leadership, emphasize the 3 key enterprise achievements:\n"
        "1. Decoupled 4-Tier Security: The frontend never accesses the database directly; every operation passes through strict JWT Bearer authentication and Pydantic validation.\n"
        "2. Frictionless Lifecycle: Tourists can search, request, receive verified QR passes, check in, check out, and leave feedback seamlessly with live multi-channel SMS/WhatsApp alerts.\n"
        "3. Live Operational PMS: Hoteliers have a real-time Today Screen and Room Rack with automated housekeeping turnover (Occupied -> Cleaning -> Ready).",
        bg_color="EFF6FF",
        border_color="2563EB"
    )

    doc.save(OUTPUT_DOCX)
    print(f"[Document] Complete unified document generated successfully: {OUTPUT_DOCX}")

if __name__ == "__main__":
    generate_architecture_image()
    generate_complete_word_doc()

