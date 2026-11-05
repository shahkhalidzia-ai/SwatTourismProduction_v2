import os
import re
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

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
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

def add_callout(doc, title, text, bg_color="F8FAFC", border_color="0284C7"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.9)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=120, bottom=120, left=160, right=160)
    
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
    if title:
        r_title = p.add_run(f"📌 {title}\n")
        r_title.bold = True
        r_title.font.name = "Arial"
        r_title.font.size = Pt(10.5)
        r_title.font.color.rgb = RGBColor(15, 23, 42)
    
    r_text = p.add_run(text)
    r_text.font.name = "Arial"
    r_text.font.size = Pt(9.5)
    r_text.font.color.rgb = RGBColor(51, 65, 85)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def parse_markdown_to_docx(md_path, docx_path):
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    doc = Document()
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
    in_table = False
    table_lines = []
    
    def process_table(raw_lines):
        if not raw_lines:
            return
        rows_data = []
        for l in raw_lines:
            l = l.strip()
            if not l.startswith('|'):
                continue
            cells = [c.strip() for c in l.split('|')[1:-1]]
            # Skip separator line like |---|---|
            if all(re.match(r'^:?-+:?$', c) for c in cells):
                continue
            rows_data.append(cells)
            
        if not rows_data:
            return
            
        num_cols = max(len(r) for r in rows_data)
        # normalize row lengths
        for r in rows_data:
            while len(r) < num_cols:
                r.append("")
                
        table = doc.add_table(rows=len(rows_data), cols=num_cols)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False
        set_table_borders(table)
        
        # Calculate proportional widths based on content
        total_width = Inches(6.9)
        col_width = total_width / num_cols
        
        for r_idx, r_data in enumerate(rows_data):
            row = table.rows[r_idx]
            is_header = (r_idx == 0)
            bg = "0E7490" if is_header else ("F8FAFC" if r_idx % 2 == 1 else "FFFFFF")
            
            for c_idx, cell_text in enumerate(r_data):
                cell = row.cells[c_idx]
                cell.width = col_width
                set_cell_background(cell, bg)
                set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
                
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(2)
                p.paragraph_format.space_after = Pt(2)
                
                # Clean markdown tags in cell
                clean_text = re.sub(r'\*\*(.*?)\*\*', r'\1', cell_text)
                clean_text = re.sub(r'\*(.*?)\*', r'\1', clean_text)
                clean_text = re.sub(r'`(.*?)`', r'\1', clean_text)
                clean_text = clean_text.replace('<br>', '\n')
                
                run = p.add_run(clean_text)
                run.font.name = "Arial"
                run.font.size = Pt(8.5)
                if is_header:
                    run.bold = True
                    run.font.color.rgb = RGBColor(255, 255, 255)
                else:
                    if "Fully Covered" in cell_text or "100%" in cell_text or "Verified" in cell_text:
                        run.bold = True
                        run.font.color.rgb = RGBColor(22, 163, 74)
                    elif "Partially" in cell_text or "Pending" in cell_text or "Gap" in cell_text:
                        run.bold = True
                        run.font.color.rgb = RGBColor(217, 119, 6)
                    else:
                        run.font.color.rgb = RGBColor(30, 41, 59)
                        
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    for line in lines:
        s = line.rstrip()
        
        # Table detection
        if s.strip().startswith('|'):
            in_table = True
            table_lines.append(s)
            continue
        else:
            if in_table:
                process_table(table_lines)
                table_lines = []
                in_table = False
                
        if not s.strip():
            continue
            
        # Headers
        if s.startswith('# '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(4)
            run = p.add_run(s[2:].strip())
            run.bold = True
            run.font.name = "Arial"
            run.font.size = Pt(18)
            run.font.color.rgb = RGBColor(14, 116, 144)
        elif s.startswith('## '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(3)
            run = p.add_run(s[3:].strip())
            run.bold = True
            run.font.name = "Arial"
            run.font.size = Pt(13.5)
            run.font.color.rgb = RGBColor(15, 23, 42)
        elif s.startswith('### '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run(s[4:].strip())
            run.bold = True
            run.font.name = "Arial"
            run.font.size = Pt(11)
            run.font.color.rgb = RGBColor(2, 132, 199)
        elif s.startswith('#### '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run(s[5:].strip())
            run.bold = True
            run.font.name = "Arial"
            run.font.size = Pt(10)
            run.font.color.rgb = RGBColor(51, 65, 85)
        elif s.startswith('> '):
            # Callout
            add_callout(doc, "", s[2:].strip())
        elif s.startswith('---'):
            continue
        elif s.startswith('- ') or s.startswith('* '):
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            clean_s = re.sub(r'\*\*(.*?)\*\*', r'\1', s[2:])
            clean_s = re.sub(r'`(.*?)`', r'\1', clean_s)
            run = p.add_run(clean_s)
            run.font.name = "Arial"
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(51, 65, 85)
        elif re.match(r'^\d+\.\s+', s):
            p = doc.add_paragraph(style='List Number')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            text_part = re.sub(r'^\d+\.\s+', '', s)
            clean_s = re.sub(r'\*\*(.*?)\*\*', r'\1', text_part)
            clean_s = re.sub(r'`(.*?)`', r'\1', clean_s)
            run = p.add_run(clean_s)
            run.font.name = "Arial"
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(51, 65, 85)
        else:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(4)
            clean_s = re.sub(r'\*\*(.*?)\*\*', r'\1', s)
            clean_s = re.sub(r'`(.*?)`', r'\1', clean_s)
            run = p.add_run(clean_s)
            run.font.name = "Arial"
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(51, 65, 85)
            
    if in_table:
        process_table(table_lines)
        
    doc.save(docx_path)
    print(f"Generated: {docx_path}")

if __name__ == '__main__':
    # 1. Convert swat-tourism-stp-srs2-gap-analysis.md
    md_srs = r"F:\Antigravity\SwatTourismProduction_v2\Docs\swat-tourism-stp-srs2-gap-analysis.md"
    docx_srs_v2 = r"F:\Antigravity\SwatTourismProduction_v2\Docs\swat-tourism-stp-srs2-gap-analysis.docx"
    docx_srs_v1 = r"F:\Antigravity\SwatTourismProduction\Docs\swat-tourism-stp-srs2-gap-analysis.docx"
    
    parse_markdown_to_docx(md_srs, docx_srs_v2)
    shutil.copy2(docx_srs_v2, docx_srs_v1)
    print(f"Copied to: {docx_srs_v1}")
    
    # 2. Also ensure swat-tourism-post-persistence-gap-analysis.md is converted
    md_post = r"F:\Antigravity\SwatTourismProduction_v2\Docs\swat-tourism-post-persistence-gap-analysis.md"
    docx_post_v2 = r"F:\Antigravity\SwatTourismProduction_v2\Docs\swat-tourism-post-persistence-gap-analysis.docx"
    docx_post_v1 = r"F:\Antigravity\SwatTourismProduction\Docs\swat-tourism-post-persistence-gap-analysis.docx"
    parse_markdown_to_docx(md_post, docx_post_v2)
    shutil.copy2(docx_post_v2, docx_post_v1)
    print(f"Copied to: {docx_post_v1}")
