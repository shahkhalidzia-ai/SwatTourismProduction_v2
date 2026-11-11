import os
import sys
from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOC_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(DOC_DIR)
DIAGRAM_PATH = os.path.join(DOC_DIR, "swat_room_booking_architecture.png")
OUTPUT_DOCX = os.path.join(DOC_DIR, "Swat_Tourism_Room_Booking_Workflow_and_Architecture.docx")

# ---------------------------------------------------------
# 1. GENERATE ARCHITECTURE DIAGRAM (PNG) WITH PILLOW
# ---------------------------------------------------------
def generate_architecture_image():
    width, height = 1500, 1080
    img = Image.new("RGBA", (width, height), (248, 250, 252, 255))
    draw = ImageDraw.Draw(img)

    # Fonts
    try:
        font_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 25)
        font_subtitle = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 15)
        font_box_header = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 17)
        font_subhead = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 14)
        font_path = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 12)
        font_body = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 12)
    except:
        font_title = font_subtitle = font_box_header = font_subhead = font_path = font_body = ImageFont.load_default()

    # Header Bar
    draw.rectangle([(0, 0), (width, 85)], fill=(15, 23, 42, 255))
    draw.text((40, 14), "SWAT TOURISM PLATFORM (STP) — ROOM BOOKING ARCHITECTURE & FILE MAP", fill=(255, 255, 255, 255), font=font_title)
    draw.text((40, 50), "Complete Code Workflow with Repository File Paths: Frontend (React) → API Gateway (FastAPI) → Service Layer → DB Persistence", fill=(148, 163, 184, 255), font=font_subtitle)

    # Helper function for drawing rounded boxes with header
    def draw_card(x, y, w, h, bg_color, border_color, title, title_bg):
        draw.rounded_rectangle([(x, y), (x + w, y + h)], radius=12, fill=bg_color, outline=border_color, width=2)
        draw.rounded_rectangle([(x, y), (x + w, y + 42)], radius=12, fill=title_bg)
        draw.rectangle([(x, y + 25), (x + w, y + 42)], fill=title_bg)
        draw.text((x + 16, y + 10), title, fill=(255, 255, 255, 255), font=font_box_header)

    # 1. FRONTEND LAYER
    draw_card(40, 115, 680, 420, (255, 255, 255, 255), (14, 116, 144, 255), "1. FRONTEND CLIENT UI & STATE (frontend/src/)", (14, 116, 144, 255))
    items_frontend = [
        ("HotelDetailsModal.tsx", "frontend/src/modules/tourist/HotelDetailsModal.tsx", "Room tiers, nights & pricing calculator, instant booking trigger"),
        ("UnifiedCheckoutModal.tsx", "frontend/src/components/UnifiedCheckoutModal.tsx", "Multi-mode drawer: Full Online, 20% Deposit, Pay-at-Hotel (Easypaisa/IBFT)"),
        ("BookingVoucherModal.tsx", "frontend/src/components/BookingVoucherModal.tsx", "Dynamic QR pass, PDF export, check-in instructions & WhatsApp share"),
        ("HotelTodayScreen.tsx & AssignModal", "frontend/src/modules/business/HotelTodayScreen.tsx", "Front desk PMS: arrivals, departures, physical room rack, check-in/out"),
        ("API Clients (bookings.ts, rooms.ts)", "frontend/src/api/bookings.ts & rooms.ts", "Typed HTTP wrappers calling backend FastAPI endpoints with JWT auth"),
        ("Physical Room State & Sync", "frontend/src/modules/business/physicalRooms.ts", "Syncs live room rack data between PostgreSQL and client state")
    ]
    cur_y = 170
    for fn, path, desc in items_frontend:
        draw.rounded_rectangle([(55, cur_y), (700, cur_y + 54)], radius=6, fill=(240, 249, 255, 255), outline=(186, 230, 253, 255), width=1)
        draw.text((68, cur_y + 5), fn, fill=(3, 105, 161, 255), font=font_subhead)
        draw.text((68, cur_y + 22), path, fill=(14, 116, 144, 255), font=font_path)
        draw.text((68, cur_y + 37), desc, fill=(71, 85, 105, 255), font=font_body)
        cur_y += 60

    # 2. BACKEND API & SECURITY GATEWAY
    draw_card(760, 115, 700, 420, (255, 255, 255, 255), (15, 118, 110, 255), "2. BACKEND API & SECURITY LAYER (backend/app/)", (15, 118, 110, 255))
    items_api = [
        ("JWT Auth Guard", "backend/app/core/auth.py", "get_current_token_payload() validates JWT tokens & resolves user/roles"),
        ("Bookings Router", "backend/app/modules/bookings/router.py", "POST /request, POST /{id}/pay/unified, check-in, check-out, collect-balance"),
        ("Listings & Rooms Router", "backend/app/modules/listings/router.py", "GET /{id}/rooms, POST /{id}/assign-rooms, PATCH /rooms/{id}/status"),
        ("Pydantic Schemas", "backend/app/modules/bookings/schemas.py", "Validates payloads: BookingCreateRequest, UnifiedCheckoutRequest, BookingOut"),
        ("Voucher & IPN Webhook Endpoints", "backend/app/modules/bookings/router.py", "GET /{id}/voucher (HTML/QR), POST /easypaisa/ipn-callback, claim endpoint"),
        ("Async DB Session Engine", "backend/app/core/database.py", "SQLAlchemy 2.0 AsyncSession dependency injection (get_db)")
    ]
    cur_y = 170
    for fn, path, desc in items_api:
        draw.rounded_rectangle([(775, cur_y), (1440, cur_y + 54)], radius=6, fill=(240, 253, 250, 255), outline=(153, 246, 228, 255), width=1)
        draw.text((788, cur_y + 5), fn, fill=(15, 118, 110, 255), font=font_subhead)
        draw.text((788, cur_y + 22), path, fill=(13, 148, 136, 255), font=font_path)
        draw.text((788, cur_y + 37), desc, fill=(71, 85, 105, 255), font=font_body)
        cur_y += 60

    # 3. DOMAIN SERVICE & INTEGRATIONS LAYER
    draw_card(40, 565, 680, 470, (255, 255, 255, 255), (67, 56, 202, 255), "3. SERVICE LAYER & LOGIC (backend/app/modules/)", (67, 56, 202, 255))
    items_services = [
        ("BookingService Engine", "backend/app/modules/bookings/service.py", "Generates SWT-HTL-XXXXX ref, dates, night rates, state transitions"),
        ("PaymentGatewayManager", "backend/app/modules/bookings/payment_adapter.py", "Easypaisa MA push, JazzCash, IBFT manual slip audit tracking"),
        ("ReceiptService (Voucher & QR)", "backend/app/modules/bookings/receipt_service.py", "Renders printable HTML voucher with dynamic QR verification URL"),
        ("ListingsService (Physical Rooms)", "backend/app/modules/listings/service.py", "Manages physical HotelRoom allocation, housekeeping, and rack sync"),
        ("NotificationService", "backend/app/modules/notifications/service.py", "Multi-channel dispatch: SMS, Email booking pass, WhatsApp alerts"),
        ("Balance Settlement Engine", "backend/app/modules/bookings/service.py", "Folio receipt calculation, cash/POS collection, property collected balance"),
        ("Guest Booking Claiming Service", "backend/app/modules/bookings/service.py", "claim_bookings() links unauthenticated guest bookings to tourist UUID")
    ]
    cur_y = 620
    for fn, path, desc in items_services:
        draw.rounded_rectangle([(55, cur_y), (700, cur_y + 54)], radius=6, fill=(245, 243, 255, 255), outline=(221, 214, 254, 255), width=1)
        draw.text((68, cur_y + 5), fn, fill=(79, 70, 229, 255), font=font_subhead)
        draw.text((68, cur_y + 22), path, fill=(99, 102, 241, 255), font=font_path)
        draw.text((68, cur_y + 37), desc, fill=(71, 85, 105, 255), font=font_body)
        cur_y += 60

    # 4. DATABASE PERSISTENCE LAYER
    draw_card(760, 565, 700, 470, (255, 255, 255, 255), (180, 83, 9, 255), "4. DATABASE MODELS & SCHEMA (backend/app/*/models.py)", (180, 83, 9, 255))
    items_db = [
        ("bookings Table (Model: Booking)", "backend/app/modules/bookings/models.py", "reference, tourist_id, business_id, dates, total, status, stay_status, room_id"),
        ("booking_items Table", "backend/app/modules/bookings/models.py", "booking_id, price_item_id, service_date, quantity, unit_price, line_total"),
        ("booking_status_history Table", "backend/app/modules/bookings/models.py", "from_status, to_status, changed_by, note, immutable timestamps"),
        ("booking_payments Table", "backend/app/modules/bookings/models.py", "payment_role, amount, track, gateway, transaction_ref, verification_status"),
        ("hotel_rooms Table (Model: HotelRoom)", "backend/app/modules/listings/models.py", "room_number, floor, wing, cleaning_status, stay_state, current_booking_id"),
        ("availability Table", "backend/app/modules/listings/models.py", "date-level calendar, units_total, units_booked, is_blocked"),
        ("price_items Table (Room Catalog)", "backend/app/modules/listings/models.py", "name, category, price, unit (per_night), capacity, default_units")
    ]
    cur_y = 620
    for fn, path, desc in items_db:
        draw.rounded_rectangle([(775, cur_y), (1440, cur_y + 54)], radius=6, fill=(255, 251, 235, 255), outline=(253, 230, 138, 255), width=1)
        draw.text((788, cur_y + 5), fn, fill=(180, 83, 9, 255), font=font_subhead)
        draw.text((788, cur_y + 22), path, fill=(217, 119, 6, 255), font=font_path)
        draw.text((788, cur_y + 37), desc, fill=(71, 85, 105, 255), font=font_body)
        cur_y += 60

    # Directional Arrows
    draw.polygon([(725, 310), (755, 320), (725, 330)], fill=(14, 116, 144, 255))
    draw.line([(705, 320), (750, 320)], fill=(14, 116, 144, 255), width=4)

    draw.polygon([(1100, 540), (1110, 565), (1120, 540)], fill=(15, 118, 110, 255))
    draw.line([(1110, 520), (1110, 560)], fill=(15, 118, 110, 255), width=4)

    draw.polygon([(755, 790), (725, 800), (755, 810)], fill=(67, 56, 202, 255))
    draw.line([(760, 800), (730, 800)], fill=(67, 56, 202, 255), width=4)

    img.save(DIAGRAM_PATH, "PNG")
    print(f"[Diagram] Generated with file paths: {DIAGRAM_PATH}")

# ---------------------------------------------------------
# 2. DOCX HELPER FUNCTIONS
# ---------------------------------------------------------
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

# ---------------------------------------------------------
# 3. BUILD COMPLETE WORD DOCUMENT
# ---------------------------------------------------------
def generate_docx():
    doc = Document()
    
    # Configure 1-inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Document Header / Banner Title
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
    run_sub = p_sub.add_run("Complete Code Workflow & Architecture Specification: Hotel Room Booking Process")
    run_sub.bold = True
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(13)
    run_sub.font.color.rgb = RGBColor(14, 116, 144)

    # Document Metadata Box
    meta_headers = ["Attribute", "Value Details"]
    meta_rows = [
        ["System Domain", "Hotel & Hospitality Reservation Engine, Front Desk PMS, & Financial Clearance"],
        ["Application Architecture", "Decoupled 4-Tier Architecture (Frontend UI → API Gateway → Domain Services → Relational DB)"],
        ["Workspace Root Directory", "f:\\Antigravity\\SwatTourismProduction_v2"],
        ["Core Technologies", "React 18, TypeScript, Tailwind CSS, FastAPI, SQLAlchemy 2.0 Async, PostgreSQL / SQLite"],
        ["Document Classification", "Full Technical & Code Workflow Specification with Repository File Paths & Map"],
        ["Target Audience", "Software Engineers, System Architects, Quality Assurance Engineers, & Operations Staff"]
    ]
    meta_tbl = doc.add_table(rows=1 + len(meta_rows), cols=2)
    meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    format_table(meta_tbl, [Inches(2.2), Inches(4.6)], meta_headers, meta_rows, header_bg="0F172A")

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Callout: Executive Summary
    add_callout(
        doc,
        "Executive Architecture Summary & File Navigation",
        "This specification details the complete hotel room booking lifecycle in the Swat Tourism Platform. "
        "It maps every single layer, file, class, method, API endpoint, database table, and state transition. "
        "Every file path in this document is explicitly referenced against the project root (f:\\Antigravity\\SwatTourismProduction_v2), "
        "guaranteeing exact code traceability for engineers and auditors.",
        bg_color="F0FDF4",
        border_color="16A34A"
    )

    # Section 1: Architecture Diagram with File Paths
    h1 = doc.add_heading("1. End-to-End Architecture Diagram & File Map", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)
    for r in h1.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    p_desc = doc.add_paragraph(
        "The following diagram illustrates the interaction between the Frontend UI Layer, the FastAPI Security & Routing Gateway, "
        "the Business Logic & Service Layer, and the underlying Database Persistence Layer, with exact repository file paths annotated on every block:"
    )
    p_desc.paragraph_format.space_after = Pt(10)

    if os.path.exists(DIAGRAM_PATH):
        doc.add_picture(DIAGRAM_PATH, width=Inches(6.8))
        p_cap = doc.add_paragraph("Figure 1.1: Complete Architectural Flow of the Hotel Room Booking System with Repository File Paths")
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(4)
        p_cap.paragraph_format.space_after = Pt(14)
        run_cap = p_cap.runs[0]
        run_cap.font.name = "Arial"
        run_cap.font.size = Pt(8.5)
        run_cap.font.italic = True
        run_cap.font.color.rgb = RGBColor(100, 116, 139)

    # Section 2: Comprehensive Source File Directory & Exact Path Index
    h_idx = doc.add_heading("2. Comprehensive Source File Directory & Exact Path Index", level=1)
    h_idx.paragraph_format.space_before = Pt(16)
    h_idx.paragraph_format.space_after = Pt(6)
    for r in h_idx.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    p_idx = doc.add_paragraph(
        "The table below indexes every file participating in the Room Booking workflow, including its exact relative path, "
        "primary classes/methods, and architectural domain:"
    )
    p_idx.paragraph_format.space_after = Pt(8)

    index_headers = ["Layer / Subsystem", "Exact Relative File Path", "Key Classes, Functions & Exports", "Primary Task"]
    index_rows = [
        [
            "Frontend (Tourist UI)",
            "frontend/src/modules/tourist/\nHotelDetailsModal.tsx",
            "HotelDetailsModal,\nhandleInstantBook(),\nhandleGuestSubmit(),\ncurrentSelectedRoom",
            "Room selection, nights computation, booking submission for both authenticated and guest users."
        ],
        [
            "Frontend (Payment Drawer)",
            "frontend/src/components/\nUnifiedCheckoutModal.tsx",
            "UnifiedCheckoutModal,\nhandleProcessPayment(),\nhandleDirectTransferSubmit()",
            "Multi-channel guarantee checkout: Full Online, 20% Deposit, or Pay at Hotel (Easypaisa/JazzCash/IBFT)."
        ],
        [
            "Frontend (QR Pass & Voucher)",
            "frontend/src/components/\nBookingVoucherModal.tsx",
            "BookingVoucherModal,\nwindow.print(),\ngetBookingVoucherUrl()",
            "Visual boarding pass with live QR code, PDF export, check-in instructions, and WhatsApp sharing."
        ],
        [
            "Frontend (Front-Desk PMS)",
            "frontend/src/modules/business/\nHotelTodayScreen.tsx",
            "HotelTodayScreen,\nhandleCheckIn(),\nhandleCheckOut(),\nhandleCollectBalance()",
            "PMS screen displaying arrivals, departures, stayed guests, and interactive Room Rack matrix."
        ],
        [
            "Frontend (Room Allocation)",
            "frontend/src/modules/business/\nAssignRoomModal.tsx",
            "AssignRoomModal,\nhandleSaveAssignment()",
            "Front desk popup to select and allocate clean physical room numbers (e.g., 101, 204) to reservations."
        ],
        [
            "Frontend (Folio Receipt)",
            "frontend/src/modules/business/\nHotelFolioReceiptModal.tsx",
            "HotelFolioReceiptModal,\nrenderFolioReceipt()",
            "Generates check-in arrival pass and check-out folio receipt with deposit and cash/card breakdown."
        ],
        [
            "Frontend (Room Rack State)",
            "frontend/src/modules/business/\nphysicalRooms.ts",
            "syncPhysicalRoomsFromDb(),\ngetPhysicalRoomsForHotel(),\nupdatePhysicalRoomStatus()",
            "Maintains physical room state, performs PostgreSQL DB sync, and emits swat_physical_rooms_updated."
        ],
        [
            "Frontend (Bookings API Client)",
            "frontend/src/api/bookings.ts",
            "createBookingRequest(),\npayUnifiedBooking(),\ncollectBookingBalance(),\ncheckInBookingApi(),\nclaimBookingsApi()",
            "Typed frontend API client wrapping all /api/v1/bookings endpoints with JWT token transmission."
        ],
        [
            "Frontend (Rooms API Client)",
            "frontend/src/api/rooms.ts",
            "fetchHotelRooms(),\nassignRoomsToBookingApi(),\nupdateHotelRoomStatus(),\nreleaseHotelRoomApi()",
            "Typed frontend API client wrapping hotel room rack inventory and housekeeping endpoints."
        ],
        [
            "Frontend (HTTP Core Client)",
            "frontend/src/api/client.ts",
            "apiRequest<T>(),\ngetAuthHeaders()",
            "Base HTTP fetch wrapper injecting Authorization: Bearer <JWT> and handling JSON serialization."
        ],
        [
            "Backend (API Routing)",
            "backend/app/modules/bookings/\nrouter.py",
            "POST /request,\nPOST /{id}/pay/unified,\nPOST /{id}/check-in,\nPOST /{id}/check-out,\nPOST /claim",
            "Exposes REST endpoints for the full booking lifecycle, balance settlement, and IPN callbacks."
        ],
        [
            "Backend (Pydantic Schemas)",
            "backend/app/modules/bookings/\nschemas.py",
            "BookingCreateRequest,\nUnifiedCheckoutRequest,\nBookingOut, BookingItemOut,\nClaimBookingsRequest",
            "Strict request payload validation, date format checks, positive amounts, and JSON output formatting."
        ],
        [
            "Backend (Booking Engine)",
            "backend/app/modules/bookings/\nservice.py",
            "BookingService.create_booking(),\npay_unified_booking(),\ncheck_in_booking(),\nclaim_bookings()",
            "Generates booking references, computes night rates, manages availability locks, and executes state transitions."
        ],
        [
            "Backend (Payment Adapter)",
            "backend/app/modules/bookings/\npayment_adapter.py",
            "PaymentGatewayManager,\nEasypaisaPaymentAdapter,\nJazzCashPaymentAdapter",
            "Processes online payments (Easypaisa MA push, JazzCash, Card) and tracks direct transfer proofs."
        ],
        [
            "Backend (Voucher Engine)",
            "backend/app/modules/bookings/\nreceipt_service.py",
            "ReceiptService.generate_voucher_html(),\ngenerate_receipt_html(),\nbuild_qr_code()",
            "Compiles responsive HTML/PDF vouchers with embedded dynamic QR codes pointing to verification URLs."
        ],
        [
            "Backend (Rooms & Listings)",
            "backend/app/modules/listings/\nrouter.py & service.py",
            "GET /{id}/rooms,\nPOST /{id}/assign-rooms,\nPATCH /rooms/{id}/status,\nListingsService",
            "Manages physical room rack inventory, room assignments, and housekeeping cleaning states."
        ],
        [
            "Backend (Notifications)",
            "backend/app/modules/notifications/\nservice.py",
            "NotificationService.send_sms(),\nsend_email(),\nsend_whatsapp()",
            "Dispatches multi-channel booking alerts, email vouchers, and WhatsApp boarding passes to guests and staff."
        ],
        [
            "Backend (Bookings Models)",
            "backend/app/modules/bookings/\nmodels.py",
            "Booking, BookingItem,\nBookingStatusHistory,\nBookingPayment",
            "SQLAlchemy ORM models defining bookings, item line details, state transition audit trails, and payments."
        ],
        [
            "Backend (Listings Models)",
            "backend/app/modules/listings/\nmodels.py",
            "Listing, PriceItem,\nAvailability, HotelRoom",
            "SQLAlchemy ORM models defining hotel listings, room tier pricing, inventory calendars, and physical rooms."
        ],
        [
            "Test Suite (Frontend)",
            "frontend/src/test/\nguest_and_user_hotel_booking.test.tsx",
            "describe('Hotel Booking Flow')",
            "Automated test verifying guest checkout, authenticated checkout, room selection, and payment drawers."
        ],
        [
            "Test Suite (Backend)",
            "backend/tests/\ntest_bookings.py",
            "test_create_booking_request(),\ntest_check_in_booking()",
            "Pytest test suite validating API endpoints, date availability decrements, and status transitions."
        ]
    ]
    idx_col_w = [Inches(1.6), Inches(2.2), Inches(1.8), Inches(1.8)]
    idx_tbl = doc.add_table(rows=1 + len(index_rows), cols=4)
    format_table(idx_tbl, idx_col_w, index_headers, index_rows, header_bg="0E7490")

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # Section 3: Layer-by-Layer Architectural Guide
    h2 = doc.add_heading("3. Layer-by-Layer Technical & File Architecture", level=1)
    h2.paragraph_format.space_before = Pt(16)
    h2.paragraph_format.space_after = Pt(6)
    for r in h2.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    p2 = doc.add_paragraph(
        "The room booking process is strictly partitioned across four coordinated architectural layers. "
        "Each layer encapsulates specific responsibilities to ensure separation of concerns, transactional safety, and high performance."
    )
    p2.paragraph_format.space_after = Pt(8)

    col_w = [Inches(1.8), Inches(2.4), Inches(2.6)]
    l_headers = ["Layer", "Repository File Paths", "Assigned Tasks & Core Responsibilities"]
    l_rows = [
        [
            "Layer 1: Frontend Client UI",
            "frontend/src/modules/tourist/HotelDetailsModal.tsx\nfrontend/src/components/UnifiedCheckoutModal.tsx\nfrontend/src/components/BookingVoucherModal.tsx\nfrontend/src/modules/business/HotelTodayScreen.tsx\nfrontend/src/modules/business/AssignRoomModal.tsx\nfrontend/src/api/bookings.ts & rooms.ts",
            "Presents room tiers, calculates night totals, triggers instant reservations, provides multi-gateway checkout drawers, generates printable QR passes, and manages front-desk room rack operations."
        ],
        [
            "Layer 2: API & Security Gateway",
            "backend/app/core/auth.py\nbackend/app/modules/bookings/router.py\nbackend/app/modules/listings/router.py\nbackend/app/modules/bookings/schemas.py\nbackend/app/core/database.py",
            "Enforces JWT bearer authentication, parses HTTP payloads against strict Pydantic schemas, maps REST routes, handles IPN callbacks, and routes requests to domain services."
        ],
        [
            "Layer 3: Business Logic & Services",
            "backend/app/modules/bookings/service.py\nbackend/app/modules/bookings/payment_adapter.py\nbackend/app/modules/bookings/receipt_service.py\nbackend/app/modules/listings/service.py\nbackend/app/modules/notifications/service.py",
            "Generates unique references (SWT-HTL-XXXXX), enforces date-range inventory locks, handles state transitions, triggers payment gateway pushes, compiles HTML vouchers, and sends WhatsApp/SMS alerts."
        ],
        [
            "Layer 4: Relational Persistence",
            "backend/app/modules/bookings/models.py\nbackend/app/modules/listings/models.py\nbackend/app/modules/accounts/models.py",
            "Provides ACID-compliant relational data persistence in PostgreSQL/SQLite via SQLAlchemy 2.0 Async ORM with foreign key cascades, unique indexes, and audit logs."
        ]
    ]
    layers_tbl = doc.add_table(rows=1 + len(l_rows), cols=3)
    format_table(layers_tbl, col_w, l_headers, l_rows, header_bg="0E7490")

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Section 4: End-to-End Sequence & Workflow Steps
    h4 = doc.add_heading("4. End-to-End Execution Sequence Flow (With File Paths)", level=1)
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(6)
    for r in h4.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    steps = [
        ("Step 1: Room Selection & Reservation Submission", 
         "File: frontend/src/modules/tourist/HotelDetailsModal.tsx\n"
         "API Wrapper: frontend/src/api/bookings.ts::createBookingRequest()\n"
         "API Endpoint: backend/app/modules/bookings/router.py::create_booking_request_endpoint (POST /api/v1/bookings/request)\n"
         "Service Execution: backend/app/modules/bookings/service.py::BookingService.create_booking()\n"
         "Database Insert: backend/app/modules/bookings/models.py::Booking & BookingItem\n"
         "Description: The tourist chooses a room category (e.g. Deluxe Room), selects check-in/out dates, and clicks 'Instant Book'. "
         "BookingService calculates nights, verifies capacity, generates reference code (SWT-HTL-XXXXX), increments availability.units_booked, "
         "and inserts records into bookings and booking_items with status 'requested'."),
        
        ("Step 2: Guarantee & Unified Checkout",
         "File: frontend/src/components/UnifiedCheckoutModal.tsx\n"
         "API Wrapper: frontend/src/api/bookings.ts::payUnifiedBooking()\n"
         "API Endpoint: backend/app/modules/bookings/router.py::pay_unified_booking_endpoint (POST /api/v1/bookings/{id}/pay/unified)\n"
         "Payment Adapter: backend/app/modules/bookings/payment_adapter.py::PaymentGatewayManager\n"
         "Database Insert: backend/app/modules/bookings/models.py::BookingPayment\n"
         "Description: The tourist chooses their preferred payment mode:\n"
         "• Full Online (100%): Pays total room price upfront via Easypaisa, JazzCash, or Card.\n"
         "• Confirmation Deposit (20%): Pays 20% deposit online to lock room; balance payable at front desk.\n"
         "• Pay at Hotel: Guarantees reservation without immediate payment; 100% collected on arrival.\n"
         "PaymentGatewayManager validates the transaction, records it in booking_payments, and updates booking status to 'confirmed' with payment_status set to 'paid' or 'deposit_paid'."),

        ("Step 3: Official Voucher & Dynamic QR Code Generation",
         "File: frontend/src/components/BookingVoucherModal.tsx\n"
         "API Endpoint: backend/app/modules/bookings/router.py::get_booking_voucher_endpoint (GET /api/v1/bookings/{id}/voucher)\n"
         "Service Execution: backend/app/modules/bookings/receipt_service.py::ReceiptService.generate_voucher_html()\n"
         "Notifications: backend/app/modules/notifications/service.py::NotificationService\n"
         "Description: Upon confirmation, the frontend opens BookingVoucherModal.tsx. The backend ReceiptService generates an official booking pass with a dynamic QR code "
         "pointing to /api/v1/bookings/{id}/voucher. Concurrently, NotificationService sends confirmation alerts via SMS, HTML Email, and WhatsApp."),

        ("Step 4: Front-Desk Room Allocation & Arrival",
         "File: frontend/src/modules/business/HotelTodayScreen.tsx & AssignRoomModal.tsx\n"
         "State Sync: frontend/src/modules/business/physicalRooms.ts::syncPhysicalRoomsFromDb()\n"
         "API Wrapper: frontend/src/api/rooms.ts::assignRoomsToBookingApi()\n"
         "API Endpoint: backend/app/modules/listings/router.py::assign_rooms_endpoint (POST /api/v1/listings/{id}/assign-rooms)\n"
         "Database Update: backend/app/modules/listings/models.py::HotelRoom\n"
         "Description: The hotel front-desk agent logs into HotelTodayScreen.tsx and inspects the Room Rack matrix. "
         "Using AssignRoomModal.tsx, the agent assigns an available, clean room number (e.g. Room 204) to the reservation, updating hotel_rooms to status 'reserved' with current_booking_id."),

        ("Step 5: Check-In & Remaining Balance Settlement",
         "File: frontend/src/modules/business/HotelTodayScreen.tsx & HotelFolioReceiptModal.tsx\n"
         "API Wrapper: frontend/src/api/bookings.ts::collectBookingBalance() & checkInBookingApi()\n"
         "API Endpoints: POST /api/v1/bookings/{id}/collect-balance & POST /api/v1/bookings/{id}/check-in\n"
         "Database Updates: bookings (stay_status='checked_in') & hotel_rooms (status='occupied', stay_state='occupied')\n"
         "Description: Upon guest arrival at reception, the front desk scans the QR voucher. If a remaining balance exists, staff records cash or POS payment. "
         "Then staff clicks 'Check In', which marks bookings.stay_status = 'checked_in' and hotel_rooms.status = 'occupied'."),

        ("Step 6: Check-Out & Housekeeping Turnover",
         "File: frontend/src/modules/business/HotelTodayScreen.tsx\n"
         "API Wrapper: frontend/src/api/bookings.ts::checkOutBookingApi() & api/rooms.ts::updateHotelRoomStatus()\n"
         "API Endpoints: POST /api/v1/bookings/{id}/check-out & PATCH /api/v1/listings/rooms/{id}/status\n"
         "Database Updates: bookings (status='completed', stay_status='checked_out') & hotel_rooms (status='cleaning' → 'available')\n"
         "Description: At departure, staff executes check-out. The booking transitions to 'completed'. "
         "The assigned physical room automatically transitions to status 'cleaning' and stay_state = 'turnover'. "
         "Once housekeepers finish sanitization, they update the room to 'ready', making it 'available' again.")
    ]

    for title, desc in steps:
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

    # Section 5: Database Schema & Entity Relationships
    h5 = doc.add_heading("5. Database Relational Schema & Data Dictionary", level=1)
    h5.paragraph_format.space_before = Pt(14)
    h5.paragraph_format.space_after = Pt(6)
    for r in h5.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    p5 = doc.add_paragraph(
        "The room booking process relies on seven primary database tables modeled in SQLAlchemy 2.0 Async ORM. "
        "The exact model file paths and table definitions are detailed below:"
    )
    p5.paragraph_format.space_after = Pt(8)

    db_w = [Inches(1.8), Inches(2.2), Inches(2.8)]
    db_headers = ["Table Name & File Path", "Key Columns & Foreign Keys", "Role in Room Booking Process"]
    db_rows = [
        [
            "bookings\n(backend/app/modules/\nbookings/models.py)",
            "id (UUID PK)\nreference (String 20, unique)\ntourist_id (FK users.id)\nbusiness_id (FK business_profiles.id)\nlisting_id (FK listings.id)\nstatus, payment_status, stay_status\ntotal_amount, deposit_amount\nassigned_room_number, assigned_room_id",
            "Master reservation record. Stores booking reference, tourist identity, check-in/out dates, price calculations, guarantee track, and front-desk stay states."
        ],
        [
            "booking_items\n(backend/app/modules/\nbookings/models.py)",
            "id (UUID PK)\nbooking_id (FK bookings.id)\nprice_item_id (FK price_items.id)\nservice_date (Date)\nquantity (Integer)\nunit_price, line_total (Numeric 12,2)",
            "Individual room line items. Records which room tier was selected, the quantity of rooms booked, price per night, and line totals."
        ],
        [
            "booking_status_history\n(backend/app/modules/\nbookings/models.py)",
            "id (UUID PK)\nbooking_id (FK bookings.id)\nfrom_status, to_status (String 20)\nchanged_by (FK users.id)\nnote (Text), created_at (DateTime)",
            "Immutable audit trail capturing every state transition (requested → accepted → confirmed → checked_in → completed) with timestamp and user attribution."
        ],
        [
            "booking_payments\n(backend/app/modules/\nbookings/models.py)",
            "id (UUID PK)\nbooking_id (FK bookings.id)\npayment_role, collection_stage\ntrack, payment_method, funds_custody\namount, currency, transaction_ref\nverification_status",
            "Financial ledger recording online advance deposits, direct bank transfer references, and front-desk balance collections."
        ],
        [
            "hotel_rooms\n(backend/app/modules/\nlistings/models.py)",
            "id (UUID PK)\nlisting_id (FK listings.id)\nprice_item_id (FK price_items.id)\nroom_number, floor, wing\nstatus, cleaning_status, stay_state\ncurrent_booking_id (FK bookings.id)",
            "Physical room inventory representing individual hotel rooms (e.g. 101, 102, 201). Tracks live occupancy, reservation links, and housekeeping cleanliness."
        ],
        [
            "price_items\n(backend/app/modules/\nlistings/models.py)",
            "id (UUID PK)\nlisting_id (FK listings.id)\nname, category, price, unit\ncapacity, default_units, is_bookable",
            "Catalog of room tiers offered by the property (e.g. Standard Room, Deluxe River View, Executive Suite) with nightly pricing and capacity."
        ],
        [
            "availability\n(backend/app/modules/\nlistings/models.py)",
            "id (UUID PK)\nprice_item_id (FK price_items.id)\ndate (Date)\nunits_total, units_booked (Integer)\nis_blocked (Boolean)",
            "Date-level calendar matrix preventing double-booking by tracking total room inventory against booked room units per day."
        ]
    ]
    db_tbl = doc.add_table(rows=1 + len(db_rows), cols=3)
    format_table(db_tbl, db_w, db_headers, db_rows, header_bg="9A3412")

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Section 6: State Transition Matrices
    h6 = doc.add_heading("6. State Transition Matrices", level=1)
    h6.paragraph_format.space_before = Pt(14)
    h6.paragraph_format.space_after = Pt(6)
    for r in h6.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    p6 = doc.add_paragraph(
        "The booking header and physical room inventory progress through synchronized state lifecycles:"
    )
    p6.paragraph_format.space_after = Pt(8)

    # Table: Booking States
    b_state_w = [Inches(1.2), Inches(1.2), Inches(1.4), Inches(1.2), Inches(1.8)]
    b_headers = ["Lifecycle Stage", "Booking status", "payment_status", "stay_status", "Trigger Endpoint & File"]
    b_rows = [
        ["1. Reservation", "requested", "unpaid", "reserved", "POST /bookings/request\n(bookings/router.py)"],
        ["2. Guarantee", "confirmed", "deposit_paid / paid", "reserved", "POST /bookings/{id}/pay/unified\n(bookings/router.py)"],
        ["3. Check-In", "confirmed", "paid", "checked_in", "POST /bookings/{id}/check-in\n(bookings/router.py)"],
        ["4. Check-Out", "completed", "paid", "checked_out", "POST /bookings/{id}/check-out\n(bookings/router.py)"],
        ["5. Cancellation", "cancelled", "refunded / unpaid", "null", "POST /bookings/{id}/cancel\n(bookings/router.py)"]
    ]
    b_state_tbl = doc.add_table(rows=1 + len(b_rows), cols=5)
    format_table(b_state_tbl, b_state_w, b_headers, b_rows, header_bg="0369A1")

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Table: Room States
    r_state_w = [Inches(1.2), Inches(1.2), Inches(1.4), Inches(1.2), Inches(1.8)]
    r_headers = ["Room Rack State", "room status", "stay_state", "cleaning_status", "Operational Trigger & File"]
    r_rows = [
        ["Vacant Clean", "available", "vacant", "ready", "Default ready state for check-in"],
        ["Allocated", "reserved", "reserved", "ready", "Front desk assigns room to booking\n(AssignRoomModal.tsx)"],
        ["Guest In-House", "occupied", "occupied", "ready", "Guest check-in executed\n(HotelTodayScreen.tsx)"],
        ["Turnover", "cleaning", "turnover", "cleaning", "Guest check-out executed\n(HotelTodayScreen.tsx)"],
        ["Sanitized", "available", "vacant", "ready", "Housekeeping turnover finished\n(PATCH /rooms/{id}/status)"]
    ]
    r_state_tbl = doc.add_table(rows=1 + len(r_rows), cols=5)
    format_table(r_state_tbl, r_state_w, r_headers, r_rows, header_bg="4338CA")

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # Callout: Verification & Guest Claiming Feature
    add_callout(
        doc,
        "Guest Booking Claiming Architecture & File Path",
        "The system supports instant frictionless booking for unauthenticated guests via HotelDetailsModal.tsx by storing local reservation tracking tokens. "
        "When the guest later registers or logs into a verified tourist account, the frontend triggers claimBookingsApi() in frontend/src/api/bookings.ts calling "
        "POST /api/v1/bookings/claim handled in backend/app/modules/bookings/router.py and executed by BookingService.claim_bookings() in backend/app/modules/bookings/service.py. "
        "The backend matches guest phone/email or reference codes, updates booking.tourist_id to the authenticated user UUID, and seamlessly merges all reservations into their account history.",
        bg_color="EFF6FF",
        border_color="2563EB"
    )

    doc.save(OUTPUT_DOCX)
    print(f"[Document] Generated successfully with comprehensive file paths: {OUTPUT_DOCX}")

if __name__ == "__main__":
    generate_architecture_image()
    generate_docx()
