# Swat Tourism Platform (STP) — Commission, Billing, Invoicing & Owner Financial Control Architecture

**Document Reference:** `STP-FIN-ARCH-2026-V1`  
**Target Stakeholders:** Executive Board, Platform Owners, System Architects, Finance Directorate  
**Benchmark:** Booking.com Global Dual-Model adapted for Pakistan Tourism Rails (1Link 1Bill, SBP Raast, JazzCash, Easypaisa)  

---

## Executive Summary

The **Swat Tourism Platform (STP)** is a provincial multi-sided marketplace connecting tourists with four primary service verticals:
1. **Accommodations** (Hotels, Resorts, Guest Houses)
2. **Mobility** (4x4 Jeeps, Rental Vans, Coaster Fleets)
3. **Local Experiential Services** (Certified Tour Guides, Trekking Porters)
4. **Gastronomy** (Traditional Restaurants, Riverfront Cafes)

This architecture establishes the **economic engine** of STP, specifying how the platform earns commissions, bills clients, disburses payouts, and allows the platform owner to maintain complete financial governance and debt control.

---

## 1. Booking.com Benchmark: How Global Platforms Manage Commissions

Booking.com operates on a **Hybrid Financial Architecture**:

```
                          BOOKING.COM FINANCIAL MODELS
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
     1. AGENCY MODEL                                       2. MERCHANT MODEL
   ("Pay at Property")                               ("Payments by Booking.com")
            │                                                     │
• Guest pays 100% to Hotel in cash/card.             • Guest pays 100% online to platform.
• Hotel collects full money.                         • Platform deducts commission (e.g. 15%).
• At month-end: Booking.com sends an Invoice.        • Platform pays Net 85% to Hotel
• Hotel pays invoice by 15th of next month.            via Bank Transfer or Virtual Card (VCC).
```

### Key Lessons for Swat Tourism:
* **The Reality of Cash:** In domestic Pakistani tourism, over 65–70% of bookings rely on *Cash on Arrival* / *Pay at Property*. Therefore, STP cannot rely solely on online payment deductions; it must have an automated **Monthly Invoicing and Debt Enforcement** engine.
* **The Need for Net-Offsetting:** When a hotel receives both cash bookings (hotel owes STP) and online bookings (STP owes hotel), the system should automatically offset the balances to minimize wire transfers.

---

## 2. Commission Rate Structure by Vertical

Different tourism verticals have vastly different profit margins. A uniform commission rate creates high friction. STP adopts a **Segmented Commission Model**:

| Business Vertical | Base Commission | Margin Rationale | Billing Frequency |
| :--- | :---: | :--- | :--- |
| **Hotels & Resorts** | **10% – 12%** | High gross margins. Below Booking.com's 15% to drive local hotelier adoption in Mingora, Saidu Sharif, Malam Jabba, and Kalam. | Monthly invoice for Cash / 48h post-checkout for Online. |
| **Transport & 4x4 Jeeps** | **5% – 7%** | Low margin due to high fuel consumption and vehicle wear on unpaved tracks (Mahodand Lake, Utror, Gabral). Lower fee keeps drivers loyal. | Weekly settlement (or immediate split on pre-paid trips). |
| **Tour Guides & Treks** | **8% – 10%** | Service-driven with low direct overhead. Empowers certified local youth and mountaineers. | Released 24h after tour completion verification. |
| **Restaurants & Cafes** | **5%** | Applied to table reservations and pre-ordered group meal packages. | Fortnightly / Monthly invoice. |

---

## 3. Dual Billing & Settlement Channels

### Channel A: Cash on Arrival / Pay at Property (Agency Model)

When tourists pay directly at the front desk or vehicle:

1. **Reconciliation Window (1st to 3rd of Each Month):**
   * Operators review completed bookings in their portal.
   * Legitimate cancellations or no-shows are flagged to avoid unfair commission billing.
2. **Automated Monthly Invoicing (Issued on the 4th):**
   * The system aggregates all completed cash stays and generates an official **Tax Invoice** (PDF).
   * The invoice contains:
     * Itemized booking details (`Guest Name`, `Dates`, `Gross Total`, `Commission Due`).
     * A unique **1Link 1Bill Consumer Number** (e.g., `1002348923480011`).
     * A dynamic **JazzCash / Easypaisa Till QR Code**.
     * Platform Bank Account IBFT details.
3. **Automated Notification Delivery:**
   * Invoices are dispatched automatically via WhatsApp and Email to the business owner and front desk.
4. **Payment Window & Grace Period:**
   * **Due Date:** 15th of the calendar month.
   * **Grace Period:** Until the 20th.

---

### Channel B: Online Pre-Paid Bookings (Merchant Model)

When tourists pay online via Debit/Credit Card, JazzCash, Easypaisa, or Raast QR:

```
[Tourist Pays PKR 10,000 Online via STP Gateway]
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
Platform Commission (10%)       Operator Net Share (90%)
   PKR 1,000 Retained             PKR 9,000 Escrow / Payable
                       │
       ┌───────────────┴───────────────┐
       ▼ (Guest Checks Out Successfully)
Disbursement to Operator via SBP Raast / IBFT
(Directly to Hotel / Driver's Bank Account or Mobile Wallet)
```

1. **Immediate Fee Withholding:** Platform commission (e.g., 10%) is deducted at source upon transaction confirmation.
2. **Escrow Holding:** Net operator balance (90%) is held securely in the STP Master Escrow Account during the stay.
3. **Post-Checkout Release:** 24–48 hours after guest check-out, the net share is transferred directly to the operator's Pakistani bank account or Raast ID.

---

## 4. How the Platform Owner Controls Payments & Commissions

The **Super Admin / Platform Owner** maintains full command over money flows, partner rates, payouts, and non-paying accounts:

### 1. Dynamic Commission Rate Management
* **Platform Sliders:** Adjust base commission rates per vertical at any time.
* **Partner Overrides:** Negotiate custom rates (e.g., 7.5% for high-volume chains like Serena, or 0% launch incentives for the first 30 days for new Kalam drivers).
* **Seasonal Campaigns:** Temporarily lower rates during winter festivals (e.g., Malam Jabba Snow Festival) to encourage operator participation.

### 2. Payout Authorization & Guardrails
* **Maker-Checker Security:** Payout batches exceeding a configurable limit (e.g., > PKR 50,000) require secondary OTP/Password confirmation by the Platform Owner.
* **Freeze Payout Button:** If a guest files a safety or fraudulent service complaint, the owner can freeze the vendor's pending funds with a single click.

### 3. Automated Delinquency Enforcement (The "Kill Switch")
To manage hoteliers or drivers who delay paying their monthly commission:

| Day | System Status | Action Taken |
| :--- | :--- | :--- |
| **Day 1** | Invoice Issued | Invoice delivered with 1Bill Consumer Number via WhatsApp & Email. |
| **Day 10** | Gentle Reminder | Automated reminder: *"5 days remaining before due date"*. |
| **Day 15** | Due Date | Overdue alert triggered. |
| **Day 20** | Grace Period Ends | **Visibility Demotion:** Partner removed from "Top Recommended" and search ranking lowered. |
| **Day 25** | Hard Enforcement | **Instant Booking Blocked:** Property hidden from search until outstanding balance is cleared. |

*The platform owner can manually override penalties, grant extensions, or reinstate partners at any time.*

---

## 5. Dispute, No-Show & Fraud Arbitration

To protect both operators and the platform:

1. **48-Hour No-Show Window:** Hoteliers have 48 hours from the scheduled check-in date to flag a booking as `No-Show`. Verified no-shows incur 0% commission.
2. **Tourist Verification Feedback:** If an operator reports a no-show, the system automatically sends a silent 1-tap query to the tourist: *"Did you check into Hotel X?"*
3. **Arbitration Console:** If a tourist says "Yes" but the hotel claims "No-show", the booking is flagged in the Owner’s Fraud Console for investigation.

---

## 6. Regulatory & KPRA Tax Compliance

In Khyber Pakhtunkhwa, tourism platforms must comply with **Khyber Pakhtunkhwa Revenue Authority (KPRA)** regulations:
* **Withholding Tax:** System automatically computes KPRA Sales Tax on Services on the platform's commission earnings.
* **Tax Invoices:** Monthly commission bills include the official KPRA Registration Number and NTN.
* **Audit Ledger:** Quarter-end and year-end downloadable tax reports for government audit and accounting.

---

## 7. Recommended Implementation Steps

```
[Phase 1: Foundation]
  ├── Define Commission Tables in DB (rates, transactions, invoices, payouts)
  └── Add Bank & Raast Account Fields to Vendor Profiles

[Phase 2: Invoicing & Payment Rails]
  ├── 1Link / 1Bill / Kuickpay Integration for Monthly Invoices
  ├── SBP Raast / 1Link IBFT Integration for Outgoing Operator Payouts
  └── WhatsApp Invoicing Gateway (Auto-send PDF + 1Bill ID)

[Phase 3: Owner Control Center]
  ├── Super Admin Commission Settings Dashboard
  ├── Payout Approval & Escrow Management Panel
  └── Delinquency Enforcement & Penalty Automation Engine
```
