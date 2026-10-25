import os
import shutil
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_callout(doc, title, text, bg_color="F0FDF4", border_color="10B981"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    
    # Left border only
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
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(3)
    r_title = p.add_run(f"📌 {title}\n")
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(11)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(27, 79, 114)
    
    r_text = p.add_run(text)
    r_text.font.name = "Calibri"
    r_text.font.size = Pt(10)
    r_text.font.color.rgb = RGBColor(51, 65, 85)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def build_docx():
    doc = Document()
    
    # Page setup
    for sec in doc.sections:
        sec.top_margin = Inches(0.9)
        sec.bottom_margin = Inches(0.9)
        sec.left_margin = Inches(0.9)
        sec.right_margin = Inches(0.9)
        
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(51, 65, 85)
    
    # -------------------------------------------------------------
    # Title Banner
    # -------------------------------------------------------------
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(2)
    r_sub = p_sub.add_run("SWAT TOURISM PLATFORM (PRODUCTION V2) — TECHNICAL ARCHITECTURE")
    r_sub.font.size = Pt(10)
    r_sub.font.bold = True
    r_sub.font.color.rgb = RGBColor(16, 185, 129)
    
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(2)
    p_title.paragraph_format.space_after = Pt(6)
    r_title = p_title.add_run("AI Trip Generation Engine: Architecture, Agent Specifications & Implementation")
    r_title.font.size = Pt(22)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(27, 79, 114)
    
    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_after = Pt(14)
    r_meta = p_meta.add_run("System Overview & Implementation Guide  |  Author: Swat Platform Core Team  |  Date: October 2026")
    r_meta.font.size = Pt(9.5)
    r_meta.font.italic = True
    r_meta.font.color.rgb = RGBColor(100, 116, 139)
    
    # -------------------------------------------------------------
    # Executive Summary / Callout
    # -------------------------------------------------------------
    add_callout(
        doc,
        "Core Answer: Which AI Engine Powers Trip Generation?",
        "• Primary Active Engine: Local Domain-Specific Heuristic & NLP Service Engine (implemented in TypeScript in frontend/src/services/touristAIService.ts).\n"
        "• Execution Environment: Client-side on-device execution with zero network latency, zero API costs, and full offline/low-bandwidth resilience in mountain valleys.\n"
        "• Target Cloud Model (Hybrid Architecture): Google Gemini 1.5 Flash (or OpenAI GPT-4o-mini) as documented in the Swat Tourism AI roadmap for open-ended queries, grounded by the local validation layer.",
        bg_color="F0F9FF",
        border_color="0284C7"
    )
    
    # -------------------------------------------------------------
    # Section 1: Executive Overview
    # -------------------------------------------------------------
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(4)
    r_h1 = h1.add_run("1. Executive Overview & Design Rationale")
    r_h1.font.size = Pt(14)
    r_h1.font.bold = True
    r_h1.font.color.rgb = RGBColor(27, 79, 114)
    
    p1 = doc.add_paragraph()
    p1.paragraph_format.space_after = Pt(8)
    p1.add_run(
        "Mountain travel planning presents unique constraints that standard generic cloud LLMs cannot handle reliably. "
        "Tourists driving along the M-16 Swat Expressway or traversing deep northern valleys like Kalam, Ushu, and Mahodand "
        "frequently face spotty 3G/EDGE coverage or complete cellular dead zones. Moreover, generic LLMs frequently hallucinate "
        "unrealistic mountain travel durations (e.g., claiming Mingora to Kalam takes 45 minutes instead of 3.5 hours on river roads) "
        "or suggest sedans for steep boulder tracks where high-clearance 4x4 Cruisers are strictly required."
    )
    
    p2 = doc.add_paragraph()
    p2.paragraph_format.space_after = Pt(12)
    p2.add_run(
        "To resolve these challenges, the Swat Tourism Platform implements a "
    )
    r_emp = p2.add_run("Hybrid Grounded Architecture")
    r_emp.font.bold = True
    p2.add_run(
        ", prioritizing an ultra-fast, deterministic, on-device NLP engine that operates with 100% geographic accuracy, "
        "supported by a cloud model integration path for complex open-ended conversations."
    )
    
    # -------------------------------------------------------------
    # Section 2: Architectural Comparison Table
    # -------------------------------------------------------------
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(6)
    r_h2 = h2.add_run("2. Engine Comparison: Current Local Engine vs. Cloud LLMs")
    r_h2.font.size = Pt(14)
    r_h2.font.bold = True
    r_h2.font.color.rgb = RGBColor(27, 79, 114)
    
    table_comp = doc.add_table(rows=6, cols=3)
    table_comp.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_comp.autofit = False
    
    headers = ["Evaluation Metric", "Current Production Engine (touristAIService.ts)", "Cloud LLM (Gemini 1.5 Flash / GPT-4o-mini)"]
    widths = [Inches(1.8), Inches(2.4), Inches(2.3)]
    
    for c_idx, head in enumerate(headers):
        cell = table_comp.cell(0, c_idx)
        cell.width = widths[c_idx]
        set_cell_background(cell, "1B4F72")
        set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
        p = cell.paragraphs[0]
        r = p.add_run(head)
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    comp_data = [
        ("Execution Environment", "Client-side (in-browser React engine)", "Remote Cloud API server"),
        ("Response Latency", "Instantaneous (< 10 ms real-time debounce)", "800 ms – 2,500 ms roundtrip"),
        ("Offline / Mountain Resilience", "100% operational in zero-connectivity valleys", "Fails without active cellular data connection"),
        ("Operational Cost", "Zero PKR / Zero API token cost", "Pay-per-token API expense (~$0.001 - $0.005/call)"),
        ("Hallucination Risk", "Zero (Strictly grounded in Swat Valley topology)", "Moderate (Requires strict RAG system prompt)"),
    ]
    
    for row_idx, data in enumerate(comp_data):
        bg = "FFFFFF" if row_idx % 2 == 0 else "F8FAFC"
        for col_idx in range(3):
            cell = table_comp.cell(row_idx + 1, col_idx)
            cell.width = widths[col_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
            p = cell.paragraphs[0]
            r = p.add_run(data[col_idx])
            r.font.size = Pt(9)
            if col_idx == 0:
                r.font.bold = True
                r.font.color.rgb = RGBColor(27, 79, 114)
                
    doc.add_paragraph().paragraph_format.space_after = Pt(10)
    
    # -------------------------------------------------------------
    # Section 3: Deep Dive into Local AI Engine
    # -------------------------------------------------------------
    h3 = doc.add_paragraph()
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(6)
    r_h3 = h3.add_run("3. Natural Language Parser & Itinerary Synthesis Mechanics")
    r_h3.font.size = Pt(14)
    r_h3.font.bold = True
    r_h3.font.color.rgb = RGBColor(27, 79, 114)
    
    p_parse = doc.add_paragraph()
    p_parse.paragraph_format.space_after = Pt(8)
    p_parse.add_run(
        "The parsing pipeline converts unstructured traveler language into a structured, validated, and executable "
        "travel itinerary model. Consider the benchmark query:\n"
        "“2-day family trip from Islamabad, under 20k PKR, Mingora”"
    )
    
    # Extraction bullets
    items = [
        ("Duration Extractor", "Uses hyphen- and whitespace-aware regex ((\\d+)[\\s-]*(?:day|days|d)\\b). Accurately parses '2-day', '3 days', or 'weekend' (evaluating to 2 days). Clamped between 1 and 7 days."),
        ("Traveller Extractor", "Identifies family (4 travellers), couple / honeymoon (2 travellers), solo (1 traveller), or explicit count ('5 persons', '6 adults')."),
        ("Budget Normalizer", "Robustly parses monetary tokens including 'under 20k PKR', '20,000 pkr', 'Rs 25,000', or 'budget 15k'. Multiplies 'k' and 'thousand' by 1,000, and 'lakh' by 100,000."),
        ("Origin Transit Router", "Detects originating cities (Islamabad/Rawalpindi, Lahore, Peshawar, Karachi) and selects proper transport corridor (M-16 Swat Expressway Luxury Coach vs. private shuttle)."),
        ("Area & Theme Detector", "Recognizes geographic hubs (Mingora, Saidu Sharif, Malam Jabba, Kalam, Bahrain, Mahodand) and thematic interest tags (snow/skiing, trout fishing, Gandhara Buddhist heritage, alpine 4x4 trails)."),
    ]
    
    for title, desc in items:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(4)
        r_bt = bp.add_run(f"{title}: ")
        r_bt.font.bold = True
        r_bt.font.color.rgb = RGBColor(27, 79, 114)
        bp.add_run(desc)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    # -------------------------------------------------------------
    # Section 4: Geographic Topology Matrix
    # -------------------------------------------------------------
    h4 = doc.add_paragraph()
    h4.paragraph_format.space_before = Pt(12)
    h4.paragraph_format.space_after = Pt(6)
    r_h4 = h4.add_run("4. Geographic Sequence & Valley Topology Model")
    r_h4.font.size = Pt(14)
    r_h4.font.bold = True
    r_h4.font.color.rgb = RGBColor(27, 79, 114)
    
    p_topo = doc.add_paragraph()
    p_topo.paragraph_format.space_after = Pt(8)
    p_topo.add_run(
        "To prevent hazardous backtracking across mountain ridges, the platform models Swat Valley as a ranked linear South-to-North topological vector. "
        "The sequence optimizer re-orders trip stops by their topological elevation rank:"
    )
    
    table_topo = doc.add_table(rows=7, cols=4)
    table_topo.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_topo.autofit = False
    
    t_headers = ["Rank", "Location Label", "Elevation (Meters)", "Terrain Profile & Vehicle Requirement"]
    t_widths = [Inches(0.8), Inches(2.0), Inches(1.4), Inches(2.3)]
    
    for c_idx, head in enumerate(t_headers):
        cell = table_topo.cell(0, c_idx)
        cell.width = t_widths[c_idx]
        set_cell_background(cell, "0F344D")
        set_cell_margins(cell, top=90, bottom=90, left=120, right=120)
        p = cell.paragraphs[0]
        r = p.add_run(head)
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    topo_data = [
        ("1 - 2", "Saidu Sharif & Mingora Hub", "970m – 984m", "Dual-lane Expressway corridor; sedan / luxury bus accessible"),
        ("3", "Marghuzar (White Palace)", "1,250m", "Scenic valley road; paved asphalt; all vehicles"),
        ("4", "Malam Jabba Ski Resort", "2,804m", "Steep switchback mountain pass; snow chains in winter"),
        ("5 - 7", "Madyan & Bahrain", "1,320m – 1,400m", "Riverside Swat road; trout hatcheries; asphalt paved"),
        ("8 - 9", "Kalam Valley & Ushu Pine Forest", "2,000m – 2,200m", "Paved up to Kalam; sedans permitted up to town edge"),
        ("10 - 12", "Mahodand & Saifullah Glacial Lakes", "2,865m – 2,950m", "Unpaved boulder river track; high-clearance 4x4 Cruiser strictly required"),
    ]
    
    for row_idx, data in enumerate(topo_data):
        bg = "FFFFFF" if row_idx % 2 == 0 else "F1F5F9"
        for col_idx in range(4):
            cell = table_topo.cell(row_idx + 1, col_idx)
            cell.width = t_widths[col_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=70, bottom=70, left=110, right=110)
            p = cell.paragraphs[0]
            r = p.add_run(data[col_idx])
            r.font.size = Pt(9)
            if col_idx == 0:
                r.font.bold = True
                
    doc.add_paragraph().paragraph_format.space_after = Pt(10)
    
    # -------------------------------------------------------------
    # Section 5: The 4-Phase AI System Suite
    # -------------------------------------------------------------
    h5 = doc.add_paragraph()
    h5.paragraph_format.space_before = Pt(14)
    h5.paragraph_format.space_after = Pt(6)
    r_h5 = h5.add_run("5. Full 4-Phase Tourist AI Capability Suite")
    r_h5.font.size = Pt(14)
    r_h5.font.bold = True
    r_h5.font.color.rgb = RGBColor(27, 79, 114)
    
    phases = [
        ("Phase A: 1-Prompt Natural Language Trip Builder",
         "Allows tourists to type natural language sentences. The generator builds multi-day itineraries complete with transport departures, hotel check-ins tailored to the budget, dining recommendations, and destination visits."),
        ("Phase B: Sequence & Mountain Drive Time Optimizer",
         "Detects geographic backtracking (e.g. visiting Kalam -> Mingora -> Mahodand) and re-orders stops from South to North. Calculates realistic mountain driving times factoring in road curves and river corridors."),
        ("Phase C: Proactive Mountain Safety & Emergency SOS Dispatch",
         "Evaluates high-altitude hazards (snow chains for Malam Jabba, 4x4 advisories for Mahodand). Formats bilingual (English/Urdu) SOS distress dispatches embedded with exact GPS coordinates and Rescue 1122 hotline integration."),
        ("Phase D: 24/7 AI Mountain Concierge & WhatsApp Travel Buddy",
         "Interactive conversational concierge answering road clearances, central hotel room heating in winter, authentic trout preparation, and cultural etiquette, complete with 1-tap WhatsApp sync."),
    ]
    
    for p_title, p_desc in phases:
        p_item = doc.add_paragraph()
        p_item.paragraph_format.space_after = Pt(4)
        r_pt = p_item.add_run(f"• {p_title}: ")
        r_pt.font.bold = True
        r_pt.font.color.rgb = RGBColor(16, 185, 129)
        p_item.add_run(p_desc)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(10)
    
    # -------------------------------------------------------------
    # Section 6: Technical File Manifest & Data Schema
    # -------------------------------------------------------------
    h6 = doc.add_paragraph()
    h6.paragraph_format.space_before = Pt(14)
    h6.paragraph_format.space_after = Pt(6)
    r_h6 = h6.add_run("6. Technical Code Structure & Integration Schema")
    r_h6.font.size = Pt(14)
    r_h6.font.bold = True
    r_h6.font.color.rgb = RGBColor(27, 79, 114)
    
    p_code = doc.add_paragraph()
    p_code.paragraph_format.space_after = Pt(6)
    p_code.add_run("Key codebase files implementing and interacting with the AI engine:")
    
    code_files = [
        ("frontend/src/services/touristAIService.ts", "Core AI engine containing parseAndGenerateTripFromPrompt, analyzeAndOptimizeRoute, evaluateDestinationSafety, generateEmergencySOSDispatch, and queryTouristAIConcierge."),
        ("frontend/src/modules/tourist/AITripGeneratorModal.tsx", "Interactive 1-Prompt Modal providing debounced live itinerary previews and 1-tap creation into PostgreSQL / LocalStorage."),
        ("frontend/src/modules/tourist/TouristAIAssistantModal.tsx", "Bilingual floating concierge chat with quick action triggers for trip synthesis and SOS dispatches."),
        ("backend/app/modules/trips/schemas.py", "FastAPI Pydantic data schemas (TripCreate, TripStopCreate) validating UUID keys, stop sequences, and budget totals."),
        ("frontend/src/test/tourist_ai_assistance.test.tsx", "Comprehensive 10-test automated suite verifying prompt parsing, modal flows, and concierge interactions."),
    ]
    
    for f_path, f_desc in code_files:
        p_file = doc.add_paragraph(style='List Bullet')
        p_file.paragraph_format.space_after = Pt(3)
        r_fp = p_file.add_run(f_path)
        r_fp.font.bold = True
        r_fp.font.name = "Consolas"
        r_fp.font.size = Pt(9.5)
        r_fp.font.color.rgb = RGBColor(27, 79, 114)
        p_file.add_run(f" — {f_desc}")
        
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    
    # Sign-off box
    add_callout(
        doc,
        "Hybrid Architecture Roadmap (Next Milestone)",
        "When integrating Gemini 1.5 Flash in Phase E, the platform will utilize a Two-Pass Pipeline:\n"
        "1. Cloud Pass: Gemini 1.5 Flash parses complex natural language prose and enriches destination narratives.\n"
        "2. Grounding Pass: The local Swat Engine validates each stop against registered vendor pricing, road clearances, and physical travel durations, preventing any hallucinated routes.",
        bg_color="FEF3C7",
        border_color="D97706"
    )
    
    # Save locations
    docs_dir = r"f:\Antigravity\SwatTourismProduction_v2\Docs"
    output_docs = os.path.join(docs_dir, "Swat_Tourism_AI_Trip_Generation_Engine_Architecture.docx")
    
    user_downloads = r"C:\Users\shahkhalid1\Downloads"
    output_downloads = os.path.join(user_downloads, "Swat_Tourism_AI_Trip_Generation_Engine_Architecture.docx")
    
    doc.save(output_docs)
    print(f"Saved to Docs: {output_docs}")
    
    if os.path.exists(user_downloads):
        shutil.copyfile(output_docs, output_downloads)
        print(f"Saved to Downloads: {output_downloads}")

if __name__ == "__main__":
    build_docx()
