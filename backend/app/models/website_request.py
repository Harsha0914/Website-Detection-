import enum
from datetime import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SAEnum
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
from app.database import Base


class RequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    REVIEWED = "REVIEWED"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"


class WebsiteRequest(Base):
    __tablename__ = "website_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(SAEnum(RequestStatus), default=RequestStatus.PENDING, nullable=False, index=True)
    message = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="website_requests")
    business = relationship("Business", back_populates="website_requests")

    def __repr__(self):
        return f"<WebsiteRequest id={self.id} business_id={self.business_id} status={self.status}>"
