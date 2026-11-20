import os
import shutil
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

DOCS_DIR = os.path.abspath("Docs")
DOWNLOADS_DIR = os.path.join(os.environ.get("USERPROFILE", "C:\\Users\\shahkhalid1"), "Downloads")

DOCX_FILENAME = "Swat_Tourism_Hotel_Property_Booking_Page_Implementation_Plan.docx"
MD_FILENAME = "Swat_Tourism_Hotel_Property_Booking_Page_Implementation_Plan.md"

DOCX_PATH = os.path.join(DOCS_DIR, DOCX_FILENAME)
DOCX_DOWNLOAD = os.path.join(DOWNLOADS_DIR, DOCX_FILENAME)

MD_PATH = os.path.join(DOCS_DIR, MD_FILENAME)
MD_DOWNLOAD = os.path.join(DOWNLOADS_DIR, MD_FILENAME)

def create_styled_element(name):
    return OxmlElement(name)

def set_cell_background(cell, hex_color):
    tcPr = cell._element.get_or_add_tcPr()
    shd = create_styled_element('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = create_styled_element('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = create_styled_element(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def generate_doc():
    doc = docx.Document()

    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)

    # Document Subtitle
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(2)
    r_sub = p_sub.add_run("SWAT TOURISM PLATFORM (PRODUCTION) — UI/UX ARCHITECTURE & IMPLEMENTATION PLAN")
    r_sub.font.name = 'Segoe UI'
    r_sub.font.size = Pt(9.5)
    r_sub.font.bold = True
    r_sub.font.color.rgb = RGBColor(0x00, 0x5A, 0x36)

    # Document Title
    h0 = doc.add_paragraph()
    h0.paragraph_format.space_after = Pt(8)
    r_h0 = h0.add_run("Booking.com-Style Hotel Property Booking Page")
    r_h0.font.name = 'Segoe UI'
    r_h0.font.size = Pt(22)
    r_h0.font.bold = True
    r_h0.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    # Metadata Box
    meta_table = doc.add_table(rows=1, cols=1)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_cell = meta_table.rows[0].cells[0]
    meta_cell.width = Inches(6.8)
    set_cell_background(meta_cell, 'F0FDF4')
    set_cell_margins(meta_cell, top=140, bottom=140, left=180, right=180)

    p_meta = meta_cell.paragraphs[0]
    p_meta.paragraph_format.space_before = Pt(0)
    p_meta.paragraph_format.space_after = Pt(0)
    r_meta = p_meta.add_run(
        "Platform: Swat Tourism Production Portal (KP Tourism Authority)\n"
        "Feature: Dedicated In-Shell Property View (Replacing Popup Dialog with Single-Page Booking Flow)\n"
        "Design Standard: Booking.com / Agoda Canonical Continuous-Page Architecture (No Tab Hiding)\n"
        "Status: Approved for Implementation | Date: November 2026"
    )
    r_meta.font.name = 'Segoe UI'
    r_meta.font.size = Pt(9.5)
    r_meta.font.color.rgb = RGBColor(0x16, 0x65, 0x34)

    # Section 1: Executive Summary
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(16)
    h1.paragraph_format.space_after = Pt(4)
    r1 = h1.add_run("1. Executive Summary & Problem Definition")
    r1.font.name = 'Segoe UI'
    r1.font.size = Pt(14)
    r1.font.bold = True
    r1.font.color.rgb = RGBColor(0x00, 0x5A, 0x36)

    p1 = doc.add_paragraph()
    p1.paragraph_format.space_after = Pt(6)
    p1.add_run(
        "Currently, clicking 'View Rooms & Instant Reserve' on a hotel card opens a floating modal popup dialog. "
        "While functional for quick lookups, modal dialogs suffer from three major UX constraints on desktop and mobile: "
        "(1) cramped screen real estate that limits photo galleries and room comparison, (2) tab-switching fragmentation "
        "where users must jump between 'Rooms', 'Facilities', and 'Policies' tabs, and (3) accidental backdrop dismissals "
        "that lose selected room states.\n\n"
        "This implementation plan transitions hotel details to a full in-shell property page modeled after Booking.com. "
        "The entire property experience renders seamlessly inside the main application shell with a continuous single-page "
        "scroll layout, prominent sticky breadcrumb navigation, dynamic room selection table, and instantaneous checkout."
    )

    # Section 2: Architecture & Layout
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(4)
    r2 = h2.add_run("2. Booking.com-Style 8-Section Continuous Page Architecture")
    r2.font.name = 'Segoe UI'
    r2.font.size = Pt(14)
    r2.font.bold = True
    r2.font.color.rgb = RGBColor(0x00, 0x5A, 0x36)

    sections_data = [
        ("1. Header & Navigation", "Breadcrumb path (Swat > Mingora > Swat Serena Hotel), 'Back to Explore' return button, verified badge, star rating, exact address, and quick 'Reserve Now' anchor button."),
        ("2. Hero Photo Mosaic Gallery", "Signature 5-photo mosaic layout: 1 large high-definition exterior hero shot (60% width) + 4-photo grid (Deluxe room, dining, garden, mountain view) with a '+18 Photos' gallery trigger."),
        ("3. Sticky Anchor Sub-Nav", "A slim horizontal bar that sticks below the main header as the tourist scrolls: 'Overview', 'Rooms & Rates', 'Facilities & Amenities', 'Location & Map', and 'Property Policies' (smooth-scrolls without tab hiding)."),
        ("4. Active Deal Ribbon", "High-visibility promotional banner showcasing live discounts (e.g. '🔥 Winter Snow Fall Offer: 20% Discount auto-applied to all room types!')."),
        ("5. Room Availability & Selection Table", "Interactive comparison table with room photos, bed configuration, square footage, occupancy icons, strikethrough original prices, net discounted rate, room quantity dropdowns, and live running total summary."),
        ("6. Comprehensive Facilities Grid", "4-column icon grid showing all verified amenities: Power backup/generators, heating, high-speed Wi-Fi, Swati cuisine dining, room service, free parking, and security."),
        ("7. Location, Map & Surroundings", "Interactive map preview with verified GPS coordinates and driving/walking distances to Swat Museum, Saidu Sharif Airport, White Palace, and Malam Jabba."),
        ("8. House Rules & Policies", "Check-in time (14:00), check-out time (12:00), cancellation rules (free cancellation up to 24 hours), and accepted payment methods (Cards, JazzCash, EasyPaisa, Cash on Arrival).")
    ]

    for title, desc in sections_data:
        p_sec = doc.add_paragraph()
        p_sec.paragraph_format.space_after = Pt(3)
        r_t = p_sec.add_run(f"• {title}: ")
        r_t.font.name = 'Segoe UI'
        r_t.font.bold = True
        r_t.font.size = Pt(10)
        r_d = p_sec.add_run(desc)
        r_d.font.name = 'Segoe UI'
        r_d.font.size = Pt(10)

    # Section 3: Room Selection & Instant Booking Flow
    h3 = doc.add_paragraph()
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(4)
    r3 = h3.add_run("3. Room Selection & Real-Time Booking Engine")
    r3.font.name = 'Segoe UI'
    r3.font.size = Pt(14)
    r3.font.bold = True
    r3.font.color.rgb = RGBColor(0x00, 0x5A, 0x36)

    p3 = doc.add_paragraph()
    p3.paragraph_format.space_after = Pt(6)
    p3.add_run(
        "The core innovation is the integrated room selection engine modeled directly on Booking.com:\n"
        "1. Real-Time Date & Stay Calculation: Check-in and check-out dates are prefilled from the search or easily changed on the page, updating the nights count instantly.\n"
        "2. Room Quantity Dropdowns: Each room tier (Deluxe, Executive, Suite) has a quantity selector (0, 1, 2, 3 rooms).\n"
        "3. Live Price Recalculation: Selecting rooms dynamically updates the subtotal, subtracts active promotion discounts, and presents a transparent net payable amount.\n"
        "4. Sticky Reservation Summary Drawer: When at least 1 room is selected, a floating bar docks to the bottom right with '1 Room selected • Total: PKR 14,800 • Instant Reserve Now ➔'.\n"
        "5. One-Click Booking Request: Submits directly to the backend API (`/api/v1/bookings/request`) with promo codes, returning instant booking references and downloadable vouchers."
    )

    # Section 4: Implementation Plan & File Modifications
    h4 = doc.add_paragraph()
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(4)
    r4 = h4.add_run("4. Implementation Plan & File Structure")
    r4.font.name = 'Segoe UI'
    r4.font.size = Pt(14)
    r4.font.bold = True
    r4.font.color.rgb = RGBColor(0x00, 0x5A, 0x36)

    table_files = doc.add_table(rows=1, cols=3)
    table_files.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = table_files.rows[0].cells
    hdr[0].text = "Component / File"
    hdr[1].text = "Action"
    hdr[2].text = "Scope & Description"
    for cell in hdr:
        set_cell_background(cell, '005A36')
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        for p in cell.paragraphs:
            for r in p.runs:
                r.font.name = 'Segoe UI'
                r.font.bold = True
                r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                r.font.size = Pt(9.5)

    files_info = [
        ("HotelPropertyDetailsView.tsx", "Create New", "New dedicated full-page hotel component in `frontend/src/modules/tourist/`. Houses the 8-section layout, photo mosaic, rooms table, amenities, and booking drawer."),
        ("TouristShell.tsx", "Modify", "Add `selectedHotelForDetails` state. When set, render `HotelPropertyDetailsView` inside the main body instead of the modal dialog, with breadcrumbs and back button."),
        ("ListingCard.tsx", "Modify", "Ensure `onViewHotelDetails` invokes the full-page view switch seamlessly."),
        ("TouristHomeModern.tsx", "Modify", "Allow cards on modern home to also open the full property page directly when clicked.")
    ]

    for fname, action, desc in files_info:
        row = table_files.add_row().cells
        row[0].text = fname
        row[1].text = action
        row[2].text = desc
        for idx, cell in enumerate(row):
            set_cell_background(cell, 'F8FAFC' if idx % 2 == 0 else 'FFFFFF')
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            for p in cell.paragraphs:
                for r in p.runs:
                    r.font.name = 'Segoe UI'
                    r.font.size = Pt(9)
                    if idx == 0:
                        r.font.bold = True
                        r.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    doc.save(DOCX_PATH)
    shutil.copyfile(DOCX_PATH, DOCX_DOWNLOAD)
    print(f"Docx saved to: {DOCX_PATH} and {DOCX_DOWNLOAD}")

    # Generate Markdown documentation as well
    md_content = f"""# Swat Tourism Platform — Booking.com-Style Hotel Property Booking Page Implementation Plan

**Platform:** Swat Tourism Production Portal (KP Tourism Authority)  
**Feature:** Dedicated In-Shell Property View (Replacing Popup Dialog with Single-Page Booking Flow)  
**Design Standard:** Booking.com / Agoda Canonical Continuous-Page Architecture (No Tab Hiding)  
**Status:** Approved for Implementation | Date: November 2026  

---

## 1. Executive Summary & Problem Definition
Currently, clicking 'View Rooms & Instant Reserve' on a hotel card opens a floating modal popup dialog. While functional for quick lookups, modal dialogs suffer from three major UX constraints on desktop and mobile:
1. **Cramped screen real estate** that limits photo galleries and room comparison.
2. **Tab-switching fragmentation** where users must jump between 'Rooms', 'Facilities', and 'Policies' tabs.
3. **Accidental backdrop dismissals** that lose selected room states.

This implementation plan transitions hotel details to a full in-shell property page modeled after Booking.com. The entire property experience renders seamlessly inside the main application shell with a continuous single-page scroll layout, prominent sticky breadcrumb navigation, dynamic room selection table, and instantaneous checkout.

---

## 2. Booking.com-Style 8-Section Continuous Page Architecture
1. **Header & Navigation:** Breadcrumb path (`Swat > Mingora > Swat Serena Hotel`), 'Back to Explore' return button, verified badge, star rating, exact address, and quick 'Reserve Now' anchor button.
2. **Hero Photo Mosaic Gallery:** Signature 5-photo mosaic layout: 1 large high-definition exterior hero shot (60% width) + 4-photo grid (Deluxe room, dining, garden, mountain view) with a '+18 Photos' gallery trigger.
3. **Sticky Anchor Sub-Nav:** A slim horizontal bar that docks below the header as the tourist scrolls: 'Overview', 'Rooms & Rates', 'Facilities & Amenities', 'Location & Map', and 'Property Policies' (smooth-scrolls without tab hiding).
4. **Active Deal Ribbon:** High-visibility promotional banner showcasing live discounts (e.g. `🔥 Winter Snow Fall Offer: 20% Discount auto-applied to all room types!`).
5. **Room Availability & Selection Table:** Interactive comparison table with room photos, bed configuration, square footage, occupancy icons, strikethrough original prices, net discounted rate, room quantity dropdowns, and live running total summary.
6. **Comprehensive Facilities Grid:** 4-column icon grid showing all verified amenities: Power backup/generators, heating, high-speed Wi-Fi, Swati cuisine dining, room service, free parking, and security.
7. **Location, Map & Surroundings:** Interactive map preview with verified GPS coordinates and driving/walking distances to Swat Museum, Saidu Sharif Airport, White Palace, and Malam Jabba.
8. **House Rules & Policies:** Check-in time (14:00), check-out time (12:00), cancellation rules (free cancellation up to 24 hours), and accepted payment methods (Cards, JazzCash, EasyPaisa, Cash on Arrival).

---

## 3. Implementation Matrix
| Component / File | Action | Scope & Description |
| :--- | :--- | :--- |
| `HotelPropertyDetailsView.tsx` | Create New | New dedicated full-page hotel component in `frontend/src/modules/tourist/`. Houses the 8-section layout, photo mosaic, rooms table, amenities, and booking drawer. |
| `TouristShell.tsx` | Modify | Add `selectedHotelForDetails` state. When set, render `HotelPropertyDetailsView` inside the main body instead of the modal dialog, with breadcrumbs and back button. |
| `ListingCard.tsx` | Modify | Ensure `onViewHotelDetails` invokes the full-page view switch seamlessly. |
| `TouristHomeModern.tsx` | Modify | Allow cards on modern home to also open the full property page directly when clicked. |
"""

    with open(MD_PATH, "w", encoding="utf-8") as f:
        f.write(md_content)
    shutil.copyfile(MD_PATH, MD_DOWNLOAD)
    print(f"Markdown saved to: {MD_PATH} and {MD_DOWNLOAD}")

if __name__ == "__main__":
    generate_doc()

