from typing import List, Optional
from datetime import datetime
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field
from app.models.business_chat import BusinessChatSender, ConversationStatus


class MessageCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Message text")
    sender_name: Optional[str] = None


class OwnerReplyCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Reply message from shop owner")
    sender_name: Optional[str] = "Shop Owner"


class ConversationCreate(BaseModel):
    business_id: int
    subject: Optional[str] = "Direct Inquiry"
    initial_message: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None


class BusinessChatMessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_type: BusinessChatSender
    sender_id: Optional[int] = None
    sender_name: str
    message_text: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class BusinessBriefOut(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    photo_url: Optional[str] = None
    website_status: Optional[str] = None

    class Config:
        from_attributes = True


class BusinessChatConversationOut(BaseModel):
    id: int
    business_id: int
    customer_id: Optional[int] = None
    customer_name: str
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    subject: Optional[str] = None
    status: ConversationStatus
    last_message_text: Optional[str] = None
    last_message_at: datetime
    unread_by_owner_count: int
    unread_by_customer_count: int
    created_at: datetime
    updated_at: datetime
    business: Optional[BusinessBriefOut] = None

    class Config:
        from_attributes = True


class BusinessChatConversationDetail(BusinessChatConversationOut):
    messages: List[BusinessChatMessageOut] = []


class OwnerSimulateReplyRequest(BaseModel):
    reply_template: Optional[str] = None
    custom_message: Optional[str] = None
