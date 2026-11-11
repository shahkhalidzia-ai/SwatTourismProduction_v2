import os
from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOC_DIR = os.path.dirname(os.path.abspath(__file__))
DIAGRAM_PATH = os.path.join(DOC_DIR, "swat_shared_core_architecture.png")
OUTPUT_DOCX = os.path.join(DOC_DIR, "Swat_Tourism_Shared_Core_Architecture_Guide.docx")

# ---------------------------------------------------------
# 1. GENERATE SHARED CORE ARCHITECTURE DIAGRAM (PNG)
# ---------------------------------------------------------
def generate_core_diagram():
    width, height = 1560, 1020
    img = Image.new("RGBA", (width, height), (248, 250, 252, 255))
    draw = ImageDraw.Draw(img)

    try:
        font_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 24)
        font_sub = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 14)
        font_card_hdr = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 16)
        font_subhead = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 13)
        font_code = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 11)
        font_body = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 12)
        font_arrow = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 12)
    except:
        font_title = font_sub = font_card_hdr = font_subhead = font_code = font_body = font_arrow = ImageFont.load_default()

    # Header Banner
    draw.rectangle([(0, 0), (width, 82)], fill=(15, 23, 42, 255))
    draw.text((36, 14), "SWAT TOURISM PLATFORM — SHARED CORE ARCHITECTURE (ALL MODULES)", fill=(255, 255, 255, 255), font=font_title)
    draw.text((36, 48), "Browser Boot & Rendering → Shared Frontend Pipeline → Shared FastAPI Core → Feature Modules & Database", fill=(148, 163, 184, 255), font=font_sub)

    def draw_card(x, y, w, h, bg, border, title, hdr_bg):
        draw.rounded_rectangle([(x, y), (x + w, y + h)], radius=12, fill=bg, outline=border, width=2)
        draw.rounded_rectangle([(x, y), (x + w, y + 40)], radius=12, fill=hdr_bg)
        draw.rectangle([(x, y + 24), (x + w, y + 40)], fill=hdr_bg)
        draw.text((x + 16, y + 10), title, fill=(255, 255, 255, 255), font=font_card_hdr)

    # 1. BROWSER BOOT & RENDERING (Top Left)
    draw_card(40, 110, 700, 380, (255, 255, 255, 255), (3, 105, 161, 255), "1. BROWSER RENDERING & SHARED REACT SHELL", (3, 105, 161, 255))
    items_boot = [
        ("frontend/index.html", "<div id='root'> + inline anti-flash theme script (data-theme='lake')"),
        ("frontend/src/main.tsx", "createRoot(document.getElementById('root')).render(<App />)"),
        ("frontend/src/App.tsx", "Wraps app in ThemeProvider, AuthProvider, TranslationProvider"),
        ("frontend/src/context/*.tsx", "AuthContext, ThemeContext, TranslationContext shared everywhere"),
        ("Role Workspace Shells", "TouristShell, BusinessShell, CommunityShell, AuthorityShell")
    ]
    cy = 165
    for path, desc in items_boot:
        draw.rounded_rectangle([(56, cy), (722, cy + 54)], radius=6, fill=(240, 249, 255, 255), outline=(186, 230, 253, 255), width=1)
        draw.text((68, cy + 7), path, fill=(3, 105, 161, 255), font=font_subhead)
        draw.text((68, cy + 28), desc, fill=(51, 65, 85, 255), font=font_body)
        cy += 62

    # 2. SHARED FRONTEND NETWORK PIPELINE (Top Right)
    draw_card(820, 110, 700, 380, (255, 255, 255, 255), (14, 116, 144, 255), "2. SHARED FRONTEND API & PROXY PIPELINE", (14, 116, 144, 255))
    items_fe_net = [
        ("Feature API Modules", "frontend/src/api/{bookings,listings,trips,accounts,...}.ts"),
        ("frontend/src/api/client.ts", "apiRequest(): attaches Authorization: Bearer <swat_token> & JSON headers"),
        ("HTTP Transport Call", "fetch('/api/v1/...') & response.json() error/payload parsing"),
        ("frontend/vite.config.ts", "Dev server (:5180) proxies /api and /uploads → http://127.0.0.1:8090"),
        ("Cross-Module Contract", "Every frontend feature uses client.ts as its single HTTP gateway")
    ]
    cy = 165
    for path, desc in items_fe_net:
        draw.rounded_rectangle([(836, cy), (1502, cy + 54)], radius=6, fill=(240, 253, 250, 255), outline=(153, 246, 228, 255), width=1)
        draw.text((848, cy + 7), path, fill=(14, 116, 144, 255), font=font_subhead)
        draw.text((848, cy + 28), desc, fill=(51, 65, 85, 255), font=font_body)
        cy += 62

    # 3. SHARED BACKEND CORE (Bottom Right)
    draw_card(820, 560, 700, 420, (255, 255, 255, 255), (67, 56, 202, 255), "3. SHARED FASTAPI CORE BACKBONE (backend/app/)", (67, 56, 202, 255))
    items_be_core = [
        ("backend/app/main.py", "FastAPI app: mounts 13 /api/v1 routers, CORS, /uploads, lifespan DB init"),
        ("backend/app/core/config.py", "Loads DATABASE_URL, SECRET_KEY, ALGORITHM, API_V1_STR, CORS_ORIGINS"),
        ("backend/app/core/deps.py", "get_current_token_payload() & require_roles() JWT verification"),
        ("backend/app/core/security.py", "Password hashing & JWT token signing / decoding utilities"),
        ("backend/app/core/database.py", "create_async_engine(), AsyncSessionLocal, Base class, get_db()"),
        ("backend/app/core/storage.py & sms.py", "Shared media upload storage & SMS gateway dispatch helpers")
    ]
    cy = 615
    for path, desc in items_be_core:
        draw.rounded_rectangle([(836, cy), (1502, cy + 52)], radius=6, fill=(245, 243, 255, 255), outline=(221, 214, 254, 255), width=1)
        draw.text((848, cy + 6), path, fill=(79, 70, 229, 255), font=font_subhead)
        draw.text((848, cy + 26), desc, fill=(51, 65, 85, 255), font=font_body)
        cy += 59

    # 4. FEATURE MODULES & DATABASE ENGINE (Bottom Left)
    draw_card(40, 560, 700, 420, (255, 255, 255, 255), (180, 83, 9, 255), "4. MODULE EXECUTION & DATABASE ENGINE", (180, 83, 9, 255))
    items_mod_db = [
        ("module/router.py", "Receives /api/v1/<module>/*, injects Depends(get_db) & JWT payload"),
        ("module/schemas.py", "Pydantic validation of request input and JSON response serialization"),
        ("module/service.py", "Executes domain logic & SQLAlchemy ORM queries (select, add, commit)"),
        ("module/models.py", "Table definitions (Booking, Listing, Trip, User) inheriting database.Base"),
        ("PostgreSQL / SQLite Engine", "Executes ACID SQL transactions & returns hydrated ORM objects back"),
        ("backend/alembic/versions/*.py", "Versioned DDL database schema migrations across all module tables")
    ]
    cy = 615
    for path, desc in items_mod_db:
        draw.rounded_rectangle([(56, cy), (722, cy + 52)], radius=6, fill=(255, 251, 235, 255), outline=(253, 230, 138, 255), width=1)
        draw.text((68, cy + 6), path, fill=(180, 83, 9, 255), font=font_subhead)
        draw.text((68, cy + 26), desc, fill=(51, 65, 85, 255), font=font_body)
        cy += 59

    # Connecting Arrows (S-Curve Loop: 1 -> 2 -> 3 -> 4 and back)
    # 1 -> 2 (y=280, y=320)
    draw.line([(740, 275), (820, 275)], fill=(3, 105, 161, 255), width=3)
    draw.polygon([(820, 275), (810, 270), (810, 280)], fill=(3, 105, 161, 255))
    draw.text((748, 253), "Calls API", fill=(3, 105, 161, 255), font=font_arrow)

    draw.line([(820, 330), (740, 330)], fill=(22, 163, 74, 255), width=3)
    draw.polygon([(740, 330), (750, 325), (750, 335)], fill=(22, 163, 74, 255))
    draw.text((746, 338), "JSON UI", fill=(21, 128, 61, 255), font=font_arrow)

    # 2 -> 3 (x=1140 down, x=1200 up)
    draw.line([(1140, 490), (1140, 560)], fill=(14, 116, 144, 255), width=3)
    draw.polygon([(1140, 560), (1135, 550), (1145, 550)], fill=(14, 116, 144, 255))
    draw.text((1030, 515), "HTTP /api/v1", fill=(14, 116, 144, 255), font=font_arrow)

    draw.line([(1210, 560), (1210, 490)], fill=(22, 163, 74, 255), width=3)
    draw.polygon([(1210, 490), (1205, 500), (1215, 500)], fill=(22, 163, 74, 255))
    draw.text((1222, 515), "HTTP JSON", fill=(21, 128, 61, 255), font=font_arrow)

    # 3 -> 4 (y=740, y=795)
    draw.line([(820, 740), (740, 740)], fill=(67, 56, 202, 255), width=3)
    draw.polygon([(740, 740), (750, 735), (750, 745)], fill=(67, 56, 202, 255))
    draw.text((748, 718), "db + auth", fill=(67, 56, 202, 255), font=font_arrow)

    draw.line([(740, 795), (820, 795)], fill=(22, 163, 74, 255), width=3)
    draw.polygon([(820, 795), (810, 790), (810, 800)], fill=(22, 163, 74, 255))
    draw.text((745, 803), "ORM / JSON", fill=(21, 128, 61, 255), font=font_arrow)

    img.save(DIAGRAM_PATH, "PNG")
    print(f"[Diagram] Generated: {DIAGRAM_PATH}")

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
    run_sub = p_sub.add_run("Shared Core Files Across All Modules: Browser Rendering → Frontend Pipeline → FastAPI Core → Database")
    run_sub.bold = True
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(12)
    run_sub.font.color.rgb = RGBColor(14, 116, 144)

    # Metadata
    meta_headers = ["Attribute", "Details"]
    meta_rows = [
        ["Scope", "Application-Wide Shared Infrastructure Files (Frontend, Proxy, Backend Core, Database)"],
        ["Workspace Root", "f:\\Antigravity\\SwatTourismProduction_v2"],
        ["Frontend Entry & Shared", "index.html, main.tsx, App.tsx, context/*.tsx, api/client.ts, vite.config.ts"],
        ["Backend Entry & Core", "app/main.py, core/config.py, core/deps.py, core/security.py, core/database.py, core/storage.py, core/sms.py"],
        ["Modules Served", "Bookings, Listings/Hotels, Trips, Accounts, Safety, Community, Verification, Finance, Reviews, Notifications"]
    ]
    meta_tbl = doc.add_table(rows=1 + len(meta_rows), cols=2)
    format_table(meta_tbl, [Inches(2.0), Inches(4.8)], meta_headers, meta_rows, header_bg="0F172A")

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 1: Architecture Diagram
    h0 = doc.add_heading("1. End-to-End Shared Core Architecture Diagram", level=1)
    h0.paragraph_format.space_before = Pt(8)
    h0.paragraph_format.space_after = Pt(6)
    for r in h0.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    if os.path.exists(DIAGRAM_PATH):
        doc.add_picture(DIAGRAM_PATH, width=Inches(6.8))
        p_cap = doc.add_paragraph("Figure 1: Application-Wide Shared Core Backbone from Browser Rendering to Database Execution")
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(4)
        p_cap.paragraph_format.space_after = Pt(10)
        rc = p_cap.runs[0]
        rc.font.name = "Arial"
        rc.font.size = Pt(8.5)
        rc.font.italic = True
        rc.font.color.rgb = RGBColor(100, 116, 139)

    # Section 2: Shared Frontend Files
    h1 = doc.add_heading("2. Shared Frontend Core Files (Used by All UI Modules)", level=1)
    h1.paragraph_format.space_before = Pt(10)
    h1.paragraph_format.space_after = Pt(6)
    for r in h1.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    fe_headers = ["File Path", "Shared Responsibility Across Whole App"]
    fe_rows = [
        [
            "frontend/index.html",
            "Browser entry HTML. Provides <div id='root'></div>, loads Google Fonts, and runs the inline anti-flash theme script before React loads."
        ],
        [
            "frontend/src/main.tsx",
            "React bootstrapper. Mounts <App /> into #root via createRoot() and imports global CSS (index.css, leaflet.css)."
        ],
        [
            "frontend/src/App.tsx",
            "Master shell. Wraps the entire app in ThemeProvider, AuthProvider, and TranslationProvider, manages role/tab state, and renders TouristShell, BusinessShell, CommunityShell, or AuthorityShell inside ResponsiveLayout."
        ],
        [
            "frontend/src/context/\nAuthContext.tsx",
            "Shared authentication state (user, login, logout, demoLogin) and JWT storage across every screen and role."
        ],
        [
            "frontend/src/context/\nThemeContext.tsx &\nTranslationContext.tsx",
            "Shared visual theme switching and multi-language translation providers accessible from any component."
        ],
        [
            "frontend/src/api/client.ts",
            "Single shared HTTP client (apiRequest<T>()). Every module API file (bookings.ts, listings.ts, trips.ts, etc.) calls this to attach Authorization: Bearer <swat_token>, run fetch('/api/v1/...'), and parse JSON responses/errors."
        ],
        [
            "frontend/vite.config.ts",
            "Development server (port 5180) that proxies all /api and /uploads calls to the FastAPI backend at http://127.0.0.1:8090."
        ]
    ]
    fe_tbl = doc.add_table(rows=1 + len(fe_rows), cols=2)
    format_table(fe_tbl, [Inches(2.3), Inches(4.5)], fe_headers, fe_rows, header_bg="0369A1")

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 3: Shared Backend Core Files
    h2 = doc.add_heading("3. Shared Backend Core Files (Used by All API Modules)", level=1)
    h2.paragraph_format.space_before = Pt(10)
    h2.paragraph_format.space_after = Pt(6)
    for r in h2.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    be_headers = ["File Path", "Shared Responsibility Across Whole Backend"]
    be_rows = [
        [
            "backend/app/main.py",
            "FastAPI application entrypoint. Initializes app, adds CORS middleware, mounts /uploads static media, installs global exception handler, runs startup lifespan (Base.metadata.create_all), and registers all 13 module routers under /api/v1."
        ],
        [
            "backend/app/core/config.py",
            "Centralized Pydantic Settings loading DATABASE_URL, SECRET_KEY, ALGORITHM, API_V1_STR, and CORS_ORIGINS from environment."
        ],
        [
            "backend/app/core/deps.py",
            "Shared FastAPI dependencies: get_current_token_payload(), get_optional_token_payload(), and require_roles() for JWT decoding and role-based access control."
        ],
        [
            "backend/app/core/security.py",
            "Shared password hashing/verification and JWT token signing utilities."
        ],
        [
            "backend/app/core/database.py",
            "Single shared DB engine & session factory: defines Base (inherited by all module models.py), UUIDPrimaryKeyMixin, TimestampMixin, create_async_engine(), AsyncSessionLocal, and get_db()."
        ],
        [
            "backend/app/core/storage.py &\nbackend/app/core/sms.py",
            "Shared file upload storage manager and SMS notification dispatch helper used across modules."
        ]
    ]
    be_tbl = doc.add_table(rows=1 + len(be_rows), cols=2)
    format_table(be_tbl, [Inches(2.3), Inches(4.5)], be_headers, be_rows, header_bg="4338CA")

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 4: How the App Renders & Executes Calls
    h3 = doc.add_heading("4. Whole-App Workflow: Browser Render → Backend → Database", level=1)
    h3.paragraph_format.space_before = Pt(10)
    h3.paragraph_format.space_after = Pt(6)
    for r in h3.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    add_callout(
        doc,
        "STEP 1: How the App Renders in the Browser",
        "1. Browser loads frontend/index.html, sets data-theme='lake' via inline script, and exposes <div id='root'>.\n"
        "2. frontend/src/main.tsx runs createRoot(document.getElementById('root')!).render(<App />).\n"
        "3. frontend/src/App.tsx mounts ThemeProvider, AuthProvider (restoring saved session from localStorage), and TranslationProvider.\n"
        "4. MainAppContent checks user.role and renders the active portal shell (TouristShell, BusinessShell, CommunityShell, or AuthorityShell) inside ResponsiveLayout.",
        bg_color="F0F9FF",
        border_color="0284C7"
    )

    add_callout(
        doc,
        "STEP 2: How Any Action Calls the Backend & Database (and Returns)",
        "1. UI Interaction: A component in any module calls its feature API file (e.g., api/bookings.ts, api/listings.ts, api/trips.ts).\n"
        "2. Shared Transport (api/client.ts): All feature API files call apiRequest(), which attaches localStorage.getItem('swat_token') as Authorization: Bearer <JWT> and calls fetch('/api/v1/...').\n"
        "3. Vite Dev Proxy (vite.config.ts): Port 5180 intercepts /api requests and forwards them to the FastAPI backend on port 8090.\n"
        "4. FastAPI Core (main.py + deps.py + database.py): main.py routes the path to the matching module/router.py, deps.py verifies the JWT, and database.py injects an AsyncSession (db) via Depends(get_db).\n"
        "5. Execution & Return: router.py passes db + payload to module/service.py, which executes SQLAlchemy ORM queries against module/models.py (inheriting database.Base). SQL results return as ORM objects → serialized to JSON by router.py → parsed by client.ts response.json() → React re-renders the UI.",
        bg_color="F0FDF4",
        border_color="16A34A"
    )

    doc.save(OUTPUT_DOCX)
    print(f"[Document] Generated successfully: {OUTPUT_DOCX}")

if __name__ == "__main__":
    generate_core_diagram()
    generate_docx()

