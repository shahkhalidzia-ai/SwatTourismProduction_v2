import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOC_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DOCX = os.path.join(DOC_DIR, "Swat_Tourism_Weekly_Changes_and_Fixes_Summary_Nov6_Nov13.docx")

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

def format_table(table, col_widths, headers, rows, header_bg="0F766E"):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table, color="CBD5E1", sz="4")
    
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], header_bg)
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
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

def add_callout(doc, title, text, bg_color="F8FAFC", border_color="0284C7"):
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
    run_t = p.add_run(f"📌 {title}\n")
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

def build_changelog_docx():
    doc = Document()

    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Title Banner
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(4)
    run_main = p_title.add_run("Swat Tourism Platform (STP)")
    run_main.bold = True
    run_main.font.name = "Arial"
    run_main.font.size = Pt(22)
    run_main.font.color.rgb = RGBColor(15, 23, 42)

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(14)
    run_sub = p_sub.add_run("Weekly Engineering Deliverables, Fixes & Features Summary (Nov 6 – Nov 13, 2026)")
    run_sub.bold = True
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(13)
    run_sub.font.color.rgb = RGBColor(14, 116, 144)

    # Metadata Box
    meta_headers = ["Attribute", "Details"]
    meta_rows = [
        ["Reporting Window", "Friday 6 November 2026 to Friday 13 November 2026 (1 Full Week)"],
        ["Target Repository", "https://github.com/shahkhalidzia-ai/SwatTourismProduction_v2.git"],
        ["Branch & Latest Commit", "main (Commit: 58e3262)"],
        ["Workspace Root Path", "f:\\Antigravity\\SwatTourismProduction_v2"],
        ["Output Location", "Docs\\Swat_Tourism_Weekly_Changes_and_Fixes_Summary_Nov6_Nov13.docx"],
        ["Document Purpose", "Executive & Management Engineering Progress Summary"]
    ]
    meta_tbl = doc.add_table(rows=1 + len(meta_rows), cols=2)
    meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    format_table(meta_tbl, [Inches(2.2), Inches(4.6)], meta_headers, meta_rows, header_bg="0F172A")
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    add_callout(
        doc,
        "Executive Engineering Overview",
        "Over the past 7 days, the engineering team executed a major delivery cycle covering:\n"
        "1. Complete hotel booking lifecycle analysis, documentation, and 6-layer code architecture specification.\n"
        "2. The tourist payment proof submission and front-desk verification audit subsystem.\n"
        "3. Integration of self-hosted WAHA (WhatsApp HTTP API) for automated boarding pass and QR voucher dispatch.\n"
        "4. Critical PMS stability fixes, physical room rack state reconciliation, and test booking deletion.\n"
        "5. Generation of high-resolution visual architectural diagram assets and Microsoft Word executive deliverables.",
        bg_color="F0FDF4",
        border_color="16A34A"
    )

    # Section 1: Git Commits History
    h1 = doc.add_heading("1. Weekly Git Commit Log (Nov 6 – Nov 13, 2026)", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)
    for r in h1.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    commit_headers = ["Commit Hash", "Date", "Commit Subject / Deliverable", "Scope of Changes"]
    commit_rows = [
        ["58e3262", "2026-11-13", "docs & feat: add hotel booking flow architecture, 6-layer code architecture specification, and PMS updates", "36 files: 6 Word docs, 5 visual diagram PNGs, WAHA integration, bookings router, PMS tests."],
        ["ab54b9e", "2026-11-11", "chore(hotel-today): rename row Details button label to Actions and format HotelTodayScreen", "1 file: HotelTodayScreen.tsx UX polish and action dropdown trigger."],
        ["8ba3030", "2026-11-11", "feat(bookings): add delete-all tourist bookings, fix demo-login status overwrite, reconcile room rack, and add architecture docs", "24 files: Tourist booking wipe endpoint, demo login state persistence, room rack reconciliation."],
        ["5e7f21e", "2026-11-08", "docs: add tourist proof of payment submission and verification implementation report and screenshots", "8 files: Payment proof report, modal capture screenshots, gap analysis."],
        ["818007a", "2026-11-08", "feat(payments): implement tourist proof of payment submission & hotel front-desk verification subsystem", "14 files: PaymentProofUploadModal, PaymentProofInspectorModal, backend proof audit endpoints."],
        ["025cab1", "2026-11-06", "docs: add tourist payment proof submission and hotel verification prompt", "3 files: Verification prompt specification and requirements documentation."],
        ["bf8d75e", "2026-11-06", "docs: add formal dual-track payments implementation and verification docx report", "2 files: Dual-track online and bank transfer payment architecture report."]
    ]
    c_tbl = doc.add_table(rows=1 + len(commit_rows), cols=4)
    format_table(c_tbl, [Inches(1.1), Inches(1.0), Inches(2.7), Inches(2.0)], commit_headers, commit_rows, header_bg="0E7490")
    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Section 2: Detailed Bulleted Summary of Changes by Domain
    h2 = doc.add_heading("2. Detailed Summary of Changes, Fixes & Features", level=1)
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(6)
    for r in h2.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    sections = [
        ("1. Payment Proof & Front-Desk Verification Subsystem (Nov 6 – Nov 8)", [
            "Tourist Payment Slip Upload Modal: Built PaymentProofUploadModal.tsx allowing tourists to upload payment slips/receipts for Direct Bank Transfers (IBFT/Easypaisa/JazzCash) and input transaction reference IDs.",
            "Front-Desk Proof Inspector Modal: Built PaymentProofInspectorModal.tsx on the Hotel Today PMS screen allowing hoteliers to inspect receipt images, review transaction details, and click 'Approve' or 'Reject'.",
            "Backend Proof Audit Endpoints: Added POST /{id}/upload-proof and POST /{id}/verify-proof in backend/app/modules/bookings/router.py with disk storage in uploads/payment_proofs/.",
            "Automated Test Coverage: Added backend and frontend tests in test_payment_proof_submission.py and payment_proof_components.test.tsx."
        ]),
        ("2. Booking Engine, PMS & Room Rack Fixes (Nov 11)", [
            "Clear/Delete Test Bookings: Added a 'Delete All Tourist Bookings' button in MyBookingsView.tsx and backend endpoint DELETE /api/v1/bookings/tourist/all to allow instant testing resets.",
            "Demo-Login State Preservation: Fixed a state regression bug where switching between demo roles would inadvertently overwrite or reset active booking states in localStorage.",
            "Physical Room Rack Reconciliation: Synchronized physical room allocation (AssignRoomModal.tsx) with housekeeping turnover (occupied -> cleaning -> available).",
            "Hotel PMS UX Polish: Refactored HotelTodayScreen.tsx and renamed the table row 'Details' button to 'Actions' for cleaner front-desk UX."
        ]),
        ("3. Communications & WhatsApp (WAHA) Gateway Integration (Nov 11 – Nov 13)", [
            "WAHA Open-Source Engine: Added support for self-hosted WhatsApp HTTP API (WAHA) alongside Twilio and Mock providers in backend/app/core/config.py and whatsapp_service.py.",
            "Multi-Channel Dispatcher: Updated dispatcher.py to automatically send official confirmation boarding passes with dynamic QR verification codes upon host acceptance.",
            "Automated Communications Test Suite: Added comprehensive unit tests in backend/tests/test_phase2_communications_gateway.py."
        ]),
        ("4. 6-Layer Architecture & End-to-End Hotel Booking Flow (Nov 13)", [
            "End-to-End Hotel Flow Mapping: Documented and verified all files and transitions across the 10 lifecycle stages (URL Load -> Auth -> Search -> Request -> PMS Today -> Accept -> QR Voucher -> Check-In/Out -> 5-Star Review).",
            "6-Layer Code Architecture: Formulated the decoupled 6-tier architecture (Frontend View -> Frontend API -> Backend Gateway -> Domain Service -> Model -> Database) and documented inter-layer communication protocols.",
            "Visual Architecture Diagram Suite: Designed and generated 5 high-resolution visual diagrams in Docs/ (swat_single_comprehensive_architecture.png, swat_diagram_1_booking_sequence.png, swat_diagram_2_data_pipeline.png, swat_diagram_3_initial_page_load.png, swat_complete_end_to_end_architecture.png)."
        ]),
        ("5. Executive Documentation & Word Deliverables (Nov 6 – Nov 13)", [
            "Swat_Tourism_6_Layer_Code_Architecture_and_Communication_Flow.docx: Dedicated 6-layer architecture document with embedded high-resolution visual diagram.",
            "Swat_Tourism_Complete_End_to_End_Hotel_Booking_Flow_and_Architecture.docx: Merged 10-stage technical specification with all visual diagrams embedded.",
            "Antigravity_Responses_Current_Chat.docx: Clean Word deliverable of assistant responses with all Mermaid text replaced by visual diagrams.",
            "Swat_Tourism_Hotel_Booking_Complete_Chat_Transcript.docx: Full session chat dialogue transcript.",
            "WAHA_WhatsApp_Changes_and_Testing_Guide.docx & .md: WhatsApp integration guide.",
            "SwatPay_Process_Guide.docx & SwatPay_Simplified_Payment_Flow_Proposal.docx: Dual-track and simplified payment architecture proposals."
        ]),
        ("6. Test Suite, Configuration & Repository Sync (Nov 13)", [
            "Frontend Tests: Added and verified automated tests in hotel_today_responsiveness.test.tsx, payment_proof_components.test.tsx, and my_bookings_dedicated.test.tsx.",
            "Environment & Dependencies: Added backend/.env.example and updated Requirements.txt with dependencies (python-docx, Pillow, aiosqlite).",
            "Git Repository Sync: Checked in all 36 modified/new files and pushed cleanly to GitHub (commit 58e3262)."
        ])
    ]

    for title, points in sections:
        p_sec = doc.add_paragraph()
        p_sec.paragraph_format.space_before = Pt(10)
        p_sec.paragraph_format.space_after = Pt(2)
        r_sec = p_sec.add_run(f"▶ {title}")
        r_sec.bold = True
        r_sec.font.name = "Arial"
        r_sec.font.size = Pt(11)
        r_sec.font.color.rgb = RGBColor(14, 116, 144)

        for pt in points:
            p_pt = doc.add_paragraph()
            p_pt.paragraph_format.space_before = Pt(1)
            p_pt.paragraph_format.space_after = Pt(2)
            p_pt.paragraph_format.left_indent = Inches(0.25)
            r_bullet = p_pt.add_run("• ")
            r_bullet.bold = True
            r_bullet.font.name = "Arial"
            r_bullet.font.size = Pt(9.5)
            r_bullet.font.color.rgb = RGBColor(15, 118, 110)

            # Split bold lead if colon present
            if ":" in pt:
                lead, body = pt.split(":", 1)
                r_lead = p_pt.add_run(lead + ":")
                r_lead.bold = True
                r_lead.font.name = "Arial"
                r_lead.font.size = Pt(9.5)
                r_lead.font.color.rgb = RGBColor(15, 23, 42)
                
                r_body = p_pt.add_run(body)
                r_body.font.name = "Arial"
                r_body.font.size = Pt(9.5)
                r_body.font.color.rgb = RGBColor(51, 65, 85)
            else:
                r_body = p_pt.add_run(pt)
                r_body.font.name = "Arial"
                r_body.font.size = Pt(9.5)
                r_body.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 3: Summary of Changed Files by Category
    h3 = doc.add_heading("3. Summary of Changed Files by Subsystem", level=1)
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(6)
    for r in h3.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    cat_headers = ["Subsystem / Layer", "Key Files Modified or Created", "Nature of Changes"]
    cat_rows = [
        ["Frontend UI & Components", "• HotelTodayScreen.tsx\n• BusinessShell.tsx\n• MyBookingsView.tsx\n• PaymentProofUploadModal.tsx\n• PaymentProofInspectorModal.tsx", "Front-desk PMS UI polish, Actions button, payment proof upload and inspection, delete all test bookings."],
        ["Frontend API Clients", "• frontend/src/api/bookings.ts\n• frontend/src/api/client.ts", "Added upload-proof, verify-proof, and delete-all API clients; enhanced multipart FormData handling."],
        ["Backend Core & API Gateway", "• backend/app/main.py\n• backend/app/core/config.py\n• backend/app/modules/bookings/router.py", "Added payment proof audit endpoints, WAHA config settings, uploads/payment_proofs static route."],
        ["Domain Services & Communications", "• backend/app/modules/bookings/service.py\n• backend/app/modules/communications/dispatcher.py\n• backend/app/modules/communications/whatsapp_service.py", "WAHA WhatsApp gateway integration, automated dynamic QR voucher dispatch, booking deletion logic."],
        ["Automated Test Suites", "• hotel_today_responsiveness.test.tsx\n• payment_proof_components.test.tsx\n• test_payment_proof_submission.py\n• test_phase2_communications_gateway.py", "Full end-to-end unit and integration tests for payment proof, WAHA dispatch, and PMS responsiveness."],
        ["Executive Documentation Assets", "• 6 Microsoft Word Documents (.docx)\n• 5 High-Resolution Architecture PNGs\n• 6 Python Generator Scripts in Docs/", "Complete 10-stage hotel flow, 6-layer architecture specification, and transcript deliverables."]
    ]
    cat_tbl = doc.add_table(rows=1 + len(cat_rows), cols=3)
    format_table(cat_tbl, [Inches(1.8), Inches(2.7), Inches(2.3)], cat_headers, cat_rows, header_bg="0F766E")
    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    doc.save(OUTPUT_DOCX)
    print(f"[Document] Generated weekly summary document successfully: {OUTPUT_DOCX}")

if __name__ == "__main__":
    build_changelog_docx()
