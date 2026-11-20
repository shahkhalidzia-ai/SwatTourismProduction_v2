# Swat Tourism Platform — Hospitality Offers, Deals & Discounts Architecture and Implementation Prompt

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
    """Calculates discount amount and final total before fees."""
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
