from datetime import datetime
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: str | None = None


class UserOut(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    is_active: bool | None = None


class AdminUserUpdate(UserUpdate):
    role: UserRole | None = None
