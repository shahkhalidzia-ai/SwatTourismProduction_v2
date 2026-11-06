import os
import asyncio
from playwright.async_api import async_playwright

HTML_SCREEN_1 = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Tourist Unified Checkout - Dual Track Payment</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
  body { background: #0F172A; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 30px; }
  .modal-overlay { background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(8px); width: 100%; max-width: 920px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.6); overflow: hidden; background: #FFFFFF; }
  .modal-header { background: linear-gradient(135deg, #0F2B48 0%, #088395 100%); color: #FFFFFF; padding: 22px 28px; display: flex; justify-content: space-between; align-items: center; }
  .modal-title { font-size: 19px; font-weight: 800; letter-spacing: -0.02em; display: flex; align-items: center; gap: 10px; }
  .badge-verified { background: rgba(16, 185, 129, 0.2); border: 1px solid #10B981; color: #6EE7B7; font-size: 11px; padding: 4px 10px; border-radius: 999px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; }
  .modal-body { padding: 26px 30px; display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 26px; }
  
  /* Tabs */
  .track-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
  .track-tab { padding: 13px 14px; border-radius: 12px; border: 2px solid #E2E8F0; background: #F8FAFC; cursor: pointer; transition: all 0.2s; text-align: left; }
  .track-tab.active { border-color: #088395; background: #E6F4F6; box-shadow: 0 4px 12px rgba(8, 131, 149, 0.12); }
  .track-tab-title { font-size: 13px; font-weight: 800; color: #0F172A; display: flex; align-items: center; gap: 7px; margin-bottom: 3px; }
  .track-tab.active .track-tab-title { color: #088395; }
  .track-tab-desc { font-size: 11px; color: #64748B; line-height: 1.3; }

  /* Option Cards */
  .option-card { border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 14px 16px; margin-bottom: 12px; display: flex; align-items: flex-start; gap: 12px; cursor: pointer; transition: all 0.2s; }
  .option-card.selected { border-color: #088395; background: #F0F9FA; }
  .radio-dot { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #CBD5E1; margin-top: 2px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .option-card.selected .radio-dot { border-color: #088395; }
  .option-card.selected .radio-dot::after { content: ''; width: 9px; height: 9px; border-radius: 50%; background: #088395; }
  .option-content { flex: 1; }
  .option-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
  .option-name { font-size: 13.5px; font-weight: 700; color: #0F172A; }
  .option-badge { font-size: 10.5px; font-weight: 800; padding: 2px 7px; border-radius: 6px; }
  .badge-online { background: #DCFCE7; color: #15803D; }
  .badge-direct { background: #FEF3C7; color: #B45309; }
  .option-note { font-size: 11.5px; color: #64748B; }

  /* Direct Transfer Box */
  .direct-transfer-box { background: #FFFBEB; border: 1.5px dashed #F59E0B; border-radius: 12px; padding: 14px 16px; margin-top: 14px; }
  .direct-box-title { font-size: 12px; font-weight: 800; color: #92400E; display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
  .account-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; margin-bottom: 10px; }
  .account-item { background: #FFFFFF; padding: 7px 10px; border-radius: 8px; border: 1px solid #FDE68A; }
  .account-label { color: #78350F; font-size: 9.5px; text-transform: uppercase; font-weight: 700; }
  .account-val { color: #0F172A; font-weight: 700; font-size: 11.5px; margin-top: 1px; }

  /* Input fields */
  .form-group { margin-top: 10px; }
  .form-label { font-size: 11px; font-weight: 700; color: #334155; margin-bottom: 4px; display: block; }
  .form-input { width: 100%; padding: 8px 12px; border-radius: 8px; border: 1.5px solid #CBD5E1; font-size: 12px; font-weight: 600; color: #0F172A; }
  .form-input:focus { outline: none; border-color: #088395; box-shadow: 0 0 0 3px rgba(8, 131, 149, 0.15); }

  /* Summary Card */
  .summary-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 20px; height: fit-content; }
  .property-preview { display: flex; gap: 12px; padding-bottom: 16px; border-bottom: 1px solid #E2E8F0; margin-bottom: 16px; }
  .property-img { width: 68px; height: 68px; border-radius: 10px; object-fit: cover; background: #088395; }
  .property-info h4 { font-size: 14.5px; font-weight: 800; color: #0F172A; margin-bottom: 3px; }
  .property-info p { font-size: 11px; color: #64748B; margin-bottom: 4px; }
  .booking-dates { font-size: 11px; font-weight: 700; color: #088395; display: inline-flex; align-items: center; gap: 4px; }

  .cost-row { display: flex; justify-content: space-between; font-size: 12.5px; color: #475569; margin-bottom: 8px; }
  .cost-row.bold { font-size: 13.5px; font-weight: 800; color: #0F172A; }
  .cost-row.highlight { background: #E6F4F6; padding: 10px 12px; border-radius: 8px; color: #088395; font-weight: 800; margin: 12px 0 6px 0; }
  .cost-divider { height: 1px; background: #E2E8F0; margin: 12px 0; }

  .btn-submit { width: 100%; background: linear-gradient(135deg, #088395 0%, #0A4D68 100%); color: #FFFFFF; border: none; padding: 14px; border-radius: 10px; font-size: 14px; font-weight: 800; cursor: pointer; box-shadow: 0 6px 18px rgba(8, 131, 149, 0.35); transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .btn-submit:hover { opacity: 0.95; transform: translateY(-1px); }
  .guarantee-note { font-size: 10.5px; color: #64748B; text-align: center; margin-top: 10px; display: flex; align-items: center; justify-content: center; gap: 5px; }
</style>
</head>
<body>
<div class="modal-overlay">
  <div class="modal-header">
    <div>
      <div class="modal-title">
        <span>🛡️ Secure Booking Checkout & Guarantee</span>
      </div>
      <div style="font-size: 12px; opacity: 0.85; margin-top: 2px;">Select your preferred advance deposit guarantee method</div>
    </div>
    <div class="badge-verified">✓ SBP Raast & 1Link Verified</div>
  </div>

  <div class="modal-body">
    <!-- Left Column: Payment Track Selection -->
    <div>
      <div style="font-size: 12px; font-weight: 800; color: #64748B; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.05em;">Step 1: Choose Payment Rail</div>
      
      <div class="track-tabs">
        <div class="track-tab active">
          <div class="track-tab-title">
            <span>🏛️ Track 1: STP Platform</span>
          </div>
          <div class="track-tab-desc">Pay through STP Escrow via Easypaisa, JazzCash, or Debit Card.</div>
        </div>
        <div class="track-tab">
          <div class="track-tab-title">
            <span>🏨 Track 2: Direct Hotel</span>
          </div>
          <div class="track-tab-desc">Transfer advance directly to Sakoon Resort's Bank or Wallet.</div>
        </div>
      </div>

      <div style="font-size: 12px; font-weight: 800; color: #64748B; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.05em;">Step 2: Guarantee Plan</div>

      <!-- Option 1: 20% Deposit Online -->
      <div class="option-card selected">
        <div class="radio-dot"></div>
        <div class="option-content">
          <div class="option-header">
            <span class="option-name">20% Advance Deposit Guarantee</span>
            <span class="option-badge badge-online">Recommended</span>
          </div>
          <div class="option-note">Pay <strong>PKR 4,800</strong> now via STP central gateway. Remaining <strong>PKR 19,200</strong> due on arrival at hotel.</div>
        </div>
      </div>

      <!-- Option 2: 100% Full Payment Online -->
      <div class="option-card">
        <div class="radio-dot"></div>
        <div class="option-content">
          <div class="option-header">
            <span class="option-name">100% Full Online Advance</span>
            <span class="option-badge badge-online">Instant Check-in</span>
          </div>
          <div class="option-note">Pay full <strong>PKR 24,000</strong> now. Zero payment required at reception desk.</div>
        </div>
      </div>

      <!-- Option 3: Direct Transfer Proof -->
      <div class="option-card">
        <div class="radio-dot"></div>
        <div class="option-content">
          <div class="option-header">
            <span class="option-name">Direct Transfer to Property Account</span>
            <span class="option-badge badge-direct">Track 2 (Direct)</span>
          </div>
          <div class="option-note">Send advance directly to hotel's Meezan Bank IBAN or JazzCash, then submit TID.</div>
        </div>
      </div>

      <!-- Direct Transfer Preview Box -->
      <div class="direct-transfer-box">
        <div class="direct-box-title">
          <span>🏨 Official Account for Sakoon Resort Kalam</span>
        </div>
        <div class="account-grid">
          <div class="account-item">
            <div class="account-label">Meezan Bank IBAN</div>
            <div class="account-val">PK92MEZN000109281726</div>
          </div>
          <div class="account-item">
            <div class="account-label">Easypaisa / Raast ID</div>
            <div class="account-val">0345-9921001 (Sakoon Resort)</div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Transaction Reference (TID / Slip #):</label>
          <input type="text" class="form-input" value="EP-TID-82910481920" placeholder="e.g. 82910481920">
        </div>
      </div>
    </div>

    <!-- Right Column: Booking Summary & Folio -->
    <div class="summary-card">
      <div class="property-preview">
        <img class="property-img" src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&auto=format&fit=crop&q=80" alt="Sakoon Resort">
        <div class="property-info">
          <h4>Sakoon Resort Kalam</h4>
          <p>Deluxe Alpine Riverview Suite (Room 204)</p>
          <div class="booking-dates">📅 Nov 10 – Nov 13, 2026 (3 Nights)</div>
        </div>
      </div>

      <div class="cost-row">
        <span>Room Rate (PKR 8,000 × 3 Nights)</span>
        <span>PKR 24,000.00</span>
      </div>
      <div class="cost-row">
        <span>Swat Tourism Safety Assurance</span>
        <span style="color: #10B981; font-weight: 700;">FREE</span>
      </div>
      <div class="cost-divider"></div>
      <div class="cost-row bold">
        <span>Total Gross Folio</span>
        <span>PKR 24,000.00</span>
      </div>
      <div class="cost-row highlight">
        <span>Advance Deposit Due Now (20%)</span>
        <span style="font-size: 15px;">PKR 4,800.00</span>
      </div>
      <div class="cost-row" style="font-size: 11.5px; color: #64748B;">
        <span>Remaining Due at Hotel on Check-in</span>
        <span style="font-weight: 700; color: #0F172A;">PKR 19,200.00</span>
      </div>

      <div style="margin-top: 20px;">
        <button class="btn-submit">
          <span>Confirm & Pay Advance (PKR 4,800)</span>
          <span>→</span>
        </button>
      </div>
      <div class="guarantee-note">
        <span>🔒 256-Bit SSL Encrypted &bull; 48-Hour Free Cancellation Policy</span>
      </div>
    </div>
  </div>
</div>
</body>
</html>
"""

HTML_SCREEN_2 = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Hotel Front-Desk Reception Folio Settlement</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
  body { background: #0F172A; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 30px; }
  .modal-overlay { background: #FFFFFF; width: 100%; max-width: 900px; border-radius: 18px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.55); overflow: hidden; border: 1px solid #E2E8F0; }
  .modal-header { background: #0F172A; color: #FFFFFF; padding: 20px 28px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #088395; }
  .modal-title { font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 10px; }
  .badge-resort { background: #088395; color: #FFFFFF; font-size: 11px; padding: 4px 10px; border-radius: 6px; font-weight: 700; }
  
  .modal-body { padding: 26px 28px; }
  
  /* Guest & Folio Banner */
  .guest-banner { background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 16px 20px; display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 16px; margin-bottom: 22px; }
  .meta-title { font-size: 10.5px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 3px; }
  .meta-val { font-size: 14px; font-weight: 800; color: #0F172A; }
  .badge-inhouse { display: inline-block; background: #DCFCE7; color: #166534; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; margin-top: 2px; }

  /* Folio Calculation Cards */
  .folio-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 22px; }
  .folio-card { padding: 14px 16px; border-radius: 12px; border: 1.5px solid #E2E8F0; background: #FFFFFF; }
  .folio-card.highlight { border-color: #EF4444; background: #FEF2F2; }
  .folio-card.success { border-color: #10B981; background: #F0FDF4; }
  .folio-label { font-size: 11px; font-weight: 700; color: #64748B; margin-bottom: 4px; }
  .folio-num { font-size: 20px; font-weight: 800; color: #0F172A; }
  .folio-card.highlight .folio-num { color: #DC2626; }
  .folio-card.success .folio-num { color: #166534; }
  .folio-sub { font-size: 10.5px; color: #64748B; margin-top: 3px; }

  /* Settlement Methods */
  .settlement-section-title { font-size: 13px; font-weight: 800; color: #0F172A; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; }
  .methods-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
  .method-card { border: 2px solid #E2E8F0; border-radius: 10px; padding: 12px 10px; text-align: center; cursor: pointer; background: #F8FAFC; transition: all 0.2s; }
  .method-card.selected { border-color: #088395; background: #E6F4F6; }
  .method-icon { font-size: 22px; margin-bottom: 4px; }
  .method-name { font-size: 12px; font-weight: 700; color: #0F172A; }
  .method-desc { font-size: 10px; color: #64748B; margin-top: 2px; }

  .inputs-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 22px; }
  .input-group label { display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 5px; }
  .input-control { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1.5px solid #CBD5E1; font-size: 13px; font-weight: 700; color: #0F172A; }

  /* Actions */
  .modal-actions { display: flex; justify-content: space-between; align-items: center; padding-top: 18px; border-top: 1px solid #E2E8F0; }
  .btn-print { background: #F1F5F9; color: #334155; border: 1px solid #CBD5E1; padding: 11px 18px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; }
  .btn-checkout-settle { background: #088395; color: #FFFFFF; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 14px rgba(8, 131, 149, 0.3); display: flex; align-items: center; gap: 8px; }
</style>
</head>
<body>
<div class="modal-overlay">
  <div class="modal-header">
    <div class="modal-title">
      <span>🛎️ Front-Desk Folio Settlement & Guest Check-Out</span>
    </div>
    <div class="badge-resort">Sakoon Resort Kalam &bull; Room 204</div>
  </div>

  <div class="modal-body">
    <!-- Guest & Room Information -->
    <div class="guest-banner">
      <div>
        <div class="meta-title">Guest Details & Booking Ref</div>
        <div class="meta-val">Shah Khalid &bull; SWT-BK-88219</div>
        <div class="badge-inhouse">Checked-In (Nov 10 – Nov 13)</div>
      </div>
      <div>
        <div class="meta-title">Room & Rate</div>
        <div class="meta-val">Deluxe Alpine Suite 204</div>
        <div style="font-size: 11.5px; color: #64748B;">PKR 8,000 / Night (3 Nights)</div>
      </div>
      <div>
        <div class="meta-title">Advance Deposit Status</div>
        <div class="meta-val" style="color: #166534;">PKR 4,800.00 (Paid)</div>
        <div style="font-size: 10.5px; color: #088395; font-weight: 700;">Track 1 (STP Escrow)</div>
      </div>
    </div>

    <!-- Folio Financials -->
    <div class="folio-grid">
      <div class="folio-card">
        <div class="folio-label">Total Folio Charges</div>
        <div class="folio-num">PKR 24,000.00</div>
        <div class="folio-sub">Room stay (3 nights)</div>
      </div>
      <div class="folio-card success">
        <div class="folio-label">Advance Paid by Guest</div>
        <div class="folio-num">PKR 4,800.00</div>
        <div class="folio-sub">Verified via STP Gateway</div>
      </div>
      <div class="folio-card highlight">
        <div class="folio-label">Outstanding Balance Due</div>
        <div class="folio-num">PKR 19,200.00</div>
        <div class="folio-sub">Due at Counter prior to Check-out</div>
      </div>
    </div>

    <!-- Settlement Payment Methods -->
    <div class="settlement-section-title">
      <span>Select On-Site Payment Method to Settle Folio:</span>
      <span style="font-size: 11px; color: #088395; font-weight: 700;">Track 2: Property Direct Collection</span>
    </div>

    <div class="methods-grid">
      <div class="method-card selected">
        <div class="method-icon">💵</div>
        <div class="method-name">Physical Cash</div>
        <div class="method-desc">Counter cash drawer</div>
      </div>
      <div class="method-card">
        <div class="method-icon">📱</div>
        <div class="method-name">Easypaisa QR</div>
        <div class="method-desc">Hotel merchant wallet</div>
      </div>
      <div class="method-card">
        <div class="method-icon">🏦</div>
        <div class="method-name">Direct Bank IBFT</div>
        <div class="method-desc">Meezan / Raast P2P</div>
      </div>
      <div class="method-card">
        <div class="method-icon">💳</div>
        <div class="method-name">Card POS Terminal</div>
        <div class="method-desc">Credit/Debit machine</div>
      </div>
    </div>

    <!-- Inputs Row -->
    <div class="inputs-row">
      <div class="input-group">
        <label>Amount Collected Now (PKR):</label>
        <input type="text" class="input-control" value="19,200.00" readonly style="background: #F8FAFC;">
      </div>
      <div class="input-group">
        <label>Front-Desk Cashier Voucher / Receipt #:</label>
        <input type="text" class="input-control" value="SRK-REC-2026-081">
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="modal-actions">
      <button class="btn-print">
        <span>🖨️ Print Guest Folio Receipt</span>
      </button>
      <button class="btn-checkout-settle">
        <span>✓ Settle Balance & Complete Check-Out</span>
      </button>
    </div>
  </div>
</div>
</body>
</html>
"""

HTML_SCREEN_3 = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>STP Authority & Operator Financial Settlement Center</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
  body { background: #0F172A; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 30px; }
  .dashboard-container { background: #FFFFFF; width: 100%; max-width: 960px; border-radius: 18px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.55); overflow: hidden; border: 1px solid #CBD5E1; }
  .dash-header { background: linear-gradient(135deg, #0F2B48 0%, #1E3A8A 100%); color: #FFFFFF; padding: 22px 30px; display: flex; justify-content: space-between; align-items: center; }
  .dash-title { font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 10px; }
  .badge-cycle { background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.3); padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; }

  .dash-body { padding: 26px 30px; }

  /* Partner Banner */
  .partner-banner { background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
  .partner-name { font-size: 16px; font-weight: 800; color: #0F172A; }
  .partner-sub { font-size: 11.5px; color: #64748B; margin-top: 2px; }
  .tier-pill { background: #E0F2FE; color: #0369A1; font-size: 11.5px; font-weight: 700; padding: 5px 12px; border-radius: 8px; border: 1px solid #BAE6FD; }

  /* 4 Metric Cards */
  .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
  .metric-card { padding: 14px 16px; border-radius: 12px; border: 1.5px solid #E2E8F0; background: #FFFFFF; }
  .metric-label { font-size: 11px; font-weight: 700; color: #64748B; margin-bottom: 5px; }
  .metric-val { font-size: 18px; font-weight: 800; color: #0F172A; }
  .metric-card.escrow { border-color: #38BDF8; background: #F0F9FF; }
  .metric-card.comm { border-color: #FBBF24; background: #FFFBEB; }
  .metric-card.surplus { border-color: #34D399; background: #ECFDF5; }
  .metric-card.surplus .metric-val { color: #059669; }

  /* Net Formula Box */
  .formula-box { background: #F1F5F9; border-left: 4px solid #088395; border-radius: 0 10px 10px 0; padding: 14px 18px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
  .formula-text { font-size: 12.5px; color: #334155; line-height: 1.4; }
  .formula-badge { background: #10B981; color: #FFFFFF; font-size: 12px; font-weight: 800; padding: 6px 14px; border-radius: 6px; }

  /* Settlements Table */
  .table-title { font-size: 13.5px; font-weight: 800; color: #0F172A; margin-bottom: 12px; display: flex; justify-content: space-between; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; padding: 10px 12px; background: #F8FAFC; color: #475569; font-weight: 700; border-bottom: 2px solid #E2E8F0; }
  td { padding: 12px 12px; border-bottom: 1px solid #E2E8F0; color: #1E293B; }
  .badge-status { padding: 3px 8px; border-radius: 999px; font-size: 10.5px; font-weight: 700; }
  .status-paid { background: #DCFCE7; color: #15803D; }
  .status-settled { background: #E0F2FE; color: #0284C7; }

  .actions-row { margin-top: 20px; display: flex; justify-content: flex-end; gap: 12px; }
  .btn-raast { background: #10B981; color: #FFFFFF; border: none; padding: 11px 20px; border-radius: 8px; font-size: 13px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 6px; }
  .btn-1bill { background: #0F172A; color: #FFFFFF; border: none; padding: 11px 20px; border-radius: 8px; font-size: 13px; font-weight: 800; cursor: pointer; }
</style>
</head>
<body>
<div class="dashboard-container">
  <div class="dash-header">
    <div class="dash-title">
      <span>🏛️ Swat Tourism Platform &bull; Financial Reconciliation Control Center</span>
    </div>
    <div class="badge-cycle">Billing Cycle: Nov 2026 (Active)</div>
  </div>

  <div class="dash-body">
    <!-- Partner Header -->
    <div class="partner-banner">
      <div>
        <div class="partner-name">Sakoon Resort Kalam</div>
        <div class="partner-sub">Business Profile ID: biz-sakoon-01 &bull; IBAN: PK92MEZN000109281726</div>
      </div>
      <div class="tier-pill">Vertical: Hotel &bull; Standard Tier: 10% Commission</div>
    </div>

    <!-- 4 High Level Cards -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Completed Stays (GMV)</div>
        <div class="metric-val">PKR 120,000</div>
      </div>
      <div class="metric-card comm">
        <div class="metric-label">STP Commission (10%)</div>
        <div class="metric-val" style="color: #D97706;">PKR 12,000</div>
      </div>
      <div class="metric-card escrow">
        <div class="metric-label">STP Escrow Advances Held</div>
        <div class="metric-val" style="color: #0284C7;">PKR 24,000</div>
      </div>
      <div class="metric-card surplus">
        <div class="metric-label">Net Surplus Due to Hotel</div>
        <div class="metric-val">PKR 12,000</div>
      </div>
    </div>

    <!-- Universal Net Settlement Calculation -->
    <div class="formula-box">
      <div class="formula-text">
        <strong>Universal Net Settlement Status:</strong> STP holds PKR 24,000 in tourist online advance payments.<br>
        After retaining its PKR 12,000 platform commission, STP owes <strong>Sakoon Resort PKR 12,000</strong>.
      </div>
      <div class="formula-badge">Net Payout to Hotel</div>
    </div>

    <!-- Ledger Table -->
    <div class="table-title">
      <span>Itemized Stays & Settlement Ledger:</span>
      <span style="font-size: 11px; color: #64748B;">Showing 3 Verified Bookings for Nov 2026</span>
    </div>

    <table>
      <thead>
        <tr>
          <th>Booking Ref</th>
          <th>Guest</th>
          <th>Gross GMV</th>
          <th>Online Advance (STP)</th>
          <th>Counter Balance (Hotel)</th>
          <th>STP Comm (10%)</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>SWT-BK-88219</strong></td>
          <td>Shah Khalid</td>
          <td>PKR 24,000</td>
          <td style="color: #0284C7; font-weight: 700;">PKR 4,800</td>
          <td style="font-weight: 700;">PKR 19,200</td>
          <td style="color: #D97706; font-weight: 700;">PKR 2,400</td>
          <td><span class="badge-status status-paid">Completed</span></td>
        </tr>
        <tr>
          <td><strong>SWT-BK-88240</strong></td>
          <td>Ayesha Khan</td>
          <td>PKR 48,000</td>
          <td style="color: #0284C7; font-weight: 700;">PKR 9,600</td>
          <td style="font-weight: 700;">PKR 38,400</td>
          <td style="color: #D97706; font-weight: 700;">PKR 4,800</td>
          <td><span class="badge-status status-paid">Completed</span></td>
        </tr>
        <tr>
          <td><strong>SWT-BK-88295</strong></td>
          <td>Tariq Jameel</td>
          <td>PKR 48,000</td>
          <td style="color: #0284C7; font-weight: 700;">PKR 9,600</td>
          <td style="font-weight: 700;">PKR 38,400</td>
          <td style="color: #D97706; font-weight: 700;">PKR 4,800</td>
          <td><span class="badge-status status-settled">Reconciled</span></td>
        </tr>
      </tbody>
    </table>

    <div class="actions-row">
      <button class="btn-1bill">📄 Download 1Bill Reconciliation Receipt</button>
      <button class="btn-raast">⚡ Approve SBP Raast Payout (PKR 12,000)</button>
    </div>
  </div>
</div>
</body>
</html>
"""

async def generate_screens():
    screens = [
        ("tourist_payment_checkout_screen.png", HTML_SCREEN_1),
        ("hotel_frontdesk_settlement_screen.png", HTML_SCREEN_2),
        ("stp_financial_control_center.png", HTML_SCREEN_3)
    ]
    
    target_dirs = [
        r"F:\Antigravity\SwatTourismProduction_v2\Docs\payment_screens",
        r"F:\Antigravity\SwatTourismProduction\Docs\payment_screens",
        r"C:\Users\shahkhalid1\.gemini\antigravity\brain\afe5afc9-c839-4824-9809-71cbeb242324"
    ]
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1280, "height": 880}, device_scale_factor=2)
        
        for filename, html_content in screens:
            await page.set_content(html_content, wait_until="networkidle")
            # Wait brief moment for fonts/rendering
            await page.wait_for_timeout(500)
            
            # Save to all target paths
            for d in target_dirs:
                os.makedirs(d, exist_ok=True)
                target_path = os.path.join(d, filename)
                await page.screenshot(path=target_path, full_page=True)
                print(f"Captured: {target_path}")
                
        await browser.close()
    print("All screenshots successfully captured!")

if __name__ == "__main__":
    asyncio.run(generate_screens())
