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

def add_callout(doc, title, text, bg_color="F8FAFC", border_color="0A4D68"):
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
    p.paragraph_format.line_spacing = 1.15
    r_title = p.add_run(f"{title}\n")
    r_title.bold = True
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(11)
    r_title.font.color.rgb = RGBColor(10, 77, 104)
    
    r_text = p.add_run(text)
    r_text.font.name = "Calibri"
    r_text.font.size = Pt(10)
    r_text.font.color.rgb = RGBColor(51, 65, 85)
    
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(0)
    p_after.paragraph_format.space_after = Pt(6)

def create_document():
    doc = Document()
    
    # Page setup - Margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
    # Title & Metadata
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    r_title = title_p.add_run("Swat Tourism Platform (STP)")
    r_title.bold = True
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(24)
    r_title.font.color.rgb = RGBColor(10, 77, 104) # Deep Teal
    
    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(12)
    r_sub = sub_p.add_run("Transport Fleet User Scoping, DB Persistence, Review Functions & Complete Ride Implementation Specification")
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(14)
    r_sub.font.color.rgb = RGBColor(8, 131, 149) # Teal accent
    r_sub.italic = True
    
    # Meta bar table
    meta_tbl = doc.add_table(rows=1, cols=4)
    meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_tbl.autofit = False
    set_table_borders(meta_tbl, color="CBD5E1")
    
    meta_data = [
        ("Release Version", "v2.6.4 Production"),
        ("Date", "November 16, 2026"),
        ("Module Scope", "Transport Fleet, Bookings & Reviews"),
        ("Target Platforms", "PostgreSQL / FastAPI / React TS")
    ]
    for idx, (label, val) in enumerate(meta_data):
        c = meta_tbl.cell(0, idx)
        c.width = Inches(1.7)
        set_cell_background(c, "F1F5F9")
        set_cell_margins(c, top=80, bottom=80, left=100, right=100)
        p = c.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        r1 = p.add_run(f"{label}\n")
        r1.font.name = "Calibri"
        r1.font.size = Pt(8.5)
        r1.font.color.rgb = RGBColor(100, 116, 139)
        r2 = p.add_run(val)
        r2.bold = True
        r2.font.name = "Calibri"
        r2.font.size = Pt(9.5)
        r2.font.color.rgb = RGBColor(15, 23, 42)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    # Executive Summary Callout
    add_callout(
        doc,
        "EXECUTIVE SUMMARY & MANDATE",
        "This specification establishes strict multi-tenant user scoping for the Transport Fleet module, enforcing 100% database persistence, eliminating volatile localStorage dependencies, resolving the greenlet authorization failure on the 'Complete Ride' action, and connecting verified tourist reviews with operator review cockpits.",
        bg_color="EFF6FF",
        border_color="2563EB"
    )
    
    # Section 1: Problem Statement & Root Cause Analysis
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(4)
    r_h1 = h1.add_run("1. Technical Root Cause Analysis (RCA)")
    r_h1.bold = True
    r_h1.font.name = "Calibri"
    r_h1.font.size = Pt(15)
    r_h1.font.color.rgb = RGBColor(10, 77, 104)
    
    rca_items = [
        ("Fleet Leakage & Unwanted Auto-Seeding Bug",
         "In backend/app/modules/listings/router.py, GET /transport/fleet lacked authentication scoping. When business_id was omitted, it executed 'select(TransportVehicle)' without a filter, leaking all vehicles in the entire database. Additionally, auto_seed=True automatically injected 5 hardcoded demo vehicles into new accounts, preventing clean slate onboarding."),
        ("The Complete Ride Greenlet / 403 Forbidden Bug",
         "In backend/app/modules/bookings/service.py, get_booking_by_id loaded items, history, and payments, but omitted selectinload(Booking.business) and selectinload(Booking.listing). In complete_booking, evaluating 'is_owner = booking.business.owner_id == user_id' failed under async SQLAlchemy with a MissingGreenlet violation or evaluated to False, rejecting valid completion requests with HTTP 403."),
        ("Non-UUID Mock ID Parameter Failure",
         "In BusinessShell.tsx and TransportFleetManager.tsx, demo bookings and fallback providers used string identifiers (e.g. SWT-8080, biz-transport-1). When sent to FastAPI endpoints expecting uuid.UUID, FastAPI raised HTTP 422 Unprocessable Entity, causing the UI buttons to fail silently."),
        ("Disconnected Reviews Query Architecture",
         "In backend/app/modules/reviews/service.py, get_business_reviews queried reviews only by 'Review.listing_id.in_(listing_ids)'. Transport operators who provide rides without a separate room listing returned 0 reviews. Meanwhile, tourist review fallbacks wrote to localStorage without syncing to the backend database.")
    ]
    
    tbl_rca = doc.add_table(rows=1, cols=2)
    tbl_rca.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_rca, color="CBD5E1")
    
    hdr = tbl_rca.rows[0]
    for idx, name in enumerate(["Defect & Location", "Technical Cause & Production Impact"]):
        c = hdr.cells[idx]
        set_cell_background(c, "0A4D68")
        set_cell_margins(c, top=100, bottom=100, left=120, right=120)
        p = c.paragraphs[0]
        r = p.add_run(name)
        r.bold = True
        r.font.name = "Calibri"
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(255, 255, 255)
    
    tbl_rca.cell(0, 0).width = Inches(2.2)
    tbl_rca.cell(0, 1).width = Inches(4.6)
    
    for title, desc in rca_items:
        row = tbl_rca.add_row()
        c0 = row.cells[0]
        c1 = row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.6)
        set_cell_background(c0, "F8FAFC")
        set_cell_margins(c0, top=90, bottom=90, left=120, right=120)
        set_cell_margins(c1, top=90, bottom=90, left=120, right=120)
        
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(title)
        r0.bold = True
        r0.font.name = "Calibri"
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = RGBColor(15, 23, 42)
        
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(desc)
        r1.font.name = "Calibri"
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = RGBColor(51, 65, 85)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    # Section 2: Implementation Blueprint
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(4)
    r_h2 = h2.add_run("2. Engineering Implementation Blueprint")
    r_h2.bold = True
    r_h2.font.name = "Calibri"
    r_h2.font.size = Pt(15)
    r_h2.font.color.rgb = RGBColor(10, 77, 104)
    
    tasks = [
        ("Backend Listings Router & Service", 
         "1. Update GET /listings/transport/fleet with authenticated token payload to resolve business_profile.id automatically.\n"
         "2. Prohibit unauthenticated cross-operator vehicle dumping; return empty if unauthenticated.\n"
         "3. Set auto_seed=False so clean business profiles start with 0 vehicles and full autonomy.\n"
         "4. Retain POST /listings/transport/fleet/seed as an opt-in administrative template tool."),
         
        ("Backend Bookings Service (Complete Ride Fix)",
         "1. In BookingService.get_booking_by_id, add selectinload(Booking.business) and selectinload(Booking.listing).\n"
         "2. In complete_booking, ensure is_owner safely evaluates (booking.business and booking.business.owner_id == user_id).\n"
         "3. Allow transition from accepted, confirmed, and in-transit statuses.\n"
         "4. Log BookingStatusHistory entry with audit details."),
         
        ("Backend Reviews Service (Unified Reviews Query)",
         "1. In ReviewService.get_business_reviews, join Booking and query where Booking.business_id.in_(biz_ids) OR Review.listing_id.in_(listing_ids).\n"
         "2. Eager load Review.tourist, Review.listing, Review.reply, and Review.booking.\n"
         "3. Support operator reply persistence and instant return."),
         
        ("Frontend TransportFleetManager Component",
         "1. Remove all fallback loading from DEFAULT_FLEET demo array when isLoggedInUser is true.\n"
         "2. Load directly from fetchTransportFleet() API on mount.\n"
         "3. Await createTransportVehicle, updateTransportVehicle, and deleteTransportVehicle API responses.\n"
         "4. Show informative empty state with [+ Register Vehicle] button and optional [Load Sample Templates] action."),
         
        ("Frontend BusinessShell & MyBookingsView",
         "1. In BusinessShell.tsx, validate UUID regex before sending completeBooking API request.\n"
         "2. Ensure label is contextual: 'Complete Ride' for transport, 'Complete Stay' for hotel.\n"
         "3. In MyBookingsView.tsx, render contextual 'Complete Ride & Rate' button for transport bookings.\n"
         "4. In ReviewModal.tsx, set dynamic title: 'Rate Your Mountain Ride / Service' for transport.")
    ]
    
    for area, details in tasks:
        p_area = doc.add_paragraph()
        p_area.paragraph_format.space_before = Pt(6)
        p_area.paragraph_format.space_after = Pt(2)
        r_a = p_area.add_run(f"• {area}")
        r_a.bold = True
        r_a.font.name = "Calibri"
        r_a.font.size = Pt(11)
        r_a.font.color.rgb = RGBColor(8, 131, 149)
        
        p_d = doc.add_paragraph()
        p_d.paragraph_format.left_indent = Inches(0.25)
        p_d.paragraph_format.space_before = Pt(0)
        p_d.paragraph_format.space_after = Pt(4)
        r_d = p_d.add_run(details)
        r_d.font.name = "Calibri"
        r_d.font.size = Pt(10)
        r_d.font.color.rgb = RGBColor(51, 65, 85)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    # Section 3: Verification & Test Protocol
    h3 = doc.add_paragraph()
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(4)
    r_h3 = h3.add_run("3. Verification Test Protocol")
    r_h3.bold = True
    r_h3.font.name = "Calibri"
    r_h3.font.size = Pt(15)
    r_h3.font.color.rgb = RGBColor(10, 77, 104)
    
    test_suite = [
        ("TC-FLT-01", "Fleet Multi-Tenant Isolation", "Register Operator A & B. Operator A adds Jeep. Operator B queries fleet. Expected: Operator B gets 0 vehicles, no leakage."),
        ("TC-FLT-02", "100% DB CRUD & Restart", "Add vehicle, update fare and active status, delete vehicle. Verify all actions persist directly in SQLite/PostgreSQL across app reloads."),
        ("TC-BK-03", "Complete Ride Endpoint", "Operator clicks [Complete Ride]. Verify backend eager-loads business profile, authenticates operator, updates status to 'completed', and logs status history."),
        ("TC-REV-04", "Tourist Review & Business Reply", "Passenger submits 5-star review for completed ride. Verify operator reviews tab displays review with tourist name and allows posting a verified reply.")
    ]
    
    tbl_test = doc.add_table(rows=1, cols=3)
    tbl_test.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_test, color="CBD5E1")
    
    for idx, name in enumerate(["Test ID", "Test Scenario", "Expected Outcome"]):
        c = tbl_test.rows[0].cells[idx]
        set_cell_background(c, "0A4D68")
        set_cell_margins(c, top=90, bottom=90, left=100, right=100)
        p = c.paragraphs[0]
        r = p.add_run(name)
        r.bold = True
        r.font.name = "Calibri"
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    tbl_test.cell(0, 0).width = Inches(1.1)
    tbl_test.cell(0, 1).width = Inches(2.2)
    tbl_test.cell(0, 2).width = Inches(3.5)
    
    for tid, scn, exp in test_suite:
        row = tbl_test.add_row()
        c0, c1, c2 = row.cells
        c0.width, c1.width, c2.width = Inches(1.1), Inches(2.2), Inches(3.5)
        set_cell_background(c0, "F8FAFC")
        for cell in (c0, c1, c2):
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(tid)
        r0.bold = True
        r0.font.name = "Calibri"
        r0.font.size = Pt(9)
        r0.font.color.rgb = RGBColor(10, 77, 104)
        
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(scn)
        r1.bold = True
        r1.font.name = "Calibri"
        r1.font.size = Pt(9)
        r1.font.color.rgb = RGBColor(15, 23, 42)
        
        p2 = c2.paragraphs[0]
        r2 = p2.add_run(exp)
        r2.font.name = "Calibri"
        r2.font.size = Pt(9)
        r2.font.color.rgb = RGBColor(51, 65, 85)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(14)
    
    # Sign-off footer
    add_callout(
        doc,
        "READY FOR AUTOMATED EXECUTION",
        "This specification is ready for immediate deployment. Engineers or AI agents can execute the prompt directly against the codebase. All file references and code diff patterns are strictly compliant with the 6-layer architecture.",
        bg_color="F0FDF4",
        border_color="16A34A"
    )
    
    output_path = os.path.join(
        os.path.dirname(__file__),
        "Swat_Tourism_Transport_Fleet_Reviews_and_Complete_Ride_Implementation_Prompt.docx"
    )
    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

if __name__ == "__main__":
    create_document()

