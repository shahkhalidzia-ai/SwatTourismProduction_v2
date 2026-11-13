import os
import re
import json
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

TRANSCRIPT_PATH = r"C:\Users\shahkhalid1\.gemini\antigravity\brain\040a1073-5ce9-41df-bd7c-d7c9b704e460\.system_generated\logs\transcript_full.jsonl"
FALLBACK_TRANSCRIPT = r"C:\Users\shahkhalid1\.gemini\antigravity\brain\040a1073-5ce9-41df-bd7c-d7c9b704e460\.system_generated\logs\transcript.jsonl"

DOC_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DOCX = os.path.join(DOC_DIR, "Swat_Tourism_Hotel_Booking_Complete_Chat_Transcript.docx")

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

def clean_user_prompt(text):
    if not text:
        return ""
    # Extract <USER_REQUEST> if present
    match = re.search(r"<USER_REQUEST>(.*?)</USER_REQUEST>", text, re.DOTALL)
    if match:
        return match.group(1).strip()
    # Strip metadata blocks if any
    text = re.sub(r"<ADDITIONAL_METADATA>.*?</ADDITIONAL_METADATA>", "", text, flags=re.DOTALL)
    text = re.sub(r"<USER_SETTINGS_CHANGE>.*?</USER_SETTINGS_CHANGE>", "", text, flags=re.DOTALL)
    return text.strip()

def add_message_bubble(doc, sender_name, timestamp, content, is_user=False):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.8)
    
    bg_color = "F1F5F9" if is_user else "FFFFFF"
    border_color = "0284C7" if is_user else "0F766E"
    
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'  <w:top w:val="single" w:sz="6" w:space="0" w:color="{border_color}"/>'
        f'  <w:left w:val="single" w:sz="36" w:space="0" w:color="{border_color}"/>'
        f'  <w:bottom w:val="single" w:sz="6" w:space="0" w:color="{border_color}"/>'
        f'  <w:right w:val="single" w:sz="6" w:space="0" w:color="{border_color}"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)
    
    # Header line
    p_header = cell.paragraphs[0]
    p_header.paragraph_format.space_before = Pt(2)
    p_header.paragraph_format.space_after = Pt(4)
    
    icon = "👤" if is_user else "🤖"
    role_label = "USER PROMPT" if is_user else "ANTIGRAVITY AI ASSISTANT"
    
    run_icon = p_header.add_run(f"{icon} {role_label} ")
    run_icon.bold = True
    run_icon.font.name = "Arial"
    run_icon.font.size = Pt(10.5)
    run_icon.font.color.rgb = RGBColor(3, 105, 161) if is_user else RGBColor(15, 118, 110)
    
    if timestamp:
        run_ts = p_header.add_run(f"• {timestamp}")
        run_ts.font.name = "Arial"
        run_ts.font.size = Pt(8.5)
        run_ts.font.color.rgb = RGBColor(100, 116, 139)
        
    # Content paragraphs
    lines = content.split("\n")
    in_code_block = False
    code_lines = []
    
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("```"):
            if in_code_block:
                # Flush code block
                p_code = cell.add_paragraph()
                p_code.paragraph_format.space_before = Pt(2)
                p_code.paragraph_format.space_after = Pt(4)
                run_c = p_code.add_run("\n".join(code_lines))
                run_c.font.name = "Consolas"
                run_c.font.size = Pt(8.5)
                run_c.font.color.rgb = RGBColor(30, 41, 59)
                code_lines = []
                in_code_block = False
            else:
                in_code_block = True
                code_lines = []
            continue
            
        if in_code_block:
            code_lines.append(line)
            continue
            
        if stripped.startswith("#"):
            # Markdown heading
            level = len(stripped.split()[0])
            h_text = stripped.lstrip("#").strip()
            p_h = cell.add_paragraph()
            p_h.paragraph_format.space_before = Pt(6)
            p_h.paragraph_format.space_after = Pt(2)
            run_h = p_h.add_run(h_text)
            run_h.bold = True
            run_h.font.name = "Arial"
            run_h.font.size = Pt(11 if level <= 2 else 10)
            run_h.font.color.rgb = RGBColor(15, 23, 42)
        elif stripped.startswith("* ") or stripped.startswith("- "):
            # Bullet point
            p_b = cell.add_paragraph()
            p_b.paragraph_format.space_before = Pt(1)
            p_b.paragraph_format.space_after = Pt(2)
            p_b.paragraph_format.left_indent = Inches(0.2)
            run_bullet = p_b.add_run("• " + stripped[2:])
            run_bullet.font.name = "Arial"
            run_bullet.font.size = Pt(9.5)
            run_bullet.font.color.rgb = RGBColor(51, 65, 85)
        elif stripped:
            # Regular text paragraph
            p_t = cell.add_paragraph()
            p_t.paragraph_format.space_before = Pt(2)
            p_t.paragraph_format.space_after = Pt(3)
            run_t = p_t.add_run(stripped)
            run_t.font.name = "Arial"
            run_t.font.size = Pt(9.5)
            run_t.font.color.rgb = RGBColor(51, 65, 85)
            
    # Add spacing paragraph after table
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(2)
    p_sp.paragraph_format.space_after = Pt(6)

def export_transcript_to_docx():
    path_to_use = TRANSCRIPT_PATH if os.path.exists(TRANSCRIPT_PATH) else FALLBACK_TRANSCRIPT
    if not os.path.exists(path_to_use):
        print(f"Error: Transcript file not found at {path_to_use}")
        return

    doc = Document()
    
    # Configure 1-inch margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Document Header Title
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
    run_sub = p_sub.add_run("Complete Session Chat Transcript & Architectural Dialogue Record")
    run_sub.bold = True
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(13)
    run_sub.font.color.rgb = RGBColor(14, 116, 144)

    # Metadata Box
    meta_headers = ["Attribute", "Value Details"]
    meta_rows = [
        ["Conversation ID", "040a1073-5ce9-41df-bd7c-d7c9b704e460"],
        ["Platform", "Google Antigravity AI Assistant & Swat Tourism Platform"],
        ["Subject / Topic", "Complete Hotel Room Booking Lifecycle, Shared Core Files & Data Flow"],
        ["Workspace Directory", "f:\\Antigravity\\SwatTourismProduction_v2"],
        ["Document Output", "Docs\\Swat_Tourism_Hotel_Booking_Complete_Chat_Transcript.docx"],
        ["Classification", "Official Engineering Chat Record & System Workflow Transcript"]
    ]
    meta_tbl = doc.add_table(rows=1 + len(meta_rows), cols=2)
    meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(meta_tbl, color="CBD5E1", sz="4")
    
    hdr_cells = meta_tbl.rows[0].cells
    for i, title in enumerate(meta_headers):
        hdr_cells[i].width = [Inches(2.2), Inches(4.6)][i]
        set_cell_background(hdr_cells[i], "0F172A")
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
        p = hdr_cells[i].paragraphs[0]
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

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Read transcript lines
    entries = []
    with open(path_to_use, "r", encoding="utf-8") as f:
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
                
                if tp == "USER_INPUT" or src == "USER_EXPLICIT":
                    clean_c = clean_user_prompt(content)
                    if clean_c:
                        entries.append({
                            "sender": "User",
                            "is_user": True,
                            "content": clean_c,
                            "timestamp": created_at[:19].replace("T", " ") if created_at else ""
                        })
                elif src == "MODEL" and tp == "PLANNER_RESPONSE":
                    if content and content.strip():
                        entries.append({
                            "sender": "Antigravity Assistant",
                            "is_user": False,
                            "content": content.strip(),
                            "timestamp": created_at[:19].replace("T", " ") if created_at else ""
                        })
            except Exception as e:
                continue

    print(f"Total conversational messages extracted: {len(entries)}")

    # Add messages to docx
    for idx, msg in enumerate(entries):
        add_message_bubble(
            doc,
            sender_name=msg["sender"],
            timestamp=msg["timestamp"],
            content=msg["content"],
            is_user=msg["is_user"]
        )

    doc.save(OUTPUT_DOCX)
    print(f"[Success] Chat transcript saved successfully to: {OUTPUT_DOCX}")

if __name__ == "__main__":
    export_transcript_to_docx()

