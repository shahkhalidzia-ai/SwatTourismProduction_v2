import os
import shutil
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

# --- File Paths ---
DOCS_DIR = os.path.abspath("Docs")
DOWNLOADS_DIR = os.path.join(os.environ.get("USERPROFILE", "C:\\Users\\shahkhalid1"), "Downloads")

MD_FILENAME = "hospitality-offers-deals-and-discounts-prompt.md"
DOCX_FILENAME = "Swat_Tourism_Hospitality_Offers_Deals_and_Discounts_Guide.docx"

MD_PATH = os.path.join(DOCS_DIR, MD_FILENAME)
DOCX_PATH = os.path.join(DOCS_DIR, DOCX_FILENAME)

MD_DOWNLOAD = os.path.join(DOWNLOADS_DIR, MD_FILENAME)
DOCX_DOWNLOAD = os.path.join(DOWNLOADS_DIR, DOCX_FILENAME)

# --- Markdown Prompt Content ---
MARKDOWN_PROMPT = """# Swat Tourism Platform — Hospitality Offers, Deals & Discounts Architecture and Implementation Prompt

> **Feature Scope:** Vendor Promotion Management, Multi-Sector Deal Types (Hotels, Transport, Guides, Restaurants), Dynamic Price Calculation Engine, Tourist Discovery & Checkout Voucher Redemption  
> **Target Audience:** Full-Stack Engineers, System Architects, Hospitality Business Operators, and Product Managers  
> **Status:** Architecture Specification & Implementation Prompt  
> **Target Stack:** FastAPI (Python 3.11+) + PostgreSQL / SQLite (SQLAlchemy 2.0 async) + React 19 / TypeScript / Tailwind CSS  

---

## 1. System Objective & Problem Context

In seasonal tourism ecosystems like Swat Valley (encompassing Kalam, Malam Jabba, Mahodand Lake, Mingora, Bahrain, and Miandam), hospitality businesses experience stark occupancy and demand fluctuations:
1. **Off-peak lull vs. peak holiday rush:** Hotels and transport providers experience low occupancy during non-holiday weekdays and severe off-season periods, requiring dynamic promotional discounts to attract travelers.
2. **Lack of self-service marketing tools for local providers:** Currently, hotels, jeep drivers, tour guides, and restaurants have static pricing in `price_items`. They cannot publish time-limited flash sales, early-bird incentives, group packages, or promotional coupon codes.
3. **Tourist transparency & conversion:** Tourists want transparent strike-through prices, promotional badges (e.g., `Save 20%`, `Winter Snow Festival Deal`), and coupon code inputs at checkout.

This specification details how hospitality providers configure, publish, and track their offers, and how the platform dynamically enforces and calculates these discounts across search, listing detail, and booking checkout.

---

## 2. Sector-Specific Deal Models

### 2.1 Hotels, Resorts & Homestays
- **Seasonal / Off-Peak Discount:** Percentage discount (e.g., 25% off) for stays booked during target date ranges (e.g., winter weekdays in Kalam).
- **Length-of-Stay (LOS) Deals:** Incentivize extended stays (e.g., "Stay 3 nights or more, get 20% off").
- **Last-Minute Flash Deals:** Auto-activated or manually enabled discounts for vacant rooms within 24 to 48 hours of check-in.
- **Early Bird Reservations:** Advance bookings made 20+ days prior to arrival receive a 10-15% discount.

### 2.2 Transport & 4x4 Jeep Fleets
- **Round-Trip & Bundle Discounts:** Flat discount or 15% off when booking both outbound and return rides (e.g., Mingora ⇄ Kalam ⇄ Mahodand Lake).
- **Weekday Safari Discount:** 20% off standard fares for off-peak days (Monday to Thursday).
- **Multi-Day Vehicle Rental:** Tiered discount for renting a vehicle with driver for 3+ continuous days.

### 2.3 Tour Guides
- **Group Tier Discounts:** Flat rate reduction for private groups larger than 4 or 6 members.
- **Combo Tours:** Bundled thematic tours (e.g., Gandhara Buddhist Heritage Trail + Swat Museum tour).
- **Student & Educational Concessions:** 25% coupon code applicable upon showing student ID.

### 2.4 Restaurants & Cafes
- **Meal Combos & Fixed Platters:** Multi-course meal packages (e.g., Trout Fish Family Platter + Bread + Sides).
- **Happy Hours / Off-Peak Dining:** 15% discount between 2:00 PM and 5:00 PM.
- **Complimentary Value-Adds:** Free traditional Green Tea (Qahwa) or dessert with orders above a threshold (e.g., PKR 3,000).

---

## 3. End-to-End Workflow

### 3.1 Business Provider Lifecycle
1. **Access:** Provider navigates to `Business Portal -> Listings -> Offers & Deals`.
2. **Creation Form:**
   - **Target Scope:** All listings under business OR specific listing (e.g., "Serena Hotel Mingora") OR specific `price_item` (e.g., "Deluxe Room").
   - **Promotion Type:** `percentage` (e.g., 20%), `fixed_amount` (e.g., PKR 2,000 off), or `rate_override` (e.g., Special PKR 8,000/night).
   - **Promo Code (Optional):** Custom code (e.g., `SWATWINTER26`) or automatic direct discount without code.
   - **Validity Window:** Start date/time and End date/time.
   - **Stay / Travel Dates:** Optional date range restricting when the tourist can actually stay or travel.
   - **Guardrails:** Minimum spend threshold, minimum nights/days, usage quota (e.g., first 50 bookings), max discount cap.
   - **Marketing Badges:** Catchy title, description, and badge label (e.g., "Early Bird", "Weekend Deal").
3. **Activation:** Promotion is verified against basic sanity rules (e.g., discount value < 90%) and set to `active`.
4. **Performance Tracking:** Providers monitor redemptions, total discount given, and total revenue earned through the campaign.

### 3.2 Tourist Experience & Pricing Engine
1. **Discovery:**
   - Homepage features a **"Special Deals & Offers"** curated shelf and filter pill.
   - Listing cards show strike-through prices: `~~PKR 15,000~~ PKR 12,000 / night` and a badge: `20% OFF`.
2. **Booking & Checkout Calculation:**
   - Automatic promotions apply seamlessly to the booking summary if criteria are met.
   - If the tourist has a coupon code, they enter it into the "Apply Promo Code" field; the backend verifies validity and recalculates totals instantly.
   - Transparent price breakdown: Subtotal -> Discount Applied -> Platform Service Fee -> Taxes -> Net Payable.

---

## 4. Technical Architecture & Database Models

### 4.1 Schema Definition (`backend/app/modules/listings/models.py` or `finance/models.py`)

```python
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, Boolean, Integer, Numeric, DateTime, ForeignKey, CheckConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin

class Promotion(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "promotions"

    business_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("business_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    listing_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("listings.id", ondelete="CASCADE"), nullable=True, index=True)
    price_item_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("price_items.id", ondelete="SET NULL"), nullable=True, index=True)

    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    promo_code: Mapped[Optional[str]] = mapped_column(String(30), unique=True, nullable=True, index=True)
    
    discount_type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'percentage', 'fixed_amount', 'rate_override'
    discount_value: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    max_discount_cap: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    
    # Conditions
    min_booking_amount: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    min_nights_or_days: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    
    # Scheduling & Quota
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    travel_start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    travel_end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    usage_limit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    usage_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    badge_label: Mapped[Optional[str]] = mapped_column(String(40), default="Special Deal", nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    __table_args__ = (
        CheckConstraint("discount_type IN ('percentage', 'fixed_amount', 'rate_override')", name="check_promo_discount_type"),
        CheckConstraint("discount_value > 0", name="check_promo_positive_value"),
    )

    business: Mapped["app.modules.accounts.models.BusinessProfile"] = relationship("BusinessProfile")
    listing: Mapped[Optional["Listing"]] = relationship("Listing")
    price_item: Mapped[Optional["PriceItem"]] = relationship("PriceItem")
    redemptions: Mapped[List["PromotionRedemption"]] = relationship("PromotionRedemption", back_populates="promotion", cascade="all, delete-orphan")


class PromotionRedemption(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "promotion_redemptions"

    promotion_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("promotions.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    discount_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    promotion: Mapped["Promotion"] = relationship("Promotion", back_populates="redemptions")
```

---

## 5. REST API Specifications

### 5.1 Business Portal Endpoints (`/api/v1/business/promotions`)
- `POST /api/v1/business/promotions`: Create a new campaign.
- `GET /api/v1/business/promotions`: List all promotions for the authenticated business profile with redemption metrics.
- `GET /api/v1/business/promotions/{id}`: Detailed view of a campaign including redemptions history.
- `PATCH /api/v1/business/promotions/{id}`: Update dates, toggle active/paused status, or modify limits.
- `DELETE /api/v1/business/promotions/{id}`: Soft delete or terminate a promotion.

### 5.2 Tourist Endpoints (`/api/v1/promotions`)
- `GET /api/v1/promotions/active`: Retrieve featured active deals for the homepage and explore screens.
- `GET /api/v1/listings/{listing_id}/promotions`: Retrieve all applicable promotions for a specific hotel, vehicle, or tour.
- `POST /api/v1/promotions/validate-code`: Validates a promo code against a cart/booking draft:
  ```json
  // Request
  {
    "promo_code": "SWATWINTER26",
    "listing_id": "...",
    "price_item_id": "...",
    "subtotal": 24000.0,
    "units": 2,
    "stay_start": "2026-12-01",
    "stay_end": "2026-12-03"
  }
  // Response
  {
    "is_valid": true,
    "discount_amount": 4800.0,
    "new_total": 19200.0,
    "badge_label": "Winter 20% Off",
    "promotion_id": "..."
  }
  ```

---

## 6. Calculation Logic in Booking Service (`bookings/service.py`)

When computing the final checkout total:
```python
def calculate_discounted_total(
    subtotal: float,
    promotion: Optional[Promotion],
    stay_days: int = 1
) -> tuple[float, float]:
    \"\"\"Calculates discount amount and final total before fees.\"\"\"
    if not promotion or not promotion.is_active:
        return 0.0, subtotal

    now = datetime.now(timezone.utc)
    if now < promotion.start_date or now > promotion.end_date:
        return 0.0, subtotal

    if promotion.usage_limit and promotion.usage_count >= promotion.usage_limit:
        return 0.0, subtotal

    if promotion.min_booking_amount and subtotal < float(promotion.min_booking_amount):
        return 0.0, subtotal

    if stay_days < promotion.min_nights_or_days:
        return 0.0, subtotal

    discount = 0.0
    dtype = promotion.discount_type
    val = float(promotion.discount_value)

    if dtype == "percentage":
        discount = (subtotal * val) / 100.0
        if promotion.max_discount_cap:
            discount = min(discount, float(promotion.max_discount_cap))
    elif dtype == "fixed_amount":
        discount = min(val, subtotal)
    elif dtype == "rate_override":
        # val is overridden unit rate
        standard_unit_price = subtotal / max(1, stay_days)
        if val < standard_unit_price:
            discount = (standard_unit_price - val) * stay_days

    discount = round(max(0.0, discount), 2)
    final_amount = max(0.0, subtotal - discount)
    return discount, final_amount
```

---

## 7. Frontend UI Specification

### 7.1 Business Vendor Dashboard (`BusinessDealsManager.tsx`)
1. **Deals Table / Grid:** List of campaigns with columns: Title, Code, Discount, Dates, Usage Quota, Status Toggle (Active/Paused), and Actions.
2. **Create / Edit Modal:** Clean multi-step or tabbed form:
   - Step 1: Basics (Title, Badge, Description).
   - Step 2: Discount Model (% or Fixed) & Target Listing/Room/Ride.
   - Step 3: Timing & Rules (Validity dates, Min nights, Limit).
   - Step 4: Preview Card showing how the deal will appear to tourists.

### 7.2 Tourist Portal (`TouristListingCard.tsx` & `BookingModal.tsx`)
1. **Listing Cards:** Strike-through price badge (`~~PKR 14,000~~ PKR 11,200`), badge pill `[20% OFF]`.
2. **Booking Modal:**
   - Promo summary line showing auto-applied savings.
   - "Have a Coupon Code?" collapsible input field.
   - Real-time instant recalculation with visual confirmation toast.

---

## 8. Anti-Abuse & Guardrail Rules

1. **Anti-Stacking Policy:** Maximum 1 coupon or promotion allowed per booking transaction to protect vendor margins.
2. **Price Integrity Safeguard:** Cap maximum percentage discount at 75% to prevent accidental entry errors (e.g. typing 100% instead of 10%).
3. **Strict Date Enforcement:** Expired promotions automatically fail validation on checkout submission even if the page was cached.
4. **Usage Concurrency Locking:** When a booking is finalized, `usage_count` is incremented atomically; if usage reaches `usage_limit`, the promotion is automatically deactivated.

---

## 9. Verification & Acceptance Testing Criteria

1. **Test Hotel Length-of-Stay:** Create a "Stay 3 nights get 20% off" deal. Booking for 2 nights gives 0% discount; booking for 3 nights gives 20% off.
2. **Test Transport Flat Coupon:** Create coupon `JEEP1000` for PKR 1,000 off. Applying it at checkout reduces the fare by exactly PKR 1,000.
3. **Test Quota Exhaustion:** Create a promotion with `usage_limit = 1`. Complete 1 booking; verify the second attempt displays "Promotion limit reached".
4. **Test Blackout / Expiration:** Set end date to yesterday; verify coupon fails with "This promotion has expired".
"""

def create_styled_element(name):
    return OxmlElement(name)

def set_cell_background(cell, hex_color):
    tcPr = cell._element.get_or_add_tcPr()
    shd = create_styled_element('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = create_styled_element('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = create_styled_element(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def generate_docx():
    doc = docx.Document()

    # Page Margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)

    # Header / Subtitle
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(2)
    r_sub = p_sub.add_run("SWAT TOURISM PLATFORM (PRODUCTION) — ARCHITECTURE & STRATEGY GUIDE")
    r_sub.font.name = 'Segoe UI'
    r_sub.font.size = Pt(9.5)
    r_sub.font.bold = True
    r_sub.font.color.rgb = RGBColor(0x00, 0x5A, 0x36)  # Swat Pine Emerald

    # Document Title
    h0 = doc.add_paragraph()
    h0.paragraph_format.space_after = Pt(8)
    r_h0 = h0.add_run("Hospitality Offers, Deals & Discounts Publishing System")
    r_h0.font.name = 'Segoe UI'
    r_h0.font.size = Pt(22)
    r_h0.font.bold = True
    r_h0.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)  # Slate 900

    # Metadata Callout Box
    meta_table = doc.add_table(rows=1, cols=1)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_cell = meta_table.rows[0].cells[0]
    meta_cell.width = Inches(6.8)
    set_cell_background(meta_cell, 'F0FDF4')  # Mint 50
    set_cell_margins(meta_cell, top=140, bottom=140, left=180, right=180)

    p_meta = meta_cell.paragraphs[0]
    p_meta.paragraph_format.space_after = Pt(0)
    
    r1 = p_meta.add_run("Hospitality Sectors Covered: ")
    r1.bold = True
    r1.font.color.rgb = RGBColor(0x00, 0x5A, 0x36)
    p_meta.add_run("Hotels, Resorts, 4x4 Jeeps & Transport, Tour Guides, Restaurants, Community Homestays\n")
    
    r2 = p_meta.add_run("Key Capabilities: ")
    r2.bold = True
    p_meta.add_run("Self-Service Vendor Dashboard, Dynamic Pricing Engine, Checkout Voucher Redemption, Fraud Guardrails\n")
    
    r3 = p_meta.add_run("Target Stack: ")
    r3.bold = True
    p_meta.add_run("FastAPI + SQLAlchemy 2.0 (PostgreSQL/SQLite) + React 19 / TypeScript / Vite\n")
    
    r4 = p_meta.add_run("Status: ")
    r4.bold = True
    r_stat = p_meta.add_run("APPROVED SPECIFICATION & COMPLETE DEVELOPER PROMPT")
    r_stat.bold = True
    r_stat.font.color.rgb = RGBColor(0x05, 0x96, 0x69)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 1. Executive Summary
    h1 = doc.add_heading(level=1)
    r_h1 = h1.add_run("1. Executive Summary & Vision")
    r_h1.font.name = 'Segoe UI'
    r_h1.font.size = Pt(14)
    r_h1.font.bold = True
    r_h1.font.color.rgb = RGBColor(0x00, 0x5A, 0x36)

    p1 = doc.add_paragraph(
        "In seasonal tourism markets such as Swat Valley (encompassing Kalam, Malam Jabba, Mahodand Lake, Mingora, Bahrain, "
        "and Miandam), tourism demand fluctuates dramatically between high seasons (summer vacations and winter snowfalls) and off-peak "
        "periods. Without automated promotional tools, providers cannot flexibly stimulate demand, fill vacant hotel rooms, utilize idle "
        "jeeps on weekdays, or offer group packages."
    )
    p1.paragraph_format.space_after = Pt(4)

    p2 = doc.add_paragraph(
        "This specification outlines how hospitality service providers (Hotels, Transport Operators, Tour Guides, and Restaurants) "
        "can create, publish, and track customized offers and discounts via their business dashboard, and how tourists discover and "
        "redeem them smoothly with transparent pricing and real-time checkout calculation."
    )
    p2.paragraph_format.space_after = Pt(8)

    # 2. Sector Specific Strategies
    h2 = doc.add_heading(level=1)
    r_h2 = h2.add_run("2. Sector-Specific Deal Types & Strategies")
    r_h2.font.name = 'Segoe UI'
    r_h2.font.size = Pt(14)
    r_h2.font.bold = True
    r_h2.font.color.rgb = RGBColor(0x00, 0x5A, 0x36)

    # Table of Sectors
    table = doc.add_table(rows=5, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = [("Hospitality Sector", Inches(1.8)), ("Tailored Deal Mechanics", Inches(2.6)), ("Swat Valley Practical Example", Inches(2.4))]
    hdr_row = table.rows[0]
    for idx, (txt, w) in enumerate(headers):
        cell = hdr_row.cells[idx]
        cell.width = w
        set_cell_background(cell, 'F1F5F9')
        p = cell.paragraphs[0]
        r = p.add_run(txt)
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    rows_data = [
        ("Hotels, Resorts & Homestays", 
         "• Length-of-Stay (Stay 3+ nights, get 20% off)\n• Off-peak seasonal rate reduction\n• Last-minute flash sale (unbooked rooms within 48h)\n• Early bird reservation discount (20+ days ahead)",
         "Kalam Winter Special: 25% off Riverview Deluxe rooms on weekday stays"),
        ("Transport & 4x4 Jeeps",
         "• Round-trip package discount (Kalam ⇄ Mahodand)\n• Off-peak weekday safari discounts\n• Group sharing / Multi-day driver rental bundle",
         "Mahodand Lake Safari: Flat PKR 1,500 off for Monday to Thursday bookings"),
        ("Tour Guides",
         "• Group size tiers (Flat 20% off for 4+ tourists)\n• Heritage & Trekking combo tour packages\n• Student & Family concessions",
         "Buddhist Heritage Trail (Barikot & Butkara): 20% off for family bookings"),
        ("Restaurants & Cafes",
         "• Pre-booked set menu / Family platters\n• Happy hours / Off-peak dining (2 PM - 5 PM)\n• Complimentary Qahwa or trout sides above PKR 3,000",
         "Swat Trout Feast: 15% off lunch platters + complimentary traditional Qahwa")
    ]

    for r_i, (sec, mech, ex) in enumerate(rows_data, 1):
        row = table.rows[r_i]
        for c_i, val in enumerate([sec, mech, ex]):
            cell = row.cells[c_i]
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(9)
            if c_i == 0:
                r.bold = True
                r.font.color.rgb = RGBColor(0x02, 0x84, 0xC7)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 3. Provider Publishing Workflow
    h3 = doc.add_heading(level=1)
    r_h3 = h3.add_run("3. Step-by-Step Provider Publishing Workflow")
    r_h3.font.name = 'Segoe UI'
    r_h3.font.size = Pt(14)
    r_h3.font.bold = True
    r_h3.font.color.rgb = RGBColor(0x00, 0x5A, 0x36)

    steps = [
        ("Step 1: Accessing the Business Deals Manager", "Business owners navigate to their Business Portal -> 'Deals & Promotions' tab. A clean dashboard displays current live campaigns, drafted promotions, and past performance."),
        ("Step 2: Defining Target Inventory", "Providers select whether the promotion applies to their entire business profile, a specific listing (e.g. Serena Swat Hotel), or a specific price item (e.g. Deluxe Room or 4x4 Prado ride)."),
        ("Step 3: Selecting Discount Model", "Choice of Percentage discount (e.g. 15%), Fixed Amount discount (e.g. PKR 1,500 off), or Dynamic Rate Override (e.g. PKR 8,000/night instead of PKR 10,500)."),
        ("Step 4: Scheduling & Safeguard Rules", "Setting booking validity dates (when the offer is bookable), travel/stay dates (when the trip occurs), minimum nights/amount, and usage quota (e.g. limited to the first 25 redemptions)."),
        ("Step 5: Visual Branding & Activation", "Adding catchy badges (e.g. 'FLASH SALE', 'EARLY BIRD', 'FAMILY PACK') and publishing. Once activated, listings automatically display strike-through prices across search and detail pages."),
        ("Step 6: Real-Time Performance Analytics", "Providers track views, redemptions, total discount granted, and gross revenue generated by each promotional campaign.")
    ]

    for s_title, s_desc in steps:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.space_after = Pt(3)
        r_t = p.add_run(f"{s_title}: ")
        r_t.bold = True
        r_t.font.color.rgb = RGBColor(0x02, 0x84, 0xC7)
        p.add_run(s_desc)

    # 4. Data Architecture & Database Models
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    h4 = doc.add_heading(level=1)
    r_h4 = h4.add_run("4. Database Architecture & API Schema")
    r_h4.font.name = 'Segoe UI'
    r_h4.font.size = Pt(14)
    r_h4.font.bold = True
    r_h4.font.color.rgb = RGBColor(0x00, 0x5A, 0x36)

    doc.add_paragraph(
        "The architecture introduces two core relational tables: `promotions` (defining rules, validity, limits, and pricing models) "
        "and `promotion_redemptions` (tracking transactional usage against bookings and users for audit and quota limits)."
    )

    schema_table = doc.add_table(rows=6, cols=3)
    schema_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    s_headers = [("Table & Field", Inches(2.2)), ("Type & Constraint", Inches(1.8)), ("Purpose / Business Logic", Inches(2.8))]
    s_hdr_row = schema_table.rows[0]
    for idx, (txt, w) in enumerate(s_headers):
        cell = s_hdr_row.cells[idx]
        cell.width = w
        set_cell_background(cell, 'F1F5F9')
        p = cell.paragraphs[0]
        r = p.add_run(txt)
        r.bold = True
        r.font.size = Pt(9.5)

    s_rows = [
        ("promotions.business_id", "UUID, FK to business_profiles", "Links campaign strictly to the verified business owner"),
        ("promotions.discount_type", "VARCHAR(20), CHECK in ('percentage', 'fixed_amount', 'rate_override')", "Defines how price deduction is calculated"),
        ("promotions.discount_value", "NUMERIC(10,2), NOT NULL", "The percentage (e.g. 20.00) or flat currency amount (e.g. 1500.00)"),
        ("promotions.min_nights_or_days", "INTEGER, DEFAULT 1", "Enforces length-of-stay requirements (e.g. min 3 nights for LOS deal)"),
        ("promotions.usage_limit & count", "INTEGER, NULLABLE", "Caps total redemptions to prevent unexpected margin depletion")
    ]

    for r_i, (fld, typ, purp) in enumerate(s_rows, 1):
        row = schema_table.rows[r_i]
        for c_i, val in enumerate([fld, typ, purp]):
            cell = row.cells[c_i]
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(9)
            if c_i == 0:
                r.bold = True

    # 5. REST API Reference
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    h5 = doc.add_heading(level=1)
    r_h5 = h5.add_run("5. REST API Reference")
    r_h5.font.name = 'Segoe UI'
    r_h5.font.size = Pt(14)
    r_h5.font.bold = True
    r_h5.font.color.rgb = RGBColor(0x00, 0x5A, 0x36)

    api_table = doc.add_table(rows=6, cols=3)
    api_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    a_headers = [("Method", Inches(1.0)), ("Endpoint", Inches(2.9)), ("Description & Access", Inches(2.9))]
    a_hdr_row = api_table.rows[0]
    for idx, (txt, w) in enumerate(a_headers):
        cell = a_hdr_row.cells[idx]
        cell.width = w
        set_cell_background(cell, 'F1F5F9')
        p = cell.paragraphs[0]
        r = p.add_run(txt)
        r.bold = True
        r.font.size = Pt(9.5)

    a_rows = [
        ("POST", "/api/v1/business/promotions", "Create a new offer, deal, or discount campaign (Business Provider)"),
        ("GET", "/api/v1/business/promotions", "List all promotions with live redemption metrics (Business Provider)"),
        ("PATCH", "/api/v1/business/promotions/{id}", "Pause, reactivate, or modify date ranges of an existing deal"),
        ("GET", "/api/v1/promotions/active", "Fetch active seasonal deals and featured offers (Tourist Public)"),
        ("POST", "/api/v1/promotions/validate-code", "Validates coupon code against cart/dates and returns discount (Tourist)")
    ]

    for r_i, (m, ep, d) in enumerate(a_rows, 1):
        row = api_table.rows[r_i]
        for c_i, val in enumerate([m, ep, d]):
            cell = row.cells[c_i]
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(9)
            if c_i == 0:
                r.bold = True
                r.font.color.rgb = RGBColor(0x02, 0x84, 0xC7)

    # 6. Guardrails & Abuse Prevention
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    h6 = doc.add_heading(level=1)
    r_h6 = h6.add_run("6. Business Guardrails & Anti-Abuse Policies")
    r_h6.font.name = 'Segoe UI'
    r_h6.font.size = Pt(14)
    r_h6.font.bold = True
    r_h6.font.color.rgb = RGBColor(0x00, 0x5A, 0x36)

    policies = [
        ("No Stacking by Default", "Only 1 coupon or promotion can be redeemed per booking transaction to protect vendor profitability."),
        ("Strict Expiry Synchronization", "Expired promotions automatically reject at the moment of booking submission, regardless of cached frontend state."),
        ("Sanity Discount Caps", "Percentage discounts above 75% require explicit confirmation or admin review to avoid unintended catastrophic price typos."),
        ("Atomic Quota Locking", "Campaign redemptions are decremented in database transactions to avoid race conditions when multiple tourists book the last promo spot.")
    ]
    for p_title, p_desc in policies:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.space_after = Pt(3)
        r_t = p.add_run(f"• {p_title}: ")
        r_t.bold = True
        r_t.font.color.rgb = RGBColor(0x05, 0x96, 0x69)
        p.add_run(p_desc)

    # 7. Complete Developer Implementation Prompt
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    h7 = doc.add_heading(level=1)
    r_h7 = h7.add_run("7. Complete Implementation Prompt (For AI & Engineering)")
    r_h7.font.name = 'Segoe UI'
    r_h7.font.size = Pt(14)
    r_h7.font.bold = True
    r_h7.font.color.rgb = RGBColor(0x00, 0x5A, 0x36)

    doc.add_paragraph(
        "The complete, actionable developer prompt is embedded below. This exact prompt can be fed into an AI assistant or coding agent "
        "to implement the entire subsystem end-to-end (database migrations, backend services, router endpoints, frontend vendor UI, and checkout integration)."
    )

    # Prompt Callout Box
    prompt_table = doc.add_table(rows=1, cols=1)
    prompt_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    prompt_cell = prompt_table.rows[0].cells[0]
    prompt_cell.width = Inches(6.8)
    set_cell_background(prompt_cell, 'F8FAFC')  # Slate 50
    set_cell_margins(prompt_cell, top=140, bottom=140, left=180, right=180)

    p_p = prompt_cell.paragraphs[0]
    p_p.paragraph_format.space_after = Pt(0)
    r_prompt_txt = p_p.add_run(MARKDOWN_PROMPT[:1800] + "\n\n[... Full implementation prompt saved in Docs/hospitality-offers-deals-and-discounts-prompt.md ...]")
    r_prompt_txt.font.name = 'Consolas'
    r_prompt_txt.font.size = Pt(8.5)
    r_prompt_txt.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    # Save Word Document
    doc.save(DOCX_PATH)
    print(f"Generated DOCX at: {DOCX_PATH}")

    # Copy to Downloads
    if os.path.exists(DOWNLOADS_DIR):
        shutil.copyfile(DOCX_PATH, DOCX_DOWNLOAD)
        print(f"Copied DOCX to: {DOCX_DOWNLOAD}")


def generate_markdown():
    with open(MD_PATH, "w", encoding="utf-8") as f:
        f.write(MARKDOWN_PROMPT)
    print(f"Generated Markdown at: {MD_PATH}")

    if os.path.exists(DOWNLOADS_DIR):
        shutil.copyfile(MD_PATH, MD_DOWNLOAD)
        print(f"Copied Markdown to: {MD_DOWNLOAD}")


if __name__ == "__main__":
    generate_markdown()
    generate_docx()

