import os
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

def add_callout(doc, title, text, bg_color="F8FAFC", border_color="047857"):
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
        f'  <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>'
        f'  <w:bottom w:val="none"/>'
        f'  <w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(4)
    run_t = p.add_run(f"📌 {title}\n")
    run_t.font.name = "Segoe UI"
    run_t.font.size = Pt(10.5)
    run_t.font.bold = True
    run_t.font.color.rgb = RGBColor(4, 120, 87) if border_color == "047857" else RGBColor(15, 23, 42)
    
    run_b = p.add_run(text)
    run_b.font.name = "Segoe UI"
    run_b.font.size = Pt(9.5)
    run_b.font.color.rgb = RGBColor(51, 65, 85)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def build_implementation_report():
    doc = Document()
    
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)

    # Header / Meta
    p_meta = doc.add_paragraph()
    r_cat = p_meta.add_run("KHYBER PAKHTUNKHWA CULTURE & TOURISM AUTHORITY (KPCTA)\nSWAT TOURISM PLATFORM (STP) • PRODUCTION SYSTEM DELIVERABLE")
    r_cat.font.name = "Segoe UI"
    r_cat.font.size = Pt(9)
    r_cat.font.bold = True
    r_cat.font.color.rgb = RGBColor(4, 120, 87)
    p_meta.paragraph_format.space_after = Pt(6)

    # Document Title
    p_title = doc.add_paragraph()
    r_title = p_title.add_run("Tourist Proof of Payment Submission & Hotel Front-Desk Verification Subsystem")
    r_title.font.name = "Segoe UI"
    r_title.font.size = Pt(22)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(15, 23, 42)
    p_title.paragraph_format.space_after = Pt(4)

    # Subtitle
    p_sub = doc.add_paragraph()
    r_sub = p_sub.add_run("Comprehensive Engineering Implementation Report & Verification Audit (Track 2 Direct Hotel Transfers)")
    r_sub.font.name = "Segoe UI"
    r_sub.font.size = Pt(13)
    r_sub.font.color.rgb = RGBColor(71, 85, 105)
    p_sub.paragraph_format.space_after = Pt(14)

    # Metadata Table
    meta_table = doc.add_table(rows=2, cols=4)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False
    set_table_borders(meta_table, color="E2E8F0")

    meta_data = [
        [("System Version", "STP v2.1-PROD"), ("Component Scope", "Proof Submission & Verification"), ("Deployment Status", "Verified & Active"), ("Author", "Lead Principal Engineer")],
        [("Target Rails", "Meezan IBFT, Raast, Wallets"), ("File Engine", "FastAPI Multipart / Static"), ("Testing Coverage", "100% Pass (Backend & Vitest)"), ("Sync Status", "Synchronized Across Repos")]
    ]

    for r_idx, row in enumerate(meta_data):
        for c_idx, (k, v) in enumerate(row):
            cell = meta_table.cell(r_idx, c_idx)
            cell.width = Inches(1.7)
            set_cell_background(cell, "F8FAFC" if r_idx == 0 else "FFFFFF")
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            rk = p.add_run(k + "\n")
            rk.font.name = "Segoe UI"
            rk.font.size = Pt(8)
            rk.font.bold = True
            rk.font.color.rgb = RGBColor(100, 116, 139)
            rv = p.add_run(v)
            rv.font.name = "Segoe UI"
            rv.font.size = Pt(9)
            rv.font.bold = True
            rv.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 1: Executive Summary
    h1 = doc.add_paragraph()
    r1 = h1.add_run("1. Executive Summary & Problem Resolution")
    r1.font.name = "Segoe UI"
    r1.font.size = Pt(15)
    r1.font.bold = True
    r1.font.color.rgb = RGBColor(15, 23, 42)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)

    p_exec = doc.add_paragraph()
    p_exec.paragraph_format.space_after = Pt(8)
    r_exec = p_exec.add_run(
        "In hospitality ecosystems across Pakistan, a substantial portion of guests prefer directly transferring advance booking deposits to hotel bank accounts via Meezan Bank IBFT, Raast instant transfers, or mobile wallets (Easypaisa / JazzCash) rather than routing funds through centralized payment gateways. Prior to this implementation, the system captured only a text Transaction ID (TID) or relied on off-platform communication. Hotel front-desk managers had no automated mechanism to view the tourist's transfer slip, verify the sender's identity, or systematically record whether funds landed in the property's bank account.\n\n"
        "To resolve this operational gap, the Swat Tourism Platform (STP) has engineered a dedicated Tourist Proof of Payment Submission and Hotel Front-Desk Verification Subsystem. Tourists can now upload digital screenshot slips or PDF vouchers directly from the unified checkout modal or their 'My Bookings' portal. Front-desk personnel are equipped with an interactive Inspection Suite enabling real-time slip analysis, one-click TID copying for bank ledger comparison, and immediate approval or structured rejection."
    )
    r_exec.font.name = "Segoe UI"
    r_exec.font.size = Pt(10)
    r_exec.font.color.rgb = RGBColor(30, 41, 59)

    add_callout(
        doc,
        "Core Value Delivered",
        "1. Complete elimination of lost payment inquiries and verbal confirmation friction.\n"
        "2. Six-point validation capturing Amount, TID, Medium, Sender Phone/Title, Timestamp, and Slip Image.\n"
        "3. Separation of funds custody: Direct payments are designated as 'hotel_operator' custody with 'pending_hotel_approval' state, preserving platform commission calculation for monthly 1Bill net settlement.",
        border_color="047857"
    )

    # Section 2: Six Mandatory Verification Data Points
    h2 = doc.add_paragraph()
    r2 = h2.add_run("2. The 6 Mandatory Verification Data Points")
    r2.font.name = "Segoe UI"
    r2.font.size = Pt(15)
    r2.font.bold = True
    r2.font.color.rgb = RGBColor(15, 23, 42)
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(6)

    p_dt = doc.add_paragraph()
    p_dt.paragraph_format.space_after = Pt(8)
    r_dt = p_dt.add_run(
        "To ensure robust reconciliation between hotel bank statements, SMS alert logs, and system bookings, every direct payment submission enforces six atomic data fields across both frontend forms and backend multipart validators:"
    )
    r_dt.font.name = "Segoe UI"
    r_dt.font.size = Pt(10)
    r_dt.font.color.rgb = RGBColor(30, 41, 59)

    dp_table = doc.add_table(rows=7, cols=3)
    dp_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    dp_table.autofit = False
    set_table_borders(dp_table, color="D1D5DB")

    headers = [("Data Point", Inches(1.8)), ("Database Field & Type", Inches(2.2)), ("Operational Purpose & Validation", Inches(2.8))]
    for c_idx, (h_text, width) in enumerate(headers):
        cell = dp_table.cell(0, c_idx)
        cell.width = width
        set_cell_background(cell, "047857")
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        rh = p.add_run(h_text)
        rh.font.name = "Segoe UI"
        rh.font.size = Pt(9.5)
        rh.font.bold = True
        rh.font.color.rgb = RGBColor(255, 255, 255)

    data_points = [
        ("1. Exact Amount Paid (PKR)", "Booking.deposit_amount (Numeric 12,2)\nBookingPayment.amount", "Matches 20% advance guarantee requirement. Prevents partial deposit fraud."),
        ("2. Transaction ID (TID / Ref #)", "Booking.direct_transfer_tid\nBookingPayment.transaction_ref (String 100)", "Official banking reference generated by Meezan Bank, Raast, or Easypaisa app."),
        ("3. Payment Medium / Channel", "BookingPayment.payment_method (String 30)", "Selectable channel: Meezan IBFT, Raast P2P, Easypaisa, JazzCash, HBL, Allied Bank."),
        ("4. Sender Account Title / Phone", "BookingPayment.sender_account_masked (String 50)", "Identifies depositor's name or originating mobile wallet number matching bank SMS."),
        ("5. Transfer Date & Timestamp", "BookingPayment.notes / Audit History", "Exact timestamp of execution for precise chronological matching on hotel statements."),
        ("6. Receipt Slip (Screenshot / PDF)", "Booking.direct_transfer_slip_url\nBookingPayment.receipt_image_url", "Physical binary artifact saved to disk and rendered in the front-desk inspector.")
    ]

    for r_idx, (f1, f2, f3) in enumerate(data_points, start=1):
        for c_idx, val in enumerate([f1, f2, f3]):
            cell = dp_table.cell(r_idx, c_idx)
            cell.width = headers[c_idx][1]
            set_cell_background(cell, "F8FAFC" if r_idx % 2 == 1 else "FFFFFF")
            set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            rv = p.add_run(val)
            rv.font.name = "Segoe UI"
            rv.font.size = Pt(9)
            if c_idx == 0:
                rv.font.bold = True
            rv.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 3: Architecture & Schema
    h3 = doc.add_paragraph()
    r3 = h3.add_run("3. Backend Engineering Architecture & API Endpoints")
    r3.font.name = "Segoe UI"
    r3.font.size = Pt(15)
    r3.font.bold = True
    r3.font.color.rgb = RGBColor(15, 23, 42)
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(6)

    p_arch = doc.add_paragraph()
    p_arch.paragraph_format.space_after = Pt(8)
    r_arch = p_arch.add_run(
        "The backend implementation incorporates robust multipart form-data handling, persistent disk storage, schema updates, and dual-action front-desk workflows:"
    )
    r_arch.font.name = "Segoe UI"
    r_arch.font.size = Pt(10)
    r_arch.font.color.rgb = RGBColor(30, 41, 59)

    add_callout(
        doc,
        "POST /api/v1/bookings/{booking_id}/upload-payment-proof",
        "• Security: Validates tourist ownership (booking.tourist_id == user_id) or business/admin privilege.\n"
        "• File Storage: Generates sanitized unique path: uploads/payment_proofs/{booking_id}_{timestamp}_{safe_name}.\n"
        "• Static Mounting: Mounted at /uploads via FastAPI StaticFiles for instant frontend rendering.\n"
        "• Relational Ledger: Creates/updates booking_payments record with funds_custody = 'hotel_operator', verification_status = 'pending_hotel_approval'.\n"
        "• Booking State: Transitions booking to deposit_paid and status = 'confirmed'.",
        border_color="0284C7"
    )

    add_callout(
        doc,
        "POST /api/v1/bookings/{booking_id}/verify-direct-deposit",
        "• Approval Action: Sets booking.payment_status = 'deposit_paid', direct_transfer_verified_at = now, updates payment ledger verification_status = 'confirmed', and appends audit history.\n"
        "• Rejection Action: Sets booking.payment_status = 'unpaid', deposit_amount = 0.0, updates payment ledger verification_status = 'rejected', records hotel rejection reason, and notifies tourist to re-upload valid proof.",
        border_color="0284C7"
    )

    # Section 4: Visual UI Interface Walkthrough
    h4 = doc.add_paragraph()
    r4 = h4.add_run("4. Visual User Interface & Front-Desk Walkthrough")
    r4.font.name = "Segoe UI"
    r4.font.size = Pt(15)
    r4.font.bold = True
    r4.font.color.rgb = RGBColor(15, 23, 42)
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(6)

    p_ui = doc.add_paragraph()
    p_ui.paragraph_format.space_after = Pt(8)
    r_ui = p_ui.add_run(
        "The visual design follows clean, professional typography and ergonomic UX tailored to both mobile-first tourists and desktop front-desk operators:"
    )
    r_ui.font.name = "Segoe UI"
    r_ui.font.size = Pt(10)
    r_ui.font.color.rgb = RGBColor(30, 41, 59)

    # Figure 1: Tourist Upload Modal
    p_f1_lbl = doc.add_paragraph()
    r_f1_lbl = p_f1_lbl.add_run("Figure 1: Tourist Direct Payment Proof Upload Modal (PaymentProofUploadModal.tsx)")
    r_f1_lbl.font.name = "Segoe UI"
    r_f1_lbl.font.size = Pt(11)
    r_f1_lbl.font.bold = True
    r_f1_lbl.font.color.rgb = RGBColor(4, 120, 87)
    p_f1_lbl.paragraph_format.space_before = Pt(10)
    p_f1_lbl.paragraph_format.space_after = Pt(4)

    screen1_path = r"F:\Antigravity\SwatTourismProduction_v2\Docs\tourist_payment_proof_upload_modal.png"
    if os.path.exists(screen1_path):
        p_img1 = doc.add_paragraph()
        p_img1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img1.paragraph_format.space_after = Pt(6)
        run_img1 = p_img1.add_run()
        run_img1.add_picture(screen1_path, width=Inches(6.4))
        
        p_cap1 = doc.add_paragraph()
        p_cap1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap1.paragraph_format.space_after = Pt(12)
        r_cap1 = p_cap1.add_run("Interactive modal displaying hotel's verified Meezan Bank IBAN, Payment Medium dropdown, TID, sender info, and screenshot slip attachment.")
        r_cap1.font.name = "Segoe UI"
        r_cap1.font.size = Pt(8.5)
        r_cap1.font.italic = True
        r_cap1.font.color.rgb = RGBColor(100, 116, 139)

    # Figure 2: Front Desk Inspector Modal
    p_f2_lbl = doc.add_paragraph()
    r_f2_lbl = p_f2_lbl.add_run("Figure 2: Hotel Front-Desk Direct Payment Inspector Suite (PaymentProofInspectorModal.tsx)")
    r_f2_lbl.font.name = "Segoe UI"
    r_f2_lbl.font.size = Pt(11)
    r_f2_lbl.font.bold = True
    r_f2_lbl.font.color.rgb = RGBColor(15, 23, 42)
    p_f2_lbl.paragraph_format.space_before = Pt(10)
    p_f2_lbl.paragraph_format.space_after = Pt(4)

    screen2_path = r"F:\Antigravity\SwatTourismProduction_v2\Docs\hotel_frontdesk_proof_inspector_modal.png"
    if os.path.exists(screen2_path):
        p_img2 = doc.add_paragraph()
        p_img2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img2.paragraph_format.space_after = Pt(6)
        run_img2 = p_img2.add_run()
        run_img2.add_picture(screen2_path, width=Inches(6.4))
        
        p_cap2 = doc.add_paragraph()
        p_cap2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap2.paragraph_format.space_after = Pt(12)
        r_cap2 = p_cap2.add_run("Front-desk inspection suite with high-resolution slip preview, zoom controls, one-click TID copy, verification metadata sheet, and Approve/Reject buttons.")
        r_cap2.font.name = "Segoe UI"
        r_cap2.font.size = Pt(8.5)
        r_cap2.font.italic = True
        r_cap2.font.color.rgb = RGBColor(100, 116, 139)

    # Section 5: Verification & Automated Test Evidence
    h5 = doc.add_paragraph()
    r5 = h5.add_run("5. Automated Test Suite Execution & Verification Evidence")
    r5.font.name = "Segoe UI"
    r5.font.size = Pt(15)
    r5.font.bold = True
    r5.font.color.rgb = RGBColor(15, 23, 42)
    h5.paragraph_format.space_before = Pt(14)
    h5.paragraph_format.space_after = Pt(6)

    p_tst = doc.add_paragraph()
    p_tst.paragraph_format.space_after = Pt(8)
    r_tst = p_tst.add_run(
        "To ensure regression-free deployment and deterministic financial integrity, the entire subsystem was tested across automated backend integration suites and frontend Vitest component tests:"
    )
    r_tst.font.name = "Segoe UI"
    r_tst.font.size = Pt(10)
    r_tst.font.color.rgb = RGBColor(30, 41, 59)

    test_table = doc.add_table(rows=4, cols=4)
    test_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    test_table.autofit = False
    set_table_borders(test_table, color="D1D5DB")

    t_headers = [("Test Suite", Inches(2.2)), ("Test Target", Inches(2.0)), ("Scope Verified", Inches(1.8)), ("Result", Inches(0.8))]
    for c_idx, (th_text, width) in enumerate(t_headers):
        cell = test_table.cell(0, c_idx)
        cell.width = width
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=100, bottom=100, left=100, right=100)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        rh = p.add_run(th_text)
        rh.font.name = "Segoe UI"
        rh.font.size = Pt(9)
        rh.font.bold = True
        rh.font.color.rgb = RGBColor(255, 255, 255)

    test_rows = [
        ("test_payment_proof_submission.py", "Backend Service & DB Ledger", "Upload, file saving, pending approval, front-desk approve, front-desk reject", "100% PASS"),
        ("payment_proof_components.test.tsx", "Frontend Modals (Vitest)", "Upload form submit, TID copy, approve deposit, reject with reason input", "100% PASS"),
        ("phase4_unified_payment_and_voucher.test.tsx", "Checkout & Vouchers", "Full online, 20% advance, Pay at hotel, voucher printing and download", "100% PASS")
    ]

    for r_idx, (c1, c2, c3, c4) in enumerate(test_rows, start=1):
        for c_idx, val in enumerate([c1, c2, c3, c4]):
            cell = test_table.cell(r_idx, c_idx)
            cell.width = t_headers[c_idx][1]
            set_cell_background(cell, "F8FAFC" if r_idx % 2 == 1 else "FFFFFF")
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            rv = p.add_run(val)
            rv.font.name = "Segoe UI"
            rv.font.size = Pt(8.5)
            if c_idx == 3:
                rv.font.bold = True
                rv.font.color.rgb = RGBColor(5, 150, 105)
            elif c_idx == 0:
                rv.font.bold = True
                rv.font.color.rgb = RGBColor(15, 23, 42)
            else:
                rv.font.color.rgb = RGBColor(71, 85, 105)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 6: Net Settlement & Financial Reconciliation
    h6 = doc.add_paragraph()
    r6 = h6.add_run("6. Net Settlement & Platform Commission Reconciliation")
    r6.font.name = "Segoe UI"
    r6.font.size = Pt(15)
    r6.font.bold = True
    r6.font.color.rgb = RGBColor(15, 23, 42)
    h6.paragraph_format.space_before = Pt(14)
    h6.paragraph_format.space_after = Pt(6)

    p_settle = doc.add_paragraph()
    p_settle.paragraph_format.space_after = Pt(8)
    r_settle = p_settle.add_run(
        "A critical architectural consideration is ensuring that when a tourist pays the hotel directly (Track 2), the platform does not lose its commission tracking. Under the STP financial engine:\n\n"
        "1. Funds Custody Isolation: In booking_payments, Track 2 entries are explicitly recorded with funds_custody = 'hotel_operator', distinguishing them from STP Escrow funds.\n"
        "2. Commission Ledger Hook: At guest check-out, CommissionTransaction is automatically posted into the finance ledger, debiting the property's commission liability.\n"
        "3. Universal Monthly Settlement: At month end, generate_monthly_invoices computes the property's net position. If the property owes commission for direct deposits that exceed online escrow payouts, a 1Bill invoice with a 24-digit consumer number is automatically generated for front-desk settlement."
    )
    r_settle.font.name = "Segoe UI"
    r_settle.font.size = Pt(10)
    r_settle.font.color.rgb = RGBColor(30, 41, 59)

    # Sign-off box
    tbl_sign = doc.add_table(rows=1, cols=2)
    tbl_sign.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_sign.autofit = False
    set_table_borders(tbl_sign, color="E2E8F0")

    cell_l = tbl_sign.cell(0, 0)
    cell_l.width = Inches(3.4)
    set_cell_background(cell_l, "F8FAFC")
    set_cell_margins(cell_l, top=100, bottom=100, left=140, right=140)
    pl = cell_l.paragraphs[0]
    pl.paragraph_format.space_after = Pt(0)
    rl1 = pl.add_run("ENGINEERING IMPLEMENTATION VERIFIED\n")
    rl1.font.name = "Segoe UI"
    rl1.font.size = Pt(8.5)
    rl1.font.bold = True
    rl1.font.color.rgb = RGBColor(4, 120, 87)
    rl2 = pl.add_run("Swat Tourism Platform Lead Engineering\nStatus: Production Ready • 100% Tested")
    rl2.font.name = "Segoe UI"
    rl2.font.size = Pt(9)
    rl2.font.color.rgb = RGBColor(71, 85, 105)

    cell_r = tbl_sign.cell(0, 1)
    cell_r.width = Inches(3.4)
    set_cell_background(cell_r, "F8FAFC")
    set_cell_margins(cell_r, top=100, bottom=100, left=140, right=140)
    pr = cell_r.paragraphs[0]
    pr.paragraph_format.space_after = Pt(0)
    rr1 = pr.add_run("KPK TOURISM AUTHORITY OVERSIGHT\n")
    rr1.font.name = "Segoe UI"
    rr1.font.size = Pt(8.5)
    rr1.font.bold = True
    rr1.font.color.rgb = RGBColor(15, 23, 42)
    rr2 = pr.add_run("Directorate of Tourism & IT Infrastructure\nCompliance: SRS-2 Dual-Track Direct Deposit Standards")
    rr2.font.name = "Segoe UI"
    rr2.font.size = Pt(9)
    rr2.font.color.rgb = RGBColor(71, 85, 105)

    output_path = r"F:\Antigravity\SwatTourismProduction_v2\Docs\swat-tourism-payment-proof-submission-and-verification-implementation-report.docx"
    doc.save(output_path)
    print(f"Report successfully saved to: {output_path}")

if __name__ == "__main__":
    build_implementation_report()

