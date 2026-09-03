from datetime import datetime
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from app.models.business import WebsiteStatus
from app.models.website_request import RequestStatus


class WebsiteAnalysisOut(BaseModel):
    id: int
    business_id: int
    url: str | None
    is_reachable: bool
    https_enabled: bool
    final_url: str | None
    http_status_code: int | None
    mobile_viewport: bool
    has_title: bool
    has_meta_description: bool
    has_open_graph: bool
    has_contact_info: bool
    has_phone: bool
    has_email: bool
    has_social_links: bool
    has_navigation: bool
    score: int
    analysis_details: dict | None
    checked_at: datetime

    model_config = {"from_attributes": True}


class WebsiteRequestCreate(BaseModel):
    business_id: int
    message: str | None = None


class WebsiteRequestOut(BaseModel):
    id: int
    user_id: int
    business_id: int
    status: RequestStatus
    message: str | None
    admin_notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WebsiteRequestUpdate(BaseModel):
    status: RequestStatus | None = None
    admin_notes: str | None = None
