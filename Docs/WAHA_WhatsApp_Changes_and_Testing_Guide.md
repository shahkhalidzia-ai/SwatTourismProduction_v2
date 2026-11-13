# WAHA Local WhatsApp Integration — Changes & End-to-End Testing Guide

This document summarizes the code and configuration changes made to enable local WhatsApp testing via open-source **WAHA (WhatsApp HTTP API)** and provides a step-by-step guide to receive booking receipts, hotel acceptance confirmations, and official QR vouchers on a real mobile phone from `localhost`.

---

## Part 1 — Summary of Code & Configuration Changes

| File | What Changed | Why |
|---|---|---|
| `backend/app/core/config.py` | Added `'waha'` to `WHATSAPP_PROVIDER` and added `WAHA_BASE_URL` (`http://localhost:3000`), `WAHA_SESSION` (`default`), and optional `WAHA_API_KEY`. | Allows switching between `mock`, `waha`, `meta`, and `twilio` via `.env` without editing Python code. |
| `backend/app/modules/communications/whatsapp_service.py` | Added `elif provider == "waha":` branch in `WhatsAppService.send_whatsapp_message`. Converts normalized `+92...` phone numbers to `<digits>@c.us`, attaches optional `X-Api-Key` header, posts JSON to `{WAHA_BASE_URL}/api/sendText`, and records `SENT_VIA_WAHA` (falling back safely to `FALLBACK_MOCK` if WAHA is offline). | Enables real WhatsApp delivery through local Docker WAHA while keeping audit logs and non-blocking error handling. |
| `backend/app/modules/communications/dispatcher.py` | Updated `_resolve_contacts()` so an explicit `WhatsApp:` number entered by the guest at checkout takes precedence over `tourist.phone`, and fixed `paid_amount` calculation to read `deposit_amount`, `property_collected_amount`, and `payment_status` on real database bookings. | Ensures messages during local QA go to the test mobile number typed into the booking form and confirmed vouchers show accurate Paid / Balance Due totals. |
| `backend/.env` & `backend/.env.example` | Configured `WHATSAPP_PROVIDER=waha` in local `backend/.env` (gitignored) and documented both WAHA and Meta settings in `backend/.env.example`. | Activates WAHA right away on `localhost` while keeping a 2-line switch ready for Meta Cloud API later. |
| `backend/tests/conftest.py` & `backend/tests/test_phase2_communications_gateway.py` | Defaulted `WHATSAPP_PROVIDER=mock` in test setup (`conftest.py`) and added unit test `test_whatsapp_service_waha_dispatch`. | Keeps automated `pytest` runs fast/isolated from `backend/.env` while verifying WAHA request formatting and headers. |

---

## Part 2 — Step-by-Step Guide to Test Hotel Confirmation & Voucher on WhatsApp

### Prerequisites
- Docker Desktop running on Windows
- A secondary/test WhatsApp phone (this becomes your **sender** device when you scan the QR code)
- Your personal mobile phone with WhatsApp (to **receive** the test confirmations & voucher)

### Step 1: Start WAHA on Localhost & Link Sender Number
1. The `waha` container is configured with persistent storage (`waha_sessions`) and matching `WAHA_API_KEY` (`c5ec190d8aa34bd78324d51b8c936a7f` in `backend/.env`):
   ```bash
   docker run -d --name waha --restart unless-stopped -p 3000:3000 -v waha_sessions:/app/.sessions -e WAHA_API_KEY=c5ec190d8aa34bd78324d51b8c936a7f -e WAHA_DASHBOARD_USERNAME=admin -e WAHA_DASHBOARD_PASSWORD=swat2026 -e WHATSAPP_SWAGGER_USERNAME=admin -e WHATSAPP_SWAGGER_PASSWORD=swat2026 devlikeapro/waha
   ```
   *(If the container already exists, simply run `docker start waha`.)*
2. Open **`http://localhost:3000/dashboard`** in your browser and sign in with:
   - **Username:** `admin`
   - **Password:** `swat2026`
3. Click **Start / Create Session** (`default`), then scan the QR code from your **sender/test WhatsApp phone** (`WhatsApp -> Linked Devices -> Link a Device`). Wait until the session status shows **`WORKING`**.

### Step 2: Start Backend & Frontend
> **Important:** Start `uvicorn` from inside the **`backend/`** folder so `Settings` loads `backend/.env` (`WHATSAPP_PROVIDER=waha`).

```powershell
cd F:\Antigravity\SwatTourismProduction_v2\backend
uvicorn app.main:app --port 8090 --reload
```
In another terminal, start the frontend (`frontend/`):
```powershell
cd F:\Antigravity\SwatTourismProduction_v2\frontend
npm run dev
```

### Step 3: Quick Sanity Test via Swagger (Optional, 30 Seconds)
1. Open **`http://localhost:8090/docs`**.
2. Expand **`POST /api/v1/communications/whatsapp/test-send`** -> click **Try it out**:
   ```json
   {
     "to_phone": "03001234567",
     "message": "Test message from Swat Tourism localhost via WAHA!",
     "template": "manual_test"
   }
   ```
   *(Replace `03001234567` with your real mobile number.)*
3. Execute and verify the response returns `"status": "SENT_VIA_WAHA"` and the message arrives on your phone.
4. You can also inspect the backend audit outbox at **`GET /api/v1/communications/whatsapp/logs`**.

### Step 4: Full Application Flow — Hotel Confirmation & Official Voucher to Tourist
1. **Tourist Places Booking Request:**
   - Log in to the **Tourist Portal** (e.g., Demo Tourist).
   - Select a hotel (e.g., **Swat Serena Hotel**), choose check-in/out dates and room type.
   - In the guest details WhatsApp field, **enter your real mobile number** (e.g., `03001234567`). Because `CommunicationDispatcher._resolve_contacts` prioritizes the booking's `WhatsApp:` field, alerts and the voucher will route to that number.
   - Submit the booking request.
   - **Result:** Backend `BookingService.create_booking` triggers `dispatch_booking_created`, sending:
     - `TEMPLATE_1_HOTEL_NEW_RESERVATION_ALERT` (to hotel manager number)
     - `TEMPLATE_2_TOURIST_BOOKING_RECEIPT` (to your mobile WhatsApp)
2. **Hotel Accepts & Confirms Booking (Triggers Official Voucher):**
   - Switch to / open the **Hotel Business Portal** (**Hotel Today Screen**).
   - Locate the booking request and click **Accept** (assign a physical room key if prompted).
   - **Result:** Frontend calls `POST /api/v1/bookings/{id}/accept` -> backend `BookingService.accept_booking` triggers `CommunicationDispatcher.dispatch_booking_accepted` -> **WAHA immediately delivers `TEMPLATE_3_OFFICIAL_CONFIRMED_VOUCHER` to your Tourist WhatsApp number**, including:
     - Booking Reference & `KPCTA-<REF>` verification code
     - Stay dates & assigned room details
     - Payment guarantee mode, Amount Paid, and Balance Due at Check-In
     - Official PDF Voucher link, Hotel GPS link, and 24/7 Helpline (`0946-9240400 | Rescue 1122`)
3. **(Alternative Payment Trigger) Online / Unified Checkout Confirmation:**
   - If the tourist also completes Unified Checkout (`FULL_ONLINE`, `DEPOSIT_20`, or `PAY_AT_HOTEL`), `POST /api/v1/bookings/{id}/pay/unified` fires `dispatch_booking_confirmed_notifications`, which also sends `TEMPLATE_3_OFFICIAL_CONFIRMED_VOUCHER` to the tourist's WhatsApp.
4. **Stay Completion Review Invite (Bonus Trigger):**
   - When the hotel checks out / completes the stay on **Hotel Today**, `BookingService.complete_booking` sends `TEMPLATE_4_CHECKOUT_REVIEW_INVITE` via WAHA.

---

## Part 3 — How to Switch Back to Meta Cloud API Later

No Python code edits are needed to switch from WAHA to Meta Cloud API:
1. Open **`backend/.env`**.
2. Comment out `WHATSAPP_PROVIDER=waha` and set Meta credentials:
   ```env
   WHATSAPP_PROVIDER=meta
   META_WHATSAPP_TOKEN=your_meta_access_token
   META_PHONE_NUMBER_ID=your_meta_phone_number_id
   ```
3. Restart `uvicorn` (run from `backend/`). Your backend logs will show `[META WA SENT]` and statuses will change to `SENT_VIA_META`.

