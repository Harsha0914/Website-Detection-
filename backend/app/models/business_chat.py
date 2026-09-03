import enum
from datetime import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Text,
    Enum as SAEnum, Boolean, Index
)
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
from app.database import Base


class BusinessChatSender(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    SHOP_OWNER = "SHOP_OWNER"
    STAFF = "STAFF"


class ConversationStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    RESOLVED = "RESOLVED"
    ARCHIVED = "ARCHIVED"


class BusinessChatConversation(Base):
    __tablename__ = "business_chat_conversations"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Customer snapshot info (useful even if guest or for quick reference)
    customer_name = Column(String(255), nullable=False, default="Customer")
    customer_phone = Column(String(50), nullable=True)
    customer_email = Column(String(255), nullable=True)
    
    subject = Column(String(255), nullable=True, default="Direct Business Inquiry")
    status = Column(
        SAEnum(ConversationStatus),
        default=ConversationStatus.ACTIVE,
        nullable=False,
        index=True
    )
    
    last_message_text = Column(Text, nullable=True)
    last_message_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    unread_by_owner_count = Column(Integer, default=0, nullable=False)
    unread_by_customer_count = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    business = relationship("Business", backref="business_chat_conversations")
    customer = relationship("User", backref="business_chat_conversations")
    messages = relationship(
        "BusinessChatMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="BusinessChatMessage.created_at"
    )

    def __repr__(self):
        return f"<BusinessChatConversation id={self.id} biz={self.business_id} customer={self.customer_name}>"


class BusinessChatMessage(Base):
    __tablename__ = "business_chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(
        Integer,
        ForeignKey("business_chat_conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    sender_type = Column(SAEnum(BusinessChatSender), nullable=False, default=BusinessChatSender.CUSTOMER)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    sender_name = Column(String(255), nullable=False, default="User")
    
    message_text = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    conversation = relationship("BusinessChatConversation", back_populates="messages")
    sender = relationship("User")

    def __repr__(self):
        return f"<BusinessChatMessage id={self.id} sender={self.sender_type} text={self.message_text[:20]}>"
