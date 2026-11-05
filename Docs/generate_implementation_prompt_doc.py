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
    run_t = p.add_run(f"⚡ {title}\n")
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

def format_table(table, col_widths, headers, rows):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table, color="CBD5E1", sz="4")
    
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], "0F766E")
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
            run = p.add_run(val)
            run.font.name = "Arial"
            run.font.size = Pt(9)
            run.font.color.rgb = RGBColor(30, 41, 59)

def main():
    doc = Document()
    
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)
        
    # Title Banner
    tbl_title = doc.add_table(rows=1, cols=1)
    tbl_title.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = tbl_title.cell(0, 0)
    c.width = Inches(6.8)
    set_cell_background(c, "0F766E")
    set_cell_margins(c, top=200, bottom=200, left=240, right=240)
    
    p_t = c.paragraphs[0]
    p_t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r1 = p_t.add_run("SWAT TOURISM PLATFORM (STP)\n")
    r1.bold = True
    r1.font.name = "Arial"
    r1.font.size = Pt(17)
    r1.font.color.rgb = RGBColor(255, 255, 255)
    
    r2 = p_t.add_run("Implementation Prompt: Commission, Invoices & Owner Financial Control Engine")
    r2.font.name = "Arial"
    r2.font.size = Pt(11.5)
    r2.font.color.rgb = RGBColor(204, 251, 241)
    
    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_before = Pt(8)
    p_meta.paragraph_format.space_after = Pt(12)
    p_meta.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_meta = p_meta.add_run("Doc Ref: STP-COMM-INV-PROMPT-2026 | Benchmark: Booking.com | Status: Ready for Execution")
    r_meta.font.name = "Arial"
    r_meta.font.size = Pt(8.5)
    r_meta.font.italic = True
    r_meta.font.color.rgb = RGBColor(100, 116, 139)
    
    add_callout(
        doc,
        "System Objective & Scope",
        "Implement the complete Commission, Invoicing, and Operator Payouts system based on Booking.com's dual model "
        "adapted for Pakistani banking rails (1Link 1Bill, SBP Raast, JazzCash, Easypaisa). Includes automated monthly "
        "invoices for Cash on Arrival stays, post-checkout Raast disbursements for online stays, and a centralized "
        "Financial Control Center for the Platform Owner.",
        bg_color="F0FDF4",
        border_color="059669"
    )
    
    # Section 1
    h1 = doc.add_heading(level=1)
    r = h1.add_run("1. Technical Architecture & Phased Implementation Plan")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(15, 118, 110)
    
    tbl_phases = doc.add_table(rows=5, cols=3)
    format_table(
        tbl_phases,
        [Inches(1.5), Inches(2.5), Inches(2.8)],
        ["Phase", "Component Deliverables", "Target Files & Focus"],
        [
            ["Phase 1: DB & Models", "CommissionTier, PartnerOverride, CommissionTransaction, MonthlyInvoice, OperatorPayout", "backend/app/modules/finance/models.py & schemas.py"],
            ["Phase 2: API Endpoints", "Commission CRUD, Monthly Invoicing Cron Job, 1Bill Mock Webhook, Raast Payout Engine, No-Show Arbitration", "backend/app/modules/finance/routes.py"],
            ["Phase 3: Operator UI", "Operator Earnings & Invoices Dashboard, 1Bill/JazzCash Payment Modal, 48h No-Show reporting button", "frontend/src/modules/business/OperatorEarningsInvoicesView.tsx"],
            ["Phase 4: Owner Console", "Super Admin Financial Command Center, Commission rate sliders, Escrow freeze button, Delinquency matrix", "frontend/src/modules/authority/OwnerFinancialControlCenter.tsx"]
        ]
    )
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    
    # Section 2
    h2 = doc.add_heading(level=1)
    r = h2.add_run("2. Differentiated Commission Rate Matrix")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(15, 118, 110)
    
    tbl_tiers = doc.add_table(rows=5, cols=3)
    format_table(
        tbl_tiers,
        [Inches(2.0), Inches(1.5), Inches(3.3)],
        ["Business Vertical", "Base Commission", "Settlement & Billing Mechanism"],
        [
            ["Hotels & Resorts", "10% – 12%", "Monthly Invoice for Cash; 48h post-checkout for Online"],
            ["Transport / 4x4 Jeeps", "5% – 7%", "Weekly settlement / instant split on online bookings"],
            ["Tour Guides & Porters", "8% – 10%", "Released 24h after trek completion confirmation"],
            ["Restaurants & Cafes", "5%", "Monthly invoice on table bookings and group food bundles"]
        ]
    )
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    
    # Section 3
    h3 = doc.add_heading(level=1)
    r = h3.add_run("3. Acceptance Criteria & Automated Testing Verification")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(15, 118, 110)
    
    p3 = doc.add_paragraph(
        "1. Backend Tests: Verify commission calculation for each vertical, monthly 1Bill invoice generation, balance net-offsetting, and no-show waivers.\n"
        "2. Frontend Tests: Verify operator invoice table rendering, 1Bill payment modal, authority rate sliders, and payout freeze controls.\n"
        "3. Live Integration: Verify end-to-end booking SWT-B3S01T flows cleanly into both the operator's folio and monthly invoice queue."
    )
    p3.runs[0].font.name = "Arial"
    p3.runs[0].font.size = Pt(9.5)
    
    output_path = os.path.abspath("Docs/swat-tourism-commission-payments-and-invoices-implementation-prompt.docx")
    doc.save(output_path)
    print(f"Successfully generated DOCX at: {output_path}")

if __name__ == "__main__":
    main()
