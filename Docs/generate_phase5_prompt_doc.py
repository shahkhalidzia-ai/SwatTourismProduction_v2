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
    
    r2 = p_t.add_run("Implementation Prompt: Phase 5 — Front-Desk Operations, Turnover & Verified Review Loop")
    r2.font.name = "Arial"
    r2.font.size = Pt(11.5)
    r2.font.color.rgb = RGBColor(204, 251, 241)
    
    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_before = Pt(8)
    p_meta.paragraph_format.space_after = Pt(12)
    p_meta.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_meta = p_meta.add_run("Doc Ref: STP-PHASE5-PROMPT-2026 | Focus: Front-Desk Turnover & Verified Reviews | Status: Ready")
    r_meta.font.name = "Arial"
    r_meta.font.size = Pt(8.5)
    r_meta.font.italic = True
    r_meta.font.color.rgb = RGBColor(100, 116, 139)
    
    add_callout(
        doc,
        "Phase 5 Mission & Scope",
        "Implement the complete hospitality operational lifecycle and customer feedback loop:\n"
        "1. Front-Desk Quick Actions: Check-in ('occupied'), Check-out ('cleaning'), and Housekeeping Ready ('available').\n"
        "2. Automated Post-Stay Review Invitations: 1-click WhatsApp and Email review links sent upon checkout.\n"
        "3. Hotel Management Reply Functionality: Official responses from General Managers displayed prominently on public hotel listing modals with Verified Stay stamps.",
        bg_color="F0FDF4",
        border_color="059669"
    )
    
    # Section 1
    h1 = doc.add_heading(level=1)
    r = h1.add_run("1. Deliverables Breakdown & Technical Architecture")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(15, 118, 110)
    
    tbl_deliv = doc.add_table(rows=4, cols=3)
    format_table(
        tbl_deliv,
        [Inches(1.8), Inches(2.3), Inches(2.7)],
        ["Deliverable", "Operational Actions", "Target Files & UI Touchpoints"],
        [
            ["1. Front-Desk Reception Quick Actions", "Check-in (room -> occupied), Check-out (room -> cleaning), and Housekeeping (room -> available).", "frontend/src/modules/business/HotelTodayScreen.tsx & LiveRoomRackBoard.tsx"],
            ["2. Automated Review Invitations", "Automated WhatsApp and Email dispatch with direct review token (ref=SWT-B3S01T) upon guest check-out.", "frontend/src/modules/business/HotelTodayScreen.tsx & ReviewModal.tsx"],
            ["3. Management Replies on Public Modals", "Hoteliers reply to reviews in BusinessShell; responses display prominently with official badge in public listing modal.", "frontend/src/modules/tourist/HotelDetailsModal.tsx & BusinessShell.tsx"]
        ]
    )
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    
    # Section 2
    h2 = doc.add_heading(level=1)
    r = h2.add_run("2. Front-Desk State Machine & Room Turnover Lifecycle")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(15, 118, 110)
    
    add_callout(
        doc,
        "Physical Room State Progression",
        "• State 1: RESERVED -> Guest booking confirmed; room locked on Live Room Rack Board.\n"
        "• State 2: OCCUPIED -> Receptionist taps 'Check-In Guest'; actual_checkin_at timestamped, room marked occupied.\n"
        "• State 3: CLEANING -> Receptionist taps 'Check-Out Guest'; booking marked completed, room transitions to housekeeping cleaning.\n"
        "• State 4: AVAILABLE -> Housekeeping supervisor taps 'Mark Cleaned & Ready'; room immediately unlocked for new guest booking.",
        bg_color="F8FAFC",
        border_color="028AC8"
    )
    
    # Section 3
    h3 = doc.add_heading(level=1)
    r = h3.add_run("3. Verified Guest Review & Management Reply Display")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(15, 118, 110)
    
    add_callout(
        doc,
        "Public Listing Modal Specifications (HotelDetailsModal.tsx)",
        "• Guest Review Card: Shows tourist name, star rating (1-5), stay date, room category, and official 'Verified Guest Stay ✓' green badge.\n"
        "• Prominently Nested Management Reply: Displayed with special styling:\n"
        "   🏢 Response from Swat Serena Hotel Management • 2 days ago\n"
        "   'Thank you Sara for staying with us at Serena Hotel! We are thrilled you enjoyed the river view and look forward to welcoming you back to Swat Valley.'",
        bg_color="F0FDF4",
        border_color="059669"
    )
    
    # Section 4
    h4 = doc.add_heading(level=1)
    r = h4.add_run("4. Acceptance Criteria & Automated Verification Checklist")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(15, 118, 110)
    
    tbl_criteria = doc.add_table(rows=5, cols=3)
    format_table(
        tbl_criteria,
        [Inches(1.6), Inches(2.5), Inches(2.7)],
        ["Criterion", "Expected System Behavior", "Verification Method"],
        [
            ["Check-in Action", "Assigned physical room moves to occupied state on Live Room Rack Board.", "Interactive UI test & room rack status check"],
            ["Check-out Action", "Booking marked completed; physical room moves to cleaning state.", "State transition check in HotelTodayScreen"],
            ["Housekeeping Release", "1-click 'Mark Cleaned' returns room to available state.", "Live Room Rack Board visual update"],
            ["Management Reply", "Official reply appears nested beneath guest review with official badge in HotelDetailsModal.", "Inspection of HotelDetailsModal reviews tab"]
        ]
    )
    
    output_path = os.path.abspath("Docs/swat-tourism-phase5-frontdesk-turnover-verified-review-prompt.docx")
    doc.save(output_path)
    print(f"Successfully generated DOCX at: {output_path}")

if __name__ == "__main__":
    main()
