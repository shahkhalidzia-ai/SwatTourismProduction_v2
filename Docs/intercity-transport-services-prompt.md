# Implementation Prompt: Intercity Transport Services & Operator Directory to Swat Valley

## Objective
Implement an **Intercity Transport & Travel Services Discovery Hub** for tourists traveling to Swat from different cities across Pakistan. 

A tourist should be able to:
1. Specify their **Origin City** in Pakistan (e.g., Islamabad, Rawalpindi, Peshawar, Lahore, Faisalabad, Karachi, Multan).
2. Confirm their **Destination within Swat District** (e.g., Mingora / Central Swat, Kalam Valley, Malam Jabba).
3. Search and browse **all available transport companies, bus operators, express shuttles, and private car services** operating on that route.
4. View comprehensive service details including **company name, departure/arrival timings, journey duration, ticket price per seat / vehicle, terminal locations, and onboard amenities**.
5. Directly **book seats, call operators, or attach the transport service to their Swat trip itinerary**.

---

## 1. Functional Requirements & User Experience

### 1.1 Origin & Destination Selector Bar
Provide a dedicated, interactive search bar in the Tourist Portal (under **Explore $\rightarrow$ Transport** or **Trip Planner**):
- **Origin City Selector (Dropdown & Autocomplete):**
  - Popular Pakistani cities with direct or connected routes to Swat:
    - *Islamabad / Rawalpindi* (Primary gateway via M-1 / Swat Expressway M-16)
    - *Peshawar* (Via M-1 / Swat Expressway)
    - *Lahore* (Via M-2 $\rightarrow$ M-1 $\rightarrow$ M-16)
    - *Faisalabad* (Via M-4 $\rightarrow$ M-2 $\rightarrow$ M-16)
    - *Gujranwala / Sialkot*
    - *Multan* (Via M-4 $\rightarrow$ M-2 $\rightarrow$ M-16)
    - *Karachi* (Long-haul bus / air-rail connect to Islamabad)
    - *Abbottabad / Haripur* (Via Hazara Motorway $\rightarrow$ Swat Expressway)
- **Swat Destination Hub:**
  - *Mingora / Saidu Sharif* (Main commercial terminal & Swat Motorway interchange)
  - *Kalam Valley* (Direct tourist coaches & 4x4 connect)
  - *Malam Jabba* (Direct resort shuttles)
  - *Bahrain / Madyan*
- **Travel Date Picker & Passenger Counter:**
  - Date selector defaulting to today/tomorrow.
  - Number of passengers (1 to 10+).

### 1.2 Comprehensive Transport Operator Listings
Display all registered transport providers serving the selected route with clear operator branding, verified credentials, and vehicle specifications:

#### Featured Transport Companies & Fleet Categories:
1. **Luxury & Executive Express Buses:**
   - *Daewoo Express* (Luxury AC, Business Class 2x1)
   - *Faisal Movers* (Executive / Business Class)
   - *Skyways / Niazi Express*
2. **Regional & Swat Express Coaches:**
   - *Swat Coach Services* (Flying Coach Mingora–Islamabad)
   - *Kalam Express Shuttles* (Daily luxury coasters)
   - *KPCTA Tourist Shuttle* (Government subsidized tourist coaches during peak season)
3. **Private Car, Hiace & 4x4 Chauffeur Services:**
   - *Private Sedan / Gli (Corolla / Yaris)* for direct door-to-door transfer.
   - *Toyota Grand Cabin / Hiace (14-seater)* for family groups.
   - *4x4 SUV / Prado* for mountain transfers directly to upper valleys.

### 1.3 Key Card Data & Information Display
Each transport result card must clearly display:
- **Company Name & Operator Badge:**
  - Operator logo / insignia (e.g., Daewoo Express, Faisal Movers, Local Verified Transporter).
  - "KPCTA Verified Operator" trust badge.
- **Departure & Arrival Timings:**
  - Scheduled departure time (e.g., `07:00 AM`, `09:30 AM`, `01:00 PM`, `10:00 PM - Night Sleeper`).
  - Estimated arrival time in Swat (e.g., `10:30 AM`).
  - Duration via Swat Motorway (e.g., `3h 30m` from Islamabad, `5h 45m` from Lahore).
- **Terminals & Pick-up / Drop-off Landmarks:**
  - Departure Terminal (e.g., *Islamabad 26 Number Terminal*, *Faizabad Terminal*, *Peshawar General Stand*).
  - Arrival Terminal (e.g., *Mingora General Bus Stand*, *Fizagat Tourist Terminal*, *Kalam Bus Stand*).
- **Ticket Price & Fares:**
  - Per-seat rate in PKR (e.g., `PKR 1,650 / Seat` for Standard, `PKR 2,400 / Seat` for Executive Business).
  - Full-vehicle charter rate for private options (e.g., `PKR 16,000` for Corolla, `PKR 28,000` for Hiace).
  - Clear breakdown of taxes or luggage charges.
- **Vehicle Type & Onboard Amenities:**
  - Badges: `Air Conditioned`, `Heating`, `Reclining Seats`, `Charging Ports`, `Free Wi-Fi`, `Luggage Allowance (30kg)`, `Rest Stop Included`.
- **Operator Contact & Reservation:**
  - Direct operator telephone / UAN hotline (e.g., `051-111-007-008`).
  - Instant online booking / seat selection trigger.

### 1.4 Sorting & Filter Controls
Allow tourists to quickly narrow down options:
- **Sort By:**
  - Earliest Departure
  - Lowest Ticket Price (PKR)
  - Fastest Duration
  - Highest Customer Rating
- **Filter By:**
  - Vehicle Type: Luxury Bus, Standard Coach, Private Car/Van.
  - Departure Time Window: Morning (6 AM – 12 PM), Afternoon (12 PM – 6 PM), Night (6 PM – 12 AM).
  - Amenities: Wi-Fi, Executive 2x1 seating, Direct Motorway route.

### 1.5 Integration with Trip Itinerary & Cart
- **"Add Transport to My Trip":**
  - Tourist can click *"Select & Add to Trip"*.
  - Automatically adds the intercity bus/car leg as **Day 1 / Inbound Travel Leg** of their active itinerary in `TripManagerView.tsx`.
  - Calculates travel time and incorporates the ticket price into the total estimated trip budget.
  - Generates travel voucher with boarding terminal details and departure time.

---

## 2. Technical Architecture & Data Schema

### 2.1 Backend Data Model (SQLModel / SQLAlchemy)

```python
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime, time

class IntercityRoute(SQLModel, table=True):
    __tablename__ = "intercity_routes"

    id: str = Field(primary_key=True)
    origin_city: str = Field(index=True)           # e.g., "Islamabad", "Lahore", "Peshawar"
    destination_city: str = Field(index=True)      # e.g., "Mingora (Swat)", "Kalam"
    distance_km: float                             # e.g., 245.0
    estimated_duration_mins: int                   # e.g., 210 (3.5 hours)
    via_route: str                                 # e.g., "M-1 & Swat Expressway M-16"
    is_active: bool = Field(default=True)

class TransportOperator(SQLModel, table=True):
    __tablename__ = "transport_operators"

    id: str = Field(primary_key=True)
    name: str                                      # e.g., "Daewoo Express", "Faisal Movers"
    company_type: str                              # "bus_line", "private_fleet", "tourist_shuttle"
    contact_phone: str                             # e.g., "+9251111007008"
    website_url: Optional[str] = None
    is_verified: bool = Field(default=True)
    rating_avg: float = Field(default=4.8)
    rating_count: int = Field(default=120)

class TransportSchedule(SQLModel, table=True):
    __tablename__ = "transport_schedules"

    id: str = Field(primary_key=True)
    operator_id: str = Field(foreign_key="transport_operators.id")
    route_id: str = Field(foreign_key="intercity_routes.id")
    vehicle_type: str                              # "Luxury Bus 2x1", "Standard AC", "Hiace Van"
    departure_terminal: str                        # "Islamabad 26 Number Terminal"
    arrival_terminal: str                          # "Mingora General Bus Stand"
    departure_time: str                            # "07:30 AM"
    arrival_time: str                              # "11:00 AM"
    frequency: str                                 # "Daily", "Every 2 Hours"
    ticket_price_pkr: int                          # e.g., 1850
    pricing_type: str                              # "per_seat", "per_vehicle"
    amenities: List[str] = Field(default_factory=list) # ["AC", "WiFi", "Charging", "Refreshments"]
    total_seats: int                               # e.g., 40
    is_booking_available: bool = Field(default=True)
```

### 2.2 API Endpoints

1. **`GET /api/v1/transport/intercity/routes`**
   - Returns list of available origin cities and Swat destination options.
   - Example response:
     ```json
     {
       "origin_cities": ["Islamabad/Rawalpindi", "Peshawar", "Lahore", "Faisalabad", "Multan", "Karachi"],
       "destinations": ["Mingora (Swat)", "Kalam Valley", "Malam Jabba"]
     }
     ```

2. **`GET /api/v1/transport/intercity/schedules?origin={city}&destination={dest}&date={YYYY-MM-DD}`**
   - Returns matching transport companies, departure times, ticket prices, and booking availability.
   - Response includes operator name, logo, departure terminal, arrival terminal, price in PKR, duration, and amenities list.

3. **`POST /api/v1/trips/{trip_id}/add-transport`**
   - Attaches the selected intercity schedule directly to Day 1 of the trip itinerary.
   - Updates total trip estimated budget.

---

## 3. Frontend Implementation Plan (React + TypeScript)

### 3.1 Component Architecture
1. **`IntercityTransportExplorer.tsx`**:
   - Main explorer container rendered within the Tourist Portal.
   - Houses the Origin City selector, Swat destination picker, date selector, and sorting filters.
2. **`TransportScheduleCard.tsx`**:
   - Reusable card rendering operator badge, departure/arrival timeline, pricing pill, amenities tags, and direct booking actions.
3. **`IntercityBookingModal.tsx`**:
   - Modal for reserving seats, selecting seat quantity, capturing passenger contact number, and producing confirmation booking voucher.
4. **Integration with `TripManagerView.tsx`**:
   - Displays the selected transport in the Day 1 travel schedule with route badges (e.g. `Islamabad → Mingora via Swat Expressway`).

### 3.2 Visual & Styling Guidelines
- Follow Swat Tourism design tokens:
  - Header: Alpine navy (`#0E2A47`) with verified green indicator (`var(--ok)`).
  - Pricing pills: Highlighted accent badges (`var(--acc)` / gold `var(--pri)`).
  - Time schedule display: Clean departure $\rightarrow$ arrival timeline with duration indicator.
  - Glassmorphic card styling with smooth hover transitions.

---

## 4. Verification & Testing Criteria

1. **Route Search Validation:**
   - Selecting "Islamabad" and "Mingora" renders active operators (Daewoo, Faisal Movers, Swat Coach).
   - Shows correct timings (morning, afternoon, evening slots) and ticket prices (PKR 1,500 – 3,500).
2. **Sorting & Filtering:**
   - Sorting by "Lowest Price" lists standard coaches first.
   - Sorting by "Earliest Departure" lists 06:00 AM / 07:00 AM services first.
3. **Itinerary Attachment:**
   - Clicking *"Add to Itinerary"* successfully links the transport item to the active trip plan.
   - Trip budget increments correctly by `(ticket_price * number_of_travellers)`.
4. **Automated Unit & Integration Tests:**
   - Add test suite in `src/test/intercity_transport.test.tsx` verifying route queries, schedule card rendering, and trip attachment.
