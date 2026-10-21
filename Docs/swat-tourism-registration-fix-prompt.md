# Fix Prompt: Registration Flow Problems Found in the Audit

Paste the prompt below into Antigravity.

---

Fix the problems found in the registration audit. Use `docs/build_prompt.md` and `docs/data_dictionary.md` as the specification (re-read both first, because `docs/data_dictionary.md` now also lists `pickup_point` for transport and `safety_rules`, `season_start`, `season_end` for activities in `listing_details`).

**Show me a short plan first, grouped as below, and wait for my approval.** Then fix the groups in order, one at a time, and after each group tell me what changed and how to check it. Do not change anything outside this list.

## Group 1: Critical bug

1. **Host approval does nothing.** When an authority approves a host application (`POST /api/v1/community/hosts/{id}/review`), also set `community_profiles.is_host_approved = true` for that user. When it is rejected, leave it false. Add a test. The community member's Profile and Hosts screens must then show "Approved host".

## Group 2: Missing screens and guards

2. **Tourist Profile tab.** Add **Profile** as the fifth tourist menu item (Home, Explore, Trips, Safety, Profile) in `navItems.ts` and `TouristShell.tsx`. The screen shows and edits: name, language (English, Urdu, Pashto), emergency contact name and phone, notification settings, travel preferences, and a Log out button.
3. **Role guard.** Route each user by their own role. A tourist must not be able to open the Business or Authority screens, and a business must not open the Authority screens. Show a clear "You do not have access to this page" screen. Show the `RoleSwitcherBar` only when `VITE_DEMO_MODE=true`.
4. **Business Availability.** Add a visible **Availability** button on every listing card, and an **Availability** item in the business menu that lists all listings. Keep the existing `BusinessAvailabilityModal`.

## Group 3: Profile fields silently dropped

5. **Profile update.** Add the missing fields to `UpdateProfileRequest`, the service and the screens:
   - Business: `registration_no`, `area_id`.
   - Community: `area_id`, `member_type` (resident, host, artisan).
   - Tourist: `budget_level` (budget, mid_range, premium), `travel_style` (solo, couple, family, friends, group), `interests` (list).
6. **No more silent drops.** Reject unknown fields with a 422 that names the field, so this cannot happen again. Add a test that sends an unknown field and expects 422.
7. Add the migration if any column is missing, and make sure it runs on an empty database.

## Group 4: Listing builder gaps

8. **Hotel.**
   - Add a facilities picker that loads tags with group `facility` from the API and sends the chosen `tag_ids`.
   - Add a **Kind** dropdown on every item: Room, Extra or Activity (stored in `price_items.category`).
   - For rooms add: sleeps how many, bed type, size, view, room amenities (stored in `price_items.details`), and room photos (`media` with owner type `price_item`).
9. **Restaurant.** Add a **Section** field to every menu item (Starters, Main dishes, Drinks, Dessert, or a custom name) stored in `price_items.category`. Show the menu grouped by section in the owner preview and on the tourist Restaurant page.
10. **Transport.** Add a separate **Pickup point** (name and map pin) stored in `listing_details.pickup_point` and the listing latitude and longitude, with a label that makes clear it is the pickup point. For guides, label the same field **Base location**.
11. **Activity.** Add **Safety rules** (text), **Season start** and **Season end** dates (`listing_details.safety_rules`, `season_start`, `season_end`). Tourists must not be able to book dates outside the season, and the Availability screen must only allow setting units inside the season.

## Done when

- Every group has tests that pass, and the migrations run on an empty database.
- Re-run the same registration audit (tourist, business for all six types, community) and give me the table again. Every row must be **Working**, with evidence. List anything that is still Partly, Missing or Broken, and why.
- Then stop and wait for me.
