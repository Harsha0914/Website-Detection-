from pydantic_settings import BaseSettings
from pydantic import validator
from typing import List
from pathlib import Path

import os

def _resolve_db_path() -> str:
    if os.environ.get("VERCEL"):
        return "/tmp/shop.db"
    current_file = Path(__file__).resolve()
    backend_dir = current_file.parent.parent
    workspace_root = backend_dir.parent
    candidates = [
        backend_dir / "shop.db",
        workspace_root / "shop.db",
        Path("/app/shop.db"),
        Path("/tmp/shop.db"),
    ]
    existing = [c for c in candidates if c.is_file()]
    if existing:
        return max(existing, key=lambda p: p.stat().st_size).as_posix()
    return (backend_dir / "shop.db").as_posix()

_DB_PATH = _resolve_db_path()

class Settings(BaseSettings):
    # App
    APP_NAME: str = "ShopPresence"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # Database
    DATABASE_URL: str = os.environ.get("DATABASE_URL") or f"sqlite:///{_DB_PATH}"

    # MongoDB
    MONGODB_URI: str = os.environ.get("MONGODB_URI") or "mongodb+srv://harshavardhan_db_user:lhLFCsQF3TZgLbcv@cluster0.d65tyux.mongodb.net/shop_presence?appName=Cluster0&compressors=zlib"
    MONGODB_DB_NAME: str = os.environ.get("MONGODB_DB_NAME") or "shop_presence"

    # Admin Registration Secret Code
    ADMIN_SECRET_CODE: str = "ADMIN2026"

    # JWT
    JWT_SECRET_KEY: str = "shop-presence-development-jwt-secret-key-12345"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    # Google Places
    GOOGLE_PLACES_API_KEY: str = "AIzaSyCpffOtfEnMdrrv16_xnVxacUa1MgUMpvk"
    USE_MOCK_PLACES: bool = False

    # Gemini AI
    GEMINI_API_KEY: str = ""
    USE_RULE_BASED_CHAT: bool = False

    # OpenAI / Open Chat AI API
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"

    # WhatsApp Integration Provider: "mr_lad" (LexonIT WhatsApp API via Mr LAD) or "meta_cloud"
    WHATSAPP_PROVIDER: str = "mr_lad"
    WHATSAPP_PHONE_NUMBER: str = "+917780181920"

    # Mr LAD API (LexonIT WhatsApp Integration)
    LAD_API_BASE_URL: str = "https://lad-waba-comms-stage-asia-axxjxdzmbq-el.a.run.app"
    LAD_AUTH_BASE_URL: str = "https://lad-backend-stage-axxjxdzmbq-uc.a.run.app"
    LAD_AUTH_EMAIL: str = ""
    LAD_AUTH_PASSWORD: str = ""
    LAD_API_TOKEN: str = ""
    WHATSAPP_DEFAULT_TEMPLATE_NAME: str = "lexon_official_pitch"

    # Meta WhatsApp Cloud API (direct fallback)
    WHATSAPP_ACCESS_TOKEN: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = "1407135925808911"
    WHATSAPP_BUSINESS_ACCOUNT_ID: str = "2912980445715643"
    WHATSAPP_API_VERSION: str = "v22.0"
    # No default: the webhook handshake is refused until a token is configured.
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: str = ""
    # Meta App Secret, used to verify X-Hub-Signature-256 on incoming webhooks.
    WHATSAPP_APP_SECRET: str = ""
    # Escape hatch for local development only; never enable in production.
    WHATSAPP_ALLOW_UNSIGNED_WEBHOOK: bool = False
    WHATSAPP_IS_TEST_MODE: bool = False

    # WhatsApp automation safety limits
    WHATSAPP_DAILY_SEND_LIMIT: int = 200           # max outbound messages per rolling 24h
    WHATSAPP_MAX_BROADCAST_BATCH: int = 50         # max recipients per broadcast request
    WHATSAPP_BROADCAST_DELAY_SECONDS: float = 1.5  # pause between broadcast sends
    WHATSAPP_REPEAT_COOLDOWN_DAYS: int = 7         # no repeat pitch to the same number inside this window
    WHATSAPP_POLLER_ENABLED: bool = True
    WHATSAPP_POLL_INTERVAL_SECONDS: int = 30
    WHATSAPP_REPLY_MAX_AGE_MINUTES: int = 15       # never auto-reply to inbound messages older than this
    # Optional: mirror outbound pitches to this admin number (e.g. +917780181920). Empty = disabled.
    WHATSAPP_ADMIN_COPY_NUMBER: str = ""

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # Website Analysis
    WEBSITE_CHECK_TIMEOUT_SECONDS: int = 10
    MAX_REDIRECT_FOLLOW: int = 5

    class Config:
        import os
        _cur_dir = os.path.dirname(os.path.abspath(__file__))
        _backend_dir = os.path.dirname(_cur_dir)
        _root_dir = os.path.dirname(_backend_dir)
        env_file = (
            os.path.join(_root_dir, ".env"),
            os.path.join(_backend_dir, ".env"),
            ".env",
        )
        case_sensitive = True
        extra = "ignore"


settings = Settings()

