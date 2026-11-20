# Swat Tourism Platform — Booking.com-Style Hotel Property Booking Page Implementation Plan

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
