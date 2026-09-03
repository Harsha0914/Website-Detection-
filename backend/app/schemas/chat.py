from datetime import datetime
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from app.models.conversation import ConversationType, SenderType


class MessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_type: SenderType
    message: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationCreate(BaseModel):
    business_id: int
    conversation_type: ConversationType


class ConversationOut(BaseModel):
    id: int
    user_id: int
    business_id: int
    conversation_type: ConversationType
    created_at: datetime
    updated_at: datetime
    messages: list[MessageOut] = []

    model_config = {"from_attributes": True}


class SendMessageRequest(BaseModel):
    message: str
