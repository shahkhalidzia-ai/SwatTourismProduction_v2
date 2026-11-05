import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_document():
    doc = Document()
    
    # Page setup
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        
    # Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(45, 55, 72)
    
    # Eyebrow
    eyebrow = doc.add_paragraph()
    eyebrow.paragraph_format.space_before = Pt(0)
    eyebrow.paragraph_format.space_after = Pt(2)
    run_eye = eyebrow.add_run("SWAT TOURISM PLATFORM (STP) — PRODUCTION V2")
    run_eye.font.size = Pt(10.5)
    run_eye.font.bold = True
    run_eye.font.color.rgb = RGBColor(0, 122, 85) # Emerald
    
    # Title
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(2)
    title_p.paragraph_format.space_after = Pt(6)
    run_title = title_p.add_run("Phase 2: WhatsApp & Transactional Email Communications Gateway")
    run_title.font.size = Pt(20)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(23, 76, 114) # Primary Blue
    
    # Subtitle / Metadata
    meta_p = doc.add_paragraph()
    meta_p.paragraph_format.space_after = Pt(14)
    run_meta = meta_p.add_run("Technical Implementation Report • Module: app/modules/communications/ • Tests: 100% Passed")
    run_meta.font.size = Pt(10.5)
    run_meta.font.italic = True
    run_meta.font.color.rgb = RGBColor(100, 116, 139)
    
    # Callout Box: Summary
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.columns[0].width = Inches(6.5)
    cell = table.cell(0, 0)
    set_cell_background(cell, "F0FDF4") # Light emerald tint
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    p_box = cell.paragraphs[0]
    p_box.paragraph_format.space_after = Pt(0)
    run_box_title = p_box.add_run("✔ Deliverables Completed & Verified\n")
    run_box_title.bold = True
    run_box_title.font.color.rgb = RGBColor(0, 122, 85)
    p_box.add_run(
        "1. Communications module implemented with WhatsAppService (Meta Cloud API, Twilio, Mock logger) and EmailService (SendGrid v3, SMTP/TLS, Mock logger).\n"
        "2. All 4 production message templates implemented: Hotel New Reservation Alert, Tourist Booking Receipt, Official Confirmed Voucher with QR & Helpline, and Checkout Review Invite.\n"
        "3. Event triggers bound to create_booking, accept_booking, and complete_booking actions in BookingService.\n"
        "4. 100% automated test coverage in test_phase2_communications_gateway.py with zero regressions."
    )
    
    doc.add_paragraph().paragraph_format.space_before = Pt(8)
    
    # Section 1: Architecture & Multi-Channel Gateway Design
    h1 = doc.add_paragraph()
    r = h1.add_run("1. Gateway Architecture & Provider Channels")
    r.font.size = Pt(14)
    r.font.bold = True
    r.font.color.rgb = RGBColor(23, 76, 114)
    
    p = doc.add_paragraph()
    p.add_run(
        "The communications gateway is orchestrated through a central dispatcher pattern (CommunicationDispatcher) "
        "that decouples business domain logic from third-party transport layers. It supports local zero-cost staging "
        "development while enabling one-line production toggles to cloud APIs."
    )
    
    # Table of Providers
    tbl = doc.add_table(rows=5, cols=4)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    col_widths = [Inches(1.5), Inches(1.6), Inches(1.8), Inches(1.6)]
    headers = ["Service Module", "Cloud Provider", "Fallback / Mock", "Auth / Credentials"]
    
    for i, h in enumerate(headers):
        c = tbl.cell(0, i)
        set_cell_background(c, "174C72")
        p = c.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        r.font.size = Pt(9.5)
        set_cell_margins(c, 80, 80, 100, 100)
        
    data = [
        ("WhatsAppService", "Meta Cloud API (v18.0)", "Structured Mock Logger", "META_WHATSAPP_TOKEN & PHONE_ID"),
        ("WhatsAppService", "Twilio Programmable WA", "Structured Mock Logger", "TWILIO_ACCOUNT_SID & AUTH_TOKEN"),
        ("EmailService", "SendGrid v3 REST API", "Structured Mock Logger", "SENDGRID_API_KEY"),
        ("EmailService", "SMTP with STARTTLS", "Structured Mock Logger", "SMTP_HOST, PORT, USER, PASSWORD"),
    ]
    
    for row_idx, row_data in enumerate(data, start=1):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(row_data):
            c = tbl.cell(row_idx, col_idx)
            set_cell_background(c, bg)
            p = c.paragraphs[0]
            r = p.add_run(text)
            r.font.size = Pt(9)
            set_cell_margins(c, 70, 70, 90, 90)
            
    doc.add_paragraph().paragraph_format.space_before = Pt(8)
    
    # Section 2: Production Message Templates
    h2 = doc.add_paragraph()
    r2 = h2.add_run("2. Production Message Templates")
    r2.font.size = Pt(14)
    r2.font.bold = True
    r2.font.color.rgb = RGBColor(23, 76, 114)
    
    templates_info = [
        ("Template 1: Hotel New Reservation Alert", "Dispatched to hotel manager on create_booking. Summarizes guest info, booking reference, stay dates, reserved unit, payment guarantee model, total value, and link to Hotel Live Room Rack."),
        ("Template 2: Tourist Booking Receipt", "Dispatched to tourist on create_booking / initial deposit. Contains stay breakdown, amount paid today, balance due at check-in, tracking URL, and 24/7 Swat Tourist Police Helpline (0946-9240400) & Emergency Rescue 1122."),
        ("Template 3: Official Confirmed Voucher with QR & Helpline", "Dispatched upon accept_booking or payment IPN confirmation. Official KPCTA government recognized travel pass containing encrypted QR verification data (KPCTA-SWT-...), GPS directions to hotel, and official PDF download URL."),
        ("Template 4: Checkout Review Invite", "Dispatched upon complete_booking. Warm post-stay greeting with 5-star visual rating prompt and verified direct review link to guide fellow tourists and support verified local hosts.")
    ]
    
    for t_title, t_desc in templates_info:
        p_t = doc.add_paragraph()
        p_t.paragraph_format.space_before = Pt(4)
        p_t.paragraph_format.space_after = Pt(2)
        r_t = p_t.add_run(f"• {t_title}: ")
        r_t.bold = True
        r_t.font.color.rgb = RGBColor(0, 122, 85)
        p_t.add_run(t_desc)

    doc.add_paragraph().paragraph_format.space_before = Pt(8)

    # Section 3: Event Triggers
    h3 = doc.add_paragraph()
    r3 = h3.add_run("3. Event Triggers Bound in Services")
    r3.font.size = Pt(14)
    r3.font.bold = True
    r3.font.color.rgb = RGBColor(23, 76, 114)

    p_ev = doc.add_paragraph()
    p_ev.add_run(
        "Triggers are hooked directly into app/modules/bookings/service.py following commit operations "
        "with complete relationship eager-loading to prevent database detachment:"
    )
    
    doc.add_paragraph(
        "• create_booking: Triggers dispatch_booking_created (Hotel WhatsApp/Email Alert + Tourist WhatsApp/Email Receipt).\n"
        "• accept_booking: Triggers dispatch_booking_accepted (Official Confirmed Voucher via WhatsApp, Email, and SMS).\n"
        "• complete_booking: Triggers dispatch_booking_completed (Post-Checkout Review Invite via WhatsApp and Email)."
    )

    doc.add_paragraph().paragraph_format.space_before = Pt(8)

    # Section 4: REST API Audit Endpoints
    h4 = doc.add_paragraph()
    r4 = h4.add_run("4. REST API Audit & Testing Endpoints")
    r4.font.size = Pt(14)
    r4.font.bold = True
    r4.font.color.rgb = RGBColor(23, 76, 114)

    doc.add_paragraph(
        "Mounted under /api/v1/communications in main.py for inspection and testing:\n"
        "• GET /api/v1/communications/whatsapp/logs — Inspect dispatched WhatsApp messages.\n"
        "• DELETE /api/v1/communications/whatsapp/logs — Clear WhatsApp audit history.\n"
        "• POST /api/v1/communications/whatsapp/test-send — Dispatch manual WhatsApp test message.\n"
        "• GET /api/v1/communications/email/logs — Inspect dispatched transactional emails.\n"
        "• DELETE /api/v1/communications/email/logs — Clear email audit history.\n"
        "• POST /api/v1/communications/email/test-send — Dispatch manual transactional email."
    )

    doc.add_paragraph().paragraph_format.space_before = Pt(8)

    # Section 5: Verification & Automated Tests
    h5 = doc.add_paragraph()
    r5 = h5.add_run("5. Automated Test Suite Verification")
    r5.font.size = Pt(14)
    r5.font.bold = True
    r5.font.color.rgb = RGBColor(23, 76, 114)

    doc.add_paragraph(
        "All 7 test cases in backend/tests/test_phase2_communications_gateway.py passed:\n"
        "1. test_whatsapp_service_mock_and_templates (PASSED)\n"
        "2. test_whatsapp_service_meta_and_twilio_dispatch (PASSED)\n"
        "3. test_email_service_mock_and_templates (PASSED)\n"
        "4. test_email_service_sendgrid_and_smtp_dispatch (PASSED)\n"
        "5. test_dispatcher_event_triggers (PASSED)\n"
        "6. test_booking_service_triggers_communications_e2e (PASSED)\n"
        "7. test_communications_rest_endpoints (PASSED)\n\n"
        "All existing Phase 4 unified checkout and Booking tests pass without regression (14/14 tests passed)."
    )

    out_path = os.path.join(os.path.dirname(__file__), "swat-tourism-phase2-communications-gateway-implementation.docx")
    doc.save(out_path)
    print(f"Successfully generated DOCX: {out_path}")

if __name__ == "__main__":
    create_document()
