"""
Generates high-resolution System Architecture Diagram for Swat Tourism Platform
as an ultra-crisp PNG image using Playwright Chromium.
"""

import os
from playwright.sync_api import sync_playwright

HTML_CONTENT = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  body {
    background-color: #0A0F1D;
    color: #F8FAFC;
    padding: 40px;
    width: 2400px;
    height: auto;
    overflow: hidden;
  }
  
  /* Header Section */
  .header-card {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85));
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 30px 40px;
    margin-bottom: 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    position: relative;
    overflow: hidden;
  }
  .header-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 8px;
    height: 100%;
    background: linear-gradient(180deg, #10B981, #06B6D4);
  }
  .header-title-group h1 {
    font-size: 34px;
    font-weight: 800;
    letter-spacing: -0.02em;
    background: linear-gradient(90deg, #FFFFFF, #94A3B8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 6px;
  }
  .header-title-group p {
    font-size: 16px;
    color: #94A3B8;
  }
  .header-badges {
    display: flex;
    gap: 12px;
  }
  .badge {
    padding: 8px 16px;
    border-radius: 100px;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .badge-gov {
    background: rgba(16, 185, 129, 0.15);
    color: #34D399;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }
  .badge-tech {
    background: rgba(6, 182, 212, 0.15);
    color: #22D3EE;
    border: 1px solid rgba(6, 182, 212, 0.3);
  }
  .badge-prod {
    background: rgba(245, 158, 11, 0.15);
    color: #FBBF24;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  /* Layers Layout */
  .architecture-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .layer-card {
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    padding: 24px 28px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(12px);
  }

  .layer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .layer-tag {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 4px 10px;
    border-radius: 6px;
  }
  .layer-title {
    font-size: 19px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .layer-desc {
    font-size: 13px;
    color: #64748B;
  }

  /* Grid Layouts */
  .grid-5 {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 18px;
  }
  .grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
  }
  .grid-6 {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 16px;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }

  /* Module / Node Box */
  .node-box {
    background: rgba(30, 41, 59, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 12px;
    padding: 16px;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .node-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .node-icon {
    font-size: 20px;
  }
  .node-pill {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
    text-transform: uppercase;
  }
  .node-title {
    font-size: 14.5px;
    font-weight: 700;
    color: #F1F5F9;
  }
  .node-sub {
    font-size: 11.5px;
    color: #94A3B8;
    line-height: 1.45;
  }
  .node-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 6px;
  }
  .micro-tag {
    font-size: 9.5px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #CBD5E1;
    padding: 2px 6px;
    border-radius: 3px;
  }

  /* Theme Accents */
  .accent-emerald .layer-tag { background: rgba(16, 185, 129, 0.2); color: #34D399; }
  .accent-emerald .node-box { border-left: 3px solid #10B981; }

  .accent-cyan .layer-tag { background: rgba(6, 182, 212, 0.2); color: #22D3EE; }
  .accent-cyan .node-box { border-left: 3px solid #06B6D4; }

  .accent-blue .layer-tag { background: rgba(59, 130, 246, 0.2); color: #60A5FA; }
  .accent-blue .node-box { border-left: 3px solid #3B82F6; }

  .accent-amber .layer-tag { background: rgba(245, 158, 11, 0.2); color: #FBBF24; }
  .accent-amber .node-box { border-left: 3px solid #F59E0B; }

  .accent-purple .layer-tag { background: rgba(168, 85, 247, 0.2); color: #C084FC; }
  .accent-purple .node-box { border-left: 3px solid #A855F7; }

  /* Flow Connectors */
  .flow-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin: -10px 0;
    color: #475569;
    font-size: 12px;
    font-weight: 600;
  }
  .flow-line {
    height: 1px;
    flex-grow: 1;
    background: linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.25), transparent);
  }
  .flow-label {
    background: #0F172A;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 3px 12px;
    border-radius: 100px;
    color: #94A3B8;
  }

  /* Footer */
  .footer-note {
    margin-top: 24px;
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #475569;
    padding-top: 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }
</style>
</head>
<body>

  <!-- HEADER -->
  <div class="header-card">
    <div class="header-title-group">
      <h1>Swat Tourism Digital Operating System</h1>
      <p>Comprehensive System Architecture Diagram • Production Multi-Portal Ecosystem & Real-Time Telemetry</p>
    </div>
    <div class="header-badges">
      <div class="badge badge-gov">🏛️ KPCTA Verified Architecture</div>
      <div class="badge badge-tech">⚡ React 19 • FastAPI • Open-Meteo</div>
      <div class="badge badge-prod">🛡️ Rescue 1122 & Police Integration</div>
    </div>
  </div>

  <div class="architecture-container">

    <!-- LAYER 1: CLIENT PERSONAS & ENTRY POINTS -->
    <div class="layer-card accent-cyan">
      <div class="layer-header">
        <div class="layer-title">
          <span>👥</span> Layer 1: Client Personas & Channels (Multi-Role Gateway)
        </div>
        <div class="layer-tag">Presentation Entry</div>
      </div>
      <div class="grid-5">
        <div class="node-box">
          <div class="node-top">
            <span class="node-icon">🎒</span>
            <span class="node-pill" style="background:#06B6D4; color:#042F2E;">Tourist</span>
          </div>
          <div class="node-title">Tourist / Visitor</div>
          <div class="node-sub">Searches stays, explores valleys, books hotel rooms, hires jeeps, triggers SOS.</div>
          <div class="node-tags">
            <span class="micro-tag">Web App</span>
            <span class="micro-tag">PWA Mobile</span>
            <span class="micro-tag">Guest Checkout</span>
          </div>
        </div>

        <div class="node-box">
          <div class="node-top">
            <span class="node-icon">🏨</span>
            <span class="node-pill" style="background:#F59E0B; color:#451A03;">Business</span>
          </div>
          <div class="node-title">Hotel / Stay Operator</div>
          <div class="node-sub">Front Desk PMS, room allocation rack, deposit collection, check-in / check-out.</div>
          <div class="node-tags">
            <span class="micro-tag">Today Console</span>
            <span class="micro-tag">Key Handover</span>
            <span class="micro-tag">Folio Ledger</span>
          </div>
        </div>

        <div class="node-box">
          <div class="node-top">
            <span class="node-icon">🚐</span>
            <span class="node-pill" style="background:#3B82F6; color:#1E3A8A;">Fleet</span>
          </div>
          <div class="node-title">Transport Operator</div>
          <div class="node-sub">Fleet vehicles management, fare rates, driver assignment, ride dispatch.</div>
          <div class="node-tags">
            <span class="micro-tag">Intercity Express</span>
            <span class="micro-tag">4x4 Mountain Jeeps</span>
            <span class="micro-tag">Ride Orders</span>
          </div>
        </div>

        <div class="node-box">
          <div class="node-top">
            <span class="node-icon">🤝</span>
            <span class="node-pill" style="background:#A855F7; color:#3B0764;">Community</span>
          </div>
          <div class="node-title">Community Host / Guide</div>
          <div class="node-sub">Accepts tourist service requests, publishes local stories, reports civic alerts.</div>
          <div class="node-tags">
            <span class="micro-tag">Request Bidding</span>
            <span class="micro-tag">Local Homestays</span>
            <span class="micro-tag">Cultural Guides</span>
          </div>
        </div>

        <div class="node-box">
          <div class="node-top">
            <span class="node-icon">⚖️</span>
            <span class="node-pill" style="background:#10B981; color:#064E3B;">Authority</span>
          </div>
          <div class="node-title">KPCTA / Police Authority</div>
          <div class="node-sub">Safety Command, route condition broadcasts, SOS dispatch, KYC approvals.</div>
          <div class="node-tags">
            <span class="micro-tag">Road Status</span>
            <span class="micro-tag">Rescue CAD</span>
            <span class="micro-tag">License Gate</span>
          </div>
        </div>
      </div>
    </div>

    <!-- FLOW CONNECTOR -->
    <div class="flow-indicator">
      <div class="flow-line"></div>
      <div class="flow-label">HTTPS • WSS • Single Page Application Rendering (Vite 5)</div>
      <div class="flow-line"></div>
    </div>

    <!-- LAYER 2: FRONTEND UI MODULES -->
    <div class="layer-card accent-blue">
      <div class="layer-header">
        <div class="layer-title">
          <span>💻</span> Layer 2: Frontend Architecture & UI Modules (React 19 + TypeScript)
        </div>
        <div class="layer-tag">Client Application</div>
      </div>
      <div class="grid-5">
        <div class="node-box">
          <div class="node-title">TouristShell & Modern Home</div>
          <div class="node-sub">Dynamic explore landing page, 7-Day Live Weather widget, Real-time Road Conditions.</div>
          <div class="node-tags">
            <span class="micro-tag">TouristHomeModern</span>
            <span class="micro-tag">WeatherForecastModal</span>
            <span class="micro-tag">TripPlanner</span>
          </div>
        </div>

        <div class="node-box">
          <div class="node-title">BusinessShell & Front Desk PMS</div>
          <div class="node-sub">HotelTodayScreen, physical room rack, guest check-in/out, proof inspector.</div>
          <div class="node-tags">
            <span class="micro-tag">HotelTodayScreen</span>
            <span class="micro-tag">PhysicalRooms</span>
            <span class="micro-tag">TransportFleetManager</span>
          </div>
        </div>

        <div class="node-box">
          <div class="node-title">SwatPay & Guarantee Checkout</div>
          <div class="node-sub">Unified payment modal: 20% advance guarantee deposit, Easypaisa, JazzCash, slip upload.</div>
          <div class="node-tags">
            <span class="micro-tag">SwatPayModal</span>
            <span class="micro-tag">EasypaisaModal</span>
            <span class="micro-tag">PaymentProofLedger</span>
          </div>
        </div>

        <div class="node-box">
          <div class="node-title">Community Requests Hub</div>
          <div class="node-sub">Direct matching of tourist trip assistance needs with verified local community providers.</div>
          <div class="node-tags">
            <span class="micro-tag">CommunityRequestsView</span>
            <span class="micro-tag">StoriesView</span>
            <span class="micro-tag">CivicReports</span>
          </div>
        </div>

        <div class="node-box">
          <div class="node-title">Authority Safety Command</div>
          <div class="node-sub">Road condition editor, weather bulletins broadcast, business KYC verification queue.</div>
          <div class="node-tags">
            <span class="micro-tag">AuthorityShell</span>
            <span class="micro-tag">SOSCasesManager</span>
            <span class="micro-tag">UserManagementView</span>
          </div>
        </div>
      </div>
    </div>

    <!-- FLOW CONNECTOR -->
    <div class="flow-indicator">
      <div class="flow-line"></div>
      <div class="flow-label">REST API Protocol • Bearer JWT Authentication • Pydantic JSON Payload</div>
      <div class="flow-line"></div>
    </div>

    <!-- LAYER 3: API GATEWAY & BACKEND MIDDLEWARE -->
    <div class="layer-card accent-purple">
      <div class="layer-header">
        <div class="layer-title">
          <span>🚀</span> Layer 3: API Gateway, Security & Telemetry Cache (FastAPI + Python 3.12)
        </div>
        <div class="layer-tag">Gateway & Middleware</div>
      </div>
      <div class="grid-4">
        <div class="node-box">
          <div class="node-title">Security & RBAC Enforcement</div>
          <div class="node-sub">OAuth2 password bearer, JWT token validation, role-based route gatekeeper (5 roles).</div>
          <div class="node-tags">
            <span class="micro-tag">JWT Decryption</span>
            <span class="micro-tag">RBAC Guard</span>
            <span class="micro-tag">CORS Headers</span>
          </div>
        </div>

        <div class="node-box">
          <div class="node-title">In-Memory Telemetry Cache</div>
          <div class="node-sub">1-hour TTL cache for Open-Meteo satellite feeds and road hazard mountain scores.</div>
          <div class="node-tags">
            <span class="micro-tag">WeatherCacheManager</span>
            <span class="micro-tag">1h TTL Eviction</span>
            <span class="micro-tag">Zero-Latency Hits</span>
          </div>
        </div>

        <div class="node-box">
          <div class="node-title">Pydantic v2 Schema Engine</div>
          <div class="node-sub">Strict bidirectional schema validation, serialization, and OpenAPI / Swagger live docs.</div>
          <div class="node-tags">
            <span class="micro-tag">BookingCreate</span>
            <span class="micro-tag">RoadStatusOut</span>
            <span class="micro-tag">WeatherResponse</span>
          </div>
        </div>

        <div class="node-box">
          <div class="node-title">Static File & Asset Mount</div>
          <div class="node-sub">Serves verified business licenses, hotel property galleries, and bank deposit slips.</div>
          <div class="node-tags">
            <span class="micro-tag">/uploads/photos</span>
            <span class="micro-tag">/uploads/proofs</span>
            <span class="micro-tag">StaticFiles</span>
          </div>
        </div>
      </div>
    </div>

    <!-- LAYER 4: BACKEND BUSINESS DOMAIN MICRO-MODULES -->
    <div class="layer-card accent-emerald">
      <div class="layer-header">
        <div class="layer-title">
          <span>⚙️</span> Layer 4: Core Domain Services & Business Logic (Modular Architecture)
        </div>
        <div class="layer-tag">Business Logic</div>
      </div>
      <div class="grid-6">
        <div class="node-box">
          <div class="node-title">Bookings & Stay PMS</div>
          <div class="node-sub">Reservation lifecycles, 20% deposit tracking, folio settlement, key handover.</div>
          <div class="node-tags">
            <span class="micro-tag">BookingsService</span>
            <span class="micro-tag">GuaranteePolicy</span>
          </div>
        </div>

        <div class="node-box">
          <div class="node-title">Physical Rooms & Rack</div>
          <div class="node-sub">Real-time physical room inventory, blocking, cleaning, and guest allocation.</div>
          <div class="node-tags">
            <span class="micro-tag">RoomsService</span>
            <span class="micro-tag">InventoryLock</span>
          </div>
        </div>

        <div class="node-box">
          <div class="node-title">Safety & Emergency SOS</div>
          <div class="node-sub">Verified road status, travel advisories, Rescue 1122 CAD event logging.</div>
          <div class="node-tags">
            <span class="micro-tag">SafetyService</span>
            <span class="micro-tag">SOSDispatcher</span>
          </div>
        </div>

        <div class="node-box">
          <div class="node-title">Weather Intelligence</div>
          <div class="node-sub">Open-Meteo satellite ingestion, altitude models for Kalam & Malam Jabba.</div>
          <div class="node-tags">
            <span class="micro-tag">ContentService</span>
            <span class="micro-tag">WMO Parser</span>
          </div>
        </div>

        <div class="node-box">
          <div class="node-title">Listings & Fleet Catalog</div>
          <div class="node-sub">Hotels, restaurants, vehicles, tours, facilities taxonomy, search & filters.</div>
          <div class="node-tags">
            <span class="micro-tag">ListingsService</span>
            <span class="micro-tag">GeoSearch</span>
          </div>
        </div>

        <div class="node-box">
          <div class="node-title">Community Requests</div>
          <div class="node-sub">Tourist request marketplace, local host matching, community alerts.</div>
          <div class="node-tags">
            <span class="micro-tag">CommunityService</span>
            <span class="micro-tag">RequestHub</span>
          </div>
        </div>
      </div>
    </div>

    <!-- FLOW CONNECTOR -->
    <div class="flow-indicator">
      <div class="flow-line"></div>
      <div class="flow-label">SQLAlchemy 2.0 Async ORM • Alembic Migrations • Async SQLite / PostgreSQL Engine</div>
      <div class="flow-line"></div>
    </div>

    <!-- LAYER 5: DATA PERSISTENCE & STORAGE -->
    <div class="layer-card accent-amber">
      <div class="layer-header">
        <div class="layer-title">
          <span>🗄️</span> Layer 5: Data Persistence & Client Storage Engine
        </div>
        <div class="layer-tag">Persistence Layer</div>
      </div>
      <div class="grid-4">
        <div class="node-box">
          <div class="node-title">Relational SQL Database</div>
          <div class="node-sub">ACID-compliant relational engine via SQLAlchemy 2.0 with foreign keys & constraints.</div>
          <div class="node-tags">
            <span class="micro-tag">SQLite / PostgreSQL</span>
            <span class="micro-tag">swat_tourism_prod.db</span>
            <span class="micro-tag">Alembic Versioning</span>
          </div>
        </div>

        <div class="node-box">
          <div class="node-title">Core Data Models</div>
          <div class="node-sub">Normalized schemas for users, listings, physical_rooms, bookings, roads, advisories, SOS.</div>
          <div class="node-tags">
            <span class="micro-tag">User & Roles</span>
            <span class="micro-tag">Booking & Payment</span>
            <span class="micro-tag">RoadStatus</span>
          </div>
        </div>

        <div class="node-box">
          <div class="node-title">File System Media Mount</div>
          <div class="node-sub">Persisted storage for property photography, bank transaction slips, verified CNIC scans.</div>
          <div class="node-tags">
            <span class="micro-tag">backend/uploads</span>
            <span class="micro-tag">DirectTID Slips</span>
            <span class="micro-tag">Room Galleries</span>
          </div>
        </div>

        <div class="node-box">
          <div class="node-title">Client-Side Cache & State</div>
          <div class="node-sub">Offline-first local storage for instant page hydration, offline bookings, token persistence.</div>
          <div class="node-tags">
            <span class="micro-tag">localStorage</span>
            <span class="micro-tag">swat_token</span>
            <span class="micro-tag">Offline Fallbacks</span>
          </div>
        </div>
      </div>
    </div>

    <!-- LAYER 6: EXTERNAL INTEGRATIONS & CIVIC FEEDS -->
    <div class="layer-card accent-emerald">
      <div class="layer-header">
        <div class="layer-title">
          <span>🌐</span> Layer 6: External Meteorological, Civic & Payment Integrations
        </div>
        <div class="layer-tag">External Providers</div>
      </div>
      <div class="grid-4">
        <div class="node-box">
          <div class="node-title">Open-Meteo Satellite Feeds</div>
          <div class="node-sub">Real-time global weather API with GPS coordinate lookups, WMO weather codes, 7-day forecast.</div>
          <div class="node-tags">
            <span class="micro-tag">api.open-meteo.com</span>
            <span class="micro-tag">Zero Key Required</span>
            <span class="micro-tag">Live Ingestion</span>
          </div>
        </div>

        <div class="node-box">
          <div class="node-title">Traffic Police & PDMA Bulletins</div>
          <div class="node-sub">KP Traffic Police Swat Control Room updates, M-16 Expressway & N-95 operational status.</div>
          <div class="node-tags">
            <span class="micro-tag">NHA Feeds</span>
            <span class="micro-tag">Swat Control Room</span>
            <span class="micro-tag">PDMA Weather Alerts</span>
          </div>
        </div>

        <div class="node-box">
          <div class="node-title">Rescue 1122 Dispatch CAD</div>
          <div class="node-sub">Direct emergency integration for medical, accident, snow-trap, and disaster dispatch.</div>
          <div class="node-tags">
            <span class="micro-tag">Helpline: 1122</span>
            <span class="micro-tag">GPS Coordinate Pin</span>
            <span class="micro-tag">CAD Case Logs</span>
          </div>
        </div>

        <div class="node-box">
          <div class="node-title">Payment Networks & Gateways</div>
          <div class="node-sub">Easypaisa Mobile Wallet, JazzCash Open API, 1Link Switch, Bank Direct Transfer verification.</div>
          <div class="node-tags">
            <span class="micro-tag">Easypaisa</span>
            <span class="micro-tag">JazzCash</span>
            <span class="micro-tag">1Link Card / Bank</span>
          </div>
        </div>
      </div>
    </div>

  </div>

  <!-- FOOTER -->
  <div class="footer-note">
    <span>Platform: Swat Tourism Production v2 • Enterprise Architecture Specification</span>
    <span>Generated: November 2026 • Verified KPCTA Full-Stack System</span>
  </div>

</body>
</html>
"""

def generate_png():
    output_html_path = os.path.abspath("Docs/architecture_diagram.html")
    output_png_path = os.path.abspath("Docs/swat_tourism_system_architecture.png")
    
    with open(output_html_path, "w", encoding="utf-8") as f:
        f.write(HTML_CONTENT)
    
    print(f"HTML diagram saved to: {output_html_path}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        # High resolution viewport
        page = browser.new_page(viewport={"width": 2400, "height": 1850}, device_scale_factor=2)
        page.goto(f"file:///{output_html_path}")
        page.wait_for_timeout(1000)
        page.screenshot(path=output_png_path, full_page=True)
        browser.close()
        
    print(f"Architecture diagram PNG successfully generated at: {output_png_path}")
    
    # Also copy to artifact directory if available
    app_data_artifact_dir = "C:/Users/shahkhalid1/.gemini/antigravity/brain/a4ab2b4f-d721-4c46-bc21-24c731c3a57e"
    if os.path.exists(app_data_artifact_dir):
        dest_png = os.path.join(app_data_artifact_dir, "swat_tourism_system_architecture.png")
        import shutil
        shutil.copy2(output_png_path, dest_png)
        print(f"Copied to artifact directory: {dest_png}")

if __name__ == "__main__":
    generate_png()

