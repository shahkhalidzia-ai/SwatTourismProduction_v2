Swat Tourism Platform

Dataset and Data Dictionary, new project


# 1. About this document

This document defines the data for the new, simplified Swat tourism platform that connects tourists, tourism businesses, local communities and authorities. It lists every entity (table), every column, and a small sample dataset taken from the clickable prototype. It is the source of truth for the database design and for the build prompt.

Totals: 36 entities in 8 modules. 31 are needed for the working prototype and 5 come in the next stage.


## Conventions

- Names: tables and columns use snake_case. Table names are plural.
- Primary keys: every table has an id column of type uuid. It is added automatically and shown first in each table below.
- Timestamps: created_at (and updated_at where listed) are timestamptz in UTC and are set by the system.
- Money: numeric(12,2) in Pakistani rupees (PKR).
- Locations: latitude and longitude as numeric(9,6), in decimal degrees.
- Enums: stored as text with a check constraint. The allowed values are written in the Description column. Adding a value needs a migration.
- Constraints column: PK primary key, FK foreign key (with the table), UQ unique, NN required. A blank means optional.
- Phase: Prototype means needed for the working prototype. Next means designed now but built after the prototype.
- One listing engine: hotels, restaurants, transporters, guides, activities and shops all use listings, price_items, tags and availability. Only a small JSON details record differs by type.

# 2. Entity overview

| # | Entity | Module | Phase | Purpose |
| --- | --- | --- | --- | --- |
| 1 | users | Identity and access | Prototype | Every person who logs in. One account has exactly one role. |
| 2 | tourist_profiles | Identity and access | Prototype | Extra details for tourist accounts, including who to alert on SOS. |
| 3 | business_profiles | Identity and access | Prototype | A tourism business such as a hotel, restaurant, transporter, guide, activity operator or shop. One business can own many listings. |
| 4 | community_profiles | Identity and access | Prototype | Extra details for local community members. |
| 5 | authority_profiles | Identity and access | Prototype | Extra details and permissions for authority staff. |
| 6 | verification_documents | Identity and access | Prototype | Documents a business uploads so an authority can verify it. |
| 7 | areas | Places and media | Prototype | Hierarchy of places: district, tehsil, town, valley, village. Used to group listings and target advisories. |
| 8 | destinations | Places and media | Prototype | Places worth visiting. Submitted by anyone, approved by an authority before tourists see them. |
| 9 | media | Places and media | Prototype | Photos and videos attached to listings, destinations, posts and reports. |
| 10 | listing_types | Listing engine | Prototype | Lookup of the six business types. Adding a type is a new row, not a new table. |
| 11 | listings | Listing engine | Prototype | The one shared record for every offering tourists can find: a hotel, restaurant, transport service, guide, activity or shop. |
| 12 | listing_details | Listing engine | Prototype | Type-specific fields for a listing, stored as JSON so every type can have its own details. Keys are listed in the next section. |
| 13 | tags | Listing engine | Prototype | Reusable labels such as Wi-Fi, Urdu, Life jackets or Gemstones. Unique on tag_group plus label. |
| 14 | listing_tags | Listing engine | Prototype | Links listings to tags. Unique on listing_id plus tag_id. |
| 15 | price_items | Listing engine | Prototype | Anything with a price under a listing: a room type, menu item, vehicle service, guide service, activity or shop product. |
| 16 | availability | Listing engine | Prototype | Units available per price item per day. Unique on price_item_id plus date. Units available = units_total minus units_booked. |
| 17 | trips | Trips and bookings | Prototype | A tourist trip plan that can contain stops from several businesses. |
| 18 | trip_stops | Trips and bookings | Prototype | Ordered stops inside a trip: a listing, a destination or a custom entry. |
| 19 | bookings | Trips and bookings | Prototype | A booking request to one business for one listing. A trip with three businesses has three bookings. |
| 20 | booking_items | Trips and bookings | Prototype | Lines inside a booking. Prices are copied so later price changes do not alter old bookings. |
| 21 | booking_status_history | Trips and bookings | Prototype | Every status change of a booking, for tracking and disputes. |
| 22 | payments | Trips and bookings | Next | Payments for bookings. Mocked in the prototype, real providers later. |
| 23 | reviews | Reviews | Next | Ratings from tourists who actually booked. One review per booking. |
| 24 | review_replies | Reviews | Next | A business reply to a review. One reply per review. |
| 25 | advisories | Safety and emergency | Prototype | Notices published by authorities that tourists and businesses see. |
| 26 | road_status | Safety and emergency | Prototype | Current condition of important roads, entered by authorities and reported by the community. |
| 27 | emergency_contacts | Safety and emergency | Prototype | Emergency numbers and places shown on the Safety screen. |
| 28 | danger_zones | Safety and emergency | Next | Risky places shown as warnings on the map, such as river banks or landslide zones. |
| 29 | sos_events | Safety and emergency | Prototype | An SOS raised by a tourist. Shown to authorities. In the prototype it does not contact outside services. |
| 30 | trek_checkins | Safety and emergency | Next | A trekker or guide logs a start and expected return. An alert is raised if they do not return. |
| 31 | community_posts | Community | Prototype | Stories, events, hidden spots and tips shared by locals. Moderated before publishing. |
| 32 | issue_reports | Community | Prototype | Problems reported by community members, tourists or businesses. Also used for complaints about services. |
| 33 | host_applications | Community | Prototype | A community member applying to host guests, guide or sell crafts. |
| 34 | notifications | Platform | Prototype | Messages sent to users in the app, and later by push, SMS or WhatsApp. |
| 35 | saved_items | Platform | Prototype | Things a tourist saved with the Save button. Unique on user_id, item_type and item_id. |
| 36 | audit_logs | Platform | Prototype | Record of sensitive actions such as verification, advisory publishing and booking changes. |



# 3. Main relationships

| Parent | Children | Meaning |
| --- | --- | --- |
| users | business_profiles, tourist_profiles, community_profiles, authority_profiles | One user has at most one profile, matching the role |
| business_profiles | listings, verification_documents | A business owns many listings and uploads documents for verification |
| listings | listing_details, listing_tags, price_items, media | Each listing has one details record, many tags, many price items and many photos |
| price_items | availability, booking_items | Availability is a row per day. Booked lines point to the price item |
| trips | trip_stops, bookings | A trip has many stops and many bookings, one per business |
| bookings | booking_items, booking_status_history, payments, reviews | Each booking has lines, history, payments and at most one review |
| areas | destinations, listings, advisories, road_status | Areas group places and target notices |
| users (authority) | advisories, destinations (approval), business_profiles (verification), issue_reports (assignment), sos_events | Authorities act on records from the other three groups |
| users (community) | community_posts, issue_reports, host_applications | Community members share and report |
| users (tourist) | trips, bookings, saved_items, sos_events, issue_reports | Tourists plan, book and ask for help |



# 4. Listing details by type

The details column in listing_details holds these keys. The application validates them per type, so a hotel cannot be saved with guide fields.

| Listing type | Keys in details |
| --- | --- |
| hotel | star_rating, check_in_time, check_out_time, total_rooms, pets_allowed |
| restaurant | cuisine, seating_capacity, takes_reservations, has_delivery, halal |
| transport | vehicle_type, seats, with_driver, routes (list), fuel_included |
| guide | languages (list), years_experience, specialities (list), license_no, max_group_size |
| activity | activity_type, duration_hours, min_age, max_group_size, difficulty, safety_gear_included |
| shop | shop_category, certificate_provided, accepts_cards, ships_orders |



# 5. Data dictionary


## Identity and access


### 1. users

Phase: Prototype. Every person who logs in. One account has exactly one role.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| email | varchar(160) | UQ | Login email. Optional if a phone number is used |
| phone | varchar(20) | UQ | Mobile number in international format |
| password_hash | text | NN | Hashed password. The password itself is never stored |
| role | enum | NN | tourist, business, community, authority, admin |
| full_name | varchar(120) | NN | Display name |
| language | enum | NN | en, ur, ps. Default en |
| avatar_url | text |  | Profile photo |
| status | enum | NN | active, pending, suspended. Default active |
| last_login_at | timestamptz |  | Last successful login |
| created_at | timestamptz | NN | When the record was created |
| updated_at | timestamptz | NN | When the record was last changed |



### 2. tourist_profiles

Phase: Prototype. Extra details for tourist accounts, including who to alert on SOS.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| user_id | uuid | FK users, UQ, NN | Owning account |
| home_city | varchar(80) |  | City the tourist lives in |
| nationality | varchar(60) |  | Country of the tourist |
| emergency_contact_name | varchar(120) |  | Person to alert in an emergency |
| emergency_contact_phone | varchar(20) |  | Phone of that person |
| created_at | timestamptz | NN | When the record was created |



### 3. business_profiles

Phase: Prototype. A tourism business such as a hotel, restaurant, transporter, guide, activity operator or shop. One business can own many listings.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| owner_id | uuid | FK users, NN | Account that manages the business |
| business_name | varchar(150) | NN | Name shown to tourists |
| primary_type | enum | NN | hotel, restaurant, transport, guide, activity, shop |
| registration_no | varchar(60) |  | Government or local registration number |
| contact_phone | varchar(20) | NN | Main phone |
| whatsapp_number | varchar(20) |  | Number used for Chat on WhatsApp links |
| address_text | text |  | Written address |
| area_id | uuid | FK areas | Town or valley where the business is based |
| verification_status | enum | NN | unverified, pending, verified, rejected, suspended |
| verified_by | uuid | FK users | Authority user who decided |
| verified_at | timestamptz |  | When the decision was made |
| rejection_reason | text |  | Shown to the business when changes are needed |
| created_at | timestamptz | NN | When the record was created |
| updated_at | timestamptz | NN | When the record was last changed |



### 4. community_profiles

Phase: Prototype. Extra details for local community members.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| user_id | uuid | FK users, UQ, NN | Owning account |
| area_id | uuid | FK areas | Village or valley of the member |
| member_type | enum | NN | resident, host, artisan |
| bio | text |  | Short introduction |
| is_host_approved | bool | NN | True once an authority approves hosting. Default false |
| created_at | timestamptz | NN | When the record was created |



### 5. authority_profiles

Phase: Prototype. Extra details and permissions for authority staff.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| user_id | uuid | FK users, UQ, NN | Owning account |
| department | varchar(120) | NN | For example Tourism Department |
| designation | varchar(80) |  | Job title |
| area_id | uuid | FK areas | Area of responsibility. Null means all of Swat |
| can_verify_businesses | bool | NN | Permission to approve or reject businesses |
| can_publish_advisories | bool | NN | Permission to publish advisories and road status |
| created_at | timestamptz | NN | When the record was created |



### 6. verification_documents

Phase: Prototype. Documents a business uploads so an authority can verify it.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| business_id | uuid | FK business_profiles, NN | Business the document belongs to |
| doc_type | enum | NN | registration, identity_copy, license, gem_certificate, safety_certificate, other |
| file_url | text | NN | Stored file location |
| status | enum | NN | pending, approved, rejected |
| reviewed_by | uuid | FK users | Authority reviewer |
| reviewed_at | timestamptz |  | Review time |
| note | text |  | Reviewer comment |
| created_at | timestamptz | NN | When the record was created |
| updated_at | timestamptz | NN | When the record was last changed |



## Places and media


### 7. areas

Phase: Prototype. Hierarchy of places: district, tehsil, town, valley, village. Used to group listings and target advisories.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| parent_id | uuid | FK areas | Larger area that contains this one |
| name | varchar(100) | NN | For example Kalam or Madyan |
| name_ur | varchar(100) |  | Name in Urdu |
| area_type | enum | NN | district, tehsil, town, valley, village |
| latitude | numeric(9,6) |  | Centre point |
| longitude | numeric(9,6) |  | Centre point |
| created_at | timestamptz | NN | When the record was created |



### 8. destinations

Phase: Prototype. Places worth visiting. Submitted by anyone, approved by an authority before tourists see them.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| area_id | uuid | FK areas, NN | Area where the destination is |
| name | varchar(150) | NN | For example Mahodand Lake |
| description | text |  | About the place |
| category | enum | NN | lake, valley, waterfall, heritage, forest, viewpoint, ski, other |
| best_season | varchar(60) |  | For example May to September |
| latitude | numeric(9,6) | NN | Map pin |
| longitude | numeric(9,6) | NN | Map pin |
| cover_image_url | text |  | Main photo |
| safety_notes | text |  | Known risks shown to tourists |
| status | enum | NN | draft, pending, approved, rejected |
| submitted_by | uuid | FK users | Who proposed it |
| approved_by | uuid | FK users | Authority approver |
| approved_at | timestamptz |  | Approval time |
| created_at | timestamptz | NN | When the record was created |
| updated_at | timestamptz | NN | When the record was last changed |



### 9. media

Phase: Prototype. Photos and videos attached to listings, destinations, posts and reports.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| owner_type | enum | NN | listing, destination, post, report |
| owner_id | uuid | NN | Id of the owning record (polymorphic, no foreign key) |
| url | text | NN | Stored file location |
| media_type | enum | NN | image, video |
| caption | varchar(200) |  | Short caption |
| sort_order | int | NN | Display order. Default 0 |
| uploaded_by | uuid | FK users | Uploader |
| created_at | timestamptz | NN | When the record was created |



## Listing engine


### 10. listing_types

Phase: Prototype. Lookup of the six business types. Adding a type is a new row, not a new table.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| code | varchar(20) | UQ, NN | hotel, restaurant, transport, guide, activity, shop |
| label | varchar(60) | NN | Name shown in the app |
| default_price_unit | enum | NN | Usual price unit for this type (see price_items.unit) |
| requires_documents | bool | NN | Whether verification needs extra documents, for example gem certificates |



### 11. listings

Phase: Prototype. The one shared record for every offering tourists can find: a hotel, restaurant, transport service, guide, activity or shop.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| business_id | uuid | FK business_profiles, NN | Owning business |
| type_id | uuid | FK listing_types, NN | Kind of listing |
| area_id | uuid | FK areas, NN | Area of the listing |
| title | varchar(150) | NN | Name shown to tourists |
| description | text |  | About the listing |
| address_text | text |  | Written address or landmark |
| latitude | numeric(9,6) | NN | Map pin. For transport this is the pickup point, for guides the base |
| longitude | numeric(9,6) | NN | Map pin |
| phone | varchar(20) |  | Listing phone if different from the business |
| whatsapp_number | varchar(20) |  | Listing WhatsApp if different from the business |
| opening_time | time |  | Daily opening time |
| closing_time | time |  | Daily closing time |
| status | enum | NN | draft, pending, published, suspended |
| is_verified | bool | NN | Copied from the business verification. Shows the Verified badge |
| rating_avg | numeric(2,1) |  | Average review rating |
| rating_count | int | NN | Number of reviews. Default 0 |
| created_at | timestamptz | NN | When the record was created |
| updated_at | timestamptz | NN | When the record was last changed |



### 12. listing_details

Phase: Prototype. Type-specific fields for a listing, stored as JSON so every type can have its own details. Keys are listed in the next section.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| listing_id | uuid | FK listings, UQ, NN | Listing these details belong to |
| details | jsonb | NN | Type-specific key and value pairs |
| created_at | timestamptz | NN | When the record was created |
| updated_at | timestamptz | NN | When the record was last changed |



### 13. tags

Phase: Prototype. Reusable labels such as Wi-Fi, Urdu, Life jackets or Gemstones. Unique on tag_group plus label.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| tag_group | enum | NN | facility, feature, language, safety, shop_category, activity_type |
| label | varchar(60) | NN | Text shown on cards |
| created_at | timestamptz | NN | When the record was created |



### 14. listing_tags

Phase: Prototype. Links listings to tags. Unique on listing_id plus tag_id.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| listing_id | uuid | FK listings, NN | Listing |
| tag_id | uuid | FK tags, NN | Tag |



### 15. price_items

Phase: Prototype. Anything with a price under a listing: a room type, menu item, vehicle service, guide service, activity or shop product.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| listing_id | uuid | FK listings, NN | Owning listing |
| name | varchar(150) | NN | For example Double room or Chapli kebab |
| category | varchar(60) |  | Menu section or product group |
| description | text |  | Short description |
| price | numeric(12,2) | NN | Price in PKR |
| unit | enum | NN | per_night, per_person, per_day, per_hour, per_tent, per_seat, per_trip, per_item |
| capacity | int |  | People per unit, for example 2 per tent |
| default_units | int |  | Units available each day by default |
| is_bookable | bool | NN | False for menu items and shop products shown for information only |
| is_active | bool | NN | Hidden from tourists when false. Default true |
| sort_order | int | NN | Display order. Default 0 |
| created_at | timestamptz | NN | When the record was created |
| updated_at | timestamptz | NN | When the record was last changed |



### 16. availability

Phase: Prototype. Units available per price item per day. Unique on price_item_id plus date. Units available = units_total minus units_booked.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| price_item_id | uuid | FK price_items, NN | Price item |
| date | date | NN | Day |
| units_total | int | NN | Units offered that day |
| units_booked | int | NN | Units already reserved. Default 0 |
| price_override | numeric(12,2) |  | Special price for this day |
| is_blocked | bool | NN | Business closed the day. Default false |
| created_at | timestamptz | NN | When the record was created |
| updated_at | timestamptz | NN | When the record was last changed |



## Trips and bookings


### 17. trips

Phase: Prototype. A tourist trip plan that can contain stops from several businesses.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| tourist_id | uuid | FK users, NN | Trip owner |
| title | varchar(150) | NN | For example Kalam, 3 nights |
| start_date | date |  | Trip start |
| end_date | date |  | Trip end |
| travellers | int | NN | Number of people. Default 1 |
| status | enum | NN | draft, planned, confirmed, completed, cancelled |
| estimated_total | numeric(12,2) | NN | Running total in PKR. Default 0 |
| notes | text |  | Free notes |
| created_at | timestamptz | NN | When the record was created |
| updated_at | timestamptz | NN | When the record was last changed |



### 18. trip_stops

Phase: Prototype. Ordered stops inside a trip: a listing, a destination or a custom entry.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| trip_id | uuid | FK trips, NN | Parent trip |
| day_number | int | NN | Day of the trip, starting at 1 |
| stop_order | int | NN | Order within the day |
| stop_type | enum | NN | listing, destination, custom |
| listing_id | uuid | FK listings | Set when stop_type is listing |
| destination_id | uuid | FK destinations | Set when stop_type is destination |
| booking_id | uuid | FK bookings | Booking made for this stop |
| custom_title | varchar(150) |  | Set when stop_type is custom |
| notes | text |  | Stop notes |
| created_at | timestamptz | NN | When the record was created |



### 19. bookings

Phase: Prototype. A booking request to one business for one listing. A trip with three businesses has three bookings.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| reference | varchar(20) | UQ, NN | Short code shown to tourist and business |
| trip_id | uuid | FK trips | Trip this booking belongs to, if any |
| tourist_id | uuid | FK users, NN | Who booked |
| business_id | uuid | FK business_profiles, NN | Business that receives the request |
| listing_id | uuid | FK listings, NN | Listing booked |
| status | enum | NN | requested, accepted, declined, confirmed, cancelled, completed, no_show |
| start_date | date | NN | First service date |
| end_date | date |  | Last service date |
| travellers | int | NN | Number of people |
| total_amount | numeric(12,2) | NN | Sum of booking items in PKR |
| deposit_amount | numeric(12,2) |  | Deposit required, if any |
| payment_status | enum | NN | unpaid, deposit_paid, paid, refunded |
| special_requests | text |  | Notes from the tourist |
| decline_reason | text |  | Why the business declined |
| responded_at | timestamptz |  | When the business answered |
| created_at | timestamptz | NN | When the record was created |
| updated_at | timestamptz | NN | When the record was last changed |



### 20. booking_items

Phase: Prototype. Lines inside a booking. Prices are copied so later price changes do not alter old bookings.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| booking_id | uuid | FK bookings, NN | Parent booking |
| price_item_id | uuid | FK price_items, NN | Item booked |
| service_date | date | NN | Date of service |
| quantity | int | NN | Number of units |
| unit_price | numeric(12,2) | NN | Price at booking time |
| line_total | numeric(12,2) | NN | unit_price multiplied by quantity |
| created_at | timestamptz | NN | When the record was created |



### 21. booking_status_history

Phase: Prototype. Every status change of a booking, for tracking and disputes.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| booking_id | uuid | FK bookings, NN | Booking |
| from_status | varchar(20) |  | Earlier status. Empty for the first entry |
| to_status | varchar(20) | NN | New status |
| changed_by | uuid | FK users | Who made the change |
| note | text |  | Optional comment |
| created_at | timestamptz | NN | When the record was created |



### 22. payments

Phase: Next. Payments for bookings. Mocked in the prototype, real providers later.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| booking_id | uuid | FK bookings, NN | Booking being paid |
| payer_id | uuid | FK users, NN | Who paid |
| amount | numeric(12,2) | NN | Amount in PKR |
| method | enum | NN | cash, jazzcash, easypaisa, bank_transfer, card |
| status | enum | NN | pending, paid, failed, refunded |
| provider_ref | varchar(80) |  | Reference from the payment provider |
| paid_at | timestamptz |  | Payment time |
| created_at | timestamptz | NN | When the record was created |
| updated_at | timestamptz | NN | When the record was last changed |



## Reviews


### 23. reviews

Phase: Next. Ratings from tourists who actually booked. One review per booking.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| booking_id | uuid | FK bookings, UQ, NN | Booking being reviewed |
| tourist_id | uuid | FK users, NN | Reviewer |
| listing_id | uuid | FK listings, NN | Listing reviewed |
| rating | int | NN | 1 to 5 |
| title | varchar(120) |  | Short headline |
| comment | text |  | Review text |
| status | enum | NN | published, hidden, flagged. Default published |
| created_at | timestamptz | NN | When the record was created |
| updated_at | timestamptz | NN | When the record was last changed |



### 24. review_replies

Phase: Next. A business reply to a review. One reply per review.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| review_id | uuid | FK reviews, UQ, NN | Review answered |
| author_id | uuid | FK users, NN | Business user who replied |
| reply_text | text | NN | Reply text |
| created_at | timestamptz | NN | When the record was created |



## Safety and emergency


### 25. advisories

Phase: Prototype. Notices published by authorities that tourists and businesses see.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| author_id | uuid | FK users, NN | Authority user who wrote it |
| title | varchar(150) | NN | Headline |
| message | text | NN | Full notice |
| category | enum | NN | weather, road, flood, security, health, general |
| severity | enum | NN | info, warning, danger |
| area_id | uuid | FK areas | Target area. Null means all of Swat |
| starts_at | timestamptz | NN | When it becomes visible |
| expires_at | timestamptz |  | When it stops being shown |
| status | enum | NN | draft, published, expired, withdrawn |
| created_at | timestamptz | NN | When the record was created |
| updated_at | timestamptz | NN | When the record was last changed |



### 26. road_status

Phase: Prototype. Current condition of important roads, entered by authorities and reported by the community.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| road_name | varchar(150) | NN | For example Mingora to Kalam |
| from_area_id | uuid | FK areas | Start |
| to_area_id | uuid | FK areas | End |
| status | enum | NN | open, limited, closed |
| vehicle_note | varchar(100) |  | For example 4x4 only |
| reason | text |  | Why it is limited or closed |
| reported_by | uuid | FK users | Who entered it |
| source | enum | NN | authority, community |
| is_verified | bool | NN | Confirmed by an authority. Default false |
| created_at | timestamptz | NN | When the record was created |
| updated_at | timestamptz | NN | When the record was last changed |



### 27. emergency_contacts

Phase: Prototype. Emergency numbers and places shown on the Safety screen.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| name | varchar(120) | NN | For example Rescue 1122 |
| service_type | enum | NN | police, tourism_police, rescue, hospital, fire, other |
| phone | varchar(20) | NN | Number to call |
| area_id | uuid | FK areas | Area served |
| address_text | text |  | Address |
| latitude | numeric(9,6) |  | Map pin |
| longitude | numeric(9,6) |  | Map pin |
| is_24h | bool | NN | Open all day and night |
| created_at | timestamptz | NN | When the record was created |
| updated_at | timestamptz | NN | When the record was last changed |



### 28. danger_zones

Phase: Next. Risky places shown as warnings on the map, such as river banks or landslide zones.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| name | varchar(150) | NN | Zone name |
| area_id | uuid | FK areas | Area |
| latitude | numeric(9,6) | NN | Centre |
| longitude | numeric(9,6) | NN | Centre |
| radius_m | int | NN | Radius in metres |
| risk_type | enum | NN | river, landslide, avalanche, flood, other |
| description | text |  | What the risk is |
| is_active | bool | NN | Shown when true. Default true |
| created_at | timestamptz | NN | When the record was created |
| updated_at | timestamptz | NN | When the record was last changed |



### 29. sos_events

Phase: Prototype. An SOS raised by a tourist. Shown to authorities. In the prototype it does not contact outside services.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| tourist_id | uuid | FK users, NN | Who raised it |
| latitude | numeric(9,6) | NN | Location at the time |
| longitude | numeric(9,6) | NN | Location at the time |
| accuracy_m | int |  | GPS accuracy in metres |
| message | text |  | Optional note |
| status | enum | NN | new, acknowledged, responding, resolved, false_alarm |
| acknowledged_by | uuid | FK users | Authority user |
| acknowledged_at | timestamptz |  | When acknowledged |
| resolved_at | timestamptz |  | When closed |
| resolution_note | text |  | What happened |
| created_at | timestamptz | NN | When the record was created |
| updated_at | timestamptz | NN | When the record was last changed |



### 30. trek_checkins

Phase: Next. A trekker or guide logs a start and expected return. An alert is raised if they do not return.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| user_id | uuid | FK users, NN | Who is trekking |
| listing_id | uuid | FK listings | Guide or activity listing, if any |
| route_name | varchar(150) | NN | Route or place |
| started_at | timestamptz | NN | Start time |
| expected_return_at | timestamptz | NN | When they should be back |
| returned_at | timestamptz |  | When they checked back in |
| status | enum | NN | active, returned, overdue, escalated |
| created_at | timestamptz | NN | When the record was created |
| updated_at | timestamptz | NN | When the record was last changed |



## Community


### 31. community_posts

Phase: Prototype. Stories, events, hidden spots and tips shared by locals. Moderated before publishing.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| author_id | uuid | FK users, NN | Author |
| post_type | enum | NN | story, event, hidden_spot, tip |
| title | varchar(150) | NN | Headline |
| body | text | NN | Content |
| area_id | uuid | FK areas | Related area |
| latitude | numeric(9,6) |  | Optional pin |
| longitude | numeric(9,6) |  | Optional pin |
| event_date | date |  | For events |
| status | enum | NN | pending, published, rejected |
| moderated_by | uuid | FK users | Authority moderator |
| created_at | timestamptz | NN | When the record was created |
| updated_at | timestamptz | NN | When the record was last changed |



### 32. issue_reports

Phase: Prototype. Problems reported by community members, tourists or businesses. Also used for complaints about services.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| reporter_id | uuid | FK users, NN | Who reported |
| category | enum | NN | road_blocked, litter, overcharging, unsafe_place, service_complaint, other |
| title | varchar(150) | NN | Short summary |
| description | text | NN | Details |
| area_id | uuid | FK areas | Area |
| latitude | numeric(9,6) |  | Pin |
| longitude | numeric(9,6) |  | Pin |
| listing_id | uuid | FK listings | Listing complained about, if any |
| status | enum | NN | new, assigned, in_progress, resolved, rejected |
| assigned_to | uuid | FK users | Authority staff member handling it |
| resolution_note | text |  | Outcome shown to the reporter |
| resolved_at | timestamptz |  | When closed |
| created_at | timestamptz | NN | When the record was created |
| updated_at | timestamptz | NN | When the record was last changed |



### 33. host_applications

Phase: Prototype. A community member applying to host guests, guide or sell crafts.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| user_id | uuid | FK users, NN | Applicant |
| offer_type | enum | NN | homestay, guide, meal, craft, other |
| description | text | NN | What they want to offer |
| status | enum | NN | pending, approved, rejected |
| reviewed_by | uuid | FK users | Authority reviewer |
| reviewed_at | timestamptz |  | Decision time |
| created_at | timestamptz | NN | When the record was created |
| updated_at | timestamptz | NN | When the record was last changed |



## Platform


### 34. notifications

Phase: Prototype. Messages sent to users in the app, and later by push, SMS or WhatsApp.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| user_id | uuid | FK users, NN | Recipient |
| type | enum | NN | booking, advisory, sos, verification, report, review, system |
| title | varchar(150) | NN | Headline |
| body | text | NN | Message |
| channel | enum | NN | in_app, push, sms, whatsapp. Default in_app |
| related_type | varchar(30) |  | Kind of record it refers to |
| related_id | uuid |  | Id of that record |
| is_read | bool | NN | Default false |
| sent_at | timestamptz |  | When sent |
| delivery_status | enum | NN | queued, sent, delivered, failed |
| created_at | timestamptz | NN | When the record was created |



### 35. saved_items

Phase: Prototype. Things a tourist saved with the Save button. Unique on user_id, item_type and item_id.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| user_id | uuid | FK users, NN | Tourist |
| item_type | enum | NN | listing, destination |
| item_id | uuid | NN | Id of the saved record |
| created_at | timestamptz | NN | When the record was created |



### 36. audit_logs

Phase: Prototype. Record of sensitive actions such as verification, advisory publishing and booking changes.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | uuid | PK | Unique identifier |
| user_id | uuid | FK users | Who acted. Empty for system actions |
| action | varchar(60) | NN | For example listing.approve |
| entity_type | varchar(40) | NN | Table name of the record |
| entity_id | uuid |  | Record id |
| old_values | jsonb |  | Values before |
| new_values | jsonb |  | Values after |
| ip_address | varchar(45) |  | Address of the request |
| created_at | timestamptz | NN | When the record was created |



# 6. Sample dataset

These rows come from the prototype and are used to seed the demo. Names, prices and numbers are samples, not real businesses.


## Areas

| Name | Type | Note |
| --- | --- | --- |
| Swat | district | Parent of the areas below |
| Mingora | town | Main city and gem market |
| Madyan | town | River point for rafting |
| Bahrain | town | Between Madyan and Kalam |
| Kalam | valley | Upper valley |
| Utror | valley | Homestay area |
| Ushu | valley | Forest and trails |
| Malam Jabba | valley | Ski and viewpoint |
| Fizaghat | town | Local bazaar |



## Destinations

| Name | Area | Category | Description |
| --- | --- | --- | --- |
| Kalam Valley | Kalam | valley | Rivers, meadows, cool weather |
| Mahodand Lake | Kalam | lake | Boating and camping |
| Malam Jabba | Malam Jabba | ski | Ski resort and viewpoint |
| Ushu Forest | Ushu | forest | Walks and camping |



## Demo users

| Name | Role | Note |
| --- | --- | --- |
| Sara Ahmed | tourist | Demo tourist |
| Riverside Inn owner | business | Owns Riverside Inn and Mountain Grill |
| Ali Khan | business | Guide and Jeep owner |
| Gul Zaman | community | Resident of Ushu |
| Tourism Officer | authority | Verifies and publishes |



## Tags

| Group | Labels |
| --- | --- |
| facility | Wi-Fi, Heating, Hot water, Parking, Family rooms, Breakfast, Homestay |
| feature | Local made, Certificate given, Embroidery, Woodwork, Shawls |
| language | Urdu, Pashto, English |
| safety | Life jackets, Trained guide, Safety gear included |
| shop_category | Gemstones, Handicrafts |
| activity_type | Rafting, Camping, Trekking, Fishing, Jeep safari |



## Listings and price items

| Listing | Type | Area | Price items and details |
| --- | --- | --- | --- |
| Riverside Inn, Madyan | hotel | Madyan | Double room Rs 7,500 per night (5 free). Family room Rs 11,000 per night (2 free) |
| Mountain Grill, Kalam | restaurant | Kalam | Chapli kebab Rs 600. Fried trout Rs 1,400. Mutton karahi Rs 2,200. Open 8 am to 10 pm |
| 4x4 Jeep, Swat Rides | transport | Mingora | Mingora to Kalam Rs 9,000. Kalam to Mahodand Rs 7,000. Full day Rs 9,000 per day. Pickup at Mingora bus stand |
| Ali Khan, mountain guide | guide | Kalam | Half day Rs 2,500. Full day Rs 4,000. Urdu, Pashto, English |
| River rafting, Madyan | activity | Madyan | Rs 3,000 per person. Private group of 6 Rs 15,000. 2 hours, ages 10 and above, 8 spots per day |
| Lakeside camping, Mahodand | activity | Kalam | Rs 5,000 per tent for 2 people. Dinner included |
| Swat Gem House | shop | Mingora | Emerald ring from Rs 18,000. Polished stones set of 5 Rs 2,500. Certificate given |
| Kalam Handicrafts | shop | Kalam | Swati embroidered shawl Rs 3,500. Carved walnut box Rs 2,200 |



## Safety and community

| Record | Sample |
| --- | --- |
| Advisory | Flood watch, Kalam. Avoid river banks after heavy rain. Severity warning |
| Road status | Mingora to Kalam: open. Kalam to Mahodand: limited, 4x4 only |
| Emergency contact | Rescue 1122 (rescue, 24 hours). Police 15 (police, 24 hours). Add hospitals and tourism police after confirming numbers with the authority |
| Community report | Blocked road near Fizaghat, status new. Litter at river bank, status resolved |


Availability for the sample listings is generated by the seed script as units per day for the next 30 days.
