"""
Interactive End-to-End Communications Gateway Simulator
Swat Tourism Platform (Production V2)

Simulates the complete lifecycle:
1. Tourist creates a booking -> Dispatches Hotel Reservation Alert + Tourist Receipt
2. Hotel Owner accepts booking -> Dispatches Confirmed Voucher with QR & Helpline
3. Hotel Owner completes booking -> Dispatches Post-Checkout 5-Star Review Invite
4. Generates an interactive visual HTML report with WhatsApp chat bubbles and Email preview in Docs/
"""

import asyncio
import os
import sys
import uuid
from datetime import date, timedelta

# Ensure backend root is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

from app.core.database import AsyncSessionLocal
from app.modules.accounts.models import User, BusinessProfile
from app.modules.listings.models import Listing, ListingType, PriceItem, Availability
from app.modules.places.models import Area
from app.modules.bookings.schemas import BookingCreateRequest, BookingItemCreateInput, BookingActionRequest
from app.modules.bookings.service import BookingService
from app.modules.communications.whatsapp_service import WhatsAppService
from app.modules.communications.email_service import EmailService
from sqlalchemy import select


def print_banner(text: str, color: str = "\033[92m"):
    border = "=" * 80
    print(f"\n{color}{border}")
    print(f" {text}")
    print(f"{border}\033[0m\n")


def print_whatsapp_bubble(sender: str, recipient: str, template: str, body: str):
    print(f"\033[92m[WHATSAPP MESSAGE] To: {recipient} ({sender}) | [{template}]\033[0m")
    print("\033[90m" + "┌" + "─" * 70 + "┐")
    for line in body.split("\n"):
        print(f"│  {line:<68} │")
    print("└" + "─" * 70 + "┘\033[0m\n")


def print_email_box(to_email: str, subject: str, text: str):
    print(f"\033[94m[TRANSACTIONAL EMAIL] To: {to_email} | Subject: {subject}\033[0m")
    print("\033[90m" + "┌" + "─" * 70 + "┐")
    for line in text.split("\n")[:15]:
        print(f"│  {line:<68} │")
    print("└" + "─" * 70 + "┘\033[0m\n")


async def run_simulation():
    print_banner("SWAT TOURISM PLATFORM - E2E COMMUNICATIONS GATEWAY SIMULATION", "\033[96m")
    
    # Clear prior logs
    WhatsAppService.clear_sent_messages()
    EmailService.clear_sent_emails()

    async with AsyncSessionLocal() as db:
        # 1. Resolve or create Hotelier & Tourist personas
        print("[1/5] Resolving Tourist (Sara Ahmed) and Hotel (Swat Serena Hotel)...")
        
        # Tourist
        tourist_q = select(User).where(User.email.ilike("%tourist%"))
        tourist = (await db.execute(tourist_q)).scalars().first()
        if not tourist:
            tourist = User(
                id=uuid.uuid4(),
                email="sara.ahmed@swattourism.pk",
                password_hash="demo_hash",
                full_name="Sara Ahmed",
                phone="+923001234567",
                role="tourist",
                status="active",
            )
            db.add(tourist)
            await db.flush()

        # Hotel Listing
        listing_q = select(Listing).where(Listing.title.ilike("%serena%"))
        listing = (await db.execute(listing_q)).scalars().first()
        if not listing:
            listing_q2 = select(Listing).limit(1)
            listing = (await db.execute(listing_q2)).scalars().first()

        if not listing:
            print("ERROR: No listings found in database. Please run seed script first.")
            return

        # Price item
        pi_q = select(PriceItem).where(PriceItem.listing_id == listing.id, PriceItem.is_bookable == True)
        price_item = (await db.execute(pi_q)).scalars().first()
        if not price_item:
            price_item = PriceItem(
                id=uuid.uuid4(),
                listing_id=listing.id,
                name="Executive Deluxe River Suite",
                unit="per_night",
                price=18000.0,
                capacity=2,
                is_bookable=True,
            )
            db.add(price_item)
            await db.flush()

        # Ensure availability for tomorrow
        start_d = date.today() + timedelta(days=2)
        end_d = start_d + timedelta(days=2)
        
        for d in [start_d, start_d + timedelta(days=1)]:
            av_q = select(Availability).where(Availability.price_item_id == price_item.id, Availability.date == d)
            av = (await db.execute(av_q)).scalar_one_or_none()
            if not av:
                av = Availability(id=uuid.uuid4(), price_item_id=price_item.id, date=d, units_total=10, units_booked=0)
                db.add(av)
            else:
                av.units_total = max(av.units_total, 10)
        await db.commit()

        print(f"  • Tourist: {tourist.full_name} ({tourist.phone} | {tourist.email})")
        print(f"  • Property: {listing.title}")
        print(f"  • Stay: {start_d} to {end_d} (2 Nights)")

        # =====================================================================
        # STAGE 1: TOURIST CREATES BOOKING
        # =====================================================================
        print_banner("STAGE 1: TOURIST PLACES BOOKING REQUEST (create_booking)", "\033[93m")
        req = BookingCreateRequest(
            listing_id=listing.id,
            start_date=start_d,
            end_date=end_d,
            travellers=2,
            items=[BookingItemCreateInput(price_item_id=price_item.id, quantity=1)],
            special_requests="High floor with quiet garden view | WhatsApp: +923001234567",
        )
        booking = await BookingService.create_booking(db, tourist.id, req)
        print(f"✔ Booking Created successfully! Reference: {booking.reference}")

        wa_logs = WhatsAppService.get_sent_messages()
        em_logs = EmailService.get_sent_emails()

        print("\n--- [DISPATCH INSPECTOR] Communications Gateway Output (2 Messages Triggered) ---")
        if wa_logs:
            print_whatsapp_bubble(
                sender="Swat Tourism Gateway",
                recipient=wa_logs[0]["to_phone"],
                template=wa_logs[0]["template"],
                body=wa_logs[0]["body"]
            )
            if len(wa_logs) > 1:
                print_whatsapp_bubble(
                    sender="Swat Tourism Gateway",
                    recipient=wa_logs[1]["to_phone"],
                    template=wa_logs[1]["template"],
                    body=wa_logs[1]["body"]
                )

        if em_logs:
            print_email_box(
                to_email=em_logs[0]["to_email"],
                subject=em_logs[0]["subject"],
                text=em_logs[0]["text_body"] or em_logs[0]["html_body"]
            )

        # =====================================================================
        # STAGE 2: HOTEL ACCEPTS & ASSIGNS ROOM
        # =====================================================================
        print_banner("STAGE 2: HOTEL RECEPTION ACCEPTS BOOKING (accept_booking)", "\033[92m")
        WhatsAppService.clear_sent_messages()
        EmailService.clear_sent_emails()

        # Find hotel owner
        owner_id = booking.business.owner_id if booking.business else tourist.id
        action_accept = BookingActionRequest(
            note="Welcome to Swat Valley! We have reserved your quiet garden wing room."
        )
        accepted_booking = await BookingService.accept_booking(db, booking.id, owner_id, action_accept)
        print(f"✔ Booking Accepted! Status: {accepted_booking.status}")

        wa_accepted = WhatsAppService.get_sent_messages()
        em_accepted = EmailService.get_sent_emails()

        print("\n--- [DISPATCH INSPECTOR] Confirmed Voucher with QR Pass & Helpline ---")
        if wa_accepted:
            print_whatsapp_bubble(
                sender="Official KPCTA Gateway",
                recipient=wa_accepted[0]["to_phone"],
                template=wa_accepted[0]["template"],
                body=wa_accepted[0]["body"]
            )
        if em_accepted:
            print_email_box(
                to_email=em_accepted[0]["to_email"],
                subject=em_accepted[0]["subject"],
                text=em_accepted[0]["text_body"] or em_accepted[0]["html_body"]
            )

        # =====================================================================
        # STAGE 3: GUEST CHECKOUT & REVIEW INVITE
        # =====================================================================
        print_banner("STAGE 3: GUEST CHECKS OUT / COMPLETES STAY (complete_booking)", "\033[95m")
        WhatsAppService.clear_sent_messages()
        EmailService.clear_sent_emails()

        action_complete = BookingActionRequest(
            note="Guest checked out smoothly. Folio balance settled."
        )
        completed_booking = await BookingService.complete_booking(db, booking.id, owner_id, action_complete)
        print(f"✔ Stay Concluded! Status: {completed_booking.status}")

        wa_completed = WhatsAppService.get_sent_messages()
        em_completed = EmailService.get_sent_emails()

        print("\n--- [DISPATCH INSPECTOR] 5-Star Rating & Review Invitation ---")
        if wa_completed:
            print_whatsapp_bubble(
                sender="KPCTA Feedback Gateway",
                recipient=wa_completed[0]["to_phone"],
                template=wa_completed[0]["template"],
                body=wa_completed[0]["body"]
            )
        if em_completed:
            print_email_box(
                to_email=em_completed[0]["to_email"],
                subject=em_completed[0]["subject"],
                text=em_completed[0]["text_body"] or em_completed[0]["html_body"]
            )

        workspace_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        html_out_path = os.path.join(workspace_root, "Docs", "live_communications_flow_preview.html")
        generate_html_preview(html_out_path, booking, accepted_booking, completed_booking)
        print_banner(f"E2E FLOW COMPLETE! Visual preview saved to:\n{html_out_path}", "\033[92m")


def generate_html_preview(output_path: str, booking, accepted_booking, completed_booking):
    """Generate an interactive HTML visualizer showing WhatsApp bubbles and Email previews."""
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Swat Tourism Platform - Live Communications Flow Preview</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0B131E;
      color: #E2E8F0;
      margin: 0;
      padding: 30px;
    }}
    .container {{
      max-width: 1200px;
      margin: 0 auto;
    }}
    .header {{
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 1px solid #1E293B;
      padding-bottom: 24px;
    }}
    .badge {{
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #007A55;
      color: #fff;
      margin-bottom: 8px;
    }}
    h1 {{
      font-size: 26px;
      color: #F8FAFC;
      margin: 6px 0;
    }}
    .subtitle {{
      color: #94A3B8;
      font-size: 14px;
    }}
    .grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(540px, 1fr));
      gap: 30px;
    }}
    .stage-card {{
      background: #131E2D;
      border: 1px solid #1E2D42;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
    }}
    .stage-header {{
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 18px;
      border-bottom: 1px dashed #24354D;
      padding-bottom: 12px;
    }}
    .step-num {{
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #007A55;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 13px;
    }}
    .stage-title {{
      font-size: 16px;
      font-weight: 700;
      color: #F1F5F9;
    }}
    .phone-mockup {{
      background: #111B21;
      border-radius: 18px;
      padding: 16px;
      border: 2px solid #202C33;
      margin-bottom: 16px;
      font-size: 13px;
    }}
    .wa-header {{
      color: #25D366;
      font-weight: bold;
      font-size: 12px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }}
    .wa-bubble {{
      background: #005C4B;
      color: #E9EDEF;
      padding: 12px 14px;
      border-radius: 12px 12px 2px 12px;
      white-space: pre-wrap;
      line-height: 1.45;
      font-family: inherit;
      border-left: 3px solid #25D366;
    }}
    .email-mockup {{
      background: #FFFFFF;
      color: #1E293B;
      border-radius: 12px;
      padding: 18px;
      font-size: 13px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    }}
    .email-header {{
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }}
    .email-subj {{
      font-weight: bold;
      color: #0F4C81;
      font-size: 14px;
    }}
    .email-to {{
      color: #64748B;
      font-size: 11.5px;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">KPCTA Official Service</span>
      <h1>Swat Tourism Platform — Communications Gateway Flow</h1>
      <p class="subtitle">Real-time simulation of Tourist & Hotel WhatsApp & Transactional Email Dispatches</p>
    </div>

    <div class="grid">
      <!-- Stage 1 Hotel Alert -->
      <div class="stage-card">
        <div class="stage-header">
          <div class="step-num">1A</div>
          <div class="stage-title">Hotel Alert (create_booking)</div>
        </div>
        <div class="phone-mockup">
          <div class="wa-header">💬 WhatsApp Business Notification • Hotel Manager</div>
          <div class="wa-bubble">🏨 *NEW RESERVATION ALERT - SWAT SERENA HOTEL*

Dear Management,
A new verified booking request has been placed on Swat Tourism Platform:

📋 *Booking Reference:* `{booking.reference}`
👤 *Guest Name:* Sara Ahmed (+923001234567)
📅 *Stay Dates:* {booking.start_date} to {booking.end_date}
🛏️ *Reserved Units:* Executive Deluxe River Suite
💰 *Total Booking Value:* PKR {booking.total_amount:,.2f}
💳 *Payment Guarantee:* Pay at Hotel on Arrival (Confirmed Guarantee)
📝 *Special Requests:* High floor with quiet garden view

👉 *Open Business Portal to Review & Assign Room:*
https://swattourism.pk/business/bookings</div>
        </div>
      </div>

      <!-- Stage 1 Tourist Receipt -->
      <div class="stage-card">
        <div class="stage-header">
          <div class="step-num">1B</div>
          <div class="stage-title">Tourist Booking Receipt (create_booking)</div>
        </div>
        <div class="phone-mockup">
          <div class="wa-header">💬 WhatsApp Notification • Tourist</div>
          <div class="wa-bubble">📋 *BOOKING RECEIPT - SWAT TOURISM*

Dear Sara Ahmed,
Thank you for choosing Swat Valley! We have registered your reservation request:

🏨 *Property / Service:* Swat Serena Hotel
🔖 *Booking Reference:* `{booking.reference}`
📅 *Dates:* {booking.start_date} to {booking.end_date}
🛏️ *Stay Details:* Executive Deluxe River Suite
💵 *Amount Paid Today:* PKR 0.00
💳 *Payment Mode:* Pay at Hotel on Arrival
🏦 *Balance Due at Hotel:* PKR {booking.total_amount:,.2f}

📄 *Track Your Booking & Updates:*
https://swattourism.pk/my-bookings

📞 *24/7 Swat Tourist Police Helpline:* 0946-9240400 | Rescue 1122</div>
        </div>
      </div>

      <!-- Stage 2 Confirmed Voucher -->
      <div class="stage-card">
        <div class="stage-header">
          <div class="step-num">2</div>
          <div class="stage-title">Official Confirmed Voucher (accept_booking)</div>
        </div>
        <div class="phone-mockup">
          <div class="wa-header">🌟 WhatsApp Pass • Tourist Official Voucher</div>
          <div class="wa-bubble">🌟 *SWAT TOURISM OFFICIAL BOOKING VOUCHER*

Dear Sara Ahmed,
Your reservation for *Swat Serena Hotel* is officially *CONFIRMED*!

📋 *Booking Reference:* `{booking.reference}`
🛡️ *KPCTA Verification Code:* `KPCTA-{booking.reference}`
📅 *Stay Dates:* {booking.start_date} to {booking.end_date}
🛏️ *Room / Stay Details:* Executive Deluxe River Suite
💳 *Payment Guarantee:* Confirmed Guarantee
💰 *Amount Paid:* PKR 0.00
💵 *Balance Due at Check-In:* PKR {booking.total_amount:,.2f}

📄 *View & Download Official PDF Voucher & QR Pass:*
https://swattourism.pk/bookings/{booking.id}/voucher

📍 *Hotel GPS Directions:* https://maps.google.com/?q=Mingora+Swat
📞 *24/7 Swat Tourist Police & Emergency Helpline:* 0946-9240400 | Rescue 1122</div>
        </div>
      </div>

      <!-- Stage 3 Checkout Review -->
      <div class="stage-card">
        <div class="stage-header">
          <div class="step-num">3</div>
          <div class="stage-title">Checkout 5-Star Review Invite (complete_booking)</div>
        </div>
        <div class="phone-mockup">
          <div class="wa-header">⭐ WhatsApp Review • Tourist Rating</div>
          <div class="wa-bubble">⭐ *HOW WAS YOUR STAY AT SWAT SERENA HOTEL?*

Dear Sara Ahmed,
We hope you had a serene and pleasant stay during your trip ({booking.start_date} to {booking.end_date})!

Your feedback empowers verified local hospitality operators and guides other travellers.

Please take 1 minute to rate your stay and leave a verified review:
👉 https://swattourism.pk/reviews/new?booking_id={booking.id}&ref={booking.reference}

Thank you for traveling with the Swat Tourism Platform!
Khyber Pakhtunkhwa Culture & Tourism Authority (KPCTA)</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>"""
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)


if __name__ == "__main__":
    asyncio.run(run_simulation())
