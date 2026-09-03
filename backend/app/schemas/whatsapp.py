from datetime import datetime
from typing import Optional, List, Dict, Any
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from app.models.whatsapp import WhatsAppDirection, WhatsAppSenderType


class WhatsAppMessageOut(BaseModel):
    id: int
    conversation_id: int
    direction: WhatsAppDirection
    sender_type: WhatsAppSenderType
    sender_name: str
    message_body: str
    status: str
    is_read: Optional[bool] = True
    created_at: datetime

    class Config:
        from_attributes = True


class WhatsAppConversationOut(BaseModel):
    id: int
    business_id: Optional[int] = None
    phone_number: str
    shop_name: str
    auto_ai_enabled: bool
    lead_status: Optional[str] = "CONTACTED"
    unread_count: Optional[int] = 0
    human_takeover: Optional[bool] = False
    business_details_extracted: Optional[str] = "{}"
    last_message_at: datetime
    created_at: datetime
    message_count: int = 0
    last_message: Optional[str] = None

    class Config:
        from_attributes = True


class WhatsAppConversationDetail(WhatsAppConversationOut):
    messages: List[WhatsAppMessageOut] = []


class ManualMessageCreate(BaseModel):
    message: str
    operator_name: Optional[str] = "Lexonity Team"


class ToggleAISchema(BaseModel):
    enabled: bool


class ToggleTakeoverSchema(BaseModel):
    takeover: bool


class UpdateLeadStatusSchema(BaseModel):
    lead_status: str


class UpdateRequirementsSchema(BaseModel):
    details: Dict[str, Any]


class SimulateIncomingMessage(BaseModel):
    phone_number: str
    shop_name: Optional[str] = "Local Shop"
    business_id: Optional[int] = None
    message: str
    sender_name: Optional[str] = "Shop Owner"
