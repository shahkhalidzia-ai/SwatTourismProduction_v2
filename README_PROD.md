# Swat Tourism Platform — Production Application

## Overview
This is the independent **Production Application Codebase** for the Swat Tourism Digital Ecosystem, cloned and evolved from the initial prototype.

### Core Architecture Enhancements
1. **Isolated Production Environment:** Completely independent from `SwatTourismPlateform1`.
2. **High-Concurrency SQLite with WAL Mode:**
   - `PRAGMA journal_mode=WAL` (Write-Ahead Logging enabled for concurrent multi-reader/multi-writer performance)
   - `PRAGMA synchronous=NORMAL` (Durability against crashes with maximized disk write speed)
   - `PRAGMA busy_timeout=10000` (10-second wait to prevent database lock contention)
   - `PRAGMA foreign_keys=ON` (Strict relational integrity)
3. **Easypaisa Payment Gateway Integration:**
   - Supports **Easypaisa Mobile Account (MA)** instant PIN approval prompt.
   - Supports **Easypaisa Hosted Web Checkout** with cryptographic HMAC-SHA256 signature generation.
   - Asynchronous Instant Payment Notification (**IPN**) webhook verification listener.
   - Digital printable receipts with Easypaisa transaction reference IDs.

---

## How to Run Production Services

### Option A: One-Click Runner
Double click:
```cmd
run_prod.bat
```
To stop all services:
```cmd
stop_prod.bat
```

### Option B: Manual Startup

#### 1. Backend (FastAPI on Port 8090)
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8090 --reload
```
API Documentation: `http://localhost:8090/docs`

#### 2. Frontend (Vite + React on Port 5174)
```bash
cd frontend
npm run dev -- --port 5174
```
Web App: `http://localhost:5174`

---

## Easypaisa Configuration
In `backend/app/core/config.py`:
- `EASYPAISA_STORE_ID`: Your merchant store ID
- `EASYPAISA_HASH_KEY`: Your merchant secret hash key
- `EASYPAISA_ENV`: `sandbox` (for test accounts) or `live` (for commercial transactions)
- `EASYPAISA_DIRECT_API_URL`: Direct mobile debit endpoint
- `EASYPAISA_CHECKOUT_URL`: Hosted portal redirect endpoint
