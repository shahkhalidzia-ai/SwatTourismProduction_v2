import os
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
    t_run = title_p.add_run("Hotel Portal: Booking Confirmation Sharing & Verification Guide")
    t_run.bold = True
    t_run.font.name = "Calibri"
    t_run.font.size = Pt(22)
    t_run.font.color.rgb = RGBColor(10, 77, 104) # #0A4D68
    
    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(14)
    s_run = sub_p.add_run("Swat Tourism Platform (STP) — Front Desk Operations, Multi-Channel Gateway & Delivery Audit")
    s_run.font.name = "Calibri"
    s_run.font.size = Pt(11.5)
    s_run.font.italic = True
    s_run.font.color.rgb = RGBColor(100, 116, 139)

    add_callout(
        doc,
        "Operational Summary",
        "This guide covers how hotel managers share booking confirmations with tourists via WhatsApp and Email, "
        "and how front desk staff can confirm delivery through visual badges on the booking card, live API audit logs, "
        "and direct 1-click sharing buttons."
    )

    # Section 1
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(4)
    r = h1.add_run("1. How Booking Confirmation is Shared with the Tourist")
    r.bold = True
    r.font.name = "Calibri"
    r.font.size = Pt(15)
    r.font.color.rgb = RGBColor(10, 77, 104)

    p1 = doc.add_paragraph()
    p1.paragraph_format.space_after = Pt(6)
    p1.add_run(
        "The platform implements a coordinated dual-layer sharing architecture combining Automated Gateway Dispatch "
        "(zero-click server triggers) and Direct Front-Desk Sharing (manual 1-click on-demand triggers)."
    )

    # Subsection A
    h2a = doc.add_paragraph()
    h2a.paragraph_format.space_before = Pt(8)
    h2a.paragraph_format.space_after = Pt(2)
    r = h2a.add_run("A. Automated Multi-Channel Dispatch (Zero-Click Gateway Trigger)")
    r.bold = True
    r.font.name = "Calibri"
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(8, 131, 149)

    bullet_data_a = [
        ("Action Trigger", "When the hotel manager clicks 'Accept & Assign Room' on the Hotel Today Screen, the backend immediately executes accept_booking and invokes CommunicationDispatcher.dispatch_booking_accepted."),
        ("WhatsApp Official Voucher", "Automatically sends TEMPLATE_3_OFFICIAL_CONFIRMED_VOUCHER to the tourist's verified phone/WhatsApp (+923444413869). Includes Booking Reference (SWT-B3S01T), Hotel Name, Room Number, Check-in/out dates, Total Cost, Balance Due, digital voucher link, and KPCTA QR Code verification token."),
        ("Branded Email Voucher", "Sends a high-resolution HTML confirmation voucher to skhalidzia@yahoo.com containing official hotel branding, front desk hotline, GPS directions, and printable keycard arrival pass."),
        ("Cellular SMS", "Dispatches a telecom SMS confirmation message with the booking reference and summary for offline peace of mind."),
        ("In-App Notification", "Updates the tourist portal with a push notification informing the traveler that their stay has been accepted.")
    ]
    for b_title, b_desc in bullet_data_a:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(2)
        r_bt = bp.add_run(f"{b_title}: ")
        r_bt.bold = True
        bp.add_run(b_desc)

    # Subsection B
    h2b = doc.add_paragraph()
    h2b.paragraph_format.space_before = Pt(8)
    h2b.paragraph_format.space_after = Pt(2)
    r = h2b.add_run("B. Direct 1-Click Front Desk Sharing (Manual / On-Demand)")
    r.bold = True
    r.font.name = "Calibri"
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(8, 131, 149)

    bullet_data_b = [
        ("Booking Card Toolbar", "On the Hotel Today Screen, right next to 'Arrival Key Pass' and 'Tax Invoice & Receipt', two dedicated buttons allow 1-click sharing: [WhatsApp] opens wa.me/<tourist_phone> prefilled with the confirmation message, and [Email] opens mailto:<tourist_email> prefilled with the formal reservation letter."),
        ("Arrival Key Pass & Folio Modal", "Inside HotelFolioReceiptModal, the top bar features direct [WhatsApp], [Email], and [Print] buttons so the receptionist can transmit the digital arrival pass and tax folio to the traveler while viewing the dossier.")
    ]
    for b_title, b_desc in bullet_data_b:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(2)
        r_bt = bp.add_run(f"{b_title}: ")
        r_bt.bold = True
        bp.add_run(b_desc)

    # Section 2
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(4)
    r = h2.add_run("2. How the Hotel Manager Confirms if Email & WhatsApp Were Sent")
    r.bold = True
    r.font.name = "Calibri"
    r.font.size = Pt(15)
    r.font.color.rgb = RGBColor(10, 77, 104)

    # Table of verification checkpoints
    table = doc.add_table(rows=4, cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    set_table_borders(table)

    col_widths = [Inches(1.5), Inches(1.8), Inches(1.6), Inches(1.9)]
    headers = ["Checkpoint", "Interface Location", "Verification Indicator", "Operational Details"]
    for i, h_text in enumerate(headers):
        c = table.cell(0, i)
        c.width = col_widths[i]
        set_cell_background(c, "0A4D68")
        set_cell_margins(c, top=100, bottom=100, left=120, right=120)
        p = c.paragraphs[0]
        r = p.add_run(h_text)
        r.bold = True
        r.font.name = "Calibri"
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(255, 255, 255)

    checkpoints = [
        ("1. Card Delivery Badge", "Hotel Today Screen (Booking Card Header)", "✓ WhatsApp & Email Sent (Green Badge)", "Appears immediately beside the guest's name and reference when accepted. Confirms that the automated gateway dispatched the confirmation."),
        ("2. Platform Audit Logs", "REST API & Admin Console (/communications/*)", "status: DELIVERED in audit log", "Real-time audit history records recipient target (+923444413869 / skhalidzia@yahoo.com), delivery timestamp, and template name."),
        ("3. Tourist Portal State", "Tourist 'My Bookings' Dashboard", "Accepted / Confirmed status + QR Voucher", "Tourist sees real-time status change with 1-click access to the digital verified voucher and QR code.")
    ]

    for row_idx, data in enumerate(checkpoints, start=1):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(data):
            c = table.cell(row_idx, col_idx)
            c.width = col_widths[col_idx]
            set_cell_background(c, bg)
            set_cell_margins(c, top=80, bottom=80, left=100, right=100)
            p = c.paragraphs[0]
            r = p.add_run(text)
            r.font.name = "Calibri"
            r.font.size = Pt(9.5)
            if col_idx == 0:
                r.bold = True

    # Section 3: Technical Architecture
    h3 = doc.add_paragraph()
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(4)
    r = h3.add_run("3. Technical Architecture & File Reference")
    r.bold = True
    r.font.name = "Calibri"
    r.font.size = Pt(15)
    r.font.color.rgb = RGBColor(10, 77, 104)

    tech_table = doc.add_table(rows=5, cols=3)
    tech_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    tech_table.autofit = False
    set_table_borders(tech_table)

    t_widths = [Inches(1.8), Inches(2.2), Inches(2.8)]
    t_headers = ["Component / Service", "File Location", "Responsibility"]
    for i, h_text in enumerate(t_headers):
        c = tech_table.cell(0, i)
        c.width = t_widths[i]
        set_cell_background(c, "088395")
        set_cell_margins(c, top=100, bottom=100, left=120, right=120)
        p = c.paragraphs[0]
        r = p.add_run(h_text)
        r.bold = True
        r.font.name = "Calibri"
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(255, 255, 255)

    tech_rows = [
        ("HotelTodayScreen", "frontend/src/modules/business/HotelTodayScreen.tsx", "Front desk dashboard with ✓ WhatsApp & Email Sent badge and direct 1-click sharing buttons."),
        ("HotelFolioReceiptModal", "frontend/src/modules/business/HotelFolioReceiptModal.tsx", "Guest Arrival Key Pass and Checkout Receipt modal with WhatsApp, Email, and Print triggers."),
        ("CommunicationDispatcher", "backend/app/modules/communications/dispatcher.py", "Central orchestrator triggering WhatsApp, Email, and SMS cascades on booking acceptance."),
        ("WhatsAppService & EmailService", "backend/app/modules/communications/*_service.py", "Dispatches WhatsApp Cloud/Twilio templates and branded HTML vouchers with live audit logging.")
    ]

    for row_idx, data in enumerate(tech_rows, start=1):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(data):
            c = tech_table.cell(row_idx, col_idx)
            c.width = t_widths[col_idx]
            set_cell_background(c, bg)
            set_cell_margins(c, top=80, bottom=80, left=100, right=100)
            p = c.paragraphs[0]
            r = p.add_run(text)
            r.font.name = "Calibri"
            r.font.size = Pt(9.5)
            if col_idx == 0:
                r.bold = True

    # Output path
    out_path = r"F:\Antigravity\SwatTourismProduction_v2\Docs\hotel-booking-confirmation-sharing-and-verification-guide.docx"
    doc.save(out_path)
    print(f"Successfully generated DOCX at: {out_path}")

if __name__ == "__main__":
    build_docx()
