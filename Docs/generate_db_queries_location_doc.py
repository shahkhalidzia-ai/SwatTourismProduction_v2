import os
import sys
from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOC_DIR = os.path.dirname(os.path.abspath(__file__))
DIAGRAM_PATH = os.path.join(DOC_DIR, "swat_db_queries_architecture.png")
OUTPUT_DOCX = os.path.join(DOC_DIR, "Swat_Tourism_Database_Queries_Storage_and_Architecture.docx")

# ---------------------------------------------------------
# 1. GENERATE VISUAL DIAGRAM (PNG) WITH PILLOW
# ---------------------------------------------------------
def generate_diagram_image():
    width, height = 1500, 960
    img = Image.new("RGBA", (width, height), (248, 250, 252, 255))
    draw = ImageDraw.Draw(img)

    # Fonts
    try:
        font_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 25)
        font_subtitle = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 15)
        font_box_header = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 16)
        font_subhead = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 14)
        font_code = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 11)
        font_body = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 12)
    except:
        font_title = font_subtitle = font_box_header = font_subhead = font_code = font_body = ImageFont.load_default()

    # Header Bar
    draw.rectangle([(0, 0), (width, 85)], fill=(15, 23, 42, 255))
    draw.text((40, 14), "SWAT TOURISM PLATFORM (STP) — DATABASE QUERY ARCHITECTURE", fill=(255, 255, 255, 255), font=font_title)
    draw.text((40, 50), "Where Database Queries are Stored: Service Layer ORM Execution, AsyncSession & PostgreSQL / SQLite Storage", fill=(148, 163, 184, 255), font=font_subtitle)

    # Helper function for drawing rounded boxes with header
    def draw_card(x, y, w, h, bg_color, border_color, title, title_bg):
        draw.rounded_rectangle([(x, y), (x + w, y + h)], radius=12, fill=bg_color, outline=border_color, width=2)
        draw.rounded_rectangle([(x, y), (x + w, y + 40)], radius=12, fill=title_bg)
        draw.rectangle([(x, y + 25), (x + w, y + 40)], fill=title_bg)
        draw.text((x + 16, y + 10), title, fill=(255, 255, 255, 255), font=font_box_header)

    # 4 Main Architectural Cards
    # 1. API Route Layer (FastAPI)
    draw_card(40, 115, 680, 360, (255, 255, 255, 255), (14, 116, 144, 255), "1. FASTAPI ROUTE CONTROLLERS (Injects AsyncSession)", (14, 116, 144, 255))
    items_routes = [
        ("bookings/router.py", "POST /request, POST /{id}/pay/unified, check-in, check-out", "Depends(get_db) injects AsyncSession into service calls"),
        ("listings/router.py", "GET /explore, GET /{id}/availability, /assign-rooms", "Handles HTTP validation, authorization & session scoping"),
        ("trips/router.py", "POST /generate, GET /my-trips, /stops", "Delegates multi-table trip transactions to TripService"),
        ("accounts/router.py", "POST /auth/register, /login, /profile", "User identity validation and business profile bindings")
    ]
    cur_y = 168
    for file_name, endpoints, desc in items_routes:
        draw.rounded_rectangle([(55, cur_y), (700, cur_y + 54)], radius=6, fill=(240, 249, 255, 255), outline=(186, 230, 253, 255), width=1)
        draw.text((68, cur_y + 5), file_name, fill=(3, 105, 161, 255), font=font_subhead)
        draw.text((68, cur_y + 22), endpoints, fill=(14, 116, 144, 255), font=font_code)
        draw.text((68, cur_y + 37), desc, fill=(71, 85, 105, 255), font=font_body)
        cur_y += 62

    # 2. Service Layer (Where Queries Actually Live)
    draw_card(760, 115, 700, 360, (255, 255, 255, 255), (67, 56, 202, 255), "2. SERVICE LAYER (WHERE ORM QUERIES ARE STORED)", (67, 56, 202, 255))
    items_services = [
        ("backend/app/modules/bookings/service.py", "BookingService.create_booking, accept_booking, collect_balance", "select(Booking), select(Availability), db.add(BookingPayment)"),
        ("backend/app/modules/listings/service.py", "ListingsService.get_explore, assign_rooms, update_room", "select(Listing), select(HotelRoom), selectinload(price_items)"),
        ("backend/app/modules/trips/service.py", "TripService.create_trip, save_trip_stops, calculate_route", "select(Trip), select(TripStop), select(TripDay)"),
        ("backend/app/modules/accounts/service.py", "AccountService.authenticate, register, get_user_profile", "select(User).where(User.email == ...), db.add(BusinessProfile)")
    ]
    cur_y = 168
    for file_name, methods, desc in items_services:
        draw.rounded_rectangle([(775, cur_y), (1440, cur_y + 54)], radius=6, fill=(245, 243, 255, 255), outline=(221, 214, 254, 255), width=1)
        draw.text((788, cur_y + 5), file_name, fill=(79, 70, 229, 255), font=font_subhead)
        draw.text((788, cur_y + 22), methods, fill=(99, 102, 241, 255), font=font_code)
        draw.text((788, cur_y + 37), desc, fill=(71, 85, 105, 255), font=font_body)
        cur_y += 62

    # 3. Core Database Engine & Session Management
    draw_card(40, 505, 680, 420, (255, 255, 255, 255), (15, 118, 110, 255), "3. CORE DATABASE ENGINE & SESSION (app/core/database.py)", (15, 118, 110, 255))
    items_engine = [
        ("create_async_engine()", "DATABASE_URL: postgresql+asyncpg:// or sqlite+aiosqlite://", "Initializes connection pool, timeout limits, and async dialect"),
        ("AsyncSessionLocal = async_sessionmaker()", "expire_on_commit=False, autoflush=False", "Factory generating isolated asynchronous transaction sessions"),
        ("get_db() Dependency Generator", "yield session -> await session.commit() / rollback()", "Provides per-request database sessions to FastAPI routes"),
        ("SQLite Concurrency Optimization", "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=10000;", "Eliminates database lock contention during concurrent writes"),
        ("Declarative Base Mixins", "Base = DeclarativeBase, UUIDPrimaryKeyMixin, TimestampMixin", "Provides UUID primary keys and server timestamps for all models")
    ]
    cur_y = 558
    for file_name, methods, desc in items_engine:
        draw.rounded_rectangle([(55, cur_y), (700, cur_y + 54)], radius=6, fill=(240, 253, 250, 255), outline=(153, 246, 228, 255), width=1)
        draw.text((68, cur_y + 5), file_name, fill=(15, 118, 110, 255), font=font_subhead)
        draw.text((68, cur_y + 22), methods, fill=(13, 148, 136, 255), font=font_code)
        draw.text((68, cur_y + 37), desc, fill=(71, 85, 105, 255), font=font_body)
        cur_y += 62

    # 4. Storage Engine & Schema Migrations
    draw_card(760, 505, 700, 420, (255, 255, 255, 255), (180, 83, 9, 255), "4. STORAGE PERSISTENCE & MIGRATIONS (PostgreSQL/SQLite)", (180, 83, 9, 255))
    items_storage = [
        ("bookings / booking_items / booking_payments", "Defined in: backend/app/modules/bookings/models.py", "Stores reservation records, prices, audit history, deposits"),
        ("listings / hotel_rooms / availability", "Defined in: backend/app/modules/listings/models.py", "Stores property profiles, physical rooms, and date capacity"),
        ("trips / trip_stops / trip_days", "Defined in: backend/app/modules/trips/models.py", "Stores itinerary routes, geographic stops, and waypoints"),
        ("Alembic Migration Scripts (DDL)", "backend/alembic/versions/*.py", "Tracks versioned SQL migrations (CREATE TABLE, ALTER TABLE)"),
        ("ACID Concurrency & Foreign Keys", "ON DELETE CASCADE, Foreign Keys, Unique Indexes", "Guarantees referential integrity across relational schemas")
    ]
    cur_y = 558
    for file_name, methods, desc in items_storage:
        draw.rounded_rectangle([(775, cur_y), (1440, cur_y + 54)], radius=6, fill=(255, 251, 235, 255), outline=(253, 230, 138, 255), width=1)
        draw.text((788, cur_y + 5), file_name, fill=(180, 83, 9, 255), font=font_subhead)
        draw.text((788, cur_y + 22), methods, fill=(217, 119, 6, 255), font=font_code)
        draw.text((788, cur_y + 37), desc, fill=(71, 85, 105, 255), font=font_body)
        cur_y += 62

    # Connecting directional arrows between sections
    draw.polygon([(725, 280), (755, 290), (725, 300)], fill=(14, 116, 144, 255))
    draw.line([(705, 290), (750, 290)], fill=(14, 116, 144, 255), width=4)

    draw.polygon([(1100, 480), (1110, 505), (1120, 480)], fill=(67, 56, 202, 255))
    draw.line([(1110, 475), (1110, 500)], fill=(67, 56, 202, 255), width=4)

    draw.polygon([(755, 710), (725, 720), (755, 730)], fill=(180, 83, 9, 255))
    draw.line([(760, 720), (730, 720)], fill=(180, 83, 9, 255), width=4)

    img.save(DIAGRAM_PATH, "PNG")
    print(f"[Diagram] Generated: {DIAGRAM_PATH}")

# ---------------------------------------------------------
# 2. DOCX HELPER FUNCTIONS
# ---------------------------------------------------------
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
            set_cell_margins(row_cells[c_idx], top=100, bottom=100, left=140, right=140)
            p = row_cells[c_idx].paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run(str(val))
            run.font.name = "Arial"
            run.font.size = Pt(8.5)
            run.font.color.rgb = RGBColor(30, 41, 59)

# ---------------------------------------------------------
# 3. BUILD COMPLETE WORD DOCUMENT
# ---------------------------------------------------------
def generate_docx():
    doc = Document()
    
    # Configure 1-inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Document Header / Banner Title
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
    run_sub = p_sub.add_run("Where Database Queries Are Stored: Architecture, Service Layer & ORM Execution Guide")
    run_sub.bold = True
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(13)
    run_sub.font.color.rgb = RGBColor(14, 116, 144)

    # Document Metadata Box
    meta_headers = ["Attribute", "Value Details"]
    meta_rows = [
        ["System Domain", "Database Persistence Architecture, SQLAlchemy 2.0 Async ORM, & Query Storage"],
        ["Application Architecture", "Domain-Driven Service Layer Pattern (FastAPI Router → Service Layer ORM → Database Engine)"],
        ["Workspace Root Directory", "f:\\Antigravity\\SwatTourismProduction_v2"],
        ["Core Technologies", "Python 3.12, FastAPI, SQLAlchemy 2.0 Async, aiosqlite / asyncpg, PostgreSQL / SQLite, Alembic"],
        ["Document Classification", "Full Technical Architecture Specification of Query Storage & Execution Pathways"],
        ["Target Audience", "Backend Engineers, Database Administrators, System Architects, & Code Reviewers"]
    ]
    meta_tbl = doc.add_table(rows=1 + len(meta_rows), cols=2)
    meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    format_table(meta_tbl, [Inches(2.2), Inches(4.6)], meta_headers, meta_rows, header_bg="0F172A")

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Callout: Executive Summary
    add_callout(
        doc,
        "Core Finding: Where Are Queries Stored?",
        "In the Swat Tourism Platform, database queries are NOT stored as static .sql text files. Instead, they are written "
        "as modern Python asynchronous object-relational expressions (SQLAlchemy 2.0 Async ORM) located inside the Domain Service Layer "
        "files (e.g., backend/app/modules/bookings/service.py, backend/app/modules/listings/service.py, backend/app/modules/trips/service.py). "
        "The database schema is defined in models.py, connection pooling and session management are in app/core/database.py, and raw DDL "
        "table migrations are tracked in backend/alembic/versions/.",
        bg_color="F0FDF4",
        border_color="16A34A"
    )

    # Section 1: Query Architecture Diagram
    h1 = doc.add_heading("1. Database Query Execution & Storage Diagram", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)
    for r in h1.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    p_desc = doc.add_paragraph(
        "Figure 1.1 illustrates the architectural pathway from FastAPI route dependencies to the Domain Service Layer (where queries reside), "
        "through the SQLAlchemy 2.0 AsyncSession engine, down to the database persistence layer:"
    )
    p_desc.paragraph_format.space_after = Pt(10)

    if os.path.exists(DIAGRAM_PATH):
        doc.add_picture(DIAGRAM_PATH, width=Inches(6.8))
        p_cap = doc.add_paragraph("Figure 1.1: Database Query Storage & Execution Flow Architecture")
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(4)
        p_cap.paragraph_format.space_after = Pt(14)
        run_cap = p_cap.runs[0]
        run_cap.font.name = "Arial"
        run_cap.font.size = Pt(8.5)
        run_cap.font.italic = True
        run_cap.font.color.rgb = RGBColor(100, 116, 139)

    # Section 2: Master Query Storage Index by Domain
    h2 = doc.add_heading("2. Master Query Storage Index by Functional Domain", level=1)
    h2.paragraph_format.space_before = Pt(16)
    h2.paragraph_format.space_after = Pt(6)
    for r in h2.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    p2 = doc.add_paragraph(
        "Every database interaction is strictly encapsulated in its dedicated domain service file. "
        "The table below indexes every backend module, its service file path, the class managing queries, and typical query operations:"
    )
    p2.paragraph_format.space_after = Pt(8)

    query_headers = ["Functional Domain", "Service File Path (Where Queries Live)", "Managing Class", "Key Query Constructs Contained"]
    query_rows = [
        [
            "Room Bookings & Payments",
            "backend/app/modules/bookings/\nservice.py",
            "BookingService",
            "• select(Booking).where(...)\n• select(Availability).where(...)\n• db.add(Booking(...)) (Insert)\n• db.add(BookingPayment(...))\n• db.add(BookingStatusHistory(...))"
        ],
        [
            "Hotels, Rooms & Availability",
            "backend/app/modules/listings/\nservice.py",
            "ListingsService",
            "• select(Listing).where(status='published')\n• select(Availability).where(...)\n• select(HotelRoom).where(...)\n• db.add(HotelRoom(...))\n• selectinload(Listing.price_items)"
        ],
        [
            "Trips & Itinerary Routes",
            "backend/app/modules/trips/\nservice.py",
            "TripService",
            "• select(Trip).where(Trip.tourist_id == ...)\n• select(TripStop).order_by(TripStop.day_number)\n• db.add(Trip(...))\n• db.add_all(stops)"
        ],
        [
            "User Accounts & Business Profiles",
            "backend/app/modules/accounts/\nservice.py",
            "AccountService",
            "• select(User).where(User.email == ...)\n• select(BusinessProfile).where(...)\n• db.add(User(...))\n• db.add(BusinessProfile(...))"
        ],
        [
            "Verified Reviews & Ratings",
            "backend/app/modules/reviews/\nservice.py",
            "ReviewService",
            "• select(Review).where(Review.listing_id == ...)\n• db.add(Review(...))\n• select(func.avg(Review.rating))"
        ],
        [
            "Multi-Channel Notifications",
            "backend/app/modules/notifications/\nservice.py",
            "NotificationService",
            "• select(Notification).where(...)\n• db.add(Notification(channel='sms', ...))\n• db.add(Notification(channel='whatsapp', ...))"
        ]
    ]
    q_col_w = [Inches(1.5), Inches(2.3), Inches(1.4), Inches(1.6)]
    query_tbl = doc.add_table(rows=1 + len(query_rows), cols=4)
    format_table(query_tbl, q_col_w, query_headers, query_rows, header_bg="0E7490")

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # Section 3: Concrete Query Code Snippets from the Repository
    h3 = doc.add_heading("3. Concrete Query Code Snippets from the Repository", level=1)
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(6)
    for r in h3.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    snippets = [
        ("A. Master Booking Insertion (backend/app/modules/bookings/service.py)",
         "# Lines 360-395 in service.py: create_booking()\n"
         "booking = Booking(\n"
         "    id=uuid.uuid4(),\n"
         "    reference=reference,\n"
         "    tourist_id=user_id,\n"
         "    business_id=listing.business_id,\n"
         "    listing_id=listing.id,\n"
         "    status='requested',\n"
         "    payment_status='unpaid',\n"
         "    start_date=request.start_date,\n"
         "    end_date=request.end_date,\n"
         "    total_amount=total_amount,\n"
         ")\n"
         "db.add(booking)\n"
         "await db.commit()  # Translates to: INSERT INTO bookings (...) VALUES (...)"),

        ("B. Calendar Inventory Decrement (backend/app/modules/bookings/service.py)",
         "# Lines 320-335 in service.py: Checking and locking availability\n"
         "avail_q = select(Availability).where(\n"
         "    Availability.price_item_id == item_req.price_item_id,\n"
         "    Availability.date == current_d\n"
         ")\n"
         "avail = (await db.execute(avail_q)).scalar_one_or_none()\n"
         "avail.units_booked += item_req.quantity  # Translates to: UPDATE availability SET units_booked = units_booked + :qty"),

        ("C. Fetching Pending Business Reservations (backend/app/modules/bookings/service.py)",
         "# Lines 480-510 in service.py: get_business_bookings()\n"
         "query = (\n"
         "    select(Booking)\n"
         "    .options(\n"
         "        selectinload(Booking.items).selectinload(BookingItem.price_item),\n"
         "        selectinload(Booking.history),\n"
         "        selectinload(Booking.tourist),\n"
         "        selectinload(Booking.listing),\n"
         "    )\n"
         "    .where(Booking.business_id == business_id)\n"
         "    .order_by(Booking.created_at.desc())\n"
         ")\n"
         "res = await db.execute(query)  # Translates to: SELECT ... FROM bookings WHERE business_id = :id"),

        ("D. Front-Desk Balance Settlement (backend/app/modules/bookings/service.py)",
         "# Lines 940-975 in service.py: collect_balance()\n"
         "booking.property_collected_amount = already_collected + collected_now\n"
         "booking.payment_status = 'paid'\n"
         "pay_entry = BookingPayment(\n"
         "    id=uuid.uuid4(),\n"
         "    booking_id=booking.id,\n"
         "    payment_role='property_balance',\n"
         "    track='property_direct',\n"
         "    payment_method=payment_method,\n"
         "    funds_custody='hotel_operator',\n"
         "    amount=collected_now,\n"
         "    verification_status='confirmed',\n"
         ")\n"
         "db.add(pay_entry)\n"
         "await db.commit()")
    ]

    for title, code_block in snippets:
        p_st = doc.add_paragraph()
        p_st.paragraph_format.space_before = Pt(8)
        p_st.paragraph_format.space_after = Pt(2)
        r_title = p_st.add_run(f"▶ {title}")
        r_title.bold = True
        r_title.font.name = "Arial"
        r_title.font.size = Pt(10.0)
        r_title.font.color.rgb = RGBColor(14, 116, 144)

        # Code block table
        c_tbl = doc.add_table(rows=1, cols=1)
        c_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        c_tbl.autofit = False
        c_cell = c_tbl.cell(0, 0)
        c_cell.width = Inches(6.8)
        set_cell_background(c_cell, "F8FAFC")
        set_cell_margins(c_cell, top=100, bottom=100, left=140, right=140)
        set_table_borders(c_tbl, color="CBD5E1", sz="4")

        cp = c_cell.paragraphs[0]
        cp.paragraph_format.space_before = Pt(2)
        cp.paragraph_format.space_after = Pt(2)
        c_run = cp.add_run(code_block)
        c_run.font.name = "Consolas"
        c_run.font.size = Pt(8.5)
        c_run.font.color.rgb = RGBColor(30, 41, 59)

        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # Section 4: Schema Models, Engine Configuration & Migrations
    h4 = doc.add_heading("4. Table Models, Engine Setup & Migration Scripts", level=1)
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(6)
    for r in h4.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    components_headers = ["Layer / Subsystem", "Exact Relative File Path", "Role in Database Architecture"]
    components_rows = [
        [
            "Table Schema Models (ORM)",
            "backend/app/modules/bookings/models.py\nbackend/app/modules/listings/models.py\nbackend/app/modules/accounts/models.py\nbackend/app/modules/trips/models.py",
            "Defines database tables, primary keys (UUID), foreign keys (CASCADE / RESTRICT), column data types, check constraints, and relationships."
        ],
        [
            "Engine & Async Session",
            "backend/app/core/database.py",
            "Initializes create_async_engine(), AsyncSessionLocal, connection pool, and the get_db() FastAPI dependency generator."
        ],
        [
            "Configuration Settings",
            "backend/app/core/config.py",
            "Loads settings.DATABASE_URL from environment variables (e.g. postgresql+asyncpg:// or sqlite+aiosqlite:///)."
        ],
        [
            "Alembic Schema Migrations",
            "backend/alembic/versions/*.py",
            "Stores versioned Python migration scripts executing raw DDL (CREATE TABLE, ALTER TABLE, ADD COLUMN, CREATE INDEX)."
        ]
    ]
    comp_col_w = [Inches(1.8), Inches(2.6), Inches(2.4)]
    comp_tbl = doc.add_table(rows=1 + len(components_rows), cols=3)
    format_table(comp_tbl, comp_col_w, components_headers, components_rows, header_bg="1E293B")

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # Callout: Why Service Layer ORM is Preferred
    add_callout(
        doc,
        "Architectural Rationale: Why Queries Live in Service Layer",
        "Placing SQLAlchemy queries in the Service Layer rather than loose SQL files provides four massive architectural benefits:\n"
        "1. Compile-Time Type Safety: Model attributes (e.g. Booking.reference, Availability.units_booked) are type-checked by Python.\n"
        "2. SQL Injection Immunity: Parameter binding is automatically handled by SQLAlchemy prepared statements.\n"
        "3. Database Portability: Queries execute identically on PostgreSQL (Production) and SQLite (Development/Test) without syntax modifications.\n"
        "4. Transaction Atomicity: Multi-table mutations (decrementing availability while creating a booking and writing status history) occur within a single atomic async transaction block.",
        bg_color="EFF6FF",
        border_color="2563EB"
    )

    doc.save(OUTPUT_DOCX)
    print(f"[Document] Generated successfully: {OUTPUT_DOCX}")

if __name__ == "__main__":
    generate_diagram_image()
    generate_docx()

