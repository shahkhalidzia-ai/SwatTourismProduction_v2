import os
from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOC_DIR = os.path.dirname(os.path.abspath(__file__))
DIAGRAM_PATH = os.path.join(DOC_DIR, "swat_backend_four_files_flow.png")
OUTPUT_DOCX = os.path.join(DOC_DIR, "Swat_Tourism_Full_Stack_Files_Architecture_Guide.docx")

# ---------------------------------------------------------
# 1. GENERATE FULL-STACK VISUAL CALL FLOW DIAGRAM (PNG)
# ---------------------------------------------------------
def generate_flow_image():
    width, height = 1600, 860
    img = Image.new("RGBA", (width, height), (248, 250, 252, 255))
    draw = ImageDraw.Draw(img)

    try:
        font_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 24)
        font_sub = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 14)
        font_box_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 15)
        font_path = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 11)
        font_body = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 11)
        font_arrow = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 11)
    except:
        font_title = font_sub = font_box_title = font_path = font_body = font_arrow = ImageFont.load_default()

    # Header Banner
    draw.rectangle([(0, 0), (width, 80)], fill=(15, 23, 42, 255))
    draw.text((36, 14), "FULL-STACK CALL FLOW — FRONTEND CLICK TO DATABASE & BACK TO UI", fill=(255, 255, 255, 255), font=font_title)
    draw.text((36, 46), "Frontend (UI → API Module → client.ts) ↔ Backend (router.py → service.py → models.py ↔ database.py → SQL)", fill=(148, 163, 184, 255), font=font_sub)

    # Legend
    draw.text((36, 98), "GOING FORTH (User Click → DB):", fill=(14, 116, 144, 255), font=font_box_title)
    draw.text((305, 100), "React onClick → api/bookings.ts → api/client.ts fetch() → router.py → service.py → models.py → SQL Commit", fill=(51, 65, 85, 255), font=font_sub)
    draw.text((36, 126), "COMING BACK (DB → UI Update):", fill=(21, 128, 61, 255), font=font_box_title)
    draw.text((305, 128), "SQL Rows → models.py Obj → service.py → router.py JSON → client.ts response.json() → React State Re-render", fill=(51, 65, 85, 255), font=font_sub)

    # Tier Boxes (Row 1: Frontend -> Network)
    # 3 Frontend boxes + 4 Backend/DB boxes arranged cleanly in a 2-row S-curve or single horizontal chain
    # Let's use 2 neat horizontal rows for crisp readability!
    # Row 1 (y=180): Frontend UI -> api/bookings.ts -> api/client.ts -> (HTTP POST /api/v1/...) -> router.py
    row1_nodes = [
        ("1. React UI Component", "HotelDetailsModal.tsx\nHotelTodayScreen.tsx", "User clicks button\nhandleInstantBook()\nUpdates UI state", 40, 185, 270, 175, (3, 105, 161, 255), (240, 249, 255, 255)),
        ("2. Frontend API Module", "frontend/src/api/\nbookings.ts & rooms.ts", "createBookingRequest()\nacceptBooking()\nPackages URL & JSON", 430, 185, 270, 175, (2, 132, 199, 255), (240, 249, 255, 255)),
        ("3. HTTP Core Client", "frontend/src/api/\nclient.ts (apiRequest)", "Reads swat_token JWT\nAdds Bearer Header\nCalls fetch('/api/v1/...')", 820, 185, 270, 175, (14, 116, 144, 255), (240, 253, 250, 255)),
        ("4. Backend API Router", "backend/app/modules/\nbookings/router.py", "Matches URL route\nValidates JWT & Schema\nInjects Depends(get_db)", 1210, 185, 340, 175, (15, 118, 110, 255), (240, 253, 250, 255)),
    ]

    for title, path, desc, x, y, w, h, border_col, fill_col in row1_nodes:
        draw.rounded_rectangle([(x, y), (x + w, y + h)], radius=10, fill=fill_col, outline=border_col, width=3)
        draw.rounded_rectangle([(x, y), (x + w, y + 38)], radius=10, fill=border_col)
        draw.rectangle([(x, y + 22), (x + w, y + 38)], fill=border_col)
        draw.text((x + 14, y + 9), title, fill=(255, 255, 255, 255), font=font_box_title)
        draw.text((x + 14, y + 48), path, fill=border_col, font=font_path)
        draw.text((x + 14, y + 86), desc, fill=(51, 65, 85, 255), font=font_body)

    # Row 1 Arrows (Forth: Left -> Right, y=230; Back: Right -> Left, y=315)
    r1_forth = [
        (310, 430, 230, "onClick()"),
        (700, 820, 230, "apiRequest()"),
        (1090, 1210, 230, "HTTP POST"),
    ]
    for x1, x2, ay, lbl in r1_forth:
        draw.line([(x1, ay), (x2, ay)], fill=(14, 116, 144, 255), width=3)
        draw.polygon([(x2, ay), (x2 - 10, ay - 5), (x2 - 10, ay + 5)], fill=(14, 116, 144, 255))
        draw.text((x1 + 14, ay - 20), lbl, fill=(14, 116, 144, 255), font=font_arrow)

    r1_back = [
        (430, 310, 320, "setBooking()"),
        (820, 700, 320, "Promise<Booking>"),
        (1210, 1090, 320, "JSON 201/200"),
    ]
    for x1, x2, ay, lbl in r1_back:
        draw.line([(x1, ay), (x2, ay)], fill=(22, 163, 74, 255), width=3)
        draw.polygon([(x2, ay), (x2 + 10, ay - 5), (x2 + 10, ay + 5)], fill=(22, 163, 74, 255))
        draw.text((x2 + 8, ay + 8), lbl, fill=(21, 128, 61, 255), font=font_arrow)

    # Vertical Connector between Row 1 (router.py) and Row 2 (service.py)
    # Forth (x=1330, down) & Back (x=1430, up)
    draw.line([(1330, 360), (1330, 455)], fill=(14, 116, 144, 255), width=3)
    draw.polygon([(1330, 455), (1325, 445), (1335, 445)], fill=(14, 116, 144, 255))
    draw.text((1230, 398), "Calls Service(db)", fill=(14, 116, 144, 255), font=font_arrow)

    draw.line([(1430, 455), (1430, 360)], fill=(22, 163, 74, 255), width=3)
    draw.polygon([(1430, 360), (1425, 370), (1435, 370)], fill=(22, 163, 74, 255))
    draw.text((1440, 398), "Returns Obj", fill=(21, 128, 61, 255), font=font_arrow)

    # Row 2 (y=455): Database Storage <- models.py <- service.py (Right to Left flow matching S-curve!)
    row2_nodes = [
        ("7. Database Engine", "PostgreSQL / SQLite", "Stores persistent rows\nEnforces constraints\nReturns SQL result sets", 40, 455, 300, 175, (15, 118, 110, 255), (236, 253, 245, 255)),
        ("6. ORM Table Models", "backend/app/modules/\nbookings/models.py", "Booking, BookingItem\nBookingStatusHistory\nInherits Base class", 470, 455, 330, 175, (180, 83, 9, 255), (255, 251, 235, 255)),
        ("5. Domain Service Layer", "backend/app/modules/\nbookings/service.py", "BookingService.create_booking()\nPrice/Night logic, Locks\nselect(), db.add(), commit()", 930, 455, 620, 175, (67, 56, 202, 255), (245, 243, 255, 255)),
    ]

    for title, path, desc, x, y, w, h, border_col, fill_col in row2_nodes:
        draw.rounded_rectangle([(x, y), (x + w, y + h)], radius=10, fill=fill_col, outline=border_col, width=3)
        draw.rounded_rectangle([(x, y), (x + w, y + 38)], radius=10, fill=border_col)
        draw.rectangle([(x, y + 22), (x + w, y + 38)], fill=border_col)
        draw.text((x + 14, y + 9), title, fill=(255, 255, 255, 255), font=font_box_title)
        draw.text((x + 14, y + 48), path, fill=border_col, font=font_path)
        draw.text((x + 14, y + 86), desc, fill=(51, 65, 85, 255), font=font_body)

    # Row 2 Arrows (Forth: Right -> Left, y=500; Back: Left -> Right, y=590)
    r2_forth = [
        (930, 800, 500, "Builds ORM"),
        (470, 340, 500, "SQL Commit"),
    ]
    for x1, x2, ay, lbl in r2_forth:
        draw.line([(x1, ay), (x2, ay)], fill=(14, 116, 144, 255), width=3)
        draw.polygon([(x2, ay), (x2 + 10, ay - 5), (x2 + 10, ay + 5)], fill=(14, 116, 144, 255))
        draw.text((x2 + 14, ay - 20), lbl, fill=(14, 116, 144, 255), font=font_arrow)

    r2_back = [
        (340, 470, 590, "DB Rows"),
        (800, 930, 590, "Model Obj"),
    ]
    for x1, x2, ay, lbl in r2_back:
        draw.line([(x1, ay), (x2, ay)], fill=(22, 163, 74, 255), width=3)
        draw.polygon([(x2, ay), (x2 - 10, ay - 5), (x2 - 10, ay + 5)], fill=(22, 163, 74, 255))
        draw.text((x1 + 14, ay + 8), lbl, fill=(21, 128, 61, 255), font=font_arrow)

    # Foundation Box: database.py (Bottom)
    dx, dy, dw, dh = 280, 690, 1060, 130
    draw.rounded_rectangle([(dx, dy), (dx + dw, dy + dh)], radius=10, fill=(241, 245, 249, 255), outline=(51, 65, 85, 255), width=2)
    draw.rounded_rectangle([(dx, dy), (dx + dw, dy + 36)], radius=10, fill=(30, 41, 59, 255))
    draw.rectangle([(dx, dy + 20), (dx + dw, dy + 36)], fill=(30, 41, 59, 255))
    draw.text((dx + 16, dy + 8), "database.py  (backend/app/core/database.py) — THE CONNECTION PIPE", fill=(255, 255, 255, 255), font=font_box_title)
    draw.text((dx + 16, dy + 48), "• Defines Base = DeclarativeBase (inherited by all classes in models.py)", fill=(30, 41, 59, 255), font=font_body)
    draw.text((dx + 16, dy + 70), "• Initializes AsyncEngine & AsyncSessionLocal connecting Python to PostgreSQL / SQLite", fill=(30, 41, 59, 255), font=font_body)
    draw.text((dx + 16, dy + 92), "• Injects live db session via Depends(get_db) into router.py, passed to service.py, and auto-closed on completion", fill=(30, 41, 59, 255), font=font_body)

    # Dashed pipes linking database.py up to DB Engine, models.py, service.py, and router.py
    draw.line([(190, 630), (350, 690)], fill=(100, 116, 139, 255), width=2)
    draw.line([(635, 630), (635, 690)], fill=(100, 116, 139, 255), width=2)
    draw.line([(1150, 630), (1150, 690)], fill=(100, 116, 139, 255), width=2)

    img.save(DIAGRAM_PATH, "PNG")
    print(f"[Diagram] Generated full-stack diagram: {DIAGRAM_PATH}")

# ---------------------------------------------------------
# 2. DOCX HELPER FUNCTIONS
# ---------------------------------------------------------
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

def add_callout(doc, title, text, bg_color="F8FAFC", border_color="0284C7"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.8)
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
    p.paragraph_format.space_before = Pt(2)
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

def format_table(table, col_widths, headers, rows, header_bg="0F766E"):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table, color="CBD5E1", sz="4")
    
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], header_bg)
        set_cell_margins(hdr_cells[i], top=100, bottom=100, left=140, right=140)
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
            set_cell_margins(row_cells[c_idx], top=90, bottom=90, left=140, right=140)
            p = row_cells[c_idx].paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run(str(val))
            run.font.name = "Arial"
            run.font.size = Pt(8.8)
            run.font.color.rgb = RGBColor(30, 41, 59)

# ---------------------------------------------------------
# 3. BUILD COMPLETE WORD DOCUMENT
# ---------------------------------------------------------
def generate_docx():
    doc = Document()
    
    for section in doc.sections:
        section.top_margin = Inches(0.85)
        section.bottom_margin = Inches(0.85)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)

    # Title Banner
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
    p_sub.paragraph_format.space_after = Pt(12)
    run_sub = p_sub.add_run("Full-Stack Architecture Guide: Frontend Click → API Client → router.py → service.py → models.py → database.py")
    run_sub.bold = True
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(12)
    run_sub.font.color.rgb = RGBColor(14, 116, 144)

    # Metadata
    meta_headers = ["Attribute", "Details"]
    meta_rows = [
        ["Scope", "Complete End-to-End Frontend to Backend Architecture & Bidirectional Call Flow"],
        ["Workspace Root", "f:\\Antigravity\\SwatTourismProduction_v2"],
        ["Frontend Files Covered", "HotelDetailsModal.tsx, HotelTodayScreen.tsx, api/bookings.ts, api/rooms.ts, api/client.ts"],
        ["Backend Files Covered", "bookings/router.py, bookings/service.py, bookings/models.py, core/database.py"],
        ["Frameworks", "React 18, TypeScript, Vite Proxy, FastAPI, SQLAlchemy 2.0 Async ORM, Pydantic"]
    ]
    meta_tbl = doc.add_table(rows=1 + len(meta_rows), cols=2)
    format_table(meta_tbl, [Inches(2.0), Inches(4.8)], meta_headers, meta_rows, header_bg="0F172A")

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 1: What Each File Does (Frontend + Backend)
    h1 = doc.add_heading("1. What Each File Does (Frontend & Backend)", level=1)
    h1.paragraph_format.space_before = Pt(10)
    h1.paragraph_format.space_after = Pt(6)
    for r in h1.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    roles_headers = ["File & Repository Path", "Layer Role", "What It Does"]
    roles_rows = [
        [
            "UI Component\n(frontend/src/modules/tourist/\nHotelDetailsModal.tsx)",
            "The Trigger\n(Frontend UI)",
            "Captures user clicks (e.g. clicking 'Instant Book' runs handleInstantBook()), validates dates/inputs, calls the API module, and updates the screen with the response."
        ],
        [
            "API Module\n(frontend/src/api/\nbookings.ts & rooms.ts)",
            "The Messenger\n(Typed API Functions)",
            "Defines typed helper functions like createBookingRequest(payload) or acceptBooking(id). Specifies the target backend URL path and HTTP method."
        ],
        [
            "HTTP Core Client\n(frontend/src/api/\nclient.ts)",
            "The Transport\n(Fetch + Auth Wrapper)",
            "Executes apiRequest(). Reads the JWT token from localStorage.getItem('swat_token'), adds Authorization: Bearer headers, runs fetch('/api/v1/...'), and parses JSON."
        ],
        [
            "router.py\n(backend/app/modules/\nbookings/router.py)",
            "The Doorway\n(Backend API Layer)",
            "Receives HTTP requests on endpoints (POST /bookings/request), checks JWT tokens, validates JSON via schemas.py, gets a DB session via Depends(get_db), and calls service.py."
        ],
        [
            "service.py\n(backend/app/modules/\nbookings/service.py)",
            "The Brain\n(Business Logic)",
            "Executes all business rules (calculating nights/totals, checking room availability, generating booking references) and runs ORM queries (select(), db.add(), await db.commit())."
        ],
        [
            "models.py\n(backend/app/modules/\nbookings/models.py)",
            "The Blueprint\n(Table Definitions)",
            "Defines Python classes (Booking, BookingItem, HotelRoom) that map directly to database tables, columns, data types, constraints, and foreign keys."
        ],
        [
            "database.py\n(backend/app/core/\ndatabase.py)",
            "The Connection Pipe\n(Engine & Session)",
            "Connects to PostgreSQL/SQLite (create_async_engine), provides the Base class inherited by models.py, and creates per-request DB sessions via get_db()."
        ]
    ]
    roles_tbl = doc.add_table(rows=1 + len(roles_rows), cols=3)
    format_table(roles_tbl, [Inches(2.0), Inches(1.5), Inches(3.3)], roles_headers, roles_rows, header_bg="0E7490")

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 2: How They Are Linked
    h2 = doc.add_heading("2. How All Files Are Linked Together", level=1)
    h2.paragraph_format.space_before = Pt(10)
    h2.paragraph_format.space_after = Pt(6)
    for r in h2.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    links = [
        ("1. UI Component → API Module:", "HotelDetailsModal.tsx imports and calls createBookingRequest() from frontend/src/api/bookings.ts inside its button click handler (handleInstantBook())."),
        ("2. API Module → client.ts:", "bookings.ts passes the endpoint ('/bookings/request') and JSON body into apiRequest() inside frontend/src/api/client.ts."),
        ("3. client.ts → router.py (Network Boundary):", "client.ts calls fetch('/api/v1/bookings/request'), which Vite proxies over HTTP to FastAPI's bookings/router.py."),
        ("4. models.py → database.py:", "Every database table class in models.py (such as Booking) inherits from Base imported from database.py."),
        ("5. router.py → database.py:", "Every endpoint injects a live database session using db: AsyncSession = Depends(get_db) imported from database.py."),
        ("6. router.py → service.py → models.py:", "router.py passes the live db session and request payload into BookingService in service.py, which imports Booking from models.py to read/write rows.")
    ]
    for bold_part, text_part in links:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(4)
        rb = p.add_run(bold_part + " ")
        rb.bold = True
        rb.font.name = "Arial"
        rb.font.size = Pt(9.5)
        rb.font.color.rgb = RGBColor(14, 116, 144)
        rt = p.add_run(text_part)
        rt.font.name = "Arial"
        rt.font.size = Pt(9.5)
        rt.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Section 3: Full-Stack Call Flow Forth & Back Diagram
    h3 = doc.add_heading("3. Visual Call Flow Diagram: Frontend Click to Database & Back", level=1)
    h3.paragraph_format.space_before = Pt(10)
    h3.paragraph_format.space_after = Pt(6)
    for r in h3.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    if os.path.exists(DIAGRAM_PATH):
        doc.add_picture(DIAGRAM_PATH, width=Inches(6.8))
        p_cap = doc.add_paragraph("Figure 1: Complete Bidirectional Call Flow (Frontend Click → client.ts → router.py → service.py → models.py ↔ database.py)")
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(4)
        p_cap.paragraph_format.space_after = Pt(10)
        rc = p_cap.runs[0]
        rc.font.name = "Arial"
        rc.font.size = Pt(8.5)
        rc.font.italic = True
        rc.font.color.rgb = RGBColor(100, 116, 139)

    # Section 4: Step-by-Step Forth & Back Narrative
    h4 = doc.add_heading("4. Step-by-Step Summary: Forth & Back", level=1)
    h4.paragraph_format.space_before = Pt(10)
    h4.paragraph_format.space_after = Pt(6)
    for r in h4.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    add_callout(
        doc,
        "GOING FORTH (User Click → Database Write)",
        "1. User clicks 'Instant Book' in HotelDetailsModal.tsx, triggering handleInstantBook().\n"
        "2. handleInstantBook() calls createBookingRequest() in frontend/src/api/bookings.ts.\n"
        "3. bookings.ts calls apiRequest() in frontend/src/api/client.ts, which attaches the Bearer JWT token and fires HTTP POST /api/v1/bookings/request.\n"
        "4. FastAPI routes the call to router.py, which validates the token/JSON, borrows a DB session (db) from database.py via Depends(get_db), and calls service.py.\n"
        "5. service.py enforces business logic, constructs ORM objects defined in models.py (Booking, BookingItem), and runs await db.commit() to save rows to PostgreSQL/SQLite.",
        bg_color="F0F9FF",
        border_color="0284C7"
    )

    add_callout(
        doc,
        "COMING BACK (Database Rows → Frontend UI Re-Render)",
        "6. PostgreSQL/SQLite returns the newly committed row data to service.py as models.py Python objects (Booking).\n"
        "7. service.py returns that Booking object to router.py.\n"
        "8. router.py serializes the object into JSON using response_model=BookingOut (schemas.py) and sends HTTP 201 Created back across the network.\n"
        "9. database.py automatically closes and releases the DB session.\n"
        "10. client.ts parses response.json() and resolves the Promise back through bookings.ts to HotelDetailsModal.tsx, which calls setBookingSuccess(newBooking) to display the confirmation screen.",
        bg_color="F0FDF4",
        border_color="16A34A"
    )

    doc.save(OUTPUT_DOCX)
    print(f"[Document] Updated successfully with Frontend flow: {OUTPUT_DOCX}")

if __name__ == "__main__":
    generate_flow_image()
    generate_docx()
