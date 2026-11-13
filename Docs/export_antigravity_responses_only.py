import os
import re
import json
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOC_DIR = os.path.dirname(os.path.abspath(__file__))
TRANSCRIPT_PATH = r"C:\Users\shahkhalid1\.gemini\antigravity\brain\040a1073-5ce9-41df-bd7c-d7c9b704e460\.system_generated\logs\transcript_full.jsonl"
OUTPUT_DOCX = os.path.join(DOC_DIR, "Antigravity_Responses_Current_Chat.docx")

DIAG_1_PATH = os.path.join(DOC_DIR, "swat_diagram_1_booking_sequence.png")
DIAG_2_PATH = os.path.join(DOC_DIR, "swat_diagram_2_data_pipeline.png")
DIAG_3_PATH = os.path.join(DOC_DIR, "swat_diagram_3_initial_page_load.png")
DIAG_4_PATH = os.path.join(DOC_DIR, "swat_single_comprehensive_architecture.png")

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

def parse_markdown_in_paragraph(p, text, default_font="Arial", default_size=9.5, default_color=RGBColor(51, 65, 85), is_bold=False):
    tokens = re.split(r'(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))', text)
    for token in tokens:
        if not token:
            continue
        if token.startswith('**') and token.endswith('**'):
            run = p.add_run(token[2:-2])
            run.bold = True
            run.font.name = default_font
            run.font.size = Pt(default_size)
            run.font.color.rgb = default_color
        elif token.startswith('`') and token.endswith('`'):
            run = p.add_run(token[1:-1])
            run.font.name = "Consolas"
            run.font.size = Pt(default_size - 0.5)
            run.font.color.rgb = RGBColor(15, 118, 110)
        elif token.startswith('[') and '](' in token and token.endswith(')'):
            match = re.match(r'\[(.*?)\]\((.*?)\)', token)
            if match:
                link_text, link_url = match.groups()
                run = p.add_run(link_text)
                run.font.name = default_font
                run.font.size = Pt(default_size)
                run.font.color.rgb = RGBColor(14, 116, 144)
                run.underline = True
            else:
                run = p.add_run(token)
                run.font.name = default_font
                run.font.size = Pt(default_size)
                run.font.color.rgb = default_color
        else:
            run = p.add_run(token)
            run.bold = is_bold
            run.font.name = default_font
            run.font.size = Pt(default_size)
            run.font.color.rgb = default_color

def render_markdown_table(doc, table_lines):
    if not table_lines or len(table_lines) < 2:
        return
    
    rows = []
    for line in table_lines:
        line_clean = line.strip().strip('|')
        cells = [c.strip() for c in line_clean.split('|')]
        rows.append(cells)
        
    if len(rows) < 2:
        return
        
    headers = rows[0]
    data_rows = [r for r in rows[1:] if not all(re.match(r'^:?-+:?$', c) for c in r)]
    
    col_count = len(headers)
    tbl = doc.add_table(rows=1 + len(data_rows), cols=col_count)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl, color="CBD5E1", sz="4")
    
    total_w = 6.8
    w_per_col = total_w / max(1, col_count)
    
    # Header row
    hdr_cells = tbl.rows[0].cells
    for i, h in enumerate(headers):
        if i >= len(hdr_cells):
            break
        hdr_cells[i].width = Inches(w_per_col)
        set_cell_background(hdr_cells[i], "0F766E")
        set_cell_margins(hdr_cells[i], top=100, bottom=100, left=120, right=120)
        p = hdr_cells[i].paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        parse_markdown_in_paragraph(p, h, default_font="Arial", default_size=9.0, default_color=RGBColor(255, 255, 255), is_bold=True)
        
    # Data rows
    for r_idx, r_data in enumerate(data_rows):
        row_cells = tbl.rows[r_idx + 1].cells
        bg_col = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, c_val in enumerate(r_data):
            if c_idx >= len(row_cells):
                break
            row_cells[c_idx].width = Inches(w_per_col)
            set_cell_background(row_cells[c_idx], bg_col)
            set_cell_margins(row_cells[c_idx], top=80, bottom=80, left=120, right=120)
            p = row_cells[c_idx].paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            clean_val = c_val.replace('<br>', '\n').replace('<br/>', '\n')
            for part in clean_val.split('\n'):
                parse_markdown_in_paragraph(p, part, default_font="Arial", default_size=8.5, default_color=RGBColor(30, 41, 59))
                if len(clean_val.split('\n')) > 1:
                    p.add_run("\n")

    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(2)
    p_sp.paragraph_format.space_after = Pt(6)

def insert_visual_diagram(doc, image_path, caption_title):
    if not os.path.exists(image_path):
        return
    p_img = doc.add_paragraph()
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_img.paragraph_format.space_before = Pt(8)
    p_img.paragraph_format.space_after = Pt(4)
    run_img = p_img.add_run()
    run_img.add_picture(image_path, width=Inches(6.8))

    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.space_before = Pt(2)
    p_cap.paragraph_format.space_after = Pt(12)
    run_cap = p_cap.add_run(caption_title)
    run_cap.font.name = "Arial"
    run_cap.font.size = Pt(9.0)
    run_cap.font.italic = True
    run_cap.font.bold = True
    run_cap.font.color.rgb = RGBColor(14, 116, 144)

def render_content_to_doc(doc, content):
    lines = content.split('\n')
    in_code_block = False
    code_lines = []
    code_lang = ""
    table_lines = []
    in_table = False

    for line in lines:
        stripped = line.strip()

        # Handle Code Block Start / End
        if stripped.startswith('```'):
            if in_code_block:
                full_code_text = "\n".join(code_lines)
                
                # Check if this code block is a Mermaid diagram that should be replaced with a visual diagram image!
                if "sequenceDiagram" in full_code_text and ("Tourist" in full_code_text or "Hotelier" in full_code_text):
                    if "index.html" in full_code_text or "Initial Load" in full_code_text or "main.tsx" in full_code_text:
                        insert_visual_diagram(doc, DIAG_3_PATH, "Figure 3.1: Visual Architecture Sequence Diagram — Initial Page Load & URL Browsing Execution Flow")
                    else:
                        insert_visual_diagram(doc, DIAG_1_PATH, "Figure 1.1: Visual Architecture Sequence Diagram — End-to-End Hotel Booking & PMS Flow")
                elif "flowchart" in full_code_text or "TIER1" in full_code_text or "TIER2" in full_code_text or "L1[" in full_code_text or "FRONTEND VIEW LAYER" in full_code_text:
                    if "L1[" in full_code_text or "FRONTEND VIEW LAYER" in full_code_text or "6. DATABASE PERSISTENCE" in full_code_text:
                        insert_visual_diagram(doc, DIAG_4_PATH, "Figure 4.1: Visual Architecture Diagram — 6-Layer Code Architecture & Inter-Layer Communication Flow")
                    else:
                        insert_visual_diagram(doc, DIAG_2_PATH, "Figure 2.1: Visual Architecture Flowchart — 4-Tier Pipeline & Data Floating Between Frontend and Database")
                else:
                    # Regular code block
                    tbl = doc.add_table(rows=1, cols=1)
                    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
                    cell = tbl.cell(0, 0)
                    cell.width = Inches(6.8)
                    set_cell_background(cell, "F1F5F9")
                    set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
                    
                    p_badge = cell.paragraphs[0]
                    p_badge.paragraph_format.space_before = Pt(1)
                    p_badge.paragraph_format.space_after = Pt(2)
                    r_badge = p_badge.add_run(f"[{code_lang.upper() or 'CODE'}]")
                    r_badge.font.name = "Consolas"
                    r_badge.font.size = Pt(8.0)
                    r_badge.font.color.rgb = RGBColor(100, 116, 139)
                    r_badge.bold = True
                    
                    p_code = cell.add_paragraph()
                    p_code.paragraph_format.space_before = Pt(2)
                    p_code.paragraph_format.space_after = Pt(2)
                    r_c = p_code.add_run(full_code_text)
                    r_c.font.name = "Consolas"
                    r_c.font.size = Pt(8.0)
                    r_c.font.color.rgb = RGBColor(30, 41, 59)
                    
                    p_after = doc.add_paragraph()
                    p_after.paragraph_format.space_before = Pt(2)
                    p_after.paragraph_format.space_after = Pt(6)
                
                code_lines = []
                in_code_block = False
                code_lang = ""
            else:
                in_code_block = True
                code_lang = stripped[3:].strip()
                code_lines = []
            continue

        if in_code_block:
            code_lines.append(line)
            continue

        # Handle Table Lines
        if stripped.startswith('|') and stripped.endswith('|'):
            in_table = True
            table_lines.append(stripped)
            continue
        else:
            if in_table:
                render_markdown_table(doc, table_lines)
                table_lines = []
                in_table = False

        if not stripped:
            continue

        # Headings
        if stripped.startswith('#'):
            h_match = re.match(r'^(#+)\s*(.*)', stripped)
            if h_match:
                level = len(h_match.group(1))
                h_text = h_match.group(2)
                p = doc.add_paragraph()
                p.paragraph_format.space_before = Pt(12 if level <= 2 else 8)
                p.paragraph_format.space_after = Pt(4)
                
                font_size = 16 if level == 1 else (13 if level == 2 else 11)
                color = RGBColor(15, 23, 42) if level <= 2 else RGBColor(14, 116, 144)
                parse_markdown_in_paragraph(p, h_text, default_size=font_size, default_color=color, is_bold=True)
                continue

        # Horizontal Rule
        if stripped in ('---', '***', '___'):
            p_hr = doc.add_paragraph()
            p_hr.paragraph_format.space_before = Pt(4)
            p_hr.paragraph_format.space_after = Pt(4)
            r_hr = p_hr.add_run("―" * 50)
            r_hr.font.color.rgb = RGBColor(203, 213, 225)
            continue

        # Bullet List
        if stripped.startswith(('* ', '- ')):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.left_indent = Inches(0.25)
            r_b = p.add_run("• ")
            r_b.font.name = "Arial"
            r_b.font.size = Pt(9.5)
            r_b.font.color.rgb = RGBColor(14, 116, 144)
            parse_markdown_in_paragraph(p, stripped[2:], default_size=9.5)
            continue

        # Numbered List
        num_match = re.match(r'^(\d+)\.\s*(.*)', stripped)
        if num_match:
            num = num_match.group(1)
            text_body = num_match.group(2)
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.left_indent = Inches(0.25)
            r_n = p.add_run(f"{num}. ")
            r_n.font.name = "Arial"
            r_n.font.size = Pt(9.5)
            r_n.font.color.rgb = RGBColor(15, 118, 110)
            r_n.bold = True
            parse_markdown_in_paragraph(p, text_body, default_size=9.5)
            continue

        # Normal Paragraph
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(4)
        parse_markdown_in_paragraph(p, stripped, default_size=9.5)

    if in_table and table_lines:
        render_markdown_table(doc, table_lines)

def build_antigravity_responses_doc():
    doc = Document()

    # 1-inch margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Document Title Banner
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(4)
    run_main = p_title.add_run("Swat Tourism Platform (STP)")
    run_main.bold = True
    run_main.font.name = "Arial"
    run_main.font.size = Pt(22)
    run_main.font.color.rgb = RGBColor(15, 23, 42)

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(14)
    run_sub = p_sub.add_run("Antigravity Technical Responses with Visual Architecture Diagrams (Current Conversation)")
    run_sub.bold = True
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(13)
    run_sub.font.color.rgb = RGBColor(14, 116, 144)

    # Metadata Table
    meta_headers = ["Attribute", "Details"]
    meta_rows = [
        ["Conversation ID", "040a1073-5ce9-41df-bd7c-d7c9b704e460"],
        ["Content Scope", "Antigravity AI Assistant Responses (Current Chat Only, No User Prompts)"],
        ["Diagram Format", "Full Visual Diagram Format (High-Resolution Graphic Flowcharts & Sequence Maps)"],
        ["Subject / Topic", "Complete End-to-End Hotel Booking Flow, Common Files & Data Flow Pipeline"],
        ["Project Directory", "f:\\Antigravity\\SwatTourismProduction_v2"],
        ["Output Location", "Docs\\Antigravity_Responses_Current_Chat.docx"],
        ["Target Audience", "Executive Presentation for Boss / Leadership Review"]
    ]
    meta_tbl = doc.add_table(rows=1 + len(meta_rows), cols=2)
    meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(meta_tbl, color="CBD5E1", sz="4")

    for i, title in enumerate(meta_headers):
        meta_tbl.rows[0].cells[i].width = [Inches(2.2), Inches(4.6)][i]
        set_cell_background(meta_tbl.rows[0].cells[i], "0F172A")
        set_cell_margins(meta_tbl.rows[0].cells[i], top=120, bottom=120, left=140, right=140)
        p = meta_tbl.rows[0].cells[i].paragraphs[0]
        run = p.add_run(title)
        run.bold = True
        run.font.name = "Arial"
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(255, 255, 255)

    for r_idx, row_data in enumerate(meta_rows):
        row_cells = meta_tbl.rows[r_idx + 1].cells
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            row_cells[c_idx].width = [Inches(2.2), Inches(4.6)][c_idx]
            set_cell_background(row_cells[c_idx], bg)
            set_cell_margins(row_cells[c_idx], top=100, bottom=100, left=140, right=140)
            p = row_cells[c_idx].paragraphs[0]
            run = p.add_run(str(val))
            run.font.name = "Arial"
            run.font.size = Pt(9.0)
            run.font.color.rgb = RGBColor(30, 41, 59)

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # Read Antigravity responses from current conversation
    responses = []
    with open(TRANSCRIPT_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
                src = data.get("source")
                tp = data.get("type")
                content = data.get("content") or ""
                created_at = data.get("created_at") or ""
                if src == "MODEL" and tp == "PLANNER_RESPONSE" and content.strip():
                    responses.append({
                        "content": content.strip(),
                        "timestamp": created_at[:19].replace("T", " ") if created_at else ""
                    })
            except:
                continue

    print(f"Extracted {len(responses)} Antigravity responses.")

    for i, resp in enumerate(responses):
        p_sec = doc.add_paragraph()
        p_sec.paragraph_format.space_before = Pt(16)
        p_sec.paragraph_format.space_after = Pt(4)
        run_sec = p_sec.add_run(f"Part {i+1} — Antigravity Technical Deliverable")
        run_sec.bold = True
        run_sec.font.name = "Arial"
        run_sec.font.size = Pt(14)
        run_sec.font.color.rgb = RGBColor(14, 116, 144)

        if resp["timestamp"]:
            run_ts = p_sec.add_run(f"  [{resp['timestamp']}]")
            run_ts.font.name = "Arial"
            run_ts.font.size = Pt(9)
            run_ts.font.color.rgb = RGBColor(100, 116, 139)

        render_content_to_doc(doc, resp["content"])

        if i < len(responses) - 1:
            p_div = doc.add_paragraph()
            p_div.paragraph_format.space_before = Pt(12)
            p_div.paragraph_format.space_after = Pt(12)
            r_d = p_div.add_run("════════════════════════════════════════════════════════════════════════════")
            r_d.font.color.rgb = RGBColor(148, 163, 184)

    doc.save(OUTPUT_DOCX)
    print(f"[Success] Generated Antigravity responses document with VISUAL DIAGRAMS: {OUTPUT_DOCX}")

if __name__ == "__main__":
    build_antigravity_responses_doc()
