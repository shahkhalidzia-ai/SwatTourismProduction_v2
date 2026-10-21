import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT_DIR = Path(r"F:\Antigravity\SwatTourismProduction\videoscript\video_compilation")
OUT_DIR.mkdir(parents=True, exist_ok=True)

WIDTH = 1910
HEIGHT = 926

SLIDES = [
    {
        "id": "slide_0_intro",
        "type": "intro",
        "tag": "DIGITAL TOURISM ECOSYSTEM",
        "title": "Swat Tourism Platform",
        "subtitle": "A Comprehensive Digital Platform for Tourism in Swat Valley",
        "desc": "Connecting Tourists, Tourism Businesses, Local Community, and Authorities into a unified, secure, and modern digital platform.",
        "badge_color": "#2F7FC1",
        "pillars": [
            {
                "icon": "🧭",
                "title": "Tourist Portal",
                "desc": "Trip planning, day-by-day itineraries, live weather, verified services & emergency SOS."
            },
            {
                "icon": "🏨",
                "title": "Business Portal",
                "desc": "Multi-category listing management, booking workflows, room availability & instant vouchers."
            },
            {
                "icon": "🤝",
                "title": "Community Portal",
                "desc": "Local stories, handmade Swati crafts marketplace, host applications & direct citizen reporting."
            },
            {
                "icon": "🛡️",
                "title": "Authority Portal",
                "desc": "Regulatory oversight, business verification gate, live road advisories & emergency dispatch."
            }
        ]
    },
    {
        "id": "slide_1_tourist",
        "type": "section",
        "part": "PART 01",
        "tag": "TOURIST EXPERIENCE & TRIP MANAGEMENT",
        "title": "Tourist Experience & Discovery",
        "subtitle": "Discover Destinations, Plan Custom Trips, Book Verified Stays & Travel Safely",
        "desc": "An intuitive portal empowering travelers to explore the scenic valleys of Swat with real-time intelligence, transparent pricing, and comprehensive safety tools.",
        "badge_color": "#0284C7",
        "items": [
            ("🗺️", "Explore Attractions", "Interactive destination catalog with Mingora, Malam Jabba, Kalam, Ushu Forest, and live weather forecast modal."),
            ("📅", "Interactive Trip Planner", "Day-by-day smart itinerary builder with stay continuity tracking, transport connections, and Rule-4 transparent pricing."),
            ("🛎️", "Verified Accommodations & Fleets", "Instant room and fleet booking, live fare calculation, driver assignments, and digital booking vouchers."),
            ("🚨", "Real-Time Safety & SOS", "Live road statuses, official weather warnings, localized emergency contacts, and one-tap SOS GPS dispatch.")
        ]
    },
    {
        "id": "slide_2_business",
        "type": "section",
        "part": "PART 02",
        "tag": "HOSPITALITY & ENTERPRISE MANAGEMENT",
        "title": "Tourism Business & Hospitality",
        "subtitle": "Complete Digital Operations for Hotels, Restaurants, Fleets & Tour Guides",
        "desc": "A robust business management suite enabling Swat Valley operators to handle listings, room availability, guest bookings, and regulatory compliance.",
        "badge_color": "#10B981",
        "items": [
            ("📊", "Operations Dashboard", "Real-time KPIs for daily arrivals, new reservation requests, confirmed stays, and customer reviews."),
            ("📅", "Availability Calendar", "Interactive room and inventory availability calendar with color-coded booking highlights and instant blocking."),
            ("🛎️", "Dynamic Listing Engine", "Detailed listings for rooms, dining menus, vehicle fleets, guide packages, and seasonal price items."),
            ("📄", "Booking & Voucher Workflow", "Accept or decline bookings with clear reasoning, customer contact access, and verified voucher checks.")
        ]
    },
    {
        "id": "slide_3_community",
        "type": "section",
        "part": "PART 03",
        "tag": "COMMUNITY ENGAGEMENT & LOCAL HERITAGE",
        "title": "Community Voice, Stories & Crafts",
        "subtitle": "Empowering Local Residents, Artisans, Homestays & Cultural Custodians",
        "desc": "A vibrant digital space celebrating Swat Valley culture, giving local residents a direct voice, economic opportunity, and civic reporting channels.",
        "badge_color": "#F59E0B",
        "items": [
            ("📖", "Local Stories & Hidden Gems", "Community-authored cultural stories, seasonal festivals, photography, and off-the-beaten-path recommendations."),
            ("🧶", "Artisans & Handicrafts Directory", "Showcase of traditional Swati embroidery, woodworking, shawls, and pure honey with direct WhatsApp inquiries."),
            ("🏡", "Local Host & Guide Applications", "Formal registration pathways for community members to become certified homestay hosts and local mountain guides."),
            ("📢", "Direct Community Reporting", "Civic reporting mechanism allowing residents to alert authorities about road hazards, pollution, or safety issues.")
        ]
    },
    {
        "id": "slide_4_authority",
        "type": "section",
        "part": "PART 04",
        "tag": "GOVERNANCE, OVERSIGHT & SAFETY",
        "title": "Tourism Authority & Administration",
        "subtitle": "Centralized Governance, Business Licensing, Road Safety & Regulatory Oversight",
        "desc": "An authoritative administrative command center ensuring tourism safety, service quality standards, and swift disaster response across the valley.",
        "badge_color": "#6366F1",
        "items": [
            ("📈", "Valley Intelligence & Overview", "Aggregated intelligence on active visitors, open community cases, pending approvals, and active road alerts."),
            ("🏛️", "Directory & Business Approvals", "Multi-criteria business verification gate, license audits, and regulatory inspection modal."),
            ("⚠️", "Advisories & Road Condition Engine", "Publish urgent weather warnings, snow avalanche alerts, road blockages, and route status updates in real-time."),
            ("🚨", "Emergency SOS Dispatch & Case Resolution", "Instant distress signal handling with GPS coordinates and full lifecycle community report tracking.")
        ]
    },
    {
        "id": "slide_5_outro",
        "type": "outro",
        "tag": "SWAT TOURISM PLATFORM",
        "title": "Swat Tourism Platform",
        "subtitle": "Connecting Tourists, Businesses, Community & Authorities",
        "desc": "A unified digital gateway elevating tourism standards, preserving cultural heritage, and ensuring visitor safety across the scenic Swat Valley.",
        "badge_color": "#10B981",
        "pillars": [
            {
                "icon": "✨",
                "title": "Seamless Experience",
                "desc": "Unified mobile & web portal linking travelers with verified valley services and live intelligence."
            },
            {
                "icon": "📈",
                "title": "Economic Growth",
                "desc": "Direct digital marketplace empowering local hotels, artisans, drivers, guides, and businesses."
            },
            {
                "icon": "🛡️",
                "title": "Safety & Governance",
                "desc": "Continuous authority oversight, transparent road conditions, weather advisories & instant SOS."
            },
            {
                "icon": "🏔️",
                "title": "Sustainable Swat",
                "desc": "Preserving nature, promoting responsible travel, and celebrating authentic Swati hospitality."
            }
        ]
    }
]

def render_html(slide):
    if slide["type"] in ("intro", "outro"):
        # Intro / Outro Slide
        cards_html = ""
        for p in slide["pillars"]:
            cards_html += f"""
            <div class="pillar-card">
                <div class="pillar-icon">{p["icon"]}</div>
                <div class="pillar-title">{p["title"]}</div>
                <div class="pillar-desc">{p["desc"]}</div>
            </div>
            """
        badge_text = slide["tag"]
        sub_badge = "DEMO CONCLUSION" if slide["type"] == "outro" else "PRODUCTION SYSTEM DEMO"
        content_html = f"""
        <div class="intro-container">
            <div class="hero-header">
                <div class="badge-pill">
                    <span class="badge-dot"></span>
                    <span>{badge_text}</span>
                </div>
                <h1 class="main-title">{slide["title"]}</h1>
                <h2 class="sub-title">{slide["subtitle"]}</h2>
                <p class="hero-desc">{slide["desc"]}</p>
            </div>
            <div class="pillars-grid">
                {cards_html}
            </div>
        </div>
        """
    else:
        # Section Intro Slide
        items_html = ""
        for icon, title, desc in slide["items"]:
            items_html += f"""
            <div class="item-card">
                <div class="item-icon-box">{icon}</div>
                <div class="item-text">
                    <div class="item-title">{title}</div>
                    <div class="item-desc">{desc}</div>
                </div>
            </div>
            """
        content_html = f"""
        <div class="section-container">
            <div class="section-left">
                <div class="part-pill" style="border-color: {slide['badge_color']}; color: {slide['badge_color']};">
                    <span>{slide["part"]}</span>
                    <span style="opacity: 0.5;">•</span>
                    <span>{slide["tag"]}</span>
                </div>
                <h1 class="section-title">{slide["title"]}</h1>
                <h2 class="section-subtitle">{slide["subtitle"]}</h2>
                <div class="accent-line" style="background: linear-gradient(90deg, {slide['badge_color']}, transparent);"></div>
                <p class="section-desc">{slide["desc"]}</p>
                <div class="portal-badge" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);">
                    <span style="font-size: 13px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700;">Demonstration Video</span>
                    <span style="font-size: 15px; color: #FFFFFF; font-weight: 800; margin-top: 4px;">Live System Walkthrough & Feature Tour</span>
                </div>
            </div>
            <div class="section-right">
                <div class="items-grid">
                    {items_html}
                </div>
            </div>
        </div>
        """

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width={WIDTH}, height={HEIGHT}">
    <title>{slide["title"]}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@500;700;800;900&display=swap" rel="stylesheet">
    <style>
        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }}
        body {{
            width: {WIDTH}px;
            height: {HEIGHT}px;
            overflow: hidden;
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #08101C;
            color: #F8FAFC;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 48px 64px 36px;
        }}
        /* Ambient Gradient Background */
        .ambient-glow {{
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 0;
            background: 
                radial-gradient(circle at 15% 20%, rgba(47, 127, 193, 0.22) 0%, transparent 45%),
                radial-gradient(circle at 85% 25%, rgba(16, 185, 129, 0.16) 0%, transparent 45%),
                radial-gradient(circle at 50% 85%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
                linear-gradient(180deg, rgba(8, 16, 28, 0.85) 0%, #08101C 100%);
        }}
        .grid-overlay {{
            position: absolute;
            inset: 0;
            background-image: 
                linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 48px 48px;
            pointer-events: none;
            z-index: 1;
        }}

        /* Content Layer */
        .content-layer {{
            position: relative;
            z-index: 10;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }}

        /* Top Brand Bar */
        .brand-bar {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }}
        .brand-identity {{
            display: flex;
            align-items: center;
            gap: 14px;
        }}
        .brand-icon {{
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: linear-gradient(135deg, #2F7FC1, #10B981);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            box-shadow: 0 4px 16px rgba(47, 127, 193, 0.4);
        }}
        .brand-title {{
            font-family: 'Outfit', sans-serif;
            font-weight: 800;
            font-size: 20px;
            letter-spacing: -0.01em;
            color: #FFFFFF;
        }}
        .brand-sub {{
            font-size: 12px;
            color: #94A3B8;
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }}
        .status-pill {{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 14px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 30px;
            font-size: 12.5px;
            font-weight: 700;
            color: #E2E8F0;
            backdrop-filter: blur(10px);
        }}
        .pulse-green {{
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #10B981;
            box-shadow: 0 0 10px #10B981;
        }}

        /* Intro Layout */
        .intro-container {{
            margin-top: 28px;
            display: flex;
            flex-direction: column;
            gap: 32px;
        }}
        .hero-header {{
            text-align: center;
            max-width: 1200px;
            margin: 0 auto;
        }}
        .badge-pill {{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 16px;
            border-radius: 30px;
            background: rgba(47, 127, 193, 0.15);
            border: 1px solid rgba(47, 127, 193, 0.35);
            color: #38BDF8;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 14px;
        }}
        .badge-dot {{
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #38BDF8;
        }}
        .main-title {{
            font-family: 'Outfit', sans-serif;
            font-size: 58px;
            font-weight: 900;
            letter-spacing: -0.03em;
            line-height: 1.1;
            background: linear-gradient(135deg, #FFFFFF 30%, #BAE6FD 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 12px;
        }}
        .sub-title {{
            font-size: 22px;
            font-weight: 700;
            color: #38BDF8;
            margin-bottom: 12px;
            letter-spacing: -0.01em;
        }}
        .hero-desc {{
            font-size: 16px;
            color: #94A3B8;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
        }}

        .pillars-grid {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-top: 10px;
        }}
        .pillar-card {{
            background: rgba(255, 255, 255, 0.04);
            border: 1.5px solid rgba(255, 255, 255, 0.1);
            border-radius: 18px;
            padding: 24px 22px;
            backdrop-filter: blur(16px);
            box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.4);
            display: flex;
            flex-direction: column;
            gap: 12px;
            transition: all 0.2s ease;
        }}
        .pillar-icon {{
            font-size: 32px;
            width: 52px;
            height: 52px;
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.06);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255, 255, 255, 0.12);
        }}
        .pillar-title {{
            font-family: 'Outfit', sans-serif;
            font-size: 20px;
            font-weight: 800;
            color: #FFFFFF;
            letter-spacing: -0.01em;
        }}
        .pillar-desc {{
            font-size: 13.5px;
            color: #94A3B8;
            line-height: 1.55;
        }}

        /* Section Layout */
        .section-container {{
            display: grid;
            grid-template-columns: 1fr 1.15fr;
            gap: 48px;
            align-items: center;
            margin-top: 24px;
        }}
        .section-left {{
            display: flex;
            flex-direction: column;
            gap: 16px;
        }}
        .part-pill {{
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 6px 16px;
            border-radius: 24px;
            background: rgba(255, 255, 255, 0.05);
            border: 1.5px solid;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            width: fit-content;
        }}
        .section-title {{
            font-family: 'Outfit', sans-serif;
            font-size: 46px;
            font-weight: 900;
            letter-spacing: -0.025em;
            line-height: 1.12;
            color: #FFFFFF;
        }}
        .section-subtitle {{
            font-size: 19px;
            font-weight: 700;
            color: #93C5FD;
            line-height: 1.4;
        }}
        .accent-line {{
            height: 3px;
            width: 140px;
            border-radius: 2px;
            margin: 4px 0;
        }}
        .section-desc {{
            font-size: 15.5px;
            color: #94A3B8;
            line-height: 1.65;
        }}
        .portal-badge {{
            display: flex;
            flex-direction: column;
            padding: 14px 20px;
            border-radius: 14px;
            margin-top: 8px;
        }}

        .items-grid {{
            display: flex;
            flex-direction: column;
            gap: 14px;
        }}
        .item-card {{
            display: flex;
            align-items: flex-start;
            gap: 18px;
            background: rgba(255, 255, 255, 0.04);
            border: 1.5px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 16px 20px;
            backdrop-filter: blur(16px);
            box-shadow: 0 4px 20px -3px rgba(0, 0, 0, 0.3);
        }}
        .item-icon-box {{
            font-size: 26px;
            width: 46px;
            height: 46px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.06);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            border: 1px solid rgba(255, 255, 255, 0.12);
        }}
        .item-text {{
            display: flex;
            flex-direction: column;
            gap: 4px;
        }}
        .item-title {{
            font-family: 'Outfit', sans-serif;
            font-size: 17px;
            font-weight: 800;
            color: #FFFFFF;
            letter-spacing: -0.01em;
        }}
        .item-desc {{
            font-size: 13.5px;
            color: #94A3B8;
            line-height: 1.5;
        }}

        /* Bottom Footer Bar */
        .footer-bar {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            font-size: 12.5px;
            color: #64748B;
        }}
        .footer-left {{
            display: flex;
            align-items: center;
            gap: 16px;
        }}
        .footer-pill {{
            padding: 4px 10px;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.05);
            font-weight: 600;
            color: #94A3B8;
        }}
    </style>
</head>
<body>
    <div class="ambient-glow"></div>
    <div class="grid-overlay"></div>

    <div class="content-layer">
        <!-- Top Brand Bar -->
        <div class="brand-bar">
            <div class="brand-identity">
                <div class="brand-icon">🏔️</div>
                <div>
                    <div class="brand-title">SWAT TOURISM PLATFORM</div>
                    <div class="brand-sub">Government & Tourism Board Initiative • Swat Valley, KP</div>
                </div>
            </div>
            <div class="status-pill">
                <span class="pulse-green"></span>
                <span>PRODUCTION SYSTEM DEMO</span>
            </div>
        </div>

        <!-- Main Body -->
        {content_html}

        <!-- Bottom Footer Bar -->
        <div class="footer-bar">
            <div class="footer-left">
                <span class="footer-pill">STP Architecture v2.0</span>
                <span>Swat Tourism Unified Digital Gateway</span>
            </div>
            <div>
                <span>Powered by Swat Tourism Production Platform • 2026</span>
            </div>
        </div>
    </div>
</body>
</html>"""
    return html

def main():
    print(f"Generating {len(SLIDES)} presentation slides at {WIDTH}x{HEIGHT}...")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": WIDTH, "height": HEIGHT})
        for idx, slide in enumerate(SLIDES):
            html = render_html(slide)
            html_file = OUT_DIR / f"{slide['id']}.html"
            png_file = OUT_DIR / f"{slide['id']}.png"
            html_file.write_text(html, encoding="utf-8")
            page.goto(html_file.as_uri())
            page.wait_for_timeout(1000)
            page.screenshot(path=str(png_file))
            print(f"Saved slide {idx+1}/{len(SLIDES)}: {png_file.name}")
        browser.close()
    print("All slides successfully rendered!")

if __name__ == "__main__":
    main()
