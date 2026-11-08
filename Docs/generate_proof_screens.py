import os
import asyncio
from playwright.async_api import async_playwright

HTML_UPLOAD_MODAL = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Tourist Payment Proof Upload Modal</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
  body { background: #0B1329; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 25px; }
  .modal-card { width: 100%; max-width: 660px; background: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 30px 70px -15px rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.15); }
  .modal-hdr { background: linear-gradient(135deg, #047857 0%, #065F46 100%); color: #FFF; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; }
  .modal-title { font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 9px; }
  .modal-sub { font-size: 12.5px; color: #D1FAE5; margin-top: 4px; }
  .badge-tag { background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 6px; font-weight: 700; color: #FFF; font-size: 11px; }

  .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 18px; }

  .hotel-box { background: #F8FAFC; border: 1.5px dashed #CBD5E1; border-radius: 12px; padding: 14px 16px; }
  .hotel-box-hdr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 11.5px; font-weight: 800; text-transform: uppercase; color: #475569; }
  .hotel-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .hotel-card { background: #FFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px 10px; }
  .hotel-card-lbl { font-size: 10px; color: #64748B; text-transform: uppercase; font-weight: 700; margin-bottom: 2px; }
  .hotel-card-val { font-size: 12px; font-weight: 800; color: #0F172A; }
  .copy-btn { font-size: 10.5px; color: #047857; font-weight: 700; background: none; border: none; cursor: pointer; float: right; }

  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-group.full { grid-column: span 2; }
  .form-label { font-size: 12px; font-weight: 700; color: #334155; }
  .form-input { padding: 9px 12px; border-radius: 8px; border: 1.5px solid #CBD5E1; font-size: 13px; font-weight: 600; color: #0F172A; background: #FFF; }
  .form-input.mono { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #047857; }

  .dropzone { border: 2px dashed #047857; background: #ECFDF5; border-radius: 12px; padding: 14px 16px; display: flex; align-items: center; gap: 14px; }
  .thumb-img { width: 60px; height: 60px; border-radius: 8px; border: 1.5px solid #A7F3D0; object-fit: cover; background: #FFF; display: flex; align-items: center; justify-content: center; font-size: 26px; }
  .drop-info { flex: 1; }
  .drop-name { font-size: 13px; font-weight: 700; color: #065F46; }
  .drop-size { font-size: 11px; color: #047857; margin-top: 2px; }
  .drop-badge { display: inline-flex; align-items: center; gap: 4px; background: #D1FAE5; color: #065F46; font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 999px; margin-top: 4px; }

  .modal-ftr { padding: 14px 24px; border-top: 1px solid #E2E8F0; background: #F8FAFC; display: flex; justify-content: flex-end; gap: 10px; }
  .btn-cancel { padding: 9px 16px; border-radius: 8px; border: 1px solid #CBD5E1; background: #FFF; color: #475569; font-size: 12.5px; font-weight: 700; }
  .btn-submit { padding: 9px 20px; border-radius: 8px; border: none; background: linear-gradient(135deg, #047857 0%, #065F46 100%); color: #FFF; font-size: 12.5px; font-weight: 800; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(4,120,87,0.3); }
</style>
</head>
<body>

<div class="modal-card">
  <div class="modal-hdr">
    <div>
      <div class="modal-title">
        <span>🏛️</span> Upload Direct Transfer Proof
      </div>
      <div class="modal-sub">
        Booking: <strong>SWT-BK-890214</strong> • Hotel: <strong>Swat Serena Hotel</strong> • Advance Required: <span style="color:#FCD34D; font-weight:800;">PKR 4,800</span>
      </div>
    </div>
    <span class="badge-tag">Track 2 Direct Guarantee</span>
  </div>

  <div class="modal-body">
    <!-- Verified Hotel Bank Box -->
    <div class="hotel-box">
      <div class="hotel-box-hdr">
        <span>Official Verified Hotel Account (Meezan Bank Ltd)</span>
        <span style="color:#047857; font-weight:800;">Guaranteed Verified Front-Desk IBAN</span>
      </div>
      <div class="hotel-grid">
        <div class="hotel-card">
          <div class="hotel-card-lbl">Bank & Title</div>
          <div class="hotel-card-val">Meezan Bank Ltd</div>
          <div style="font-size:10.5px; color:#475569;">Swat Serena Resort Ops</div>
        </div>
        <div class="hotel-card">
          <div class="hotel-card-lbl">IBAN Number <span class="copy-btn">📋 Copy</span></div>
          <div class="hotel-card-val" style="font-size:11px; word-break:break-all;">PK92MEZN0001092817261901</div>
        </div>
        <div class="hotel-card">
          <div class="hotel-card-lbl">Easypaisa / Raast ID <span class="copy-btn">📋 Copy</span></div>
          <div class="hotel-card-val">0345-9876543</div>
        </div>
      </div>
    </div>

    <!-- Form Inputs -->
    <div class="form-grid">
      <div class="form-group full">
        <label class="form-label">Payment Medium / Channel *</label>
        <select class="form-input">
          <option>Meezan Bank Ltd (IBFT Transfer / Raast)</option>
          <option>Easypaisa Mobile Account</option>
          <option>JazzCash Mobile Account</option>
          <option>Habib Bank Ltd (HBL Transfer)</option>
          <option>Allied Bank / ABL</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Amount Transferred (PKR) *</label>
        <input type="text" class="form-input" value="PKR 4,800.00" readonly style="background:#F8FAFC; color:#047857; font-weight:800;">
      </div>

      <div class="form-group">
        <label class="form-label">Transaction Reference (TID) *</label>
        <input type="text" class="form-input mono" value="MZN-8921049182">
      </div>

      <div class="form-group">
        <label class="form-label">Sender Account / Mobile No *</label>
        <input type="text" class="form-input" value="0345-9182736 (Usman Ahmad)">
      </div>

      <div class="form-group">
        <label class="form-label">Transfer Date & Time *</label>
        <input type="text" class="form-input" value="2026-11-08 10:30 PKT">
      </div>
    </div>

    <!-- Dropzone with Attached Screenshot -->
    <div class="dropzone">
      <div class="thumb-img">🧾</div>
      <div class="drop-info">
        <div class="drop-name">meezan_app_transfer_slip_89210.png</div>
        <div class="drop-size">428 KB • High-Resolution Screenshot Slip Attached</div>
        <div class="drop-badge">✓ Valid Slip File Ready for Transmission</div>
      </div>
      <button style="background:#FEE2E2; color:#DC2626; border:none; padding:6px 10px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">Replace</button>
    </div>
  </div>

  <div class="modal-ftr">
    <button class="btn-cancel">Cancel</button>
    <button class="btn-submit">✓ Submit Proof of Payment & Confirm Reservation</button>
  </div>
</div>

</body>
</html>
"""

HTML_INSPECTOR_MODAL = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Hotel Front-Desk Proof Inspector Modal</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
  body { background: #070D1E; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 25px; }
  .modal-card { width: 100%; max-width: 900px; background: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 35px 80px -15px rgba(0,0,0,0.7); border: 1px solid rgba(255,255,255,0.15); }
  .modal-hdr { background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #FFF; padding: 20px 28px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #38BDF8; }
  .modal-title { font-size: 18.5px; font-weight: 800; display: flex; align-items: center; gap: 10px; }
  .modal-sub { font-size: 12.5px; color: #94A3B8; margin-top: 4px; }

  .modal-body { padding: 26px 28px; display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 24px; }

  /* Left Slip Viewer */
  .slip-box { background: #020617; border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 12px; border: 1.5px solid #1E293B; }
  .slip-toolbar { display: flex; justify-content: space-between; align-items: center; }
  .slip-status-pill { background: rgba(56, 189, 248, 0.15); color: #38BDF8; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(56, 189, 248, 0.3); }
  .slip-actions { display: flex; gap: 6px; }
  .slip-btn { background: #1E293B; color: #F1F5F9; border: 1px solid #334155; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; }

  /* Digital Simulated Slip */
  .slip-card { background: #FFFFFF; border-radius: 10px; padding: 18px; border: 1px solid #E2E8F0; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
  .slip-bank-hdr { display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #047857; padding-bottom: 10px; margin-bottom: 12px; }
  .slip-bank-title { font-size: 15px; font-weight: 800; color: #047857; }
  .slip-bank-type { font-size: 11px; font-weight: 700; color: #0F172A; }
  .slip-success-banner { background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 10px; text-align: center; margin-bottom: 14px; }
  .slip-amount-val { font-size: 20px; font-weight: 800; color: #047857; }
  .slip-row { display: flex; justify-content: space-between; font-size: 11.5px; padding: 5px 0; border-bottom: 1px dashed #E2E8F0; }
  .slip-lbl { color: #64748B; font-weight: 600; }
  .slip-val { color: #0F172A; font-weight: 700; }

  /* Right Meta Sheet */
  .meta-col { display: flex; flex-direction: column; gap: 14px; }
  .status-badge-box { background: #FFFBEB; border: 1.5px solid #FCD34D; border-radius: 10px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; }
  .status-badge-text { font-size: 12px; font-weight: 800; color: #B45309; text-transform: uppercase; }

  .tid-box { background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 10px; padding: 12px 14px; }
  .tid-hdr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase; }
  .tid-val { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 800; color: #0F172A; letter-spacing: 0.5px; }
  .copy-btn-tid { background: #047857; color: #FFF; border: none; border-radius: 5px; padding: 3px 8px; font-size: 10.5px; font-weight: 700; cursor: pointer; }

  .data-list { display: flex; flex-direction: column; gap: 8px; }
  .data-item { display: flex; justify-content: space-between; font-size: 12.5px; border-bottom: 1px solid #F1F5F9; padding-bottom: 6px; }
  .data-lbl { color: #64748B; }
  .data-val { color: #0F172A; font-weight: 700; }

  .action-btns { margin-top: auto; display: flex; flex-direction: column; gap: 8px; }
  .btn-approve { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #FFF; border: none; border-radius: 10px; padding: 13px; font-size: 13.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 14px rgba(5,150,105,0.35); }
  .btn-reject { background: #FFF; border: 1.5px solid #FCA5A5; color: #DC2626; border-radius: 10px; padding: 10px; font-size: 12.5px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
</style>
</head>
<body>

<div class="modal-card">
  <div class="modal-hdr">
    <div>
      <div class="modal-title">
        <span>🔍</span> Direct Payment Proof Verification
      </div>
      <div class="modal-sub">
        Booking: <strong style="color:#FFF;">SWT-BK-890214</strong> • Guest: <strong style="color:#FFF;">Usman Ahmad</strong> • Property: <strong>Swat Serena Hotel</strong>
      </div>
    </div>
    <div style="background:#0284C7; color:#FFF; font-size:11px; font-weight:800; padding:4px 12px; border-radius:999px;">Front-Desk Gate</div>
  </div>

  <div class="modal-body">
    <!-- Left Column: Slip Inspector -->
    <div class="slip-box">
      <div class="slip-toolbar">
        <span class="slip-status-pill">📷 High-Res Screenshot Slip</span>
        <div class="slip-actions">
          <button class="slip-btn">🔍 Zoom (150%)</button>
          <button class="slip-btn">↗ Open Full</button>
        </div>
      </div>

      <!-- High Fidelity Mobile Slip View -->
      <div class="slip-card">
        <div class="slip-bank-hdr">
          <div>
            <div class="slip-bank-title">Meezan Bank Ltd</div>
            <div style="font-size:10px; color:#64748B;">Internet Banking Transaction Advice</div>
          </div>
          <span style="background:#D1FAE5; color:#065F46; font-size:10px; font-weight:800; padding:3px 7px; border-radius:4px;">TRANSFER SUCCESSFUL</span>
        </div>

        <div class="slip-success-banner">
          <div style="font-size:11px; color:#065F46; font-weight:700;">TOTAL DEPOSITED AMOUNT</div>
          <div class="slip-amount-val">PKR 4,800.00</div>
          <div style="font-size:10.5px; color:#64748B;">Transferred on 08 Nov 2026, 10:30:14 AM</div>
        </div>

        <div class="slip-row">
          <span class="slip-lbl">Transaction Ref (TID):</span>
          <span class="slip-val" style="font-family:'JetBrains Mono'; color:#047857;">MZN-8921049182</span>
        </div>
        <div class="slip-row">
          <span class="slip-lbl">Sender Account Title:</span>
          <span class="slip-val">Usman Ahmad</span>
        </div>
        <div class="slip-row">
          <span class="slip-lbl">Sender Account / Mobile:</span>
          <span class="slip-val">0345-9182736 (Meezan Mobile App)</span>
        </div>
        <div class="slip-row">
          <span class="slip-lbl">Beneficiary Bank:</span>
          <span class="slip-val">Meezan Bank Ltd</span>
        </div>
        <div class="slip-row">
          <span class="slip-lbl">Beneficiary Title:</span>
          <span class="slip-val">Swat Serena Resort Ops</span>
        </div>
        <div class="slip-row">
          <span class="slip-lbl">Beneficiary IBAN:</span>
          <span class="slip-val" style="font-size:10.5px;">PK92MEZN0001092817261901</span>
        </div>
      </div>
    </div>

    <!-- Right Column: Verification Metadata & Controls -->
    <div class="meta-col">
      <div class="status-badge-box">
        <span style="font-size:12px; color:#78350F; font-weight:700;">Ledger Verification State:</span>
        <span class="status-badge-text">⏳ Pending Front-Desk Approval</span>
      </div>

      <!-- TID with Copy -->
      <div class="tid-box">
        <div class="tid-hdr">
          <span>Transaction ID (TID)</span>
          <button class="copy-btn-tid">📋 Copy TID</button>
        </div>
        <div class="tid-val">MZN-8921049182</div>
      </div>

      <!-- Verification Sheet -->
      <div class="data-list">
        <div class="data-item">
          <span class="data-lbl">Claimed Deposit Amount:</span>
          <span class="data-val" style="font-size:14px; color:#047857;">PKR 4,800.00</span>
        </div>
        <div class="data-item">
          <span class="data-lbl">Payment Rail / Method:</span>
          <span class="data-val">Meezan Bank IBFT Transfer</span>
        </div>
        <div class="data-item">
          <span class="data-lbl">Sender Identification:</span>
          <span class="data-val">0345-9182736 (Usman Ahmad)</span>
        </div>
        <div class="data-item">
          <span class="data-lbl">Transfer Timestamp:</span>
          <span class="data-val">2026-11-08 10:30 PKT</span>
        </div>
        <div class="data-item">
          <span class="data-lbl">Funds Custody:</span>
          <span class="data-val" style="color:#B45309;">Hotel Operator (Direct)</span>
        </div>
        <div class="data-item">
          <span class="data-lbl">Platform Commission Handling:</span>
          <span class="data-val">Auto-Calculated in 1Bill Net Settlement</span>
        </div>
      </div>

      <!-- Action Decision Buttons -->
      <div class="action-btns">
        <button class="btn-approve">✓ Approve & Confirm Advance Deposit</button>
        <button class="btn-reject">✗ Reject Proof Slip / Invalid TID</button>
      </div>
    </div>
  </div>
</div>

</body>
</html>
"""

async def generate_images():
    output_dir = r"F:\Antigravity\SwatTourismProduction_v2\Docs"
    os.makedirs(output_dir, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        
        # Screen 1
        page = await browser.new_page(viewport={"width": 1100, "height": 900})
        await page.set_content(HTML_UPLOAD_MODAL)
        path1 = os.path.join(output_dir, "tourist_payment_proof_upload_modal.png")
        await page.screenshot(path=path1, full_page=True)
        print(f"Generated: {path1}")

        # Screen 2
        page2 = await browser.new_page(viewport={"width": 1150, "height": 900})
        await page2.set_content(HTML_INSPECTOR_MODAL)
        path2 = os.path.join(output_dir, "hotel_frontdesk_proof_inspector_modal.png")
        await page2.screenshot(path=path2, full_page=True)
        print(f"Generated: {path2}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(generate_images())
