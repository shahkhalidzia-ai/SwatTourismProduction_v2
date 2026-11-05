import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

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

def set_table_borders(table, color="D1D5DB", sz="4", val="single"):
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

def add_callout(doc, title, text, bg_color="F8FAFC", border_color="028AC8"):
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
    p_after.paragraph_format.space_before = Pt(0)
    p_after.paragraph_format.space_after = Pt(6)

def build_docx():
    doc = Document()
    
    # Page setup
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)
        
    # Title
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(2)
    r_title = p_title.add_run("Swat Tourism Platform")
    r_title.font.name = "Arial"
    r_title.font.size = Pt(24)
    r_title.bold = True
    r_title.font.color.rgb = RGBColor(15, 23, 42)

    # Subtitle
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(14)
    r_sub = p_sub.add_run("Database Persistence vs. LocalStorage Gap Analysis Report")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(14)
    r_sub.bold = True
    r_sub.font.color.rgb = RGBColor(2, 138, 200)

    # Metadata Callout
    add_callout(
        doc,
        "System Audit Metadata",
        "Target Database: backend/swat_tourism_prod.db (40 Tables)\n"
        "Backend Architecture: FastAPI + SQLAlchemy ORM\n"
        "Frontend State Storage: Zustand, React Query & localStorage (35 Keys)\n"
        "Document Purpose: Identify all persisted vs non-persisted transactional data and define the exact Gap List.",
        bg_color="F0FDF4",
        border_color="16A34A"
    )

    # Section 1
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(4)
    rh1 = h1.add_run("1. Fully Persisted Database Modules (40 Active Tables)")
    rh1.font.name = "Arial"
    rh1.font.size = Pt(14)
    rh1.bold = True
    rh1.font.color.rgb = RGBColor(15, 23, 42)

    p1 = doc.add_paragraph()
    p1.paragraph_format.space_after = Pt(8)
    rp1 = p1.add_run(
        "The following modules write directly to SQLite relational tables and are 100% durable across multiple devices, browser cache resets, and server restarts:"
    )
    rp1.font.name = "Arial"
    rp1.font.size = Pt(10)

    # Table 1: Persisted
    t1_data = [
        ("Module", "Features & Operations", "Database Tables", "Status"),
        ("Auth & Identity", "User registration, passwords, JWT tokens, profile editing", "users, tourist_profiles, business_profiles, authority_profiles", "100% Persisted"),
        ("Listings & Rooms", "Hotel rooms, rates, media, physical room inventory numbers", "listings, listing_details, price_items, hotel_rooms", "100% Persisted"),
        ("Calendar", "Daily room availability, booked counters, price overrides", "availability (404 rows)", "100% Persisted"),
        ("Safety & Roads", "Live road statuses, snow/flood advisories, 1122 SOS calls", "road_status, advisories, emergency_contacts, sos_events", "100% Persisted"),
        ("Reviews", "Post-stay 1-5 ratings, verified badges, manager replies", "reviews, review_replies", "100% Persisted"),
        ("Civic & Community", "Citizen hazard alerts, environmental issues, guide posts", "community_posts, issue_reports", "100% Persisted"),
        ("Finance & Invoices", "Monthly commission calculations, operator payouts, tiers", "commission_tiers, monthly_invoices, operator_payouts", "100% Persisted"),
        ("Trips & Bookings", "Saved itineraries, confirmed room bookings, audit trail", "trips, trip_stops, bookings, booking_items, booking_status_history", "100% Persisted*")
    ]
    
    t1 = doc.add_table(rows=len(t1_data), cols=4)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t1)
    
    col_widths = [Inches(1.4), Inches(2.3), Inches(2.1), Inches(1.0)]
    for r_idx, row in enumerate(t1.rows):
        is_header = (r_idx == 0)
        for c_idx, cell in enumerate(row.cells):
            cell.width = col_widths[c_idx]
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            if is_header:
                set_cell_background(cell, "0F172A")
            else:
                set_cell_background(cell, "FFFFFF" if r_idx % 2 == 1 else "F8FAFC")
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.space_before = Pt(0)
            r = p.add_run(t1_data[r_idx][c_idx])
            r.font.name = "Arial"
            r.font.size = Pt(8.5 if not is_header else 9)
            if is_header:
                r.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)
            elif c_idx == 3:
                r.bold = True
                r.font.color.rgb = RGBColor(22, 163, 74)

    # Note
    p_note = doc.add_paragraph()
    p_note.paragraph_format.space_before = Pt(4)
    p_note.paragraph_format.space_after = Pt(12)
    r_n = p_note.add_run("* Note: Trips and bookings are fully persisted in DB for authenticated users, but have offline guest fallbacks.")
    r_n.font.name = "Arial"
    r_n.font.size = Pt(8.5)
    r_n.font.italic = True
    r_n.font.color.rgb = RGBColor(100, 116, 139)

    # Section 2: GAP LIST
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(4)
    rh2 = h2.add_run("2. The GAP LIST: Modules & Functions NOT Persisted in Database")
    rh2.font.name = "Arial"
    rh2.font.size = Pt(14)
    rh2.bold = True
    rh2.font.color.rgb = RGBColor(220, 38, 38)

    p2 = doc.add_paragraph()
    p2.paragraph_format.space_after = Pt(8)
    rp2 = p2.add_run(
        "The following 9 functional areas store transactional or operational data in the browser's localStorage or ephemeral state instead of the SQLite database:"
    )
    rp2.font.name = "Arial"
    rp2.font.size = Pt(10)

    # Table 2: Gap List
    t2_data = [
        ("#", "Module / Flow", "Current LocalStorage Key", "Missing DB Table / Field", "Priority"),
        ("1", "Housekeeping Room Cleaning Status", "swat_hotel_cleaning_statuses\nswat_hotel_room_cleaning_status", "hotel_rooms.cleaning_status\n(clean, cleaning, inspected, ready)", "CRITICAL"),
        ("2", "Front-Desk Stay Turnover State", "swat_hotel_stay_states", "hotel_rooms.stay_state\n(in_house, turnover, checked_out)", "CRITICAL"),
        ("3", "Front-Desk Balance Payments", "swat_hotel_collected_balances\nswat_hotel_collected_balance", "folio_payments table\n(booking_id, amount, method, receipt)", "HIGH"),
        ("4", "Instant 4x4 Jeep Ride Orders", "swat_ride_orders", "Missing transport booking row\nin bookings and booking_items", "HIGH"),
        ("5", "Intercity Cab / Shuttle Bookings", "swat_intercity_bookings", "Missing intercity booking flow\nand backend endpoints", "HIGH"),
        ("6", "Operator Fleet Vehicles", "swat_transport_fleet_global", "transport_vehicles table\n(license_plate, model, capacity)", "MEDIUM"),
        ("7", "Guest Offline Tourist Bookings", "swat_local_bookings", "POST /api/v1/bookings/claim\nto merge offline guest bookings", "MEDIUM"),
        ("8", "Guest Offline Trip Itineraries", "swat_local_trips", "Guest itinerary migration logic\nupon account registration", "LOW"),
        ("9", "Community Host Applications", "swat_community_host_applications", "Direct update to users\nand community_profiles in DB", "LOW")
    ]

    t2 = doc.add_table(rows=len(t2_data), cols=5)
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t2)
    
    col_widths2 = [Inches(0.4), Inches(1.8), Inches(2.1), Inches(1.8), Inches(0.9)]
    for r_idx, row in enumerate(t2.rows):
        is_header = (r_idx == 0)
        for c_idx, cell in enumerate(row.cells):
            cell.width = col_widths2[c_idx]
            set_cell_margins(cell, top=100, bottom=100, left=100, right=100)
            if is_header:
                set_cell_background(cell, "991B1B")
            else:
                set_cell_background(cell, "FFFFFF" if r_idx % 2 == 1 else "FEF2F2")
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.space_before = Pt(0)
            r = p.add_run(t2_data[r_idx][c_idx])
            r.font.name = "Arial"
            r.font.size = Pt(8.5 if not is_header else 9)
            if is_header:
                r.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)
            elif c_idx == 4:
                r.bold = True
                val = t2_data[r_idx][c_idx]
                if val == "CRITICAL":
                    r.font.color.rgb = RGBColor(220, 38, 38)
                elif val == "HIGH":
                    r.font.color.rgb = RGBColor(234, 88, 12)
                elif val == "MEDIUM":
                    r.font.color.rgb = RGBColor(202, 138, 4)
                else:
                    r.font.color.rgb = RGBColor(100, 116, 139)

    # Section 3: Remediation Roadmap
    h3 = doc.add_paragraph()
    h3.paragraph_format.space_before = Pt(16)
    h3.paragraph_format.space_after = Pt(4)
    rh3 = h3.add_run("3. Strategic Roadmap to Close All Gaps")
    rh3.font.name = "Arial"
    rh3.font.size = Pt(14)
    rh3.bold = True
    rh3.font.color.rgb = RGBColor(15, 23, 42)

    add_callout(
        doc,
        "Phase 1: Hotel Operational State Persistence (Gaps 1, 2, 3)",
        "1. Add `cleaning_status` and `stay_state` columns to `hotel_rooms` model.\n"
        "2. Add `PATCH /api/v1/listings/{listing_id}/rooms/{room_id}/status` endpoint.\n"
        "3. Create `folio_payments` table for recording front-desk cash/card collections.\n"
        "4. Remove `swat_hotel_stay_states` and `swat_hotel_cleaning_statuses` from frontend localStorage.",
        bg_color="EFF6FF",
        border_color="2563EB"
    )

    add_callout(
        doc,
        "Phase 2: Transport & Fleet Ordering Integration (Gaps 4, 5, 6)",
        "1. Create `transport_vehicles` database table for fleet vehicle management.\n"
        "2. Route instant 4x4 ride requests and intercity cab bookings to `POST /api/v1/bookings/request`.\n"
        "3. Eliminate `swat_ride_orders` and `swat_intercity_bookings` in favor of backend dispatch queues.",
        bg_color="FFFBEB",
        border_color="D97706"
    )

    add_callout(
        doc,
        "Phase 3: Guest Account Conversion & Host Verification (Gaps 7, 8, 9)",
        "1. Store guest phone/email in `bookings` and allow `POST /api/v1/bookings/claim` upon signup.\n"
        "2. Store community guide applications directly in `users` and `community_profiles`.",
        bg_color="F8FAFC",
        border_color="475569"
    )

    output_path = os.path.join(os.path.dirname(__file__), "swat-tourism-database-persistence-and-gap-list.docx")
    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

if __name__ == "__main__":
    build_docx()
