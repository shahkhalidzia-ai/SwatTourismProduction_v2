# Swat Tourism Platform (STP) — End-to-End Operational Workflow Architecture

**Document Reference:** `STP-E2E-WORKFLOW-2026-V1`  
**Target Stakeholders:** Platform Owners, Government Authorities, Hoteliers, Transport Associations, Guides, System Engineers  
**Scope:** Complete Operational Workflows (Tourist, Hotel, Transport, Guide, Restaurant, Billing/Commission, Owner Command & Control)

---

## 1. Platform Ecosystem Overview & Topology

The **Swat Tourism Platform (STP)** is a provincial, multi-sided marketplace connecting tourists with four primary commercial verticals and one governing authority:

```
                            SWAT TOURISM PLATFORM ECOSYSTEM
                                           │
      ┌──────────────────┬─────────────────┼─────────────────┬──────────────────┐
      ▼                  ▼                 ▼                 ▼                  ▼
1. TOURIST          2. HOTELS         3. TRANSPORT      4. TOUR GUIDES     5. RESTAURANTS
  (Travelers &       (Hotels, Resorts,  (4x4 Jeeps,       (Certified Guides, (Local Dining,
   Vacationers)       Guest Houses)      Vans, Sedans)     Porters, Treks)    Riverfront Cafes)
      │                  │                 │                 │                  │
      └──────────────────┴─────────────────┼─────────────────┴──────────────────┘
                                           ▼
                       6. PLATFORM OWNER / KP TOURISM AUTHORITY
                           (Command & Control, Escrow, Invoicing,
                            Dispute Arbitration, KPRA Tax)
```

---

## 2. Tourist End-to-End Journey & Workflow

### Phase 1: Exploration & Planning
1. **Interactive Discovery:** Tourist visits the modern responsive portal, browses Swat destinations (Malam Jabba, Kalam, Mahodand Lake, Bahrain, Ushu Forest, Saidu Sharif).
2. **AI Trip Engine:** Optional AI Assistant generates a tailored day-by-day itinerary matching the tourist's budget, party size, and travel style.

### Phase 2: Multi-Service Booking
```
[Select Destination & Dates] ──► [Choose Room / Jeep / Guide] ──► [Review Price Breakdown]
                                                                          │
                                ┌─────────────────────────────────────────┴──────────────┐
                                ▼                                                        ▼
                        Channel A: Cash on Arrival                               Channel B: Online Pre-Paid
                     (Pay 100% Cash at Property / Vehicle)                    (Card / JazzCash / Easypaisa / Raast)
                                │                                                        │
                                └────────────────────────────┬───────────────────────────┘
                                                             ▼
                                             [Booking Confirmed: SWT-B3S01T]
                                                             │
                                        [1-Click WhatsApp & Email Voucher Sent]
```

3. **Room Selection:** Real-time room inventory lookup (e.g. Deluxe River View Room at Swat Serena).
4. **Checkout Options:**
   * **Cash on Arrival:** Instant confirmed booking; tourist pays upon arrival.
   * **Online Advance/Full Payment:** Tourist pays securely via JazzCash, Easypaisa, Raast, or Card.
5. **Instant Delivery:** Confirmation voucher with QR code delivered immediately on screen and via WhatsApp/Email.

### Phase 3: In-Stay Experience & Digital Folio
* Tourist arrives, presents booking reference (`SWT-B3S01T`), checks in, and accesses their dynamic **Digital Folio Receipt** with live charges and WhatsApp concierge support.

---

## 3. Hotel Front Desk Operational Workflow

The hotel front desk workflow is centered on the **Live Room Rack Board** and **Today Screen**:

```
[New Booking Alert] ──► [Hotel Today Screen] ──► [Assign Room & Accept]
                                                            │
                                  ┌─────────────────────────┴─────────────────────────┐
                                  ▼                                                   ▼
                         [Guest Check-in]                                    [Guest No-Show]
                     • Verify identity & voucher                         • Click "Report No-Show"
                     • Provide room key                                  • 48h dispute window
                     • Share WhatsApp folio receipt                      • Zero commission billed
                                  │
                         [Stay Completed & Check-out]
                     • Collect cash balance (if Cash stay)
                     • Mark "Completed" in system
```

### Key Front Desk Capabilities:
* **Live Room Rack Board:** Real-time color-coded room status (Occupied, Reserved, Cleaning, Available).
* **1-Click WhatsApp/Email Dispatch:** Staff can dispatch booking vouchers and checkout folios directly to guests with one click.
* **Delivery Confirmation Badge:** Front desk visibly tracks confirmation delivery status (`✓ WhatsApp & Email Sent`).

---

## 4. Transport & 4x4 Jeep Fleet Operator Workflow

Tailored for Kalam, Mingora, and Mahodand 4x4 drivers and fleet companies:

1. **Fleet Availability:** Driver or fleet manager sets availability and route pricing (e.g., Kalam to Mahodand Lake round trip).
2. **Trip Acceptance:** Driver receives trip dispatch alert with tourist pickup location, passenger count, and preferred time.
3. **Trip Execution:** Driver picks up tourist, completes the mountain route, and collects cash or receives confirmation of pre-paid digital trip.
4. **Completion:** Driver taps **"Trip Completed"**; platform initiates escrow payout or logs cash trip for monthly commission billing.

---

## 5. Tour Guide & Trekking Workflow

Designed for certified local guides in Swat valley:

1. **Tour Package Listing:** Guide lists trekking routes (e.g., Kundol Lake Trek, Spin Khwar, Buddhist Stupas in Mingora).
2. **Reservation Confirmation:** Guide accepts tour request, reviews guest group details, and initiates WhatsApp briefing.
3. **Tour Verification & Payout:** After the trek is finished, tourist taps **"Tour Completed"** in app, unlocking guide fees from escrow within 24 hours.

---

## 6. Financial Engine: Commission, Billing & Invoicing Workflow

Adapted from **Booking.com's dual model** for Pakistani payment channels:

### Commission Matrix by Business Vertical

| Vertical | Base Rate | Rationale | Settlement Cycle |
| :--- | :---: | :--- | :--- |
| **Hotels & Resorts** | **10% – 12%** | Standard accommodation margin (vs Booking.com's 15%). | Monthly Invoice (Cash) / 48h post-stay (Online) |
| **Transport / 4x4 Jeeps** | **5% – 7%** | Lower margin due to fuel and suspension maintenance on rough terrain. | Weekly settlement (or immediate split on pre-paid) |
| **Tour Guides & Porters** | **8% – 10%** | Service-driven; empowers certified youth mountaineers. | Released 24h after tour completion verification |
| **Restaurants & Cafes** | **5%** | Applied to table reservations and pre-ordered group packages. | Fortnightly / Monthly Invoice |

---

### Dual Billing Rails

```
                                  PAYMENT SETTLEMENT CHANNELS
                                               │
            ┌──────────────────────────────────┴──────────────────────────────────┐
            ▼                                                                     ▼
   A. CASH ON ARRIVAL (AGENCY MODEL)                                     B. ONLINE PRE-PAID (MERCHANT MODEL)
            │                                                                     │
• Guest pays 100% Cash to Hotel / Driver.                            • Guest pays 100% Online via STP Gateway.
• Operator keeps full cash on site.                                  • Platform withholds 10% commission at source.
• 1st of Next Month: STP issues Commission Invoice.                   • 90% held in STP Master Escrow Account.
• Invoice includes 1Link 1Bill ID & JazzCash QR.                     • 24-48h post-checkout: Net 90% disbursed
• Operator pays by 15th via mobile banking app.                        directly to Operator via SBP Raast / IBFT.
```

---

## 7. Platform Owner & Authority Governance Workflow

The **Platform Owner / Tourism Authority** manages the entire marketplace through a centralized control console:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              STP OWNER GOVERNANCE CONSOLE                              │
├────────────────────┬────────────────────┬────────────────────┬─────────────────────────┤
│  1. Rate Controls  │  2. Escrow & Payout│  3. Debt Escalation│  4. Dispute & Fraud     │
│   • Global sliders │   • Maker-checker  │   • WhatsApp alerts│   • 48h No-Show review  │
│   • Custom partner │   • Instant freeze │   • Visibility drop│   • Tourist cross-check │
│     overrides      │   • Raast batching │   • Listing suspend│   • KPRA tax reporting  │
└────────────────────┴────────────────────┴────────────────────┴─────────────────────────┘
```

### Graduated Debt Enforcement Matrix (For Unpaid Cash Invoices):
1. **Day 1:** Invoice issued via WhatsApp and Email with 1Bill Consumer Number.
2. **Day 10:** Automated gentle reminder sent.
3. **Day 15:** Due date notice.
4. **Day 20 (Grace Period End):** Listing demoted from "Featured" and search visibility reduced.
5. **Day 25 (Hard Enforcement):** "Instant Reserve" blocked; listing hidden until outstanding commission is paid.
