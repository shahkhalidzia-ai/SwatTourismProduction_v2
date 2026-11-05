import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
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
    run_title = title_p.add_run("End-to-End Testing Guide & Architecture: WhatsApp & Transactional Email Gateway")
    run_title.font.size = Pt(18)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(23, 76, 114) # Primary Blue
    
    # Subtitle / Metadata
    meta_p = doc.add_paragraph()
    meta_p.paragraph_format.space_after = Pt(14)
    run_meta = meta_p.add_run("Comprehensive Testing Methodologies, Cloud Setup (Twilio/Meta/SendGrid), and Production Best Practices")
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
    run_box_title = p_box.add_run("🎯 Complete Verification Scope Covered\n")
    run_box_title.bold = True
    run_box_title.font.color.rgb = RGBColor(0, 122, 85)
    p_box.add_run(
        "1. Interactive End-to-End Flow Simulator: One command execution covering tourist booking, hotel alert, official confirmed voucher with QR pass & helpline, and checkout review invite.\n"
        "2. Web Application & REST API Live Inspection: Real-time audit logs (/api/v1/communications/whatsapp/logs and email/logs).\n"
        "3. Live Cloud Delivery Configuration: Plug-and-play instructions for Twilio, Meta Cloud API, SendGrid, and SMTP.\n"
        "4. Suggested Production Implementation: Asynchronous queues, DLR webhooks, HSM template pre-approval, and carrier compliance."
    )
    
    doc.add_paragraph().paragraph_format.space_before = Pt(8)
    
    # Section 1: Method 1 Simulator
    h1 = doc.add_paragraph()
    r1 = h1.add_run("1. Method 1: One-Command Lifecycle Simulator (Fastest & Visual)")
    r1.font.size = Pt(13.5)
    r1.font.bold = True
    r1.font.color.rgb = RGBColor(23, 76, 114)
    
    doc.add_paragraph(
        "The fastest, zero-cost method to test the entire lifecycle without requiring live external cloud credentials "
        "is the interactive simulator script located at backend/scripts/simulate_communications_e2e_flow.py."
    )
    
    p_cmd = doc.add_paragraph()
    r_cmd = p_cmd.add_run("Command to run:\npython backend/scripts/simulate_communications_e2e_flow.py")
    r_cmd.font.name = "Consolas"
    r_cmd.font.size = Pt(10)
    r_cmd.font.color.rgb = RGBColor(15, 23, 42)
    p_cmd.paragraph_format.left_indent = Inches(0.3)
    
    doc.add_paragraph("What the script executes sequentially:")
    
    stages = [
        ("Stage 1 (create_booking):", "Tourist places a booking request. The gateway triggers:\n"
         "  • Hotel New Reservation Alert (WhatsApp & Email): Dispatched to Hotel Management summarizing guest details, stay dates, room type, payment guarantee, and a direct portal link.\n"
         "  • Tourist Booking Receipt (WhatsApp & Email): Dispatched to the tourist detailing the reservation, deposit paid, balance due at check-in, and 24/7 Swat Tourist Police Helpline (0946-9240400) & Emergency Rescue 1122."),
        ("Stage 2 (accept_booking):", "Hotel Management accepts the reservation and assigns a room. The gateway triggers:\n"
         "  • Official Confirmed Voucher with QR & Helpline (WhatsApp, Email & SMS): Official KPCTA government-recognized travel pass featuring encrypted verification QR data (KPCTA-SWT-...), GPS directions, and official printable PDF link."),
        ("Stage 3 (complete_booking):", "Guest completes stay / checks out. The gateway triggers:\n"
         "  • Checkout 5-Star Review Invite (WhatsApp & Email): Farewell greeting with interactive 5-star visual rating prompt and verified review URL."),
        ("Stage 4 (Visual HTML Generation):", "The script automatically compiles and saves an interactive visual preview report:\n"
         "  • Location: Docs/live_communications_flow_preview.html\n"
         "  • Contains actual WhatsApp smartphone chat screens and responsive email client rendering.")
    ]
    
    for s_title, s_desc in stages:
        p_s = doc.add_paragraph()
        r_s = p_s.add_run(f"• {s_title} ")
        r_s.bold = True
        r_s.font.color.rgb = RGBColor(0, 122, 85)
        p_s.add_run(s_desc)
        
    doc.add_paragraph().paragraph_format.space_before = Pt(8)

    # Section 2: Method 2 Web UI & REST API
    h2 = doc.add_paragraph()
    r2 = h2.add_run("2. Method 2: Live Browser & REST API Audit Testing")
    r2.font.size = Pt(13.5)
    r2.font.bold = True
    r2.font.color.rgb = RGBColor(23, 76, 114)

    doc.add_paragraph(
        "You can test the entire workflow interactively inside the running web application while auditing "
        "the communications gateway via REST endpoints in real-time."
    )

    steps_ui = [
        ("Step 1: Tourist Places Reservation:", "In the browser (http://localhost:5181), switch to the 'Tourist (Sara Ahmed)' persona on the top bar. Navigate to Explore > Hotels (e.g., Swat Serena Hotel) > Instant Reserve > Choose payment guarantee mode > Submit."),
        ("Step 2: Inspect Dispatched Messages:", "Open the REST audit endpoints in a browser tab or Postman:\n"
         "  • WhatsApp Log: http://localhost:8090/api/v1/communications/whatsapp/logs\n"
         "  • Email Log: http://localhost:8090/api/v1/communications/email/logs\n"
         "  • Verify that Template 1 (Hotel Alert) and Template 2 (Tourist Receipt) are recorded with full markdown/HTML payloads."),
        ("Step 3: Hotel Manager Accepts Booking:", "Switch to the 'Hotel Owner (Serena Hotel)' persona on the top bar. Open Front Desk > Today / Bookings > Click 'Accept Booking' & assign physical room key. Refresh the audit endpoint: Template 3 (Official Confirmed Voucher) is now visible."),
        ("Step 4: Conclude Stay / Checkout:", "On the Hotel Live Room Rack, click 'Check Out' for the in-house guest. Refresh the audit endpoint: Template 4 (Checkout Review Invite) is dispatched.")
    ]

    for st_title, st_desc in steps_ui:
        p_st = doc.add_paragraph()
        r_st = p_st.add_run(f"• {st_title} ")
        r_st.bold = True
        r_st.font.color.rgb = RGBColor(23, 76, 114)
        p_st.add_run(st_desc)

    doc.add_paragraph().paragraph_format.space_before = Pt(8)

    # Section 3: Method 3 Live Cloud Delivery
    h3 = doc.add_paragraph()
    r3 = h3.add_run("3. Method 3: Live Cloud Delivery to Real Mobile Phones & Inboxes")
    r3.font.size = Pt(13.5)
    r3.font.bold = True
    r3.font.color.rgb = RGBColor(23, 76, 114)

    doc.add_paragraph(
        "To deliver live WhatsApp notifications directly to your physical smartphone and real emails "
        "to your personal inbox, configure your credentials in backend/.env:"
    )

    # Table of Cloud Configurations
    tbl_cloud = doc.add_table(rows=5, cols=3)
    tbl_cloud.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_cloud.autofit = False
    
    col_w = [Inches(1.5), Inches(2.2), Inches(2.8)]
    for i, w in enumerate(col_w):
        tbl_cloud.columns[i].width = w

    c_headers = ["Provider Option", "Environment Variables", "Usage Notes"]
    for i, h in enumerate(c_headers):
        c = tbl_cloud.cell(0, i)
        set_cell_background(c, "174C72")
        p = c.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        r.font.size = Pt(9.5)
        set_cell_margins(c, 80, 80, 100, 100)

    cloud_data = [
        ("Twilio WhatsApp (Recommended for testing)",
         "WHATSAPP_PROVIDER=twilio\nTWILIO_ACCOUNT_SID=AC...\nTWILIO_AUTH_TOKEN=...\nTWILIO_WHATSAPP_NUMBER=+14155238886",
         "Join the Twilio WhatsApp sandbox on your mobile by sending the sandbox code to +1 415 523 8886. Works immediately with zero verification delays."),
        ("Meta WhatsApp Cloud API (Production)",
         "WHATSAPP_PROVIDER=meta\nMETA_WHATSAPP_TOKEN=EAAG...\nMETA_PHONE_NUMBER_ID=1029384756...",
         "Direct official WhatsApp Business API hosted by Meta. Requires a Meta Developer App and registered Phone Number ID."),
        ("SendGrid REST API",
         "EMAIL_PROVIDER=sendgrid\nSENDGRID_API_KEY=SG...\nSMTP_FROM_EMAIL=bookings@swattourism.pk\nSMTP_FROM_NAME=\"Swat Tourism Platform\"",
         "Enterprise transactional email delivery with 99.8% inbox deliverability and bounce handling."),
        ("Standard SMTP (e.g. Gmail / Outlook)",
         "EMAIL_PROVIDER=smtp\nSMTP_HOST=smtp.gmail.com\nSMTP_PORT=587\nSMTP_USER=your_email@gmail.com\nSMTP_PASSWORD=google_app_password\nSMTP_FROM_EMAIL=your_email@gmail.com",
         "Direct STARTTLS delivery. For Gmail, generate a 16-character App Password under Google Account Security > 2-Step Verification.")
    ]

    for row_idx, row_d in enumerate(cloud_data, start=1):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(row_d):
            c = tbl_cloud.cell(row_idx, col_idx)
            set_cell_background(c, bg)
            p = c.paragraphs[0]
            r = p.add_run(text)
            r.font.size = Pt(8.5)
            if col_idx == 1:
                r.font.name = "Consolas"
            set_cell_margins(c, 70, 70, 90, 90)

    doc.add_paragraph().paragraph_format.space_before = Pt(8)

    # Section 4: Production Best Practices & Architecture Recommendations
    h4 = doc.add_paragraph()
    r4 = h4.add_run("4. Suggested Production Implementation & Architectural Best Practices")
    r4.font.size = Pt(13.5)
    r4.font.bold = True
    r4.font.color.rgb = RGBColor(23, 76, 114)

    best_practices = [
        ("1. Background Asynchronous Workers (Celery / Redis / BackgroundTasks):",
         "Do not block the main HTTP request thread during create_booking while waiting for third-party cloud API responses. Use FastAPI BackgroundTasks or a Celery task queue to process dispatches asynchronously with automatic exponential backoff retry policies."),
        ("2. Real-Time Delivery Webhook (DLR Tracking):",
         "Implement an incoming webhook endpoint (e.g. /api/v1/communications/whatsapp/webhook) to receive delivery status receipts from Meta/Twilio (sent, delivered, read, failed). Store receipts in a dedicated communication_logs table for KPCTA compliance audits."),
        ("3. Pre-Approved WhatsApp Business Templates (HSM):",
         "In production with Meta WhatsApp Cloud API, initiating a conversation with a tourist outside the 24-hour service window requires pre-approved Highly Structured Message (HSM) templates. Submit the 4 templates through Meta Business Manager for approval."),
        ("4. Number Formatting & Fallback Resilience:",
         "Keep the automatic normalization logic active (e.g. converting local '03xx' numbers to E.164 '+923xx'). If WhatsApp delivery encounters an unregistered number or carrier block, automatically fall back to telecom SMS dispatch."),
        ("5. Security & PII Protection:",
         "Ensure tourist identity numbers (CNIC / Passport) and credit card payment tokens are never included in plain WhatsApp or email bodies. All sensitive information should remain gated behind the encrypted QR pass code and secure portal authentication.")
    ]

    for bp_title, bp_desc in best_practices:
        p_bp = doc.add_paragraph()
        r_bp = p_bp.add_run(f"• {bp_title}\n")
        r_bp.bold = True
        r_bp.font.color.rgb = RGBColor(0, 122, 85)
        p_bp.add_run(bp_desc)

    out_path = os.path.join(os.path.dirname(__file__), "swat-tourism-communications-testing-guide-and-best-practices.docx")
    doc.save(out_path)
    print(f"Successfully generated DOCX: {out_path}")

if __name__ == "__main__":
    create_document()
