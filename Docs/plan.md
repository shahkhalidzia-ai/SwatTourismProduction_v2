Swat Tourism: Prototype Development Plan

From the clickable prototype to a working prototype

This plan assumes the earlier stack stays: FastAPI, SQLAlchemy, PostgreSQL, React with TypeScript and Vite, and JWT roles. It also assumes the plan-first, step-by-step approval workflow in Antigravity. Both can change if needed.


# What "working prototype" means

One complete flow for each of the four groups, with real data and real logins, not all 19 modules:

- Business: signs up, adds a listing (any of the six types), gets verified, and receives a booking.
- Authority: verifies the business and publishes an advisory.
- Tourist: finds the listing, checks availability and price, adds it to a trip, and requests a booking. They also see the advisory.
- Community: posts a story and reports an issue, which the authority sees.

# The key design decision: one listing engine

Hotels, restaurants, transporters, guides, activities and shops all share the same shape:

- A listing with a type, name, location (latitude and longitude), photos and verification status.
- Price items: room types, menu items, services, products or activities, each with a name, price and unit (per night, per person, per day, per item).
- Tags for facilities and features, such as Wi-Fi, life jackets and languages.
- Availability: free dates or spots.
Building this once, with a type field and flexible extra details, means a new business type later is a small change. Six separate sets of tables would be six times the work.


# Build steps

| Step | What gets built | Done when |
| --- | --- | --- |
| 0. Foundation | New repo, folder per module, database and migrations, the design system from the prototype (colours, cards, tags, buttons) and the responsive layout with a bottom bar on phones and a sidebar on the web | An empty app runs with the right look on phone and web |
| 1. Accounts and roles | Sign-up and login, four roles, role-based menus | Each role sees its own menu |
| 2. Listing engine | The tables above, the listing builder for businesses, and image upload | A business can publish any of the six types |
| 3. Authority verification | Approvals queue and Verified badge | Only verified listings show to tourists |
| 4. Tourist explore and trip | Explore with type filters, listing detail with map pin and price items, availability check, trip builder with running total | A tourist can build a trip across several business types |
| 5. Bookings | Booking requests, accept and decline for businesses, status for tourists, availability updates | A booking goes from request to confirmed on both sides |
| 6. Safety and advisories | Authority advisories, road status, emergency contacts page, SOS that records the event and shows it to the authority | A published advisory appears for tourists |
| 7. Community | Stories, report an issue, authority case list | A report reaches the authority and can be resolved |
| 8. Polish and demo | Seed data from the prototype, review and fix every screen, demo script | The whole story runs without gaps |


Build each step as a thin slice, with the backend and its screens together, so every step is something you can demo. Building all the backend first, then all the screens, leaves you with nothing to show for weeks.


# Mocked or kept simple at this stage

- Payments: a "confirm booking" flow without real money. JazzCash and Easypaisa come later.
- WhatsApp: Chat on WhatsApp links only, with no messaging service yet.
- SOS: records the location and notifies the authority dashboard. Real dispatch to rescue services needs an agreement with them.
- Not in the prototype: AI assistant, offline mode, reviews and analytics. Reviews and the AI assistant come right after.

# Working with Antigravity

For each step, keep your three small documents: a data dictionary, requirements, and a build prompt, covering only that step. Ask for the plan first, approve it, then build. Start each build prompt with the design system and listing engine documents so the code stays consistent. Since Step 5 changes availability, it is the riskiest, so give it extra review time.


# Decisions to make before Step 2

- Availability: free dates set by the business, or a count that goes down as bookings come in. For the prototype, a count per day is simpler.
- Payment later: full amount upfront, a deposit, or pay at arrival.
- Languages: English only at first, with Urdu added once the screens are stable.

# Timing

Roughly, with AI help and one developer, steps 0 to 3 are the foundation, steps 4 to 5 are the heart of the app, and steps 6 to 8 are a shorter finish. The real time depends on how much you can review each step.
