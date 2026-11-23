import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOC_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DOCX = os.path.join(DOC_DIR, "Swat_Tourism_Payment_Models_and_Commission_Architecture.docx")

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
            r.font.color.rgb = RGBColor(0, 122, 85)  # KP Emerald Green
        elif level == 2:
            r.font.size = Pt(12)
            r.font.color.rgb = RGBColor(15, 23, 42)  # Dark Slate
        else:
            r.font.size = Pt(10.5)
            r.font.color.rgb = RGBColor(71, 85, 105) # Slate
    return h

def build_payment_commission_docx():
    doc = Document()

    # 1-inch margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Official Header Banner
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
    run_sub = p_sub.add_run("Payment Models, Commission Engine & Financial Settlement Architecture")
    run_sub.bold = True
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(13)
    run_sub.font.color.rgb = RGBColor(14, 116, 144)

    # Metadata Summary Box
    meta_headers = ["Attribute", "Details"]
    meta_rows = [
        ["Document Reference", "STP-FIN-ARCH-2026-V2 | Strategic Financial Blueprint"],
        ["Subject Matter", "Pay at Property (Cash/POS), Pay Now (Online Escrow), & Commission Settlement"],
        ["Target Platform", "Swat Tourism Platform Production v2 (FastAPI, React 18, PostgreSQL, SBP Raast, 1Link)"],
        ["Global Benchmarks", "Booking.com Agency Model, Agoda/Airbnb Merchant Escrow Model"],
        ["Domestic Compliance", "State Bank of Pakistan (SBP) Raast, 1Link 1Bill, KPRA Sales Tax on Services"],
        ["Primary Audience", "Platform Owners, Finance Team, Lead Engineers, Tourism Authority Leadership"],
        ["Date of Release", "Monday 23 November 2026"]
    ]
    meta_tbl = doc.add_table(rows=1 + len(meta_rows), cols=2)
    meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    format_table(meta_tbl, [Inches(2.2), Inches(4.6)], meta_headers, meta_rows, header_bg="0F172A")
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Executive Summary Callout
    add_callout(
        doc,
        "Executive Summary: Balancing Market Habit with Fintech Modernization",
        "Over 65% of domestic Pakistani travelers visiting Swat (Kalam, Malam Jabba, Mingora) strongly prefer paying cash or "
        "swiping their card at the hotel front desk upon arrival ('Pay at Property'). Simultaneously, high-value tourists, corporate delegations, "
        "and overseas Pakistanis demand seamless online prepayment ('Pay Now Online') with guaranteed room reservations.\n\n"
        "This architectural specification details how the Swat Tourism Platform (STP) executes a dual-rail financial engine that: "
        "\n1. Fully supports Pay at Property without losing commission leakage through automated ledger tracking and monthly 1Link/Raast invoicing. "
        "\n2. Automates Pay Now online payments with instant commission withholding and post-checkout Raast merchant disbursements. "
        "\n3. Introduces 'Automated Balance Offsetting', settling debts between cash commission and online payouts with zero wire transfer friction.",
        bg_color="F0FDF4",
        border_color="007A55",
        icon="💎"
    )

    # Section 1: Comparative Matrix
    add_section_heading(doc, "1. Core Comparative Matrix: Dual Payment Rails", level=1)
    
    p1 = doc.add_paragraph()
    p1.paragraph_format.space_before = Pt(2)
    p1.paragraph_format.space_after = Pt(4)
    p1.add_run(
        "The platform operates two primary financial channels tailored to user intent and operator capabilities:"
    )

    comp_headers = ["Dimension", "Track 1: Pay at Property (Agency Model)", "Track 2: Pay Now Online (Merchant Escrow Model)"]
    comp_rows = [
        [
            "Global Benchmark",
            "Booking.com (Agency Model)",
            "Agoda, Airbnb, Booking.com (Payments by Booking)"
        ],
        [
            "Payment Timing",
            "Upon physical arrival / check-in at property.",
            "100% upfront at the time of reservation on platform."
        ],
        [
            "Payment Instruments",
            "Cash at front desk, hotel POS card swipe, or hotel's own JazzCash/Easypaisa.",
            "Credit/Debit Card (Visa/Master/PayPak), SBP Raast QR, Easypaisa, JazzCash, IBFT Bank Slip."
        ],
        [
            "Custody of Funds",
            "Hotel collects and holds 100% of guest funds directly.",
            "Funds enter Platform Master Escrow Account immediately."
        ],
        [
            "Platform Commission Collection",
            "Logged to Partner Ledger. Billed via Consolidated Monthly Invoice on 1st of each month.",
            "Instant Withholding: Platform retains 10% commission inside escrow immediately at booking."
        ],
        [
            "Merchant Payout Timing",
            "No payout needed (hotel already holds 100%). Hotel pays platform commission.",
            "Net 90% disbursed to hotel's registered IBAN via SBP Raast 24h-48h post check-out."
        ],
        [
            "No-Show Risk Management",
            "Hotel reports no-show within 48h; WhatsApp tourist 1-tap confirmation waives commission.",
            "Non-refundable terms apply; cancellation fee split between platform and property."
        ],
        [
            "Ideal Target Traveler",
            "Domestic families, spontaneous weekend travelers, tourists without active digital banking.",
            "Corporate travelers, overseas Pakistanis, peak-season planners requiring guaranteed rooms."
        ]
    ]
    comp_tbl = doc.add_table(rows=1 + len(comp_rows), cols=3)
    format_table(comp_tbl, [Inches(1.8), Inches(2.5), Inches(2.5)], comp_headers, comp_rows, header_bg="007A55")
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 2: Pay at Property Deep-Dive
    add_section_heading(doc, "2. Track 1: Pay at Property (Agency Model) Deep-Dive", level=1)
    
    p2 = doc.add_paragraph()
    p2.paragraph_format.space_before = Pt(2)
    p2.paragraph_format.space_after = Pt(4)
    p2.add_run(
        "The Pay at Property flow removes all friction for the consumer while ensuring rigorous financial accountability "
        "for the property owner through automated ledgers and standard banking collection channels."
    )

    add_callout(
        doc,
        "Step-by-Step Lifecycle: Pay at Property",
        "Step 1: Reservation Creation — Tourist selects room, dates, and clicks 'Pay at Hotel on Arrival'. Booking status is set to 'confirmed' with payment_status: 'unpaid'. Digital QR Voucher & WhatsApp confirmation are issued.\n\n"
        "Step 2: Physical Check-In & Payment — Tourist arrives at hotel front desk. Hotel receptionist inspects QR voucher and collects 100% room charge (e.g. PKR 15,000) via Cash or POS. Receptionist clicks 'Check In' in Business Portal.\n\n"
        "Step 3: Automated Commission Accrual — Backend triggers a credit entry into Partner Commission Ledger: Commission Owed = Gross Amount x Commission Rate (e.g. PKR 15,000 x 10% = PKR 1,500).\n\n"
        "Step 4: Monthly Consolidated Invoicing (1st of Month) — On the 1st of every month, system compiles all completed stays for the past 30 days into an official KP Tourism Commission Invoice.\n\n"
        "Step 5: 1Link / Raast Settlement — Hotelier receives the invoice on WhatsApp and Email containing a 1Link 1Bill Consumer Number and Raast QR. Hotel pays via mobile banking app by the 15th.",
        bg_color="F8FAFC",
        border_color="0284C7",
        icon="🏨"
    )

    # Section 3: Pay Now Online Deep-Dive
    add_section_heading(doc, "3. Track 2: Pay Now Online (Merchant & Escrow Model) Deep-Dive", level=1)
    
    p3 = doc.add_paragraph()
    p3.paragraph_format.space_before = Pt(2)
    p3.paragraph_format.space_after = Pt(4)
    p3.add_run(
        "The Pay Now online flow provides maximum security for both the tourist and the platform. Funds are held in trust, "
        "guaranteeing the room for the guest while protecting the platform against commission evasion."
    )

    add_callout(
        doc,
        "Step-by-Step Lifecycle: Pay Now Online",
        "Step 1: Multi-Gateway Checkout — Tourist pays 100% online via Debit/Credit Card, Easypaisa, JazzCash, or Direct Bank IBFT with receipt upload. Funds are credited to STP Master Escrow Account.\n\n"
        "Step 2: Instant Commission Withholding — Platform immediately segregates its 10% commission (PKR 1,500 on a PKR 15,000 booking) into its Revenue Account. The net 90% (PKR 13,500) remains in Escrow under 'pending_payout'.\n\n"
        "Step 3: Guaranteed Check-In — Booking is set to status: 'confirmed', payment_status: 'paid'. The hotel cannot re-sell the room, and tourist is guaranteed check-in.\n\n"
        "Step 4: Check-out & 24h Cooling Period — Guest stays and checks out. System marks stay_status: 'checked_out'. A 24-hour dispute window opens allowing the guest to report discrepancies.\n\n"
        "Step 5: Automated SBP Raast Disbursement — 24 to 48 hours post check-out, the system automatically triggers an SBP Raast transfer of PKR 13,500 directly into the hotel's Pakistani IBAN account with zero transaction fees.",
        bg_color="F0FDF4",
        border_color="059669",
        icon="💳"
    )

    # Section 4: Automated Balance Offsetting
    add_section_heading(doc, "4. Innovative Financial Engineering: Automated Balance Offsetting", level=1)
    
    p4 = doc.add_paragraph()
    p4.paragraph_format.space_before = Pt(2)
    p4.paragraph_format.space_after = Pt(4)
    p4.add_run(
        "Hotels receive both cash bookings (where the hotel owes STP commission) and online bookings (where STP owes the hotel "
        "the room payout). Rather than creating administrative friction with bidirectional bank transfers, STP introduces "
        "Automated Balance Offsetting (Zero-Wire Settlement):"
    )

    p_formula = doc.add_paragraph()
    p_formula.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_form = p_formula.add_run("Net Settlement Payout = Online Bookings Pending Payout − Cash Bookings Commission Owed")
    r_form.bold = True
    r_form.font.name = "Arial"
    r_form.font.size = Pt(11)
    r_form.font.color.rgb = RGBColor(15, 23, 42)

    offset_headers = ["Transaction Segment", "Volume / Gross Value", "Financial Direction", "Net Balance"]
    offset_rows = [
        [
            "Online Bookings (5 Stays)",
            "PKR 100,000 Gross (10% commission = PKR 10,000 retained)",
            "STP owes Hotelier Net Room Revenue",
            "+ PKR 90,000 (Creditable to Hotel)"
        ],
        [
            "Cash on Arrival (10 Stays)",
            "PKR 200,000 Gross (Hotel collected 100% at desk)",
            "Hotelier owes STP 10% Platform Commission",
            "− PKR 20,000 (Debited from Hotel)"
        ],
        [
            "Final Reconciled Settlement",
            "15 Completed Bookings Total",
            "System auto-offsets cash commission from online payout",
            "STP disburses Net PKR 70,000 to Hotel"
        ]
    ]
    offset_tbl = doc.add_table(rows=1 + len(offset_rows), cols=4)
    format_table(offset_tbl, [Inches(1.8), Inches(2.2), Inches(1.8), Inches(1.4)], offset_headers, offset_rows, header_bg="0F172A")
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 5: Commission Tiers by Vertical
    add_section_heading(doc, "5. Commission Rate Structure by Tourism Vertical", level=1)
    
    p5 = doc.add_paragraph()
    p5.paragraph_format.space_before = Pt(2)
    p5.paragraph_format.space_after = Pt(4)
    p5.add_run(
        "A flat commission across all operators damages high-overhead micro-businesses. STP establishes differentiated "
        "commission tiers reflecting actual operating margins in the Swat valley:"
    )

    tier_headers = ["Vertical", "Commission Tier", "Industry Comparison", "Settlement Cadence & Logic"]
    tier_rows = [
        [
            "Hotels & Resorts",
            "10% – 12%",
            "Substantially lower than Booking.com's 15%–18%, incentivizing local Mingora & Kalam hoteliers to list.",
            "Monthly Invoice (Cash stays) / 24h–48h post-stay (Online stays)"
        ],
        [
            "4x4 Mountain Jeeps & Transport",
            "5% – 7%",
            "Recognizes heavy fuel costs and mountain suspension wear (Mahodand Lake, Ushu Forest, Gabral Valley).",
            "Weekly settlement (or instant rider-driver cash collection with weekly app top-up)"
        ],
        [
            "Tour Guides & Mountaineers",
            "8% – 10%",
            "Service-oriented with low direct overhead. Empowers certified local youth and mountaineering guides.",
            "Released 24 hours after tour completion verification"
        ],
        [
            "Restaurants & Dining Packages",
            "5%",
            "Low margin food & beverage sector. Applied to table reservations and pre-ordered group meal packages.",
            "Fortnightly or Monthly Invoice"
        ]
    ]
    tier_tbl = doc.add_table(rows=1 + len(tier_rows), cols=4)
    format_table(tier_tbl, [Inches(1.6), Inches(1.2), Inches(2.3), Inches(2.1)], tier_headers, tier_rows, header_bg="007A55")
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 6: No-Show Arbitration & Delinquency Matrix
    add_section_heading(doc, "6. Risk Management, No-Show Arbitration & Delinquency Matrix", level=1)
    
    p6 = doc.add_paragraph()
    p6.paragraph_format.space_before = Pt(2)
    p6.paragraph_format.space_after = Pt(4)
    p6.add_run(
        "To protect the platform from fraudulent no-show claims and ensure prompt commission payment by operators, STP deploys "
        "two proven governance protocols:"
    )

    add_callout(
        doc,
        "No-Show Arbitration Protocol: Preventing Commission Evasion",
        "Problem: An unscrupulous hotel might claim a cash guest never showed up in order to evade paying the 10% platform commission.\n\n"
        "STP Solution:\n"
        "1. 48-Hour Reporting Window: The hotelier must click 'Mark No-Show' within 48 hours of scheduled check-in time.\n"
        "2. Automated 1-Tap WhatsApp Verification: The system automatically dispatches a WhatsApp prompt to the tourist: "
        "'Did you check into Hotel Swat Regency on 20 Nov? [Yes, I checked in] / [No, I cancelled]'.\n"
        "3. Verification Rules:\n"
        "   • If tourist confirms 'No, I did not check in' -> Booking marked 'no_show', PKR 0 commission charged.\n"
        "   • If tourist confirms 'Yes, I checked in' -> Flagged as 'Dispute'. Sent to Admin Panel for front-desk audit.\n"
        "   • If tourist does not reply within 72 hours -> Property report accepted, commission waived.",
        bg_color="FEF3C7",
        border_color="D97706",
        icon="⚖️"
    )

    add_callout(
        doc,
        "4-Stage Delinquency Matrix: For Unpaid Cash Commission Invoices",
        "Stage 1 (Days 1–10): Invoice Issued — Monthly statement delivered via WhatsApp, SMS, and Email with 1Link 1Bill number.\n"
        "Stage 2 (Day 15): Gentle Reminder — Automated WhatsApp alert: 'Invoice due in 5 days. Click to pay via mobile banking.'\n"
        "Stage 3 (Day 20): Soft Enforcement (Search Demotion) — Property visibility ranked below compliant competitors in search.\n"
        "Stage 4 (Day 25): Restriction (Instant Reserve Off) — 'Instant Reserve' locked; hotelier must manually approve each booking.\n"
        "Stage 5 (Day 30): Temporary Listing Pause — Property temporarily unlisted until 1Bill payment clears. (Auto-re-activated immediately upon 1Link webhook confirmation).",
        bg_color="FEF2F2",
        border_color="DC2626",
        icon="🛡️"
    )

    # Section 7: Database & Implementation Blueprint
    add_section_heading(doc, "7. System Implementation Blueprint & Database Additions", level=1)
    
    p7 = doc.add_paragraph()
    p7.paragraph_format.space_before = Pt(2)
    p7.paragraph_format.space_after = Pt(4)
    p7.add_run(
        "To operationalize this model in SwatTourismProduction_v2, the following minimal database additions and UI enhancements "
        "are recommended:"
    )

    db_headers = ["Target Table / Module", "Proposed Columns / Features", "Purpose & Operational Benefit"]
    db_rows = [
        [
            "bookings Table (Schema Extension)",
            "commission_rate (Numeric 4,2, default 0.10)\ncommission_amount (Numeric 12,2)\nsettlement_type ('pay_at_property' | 'pay_now_online')\npayout_status ('pending' | 'offset' | 'disbursed')",
            "Allows precise commission tracking at line-item booking level, supporting variable vertical rates."
        ],
        [
            "commission_ledgers Table (New Model)",
            "id, business_id, booking_id, transaction_type ('debit_commission' | 'credit_online_payout' | 'offset_adjustment'), amount, balance, created_at",
            "Immutable double-entry ledger tracking what the property owes and what the platform owes."
        ],
        [
            "monthly_invoices Table (New Model)",
            "invoice_number, business_id, billing_period, total_commission_owed, total_online_offsets, net_amount_payable, 1link_consumer_id, status ('issued' | 'paid' | 'overdue')",
            "Compiles monthly billing statements with 1Link 1Bill IDs payable across all 34 Pakistani commercial banks."
        ],
        [
            "Business Portal UI (Finance Tab)",
            "Invoices & Commission Ledger Screen featuring:\n• Live Balance Card (Net Payable / Receivable)\n• Automated Offsetting Breakdown\n• Download PDF Tax Invoice (KPRA compliant)\n• 1-Click Raast/1Bill Pay button",
            "Gives hoteliers 100% financial transparency, building long-term trust and eliminating invoice disputes."
        ]
    ]
    db_tbl = doc.add_table(rows=1 + len(db_rows), cols=3)
    format_table(db_tbl, [Inches(1.8), Inches(2.7), Inches(2.3)], db_headers, db_rows, header_bg="007A55")
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Sign-off footer
    p_footer = doc.add_paragraph()
    p_footer.paragraph_format.space_before = Pt(16)
    p_footer.paragraph_format.space_after = Pt(2)
    run_foot = p_footer.add_run("Strategic Blueprint Compiled by: Antigravity AI Engineering Assistant on behalf of KP Tourism Project Team\nDocument Reference: STP-FIN-ARCH-2026-V2 | Swat Tourism Platform Production v2")
    run_foot.font.name = "Arial"
    run_foot.font.size = Pt(8.5)
    run_foot.font.color.rgb = RGBColor(100, 116, 139)

    doc.save(OUTPUT_DOCX)
    print(f"Document successfully created at: {OUTPUT_DOCX}")

if __name__ == "__main__":
    build_payment_commission_docx()

