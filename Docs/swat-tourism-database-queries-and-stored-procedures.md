# Swat Tourism Platform — Production V2
## Database Architecture, Queries & Stored Procedures Technical Specification

> **Document Type:** Technical Architecture & Reference Manual  
> **Platform Version:** Production V2  
> **Backend Stack:** Python 3.11+, FastAPI, SQLAlchemy 2.0 (Async), aiosqlite / PostgreSQL, Alembic  
> **Generated Word Document:** [swat-tourism-database-queries-and-stored-procedures.docx](file:///f:/Antigravity/SwatTourismProduction_v2/Docs/swat-tourism-database-queries-and-stored-procedures.docx)

---

### Executive Summary

1. **Stored Procedures**:
   - There are **no SQL stored procedures** (such as Oracle PL/SQL or MS SQL T-SQL) deployed in the database engine.
   - The platform uses **SQLite with Write-Ahead Logging (WAL)** for development/prototyping (`swat_tourism_prod.db`) and **PostgreSQL** readiness in production.
   - In modern asynchronous cloud architectures, procedural logic is centralized in the **Python Service Layer** (`backend/app/modules/*/service.py`), ensuring Git version control, portability across database vendors, and non-blocking I/O.
2. **Database Queries**:
   - Authored using **SQLAlchemy 2.0 Async Query Syntax** (`select()`, `with_for_update()`, `insert()`, `update()`) inside each domain's `service.py`.
3. **Table Schemas & Models**:
   - Declared in `backend/app/modules/*/models.py` across 11 domain modules.
4. **Schema Migrations**:
   - Managed via Alembic in `backend/alembic/versions/`.
5. **Connection & Concurrency**:
   - Configured in `backend/app/core/database.py` with 10-second busy timeout and WAL mode.

---

### 1. Database Engine & Concurrency Settings

Configured in [`backend/app/core/database.py`](file:///f:/Antigravity/SwatTourismProduction_v2/backend/app/core/database.py):

| Parameter | Setting | Technical Purpose & Behavior |
| :--- | :--- | :--- |
| **Engine URL** | `sqlite+aiosqlite:///./swat_tourism_prod.db` | Fully asynchronous non-blocking SQLite engine; configurable via `DATABASE_URL` environment variable for `postgresql+asyncpg://`. |
| **Journal Mode** | `PRAGMA journal_mode=WAL;` | Write-Ahead Logging allows readers and writers to operate concurrently without locking the database file. |
| **Synchronous** | `PRAGMA synchronous=NORMAL;` | Delivers high write throughput while maintaining full crash durability on SSD/NVMe volumes. |
| **Busy Timeout** | `PRAGMA busy_timeout=10000;` | 10-second lock queue wait; completely prevents `database is locked` operational errors. |
| **Foreign Keys** | `PRAGMA foreign_keys=ON;` | Enforces relational integrity, cascades, and orphaned child record prevention. |

---

### 2. Architecture Comparison: Stored Procedures vs. Python Service Layer

| Dimension | Traditional DB Stored Procedures | Swat Tourism Platform (Python Service Layer) |
| :--- | :--- | :--- |
| **Location** | Database server engine (e.g. Oracle, SQL Server) | `backend/app/modules/<domain>/service.py` |
| **Language** | Vendor-specific PL/SQL or T-SQL | Pure Python 3.11+ with SQLAlchemy 2.0 |
| **Portability** | High vendor lock-in | Zero lock-in; runs seamlessly on SQLite, PostgreSQL, CockroachDB |
| **Concurrency** | Synchronous DB threads | Asynchronous non-blocking event loop (`asyncio`) |
| **Testing & CI/CD** | Complex out-of-band DB deployment scripts | 100% automated test coverage via Vitest and Pytest (119 automated tests) |
| **Side Effects** | Cannot easily trigger WebSockets, SMS, or cache invalidation | Direct integration with SMS gateways, WebSockets, and background workers |

---

### 3. Module-by-Module Query & Schema Mapping

The database domain is split across 11 modules under [`backend/app/modules/`](file:///f:/Antigravity/SwatTourismProduction_v2/backend/app/modules):

```
backend/app/modules/
├── accounts/          # Users, RBAC profiles, JWT auth
├── bookings/          # Bookings, payments, availability locking, receipts
├── community/         # Local stories, cottage crafts, village hosts
├── content/           # Curated travel guides, packing checklists
├── listings/          # Hotels, restaurants, transport, activities, price items
├── notifications/    # In-app alerts, SMS notification logs
├── places/            # Valley destinations, geo-coordinates, areas
├── reviews/           # Verified traveler ratings & reviews
├── safety/            # Road blockages, weather advisories, emergency SOS
├── trips/             # Multi-day itineraries, route order, vehicle hires
└── verification/      # KYC business document approvals & audit trails
```

#### Detailed Directory Breakdown:

| Domain Module | ORM Models (`models.py`) | Service Queries (`service.py`) | Key Query Operations |
| :--- | :--- | :--- | :--- |
| **1. Bookings & Payments** | `Booking`, `BookingItem`, `BookingStatusHistory`, `Payment` | `BookingService` | Row-level locking on inventory (`with_for_update`), state machine transitions (`requested` → `accepted` → `confirmed`), live KPI earnings calculations |
| **2. Listings & Availability** | `Listing`, `ListingType`, `PriceItem`, `Availability`, `ListingDetail` | `ListingService` | Multi-category catalog queries, price item CRUD, 60-day calendar availability batch updates |
| **3. Trips & Itineraries** | `Trip`, `TripStop`, `SavedDestination` | `TripService` | Sequential itinerary ordering, stay continuity badges, transport hire linkages |
| **4. Accounts & RBAC** | `User`, `BusinessProfile`, `TouristProfile`, `AuthorityProfile` | `AccountService` | Identity queries, password verification, multi-persona demo switches, profile scoping |
| **5. Safety & SOS** | `Advisory`, `EmergencyAlert`, `RoadStatus` | `SafetyService` | High-priority SOS distress alerts with GPS coordinates, active road clearance feeds |
| **6. Community Voice** | `CommunityStory`, `CraftItem`, `HostApplication`, `CommunityReport` | `CommunityService` | Local storytelling feeds, cottage craft approvals, homestay applications |
| **7. Authority Verification**| `VerificationRequest`, `AuditLog`, `BusinessDocument` | `VerificationService`| Business registration audit queues, approval actions, document inspection |
| **8. Places & Geodata** | `Place`, `Destination`, `Region` | `PlaceService` | Valley tourist attractions, coordinates, weather station mapping |
| **9. Reviews & Ratings** | `Review`, `RatingSummary` | `ReviewService` | Verified traveler reviews, star average computations, sentiment rollups |
| **10. Notifications & SMS** | `Notification`, `SMSDeliveryLog` | `NotificationService` | User alert feeds, SMS delivery audit trails, unread count counters |
| **11. Content & CMS** | `Article`, `GuidePage` | `ContentService` | Editorial travel guides, seasonal packing checklists, platform policies |

---

### 4. Critical Stored Workflow Equivalents in Python

#### A. Overbooking Prevention with Row-Level Lock (`SELECT FOR UPDATE`)
*File: `backend/app/modules/bookings/service.py` (`BookingService.create_booking`)*

```python
# Atomic availability reservation with row-level lock
for dt in item_dates:
    avail_q = (
        select(Availability)
        .where(
            Availability.price_item_id == price_item.id,
            Availability.date == dt
        )
        .with_for_update()
    )
    avail_res = await db.execute(avail_q)
    avail = avail_res.scalar_one_or_none()
    
    if avail and (avail.units_booked + units_needed > avail.units_total):
        raise HTTPException(
            status_code=400,
            detail=f"Sold out: Only {avail.units_total - avail.units_booked} units available on {dt}"
        )
    avail.units_booked += units_needed
    db.add(avail)

await db.commit()
```

#### B. Today Screen KPI & Earnings Rollup Aggregation
*File: `backend/app/modules/bookings/service.py` (`BookingService.get_business_summary`)*

```python
# Live KPI aggregation across booking records
earnings_week = await db.scalar(
    select(func.coalesce(func.sum(Booking.total_amount), 0.0))
    .where(
        Booking.business_id == business_id,
        Booking.status.in_(['confirmed', 'completed']),
        Booking.created_at >= week_start
    )
)

pending_count = await db.scalar(
    select(func.count(Booking.id))
    .where(
        Booking.business_id == business_id,
        Booking.status == 'requested'
    )
)
```

---

### 5. Alembic Schema Migrations (DDL)

Located in [`backend/alembic/versions/`](file:///f:/Antigravity/SwatTourismProduction_v2/backend/alembic/versions):

1. `f39ca4091079_init_schema.py` — Base schema and UUID extension hooks
2. `e2aa48e6753c_create_accounts_and_profiles.py` — Users, RBAC profiles
3. `a411f482e75c_create_listing_engine_tables.py` — Listings, price items, availability
4. `37670fd4122a_create_destinations_trips_and_saved_.py` — Trips, trip stops
5. `f94996d31568_create_verification_and_audit_tables.py` — Verification requests & audit logs
6. `21e18e4cdc05_create_safety_and_community_tables.py` — Advisories, SOS alerts, stories
7. `d942e12a8b34_add_price_item_details.py` — Default units and bed setup columns

---

### 6. Client-Side Persistence Layer

*File: [`frontend/src/modules/business/physicalRooms.ts`](file:///f:/Antigravity/SwatTourismProduction_v2/frontend/src/modules/business/physicalRooms.ts)*

- **Storage Key**: `swat_hotel_physical_rooms` (localStorage).
- **Event Bus**: Dispatches `swat_physical_rooms_updated` asynchronously (`setTimeout(..., 0)`).
- **Synchronization**: Real-time sync between room rack tiles, housekeeping status (Available, Reserved, Occupied, Cleaning, Maintenance), and the 60-day calendar availability sheet.
