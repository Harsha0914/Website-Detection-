from datetime import datetime
# pyrefly: ignore [missing-import]
from pydantic import BaseModel


class SearchCreate(BaseModel):
    latitude: float
    longitude: float
    radius_km: float
    category: str | None = None
    keyword: str | None = None


class SearchOut(BaseModel):
    id: int
    user_id: int
    latitude: float
    longitude: float
    radius_km: float
    category: str | None
    keyword: str | None
    result_count: int
    created_at: datetime

    model_config = {"from_attributes": True}
