# Swat Tourism Platform (STP) — Payments, Commissions & Invoices Workflow Architecture

**Document Reference:** `STP-PAY-INV-WORKFLOW-2026-V1`  
**Target Audience:** Platform Owners, Finance Directorate, System Architects, Hotel & Transport Associations  
**Benchmark:** Booking.com Global Dual-Model adapted for Pakistani Banking Rails (1Link 1Bill, SBP Raast, JazzCash, Easypaisa)  

---

## Executive Summary

The **Swat Tourism Platform (STP)** operates as a provincial marketplace connecting tourists with four key hospitality verticals:
1. **Hotels & Resorts** (Mingora, Saidu Sharif, Malam Jabba, Kalam)
2. **Transport & 4x4 Mountain Jeeps** (Mahodand, Gabral, Utror, Saifullah Lake routes)
3. **Local Tour Guides & Trekking Porters**
4. **Restaurants & Riverfront Cafes**

This document specifies the complete **Payments, Commissions, Invoicing, and Owner Financial Control Workflow**, establishing how funds flow between tourists, operators, and the platform.

---

## 1. Global Benchmark: Booking.com's Dual Payment Architecture

Booking.com processes tens of billions in annual gross merchandise volume (GMV) using a dual-rail model:

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

### Adaptation for Swat Tourism (Pakistan Market Realities)
* In domestic Pakistani tourism, **65% to 70% of bookings are Cash on Arrival**.
* Local hoteliers and jeep drivers do not use international merchant acquirers or Virtual Credit Cards (VCC).
* STP adapts Booking.com's model using **1Link 1Bill Consumer Numbers**, **SBP Raast Instant Transfers**, and **JazzCash/Easypaisa Merchant QR Codes**.

---

## 2. Commission Rate Structure by Business Vertical

Profit margins vary sharply across tourism sectors. A flat commission creates severe resistance from low-margin operators. STP utilizes a **Differentiated Commission Tier System**:

| Business Vertical | Base Commission | Operational Rationale | Settlement Cycle |
| :--- | :---: | :--- | :--- |
| **Hotels & Resorts** | **10% – 12%** | High gross margins. Set below Booking.com's 15% to drive local hoteliers in Mingora, Malam Jabba, and Kalam to onboard. | Monthly Invoice (Cash) / 48h post-stay (Online) |
| **Transport / 4x4 Jeeps** | **5% – 7%** | High fuel costs and heavy vehicle wear on unpaved mountain tracks (Mahodand Lake, Gabral). Lower fee secures driver loyalty. | Weekly settlement (or immediate split on pre-paid trips) |
| **Tour Guides & Porters** | **8% – 10%** | Service-driven with low direct overhead. Empowers certified local youth and mountain guides. | Released 24h after tour completion verification |
| **Restaurants & Cafes** | **5%** | Applied to table reservations and pre-ordered group meal packages. | Fortnightly / Monthly Invoice |

---

## 3. Workflow A: Cash on Arrival Invoicing Cycle (Agency Model)

```
[Tourist Books Room/Jeep] ──► [Tourist Arrives & Pays 100% Cash to Operator]
                                         │
                                [Stay / Trip Completed]
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼ (1st to 3rd of Month)                         ▼ (4th of Month)
        Reconciliation Window                      Monthly Automated Invoice
  Operator marks No-Shows in Portal        System generates itemized PDF + 1Bill ID
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
                 [Notification sent to Hotel via WhatsApp & Email]
                                         │
                  Operator Pays Commission Invoice via:
                  • 1Link / 1Bill (Kuickpay / Any Bank App)
                  • JazzCash / Easypaisa Till / Merchant QR
                  • Direct Bank IBFT to Swat Tourism Account
                                         │
                       ┌─────────────────┴─────────────────┐
                       ▼                                   ▼
               [Paid by 15th]                     [Unpaid after 20th]
            Status: "Account in Good Standing"   Automated Delinquency Matrix
                                                (Demotion & Instant Reserve Lock)
```

### Detailed Steps:
1. **Cash Collection:** Tourist pays 100% cash directly at the front desk or to the jeep driver upon arrival.
2. **Reconciliation Window (1st – 3rd):** Operator reviews completed bookings and flags any legitimate no-shows or cancellations in the portal.
3. **Automated Invoice Generation (4th):** The system compiles all completed stays, calculates commission owed, and issues an official Tax Invoice (PDF).
4. **1Bill Integration:** Each invoice is assigned a unique **1Link 1Bill Consumer Number** (e.g. `1002348923480011`). The hotel manager opens any Pakistani banking app (HBL, Meezan, Bank of Khyber, Easypaisa), enters the ID, and pays instantly.
5. **Real-Time Settlement:** 1Link fires a webhook to the STP backend, instantly marking the invoice as **"PAID ✓"** and sending a WhatsApp receipt.

---

## 4. Workflow B: Online Pre-Paid Bookings & Operator Payouts (Merchant Model)

```
[Tourist Pays PKR 10,000 Online via STP Gateway (Card / JazzCash / Easypaisa / Raast)]
                                       │
                       ┌───────────────┴───────────────┐
                       ▼                               ▼
          Platform Commission (10%)       Operator Net Share (90%)
             PKR 1,000 Retained             PKR 9,000 Escrow / Payable
                                       │
                       ┌───────────────┴───────────────┐
                       ▼ (Guest Checks Out Successfully)
          Disbursement to Operator via SBP Raast / 1Link IBFT
          (Directly to Hotel / Driver's Bank Account or Mobile Wallet)
```

### Detailed Steps:
1. **Split at Source:** When a tourist pays online, the gateway splits the funds immediately. The 10% platform commission is retained in STP's revenue account.
2. **Escrow Safeguard:** The 90% vendor share is held in the STP Master Escrow Account during the stay to protect tourists against fraudulent cancellations or unfulfilled services.
3. **Automated Disbursement:** Within 24–48 hours after guest check-out, the system automatically disburses the net balance to the operator’s bank account or mobile wallet via **State Bank of Pakistan (SBP) Raast** (instant, zero transaction fee).

---

## 5. How the Platform Owner Controls Payments & Invoices

The **Platform Owner / Tourism Authority** manages all financial levers from the **Super Admin Command Center**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              STP FINANCIAL CONTROL CENTER                              │
├────────────────────┬────────────────────┬────────────────────┬─────────────────────────┤
│  1. Rate Controls  │  2. Balance Offset │  3. Payout Controls│  4. Debt Enforcement    │
│   • Global sliders │   • Auto-netting   │   • Maker-checker  │   • WhatsApp reminders  │
│   • Custom partner │     Cash debt vs   │   • Instant freeze │   • Visibility drop     │
│     overrides      │     Online credit  │   • Raast batches  │   • Instant Reserve lock│
└────────────────────┴────────────────────┴────────────────────┴─────────────────────────┘
```

### Core Owner Capabilities:

1. **Dynamic Commission Sliders:** Adjust base commission rates per vertical with a single click.
2. **Custom Partner Overrides:** Negotiate custom rates (e.g., 7.5% for high-volume enterprise chains like Swat Serena, or 0% launch incentives for the first 30 days for new Kalam drivers).
3. **Automated Net-Offsetting:** If an operator owes PKR 10,000 for cash bookings, but STP owes them PKR 15,000 for online bookings, the system auto-nets the balances, disbursing PKR 5,000 and clearing the debt automatically.
4. **Maker-Checker Security:** Outgoing payout batches exceeding a configurable threshold (e.g., > PKR 50,000) require secondary OTP/Password approval by the Platform Owner.
5. **Instant Escrow Freeze Button:** Lock vendor payouts immediately if a tourist files a serious complaint (breakdown, unsafe conditions, non-delivery of service).

---

## 6. Graduated Debt Escalation Matrix (The "Kill Switch")

To ensure high collection rates on cash booking invoices without alienating local partners:

| Stage | Timeline | System Action | Owner Controls |
| :--- | :--- | :--- | :--- |
| **Stage 1: Issue** | Day 1 (4th) | Invoice issued via WhatsApp & Email with 1Bill Consumer Number. | Owner reviews batch before dispatch. |
| **Stage 2: Gentle Reminder** | Day 10 | Automated WhatsApp alert: *"5 days left before due date"*. | Owner can grant one-click extensions. |
| **Stage 3: Due Date** | Day 15 | Formal overdue notice generated. | Account flagged red in Owner Dashboard. |
| **Stage 4: Grace Period End** | Day 20 | **Visibility Demotion:** Partner removed from "Top Recommended"; search ranking lowered. | Owner can override penalty if valid reason provided. |
| **Stage 5: Hard Enforcement** | Day 25 | **Instant Reserve Blocked:** Property hidden from search until balance reaches PKR 0. | Full toggle: `Reinstate Partner` or `Ban Listing`. |

---

## 7. Dispute, No-Show & Fraud Arbitration

1. **48-Hour Reporting Window:** Hoteliers and drivers have 48 hours post-check-in to report a `No-Show`. Verified no-shows incur 0% commission.
2. **Automated Tourist Cross-Verification:** The system sends an automated 1-tap WhatsApp check to the guest: *"Did you check into Hotel X?"*
3. **Arbitration Console:** If the guest says "Yes" but the hotel reported "No-Show", the booking is flagged in the Owner’s Fraud Console for inquiry, preventing commission evasion.

---

## 8. KPRA Tax Compliance & Provincial Reporting

Under Khyber Pakhtunkhwa Revenue Authority (KPRA) digital marketplace regulations:
* **Withholding Tax:** Automatically calculated on the platform's commission earnings.
* **Compliant Invoices:** Invoices feature official NTN and KPRA registration numbers.
* **Audit Ledgers:** Downloadable quarter-end and year-end ledgers ready for provincial government audits.
