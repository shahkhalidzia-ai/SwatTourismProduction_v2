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
    cell.width = Inches(6.9)
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

def add_code_block(doc, code_text):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.9)
    set_cell_background(cell, "1E293B")
    set_cell_margins(cell, top=120, bottom=120, left=160, right=160)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run(code_text)
    r.font.name = "Consolas"
    r.font.size = Pt(9)
    r.font.color.rgb = RGBColor(226, 232, 240)
    
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(0)
    p_sp.paragraph_format.space_after = Pt(4)

def add_heading_1(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(16)
    p.paragraph_format.space_after = Pt(6)
    r = p.add_run(text)
    r.bold = True
    r.font.name = "Calibri"
    r.font.size = Pt(15)
    r.font.color.rgb = RGBColor(10, 77, 104)

def add_heading_2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run(text)
    r.bold = True
    r.font.name = "Calibri"
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(2, 138, 200)

def add_body_p(doc, text, bold_prefix="", space_after=4):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.bold = True
        r_pre.font.name = "Calibri"
        r_pre.font.size = Pt(10.5)
        r_pre.font.color.rgb = RGBColor(30, 41, 59)
    r = p.add_run(text)
    r.font.name = "Calibri"
    r.font.size = Pt(10.5)
    r.font.color.rgb = RGBColor(51, 65, 85)
    return p

def add_bullet(doc, bold_prefix, text):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(3)
    r_pre = p.add_run(bold_prefix + " ")
    r_pre.bold = True
    r_pre.font.name = "Calibri"
    r_pre.font.size = Pt(10.5)
    r_pre.font.color.rgb = RGBColor(30, 41, 59)
    r = p.add_run(text)
    r.font.name = "Calibri"
    r.font.size = Pt(10.5)
    r.font.color.rgb = RGBColor(71, 85, 105)

def build_docx():
    doc = Document()
    
    for s in doc.sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)
        
    # Document Header / Title
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(3)
    t_run = title_p.add_run("AI Mountain Concierge & Autonomous Agent")
    t_run.bold = True
    t_run.font.name = "Calibri"
    t_run.font.size = Pt(22)
    t_run.font.color.rgb = RGBColor(10, 77, 104)
    
    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(12)
    s_run = sub_p.add_run("Technical Architecture, Multi-Stakeholder Workflows & Phased Implementation Plan")
    s_run.font.name = "Calibri"
    s_run.font.size = Pt(12)
    s_run.font.italic = True
    s_run.font.color.rgb = RGBColor(2, 138, 200)
    
    # Metadata Block
    meta_table = doc.add_table(rows=4, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(meta_table, color="E2E8F0")
    meta_data = [
        ("Platform", "Swat Tourism Platform (STP) — Production v2"),
        ("Subject", "Transformation of AI Concierge into an Autonomous, Database-Grounded AI Agent"),
        ("Model Strategy", "Google Gemini 1.5 Pro / Flash with Function Calling + SQLite Inventory Grounding"),
        ("Target Users", "Mountain Tourists, Hotel Managers, 4x4 Transport Operators, Tourism Police & Admin")
    ]
    for idx, (label, val) in enumerate(meta_data):
        c1, c2 = meta_table.cell(idx, 0), meta_table.cell(idx, 1)
        c1.width, c2.width = Inches(2.2), Inches(4.7)
        set_cell_background(c1, "F1F5F9")
        set_cell_background(c2, "FFFFFF")
        set_cell_margins(c1, 80, 80, 120, 120)
        set_cell_margins(c2, 80, 80, 120, 120)
        
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(label)
        r1.bold = True
        r1.font.name = "Calibri"
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = RGBColor(15, 23, 42)
        
        p2 = c2.paragraphs[0]
        r2 = p2.add_run(val)
        r2.font.name = "Calibri"
        r2.font.size = Pt(9.5)
        if "Model Strategy" in label:
            r2.bold = True
            r2.font.color.rgb = RGBColor(2, 138, 200)
        else:
            r2.font.color.rgb = RGBColor(51, 65, 85)
            
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(6)
    p_sp.paragraph_format.space_after = Pt(6)

    # Executive Summary Callout
    add_callout(
        doc,
        "Executive Summary: From Heuristic Button to Autonomous Agent",
        "The current platform features an 'AI Concierge' button connected to a client-side prototype "
        "(touristAIService.ts) that uses hardcoded templates, geographic sequencing (Mingora to Kalam), "
        "and keyword extraction for days and budgets.\n\n"
        "By upgrading this to an autonomous AI Agent powered by Google's Gemini 1.5 API with Function Calling "
        "(Tool Use), the Concierge transforms into an intelligent mountain travel copilot. It queries the live SQLite "
        "database to match genuine vacant hotel rooms, current room rates, active 4x4 jeeps, and verified riverside trout "
        "cafes. It cross-references live road clearances (e.g. snow chains on the Bahrain-Kalam stretch) and outputs "
        "1-click bookable itineraries, while offering voice input (Urdu/Pashto) and emergency SOS dispatching.",
        bg_color="F0F9FF",
        border_color="028AC8"
    )

    # Section 1
    add_heading_1(doc, "1. Core Tourist Use Cases (The AI Mountain Concierge)")
    add_body_p(
        doc,
        "The tourist concierge serves as an 24/7 personalized travel planner, guide, and safety companion. "
        "It supports four major high-impact workflows:"
    )

    add_heading_2(doc, "1.1 Database-Grounded Live Trip Generation")
    add_body_p(
        doc,
        "Instead of returning static text suggestions, the AI Agent acts as an interactive travel agent. "
        "When a tourist provides a natural language prompt:"
    )
    add_code_block(
        doc,
        'Tourist Prompt:\n'
        '"Plan a 3-day family trip from Lahore with a 65,000 PKR budget. We want snow activities\n'
        'in Malam Jabba, a riverside hotel with heating, and fresh Swati trout dining."'
    )
    add_body_p(
        doc,
        "The AI Agent executes sequential function calls against the FastAPI backend:"
    )
    add_bullet(doc, "Step 1 (Hotel Match):", "Queries SQLite 'rooms' and 'listings' for heated family suites in Malam Jabba/Kalam under PKR 15,000/night.")
    add_bullet(doc, "Step 2 (Transport Match):", "Queries 'transport_vehicles' for available 4x4 jeeps in Kalam for snow tracks.")
    add_bullet(doc, "Step 3 (Dining Match):", "Finds verified restaurants serving authentic Swati trout (e.g., Trout Park Madyan or Adnan Platter House).")
    add_bullet(doc, "Step 4 (Structured Itinerary):", "Returns a day-by-day itinerary with exact calculated pricing, booking references, and a '1-Click Confirm All' button.")

    add_heading_2(doc, "1.2 Dynamic Road & Weather Advisory Intelligence")
    add_body_p(
        doc,
        "Mountain travel in Swat requires real-time situational awareness due to snowfall, rain, and landslide risks:"
    )
    add_bullet(doc, "Proactive Route Adjustments:", "If road advisories report that the Bahrain-to-Kalam road requires 4x4 snow chains, the AI dynamically alerts sedan drivers and suggests exploring White Palace Marghuzar or Malam Jabba first.")
    add_bullet(doc, "Weather-Adaptive Schedules:", "Suggests indoor Gandhara museum visits in Saidu Sharif during heavy rainstorms and outdoor chairlift rides during clear skies.")

    add_heading_2(doc, "1.3 Multilingual & Voice Assistant (Urdu, Pashto & English)")
    add_body_p(
        doc,
        "A large percentage of domestic tourists, drivers, and elders communicate more naturally via voice:"
    )
    add_bullet(doc, "Voice Input Integration:", "Leverages the browser Web Speech API / Whisper STT so tourists can press the microphone button and speak in Urdu or Pashto.")
    add_bullet(doc, "Localized Answers:", "Replies in Urdu script or Roman Urdu with cultural warmth and traditional Swati hospitality.")

    add_heading_2(doc, "1.4 Emergency Co-Pilot (Autonomous SOS Dispatch)")
    add_body_p(
        doc,
        "When a tourist enters SOS mode or requests urgent roadside help:"
    )
    add_bullet(doc, "GPS Capture:", "Extracts precise device latitude and longitude.")
    add_bullet(doc, "Nearest Facility Lookup:", "Locates the closest medical post (Saidu Teaching Hospital, Civil Hospital Kalam) or Tourism Police checkpoint.")
    add_bullet(doc, "Bilingual Dispatch Packet:", "Prepares a structured Urdu/English text ready for 1-tap transmission via WhatsApp to 1122 and the Swat Tourism Police Desk.")

    # Section 2
    add_heading_1(doc, "2. Business & Authority Stakeholder Workflows")
    add_body_p(
        doc,
        "The AI Agent architecture extends beyond tourists to empower hotel managers, transport operators, and government authorities:"
    )

    stakeholder_table = doc.add_table(rows=4, cols=3)
    stakeholder_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(stakeholder_table, color="CBD5E1")
    
    headers = ["Stakeholder", "AI Capability", "Operational Value"]
    for i, h in enumerate(headers):
        cell = stakeholder_table.cell(0, i)
        set_cell_background(cell, "0A4D68")
        set_cell_margins(cell, 100, 100, 140, 140)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.name = "Calibri"
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    s_rows = [
        ("Hoteliers & Business Owners", "Dynamic Seasonal Pricing & Surcharge Suggestions", "Analyzes upcoming snowfall, weekend demand, and local occupancy rates to suggest optimal nightly room tariffs to hotel managers."),
        ("Hoteliers & Restaurants", "Automated Review Response Assistant", "Summarizes tourist feedback and auto-drafts professional, courteous responses addressing compliments and maintenance issues in English and Urdu."),
        ("Tourism Authority & Admin", "Overcrowding Heatmaps & Automated Vetting", "Flags when Kalam or Malam Jabba exceed 90% lodging capacity and suggests traffic diversions. Scans submitted host licenses for fraud detection.")
    ]
    
    widths = [Inches(1.8), Inches(2.3), Inches(2.8)]
    for r_idx, r_data in enumerate(s_rows):
        for c_idx, val in enumerate(r_data):
            cell = stakeholder_table.cell(r_idx + 1, c_idx)
            cell.width = widths[c_idx]
            if c_idx == 0:
                set_cell_background(cell, "F8FAFC")
            else:
                set_cell_background(cell, "FFFFFF")
            set_cell_margins(cell, 90, 90, 120, 120)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.name = "Calibri"
            r.font.size = Pt(9.5)
            r.font.color.rgb = RGBColor(51, 65, 85)

    p_sp2 = doc.add_paragraph()
    p_sp2.paragraph_format.space_before = Pt(6)
    p_sp2.paragraph_format.space_after = Pt(6)

    # Section 3
    add_heading_1(doc, "3. Technical Architecture & Tool Calling Schema")
    add_body_p(
        doc,
        "The system employs a client-server Agentic architecture utilizing Google Gemini 1.5 with Function Calling (Tools). "
        "The LLM does not hallucinate rates or room inventory; it queries the actual backend database:"
    )

    add_heading_2(doc, "3.1 Agentic Tool Definitions (FastAPI Backend)")
    add_body_p(
        doc,
        "The backend exposes four core tools to the AI model:"
    )
    add_code_block(
        doc,
        "# backend/app/modules/ai/tools.py\n\n"
        "AI_TOOLS_SCHEMA = [\n"
        "  {\n"
        "    'name': 'search_available_rooms',\n"
        "    'description': 'Search available hotel rooms in Swat by area, budget, and guest count.',\n"
        "    'parameters': {\n"
        "      'type': 'OBJECT',\n"
        "      'properties': {\n"
        "        'area_name': {'type': 'STRING', 'description': 'Valley or area e.g. Kalam, Malam Jabba, Mingora'},\n"
        "        'max_nightly_price': {'type': 'NUMBER', 'description': 'Maximum budget per night in PKR'},\n"
        "        'guests': {'type': 'INTEGER', 'description': 'Number of guests'},\n"
        "        'has_heating': {'type': 'BOOLEAN', 'description': 'Requires room heating / hot water'}\n"
        "      },\n"
        "      'required': ['area_name']\n"
        "    }\n"
        "  },\n"
        "  {\n"
        "    'name': 'get_road_and_weather_status',\n"
        "    'description': 'Get live highway clearances, snow warnings, and temperatures for Swat valleys.',\n"
        "    'parameters': {\n"
        "      'type': 'OBJECT',\n"
        "      'properties': {\n"
        "        'valley': {'type': 'STRING', 'description': 'Valley name e.g. Kalam, Bahrain, Malam Jabba'}\n"
        "      },\n"
        "      'required': ['valley']\n"
        "    }\n"
        "  },\n"
        "  {\n"
        "    'name': 'search_transport_rides',\n"
        "    'description': 'Search 4x4 jeeps, coaster vans, and intercity routes with verified fares.',\n"
        "    'parameters': {\n"
        "      'type': 'OBJECT',\n"
        "      'properties': {\n"
        "        'origin': {'type': 'STRING'},\n"
        "        'destination': {'type': 'STRING'},\n"
        "        'vehicle_type': {'type': 'STRING', 'enum': ['jeep_4x4', 'van', 'sedan']}\n"
        "      },\n"
        "      'required': ['origin', 'destination']\n"
        "    }\n"
        "  }\n"
        "]"
    )

    add_heading_2(doc, "3.2 Data Flow Sequence")
    add_body_p(
        doc,
        "1. Tourist sends prompt from TouristAIAssistantModal.tsx.\n"
        "2. FastAPI endpoint POST /api/v1/ai/chat delivers prompt + system prompt + tool declarations to Gemini 1.5.\n"
        "3. Gemini determines that real database data is required and issues a function call (e.g., search_available_rooms(area='Kalam', max_nightly_price=12000)).\n"
        "4. FastAPI queries the SQLite 'rooms' and 'listings' tables and returns matching records to the LLM.\n"
        "5. Gemini synthesizes a friendly, natural language reply embedded with structured listing cards.\n"
        "6. Frontend renders clickable cards where the user can click 'View Rooms' or 'Book Entire AI Trip'."
    )

    add_callout(
        doc,
        "Offline Resilience in Mountain Dead Zones",
        "Swat's high-altitude valleys (beyond Kalam to Mahodand or Saifullah Lake) have intermittent cellular coverage. "
        "The architecture features a dual-mode failover: when an active internet connection is detected, queries run via "
        "the cloud Gemini Agent. If offline, the application seamlessly falls back to the client-side heuristic engine "
        "(touristAIService.ts), guaranteeing zero application crashes in mountain dead zones.",
        bg_color="FEF3C7",
        border_color="D97706"
    )

    # Section 4
    add_heading_1(doc, "4. 3-Phase Implementation Roadmap")
    add_body_p(
        doc,
        "To deploy this feature smoothly without disrupting ongoing hotel bookings and Stripe payment testing, "
        "the implementation is structured into three manageable phases:"
    )

    add_heading_2(doc, "Phase 1: Backend Endpoint & Live Database Tool Calling")
    add_bullet(doc, "Deliverable 1.1:", "Create backend/app/modules/ai/service.py using Google's google-generativeai SDK with Gemini 1.5 Flash.")
    add_bullet(doc, "Deliverable 1.2:", "Implement tool executors querying SQLite for rooms, jeeps, restaurants, and road status.")
    add_bullet(doc, "Deliverable 1.3:", "Expose POST /api/v1/ai/concierge and connect frontend TouristAIAssistantModal.tsx.")

    add_heading_2(doc, "Phase 2: 1-Click Multi-Service Booking ('Book Entire AI Trip')")
    add_bullet(doc, "Deliverable 2.1:", "Enable the AI response to include structured 'trip_stops' IDs (hotel_id, jeep_id).")
    add_bullet(doc, "Deliverable 2.2:", "Add a 'Confirm & Book Entire Itinerary' button in the modal that auto-generates records in the 'trips' table and opens the Unified Checkout modal with aggregate pricing.")

    add_heading_2(doc, "Phase 3: Urdu/Pashto Voice Input & WhatsApp Concierge Sync")
    add_bullet(doc, "Deliverable 3.1:", "Add browser microphone recording with auto-language detection (Urdu / English).")
    add_bullet(doc, "Deliverable 3.2:", "Add 'Send Itinerary to My WhatsApp' button so tourists can receive their AI-generated trip plan directly on their phone via the WhatsApp gateway.")

    # Save Document
    output_dir = "f:/Antigravity/SwatTourismProduction_v2/Docs"
    output_path = os.path.join(output_dir, "Swat_Tourism_AI_Agent_Architecture_and_Implementation_Guide.docx")
    doc.save(output_path)
    print(f"Successfully generated: {output_path}")

if __name__ == "__main__":
    build_docx()

