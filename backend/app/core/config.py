from typing import List, Union, Optional
from pathlib import Path
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Canonical database path: always anchored to backend/swat_tourism_prod.db regardless of process CWD
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
CANONICAL_DB_FILE = (BACKEND_DIR / "swat_tourism_prod.db").resolve()
CANONICAL_DB_PATH = CANONICAL_DB_FILE.as_posix()


class Settings(BaseSettings):
    PROJECT_NAME: str = "Swat Tourism Platform (Production)"
    API_V1_STR: str = "/api/v1"
    PORT: int = 8090
    
    # Database (SQLite with Write-Ahead Logging WAL mode)
    DATABASE_URL: str = f"sqlite+aiosqlite:///{CANONICAL_DB_PATH}"
    DATABASE_SYNC_URL: str = f"sqlite:///{CANONICAL_DB_PATH}"
    SQLITE_WAL_MODE: bool = True
    
    # Security
    SECRET_KEY: str = "swat_tourism_prod_secure_secret_key_99482910485720184729"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # Easypaisa Payment Gateway Settings
    EASYPAISA_STORE_ID: str = "swat_tourism_store"
    EASYPAISA_HASH_KEY: str = "EP_SEC_KEY_SWAT_TOURISM_2026"
    EASYPAISA_MERCHANT_ID: str = "EP_MCH_99412"
    EASYPAISA_ENV: str = "sandbox"  # 'sandbox' or 'live'
    EASYPAISA_CHECKOUT_URL: str = "https://easypaystg.easypaisa.com.pk/easypay/Index.jsf"
    EASYPAISA_DIRECT_API_URL: str = "https://easypaystg.easypaisa.com.pk/easypay-service/rest/v4"
    EASYPAISA_CALLBACK_URL: str = "http://localhost:8090/api/v1/bookings/easypaisa/ipn-callback"
    
    # JazzCash Payment Gateway Settings
    JAZZCASH_MERCHANT_ID: str = "MC994120"
    JAZZCASH_PASSWORD: str = "jazz_pw_swat_2026"
    JAZZCASH_INTEGRITY_SALT: str = "salt_jazz_swat_sec_8841928"
    JAZZCASH_ENV: str = "sandbox"  # 'sandbox' or 'live'
    JAZZCASH_HTTP_POST_URL: str = "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform"
    JAZZCASH_REST_API_URL: str = "https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction"
    JAZZCASH_RETURN_URL: str = "http://localhost:8090/api/v1/bookings/jazzcash/ipn-callback"

    # SMS Gateway Settings
    SMS_PROVIDER: str = "mock"  # 'mock', 'twilio', 'jazz_sms', 'telenor'
    SMS_API_KEY: str = "swat_sms_key_mock_99182"
    SMS_API_SECRET: str = "swat_sms_secret_mock"
    SMS_SENDER_ID: str = "SWAT-TOURISM"
    SMS_GATEWAY_URL: str = "https://api.sms-gateway.pk/v2/send"

    # Weather Feed Settings
    WEATHER_PROVIDER: str = "mock"  # 'mock', 'pmd', 'openweathermap'
    OPENWEATHER_API_KEY: str = "mock_weather_key"
    WEATHER_CACHE_TTL_SECONDS: int = 3600  # 1 hour cache

    # Rescue 1122 CAD Dispatch Bridge Settings
    RESCUE_1122_CAD_WEBHOOK_URL: str = "https://cad-dispatch.rescue1122.gov.pk/api/v1/incidents"
    RESCUE_1122_API_KEY: str = "r1122_swat_cad_token_demo"
    RESCUE_1122_ESCALATION_EMAIL: str = "dispatch.swat@rescue1122.gov.pk"
    RESCUE_1122_ENABLED: bool = True

    # Storage Pipeline Settings
    STORAGE_BACKEND: str = "local"  # 'local' or 's3'
    UPLOAD_DIR: str = "./uploads"
    S3_BUCKET_NAME: str = "swat-tourism-assets"
    S3_ENDPOINT_URL: Optional[str] = None
    S3_ACCESS_KEY: Optional[str] = None
    S3_SECRET_KEY: Optional[str] = None
    S3_REGION: str = "ap-south-1"
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5180",
        "http://127.0.0.1:5180",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
