import enum
from datetime import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text,
    Enum as SAEnum, JSON, Index
)
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
from app.database import Base


class WebsiteStatus(str, enum.Enum):
    WEBSITE_AVAILABLE = "WEBSITE_AVAILABLE"
    NO_WEBSITE = "NO_WEBSITE"
    WEBSITE_UNREACHABLE = "WEBSITE_UNREACHABLE"
    WEBSITE_UNKNOWN = "WEBSITE_UNKNOWN"


class WebsiteQuality(str, enum.Enum):
    GOOD = "GOOD"             # 80-100
    AVERAGE = "AVERAGE"       # 60-79
    NEEDS_IMPROVEMENT = "NEEDS_IMPROVEMENT"  # 40-59
    POOR = "POOR"             # 0-39
    UNANALYZED = "UNANALYZED"


class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    external_place_id = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=True, index=True)
    address = Column(Text, nullable=True)
    short_address = Column(String(255), nullable=True)
    google_maps_uri = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    phone = Column(String(50), nullable=True)
    website_url = Column(String(500), nullable=True)
    photo_url = Column(String(1000), nullable=True)
    rating = Column(Float, nullable=True)
    review_count = Column(Integer, nullable=True)
    business_status = Column(String(50), nullable=True)
    opening_hours = Column(JSON, nullable=True)

    # Website detection
    website_status = Column(
        SAEnum(WebsiteStatus),
        default=WebsiteStatus.WEBSITE_UNKNOWN,
        nullable=False,
        index=True,
    )
    website_score = Column(Integer, nullable=True)
    website_quality = Column(
        SAEnum(WebsiteQuality),
        default=WebsiteQuality.UNANALYZED,
        nullable=True,
        index=True,
    )
    last_website_check = Column(DateTime, nullable=True)

    # Metadata
    source = Column(String(50), default="google_places", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    website_analysis = relationship(
        "WebsiteAnalysis", back_populates="business",
        uselist=False, cascade="all, delete-orphan"
    )
    conversations = relationship("Conversation", back_populates="business", cascade="all, delete-orphan")
    website_requests = relationship("WebsiteRequest", back_populates="business", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index("ix_businesses_lat_lng", "latitude", "longitude"),
    )

    def __repr__(self):
        return f"<Business id={self.id} name={self.name} status={self.website_status}>"
