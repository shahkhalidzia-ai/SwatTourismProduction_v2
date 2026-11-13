import os
import re
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOC_DIR = os.path.dirname(os.path.abspath(__file__))
DIAGRAM_PATH = os.path.join(DOC_DIR, "swat_single_comprehensive_architecture.png")
OUTPUT_DOCX = os.path.join(DOC_DIR, "Swat_Tourism_6_Layer_Code_Architecture_and_Communication_Flow.docx")

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

def format_table(table, col_widths, headers, rows, header_bg="0F766E"):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table, color="CBD5E1", sz="4")
    
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], header_bg)
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
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

def add_callout(doc, title, text, bg_color="F8FAFC", border_color="0284C7"):
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

def build_6_layer_docx():
    doc = Document()

    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

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
    p_sub.paragraph_format.space_after = Pt(14)
    run_sub = p_sub.add_run("6-Layer Code Architecture & Inter-Layer Communication Specification")
    run_sub.bold = True
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(13)
    run_sub.font.color.rgb = RGBColor(14, 116, 144)

    # Metadata Box
    meta_headers = ["Attribute", "Details"]
    meta_rows = [
        ["System Domain", "Decoupled 6-Tier Hospitality Architecture & Inter-Process Communication"],
        ["Layer Structure", "Frontend View -> Frontend API -> Backend Gateway -> Domain Service -> ORM Model -> Database"],
        ["Workspace Root Path", "f:\\Antigravity\\SwatTourismProduction_v2"],
        ["Embedded Diagram", "swat_single_comprehensive_architecture.png (Full Visual Diagram Format)"],
        ["Document Output", "Docs\\Swat_Tourism_6_Layer_Code_Architecture_and_Communication_Flow.docx"],
        ["Target Audience", "Executive Presentation for Boss / Leadership Review & Full-Stack Developers"]
    ]
    meta_tbl = doc.add_table(rows=1 + len(meta_rows), cols=2)
    meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    format_table(meta_tbl, [Inches(2.2), Inches(4.6)], meta_headers, meta_rows, header_bg="0F172A")
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    add_callout(
        doc,
        "Executive Summary: Decoupled 6-Layer Architecture",
        "This specification presents the single comprehensive architectural model of the platform. "
        "The codebase is partitioned into 6 distinct, decoupled layers. Each layer has strict responsibilities, "
        "well-defined sample files, and explicit communication boundaries that prevent tight coupling, ensure "
        "transactional integrity, and maintain type safety across the entire application stack.",
        bg_color="F0FDF4",
        border_color="16A34A"
    )

    # Section 1: Full Visual Architecture Diagram
    h1 = doc.add_heading("1. Single Comprehensive 6-Layer Architecture Diagram", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)
    for r in h1.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    p_d = doc.add_paragraph(
        "Figure 1.1 illustrates the single comprehensive map of all 6 layers, showcasing sample files for each layer, "
        "downward forward request communication mechanisms, and upward return response pipelines:"
    )
    p_d.paragraph_format.space_after = Pt(8)

    if os.path.exists(DIAGRAM_PATH):
        doc.add_picture(DIAGRAM_PATH, width=Inches(6.8))
        p_cap = doc.add_paragraph("Figure 1.1: Single Comprehensive 6-Layer Code Architecture & Inter-Layer Communication Flow")
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(4)
        p_cap.paragraph_format.space_after = Pt(14)
        run_cap = p_cap.runs[0]
        run_cap.font.name = "Arial"
        run_cap.font.size = Pt(8.5)
        run_cap.font.italic = True
        run_cap.font.bold = True
        run_cap.font.color.rgb = RGBColor(14, 116, 144)

    # Section 2: Layer-by-Layer Inventory & Sample Files Table
    h2 = doc.add_heading("2. Layer-by-Layer Breakdown & Sample Files Index", level=1)
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(6)
    for r in h2.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    layers_headers = ["Layer # & Name", "Core Technology", "Sample Files (Exact Paths)", "Primary System Task"]
    layers_rows = [
        [
            "Layer 1:\nFrontend View",
            "React 18\nTypeScript\nTailwind CSS\nJSX/TSX",
            "• frontend/src/modules/tourist/HotelDetailsModal.tsx\n• frontend/src/modules/business/HotelTodayScreen.tsx\n• frontend/src/modules/tourist/ReviewModal.tsx",
            "Presents UI, captures user input, calculates nights, displays room rack matrix, triggers instant bookings, and renders reviews."
        ],
        [
            "Layer 2:\nFrontend API",
            "TypeScript\nFetch API\nVite Dev Proxy",
            "• frontend/src/api/bookings.ts & rooms.ts\n• frontend/src/api/client.ts (apiRequest)\n• frontend/vite.config.ts (Port 5180 -> 8090)",
            "Encapsulates network operations. Pulls token from localStorage('swat_token'), injects Authorization: Bearer <JWT>, normalizes errors."
        ],
        [
            "Layer 3:\nBackend Gateway",
            "FastAPI\nPydantic v2\nPython-Jose (JWT)",
            "• backend/app/modules/bookings/router.py\n• backend/app/core/deps.py & core/auth.py\n• backend/app/modules/bookings/schemas.py",
            "Exposes REST endpoints. Enforces JWT auth and RBAC roles ('business', 'tourist'), injects AsyncSession, validates incoming JSON payloads."
        ],
        [
            "Layer 4:\nDomain Service",
            "Python Asyncio\nJinja2 Templates\nTwilio / WhatsApp",
            "• backend/app/modules/bookings/service.py\n• backend/app/modules/bookings/receipt_service.py\n• backend/app/modules/notifications/service.py",
            "Core business logic: generates ref (SWT-HTL-XXXXX), computes rates, locks availability, compiles HTML QR vouchers, and dispatches alerts."
        ],
        [
            "Layer 5:\nModel Layer",
            "SQLAlchemy 2.0\nAsync ORM\nDeclarativeBase",
            "• backend/app/modules/bookings/models.py (Booking, BookingItem)\n• backend/app/modules/listings/models.py (HotelRoom, Availability)\n• backend/app/modules/reviews/models.py (Review)",
            "Maps relational database schema to Python classes. Defines UUID primary keys, foreign keys (tourist_id, listing_id), and relationships."
        ],
        [
            "Layer 6:\nDatabase Engine",
            "PostgreSQL /\nSQLite WAL Mode\nACID Engine",
            "• Tables: bookings, booking_items, booking_payments\n• Tables: hotel_rooms, availability, price_items\n• Tables: reviews, users, business_profiles\n• backend/app/core/database.py",
            "Stores persistent relational data with ACID transaction guarantees, Write-Ahead Logging (WAL) concurrency, foreign keys, and unique checks."
        ]
    ]
    l_tbl = doc.add_table(rows=1 + len(layers_rows), cols=4)
    format_table(l_tbl, [Inches(1.3), Inches(1.2), Inches(2.3), Inches(2.0)], layers_headers, layers_rows, header_bg="0E7490")
    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Section 3: Exact Inter-Layer Communication Mechanisms
    h3 = doc.add_heading("3. Detailed Inter-Layer Communication Protocol", level=1)
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(6)
    for r in h3.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    comm_steps = [
        ("A. Layer 1 (Frontend View) → Layer 2 (Frontend API Client)",
         "• Forward Request: In-memory synchronous TypeScript function call passing a structured JavaScript object.\n"
         "  Code Example: HotelDetailsModal.tsx calls createBookingRequest({ listing_id, price_item_id, check_in_date, check_out_date, guest_count }).\n"
         "• Return Response: Promise<Booking> resolves with typed TypeScript generic <T>. The calling component updates state (e.g., setBooking(data)), triggering React 18 Virtual DOM re-rendering."),

        ("B. Layer 2 (Frontend API Client) → Layer 3 (Backend API Gateway)",
         "• Forward Request: Asynchronous HTTPS / REST network request.\n"
         "  client.ts retrieves the active JWT bearer token from localStorage.getItem('swat_token'). It sends an HTTP POST request to /api/v1/bookings/request with headers: 'Authorization: Bearer <JWT>' and 'Content-Type: application/json'. In local development, vite.config.ts reverse-proxies the request from port 5180 to backend port 8090.\n"
         "• Return Response: FastAPI returns an HTTP 200/201 JSON payload. client.ts verifies response.ok, parses response.json(), and casts it to the TypeScript generic interface."),

        ("C. Layer 3 (Backend API Gateway) → Layer 4 (Domain Service Layer)",
         "• Forward Request: Internal dependency-injected asynchronous Python call.\n"
         "  deps.py decodes the JWT and validates the user role via require_roles(['business', 'tourist']). database.py::get_db() yields an active AsyncSession. schemas.py validates fields into a Pydantic BookingCreateRequest model. The router executes: await BookingService.create_booking(db=db, user_id=user_id, req=req).\n"
         "• Return Response: The service returns an enriched domain model. FastAPI serializes it against the Pydantic BookingOut schema, stripping private fields before network transmission."),

        ("D. Layer 4 (Domain Service Layer) → Layer 5 (Model Layer)",
         "• Forward Request: SQLAlchemy 2.0 Async ORM entity instantiations and session operations.\n"
         "  The service engine initializes the model (booking = Booking(id=uuid.uuid4(), reference='SWT-HTL-89412', status='requested')), adds it to the transaction (db.add(booking)), commits changes (await db.commit()), and refreshes instance state (await db.refresh(booking)).\n"
         "• Return Response: SQLAlchemy hydrates relational database tuples into live Python ORM entity instances with auto-generated timestamps and primary keys."),

        ("E. Layer 5 (Model Layer) → Layer 6 (Database Storage Engine)",
         "• Forward Request: Compiled asynchronous SQL execution over connection pool.\n"
         "  The database driver (asyncpg for PostgreSQL or aiosqlite for SQLite WAL mode) executes: INSERT INTO bookings (id, reference, status, total_amount) VALUES ('550e8400-...', 'SWT-HTL-89412', 'requested', 18000.00).\n"
         "• Return Response: The relational engine commits the transaction to disk, enforces foreign key constraints and triggers, and returns raw persisted row tuples.")
    ]

    for title, desc in comm_steps:
        p_st = doc.add_paragraph()
        p_st.paragraph_format.space_before = Pt(8)
        p_st.paragraph_format.space_after = Pt(2)
        r_title = p_st.add_run(f"▶ {title}")
        r_title.bold = True
        r_title.font.name = "Arial"
        r_title.font.size = Pt(10.5)
        r_title.font.color.rgb = RGBColor(14, 116, 144)

        p_desc = doc.add_paragraph(desc)
        p_desc.paragraph_format.space_before = Pt(0)
        p_desc.paragraph_format.space_after = Pt(6)
        for r in p_desc.runs:
            r.font.name = "Arial"
            r.font.size = Pt(9.5)
            r.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 4: Architectural Rules for Executive Presentation
    h4 = doc.add_heading("4. Key Architectural Rules for Executive Presentation", level=1)
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(6)
    for r in h4.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    add_callout(
        doc,
        "Two Golden Architectural Rules",
        "1. Strict Layer Isolation (No Layer Skipping):\n"
        "   The Frontend View never accesses the Backend API directly; it always invokes typed functions in Layer 2 (api/client.ts). "
        "Similarly, the Backend API Gateway never executes raw SQL directly against the database; it always delegates business logic "
        "to the Domain Service Layer (Layer 4) with dependency-injected AsyncSessions.\n\n"
        "2. End-to-End Type Safety & Data Integrity:\n"
        "   Data is validated at every single boundary. TypeScript interfaces guard client-side parameter contracts, Pydantic v2 schemas "
        "guard the HTTP ingress gateway, and SQLAlchemy 2.0 ORM enforces database column constraints and relational cascades.",
        bg_color="EFF6FF",
        border_color="2563EB"
    )

    doc.save(OUTPUT_DOCX)
    print(f"[Document] Generated 6-Layer Architecture document successfully: {OUTPUT_DOCX}")

if __name__ == "__main__":
    build_6_layer_docx()

