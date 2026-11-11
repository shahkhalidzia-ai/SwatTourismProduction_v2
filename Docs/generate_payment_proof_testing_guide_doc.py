import os
from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOC_DIR = os.path.dirname(os.path.abspath(__file__))
DIAGRAM_PATH = os.path.join(DOC_DIR, "swat_payment_proof_flow_diagram.png")
OUTPUT_DOCX = os.path.join(DOC_DIR, "Swat_Tourism_Payment_Proof_Testing_and_Verification_Guide.docx")

# ---------------------------------------------------------
# 1. GENERATE PAYMENT PROOF FLOW DIAGRAM (PNG)
# ---------------------------------------------------------
def generate_proof_diagram():
    width, height = 1540, 880
    img = Image.new("RGBA", (width, height), (248, 250, 252, 255))
    draw = ImageDraw.Draw(img)

    try:
        font_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 24)
        font_sub = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 14)
        font_hdr = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 15)
        font_code = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 11)
        font_body = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 12)
        font_badge = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 11)
    except:
        font_title = font_sub = font_hdr = font_code = font_body = font_badge = ImageFont.load_default()

    # Header Banner
    draw.rectangle([(0, 0), (width, 80)], fill=(15, 23, 42, 255))
    draw.text((36, 14), "SWAT TOURISM PLATFORM — PAYMENT PROOF SUBMISSION & VERIFICATION FLOW", fill=(255, 255, 255, 255), font=font_title)
    draw.text((36, 48), "Dual-Track Checkout Architecture: Why Track 1 (Auto Escrow) Skips Proof vs. Track 2 (Direct Hotel Transfer) Proof Flow", fill=(148, 163, 184, 255), font=font_sub)

    def draw_box(x, y, w, h, bg, border, title, hdr_bg, lines):
        draw.rounded_rectangle([(x, y), (x + w, y + h)], radius=10, fill=bg, outline=border, width=2)
        draw.rounded_rectangle([(x, y), (x + w, y + 36)], radius=10, fill=hdr_bg)
        draw.rectangle([(x, y + 20), (x + w, y + 36)], fill=hdr_bg)
        draw.text((x + 12, y + 9), title, fill=(255, 255, 255, 255), font=font_hdr)
        ly = y + 48
        for txt, is_code in lines:
            draw.text((x + 12, ly), txt, fill=border if is_code else (51, 65, 85, 255), font=font_code if is_code else font_body)
            ly += 20

    # Top Entry Box: UnifiedCheckoutModal
    draw_box(
        470, 105, 600, 130, (255, 255, 255, 255), (14, 116, 144, 255),
        "1. TOURIST CHECKOUT MODAL (UnifiedCheckoutModal.tsx)", (14, 116, 144, 255),
        [
            ("Tourist clicks 'Pay / Guarantee Online (20% Deposit)' after booking", False),
            ("Step 1: Select Payment Rail (Dual-Track) — Track 1 vs. Track 2", True),
            ("Step 2: Choose 20% Advance Deposit (DEPOSIT_20)", False)
        ]
    )

    # Branch Left: Track 1 (STP Platform)
    draw.line([(620, 235), (360, 290)], fill=(3, 105, 161, 255), width=3)
    draw.polygon([(360, 290), (372, 282), (368, 294)], fill=(3, 105, 161, 255))
    draw.text((385, 245), "Default: Track 1 (STP Platform)", fill=(3, 105, 161, 255), font=font_badge)

    draw_box(
        50, 290, 560, 165, (240, 249, 255, 255), (3, 105, 161, 255),
        "TRACK 1: AUTOMATED GATEWAY (NO SLIP POPUP)", (3, 105, 161, 255),
        [
            ("• Gateway: Easypaisa / JazzCash / Card (Automated Escrow)", False),
            ("• Instant OTP / Sandbox Confirmation -> No TID/Slip Input", False),
            ("• POST /api/v1/bookings/{id}/pay/unified (track='stp_platform')", True),
            ("• Result: status='confirmed', payment_status='deposit_paid'", True),
            ("• Hotel does NOT see 'Inspect Proof' (Gateway auto-verified)", False)
        ]
    )

    # Branch Right: Track 2 (Direct Hotel Transfer)
    draw.line([(920, 235), (1160, 290)], fill=(180, 83, 9, 255), width=3)
    draw.polygon([(1160, 290), (1152, 282), (1148, 294)], fill=(180, 83, 9, 255))
    draw.text((1030, 245), "Click: Track 2 (Direct Hotel Transfer)", fill=(180, 83, 9, 255), font=font_badge)

    draw_box(
        890, 290, 600, 165, (255, 251, 235, 255), (180, 83, 9, 255),
        "TRACK 2: DIRECT TRANSFER + PROOF SLIP UPLOAD", (180, 83, 9, 255),
        [
            ("• Shows Hotel Easypaisa / Raast / Bank IBAN details", False),
            ("• Tourist enters TID + attaches Screenshot Slip (Optional now)", False),
            ("• Sets deposit_track='property_direct' & direct_transfer_tid", True),
            ("• Saved to ./uploads/payment_proofs/ & DB bookings table", True),
            ("• Status awaits Hotel Front-Desk approval", False)
        ]
    )

    # Step 2 Right: Standalone Proof Modal in My Bookings
    draw.line([(1190, 455), (1190, 505)], fill=(180, 83, 9, 255), width=3)
    draw.polygon([(1190, 505), (1185, 495), (1195, 495)], fill=(180, 83, 9, 255))

    draw_box(
        890, 505, 600, 155, (255, 255, 255, 255), (217, 119, 6, 255),
        "2. STANDALONE UPLOAD POPUP (MyBookingsView.tsx)", (217, 119, 6, 255),
        [
            ("• Go to Tourist Portal -> My Bookings tab", False),
            ("• Click button: 'Upload Slip / TID' -> opens PaymentProofUploadModal", True),
            ("• Submits FormData (file, medium, amount, tid, sender_account)", False),
            ("• POST /api/v1/bookings/{id}/upload-payment-proof", True),
            ("• Badge updates to 'Slip Uploaded ⏳'", False)
        ]
    )

    # Step 3 Bottom: Hotel Inspection & Verification
    draw.line([(890, 580), (650, 580)], fill=(15, 118, 110, 255), width=3)
    draw.polygon([(650, 580), (660, 575), (660, 585)], fill=(15, 118, 110, 255))
    draw.text((685, 558), "Appears at Hotel Front Desk", fill=(15, 118, 110, 255), font=font_badge)

    draw_box(
        50, 505, 600, 185, (240, 253, 250, 255), (15, 118, 110, 255),
        "3. HOTEL PROOF INSPECTOR (HotelTodayScreen.tsx)", (15, 118, 110, 255),
        [
            ("• Business Portal -> Front Desk / Today Screen", False),
            ("• Row displays amber button: '🔍 Inspect Proof (TID: ...)'", True),
            ("• Opens PaymentProofInspectorModal.tsx with Slip Preview", False),
            ("• Hotel Manager clicks 'Approve' or 'Reject'", False),
            ("• POST /api/v1/bookings/{id}/verify-direct-deposit", True),
            ("• Updates payment_status='deposit_paid' & verified_at=NOW()", True)
        ]
    )

    # Bottom Tip Banner
    draw.rounded_rectangle([(50, 735), (1490, 845)], radius=10, fill=(239, 246, 255, 255), outline=(37, 99, 235, 255), width=2)
    draw.text((70, 750), "KEY MANUAL TESTING RULE:", fill=(30, 58, 138, 255), font=font_hdr)
    draw.text((70, 778), "1. Always log in as an authenticated Tourist (not offline guest) so a real database booking ID is created for file upload.", fill=(30, 41, 59, 255), font=font_body)
    draw.text((70, 800), "2. In UnifiedCheckoutModal, switch from 'Track 1: STP Platform' to 'Track 2: Direct Hotel Transfer' to see TID & Slip upload immediately.", fill=(30, 41, 59, 255), font=font_body)
    draw.text((70, 822), "3. Alternatively, go to Tourist Portal -> My Bookings and click the amber 'Upload Slip / TID' button on your booking card.", fill=(30, 41, 59, 255), font=font_body)

    img.save(DIAGRAM_PATH, "PNG")
    print(f"[Diagram] Generated: {DIAGRAM_PATH}")

# ---------------------------------------------------------
# 2. DOCX HELPER FUNCTIONS
# ---------------------------------------------------------
def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=110, bottom=110, left=140, right=140):
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

def add_callout(doc, title, text, bg_color="F8FAFC", border_color="0284C7"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.8)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=120, bottom=120, left=160, right=160)
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
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    run_t = p.add_run(f"📌 {title}\n")
    run_t.bold = True
    run_t.font.name = "Arial"
    run_t.font.size = Pt(10.5)
    run_t.font.color.rgb = RGBColor(15, 23, 42)
    run_b = p.add_run(text)
    run_b.font.name = "Arial"
    run_b.font.size = Pt(9.2)
    run_b.font.color.rgb = RGBColor(51, 65, 85)
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(2)
    p_after.paragraph_format.space_after = Pt(4)

def format_table(table, col_widths, headers, rows, header_bg="0F766E"):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table, color="CBD5E1", sz="4")
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], header_bg)
        set_cell_margins(hdr_cells[i], top=100, bottom=100, left=120, right=120)
        p = hdr_cells[i].paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(title)
        run.bold = True
        run.font.name = "Arial"
        run.font.size = Pt(9.2)
        run.font.color.rgb = RGBColor(255, 255, 255)
    for r_idx, row_data in enumerate(rows):
        row_cells = table.rows[r_idx + 1].cells
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            row_cells[c_idx].width = col_widths[c_idx]
            set_cell_background(row_cells[c_idx], bg)
            set_cell_margins(row_cells[c_idx], top=85, bottom=85, left=120, right=120)
            p = row_cells[c_idx].paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run(str(val))
            run.font.name = "Arial"
            run.font.size = Pt(8.6)
            run.font.color.rgb = RGBColor(30, 41, 59)

# ---------------------------------------------------------
# 3. BUILD COMPLETE WORD DOCUMENT
# ---------------------------------------------------------
def generate_docx():
    doc = Document()
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Header Title
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(4)
    r_m = p_title.add_run("Swat Tourism Platform (STP)")
    r_m.bold = True
    r_m.font.name = "Arial"
    r_m.font.size = Pt(22)
    r_m.font.color.rgb = RGBColor(15, 23, 42)

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(12)
    r_s = p_sub.add_run("Payment Proof Submission & Hotel Verification — Manual Testing & Code Flow Guide")
    r_s.bold = True
    r_s.font.name = "Arial"
    r_s.font.size = Pt(12.5)
    r_s.font.color.rgb = RGBColor(14, 116, 144)

    # Metadata
    meta_headers = ["Attribute", "Details"]
    meta_rows = [
        ["Scope", "Manual Testing Walkthrough & Technical Architecture for 20% Deposit Proof Submission and Front-Desk Verification"],
        ["Workspace Root", "f:\\Antigravity\\SwatTourismProduction_v2"],
        ["Frontend Components", "UnifiedCheckoutModal.tsx, MyBookingsView.tsx, PaymentProofUploadModal.tsx, HotelTodayScreen.tsx, PaymentProofInspectorModal.tsx"],
        ["Backend Endpoints", "POST /api/v1/bookings/{id}/pay/unified, POST /api/v1/bookings/{id}/upload-payment-proof, POST /api/v1/bookings/{id}/verify-direct-deposit"]
    ]
    meta_tbl = doc.add_table(rows=1 + len(meta_rows), cols=2)
    format_table(meta_tbl, [Inches(2.0), Inches(4.8)], meta_headers, meta_rows, header_bg="0F172A")

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    add_callout(
        doc,
        "Why Proof Upload Was Hidden When Selecting Easypaisa (Track 1 vs. Track 2)",
        "In UnifiedCheckoutModal.tsx, Step 1 ('Select Payment Rail') defaults to 'Track 1: STP Platform' (Instant STP Escrow via Easypaisa/JazzCash/Card). "
        "Because Track 1 simulates an automated wallet push, it does NOT ask for a screenshot slip or TID.\n\n"
        "To test manual Easypaisa / Bank Transfer Proof Upload, you MUST select 'Track 2: Direct Hotel Transfer' at the top of Step 1—OR upload your slip "
        "afterwards from Tourist Portal → My Bookings using the 'Upload Slip / TID' button.",
        bg_color="FFFBEB",
        border_color="D97706"
    )

    # Section 1: Visual Flow Diagram
    h1 = doc.add_heading("1. Payment Proof Submission & Verification Diagram", level=1)
    h1.paragraph_format.space_before = Pt(10)
    h1.paragraph_format.space_after = Pt(6)
    for r in h1.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    if os.path.exists(DIAGRAM_PATH):
        doc.add_picture(DIAGRAM_PATH, width=Inches(6.9))
        p_cap = doc.add_paragraph("Figure 1: Dual-Track Checkout Branching & Proof Verification Sequence")
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(4)
        p_cap.paragraph_format.space_after = Pt(10)
        rc = p_cap.runs[0]
        rc.font.name = "Arial"
        rc.font.size = Pt(8.5)
        rc.font.italic = True
        rc.font.color.rgb = RGBColor(100, 116, 139)

    # Section 2: Step-by-Step Manual Testing Guide
    h2 = doc.add_heading("2. Step-by-Step Manual Testing Instructions", level=1)
    h2.paragraph_format.space_before = Pt(12)
    h2.paragraph_format.space_after = Pt(6)
    for r in h2.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    test_steps = [
        ("Part A — Tourist Side: Book Room & Submit 20% Proof (Option 1: During Checkout)",
         "1. Log in as an authenticated Tourist account (not offline guest mode) so the booking persists in the backend database.\n"
         "2. Search and open a hotel (e.g., Swat Serena Hotel) in HotelDetailsModal.tsx.\n"
         "3. Choose dates and room type, then click 'Instant Book' to create the booking.\n"
         "4. On the confirmation screen, click 'Pay / Guarantee Online (20% Deposit)' to open UnifiedCheckoutModal.tsx.\n"
         "5. In Step 1 ('Select Payment Rail'), click 'Track 2: Direct Hotel Transfer' (amber card on the right).\n"
         "6. In Step 2 ('Choose Guarantee Plan'), select '20% Advance Guarantee Deposit'.\n"
         "7. View the hotel's Easypaisa / Raast ID / Bank IBAN details, enter a Transaction Reference ID (e.g., EP-8829104), "
         "click 'Click to Attach Screenshot Slip' to select a PNG/JPG/PDF slip, and submit.\n"
         "   → Backend calls POST /api/v1/bookings/{id}/pay/unified and POST /api/v1/bookings/{id}/upload-payment-proof."),

        ("Part B — Tourist Side: Upload or Update Proof Later (Option 2: Via My Bookings)",
         "1. Navigate to Tourist Portal → My Bookings (MyBookingsView.tsx).\n"
         "2. Locate your booking card. If deposit_track='property_direct', payment_status='deposit_paid', or booking is accepted/confirmed and unpaid, "
         "you will see an amber/green button labeled 'Upload Slip / TID' (or 'Slip Uploaded ⏳' / 'Slip Verified ✓').\n"
         "3. Click 'Upload Slip / TID' to open the standalone PaymentProofUploadModal.tsx popup.\n"
         "4. Fill in Payment Medium (e.g., Easypaisa), Amount Paid (20%), Transaction Ref (TID), Sender Account, and attach the screenshot slip.\n"
         "5. Click Submit → saves file to ./uploads/payment_proofs/ and updates booking.direct_transfer_tid & direct_transfer_slip_url in DB."),

        ("Part C — Hotel Front-Desk Side: Inspect & Verify Proof",
         "1. Log in as the Hotel Business Manager (or switch to Business role in demo mode) and open Business Portal → Today / Front Desk (HotelTodayScreen.tsx).\n"
         "2. Find the tourist's booking row. When direct_transfer_tid is present and not yet verified, an amber button appears:\n"
         "   '🔍 Inspect Proof (TID: ...)'\n"
         "3. Click '🔍 Inspect Proof' to open PaymentProofInspectorModal.tsx.\n"
         "4. Review the attached transfer slip image, copy the TID to verify against the hotel's Easypaisa/Bank statement, and click 'Approve Deposit' (or 'Reject').\n"
         "   → Backend calls POST /api/v1/bookings/{id}/verify-direct-deposit, setting direct_transfer_verified_at=NOW() and payment_status='deposit_paid'.")
    ]

    for title, body in test_steps:
        p_st = doc.add_paragraph()
        p_st.paragraph_format.space_before = Pt(6)
        p_st.paragraph_format.space_after = Pt(2)
        rt = p_st.add_run(f"▶ {title}")
        rt.bold = True
        rt.font.name = "Arial"
        rt.font.size = Pt(10.5)
        rt.font.color.rgb = RGBColor(14, 116, 144)

        p_bd = doc.add_paragraph(body)
        p_bd.paragraph_format.space_before = Pt(0)
        p_bd.paragraph_format.space_after = Pt(6)
        for r in p_bd.runs:
            r.font.name = "Arial"
            r.font.size = Pt(9.2)
            r.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Section 3: Technical Architecture & Troubleshooting Matrix
    h3 = doc.add_heading("3. File, API & Troubleshooting Reference Matrix", level=1)
    h3.paragraph_format.space_before = Pt(10)
    h3.paragraph_format.space_after = Pt(6)
    for r in h3.runs:
        r.font.name = "Arial"
        r.font.color.rgb = RGBColor(15, 23, 42)

    ref_headers = ["Component / Layer", "Exact Repository File Path", "Trigger Condition / Endpoint / Notes"]
    ref_rows = [
        [
            "Dual-Track Checkout Modal",
            "frontend/src/components/\nUnifiedCheckoutModal.tsx",
            "Must select 'Track 2: Direct Hotel Transfer' (line 258) to reveal TID input & slip file attachment inside checkout."
        ],
        [
            "My Bookings Proof Button",
            "frontend/src/modules/tourist/\nMyBookingsView.tsx (lines 1176-1202)",
            "Button 'Upload Slip / TID' renders when deposit_track=='property_direct', direct_transfer_tid exists, payment_status=='deposit_paid', or unpaid accepted/confirmed."
        ],
        [
            "Standalone Proof Popup",
            "frontend/src/components/\nPaymentProofUploadModal.tsx",
            "Submits multipart FormData via uploadPaymentProofApi() in frontend/src/api/bookings.ts."
        ],
        [
            "Hotel Front-Desk Proof Button",
            "frontend/src/modules/business/\nHotelTodayScreen.tsx (lines 3506-3527)",
            "Button '🔍 Inspect Proof' renders ONLY when booking.direct_transfer_tid is populated and direct_transfer_verified_at is null."
        ],
        [
            "Hotel Proof Inspector Popup",
            "frontend/src/components/\nPaymentProofInspectorModal.tsx",
            "Displays slip preview, TID copy, and Approve/Reject actions calling verifyDirectDepositApi()."
        ],
        [
            "Backend Upload & Verify APIs",
            "backend/app/modules/bookings/\nrouter.py & service.py",
            "POST /bookings/{id}/upload-payment-proof (saves slip & TID)\nPOST /bookings/{id}/verify-direct-deposit (business/admin verifies deposit)."
        ],
        [
            "Database Columns",
            "backend/app/modules/bookings/\nmodels.py (Booking & BookingPayment)",
            "bookings: deposit_track, direct_transfer_tid, direct_transfer_slip_url, direct_transfer_verified_at, direct_transfer_verified_by.\nbooking_payments: receipt_image_url, verification_status."
        ]
    ]
    ref_tbl = doc.add_table(rows=1 + len(ref_rows), cols=3)
    format_table(ref_tbl, [Inches(1.8), Inches(2.2), Inches(2.8)], ref_headers, ref_rows, header_bg="1E293B")

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    add_callout(
        doc,
        "Common Troubleshooting Checklist",
        "1. Missing 'Inspect Proof' button on Hotel screen? Check if you paid via Track 1 (STP Platform Easypaisa) instead of Track 2 (Direct Hotel Transfer). Track 1 does not populate direct_transfer_tid unless you upload a slip from My Bookings.\n"
        "2. Upload fails for guest booking? Ensure you are logged in as a Tourist user before creating the booking so a backend UUID exists in the bookings table.",
        bg_color="FEF2F2",
        border_color="DC2626"
    )

    doc.save(OUTPUT_DOCX)
    print(f"[Document] Generated successfully: {OUTPUT_DOCX}")

if __name__ == "__main__":
    generate_proof_diagram()
    generate_docx()

