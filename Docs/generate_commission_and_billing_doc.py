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
    
    # Page setup
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
    r1.font.size = Pt(18)
    r1.font.color.rgb = RGBColor(255, 255, 255)
    
    r2 = p_t.add_run("Commission, Invoicing, Payments & Owner Financial Control Architecture")
    r2.font.name = "Arial"
    r2.font.size = Pt(12)
    r2.font.color.rgb = RGBColor(204, 251, 241)
    
    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_before = Pt(8)
    p_meta.paragraph_format.space_after = Pt(12)
    p_meta.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_meta = p_meta.add_run("Doc Ref: STP-FIN-ARCH-2026-V1  |  Status: Strategic Blueprint  |  KP Tourism Authority")
    r_meta.font.name = "Arial"
    r_meta.font.size = Pt(8.5)
    r_meta.font.italic = True
    r_meta.font.color.rgb = RGBColor(100, 116, 139)
    
    # Callout
    add_callout(
        doc,
        "Strategic Purpose & Global Benchmark",
        "This specification establishes the financial engine of the Swat Tourism Platform (STP). "
        "It models Booking.com's dual model (Agency Model vs. Merchant Model) customized for Pakistan's payment "
        "ecosystem (Cash on Arrival, 1Link 1Bill, SBP Raast, JazzCash, Easypaisa) and outlines the complete "
        "command & control mechanisms available to the Platform Owner.",
        bg_color="F0FDF4",
        border_color="059669"
    )
    
    # Section 1
    h1 = doc.add_heading(level=1)
    r = h1.add_run("1. Benchmark: How Booking.com's Dual Model Works")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(15, 118, 110)
    
    p = doc.add_paragraph(
        "Booking.com processes tens of billions in annual gross bookings across two distinct financial flows:\n"
        "1. Agency Model (Pay at Property): The traveler pays 100% directly to the hotel upon check-in (in cash or front desk POS). "
        "At the end of each calendar month, Booking.com calculates the total commission owed (typically 15%) and sends a consolidated "
        "invoice. The hotel has a 10-day payment window to pay Booking.com via direct debit, wire transfer, or credit card.\n"
        "2. Merchant Model (Payments by Booking.com): The traveler pays 100% online at booking time. Booking.com withholds its 15% "
        "commission immediately and remits the remaining 85% net balance to the accommodation after check-out via automated bank "
        "transfer or Virtual Credit Card (VCC)."
    )
    p.runs[0].font.name = "Arial"
    p.runs[0].font.size = Pt(9.5)
    
    # Section 2
    h2 = doc.add_heading(level=1)
    r = h2.add_run("2. Recommended Commission Structure by Vertical")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(15, 118, 110)
    
    p2 = doc.add_paragraph(
        "Because tourism verticals operate on vastly different profit margins in Swat (e.g. 4x4 mountain jeeps face heavy fuel "
        "and mechanical depreciation compared to luxury resorts), a flat commission across all operators is counter-productive. "
        "STP employs differentiated commission tiers:"
    )
    p2.runs[0].font.name = "Arial"
    p2.runs[0].font.size = Pt(9.5)
    
    tbl_tiers = doc.add_table(rows=5, cols=4)
    format_table(
        tbl_tiers,
        [Inches(1.5), Inches(1.1), Inches(2.6), Inches(1.6)],
        ["Business Vertical", "Commission", "Operational Rationale", "Billing Cycle"],
        [
            ["Hotels & Resorts", "10% – 12%", "Lower than Booking.com's 15% to attract local Mingora, Malam Jabba, and Kalam hoteliers.", "Monthly Invoice (Cash) / 48h post-stay (Online)"],
            ["Transport / 4x4 Jeeps", "5% – 7%", "Tight margins due to high petrol/diesel and mountain suspension wear (Mahodand, Gabral).", "Weekly settlement (or instant split on pre-paid)"],
            ["Tour Guides & Porters", "8% – 10%", "Service-driven with low direct overhead. Empowers certified local youth and mountaineers.", "Released 24h after tour completion verification"],
            ["Restaurants & Cafes", "5%", "Applied to table reservations and pre-ordered group meal packages.", "Fortnightly / Monthly Invoice"]
        ]
    )
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    
    # Section 3
    h3 = doc.add_heading(level=1)
    r = h3.add_run("3. Dual Billing & Settlement Execution Channels")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(15, 118, 110)
    
    add_callout(
        doc,
        "Channel A: Cash on Arrival (Over 65% of Pakistani Domestic Market)",
        "Step 1: Guest arrives and pays 100% cash to the hotel or driver.\n"
        "Step 2: On the 1st of each month, the system generates an itemized Commission Invoice.\n"
        "Step 3: Invoice includes a 1Link 1Bill Consumer Number, JazzCash/Easypaisa QR, and IBFT details.\n"
        "Step 4: Invoice is delivered via WhatsApp and Email directly to the owner and front desk.\n"
        "Step 5: Operator pays via mobile banking by the 15th. 1Link webhook auto-marks the invoice PAID.",
        bg_color="F8FAFC",
        border_color="028AC8"
    )
    
    add_callout(
        doc,
        "Channel B: Online Pre-Paid Bookings (Automatic Withholding & Raast Disbursement)",
        "Step 1: Tourist pays PKR 10,000 online via Card, JazzCash, Easypaisa, or Raast QR.\n"
        "Step 2: Platform Gateway withholds 10% commission (PKR 1,000) immediately.\n"
        "Step 3: Net 90% (PKR 9,000) is held in the STP Master Escrow Account during the stay.\n"
        "Step 4: 24 to 48 hours post-checkout, the system automatically disburses PKR 9,000 to the operator's Pakistani bank account via SBP Raast (zero wire fee).",
        bg_color="F0FDF4",
        border_color="059669"
    )
    
    # Section 4
    h4 = doc.add_heading(level=1)
    r = h4.add_run("4. How the Platform Owner Controls Payments & Commissions")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(15, 118, 110)
    
    p4 = doc.add_paragraph(
        "The Platform Owner (Super Admin / Tourism Authority) has complete command over money flows, partner "
        "rates, escrow holdings, and delinquency enforcement:"
    )
    p4.runs[0].font.name = "Arial"
    p4.runs[0].font.size = Pt(9.5)
    
    tbl_controls = doc.add_table(rows=6, cols=3)
    format_table(
        tbl_controls,
        [Inches(1.8), Inches(2.3), Inches(2.7)],
        ["Control Domain", "Owner Power & Capability", "Operational Impact"],
        [
            ["Dynamic Commission Sliders", "Adjust vertical rates (e.g. 10% -> 12%) or set partner overrides (e.g. 7.5% for Serena).", "Maximizes revenue while accommodating key enterprise partners."],
            ["Automated Balance Offsetting", "Auto-offset what STP owes an operator for online bookings against what the operator owes STP for cash bookings.", "Eliminates redundant wire transfers; settles balances with zero friction."],
            ["Maker-Checker Payout Approval", "Payout batches exceeding PKR 50,000 require secondary OTP approval by the Owner.", "Guards against unauthorized withdrawals or accounting errors."],
            ["Instant Freeze / Hold Button", "Freeze vendor funds in escrow if a tourist files a fraud, breakdown, or safety complaint.", "Protects tourists and platform reputation until an inquiry is complete."],
            ["Graduated Delinquency Matrix", "Automated sequence from gentle WhatsApp reminders (Day 10) to search demotion (Day 20) to Instant Reserve lock (Day 25).", "Ensures high invoice collection rates without permanent partner churn."]
        ]
    )
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    
    # Section 5
    h5 = doc.add_heading(level=1)
    r = h5.add_run("5. Dispute, No-Show & Fraud Arbitration")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(15, 118, 110)
    
    p5 = doc.add_paragraph(
        "To prevent operators from falsely claiming 'Guest did not show up' to evade paying platform commissions, "
        "STP introduces a 3-point cross-verification framework:\n"
        "• 48-Hour Reporting Window: Operators must report no-shows within 48 hours of scheduled check-in.\n"
        "• Automated Tourist Verification: The system triggers a 1-tap WhatsApp prompt to the tourist: 'Did you check into Hotel X?'\n"
        "• Owner Fraud Console: In cases of discrepancy (tourist confirmed stay, hotel claimed no-show), the platform flags the booking for human arbitration, preventing commission loss."
    )
    p5.runs[0].font.name = "Arial"
    p5.runs[0].font.size = Pt(9.5)
    
    # Section 6
    h6 = doc.add_heading(level=1)
    r = h6.add_run("6. KPRA Tax Compliance & Provincial Reporting")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(15, 118, 110)
    
    p6 = doc.add_paragraph(
        "Under Khyber Pakhtunkhwa Revenue Authority (KPRA) guidelines for digital marketplace aggregators, the platform automatically:\n"
        "1. Computes KPRA Sales Tax on Services on the platform's retained commission amount.\n"
        "2. Generates compliant tax invoices displaying official NTN and KPRA registration numbers.\n"
        "3. Produces downloadable quarterly audit ledgers ready for submission to the provincial revenue department."
    )
    p6.runs[0].font.name = "Arial"
    p6.runs[0].font.size = Pt(9.5)
    
    output_path = os.path.abspath("Docs/swat-tourism-commission-billing-and-payouts-architecture.docx")
    doc.save(output_path)
    print(f"Successfully generated DOCX at: {output_path}")

if __name__ == "__main__":
    main()
