# External APIs & Integrations Directory
**Swat Tourism Platform (STP)**

This document details all external APIs, protocols, endpoints, and third-party integrations utilized across the Swat Tourism Platform for payment processing, live weather forecasting, maps & route navigation, intercity transit, and emergency dispatch services.

---

## 1. Payment Gateway Integrations

### 1.1 Easypaisa Payment Gateway
* **Provider:** Telenor Microfinance Bank / Easypaisa (Pakistan)
* **Integration Method:** Mobile Account Direct Debit API, Hosted Checkout & Asynchronous Instant Payment Notification (IPN) webhook listener.
* **Protocol & Format:** REST API / JSON over HTTPS; SHA-256 HMAC message verification.
* **Functionality:** 
  - Direct debit prompt to tourist's registered Easypaisa mobile wallet.
  - Generates instant digital confirmation vouchers.
  - Server-to-server webhook confirmation for asynchronous transaction settlement.

### 1.2 JazzCash Merchant Payment Gateway
* **Provider:** Mobilink Microfinance Bank / Jazz (Pakistan)
* **Integration Method:** Official JazzCash Merchant API specification with `pp_SecureHash` HMAC-SHA256 signature calculation.
* **Transaction Modes:**
  - `MWALLET` (Mobile Wallet PIN debit).
  - Debit/Credit Card hosted payment redirect.
* **Functionality:** Real-time fare debit for hotel bookings and transport tickets, accompanied by automated reference issuance (`SWT-EXP-XXXX`).

---

## 2. Weather & Climate APIs

### 2.1 OpenWeatherMap API
* **Provider:** OpenWeather Ltd.
* **API Endpoints:**
  - Current Weather: `https://api.openweathermap.org/data/2.5/weather`
  - 5-Day / 3-Hour Forecast: `https://api.openweathermap.org/data/2.5/forecast`
* **Configured Key:** Configured via `VITE_OPENWEATHER_API_KEY` / `OPENWEATHER_API_KEY` environment variable
* **Functionality:**
  - Live temperature, altitude-specific weather modeling (e.g., Kalam, Malam Jabba, Mahodand Lake, Ushu Forest).
  - Rain/snow precipitation probabilities and wind speeds.
  - Dynamic mountain safety advisories alerting tourists before departure.

---

## 3. Maps & Routing APIs

### 3.1 OpenStreetMap (OSM) Tile API
* **Provider:** OpenStreetMap Foundation
* **Tile Endpoint:** `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
* **Rendering Engine:** Leaflet JS
* **Functionality:** Interactive, keyless map rendering showing valley topography, tourist attractions, verified hotels, and local businesses.

### 3.2 Google Maps Driving Directions API & Deep Link
* **Provider:** Google Maps Platform
* **Bridge URL:** `https://www.google.com/maps/dir/?api=1&origin={origin}&destination={lat},{lng}&travelmode=driving`
* **Functionality:** Direct deep-link navigation hand-off allowing tourists to launch turn-by-turn mobile GPS navigation.

### 3.3 Highway Polyline Routing & OSRM Engine
* **Integration:** Open Source Routing Machine (OSRM) format & Pre-computed Highway Geometry Engine (`src/api/routeGeo.ts`).
* **Functionality:**
  - High-precision polyline coordinates tracing the M-1 / M-2 Motorways, M-16 Swat Expressway, and N-95 National Highway into Swat.
  - Real-time road distance in kilometers (`distanceKm`).
  - Expected driving durations (`durationText`).
  - Dynamic map bounds fitting (`map.fitBounds`) to display origin-to-destination routes.

---

## 4. Intercity Transport Integrations

### 4.1 Daewoo Express
* **Hotline / Service API:** `111-007-008`
* **Terminals Integrated:** Islamabad 26 Number Terminal, Faizabad Intercity Terminal, Peshawar Cantt, Mingora General Bus Stand.
* **Fleets:** Super Luxury AC (2x2) and Gold Class VIP Sleeper (2x1).

### 4.2 Faisal Movers
* **Hotline / Service API:** `111-228-486`
* **Terminals Integrated:** Rawalpindi Pirwadhai, Lahore Thokar Niaz Baig, Mingora Motorway Bypass Terminal.
* **Fleets:** Executive Class Yutong & Business Class Luxury (2x1).

### 4.3 Swat Coach & Flying Express
* **Hotline / Direct Dispatch:** `+92-946-724111`
* **Route:** Non-stop express shuttles operating via the Swat Expressway M-16 tunnel corridor.

### 4.4 KPCTA Approved Shuttles & Chauffeur Registry
* **Authority:** Khyber Pakhtunkhwa Culture & Tourism Authority (KPCTA)
* **Fleets:** Mountain-grade 4x4 Toyota Coasters and private on-demand chauffeur cabs for high-altitude destinations (Kalam, Mahodand, Malam Jabba).

---

## 5. Emergency Contact & Dispatch Integrations

### 5.1 Rescue 1122 Swat Control & Dispatch
* **Emergency Hotline:** `tel:1122`
* **Service:** Provincial emergency ambulance, mountain search-and-rescue, and disaster response teams across Mingora, Madyan, Bahrain, and Kalam stations.

### 5.2 KP Tourist Police Emergency Helpline
* **Emergency Hotline:** `tel:1422`
* **Service:** Dedicated Khyber Pakhtunkhwa Tourist Facilitation Police for tourist assistance, travel clearances, and security escort coordination.

### 5.3 Swat Levies & District Police Emergency
* **Emergency Hotline:** `tel:15` | Control Room: `0946-9240400`
* **Service:** Saidu Sharif / Mingora headquarters district security dispatch and highway patrols.

### 5.4 PDMA KP (Provincial Disaster Management Authority)
* **Emergency Operations Hotline:** `tel:1700`
* **Service:** Real-time road blockage alerts, flood/landslide warnings, and high-altitude weather disaster bulletins.

### 5.5 W3C HTML5 Geolocation API
* **Interface:** `navigator.geolocation.getCurrentPosition`
* **Functionality:** Automated browser GPS latitude and longitude coordinate capture for one-click emergency SOS beacon transmissions, citizen complaint geo-tagging, and dispatch team routing.
