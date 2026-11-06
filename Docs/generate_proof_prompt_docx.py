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
        r.font.color.rgb = RGBColor(15, 43, 72)
    return h

def add_heading_2(doc, text):
    h = doc.add_heading(text, level=2)
    h.paragraph_format.space_before = Pt(12)
    h.paragraph_format.space_after = Pt(4)
    for r in h.runs:
        r.font.name = "Arial"
        r.font.size = Pt(11.5)
        r.bold = True
        r.font.color.rgb = RGBColor(8, 131, 149)
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

def add_code_block(doc, code_text):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.8)
    set_cell_background(cell, "0F172A")
    set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.05
    r = p.add_run(code_text)
    r.font.name = "Courier New"
    r.font.size = Pt(8.5)
    r.font.color.rgb = RGBColor(226, 232, 240)
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def build_prompt_doc():
    doc = Document()
    
    for s in doc.sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)

    # Title
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(2)
    r_title = p_title.add_run("Implementation Build Prompt")
    r_title.bold = True
    r_title.font.name = "Arial"
    r_title.font.size = Pt(22)
    r_title.font.color.rgb = RGBColor(15, 43, 72)

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(4)
    r_sub = p_sub.add_run("Tourist Proof of Payment Submission & Hotel Front-Desk Verification Subsystem")
    r_sub.bold = True
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(14)
    r_sub.font.color.rgb = RGBColor(8, 131, 149)

    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_after = Pt(14)
    r_meta = p_meta.add_run("Document Scope: Build Prompt & Technical Blueprint for Engineering Execution\n"
                           "Date: November 06, 2026 | Environment: Swat Tourism Production V2 | Target: Release Milestone")
    r_meta.font.name = "Arial"
    r_meta.font.size = Pt(9)
    r_meta.font.color.rgb = RGBColor(100, 116, 139)

    add_callout(
        doc,
        "Subsystem Objective & Value Proposition",
        "This implementation prompt establishes the end-to-end specifications for capturing, storing, and verifying "
        "direct tourist payment evidence. It bridges the gap between tourist mobile banking apps and hotel operations by "
        "capturing exact amounts, transaction IDs (TIDs), sender account details, transfer timestamps, and bank screenshot slips, "
        "giving hotel managers an intuitive single-click verification and fraud-prevention workflow.",
        bg_color="F0F9FA",
        border_color="088395"
    )

    # 1. Functional Requirements
    add_heading_1(doc, "1. Functional Requirements & User Experience")
    
    add_heading_2(doc, "1.1 Tourist Proof Submission Flow")
    add_body_p(doc, "The tourist will be supported across two intuitive workflows:")
    add_body_p(doc, 
        "Journey A (At Checkout Time): In `UnifiedCheckoutModal.tsx`, when selecting Track 2 (Direct Hotel Transfer), "
        "the modal reveals the hotel's verified banking credentials (Meezan Bank IBAN, Easypaisa/Raast ID) and a dedicated "
        "Payment Proof Submission Card. The tourist inputs the transfer details, attaches their bank screenshot, and submits."
    )
    add_body_p(doc, 
        "Journey B (Post-Booking from 'My Bookings'): If a tourist reserves a room first and transfers money afterwards, "
        "their booking card displays an amber badge: 'Advance Deposit Pending Verification' with an `[Upload Payment Slip / TID]` "
        "button opening the proof submission modal."
    )

    tbl_fields = doc.add_table(rows=1, cols=3)
    tbl_fields.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_fields)
    f_hdrs = tbl_fields.rows[0].cells
    f_hdrs[0].width = Inches(1.8)
    f_hdrs[1].width = Inches(2.5)
    f_hdrs[2].width = Inches(2.5)

    headers = ["Field Name", "Input Type & Validation", "Business Purpose & Description"]
    for i, h_text in enumerate(headers):
        set_cell_background(f_hdrs[i], "0F2B48")
        set_cell_margins(f_hdrs[i])
        p = f_hdrs[i].paragraphs[0]
        r = p.add_run(h_text)
        r.bold = True
        r.font.name = "Arial"
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(255, 255, 255)

    fields_data = [
        ("Payment Medium", "Dropdown Selector", "Easypaisa, JazzCash, Meezan Bank, HBL, Allied Bank, Bank Alfalah, Raast, Cash"),
        ("Exact Amount (PKR)", "Numeric Input (> 0.00)", "Exact monetary value transferred (pre-filled with required advance)"),
        ("Transaction TID / Ref #", "Alphanumeric (Required)", "Bank or Telco Transaction Reference ID from SMS or app"),
        ("Sender Account / Title", "Text Input", "Sender phone number (0300-XXXXXXX) or Bank Account Title"),
        ("Transfer Timestamp", "Date-Time Selector", "Exact time money was sent from the tourist's account"),
        ("Proof Slip Attachment", "File Upload (Image/PDF)", "Screenshot slip or PDF transfer confirmation (max 5MB)"),
        ("Tourist Notes", "Text Area (Optional)", "Special notes e.g., 'Transferred from brother's account'")
    ]

    for row_idx, r_data in enumerate(fields_data):
        row = tbl_fields.add_row()
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

    add_heading_2(doc, "1.2 Hotel Front-Desk Verification Flow (`HotelTodayScreen.tsx`)")
    add_body_p(doc, 
        "1. Prominent Verification Banner: Bookings with pending direct payments feature an amber attention pill on the front-desk dashboard."
    )
    add_body_p(doc, 
        "2. Payment Proof Inspector Modal: Clicking the alert opens the high-resolution screenshot slip with zoom, copyable TID, and sender metadata."
    )
    add_body_p(doc, 
        "3. Decision Actions: Front-desk staff can either `[✓ Approve & Confirm Reservation]` (which locks the room, marks the payment verified, and sends an SMS voucher to the tourist) or `[✗ Reject Proof Slip]` with an explanatory reason."
    )

    # 2. Technical Architecture
    add_heading_1(doc, "2. Technical Architecture & Endpoints")
    add_body_p(doc, "The implementation requires adding the following API endpoints and database mappings:")

    add_code_block(doc,
"""POST /api/v1/bookings/{booking_id}/upload-payment-proof
Accepts: multipart/form-data
- proof_file: UploadFile (Image/PDF)
- payment_medium: str ('easypaisa' | 'jazzcash' | 'meezan_bank' | 'raast')
- amount_paid: float
- transaction_ref: str (TID)
- sender_account: str
- transfer_timestamp: datetime
- notes: Optional[str]

Saves:
- Uploads file to /uploads/payment_proofs/
- Inserts/updates `booking_payments` row with:
  • payment_role = 'advance_deposit'
  • funds_custody = 'hotel_operator'
  • verification_status = 'pending_hotel_approval'
  • receipt_image_url = '/uploads/payment_proofs/...'

POST /api/v1/bookings/{booking_id}/verify-direct-deposit
Accepts: JSON { action: 'approve' | 'reject', notes: str }
- Verifies business ownership
- If approved: booking.status = 'confirmed', payment_status = 'deposit_paid'
- If rejected: notifies tourist to resubmit"""
    )

    # 3. Acceptance Criteria
    add_heading_1(doc, "3. Acceptance Criteria & Verification Plan")
    add_body_p(doc, "1. Tourist can upload a screenshot slip with TID, sender account, and timestamp.", bold_prefix="• ")
    add_body_p(doc, "2. Uploaded image is stored securely and accessible via URL.", bold_prefix="• ")
    add_body_p(doc, "3. Hotel front desk sees the full slip preview and can copy the TID.", bold_prefix="• ")
    add_body_p(doc, "4. One-click approval stamps cashier user ID and dispatches guest voucher.", bold_prefix="• ")
    add_body_p(doc, "5. Rejection prompts for a reason and notifies customer.", bold_prefix="• ")

    add_callout(
        doc,
        "Approval Request",
        "Please review this technical prompt. Upon your approval, the engineering team will implement "
        "the multipart proof upload endpoint, the screenshot storage handler, and the interactive frontend Proof Inspector Modal.",
        bg_color="ECFDF5",
        border_color="10B981"
    )

    p1 = r"F:\Antigravity\SwatTourismProduction\Docs\tourist-payment-proof-submission-and-verification-prompt.docx"
    p2 = r"F:\Antigravity\SwatTourismProduction_v2\Docs\tourist-payment-proof-submission-and-verification-prompt.docx"
    
    doc.save(p1)
    doc.save(p2)
    print(f"Prompt docx successfully created at:\n- {p1}\n- {p2}")

if __name__ == "__main__":
    build_prompt_doc()
