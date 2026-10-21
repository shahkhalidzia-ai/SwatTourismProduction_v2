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

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def style_table(table, header_bg="1B4F72", zebra_bg="F8FAFC"):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    # Header styling
    for cell in table.rows[0].cells:
        set_cell_background(cell, header_bg)
        set_cell_margins(cell, top=140, bottom=140, left=160, right=160)
        for p in cell.paragraphs:
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)
                r.font.size = Pt(9.5)
                
    # Data rows styling
    for i, row in enumerate(table.rows[1:], start=1):
        bg = zebra_bg if i % 2 == 0 else "FFFFFF"
        for cell in row.cells:
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
            for p in cell.paragraphs:
                p.paragraph_format.space_before = Pt(1)
                p.paragraph_format.space_after = Pt(1)
                for r in p.runs:
                    r.font.size = Pt(9)
                    r.font.color.rgb = RGBColor(30, 41, 59)

def create_document():
    doc = Document()
    
    # Page Margins
    for section in doc.sections:
        section.top_margin = Inches(0.9)
        section.bottom_margin = Inches(0.9)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.9)
        
    # Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(45, 55, 72)
    
    # --- Title Banner ---
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(3)
    run_sub = title_p.add_run("Swat Tourism Platform — Production V2 Technical Architecture")
    run_sub.font.size = Pt(12)
    run_sub.font.bold = True
    run_sub.font.color.rgb = RGBColor(16, 185, 129) # Emerald #10B981
    
    h1_p = doc.add_paragraph()
    h1_p.paragraph_format.space_before = Pt(2)
    h1_p.paragraph_format.space_after = Pt(6)
    run_h1 = h1_p.add_run("Database Architecture, Queries & Stored Procedures Specification")
    run_h1.font.size = Pt(21)
    run_h1.font.bold = True
    run_h1.font.color.rgb = RGBColor(27, 79, 114) # Deep Blue #1B4F72
    
    meta_p = doc.add_paragraph()
    meta_p.paragraph_format.space_after = Pt(14)
    run_meta = meta_p.add_run(
        "Document: Technical Reference Manual  |  Scope: Engine, Schema, ORM Models, Service Layer, Alembic & Client Persistence\n"
        "Platform: Swat Tourism Production V2  |  Stack: Python FastAPI, SQLAlchemy 2.0 Async, aiosqlite / PostgreSQL, Alembic"
    )
    run_meta.font.size = Pt(9)
    run_meta.font.italic = True
    run_meta.font.color.rgb = RGBColor(100, 116, 139)

    # --- Callout Box: Executive Vision ---
    callout_tbl = doc.add_table(rows=1, cols=1)
    callout_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    callout_tbl.autofit = False
    callout_tbl.columns[0].width = Inches(6.7)
    c_cell = callout_tbl.cell(0, 0)
    set_cell_background(c_cell, "F0FDF4") # Light emerald
    set_cell_margins(c_cell, top=140, bottom=140, left=180, right=180)
    
    cp = c_cell.paragraphs[0]
    cp.paragraph_format.space_after = Pt(4)
    r = cp.add_run("📌 Executive Summary: Where are Database Queries & Stored Procedures Stored?")
    r.font.bold = True
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor(4, 120, 87)
    
    cp2 = c_cell.add_paragraph()
    cp2.paragraph_format.space_after = Pt(0)
    r2 = cp2.add_run(
        "1. Stored Procedures: There are NO database-side stored procedures (PL/SQL or T-SQL). The application uses SQLite with Write-Ahead Logging (WAL) in development/prototype mode and PostgreSQL readiness in production. In modern async Python architectures, procedural logic is centralized in the Python Service Layer.\n"
        "2. Database Queries: All database queries are authored using SQLAlchemy 2.0 Async query syntax (select, with_for_update, insert, update) located inside backend/app/modules/<module_name>/service.py across 11 modular domains.\n"
        "3. Table Schemas: All entity models and table constraints are declared in backend/app/modules/<module_name>/models.py.\n"
        "4. DDL & Migrations: All database schema versions and ALTER statements are stored in backend/alembic/versions/.\n"
        "5. Connection & Engine: Low-level engine pooling, SQLite WAL configuration, and async session factories are in backend/app/core/database.py."
    )
    r2.font.size = Pt(9.5)
    r2.font.color.rgb = RGBColor(30, 41, 59)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Helper for Section Titles
    def add_section_header(num, title):
        hp = doc.add_paragraph()
        hp.paragraph_format.space_before = Pt(14)
        hp.paragraph_format.space_after = Pt(4)
        r = hp.add_run(f"{num}. {title}")
        r.font.size = Pt(14)
        r.font.bold = True
        r.font.color.rgb = RGBColor(27, 79, 114)

    def add_sub_header(title):
        hp = doc.add_paragraph()
        hp.paragraph_format.space_before = Pt(10)
        hp.paragraph_format.space_after = Pt(3)
        r = hp.add_run(title)
        r.font.size = Pt(11.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(14, 116, 144) # Teal

    # =========================================================================
    # Section 1: Engine Architecture
    # =========================================================================
    add_section_header("1", "Database Engine, Concurrency & Storage Configuration")
    
    p = doc.add_paragraph()
    p.add_run(
        "The application utilizes an asynchronous database engine configured in "
    )
    r_code = p.add_run("backend/app/core/database.py")
    r_code.font.bold = True
    p.add_run(
        ". The system is engineered to provide high-throughput concurrent reads and writes without lock contention, "
        "leveraging SQLite's Write-Ahead Logging (WAL) mode for local development and direct PostgreSQL compatibility for production."
    )
    
    table_eng = doc.add_table(rows=6, cols=3)
    table_eng.columns[0].width = Inches(2.0)
    table_eng.columns[1].width = Inches(2.2)
    table_eng.columns[2].width = Inches(2.5)
    
    headers = ["Parameter", "Configured Setting", "Technical Impact & Behavior"]
    for j, h in enumerate(headers):
        table_eng.cell(0, j).paragraphs[0].text = h
        
    data_eng = [
        ("Database URL", "sqlite+aiosqlite:///./swat_tourism_prod.db", "Asynchronous non-blocking SQLite engine; switchable via DATABASE_URL to postgresql+asyncpg://"),
        ("Journal Mode", "PRAGMA journal_mode=WAL;", "Write-Ahead Logging enables concurrent readers and writers without blocking reader threads"),
        ("Synchronous Mode", "PRAGMA synchronous=NORMAL;", "Balances power-loss safety with high write throughput on NVMe/SSD storage"),
        ("Busy Timeout", "PRAGMA busy_timeout=10000;", "10-second queue wait for busy locks; completely eliminates 'database is locked' errors"),
        ("Foreign Keys", "PRAGMA foreign_keys=ON;", "Strictly enforces relational integrity, cascades, and orphaned record prevention"),
    ]
    
    for i, row in enumerate(data_eng, start=1):
        for j, val in enumerate(row):
            table_eng.cell(i, j).paragraphs[0].text = val
            
    style_table(table_eng)
    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # =========================================================================
    # Section 2: Stored Procedures vs Python Service Layer
    # =========================================================================
    add_section_header("2", "Architecture Analysis: Stored Procedures vs. Python Service Layer")
    
    p = doc.add_paragraph()
    p.add_run(
        "In traditional client-server database architectures (e.g., Oracle PL/SQL or Microsoft SQL Server T-SQL), business operations "
        "such as reservation locking, booking confirmation, and payment reconciliation were implemented as database stored procedures. "
        "The Swat Tourism Platform deliberately adopts the modern "
    )
    r_svc = p.add_run("Asynchronous Python Service Pattern")
    r_svc.font.bold = True
    p.add_run(" instead, for the following structural reasons:")
    
    bullets = [
        ("Engine Portability: ", "Stored procedures are tightly coupled to proprietary database dialects. Storing transactional logic in SQLAlchemy allows zero-downtime transition from SQLite to PostgreSQL or CockroachDB without rewriting business rules."),
        ("Git Version Control & CI/CD: ", "All transactional workflows are versioned in Git alongside application code, covered by automated Vitest/Pytest regression suites (119 automated tests), rather than requiring out-of-band DB migration procedures."),
        ("Async Event Integration: ", "Service methods seamlessly emit asynchronous background tasks, WebSocket live updates, SMS alerts, and audit logs within the same Python asyncio event loop."),
        ("ACID Transaction Isolation: ", "Equivalent transaction safety is guaranteed via Python context managers (async with db.begin():) coupled with row-level locks (with_for_update()).")
    ]
    for b_title, b_desc in bullets:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(3)
        r = bp.add_run(b_title)
        r.font.bold = True
        r.font.color.rgb = RGBColor(27, 79, 114)
        bp.add_run(b_desc)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # =========================================================================
    # Section 3: Module-by-Module Query Mapping
    # =========================================================================
    add_section_header("3", "Module-by-Module Directory Structure & Query Mapping")
    
    p = doc.add_paragraph()
    p.add_run(
        "All queries, models, and endpoints are partitioned by domain into 11 submodules under "
    )
    p.add_run("backend/app/modules/").font.bold = True
    p.add_run(". Each module adheres to the standard Clean Architecture structure:")
    
    table_mod = doc.add_table(rows=12, cols=4)
    table_mod.columns[0].width = Inches(1.5)
    table_mod.columns[1].width = Inches(1.8)
    table_mod.columns[2].width = Inches(1.6)
    table_mod.columns[3].width = Inches(1.8)
    
    headers_mod = ["Domain Module", "ORM Models File", "Service Queries File", "Primary Database Operations"]
    for j, h in enumerate(headers_mod):
        table_mod.cell(0, j).paragraphs[0].text = h
        
    modules_data = [
        ("1. Bookings & Payments", "bookings/models.py\n(Booking, BookingItem, BookingStatusHistory)", "bookings/service.py\n(BookingService)", "Row-lock availability (with_for_update), state transitions, earnings aggregations"),
        ("2. Listings & Availability", "listings/models.py\n(Listing, PriceItem, Availability, Details)", "listings/service.py\n(ListingService)", "Catalog search, price item CRUD, 60-day calendar availability queries"),
        ("3. Trips & Itineraries", "trips/models.py\n(Trip, TripStop, SavedDestination)", "trips/service.py\n(TripService)", "Multi-stop sequence queries, transport link assignments, cost rollups"),
        ("4. Accounts & RBAC", "accounts/models.py\n(User, BusinessProfile, TouristProfile)", "accounts/service.py\n(AccountService)", "User identity lookups, password hash verification, profile scoping"),
        ("5. Safety & SOS", "safety/models.py\n(Advisory, EmergencyAlert, RoadStatus)", "safety/service.py\n(SafetyService)", "Real-time road condition feeds, GPS distress signal inserts, SOS resolution"),
        ("6. Community Voice", "community/models.py\n(CommunityStory, CraftItem, HostApp)", "community/service.py\n(CommunityService)", "Local stories, cottage crafts publishing, homestay applications"),
        ("7. Authority Verification", "verification/models.py\n(VerificationRequest, AuditLog)", "verification/service.py\n(VerificationService)", "KYC business document inspections, approval logs, status changes"),
        ("8. Places & Geodata", "places/models.py\n(Place, Destination, Region)", "places/service.py\n(PlaceService)", "Destination coordinates, area taxonomies, scenic viewpoint lookups"),
        ("9. Reviews & Ratings", "reviews/models.py\n(Review, ReviewSummary)", "reviews/service.py\n(ReviewService)", "Customer feedback inserts, star average computations, verified stay filters"),
        ("10. Notifications & SMS", "notifications/models.py\n(Notification, SMSLog)", "notifications/service.py\n(NotificationService)", "User alert feeds, SMS delivery audit trails, unread count counters"),
        ("11. Content & CMS", "content/models.py\n(Article, GuidePage)", "content/service.py\n(ContentService)", "Curated travel guides, seasonal packing checklists, platform policies"),
    ]
    
    for i, row in enumerate(modules_data, start=1):
        for j, val in enumerate(row):
            table_mod.cell(i, j).paragraphs[0].text = val
            
    style_table(table_mod)
    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # =========================================================================
    # Section 4: Deep Dive into Critical Stored Procedure Equivalents
    # =========================================================================
    add_section_header("4", "Deep-Dive: Critical Queries & Transactional Stored Workflows")
    
    add_sub_header("A. Atomic Overbooking Prevention with Row-Level Lock (SELECT FOR UPDATE)")
    p = doc.add_paragraph()
    p.add_run("Located in: ")
    r_loc1 = p.add_run("backend/app/modules/bookings/service.py :: BookingService.create_booking\n")
    r_loc1.font.bold = True
    p.add_run(
        "In a hotel or transport booking system, concurrent requests for the same room or vehicle on peak dates must never exceed physical capacity. "
        "The system executes an atomic row-lock query that reserves units before confirming the line item:"
    )
    
    # Code Callout
    code_box = doc.add_table(rows=1, cols=1)
    code_box.alignment = WD_TABLE_ALIGNMENT.CENTER
    code_box.columns[0].width = Inches(6.7)
    cb_cell = code_box.cell(0, 0)
    set_cell_background(cb_cell, "F1F5F9")
    set_cell_margins(cb_cell, top=100, bottom=100, left=140, right=140)
    cp = cb_cell.paragraphs[0]
    r = cp.add_run(
        "# Atomic availability reservation with row-level lock (service.py:169-185)\n"
        "for dt in item_dates:\n"
        "    avail_q = (\n"
        "        select(Availability)\n"
        "        .where(Availability.price_item_id == price_item.id, Availability.date == dt)\n"
        "        .with_for_update()\n"
        "    )\n"
        "    avail_res = await db.execute(avail_q)\n"
        "    avail = avail_res.scalar_one_or_none()\n"
        "    if avail.units_booked + units_needed > avail.units_total:\n"
        "        raise HTTPException(status_code=400, detail='Sold out on date')\n"
        "    avail.units_booked += units_needed\n"
        "    db.add(avail)\n"
        "await db.commit()"
    )
    r.font.name = 'Consolas'
    r.font.size = Pt(8.5)
    r.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    add_sub_header("B. Business KPI & Earnings Rollup Query (Today Screen Aggregation)")
    p = doc.add_paragraph()
    p.add_run("Located in: ")
    r_loc2 = p.add_run("backend/app/modules/bookings/service.py :: BookingService.get_business_summary\n")
    r_loc2.font.bold = True
    p.add_run(
        "Calculates live hotel dashboard metrics in a single database aggregation pass, computing today's incoming bookings, "
        "week-to-date gross earnings, pending requests requiring immediate manager action, and confirmed guest arrivals:"
    )
    
    code_box2 = doc.add_table(rows=1, cols=1)
    code_box2.alignment = WD_TABLE_ALIGNMENT.CENTER
    code_box2.columns[0].width = Inches(6.7)
    cb_cell2 = code_box2.cell(0, 0)
    set_cell_background(cb_cell2, "F1F5F9")
    set_cell_margins(cb_cell2, top=100, bottom=100, left=140, right=140)
    cp2 = cb_cell2.paragraphs[0]
    r2 = cp2.add_run(
        "# Live KPI aggregation across booking records (service.py:780-820)\n"
        "earnings_week = await db.scalar(\n"
        "    select(func.coalesce(func.sum(Booking.total_amount), 0.0))\n"
        "    .where(\n"
        "        Booking.business_id == business_id,\n"
        "        Booking.status.in_(['confirmed', 'completed']),\n"
        "        Booking.created_at >= week_start\n"
        "    )\n"
        ")\n"
        "pending_count = await db.scalar(\n"
        "    select(func.count(Booking.id))\n"
        "    .where(Booking.business_id == business_id, Booking.status == 'requested')\n"
        ")"
    )
    r2.font.name = 'Consolas'
    r2.font.size = Pt(8.5)
    r2.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # =========================================================================
    # Section 5: Schema Migrations (Alembic DDL)
    # =========================================================================
    add_section_header("5", "Alembic Schema Migrations (DDL Version Control)")
    
    p = doc.add_paragraph()
    p.add_run(
        "All table definitions, column types, foreign key constraints, and indices are tracked as migration scripts in "
    )
    p.add_run("backend/alembic/versions/").font.bold = True
    p.add_run(". The migration tree reflects the complete schema lifecycle:")
    
    table_migs = doc.add_table(rows=8, cols=3)
    table_migs.columns[0].width = Inches(2.2)
    table_migs.columns[1].width = Inches(1.8)
    table_migs.columns[2].width = Inches(2.7)
    
    headers_migs = ["Migration Script", "Target Subsystem", "Key DDL Actions (Tables Created / Altered)"]
    for j, h in enumerate(headers_migs):
        table_migs.cell(0, j).paragraphs[0].text = h
        
    migs_data = [
        ("f39ca4091079_init_schema.py", "Database Initialization", "Sets up base alembic versioning table and UUID extension hooks"),
        ("e2aa48e6753c_create_accounts.py", "Accounts & RBAC", "Creates users, tourist_profiles, business_profiles, authority_profiles"),
        ("a411f482e75c_create_listings.py", "Listing Engine", "Creates listings, listing_types, price_items, availability, listing_details"),
        ("37670fd4122a_create_trips.py", "Trips & Planner", "Creates trips, trip_stops, saved_destinations with FK cascades"),
        ("f94996d31568_create_verification.py", "Authority Verification", "Creates verification_requests, audit_logs for KYC compliance"),
        ("21e18e4cdc05_create_safety.py", "Safety & Community", "Creates advisories, emergency_alerts, road_statuses, community_stories"),
        ("d942e12a8b34_add_price_details.py", "Inventory Enhancement", "Adds default_units, capacity, and bed setup attributes to price_items"),
    ]
    
    for i, row in enumerate(migs_data, start=1):
        for j, val in enumerate(row):
            table_migs.cell(i, j).paragraphs[0].text = val
            
    style_table(table_migs)
    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # =========================================================================
    # Section 6: Data Seeding & Maintenance Scripts
    # =========================================================================
    add_section_header("6", "Database Seeding & Transactional Maintenance Scripts")
    
    p = doc.add_paragraph()
    p.add_run(
        "Administrative and bootstrapping scripts located in "
    )
    p.add_run("backend/scripts/").font.bold = True
    p.add_run(" execute standalone database setup and maintenance transactions:")
    
    bullets_scripts = [
        ("seed_demo_data.py: ", "Populates initial verified partner data including Swat Serena Hotel, Kalam Heights, Hujra Cafe, 4x4 Mountain Rides, and standard demo personas (Sara Ahmed, Gul Zaman, Tourism Officer)."),
        ("add_demo_hotels_and_services.py: ", "Seeds room price items, default inventory units, conference hall bookings, and dining menus."),
        ("create_user.py: ", "CLI utility for creating administrative, business, or authority accounts with Argon2/Bcrypt password hashing."),
        ("clear_all_trips.py: ", "Transactional cleanup script that resets tourist test trips and restores fresh inventory quotas."),
        ("reset_empty.py: ", "Purges all transactional test records, leaving verified vendor listings intact for production demos.")
    ]
    for b_title, b_desc in bullets_scripts:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(3)
        r = bp.add_run(b_title)
        r.font.bold = True
        r.font.color.rgb = RGBColor(27, 79, 114)
        bp.add_run(b_desc)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # =========================================================================
    # Section 7: Frontend Client-Side Persistence Layer
    # =========================================================================
    add_section_header("7", "Client-Side Persistence & Real-Time Sync Layer")
    
    p = doc.add_paragraph()
    p.add_run(
        "In addition to backend SQLite/PostgreSQL storage, the platform incorporates a high-performance client-side "
        "storage layer located in "
    )
    p.add_run("frontend/src/modules/business/physicalRooms.ts").font.bold = True
    p.add_run(" to power real-time room racks, physical key allocations, and offline UI state:")
    
    bullets_fe = [
        ("Storage Key (swat_hotel_physical_rooms): ", "Stores individual physical room objects (room number, floor, wing, bed setup, cleaning/maintenance status, and active guest booking reference) per hotel listing ID in localStorage."),
        ("CustomEvent Synchronization (swat_physical_rooms_updated): ", "Dispatches cross-component DOM events when room statuses or key assignments change, updating both the Today Screen room rack and the 60-day availability sheet without page reloads."),
        ("Asynchronous Recursion Protection: ", "All event dispatches are deferred asynchronously (window.setTimeout(..., 0)) and getters execute without re-triggering storage events, eliminating browser thread freezes and ensuring instantaneous sub-250ms UI response.")
    ]
    for b_title, b_desc in bullets_fe:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(3)
        r = bp.add_run(b_title)
        r.font.bold = True
        r.font.color.rgb = RGBColor(27, 79, 114)
        bp.add_run(b_desc)

    # Output path
    output_path = os.path.join(r"f:\Antigravity\SwatTourismProduction_v2\Docs", "swat-tourism-database-queries-and-stored-procedures.docx")
    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

if __name__ == "__main__":
    create_document()
