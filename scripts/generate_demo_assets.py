import os
import sys
import time
import shutil
import subprocess
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = r"F:\Antigravity\SwatTourismPlateform1"
DOCS_DIR = os.path.join(BASE_DIR, "Docs")
TEMP_DIR = os.path.join(DOCS_DIR, "demo_frames")
DOWNLOADS_DIR = r"C:\Users\shahkhalid1\Downloads"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(DOCS_DIR, exist_ok=True)

THEME_COLORS = {
    "TOURIST": {"bg": (13, 148, 136), "text": (255, 255, 255)},     # Teal
    "BUSINESS": {"bg": (37, 99, 235), "text": (255, 255, 255)},     # Royal Blue
    "COMMUNITY": {"bg": (22, 163, 74), "text": (255, 255, 255)},    # Emerald Green
    "AUTHORITY": {"bg": (225, 29, 72), "text": (255, 255, 255)},    # Crimson
}

SCREENS = [
    # TOURIST PORTAL
    {
        "id": "01_tourist_home",
        "url": "http://localhost:5180/?role=tourist&tab=home",
        "persona_key": "TOURIST",
        "persona_name": "TOURIST PORTAL (Sara Ahmed)",
        "badge": "DISCOVERY & WEATHER",
        "title": "Interactive Swat Valley Feed, Live Weather & Road Advisories",
        "desc": "Real-time travel conditions, valley highlights, and verified local recommendations."
    },
    {
        "id": "02_tourist_explore",
        "url": "http://localhost:5180/?role=tourist&tab=explore",
        "persona_key": "TOURIST",
        "persona_name": "TOURIST PORTAL (Sara Ahmed)",
        "badge": "DIRECTORY & FILTERS",
        "title": "Comprehensive Listings (Hotels, 4x4 Transport, Guides & Artisans)",
        "desc": "Valley chips (Kalam, Bahrain, Mingora) and verified quality badges."
    },
    {
        "id": "03_tourist_trips",
        "url": "http://localhost:5180/?role=tourist&tab=trips",
        "persona_key": "TOURIST",
        "persona_name": "TOURIST PORTAL (Sara Ahmed)",
        "badge": "TRIP PLANNER",
        "title": "Multi-Day Trip Builder, Hotel Room Stay & Instant Mock Pay",
        "desc": "Day-by-day planner with automatic price calculation and seamless 1-click confirmation."
    },
    {
        "id": "04_tourist_safety",
        "url": "http://localhost:5180/?role=tourist&tab=safety",
        "persona_key": "TOURIST",
        "persona_name": "TOURIST PORTAL (Sara Ahmed)",
        "badge": "CRISIS & SOS",
        "title": "Live Road Passes, Emergency Numbers & 1-Click SOS Dispatch",
        "desc": "Immediate GPS location capture with direct integration to Rescue 1122 and District Control."
    },

    # BUSINESS PORTAL
    {
        "id": "05_business_today",
        "url": "http://localhost:5180/?role=business&tab=today",
        "persona_key": "BUSINESS",
        "persona_name": "BUSINESS PORTAL (Riverside Inn / Swat Serena)",
        "badge": "OPERATIONS DASHBOARD",
        "title": "Real-time Daily Operations KPI Counter (Arrivals, Departures, Revenue)",
        "desc": "Hotel operators monitor guest flow, occupancy, and incoming booking requests."
    },
    {
        "id": "06_business_listings",
        "url": "http://localhost:5180/?role=business&tab=listings",
        "persona_key": "BUSINESS",
        "persona_name": "BUSINESS PORTAL (Riverside Inn / Swat Serena)",
        "badge": "ROOM INVENTORY",
        "title": "Service Listings, Multi-Tier Room Configurations & Pricing",
        "desc": "Hotels manage Deluxe/Executive rooms, pricing tiers, amenities, and authority verification."
    },
    {
        "id": "07_business_availability",
        "url": "http://localhost:5180/?role=business&tab=availability",
        "persona_key": "BUSINESS",
        "persona_name": "BUSINESS PORTAL (Riverside Inn / Swat Serena)",
        "badge": "60-DAY CAPACITY",
        "title": "60-Day Visual Availability Engine & Date Blocking Calendar",
        "desc": "Prevents overbooking with row-level reservation locking across peak tourism seasons."
    },
    {
        "id": "08_business_reviews",
        "url": "http://localhost:5180/?role=business&tab=reviews",
        "persona_key": "BUSINESS",
        "persona_name": "BUSINESS PORTAL (Riverside Inn / Swat Serena)",
        "badge": "REPUTATION",
        "title": "Verified Guest Ratings, Reviews & Official Response Threading",
        "desc": "Operators maintain trust with transparent 5-star ratings and verified traveler feedback."
    },

    # COMMUNITY PORTAL
    {
        "id": "09_community_stories",
        "url": "http://localhost:5180/?role=community&tab=stories",
        "persona_key": "COMMUNITY",
        "persona_name": "COMMUNITY PORTAL (Gul Zaman / Local Resident)",
        "badge": "INDIGENOUS CULTURE",
        "title": "Swati Heritage Stories, Folklore & Eco-Tourism Guides",
        "desc": "Local storytellers preserve valley traditions, cultural heritage, and seasonal events."
    },
    {
        "id": "10_community_crafts",
        "url": "http://localhost:5180/?role=community&tab=crafts",
        "persona_key": "COMMUNITY",
        "persona_name": "COMMUNITY PORTAL (Gul Zaman / Local Resident)",
        "badge": "ARTISAN MARKETPLACE",
        "title": "Traditional Crafts (Wool Shawls, Walnut Wood, Honey) & Direct WhatsApp",
        "desc": "Connects rural artisans directly to travelers via wa.me links, eliminating middleman commissions."
    },
    {
        "id": "11_community_report",
        "url": "http://localhost:5180/?role=community&tab=report",
        "persona_key": "COMMUNITY",
        "persona_name": "COMMUNITY PORTAL (Gul Zaman / Local Resident)",
        "badge": "CIVIC DISPATCH",
        "title": "Citizen Incident Reporting: Landslides, Roadblocks & Trash",
        "desc": "Locals submit geo-tagged incident reports directly to District Municipal Authorities for fast response."
    },
    {
        "id": "12_community_hosts",
        "url": "http://localhost:5180/?role=community&tab=hosts",
        "persona_key": "COMMUNITY",
        "persona_name": "COMMUNITY PORTAL (Gul Zaman / Local Resident)",
        "badge": "VILLAGE HOMESTAYS",
        "title": "Local Host Program: Rural Homestay & Village Room Onboarding",
        "desc": "Enables villagers to list spare rooms for tourism income under government-verified standards."
    },

    # AUTHORITY PORTAL
    {
        "id": "13_authority_overview",
        "url": "http://localhost:5180/?role=authority&tab=overview",
        "persona_key": "AUTHORITY",
        "persona_name": "AUTHORITY PORTAL (District Tourism Officer)",
        "badge": "COMMAND CENTER",
        "title": "Command & Control Center: Tourist Inflow, Active Incidents & Audits",
        "desc": "Government oversight dashboard tracking valley footfall, license queues, and active safety alerts."
    },
    {
        "id": "14_authority_approvals",
        "url": "http://localhost:5180/?role=authority&tab=approvals",
        "persona_key": "AUTHORITY",
        "persona_name": "AUTHORITY PORTAL (District Tourism Officer)",
        "badge": "VERIFICATION GATE",
        "title": "Business License Verification & Official Green Badge Approval",
        "desc": "Rigorous regulatory gate inspecting CNICs, hotel registrations, and quality certificates."
    },
    {
        "id": "15_authority_advisories",
        "url": "http://localhost:5180/?role=authority&tab=advisories",
        "persona_key": "AUTHORITY",
        "persona_name": "AUTHORITY PORTAL (District Tourism Officer)",
        "badge": "PUBLIC SAFETY",
        "title": "Emergency Weather Broadcasts & 4x4 / Road Pass Status Editor",
        "desc": "Officers broadcast high-priority flood/snow warnings and update mountain pass accessibility."
    },
    {
        "id": "16_authority_cases",
        "url": "http://localhost:5180/?role=authority&tab=cases",
        "persona_key": "AUTHORITY",
        "persona_name": "AUTHORITY PORTAL (District Tourism Officer)",
        "badge": "EMERGENCY TRIAGE",
        "title": "Rescue 1122 SOS Distress Queue & Community Complaint Triage",
        "desc": "Live emergency triage room assigning rescue personnel and resolving road incidents with audit logs."
    }
]

def capture_screen(url, raw_path):
    print(f"Capturing: {url} -> {os.path.basename(raw_path)}")
    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--virtual-time-budget=3500",
        "--window-size=1600,1050",
        f"--screenshot={raw_path}",
        url
    ]
    subprocess.run(cmd, check=True)

def render_executive_frame(raw_path, tagged_path, screen_info, frame_idx, total_frames):
    base_img = Image.open(raw_path).convert("RGBA")
    w, h = base_img.size

    header_h = 70
    canvas = Image.new("RGBA", (w, h + header_h), (15, 23, 42, 255))
    draw = ImageDraw.Draw(canvas)

    font_bold = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 19)
    font_regular = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 15)
    font_badge = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 13)

    theme = THEME_COLORS.get(screen_info["persona_key"], {"bg": (14, 165, 233), "text": (255, 255, 255)})

    badge_text = screen_info["persona_key"]
    pill_w = 110
    pill_h = 28
    pill_x = 24
    pill_y = 20
    draw.rounded_rectangle([pill_x, pill_y, pill_x + pill_w, pill_y + pill_h], radius=6, fill=theme["bg"])
    draw.text((pill_x + 12, pill_y + 4), badge_text, fill=theme["text"], font=font_badge)

    title_x = pill_x + pill_w + 18
    draw.text((title_x, 14), screen_info["title"], fill=(255, 255, 255), font=font_bold)
    draw.text((title_x, 40), f"{screen_info['persona_name']}  •  {screen_info['badge']}  •  {screen_info['desc']}", fill=(148, 163, 184), font=font_regular)

    step_str = f"STEP {frame_idx:02d} / {total_frames:02d}"
    draw.text((w - 170, 16), step_str, fill=(56, 189, 248), font=font_bold)
    draw.text((w - 200, 40), "SWAT TOURISM SYSTEM", fill=(100, 116, 139), font=font_regular)

    draw.line([(0, header_h - 1), (w, header_h - 1)], fill=(30, 41, 59), width=2)
    draw.line([(pill_x, header_h - 2), (title_x + 600, header_h - 2)], fill=theme["bg"], width=2)

    canvas.paste(base_img, (0, header_h), base_img)

    final_img = canvas.convert("RGB")
    final_img.save(tagged_path, quality=94)
    return final_img

def main():
    print("=== STARTING COMPLETE FRESH 16-FRAME CAPTURE ===")
    total = len(SCREENS)
    tagged_frames = []

    for i, s in enumerate(SCREENS, 1):
        raw_png = os.path.join(TEMP_DIR, f"fresh_raw_{s['id']}.png")
        tagged_png = os.path.join(TEMP_DIR, f"fresh_tagged_{s['id']}.png")

        capture_screen(s["url"], raw_png)
        time.sleep(0.3)

        tagged_img = render_executive_frame(raw_png, tagged_png, s, i, total)
        opt_frame = tagged_img.resize((1280, 896), Image.Resampling.LANCZOS)
        tagged_frames.append(opt_frame)

    gif_path = os.path.join(DOCS_DIR, "swat-tourism-demo.gif")
    print(f"\nAssembling 16 broadcast frames into: {gif_path}")
    tagged_frames[0].save(
        gif_path,
        save_all=True,
        append_images=tagged_frames[1:],
        duration=2500,
        loop=0,
        optimize=True
    )
    print(f"Broadcast Demo GIF saved: {os.path.getsize(gif_path)} bytes")

    if os.path.exists(DOWNLOADS_DIR):
        dl_gif = os.path.join(DOWNLOADS_DIR, "swat-tourism-demo.gif")
        shutil.copy2(gif_path, dl_gif)
        print(f"Copied Demo GIF to: {dl_gif}")

    print("=== DEMO GENERATION FINISHED SUCCESSFULLY ===")

if __name__ == "__main__":
    main()
