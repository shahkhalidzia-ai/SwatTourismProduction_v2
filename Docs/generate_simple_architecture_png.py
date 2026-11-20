"""
Generates a simple, elegant, easy-to-understand Architecture Diagram
accessible to everyone (non-technical stakeholders, executives, and users)
saved as Docs/swat_tourism_simple_architecture.png
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
    background: #F8FAFC;
    color: #0F172A;
    padding: 40px;
    width: 1600px;
    height: 1050px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  /* Header */
  .header {
    text-align: center;
    margin-bottom: 25px;
  }
  .header h1 {
    font-size: 32px;
    font-weight: 800;
    color: #0F172A;
    letter-spacing: -0.02em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }
  .header p {
    font-size: 16px;
    color: #64748B;
    margin-top: 6px;
  }

  /* Main Flow Layout */
  .main-flow {
    display: flex;
    flex-direction: column;
    gap: 20px;
    flex-grow: 1;
    justify-content: center;
  }

  /* Big Stage Card */
  .stage-row {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .stage-label-col {
    width: 170px;
    flex-shrink: 0;
    text-align: right;
  }
  .stage-num {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #0284C7;
    margin-bottom: 2px;
  }
  .stage-name {
    font-size: 16px;
    font-weight: 800;
    color: #1E293B;
  }
  .stage-tech {
    font-size: 12px;
    color: #64748B;
    font-weight: 500;
  }

  .stage-cards-container {
    display: flex;
    gap: 16px;
    flex-grow: 1;
  }

  /* Individual Box */
  .card-box {
    flex: 1;
    background: #FFFFFF;
    border: 1.5px solid #E2E8F0;
    border-radius: 14px;
    padding: 18px 20px;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: relative;
    transition: all 0.2s ease;
  }
  
  .card-top {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .card-icon {
    font-size: 26px;
    line-height: 1;
  }
  .card-title {
    font-size: 15px;
    font-weight: 700;
    color: #0F172A;
  }
  .card-desc {
    font-size: 12px;
    color: #64748B;
    line-height: 1.45;
  }
  .card-features {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 4px;
  }
  .feat-tag {
    font-size: 10.5px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 4px;
    background: #F1F5F9;
    color: #475569;
  }

  /* Color themes for rows */
  /* Users */
  .theme-users .card-box { border-top: 4px solid #0EA5E9; }
  .theme-users .feat-tag { background: #E0F2FE; color: #0369A1; }
  
  /* Frontend */
  .theme-frontend .card-box { border-top: 4px solid #6366F1; }
  .theme-frontend .feat-tag { background: #EEF2FF; color: #4338CA; }

  /* Backend */
  .theme-backend .card-box { border-top: 4px solid #10B981; }
  .theme-backend .feat-tag { background: #ECFDF5; color: #047857; }

  /* Data & External (Split) */
  .theme-data .card-box { border-top: 4px solid #F59E0B; }
  .theme-data .feat-tag { background: #FEF3C7; color: #B45309; }

  .theme-ext .card-box { border-top: 4px solid #EC4899; }
  .theme-ext .feat-tag { background: #FCE7F3; color: #BE185D; }

  /* Connecting Arrow Bar */
  .connector {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-left: 190px;
    height: 14px;
  }
  .arrow-line {
    height: 2px;
    background: #CBD5E1;
    flex-grow: 1;
  }
  .arrow-text {
    font-size: 11px;
    font-weight: 700;
    color: #64748B;
    background: #F1F5F9;
    padding: 2px 10px;
    border-radius: 10px;
  }

  /* Bottom Footer */
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 15px;
    border-top: 1px solid #E2E8F0;
    font-size: 12px;
    color: #64748B;
  }
  .gov-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 700;
    color: #047857;
  }
</style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <h1>🏔️ Swat Tourism Platform — How It Works (Simple Architecture)</h1>
    <p>A simple, high-level view of how users, the web application, the secure server, and databases work together.</p>
  </div>

  <div class="main-flow">

    <!-- LEVEL 1: USERS -->
    <div class="stage-row theme-users">
      <div class="stage-label-col">
        <div class="stage-num">Level 1</div>
        <div class="stage-name">Who Uses It</div>
        <div class="stage-tech">Users &amp; Devices</div>
      </div>
      <div class="stage-cards-container">
        <div class="card-box">
          <div class="card-top">
            <span class="card-icon">🎒</span>
            <div class="card-title">Tourists &amp; Families</div>
          </div>
          <div class="card-desc">Search hotels, view room photos, book stays, hire jeeps, and check mountain weather.</div>
          <div class="card-features">
            <span class="feat-tag">Mobile Phones</span>
            <span class="feat-tag">Laptops / Tablets</span>
            <span class="feat-tag">No App Download Needed</span>
          </div>
        </div>

        <div class="card-box">
          <div class="card-top">
            <span class="card-icon">🏨</span>
            <div class="card-title">Hotel &amp; Business Managers</div>
          </div>
          <div class="card-desc">Front-desk screen to see today's check-ins, allocate physical rooms, and collect payments.</div>
          <div class="card-features">
            <span class="feat-tag">Reception Desk PMS</span>
            <span class="feat-tag">Room Rack</span>
            <span class="feat-tag">Transport Fleets</span>
          </div>
        </div>

        <div class="card-box">
          <div class="card-top">
            <span class="card-icon">🏛️</span>
            <div class="card-title">Government &amp; Police (KPCTA)</div>
          </div>
          <div class="card-desc">Post live road blockage alerts, verify hotel licenses, and respond to emergency SOS calls.</div>
          <div class="card-features">
            <span class="feat-tag">Safety Control Room</span>
            <span class="feat-tag">Road Advisories</span>
            <span class="feat-tag">Rescue 1122</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ARROW -->
    <div class="connector">
      <div class="arrow-line"></div>
      <div class="arrow-text">⬇ Users interact with the clean visual interface (Web &amp; Mobile)</div>
      <div class="arrow-line"></div>
    </div>

    <!-- LEVEL 2: FRONTEND UI -->
    <div class="stage-row theme-frontend">
      <div class="stage-label-col">
        <div class="stage-num">Level 2</div>
        <div class="stage-name">The App You See</div>
        <div class="stage-tech">Frontend (React &amp; Vite)</div>
      </div>
      <div class="stage-cards-container">
        <div class="card-box">
          <div class="card-top">
            <span class="card-icon">🗺️</span>
            <div class="card-title">Explore &amp; Live Weather</div>
          </div>
          <div class="card-desc">Interactive Swat map with destination highlights, 7-day live weather, and road status badges.</div>
          <div class="card-features">
            <span class="feat-tag">Live 7-Day Forecast</span>
            <span class="feat-tag">Road Status: Open/Closed</span>
          </div>
        </div>

        <div class="card-box">
          <div class="card-top">
            <span class="card-icon">🛏️</span>
            <div class="card-title">Easy Room Booking</div>
          </div>
          <div class="card-desc">Pick check-in dates, choose room type (Deluxe, Suite), and generate digital check-in vouchers.</div>
          <div class="card-features">
            <span class="feat-tag">Instant Reserve</span>
            <span class="feat-tag">Digital Voucher</span>
          </div>
        </div>

        <div class="card-box">
          <div class="card-top">
            <span class="card-icon">💳</span>
            <div class="card-title">SwatPay Secure Checkout</div>
          </div>
          <div class="card-desc">Choose 20% advance guarantee deposit, 100% full prepayment, or pay at hotel front-desk.</div>
          <div class="card-features">
            <span class="feat-tag">EasyPaisa / JazzCash</span>
            <span class="feat-tag">Direct Bank Slips</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ARROW -->
    <div class="connector">
      <div class="arrow-line"></div>
      <div class="arrow-text">⬇ Sends and receives secure requests over the internet (FastAPI Server)</div>
      <div class="arrow-line"></div>
    </div>

    <!-- LEVEL 3: BACKEND SERVER -->
    <div class="stage-row theme-backend">
      <div class="stage-label-col">
        <div class="stage-num">Level 3</div>
        <div class="stage-name">The Smart Brain</div>
        <div class="stage-tech">Backend (Python &amp; FastAPI)</div>
      </div>
      <div class="stage-cards-container">
        <div class="card-box">
          <div class="card-top">
            <span class="card-icon">🔒</span>
            <div class="card-title">Security &amp; Accounts</div>
          </div>
          <div class="card-desc">Protects passwords with bank-grade encryption and ensures only verified users access sensitive screens.</div>
          <div class="card-features">
            <span class="feat-tag">Encrypted Login</span>
            <span class="feat-tag">Role Permissions</span>
          </div>
        </div>

        <div class="card-box">
          <div class="card-top">
            <span class="card-icon">📋</span>
            <div class="card-title">Booking &amp; Stay Engine</div>
          </div>
          <div class="card-desc">Calculates prices, tracks room availability, manages key handovers, and calculates commissions.</div>
          <div class="card-features">
            <span class="feat-tag">20% Guarantee</span>
            <span class="feat-tag">Room Rack Sync</span>
          </div>
        </div>

        <div class="card-box">
          <div class="card-top">
            <span class="card-icon">🚨</span>
            <div class="card-title">Safety &amp; SOS Dispatch</div>
          </div>
          <div class="card-desc">Collects emergency SOS alerts with GPS pins and coordinates directly with Rescue 1122 and police.</div>
          <div class="card-features">
            <span class="feat-tag">GPS Emergency Pin</span>
            <span class="feat-tag">Official Road Advisories</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ARROW -->
    <div class="connector">
      <div class="arrow-line"></div>
      <div class="arrow-text">⬇ Saves records securely and connects to outside services</div>
      <div class="arrow-line"></div>
    </div>

    <!-- LEVEL 4: STORAGE & EXTERNAL -->
    <div class="stage-row">
      <div class="stage-label-col">
        <div class="stage-num">Level 4</div>
        <div class="stage-name">Data &amp; Connections</div>
        <div class="stage-tech">Database &amp; Partners</div>
      </div>
      <div class="stage-cards-container">
        <!-- Database Card -->
        <div class="card-box" style="border-top: 4px solid #F59E0B; flex: 1.5;">
          <div class="card-top">
            <span class="card-icon">🗄️</span>
            <div class="card-title">Secure Database (SQL Database)</div>
          </div>
          <div class="card-desc">The permanent filing cabinet storing all bookings, registered hotels, room details, and user profiles.</div>
          <div class="card-features">
            <span class="feat-tag" style="background:#FEF3C7; color:#B45309;">All Bookings &amp; Invoices</span>
            <span class="feat-tag" style="background:#FEF3C7; color:#B45309;">Room Inventory</span>
            <span class="feat-tag" style="background:#FEF3C7; color:#B45309;">Hotel Photos &amp; Receipts</span>
          </div>
        </div>

        <!-- External Integrations Card -->
        <div class="card-box" style="border-top: 4px solid #EC4899; flex: 1.5;">
          <div class="card-top">
            <span class="card-icon">🌐</span>
            <div class="card-title">External Partners &amp; Services</div>
          </div>
          <div class="card-desc">Outside services seamlessly connected to provide live information and digital payments.</div>
          <div class="card-features">
            <span class="feat-tag" style="background:#FCE7F3; color:#BE185D;">☀️ Live Satellite Weather (Open-Meteo)</span>
            <span class="feat-tag" style="background:#FCE7F3; color:#BE185D;">💳 EasyPaisa &amp; JazzCash</span>
            <span class="feat-tag" style="background:#FCE7F3; color:#BE185D;">🚑 Rescue 1122 Helpline</span>
          </div>
        </div>
      </div>
    </div>

  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="gov-badge">
      <span>🏛️</span> Verified by Government of Khyber Pakhtunkhwa (KPCTA)
    </div>
    <div>Swat Tourism Platform (SwatTourismProduction_v2) • Architecture for Non-Technical &amp; Executive Presentations</div>
    <div>100% Mobile &amp; Desktop Ready</div>
  </div>

</body>
</html>
"""

def generate_simple_png():
    output_html_path = os.path.abspath("Docs/simple_architecture_diagram.html")
    output_png_path = os.path.abspath("Docs/swat_tourism_simple_architecture.png")
    
    with open(output_html_path, "w", encoding="utf-8") as f:
        f.write(HTML_CONTENT)
    
    print(f"Simple HTML diagram saved to: {output_html_path}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        # Viewport suited for simple slides & presentation
        page = browser.new_page(viewport={"width": 1600, "height": 1050}, device_scale_factor=2)
        page.goto(f"file:///{output_html_path}")
        page.wait_for_timeout(800)
        page.screenshot(path=output_png_path, full_page=True)
        browser.close()
        
    print(f"Simple Architecture diagram PNG successfully generated at: {output_png_path}")
    
    # Also copy to artifact directory
    app_data_artifact_dir = "C:/Users/shahkhalid1/.gemini/antigravity/brain/a4ab2b4f-d721-4c46-bc21-24c731c3a57e"
    if os.path.exists(app_data_artifact_dir):
        dest_png = os.path.join(app_data_artifact_dir, "swat_tourism_simple_architecture.png")
        import shutil
        shutil.copy2(output_png_path, dest_png)
        print(f"Copied to artifact directory: {dest_png}")

if __name__ == "__main__":
    generate_simple_png()

