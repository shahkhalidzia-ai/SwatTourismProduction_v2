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
DIAGRAM_PATH = os.path.join(DOC_DIR, "swat_room_booking_call_flow_diagram.png")
OUTPUT_DOCX = os.path.join(DOC_DIR, "Swat_Tourism_Room_Booking_Call_Flow_Architecture.docx")

# ---------------------------------------------------------
# 1. GENERATE VISUAL CALL FLOW SEQUENCE DIAGRAM (PNG)
# ---------------------------------------------------------
def generate_call_flow_image():
    width, height = 1560, 1320
    img = Image.new("RGBA", (width, height), (248, 250, 252, 255))
    draw = ImageDraw.Draw(img)

    # Fonts
    try:
        font_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 25)
        font_subtitle = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 15)
        font_lane_header = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 14)
        font_lane_sub = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 11)
        font_step_badge = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 13)
        font_step_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 13)
        font_step_code = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 11)
        font_step_desc = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 11)
    except:
        font_title = font_subtitle = font_lane_header = font_lane_sub = font_step_badge = font_step_title = font_step_code = font_step_desc = ImageFont.load_default()

    # Header Bar
    draw.rectangle([(0, 0), (width, 85)], fill=(15, 23, 42, 255))
    draw.text((40, 14), "SWAT TOURISM PLATFORM — ROOM BOOKING CALL FLOW SEQUENCE", fill=(255, 255, 255, 255), font=font_title)
    draw.text((40, 50), "Chronological Execution Trace: Search → Room Selection → Instant Reservation → Hotel Acceptance → Clear Balance → Check-In/Out", fill=(148, 163, 184, 255), font=font_subtitle)

    # Define 5 Swimlane Columns
    lanes = [
        ("1. Tourist UI", "TouristHome / HotelModal", 50, 240, (14, 116, 144, 255), (240, 249, 255, 255)),
        ("2. API Client", "api/bookings & rooms.ts", 330, 240, (3, 105, 161, 255), (240, 249, 255, 255)),
        ("3. FastAPI Gateway", "bookings & listings router", 610, 240, (15, 118, 110, 255), (240, 253, 250, 255)),
        ("4. Domain Service", "BookingService / Payment", 890, 240, (67, 56, 202, 255), (245, 243, 255, 255)),
        ("5. Database / PMS", "PostgreSQL / HotelToday", 1170, 340, (180, 83, 9, 255), (255, 251, 235, 255))
    ]

    # Draw Swimlane Headers and Vertical Guideline Lines
    for title, subtitle, x, w, color, bg in lanes:
        draw.rounded_rectangle([(x, 105), (x + w, 155)], radius=8, fill=color)
        draw.text((x + 12, 112), title, fill=(255, 255, 255, 255), font=font_lane_header)
        draw.text((x + 12, 134), subtitle, fill=(224, 242, 254, 255), font=font_lane_sub)
        # Vertical dotted/dashed guide
        center_x = x + w // 2
        for ly in range(165, height - 30, 18):
            draw.line([(center_x, ly), (center_x, ly + 9)], fill=(203, 213, 225, 255), width=2)

    # Sequence Step Blocks
    # Format: (Step_Num, Title, Code_Call, Description, Box_Left_X, Box_Width, Y_Pos, Flow_From_X, Flow_To_X, Arrow_Color)
    steps = [
        (1, "Search Hotels", "GET /api/v1/listings/explore?type=hotel", "User filters hotels by region & dates in TouristHomeModern.tsx", 50, 800, 180, 170, 1010, (14, 116, 144, 255)),
        (2, "Select Hotel & Check Availability", "GET /api/v1/listings/{id}/availability", "HotelDetailsModal.tsx fetches room pricing, capacity & inventory", 50, 800, 280, 170, 1010, (14, 116, 144, 255)),
        (3, "Select Room Category & Nights", "Nights = diff(out, in) | Total = price * nights * rooms", "Client-side date calculation & live total estimation in Modal", 50, 360, 380, 170, 170, (14, 116, 144, 255)),
        (4, "Submit Booking Request", "POST /api/v1/bookings/request", "BookingService.create_booking(): locks availability, inserts bookings & items", 50, 1260, 470, 170, 1340, (15, 118, 110, 255)),
        (5, "Hotel Receives Request", "GET /api/v1/bookings/business-bookings?status=all", "HotelTodayScreen.tsx polls/loads pending requests for receptionist", 890, 620, 570, 1340, 1010, (180, 83, 9, 255)),
        (6, "Hotel Accepts Request", "POST /api/v1/bookings/{id}/accept", "BookingService.accept_booking(): status='accepted', alerts guest via SMS/Email", 610, 900, 670, 1340, 730, (67, 56, 202, 255)),
        (7, "Guarantee / Online Deposit", "POST /api/v1/bookings/{id}/pay/unified (20% or Full)", "UnifiedCheckoutModal.tsx: Easypaisa/Card deposit, status='confirmed', QR pass", 50, 1260, 770, 170, 1340, (3, 105, 161, 255)),
        (8, "Assign Physical Room", "POST /api/v1/listings/{id}/assign-rooms", "AssignRoomModal.tsx allocates clean Room 101: hotel_rooms.status='reserved'", 890, 620, 870, 1340, 1010, (180, 83, 9, 255)),
        (9, "Clear Balance at Front Desk", "POST /api/v1/bookings/{id}/collect-balance", "Guest arrives: staff collects cash/POS balance, payment_status='paid'", 610, 900, 970, 1340, 730, (180, 83, 9, 255)),
        (10, "Check-In Guest at Counter", "POST /api/v1/bookings/{id}/check-in", "Marks stay_status='checked_in', room='occupied', prints arrival folio pass", 610, 900, 1070, 1340, 730, (15, 118, 110, 255)),
        (11, "Check-Out & Turnover Cleaning", "POST /api/v1/bookings/{id}/check-out", "Marks status='completed', stay_status='checked_out', room='cleaning' turnover", 610, 900, 1170, 1340, 730, (67, 56, 202, 255))
    ]

    for num, title, code, desc, bx, bw, by, fx, tx, col in steps:
        # Step Action Card
        draw.rounded_rectangle([(bx, by), (bx + bw, by + 68)], radius=8, fill=(255, 255, 255, 255), outline=col, width=2)
        # Badge
        draw.rounded_rectangle([(bx + 8, by + 8), (bx + 34, by + 32)], radius=4, fill=col)
        draw.text((bx + 14, by + 10), str(num), fill=(255, 255, 255, 255), font=font_step_badge)
        # Title
        draw.text((bx + 42, by + 10), title, fill=(15, 23, 42, 255), font=font_step_title)
        # Code Endpoint / Method
        draw.text((bx + 42, by + 28), code, fill=col, font=font_step_code)
        # Description
        draw.text((bx + 42, by + 46), desc, fill=(71, 85, 105, 255), font=font_step_desc)

        # Arrow
        if fx != tx:
            arrow_y = by + 34
            draw.line([(fx, arrow_y), (tx, arrow_y)], fill=col, width=3)
            # Arrowhead
            if tx > fx:
                draw.polygon([(tx, arrow_y), (tx - 12, arrow_y - 6), (tx - 12, arrow_y + 6)], fill=col)
            else:
                draw.polygon([(tx, arrow_y), (tx + 12, arrow_y - 6), (tx + 12, arrow_y + 6)], fill=col)

    img.save(DIAGRAM_PATH, "PNG")
    print(f"[Diagram] Generated call flow diagram: {DIAGRAM_PATH}")

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
            run.font.size = Pt(8.5)
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
    run_sub = p_sub.add_run("Room Booking Call Flow Architecture & Technical Execution Trace")
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
        ["Document Classification", "Full Chronological Call Flow & Technical Execution Specification (Frontend to Database)"],
        ["Target Audience", "Software Engineers, System Architects, Quality Assurance Engineers, & Operations Staff"]
    ]
    meta_tbl = doc.add_table(rows=1 + len(meta_rows), cols=2)
    meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    format_table(meta_tbl, [Inches(2.2), Inches(4.6)], meta_headers, meta_rows, header_bg="0F172A")

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Callout: Executive Summary
    add_callout(
        doc,
        "Executive Call Flow Summary",
        "This specification traces the chronological end-to-end call flow of a hotel room booking across the Swat Tourism Platform. "
        "It documents the exact user actions: searching for a hotel, selecting a property, choosing room category and dates, clicking instant reservation, "
        "submitting the booking request, receiving and accepting the request at hotel reception, clearing remaining balance, assigning physical rooms, "
        "and executing check-in/out. Every step identifies the exact participating file path, method, HTTP endpoint, service logic, and database mutations.",
        bg_color="F0FDF4",
        border_color="16A34A"
    )

    # Section 1: Call Flow Sequence Diagram
    h1 = doc.add_heading("1. Visual Call Flow Sequence Diagram", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)
    for r in h1.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    p_desc = doc.add_paragraph(
        "Figure 1.1 illustrates the chronological sequence of calls traversing the five architectural swimlanes: "
        "Tourist Client UI, Frontend API Client, FastAPI Gateway, Domain Services, and Database Persistence / Front Desk PMS:"
    )
    p_desc.paragraph_format.space_after = Pt(10)

    if os.path.exists(DIAGRAM_PATH):
        doc.add_picture(DIAGRAM_PATH, width=Inches(6.8))
        p_cap = doc.add_paragraph("Figure 1.1: Chronological Call Flow Architecture from Frontend to Database")
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(4)
        p_cap.paragraph_format.space_after = Pt(14)
        run_cap = p_cap.runs[0]
        run_cap.font.name = "Arial"
        run_cap.font.size = Pt(8.5)
        run_cap.font.italic = True
        run_cap.font.color.rgb = RGBColor(100, 116, 139)

    # Section 2: Complete Step-by-Step Call Trace Matrix
    h2 = doc.add_heading("2. Comprehensive Call Trace Matrix (Frontend to Database)", level=1)
    h2.paragraph_format.space_before = Pt(16)
    h2.paragraph_format.space_after = Pt(6)
    for r in h2.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    p2 = doc.add_paragraph(
        "The following matrix outlines every step in the room booking lifecycle, detailing the frontend component, "
        "API client call, HTTP endpoint, backend router, service class, and database query:"
    )
    p2.paragraph_format.space_after = Pt(8)

    matrix_headers = ["#", "User / Staff Action", "Frontend File & Function", "HTTP Request & Endpoint", "Backend Router & Service", "Database Query & Table Updates"]
    matrix_rows = [
        [
            "1",
            "User searches hotels",
            "frontend/src/modules/tourist/\nTouristHomeModern.tsx\nfetchExploreListings()",
            "GET /api/v1/listings/explore\n?type=hotel",
            "listings/router.py::explore_listings()\nListingsService.get_explore_listings()",
            "SELECT * FROM listings WHERE type_id = (SELECT id FROM listing_types WHERE code='hotel') AND status='published'"
        ],
        [
            "2",
            "User selects hotel",
            "frontend/src/modules/tourist/\nHotelDetailsModal.tsx\nfetchAvailability()",
            "GET /api/v1/listings/{id}/availability\n?start_date=...&end_date=...",
            "listings/router.py::get_listing_availability()\nListingsService.get_availability()",
            "SELECT * FROM availability WHERE price_item_id IN (SELECT id FROM price_items WHERE listing_id = :id)"
        ],
        [
            "3",
            "User selects room & dates",
            "frontend/src/modules/tourist/\nHotelDetailsModal.tsx\ncurrentSelectedRoom state",
            "Client-Side Calculation\n(No HTTP Request)",
            "Client State Engine\n(React Hooks)",
            "Calculates nights: diff(checkOut, checkIn)\nCalculates totalAmount: price * nights * roomsCount"
        ],
        [
            "4",
            "Clicks Instant Reservation\n& submits booking",
            "frontend/src/modules/tourist/\nHotelDetailsModal.tsx\nhandleInstantBook()",
            "POST /api/v1/bookings/request\nBody: { listing_id, start_date,\nend_date, travellers, items }",
            "bookings/router.py::create_booking_request_endpoint()\nBookingService.create_booking()",
            "1. UPDATE availability SET units_booked = units_booked + 1\n2. INSERT INTO bookings (status='requested', payment_status='unpaid', ref='SWT-HTL-...')\n3. INSERT INTO booking_items & booking_status_history"
        ],
        [
            "5",
            "Hotel receives request",
            "frontend/src/modules/business/\nHotelTodayScreen.tsx\nfetchBusinessBookings('all')",
            "GET /api/v1/bookings/business-bookings\n?status=all",
            "bookings/router.py::get_business_bookings_endpoint()\nBookingService.get_business_bookings()",
            "SELECT * FROM bookings WHERE business_id = :biz_id ORDER BY created_at DESC\nPopulates Pending Requests list on front-desk screen"
        ],
        [
            "6",
            "Hotel accepts request",
            "frontend/src/modules/business/\nHotelTodayScreen.tsx\nonAcceptBooking()",
            "POST /api/v1/bookings/{id}/accept\nBody: { note: 'Accepted' }",
            "bookings/router.py::accept_booking_endpoint()\nBookingService.accept_booking()",
            "1. UPDATE bookings SET status = 'accepted', responded_at = NOW()\n2. INSERT INTO booking_status_history (to_status='accepted')\n3. NotificationService dispatches SMS/Email to guest"
        ],
        [
            "7",
            "Guarantee / Online Deposit",
            "frontend/src/components/\nUnifiedCheckoutModal.tsx\nhandleProcessPayment()",
            "POST /api/v1/bookings/{id}/pay/unified\nBody: { payment_mode: 'DEPOSIT_20',\ngateway: 'EASYPAISA' }",
            "bookings/router.py::pay_unified_booking_endpoint()\nBookingService & PaymentGatewayManager",
            "1. UPDATE bookings SET status = 'confirmed', deposit_amount = 0.20 * total, payment_status = 'deposit_paid'\n2. INSERT INTO booking_payments (role='advance_deposit', amount=...)\n3. Generates QR voucher pass"
        ],
        [
            "8",
            "Front desk assigns room",
            "frontend/src/modules/business/\nAssignRoomModal.tsx\nhandleSaveAssignment()",
            "POST /api/v1/listings/{id}/assign-rooms\nBody: { room_ids: ['room-101'],\nbooking_id: '...' }",
            "listings/router.py::assign_rooms_endpoint()\nListingsService.assign_rooms_to_booking()",
            "1. UPDATE hotel_rooms SET status = 'reserved', current_booking_id = :booking_id WHERE id = 'room-101'\n2. UPDATE bookings SET assigned_room_number = '101'"
        ],
        [
            "9",
            "Clear balance at front desk",
            "frontend/src/modules/business/\nHotelTodayScreen.tsx\nhandleCollectBalance()",
            "POST /api/v1/bookings/{id}/collect-balance\nBody: { payment_method: 'cash',\namount: 16000 }",
            "bookings/router.py::collect_balance_endpoint()\nBookingService.collect_balance()",
            "1. UPDATE bookings SET property_collected_amount = property_collected_amount + 16000, payment_status = 'paid'\n2. INSERT INTO booking_payments (role='property_balance', method='cash')\n3. INSERT INTO booking_status_history (to_status='paid')"
        ],
        [
            "10",
            "Check-in guest at counter",
            "frontend/src/modules/business/\nHotelTodayScreen.tsx\nhandleCheckIn()",
            "POST /api/v1/bookings/{id}/check-in\nBody: { note: 'Keys issued' }",
            "bookings/router.py::check_in_endpoint()\nBookingService.check_in_booking()",
            "1. UPDATE bookings SET stay_status = 'checked_in', checked_in_at = NOW()\n2. UPDATE hotel_rooms SET status = 'occupied', stay_state = 'occupied'\n3. Renders arrival pass folio via HotelFolioReceiptModal.tsx"
        ],
        [
            "11",
            "Check-out & turnover",
            "frontend/src/modules/business/\nHotelTodayScreen.tsx\nhandleCheckOut()",
            "POST /api/v1/bookings/{id}/check-out\nBody: { note: 'Departure' }",
            "bookings/router.py::check_out_endpoint()\nBookingService.check_out_booking()",
            "1. UPDATE bookings SET status = 'completed', stay_status = 'checked_out', checked_out_at = NOW()\n2. UPDATE hotel_rooms SET status = 'cleaning', stay_state = 'turnover'\n3. When clean: PATCH /listings/rooms/{id}/status sets room to 'available'"
        ]
    ]
    col_w = [Inches(0.4), Inches(1.3), Inches(1.4), Inches(1.3), Inches(1.2), Inches(1.2)]
    matrix_tbl = doc.add_table(rows=1 + len(matrix_rows), cols=6)
    format_table(matrix_tbl, col_w, matrix_headers, matrix_rows, header_bg="0E7490")

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # Section 3: Deep Operational Narrative by Phase
    h3 = doc.add_heading("3. Detailed Operational Walkthrough by Phase", level=1)
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(6)
    for r in h3.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    narratives = [
        ("Phase 1: Hotel Search & Inventory Discovery",
         "1. Discovery Trigger: The tourist enters destination and dates in TouristHomeModern.tsx. The component triggers fetchExploreListings({ type: 'hotel' }) via frontend/src/api/listings.ts.\n"
         "2. Network Request: apiRequest() issues GET /api/v1/listings/explore?type=hotel with Bearer token authentication.\n"
         "3. Database Filtering: In backend/app/modules/listings/service.py, ListingsService executes a SELECT query filtering listings by status='published' and type_id matching the hotel listing type. It eager-loads images, address, amenities, and price tier summaries.\n"
         "4. Property Selection: Tourist selects a hotel (e.g. Serena Swat), opening HotelDetailsModal.tsx, which immediately queries GET /api/v1/listings/{id}/availability to verify daily unit capacity."),

        ("Phase 2: Room Selection & Instant Reservation Submission",
         "1. Selection & Client Calculation: The tourist chooses a room tier (e.g. Deluxe Room, PKR 10,000/night), selects check-in/out dates, and adjusts guest count. HotelDetailsModal.tsx computes the stay duration in nights and multiplies by unit rate to calculate totalAmount.\n"
         "2. Reservation Submission: Clicking 'Instant Book' triggers handleInstantBook(), calling createBookingRequest() in frontend/src/api/bookings.ts.\n"
         "3. Gateway & Auth: Request reaches POST /api/v1/bookings/request in backend/app/modules/bookings/router.py. get_current_token_payload() validates the JWT token and resolves user identity.\n"
         "4. Database Mutation: BookingService.create_booking() in backend/app/modules/bookings/service.py initiates an async database transaction:\n"
         "   • Verifies room capacity and increments availability.units_booked for each date in the reservation range.\n"
         "   • Generates a human-readable booking reference: SWT-HTL-XXXXX.\n"
         "   • Inserts master row into bookings with status='requested' and payment_status='unpaid'.\n"
         "   • Inserts line items into booking_items (price_item_id, unit_price, quantity, line_total).\n"
         "   • Inserts status history record into booking_status_history.\n"
         "   • Dispatches asynchronous booking alerts via NotificationService (SMS, Email, WhatsApp)."),

        ("Phase 3: Hotel Reception Receipt & Acceptance",
         "1. Front Desk Dashboard: Staff opens HotelTodayScreen.tsx (frontend/src/modules/business/HotelTodayScreen.tsx). The screen calls fetchBusinessBookings('all') reaching GET /api/v1/bookings/business-bookings.\n"
         "2. Business Query: BookingService.get_business_bookings() queries bookings table matching the business_id, returning all active and pending reservations.\n"
         "3. Staff Acceptance: Staff reviews the new reservation and clicks 'Accept Request', triggering acceptBooking() in frontend/src/api/bookings.ts.\n"
         "4. Backend Mutation: POST /api/v1/bookings/{booking_id}/accept is handled by BookingService.accept_booking():\n"
         "   • Verifies business ownership or administrative authorization.\n"
         "   • Updates bookings.status to 'accepted' and records responded_at timestamp.\n"
         "   • Appends status history row with note 'Accepted by Front Desk'.\n"
         "   • Dispatches acceptance notification to the tourist with confirmation instructions."),

        ("Phase 4: Guarantee / Advance Online Payment",
         "1. Payment Drawer: Tourist opens UnifiedCheckoutModal.tsx and selects guarantee mode: Full Online (100%), Confirmation Deposit (20%), or Pay at Hotel (0% online).\n"
         "2. Payment Gateway: Tourist enters Easypaisa Mobile Account number or Card details. UnifiedCheckoutModal calls payUnifiedBooking().\n"
         "3. Backend Settlement: POST /api/v1/bookings/{booking_id}/pay/unified routes to PaymentGatewayManager in payment_adapter.py.\n"
         "4. Ledger Update: Upon success, bookings.status transitions to 'confirmed', deposit_amount is recorded, and payment_status becomes 'deposit_paid'. An entry is inserted into booking_payments with gateway transaction reference.\n"
         "5. Dynamic QR Voucher: ReceiptService compiles the official HTML boarding pass encoding verification QR URL (/api/v1/bookings/{id}/voucher), displayed in BookingVoucherModal.tsx."),

        ("Phase 5: Clear Balance & Front Desk Check-In",
         "1. Physical Room Allocation: Reception allocates a clean room (e.g. Room 101) via AssignRoomModal.tsx calling POST /api/v1/listings/{id}/assign-rooms, updating hotel_rooms.status='reserved'.\n"
         "2. Balance Collection: Upon guest arrival, reception clicks 'Clear / Collect Balance' on HotelTodayScreen.tsx.\n"
         "3. Counter Settlement: Staff enters collected cash/POS amount. System executes POST /api/v1/bookings/{id}/collect-balance. BookingService.collect_balance() updates property_collected_amount, sets payment_status='paid', and inserts a counter collection entry into booking_payments.\n"
         "4. Guest Check-In: Staff clicks 'Check In' (POST /api/v1/bookings/{id}/check-in). Stay status transitions to 'checked_in', hotel_rooms.status becomes 'occupied', and HotelFolioReceiptModal.tsx prints the arrival folio bill."),

        ("Phase 6: Check-Out & Housekeeping Turnover",
         "1. Guest Departure: Reception clicks 'Check Out' on HotelTodayScreen.tsx calling POST /api/v1/bookings/{id}/check-out.\n"
         "2. Final State Mutation: BookingService.check_out_booking() marks bookings.status='completed' and stay_status='checked_out'.\n"
         "3. Turnover State: The assigned physical room is transitioned to status='cleaning' and stay_state='turnover'.\n"
         "4. Housekeeping Reset: Once sanitized, housekeepers update the room via PATCH /api/v1/listings/rooms/{id}/status to cleaning_status='ready', returning the room status to 'available'.")
    ]

    for title, desc in narratives:
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

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Section 4: Source File & Method Reference Index
    h4 = doc.add_heading("4. Key Participating Files & Method Reference", level=1)
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(6)
    for r in h4.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    ref_headers = ["Subsystem", "Exact Relative File Path", "Primary Methods & Functions"]
    ref_rows = [
        ["Frontend UI", "frontend/src/modules/tourist/TouristHomeModern.tsx", "fetchExploreListings(), handleHotelClick()"],
        ["Frontend UI", "frontend/src/modules/tourist/HotelDetailsModal.tsx", "handleInstantBook(), handleGuestSubmit(), calculateTotal()"],
        ["Frontend UI", "frontend/src/components/UnifiedCheckoutModal.tsx", "handleProcessPayment(), handleDirectTransferSubmit()"],
        ["Frontend UI", "frontend/src/components/BookingVoucherModal.tsx", "BookingVoucherModal, getBookingVoucherUrl()"],
        ["Frontend UI", "frontend/src/modules/business/HotelTodayScreen.tsx", "handleCheckIn(), handleCheckOut(), handleCollectBalance()"],
        ["Frontend UI", "frontend/src/modules/business/AssignRoomModal.tsx", "AssignRoomModal, handleSaveAssignment()"],
        ["Frontend UI", "frontend/src/modules/business/HotelFolioReceiptModal.tsx", "HotelFolioReceiptModal, renderFolioReceipt()"],
        ["Frontend API", "frontend/src/api/bookings.ts", "createBookingRequest(), acceptBooking(), collectBookingBalance(), checkInBookingApi(), checkOutBookingApi()"],
        ["Frontend API", "frontend/src/api/rooms.ts", "fetchHotelRooms(), assignRoomsToBookingApi(), updateHotelRoomStatus()"],
        ["Backend Gateway", "backend/app/modules/bookings/router.py", "create_booking_request_endpoint, accept_booking_endpoint, collect_balance_endpoint, check_in_endpoint"],
        ["Backend Service", "backend/app/modules/bookings/service.py", "BookingService.create_booking, accept_booking, collect_balance, check_in_booking, check_out_booking"],
        ["Backend Adapter", "backend/app/modules/bookings/payment_adapter.py", "PaymentGatewayManager.process_payment, EasypaisaPaymentAdapter, JazzCashPaymentAdapter"],
        ["Backend Voucher", "backend/app/modules/bookings/receipt_service.py", "ReceiptService.generate_voucher_html, generate_receipt_html"],
        ["Backend DB Models", "backend/app/modules/bookings/models.py", "Booking, BookingItem, BookingStatusHistory, BookingPayment"],
        ["Backend DB Models", "backend/app/modules/listings/models.py", "Listing, PriceItem, Availability, HotelRoom"]
    ]
    ref_col_w = [Inches(1.5), Inches(2.7), Inches(2.6)]
    ref_tbl = doc.add_table(rows=1 + len(ref_rows), cols=3)
    format_table(ref_tbl, ref_col_w, ref_headers, ref_rows, header_bg="1E293B")

    doc.save(OUTPUT_DOCX)
    print(f"[Document] Generated successfully: {OUTPUT_DOCX}")

if __name__ == "__main__":
    generate_call_flow_image()
    generate_docx()

