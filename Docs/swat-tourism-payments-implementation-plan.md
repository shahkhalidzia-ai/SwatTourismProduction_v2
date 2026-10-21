# Swat Tourism Platform (STP) — Digital Payments Implementation Plan
**Document Version:** 1.0 (Production Blueprint)  
**Date:** October 2026  
**Scope:** Swat Tourism Platform v2.0  
**Target Solution:** Unified "SwatPay" Multi-Provider Checkout System  
**Word Document Download:** [swat-tourism-payments-implementation-plan.docx](file:///f:/Antigravity/SwatTourismProduction_v2/Docs/swat-tourism-payments-implementation-plan.docx)

---

## 1. Executive Summary & Feasibility Analysis

A seamless, trustworthy, and robust payment ecosystem is the core engine required to transform the Swat Tourism Platform into an end-to-end commercial travel solution. Tourism operations across Swat Valley (covering Mingora, Bahrain, Madyan, Kalam, Mahodand Lake, Malam Jabba, and Ushu) experience specific local dynamics:

1. **Mobile Wallets Dominance**: Over 85% of domestic Pakistani tourists utilize **Easypaisa** (Telenor Microfinance Bank) or **JazzCash** (Mobilink Microfinance Bank) due to smartphone app ubiquity and instant OTP verification.
2. **National Rail Adoption (Raast)**: State Bank of Pakistan's zero-fee Raast instant payment rail is growing exponentially across hospitality businesses and transport fleets, enabling direct account-to-account settlement via QR codes.
3. **International Diaspora & Overseas Visitors**: Foreign tourists and overseas Pakistanis visiting from the UK, US, and UAE require Visa, Mastercard, and Stripe checkout with foreign currency support.
4. **Intermittent Mountain Connectivity**: Remote valleys (e.g., Ushu Forest, Mahodand Lake, Gabral) frequently experience cellular dead zones. A resilient payment architecture must provide a **"Pay on Arrival / Partial Advance"** safety net so tourists are never stranded.

> **Feasibility Verdict**: Implementing a single payment gateway (such as cards-only or Easypaisa-only) would fail to accommodate over 60% of tourists or vendor partners. The optimal, feasible solution is a **Unified SwatPay Checkout Modal** supporting 5 complementary payment channels with zero UX friction.

---

## 2. Current Codebase Assessment & Architectural Gaps

| Component Layer | Current Implementation State | Identified Gaps & Upgrades Needed |
| :--- | :--- | :--- |
| **Backend Gateway Adapters**<br>`(app/modules/bookings)` | • `PaymentProviderInterface` implemented<br>• `JazzCashPaymentAdapter` with HMAC-SHA256<br>• `EasypaisaPaymentAdapter` & IPN webhook<br>• `PaymentRegistry` multi-provider factory | • Expose unified checkout endpoint accepting `provider_name` parameter<br>• Add Raast QR payload generation<br>• Connect receipt service to PDF voucher stream |
| **Frontend Tourist Shell**<br>`(TouristShell.tsx)` | • `handleMockPayment` executes silent toast<br>• `EasypaisaPaymentModal` exists for single bookings only<br>• Direct booking payment callback connected | • Trip-level "Pay & Confirm Trip" bypasses payment method selection<br>• Easypaisa modal does not support JazzCash, Cards, or Raast<br>• No itemized breakdown before charging |
| **Trip Itinerary UI**<br>`(TripManagerView.tsx)` | • View 1 (Itinerary timeline) with `btn-pay-trip`<br>• View 2 (Bookings list) with unpaid tags<br>• Official booking voucher view available | • Clicking `btn-pay-trip` needs to launch unified SwatPay modal with total trip amount<br>• Test ID integrity must remain 100% compliant with existing 107 test cases |

---

## 3. Proposed Unified Architecture: SwatPay Modal

The unified `SwatPayModal.tsx` component is designed to handle both payment scopes seamlessly:

- **Scope A: Entire Trip Bundle (Recommended)**:
  - Triggered by the primary CTA **"Pay & Confirm Trip"** (`data-testid="btn-pay-trip"`) in the Trip Manager Header.
  - Displays aggregated cost across all scheduled hotels, hired vehicles, and guides (e.g. `PKR 38,500`).
  - Once authorized, confirms the entire trip and flags all constituent bookings as `PAID` simultaneously.
- **Scope B: Single Booking (A-la-Carte)**:
  - Triggered by **"Pay Now"** on individual unpaid booking cards in View 2 (Bookings Tab).
  - Enables travellers to pay for specific bookings individually (e.g. paying hotel deposit first, transport later).

---

## 4. Supported Payment Channels & User Experience

1. 🟢 **Channel 1: Easypaisa Mobile Account (MA) & Web Checkout** (*Telenor Microfinance Bank*):
   - Tourist enters their 11-digit mobile number (`0345-9876543`).
   - The backend triggers an USSD / In-App authorization push to their mobile phone.
   - Once approved with their 5-digit Easypaisa MPIN, instant confirmation is returned via webhook.
2. 🔴 **Channel 2: JazzCash Mobile Wallet (MWALLET)** (*Mobilink Microfinance Bank*):
   - Tourist enters their JazzCash mobile number (`0300-1234567`) and optional last 6 digits of CNIC.
   - The system initiates an USSD push prompt for instant debit directly from their JazzCash balance.
3. 💳 **Channel 3: Credit / Debit Cards (Visa, Mastercard, PayPak, UnionPay)** (*Stripe & 3D-Secure 2.0*):
   - Essential for foreign tourists and diaspora visiting Swat.
   - Clean card entry fields (Card Number, Cardholder Name, MM/YY, CVV) with automated card brand detection, 128-bit encryption, and instant simulated or live 3D-Secure authorization.
4. ⚡ **Channel 4: Raast Instant Pay / Direct Bank Transfer** (*State Bank of Pakistan Rail*):
   - Displays the official Swat Tourism Authority Raast ID (`swat-tourism@raast`) and an automated Dynamic QR Code with order reference and exact amount.
   - Tourist scans using any Pakistani banking app (HBL, Meezan, Bank Alfalah, etc.) with 0 transaction fees.
5. 🏔️ **Channel 5: Pay on Arrival / Cash to Vendor with Reservation Guarantee** (*Offline Valley Continuity*):
   - Designed for remote locations in Kalam, Ushu, and Mahodand Lake where internet signals may drop.
   - Confirms the itinerary immediately with a guaranteed reservation voucher, providing vendor phone numbers and clear check-in instructions.

---

## 5. Technical Specifications & Security Architecture

- **HMAC-SHA256 Cryptographic Hash**: All transaction payloads sent to and received from payment gateways use merchant integrity keys to prevent tampering.
- **Asynchronous IPN Webhook Listener**: Backend verifies incoming webhook signatures before mutating booking status. Even if a tourist closes their browser window during payment, the booking status automatically transitions to "confirmed" upon gateway IPN receipt.
- **Replay Attack Protection**: Every checkout session generates a unique UUID-based transaction reference (e.g. `SWT-TXN-2026-98124`) preventing duplicate debit charges.
- **1-Click Demo Sandbox Mode**: For testing, automated test suites, and authority demonstrations, a "Fill Demo Test Credentials" badge allows instant verification without requiring live SMS OTPs.

---

## 6. Implementation Roadmap & Milestones

| Phase | Milestone Deliverables | Target Files | Verification Metric |
| :--- | :--- | :--- | :--- |
| **Phase 1: Core UI Component** | • Create `SwatPayModal.tsx`<br>• 5 tabbed payment channels<br>• Order itemization & summary<br>• 1-click Demo credentials auto-fill | `frontend/src/components/SwatPayModal.tsx` | Component renders cleanly on both Mobile (430px) and Desktop views |
| **Phase 2: Itinerary & Booking Wiring** | • Wire `btn-pay-trip` in `TripManagerView`<br>• Wire individual "Pay Now" in Bookings<br>• Connect state in `TouristShell.tsx` | `frontend/src/modules/tourist/TripManagerView.tsx`<br>`TouristShell.tsx` | All 107 existing unit and integration tests continue to pass without regression |
| **Phase 3: Backend Endpoints & Receipt Sync** | • Unified checkout endpoint<br>• Support `provider_name` payload<br>• Instant digital receipt modal with QR<br>• Real-time sync with Hotel Today screen | `backend/app/modules/bookings/router.py`<br>`schemas.py`, `payment_adapter.py` | Successful checkout transitions booking status to 'confirmed' and 'paid' |
| **Phase 4: End-to-End Testing & Polish** | • Comprehensive test suite<br>• Test Easypaisa, JazzCash, Card, Raast<br>• Verify voucher download and print | `frontend/src/test/payments_extended.test.tsx` | 100% test pass rate across vitest and TypeScript compilation (`npx tsc -b`) |
