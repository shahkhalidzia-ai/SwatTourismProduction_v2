import os
from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOC_DIR = os.path.dirname(os.path.abspath(__file__))
DIAGRAM_PATH = os.path.join(DOC_DIR, "swat_platform_status_and_booking_gap.png")
OUTPUT_DOCX = os.path.join(DOC_DIR, "Swat_Tourism_Modules_and_Booking_Gap_Analysis.docx")

# ---------------------------------------------------------
# 1. GENERATE STATUS & BOOKING GAP DIAGRAM (PNG)
# ---------------------------------------------------------
def generate_status_diagram():
    width, height = 1560, 1060
    img = Image.new("RGBA", (width, height), (248, 250, 252, 255))
    draw = ImageDraw.Draw(img)

    try:
        font_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 24)
        font_sub = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 14)
        font_hdr = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 16)
        font_item = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 13)
        font_body = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 11)
        font_badge = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 11)
    except:
        font_title = font_sub = font_hdr = font_item = font_body = font_badge = ImageFont.load_default()

    # Header
    draw.rectangle([(0, 0), (width, 82)], fill=(15, 23, 42, 255))
    draw.text((36, 14), "SWAT TOURISM PLATFORM — MODULES & BOOKING FLOW GAP MATRIX", fill=(255, 255, 255, 255), font=font_title)
    draw.text((36, 48), "Completed vs. Pending Capabilities Across Stakeholder Modules & Search-to-Checkout Booking Pipeline", fill=(148, 163, 184, 255), font=font_sub)

    # Top Section: 7-Stage Booking Flow (Search -> Book -> Checkout -> Check-out)
    draw.rounded_rectangle([(36, 105), (1524, 345)], radius=12, fill=(255, 255, 255, 255), outline=(14, 116, 144, 255), width=2)
    draw.rounded_rectangle([(36, 105), (1524, 145)], radius=12, fill=(14, 116, 144, 255))
    draw.rectangle([(36, 128), (1524, 145)], fill=(14, 116, 144, 255))
    draw.text((52, 115), "PART A: END-TO-END BOOKING FLOW STATUS (SEARCH → SELECT → RESERVE → ACCEPT → PAY/CHECKOUT → CHECK-OUT)", fill=(255, 255, 255, 255), font=font_hdr)

    stages = [
        ("1. Search", "Listings & Map", "95% DONE", (22, 163, 74, 255), "No Deals filter;\nMock Weather"),
        ("2. Room Select", "Rates & Dates", "95% DONE", (22, 163, 74, 255), "No Promo code;\nNo Seasonal rules"),
        ("3. Reserve", "POST /request", "85% DONE", (234, 88, 12, 255), "Guest localStorage;\nAuto-claim polish"),
        ("4. Accept", "HotelTodayScreen", "85% DONE", (234, 88, 12, 255), "Comms in 'mock'\n(Email/WA/SMS)"),
        ("5. Checkout", "Unified Pay/Proof", "85% DONE", (234, 88, 12, 255), "Easypaisa/JazzCash\nin 'sandbox'; local disk"),
        ("6. Room Assign", "Room Rack DB", "95% DONE", (22, 163, 74, 255), "No staff sub-roles;\nCleanup local cache"),
        ("7. Balance/Out", "Folio & Review", "90% DONE", (22, 163, 74, 255), "No 2hr review cron;\nManual bank payout")
    ]

    sx = 52
    sw = 198
    for idx, (st_title, st_sub, badge, b_col, gap_txt) in enumerate(stages):
        draw.rounded_rectangle([(sx, 162), (sx + sw, 326)], radius=8, fill=(248, 250, 252, 255), outline=(203, 213, 225, 255), width=1)
        draw.text((sx + 10, 170), st_title, fill=(15, 23, 42, 255), font=font_item)
        draw.text((sx + 10, 188), st_sub, fill=(71, 85, 105, 255), font=font_body)
        # Badge
        draw.rounded_rectangle([(sx + 10, 210), (sx + 92, 232)], radius=4, fill=b_col)
        draw.text((sx + 18, 214), badge, fill=(255, 255, 255, 255), font=font_badge)
        # Gap note
        draw.text((sx + 10, 244), "Pending:", fill=(180, 83, 9, 255), font=font_badge)
        draw.text((sx + 10, 260), gap_txt, fill=(51, 65, 85, 255), font=font_body)
        if idx < len(stages) - 1:
            ax1 = sx + sw
            ax2 = sx + sw + 14
            draw.line([(ax1, 240), (ax2, 240)], fill=(14, 116, 144, 255), width=3)
            draw.polygon([(ax2, 240), (ax2 - 6, 235), (ax2 - 6, 245)], fill=(14, 116, 144, 255))
        sx += sw + 14

    # Bottom Section: 11 Platform Stakeholder & Functional Modules Grid
    draw.rounded_rectangle([(36, 370), (1524, 1025)], radius=12, fill=(255, 255, 255, 255), outline=(30, 41, 59, 255), width=2)
    draw.rounded_rectangle([(36, 370), (1524, 410)], radius=12, fill=(30, 41, 59, 255))
    draw.rectangle([(36, 392), (1524, 410)], fill=(30, 41, 59, 255))
    draw.text((52, 380), "PART B: PLATFORM MODULES STATUS (STAKEHOLDERS, SERVICES & GOVERNANCE)", fill=(255, 255, 255, 255), font=font_hdr)

    modules = [
        ("1. Role-Based (RBAC)", "90% DONE", (22, 163, 74, 255), "Done: 5 roles + 6 biz types + JWT guards\nPend: Hotel/staff sub-role permissions"),
        ("2. User Management", "75% DONE", (234, 88, 12, 255), "Done: DB endpoints + directory UI\nPend: Wire toggle/create UI to DB API"),
        ("3. Tourist Portal", "90% DONE", (22, 163, 74, 255), "Done: Search, Trips, Book, Pay, SOS, Reviews\nPend: Guest auto-claim & live AI LLM"),
        ("4. Business / Hotel", "92% DONE", (22, 163, 74, 255), "Done: PMS, Room Rack DB, Folio, Proofs\nPend: Staff sub-logins & live WA alerts"),
        ("5. Guide (Tour Guides)", "65% DONE", (234, 88, 12, 255), "Done: Listings, Tags, Daily rates, Booking\nPend: Dedicated Guide Schedule Console"),
        ("6. Community", "80% DONE", (234, 88, 12, 255), "Done: Stories, Issues, Host applications\nPend: Retire local app cache; Craft shipping"),
        ("7. Transport", "88% DONE", (22, 163, 74, 255), "Done: Fleet DB, Intercity & 4x4 bookings\nPend: Retire local ride cache; Live GPS"),
        ("8. Restaurant", "75% DONE", (234, 88, 12, 255), "Done: Menu CRUD, Dish pics, Table reqs\nPend: Live Table Floorplan & KOT Queue"),
        ("9. Adventures/Activities", "65% DONE", (234, 88, 12, 255), "Done: Listings, Safety tags, Slot booking\nPend: Digital waivers & Gear checklists"),
        ("10. Admin & Stakeholders", "85% DONE", (234, 88, 12, 255), "Done: KYC, Finance, SOS, Rescue bridge\nPend: Dedicated Police/1122 live webhooks"),
        ("11. Deals & Offers", "10% DONE", (220, 38, 38, 255), "Done: Manual Availability price_override\nPend: Full Deals/Coupons/Promo engine"),
        ("12. Prod Infra & Comms", "80% DONE", (234, 88, 12, 255), "Done: Comms/Pay adapters, SQLite WAL\nPend: Live keys, PostgreSQL, S3 storage")
    ]

    cols = 3
    mw = 472
    mh = 138
    gap_x = 18
    gap_y = 14
    start_x = 52
    start_y = 428

    for idx, (m_title, m_badge, m_col, m_desc) in enumerate(modules):
        r = idx // cols
        c = idx % cols
        mx = start_x + c * (mw + gap_x)
        my = start_y + r * (mh + gap_y)
        draw.rounded_rectangle([(mx, my), (mx + mw, my + mh)], radius=8, fill=(248, 250, 252, 255), outline=(203, 213, 225, 255), width=1)
        draw.text((mx + 14, my + 12), m_title, fill=(15, 23, 42, 255), font=font_item)
        # Badge on right
        draw.rounded_rectangle([(mx + mw - 102, my + 10), (mx + mw - 14, my + 34)], radius=4, fill=m_col)
        draw.text((mx + mw - 94, my + 15), m_badge, fill=(255, 255, 255, 255), font=font_badge)
        # Line divider
        draw.line([(mx + 14, my + 42), (mx + mw - 14, my + 42)], fill=(226, 232, 240, 255), width=1)
        draw.text((mx + 14, my + 52), m_desc, fill=(51, 65, 85, 255), font=font_body)

    img.save(DIAGRAM_PATH, "PNG")
    print(f"[Diagram] Generated: {DIAGRAM_PATH}")

# ---------------------------------------------------------
# 2. DOCX HELPER FUNCTIONS
# ---------------------------------------------------------
def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=110, bottom=110, left=140, right=140):
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
    set_cell_margins(cell, top=120, bottom=120, left=160, right=160)
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
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    run_t = p.add_run(f"📌 {title}\n")
    run_t.bold = True
    run_t.font.name = "Arial"
    run_t.font.size = Pt(10.5)
    run_t.font.color.rgb = RGBColor(15, 23, 42)
    run_b = p.add_run(text)
    run_b.font.name = "Arial"
    run_b.font.size = Pt(9.2)
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
        set_cell_margins(hdr_cells[i], top=100, bottom=100, left=120, right=120)
        p = hdr_cells[i].paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(title)
        run.bold = True
        run.font.name = "Arial"
        run.font.size = Pt(9.2)
        run.font.color.rgb = RGBColor(255, 255, 255)
    for r_idx, row_data in enumerate(rows):
        row_cells = table.rows[r_idx + 1].cells
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            row_cells[c_idx].width = col_widths[c_idx]
            set_cell_background(row_cells[c_idx], bg)
            set_cell_margins(row_cells[c_idx], top=85, bottom=85, left=120, right=120)
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
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Header Title
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(4)
    r_m = p_title.add_run("Swat Tourism Platform (STP)")
    r_m.bold = True
    r_m.font.name = "Arial"
    r_m.font.size = Pt(22)
    r_m.font.color.rgb = RGBColor(15, 23, 42)

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(12)
    r_s = p_sub.add_run("Complete Module Inventory, Stakeholder Capability Audit & Booking Flow Gap Analysis (Search to Checkout)")
    r_s.bold = True
    r_s.font.name = "Arial"
    r_s.font.size = Pt(12.5)
    r_s.font.color.rgb = RGBColor(14, 116, 144)

    # Metadata Table
    meta_headers = ["Audit Dimension", "Platform Details"]
    meta_rows = [
        ["Workspace Audited", "f:\\Antigravity\\SwatTourismProduction_v2"],
        ["Backend Architecture", "13 Domain Modules (FastAPI + SQLAlchemy 2.0 Async + SQLite WAL / PostgreSQL ready)"],
        ["Frontend Architecture", "4 Role Portals (Tourist, Business, Community, Authority) + Shared API Client"],
        ["Modules Covered", "RBAC, User Mgmt, Tourist, Business/Hotel, Guide, Community, Transport, Restaurant, Adventures/Activities, Admin/Stakeholders, Deals & Offers + Comms/Finance/Safety/Reviews"],
        ["Booking Flow Audited", "End-to-End 7-Stage Pipeline: Search → Select Room → Reserve → Accept → Payment/Checkout → Room Assign → Balance/Check-Out/Review"]
    ]
    meta_tbl = doc.add_table(rows=1 + len(meta_rows), cols=2)
    format_table(meta_tbl, [Inches(2.0), Inches(4.9)], meta_headers, meta_rows, header_bg="0F172A")

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    add_callout(
        doc,
        "Executive Audit Summary",
        "All core transactional loops (Hotel Booking, Room Rack PMS, Dual-Track Payments, Payment Proof Verification, Transport Fleet, "
        "Finance & Commission Invoices, Verified Reviews, and Safety/SOS) are architecturally built and persisted in the database. "
        "Remaining gaps fall into three categories: (1) Switching sandbox/mock external providers (Easypaisa, JazzCash, SMTP, Meta WhatsApp, SMS, Weather) to live production credentials; "
        "(2) Removing remaining frontend localStorage fallbacks (UserManagementView toggle/create, guest bookings/trips, community host apps); and "
        "(3) Building net-new dedicated operational consoles for Guides, Adventures, Restaurant Tables, and the Deals & Offers engine.",
        bg_color="F0FDF4",
        border_color="16A34A"
    )

    # Visual Diagram
    h_diag = doc.add_heading("1. Visual Platform Modules & Booking Flow Gap Map", level=1)
    h_diag.paragraph_format.space_before = Pt(10)
    h_diag.paragraph_format.space_after = Pt(6)
    for r in h_diag.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    if os.path.exists(DIAGRAM_PATH):
        doc.add_picture(DIAGRAM_PATH, width=Inches(6.9))
        p_cap = doc.add_paragraph("Figure 1: Platform Completion Matrix — Booking Flow (Top) and All Stakeholder Modules (Bottom)")
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(4)
        p_cap.paragraph_format.space_after = Pt(10)
        rc = p_cap.runs[0]
        rc.font.name = "Arial"
        rc.font.size = Pt(8.5)
        rc.font.italic = True
        rc.font.color.rgb = RGBColor(100, 116, 139)

    # PART A: BOOKING FLOW GAP ANALYSIS (SEARCH TO BOOK & CHECKOUT)
    h_bk = doc.add_heading("2. End-to-End Booking Flow Gap Analysis (From Search to Book & Checkout)", level=1)
    h_bk.paragraph_format.space_before = Pt(12)
    h_bk.paragraph_format.space_after = Pt(6)
    for r in h_bk.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    p_bk = doc.add_paragraph(
        "The table below audits every stage of the booking pipeline from initial tourist search to final checkout, balance settlement, and review:"
    )
    p_bk.paragraph_format.space_after = Pt(6)

    bk_headers = ["Stage & Files Involved", "Completed Functionality (Verified in Code)", "Pending To Do / Identified Gaps"]
    bk_rows = [
        [
            "Stage 1: Search & Discovery\n(TouristHomeModern.tsx,\nplaces/, listings/router.py)",
            "• Catalog search & category filters (hotel, transport, restaurant, guides, activity).\n• Interactive Leaflet MapModal & 5-day weather forecast modal.\n• Verified partner badges & rating averages.",
            "• No Deals/Promo filter tab (Deals & Offers module pending).\n• Weather runs on WEATHER_PROVIDER='mock' / Open-Meteo cache.\n• No live traffic ETA routing."
        ],
        [
            "Stage 2: Hotel/Service Selection & Availability\n(HotelDetailsModal.tsx,\nAvailabilityModal.tsx,\navailability table)",
            "• Room tier selection (Standard, Deluxe, Suite) via PriceItem.\n• Multi-night date picker & dynamic total calculation.\n• Real-time availability calendar check & manual price_override.",
            "• No automated seasonal/weekend dynamic pricing rules.\n• No promo code/coupon discount input during room selection."
        ],
        [
            "Stage 3: Instant Reservation & Request Submission\n(HotelDetailsModal.tsx,\nbookings/router.py,\nbookings/service.py)",
            "• Authenticated booking persists in bookings, booking_items, & booking_status_history.\n• Pessimistic inventory lock increments availability.units_booked.\n• Generates SWT-HTL-XXXXX ref & backend POST /bookings/claim exists.",
            "• Unauthenticated guest bookings still save to localStorage (swat_local_bookings) instead of persisting directly in DB.\n• Auto-claiming guest bookings immediately after login/signup needs full unification across all portals."
        ],
        [
            "Stage 4: Hotel Notification & Acceptance\n(HotelTodayScreen.tsx,\nbookings/service.py,\ncommunications/)",
            "• Front-desk receives requests via GET /bookings/business-bookings.\n• Accept/Decline actions update DB status & audit log.\n• Multi-channel dispatcher (Email, WhatsApp, SMS) hooked to milestones.",
            "• EMAIL_PROVIDER, WHATSAPP_PROVIDER, and SMS_PROVIDER default to 'mock' in core/config.py (console/audit log only).\n• Need live SMTP/SendGrid, Meta WhatsApp/Twilio, & Pakistani SMS keys."
        ],
        [
            "Stage 5: Unified Payment, Proof & Checkout\n(UnifiedCheckoutModal.tsx,\nPaymentProofUploadModal.tsx,\nBookingVoucherModal.tsx)",
            "• 3 Checkout modes: FULL_ONLINE, DEPOSIT_20, PAY_AT_HOTEL.\n• Direct bank/IBFT proof upload + hotel verification inspector modal.\n• Easypaisa & JazzCash HMAC-SHA256 adapters + booking_payments ledger.\n• Official HTML/PDF QR Voucher pass.",
            "• EASYPAISA_ENV and JAZZCASH_ENV are set to 'sandbox' — need live merchant keys & HTTPS IPN webhook URLs.\n• Payment proof slip images save to local disk (STORAGE_BACKEND='local') instead of cloud S3."
        ],
        [
            "Stage 6: Room Allocation & Check-In\n(AssignRoomModal.tsx,\nHotelTodayScreen.tsx,\nhotel_rooms table)",
            "• Physical room rack stored in DB (hotel_rooms): floor, wing, status.\n• Assign physical room numbers (e.g. 101, 204) to bookings.\n• Check-in transitions stay_status='checked_in' & room='occupied'.",
            "• No separate reception/housekeeping staff sub-logins (shares single business owner account).\n• Remove legacy localStorage sync helpers in physicalRooms.ts & HotelTodayScreen.tsx."
        ],
        [
            "Stage 7: Balance Clear, Check-Out & Review\n(HotelFolioReceiptModal.tsx,\ncollect_balance, reviews/)",
            "• Counter balance settlement (cash, POS, direct IBFT) updates property_collected_amount & payment_status='paid'.\n• Printable Folio Receipt & check-out marks room='cleaning' -> 'ready'.\n• Verified post-stay reviews & isolated partner commission invoices.",
            "• No background cron job (Celery/APScheduler) to auto-send WhatsApp/Email review prompts 2 hours post-checkout.\n• Operator payouts tracked in DB without automated bank IBFT disbursement APIs."
        ]
    ]
    bk_tbl = doc.add_table(rows=1 + len(bk_rows), cols=3)
    format_table(bk_tbl, [Inches(1.8), Inches(2.5), Inches(2.6)], bk_headers, bk_rows, header_bg="0E7490")

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # PART B: STAKEHOLDER & FUNCTIONAL MODULES SUMMARY & GAP ANALYSIS
    h_mod = doc.add_heading("3. All Stakeholder & Functional Modules: Completed vs. Pending", level=1)
    h_mod.paragraph_format.space_before = Pt(12)
    h_mod.paragraph_format.space_after = Pt(6)
    for r in h_mod.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    p_mod = doc.add_paragraph(
        "Detailed functional status across every stakeholder module, business category, administrative tool, and cross-cutting service:"
    )
    p_mod.paragraph_format.space_after = Pt(6)

    mod_headers = ["Module / Stakeholder & Files", "Completed Functionality", "Pending To Do / Gaps"]
    mod_rows = [
        [
            "1. Role-Based (RBAC)\n(core/deps.py, accounts/models.py,\nApp.tsx, RoleSwitcherBar.tsx)",
            "• 5 roles (tourist, business, community, authority, admin) & 6 business types.\n• JWT route guards (require_roles) & portal shell isolation.\n• Strict owner/tourist query isolation in bookings & finance.",
            "• No granular sub-roles inside a business (e.g. Receptionist vs Housekeeper vs Accountant).\n• Granular UI tab locking for AuthorityProfile permission flags."
        ],
        [
            "2. User Management\n(accounts/router.py, service.py,\nUserManagementView.tsx)",
            "• Registration, login, JWT refresh, profile update, & brute-force lockout.\n• Backend endpoints: GET /auth/admin/users & PATCH /admin/users/{id}/status.\n• Admin directory UI loads live DB users.",
            "• CRITICAL: handleToggleStatus() & handleCreateUser() in UserManagementView.tsx still update localStorage (swat_admin_users_list) instead of calling the backend PATCH/POST endpoints.\n• OTP/password reset emails/SMS run in mock mode."
        ],
        [
            "3. Tourist Module\n(TouristShell.tsx, TouristHomeModern.tsx,\nTripManagerView.tsx, MyBookingsView.tsx)",
            "• Destination search, maps, weather, AI Trip Generator & multi-day planner.\n• One-click bulk trip booking, room/service bookings, checkout & QR vouchers.\n• Cancellation previews, verified reviews, & SOS alerts.",
            "• Guest offline trips (swat_local_trips) & bookings (swat_local_bookings) still rely on localStorage fallbacks.\n• AI Trip Generator uses smart rule-based logic rather than live external LLM API."
        ],
        [
            "4. Business / Hotel\n(BusinessShell.tsx, HotelTodayScreen.tsx,\nLiveRoomRackBoard.tsx, AssignRoomModal.tsx)",
            "• Full Front-Desk PMS (arrivals, departures, accept/decline, check-in/out).\n• Physical Room Rack DB (hotel_rooms), housekeeping status sync.\n• Payment proof inspector, counter balance clear, folio receipts, & monthly commission invoices.",
            "• Multi-staff hotel sub-accounts.\n• Live WhatsApp/Email reception alerts (currently mock).\n• Dynamic seasonal pricing rules engine."
        ],
        [
            "5. Guide (Tour Guides)\n(listings/models.py type='guide',\nCommunityShell.tsx, TouristHomeModern.tsx)",
            "• Guide business type & listing category (per_day pricing).\n• Language tags, availability calendar, & instant reservation booking.\n• Community local guide host application form.",
            "• No dedicated Guide Operational Console (e.g. Tour Dispatch Calendar / Group Roster) — falls back to generic listing view.\n• No DTS guide license expiry tracking/alerts."
        ],
        [
            "6. Community Module\n(community/, CommunityShell.tsx)",
            "• CommunityProfile (resident, host, artisan).\n• Local stories feed, civic/environmental hazard reporting.\n• Host offering application form (homestay, guide, transport, activity, craft).",
            "• Remove remaining swat_community_host_applications localStorage references and bind 100% to DB.\n• Artisan craft e-commerce shipping/courier tracking."
        ],
        [
            "7. Transport Module\n(TransportFleetManager.tsx,\nIntercityTransportExplorer.tsx,\ntransport_vehicles table)",
            "• Live DB fleet persistence (transport_vehicles): 4x4 Jeeps, Hiace, Coaster, Sedans with images, plates, driver info, & status.\n• Intercity & mountain jeep booking flow with driver/pickup fields on Booking.",
            "• Remove legacy localStorage ride caches (swat_ride_orders, swat_intercity_bookings) in BusinessShell & TouristShell.\n• Real-time WebSocket GPS live driver tracking on map."
        ],
        [
            "8. Restaurant Module\n(RestaurantMenuManager.tsx,\nRestaurantDetailsModal.tsx, dishImages.ts)",
            "• Full Menu & Dish CRUD (PriceItem) with dish categories & imagery.\n• Tourist restaurant modal with menu browsing & table/meal booking request.",
            "• No dedicated Restaurant Table Floor-Plan DB table.\n• No live Kitchen Order Ticket (KOT) / table occupancy screen."
        ],
        [
            "9. Adventures & Activities\n(listings/models.py type='activity',\nBusinessServicesManagerModal.tsx)",
            "• Activity listing type (per_person) with safety & activity_type tags.\n• Excursion pricing/duration setup & tourist booking via InstantServiceReservationModal.",
            "• No digital liability waiver signing or safety gear checklist (helmet, harness, life vest) per booking.\n• No auto-pause of high-risk activities on red weather advisories."
        ],
        [
            "10. Admin & Other Stakeholders\n(AuthorityShell.tsx, OwnerFinancialControlCenter.tsx,\nsafety/rescue_bridge.py, verification/)",
            "• Authority dashboard: Business KYC approval, Community offering approvals, Road/Weather advisories, SOS & Incident case management.\n• Owner Financial Control Center: commission tiers, partner billing directory, invoices.\n• Rescue 1122 CAD dispatch bridge payload builder.",
            "• Separate portals/logins for Tourist Police, Rescue 1122, & KP Directorate (all currently share AuthorityShell).\n• Connect Rescue1122Bridge to live CAD emergency webhook instead of staging log."
        ],
        [
            "11. Deals & Offers\n(Searched across backend & frontend)",
            "• Manual per-date price_override supported inside AvailabilityModal / availability table.\n• No dedicated Deals/Offers/Promo module exists yet.",
            "• ENTIRE MODULE PENDING:\n  - Backend deals & promo_codes tables + validation APIs.\n  - Business UI to create seasonal deals/packages.\n  - Tourist UI Hot Deals carousel & checkout promo code discount."
        ],
        [
            "12. Cross-Cutting Infra\n(communications/, notifications/,\nfinance/, reviews/, core/config.py)",
            "• Complete DB tables (40 tables in SQLite WAL), financial commission ledger, verified post-stay review loop, & comms/payment adapters.",
            "• Production cutover: Switch DATABASE_URL to PostgreSQL, STORAGE_BACKEND to S3, & configure live API keys in .env."
        ]
    ]
    mod_tbl = doc.add_table(rows=1 + len(mod_rows), cols=3)
    format_table(mod_tbl, [Inches(1.8), Inches(2.5), Inches(2.6)], mod_headers, mod_rows, header_bg="1E293B")

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # PART C: PRIORITIZED ROADMAP
    h_road = doc.add_heading("4. Prioritized Remaining Action Plan", level=1)
    h_road.paragraph_format.space_before = Pt(10)
    h_road.paragraph_format.space_after = Pt(6)
    for r in h_road.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    add_callout(
        doc,
        "Priority P0 — Production Cutover & Wiring Fixes",
        "1. Wire UserManagementView.tsx handleToggleStatus() & handleCreateUser() to existing backend /auth/admin/users endpoints.\n"
        "2. Supply live credentials in .env for Easypaisa, JazzCash, SMTP/SendGrid, Meta WhatsApp/Twilio, SMS Gateway, and OpenWeather/PMD.\n"
        "3. Migrate DATABASE_URL from local SQLite to managed PostgreSQL and STORAGE_BACKEND from local disk to AWS S3 / R2.",
        bg_color="FEF2F2",
        border_color="DC2626"
    )

    add_callout(
        doc,
        "Priority P1 — Cleanup & Background Automation",
        "1. Retire remaining frontend localStorage caches (swat_local_bookings, swat_local_trips, swat_ride_orders, swat_community_host_applications) and enforce automatic guest booking claim on login.\n"
        "2. Add background scheduler (Celery / APScheduler) for 2-hour post-checkout review prompts and automated monthly invoice generation.",
        bg_color="FFFBEB",
        border_color="D97706"
    )

    add_callout(
        doc,
        "Priority P2 — Net-New Feature Modules",
        "1. Build the Deals & Offers Engine (promo codes, seasonal discounts, package deals UI & checkout discount engine).\n"
        "2. Build dedicated operational consoles for Tour Guides (schedule/roster), Adventures (digital waivers/safety gear), Restaurants (table floor-plan/KOT), and sub-accounts for Hotel Staff.",
        bg_color="EFF6FF",
        border_color="2563EB"
    )

    doc.save(OUTPUT_DOCX)
    print(f"[Document] Generated successfully: {OUTPUT_DOCX}")

if __name__ == "__main__":
    generate_status_diagram()
    generate_docx()

