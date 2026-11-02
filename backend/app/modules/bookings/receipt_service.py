from datetime import datetime, timezone
from typing import Dict, Any, Optional
import uuid


class ReceiptInvoiceService:
    """
    Enterprise receipt and tax invoice generation service for Swat Tourism bookings.
    Provides structured fiscal breakdowns, itemized service lines, and printable invoice documents.
    """

    @staticmethod
    def generate_invoice_data(
        booking: Any,
        user: Any,
        payment_details: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Creates a comprehensive, structured invoice object.
        """
        booking_id = str(getattr(booking, "id", uuid.uuid4()))
        booking_ref = f"SWT-BK-{str(booking_id)[:8].upper()}"
        created_at = getattr(booking, "created_at", datetime.now(timezone.utc))
        issued_date = created_at.strftime("%B %d, %Y") if hasattr(created_at, "strftime") else str(created_at)

        # Calculate breakdown
        subtotal = float(getattr(booking, "total_price", 0.0) or 0.0)
        kpk_tourism_tax = round(subtotal * 0.05, 2)  # 5% Provincial Tourism Levy
        grand_total = round(subtotal + kpk_tourism_tax, 2)

        items = []
        raw_items = getattr(booking, "items", []) or []
        if raw_items:
            for it in raw_items:
                items.append({
                    "description": getattr(it, "item_name", "Tourism Service"),
                    "quantity": getattr(it, "quantity", 1),
                    "unit_price": float(getattr(it, "unit_price", 0.0)),
                    "total_price": float(getattr(it, "total_price", 0.0)),
                })
        else:
            items.append({
                "description": getattr(booking, "notes", "Tour / Accommodation Reservation") or "Swat Valley Service",
                "quantity": 1,
                "unit_price": subtotal,
                "total_price": subtotal
            })

        status = getattr(booking, "status", "CONFIRMED")
        is_paid = status in ["PAID", "CONFIRMED", "COMPLETED"]

        pay_info = payment_details or {}
        provider = pay_info.get("provider", "EASYPAISA / JAZZCASH")
        txn_id = pay_info.get("transaction_id", f"TXN-{booking_id[:8].upper()}")

        return {
            "invoice_number": f"INV-{booking_ref}",
            "booking_reference": booking_ref,
            "booking_id": booking_id,
            "issued_date": issued_date,
            "status": "PAID" if is_paid else "PENDING",
            "currency": "PKR",
            "customer": {
                "name": getattr(user, "full_name", "Valued Tourist"),
                "email": getattr(user, "email", "tourist@swattourism.pk"),
                "phone": getattr(user, "phone", "+92-300-0000000")
            },
            "organization": {
                "name": "Swat District Tourism Platform (KPCTA Recognized)",
                "address": "Government House Road, Saidu Sharif, Swat, Khyber Pakhtunkhwa",
                "ntn": "KP-TOURISM-99410",
                "support_email": "support@swattourism.pk",
                "emergency_helpline": "1122"
            },
            "payment": {
                "gateway": provider.upper(),
                "transaction_id": txn_id,
                "paid_at": datetime.now(timezone.utc).isoformat(),
                "payment_verified": is_paid
            },
            "items": items,
            "subtotal": subtotal,
            "tax_amount": kpk_tourism_tax,
            "tax_label": "KPK Provincial Tourism Development Levy (5%)",
            "grand_total": grand_total,
            "qr_verification_code": f"https://swattourism.pk/verify/receipt/{booking_id}"
        }

    @classmethod
    def generate_html_receipt(cls, invoice_data: Dict[str, Any]) -> str:
        """
        Renders an ultra-clean, printable HTML receipt.
        """
        items_rows = "".join([
            f"<tr><td>{item['description']}</td><td style='text-align:center;'>{item['quantity']}</td><td style='text-align:right;'>PKR {item['unit_price']:,.2f}</td><td style='text-align:right;'>PKR {item['total_price']:,.2f}</td></tr>"
            for item in invoice_data["items"]
        ])

        status_color = "#16a34a" if invoice_data["status"] == "PAID" else "#ca8a04"

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Official Invoice - {invoice_data['invoice_number']}</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #1e293b; background: #fff; }}
  .invoice-box {{ max-width: 800px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; }}
  .header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #059669; padding-bottom: 20px; }}
  .badge {{ background: {status_color}; color: white; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 13px; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 24px; }}
  th {{ background: #f8fafc; text-align: left; padding: 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }}
  td {{ padding: 12px 10px; border-bottom: 1px solid #f1f5f9; }}
  .summary-table {{ width: 300px; margin-left: auto; margin-top: 20px; }}
  .summary-table td {{ border: none; padding: 6px 10px; }}
  .total-row td {{ font-weight: bold; font-size: 16px; border-top: 2px solid #e2e8f0; }}
  .footer {{ margin-top: 40px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }}
</style>
</head>
<body>
<div class="invoice-box">
  <div class="header">
    <div>
      <h2 style="margin:0; color:#065f46;">{invoice_data['organization']['name']}</h2>
      <p style="margin:4px 0; font-size:13px; color:#64748b;">{invoice_data['organization']['address']}</p>
    </div>
    <div style="text-align:right;">
      <span class="badge">{invoice_data['status']}</span>
      <h3 style="margin:8px 0 0 0;">{invoice_data['invoice_number']}</h3>
      <p style="margin:2px 0; font-size:13px; color:#64748b;">Date: {invoice_data['issued_date']}</p>
    </div>
  </div>

  <div style="display:flex; justify-content:space-between; margin-top:24px;">
    <div>
      <strong style="font-size:12px; text-transform:uppercase; color:#64748b;">Billed To:</strong>
      <p style="margin:4px 0; font-weight:600;">{invoice_data['customer']['name']}</p>
      <p style="margin:2px 0; font-size:14px;">{invoice_data['customer']['email']}</p>
      <p style="margin:2px 0; font-size:14px;">{invoice_data['customer']['phone']}</p>
    </div>
    <div style="text-align:right;">
      <strong style="font-size:12px; text-transform:uppercase; color:#64748b;">Payment Method:</strong>
      <p style="margin:4px 0; font-weight:600;">{invoice_data['payment']['gateway']}</p>
      <p style="margin:2px 0; font-size:14px; font-family:monospace;">Txn: {invoice_data['payment']['transaction_id']}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Service Description</th>
        <th style="text-align:center;">Qty</th>
        <th style="text-align:right;">Rate</th>
        <th style="text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      {items_rows}
    </tbody>
  </table>

  <table class="summary-table">
    <tr>
      <td>Subtotal:</td>
      <td style="text-align:right;">PKR {invoice_data['subtotal']:,.2f}</td>
    </tr>
    <tr>
      <td>{invoice_data['tax_label']}:</td>
      <td style="text-align:right;">PKR {invoice_data['tax_amount']:,.2f}</td>
    </tr>
    <tr class="total-row">
      <td>Grand Total:</td>
      <td style="text-align:right; color:#065f46;">PKR {invoice_data['grand_total']:,.2f}</td>
    </tr>
  </table>

  <div class="footer">
    <p>Thank you for exploring the breathtaking valleys of Swat. For 24/7 tourist assistance, call Rescue 1122.</p>
    <p>Official Verification URL: <a href="{invoice_data['qr_verification_code']}">{invoice_data['qr_verification_code']}</a></p>
  </div>
</div>
</body>
</html>"""

    @staticmethod
    def generate_official_voucher_data(booking: Any) -> Dict[str, Any]:
        """
        Creates comprehensive data dictionary for the Official KP Tourism Booking Voucher Receipt.
        """
        booking_id = str(getattr(booking, "id", uuid.uuid4()))
        booking_ref = getattr(booking, "reference", f"SWT-BK-{booking_id[:8].upper()}")

        tourist = getattr(booking, "tourist", None)
        tourist_name = getattr(tourist, "full_name", "Valued Guest") if tourist else "Valued Guest"
        tourist_email = getattr(tourist, "email", "guest@swattourism.pk") if tourist else "guest@swattourism.pk"

        special_requests = getattr(booking, "special_requests", "") or ""
        tourist_phone = "+92 300 0000000"
        if "WhatsApp:" in special_requests:
            try:
                tourist_phone = special_requests.split("WhatsApp:")[1].split("|")[0].strip()
            except Exception:
                pass
        if hasattr(tourist, "phone") and getattr(tourist, "phone", None):
            tourist_phone = getattr(tourist, "phone")

        listing = getattr(booking, "listing", None)
        hotel_title = getattr(listing, "title", "Swat Serena Hotel") if listing else "Swat Serena Hotel"
        hotel_area = getattr(listing, "area_name", "Mingora, Swat Valley") if listing else "Mingora, Swat Valley"

        start_date = str(getattr(booking, "start_date", ""))
        end_date = str(getattr(booking, "end_date", "") or start_date)
        try:
            d1 = datetime.strptime(start_date, "%Y-%m-%d")
            d2 = datetime.strptime(end_date, "%Y-%m-%d")
            nights = max(1, (d2 - d1).days)
        except Exception:
            nights = 1

        total_amount = float(getattr(booking, "total_amount", 0.0) or 0.0)
        deposit_amount = float(getattr(booking, "deposit_amount", 0.0) or 0.0)
        payment_status = getattr(booking, "payment_status", "unpaid")

        if payment_status == "paid":
            paid_amount = total_amount
            balance_due = 0.0
            payment_mode_label = "100% Full Online Paid"
        elif payment_status == "deposit_paid" or deposit_amount > 0:
            paid_amount = deposit_amount if deposit_amount > 0 else round(total_amount * 0.20, 2)
            balance_due = round(total_amount - paid_amount, 2)
            payment_mode_label = "20% Advance Guarantee Deposit Paid"
        else:
            paid_amount = 0.0
            balance_due = total_amount
            payment_mode_label = "Pay at Hotel on Arrival (Confirmed Guarantee)"

        assigned_room = getattr(booking, "assigned_room_number", None)
        room_label = f"Room {assigned_room}" if assigned_room else "Assigned Upon Arrival"
        items = getattr(booking, "items", []) or []
        room_type = "Deluxe Room"
        rooms_count = 1
        if items:
            it0 = items[0]
            rooms_count = getattr(it0, "quantity", 1)
            p_item = getattr(it0, "price_item", None)
            if p_item:
                room_type = getattr(p_item, "name", "Deluxe Room")

        tax_amount = round(total_amount * 0.05, 2)

        return {
            "voucher_number": f"VCH-{booking_ref}",
            "booking_reference": booking_ref,
            "booking_id": booking_id,
            "status": getattr(booking, "status", "CONFIRMED").upper(),
            "issued_date": datetime.now(timezone.utc).strftime("%d %B %Y, %I:%M %p"),
            "property": {
                "name": hotel_title,
                "location": hotel_area,
                "check_in_time": "14:00 (2:00 PM)",
                "check_out_time": "12:00 (12:00 PM)",
                "reception_phone": "0946-9240400",
                "directions": f"https://maps.google.com/?q={hotel_title}+{hotel_area}",
            },
            "stay": {
                "check_in": start_date,
                "check_out": end_date,
                "nights": nights,
                "travellers": getattr(booking, "travellers", 2),
                "rooms_count": rooms_count,
                "room_type": room_type,
                "assigned_room": room_label,
            },
            "guest": {
                "name": tourist_name,
                "phone": tourist_phone,
                "email": tourist_email,
            },
            "financials": {
                "total_amount": total_amount,
                "kpk_levy": tax_amount,
                "payment_mode": payment_mode_label,
                "payment_status": payment_status.upper(),
                "paid_amount": paid_amount,
                "balance_due": balance_due,
            },
            "qr_verification_url": f"https://swattourism.pk/verify/voucher/{booking_ref}",
        }

    @classmethod
    def generate_html_voucher(cls, v: Dict[str, Any]) -> str:
        """
        Renders an official, beautifully designed printable/PDF booking voucher pass.
        Includes @media print styling so browser 'Print' or 'Save as PDF' looks flawless.
        """
        status_bg = "#15803d" if v["status"] == "CONFIRMED" else "#b45309"
        pay_badge_bg = "#16a34a" if v["financials"]["balance_due"] == 0 else "#2563eb"

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Official Booking Voucher - {v['booking_reference']}</title>
<style>
  @page {{
    size: A4;
    margin: 12mm 15mm;
  }}
  * {{
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #0f172a;
    background: #f1f5f9;
    margin: 0;
    padding: 24px;
  }}
  .voucher-container {{
    max-width: 820px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 14px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    border: 1px solid #cbd5e1;
    overflow: hidden;
  }}
  .action-bar {{
    background: #0f172a;
    color: #ffffff;
    padding: 12px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}
  .btn-print {{
    background: #2563eb;
    color: #ffffff;
    border: none;
    padding: 8px 18px;
    border-radius: 6px;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
  }}
  .voucher-header {{
    background: linear-gradient(135deg, #0f4c81 0%, #092c4c 100%);
    color: #ffffff;
    padding: 28px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}
  .emblem {{
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #93c5fd;
    font-weight: 700;
  }}
  .voucher-title {{
    font-size: 24px;
    font-weight: 800;
    margin: 4px 0 0 0;
  }}
  .badge-status {{
    background: {status_bg};
    color: #ffffff;
    padding: 6px 16px;
    border-radius: 20px;
    font-weight: 800;
    font-size: 13px;
    letter-spacing: 0.5px;
  }}
  .voucher-body {{
    padding: 28px 32px;
  }}
  .grid-2 {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 24px;
  }}
  .card-box {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 16px;
  }}
  .card-box h3 {{
    margin: 0 0 12px 0;
    font-size: 13px;
    color: #0f4c81;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 6px;
  }}
  .row-field {{
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 13px;
  }}
  .row-field span:first-child {{
    color: #64748b;
    font-weight: 500;
  }}
  .row-field span:last-child {{
    font-weight: 700;
    color: #0f172a;
    text-align: right;
  }}
  .financial-table {{
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }}
  .financial-table td {{
    padding: 8px 12px;
    border-bottom: 1px solid #e2e8f0;
    font-size: 13px;
  }}
  .highlight-balance {{
    background: #fef3c7;
    font-size: 15px !important;
    font-weight: 800;
    color: #92400e;
  }}
  .voucher-footer {{
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    padding: 20px 32px;
    font-size: 11.5px;
    color: #64748b;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}
  @media print {{
    body {{
      background: #ffffff !important;
      padding: 0 !important;
    }}
    .voucher-container {{
      box-shadow: none !important;
      border: none !important;
      max-width: 100% !important;
    }}
    .action-bar {{
      display: none !important;
    }}
  }}
</style>
</head>
<body>
<div class="voucher-container">
  <div class="action-bar">
    <span style="font-size: 12px; font-weight: 600;">Government of Khyber Pakhtunkhwa • Official Tourism Pass</span>
    <div>
      <button class="btn-print" onclick="window.print()">🖨️ Print / Download PDF</button>
    </div>
  </div>

  <div class="voucher-header">
    <div>
      <div class="emblem">Khyber Pakhtunkhwa Culture &amp; Tourism Authority (KPCTA)</div>
      <div class="voucher-title">OFFICIAL BOOKING VOUCHER</div>
      <div style="font-size: 12.5px; margin-top: 4px; opacity: 0.9;">
        Booking Reference: <strong style="letter-spacing: 0.5px;">{v['booking_reference']}</strong> • Issued: {v['issued_date']}
      </div>
    </div>
    <div style="text-align: right;">
      <span class="badge-status">{v['status']}</span>
    </div>
  </div>

  <div class="voucher-body">
    <div class="grid-2">
      <!-- Hotel & Check-in Particulars -->
      <div class="card-box">
        <h3>🏨 Property &amp; Check-In Location</h3>
        <div class="row-field">
          <span>Hotel / Stay:</span>
          <span><strong>{v['property']['name']}</strong></span>
        </div>
        <div class="row-field">
          <span>Location:</span>
          <span>{v['property']['location']}</span>
        </div>
        <div class="row-field">
          <span>Check-In Time:</span>
          <span>{v['property']['check_in_time']}</span>
        </div>
        <div class="row-field">
          <span>Check-Out Time:</span>
          <span>{v['property']['check_out_time']}</span>
        </div>
        <div class="row-field">
          <span>Front Desk Contact:</span>
          <span>{v['property']['reception_phone']}</span>
        </div>
      </div>

      <!-- Guest Details -->
      <div class="card-box">
        <h3>👤 Primary Guest Particulars</h3>
        <div class="row-field">
          <span>Guest Full Name:</span>
          <span><strong>{v['guest']['name']}</strong></span>
        </div>
        <div class="row-field">
          <span>Mobile / WhatsApp:</span>
          <span>{v['guest']['phone']}</span>
        </div>
        <div class="row-field">
          <span>Email Address:</span>
          <span>{v['guest']['email']}</span>
        </div>
        <div class="row-field">
          <span>Voucher ID:</span>
          <span style="font-family: monospace;">{v['voucher_number']}</span>
        </div>
      </div>
    </div>

    <!-- Stay & Room Category -->
    <div class="card-box" style="margin-bottom: 20px;">
      <h3>🛏️ Stay Schedule &amp; Room Assignment</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-top: 8px;">
        <div style="padding: 10px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
          <div style="font-size: 11px; color: #64748b; font-weight: 600;">Check-In Date</div>
          <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px;">{v['stay']['check_in']}</div>
        </div>
        <div style="padding: 10px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
          <div style="font-size: 11px; color: #64748b; font-weight: 600;">Check-Out Date</div>
          <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px;">{v['stay']['check_out']}</div>
        </div>
        <div style="padding: 10px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
          <div style="font-size: 11px; color: #64748b; font-weight: 600;">Total Nights</div>
          <div style="font-size: 14px; font-weight: 800; color: #0f4c81; margin-top: 2px;">{v['stay']['nights']} { 'Night' if v['stay']['nights'] == 1 else 'Nights' }</div>
        </div>
        <div style="padding: 10px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
          <div style="font-size: 11px; color: #64748b; font-weight: 600;">Room Allocation</div>
          <div style="font-size: 14px; font-weight: 800; color: #15803d; margin-top: 2px;">{v['stay']['assigned_room']}</div>
        </div>
      </div>
      <div style="margin-top: 10px; font-size: 12.5px; color: #475569;">
        Room Category: <strong>{v['stay']['room_type']}</strong> • Quantity: <strong>{v['stay']['rooms_count']} Room(s)</strong> • Guests: <strong>{v['stay']['travellers']} Traveller(s)</strong>
      </div>
    </div>

    <!-- Settlement & Fiscal Breakdown -->
    <div class="card-box">
      <h3>💳 Payment Guarantee &amp; Financial Folio</h3>
      <table class="financial-table">
        <tr>
          <td>Total Stay Rate:</td>
          <td style="text-align: right; font-weight: 700;">PKR {v['financials']['total_amount']:,.2f}</td>
        </tr>
        <tr>
          <td>KPK Provincial Tourism Development Levy (5% Included):</td>
          <td style="text-align: right; color: #64748b;">PKR {v['financials']['kpk_levy']:,.2f}</td>
        </tr>
        <tr>
          <td>Guarantee Option:</td>
          <td style="text-align: right; font-weight: 700; color: #0f4c81;">{v['financials']['payment_mode']}</td>
        </tr>
        <tr>
          <td>Amount Paid Today:</td>
          <td style="text-align: right; font-weight: 800; color: #16a34a;">PKR {v['financials']['paid_amount']:,.2f}</td>
        </tr>
        <tr class="highlight-balance">
          <td>Remaining Balance Due at Hotel Arrival:</td>
          <td style="text-align: right;">PKR {v['financials']['balance_due']:,.2f}</td>
        </tr>
      </table>
    </div>
  </div>

  <div class="voucher-footer">
    <div>
      <div><strong>24/7 Swat Tourist Police Helpline:</strong> 0946-9240400 • <strong>Emergency:</strong> 1122</div>
      <div style="margin-top: 3px;">Swat Tourism Official Portal • Government House Road, Saidu Sharif, Swat</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 11px; font-weight: 700; color: #0f4c81;">Digital Verification Seal</div>
      <div style="font-size: 10px; font-family: monospace;">Ref: {v['booking_reference']}</div>
    </div>
  </div>
</div>
</body>
</html>"""

