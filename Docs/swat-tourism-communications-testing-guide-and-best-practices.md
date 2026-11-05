# Swat Tourism Platform (STP) — Production V2
## End-to-End Testing Guide & Architecture: WhatsApp & Transactional Email Gateway

**Status:** Completed & Operational  
**Module Location:** `backend/app/modules/communications/`  
**Simulator Script:** `backend/scripts/simulate_communications_e2e_flow.py`  
**Visual HTML Mockup:** `Docs/live_communications_flow_preview.html`

---

### Executive Summary

This guide provides end-to-end instructions for testing the complete booking communications lifecycle across WhatsApp and Transactional Email—from tourist reservation request to hotel management alert, official voucher generation with QR pass & 24/7 helpline, and checkout 5-star review invitation.

---

### Method 1: One-Command Lifecycle Simulator (Fastest & Visual)

The fastest, zero-cost method to test the entire lifecycle without requiring live external cloud credentials is the interactive simulator script:

```bash
python backend/scripts/simulate_communications_e2e_flow.py
```

#### What It Executes Sequentially:
1. **Stage 1 (`create_booking`):**
   * **Hotel Alert (WhatsApp & Email):** Sent to Hotel Management summarizing guest info, booking ref, stay dates, reserved unit, payment guarantee model, total value, and link to Hotel Live Room Rack.
   * **Tourist Receipt (WhatsApp & Email):** Sent to the tourist detailing the reservation, deposit paid, balance due at check-in, and 24/7 Swat Tourist Police Helpline (`0946-9240400`) & Emergency Rescue `1122`.
2. **Stage 2 (`accept_booking`):**
   * **Official Confirmed Voucher with QR Pass & Helpline (WhatsApp, Email & SMS):** Official KPCTA government-recognized travel pass featuring encrypted verification QR data (`KPCTA-SWT-...`), GPS directions, and official printable PDF link.
3. **Stage 3 (`complete_booking`):**
   * **Checkout 5-Star Review Invite (WhatsApp & Email):** Warm post-stay greeting with 5-star visual rating prompt and verified review URL.
4. **Visual HTML Generation:**
   * Automatically compiles and saves an interactive visual preview report at:  
     `Docs/live_communications_flow_preview.html`

---

### Method 2: Live Browser & REST API Audit Testing

You can test the entire workflow interactively inside the running web application while auditing the communications gateway via REST endpoints in real-time:

* **Step 1: Tourist Places Reservation:**
  * Open `http://localhost:5181/` in your browser.
  * Switch to the **Tourist (Sara Ahmed)** persona on the top bar.
  * Navigate to **Explore > Hotels** (e.g. Swat Serena Hotel) > Click **Instant Reserve** > Choose payment guarantee mode > Submit.
* **Step 2: Inspect Dispatched Messages:**
  * Open the REST audit endpoints in a browser tab or Postman:
    * **WhatsApp Log:** `http://localhost:8090/api/v1/communications/whatsapp/logs`
    * **Email Log:** `http://localhost:8090/api/v1/communications/email/logs`
    * Verify that Template 1 (Hotel Alert) and Template 2 (Tourist Receipt) are recorded with full markdown/HTML payloads.
* **Step 3: Hotel Manager Accepts Booking:**
  * Switch to the **Hotel Owner (Serena Hotel)** persona on the top bar.
  * Open **Front Desk > Today / Bookings** > Click **Accept Booking** & assign physical room key.
  * Refresh the audit endpoint: Template 3 (Official Confirmed Voucher) is now visible.
* **Step 4: Conclude Stay / Checkout:**
  * On the Hotel Live Room Rack, click **Check Out** for the in-house guest.
  * Refresh the audit endpoint: Template 4 (Checkout Review Invite) is dispatched.

---

### Method 3: Live Cloud Delivery to Real Mobile Devices & Inboxes

To deliver live WhatsApp notifications directly to your physical smartphone and real emails to your personal inbox, configure your credentials in `backend/.env`:

#### 1. Live WhatsApp Configuration (Choose Twilio or Meta Cloud API)

##### Option A: Twilio WhatsApp (Recommended for Instant Sandbox Testing)
```env
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=+14155238886
```
*(Join the Twilio WhatsApp sandbox on your mobile by sending the sandbox code to `+1 415 523 8886`).*

##### Option B: Meta WhatsApp Cloud API (Production)
```env
WHATSAPP_PROVIDER=meta
META_WHATSAPP_TOKEN=EAAG...your_system_user_access_token
META_PHONE_NUMBER_ID=102938475612345
```

#### 2. Live Email Configuration (Choose SendGrid or Standard SMTP)

##### Option A: SendGrid v3 API
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxx
SMTP_FROM_EMAIL=bookings@swattourism.pk
SMTP_FROM_NAME="Swat Tourism Platform"
```

##### Option B: Standard SMTP (e.g. Gmail / Outlook)
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_google_app_password
SMTP_FROM_EMAIL=your_email@gmail.com
SMTP_FROM_NAME="Swat Tourism Platform"
```

---

### Suggested Production Implementation & Architectural Best Practices

1. **Background Asynchronous Workers (Celery / Redis / BackgroundTasks):**
   * Do not block the main HTTP request thread during `create_booking` while waiting for third-party cloud API responses. Use FastAPI `BackgroundTasks` or a Celery task queue to process dispatches asynchronously with automatic exponential backoff retry policies.
2. **Real-Time Delivery Webhook (DLR Tracking):**
   * Implement an incoming webhook endpoint (e.g. `/api/v1/communications/whatsapp/webhook`) to receive delivery status receipts from Meta/Twilio (`sent`, `delivered`, `read`, `failed`). Store receipts in a dedicated `communication_logs` table for KPCTA compliance audits.
3. **Pre-Approved WhatsApp Business Templates (HSM):**
   * In production with Meta WhatsApp Cloud API, initiating a conversation with a tourist outside the 24-hour service window requires pre-approved Highly Structured Message (HSM) templates. Submit the 4 templates through Meta Business Manager for approval.
4. **Number Formatting & Fallback Resilience:**
   * Keep the automatic normalization logic active (e.g. converting local `03xx` numbers to E.164 `+923xx`). If WhatsApp delivery encounters an unregistered number or carrier block, automatically fall back to telecom SMS dispatch.
5. **Security & PII Protection:**
   * Ensure tourist identity numbers (CNIC / Passport) and credit card payment tokens are never included in plain WhatsApp or email bodies. All sensitive information should remain gated behind the encrypted QR pass code and secure portal authentication.
