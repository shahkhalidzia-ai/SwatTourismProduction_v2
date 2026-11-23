import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOC_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DOCX = os.path.join(DOC_DIR, "Swat_Tourism_Stripe_Integration_and_Architecture_Guide.docx")

def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=120, bottom=120, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="CBD5E1", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'  <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:left w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:right w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:insideV w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def format_table(table, col_widths, headers, rows, header_bg="007A55"):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table, color="CBD5E1", sz="4")
    
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], header_bg)
        set_cell_margins(hdr_cells[i], top=130, bottom=130, left=140, right=140)
        p = hdr_cells[i].paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(title)
        run.bold = True
        run.font.name = "Arial"
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(255, 255, 255)
        
    for r_idx, row_data in enumerate(rows):
        row_cells = table.rows[r_idx + 1].cells
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            row_cells[c_idx].width = col_widths[c_idx]
            set_cell_background(row_cells[c_idx], bg)
            set_cell_margins(row_cells[c_idx], top=90, bottom=90, left=130, right=130)
            p = row_cells[c_idx].paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run(str(val))
            run.font.name = "Arial"
            run.font.size = Pt(9.0)
            run.font.color.rgb = RGBColor(30, 41, 59)

def add_callout(doc, title, text, bg_color="F0FDF4", border_color="007A55", icon="📌"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.8)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'  <w:top w:val="none"/>'
        f'  <w:left w:val="single" w:sz="36" w:space="0" w:color="{border_color}"/>'
        f'  <w:bottom w:val="none"/>'
        f'  <w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(2)
    run_t = p.add_run(f"{icon} {title}\n")
    run_t.bold = True
    run_t.font.name = "Arial"
    run_t.font.size = Pt(10.5)
    run_t.font.color.rgb = RGBColor(15, 23, 42)
    
    run_b = p.add_run(text)
    run_b.font.name = "Arial"
    run_b.font.size = Pt(9.5)
    run_b.font.color.rgb = RGBColor(51, 65, 85)
    
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(2)
    p_after.paragraph_format.space_after = Pt(4)

def add_section_heading(doc, title, level=1):
    h = doc.add_heading(title, level=level)
    h.paragraph_format.space_before = Pt(14)
    h.paragraph_format.space_after = Pt(6)
    for r in h.runs:
        r.font.name = "Arial"
        r.bold = True
        if level == 1:
            r.font.size = Pt(14)
            r.font.color.rgb = RGBColor(0, 122, 85)  # KP Emerald
        elif level == 2:
            r.font.size = Pt(12)
            r.font.color.rgb = RGBColor(15, 23, 42)  # Dark Slate
        else:
            r.font.size = Pt(10.5)
            r.font.color.rgb = RGBColor(71, 85, 105) # Muted Slate
    return h

def build_stripe_guide_docx():
    doc = Document()

    # 1-inch margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Official Header
    p_badge = doc.add_paragraph()
    p_badge.paragraph_format.space_before = Pt(0)
    p_badge.paragraph_format.space_after = Pt(2)
    run_badge = p_badge.add_run("GOVERNMENT OF KHYBER PAKHTUNKHWA | KP TOURISM & CULTURE AUTHORITY")
    run_badge.bold = True
    run_badge.font.name = "Arial"
    run_badge.font.size = Pt(8.5)
    run_badge.font.color.rgb = RGBColor(0, 122, 85)

    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(2)
    p_title.paragraph_format.space_after = Pt(4)
    run_main = p_title.add_run("Swat Tourism Platform (STP)")
    run_main.bold = True
    run_main.font.name = "Arial"
    run_main.font.size = Pt(22)
    run_main.font.color.rgb = RGBColor(15, 23, 42)

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(12)
    run_sub = p_sub.add_run("Stripe Payment Gateway & Stripe Connect Marketplace Integration Guide")
    run_sub.bold = True
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(13)
    run_sub.font.color.rgb = RGBColor(14, 116, 144)

    # Metadata Box
    meta_headers = ["Attribute", "Details"]
    meta_rows = [
        ["Document Reference", "STP-PAY-STRIPE-2026-V1 | Technical & Architectural Specification"],
        ["Subject Matter", "Stripe Payment Engine, Stripe Connect Split Fees, Escrow & Marketplace Payouts"],
        ["Target Stack", "React 18 TypeScript Frontend, FastAPI Python Backend, PostgreSQL, Stripe API v2024+"],
        ["Regulatory Context", "International Multi-Currency Processing, PCI-DSS Level 1 Compliance, SBP / Raast Integration"],
        ["Document Purpose", "Engineering Implementation & Executive Commercial Briefing"],
        ["Date of Release", "Monday 23 November 2026"]
    ]
    meta_tbl = doc.add_table(rows=1 + len(meta_rows), cols=2)
    meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    format_table(meta_tbl, [Inches(2.2), Inches(4.6)], meta_headers, meta_rows, header_bg="0F172A")
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Executive Summary Callout
    add_callout(
        doc,
        "Executive Summary: Global Gateway Standards for Tourism Marketplaces",
        "Stripe is the international gold standard for processing digital card payments, trusted by global leaders "
        "including Booking.com, Airbnb, Deliveroo, and Uber. For multi-vendor aggregators like the Swat Tourism Platform (STP), "
        "Stripe provides 'Stripe Connect'—an engine that accepts single checkout payments from tourists and automatically splits "
        "the funds into platform commission (e.g. 10%) and merchant payout (90%).\n\n"
        "This architectural guide explains:\n"
        "1. The foundational mechanics of Stripe (Tokens, PaymentIntents, Webhooks, PCI compliance).\n"
        "2. How Stripe Connect executes automatic commission deduction without manual accounting.\n"
        "3. Step-by-step user journeys for tourists, hoteliers, and platform administrators.\n"
        "4. Concrete code blueprints for our React 18 frontend and FastAPI backend.\n"
        "5. The strategic Pakistan deployment model: combining Stripe for international visitors with local gateways for domestic travelers.",
        bg_color="F0FDF4",
        border_color="007A55",
        icon="🚀"
    )

    # Section 1: How Stripe Works
    add_section_heading(doc, "1. Core Foundation: How Stripe Operates Globally", level=1)
    
    p1 = doc.add_paragraph()
    p1.paragraph_format.space_before = Pt(2)
    p1.paragraph_format.space_after = Pt(4)
    p1.add_run(
        "Historically, accepting credit cards required businesses to handle sensitive 16-digit Primary Account Numbers (PANs), "
        "CVV security codes, and expiration dates—subjecting them to onerous PCI-DSS audit regulations and severe data breach liability. "
        "Stripe revolutionized digital commerce by introducing client-side tokenization and modern cryptographic payment intents:"
    )

    stripe_core_headers = ["Core Mechanism", "Technical Function", "Benefit to Swat Tourism Platform"]
    stripe_core_rows = [
        [
            "Stripe Elements (Client UI)",
            "Secure, pre-built iframe fields hosted directly inside Stripe's secure infrastructure and embedded in React.",
            "Raw card numbers NEVER touch STP servers. The platform achieves PCI-DSS SAQ-A compliance automatically."
        ],
        [
            "PaymentIntent Lifecycle",
            "A server-side object that tracks an entire payment lifecycle: created -> requires_action -> processing -> succeeded.",
            "Handles complex multi-currency conversions (USD, EUR, GBP, AED to PKR) and 3D Secure 2.0 bank OTP prompts."
        ],
        [
            "Cryptographic Webhooks",
            "Asynchronous HTTP POST notifications sent from Stripe to FastAPI signed with an HMAC secret (whsec_...).",
            "Guarantees that bookings are marked 'paid' even if the tourist's internet disconnects after bank approval."
        ],
        [
            "Stripe Radar (AI Fraud Engine)",
            "Machine-learning fraud detector scoring hundreds of behavioral signals in real time.",
            "Automatically blocks stolen credit cards and malicious international transactions with zero manual reviews."
        ]
    ]
    core_tbl = doc.add_table(rows=1 + len(stripe_core_rows), cols=3)
    format_table(core_tbl, [Inches(1.8), Inches(2.6), Inches(2.4)], stripe_core_headers, stripe_core_rows, header_bg="007A55")
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 2: Stripe Connect & Split Payments
    add_section_heading(doc, "2. Marketplace Engine: Stripe Connect & Split Payments", level=1)
    
    p2 = doc.add_paragraph()
    p2.paragraph_format.space_before = Pt(2)
    p2.paragraph_format.space_after = Pt(4)
    p2.add_run(
        "In a conventional single-merchant store, 100% of the funds go into the merchant's account. "
        "In a marketplace like Swat Tourism Platform, three distinct parties exist: the Tourist (Buyer), the Hotel/Guide (Vendor), "
        "and KP Tourism / STP (Platform Operator). Stripe Connect resolves this through two dedicated split models:"
    )

    add_callout(
        doc,
        "Stripe Connect Charge Model: Destination Charges (Recommended for STP)",
        "In Destination Charges, the charge is created on the platform's account, but the funds are immediately routed to the hotel's account, "
        "with the platform deducting its fee upfront:\n\n"
        "• Gross Booking Charge: PKR 20,000 paid by tourist via card.\n"
        "• Application Fee (Platform Commission): PKR 2,000 (10%) retained in STP platform bank account.\n"
        "• Net Transfer: PKR 18,000 (90%) delivered to Hotel's connected account.\n"
        "• Result: Zero manual accounting. No invoices, no wire transfers, and no risk of non-payment by the hotelier.",
        bg_color="F8FAFC",
        border_color="0284C7",
        icon="⚡"
    )

    split_headers = ["Model Type", "How Money Moves", "Best Use Case in STP"]
    split_rows = [
        [
            "Destination Charges (Direct Split)",
            "Tourist pays STP; Stripe immediately splits fee to STP (10%) and net (90%) to Hotel.",
            "Standard online prepaid hotel stays where funds are transferred instantly to the hotel."
        ],
        [
            "Separate Charges & Transfers (Escrow Split)",
            "Tourist pays STP; 100% is held in STP Master Escrow. Upon guest check-out, backend calls stripe.Transfer.create() to send 90% to Hotel.",
            "High-security bookings, multi-day tours, or 4x4 mountain excursions requiring post-service completion verification."
        ]
    ]
    split_tbl = doc.add_table(rows=1 + len(split_rows), cols=3)
    format_table(split_tbl, [Inches(1.8), Inches(2.7), Inches(2.3)], split_headers, split_rows, header_bg="0F172A")
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 3: End-to-End Operational Lifecycle
    add_section_heading(doc, "3. End-to-End Operational Lifecycle in Swat Tourism Platform", level=1)
    
    lifecycle_headers = ["Phase", "Actor & Interface", "System Action & Data Flow"]
    lifecycle_rows = [
        [
            "1. Hotel Onboarding",
            "Hotelier in Business Portal",
            "Hotelier clicks 'Setup Payouts with Stripe'. Enters business registration and bank account details. Stripe issues a verified acct_XXXX identifier saved to business_profiles.stripe_account_id."
        ],
        [
            "2. Room Reservation",
            "Tourist on Hotel Property Page",
            "Tourist selects Deluxe Valley Suite, enters dates, selects 'Pay Now Online (Card)'. Frontend calls FastAPI /api/v1/payments/stripe/create-intent."
        ],
        [
            "3. Intent Generation",
            "FastAPI Backend",
            "Backend creates PaymentIntent specifying amount (PKR 25,000), application_fee_amount (PKR 2,500), and destination: hotel.stripe_account_id. Returns client_secret to frontend."
        ],
        [
            "4. Card Authorization",
            "Tourist & Bank",
            "Tourist inputs card details in Stripe PaymentElement. Tourist completes 3D Secure 2.0 OTP authentication via their issuing bank."
        ],
        [
            "5. Webhook Confirmation",
            "Stripe -> FastAPI Webhook",
            "Stripe dispatches payment_intent.succeeded event. FastAPI verifies signature, updates bookings.payment_status = 'paid', and dispatches WhatsApp Boarding Pass."
        ],
        [
            "6. Payout & Commission",
            "Stripe Banking Rails",
            "PKR 2,500 lands in STP Tourism Authority bank account. PKR 22,500 lands in Hotelier's bank account on a 2-day rolling payout cycle."
        ]
    ]
    life_tbl = doc.add_table(rows=1 + len(lifecycle_rows), cols=3)
    format_table(life_tbl, [Inches(1.6), Inches(2.3), Inches(2.9)], lifecycle_headers, lifecycle_rows, header_bg="007A55")
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 4: Technical Code Architecture
    add_section_heading(doc, "4. Technical Code Implementation: FastAPI & React 18", level=1)
    
    p4 = doc.add_paragraph()
    p4.paragraph_format.space_before = Pt(2)
    p4.paragraph_format.space_after = Pt(4)
    p4.add_run(
        "Integrating Stripe into the existing codebase requires two lightweight modules:"
    )

    add_callout(
        doc,
        "Backend Implementation: FastAPI Endpoint (backend/app/modules/payments/stripe_router.py)",
        "import stripe\n"
        "from fastapi import APIRouter, HTTPException, Request\n"
        "from app.core.config import settings\n\n"
        "stripe.api_key = settings.STRIPE_SECRET_KEY\n"
        "router = APIRouter(prefix='/api/v1/payments/stripe', tags=['Stripe Payments'])\n\n"
        "@router.post('/create-intent')\n"
        "async def create_payment_intent(booking_id: str, db: Session = Depends(get_db)):\n"
        "    booking = get_booking(db, booking_id)\n"
        "    commission_rate = 0.10 # 10% platform commission\n"
        "    total_paisa = int(booking.total_amount * 100)\n"
        "    fee_paisa = int(total_paisa * commission_rate)\n\n"
        "    intent = stripe.PaymentIntent.create(\n"
        "        amount=total_paisa,\n"
        "        currency='pkr',\n"
        "        payment_method_types=['card'],\n"
        "        application_fee_amount=fee_paisa,\n"
        "        transfer_data={'destination': booking.business.stripe_account_id},\n"
        "        metadata={'booking_ref': booking.reference, 'tourist_id': str(booking.tourist_id)}\n"
        "    )\n"
        "    return {'clientSecret': intent.client_secret, 'publicKey': settings.STRIPE_PUBLISHABLE_KEY}",
        bg_color="F8FAFC",
        border_color="0F172A",
        icon="💻"
    )

    add_callout(
        doc,
        "Frontend Implementation: React 18 Component (frontend/src/components/StripeCheckoutModal.tsx)",
        "import { loadStripe } from '@stripe/stripe-js';\n"
        "import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';\n\n"
        "const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);\n\n"
        "export function StripeCheckoutForm({ clientSecret, onSuccess }) {\n"
        "  const stripe = useStripe();\n"
        "  const elements = useElements();\n\n"
        "  const handleSubmit = async (e) => {\n"
        "    e.preventDefault();\n"
        "    if (!stripe || !elements) return;\n"
        "    const { error, paymentIntent } = await stripe.confirmPayment({\n"
        "      elements,\n"
        "      confirmParams: { return_url: window.location.origin + '/booking-success' },\n"
        "      redirect: 'if_required'\n"
        "    });\n"
        "    if (paymentIntent && paymentIntent.status === 'succeeded') {\n"
        "      onSuccess(paymentIntent.id);\n"
        "    }\n"
        "  };\n"
        "  return (\n"
        "    <form onSubmit={handleSubmit}>\n"
        "      <PaymentElement />\n"
        "      <button type='submit' className='btn-confirm-reserve'>Pay Now & Guaranteed Reserve</button>\n"
        "    </form>\n"
        "  );\n"
        "}",
        bg_color="F0FDF4",
        border_color="007A55",
        icon="🖥️"
    )

    # Section 5: Pakistan Market Reality & Hybrid Strategy
    add_section_heading(doc, "5. Pakistan Market Integration: The Recommended Hybrid Architecture", level=1)
    
    add_callout(
        doc,
        "Strategic Ground Reality: Direct Stripe Support in Pakistan",
        "Important Note: Stripe does NOT currently allow domestic Pakistani entities without a foreign legal presence "
        "to open direct merchant accounts in Pakistan. However, tourists flock to Swat from both domestic cities (Lahore, Karachi, Islamabad) "
        "and international origins (Overseas Pakistani diaspora, international mountaineers, foreign cultural tourists).\n\n"
        "To achieve maximum payment coverage, STP employs a multi-rail architecture:",
        bg_color="FEF3C7",
        border_color="D97706",
        icon="⚠️"
    )

    hybrid_headers = ["Customer Segment", "Primary Gateway", "Payment Channels Accepted", "Payout Settlement Rail"]
    hybrid_rows = [
        [
            "Overseas Tourists & Foreign Visitors",
            "Stripe",
            "International Visa, MasterCard, American Express, Apple Pay, Google Pay",
            "Stripe Connect automated bank transfer to international IBAN or STP Treasury."
        ],
        [
            "Domestic Pakistani Online Travelers",
            "PayFast / Safepay / JazzCash / Easypaisa",
            "Pakistani Visa/Mastercard debit cards, PayPak cards, JazzCash / Easypaisa mobile wallets",
            "State Bank of Pakistan (SBP) Raast instant P2M clearing (zero transaction fee)."
        ],
        [
            "Domestic Walk-In / Cash Travelers",
            "Pay at Property (Front Desk)",
            "Cash, Hotel Front Desk POS card swipe upon arrival",
            "100% collected by hotel; 10% platform commission billed monthly via 1Link 1Bill."
        ]
    ]
    hyb_tbl = doc.add_table(rows=1 + len(hybrid_rows), cols=4)
    format_table(hyb_tbl, [Inches(1.7), Inches(1.5), Inches(2.2), Inches(1.4)], hybrid_headers, hybrid_rows, header_bg="0E7490")
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 6: Refunds, Disputes & Chargeback Protection
    add_section_heading(doc, "6. Refunds, Cancellations & Chargeback Protection", level=1)
    
    p6 = doc.add_paragraph()
    p6.paragraph_format.space_before = Pt(2)
    p6.paragraph_format.space_after = Pt(4)
    p6.add_run(
        "Handling customer cancellations and disputes is completely automated under Stripe:\n"
        "• Tourist Cancellation within Free Window (e.g. >24h before check-in): System calls stripe.Refund.create(payment_intent=...). "
        "Stripe reverses the gross charge, returns the funds to the tourist's card, and automatically pulls back the transfer to the hotel.\n"
        "• Late Cancellation with Fee: If a 50% cancellation policy applies, system refunds 50% and captures 50%, splitting the captured amount "
        "between platform commission and hotel compensation.\n"
        "• Chargeback Protection: If a customer files a fraudulent bank chargeback, Stripe Radar compiles evidence (IP address, booking log, "
        "WhatsApp voucher delivery, room check-in timestamp) and submits it automatically to the credit card network."
    )

    # Section 7: Database Schema Additions
    add_section_heading(doc, "7. Database Schema Additions for Stripe", level=1)
    
    db_headers = ["Table", "Field to Add", "Type & Description"]
    db_rows = [
        ["business_profiles", "stripe_account_id", "String(100), nullable: Connected Stripe Account ID (e.g. acct_1N0X...)."],
        ["business_profiles", "stripe_payouts_enabled", "Boolean, default False: Whether hotel is verified for automatic Stripe payouts."],
        ["bookings", "stripe_payment_intent_id", "String(100), index: Stripe PaymentIntent reference (e.g. pi_3Mtw...)."],
        ["bookings", "stripe_charge_id", "String(100), nullable: Actual charge ID generated upon successful capture."],
        ["booking_payments", "gateway_provider", "String(30), default 'stripe': Differentiates 'stripe', 'easypaisa', 'payfast', 'cash'."],
        ["stripe_webhook_events", "New Table", "Tracks event_id, event_type, payload JSON, processed_at (prevents duplicate webhook replays)."]
    ]
    db_tbl = doc.add_table(rows=1 + len(db_rows), cols=3)
    format_table(db_tbl, [Inches(1.8), Inches(2.0), Inches(3.0)], db_headers, db_rows, header_bg="0F172A")
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Footer
    p_footer = doc.add_paragraph()
    p_footer.paragraph_format.space_before = Pt(16)
    p_footer.paragraph_format.space_after = Pt(2)
    run_foot = p_footer.add_run("Architecture Specification Compiled by: Antigravity AI Engineering Assistant on behalf of KP Tourism Project Team\nDocument Reference: STP-PAY-STRIPE-2026-V1 | Swat Tourism Platform Production v2")
    run_foot.font.name = "Arial"
    run_foot.font.size = Pt(8.5)
    run_foot.font.color.rgb = RGBColor(100, 116, 139)

    doc.save(OUTPUT_DOCX)
    print(f"Stripe Integration Guide successfully created at: {OUTPUT_DOCX}")

if __name__ == "__main__":
    build_stripe_guide_docx()

