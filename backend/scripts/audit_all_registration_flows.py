import os
import sys
import json
import uuid
import sqlite3
import urllib.request
import urllib.error
from datetime import date, timedelta

BASE_URL = "http://127.0.0.1:8090/api/v1"
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "swat_tourism.db")

def query_db(sql, params=()):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    clean_params = []
    for p in params:
        if isinstance(p, str):
            try:
                clean_params.append(uuid.UUID(p).hex)
            except (ValueError, AttributeError):
                clean_params.append(p)
        elif isinstance(p, uuid.UUID):
            clean_params.append(p.hex)
        else:
            clean_params.append(p)
    c.execute(sql, tuple(clean_params))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows

def api_request(method, endpoint, data=None, token=None, is_multipart=False):
    url = f"{BASE_URL}{endpoint}"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = None
    if data is not None:
        if is_multipart:
            # Simple multipart builder
            boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
            headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
            lines = []
            for k, v in data.items():
                if isinstance(v, tuple): # (filename, bytes_data, content_type)
                    filename, file_bytes, content_type = v
                    lines.append(f"--{boundary}".encode())
                    lines.append(f'Content-Disposition: form-data; name="{k}"; filename="{filename}"'.encode())
                    lines.append(f"Content-Type: {content_type}".encode())
                    lines.append(b"")
                    lines.append(file_bytes)
                else:
                    lines.append(f"--{boundary}".encode())
                    lines.append(f'Content-Disposition: form-data; name="{k}"'.encode())
                    lines.append(b"")
                    lines.append(str(v).encode())
            lines.append(f"--{boundary}--".encode())
            lines.append(b"")
            body = b"\r\n".join(lines)
        else:
            headers["Content-Type"] = "application/json"
            body = json.dumps(data).encode("utf-8")

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as res:
            res_body = res.read().decode("utf-8")
            status = res.status
            try:
                json_data = json.loads(res_body)
            except:
                json_data = res_body
            return {"status": status, "data": json_data, "error": None}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            err_json = json.loads(err_body)
        except:
            err_json = err_body
        return {"status": e.code, "data": None, "error": err_json}
    except Exception as e:
        return {"status": 0, "data": None, "error": str(e)}

def run_audit():
    results = []

    print("=" * 80)
    print("STARTING AUDIT OF THREE REGISTRATION FLOWS")
    print("=" * 80)

    # Pre-requisite: Get Authority token for approvals
    auth_login = api_request("POST", "/auth/demo-login/authority")
    authority_token = auth_login["data"]["access_token"]
    print(f"Authority Login: HTTP {auth_login['status']}")

    # Get sample Area
    areas = query_db("SELECT id, name FROM areas WHERE name='Kalam' LIMIT 1")
    kalam_area_id = areas[0]["id"] if areas else None
    mingora_areas = query_db("SELECT id, name FROM areas WHERE name='Mingora' LIMIT 1")
    mingora_area_id = mingora_areas[0]["id"] if mingora_areas else None

    # =========================================================================
    # FLOW 1: TOURIST REGISTRATION FLOW
    # =========================================================================
    print("\n--- AUDITING FLOW 1: TOURIST REGISTRATION ---")
    
    # 1.1 Register Tourist
    t_email = f"tourist.audit.{uuid.uuid4().hex[:6]}@example.com"
    t_reg = api_request("POST", "/auth/register", {
        "email": t_email,
        "phone": f"+92300{uuid.uuid4().int % 10000000:07d}",
        "password": "Password123!",
        "full_name": "Audit Tourist Sara",
        "role": "tourist",
        "home_city": "Islamabad",
        "nationality": "Pakistani",
        "emergency_contact_name": "Tariq Ahmed",
        "emergency_contact_phone": "+923009988776"
    })
    t_user_id = t_reg["data"]["user"]["id"] if t_reg["status"] == 201 else None
    t_db = query_db("SELECT id, email, role, full_name, language, status FROM users WHERE email=?", (t_email,))
    print(f"1.1 Register Tourist: HTTP {t_reg['status']}, User DB Row: {t_db}")

    # 1.2 Log in as Tourist
    t_login = api_request("POST", "/auth/login", {
        "username": t_email,
        "password": "Password123!"
    })
    t_token = t_login["data"]["access_token"] if t_login["status"] == 200 else None
    print(f"1.2 Login Tourist: HTTP {t_login['status']}, Got Token: {bool(t_token)}")

    # 1.3 Create/Update Tourist Profile (home_city, nationality)
    t_prof = api_request("PUT", "/auth/profile", {
        "home_city": "Rawalpindi",
        "nationality": "Pakistani"
    }, token=t_token)
    t_prof_db = query_db("SELECT * FROM tourist_profiles WHERE user_id=?", (t_user_id,))
    print(f"1.3 Update Tourist Profile: HTTP {t_prof['status']}, DB Row: {t_prof_db}")

    # 1.4 Set Emergency Contact
    t_em = api_request("PUT", "/auth/profile", {
        "emergency_contact_name": "Zubair Ahmed",
        "emergency_contact_phone": "+923001234999"
    }, token=t_token)
    t_em_db = query_db("SELECT emergency_contact_name, emergency_contact_phone FROM tourist_profiles WHERE user_id=?", (t_user_id,))
    print(f"1.4 Set Emergency Contact: HTTP {t_em['status']}, DB Row: {t_em_db}")

    # 1.5 Set Language Preference
    t_lang = api_request("PUT", "/auth/profile", {
        "language": "ur"
    }, token=t_token)
    t_lang_db = query_db("SELECT language FROM users WHERE id=?", (t_user_id,))
    print(f"1.5 Set Language Preference: HTTP {t_lang['status']}, DB Row: {t_lang_db}")

    # 1.6 Set Travel Preferences
    t_travel = api_request("PUT", "/auth/profile", {
        "travel_preferences": "Family, Hiking, Cultural"
    }, token=t_token)
    print(f"1.6 Set Travel Preferences: HTTP {t_travel['status']}, Response: {t_travel.get('data') or t_travel.get('error')}")

    # 1.7 Tourist Menu (Home, Explore, Trips, Safety, Profile)
    # Check frontend code navItems.ts and TouristShell.tsx
    # 1.8 Tourist Access Control to Business & Authority
    t_try_biz_list = api_request("GET", "/listings/my-listings", token=t_token)
    t_try_auth_queue = api_request("GET", "/verification/approvals", token=t_token)
    print(f"1.8 Security Check: Tourist calling /listings/my-listings: HTTP {t_try_biz_list['status']}")
    print(f"1.8 Security Check: Tourist calling /verification/approvals: HTTP {t_try_auth_queue['status']}")

    # =========================================================================
    # FLOW 2: BUSINESS REGISTRATION FLOW (All 6 Types)
    # =========================================================================
    print("\n--- AUDITING FLOW 2: BUSINESS REGISTRATION (ALL 6 TYPES) ---")
    types = ["hotel", "restaurant", "transport", "guide", "activity", "shop"]

    for b_type in types:
        print(f"\n>> Auditing Business Type: {b_type.upper()}")
        b_email = f"biz.{b_type}.{uuid.uuid4().hex[:6]}@example.com"
        b_name = f"Audit {b_type.capitalize()} Business"
        b_reg = api_request("POST", "/auth/register", {
            "email": b_email,
            "phone": f"+92312{uuid.uuid4().int % 10000000:07d}",
            "password": "Password123!",
            "full_name": f"Owner of {b_name}",
            "role": "business",
            "business_name": b_name,
            "primary_type": b_type,
            "contact_phone": "+923129876543",
            "whatsapp_number": "+923129876543"
        })
        b_token = b_reg["data"]["access_token"] if b_reg["status"] == 201 else None
        b_user_id = b_reg["data"]["user"]["id"] if b_reg["status"] == 201 else None
        
        # Complete Business Profile with address, area, reg_no
        b_upd_prof = api_request("PUT", "/auth/profile", {
            "business_name": f"{b_name} Verified",
            "contact_phone": "+923129876543",
            "whatsapp_number": "+923129876543",
            "address_text": f"Main Road {b_type.capitalize()} Bazaar, Swat",
            "area_id": kalam_area_id,
            "registration_no": f"REG-{b_type.upper()}-2026"
        }, token=b_token)
        
        # Query Business Profile DB Row
        b_db = query_db("SELECT id, business_name, primary_type, contact_phone, whatsapp_number, address_text, registration_no, verification_status FROM business_profiles WHERE owner_id=?", (b_user_id,))
        b_id = b_db[0]["id"] if b_db else None
        print(f"  [2.1 {b_type}] Profile Register: HTTP {b_reg['status']}, DB Row: {b_db}")

        # 2.2 Upload Verification Document
        fake_doc_bytes = b"%PDF-1.4 Fake Official Registration Document for Swat Tourism Verification"
        b_doc = api_request("POST", "/verification/documents", {
            "doc_type": "registration",
            "file": ("license.pdf", fake_doc_bytes, "application/pdf")
        }, token=b_token, is_multipart=True)
        doc_db = query_db("SELECT id, business_id, doc_type, status, file_url FROM verification_documents WHERE business_id=?", (b_id,))
        print(f"  [2.2 {b_type}] Upload Doc: HTTP {b_doc['status']}, DB Row: {doc_db}")

        # 2.3 Create Listing with Type-Specific Services
        if b_type == "hotel":
            l_details = {
                "star_rating": 4,
                "check_in_time": "14:00",
                "check_out_time": "11:00",
                "total_rooms": 15,
                "pets_allowed": False
            }
            price_items = [
                {"name": "Deluxe River View Room", "price": 9500, "unit": "per_night", "capacity": 2, "category": "room"},
                {"name": "Family Pine Suite", "price": 14000, "unit": "per_night", "capacity": 4, "category": "room"},
                {"name": "Traditional Buffet Breakfast", "price": 1200, "unit": "per_person", "category": "extra"},
                {"name": "Evening Bonfire & Rabab Night", "price": 2500, "unit": "per_item", "category": "activity"}
            ]
        elif b_type == "restaurant":
            l_details = {
                "cuisine": "Swati Trout & Shinwari BBQ",
                "seating_capacity": 60,
                "takes_reservations": True,
                "has_delivery": False,
                "halal": True
            }
            price_items = [
                {"name": "Swat River Pan-Fried Fresh Trout", "price": 1800, "unit": "per_item", "category": "Trout Specialties"},
                {"name": "Kalam Shinwari Mutton Karahi (1kg)", "price": 2800, "unit": "per_item", "category": "Main BBQ & Karahi"},
                {"name": "Special Green Tea Qahwa with Saffron", "price": 250, "unit": "per_item", "category": "Beverages & Desserts"}
            ]
        elif b_type == "transport":
            l_details = {
                "vehicle_type": "4x4 Toyota Prado",
                "seats": 7,
                "with_driver": True,
                "routes": ["Mingora to Malam Jabba", "Malam Jabba to Kalam", "Kalam to Mahodand Lake"],
                "fuel_included": True
            }
            price_items = [
                {"name": "Mingora to Malam Jabba Leg", "price": 7000, "unit": "per_trip", "category": "route"},
                {"name": "Malam Jabba to Kalam Valley Leg", "price": 9500, "unit": "per_trip", "category": "route"},
                {"name": "Mahodand Lake 4x4 Day Excursion", "price": 8500, "unit": "per_trip", "category": "route"}
            ]
        elif b_type == "guide":
            l_details = {
                "languages": ["Urdu", "English", "Pashto"],
                "years_experience": 8,
                "specialities": ["High Altitude Trekking", "Gandhara Buddhist Heritage", "Botanical Nature Walks"],
                "license_no": "KP-SWAT-GD-2024",
                "max_group_size": 12
            }
            price_items = [
                {"name": "Full Day Alpine Guided Trek (8 Hours)", "price": 5000, "unit": "per_day", "category": "guide_service"},
                {"name": "Half Day Cultural & Heritage Tour", "price": 3000, "unit": "per_day", "category": "guide_service"}
            ]
        elif b_type == "activity":
            l_details = {
                "activity_type": "Skiing & Snowboarding",
                "duration_hours": 3.0,
                "min_age": 8,
                "max_group_size": 15,
                "difficulty": "moderate",
                "safety_gear_included": True
            }
            price_items = [
                {"name": "Skiing Lesson with Certified Instructor (2 Hours)", "price": 5500, "unit": "per_person", "category": "lesson"},
                {"name": "Complete Ski & Boot Rental Gear", "price": 3500, "unit": "per_person", "category": "rental"}
            ]
        else: # shop
            l_details = {
                "shop_category": "Indigenous Swati Shawls & Woodcraft",
                "certificate_provided": True,
                "accepts_cards": True,
                "ships_orders": True
            }
            price_items = [
                {"name": "Handmade Pure Wool Swati Shawl", "price": 6500, "unit": "per_item", "category": "Textiles"},
                {"name": "Hand-Carved Walnut Wooden Tea Box", "price": 3200, "unit": "per_item", "category": "Woodcraft"}
            ]

        listing_payload = {
            "type_code": b_type,
            "area_id": kalam_area_id,
            "title": f"Official {b_name}",
            "description": f"Verified authentic {b_type} offering top quality services in Swat.",
            "address_text": f"Main {b_type.capitalize()} Road, Kalam, Swat",
            "latitude": 35.4907,
            "longitude": 72.5796,
            "phone": "+92-946-812999",
            "whatsapp_number": "+92-946-812999",
            "opening_time": "08:00:00",
            "closing_time": "22:00:00",
            "details": l_details,
            "tag_ids": [],
            "price_items": price_items
        }

        b_list_res = api_request("POST", "/listings/", listing_payload, token=b_token)
        l_id = b_list_res["data"]["id"] if b_list_res["status"] == 201 else None
        l_db = query_db("SELECT id, title, type_id, area_id, status, is_verified, phone, address_text FROM listings WHERE id=?", (l_id,))
        p_db = query_db("SELECT id, name, price, unit, category FROM price_items WHERE listing_id=?", (l_id,))
        print(f"  [2.3 {b_type}] Create Listing: HTTP {b_list_res['status']}, Listing DB: {l_db}, PriceItems Count: {len(p_db)}")

        # 2.4 Set Availability and Block a Date
        target_p_item = p_db[0]["id"] if p_db else None
        test_date = (date.today() + timedelta(days=10)).isoformat()
        blocked_date = (date.today() + timedelta(days=11)).isoformat()
        
        b_avail = api_request("POST", f"/listings/{l_id}/availability", {
            "items": [
                {"price_item_id": target_p_item, "date": test_date, "units_total": 5, "is_blocked": False},
                {"price_item_id": target_p_item, "date": blocked_date, "units_total": 5, "is_blocked": True}
            ]
        }, token=b_token)
        avail_db = query_db("SELECT id, price_item_id, date, units_total, is_blocked FROM availability WHERE price_item_id=?", (target_p_item,))
        print(f"  [2.4 {b_type}] Set Availability & Block Date: HTTP {b_avail['status']}, DB Rows: {avail_db}")

        # 2.5 Submit Listing & Check Pending Status / Invisible to Tourists
        b_pub = api_request("POST", f"/listings/{l_id}/publish", token=b_token)
        # Check explore endpoint as tourist
        tourist_explore = api_request("GET", f"/listings/explore?type={b_type}")
        is_visible_before_auth = any(x["id"] == l_id for x in tourist_explore.get("data", []))
        print(f"  [2.5 {b_type}] Publish (Status={b_pub['data']['status']}): Visible to Tourists Before Approval? {is_visible_before_auth} (Expected: False)")

        # 2.6 Authority Approves Business & Listing
        b_decide = api_request("POST", f"/verification/approvals/{b_id}/decide", {
            "status": "approved",
            "note": "Credentials verified against Swat Tourism Department registry."
        }, token=authority_token)
        
        # Check Explore endpoint after approval
        tourist_explore_after = api_request("GET", f"/listings/explore?type={b_type}")
        visible_listing = next((x for x in tourist_explore_after.get("data", []) if x["id"] == l_id), None)
        print(f"  [2.6 {b_type}] Authority Approval: HTTP {b_decide['status']}, Visible to Tourists Now? {bool(visible_listing)}")
        if visible_listing:
            print(f"       Appeared with {len(visible_listing['price_items'])} price items, verified={visible_listing['is_verified']}, address='{visible_listing['address_text']}'")

    # =========================================================================
    # FLOW 3: COMMUNITY REGISTRATION FLOW
    # =========================================================================
    print("\n--- AUDITING FLOW 3: COMMUNITY REGISTRATION ---")

    # 3.1 Register Community Member
    c_email = f"community.audit.{uuid.uuid4().hex[:6]}@example.com"
    c_reg = api_request("POST", "/auth/register", {
        "email": c_email,
        "phone": f"+92321{uuid.uuid4().int % 10000000:07d}",
        "password": "Password123!",
        "full_name": "Gul Khan Swati",
        "role": "community",
        "member_type": "resident",
        "bio": "Lifelong resident of Ushu, Kalam."
    })
    c_user_id = c_reg["data"]["user"]["id"] if c_reg["status"] == 201 else None
    c_token = c_reg["data"]["access_token"] if c_reg["status"] == 201 else None
    c_db = query_db("SELECT id, email, role, full_name, status FROM users WHERE id=?", (c_user_id,))
    print(f"3.1 Community Register: HTTP {c_reg['status']}, User DB Row: {c_db}")

    # 3.2 Complete Community Profile (area, member_type, bio)
    c_prof = api_request("PUT", "/auth/profile", {
        "bio": "Experienced local artisan and host in Ushu Valley, Kalam."
    }, token=c_token)
    c_prof_db = query_db("SELECT * FROM community_profiles WHERE user_id=?", (c_user_id,))
    print(f"3.2 Complete Community Profile: HTTP {c_prof['status']}, DB Row: {c_prof_db}")

    # 3.3 Post a Story
    c_story = api_request("POST", "/community/posts", {
        "title": "Secrets of Kundol Glacial Lake Trail",
        "body": "An ancient alpine route past Utror where shepherd settlements still produce fresh sheep butter and wild oregano tea.",
        "post_type": "story",
        "area_id": kalam_area_id
    }, token=c_token)
    story_id = c_story["data"]["id"] if c_story["status"] == 201 else None
    story_db = query_db("SELECT id, title, post_type, status, author_id FROM community_posts WHERE id=?", (story_id,))
    print(f"3.3 Post Story: HTTP {c_story['status']}, DB Row: {story_db}")

    # 3.4 Report an Issue (Road hazard / overcharging) & Verify in Authority Cases
    c_rep = api_request("POST", "/community/reports", {
        "category": "road_blocked",
        "title": "Loose Rockfall on Kalam-Utror Jeep Track",
        "description": "Heavy overnight rain caused limestone debris to slide 2km before Utror bridge. Only high clearance 4x4 can pass.",
        "area_id": kalam_area_id,
        "latitude": 35.5000,
        "longitude": 72.4500
    }, token=c_token)
    report_id = c_rep["data"]["id"] if c_rep["status"] == 201 else None
    rep_db = query_db("SELECT id, category, title, status, reporter_id FROM issue_reports WHERE id=?", (report_id,))
    print(f"3.4 Report Issue: HTTP {c_rep['status']}, DB Row: {rep_db}")

    # Check that report reaches Authority Cases list
    auth_cases = api_request("GET", "/community/reports/all", token=authority_token)
    found_in_cases = any(r["id"] == report_id for r in auth_cases.get("data", []))
    print(f"3.4 Report reached Authority Cases Queue: {found_in_cases} (Total reports in queue: {len(auth_cases.get('data', []))})")

    # Authority assigns/resolves report
    if report_id:
        auth_resolve = api_request("PATCH", f"/community/reports/{report_id}", {
            "status": "resolved",
            "resolution_note": "District Highways team cleared the limestone rockfall with heavy machinery. 4x4 track fully open."
        }, token=authority_token)
        rep_resolved_db = query_db("SELECT id, status, resolution_note, resolved_at FROM issue_reports WHERE id=?", (report_id,))
        print(f"3.4 Authority Resolves Issue: HTTP {auth_resolve['status']}, DB Row: {rep_resolved_db}")

    # 3.5 Submit Host Application & Authority Approval
    c_host = api_request("POST", "/community/hosts/apply", {
        "offer_type": "homestay",
        "description": "Traditional stone-and-timber cottage with 2 guest rooms, riverside garden, and home-cooked Swati meals."
    }, token=c_token)
    host_app_id = c_host["data"]["id"] if c_host["status"] == 201 else None
    host_db = query_db("SELECT id, user_id, offer_type, status FROM host_applications WHERE id=?", (host_app_id,))
    print(f"3.5 Submit Host Application: HTTP {c_host['status']}, DB Row: {host_db}")

    # Authority Review & Approve Host Application
    auth_host_rev = api_request("POST", f"/community/hosts/{host_app_id}/review", {
        "status": "approved",
        "review_notes": "Property inspected by local tourism field officer. Safety standards met."
    }, token=authority_token)
    host_approved_db = query_db("SELECT id, status FROM host_applications WHERE id=?", (host_app_id,))
    comm_prof_db = query_db("SELECT user_id, is_host_approved FROM community_profiles WHERE user_id=?", (c_user_id,))
    print(f"3.5 Authority Approves Host: HTTP {auth_host_rev['status']}, Host App DB: {host_approved_db}, Community Profile Host Approved: {comm_prof_db}")

    print("\n" + "=" * 80)
    print("AUDIT EXECUTION COMPLETE!")
    print("=" * 80)

if __name__ == "__main__":
    run_audit()
