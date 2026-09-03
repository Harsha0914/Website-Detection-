import enum
from datetime import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SAEnum
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
from app.database import Base


class ConversationType(str, enum.Enum):
    WEBSITE_IMPROVEMENT = "WEBSITE_IMPROVEMENT"
    WEBSITE_CREATION = "WEBSITE_CREATION"
    GENERAL_BUSINESS = "GENERAL_BUSINESS"


class SenderType(str, enum.Enum):
    USER = "USER"
    ASSISTANT = "ASSISTANT"


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    conversation_type = Column(SAEnum(ConversationType), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="conversations")
    business = relationship("Business", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")

    def __repr__(self):
        return f"<Conversation id={self.id} type={self.conversation_type}>"


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(
        Integer, ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    sender_type = Column(SAEnum(SenderType), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")

    def __repr__(self):
        return f"<Message id={self.id} sender={self.sender_type}>"
