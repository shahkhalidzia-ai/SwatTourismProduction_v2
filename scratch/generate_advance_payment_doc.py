import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def add_callout(doc, text_prefix, text_body, border_color="0A4D68", fill_color="F0F7FA"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, fill_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    tcPr = cell._element.get_or_add_tcPr()
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="none"/>
            <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>
            <w:bottom w:val="none"/>
            <w:right w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    run1 = p.add_run(text_prefix + " ")
    run1.bold = True
    run1.font.name = "Calibri"
    run1.font.size = Pt(10)
    run1.font.color.rgb = RGBColor(0x0A, 0x4D, 0x68)
    
    run2 = p.add_run(text_body)
    run2.font.name = "Calibri"
    run2.font.size = Pt(10)
    run2.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def format_table_headers(table, headers, fill_hex="0A4D68", col_widths=None):
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], fill_hex)
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.name = "Calibri"
            run.font.size = Pt(9.5)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        if col_widths and i < len(col_widths):
            hdr_cells[i].width = Inches(col_widths[i])

def format_table_rows(table, data, col_widths=None, alternate_fill=True):
    for r_idx, row_data in enumerate(data):
        row_cells = table.add_row().cells
        fill_hex = "F4F8FA" if (r_idx % 2 == 1 and alternate_fill) else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            row_cells[c_idx].text = str(val)
            set_cell_background(row_cells[c_idx], fill_hex)
            set_cell_margins(row_cells[c_idx], top=100, bottom=100, left=140, right=140)
            p = row_cells[c_idx].paragraphs[0]
            for run in p.runs:
                run.font.name = "Calibri"
                run.font.size = Pt(9)
                run.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)
            if col_widths and c_idx < len(col_widths):
                row_cells[c_idx].width = Inches(col_widths[c_idx])

def build_advance_doc():
    doc = Document()
    
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)
        
        header = section.header
        hp = header.paragraphs[0]
        hp.text = "Swat Tourism Platform v2.0 | Advance Payment & Confirmation Policy"
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hp.runs[0].font.name = "Calibri"
        hp.runs[0].font.size = Pt(8.5)
        hp.runs[0].font.color.rgb = RGBColor(0x88, 0x88, 0x88)
        
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.text = "Department of Tourism & Culture, Government of Khyber Pakhtunkhwa"
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        fp.runs[0].font.name = "Calibri"
        fp.runs[0].font.size = Pt(8.5)
        fp.runs[0].font.color.rgb = RGBColor(0x99, 0x99, 0x99)

    # Title
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(2)
    run_title = title_p.add_run("Advance Payment & Booking Confirmation Policy")
    run_title.font.name = "Calibri"
    run_title.font.size = Pt(22)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(0x0A, 0x4D, 0x68)

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(12)
    run_sub = sub_p.add_run("Operational Models for Full Payment, Partial Deposits, and Pay-on-Arrival Guarantees")
    run_sub.font.name = "Calibri"
    run_sub.font.size = Pt(12.5)
    run_sub.font.italic = True
    run_sub.font.color.rgb = RGBColor(0x08, 0x83, 0x95)

    # Metadata
    meta_tbl = doc.add_table(rows=3, cols=2)
    meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_tbl.autofit = False
    meta_data = [
        ("Platform:", "Swat Tourism Platform (STP) Production v2.0"),
        ("Policy Scope:", "Advance Payment Models, Front-Desk Balance Calculation, Cancellation & Refunds"),
        ("Date & Status:", "October 2026 | Approved Architecture Baseline"),
    ]
    for r_idx, (k, v) in enumerate(meta_data):
        c0 = meta_tbl.cell(r_idx, 0)
        c1 = meta_tbl.cell(r_idx, 1)
        c0.width = Inches(1.8)
        c1.width = Inches(4.7)
        set_cell_background(c0, "EBF4F6")
        set_cell_background(c1, "F8FAFC")
        set_cell_margins(c0, top=60, bottom=60, left=100, right=100)
        set_cell_margins(c1, top=60, bottom=60, left=100, right=100)
        
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_after = Pt(0)
        r0 = p0.add_run(k)
        r0.font.name = "Calibri"
        r0.font.bold = True
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = RGBColor(0x0A, 0x4D, 0x68)
        
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(0)
        r1 = p1.add_run(v)
        r1.font.name = "Calibri"
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # 1. Core Question & Verdict
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(4)
    run_h1 = h1.add_run("1. Is Advance Payment Required for Booking Confirmation?")
    run_h1.font.name = "Calibri"
    run_h1.font.size = Pt(15)
    run_h1.font.bold = True
    run_h1.font.color.rgb = RGBColor(0x0A, 0x4D, 0x68)

    p1 = doc.add_paragraph()
    p1.paragraph_format.line_spacing = 1.15
    p1.paragraph_format.space_after = Pt(6)
    r1 = p1.add_run(
        "Yes, the Swat Tourism Platform implements a flexible, multi-tiered commercial policy. Depending on the season, "
        "the vendor type, and the valley location, booking confirmation can occur under three distinct advance payment mechanisms: "
        "(1) Full 100% Advance Payment, (2) Partial Advance Deposit (20% to 30%), or (3) Pay-on-Arrival with Reservation Guarantee."
    )
    r1.font.name = "Calibri"
    r1.font.size = Pt(10)
    r1.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)

    add_callout(
        doc,
        "Database Architecture Baseline:",
        "The underlying backend schema in app/modules/bookings/models.py natively supports this requirement through two core fields: "
        "'deposit_amount: Numeric(12, 2)' and 'payment_status IN ('unpaid', 'deposit_paid', 'paid', 'refunded')'. "
        "When an advance deposit is paid, the reservation shifts to status='confirmed' and payment_status='deposit_paid', "
        "reserving the room on the physical room rack immediately."
    )

    # 2. Detailed Commercial Models Table
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(12)
    h2.paragraph_format.space_after = Pt(4)
    run_h2 = h2.add_run("2. Commercial Models Comparison Matrix")
    run_h2.font.name = "Calibri"
    run_h2.font.size = Pt(15)
    run_h2.font.bold = True
    run_h2.font.color.rgb = RGBColor(0x0A, 0x4D, 0x68)

    adv_tbl = doc.add_table(rows=1, cols=4)
    adv_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    adv_tbl.autofit = False
    adv_headers = ["Payment Model", "Advance Upfront", "Confirmation State", "Front-Desk Balance Due"]
    adv_widths = [1.5, 1.4, 2.1, 1.5]
    format_table_headers(adv_tbl, adv_headers, fill_hex="0A4D68", col_widths=adv_widths)

    adv_data = [
        (
            "1. Full Advance Payment\n(100% Upfront)",
            "100% of booking total charged via Easypaisa, JazzCash, Card, or Raast.",
            "• status: 'confirmed'\n• payment_status: 'paid'\n• Confirmed immediately upon gateway webhook confirmation.",
            "Balance Due: PKR 0\nGuest checked in without financial collection."
        ),
        (
            "2. Partial Advance Deposit\n(20% - 30% or 1st Night)",
            "Partial amount charged upfront (e.g. PKR 6,000 on a PKR 24,000 reservation).",
            "• status: 'confirmed'\n• payment_status: 'deposit_paid'\n• deposit_amount: recorded\n• Room is secured on hotel rack.",
            "Balance Due: PKR 18,000\nFront desk collects remaining balance at check-in or checkout."
        ),
        (
            "3. Pay on Arrival\n(0% Advance Guarantee)",
            "PKR 0 charged upfront. Reservation held via verified mobile / CNIC or card guarantee.",
            "• status: 'confirmed'\n• payment_status: 'unpaid'\n• Guaranteed voucher issued with check-in cancellation cut-off.",
            "Balance Due: PKR 24,000\nFull payment collected at hotel reception desk."
        ),
    ]
    format_table_rows(adv_tbl, adv_data, col_widths=adv_widths)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 3. Operational Requirements & Front-Desk Workflow
    h3 = doc.add_paragraph()
    h3.paragraph_format.space_before = Pt(12)
    h3.paragraph_format.space_after = Pt(4)
    run_h3 = h3.add_run("3. Front-Desk Balance Calculation & UI Workflow")
    run_h3.font.name = "Calibri"
    run_h3.font.size = Pt(15)
    run_h3.font.bold = True
    run_h3.font.color.rgb = RGBColor(0x0A, 0x4D, 0x68)

    p_wf = doc.add_paragraph()
    p_wf.paragraph_format.line_spacing = 1.15
    p_wf.paragraph_format.space_after = Pt(4)
    r_wf = p_wf.add_run(
        "• Balance Due Calculation: On HotelTodayScreen.tsx, the folio ledger automatically calculates:\n"
        "  Balance Due = Total Amount - Deposit Amount + In-Stay Incidentals\n"
        "• Example: A 2-night stay at Swat Serena Hotel totaling PKR 24,000 with a 25% deposit paid (PKR 6,000) displays:\n"
        "  'Deposit Paid: PKR 6,000 | Balance Due at Reception: PKR 18,000'.\n"
        "• Check-In Collection: Staff verify identity, collect the remaining PKR 18,000 via cash or card terminal, and click 'Check In Guest'.\n"
        "• Cancellation & Refund Rule: Cancellations made > 48 hours prior to check-in receive a 100% deposit refund; cancellations under 48 hours forfeit the deposit to compensate the hotel for held room inventory."
    )
    r_wf.font.name = "Calibri"
    r_wf.font.size = Pt(9.5)
    r_wf.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Save document
    output_dir = "Docs"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "swat-tourism-advance-payment-and-booking-confirmation-policy.docx")
    doc.save(output_path)
    print(f"Successfully generated standalone Word Document at: {output_path}")

if __name__ == "__main__":
    build_advance_doc()
