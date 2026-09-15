from pydantic_settings import BaseSettings
from pydantic import validator
from typing import List
from pathlib import Path

import os

_BASE_DIR = Path(__file__).resolve().parent.parent.parent
_DB_PATH = "/tmp/shop.db" if os.environ.get("VERCEL") else (_BASE_DIR / "shop.db").as_posix()

class Settings(BaseSettings):
    # App
    APP_NAME: str = "ShopPresence"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = os.environ.get("DATABASE_URL", f"sqlite:///{_DB_PATH}")

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

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # Website Analysis
    WEBSITE_CHECK_TIMEOUT_SECONDS: int = 10
    MAX_REDIRECT_FOLLOW: int = 5

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
