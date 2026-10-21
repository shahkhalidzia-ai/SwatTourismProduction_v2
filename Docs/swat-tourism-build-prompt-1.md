# Build Prompt: Swat Tourism Platform (Working Prototype)

Paste this prompt into Antigravity. Put `swat-tourism-data-dictionary` (converted to `docs/data_dictionary.md`) and `swat-tourism-prototype-plan` (as `docs/plan.md`) in the repo first. The clickable design reference is the published prototype: https://claude.ai/artifact/2okBSF86PCFRUZ2P1RyA3q

---

## 1. Role and working rules

You are a senior full-stack engineer building a working prototype of a tourism platform for Swat, Khyber Pakhtunkhwa, Pakistan.

Follow these rules for the whole project:

1. **Stop and show a plan before writing any code** for each step. Wait for my approval, then build only that step.
2. Build in thin vertical slices: backend and its screens together, so every step ends in something I can demo.
3. Treat `docs/data_dictionary.md` as the source of truth for tables, columns, types and enum values. If something is missing or wrong, tell me and propose a change. Do not invent columns silently.
4. Keep each module in its own folder so it can later be handed to a separate developer.
5. After each step, list what was built, what was mocked, how to run it, and how to test it.
6. Do not add features that are not in this prompt.

## 2. What we are building

One platform that connects four groups:

- **Tourists** find places, hotels, restaurants, transport, guides, activities and local shops, check availability and prices, build a trip, request bookings, and stay safe.
- **Tourism businesses** list their offerings, set prices and availability, and handle bookings.
- **Local communities** share stories and events, offer homestays and crafts, and report problems.
- **Authorities** verify businesses, approve destinations, publish advisories and road status, and handle reports and SOS events.

The loop that makes it one platform:
- A business is verified by an authority, then appears to tourists.
- A tourist reports a complaint, and the authority resolves it.
- A community member reports a blocked road, and the authority publishes it as an advisory that tourists see.

## 3. Tech stack

- Backend: Python, FastAPI, SQLAlchemy 2, Alembic, PostgreSQL, Pydantic v2
- Auth: JWT (access and refresh) with role-based access control. Roles: `tourist`, `business`, `community`, `authority`, `admin`
- Frontend: React, TypeScript, Vite, React Router, TanStack Query, plain CSS variables (no heavy UI kit)
- Maps: Leaflet with OpenStreetMap tiles (no paid map key)
- Installable web app (PWA): `vite-plugin-pwa` with a web manifest, app icons and a service worker that caches only the app shell
- File upload: local disk storage behind a storage interface (so it can move to cloud storage later)
- Tests: pytest for the API, Vitest for key frontend logic
- Run everything with Docker Compose (api, db, web)

## 4. Project structure

```
swat-tourism/
  docs/                  data_dictionary.md, plan.md, this prompt
  backend/
    app/
      core/              config, security, db, deps
      modules/
        accounts/        users, profiles, auth
        places/          areas, destinations, media
        listings/        listing types, listings, details, tags, price items, availability
        trips/           trips, trip stops, saved items
        bookings/        bookings, items, history, payments (mocked)
        safety/          advisories, road status, emergency contacts, SOS
        community/       posts, issue reports, host applications
        verification/    documents, approvals
        notifications/
      main.py
    alembic/
    tests/
  frontend/
    src/
      design/            tokens.css, components (Card, Tag, Button, Chip, Toast, ListingCard, DataTable, ViewSwitch)
      layouts/           PhoneLayout (bottom bar), WebLayout (sidebar)
      modules/           tourist/, business/, community/, authority/
      api/
  docker-compose.yml
```

Each backend module has its own `models.py`, `schemas.py`, `service.py` and `router.py`.

## 5. Design system (match the prototype exactly)

Light, friendly, simple. One card style, one font, the same layout on every screen.

Colour tokens (define as CSS variables, with a dark-mode set):

| Token | Light value | Use |
|---|---|---|
| `--bg` | `#E8F1FA` | page background |
| `--card` | `#FFFFFF` | cards |
| `--ink` | `#12324A` | main text |
| `--mute` | `#5E7A92` | secondary text |
| `--pri` | `#2F7FC1` | primary buttons, active tab |
| `--soft` | `#D3E6F7` | chips, tags, soft buttons |
| `--acc` | `#F2A33A` | main call to action (Pay, Publish, Send report) |
| `--ok` | `#2E9D6B` | verified, open, available |
| `--bad` | `#D6564A` | SOS, closed, danger |
| `--line` | `#D5E3F0` | borders |

- Font: Figtree, with a system fallback.
- Cards: 16px radius, 1px border, no heavy shadows. Buttons: 11px radius. Tags: small pills with status colours.
- Phone layout: header with title and subtitle, scrolling content, bottom bar with 4 items per role.
- Web layout (screen width 900px and above): the bottom bar becomes a left sidebar, and cards flow in a 2 to 3 column grid. Alerts, stats and main buttons run full width.
- **Desktop data tables.** On the web layout, work screens for business and authority users use a `DataTable` instead of cards: sortable columns, filters, search, status tags, row actions, and pagination. Use it for: business Bookings and Listings; authority Approvals, Cases (reports and SOS events), Advisories and Road status. On phone width the same data falls back to cards. Tourist and community screens stay card-based on both layouts.
- **Installable app.** The web app can be installed from the browser on phones and computers (manifest name "Swat Tourism", theme colour `--pri`, icons 192 and 512, standalone display). The service worker caches only the app shell. Do not cache API data or build offline mode yet.
- **Demo view switch.** A small `ViewSwitch` (Phone view, Web view) that forces one layout, shown only when `VITE_DEMO_MODE=true`. By default the layout follows screen width.
- Respect `prefers-reduced-motion`, show visible keyboard focus, and keep touch targets at least 44px.
- Empty states say what to do next. Errors say what went wrong and how to fix it. Button labels are verbs ("Publish", "Add to trip"), and the same action keeps the same name everywhere.

## 6. Screens by role

### Tourist (bottom bar: Home, Explore, Trips, Safety)
- **Home:** hero search, active advisory banner, popular destination cards with Save.
- **Explore:** filter chips for Hotels, Restaurants, Transport, Guides, Activities, Shops. Each listing card shows title, verified tag, location line with View map, facility or feature tags, price items with units, an availability tag (for example "5 rooms free"), and the buttons Check dates and Add to trip. Restaurants show menu items and opening hours. Shops show products. Activities show duration, minimum age and safety tags.
- **Trips (list, then trip detail):** the Trips tab lists the tourist's trips. Opening a trip shows a header (title, dates, travellers, **Edit trip**, summary tags for confirmed, waiting, need action and planned stops) and three views:
  - **Itinerary:** day by day (Day 1, Day 2 and so on, with dates), each day's entries in time order. Entries include hotel stays (check-in on the first day, "Staying" in between, check-out on the last day), transport (pickup and return), guides, activities, restaurants, **destinations** and shops. Each entry shows time, place or meeting point and a status tag. Stops that need no booking (destinations, shops, the tourist's own notes) show "Planned" and can be removed. Days with nothing show a free-day message.
  - **Bookings:** one card per booking with business, type, days, price, **status tag** (Confirmed, Waiting for reply, Declined, Cancelled), **payment tag** (Unpaid, Paid, Pay after reply, No charge, Refunded) and key details: for hotels the dates, nights, room type, guests and address with a map link; for transport the route, pickup point and time, return trip, and the **driver name, phone and vehicle once the driver accepts**; for guides and activities the meeting point and time. Actions: Details (booking number, notes, voucher for confirmed bookings), Message (WhatsApp link), Withdraw, Cancel, Remove, and Replace for declined bookings. A totals card shows confirmed, waiting and trip total, the cancellation rule, and **Pay confirmed bookings** (mocked).
  - **Details:** trip summary (dates, travellers, places, booking counts, total), a **route map with all stops** and an Open on map button, a contacts list (WhatsApp and Call for every business and driver), Add a note, and Share trip with family.
  - **Add to trip** is available from Explore (hotels, transport, guides, activities, restaurants become booking requests), from destination pages, and for shops (which become plain planned stops). Everything added appears in the trip at once, and the totals update after every change.
- **Safety:** latest advisory, road status list, SOS button, emergency contacts.

### Tourist module: complete scope (supersedes the short tourist list above where they differ)

The tourist bottom bar has 5 items: **Home, Explore, Trips, Safety, Profile**. Everything else opens as a detail screen with a Back button.

| Stage | Screens and features |
|---|---|
| Account | Register and login, profile, language (English, Urdu, Pashto, with right-to-left layout for Urdu and Pashto), emergency contact, notification settings, travel preferences (budget, interests), log out |
| Discover | Home with quick actions (Plan a trip, Saved, Weather, Alerts), destination detail (about, best season, safety notes, nearby hotels and activities), search, Explore filters (type, price range, rating, verified only, free on my dates) and sort, list and map view, Saved places and listings |
| Listing detail | For every listing type: photo gallery, description, facilities or menu or services, price items, availability for the next days, map pin, reviews, cancellation policy, WhatsApp link, and a Book button |
| Plan | Plan a trip (destination, dates, travellers, budget, interests), trip itinerary by day with times, budget total, share trip link with family |
| Book and pay | Booking screen with price breakdown, special requests and cancellation rule. The tourist sends a **request first and pays only after the business accepts**. Pay deposit, full amount or at venue (mocked). Booking voucher with booking number and code. Receipts and refund status after cancellation |
| Trip management | Trip detail with live status per booking, edit, add, replace, withdraw, cancel, remove (see rule 11) |
| During the trip | Today view (today's items, pickup time and point, driver or guide contact), notifications centre (advisories, booking updates, reminders), weather and 5-day forecast, road status, SOS, emergency contacts, share trip with family |
| After the trip | Past trips, write a review (only for completed bookings), rate guide and transport, report a problem to the authority |
| Help | Travel guide (customs, packing, signal and cash, useful phrases), FAQs, report a problem, contact the tourism helpline |

Notes for this module:
- Reviews and payment records move into the prototype (payment stays mocked).
- Weather comes from a free forecast API (for example Open-Meteo), cached per area in `weather_cache`. Always show the line "Forecasts change. Check road status and advisories before travelling."
- Guide and FAQ content is stored in `info_articles` and edited by authorities.
- Notification channels follow the tourist's `notification_preferences`.
- Show emergency contacts and the saved trip even with a weak connection (app shell and last loaded trip cached).
- **Trip content rules.** A trip is made of trip stops. A stop is a listing (hotel, transport, guide, activity, restaurant, shop), a destination, or a custom note. Listing stops that can be booked link to a booking and take their status and payment status from it. Destination, shop and note stops have no booking and no status. A stay covering several nights is one stop with a first and last day (`day_number` to `end_day_number`). Transport shows pickup point and time from the booking, and the assigned driver details once the business accepts.
- The prototype shows the filter bar and Urdu/Pashto chips as visual only. Build them for real.

### Business (bottom bar: Today, Listings, Reviews, Profile)
- **Today:** bookings today, earnings this week, new requests with Accept and Decline.
- **Listings:** type chips (Hotels, Restaurants, Transport, Guides, Activities, Shops). Each type has its own form:
  - Hotel: facilities, room types with prices and rooms available, location pin.
  - Restaurant: menu items with prices, location pin, opening hours.
  - Transport: services with prices, seats, pickup pin, free dates.
  - Guide: services with prices, languages, base pin, free dates.
  - Activity: activity type, prices (per person or per tent), safety and rules, location pin, daily spots.
  - Shop: shop type, products with prices, location pin, hours.
  - A Publish to tourists button sends the listing for verification if the business is not yet verified.
- **Reviews:** average rating, review list, reply (can be built after the prototype).
- **Profile:** verification status, documents, payout details (display only).

### Local community (bottom bar: Stories, Crafts, Report, Hosts)
- **Stories:** published posts (story, event, hidden spot, tip) and a Share a story form (goes to moderation).
- **Crafts:** published shop listings tagged handicrafts and hotel listings tagged homestay, with Add actions.
- **Report:** report an issue with category, description, location and optional photo; list of the user's past reports with status.
- **Hosts:** apply to become a local host or guide; earnings display.

### Authority (sidebar or bottom bar: Overview, Advisories, Approvals, Cases)
- **Overview:** visitors this week, open cases, active alerts, busiest destinations.
- **Advisories:** create (title, message, category, severity, area, expiry) and publish; list of published advisories; road status editor.
- **Approvals:** queue of business verifications and destination requests with Approve and Ask changes.
- **Cases:** issue reports and SOS events with Assign and Resolve.

## 7. Key business rules

1. **One listing engine.** All six business types use the same `listings`, `price_items`, `tags` and `availability` tables. Type-specific fields go in `listing_details.details` (JSONB) with the keys defined in the data dictionary. Validate those keys per type with Pydantic.
2. **Verification gate.** A listing is visible to tourists only when `status = published` and its business `verification_status = verified`. Authorities approve or ask for changes; the business sees the reason.
3. **Availability.** Availability is a count per price item per day (`units_total`, `units_booked`). Available units = total minus booked, and zero if `is_blocked`. Items with `is_bookable = false` (menu items, shop products) show prices but are not booked.
4. **Price calculation.** Line total = unit price at booking time x quantity x number of units for the unit type (per night multiplies by nights, per person by travellers, per day by days, per tent by tents). The trip total is the sum of its booking lines. Prices are copied into `booking_items.unit_price` so later price changes do not alter old bookings.
5. **Booking flow.** `requested` then `accepted` or `declined` by the business, then `confirmed` after mock payment, then `completed`. Accepting or confirming reduces `units_booked`; declining or cancelling restores it. Every change writes a `booking_status_history` row and a notification.
6. **Overbooking is impossible.** Reserve units inside a database transaction with row locking, and return a clear error if units run out.
7. **Advisories** are visible to all tourists, filtered by area when an area is set, and hidden after `expires_at`.
8. **SOS** stores the location and shows the event on the authority Cases screen. In the prototype it does not contact any outside service. Show the user a clear message that rescue should also be called directly on 1122.
9. **Community reports** appear in the authority Cases list. An authority user can turn a report into an advisory with one click.
10. **Roles.** Each role can only reach its own endpoints and screens. Businesses can edit only their own listings. Every sensitive change (verification, advisory publish, booking status) writes to `audit_logs`.
11. **Reviews.** Only the tourist of a `completed` booking can review it, once. Updating a review recalculates `rating_avg` and `rating_count` on the listing. Businesses can reply once.
12. **Trip changes and cancellations.** A tourist can add, remove and replace items and edit dates or travellers at any time before service.
    - Adding an item creates a booking request (`requested`) and adds a trip stop linked to it.
    - Withdrawing a `requested` booking sets it to `cancelled` with no fee and gives the units back.
    - Cancelling an `accepted` or `confirmed` booking follows the listing's `cancellation_policy`: free until the allowed time before the service date, then `cancellation_fee` applies. Save `cancelled_by`, `cancel_reason` and `cancelled_at`. The business is notified.
    - Changing trip dates or travellers re-checks availability for every booking. For `requested` bookings update them in place. For `accepted` or `confirmed` bookings, do not edit in place: show what would conflict and let the tourist cancel and rebook.
    - Declined and cancelled bookings stay visible with their reason until the tourist removes them, so nothing silently disappears.
    - Each booking card shows live status from `bookings.status`, and transport shows pickup point and time from the listing and booking.
13. **Language.** English first. All user-facing text goes through a translation layer so Urdu and Pashto can be added later.

## 8. API outline

REST, versioned under `/api/v1`, with OpenAPI docs.

- `auth`: register, login, refresh, me
- `listings`: list with filters (type, area, tag, price range, date availability), detail, create, update, publish, availability get and set
- `places`: areas, destinations (list, detail, submit, approve)
- `trips`: CRUD trips (edit dates and travellers with an availability re-check), list and detail with each booking's status, add and remove stops, saved items, price summary with confirmed and waiting amounts
- `bookings`: create request, list for tourist, list for business, detail, accept, decline, withdraw (pending), cancel (with fee calculation), confirm, mock payment
- `safety`: advisories, road status, emergency contacts, SOS create and list
- `community`: posts, issue reports, host applications, status updates
- `verification`: upload document, approvals queue, approve or reject
- `notifications`: list, mark read, preferences get and set
- `reviews`: create for a completed booking, list by listing, business reply
- `content`: info articles and FAQs, weather by area
- `profile`: tourist profile, emergency contact, preferences

## 9. Seed data

Create a seed script from the "Sample dataset" section of the data dictionary: areas (Mingora, Madyan, Bahrain, Kalam, Utror, Ushu, Malam Jabba, Fizaghat), destinations (Kalam Valley, Mahodand Lake, Malam Jabba, Ushu Forest), one demo user per role, a verified listing of each type (Riverside Inn, Mountain Grill, 4x4 Jeep, Ali Khan guide, River rafting, Swat Gem House, Kalam Handicrafts), tags, 30 days of availability, advisories, road status and emergency contacts (Rescue 1122, Police 15).

## 10. Mocked or out of scope for the prototype

- Payments: a mock "Pay and confirm" that marks the booking paid. No real money.
- WhatsApp: "Chat on WhatsApp" links only (`https://wa.me/<number>`), no messaging service.
- SOS: records and displays only.
- Not built now (tourist module): live location sharing and trek check-ins, Urdu and Pashto translations of content (layout support is built), AI assistant, offline mode beyond the cached app shell, push notifications, reviews screens for tourists, trek check-ins, danger zones, analytics beyond the Overview counts, Urdu and Pashto.

## 11. Build steps (one at a time, plan first)

0. **Foundation:** repo, Docker Compose, database and Alembic, design tokens and components, phone and web layouts, empty role shells.
1. **Accounts and roles:** register, login, four profiles, role-based menus.
2. **Listing engine:** models, listing builder for all six types, image upload, tags, price items.
3. **Authority verification:** documents, approvals queue, Verified badge, visibility gate.
4. **Tourist explore and trip:** filters, listing detail, map pin, availability check, trip builder with totals.
5. **Bookings:** request, accept, decline, mock payment, availability updates, history, notifications. Pay extra attention to concurrency.
6. **Safety and advisories:** advisories, road status, emergency contacts, SOS and authority view.
7. **Community:** posts, reports, host applications, authority cases.
8. **Polish and demo:** seed data, review every screen for consistency, fix gaps, write a demo script that walks the four-group story.

**Step 0 addendum (do at the start of Step 1, because Step 0 is already done):** add the PWA setup, the `DataTable` component with phone-width card fallback, and the demo `ViewSwitch`. Show them in the Step 1 plan as a short separate list, then build.

**Trip detail and editing** (rule 11 and the Trips screen in section 6) are built in Step 4 (trip builder) and completed in Step 5 (bookings). If these steps are already built without them, treat it as a fix and do it before moving on.

**Where tables are used:** Step 3 (Approvals), Step 5 (business Bookings and Listings), Step 6 (Advisories, Road status, SOS events), Step 7 (Cases).

## 12. Definition of done (for each step)

- The step's screens work on a phone-width and a desktop-width browser.
- The API has tests for the main rules in that step.
- A tourist can open a trip and see every booking's status, details and totals; add, replace, withdraw, cancel and remove items; and edit dates and travellers, with the totals updating each time.
- Every table screen works as a table on desktop width and as cards on phone width.
- No screen uses a colour, font or card style outside the design tokens.
- Migrations run cleanly on an empty database, and the seed script runs after them.
- A short note lists what was mocked.

## 13. Your first response

Do not write code yet. Reply with:
1. Any questions or gaps you found in this prompt or the data dictionary.
2. Your detailed plan for **Step 0** only: files to create, commands to run, and how I will check it works.

Then wait for my approval.

## 14. Short message for each later step

Send this after each step is approved and finished. Keep this prompt in `docs/build_prompt.md` and do not paste it again.

> Step N is approved and finished. Read `docs/build_prompt.md` section 11 and `docs/data_dictionary.md`. Show me your plan for Step N+1 only: files to create or change, commands, and how I will check it. Ask about anything unclear. Do not write code until I approve.
