import os
from PIL import Image, ImageDraw, ImageFont

DOC_DIR = os.path.dirname(os.path.abspath(__file__))

def get_fonts():
    try:
        f_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 22)
        f_subtitle = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 13)
        f_header = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 15)
        f_sub = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 12)
        f_body = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 11)
        f_code = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 10)
        f_small = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 9.5)
    except:
        f_title = f_subtitle = f_header = f_sub = f_body = f_code = f_small = ImageFont.load_default()
    return f_title, f_subtitle, f_header, f_sub, f_body, f_code, f_small

# ===========================================================================
# DIAGRAM 1: End-to-End Hotel Booking Sequence Flow Diagram
# ===========================================================================
def create_sequence_diagram():
    w, h = 1600, 1260
    img = Image.new("RGBA", (w, h), (248, 250, 252, 255))
    draw = ImageDraw.Draw(img)
    f_title, f_subtitle, f_header, f_sub, f_body, f_code, f_small = get_fonts()

    # Title Banner
    draw.rectangle([(0, 0), (w, 80)], fill=(15, 23, 42, 255))
    draw.text((40, 14), "1. END-TO-END HOTEL BOOKING SEQUENCE FLOW DIAGRAM", fill=(255, 255, 255, 255), font=f_title)
    draw.text((40, 46), "Complete Interaction Sequence: Tourist -> Frontend UI -> API Gateway -> Domain Services -> Relational DB -> Hotel PMS", fill=(148, 163, 184, 255), font=f_subtitle)

    # Participants
    participants = [
        ("👤 Tourist", 120, (14, 116, 144, 255)),
        ("💻 Frontend (Tourist UI)", 380, (2, 132, 199, 255)),
        ("⚡ FastAPI Gateway", 670, (15, 118, 110, 255)),
        ("⚙️ Domain Services", 960, (79, 70, 229, 255)),
        ("🗄️ Relational DB", 1220, (180, 83, 9, 255)),
        ("🏨 Hotel Today PMS", 1470, (225, 29, 72, 255))
    ]

    # Draw Participant Headers & Lifelines
    for name, x, col in participants:
        # Header box
        draw.rounded_rectangle([(x - 85, 100), (x + 85, 142)], radius=8, fill=col)
        # Center text
        bbox = draw.textbbox((0, 0), name, font=f_sub)
        tw = bbox[2] - bbox[0]
        draw.text((x - tw // 2, 112), name, fill=(255, 255, 255, 255), font=f_sub)
        # Vertical Lifeline
        draw.line([(x, 142), (x, h - 50)], fill=(203, 213, 225, 255), width=2)
        # Footer box
        draw.rounded_rectangle([(x - 85, h - 45), (x + 85, h - 10)], radius=8, fill=col)
        bbox = draw.textbbox((0, 0), name, font=f_sub)
        tw = bbox[2] - bbox[0]
        draw.text((x - tw // 2, h - 35), name, fill=(255, 255, 255, 255), font=f_sub)

    # Helper function for drawing message arrows
    def draw_msg(y, x1, x2, num_str, label, is_return=False, note=""):
        col = (100, 116, 139, 255) if is_return else (15, 23, 42, 255)
        text_col = (71, 85, 105, 255) if is_return else (15, 23, 42, 255)
        
        # Line
        if is_return:
            # Dashed line
            step = 10
            cur = min(x1, x2)
            end = max(x1, x2)
            while cur < end:
                draw.line([(cur, y), (min(cur + 6, end), y)], fill=col, width=2)
                cur += step
        else:
            draw.line([(x1, y), (x2, y)], fill=col, width=2)

        # Arrowhead
        arrow_dir = 1 if x2 > x1 else -1
        draw.polygon([(x2, y), (x2 - arrow_dir * 10, y - 5), (x2 - arrow_dir * 10, y + 5)], fill=col)

        # Label
        mid_x = (x1 + x2) // 2
        txt = f"{num_str}. {label}"
        bbox = draw.textbbox((0, 0), txt, font=f_body)
        tw = bbox[2] - bbox[0]
        
        # Background pill for readability
        draw.rounded_rectangle([(mid_x - tw // 2 - 8, y - 20), (mid_x + tw // 2 + 8, y - 2)], radius=4, fill=(255, 255, 255, 240), outline=(226, 232, 240, 255), width=1)
        draw.text((mid_x - tw // 2, y - 18), txt, fill=text_col, font=f_body)
        
        if note:
            n_bbox = draw.textbbox((0, 0), note, font=f_code)
            ntw = n_bbox[2] - n_bbox[0]
            draw.text((mid_x - ntw // 2, y + 3), note, fill=(14, 116, 144, 255), font=f_code)

    def draw_phase_banner(y, title, bg_col):
        draw.rounded_rectangle([(40, y), (w - 40, y + 26)], radius=6, fill=bg_col)
        draw.text((55, y + 4), title, fill=(255, 255, 255, 255), font=f_sub)

    # PHASE 1: Site Load & Tourist Authentication
    draw_phase_banner(165, "PHASE 1: SITE INITIAL LOAD & TOURIST AUTHENTICATION", (14, 116, 144, 255))
    draw_msg(215, 120, 380, "1", "Browse site (Loads App.tsx, sets theme='lake')", note="frontend/index.html & main.tsx")
    draw_msg(260, 380, 670, "2", "GET /api/v1/listings (Featured hotels & areas)", note="listings/router.py")
    draw_msg(300, 670, 1220, "3", "SQL Query `listings` & `price_items`", note="database.py: get_db()")
    draw_msg(340, 1220, 380, "4", "Return Active Hotel Catalog & Render Home Grid", is_return=True)
    draw_msg(385, 120, 380, "5", "Submit Login Credentials in AuthModal.tsx", note="AuthContext.login()")
    draw_msg(425, 380, 670, "6", "POST /api/v1/auth/login", note="accounts/router.py")
    draw_msg(465, 670, 1220, "7", "Validate user hash in `users` table", note="passlib Bcrypt verify")
    draw_msg(505, 670, 380, "8", "Issue JWT Bearer Token (Stored in localStorage)", is_return=True, note="Bearer eyJhbG...")

    # PHASE 2: Hotel Search & Booking Request
    draw_phase_banner(540, "PHASE 2: HOTEL SEARCH & INSTANT BOOKING REQUEST", (2, 132, 199, 255))
    draw_msg(590, 120, 380, "9", "Search Kalam + Check-in/out Dates & Filter 'hotel'", note="TouristShell.tsx")
    draw_msg(630, 380, 670, "10", "GET /api/v1/listings?category=hotel&search=Kalam", note="listings.ts: fetchListings()")
    draw_msg(670, 120, 380, "11", "Select Deluxe Room & Click 'Instant Book'", note="HotelDetailsModal.tsx")
    draw_msg(710, 380, 670, "12", "POST /api/v1/bookings/request", note="bookings/router.py")
    draw_msg(750, 670, 960, "13", "BookingService.create_booking()", note="Compute nights, SWT-HTL ref")
    draw_msg(790, 960, 1220, "14", "INSERT `bookings` (status='requested'), lock `availability`", note="booking_status_history logged")

    # PHASE 3: Hotelier Login, Today Screen & Acceptance
    draw_phase_banner(825, "PHASE 3: HOTELIER LOGIN, TODAY SCREEN PMS & ACCEPTANCE", (225, 29, 72, 255))
    draw_msg(875, 1470, 670, "15", "GET /api/v1/bookings/business (Fetch Pending Requests)", note="HotelTodayScreen.tsx")
    draw_msg(915, 670, 1470, "16", "Populate Front Desk KPI Counters & Live Room Rack", is_return=True)
    draw_msg(955, 1470, 670, "17", "Click 'Accept Booking' & Assign Room 204", note="AssignRoomModal.tsx & acceptBooking()")
    draw_msg(995, 670, 960, "18", "BookingService.accept_booking()", note="Transition status to 'accepted'")
    draw_msg(1035, 960, 1220, "19", "UPDATE `bookings.status`='accepted', `hotel_rooms`='reserved'")
    draw_msg(1075, 960, 120, "20", "Dispatch Multi-Channel QR Voucher (SMS/WhatsApp/In-App)", note="ReceiptService & CommunicationDispatcher")

    # PHASE 4 & 5: Stay Completion & Review
    draw_phase_banner(1110, "PHASE 4 & 5: CHECK-IN, STAY COMPLETION, CHECK-OUT & 5-STAR REVIEW", (15, 118, 110, 255))
    draw_msg(1155, 1470, 670, "21", "Check In & Settle Balance -> stay_status='checked_in', room='occupied'", note="HotelFolioReceiptModal.tsx")
    draw_msg(1190, 1470, 670, "22", "Guest Departs: Click 'Check Out' -> status='completed', room='cleaning'", note="BookingService.complete_booking()")
    draw_msg(1225, 120, 670, "23", "Tourist submits 5-star review in ReviewModal.tsx -> INSERT `reviews`", note="reviews/router.py: POST /reviews")

    out_path = os.path.join(DOC_DIR, "swat_diagram_1_booking_sequence.png")
    img.save(out_path, "PNG")
    print(f"[Diagram 1] Generated: {out_path}")
    return out_path

# ===========================================================================
# DIAGRAM 2: 4-Tier Data Pipeline Flowchart (How Data Floats)
# ===========================================================================
def create_data_pipeline_diagram():
    w, h = 1600, 1080
    img = Image.new("RGBA", (w, h), (248, 250, 252, 255))
    draw = ImageDraw.Draw(img)
    f_title, f_subtitle, f_header, f_sub, f_body, f_code, f_small = get_fonts()

    # Title Banner
    draw.rectangle([(0, 0), (w, 80)], fill=(15, 23, 42, 255))
    draw.text((40, 14), "2. DATA PIPELINE FLOWCHART: HOW DATA FLOATS BETWEEN FRONTEND & DATABASE", fill=(255, 255, 255, 255), font=f_title)
    draw.text((40, 46), "Decoupled 4-Tier Architecture: Frontend Client -> API Gateway & Security -> Domain Services -> Database Persistence", fill=(148, 163, 184, 255), font=f_subtitle)

    # 4 Vertical Tier Blocks
    tier_w = 345
    tier_gap = 35
    start_x = 45
    tier_y = 105
    tier_h = 820

    tiers = [
        ("TIER 1: FRONTEND CLIENT", "React 18 / TypeScript SPA", (14, 116, 144, 255), [
            ("User Action in UI", "User selects dates & clicks 'Instant Book'\nFile: HotelDetailsModal.tsx", (240, 249, 255)),
            ("Domain Typed API Client", "createBookingRequest(payload)\nType-checked DTO parameters\nFile: frontend/src/api/bookings.ts", (240, 249, 255)),
            ("Shared HTTP Client (apiRequest)", "Reads token: localStorage('swat_token')\nInjects Authorization: Bearer <JWT>\nSets Content-Type: application/json\nFile: frontend/src/api/client.ts", (224, 242, 254)),
            ("Vite Dev Reverse Proxy", "Intercepts /api/v1/* on port 5180\nForwards to backend on port 8090\nFile: frontend/vite.config.ts", (240, 249, 255))
        ]),
        ("TIER 2: API GATEWAY & SECURITY", "FastAPI / Ingress Gateway", (15, 118, 110, 255), [
            ("CORS & Exception Middleware", "Validates Origin vs settings.CORS_ORIGINS\nGlobal Exception Handler wraps 500 errors\nFile: backend/app/main.py", (240, 253, 250)),
            ("JWT Auth & Role Guard", "get_current_token_payload()\nDecodes JWT signature via HS256\nrequire_roles(['business', 'tourist'])\nFile: backend/app/core/deps.py", (204, 251, 241)),
            ("Async DB Session Injection", "FastAPI get_db() dependency injection\nYields AsyncSession from pool\nFile: backend/app/core/database.py", (240, 253, 250)),
            ("Pydantic Schema Validation", "BookingCreateRequest validates payload\nChecks positive amount & valid UUIDs\nFile: backend/app/modules/bookings/schemas.py", (240, 253, 250))
        ]),
        ("TIER 3: DOMAIN SERVICES LAYER", "Business Logic & Integrations", (79, 70, 229, 255), [
            ("BookingService Engine", "Verifies date calendar availability\nComputes total price = nights * rate\nGenerates ref: SWT-HTL-XXXXX\nFile: modules/bookings/service.py", (245, 243, 255)),
            ("Receipt & QR Voucher Service", "Builds dynamic QR code link\nCompiles official printable HTML pass\nFile: modules/bookings/receipt_service.py", (238, 242, 255)),
            ("Multi-Channel Dispatcher", "Dispatches SMS alerts & WhatsApp vouchers\nFile: modules/communications/dispatcher.py", (245, 243, 255)),
            ("Notification Broadcaster", "Persists in-app alert notification\nFile: modules/notifications/service.py", (245, 243, 255))
        ]),
        ("TIER 4: DATABASE PERSISTENCE", "SQLAlchemy 2.0 / Relational DB", (180, 83, 9, 255), [
            ("SQLAlchemy 2.0 Async ORM", "create_async_engine & AsyncSessionLocal\nDeclarativeBase, UUIDPrimaryKeyMixin\nFile: backend/app/core/database.py", (255, 251, 235)),
            ("Master Table: bookings", "Records status='requested', tourist_id, dates\nFile: modules/bookings/models.py", (254, 243, 199)),
            ("Line Items & Audit Log", "booking_items (nights, unit_price)\nbooking_status_history (immutable audit)\nFile: modules/bookings/models.py", (255, 251, 235)),
            ("PostgreSQL / SQLite WAL", "PRAGMA journal_mode=WAL & busy_timeout\nACID durability & foreign key constraints", (254, 243, 199))
        ])
    ]

    for idx, (title, subhead, header_col, cards) in enumerate(tiers):
        x = start_x + idx * (tier_w + tier_gap)
        # Tier card outline
        draw.rounded_rectangle([(x, tier_y), (x + tier_w, tier_y + tier_h)], radius=10, fill=(255, 255, 255, 255), outline=header_col, width=2)
        # Header block
        draw.rounded_rectangle([(x, tier_y), (x + tier_w, tier_y + 50)], radius=10, fill=header_col)
        draw.rectangle([(x, tier_y + 30), (x + tier_w, tier_y + 50)], fill=header_col)
        draw.text((x + 14, tier_y + 8), title, fill=(255, 255, 255, 255), font=f_header)
        draw.text((x + 14, tier_y + 30), subhead, fill=(226, 232, 240, 255), font=f_small)

        # Internal cards
        c_y = tier_y + 65
        for c_title, c_desc, c_bg in cards:
            draw.rounded_rectangle([(x + 12, c_y), (x + tier_w - 12, c_y + 165)], radius=6, fill=c_bg, outline=(203, 213, 225, 255), width=1)
            draw.text((x + 22, c_y + 10), c_title, fill=header_col, font=f_sub)
            draw.line([(x + 22, c_y + 30), (x + tier_w - 22, c_y + 30)], fill=(226, 232, 240, 255), width=1)
            
            # Multi-line description
            desc_y = c_y + 38
            for d_line in c_desc.split('\n'):
                is_file = d_line.startswith('File:')
                f_color = (14, 116, 144, 255) if is_file else (71, 85, 105, 255)
                cur_font = f_code if is_file else f_body
                draw.text((x + 22, desc_y), d_line, fill=f_color, font=cur_font)
                desc_y += 18
            c_y += 185

        # Horizontal forwarding arrow to next tier
        if idx < 3:
            arrow_x1 = x + tier_w + 4
            arrow_x2 = arrow_x1 + 26
            arrow_y = tier_y + 400
            draw.line([(arrow_x1, arrow_y), (arrow_x2, arrow_y)], fill=(14, 116, 144, 255), width=3)
            draw.polygon([(arrow_x2, arrow_y), (arrow_x2 - 8, arrow_y - 6), (arrow_x2 - 8, arrow_y + 6)], fill=(14, 116, 144, 255))

    # Bottom Banner: Return Flow
    ret_y = 945
    draw.rounded_rectangle([(start_x, ret_y), (w - start_x, ret_y + 100)], radius=8, fill=(15, 23, 42, 255))
    draw.text((start_x + 20, ret_y + 12), "◀ RETURN DATA FLOW PIPELINE (DATABASE -> FRONTEND REACT COMPONENT)", fill=(56, 189, 248, 255), font=f_header)
    
    ret_steps = "1. DB Commit SQL Result  →  2. Hydrated ORM Entity  →  3. Filtered Domain Model  →  4. Pydantic Response Serialization (JSON)  →  5. HTTP 201 Created  →  6. apiRequest<T>() parses JSON  →  7. React setState() & DOM Re-render"
    draw.text((start_x + 20, ret_y + 42), ret_steps, fill=(255, 255, 255, 255), font=f_sub)
    draw.text((start_x + 20, ret_y + 68), "Full end-to-end round trip latency: ~45ms. Type-safe TypeScript generic guarantees error-free payload casting.", fill=(148, 163, 184, 255), font=f_small)

    out_path = os.path.join(DOC_DIR, "swat_diagram_2_data_pipeline.png")
    img.save(out_path, "PNG")
    print(f"[Diagram 2] Generated: {out_path}")
    return out_path

# ===========================================================================
# DIAGRAM 3: Initial Page Load Sequence Diagram
# ===========================================================================
def create_initial_load_diagram():
    w, h = 1600, 1050
    img = Image.new("RGBA", (w, h), (248, 250, 252, 255))
    draw = ImageDraw.Draw(img)
    f_title, f_subtitle, f_header, f_sub, f_body, f_code, f_small = get_fonts()

    # Title Banner
    draw.rectangle([(0, 0), (w, 80)], fill=(15, 23, 42, 255))
    draw.text((40, 14), "3. INITIAL PAGE LOAD & URL BROWSING SEQUENCE DIAGRAM", fill=(255, 255, 255, 255), font=f_title)
    draw.text((40, 46), "Execution Sequence: User requests URL -> Anti-flash script -> Context Providers -> Session Check -> Parallel API Hydration", fill=(148, 163, 184, 255), font=f_subtitle)

    participants = [
        ("🌐 User Browser", 120, (14, 116, 144, 255)),
        ("📄 index.html", 350, (2, 132, 199, 255)),
        ("🚀 main.tsx", 580, (79, 70, 229, 255)),
        ("🛡️ Core Contexts", 840, (15, 118, 110, 255)),
        ("📱 App.tsx Router", 1080, (180, 83, 9, 255)),
        ("🏔️ TouristShell.tsx", 1320, (13, 148, 136, 255)),
        ("⚙️ FastAPI & DB", 1500, (225, 29, 72, 255))
    ]

    for name, x, col in participants:
        draw.rounded_rectangle([(x - 75, 100), (x + 75, 140)], radius=8, fill=col)
        bbox = draw.textbbox((0, 0), name, font=f_sub)
        tw = bbox[2] - bbox[0]
        draw.text((x - tw // 2, 112), name, fill=(255, 255, 255, 255), font=f_sub)
        draw.line([(x, 140), (x, h - 50)], fill=(203, 213, 225, 255), width=2)
        draw.rounded_rectangle([(x - 75, h - 45), (x + 75, h - 10)], radius=8, fill=col)
        bbox = draw.textbbox((0, 0), name, font=f_sub)
        tw = bbox[2] - bbox[0]
        draw.text((x - tw // 2, h - 35), name, fill=(255, 255, 255, 255), font=f_sub)

    def draw_msg(y, x1, x2, num_str, label, is_return=False, note=""):
        col = (100, 116, 139, 255) if is_return else (15, 23, 42, 255)
        text_col = (71, 85, 105, 255) if is_return else (15, 23, 42, 255)
        if is_return:
            step = 10
            cur = min(x1, x2)
            end = max(x1, x2)
            while cur < end:
                draw.line([(cur, y), (min(cur + 6, end), y)], fill=col, width=2)
                cur += step
        else:
            draw.line([(x1, y), (x2, y)], fill=col, width=2)

        arrow_dir = 1 if x2 > x1 else -1
        draw.polygon([(x2, y), (x2 - arrow_dir * 10, y - 5), (x2 - arrow_dir * 10, y + 5)], fill=col)

        mid_x = (x1 + x2) // 2
        txt = f"{num_str}. {label}"
        bbox = draw.textbbox((0, 0), txt, font=f_body)
        tw = bbox[2] - bbox[0]
        draw.rounded_rectangle([(mid_x - tw // 2 - 8, y - 20), (mid_x + tw // 2 + 8, y - 2)], radius=4, fill=(255, 255, 255, 240), outline=(226, 232, 240, 255), width=1)
        draw.text((mid_x - tw // 2, y - 18), txt, fill=text_col, font=f_body)
        if note:
            n_bbox = draw.textbbox((0, 0), note, font=f_code)
            ntw = n_bbox[2] - n_bbox[0]
            draw.text((mid_x - ntw // 2, y + 3), note, fill=(14, 116, 144, 255), font=f_code)

    def draw_banner(y, title, bg_col):
        draw.rounded_rectangle([(40, y), (w - 40, y + 26)], radius=6, fill=bg_col)
        draw.text((55, y + 4), title, fill=(255, 255, 255, 255), font=f_sub)

    draw_banner(165, "STEP 1: BROWSER REQUEST & DOCUMENT INGRESS", (14, 116, 144, 255))
    draw_msg(215, 120, 350, "1", "User navigates to URL (http://localhost:5180/)", note="Browser GET /")
    draw_msg(265, 350, 350, "2", "Preconnects Google Fonts & executes anti-flash script", note="data-theme='lake'")
    draw_msg(315, 350, 580, "3", "Loads entry module /src/main.tsx", note="Loads index.css & leaflet.css")
    draw_msg(365, 580, 840, "4", "createRoot(root).render(<App />)", note="Mounts Context Providers")

    draw_banner(415, "STEP 2: CONTEXT PROVIDERS & SESSION RECOVERY", (15, 118, 110, 255))
    draw_msg(465, 840, 840, "5", "AuthProvider checks localStorage('swat_token', 'swat_auth_explicit')", note="Guest vs Authenticated Check")
    draw_msg(515, 840, 1500, "6", "If Token Present: GET /api/v1/auth/me", note="Validates JWT & hydrates UserProfile")
    draw_msg(565, 1500, 840, "7", "Returns User DTO (or null for Guest Visitor)", is_return=True)
    draw_msg(615, 840, 1080, "8", "Passes authenticated user & role down to App.tsx")

    draw_banner(665, "STEP 3: ROUTE RESOLUTION & SHELL MOUNT", (180, 83, 9, 255))
    draw_msg(715, 1080, 1080, "9", "Inspects URL params (?role=...&tab=...) & purges stale booking cache", note="Default: role='tourist', activeTab='home'")
    draw_msg(765, 1080, 1320, "10", "Mounts <TouristShell activeTab='home' />")

    draw_banner(815, "STEP 4: PARALLEL DATA HYDRATION (PROMISE.ALL)", (225, 29, 72, 255))
    draw_msg(865, 1320, 1500, "11", "Concurrent Fetch: getAreas() & getDestinations()", note="GET /places/areas & /destinations")
    draw_msg(915, 1320, 1500, "12", "Concurrent Fetch: getExploreListings({ type: 'all' })", note="GET /listings?type=all")
    draw_msg(965, 1500, 1320, "13", "Returns Places & Active Hotel Catalog", is_return=True)
    draw_msg(1010, 1320, 120, "14", "Renders Hero Banner, Search Bar, Category Chips & Hotel Cards", note="Main Screen Fully Interactive!")

    out_path = os.path.join(DOC_DIR, "swat_diagram_3_initial_page_load.png")
    img.save(out_path, "PNG")
    print(f"[Diagram 3] Generated: {out_path}")
    return out_path

if __name__ == "__main__":
    create_sequence_diagram()
    create_data_pipeline_diagram()
    create_initial_load_diagram()

