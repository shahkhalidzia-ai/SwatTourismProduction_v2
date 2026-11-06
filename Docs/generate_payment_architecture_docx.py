import os
import shutil
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="D1D5DB", sz="4", val="single"):
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

def add_callout(doc, title, text, bg_color="F8FAFC", border_color="088395"):
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
    r_title = p.add_run(f"📌 {title}\n")
    r_title.bold = True
    r_title.font.name = "Arial"
    r_title.font.size = Pt(10.5)
    r_title.font.color.rgb = RGBColor(15, 23, 42)
    
    r_text = p.add_run(text)
    r_text.font.name = "Arial"
    r_text.font.size = Pt(9.5)
    r_text.font.color.rgb = RGBColor(51, 65, 85)
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def add_heading_1(doc, text):
    h = doc.add_heading(text, level=1)
    h.paragraph_format.space_before = Pt(16)
    h.paragraph_format.space_after = Pt(6)
    for r in h.runs:
        r.font.name = "Arial"
        r.font.size = Pt(14)
        r.bold = True
        r.font.color.rgb = RGBColor(15, 43, 72) # Navy
    return h

def add_heading_2(doc, text):
    h = doc.add_heading(text, level=2)
    h.paragraph_format.space_before = Pt(12)
    h.paragraph_format.space_after = Pt(4)
    for r in h.runs:
        r.font.name = "Arial"
        r.font.size = Pt(11.5)
        r.bold = True
        r.font.color.rgb = RGBColor(8, 131, 149) # Teal
    return h

def add_body_p(doc, text, bold_prefix=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(5)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.bold = True
        r_pre.font.name = "Arial"
        r_pre.font.size = Pt(9.5)
        r_pre.font.color.rgb = RGBColor(15, 23, 42)
    r = p.add_run(text)
    r.font.name = "Arial"
    r.font.size = Pt(9.5)
    r.font.color.rgb = RGBColor(51, 65, 85)
    return p

def build_payment_architecture_doc():
    doc = Document()
    
    # Page Margins
    for s in doc.sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)

    # Document Header Title
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(2)
    r_title = p_title.add_run("Swat Tourism Platform (STP)")
    r_title.bold = True
    r_title.font.name = "Arial"
    r_title.font.size = Pt(22)
    r_title.font.color.rgb = RGBColor(15, 43, 72)

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(4)
    r_sub = p_sub.add_run("Dual-Track Payment, Checkout, & Commission Architecture Specification")
    r_sub.bold = True
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(14)
    r_sub.font.color.rgb = RGBColor(8, 131, 149)

    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_after = Pt(14)
    r_meta = p_meta.add_run("Comprehensive Operational Blueprint: Platform Escrow vs. Direct Property Transfers, Advance & Check-In Split Folios, Multi-Party Reconciliation & Gap Remediation\n"
                           "Publication Date: November 06, 2026 | Environment: Production V2 | Target: Enterprise Release")
    r_meta.font.name = "Arial"
    r_meta.font.size = Pt(9)
    r_meta.font.color.rgb = RGBColor(100, 116, 139)

    add_callout(
        doc,
        "Executive Architecture Summary",
        "This specification establishes the official financial architecture for the Swat Tourism Platform (STP). "
        "It governs how tourist payments are collected, tracked, and settled across two co-existing rails: "
        "(1) Track 1: Payments processed through the STP Central Platform Escrow (Easypaisa, JazzCash, 1Link, Card), and "
        "(2) Track 2: Direct Payments made to property bank/wallet accounts (Meezan IBAN, Easypaisa, JazzCash, Counter Cash). "
        "It eliminates double-billing, introduces automated commission ledgering, guarantees zero uncollected balances at checkout, "
        "and resolves net month-end settlements between 1Link 1Bill invoices and SBP Raast payouts.",
        bg_color="F0F9FA",
        border_color="088395"
    )

    # SECTION 1
    add_heading_1(doc, "1. Dual-Track Payment Paradigm: Platform Escrow vs. Direct Property")
    add_body_p(doc, 
        "Hospitality and tourism transactions in Pakistan operate under a unique commercial dynamic. While digital platform payments "
        "provide immediate trust and automated guarantees, direct person-to-person (P2P) transfers and physical counter payments remain "
        "dominant. To succeed in Swat Valley, STP does not force a single rail; instead, it natively unifies both rails into a single "
        "coherent financial state machine."
    )

    # Table of Two Tracks
    tbl_tracks = doc.add_table(rows=1, cols=3)
    tbl_tracks.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_tracks)
    hdr_cells = tbl_tracks.rows[0].cells
    hdr_cells[0].width = Inches(1.8)
    hdr_cells[1].width = Inches(2.5)
    hdr_cells[2].width = Inches(2.5)

    headers = ["Evaluation Criteria", "Track 1: Pay via STP Platform", "Track 2: Direct to Property Account"]
    for i, h_text in enumerate(headers):
        set_cell_background(hdr_cells[i], "0F2B48")
        set_cell_margins(hdr_cells[i])
        p = hdr_cells[i].paragraphs[0]
        r = p.add_run(h_text)
        r.bold = True
        r.font.name = "Arial"
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(255, 255, 255)

    track_rows = [
        ("Processor & Gateway", "STP Central Gateway (Easypaisa, JazzCash, 1Link, Card)", "Direct P2P/Merchant Transfer (Property Wallet/Bank)"),
        ("Cash Collector", "Swat Tourism Platform Central Account", "Hotel / Operator Bank Account or Cash Drawer"),
        ("Funds Custody", "STP Escrow Account", "Property / Operator Direct"),
        ("Verification Method", "Automated cryptographic IPN webhook callback", "Tourist submits TID/Slip; Property verifies and confirms"),
        ("Platform Commission", "Retained automatically at source (10% retained by STP)", "Billed to Property via Monthly 1Link 1Bill Invoice"),
        ("Property Disbursement", "Net 90% disbursed to Property via SBP Raast payout", "Rs. 0 needed (Property already received 100% funds)"),
        ("Best Suited For", "Online tourists, credit cards, corporate bookings", "Local bank apps, WhatsApp booking deposits, cash travelers")
    ]

    for row_idx, r_data in enumerate(track_rows):
        row = tbl_tracks.add_row()
        bg = "FFFFFF" if row_idx % 2 == 0 else "F8FAFC"
        for c_idx, val in enumerate(r_data):
            cell = row.cells[c_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            r = p.add_run(val)
            r.font.name = "Arial"
            r.font.size = Pt(8.5)
            if c_idx == 0:
                r.bold = True
                r.font.color.rgb = RGBColor(15, 23, 42)
            else:
                r.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # SECTION 2: SCREENSHOT 1
    add_heading_1(doc, "2. Tourist Checkout & Advance Guarantee Interface (Screen 1)")
    add_body_p(doc, 
        "The newly designed Tourist Unified Checkout Modal provides the tourist with clear, transparent control over their payment method. "
        "The tourist can seamlessly toggle between paying through the STP Platform Escrow (Track 1) or transferring directly to the property's "
        "verified account (Track 2)."
    )

    img_1_path = r"F:\Antigravity\SwatTourismProduction_v2\Docs\payment_screens\tourist_payment_checkout_screen.png"
    if os.path.exists(img_1_path):
        p_img1 = doc.add_paragraph()
        p_img1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img1.paragraph_format.space_before = Pt(6)
        p_img1.paragraph_format.space_after = Pt(4)
        doc.add_picture(img_1_path, width=Inches(6.6))
        
        p_cap1 = doc.add_paragraph()
        p_cap1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap1.paragraph_format.space_after = Pt(10)
        r_cap1 = p_cap1.add_run("Figure 1: High-Fidelity Preview of the Tourist Unified Checkout Screen showing Dual-Track Selection (STP Escrow vs. Direct Hotel Transfer to Meezan Bank/Easypaisa) with Live Folio Summary.")
        r_cap1.font.name = "Arial"
        r_cap1.font.size = Pt(8.5)
        r_cap1.font.italic = True
        r_cap1.font.color.rgb = RGBColor(100, 116, 139)

    add_body_p(doc, "Key Functional Capabilities Illustrated in Figure 1:", bold_prefix="• ")
    add_body_p(doc, "Dual-Rail Selector Tab: Tourists can choose between Track 1 (STP Escrow) and Track 2 (Direct Hotel Transfer).", bold_prefix="1. ")
    add_body_p(doc, "Customizable Advance Guarantee: Option to pay 20% advance deposit (PKR 4,800) or 100% full online prepayment (PKR 24,000).", bold_prefix="2. ")
    add_body_p(doc, "Verified Property Account Card: Automatically reveals the property's verified Meezan Bank IBAN and Easypaisa/Raast ID.", bold_prefix="3. ")
    add_body_p(doc, "TID & Slip Upload Submission: Directly captures the tourist's transaction reference (TID) for front-desk auditing.", bold_prefix="4. ")

    # SECTION 3: FRONT DESK CHECKOUT & SETTLEMENT (SCREEN 2)
    add_heading_1(doc, "3. Front-Desk Folio Settlement & Guest Check-Out (Screen 2)")
    add_body_p(doc, 
        "During guest check-in, in-house stay, and departure, the hotel receptionist operates from the Hotel Today Screen. "
        "The system enforces a strict Folio Settlement Gate: a guest cannot be checked out while an outstanding folio balance remains unsettled."
    )

    img_2_path = r"F:\Antigravity\SwatTourismProduction_v2\Docs\payment_screens\hotel_frontdesk_settlement_screen.png"
    if os.path.exists(img_2_path):
        p_img2 = doc.add_paragraph()
        p_img2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img2.paragraph_format.space_before = Pt(6)
        p_img2.paragraph_format.space_after = Pt(4)
        doc.add_picture(img_2_path, width=Inches(6.6))
        
        p_cap2 = doc.add_paragraph()
        p_cap2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap2.paragraph_format.space_after = Pt(10)
        r_cap2 = p_cap2.add_run("Figure 2: Front-Desk Folio Settlement & Check-Out Terminal in Sakoon Resort Kalam displaying Advance Paid (Track 1 STP Escrow), Remaining Balance Due, Multi-Method Counter Settlement, and Cashier Voucher Audit.")
        r_cap2.font.name = "Arial"
        r_cap2.font.size = Pt(8.5)
        r_cap2.font.italic = True
        r_cap2.font.color.rgb = RGBColor(100, 116, 139)

    add_body_p(doc, "Front-Desk Workflow Features Highlighted in Figure 2:", bold_prefix="• ")
    add_body_p(doc, "Triple Folio Calculation: Transparently displays Total Charges (PKR 24,000), Advance Paid (PKR 4,800), and Outstanding Due (PKR 19,200).", bold_prefix="1. ")
    add_body_p(doc, "Multi-Channel Counter Settlement: Cashier can record payment via Physical Cash, Direct Easypaisa QR, Direct Bank IBFT, or POS Card Swipe.", bold_prefix="2. ")
    add_body_p(doc, "Staff Audit Accountability: Every transaction records the receptionist's user ID and internal voucher slip number.", bold_prefix="3. ")
    add_body_p(doc, "Automated Housekeeping Release: Completing settlement simultaneously marks the physical room for cleaning turnover.", bold_prefix="4. ")

    # SECTION 4: FINANCIAL CONTROL CENTER & RECONCILIATION (SCREEN 3)
    add_heading_1(doc, "4. Authority & Business Financial Control Center (Screen 3)")
    add_body_p(doc, 
        "At the close of each monthly billing cycle, STP's reconciliation engine calculates net settlements. "
        "The system solves the historical double-billing bug by dynamically calculating whether STP holds a surplus or a deficit relative to platform commissions."
    )

    img_3_path = r"F:\Antigravity\SwatTourismProduction_v2\Docs\payment_screens\stp_financial_control_center.png"
    if os.path.exists(img_3_path):
        p_img3 = doc.add_paragraph()
        p_img3.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img3.paragraph_format.space_before = Pt(6)
        p_img3.paragraph_format.space_after = Pt(4)
        doc.add_picture(img_3_path, width=Inches(6.6))
        
        p_cap3 = doc.add_paragraph()
        p_cap3.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap3.paragraph_format.space_after = Pt(10)
        r_cap3 = p_cap3.add_run("Figure 3: STP Authority & Operator Financial Settlement Center for Sakoon Resort Kalam showing Net Settlement Surplus of PKR 12,000 payable to Hotel via SBP Raast, Itemized Stays Ledger, and 1Link 1Bill Reconciliation.")
        r_cap3.font.name = "Arial"
        r_cap3.font.size = Pt(8.5)
        r_cap3.font.italic = True
        r_cap3.font.color.rgb = RGBColor(100, 116, 139)

    add_callout(
        doc,
        "The Universal Net Settlement Formula",
        "Net Settlement Balance = Total Online Advances Held by STP in Escrow - Total Platform Commission Owed (10%)\n\n"
        "• If Balance > 0 (Surplus to Hotel): STP holds more tourist funds than its commission. STP retains its 10% commission "
        "and automatically queues an SBP Raast payout to disburse the remaining net earnings to the hotel.\n"
        "• If Balance < 0 (Deficit to STP): The hotel collected mostly offline cash and direct transfers. STP generates a "
        "1Link 1Bill Monthly Commission Invoice with a 16-digit Consumer ID (1002...). The hotel pays STP via bank app.",
        bg_color="ECFDF5",
        border_color="10B981"
    )

    # SECTION 5: REAL WORLD SCENARIOS MATRIX
    add_heading_1(doc, "5. Real-World Routing Scenarios & Numerical Matrix")
    add_body_p(doc, 
        "The matrix below demonstrates how the reconciliation engine handles every possible combination of advance and balance payments across both tracks:"
    )

    tbl_matrix = doc.add_table(rows=1, cols=5)
    tbl_matrix.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_matrix)
    m_hdrs = tbl_matrix.rows[0].cells
    m_hdrs[0].width = Inches(1.4)
    m_hdrs[1].width = Inches(1.3)
    m_hdrs[2].width = Inches(1.3)
    m_hdrs[3].width = Inches(1.4)
    m_hdrs[4].width = Inches(1.4)

    m_titles = ["Scenario", "Advance Tranche", "Balance Tranche", "Funds Custody", "Reconciliation Action"]
    for i, t_val in enumerate(m_titles):
        set_cell_background(m_hdrs[i], "088395")
        set_cell_margins(m_hdrs[i])
        p = m_hdrs[i].paragraphs[0]
        r = p.add_run(t_val)
        r.bold = True
        r.font.name = "Arial"
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    m_rows = [
        ("100% Direct to Hotel (Cash/IBFT)", "Direct to Hotel (PKR 4,000)", "Direct to Hotel (PKR 16,000)", "Hotel holds PKR 20,000\nSTP holds PKR 0", "STP bills Hotel PKR 2,000 via 1Link 1Bill Invoice"),
        ("100% Online via STP (Full Online)", "Online STP Escrow (PKR 4,000)", "Online STP Escrow (PKR 16,000)", "STP holds PKR 20,000\nHotel holds PKR 0", "STP retains PKR 2,000 commission; disburses PKR 18,000 via Raast"),
        ("Hybrid: Online Advance + Cash Balance", "Online STP Escrow (PKR 4,000)", "Direct to Hotel Cash (PKR 16,000)", "STP holds PKR 4,000\nHotel holds PKR 16,000", "STP retains PKR 2,000 commission; disburses PKR 2,000 surplus via Raast"),
        ("Hybrid: Direct Advance + Online Balance", "Direct to Hotel (PKR 4,000)", "Online STP Escrow (PKR 16,000)", "Hotel holds PKR 4,000\nSTP holds PKR 16,000", "STP retains PKR 2,000 commission; disburses PKR 14,000 net via Raast")
    ]

    for row_idx, r_data in enumerate(m_rows):
        row = tbl_matrix.add_row()
        bg = "FFFFFF" if row_idx % 2 == 0 else "F8FAFC"
        for c_idx, val in enumerate(r_data):
            cell = row.cells[c_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            r = p.add_run(val)
            r.font.name = "Arial"
            r.font.size = Pt(8)
            if c_idx == 0:
                r.bold = True
                r.font.color.rgb = RGBColor(15, 23, 42)
            else:
                r.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # SECTION 6: DATABASE SCHEMA
    add_heading_1(doc, "6. Database Schema Specification: `booking_payments` Table")
    add_body_p(doc, 
        "To replace unstructured text logs inside `bookings.special_requests`, the dedicated `booking_payments` table provides "
        "a normalized, double-entry financial ledger capturing every payment event with exact custody and verification metadata:"
    )

    tbl_schema = doc.add_table(rows=1, cols=4)
    tbl_schema.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_schema)
    s_hdrs = tbl_schema.rows[0].cells
    s_hdrs[0].width = Inches(1.5)
    s_hdrs[1].width = Inches(1.1)
    s_hdrs[2].width = Inches(2.2)
    s_hdrs[3].width = Inches(2.0)

    s_titles = ["Column Name", "Data Type", "Allowed Values / Constraints", "Description & Purpose"]
    for i, t_val in enumerate(s_titles):
        set_cell_background(s_hdrs[i], "0F2B48")
        set_cell_margins(s_hdrs[i])
        p = s_hdrs[i].paragraphs[0]
        r = p.add_run(t_val)
        r.bold = True
        r.font.name = "Arial"
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    schema_rows = [
        ("id", "UUID", "PRIMARY KEY, default uuid4", "Unique payment transaction identifier"),
        ("booking_id", "UUID", "FOREIGN KEY -> bookings(id)", "Associated parent booking record"),
        ("payment_role", "VARCHAR(30)", "'advance_deposit', 'property_balance', 'refund'", "Tranche category of payment"),
        ("collection_stage", "VARCHAR(30)", "'booking_online', 'check_in', 'check_out'", "Operational stage when money was collected"),
        ("track", "VARCHAR(20)", "'stp_platform', 'property_direct'", "Payment rail (Track 1 Escrow vs. Track 2 Direct)"),
        ("payment_method", "VARCHAR(30)", "'easypaisa', 'jazzcash', 'bank_ibft', 'cash', 'card'", "Specific payment instrument used"),
        ("funds_custody", "VARCHAR(30)", "'stp_escrow', 'hotel_operator'", "Entity physically holding the cash funds"),
        ("amount", "NUMERIC(12, 2)", "NOT NULL, > 0.00", "Monetary value transferred in PKR"),
        ("transaction_ref", "VARCHAR(100)", "INDEXED, NOT NULL", "Gateway TID, Bank Transfer Ref, or Cash Receipt #"),
        ("verification_status", "VARCHAR(30)", "'auto_verified', 'pending_hotel_approval', 'confirmed'", "Cryptographic API or Front-Desk verification status"),
        ("verified_by_user_id", "UUID", "FOREIGN KEY -> users(id), NULLABLE", "Receptionist user ID who approved direct transfer"),
        ("created_at", "TIMESTAMPTZ", "DEFAULT CURRENT_TIMESTAMP", "Immutable UTC payment timestamp")
    ]

    for row_idx, r_data in enumerate(schema_rows):
        row = tbl_schema.add_row()
        bg = "FFFFFF" if row_idx % 2 == 0 else "F8FAFC"
        for c_idx, val in enumerate(r_data):
            cell = row.cells[c_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            r = p.add_run(val)
            r.font.name = "Arial"
            r.font.size = Pt(8)
            if c_idx == 0:
                r.bold = True
                r.font.color.rgb = RGBColor(15, 23, 42)
            else:
                r.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # SECTION 7: GAPS & ACTION PLAN
    add_heading_1(doc, "7. Process Gap Remediation & Implementation Action Plan")
    add_body_p(doc, 
        "To achieve seamless production readiness, the engineering team must execute the following 5 prioritized action items:"
    )

    action_items = [
        ("Action Item 1: Eliminate Destructive Overwrite in `collect_balance`",
         "Modify `backend/app/modules/bookings/service.py` so `deposit_amount` is never modified when the counter balance is paid. "
         "Instead, write the counter payment into `property_collected_amount` and insert a record into `booking_payments`."),
        ("Action Item 2: Add Direct Transfer Submission to `UnifiedCheckoutModal.tsx`",
         "Update the checkout modal to show the property's verified Meezan Bank IBAN and Easypaisa wallet when the tourist selects Track 2. "
         "Capture the tourist's sender phone and TID, setting `payment_status = 'deposit_pending_verification'`."),
        ("Action Item 3: Implement Direct Transfer Approval Banner in `HotelTodayScreen.tsx`",
         "Add an amber alert banner on the front-desk dashboard whenever a direct advance payment is awaiting verification. "
         "Provide a single-click [Confirm Receipt] action that marks the booking confirmed."),
        ("Action Item 4: Enforce Folio Balance Settlement Gate at Check-Out",
         "In `HotelTodayScreen.tsx`, block checkout if `deposit_amount + property_collected_amount < total_amount`. "
         "Open the Counter Settlement Modal allowing the cashier to record Cash, POS, or Direct Bank IBFT before releasing the room."),
        ("Action Item 5: Upgrade Monthly Invoice & Payout Generator",
         "In `backend/app/modules/finance/router.py`, implement the Universal Net Settlement Formula. "
         "Automatically deduct platform commissions from online escrow balances and issue SBP Raast payouts for net surpluses.")
    ]

    for title, desc in action_items:
        add_callout(doc, title, desc, bg_color="F8FAFC", border_color="0F2B48")

    # Target Paths
    target_docx_v1 = r"F:\Antigravity\SwatTourismProduction\Docs\swat-tourism-payment-checkout-commission-architecture.docx"
    target_docx_v2 = r"F:\Antigravity\SwatTourismProduction_v2\Docs\swat-tourism-payment-checkout-commission-architecture.docx"
    
    doc.save(target_docx_v1)
    doc.save(target_docx_v2)
    print(f"Document successfully created at:\n- {target_docx_v1}\n- {target_docx_v2}")

if __name__ == "__main__":
    build_payment_architecture_doc()
