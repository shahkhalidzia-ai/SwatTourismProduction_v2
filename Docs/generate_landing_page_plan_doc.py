import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
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
    
    # --- Title Banner ---
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    run_title = title_p.add_run("Swat Tourism Platform — Strategic Blueprint")
    run_title.font.size = Pt(12)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(16, 185, 129) # Emerald #10B981
    
    h1_p = doc.add_paragraph()
    h1_p.paragraph_format.space_before = Pt(4)
    h1_p.paragraph_format.space_after = Pt(8)
    run_h1 = h1_p.add_run("Main Landing Page Enhancement Plan: Elegance, UX & Functional Roadmap")
    run_h1.font.size = Pt(21)
    run_h1.font.bold = True
    run_h1.font.color.rgb = RGBColor(27, 79, 114) # Deep Blue #1B4F72
    
    meta_p = doc.add_paragraph()
    meta_p.paragraph_format.space_after = Pt(16)
    run_meta = meta_p.add_run("Prepared for: Khyber Pakhtunkhwa Tourism Facilitation | Swat Valley Production V2\n"
                              "Focus: Visual Wow Factor, Zero-Friction UX, High-Impact Conversions & Modern Mobile Experience")
    run_meta.font.size = Pt(9.5)
    run_meta.font.italic = True
    run_meta.font.color.rgb = RGBColor(100, 116, 139)

    # --- Callout Box: Executive Vision ---
    callout_tbl = doc.add_table(rows=1, cols=1)
    callout_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    callout_tbl.autofit = False
    callout_tbl.columns[0].width = Inches(6.5)
    c_cell = callout_tbl.cell(0, 0)
    set_cell_background(c_cell, "F0FDF4") # Emerald soft
    set_cell_margins(c_cell, top=140, bottom=140, left=200, right=200)
    
    cp = c_cell.paragraphs[0]
    cp.paragraph_format.space_after = Pt(0)
    c_bold = cp.add_run("Executive Vision: The Digital Gateway to the 'Switzerland of the East'\n")
    c_bold.bold = True
    c_bold.font.size = Pt(11)
    c_bold.font.color.rgb = RGBColor(4, 120, 87)
    c_text = cp.add_run("The Swat Tourism landing page serves as the initial touchpoint for overseas diaspora, domestic holidaymakers, and international adventurers. "
                        "To transform this landing page from a functional directory into an irresistible, world-class travel portal, the platform must balance visual grandeur, "
                        "instant clarity, frictionless exploration, and trusted utility.")
    c_text.font.size = Pt(10)
    c_text.font.color.rgb = RGBColor(55, 65, 81)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Helper for Section Headings
    def add_section_header(title, subtitle=None):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(title)
        run.font.size = Pt(15)
        run.font.bold = True
        run.font.color.rgb = RGBColor(27, 79, 114)
        
        if subtitle:
            sub_p = doc.add_paragraph()
            sub_p.paragraph_format.space_after = Pt(8)
            sub_run = sub_p.add_run(subtitle)
            sub_run.font.size = Pt(10)
            sub_run.font.italic = True
            sub_run.font.color.rgb = RGBColor(100, 116, 139)

    # Helper for Subsection
    def add_subsection(title, desc_points):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(title)
        r.font.size = Pt(12)
        r.font.bold = True
        r.font.color.rgb = RGBColor(15, 23, 42)
        
        for bp in desc_points:
            bp_p = doc.add_paragraph(style='List Bullet')
            bp_p.paragraph_format.space_after = Pt(3)
            r_bp = bp_p.add_run(bp)
            r_bp.font.size = Pt(10.5)

    # 1. Visual Elegance & Attraction
    add_section_header("1. Visual Elegance & Aesthetic Attraction ('The WOW Factor')",
                       "First impressions dictate whether a tourist commits to booking a trip.")
    
    add_subsection("1.1 Dynamic Ambient Hero Video & Photography Loop", [
        "Replace static gradients with subtle, ambient 4K video loops (dawn over Kalam Valley, mist lifting off Mahodand Lake, chairlifts ascending Malam Jabba peak).",
        "Implement a soft dark glassmorphism overlay (25% opacity backdrop-filter blur) ensuring search inputs and weather stats pop with maximum contrast.",
        "Include an elegant photo credit badge (e.g. 'Photo: White Palace Marghuzar, Swat') linking to KP Tourism Archives."
    ])

    add_subsection("1.2 Destination Card Micro-Interactions & Hover Polish", [
        "Smooth CSS image zoom on card hover (transform: scale(1.04) with ease-out cubic-bezier transition).",
        "Verified Traveler Rating Badge floating over the photo (e.g. ⭐ 4.9 (140+ verified reviews)).",
        "Subtle seasonal badge indicator (e.g. 🍁 Golden Autumn Foliage / ❄️ Fresh Winter Snowfall)."
    ])

    add_subsection("1.3 Real-Time Atmosphere & Snow/Weather Urgency Pill", [
        "Elevate the header weather widget into an emotional trip-driver: '❄️ Fresh 15cm Snowfall in Malam Jabba — Ski Slopes Open Today'.",
        "Encourages immediate weekend getaway bookings from Peshawar, Mardan, and Islamabad travelers."
    ])

    # 2. User-Friendliness & Effortless UX
    add_section_header("2. User-Friendliness & Zero-Friction UX",
                       "Minimize cognitive load so travelers find what they need in seconds.")

    add_subsection("2.1 Quick Itinerary Archetype Pickers (1-Tap Curated Presets)", [
        "Directly below the search bar, provide 1-tap journey presets: 👨‍👩‍👧 Family Friendly (3 Days), ⛷️ Ski & Snow Weekend, 💍 Honeymoon Luxury, 🎒 Backpacker & Trekking.",
        "Tapping a preset instantly filters destinations, verified stays, and routes suited for that exact traveler persona without requiring multiple search clicks."
    ])

    add_subsection("2.2 Dual-View Switch: Card Grid vs Interactive Valley Map", [
        "Add a 1-click toggle between 'Grid View' and 'Interactive Valley Route Map'.",
        "Shows destinations pinned along the Swat Expressway (M-16) and N-95 highway with travel distance and drive time from Mingora or Islamabad.",
        "Solves the #1 tourist question: 'Which spots are close to each other so we don't waste time on the road?'"
    ])

    add_subsection("2.3 Smart Categorized Search with Auto-Suggestions", [
        "As the tourist types in the search bar, display instant categorized auto-suggestions: Top Valleys, Verified Hotels, Trout Dining, and 4x4 Mountain Routes.",
        "Include fuzzy spelling tolerance for regional names (e.g. 'Kalam', 'Kallam', 'Mahodand', 'Malam Jaba')."
    ])

    # 3. High-Value Functional Additions
    add_section_header("3. Essential High-Value Features & Conversion Drivers",
                       "Features that turn passive browsing into confirmed bookings and safe travels.")

    add_subsection("3.1 Live Swat Expressway & Mountain Pass Road Status Indicator", [
        "Real-time highway condition bar: 🟢 Swat Expressway M-16: Open & Clear | 🟡 Kalam to Mahodand: 4x4 Jeeps Only | ❄️ Shangla Pass: Snow Chains Required.",
        "Directly sourced or updated by Traffic Police Swat / KP Tourism authority, establishing unmatched traveler trust."
    ])

    add_subsection("3.2 1-Tap Official WhatsApp Tourism Facilitation Desk", [
        "WhatsApp is the primary booking and inquiry medium across Pakistan and overseas travelers.",
        "Add a discreet floating green WhatsApp button: 'Chat with Tourism Facilitation Desk' for real-time guidance, hotel inquiries, and permit clearances."
    ])

    add_subsection("3.3 Multi-Currency (PKR, USD, AED, GBP) & Urdu Language Switcher", [
        "Overseas diaspora in the UK, UAE, and North America represent high-spending tourists. A 1-click currency converter displays hotel rates in familiar currencies.",
        "Urdu language toggle (اردو) expands accessibility to families and travelers across Pakistan."
    ])

    add_subsection("3.4 24/7 Emergency Tourist Safety & SOS Hub", [
        "Quick-access emergency toolbar in footer/sidebar: 📞 Tourist Police Swat (1422), 🚑 Emergency Rescue (1122), 🏥 Saidu Teaching Hospital Desk.",
        "Provides overseas and domestic tourists complete peace of mind while visiting high-altitude alpine valleys."
    ])

    # 4. Roadmap Table
    add_section_header("4. Priority Roadmap & Implementation Matrix",
                       "Balanced evaluation of technical effort versus business/user impact.")

    table = doc.add_table(rows=1, cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    col_widths = [Inches(2.2), Inches(1.3), Inches(1.3), Inches(1.7)]
    headers = ["Feature / Enhancement", "Effort Level", "User Impact", "Target Phase"]

    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], "1B4F72") # Deep Blue
        set_cell_margins(hdr_cells[i], top=100, bottom=100, left=120, right=120)
        hp = hdr_cells[i].paragraphs[0]
        hrun = hp.add_run(title)
        hrun.font.bold = True
        hrun.font.size = Pt(10)
        hrun.font.color.rgb = RGBColor(255, 255, 255)

    roadmap_data = [
        ("Live Highway & Pass Road Status Bar", "Low (1 day)", "⭐⭐⭐⭐⭐ High", "Phase 1 (Immediate)"),
        ("1-Tap Quick Itinerary Presets", "Low (1-2 days)", "⭐⭐⭐⭐⭐ High", "Phase 1 (Immediate)"),
        ("WhatsApp Tourism Desk Direct Button", "Very Low (2 hrs)", "⭐⭐⭐⭐ Very High", "Phase 1 (Immediate)"),
        ("Ratings & Verified Review Badges", "Medium (2-3 days)", "⭐⭐⭐⭐ High", "Phase 2 (Next Sprint)"),
        ("Dual-Mode Interactive Route Map", "Medium (3-4 days)", "⭐⭐⭐⭐⭐ High", "Phase 2 (Next Sprint)"),
        ("Multi-Currency & Urdu Language Toggle", "Medium (3 days)", "⭐⭐⭐⭐ High", "Phase 3 (Post-Launch)"),
        ("Ambient 4K Video Hero Background Loop", "Low-Medium (1 day)", "⭐⭐⭐⭐ High", "Phase 3 (Post-Launch)"),
    ]

    for row_idx, data in enumerate(roadmap_data):
        row_cells = table.add_row().cells
        bg_color = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for i, text in enumerate(data):
            row_cells[i].width = col_widths[i]
            set_cell_background(row_cells[i], bg_color)
            set_cell_margins(row_cells[i], top=80, bottom=80, left=120, right=120)
            p = row_cells[i].paragraphs[0]
            r = p.add_run(text)
            r.font.size = Pt(9.5)
            if i == 0:
                r.font.bold = True
                r.font.color.rgb = RGBColor(15, 23, 42)
            elif "Phase 1" in text:
                r.font.bold = True
                r.font.color.rgb = RGBColor(4, 120, 87) # Emerald

    # Save Word document
    out_dir = r"f:\Antigravity\SwatTourismProduction_v2\Docs"
    os.makedirs(out_dir, exist_ok=True)
    doc_path = os.path.join(out_dir, "swat-tourism-landing-page-enhancement-plan.docx")
    doc.save(doc_path)
    print(f"Document successfully created at: {doc_path}")

if __name__ == '__main__':
    create_document()
