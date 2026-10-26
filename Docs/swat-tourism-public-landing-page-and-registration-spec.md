# Swat Tourism Platform: Public Landing Page & Multi-Property Registration Specification

## 1. Executive Summary & Objective
Transform the Swat Tourism platform into a Booking.com-style public discovery and booking portal:
- When any visitor opens the application URL without an account, they are **never** blocked by a login screen.
- Instead, the **Tourist Home Screen** (`TouristShell` with `activeTab="home"`) serves as the default public landing page in **Guest Mode**.
- Provide seamless, upfront actions in the header:
  - **"List Your Property"** (highlighted partner onboarding button).
  - **"Register"** and **"Sign In"** modal triggers.
- Support a comprehensive registration system for both **Tourists** and **Business Hosts** covering all 6 core property types:
  1. Hotels, Lodges & Mountain Resorts
  2. 4x4 Jeeps, Prado & Transport Fleet
  3. Riverside Dining, Trout Cafes & Restaurants
  4. Certified Local Tour Guides & Trackers
  5. Adventure Activities & Ski Passes
  6. Traditional Crafts & Souvenir Shops
- Provide a frictionless conversion flow: guests can freely search valleys, check rates, explore 4x4 transport, view menus, and read reviews, being prompted to sign in/register only when confirming bookings or adding to trips.

---

## 2. Public Landing Page Architecture
1. **Unauthenticated Guest Mode**:
   - In `frontend/src/App.tsx`, remove the hard blocker `if (!user && !isTestEnv) return <LoginPage ... />`.
   - If `user === null`, default `role` is `'tourist'` and `activeTab` is `'home'`.
   - All public browsing APIs (`getExploreListings`, `getDestinations`, `getAreas`, `intercityTransport`) work seamlessly for guest visitors.
2. **Top Navigation Header for Guests**:
   - Swat Tourism official logo with KP Tourism Authority verification badge.
   - Top-right CTA buttons:
     - **"List Your Property"** (prominent green/accent partner CTA button).
     - **"Register"** (opens registration modal).
     - **"Sign In"** (opens login modal).
     - Compact Demo Role Switcher for instant demo evaluation.

---

## 3. Dual-Path Registration System
Implement a unified, modal-based Auth & Registration system:
1. **Tourist Registration**:
   - Full Name, Email / Phone number, Password.
   - Instant access to create custom itineraries, save favorites, book hotel rooms, and receive WhatsApp/SMS booking vouchers.
2. **Business Host Registration ("List Your Property")**:
   - Business / Property Name, Host / Owner Name, Phone Number, WhatsApp Number, Area / Valley (Kalam, Malam Jabba, Mingora, Bahrain, Miandam, etc.).
   - Primary Property Type Selection (Hotels, Transport, Restaurants, Guides, Activities, Shops).
   - Upon registration, automatically log in and transition to their dedicated **Business Management Portal** with full controls to manage inventory, rates, menus, and schedules.

---

## 4. Multi-Property Discovery on Landing Page
- Unified Home Screen showcase for all 6 property types with filter tabs:
  - **All Verified Offerings**
  - **Hotels & Mountain Lodges**
  - **4x4 Jeeps & Adventure Transport**
  - **Riverside Dining & Trout Cafes**
  - **Certified Tour Guides**
  - **Adventure Sports & Activities**
  - **Local Handicrafts & Shops**
- Verified listings grid arranged in 2 columns with transparent rates, badges, photos, and direct booking actions.

---

## 5. Frictionless Conversion & Booking
- Guests can freely browse all valleys, search dates, filter vehicle types, and view pricing without logging in.
- Clicking **"Book Room"**, **"Add to Trip"**, or **"Hire 4x4 Jeep"** triggers a quick Sign In / Register modal without page reloads or losing context.
