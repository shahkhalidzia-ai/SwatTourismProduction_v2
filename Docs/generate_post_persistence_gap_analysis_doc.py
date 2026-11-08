import os
import shutil
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
    r_title = p.add_run(f"📌 {title}\n")
    r_title.bold = True
    r_title.font.name = "Arial"
    r_title.font.size = Pt(10.5)
    r_title.font.color.rgb = RGBColor(15, 23, 42)
    
    r_text = p.add_run(text)
    r_text.font.name = "Arial"
    r_text.font.size = Pt(9.5)
    r_text.font.color.rgb = RGBColor(51, 65, 85)
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def build_gap_analysis_docx():
    doc = Document()
    
    # Page Setup - Margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
    # Document Title
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(2)
    r_title = p_title.add_run("Swat Tourism Platform — Comprehensive Functional Gap Analysis")
    r_title.bold = True
    r_title.font.name = "Arial"
    r_title.font.size = Pt(20)
    r_title.font.color.rgb = RGBColor(14, 116, 144) # Deep Teal
    
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(14)
    r_sub = p_sub.add_run("Architectural Audit, Remaining Functional Deficiencies & Future Implementation Roadmap\n"
                          "Audit Date: November 05, 2026 | Environment: Production V2 | Scope: Post-Persistence Platform")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(10)
    r_sub.font.color.rgb = RGBColor(100, 116, 139)
    
    # Executive Summary Callout
    add_callout(
        doc,
        "Executive Audit Summary",
        "Following the completion of the 4-Phase Database Persistence Roadmap and End-to-End Multi-Role Lifecycle Verification, "
        "the Swat Tourism Platform has achieved complete transactional durability across 40 relational SQLite tables. "
        "This audit identifies 8 high-impact functional gaps and improvement areas required to elevate the platform from a "
        "verified core prototype into a market-ready commercial destination operating system.",
        bg_color="F0FDF4",
        border_color="16A34A"
    )
    
    # Section 1: The Gap List
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(4)
    r_h1 = h1.add_run("1. Master Functional Gap Matrix")
    r_h1.bold = True
    r_h1.font.name = "Arial"
    r_h1.font.size = Pt(14)
    r_h1.font.color.rgb = RGBColor(15, 23, 42)
    
    gaps_data = [
        ("1", "AI Trip Generation Engine", "Client heuristic rule-parser", "Query live SQLite database (verified hotels, jeeps, restaurants) with external POI web fallback", "P0 (Critical)"),
        ("2", "Interactive Multi-Night Date Picker", "Single-date & daily capacity list", "Dual-calendar visual range picker (Check-In to Check-Out) with dynamic room blocking & live multipliers", "P1 (High)"),
        ("3", "Offline Itinerary Auto-Sync", "Local draft component state", "Auto-claim guest itinerary plans into trips & trip_stops tables upon registration/login", "P1 (High)"),
        ("4", "1-Click Native PDF Voucher Export", "Printable HTML view only", "Bundled client/server .pdf file export for offline phone storage across cellular dead zones", "P1 (High)"),
        ("5", "Live Communications & Telecom", "Mock logger & in-app sandbox", "Production Meta Cloud WhatsApp API / Twilio & SMTP credentials toggle for live SMS/Email delivery", "P2 (Medium)"),
        ("6", "Restaurant Table & Meal Pre-Order", "View-only menu and phone info", "Ordering meals (e.g. Swati River Trout) & reserving tables directly inside unified trip checkout", "P2 (Medium)"),
        ("7", "Emergency 1122 CAD & Police Dispatch", "In-app SOS distress logging", "Automated outbound SMS with Google Maps GPS pin to Tourist Police (0946-9240400) & Rescue 1122", "P2 (Medium)"),
        ("8", "Multilingual (Urdu / Pashto) UI", "English-only interface", "Full Urdu & Pashto language toggle with RTL support for local drivers, community hosts & elders", "P3 (Normal)")
    ]
    
    table = doc.add_table(rows=1, cols=5)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    set_table_borders(table)
    
    headers = ["#", "Functional Domain", "Current Implementation", "Deficiency & Required Remediation", "Priority"]
    col_widths = [Inches(0.4), Inches(1.5), Inches(1.4), Inches(2.6), Inches(0.9)]
    
    hdr_cells = table.rows[0].cells
    for idx, (title, width) in enumerate(zip(headers, col_widths)):
        hdr_cells[idx].width = width
        set_cell_background(hdr_cells[idx], "0E7490")
        set_cell_margins(hdr_cells[idx], top=100, bottom=100, left=120, right=120)
        p = hdr_cells[idx].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if idx in [0, 4] else WD_ALIGN_PARAGRAPH.LEFT
        run = p.add_run(title)
        run.bold = True
        run.font.name = "Arial"
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(255, 255, 255)
        
    for row_idx, row in enumerate(gaps_data):
        row_cells = table.add_row().cells
        bg_color = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, (text, width) in enumerate(zip(row, col_widths)):
            row_cells[col_idx].width = width
            set_cell_background(row_cells[col_idx], bg_color)
            set_cell_margins(row_cells[col_idx], top=80, bottom=80, left=100, right=100)
            p = row_cells[col_idx].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if col_idx in [0, 4] else WD_ALIGN_PARAGRAPH.LEFT
            run = p.add_run(text)
            run.font.name = "Arial"
            run.font.size = Pt(8.5)
            if col_idx == 4:
                run.bold = True
                if "Critical" in text:
                    run.font.color.rgb = RGBColor(220, 38, 38)
                elif "High" in text:
                    run.font.color.rgb = RGBColor(217, 119, 6)
                elif "Medium" in text:
                    run.font.color.rgb = RGBColor(2, 132, 199)
                else:
                    run.font.color.rgb = RGBColor(100, 116, 139)
            else:
                run.font.color.rgb = RGBColor(30, 41, 59)
                
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    
    # Section 2: Detailed Remediation Specifications
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(4)
    r_h2 = h2.add_run("2. Detailed Functional Gap Remediation Plans")
    r_h2.bold = True
    r_h2.font.name = "Arial"
    r_h2.font.size = Pt(14)
    r_h2.font.color.rgb = RGBColor(15, 23, 42)
    
    remediations = [
        ("Gap 1: AI Trip Planner with Live SQLite Listings & Web Fallback",
         "• Root Cause: touristAIService.ts synthesizes itineraries using static template strings.\n"
         "• Remediation: Implement POST /api/v1/trips/ai-generate. The backend extracts budget, travelers, origin, and seasonal interests, "
         "queries real listings, price_items, and transport_vehicles from SQLite, and populates a verified 1-tap bookable itinerary.\n"
         "• Web Fallback: If target area lacks active listings, query external mountain POIs with graceful fallback."),
        
        ("Gap 2: Interactive Multi-Night Date Picker & Continuous Room Lock",
         "• Root Cause: AvailabilityModal.tsx displays 30 individual day cells; booking checkout uses plain HTML date inputs.\n"
         "• Remediation: Build a modern visual range calendar in frontend/src/components/common/DateRangePicker.tsx. "
         "Calculates nights, multiplies price items dynamically, disables dates where physical rooms are occupied, and displays instant confirmation."),
        
        ("Gap 3: Guest / Offline Itinerary Auto-Sync (Gap 8)",
         "• Root Cause: Unauthenticated travelers drafting custom itineraries store them only in ephemeral browser memory.\n"
         "• Remediation: Store offline itineraries in swat_local_trips. Upon user registration/login, invoke POST /api/v1/trips/claim "
         "to migrate all stops to the durable PostgreSQL/SQLite database."),
        
        ("Gap 4: 1-Click Native Offline PDF Voucher & Receipt Export",
         "• Root Cause: /bookings/{id}/voucher relies on browser print dialogs which fail or distort on mobile phones.\n"
         "• Remediation: Integrate jspdf/html2canvas for direct 1-tap download of KPCTA-Voucher-SWT-XXXX.pdf containing offline QR codes, "
         "room assignment, GPS directions, and emergency helplines for offline mountain access beyond cellular zones."),
        
        ("Gap 5: Live Communications Cloud Gateways",
         "• Root Cause: WhatsAppService and EmailService write messages to log files rather than carrier networks.\n"
         "• Remediation: Introduce environment switches (WHATSAPP_PROVIDER=meta_cloud/twilio and SMTP credentials) to seamlessly toggle "
         "between development log inspection and live telecom message delivery."),
        
        ("Gap 6: Traditional Restaurant Meal Pre-Ordering & Table Reservations",
         "• Root Cause: Restaurant module is informational (menus & contacts only).\n"
         "• Remediation: Add 'Reserve Table & Pre-Order Meal' flow in RestaurantDetailModal.tsx allowing tourists to reserve tables "
         "and prepay traditional dishes (Swati River Trout Fry, Shinwari Karahi) within their unified itinerary checkout."),
        
        ("Gap 7: Emergency 1122 CAD & Tourist Police Dispatch",
         "• Root Cause: Emergency distress events are stored in sos_events and shown in the Authority dashboard.\n"
         "• Remediation: Trigger automated SMS dispatch with exact GPS coordinates to Swat Tourist Police (0946-9240400) and Rescue 1122."),
        
        ("Gap 8: Multilingual Localization (Urdu & Pashto)",
         "• Root Cause: All UI strings are currently English-only.\n"
         "• Remediation: Add lightweight i18n dictionary and language toggle (EN | اردو | پښتو) with RTL layout support.")
    ]
    
    for title, desc in remediations:
        p_item = doc.add_paragraph()
        p_item.paragraph_format.space_before = Pt(8)
        p_item.paragraph_format.space_after = Pt(2)
        r_item_title = p_item.add_run(title)
        r_item_title.bold = True
        r_item_title.font.name = "Arial"
        r_item_title.font.size = Pt(11)
        r_item_title.font.color.rgb = RGBColor(14, 116, 144)
        
        p_desc = doc.add_paragraph()
        p_desc.paragraph_format.space_after = Pt(6)
        r_desc = p_desc.add_run(desc)
        r_desc.font.name = "Arial"
        r_desc.font.size = Pt(9.5)
        r_desc.font.color.rgb = RGBColor(51, 65, 85)
        
    # Section 3: Phased Execution Roadmap
    h3 = doc.add_paragraph()
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(4)
    r_h3 = h3.add_run("3. Phased Execution Roadmap")
    r_h3.bold = True
    r_h3.font.name = "Arial"
    r_h3.font.size = Pt(14)
    r_h3.font.color.rgb = RGBColor(15, 23, 42)
    
    roadmap_box = (
        "• Sprint 1 (Immediate - P0/P1): AI Trip Planner Live SQLite Integration & Interactive Multi-Night Date Range Picker\n"
        "• Sprint 2 (P1): Guest Itinerary Auto-Sync & 1-Click Native Offline PDF Voucher Generation\n"
        "• Sprint 3 (P2): Production Telecom Gateway Credentials & Traditional Restaurant Meal Pre-Ordering\n"
        "• Sprint 4 (P2/P3): Emergency 1122 CAD Outbound SMS Bridge & Urdu/Pashto Localization"
    )
    add_callout(doc, "Recommended Implementation Roadmap", roadmap_box, bg_color="F0F9FF", border_color="0284C7")
    
    # Save files
    out_dir_v2 = r"F:\Antigravity\SwatTourismProduction_v2\Docs"
    out_dir_v1 = r"F:\Antigravity\SwatTourismProduction\Docs"
    
    file_name = "swat-tourism-post-persistence-gap-analysis.docx"
    path_v2 = os.path.join(out_dir_v2, file_name)
    path_v1 = os.path.join(out_dir_v1, file_name)
    
    doc.save(path_v2)
    print(f"Saved: {path_v2}")
    
    shutil.copy2(path_v2, path_v1)
    print(f"Copied to: {path_v1}")

if __name__ == "__main__":
    build_gap_analysis_docx()

