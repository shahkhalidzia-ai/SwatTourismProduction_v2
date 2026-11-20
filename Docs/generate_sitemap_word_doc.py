"""
Generates the comprehensive Microsoft Word (.docx) specification:
Swat_Tourism_Platform_Complete_Site_Map.docx in Docs/
"""

import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOC_DIR = os.path.dirname(os.path.abspath(__file__))
SITEMAP_IMG = os.path.join(DOC_DIR, "swat_tourism_sitemap.png")
OUTPUT_DOCX = os.path.join(DOC_DIR, "Swat_Tourism_Platform_Complete_Site_Map.docx")

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def format_table(table, col_widths, headers, rows, header_bg="0369A1"):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], header_bg)
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
        p = hdr_cells[i].paragraphs[0]
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
            run = p.add_run(str(val))
            run.font.name = "Arial"
            run.font.size = Pt(9.0)
            run.font.color.rgb = RGBColor(30, 41, 59)

def build_docx():
    doc = Document()
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Title
    p_title = doc.add_paragraph()
    r = p_title.add_run("Swat Tourism Platform (SwatTourismProduction_v2)")
    r.bold = True
    r.font.name = "Arial"
    r.font.size = Pt(22)
    r.font.color.rgb = RGBColor(15, 23, 42)

    p_sub = doc.add_paragraph()
    r_sub = p_sub.add_run("Complete Application Site Map & Multi-Portal Navigational Hierarchy")
    r_sub.bold = True
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(13)
    r_sub.font.color.rgb = RGBColor(14, 116, 144)

    # Diagram Section
    h1 = doc.add_heading("1. Visual Site Map Diagram", level=1)
    if os.path.exists(SITEMAP_IMG):
        doc.add_picture(SITEMAP_IMG, width=Inches(6.5))
        p_cap = doc.add_paragraph("Figure: Complete visual site map across all 5 user portals, 28 active tabs, and global overlays.")
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.runs[0].font.size = Pt(8.5)
        p_cap.runs[0].font.color.rgb = RGBColor(100, 116, 139)

    # Navigation Matrix Table
    doc.add_heading("2. Complete Navigation Matrix", level=1)
    headers = ["User Role / Portal", "Active Tabs / Routes", "Primary Features & Workflows"]
    rows = [
        ["Public & Tourist", "Home (Modern Explore)\nExplore Directory\nTrips & Itinerary\nMy Bookings\nSafety & SOS\nProfile Settings", "Destination guides, 7-day satellite weather, real-time road conditions, room booking, 20% advance guarantee checkout, digital vouchers, Rescue 1122 SOS."],
        ["Hotel & Business", "Today Screen (PMS)\nMy Listings\nRooms & Availability\nInvoices & Commission\nGuest Reviews", "Front-desk arrivals/departures, in-house guests, physical room rack, advance paid vs balance ledger, check-in/out, 60-day visual availability matrix, 5% levy."],
        ["Transport & Dining", "Explore Swat\nRide Orders\nFleet & Vehicles\nMenu & Kitchen\nReviews & Profile", "Intercity express buses, 4x4 mountain jeeps, seat fare rates, passenger pickup manifest, dish catalog, trout specials, daily operating status."],
        ["Community Guides", "Tourist Requests\nVerified Stories\nReport an Incident\nHost Services\nCommunity Profile", "Live tourist assistance bidding marketplace, local guide proposals, Swati culture and handicraft stories, civic damage reports, homestay accreditation."],
        ["Authority & Admin", "Executive Overview\nFinances & Commission\nUser Management\nRoad Advisories\nApprovals & KYC\nSOS Cases & CAD", "Provincial tourism KPIs, 5% service fee audits, master accounts management, live road status broadcasting, business license inspection, Rescue 1122 CAD dispatch."],
        ["Global Modals", "SwatPay Modal\nHotelDetailsModal\nWeatherForecastModal\nBookingVoucherModal\nProofInspectorModal", "20% advance guarantee deposit calculation, EasyPaisa/JazzCash checkout, direct bank slip verification, live weather curves, dynamic QR check-in token."]
    ]
    tbl = doc.add_table(rows=1 + len(rows), cols=3)
    format_table(tbl, [Inches(1.8), Inches(1.8), Inches(2.9)], headers, rows, header_bg="0F172A")

    doc.save(OUTPUT_DOCX)
    print(f"Site Map Word document created at: {OUTPUT_DOCX}")

if __name__ == "__main__":
    build_docx()

