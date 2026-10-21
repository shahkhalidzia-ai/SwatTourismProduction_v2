import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.modules.accounts.router import router as auth_router
from app.modules.places.router import router as places_router
from app.modules.listings.router import router as listings_router
from app.modules.trips.router import router as trips_router
from app.modules.bookings.router import router as bookings_router
from app.modules.safety.router import router as safety_router
from app.modules.community.router import router as community_router
from app.modules.verification.router import router as verification_router
from app.modules.notifications.router import router as notifications_router
from app.modules.content.router import router as content_router
from app.modules.reviews.router import router as reviews_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # Ensure database schema and columns are synchronized
    try:
        from app.core.database import engine, Base
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            if str(engine.url).startswith("sqlite"):
                def auto_migrate_sqlite(sync_conn):
                    cols = [row[1] for row in sync_conn.exec_driver_sql("PRAGMA table_info(users)").fetchall()]
                    new_cols = [
                        ("failed_login_attempts", "INTEGER DEFAULT 0 NOT NULL"),
                        ("locked_until", "DATETIME"),
                        ("reset_token", "VARCHAR(120)"),
                        ("reset_token_expires_at", "DATETIME"),
                        ("phone_otp", "VARCHAR(10)"),
                        ("phone_otp_expires_at", "DATETIME"),
                        ("is_phone_verified", "BOOLEAN DEFAULT 0 NOT NULL")
                    ]
                    for col_name, col_type in new_cols:
                        if col_name not in cols:
                            sync_conn.exec_driver_sql(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};")
                await conn.run_sync(auto_migrate_sqlite)
    except Exception as e:
        print(f"[WARN] Database startup sync: {e}", flush=True)

    # Startup route verification check to ensure all module routers are registered
    import sys
    print("\n" + "=" * 70, flush=True)
    print("=== SWAT TOURISM PLATFORM - REGISTERED API ROUTES CHECK ===", flush=True)
    print("=" * 70, flush=True)
    
    registered_paths = [getattr(r, "path", "") for r in app.routes]
    
    for route in sorted(app.routes, key=lambda r: getattr(r, "path", "")):
        methods = getattr(route, "methods", None)
        methods_str = ",".join(sorted(methods)) if methods else "MOUNT"
        print(f"  {methods_str:16} {getattr(route, 'path', '')}", flush=True)
    
    # Explicit check for critical core routers
    expected_router_prefixes = [
        f"{settings.API_V1_STR}/auth",
        f"{settings.API_V1_STR}/places",
        f"{settings.API_V1_STR}/listings",
        f"{settings.API_V1_STR}/trips",
        f"{settings.API_V1_STR}/bookings",
        f"{settings.API_V1_STR}/safety",
        f"{settings.API_V1_STR}/community",
        f"{settings.API_V1_STR}/verification",
    ]
    
    print("-" * 70, flush=True)
    all_routers_present = True
    for prefix in expected_router_prefixes:
        is_registered = any(p.startswith(prefix) for p in registered_paths)
        status_label = "[OK] REGISTERED" if is_registered else "[MISSING ROUTER!]"
        print(f"  Router {prefix:30} -> {status_label}", flush=True)
        if not is_registered:
            all_routers_present = False
            
    if all_routers_present:
        print(">>> All core modules and routers successfully verified and active! <<<", flush=True)
    else:
        print(">>> WARNING: Some expected module routers are NOT registered! <<<", flush=True)
    print("=" * 70 + "\n", flush=True)
    sys.stdout.flush()

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Working Prototype API for Swat Tourism Platform connecting tourists, businesses, communities, and authorities.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# CORS Middleware
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local uploads for static media serving (mock/local storage interface)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


# Health check
@app.get("/health", tags=["system"])
async def health_check():
    return {
        "status": "ok",
        "app": settings.PROJECT_NAME,
        "version": "1.0.0",
        "api_v1": settings.API_V1_STR
    }


# Include all module routers under /api/v1
api_v1_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1_prefix)
app.include_router(places_router, prefix=api_v1_prefix)
app.include_router(listings_router, prefix=api_v1_prefix)
app.include_router(trips_router, prefix=api_v1_prefix)
app.include_router(bookings_router, prefix=api_v1_prefix)
app.include_router(safety_router, prefix=api_v1_prefix)
app.include_router(community_router, prefix=api_v1_prefix)
app.include_router(verification_router, prefix=api_v1_prefix)
app.include_router(notifications_router, prefix=api_v1_prefix)
app.include_router(content_router, prefix=api_v1_prefix)
app.include_router(reviews_router, prefix=api_v1_prefix)
