from datetime import datetime
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import Any
from app.models.business import WebsiteStatus, WebsiteQuality


class BusinessOut(BaseModel):
    id: int
    external_place_id: str
    name: str
    category: str | None
    address: str | None
    short_address: str | None = None
    google_maps_uri: str | None = None
    latitude: float
    longitude: float
    phone: str | None
    website_url: str | None
    photo_url: str | None = None
    rating: float | None
    review_count: int | None
    business_status: str | None
    opening_hours: Any | None
    website_status: WebsiteStatus
    website_score: int | None
    website_quality: WebsiteQuality | None
    last_website_check: datetime | None
    distance_km: float | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BusinessSearchParams(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = 5.0
    category: str | None = None
    keyword: str | None = None


class BusinessListResponse(BaseModel):
    total: int
    businesses: list[BusinessOut]
    with_websites: int
    without_websites: int
    good_websites: int
    needs_improvement: int
    error_message: str | None = None
    error_type: str | None = None
    provider_used: str | None = None
    debug: dict | None = None  # Populated only in DEBUG mode
