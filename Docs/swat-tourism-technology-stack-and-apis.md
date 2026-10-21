# Swat Tourism Platform (STP) — Comprehensive Technologies & External APIs Directory
**Document Version:** 2.0 (Production Release)  
**Date:** October 2026  
**Scope:** Swat Tourism Platform Architecture  
**Word Document (.docx) Download:** [swat-tourism-technology-stack-and-apis.docx](file:///f:/Antigravity/SwatTourismProduction_v2/Docs/swat-tourism-technology-stack-and-apis.docx)

---

## 1. Frontend Client Technologies

| Technology / Library | Version | Category | Purpose & Role in Project |
| :--- | :--- | :--- | :--- |
| **React** | `19.2.8` | UI Framework | Core declarative component library powering the Single Page Application (SPA). |
| **TypeScript** | `~6.0.2 / 5.8` | Language | Provides strict static typing, interfaces, and compile-time correctness across all modules. |
| **Vite** | `8.3.0` | Build & Bundler | Ultra-fast ESM bundler with Hot Module Replacement (HMR) and optimized production compilation. |
| **TanStack React Query** | `^5.104.0` | State Management | Server state caching, background refetching, optimistic mutations, and window focus revalidation. |
| **React Router DOM** | `^7.18.4` | Routing | Client-side routing, query parameters management, subtab switching, and role guards. |
| **Leaflet JS** | `^1.9.4` | Interactive Mapping | Lightweight map engine rendering Swat destinations, attractions, hotels, and highway routes. |
| **Lucide React** | `^1.49.0` | Iconography | Consistent vector icons for navigation, weather indicators, transportation, and badges. |
| **Vanilla CSS / Tokens** | *Native CSS3* | Design System | CSS variables/tokens supporting dual themes (Emerald Pine & Deep Cobalt) without runtime overhead. |
| **Vite PWA Plugin** | `^1.3.0` | Progressive Web App | Service worker registration, offline asset caching, and mobile installable app manifest. |
| **Vitest** | `^5.0.3` | Test Runner | High-performance test framework executing 107 unit and integration tests across 21 test suites. |
| **React Testing Library** | `^16.3.3` | Testing Tool | User-centric DOM simulation verifying accessible queries, modals, and user flows. |
| **JSDOM** | `^30.1.1` | DOM Environment | In-memory W3C DOM and browser API simulation for headless test executions. |
| **Oxlint** | `^1.81.0` | Code Hygiene | Next-generation high-speed linter enforcing code standards and eliminating regressions. |

---

## 2. Backend Server & API Technologies

| Technology / Library | Version | Category | Purpose & Role in Project |
| :--- | :--- | :--- | :--- |
| **FastAPI** | `>=0.111.0` | Web Framework | High-performance asynchronous Python REST framework with automatic OpenAPI/Swagger docs. |
| **Python** | `3.11+ / 3.12` | Language | Core server runtime powering all business logic, calculation engines, and adapters. |
| **Uvicorn (Standard)** | `>=0.30.0` | ASGI Web Server | Production-grade ASGI application server handling asynchronous HTTP and WebSocket requests. |
| **SQLAlchemy** | `>=2.0.30` | ORM Engine | Modern 2.0 async ORM managing database models, relationship graphs, and complex transactions. |
| **Alembic** | `>=1.13.1` | Database Migrations | Schema version control and automated migration pipeline for relational database structures. |
| **Pydantic & Settings** | `>=2.7.0` | Data Validation | Type-safe request/response schema parsing, serialization, and .env configuration management. |
| **HTTPX** | `>=0.27.0` | Async HTTP Client | Non-blocking client dispatching requests to external payment gateways, weather, and SMS APIs. |
| **Python-JOSE** | `>=3.3.0` | Security / JWT | Cryptographic JSON Web Token (JWT) generation, HS256 encryption, and role claim validation. |
| **Passlib (Bcrypt)** | `>=1.7.4` | Security / Hashing | Enterprise-grade Bcrypt salt-hashing for secure user credential storage. |
| **Python-Multipart** | `>=0.0.9` | File Uploads | Streaming parser for business verification documents, hotel photos, and media attachments. |
| **Pytest & Asyncio** | `>=8.2.0` | Backend Testing | Asynchronous test runner validating API contracts, role isolation, and database models. |

---

## 3. Database, Storage, Infrastructure & DevOps

| Infrastructure Layer | Configuration | Deployment Type | Role & Operational Capability |
| :--- | :--- | :--- | :--- |
| **PostgreSQL 16 (Alpine)** | Docker Service `db` | Containerized Production | Enterprise relational database running on port 5433 with `asyncpg` and `psycopg3` drivers. |
| **SQLite (WAL Mode)** | `aiosqlite` driver | Local / Standalone | Zero-dependency local database with Write-Ahead Logging for high-concurrency instant runs. |
| **Docker & Compose** | `docker-compose.yml` | Containerization | Multi-service orchestration of Database, Backend API, and Frontend Web containers. |
| **Nginx (Alpine)** | Reverse Proxy | Edge Web Server | Reverse proxies `/api/v1` to FastAPI and delivers production static assets with gzip compression. |
| **Storage Pipeline** | Local / S3 Hybrid | Asset Storage | Dual-engine storage pipeline supporting local `/uploads` directory and Amazon S3 buckets. |

---

## 4. Comprehensive External APIs Directory

| External Service / API | Provider / Authority | Protocol & Integration | Key Capabilities & Endpoints |
| :--- | :--- | :--- | :--- |
| **Easypaisa Payment Gateway** | Telenor Microfinance Bank | REST API / HTTPS<br>HMAC-SHA256 signature | • Direct Mobile Account (MA) debit push<br>• Hosted Web Checkout portal<br>• IPN webhook listener for settlement |
| **JazzCash Merchant Gateway** | Mobilink Microfinance Bank | REST API 2.0<br>`pp_SecureHash` HMAC | • MWALLET USSD PIN prompt on mobile<br>• Hosted card gateway checkout<br>• Instant reference issuance (`SWT-EXP-XXXX`) |
| **Stripe / Global Cards** | Stripe Platform | REST API & SDK<br>3D-Secure 2.0 | • Visa, Mastercard, PayPak processing<br>• Multi-currency conversion for foreign tourists<br>• Tokenized PCI-DSS compliant vault |
| **Raast Instant Payment Rail** | State Bank of Pakistan | ISO 20022 / QR Code<br>Direct IBAN Rail | • Dynamic QR code generation for reservations<br>• Instant zero-fee bank-to-bank settlement<br>• National standard across all Pakistani banks |
| **OpenWeatherMap API** | OpenWeather Ltd | REST API / JSON<br>Configured API Key | • Current weather (`/data/2.5/weather`)<br>• 5-day / 3-hour forecasts (`/data/2.5/forecast`)<br>• Altitude modeling (Kalam, Malam Jabba, Ushu) |
| **Pakistan Met Department (PMD)** | Govt. of Pakistan | HTTP Bulletin Feed | • High-altitude mountain snowfall alerts<br>• Monsoon flood warnings & advisories |
| **OpenStreetMap (OSM) Tiles** | OpenStreetMap Foundation | Tile Server / Leaflet JS | • High-resolution valley topography tiles<br>• Attraction, hotel & scenic trail mapping |
| **Google Maps Navigation Bridge** | Google Maps Platform | HTTPS Deep-Link URI | • Turn-by-turn driving navigation hand-off<br>• Native GPS navigation launch on smartphones |
| **OSRM Highway Polyline Engine** | Open Source Routing Machine | GeoJSON Polylines<br>`src/api/routeGeo.ts` | • Traces M-1/M-2 Motorways & M-16 Expressway<br>• Calculates road distance (km) and travel duration<br>• Dynamic map viewport auto-fitting |
| **W3C HTML5 Geolocation** | W3C Browser Standard | `navigator.geolocation` | • Real-time tourist GPS coordinates capture<br>• Automated lat/lng tagging for SOS alerts |
| **Rescue 1122 CAD Dispatch** | KP Emergency Services | REST Webhook / JSON<br>`cad-dispatch.rescue1122...` | • Automated Computer Aided Dispatch alerts<br>• Coordinates ambulance & mountain rescue teams |
| **KP Tourist Police Helpline** | KP Tourist Police | Tel Hotline: `1422` | • Direct tourist safety coordination<br>• High-altitude travel permits and escorts |
| **Swat Levies & District Police** | Swat Police Headquarters | Tel: `15` / `0946-9240400` | • Highway security patrols & dispatch<br>• 24/7 central emergency operations room |
| **PDMA KP Disaster Authority** | Provincial Disaster Authority | Tel Hotline: `1700` | • Landslide, avalanche, and roadblock alerts<br>• River Swat water level emergency warnings |
| **Daewoo Express Transit Bridge** | Daewoo Express Pakistan | Service: `111-007-008` | • Intercity schedule feeds from Rawalpindi/Lahore<br>• Super Luxury AC & Gold Class VIP Sleeper |
| **Faisal Movers Schedule Bridge** | Faisal Movers Pakistan | Service: `111-228-486` | • Luxury Yutong and Business Class schedules<br>• Direct Swat Expressway express corridor |
| **Pakistani SMS Gateway Bridge** | Telenor / Jazz / Twilio | REST API / HTTPS<br>`api.sms-gateway.pk/v2` | • Automated SMS OTP confirmation delivery<br>• Booking updates and emergency SMS broadcasts |

---

## 5. Security, Cryptography & Compliance Standards

- **HMAC-SHA256 Cryptographic Hashing**: All transaction communications with Easypaisa, JazzCash, and banking webhooks are cryptographically authenticated with merchant secret keys.
- **Bcrypt Password Salting**: User credentials stored in the database are hashed using salted Bcrypt with configurable complexity factors.
- **JWT HS256 Tokenization**: Stateless, cryptographically signed authentication tokens with role claim verification isolating Tourist, Business, and Authority workflows.
- **CORS & Origin Filtering**: Configurable cross-origin resource sharing restricting unauthorized domain access.
- **Zero-Exposure API Design**: Sensitive credentials and hash keys are managed via Pydantic environment configurations and excluded from client bundles.
