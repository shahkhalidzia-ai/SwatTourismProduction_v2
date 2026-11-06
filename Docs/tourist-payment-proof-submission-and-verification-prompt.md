# Implementation Prompt: Tourist Proof of Payment Submission & Hotel Front-Desk Verification

## Objective
Implement an end-to-end **Proof of Payment & Transfer Verification Subsystem** in the Swat Tourism Platform (STP).

This feature allows tourists who make direct bank transfers (Meezan, HBL, Allied, etc.) or P2P mobile wallet payments (Easypaisa, JazzCash, Raast) to provide authenticated digital proof of payment. It enables hotel managers and front-desk receptionists to inspect, verify, and approve these payments before locking room inventory and issuing official government-verified travel vouchers.

---

## 1. Functional Requirements & User Journey

### 1.1 Tourist Proof Submission Flow
The tourist must be able to submit payment proof through two distinct user journeys:

#### Journey A: At Checkout Time (`UnifiedCheckoutModal.tsx`)
- When the tourist selects **"Track 2: Direct Hotel Transfer"** as their guarantee mode:
  1. The modal displays the hotel's verified banking credentials (**Bank Name, Account Title, IBAN, Easypaisa/JazzCash Number, and Raast ID**).
  2. The tourist executes the transfer in their own bank/telco mobile app.
  3. The modal presents the **Proof of Payment Form** capturing:
     - **Medium of Payment**: Dropdown (`Easypaisa`, `JazzCash`, `Meezan Bank`, `HBL`, `Allied Bank`, `Bank Alfalah`, `Raast P2P`, `Other Bank IBFT`).
     - **Exact Amount Transferred (PKR)**: Auto-filled with required advance (e.g., PKR 4,800), editable for custom amounts.
     - **Transaction Reference ID (TID / Ref #)**: Required alphanumeric input (e.g., `82910481920` or `MZN-TRF-001`).
     - **Sender Account Title & Number**: e.g., `Shah Khalid (0300-1234567)` or sender IBAN.
     - **Transfer Date & Timestamp**: Date-time selector defaulting to current timestamp.
     - **Proof Screenshot Attachment**: File upload button supporting image formats (`.png`, `.jpg`, `.jpeg`, `.webp`) or PDF receipts up to 5MB.
     - **Tourist Notes**: Optional remarks (e.g., "Transferred from my brother's account").
  4. On submission, the booking transitions to:
     `status = 'requested'` or `'confirmed'` with `payment_status = 'deposit_pending_verification'`.
  5. The tourist receives on-screen confirmation:
     *"Your payment proof has been submitted to Sakoon Resort Kalam. The front desk will verify your transfer and issue your voucher shortly."*

#### Journey B: Post-Booking Submission ("My Bookings" & "Active Trips")
- If the tourist initially created an unpaid booking reservation and transferred money later:
  1. On the booking card in **"My Bookings"** or **"Active Trips"**, a prominent amber pill displays:
     `⚠️ Advance Deposit Pending Verification`
  2. Clicking **`[📤 Upload Payment Slip / TID]`** opens the **Payment Proof Submission Modal**.
  3. Tourist enters the TID, transfer details, attaches the screenshot slip, and submits.

---

### 1.2 Hotel Front-Desk Verification Flow (`HotelTodayScreen.tsx`)
The hotel front-desk staff or manager requires an intuitive, fraud-proof verification cockpit:

1. **Prominent Alert Banner on Front Desk Dashboard**:
   - Any booking with an unverified direct payment displays an attention badge:
     `🔔 New Payment Proof Submitted: Shah Khalid • JazzCash TID: 82910481920 (PKR 4,800)`
2. **Interactive Proof Inspector Modal**:
   - Clicking on the alert opens the **Payment Proof Inspection Modal**:
     - **Proof Slip Preview**: High-resolution image zoom / preview of the bank screenshot.
     - **Transferred Amount**: PKR 4,800 (highlighted in bold green).
     - **Payment Medium**: e.g., *JazzCash Mobile Wallet*.
     - **Transaction Reference (TID)**: Highlighted with a single-click `[Copy TID]` button to facilitate checking the hotel's mobile SMS or bank statement.
     - **Sender Details**: *Shah Khalid (0300-1234567)*.
     - **Transfer Timestamp**: *Nov 06, 2026, 03:15 PM*.
3. **Manager Decision Actions**:
   - **Action 1: `[✓ Approve & Confirm Reservation]`**:
     - Marks payment record in `booking_payments` as `verification_status = 'confirmed'`.
     - Stamped with the receptionist's `verified_by_user_id` and timestamp.
     - Updates `booking.payment_status = 'deposit_paid'` and `booking.status = 'confirmed'`.
     - Triggers automated SMS & WhatsApp notification to the tourist:
       *"Your advance payment of PKR 4,800 has been verified by Sakoon Resort. Your booking SWT-BK-88219 is officially confirmed!"*
     - Generates the official **Digital Guest Voucher** with KPCTA QR code.
   - **Action 2: `[✗ Reject Proof Slip]`**:
     - Opens a rejection dialog prompting the manager to select/enter a reason:
       - *Transaction ID not found in hotel bank account*
       - *Transferred amount is less than required advance deposit*
       - *Illegible / blurry screenshot*
       - *Other custom remarks*
     - Resets booking payment state, notifies tourist to resubmit valid proof, and logs the rejection in the audit history.

---

## 2. Technical Architecture & Endpoints

### 2.1 Backend Endpoints to Implement

```
POST   /api/v1/bookings/{booking_id}/upload-payment-proof
       - Accepts multipart/form-data:
         • proof_file: UploadFile (Image/PDF)
         • payment_medium: str
         • amount_paid: float
         • transaction_ref: str
         • sender_account: str
         • transfer_timestamp: Optional[datetime]
         • notes: Optional[str]
       - Saves uploaded file to persistent storage (/uploads/payment_proofs/)
       - Inserts or updates row in `booking_payments` table:
         • payment_role = 'advance_deposit'
         • funds_custody = 'hotel_operator'
         • verification_status = 'pending_hotel_approval'
         • receipt_image_url = '/uploads/payment_proofs/...'

POST   /api/v1/bookings/{booking_id}/verify-direct-deposit
       - Accepts JSON payload:
         • action: 'approve' | 'reject'
         • notes: Optional[str]
       - Authorizes business owner or authority/admin
       - Transitions booking payment state and dispatches customer notification
```

### 2.2 Database Schema Alignment (`booking_payments`)

The dedicated payment ledger must store the following fields:

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `booking_id` | UUID | Foreign key to parent booking |
| `payment_role` | VARCHAR(30) | `'advance_deposit'` or `'property_balance'` |
| `payment_method` | VARCHAR(30) | `'easypaisa'`, `'jazzcash'`, `'meezan_bank'`, `'raast'`, `'hbl'` |
| `funds_custody` | VARCHAR(30) | `'hotel_operator'` (Property account) |
| `amount` | NUMERIC(12,2) | Exact amount paid in PKR |
| `transaction_ref` | VARCHAR(100) | Bank TID / Reference ID |
| `sender_account_masked` | VARCHAR(100) | Sender phone number or account title |
| `receipt_image_url` | VARCHAR(500) | Path/URL to stored screenshot slip |
| `transfer_timestamp` | TIMESTAMPTZ | Date and time transfer occurred |
| `verification_status` | VARCHAR(30) | `'pending_hotel_approval'`, `'confirmed'`, `'rejected'` |
| `verified_by_user_id` | UUID | User ID of front-desk staff member |
| `notes` | TEXT | Tourist or cashier notes |

---

## 3. Frontend Components & UI Mockups

### 3.1 Components to Enhance or Create:
1. **`PaymentProofUploadModal.tsx`**:
   - Reusable modal component for submitting proof both at checkout and from the tourist bookings list.
   - Includes drag-and-drop file upload zone with thumbnail preview.
2. **`UnifiedCheckoutModal.tsx`**:
   - Integrated proof submission section when "Track 2: Direct Hotel Transfer" is selected.
3. **`PaymentProofInspectorModal.tsx`**:
   - Hotel front-desk modal displaying the full screenshot with zoom, copyable TID, and `[Approve]` / `[Reject]` actions.
4. **`HotelTodayScreen.tsx`**:
   - Direct verification pill with proof preview badge.

---

## 4. Verification & Acceptance Criteria

1. **Tourist Submission**:
   - Tourist can submit a direct payment with an attached screenshot slip, TID, and sender account.
   - The file is saved persistently and linked to the booking.
2. **Front-Desk Inspection**:
   - Hotel front desk sees the submitted TID, sender phone, transfer time, and can view the high-resolution screenshot slip.
3. **Single-Click Approval**:
   - Approving the proof transitions the booking to confirmed and logs the cashier's user ID.
4. **Rejection Handling**:
   - Rejecting with a reason alerts the customer and keeps room availability protected until resolved.
5. **Voucher Generation**:
   - Verified payments immediately show up on the official printable voucher with receipt details.
