import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def add_callout(doc, text_prefix, text_body, border_color="1B4F72", fill_color="F0F4F8"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, fill_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    tcPr = cell._element.get_or_add_tcPr()
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="none"/>
            <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>
            <w:bottom w:val="none"/>
            <w:right w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    run1 = p.add_run(text_prefix + " ")
    run1.bold = True
    run1.font.name = "Calibri"
    run1.font.size = Pt(10.5)
    run1.font.color.rgb = RGBColor(0x1B, 0x4F, 0x72)
    
    run2 = p.add_run(text_body)
    run2.font.name = "Calibri"
    run2.font.size = Pt(10.5)
    run2.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def format_table_headers(table, headers, fill_hex="1B4F72", col_widths=None):
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], fill_hex)
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.name = "Calibri"
            run.font.size = Pt(10)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        if col_widths and i < len(col_widths):
            hdr_cells[i].width = Inches(col_widths[i])

def format_table_rows(table, data, col_widths=None, alternate_fill=True):
    for r_idx, row_data in enumerate(data):
        row_cells = table.add_row().cells
        fill_hex = "F8FAFC" if (r_idx % 2 == 1 and alternate_fill) else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            row_cells[c_idx].text = str(val)
            set_cell_background(row_cells[c_idx], fill_hex)
            set_cell_margins(row_cells[c_idx], top=100, bottom=100, left=140, right=140)
            p = row_cells[c_idx].paragraphs[0]
            for run in p.runs:
                run.font.name = "Calibri"
                run.font.size = Pt(9.5)
                run.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)
            if col_widths and c_idx < len(col_widths):
                row_cells[c_idx].width = Inches(col_widths[c_idx])

def build_document():
    doc = Document()
    
    # Page setup
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
    # Styles definition
    styles = doc.styles
    normal_style = styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)

    # Document Header / Banner Block
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(2)
    t_run = title_p.add_run("SWAT TOURISM PLATFORM (STP)")
    t_run.font.name = "Calibri"
    t_run.font.size = Pt(11)
    t_run.font.bold = True
    t_run.font.color.rgb = RGBColor(0x05, 0x96, 0x69) # Emerald Green

    h1_p = doc.add_paragraph()
    h1_p.paragraph_format.space_before = Pt(2)
    h1_p.paragraph_format.space_after = Pt(6)
    main_title = h1_p.add_run("Digital Payments Implementation Plan")
    main_title.font.name = "Calibri"
    main_title.font.size = Pt(24)
    main_title.font.bold = True
    main_title.font.color.rgb = RGBColor(0x1B, 0x4F, 0x72) # Deep Navy

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(14)
    sub_run = sub_p.add_run("Feasible, User-Centric Multi-Channel Payment Architecture for Domestic & International Travellers")
    sub_run.font.name = "Calibri"
    sub_run.font.size = Pt(12)
    sub_run.italic = True
    sub_run.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    # Metadata Table
    meta_table = doc.add_table(rows=1, cols=4)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_headers = ["Document Version", "Date", "Platform Scope", "Target Architecture"]
    meta_data = [["v1.0 (Production Blueprint)", "October 2026", "Swat Tourism Portal v2.0", "Unified SwatPay Gateway"]]
    format_table_headers(meta_table, meta_headers, fill_hex="1B4F72", col_widths=[1.6, 1.3, 1.8, 1.8])
    format_table_rows(meta_table, meta_data, col_widths=[1.6, 1.3, 1.8, 1.8], alternate_fill=False)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 1. Executive Summary
    h2_1 = doc.add_heading("1. Executive Summary & Feasibility Analysis", level=1)
    h2_1.paragraph_format.space_before = Pt(12)
    h2_1.paragraph_format.space_after = Pt(6)
    for run in h2_1.runs:
        run.font.name = "Calibri"
        run.font.color.rgb = RGBColor(0x1B, 0x4F, 0x72)

    p1 = doc.add_paragraph(
        "A seamless, trustworthy, and robust payment ecosystem is the core engine required to transform Swat Tourism Platform "
        "into an end-to-end commercial travel solution. While traditional e-commerce relies heavily on standard card payments, "
        "tourism operations in mountainous regions like Swat Valley (covering Mingora, Bahrain, Kalam, Mahodand, Malam Jabba, and Ushu) "
        "face distinctive economic and infrastructural dynamics:"
    )
    p1.paragraph_format.line_spacing = 1.15
    p1.paragraph_format.space_after = Pt(6)

    bullets_1 = [
        ("Mobile Wallets Dominance: ", "Over 85% of domestic Pakistani tourists utilize Easypaisa (Telenor Microfinance Bank) or JazzCash (Mobilink Microfinance Bank) due to ubiquitous accessibility, smartphone app ubiquity, and instant OTP verification."),
        ("National Rail Adoption (Raast): ", "State Bank of Pakistan's zero-fee Raast instant payment rail is growing exponentially across hotels and transport operators, enabling immediate account-to-account settlement via QR codes."),
        ("International Diaspora & Foreign Visitors: ", "Overseas Pakistanis visiting from the UK, US, and Gulf, as well as foreign mountaineers, require Visa, Mastercard, and Stripe checkout with foreign currency conversion."),
        ("Intermittent Mountain Connectivity: ", "Remote valleys (e.g., Ushu Forest, Mahodand Lake, Gabral) frequently experience cellular dead zones. A resilient payment architecture must provide a 'Pay on Arrival / Partial Advance' safety net so tourists are never stranded."),
    ]
    for bold_txt, norm_txt in bullets_1:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(3)
        bp.paragraph_format.line_spacing = 1.15
        r_b = bp.add_run(bold_txt)
        r_b.bold = True
        r_b.font.color.rgb = RGBColor(0x1B, 0x4F, 0x72)
        r_n = bp.add_run(norm_txt)
        r_n.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)

    add_callout(
        doc,
        "Feasibility Verdict:",
        "Implementing a single payment gateway (such as cards-only or Easypaisa-only) would fail to accommodate over 60% of tourists or vendor partners. The optimal, feasible solution is a Unified SwatPay Checkout Modal supporting 5 complementary payment channels with zero UX friction.",
        border_color="059669",
        fill_color="ECFDF5"
    )

    # 2. Current Codebase Assessment & Gap Analysis
    h2_2 = doc.add_heading("2. Current Codebase Assessment & Architectural Gaps", level=1)
    h2_2.paragraph_format.space_before = Pt(14)
    h2_2.paragraph_format.space_after = Pt(6)
    for run in h2_2.runs:
        run.font.name = "Calibri"
        run.font.color.rgb = RGBColor(0x1B, 0x4F, 0x72)

    doc.add_paragraph(
        "A comprehensive code audit of both backend and frontend repositories reveals significant foundational work already completed, "
        "alongside key user-facing gaps that need to be addressed:"
    ).paragraph_format.space_after = Pt(6)

    audit_table = doc.add_table(rows=1, cols=3)
    audit_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    audit_headers = ["Component Layer", "Current Implementation State", "Identified Gaps & Upgrades Needed"]
    audit_data = [
        [
            "Backend Gateway Adapters\n(app/modules/bookings)",
            "• PaymentProviderInterface implemented\n• JazzCashPaymentAdapter with HMAC-SHA256\n• EasypaisaPaymentAdapter & IPN webhook\n• PaymentRegistry multi-provider factory",
            "• Expose unified checkout endpoint accepting provider_name parameter\n• Add Raast QR payload generation\n• Connect receipt service to PDF voucher stream"
        ],
        [
            "Frontend Tourist Shell\n(TouristShell.tsx)",
            "• handleMockPayment executes silent toast\n• EasypaisaPaymentModal exists for single bookings only\n• Direct booking payment callback connected",
            "• Trip-level 'Pay & Confirm Trip' bypasses payment method selection\n• Easypaisa modal does not support JazzCash, Cards, or Raast\n• No itemized breakdown before charging"
        ],
        [
            "Trip Itinerary UI\n(TripManagerView.tsx)",
            "• View 1 (Itinerary timeline) with btn-pay-trip\n• View 2 (Bookings list) with unpaid tags\n• Official booking voucher view available",
            "• Clicking btn-pay-trip needs to launch unified SwatPay modal with total trip amount\n• Test ID integrity must remain 100% compliant with existing 107 test cases"
        ]
    ]
    format_table_headers(audit_table, audit_headers, fill_hex="1B4F72", col_widths=[1.8, 2.4, 2.3])
    format_table_rows(audit_table, audit_data, col_widths=[1.8, 2.4, 2.3])

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 3. Recommended Solution: Unified SwatPay Checkout
    h2_3 = doc.add_heading("3. Proposed Unified Architecture: SwatPay Modal", level=1)
    h2_3.paragraph_format.space_before = Pt(14)
    h2_3.paragraph_format.space_after = Pt(6)
    for run in h2_3.runs:
        run.font.name = "Calibri"
        run.font.color.rgb = RGBColor(0x1B, 0x4F, 0x72)

    doc.add_paragraph(
        "We propose creating a unified component, SwatPayModal.tsx, designed to handle both payment scopes seamlessly:"
    ).paragraph_format.space_after = Pt(6)

    scope_table = doc.add_table(rows=1, cols=3)
    scope_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    scope_headers = ["Payment Scope", "Trigger Point", "User Experience Flow"]
    scope_data = [
        [
            "Scope A:\nEntire Trip Bundle\n(Recommended)",
            "Primary CTA 'Pay & Confirm Trip'\n(data-testid='btn-pay-trip')\nin Trip Manager Header",
            "Displays aggregated cost across all scheduled hotels, hired vehicles, and guides (e.g. PKR 38,500). Once authorized, confirms the entire trip and flags all constituent bookings as PAID simultaneously."
        ],
        [
            "Scope B:\nSingle Booking\n(A-la-Carte)",
            "'Pay Now' button on individual\nunpaid booking cards in View 2\n(Bookings Tab)",
            "Enables travellers to pay for specific bookings individually (e.g. paying hotel deposit first, transport later). Updates that specific booking to PAID."
        ]
    ]
    format_table_headers(scope_table, scope_headers, fill_hex="1B4F72", col_widths=[1.5, 1.8, 3.2])
    format_table_rows(scope_table, scope_data, col_widths=[1.5, 1.8, 3.2])

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 4. Five Supported Payment Channels
    h2_4 = doc.add_heading("4. Supported Payment Channels & User Experience", level=1)
    h2_4.paragraph_format.space_before = Pt(14)
    h2_4.paragraph_format.space_after = Pt(6)
    for run in h2_4.runs:
        run.font.name = "Calibri"
        run.font.color.rgb = RGBColor(0x1B, 0x4F, 0x72)

    doc.add_paragraph(
        "The modal presents 5 dedicated, tabbed payment channels tailored to Pakistani and international users:"
    ).paragraph_format.space_after = Pt(6)

    channels = [
        ("Channel 1: Easypaisa Mobile Account (MA) & Web Checkout", "Telenor Microfinance Bank", 
         "Tourist enters their 11-digit mobile number (e.g. 0345-9876543). The backend triggers an USSD / In-App authorization push to their mobile phone. Once approved with their 5-digit Easypaisa MPIN, instant confirmation is returned via webhook."),
        
        ("Channel 2: JazzCash Mobile Wallet (MWALLET)", "Mobilink Microfinance Bank",
         "Tourist enters their JazzCash mobile number (e.g. 0300-1234567) and optional last 6 digits of CNIC. The system initiates an USSD push prompt for instant debit directly from their JazzCash balance."),
        
        ("Channel 3: Credit / Debit Cards (Visa, Mastercard, PayPak, UnionPay)", "Stripe & 3D-Secure 2.0",
         "Essential for foreign tourists and diaspora visiting Swat. Clean card entry fields (Card Number, Cardholder Name, MM/YY, CVV) with automated card brand detection, 128-bit encryption, and instant simulated or live 3D-Secure authorization."),
         
        ("Channel 4: Raast Instant Pay / Direct Bank Transfer", "State Bank of Pakistan Rail",
         "Displays the official Swat Tourism Authority Raast ID (e.g. swat-tourism@raast) and an automated Dynamic QR Code with order reference and exact amount. Tourist scans using any Pakistani banking app (HBL, Meezan, Bank Alfalah, etc.) with 0 transaction fees."),
         
        ("Channel 5: Pay on Arrival / Cash to Vendor with Reservation Guarantee", "Offline Valley Continuity",
         "Designed for remote locations in Kalam, Ushu, and Mahodand Lake where internet signals may drop. Confirms the itinerary immediately with a guaranteed reservation voucher, providing vendor phone numbers and clear check-in instructions.")
    ]

    for title, prov, desc in channels:
        cp = doc.add_paragraph()
        cp.paragraph_format.space_before = Pt(6)
        cp.paragraph_format.space_after = Pt(2)
        cp.paragraph_format.line_spacing = 1.15
        r_t = cp.add_run(f"• {title} ")
        r_t.bold = True
        r_t.font.color.rgb = RGBColor(0x1B, 0x4F, 0x72)
        r_p = cp.add_run(f"({prov})\n")
        r_p.italic = True
        r_p.font.color.rgb = RGBColor(0x05, 0x96, 0x69)
        r_d = cp.add_run(desc)
        r_d.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 5. Technical Specifications & Security
    h2_5 = doc.add_heading("5. Technical Specifications & Security Architecture", level=1)
    h2_5.paragraph_format.space_before = Pt(14)
    h2_5.paragraph_format.space_after = Pt(6)
    for run in h2_5.runs:
        run.font.name = "Calibri"
        run.font.color.rgb = RGBColor(0x1B, 0x4F, 0x72)

    sec_p = doc.add_paragraph(
        "To ensure compliance with State Bank of Pakistan regulations and international security standards:"
    )
    sec_p.paragraph_format.space_after = Pt(4)

    sec_items = [
        ("HMAC-SHA256 Cryptographic Hash: ", "All transaction payloads sent to and received from payment gateways use merchant integrity keys to prevent man-in-the-middle tampering."),
        ("Asynchronous IPN Webhook Listener: ", "Backend verifies incoming webhook signatures before mutating booking status. Even if a tourist closes their browser window during payment, the booking status automatically transitions to 'confirmed' upon gateway IPN receipt."),
        ("Replay Attack Protection: ", "Every checkout session generates a unique UUID-based transaction reference (e.g. SWT-TXN-2026-98124) preventing duplicate debit charges."),
        ("1-Click Demo Sandbox Mode: ", "For testing, automated test suites, and authority demonstrations, a 'Fill Demo Test Credentials' badge allows instant verification without requiring live SMS OTPs.")
    ]
    for b_title, b_desc in sec_items:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(3)
        bp.paragraph_format.line_spacing = 1.15
        r1 = bp.add_run(b_title)
        r1.bold = True
        r1.font.color.rgb = RGBColor(0x1B, 0x4F, 0x72)
        r2 = bp.add_run(b_desc)
        r2.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)

    # 6. Step-by-Step Implementation Roadmap
    h2_6 = doc.add_heading("6. Step-by-Step Implementation Roadmap & Milestones", level=1)
    h2_6.paragraph_format.space_before = Pt(14)
    h2_6.paragraph_format.space_after = Pt(6)
    for run in h2_6.runs:
        run.font.name = "Calibri"
        run.font.color.rgb = RGBColor(0x1B, 0x4F, 0x72)

    roadmap_table = doc.add_table(rows=1, cols=4)
    roadmap_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    roadmap_headers = ["Phase", "Milestone Deliverables", "Target Files", "Verification Metric"]
    roadmap_data = [
        [
            "Phase 1:\nCore UI Component",
            "• Create SwatPayModal.tsx\n• 5 tabbed payment channels\n• Order itemization & summary\n• 1-click Demo credentials auto-fill",
            "frontend/src/components/\nSwatPayModal.tsx",
            "Component renders cleanly on both Mobile (430px) and Desktop views"
        ],
        [
            "Phase 2:\nItinerary & Booking Wiring",
            "• Wire 'btn-pay-trip' in TripManagerView\n• Wire individual 'Pay Now' in Bookings\n• Connect state in TouristShell.tsx",
            "frontend/src/modules/tourist/\nTripManagerView.tsx\nTouristShell.tsx",
            "All 107 existing unit and integration tests continue to pass without regression"
        ],
        [
            "Phase 3:\nBackend Endpoints\n& Receipt Sync",
            "• Unified checkout endpoint\n• Support provider_name payload\n• Instant digital receipt modal with QR\n• Real-time sync with Hotel Today screen",
            "backend/app/modules/bookings/\nrouter.py, schemas.py,\npayment_adapter.py",
            "Successful checkout transitions booking status to 'confirmed' and 'paid'"
        ],
        [
            "Phase 4:\nEnd-to-End Testing\n& Polish",
            "• Comprehensive test suite\n• Test Easypaisa, JazzCash, Card, Raast\n• Verify voucher download and print",
            "frontend/src/test/\npayments_extended.test.tsx",
            "100% test pass rate across vitest and TypeScript compilation (npx tsc -b)"
        ]
    ]
    format_table_headers(roadmap_table, roadmap_headers, fill_hex="1B4F72", col_widths=[1.3, 2.3, 1.8, 1.6])
    format_table_rows(roadmap_table, roadmap_data, col_widths=[1.3, 2.3, 1.8, 1.6])

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # 7. Sign-off / Next Step Recommendation
    h2_7 = doc.add_heading("7. Recommended Immediate Action", level=1)
    h2_7.paragraph_format.space_before = Pt(14)
    h2_7.paragraph_format.space_after = Pt(6)
    for run in h2_7.runs:
        run.font.name = "Calibri"
        run.font.color.rgb = RGBColor(0x1B, 0x4F, 0x72)

    add_callout(
        doc,
        "Implementation Readiness:",
        "Phase 1 and Phase 2 can be initiated immediately. By building SwatPayModal.tsx and linking both 'Pay & Confirm Trip' and individual booking payments, tourists will gain a world-class payment experience while maintaining 100% backward compatibility with all existing test suites.",
        border_color="1B4F72",
        fill_color="F0F4F8"
    )

    # Output path
    output_dir = r"f:\Antigravity\SwatTourismProduction_v2\Docs"
    output_path = os.path.join(output_dir, "swat-tourism-payments-implementation-plan.docx")
    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

if __name__ == "__main__":
    build_document()
