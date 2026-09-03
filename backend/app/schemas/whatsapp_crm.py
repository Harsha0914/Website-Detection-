from typing import List, Optional, Dict, Any
from datetime import datetime
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field
from app.models.whatsapp_crm import (
    LeadStatus,
    MessageDirection,
    MessageStatus,
    ConversationState,
    CampaignStatus,
    FollowUpStatus,
    CrmUserRole,
)


# ─── Store CRM Schemas ────────────────────────────────────────────────────────
class StoreCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    owner_name: Optional[str] = None
    whatsapp_number: str = Field(..., min_length=6, max_length=50)
    location: Optional[str] = None
    category: Optional[str] = "General Store"
    website_url: Optional[str] = None
    website_status: Optional[str] = "NO_WEBSITE"
    lead_status: Optional[LeadStatus] = LeadStatus.NEW
    notes: Optional[str] = None
    assigned_user_id: Optional[int] = None
    opt_in_status: Optional[bool] = True
    follow_up_date: Optional[datetime] = None
    follow_up_note: Optional[str] = None


class StoreUpdate(BaseModel):
    name: Optional[str] = None
    owner_name: Optional[str] = None
    whatsapp_number: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    website_url: Optional[str] = None
    website_status: Optional[str] = None
    website_score: Optional[int] = None
    lead_status: Optional[LeadStatus] = None
    notes: Optional[str] = None
    assigned_user_id: Optional[int] = None
    opt_in_status: Optional[bool] = None
    follow_up_date: Optional[datetime] = None
    follow_up_note: Optional[str] = None


class LeadStatusHistoryOut(BaseModel):
    id: int
    store_id: int
    old_status: Optional[LeadStatus] = None
    new_status: LeadStatus
    changed_by_user_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class StoreOut(BaseModel):
    id: int
    external_place_id: Optional[str] = None
    name: str
    owner_name: Optional[str] = None
    whatsapp_number: str
    location: Optional[str] = None
    category: Optional[str] = None
    website_url: Optional[str] = None
    website_status: str
    website_score: Optional[int] = None
    lead_status: LeadStatus
    notes: Optional[str] = None
    assigned_user_id: Optional[int] = None
    opt_in_status: bool
    first_contacted_date: Optional[datetime] = None
    last_contacted_date: Optional[datetime] = None
    last_reply_date: Optional[datetime] = None
    follow_up_date: Optional[datetime] = None
    follow_up_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── Message & Conversation Schemas ───────────────────────────────────────────
class SendMessagePayload(BaseModel):
    store_id: Optional[int] = None
    whatsapp_number: Optional[str] = None
    message_text: Optional[str] = None
    template_name: Optional[str] = None
    template_variables: Optional[Dict[str, Any]] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None  # image, document


class WhatsAppMessageOut(BaseModel):
    id: int
    whatsapp_message_id: Optional[str] = None
    store_id: int
    conversation_id: int
    direction: MessageDirection
    message_type: str
    message_content: str
    template_name: Optional[str] = None
    status: MessageStatus
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    received_at: Optional[datetime] = None
    campaign_id: Optional[int] = None
    sender_user_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WhatsAppConversationOut(BaseModel):
    id: int
    store_id: int
    whatsapp_number: str
    assigned_user_id: Optional[int] = None
    first_message_at: Optional[datetime] = None
    last_message_at: datetime
    last_inbound_message_at: Optional[datetime] = None
    last_outbound_message_at: Optional[datetime] = None
    total_messages: int
    inbound_messages: int
    outbound_messages: int
    unread_messages: int
    status: ConversationState
    lead_status: LeadStatus
    created_at: datetime
    updated_at: datetime
    store: Optional[StoreOut] = None

    class Config:
        from_attributes = True


class WhatsAppConversationDetail(WhatsAppConversationOut):
    messages: List[WhatsAppMessageOut] = []
    status_history: List[LeadStatusHistoryOut] = []


WhatsAppCrmMessageOut = WhatsAppMessageOut
WhatsAppCrmConversationOut = WhatsAppConversationOut
WhatsAppCrmConversationDetail = WhatsAppConversationDetail


# ─── Follow-Up Schemas ────────────────────────────────────────────────────────
class FollowUpCreate(BaseModel):
    store_id: int
    follow_up_date: datetime
    follow_up_time: Optional[str] = "11:00 AM"
    note: str
    assigned_user_id: Optional[int] = None


class FollowUpUpdate(BaseModel):
    follow_up_date: Optional[datetime] = None
    follow_up_time: Optional[str] = None
    note: Optional[str] = None
    status: Optional[FollowUpStatus] = None


class FollowUpOut(BaseModel):
    id: int
    store_id: int
    assigned_user_id: Optional[int] = None
    follow_up_date: datetime
    follow_up_time: Optional[str] = None
    note: str
    status: FollowUpStatus
    completed_at: Optional[datetime] = None
    created_at: datetime
    store: Optional[StoreOut] = None

    class Config:
        from_attributes = True


# ─── Campaign Schemas ─────────────────────────────────────────────────────────
class CampaignCreate(BaseModel):
    name: str
    template_name: str
    language_code: Optional[str] = "en"
    message_variables: Optional[Dict[str, Any]] = {}
    target_category: Optional[str] = None
    target_lead_status: Optional[str] = None
    target_location: Optional[str] = None
    store_ids: Optional[List[int]] = None
    scheduled_at: Optional[datetime] = None


class CampaignRecipientOut(BaseModel):
    id: int
    campaign_id: int
    store_id: int
    whatsapp_number: str
    status: str
    whatsapp_message_id: Optional[str] = None
    sent_at: Optional[datetime] = None
    error_message: Optional[str] = None
    store: Optional[StoreOut] = None

    class Config:
        from_attributes = True


class CampaignOut(BaseModel):
    id: int
    name: str
    template_name: str
    language_code: str
    message_variables: Dict[str, Any]
    target_category: Optional[str] = None
    target_lead_status: Optional[str] = None
    target_location: Optional[str] = None
    created_by_user_id: Optional[int] = None
    status: CampaignStatus
    scheduled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    total_recipients: int
    messages_attempted: int
    messages_sent: int
    messages_delivered: int
    messages_read: int
    messages_failed: int
    replies_received: int
    unique_replied: int
    interested_leads: int
    converted_leads: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── Template Schemas ─────────────────────────────────────────────────────────
class TemplateCreate(BaseModel):
    name: str
    category: Optional[str] = "MARKETING"
    language: Optional[str] = "en"
    header_text: Optional[str] = None
    body_text: str
    footer_text: Optional[str] = None
    variables_json: Optional[List[str]] = []
    buttons_json: Optional[List[Dict[str, Any]]] = []


class TemplateOut(BaseModel):
    id: int
    name: str
    category: str
    language: str
    header_text: Optional[str] = None
    body_text: str
    footer_text: Optional[str] = None
    variables_json: List[Any]
    buttons_json: List[Any]
    meta_status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Analytics Schemas ────────────────────────────────────────────────────────
class TodayAnalyticsOut(BaseModel):
    messages_sent: int
    messages_received: int
    unique_stores_contacted: int
    unique_stores_replied: int
    direct_chats: int
    delivered: int
    read: int
    failed: int
    interested: int
    follow_ups: int
    proposals_sent: int
    conversions: int
    reply_rate: float
    delivery_rate: float
    read_rate: float
    conversion_rate: float


class AnalyticsOverviewOut(TodayAnalyticsOut):
    date_range: str
    daily_trends: List[Dict[str, Any]] = []
    lead_distribution: Dict[str, int] = {}
    category_distribution: Dict[str, int] = {}


# ─── Settings & Test Simulator Schemas ────────────────────────────────────────
class WhatsAppSettingsUpdate(BaseModel):
    meta_app_id: Optional[str] = None
    meta_app_secret: Optional[str] = None
    business_account_id: Optional[str] = None
    phone_number_id: Optional[str] = None
    access_token: Optional[str] = None
    webhook_verify_token: Optional[str] = None
    api_version: Optional[str] = "v21.0"
    is_test_mode: Optional[bool] = True


class WhatsAppSettingsOut(BaseModel):
    meta_app_id: Optional[str] = None
    business_account_id: Optional[str] = None
    phone_number_id: Optional[str] = None
    webhook_verify_token: str
    api_version: str
    is_test_mode: bool
    has_access_token: bool
    webhook_url: str


class SimulateIncomingWebhook(BaseModel):
    whatsapp_number: str
    message_text: str
    store_id: Optional[int] = None
    store_name: Optional[str] = None
    owner_name: Optional[str] = None


class SimulateStatusWebhook(BaseModel):
    whatsapp_message_id: str
    status: str  # sent, delivered, read, failed
