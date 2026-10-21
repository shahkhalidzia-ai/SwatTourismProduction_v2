import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def add_callout(doc, text_prefix, text_body, border_color="1B4F72", fill_color="F0F4F8"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.8)
    set_cell_background(cell, fill_color)
    set_cell_margins(cell, top=130, bottom=130, left=180, right=180)
    
    tcPr = cell._element.get_or_add_tcPr()
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="none"/>
            <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>
            <w:bottom w:val="none"/>
            <w:right w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    run1 = p.add_run(text_prefix + " ")
    run1.bold = True
    run1.font.name = "Calibri"
    run1.font.size = Pt(10)
    run1.font.color.rgb = RGBColor(0x1B, 0x4F, 0x72)
    
    run2 = p.add_run(text_body)
    run2.font.name = "Calibri"
    run2.font.size = Pt(10)
    run2.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def format_table_headers(table, headers, fill_hex="1B4F72", col_widths=None):
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], fill_hex)
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.name = "Calibri"
            run.font.size = Pt(9.5)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        if col_widths and i < len(col_widths):
            hdr_cells[i].width = Inches(col_widths[i])

def format_table_rows(table, data, col_widths=None, alternate_fill=True):
    for r_idx, row_data in enumerate(data):
        row_cells = table.add_row().cells
        fill_hex = "F8FAFC" if (r_idx % 2 == 1 and alternate_fill) else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            row_cells[c_idx].text = str(val)
            set_cell_background(row_cells[c_idx], fill_hex)
            set_cell_margins(row_cells[c_idx], top=100, bottom=100, left=140, right=140)
            p = row_cells[c_idx].paragraphs[0]
            for run in p.runs:
                run.font.name = "Calibri"
                run.font.size = Pt(9)
                run.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)
            if col_widths and c_idx < len(col_widths):
                row_cells[c_idx].width = Inches(col_widths[c_idx])

def build_document():
    doc = Document()
    
    # Page Margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
    styles = doc.styles
    normal_style = styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)

    # Document Header / Banner Block
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(2)
    t_run = title_p.add_run("SWAT TOURISM PLATFORM (STP) — ARCHITECTURE DIRECTORY")
    t_run.font.name = "Calibri"
    t_run.font.size = Pt(11)
    t_run.font.bold = True
    t_run.font.color.rgb = RGBColor(0x05, 0x96, 0x69) # Emerald Green

    h1_p = doc.add_paragraph()
    h1_p.paragraph_format.space_before = Pt(2)
    h1_p.paragraph_format.space_after = Pt(6)
    main_title = h1_p.add_run("Technologies & External APIs Directory")
    main_title.font.name = "Calibri"
    main_title.font.size = Pt(24)
    main_title.font.bold = True
    main_title.font.color.rgb = RGBColor(0x1B, 0x4F, 0x72) # Deep Navy

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(14)
    sub_run = sub_p.add_run("Comprehensive Technical Specification of Frontend, Backend, Databases, Infrastructure & 3rd-Party APIs")
    sub_run.font.name = "Calibri"
    sub_run.font.size = Pt(12)
    sub_run.italic = True
    sub_run.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    # Metadata Table
    meta_table = doc.add_table(rows=1, cols=4)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_headers = ["Document Version", "Release Date", "Platform Scope", "System Architecture"]
    meta_data = [["v2.0 (Production)", "October 2026", "Swat Tourism Platform", "Full-Stack Async SPA & Microservices"]]
    format_table_headers(meta_table, meta_headers, fill_hex="1B4F72", col_widths=[1.7, 1.4, 1.8, 1.9])
    format_table_rows(meta_table, meta_data, col_widths=[1.7, 1.4, 1.8, 1.9], alternate_fill=False)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Executive Overview
    add_callout(
        doc,
        "Architectural Summary:",
        "The Swat Tourism Platform is engineered as a modern, high-performance, asynchronous web ecosystem. It delivers role-isolated portals for Tourists, Hospitality Businesses, Transport Operators, and Tourism Authorities across Mingora, Bahrain, Kalam, Mahodand, Malam Jabba, and Ushu Valley.",
        border_color="059669",
        fill_color="ECFDF5"
    )

    # 1. Frontend Technologies
    h2_1 = doc.add_heading("1. Frontend Client Technologies", level=1)
    h2_1.paragraph_format.space_before = Pt(14)
    h2_1.paragraph_format.space_after = Pt(6)
    for run in h2_1.runs:
        run.font.name = "Calibri"
        run.font.color.rgb = RGBColor(0x1B, 0x4F, 0x72)

    fe_table = doc.add_table(rows=1, cols=4)
    fe_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    fe_headers = ["Technology / Library", "Version", "Category", "Purpose & Role in Project"]
    fe_data = [
        ["React", "19.2.8", "UI Framework", "Core declarative component library powering the Single Page Application (SPA)."],
        ["TypeScript", "~6.0.2 / 5.8", "Language", "Provides strict static typing, interfaces, and compile-time correctness across all modules."],
        ["Vite", "8.3.0", "Build & Bundler", "Ultra-fast ESM bundler with Hot Module Replacement (HMR) and optimized production compilation."],
        ["TanStack React Query", "^5.104.0", "State Management", "Server state caching, background refetching, optimistic mutations, and window focus revalidation."],
        ["React Router DOM", "^7.18.4", "Routing", "Client-side routing, query parameters management, subtab switching, and role guards."],
        ["Leaflet JS", "^1.9.4", "Interactive Mapping", "Lightweight map engine rendering Swat destinations, attractions, hotels, and highway routes."],
        ["Lucide React", "^1.49.0", "Iconography", "Consistent vector icons for navigation, weather indicators, transportation, and badges."],
        ["Vanilla CSS / Tokens", "Native CSS3", "Design System", "CSS variables/tokens supporting dual themes (Emerald Pine & Deep Cobalt) without runtime overhead."],
        ["Vite PWA Plugin", "^1.3.0", "Progressive Web App", "Service worker registration, offline asset caching, and mobile installable app manifest."],
        ["Vitest", "^5.0.3", "Test Runner", "High-performance test framework executing 107 unit and integration tests across 21 test suites."],
        ["React Testing Library", "^16.3.3", "Testing Tool", "User-centric DOM simulation verifying accessible queries, modals, and user flows."],
        ["JSDOM", "^30.1.1", "DOM Environment", "In-memory W3C DOM and browser API simulation for headless test executions."],
        ["Oxlint", "^1.81.0", "Code Hygiene", "Next-generation high-speed linter enforcing code standards and eliminating regressions."]
    ]
    format_table_headers(fe_table, fe_headers, fill_hex="1B4F72", col_widths=[1.6, 0.9, 1.4, 2.9])
    format_table_rows(fe_table, fe_data, col_widths=[1.6, 0.9, 1.4, 2.9])

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # 2. Backend Technologies
    h2_2 = doc.add_heading("2. Backend Server & API Technologies", level=1)
    h2_2.paragraph_format.space_before = Pt(14)
    h2_2.paragraph_format.space_after = Pt(6)
    for run in h2_2.runs:
        run.font.name = "Calibri"
        run.font.color.rgb = RGBColor(0x1B, 0x4F, 0x72)

    be_table = doc.add_table(rows=1, cols=4)
    be_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    be_headers = ["Technology / Library", "Version", "Category", "Purpose & Role in Project"]
    be_data = [
        ["FastAPI", ">=0.111.0", "Web Framework", "High-performance asynchronous Python REST framework with automatic OpenAPI/Swagger docs."],
        ["Python", "3.11+ / 3.12", "Language", "Core server runtime powering all business logic, calculation engines, and adapters."],
        ["Uvicorn (Standard)", ">=0.30.0", "ASGI Web Server", "Production-grade ASGI application server handling asynchronous HTTP and WebSocket requests."],
        ["SQLAlchemy", ">=2.0.30", "ORM Engine", "Modern 2.0 async ORM managing database models, relationship graphs, and complex transactions."],
        ["Alembic", ">=1.13.1", "Database Migrations", "Schema version control and automated migration pipeline for relational database structures."],
        ["Pydantic & Settings", ">=2.7.0", "Data Validation", "Type-safe request/response schema parsing, serialization, and .env configuration management."],
        ["HTTPX", ">=0.27.0", "Async HTTP Client", "Non-blocking client dispatching requests to external payment gateways, weather, and SMS APIs."],
        ["Python-JOSE", ">=3.3.0", "Security / JWT", "Cryptographic JSON Web Token (JWT) generation, HS256 encryption, and role claim validation."],
        ["Passlib (Bcrypt)", ">=1.7.4", "Security / Hashing", "Enterprise-grade Bcrypt salt-hashing for secure user credential storage."],
        ["Python-Multipart", ">=0.0.9", "File Uploads", "Streaming parser for business verification documents, hotel photos, and media attachments."],
        ["Pytest & Asyncio", ">=8.2.0", "Backend Testing", "Asynchronous test runner validating API contracts, role isolation, and database models."]
    ]
    format_table_headers(be_table, be_headers, fill_hex="1B4F72", col_widths=[1.6, 0.9, 1.4, 2.9])
    format_table_rows(be_table, be_data, col_widths=[1.6, 0.9, 1.4, 2.9])

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # 3. Database, Infrastructure & DevOps
    h2_3 = doc.add_heading("3. Database, Storage, Infrastructure & DevOps", level=1)
    h2_3.paragraph_format.space_before = Pt(14)
    h2_3.paragraph_format.space_after = Pt(6)
    for run in h2_3.runs:
        run.font.name = "Calibri"
        run.font.color.rgb = RGBColor(0x1B, 0x4F, 0x72)

    infra_table = doc.add_table(rows=1, cols=4)
    infra_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    infra_headers = ["Infrastructure Layer", "Configuration", "Deployment Type", "Role & Operational Capability"]
    infra_data = [
        ["PostgreSQL 16 (Alpine)", "Docker Service 'db'", "Containerized Production", "Enterprise relational database running on port 5433 with asyncpg and psycopg3 drivers."],
        ["SQLite (WAL Mode)", "aiosqlite driver", "Local / Standalone", "Zero-dependency local database with Write-Ahead Logging for high-concurrency instant runs."],
        ["Docker & Compose", "docker-compose.yml", "Containerization", "Multi-service orchestration of Database, Backend API, and Frontend Web containers."],
        ["Nginx (Alpine)", "Reverse Proxy", "Edge Web Server", "Reverse proxies /api/v1 to FastAPI and delivers production static assets with gzip compression."],
        ["Storage Pipeline", "Local / S3 Hybrid", "Asset Storage", "Dual-engine storage pipeline supporting local /uploads directory and Amazon S3 buckets."]
    ]
    format_table_headers(infra_table, infra_headers, fill_hex="1B4F72", col_widths=[1.6, 1.3, 1.4, 2.5])
    format_table_rows(infra_table, infra_data, col_widths=[1.6, 1.3, 1.4, 2.5])

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # 4. External APIs & Third-Party Integrations
    h2_4 = doc.add_heading("4. Comprehensive External APIs Directory", level=1)
    h2_4.paragraph_format.space_before = Pt(14)
    h2_4.paragraph_format.space_after = Pt(6)
    for run in h2_4.runs:
        run.font.name = "Calibri"
        run.font.color.rgb = RGBColor(0x1B, 0x4F, 0x72)

    doc.add_paragraph(
        "The platform interfaces with 17 specialized external APIs and third-party services to deliver live weather, digital payments, "
        "intercity routing, public safety, and instant emergency response across Swat Valley:"
    ).paragraph_format.space_after = Pt(6)

    api_table = doc.add_table(rows=1, cols=4)
    api_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    api_headers = ["External Service / API", "Provider / Authority", "Protocol & Integration", "Key Capabilities & Endpoints"]
    api_data = [
        [
            "Easypaisa Payment Gateway",
            "Telenor Microfinance Bank",
            "REST API / HTTPS\nHMAC-SHA256 signature",
            "• Direct Mobile Account (MA) debit push\n• Hosted Web Checkout portal\n• IPN webhook listener for settlement"
        ],
        [
            "JazzCash Merchant Gateway",
            "Mobilink Microfinance Bank",
            "REST API 2.0\npp_SecureHash HMAC",
            "• MWALLET USSD PIN prompt on mobile\n• Hosted card gateway checkout\n• Instant reference issuance (SWT-EXP-XXXX)"
        ],
        [
            "Stripe / Global Cards",
            "Stripe Platform",
            "REST API & SDK\n3D-Secure 2.0",
            "• Visa, Mastercard, PayPak processing\n• Multi-currency conversion for foreign tourists\n• Tokenized PCI-DSS compliant vault"
        ],
        [
            "Raast Instant Payment Rail",
            "State Bank of Pakistan",
            "ISO 20022 / QR Code\nDirect IBAN Rail",
            "• Dynamic QR code generation for reservations\n• Instant zero-fee bank-to-bank settlement\n• National standard across all Pakistani banks"
        ],
        [
            "OpenWeatherMap API",
            "OpenWeather Ltd",
            "REST API / JSON\nConfigured via Env",
            "• Current weather (/data/2.5/weather)\n• 5-day / 3-hour forecasts (/data/2.5/forecast)\n• Altitude modeling (Kalam, Malam Jabba, Ushu)"
        ],
        [
            "Pakistan Met Department (PMD)",
            "Govt. of Pakistan",
            "HTTP Bulletin Feed",
            "• High-altitude mountain snowfall alerts\n• Monsoon flood warnings & advisories"
        ],
        [
            "OpenStreetMap (OSM) Tiles",
            "OpenStreetMap Foundation",
            "Tile Server / Leaflet JS",
            "• High-resolution valley topography tiles\n• Attraction, hotel & scenic trail mapping"
        ],
        [
            "Google Maps Navigation Bridge",
            "Google Maps Platform",
            "HTTPS Deep-Link URI",
            "• Turn-by-turn driving navigation hand-off\n• Native GPS navigation launch on smartphones"
        ],
        [
            "OSRM Highway Polyline Engine",
            "Open Source Routing Machine",
            "GeoJSON Polylines\nsrc/api/routeGeo.ts",
            "• Traces M-1/M-2 Motorways & M-16 Expressway\n• Calculates road distance (km) and travel duration\n• Dynamic map viewport auto-fitting"
        ],
        [
            "W3C HTML5 Geolocation",
            "W3C Browser Standard",
            "navigator.geolocation",
            "• Real-time tourist GPS coordinates capture\n• Automated lat/lng tagging for SOS alerts"
        ],
        [
            "Rescue 1122 CAD Dispatch",
            "KP Emergency Services",
            "REST Webhook / JSON\ncad-dispatch.rescue1122...",
            "• Automated Computer Aided Dispatch alerts\n• Coordinates ambulance & mountain rescue teams"
        ],
        [
            "KP Tourist Police Helpline",
            "KP Tourist Facilitation Police",
            "Tel Hotline: 1422",
            "• Direct tourist safety coordination\n• High-altitude travel permits and escorts"
        ],
        [
            "Swat Levies & District Police",
            "Swat Police Headquarters",
            "Tel: 15 / 0946-9240400",
            "• Highway security patrols & dispatch\n• 24/7 central emergency operations room"
        ],
        [
            "PDMA KP Disaster Authority",
            "Provincial Disaster Authority",
            "Tel Hotline: 1700",
            "• Landslide, avalanche, and roadblock alerts\n• River Swat water level emergency warnings"
        ],
        [
            "Daewoo Express Transit Bridge",
            "Daewoo Express Pakistan",
            "Service: 111-007-008",
            "• Intercity schedule feeds from Rawalpindi/Lahore\n• Super Luxury AC & Gold Class VIP Sleeper"
        ],
        [
            "Faisal Movers Schedule Bridge",
            "Faisal Movers Pakistan",
            "Service: 111-228-486",
            "• Luxury Yutong and Business Class schedules\n• Direct Swat Expressway express corridor"
        ],
        [
            "Pakistani SMS Gateway Bridge",
            "Telenor / Jazz / Twilio",
            "REST API / HTTPS\napi.sms-gateway.pk/v2",
            "• Automated SMS OTP confirmation delivery\n• Booking updates and emergency SMS broadcasts"
        ]
    ]
    format_table_headers(api_table, api_headers, fill_hex="1B4F72", col_widths=[1.7, 1.4, 1.5, 2.2])
    format_table_rows(api_table, api_data, col_widths=[1.7, 1.4, 1.5, 2.2])

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # 5. Security & Compliance
    h2_5 = doc.add_heading("5. Security, Cryptography & Compliance Standards", level=1)
    h2_5.paragraph_format.space_before = Pt(14)
    h2_5.paragraph_format.space_after = Pt(6)
    for run in h2_5.runs:
        run.font.name = "Calibri"
        run.font.color.rgb = RGBColor(0x1B, 0x4F, 0x72)

    sec_items = [
        ("HMAC-SHA256 Cryptographic Hashing: ", "All transaction communications with Easypaisa, JazzCash, and banking webhooks are cryptographically authenticated with merchant secret keys."),
        ("Bcrypt Password Salting: ", "User credentials stored in the database are hashed using salted Bcrypt with configurable complexity factors."),
        ("JWT HS256 Tokenization: ", "Stateless, cryptographically signed authentication tokens with role claim verification isolating Tourist, Business, and Authority workflows."),
        ("CORS & Origin Filtering: ", "Configurable cross-origin resource sharing restricting unauthorized domain access."),
        ("Zero-Exposure API Design: ", "Sensitive credentials and hash keys are managed via Pydantic environment configurations and excluded from client bundles.")
    ]
    for b_title, b_desc in sec_items:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(3)
        bp.paragraph_format.line_spacing = 1.15
        r1 = bp.add_run(b_title)
        r1.bold = True
        r1.font.color.rgb = RGBColor(0x1B, 0x4F, 0x72)
        r2 = bp.add_run(b_desc)
        r2.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)

    # Output save
    output_dir = r"f:\Antigravity\SwatTourismProduction_v2\Docs"
    output_path = os.path.join(output_dir, "swat-tourism-technology-stack-and-apis.docx")
    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

if __name__ == "__main__":
    build_document()
