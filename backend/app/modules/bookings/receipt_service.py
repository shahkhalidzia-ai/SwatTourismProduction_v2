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
