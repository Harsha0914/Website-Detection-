from datetime import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, Boolean, Float, DateTime, ForeignKey, Text, JSON
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
from app.database import Base


class WebsiteAnalysis(Base):
    __tablename__ = "website_analysis"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(
        Integer, ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True
    )

    # Detection results
    url = Column(Text, nullable=True)
    is_reachable = Column(Boolean, default=False)
    https_enabled = Column(Boolean, default=False)
    final_url = Column(Text, nullable=True)
    http_status_code = Column(Integer, nullable=True)

    # Page content checks
    mobile_viewport = Column(Boolean, default=False)
    has_title = Column(Boolean, default=False)
    has_meta_description = Column(Boolean, default=False)
    has_open_graph = Column(Boolean, default=False)

    # Contact info checks
    has_contact_info = Column(Boolean, default=False)
    has_phone = Column(Boolean, default=False)
    has_email = Column(Boolean, default=False)
    has_social_links = Column(Boolean, default=False)
    has_navigation = Column(Boolean, default=False)

    # Scoring
    score = Column(Integer, default=0)
    analysis_details = Column(JSON, nullable=True)

    checked_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    business = relationship("Business", back_populates="website_analysis")

    def __repr__(self):
        return f"<WebsiteAnalysis id={self.id} business_id={self.business_id} score={self.score}>"
