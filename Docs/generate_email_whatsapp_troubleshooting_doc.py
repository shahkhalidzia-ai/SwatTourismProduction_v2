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
    r_t = p.add_run(f"★ {title}\n")
    r_t.bold = True
    r_t.font.name = "Calibri"
    r_t.font.size = Pt(11)
    r_t.font.color.rgb = RGBColor(10, 77, 104)
    
    r_b = p.add_run(text)
    r_b.font.name = "Calibri"
    r_b.font.size = Pt(10)
    r_b.font.color.rgb = RGBColor(71, 85, 105)
    
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(0)
    p_sp.paragraph_format.space_after = Pt(4)

def build_docx():
    doc = Document()
    
    for s in doc.sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)
        
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(3)
    t_run = title_p.add_run("Hotel Booking Confirmation: Delivery & Live Setup Guide")
    t_run.bold = True
    t_run.font.name = "Calibri"
    t_run.font.size = Pt(22)
    t_run.font.color.rgb = RGBColor(10, 77, 104)
    
    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(14)
    s_run = sub_p.add_run("Swat Tourism Platform (STP) — Troubleshooting, Instant 1-Click Dispatch & Gateway Setup")
    s_run.font.name = "Calibri"
    s_run.font.size = Pt(11.5)
    s_run.font.italic = True
    s_run.font.color.rgb = RGBColor(100, 116, 139)

    add_callout(
        doc,
        "Issue Resolution Summary",
        "The confirmation badge ('✓ WhatsApp & Email Sent') appeared because the backend successfully triggered "
        "the dispatch routine and recorded the event as DELIVERED in the system audit logs. In the default development "
        "environment, the system operates in Mock Sandbox mode. Live delivery to real inboxes/phones requires either "
        "using the 1-click front desk action buttons or configuring live SMTP and Meta WhatsApp Cloud API credentials."
    )

    # Section 1
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(4)
    r = h1.add_run("1. Root Cause Analysis: Mock Provider vs. Live Internet Delivery")
    r.bold = True
    r.font.name = "Calibri"
    r.font.size = Pt(15)
    r.font.color.rgb = RGBColor(10, 77, 104)

    p1 = doc.add_paragraph()
    p1.paragraph_format.space_after = Pt(6)
    p1.add_run(
        "By design, the platform backend initializes with EMAIL_PROVIDER='mock' and WHATSAPP_PROVIDER='mock' in "
        "backend/app/core/config.py. This ensures tests and prototype demonstrations execute without requiring "
        "commercial API keys or incurring telecommunication costs.\n\n"
        "• What Occurred: The backend executed CommunicationDispatcher.dispatch_booking_accepted, formatted the templates, "
        "and logged them with status 'DELIVERED' in the platform audit logs (/api/v1/communications/*).\n"
        "• What Did Not Occur: Because no live third-party mail server (e.g., Gmail/SendGrid) or Meta WhatsApp Cloud API "
        "was configured in the environment, no physical transmission occurred over the internet to Yahoo Mail or cellular networks."
    )

    # Section 2: Case Study Table
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(12)
    h2.paragraph_format.space_after = Pt(4)
    r = h2.add_run("2. Case Study: Sara Swati Verified (#SWT-DDC8J2)")
    r.bold = True
    r.font.name = "Calibri"
    r.font.size = Pt(15)
    r.font.color.rgb = RGBColor(10, 77, 104)

    tbl = doc.add_table(rows=7, cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    set_table_borders(tbl)
    
    col_w = [Inches(2.4), Inches(4.4)]
    case_rows = [
        ("Booking Reference", "#SWT-DDC8J2"),
        ("Guest Name", "Sara Swati Verified"),
        ("Tourist Email", "skhalidzia@yahoo.com"),
        ("Tourist Phone & WhatsApp", "+923444413869"),
        ("Assigned Room Unit", "Room 110 (Standard Twin Room)"),
        ("Stay Schedule", "2026-11-04 to 2026-11-05 (1 Night, 2 Guests)"),
        ("Folio Ledger", "Total: PKR 12,000 | Deposit: PKR 3,000 | Balance Due: PKR 9,000")
    ]
    for row_idx, (k, v) in enumerate(case_rows):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate([k, v]):
            c = tbl.cell(row_idx, col_idx)
            c.width = col_w[col_idx]
            set_cell_background(c, bg)
            set_cell_margins(c, top=80, bottom=80, left=100, right=100)
            p = c.paragraphs[0]
            r = p.add_run(text)
            r.font.name = "Calibri"
            r.font.size = Pt(9.5)
            if col_idx == 0:
                r.bold = True
                r.font.color.rgb = RGBColor(10, 77, 104)

    # Section 3: Immediate 1-Click Front Desk Actions
    h3 = doc.add_paragraph()
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(4)
    r = h3.add_run("3. Immediate Solution: Direct 1-Click Sending from Front Desk")
    r.bold = True
    r.font.name = "Calibri"
    r.font.size = Pt(15)
    r.font.color.rgb = RGBColor(10, 77, 104)

    p3 = doc.add_paragraph()
    p3.paragraph_format.space_after = Pt(6)
    p3.add_run(
        "On the hotel booking card toolbar, two dedicated buttons allow front desk staff to transmit real messages "
        "directly to the tourist without needing any backend server credentials:"
    )

    b1 = doc.add_paragraph(style='List Bullet')
    b1.paragraph_format.space_after = Pt(2)
    r1 = b1.add_run("Green [WhatsApp] Button: ")
    r1.bold = True
    b1.add_run(
        "Directly opens WhatsApp Web / App targeting https://wa.me/923444413869 with the complete reservation letter, "
        "room assignment (Room 110), balance due (PKR 9,000), and digital voucher URL pre-filled. Hitting 'Send' immediately delivers it to Sara's phone."
    )

    b2 = doc.add_paragraph(style='List Bullet')
    b2.paragraph_format.space_after = Pt(2)
    r2 = b2.add_run("Blue [Email] Button: ")
    r2.bold = True
    b2.add_run(
        "Directly opens your default email client (Outlook, Apple Mail, or webmail) pre-addressed to skhalidzia@yahoo.com "
        "with subject 'Booking Confirmation: SWT-DDC8J2 - Swat Serena Hotel' and the full formal reservation breakdown pre-composed. Hitting 'Send' delivers it straight to her inbox."
    )

    # Section 4: Live Automated Gateway Configuration
    h4 = doc.add_paragraph()
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(4)
    r = h4.add_run("4. Automated Background Gateway Setup (.env Configuration)")
    r.bold = True
    r.font.name = "Calibri"
    r.font.size = Pt(15)
    r.font.color.rgb = RGBColor(10, 77, 104)

    p4 = doc.add_paragraph()
    p4.paragraph_format.space_after = Pt(6)
    p4.add_run(
        "To enable the backend server to dispatch real emails and WhatsApp messages automatically when 'Accept' is clicked, "
        "add the following credentials to your project .env file:"
    )

    add_callout(
        doc,
        "Configuration: Real Automated Email (Gmail SMTP Example)",
        "EMAIL_PROVIDER=\"smtp\"\n"
        "SMTP_HOST=\"smtp.gmail.com\"\n"
        "SMTP_PORT=587\n"
        "SMTP_USER=\"your-email@gmail.com\"\n"
        "SMTP_PASSWORD=\"your-16-character-app-password\"\n"
        "SMTP_FROM_EMAIL=\"bookings@swattourism.pk\"\n"
        "SMTP_FROM_NAME=\"Swat Serena Hotel Front Desk\""
    )

    add_callout(
        doc,
        "Configuration: Real Automated WhatsApp (Meta Cloud API or Twilio)",
        "# Meta WhatsApp Business Cloud API\n"
        "WHATSAPP_PROVIDER=\"meta\"\n"
        "META_WHATSAPP_TOKEN=\"your_meta_system_user_access_token\"\n"
        "META_PHONE_NUMBER_ID=\"your_meta_phone_number_id\"\n\n"
        "# OR Twilio Programmable Messaging\n"
        "# WHATSAPP_PROVIDER=\"twilio\"\n"
        "# TWILIO_ACCOUNT_SID=\"your_twilio_sid\"\n"
        "# TWILIO_AUTH_TOKEN=\"your_twilio_token\"\n"
        "# TWILIO_WHATSAPP_NUMBER=\"+14155238886\""
    )

    # Section 5: Code Improvements
    h5 = doc.add_paragraph()
    h5.paragraph_format.space_before = Pt(14)
    h5.paragraph_format.space_after = Pt(4)
    r = h5.add_run("5. Summary of System Improvements")
    r.bold = True
    r.font.name = "Calibri"
    r.font.size = Pt(15)
    r.font.color.rgb = RGBColor(10, 77, 104)

    improvements = [
        ("Backend Schema", "Updated BookingBriefTourist in backend/app/modules/bookings/schemas.py to include phone and whatsapp_number."),
        ("Frontend Mapper", "Updated BookingRow in frontend/src/modules/business/BusinessShell.tsx to carry touristPhone and touristEmail."),
        ("Front Desk Buttons", "Updated HotelTodayScreen.tsx and HotelFolioReceiptModal.tsx so clicking [WhatsApp] automatically populates Sara's real phone (+923444413869).")
    ]
    for imp_t, imp_d in improvements:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(2)
        r_bt = bp.add_run(f"{imp_t}: ")
        r_bt.bold = True
        bp.add_run(imp_d)

    out_path = r"F:\Antigravity\SwatTourismProduction_v2\Docs\hotel-booking-email-whatsapp-troubleshooting-and-live-setup-guide.docx"
    doc.save(out_path)
    print(f"Successfully generated DOCX at: {out_path}")

if __name__ == "__main__":
    build_docx()
