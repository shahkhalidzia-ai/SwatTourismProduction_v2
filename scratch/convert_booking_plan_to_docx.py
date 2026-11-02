import os
import shutil
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
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
    p.paragraph_format.space_after = Pt(3)
    r_title = p.add_run(f"📌 {title}\n")
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(11)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(15, 23, 42)
    
    r_text = p.add_run(text)
    r_text.font.name = "Calibri"
    r_text.font.size = Pt(10)
    r_text.font.color.rgb = RGBColor(51, 65, 85)
    
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(0)
    p_after.paragraph_format.space_after = Pt(4)

def build_word_document():
    doc = Document()
    
    # Page Setup - 1 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)

    # Title & Subtitle Banner
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    run_title = title_p.add_run("Swat Tourism Platform")
    run_title.font.name = "Calibri"
    run_title.font.size = Pt(24)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(14, 116, 144)  # Teal/Blue

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(14)
    run_sub = sub_p.add_run("Tourist Booking Flow — Gap Analysis & End-to-End Implementation Plan")
    run_sub.font.name = "Calibri"
    run_sub.font.size = Pt(15)
    run_sub.font.bold = True
    run_sub.font.color.rgb = RGBColor(15, 23, 42)

    # Metadata Card Table
    meta_tbl = doc.add_table(rows=2, cols=2)
    meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_tbl.autofit = False
    set_table_borders(meta_tbl, color="E2E8F0")

    meta_items = [
        ("Document Version:", "1.0.0 (Production Roadmap)", "Date Generated:", "November 2026"),
        ("System Modules:", "Tourist Portal, Business Dashboard, Communications Gateway, Payment APIs", "Scope:", "Check Availability ➔ Reservation ➔ Room Status ➔ WhatsApp & Email ➔ Payment ➔ Reviews")
    ]

    col_widths = [Inches(1.8), Inches(4.9)]
    for r_idx, row_data in enumerate(meta_items):
        cell_0 = meta_tbl.cell(r_idx, 0)
        cell_1 = meta_tbl.cell(r_idx, 1)
        cell_0.width = col_widths[0]
        cell_1.width = col_widths[1]
        set_cell_background(cell_0, "F8FAFC")
        set_cell_background(cell_1, "FFFFFF")
        set_cell_margins(cell_0, top=100, bottom=100, left=140, right=140)
        set_cell_margins(cell_1, top=100, bottom=100, left=140, right=140)

        p0 = cell_0.paragraphs[0]
        p0.paragraph_format.space_after = Pt(0)
        r0 = p0.add_run(row_data[0] + " ")
        r0.font.name = "Calibri"
        r0.font.bold = True
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = RGBColor(71, 85, 105)

        r0_val = p0.add_run(row_data[1])
        r0_val.font.name = "Calibri"
        r0_val.font.size = Pt(9.5)
        r0_val.font.color.rgb = RGBColor(15, 23, 42)

        p1 = cell_1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(0)
        r1 = p1.add_run(row_data[2] + " ")
        r1.font.name = "Calibri"
        r1.font.bold = True
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = RGBColor(71, 85, 105)

        r1_val = p1.add_run(row_data[3])
        r1_val.font.name = "Calibri"
        r1_val.font.size = Pt(9.5)
        r1_val.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Executive Summary
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(4)
    r_h1 = h1.add_run("1. Executive Summary")
    r_h1.font.name = "Calibri"
    r_h1.font.size = Pt(14)
    r_h1.font.bold = True
    r_h1.font.color.rgb = RGBColor(14, 116, 144)

    p_exec = doc.add_paragraph()
    p_exec.paragraph_format.space_after = Pt(10)
    p_exec.paragraph_format.line_spacing = 1.15
    r_exec = p_exec.add_run(
        "This audit and technical implementation plan addresses the full end-to-end Tourist Booking Flow for hotels "
        "and tourism hospitality providers across Swat Valley. Currently, the platform features a working booking "
        "state machine, local storage mock workflows, in-app notification records, and Pakistani payment adapters (Easypaisa/JazzCash). "
        "However, crucial production elements—specifically database persistence for physical hotel rooms, multi-channel "
        "automated notifications (WhatsApp Business API and SMTP Transactional Email), and structured turnover workflows—require "
        "systematic integration to meet official enterprise hospitality standards."
    )
    r_exec.font.name = "Calibri"
    r_exec.font.size = Pt(10.5)
    r_exec.font.color.rgb = RGBColor(51, 65, 85)

    add_callout(
        doc,
        "Core Goal",
        "Enable a tourist to check multi-night room availability, book instantly or submit a request, receive automated WhatsApp & Email vouchers, "
        "allow the hotel front desk to assign physical rooms (updating live room occupancy in PostgreSQL), process full or advance guarantee payments, "
        "manage check-out turnover, and collect post-stay verified reviews.",
        bg_color="EFF6FF",
        border_color="028AC8"
    )

    # Section 2: Comprehensive Gap Analysis Table
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(16)
    h2.paragraph_format.space_after = Pt(6)
    r_h2 = h2.add_run("2. Comprehensive Gap Analysis")
    r_h2.font.name = "Calibri"
    r_h2.font.size = Pt(14)
    r_h2.font.bold = True
    r_h2.font.color.rgb = RGBColor(14, 116, 144)

    gap_data = [
        ("1. Check Availability",
         "AvailabilityModal.tsx queries 30-day generic units from backend Availability table per PriceItem.",
         "• Units tracked at rate tier, not tied to physical rooms.\n• Multi-night range picker is basic.\n• Maintenance/cleaning does not decrement public availability.",
         "Real-time multi-night availability dynamically synchronized with physical room occupancy.",
         "P1 (High)"),
        ("2. Booking Request Creation",
         "POST /api/v1/bookings/request creates booking in status 'requested' with row locks. Guest fallback in localStorage.",
         "• Offline/guest bookings in localStorage need automatic backend sync.\n• Lack of structured room preferences (floor, bed configuration).",
         "Unified booking model with instant guest-to-account linking and structured room requests.",
         "P2 (Medium)"),
        ("3. Confirmation on Platform",
         "Business portal allows hotel to Accept/Decline. In-app notification created in DB table.",
         "• Front desk lacks live audio/visual push badge on incoming booking.\n• No 1-click printable/PDF official voucher pass.",
         "Immediate audio-visual front desk reception alert + 1-click official KP Tourism booking pass.",
         "P2 (Medium)"),
        ("4. WhatsApp Notifications (Tourist & Hotel)",
         "WhatsApp numbers collected in profiles and listings. Only manual wa.me chat links exist.",
         "CRITICAL GAP: No automated WhatsApp dispatch.\n• Tourist gets no automated WhatsApp voucher.\n• Hotel gets no instant WhatsApp reservation alert with 1-tap accept.",
         "Automated WhatsApp Business / Cloud API service dispatching interactive cards to both parties.",
         "P0 (Critical)"),
        ("5. Email Notifications (Tourist & Hotel)",
         "Email stored in auth/guest forms. Basic HTML invoice generation code exists in backend.",
         "CRITICAL GAP: No active SMTP / Transactional Email service.\n• Neither Tourist nor Hotel receives confirmation emails or PDF attachments.",
         "Transactional email pipeline (SMTP/SendGrid/SES) with branded HTML templates and PDF vouchers.",
         "P0 (Critical)"),
        ("6. Physical Room Status & Assignment",
         "AssignRoomModal.tsx and physicalRooms.ts manage room numbers and occupancy.",
         "CRITICAL GAP: Physical rooms are stored in browser localStorage, NOT PostgreSQL!\n• Room status changes (available/reserved/occupied/cleaning) do not persist across devices.",
         "Dedicated hotel_rooms table in DB with live occupancy state machine and turnover tracking.",
         "P0 (Critical)"),
        ("7. Payment Process Completion",
         "Easypaisa and JazzCash adapters implemented in backend. Transitions booking to PAID/CONFIRMED.",
         "• Partial deposit workflow (20% online advance + 80% at hotel) is uncoordinated.\n• Payment IPN callback does not trigger outbound WhatsApp/Email cascade.",
         "Unified checkout modal supporting Full, Deposit, and Pay-at-Hotel, auto-triggering notification cascade.",
         "P1 (High)"),
        ("8. Completion & Verified Reviews",
         "Status transition to 'completed' exists. ReviewModal creates verified reviews linked to booking_id.",
         "• No automated post-checkout trigger (WhatsApp/Email link: 'Rate your stay').\n• Hotel management reply is not displayed prominently on public cards.",
         "Automatic post-checkout notification cascade with 1-tap review submission and public hotel replies.",
         "P2 (Medium)"),
    ]

    tbl_gaps = doc.add_table(rows=len(gap_data) + 1, cols=5)
    tbl_gaps.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_gaps.autofit = False
    set_table_borders(tbl_gaps, color="CBD5E1")

    headers = ["Stage / Component", "Current Implementation", "Identified Gaps", "Target Standard", "Priority"]
    col_w = [Inches(1.3), Inches(1.5), Inches(2.0), Inches(1.5), Inches(0.8)]

    for c_idx, h_text in enumerate(headers):
        c = tbl_gaps.cell(0, c_idx)
        c.width = col_w[c_idx]
        set_cell_background(c, "0E7490")  # Dark teal
        set_cell_margins(c, top=140, bottom=140, left=120, right=120)
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h_text)
        r.font.name = "Calibri"
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    for r_idx, row_vals in enumerate(gap_data):
        for c_idx, val in enumerate(row_vals):
            c = tbl_gaps.cell(r_idx + 1, c_idx)
            c.width = col_w[c_idx]
            bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
            set_cell_background(c, bg)
            set_cell_margins(c, top=100, bottom=100, left=120, right=120)
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.12
            
            if c_idx == 4:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                r = p.add_run(val)
                r.font.name = "Calibri"
                r.font.bold = True
                r.font.size = Pt(9)
                if "P0" in val:
                    r.font.color.rgb = RGBColor(220, 38, 38)
                elif "P1" in val:
                    r.font.color.rgb = RGBColor(217, 119, 6)
                else:
                    r.font.color.rgb = RGBColor(16, 185, 129)
            elif c_idx == 0:
                r = p.add_run(val)
                r.font.name = "Calibri"
                r.font.bold = True
                r.font.size = Pt(9)
                r.font.color.rgb = RGBColor(15, 23, 42)
            else:
                r = p.add_run(val)
                r.font.name = "Calibri"
                r.font.size = Pt(8.5)
                r.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 3: End-to-End Workflow Architecture
    h3 = doc.add_paragraph()
    h3.paragraph_format.space_before = Pt(16)
    h3.paragraph_format.space_after = Pt(6)
    r_h3 = h3.add_run("3. End-to-End Workflow & Step-by-Step Sequence")
    r_h3.font.name = "Calibri"
    r_h3.font.size = Pt(14)
    r_h3.font.bold = True
    r_h3.font.color.rgb = RGBColor(14, 116, 144)

    steps = [
        ("Step 1: Multi-Night Availability & Rate Inspection",
         "The tourist selects check-in and check-out dates, number of guests, and room type. The platform queries real-time availability dynamically calculated from available database rooms minus active reservations."),
        ("Step 2: Reservation Submission & Inventory Row Lock",
         "The tourist clicks 'Instant Reserve' or 'Request Booking'. The backend initiates a database transaction with row-level pessimistic locking on the target inventory to eliminate overbooking risks. Status is initialized as 'requested'."),
        ("Step 3: Multi-Channel Alert Dispatch (Phase 1)",
         "The communications gateway fires simultaneous alerts:\n"
         "  • Hotel Manager / Reception: WhatsApp message + Email containing Guest Details, Dates, Room Category, and 1-tap Accept link.\n"
         "  • Tourist: WhatsApp message + Email acknowledging receipt of request."),
        ("Step 4: Physical Room Assignment & Acceptance",
         "The hotel front desk opens the reservation in the Business Portal, selects a physical room (e.g. Room 204, Floor 2, Garden Wing), and clicks 'Confirm Booking'. The physical room status switches to 'reserved' in PostgreSQL."),
        ("Step 5: Payment Completion (Easypaisa / JazzCash / Pay at Hotel)",
         "The tourist settles either 100% full amount, 20% advance guarantee deposit, or selects 'Pay at Hotel on Arrival'. On online payment authorization, the gateway IPN webhook marks payment_status='PAID' and status='CONFIRMED'."),
        ("Step 6: Official Confirmation & Digital Voucher Dispatch (Phase 2)",
         "Once confirmed and guaranteed, the system automatically sends:\n"
         "  • Tourist: Official WhatsApp voucher + Branded Email with PDF confirmation, GPS location pin, check-in instructions, and 24/7 Tourist Police helpline (0946-9240400).\n"
         "  • Hotel: Final confirmation notification with arrival schedule."),
        ("Step 7: Check-In, Stay & Turnover Management",
         "When the guest arrives, the front desk clicks 'Check In' (room switches to 'occupied'). At departure, front desk clicks 'Check Out' (booking transitions to 'completed', room automatically switches to 'cleaning', and turns back to 'available' once housekeeping verifies)."),
        ("Step 8: Verified Review Loop",
         "Two hours after checkout, an automated WhatsApp message and email are delivered to the tourist inviting them to rate their stay. Submissions are verified against booking_id and displayed with the 'KP Tourism Verified Stay' badge.")
    ]

    for title, desc in steps:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(2)
        r_t = p.add_run(f"• {title}: ")
        r_t.font.name = "Calibri"
        r_t.font.bold = True
        r_t.font.size = Pt(10)
        r_t.font.color.rgb = RGBColor(14, 116, 144)
        
        r_d = p.add_run(desc)
        r_d.font.name = "Calibri"
        r_d.font.size = Pt(9.5)
        r_d.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 4: 5-Phase Detailed Implementation Roadmap
    h4 = doc.add_paragraph()
    h4.paragraph_format.space_before = Pt(16)
    h4.paragraph_format.space_after = Pt(6)
    r_h4 = h4.add_run("4. Phased Implementation Roadmap")
    r_h4.font.name = "Calibri"
    r_h4.font.size = Pt(14)
    r_h4.font.bold = True
    r_h4.font.color.rgb = RGBColor(14, 116, 144)

    phases = [
        ("Phase 1: Database Migration for Physical Rooms & Inventory Persistence",
         "Deliverables:\n"
         "1. Create `hotel_rooms` table in PostgreSQL: columns for id, listing_id, price_item_id, room_number, floor, wing, category_name, bed_setup, status, and current_booking_id.\n"
         "2. Backend API routes: GET/POST rooms, PATCH room status, and POST /bookings/{id}/assign-room.\n"
         "3. Frontend refactoring: Update AssignRoomModal.tsx and physicalRooms.ts to connect directly to backend REST endpoints with offline caching fallback."),
        ("Phase 2: WhatsApp & Transactional Email Communications Gateway",
         "Deliverables:\n"
         "1. Communications module (`app/modules/communications/`): Implement `whatsapp_service.py` (Twilio/Meta WhatsApp Cloud API with local mock logger) and `email_service.py` (SMTP/SendGrid client).\n"
         "2. Message templates: Hotel New Reservation Alert, Tourist Booking Receipt, Official Confirmed Voucher with QR & Helpline, and Checkout Review Invite.\n"
         "3. Event triggers: Bind dispatch triggers to create_booking, accept_booking, and complete_booking actions."),
        ("Phase 3: Interactive Availability & Multi-Night Date Picker",
         "Deliverables:\n"
         "1. Redesign AvailabilityModal.tsx with intuitive check-in / check-out range picker.\n"
         "2. Dynamic multi-night stay total price calculator.\n"
         "3. Real-time count of remaining available rooms per category (e.g. 'Only 2 Deluxe rooms left for selected dates').\n"
         "4. Structured room preferences (floor, bedding, quiet room)."),
        ("Phase 4: Unified Payment & Guarantee Flow",
         "Deliverables:\n"
         "1. Unified checkout options: 100% Full Online, 20% Advance Guarantee Deposit, and Pay at Hotel on Arrival.\n"
         "2. End-to-end IPN webhook handling that automatically sets booking to CONFIRMED and triggers Phase 2 notification dispatch.\n"
         "3. Printable official booking voucher receipt with PDF download."),
        ("Phase 5: Front-Desk Operations, Turnover & Verified Review Loop",
         "Deliverables:\n"
         "1. Reception quick actions in BusinessShell: Check-in ('occupied'), Check-out ('cleaning'), and Housekeeping Ready ('available').\n"
         "2. Automated post-stay review invitations sent via WhatsApp & Email.\n"
         "3. Hotel management reply functionality displayed prominently on public hotel listing modals.")
    ]

    for title, content in phases:
        add_callout(doc, title, content, bg_color="F8FAFC", border_color="0E7490")

    # Section 5: Verification & Testing Matrix
    h5 = doc.add_paragraph()
    h5.paragraph_format.space_before = Pt(16)
    h5.paragraph_format.space_after = Pt(6)
    r_h5 = h5.add_run("5. Verification & Testing Matrix")
    r_h5.font.name = "Calibri"
    r_h5.font.size = Pt(14)
    r_h5.font.bold = True
    r_h5.font.color.rgb = RGBColor(14, 116, 144)

    test_data = [
        ("Room Schema & Foreign Keys", "Verify hotel_rooms table constraints, price_item relationship, and cascading deletes.", "Automated Pytest (`test_rooms_db.py`)"),
        ("Room Status State Machine", "Verify transitions: available ➔ reserved ➔ occupied ➔ cleaning ➔ available.", "Unit & API test suite"),
        ("WhatsApp & Email Dispatch", "Verify mock and live payload delivery for both hotel manager and tourist recipients.", "Integration test suite (`test_communications.py`)"),
        ("End-to-End Booking Cycle", "Simulate tourist search ➔ booking ➔ hotel assignment ➔ payment ➔ review submission.", "End-to-end test runner")
    ]

    tbl_tests = doc.add_table(rows=len(test_data) + 1, cols=3)
    tbl_tests.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_tests.autofit = False
    set_table_borders(tbl_tests, color="CBD5E1")

    t_headers = ["Testing Area", "Objective & Verification Criteria", "Test Method"]
    t_widths = [Inches(1.8), Inches(3.4), Inches(1.8)]

    for c_idx, h_text in enumerate(t_headers):
        c = tbl_tests.cell(0, c_idx)
        c.width = t_widths[c_idx]
        set_cell_background(c, "0F172A")  # Dark slate
        set_cell_margins(c, top=120, bottom=120, left=140, right=140)
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h_text)
        r.font.name = "Calibri"
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    for r_idx, row_vals in enumerate(test_data):
        for c_idx, val in enumerate(row_vals):
            c = tbl_tests.cell(r_idx + 1, c_idx)
            c.width = t_widths[c_idx]
            bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
            set_cell_background(c, bg)
            set_cell_margins(c, top=100, bottom=100, left=140, right=140)
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(val)
            r.font.name = "Calibri"
            r.font.size = Pt(9)
            if c_idx == 0:
                r.font.bold = True
                r.font.color.rgb = RGBColor(15, 23, 42)
            else:
                r.font.color.rgb = RGBColor(51, 65, 85)

    # Save documents
    out_dir = r"f:\Antigravity\SwatTourismProduction_v2\docs"
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "Tourist_Booking_Flow_Gap_Analysis_and_Plan.docx")
    doc.save(out_path)
    print(f"Successfully generated Word document at: {out_path}")

    # Also copy to artifact directory
    artifact_dir = r"C:\Users\shahkhalid1\.gemini\antigravity-ide\brain\719de944-a05c-4c7e-bec9-f2264c9ea860"
    if os.path.exists(artifact_dir):
        artifact_doc_path = os.path.join(artifact_dir, "Tourist_Booking_Flow_Gap_Analysis_and_Plan.docx")
        shutil.copyfile(out_path, artifact_doc_path)
        print(f"Copied to artifact directory: {artifact_doc_path}")

if __name__ == "__main__":
    build_word_document()
