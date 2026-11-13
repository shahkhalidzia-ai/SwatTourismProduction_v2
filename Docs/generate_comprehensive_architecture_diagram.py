import os
from PIL import Image, ImageDraw, ImageFont

DOC_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_IMAGE = os.path.join(DOC_DIR, "swat_single_comprehensive_architecture.png")

def get_fonts():
    try:
        f_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 24)
        f_subtitle = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 13)
        f_layer_num = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 15)
        f_layer_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 17)
        f_sub = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 13)
        f_body = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 11.5)
        f_code = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 11)
        f_small = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 10)
        f_badge = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 11)
    except:
        f_title = f_subtitle = f_layer_num = f_layer_title = f_sub = f_body = f_code = f_small = f_badge = ImageFont.load_default()
    return f_title, f_subtitle, f_layer_num, f_layer_title, f_sub, f_body, f_code, f_small, f_badge

def generate_layered_architecture_diagram():
    w, h = 1700, 1420
    img = Image.new("RGBA", (w, h), (248, 250, 252, 255))
    draw = ImageDraw.Draw(img)
    f_title, f_subtitle, f_layer_num, f_layer_title, f_sub, f_body, f_code, f_small, f_badge = get_fonts()

    # 1. Header Banner
    draw.rectangle([(0, 0), (w, 85)], fill=(15, 23, 42, 255))
    draw.text((45, 14), "SWAT TOURISM PLATFORM (STP) — 6-LAYER CODE ARCHITECTURE & COMMUNICATION FLOW", fill=(255, 255, 255, 255), font=f_title)
    draw.text((45, 50), "Comprehensive Single Map: Frontend View -> Frontend API -> Backend API Gateway -> Domain Service -> ORM Model -> Database", fill=(148, 163, 184, 255), font=f_subtitle)

    # Layer specifications
    # (Layer Number, Layer Name, Tech Stack, Primary Color, Secondary BG, Cards, Comm Arrow Title, Comm Arrow Detail)
    layers = [
        (
            "LAYER 1", "FRONTEND VIEW (UI COMPONENTS)", "React 18 • TypeScript • Tailwind CSS • JSX/TSX",
            (14, 116, 144, 255), (240, 249, 255, 255),
            [
                ("HotelDetailsModal.tsx", "frontend/src/modules/tourist/HotelDetailsModal.tsx", "Tourist UI: Room tier selection, nights calculator, 'Instant Book' trigger"),
                ("HotelTodayScreen.tsx", "frontend/src/modules/business/HotelTodayScreen.tsx", "Front-Desk PMS: Operational KPIs, pending request acceptance, room rack sync"),
                ("ReviewModal.tsx", "frontend/src/modules/tourist/ReviewModal.tsx", "Feedback UI: 1-5 star ratings, review submission for completed bookings")
            ],
            "1. In-Memory TypeScript Function Call",
            "Calls typed API function with JavaScript parameters: createBookingRequest(payload) or acceptBooking(id)"
        ),
        (
            "LAYER 2", "FRONTEND API CLIENTS (DATA ACCESS)", "TypeScript • Fetch API • JWT Bearer Token Injection",
            (2, 132, 199, 255), (240, 249, 255, 255),
            [
                ("bookings.ts & rooms.ts", "frontend/src/api/bookings.ts & rooms.ts", "Domain client wrappers defining TypeScript DTO interfaces & payload types"),
                ("client.ts (apiRequest<T>)", "frontend/src/api/client.ts", "Universal HTTP gateway: pulls token from localStorage('swat_token'), injects Authorization: Bearer"),
                ("vite.config.ts (Dev Proxy)", "frontend/vite.config.ts", "Development reverse proxy forwarding /api/v1/* from port 5180 to backend port 8090")
            ],
            "2. HTTPS / REST Network Request (JSON Payload)",
            "HTTP POST/GET with headers: 'Authorization: Bearer <JWT>' and 'Content-Type: application/json'"
        ),
        (
            "LAYER 3", "BACKEND API GATEWAY (ROUTING & SECURITY)", "FastAPI • Pydantic v2 Schemas • OAuth2 Bearer Security",
            (15, 118, 110, 255), (240, 253, 250, 255),
            [
                ("bookings/router.py", "backend/app/modules/bookings/router.py", "Endpoints: POST /request, POST /{id}/accept, POST /{id}/check-in, POST /{id}/check-out"),
                ("core/deps.py & auth.py", "backend/app/core/deps.py & core/auth.py", "get_current_token_payload(), require_roles(['business']), Bcrypt verify, get_db() session"),
                ("schemas.py (Pydantic)", "backend/app/modules/bookings/schemas.py", "Strict payload validation (BookingCreateRequest, BookingOut), data sanitization")
            ],
            "3. Internal Dependency-Injected Async Python Call",
            "Passes validated Pydantic model + active AsyncSession: await BookingService.create_booking(db, user_id, req)"
        ),
        (
            "LAYER 4", "DOMAIN SERVICE LAYER (BUSINESS LOGIC)", "Python Async Service Engines • Multi-Channel Dispatch",
            (79, 70, 229, 255), (245, 243, 255, 255),
            [
                ("BookingService", "backend/app/modules/bookings/service.py", "Generates ref (SWT-HTL-XXXXX), calculates prices, enforces lifecycle state transitions"),
                ("ReceiptService", "backend/app/modules/bookings/receipt_service.py", "Compiles printable HTML boarding pass voucher with embedded dynamic QR code"),
                ("Notification & Comm Dispatcher", "backend/app/modules/notifications/service.py", "Universal dispatch: in-app notifications, SMS alerts, WhatsApp message dispatch")
            ],
            "4. SQLAlchemy 2.0 Async ORM Method Invocations",
            "Instantiates ORM entities, executes db.add(booking), and manages atomic transactions via await db.commit()"
        ),
        (
            "LAYER 5", "MODEL LAYER (ORM & SCHEMA DEFINITION)", "SQLAlchemy 2.0 Async ORM • DeclarativeBase • Entity Mapping",
            (180, 83, 9, 255), (255, 251, 235, 255),
            [
                ("Booking & BookingItem", "backend/app/modules/bookings/models.py", "Relational mapping for bookings header, night items, pricing, reference, and stay status"),
                ("HotelRoom & Availability", "backend/app/modules/listings/models.py", "Physical room rack (room 204, status='reserved') & date-level capacity inventory"),
                ("Review & Notification", "backend/app/modules/reviews/models.py", "Tables for verified customer reviews, 1-5 ratings, and multi-channel notification records")
            ],
            "5. Async SQL Execution via Database Driver",
            "Executes compiled SQL statements: INSERT INTO bookings ..., SELECT ... JOIN ... over connection pool"
        ),
        (
            "LAYER 6", "DATABASE PERSISTENCE (STORAGE ENGINE)", "PostgreSQL / SQLite WAL Mode • ACID Relational Engine",
            (225, 29, 72, 255), (255, 241, 242, 255),
            [
                ("bookings & booking_items", "Tables: bookings, booking_items, booking_payments", "Master reservation ledger, financial balances, advance deposits, and check-in audit"),
                ("hotel_rooms & availability", "Tables: hotel_rooms, availability, price_items", "Physical room numbers (101, 102, 204), cleaning turnover status, date inventory locks"),
                ("reviews & users", "Tables: reviews, users, business_profiles, notifications", "User credentials, business KYC profiles, published guest reviews, audit history")
            ],
            "", ""
        )
    ]

    card_x = 45
    card_w = w - 90
    cur_y = 105

    for l_idx, (l_num, l_title, l_tech, col_border, col_bg, sample_files, comm_title, comm_detail) in enumerate(layers):
        l_h = 125
        # Layer Container
        draw.rounded_rectangle([(card_x, cur_y), (card_x + card_w, cur_y + l_h)], radius=10, fill=(255, 255, 255, 255), outline=col_border, width=2)
        
        # Left Accent Pill Header
        draw.rounded_rectangle([(card_x, cur_y), (card_x + 280, cur_y + l_h)], radius=10, fill=col_border)
        draw.rectangle([(card_x + 260, cur_y), (card_x + 280, cur_y + l_h)], fill=col_border)
        
        # Header text inside left pill
        draw.text((card_x + 18, cur_y + 16), l_num, fill=(226, 232, 240, 255), font=f_layer_num)
        draw.text((card_x + 18, cur_y + 38), l_title, fill=(255, 255, 255, 255), font=f_layer_title)
        draw.text((card_x + 18, cur_y + 88), l_tech, fill=(224, 242, 254, 255), font=f_small)

        # 3 Sample File Cards in this Layer
        sub_card_w = (card_w - 320) // 3
        sub_card_gap = 14
        sub_start_x = card_x + 300

        for s_idx, (file_name, file_path, file_desc) in enumerate(sample_files):
            sx = sub_start_x + s_idx * (sub_card_w + sub_card_gap)
            draw.rounded_rectangle([(sx, cur_y + 10), (sx + sub_card_w, cur_y + l_h - 10)], radius=6, fill=col_bg, outline=(203, 213, 225, 255), width=1)
            
            # File name
            draw.text((sx + 10, cur_y + 16), file_name, fill=col_border, font=f_sub)
            # File path
            draw.text((sx + 10, cur_y + 36), file_path, fill=(14, 116, 144, 255), font=f_code)
            # File description
            draw.text((sx + 10, cur_y + 58), file_desc, fill=(71, 85, 105, 255), font=f_body)

        cur_y += l_h

        # Communication Arrow Between Layers (if not last layer)
        if l_idx < len(layers) - 1:
            arrow_y = cur_y + 6
            arrow_h = 60
            
            # Forward Communication Band (Downwards)
            draw.line([(card_x + 140, arrow_y), (card_x + 140, arrow_y + arrow_h)], fill=(14, 116, 144, 255), width=3)
            draw.polygon([(card_x + 140, arrow_y + arrow_h), (card_x + 134, arrow_y + arrow_h - 8), (card_x + 146, arrow_y + arrow_h - 8)], fill=(14, 116, 144, 255))
            
            # Communication Label Pill (Center-left)
            draw.rounded_rectangle([(card_x + 160, arrow_y + 8), (card_x + 950, arrow_y + 52)], radius=6, fill=(241, 245, 249, 255), outline=(203, 213, 225, 255), width=1)
            draw.text((card_x + 175, arrow_y + 13), f"▼ FORWARD REQUEST: {comm_title}", fill=(15, 23, 42, 255), font=f_badge)
            draw.text((card_x + 175, arrow_y + 31), comm_detail, fill=(71, 85, 105, 255), font=f_small)

            # Return Flow Band (Upwards, on the right side)
            draw.line([(card_x + card_w - 140, arrow_y + arrow_h), (card_x + card_w - 140, arrow_y)], fill=(16, 185, 129, 255), width=3)
            draw.polygon([(card_x + card_w - 140, arrow_y), (card_x + card_w - 146, arrow_y + 8), (card_x + card_w - 134, arrow_y + 8)], fill=(16, 185, 129, 255))
            
            # Return Flow Text
            ret_text_map = [
                "▲ RETURN RESPONSE: Resolved Promise<Booking> & setState() triggers React Virtual DOM Re-render",
                "▲ RETURN RESPONSE: HTTP 200/201 JSON payload returned; client.ts casts to TypeScript generic <T>",
                "▲ RETURN RESPONSE: Serializes domain model into Pydantic Out schema (strips private/auth tokens)",
                "▲ RETURN RESPONSE: Returns hydrated SQLAlchemy Python entity instances with refreshed database IDs",
                "▲ RETURN RESPONSE: Database commits transaction; returns persisted record row with timestamps & PK"
            ]
            draw.rounded_rectangle([(card_x + 970, arrow_y + 8), (card_x + card_w - 160, arrow_y + 52)], radius=6, fill=(240, 253, 244, 255), outline=(187, 247, 208, 255), width=1)
            draw.text((card_x + 985, arrow_y + 20), ret_text_map[l_idx], fill=(21, 128, 61, 255), font=f_small)

            cur_y += arrow_h + 12
        else:
            cur_y += 15

    # Bottom Architecture Summary Note
    draw.rounded_rectangle([(card_x, cur_y), (card_x + card_w, cur_y + 70)], radius=8, fill=(15, 23, 42, 255))
    draw.text((card_x + 20, cur_y + 12), "KEY ARCHITECTURAL RULE: STRICT LAYER ISOLATION & DECOUPLING", fill=(56, 189, 248, 255), font=f_sub)
    draw.text((card_x + 20, cur_y + 36), "1. The Frontend View NEVER calls the Backend API directly; it always uses typed frontend API clients (Layer 2).", fill=(226, 232, 240, 255), font=f_small)
    draw.text((card_x + 20, cur_y + 52), "2. The Backend API Gateway NEVER queries the Database directly; it always invokes the Domain Service Layer (Layer 4) with dependency-injected AsyncSessions.", fill=(148, 163, 184, 255), font=f_small)

    img.save(OUTPUT_IMAGE, "PNG")
    print(f"[Comprehensive Architecture Diagram] Successfully generated: {OUTPUT_IMAGE}")
    return OUTPUT_IMAGE

if __name__ == "__main__":
    generate_layered_architecture_diagram()

