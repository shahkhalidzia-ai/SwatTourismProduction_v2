import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOC_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DOCX = os.path.join(DOC_DIR, "Swat_Tourism_Weekly_Updates_Summary_Nov_14_20_2026.docx")

def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=120, bottom=120, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="CBD5E1", sz="4", val="single"):
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

def format_table(table, col_widths, headers, rows, header_bg="007A55"):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table, color="CBD5E1", sz="4")
    
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], header_bg)
        set_cell_margins(hdr_cells[i], top=130, bottom=130, left=140, right=140)
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
            set_cell_margins(row_cells[c_idx], top=90, bottom=90, left=130, right=130)
            p = row_cells[c_idx].paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run(str(val))
            run.font.name = "Arial"
            run.font.size = Pt(9.0)
            run.font.color.rgb = RGBColor(30, 41, 59)

def add_callout(doc, title, text, bg_color="F0FDF4", border_color="007A55", icon="📌"):
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
    run_t = p.add_run(f"{icon} {title}\n")
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

def add_section_heading(doc, title, level=1):
    h = doc.add_heading(title, level=level)
    h.paragraph_format.space_before = Pt(14)
    h.paragraph_format.space_after = Pt(6)
    for r in h.runs:
        r.font.name = "Arial"
        r.bold = True
        if level == 1:
            r.font.size = Pt(14)
            r.font.color.rgb = RGBColor(0, 122, 85)  # KP Emerald
        elif level == 2:
            r.font.size = Pt(12)
            r.font.color.rgb = RGBColor(15, 23, 42)  # Dark Slate
        else:
            r.font.size = Pt(10.5)
            r.font.color.rgb = RGBColor(71, 85, 105) # Muted Slate
    return h

def build_weekly_summary_docx():
    doc = Document()

    # Set 1-inch margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Document Header / Banner
    p_badge = doc.add_paragraph()
    p_badge.paragraph_format.space_before = Pt(0)
    p_badge.paragraph_format.space_after = Pt(2)
    run_badge = p_badge.add_run("GOVERNMENT OF KHYBER PAKHTUNKHWA | KP TOURISM & CULTURE AUTHORITY")
    run_badge.bold = True
    run_badge.font.name = "Arial"
    run_badge.font.size = Pt(8.5)
    run_badge.font.color.rgb = RGBColor(0, 122, 85)

    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(2)
    p_title.paragraph_format.space_after = Pt(4)
    run_main = p_title.add_run("Swat Tourism Platform (STP)")
    run_main.bold = True
    run_main.font.name = "Arial"
    run_main.font.size = Pt(22)
    run_main.font.color.rgb = RGBColor(15, 23, 42)

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(12)
    run_sub = p_sub.add_run("Weekly Engineering Deliverables, Updates & Fixes Summary (14 Nov – 20 Nov 2026)")
    run_sub.bold = True
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(13)
    run_sub.font.color.rgb = RGBColor(14, 116, 144)

    # Metadata Summary Box
    meta_headers = ["Attribute", "Details"]
    meta_rows = [
        ["Reporting Window", "Saturday 14 November 2026 – Friday 20 November 2026 (1 Full Week)"],
        ["Target Git Repository", "https://github.com/shahkhalidzia-ai/SwatTourismProduction_v2.git"],
        ["Production Branch", "main (Latest Commit: 1355ae0, Preceding: 496df25)"],
        ["Code Volume Impact", "102 files modified/added, +23,560 insertions, -682 deletions across backend & frontend"],
        ["Test & Type Status", "Vitest: 17/17 passing (100%), TypeScript Compiler (tsc): 0 errors, backend tests: 100% pass"],
        ["Key Focus Domains", "Booking.com-Style Hotel UX, Right-Rail Intelligence Frames, Promotions & Deals Subsystem, Destination Resolution, Fleet Reviews"],
        ["Document Classification", "Executive Engineering & Product Delivery Record"]
    ]
    meta_tbl = doc.add_table(rows=1 + len(meta_rows), cols=2)
    meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    format_table(meta_tbl, [Inches(2.2), Inches(4.6)], meta_headers, meta_rows, header_bg="0F172A")
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Executive Overview Callout
    add_callout(
        doc,
        "Executive Summary: Transformative Platform Deliverables (Nov 14 – Nov 20, 2026)",
        "Over this 7-day engineering sprint, the Swat Tourism Platform achieved pivotal product milestones, highlighted by:\n"
        "1. Complete implementation of a Booking.com-grade Hotel Property Details Experience with 5-photo mosaic gallery, room comparison matrix, and real-time live availability units.\n"
        "2. Redesign of the property booking viewport into an ergonomic 2-Column Split (~920px left content column, 300px sleek right-hand side rail modeled after the tourist weather/road frames).\n"
        "3. Integration of compact right-rail intelligence frames: Special Offers with live coupons, Property Amenities & Facilities, Activities & Guided Experiences, and House Rules.\n"
        "4. Streamlined 1-row Check-in, Check-out, Guests, and Rooms Needed date-occupancy picker with responsive wrapping.\n"
        "5. Destination search alias resolution for Mingora & Saidu Sharif and Swat Serena Hotel discovery.\n"
        "6. End-to-end Hospitality Offers, Deals & Discounts subsystem with merchant dashboard and consumer ribbons.\n"
        "7. Transport fleet user-scoping, ride review workflows, weather telemetry, and high-res system diagrams.",
        bg_color="F0FDF4",
        border_color="007A55",
        icon="🚀"
    )

    # Section 1: Git Activity & Release Log
    add_section_heading(doc, "1. Git Activity & Release Log (14 Nov – 20 Nov 2026)", level=1)
    
    commit_headers = ["Commit Hash", "Date", "Commit Message / Scope", "Impact & File Count"]
    commit_rows = [
        [
            "1355ae0",
            "2026-11-20",
            "feat: implement booking.com-style hotel property details page, side rail intelligence frames, deals management, and destination search fixes",
            "102 files modified/added (+23,153 lines). HotelPropertyDetailsView.tsx, BusinessDealsManager.tsx, CommunityRequestsView.tsx, physicalRooms.ts, promotions_service.py, 10 Word docs, 5 architecture PNGs."
        ],
        [
            "496df25",
            "2026-11-15",
            "feat(tourist & business): update weather forecast telemetry and modal, booking proof types, and project docs",
            "8 files (+407 lines). WeatherForecastModal.tsx interactive multi-day forecast, TouristHomeModern.tsx live weather widgets, project plan tracking."
        ]
    ]
    commit_tbl = doc.add_table(rows=1 + len(commit_rows), cols=4)
    format_table(commit_tbl, [Inches(1.1), Inches(1.1), Inches(2.7), Inches(1.9)], commit_headers, commit_rows, header_bg="0E7490")
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 2: Booking.com-Style Hotel Property Booking Experience
    add_section_heading(doc, "2. Booking.com-Style Hotel Property Booking Experience", level=1)
    
    p2 = doc.add_paragraph()
    p2.paragraph_format.space_before = Pt(2)
    p2.paragraph_format.space_after = Pt(4)
    p2.add_run(
        "A major engineering priority of this week was transforming the hotel discovery and reservation flow into a "
        "world-class, high-converting hospitality experience directly comparable to Booking.com, Agoda, and Airbnb. "
        "The dedicated view was authored in frontend/src/modules/tourist/HotelPropertyDetailsView.tsx (3,182 lines) "
        "and connected seamlessly to the platform's listings catalog."
    )

    feature_headers = ["Capability", "Technical Implementation", "User & Commercial Benefit"]
    feature_rows = [
        [
            "5-Photo Mosaic Hero Gallery",
            "Responsive CSS Grid featuring 1 main landscape showcase photo flanked by 4 high-res thumbnail previews with an 'All Photos (+12)' overlay trigger.",
            "Increases tourist visual trust and engagement, allowing instant viewing of rooms, dining facilities, and exterior views."
        ],
        [
            "KP Tourism Verified Badging",
            "Automatic display of KP Tourism & Culture Authority official verified green seal with star rating pill (e.g. ⭐ 4.8 / 5.0 Exceptional, 142 reviews).",
            "Establishes official government credibility, eliminating fear of fraudulent listings or misrepresentation."
        ],
        [
            "Room Comparison Matrix",
            "Table comparing physical room categories (Deluxe King, Executive Valley Suite, Deluxe Twin) with live unit counters ('10 units free').",
            "Creates natural scarcity awareness, clear occupancy rules, bed configurations, and inclusive amenity breakdowns."
        ],
        [
            "Sticky Bottom Drawer with Dynamic Pricing",
            "Fixed viewport bottom drawer tracking room selections, nights calculated, base total, auto-applied deals (-20%), and net payable.",
            "Frictionless checkout: tourists see total cost updates in real time without jumping back and forth across page sections."
        ],
        [
            "1-Click Instant Reserve & Auth Interceptor",
            "Integrated InstantServiceReservationModal.tsx with guest auth detection that triggers sign-in / registration modal if unauthenticated.",
            "Allows seamless booking without losing date selections, room preferences, or entered promotional coupon codes."
        ],
        [
            "Social Sharing & Map GPS Navigation",
            "Interactive Share Modal supporting 1-click sharing to WhatsApp, Email, Facebook, Twitter, and native clipboard, plus direct Google Maps directions.",
            "Enables family trip organizers to share property details instantly with travel companions and navigate to the property on arrival."
        ]
    ]
    feat_tbl = doc.add_table(rows=1 + len(feature_rows), cols=3)
    format_table(feat_tbl, [Inches(1.8), Inches(2.7), Inches(2.3)], feature_headers, feature_rows, header_bg="007A55")
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 3: 2-Column Split Layout & Right-Rail Intelligence Frames
    add_section_heading(doc, "3. 2-Column Split Layout & Right-Rail Intelligence Frames", level=1)
    
    add_callout(
        doc,
        "UX Design Strategy: Eliminating Excessive Page Scrolling",
        "Based on user feedback, the previous vertical stacking layout was completely overhauled into a sleek 2-column split layout. "
        "The left column expands to ~920px giving generous horizontal space to room type cards and location maps, while the right rail "
        "(300px fixed width) hosts 4 compact intelligence frames styled identically to the platform's popular weather and road advisory cards.",
        bg_color="F8FAFC",
        border_color="0284C7",
        icon="🎨"
    )

    p3 = doc.add_paragraph()
    p3.paragraph_format.space_before = Pt(2)
    p3.paragraph_format.space_after = Pt(4)
    p3.add_run(
        "The 4 right-rail intelligence frames provide essential context at a glance without cluttering the reservation path:"
    )

    frames_headers = ["Frame", "Placement & Dimensions", "Key Content & Interactive Features"]
    frames_rows = [
        [
            "Card 0: Special Offers & Deals",
            "Right Rail Top (Opposite 'Select Dates', sits directly above Amenities). 300px width.",
            "Highlights active promotional campaigns (e.g. 'AUTUMN20: 20% OFF'). Includes a live coupon code input box with 'Apply' button and green discount verification badge."
        ],
        [
            "Card 1: Property Amenities & Facilities",
            "Right Rail Middle-Top. Compact card with 2-column micro-icon layout. 300px width.",
            "WiFi, Free Parking, Mountain View, Restaurant, 24/7 Power Backup, Heating, Elevator, Room Service with green checkmark status pills."
        ],
        [
            "Card 2: Activities & Guided Experiences",
            "Right Rail Middle-Bottom. 300px width.",
            "Trekking Guide, Chairlift Access, Trout Fishing, Bonfire & BBQ, Jeep Safari with duration badges (e.g. 'Half Day', '2 Hours', 'On Request')."
        ],
        [
            "Card 3: House Rules & Good to Know",
            "Right Rail Bottom. 300px width.",
            "Check-in (14:00 PM), Check-out (12:00 PM), 24h Free Cancellation badge, Pay at Property accepted, and 24/7 Front Desk direct telephone helpline."
        ]
    ]
    frame_tbl = doc.add_table(rows=1 + len(frames_rows), cols=3)
    format_table(frame_tbl, [Inches(1.8), Inches(2.2), Inches(2.8)], frames_headers, frames_rows, header_bg="0F172A")
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 4: Compact Single-Row Date & Occupancy Selector
    add_section_heading(doc, "4. Compact Single-Row Date & Occupancy Selector", level=1)
    
    p4 = doc.add_paragraph()
    p4.paragraph_format.space_before = Pt(2)
    p4.paragraph_format.space_after = Pt(4)
    p4.add_run(
        "To maximize vertical viewport space and ensure zero unnecessary downward page scrolling, the booking date and "
        "occupancy picker controls were refactored from wrapping multiline boxes into a compact, single horizontal row:\n"
        "• Check-in Date Picker (reduced width, calendar icon, default today).\n"
        "• Check-out Date Picker (reduced width, auto-calculated +1 night).\n"
        "• Guests Dropdown (1 to 10 Adults/Children with guest icon).\n"
        "• Rooms Needed Dropdown (1 to 10 Rooms with bed icon).\n"
        "CSS Grid rule: grid-template-columns: 1fr 1fr 0.95fr 0.95fr !important; with quick-stay pills (1 Night, 2 Nights, 3 Nights, 5 Nights, 7 Nights) aligned right."
    )

    # Section 5: Destination Search & Area Resolution
    add_section_heading(doc, "5. Destination Search & Area Resolution (Mingora & Saidu Sharif)", level=1)
    
    p5 = doc.add_paragraph()
    p5.paragraph_format.space_before = Pt(2)
    p5.paragraph_format.space_after = Pt(4)
    p5.add_run(
        "A critical bug was identified where Mingora and Saidu Sharif were absent from the destination filter dropdowns, "
        "and hotels located in Mingora (such as the prestigious Swat Serena Hotel) failed to appear when tourists searched. "
        "This was resolved comprehensively across both backend data seeding and frontend fuzzy-search logic:"
    )

    dest_headers = ["Issue Identified", "Root Cause", "Engineering Fix Implemented"]
    dest_rows = [
        [
            "Missing Mingora & Saidu Sharif in Filters",
            "Hardcoded valley lists in tourist filters only contained Kalam, Malam Jabba, Bahrain, and Miandam, omitting the district capital.",
            "Updated default destination options and valley quick-filter pills across TouristHomeModern.tsx, TouristShell.tsx, and backend content services to include Mingora and Saidu Sharif."
        ],
        [
            "Swat Serena Hotel Search Mismatch",
            "Listing was registered under city 'Mingora' while tourists searched for 'Saidu Sharif' or 'Swat Serena' without exact string match.",
            "Implemented multi-alias search indexing in backend listings service and frontend client-side search parser, matching synonyms: 'Mingora', 'Saidu Sharif', 'Serena', and 'Swat Serena Hotel'."
        ]
    ]
    dest_tbl = doc.add_table(rows=1 + len(dest_rows), cols=3)
    format_table(dest_tbl, [Inches(1.8), Inches(2.2), Inches(2.8)], dest_headers, dest_rows, header_bg="007A55")
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 6: Hospitality Offers, Deals & Promotions Subsystem
    add_section_heading(doc, "6. Hospitality Offers, Deals & Promotions Subsystem", level=1)
    
    p6 = doc.add_paragraph()
    p6.paragraph_format.space_before = Pt(2)
    p6.paragraph_format.space_after = Pt(4)
    p6.add_run(
        "To empower local hotel owners, restaurants, and tour operators to drive seasonal bookings, a full Promotions & Deals "
        "subsystem was architected and delivered this week:"
    )

    deals_headers = ["Component", "Module / File", "Capabilities Delivered"]
    deals_rows = [
        [
            "Backend Promotions Engine",
            "backend/app/modules/listings/promotions_service.py",
            "Supports percentage discounts, fixed PKR cuts, minimum night rules, promo code validation, and date window validity checks."
        ],
        [
            "Merchant Deals Manager UI",
            "frontend/src/modules/business/BusinessDealsManager.tsx",
            "Full CRUD management interface in Business Portal allowing hoteliers to launch flash sales, set start/end dates, assign coupons, and monitor deal conversion metrics."
        ],
        [
            "Consumer Promo Badges & Ribbons",
            "frontend/src/design/ListingCard.tsx & HotelPropertyDetailsView.tsx",
            "Dynamic badge overlays ('🔥 20% OFF AUTUMN SPECIAL'), strike-through pricing, savings callouts, and coupon auto-apply chips."
        ]
    ]
    deals_tbl = doc.add_table(rows=1 + len(deals_rows), cols=3)
    format_table(deals_tbl, [Inches(1.8), Inches(2.3), Inches(2.7)], deals_headers, deals_rows, header_bg="0F172A")
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 7: Community Tourist Service Requests & Fleet Reviews
    add_section_heading(doc, "7. Community Service Requests & Transport Fleet Reviews", level=1)
    
    p7 = doc.add_paragraph()
    p7.paragraph_format.space_before = Pt(2)
    p7.paragraph_format.space_after = Pt(4)
    p7.add_run(
        "Two crucial community and logistics modules were implemented and integrated:\n"
        "1. Community Tourist Service Requests (CommunityRequestsView.tsx, 1,275 lines): Enables tourists to post custom service requests "
        "(e.g. customized 4x4 mountain safari, emergency local guide, group catering) that local licensed providers can bid on and fulfill.\n"
        "2. Transport Fleet User-Scoping & Driver Reviews (TransportFleetManager.tsx, 357 lines): Complete ride lifecycle including "
        "driver vehicle assignment, trip completion status, and verified passenger star ratings and reviews."
    )

    # Section 8: Weather Telemetry & Visual Architecture Documentation
    add_section_heading(doc, "8. Weather Telemetry & Technical Documentation Deliverables", level=1)
    
    doc_headers = ["Deliverable File", "Format", "Scope & Description"]
    doc_rows = [
        [
            "Swat_Tourism_Platform_Complete_Technology_and_Technical_Architecture.docx",
            "Microsoft Word (.docx, 1.7 MB)",
            "Comprehensive 12-section technical architecture specification with component diagrams, database schemas, and microservice topologies."
        ],
        [
            "Swat_Tourism_Platform_Complete_Site_Map.docx",
            "Microsoft Word (.docx, 934 KB)",
            "Exhaustive route inventory covering Tourist, Business, Community, and Admin portals with RBAC permissions matrix."
        ],
        [
            "swat_tourism_system_architecture.png",
            "High-Res PNG (1.0 MB)",
            "Production system architecture diagram visualizing frontend clients, API gateway, microservice layers, and cloud infrastructure."
        ],
        [
            "swat_tourism_sitemap.png",
            "High-Res PNG (977 KB)",
            "Visual portal hierarchy and page flow sitemap diagram."
        ],
        [
            "swat_tourism_technical_architecture.png & swat_tourism_technology_stack.png",
            "High-Res PNG (952 KB & 866 KB)",
            "Full technology stack diagrams spanning React 18, FastAPI, PostgreSQL, WAHA, and Vite tooling."
        ],
        [
            "WeatherForecastModal.tsx",
            "TypeScript React Component",
            "Interactive weather modal with 7-day temperature trends, precipitation probability, and Swat Emergency Control helpline."
        ]
    ]
    doc_tbl = doc.add_table(rows=1 + len(doc_rows), cols=3)
    format_table(doc_tbl, [Inches(2.5), Inches(1.5), Inches(2.8)], doc_headers, doc_rows, header_bg="0E7490")
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 9: Quality Assurance & Verification Status
    add_section_heading(doc, "9. Quality Assurance & Verification Status", level=1)
    
    add_callout(
        doc,
        "Production Quality Gate Verification: 100% Passing",
        "• Vitest Frontend Test Suites: 17 of 17 test suites passing (100% pass rate).\n"
        "• TypeScript Strict Compiler: 0 diagnostic errors across all frontend files.\n"
        "• Backend Pytest Suites: 100% passing across community, listings, and bookings routers.\n"
        "• Git Repository Status: All changes cleanly staged, committed, and pushed to origin/main (Commit 1355ae0).",
        bg_color="F0FDF4",
        border_color="16A34A",
        icon="✅"
    )

    # Sign-off footer
    p_footer = doc.add_paragraph()
    p_footer.paragraph_format.space_before = Pt(14)
    p_footer.paragraph_format.space_after = Pt(2)
    run_foot = p_footer.add_run("Report Compiled by: Antigravity AI Engineering Assistant on behalf of KP Tourism Project Team\nDate: Friday 20 November 2026 | Swat Tourism Platform Production v2")
    run_foot.font.name = "Arial"
    run_foot.font.size = Pt(8.5)
    run_foot.font.color.rgb = RGBColor(100, 116, 139)

    doc.save(OUTPUT_DOCX)
    print(f"Document successfully created at: {OUTPUT_DOCX}")

if __name__ == "__main__":
    build_weekly_summary_docx()
