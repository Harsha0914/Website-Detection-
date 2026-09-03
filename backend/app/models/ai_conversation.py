import enum
from datetime import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Text,
    Boolean, Enum as SAEnum, Float, JSON
)
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
from app.database import Base


class AIIntent(str, enum.Enum):
    GREETING = "GREETING"
    INTERESTED = "INTERESTED"
    NOT_INTERESTED = "NOT_INTERESTED"
    ASKING_PRICE = "ASKING_PRICE"
    ASKING_SERVICES = "ASKING_SERVICES"
    ASKING_FOR_EXAMPLES = "ASKING_FOR_EXAMPLES"
    ASKING_FOR_PORTFOLIO = "ASKING_FOR_PORTFOLIO"
    ASKING_FOR_MEETING = "ASKING_FOR_MEETING"
    ASKING_FOR_CALL = "ASKING_FOR_CALL"
    NEEDS_MORE_INFORMATION = "NEEDS_MORE_INFORMATION"
    READY_TO_BUY = "READY_TO_BUY"
    PAYMENT_QUERY = "PAYMENT_QUERY"
    WEBSITE_QUERY = "WEBSITE_QUERY"
    EXISTING_WEBSITE = "EXISTING_WEBSITE"
    NO_WEBSITE = "NO_WEBSITE"
    HUMAN_REQUEST = "HUMAN_REQUEST"
    STOP_CONTACT = "STOP_CONTACT"
    UNKNOWN = "UNKNOWN"


class LeadScoreCategory(str, enum.Enum):
    COLD = "COLD"
    WARM = "WARM"
    HOT = "HOT"
    QUALIFIED = "QUALIFIED"


class ConversationPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class ConversationState(str, enum.Enum):
    OPEN = "OPEN"
    AI_ACTIVE = "AI_ACTIVE"
    HUMAN_HANDOFF = "HUMAN_HANDOFF"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


# ─── 1. AI Knowledge Base ─────────────────────────────────────────────────────
class AIKnowledgeBase(Base):
    __tablename__ = "ai_knowledge_base"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(255), default="Lexon IT & Web Solutions", nullable=False)
    company_description = Column(Text, nullable=False, default=(
        "Lexon IT specializes in building modern, ultra-fast, mobile-friendly websites "
        "and online presence systems for local stores, supermarkets, restaurants, clinics, "
        "and service businesses at affordable rates with 100% satisfaction guarantee."
    ))
    website_services = Column(JSON, default=lambda: [
        "Custom Business Website Design & Development",
        "Mobile-First Responsive Layouts & High Speed Optimization",
        "Google Maps & Local Search SEO Optimization",
        "Direct WhatsApp Ordering & Customer Inquiries",
        "Digital Product / Grocery Catalog & Price List",
        "Domain Registration, SSL Security & Fast Cloud Hosting",
        "24/7 Technical Support & Easy Content Updates"
    ], nullable=False)
    
    website_packages = Column(JSON, default=lambda: [
        {
            "name": "Starter Essential Web Presence",
            "price": "₹4,999",
            "delivery_time": "3 Days",
            "pages": "Single Page Showcase (Home, About, Services, Driving Map, WhatsApp Chat)",
            "features": "Mobile Responsive, Google Maps Pin, WhatsApp Direct Contact, Fast Hosting"
        },
        {
            "name": "Professional Local Business",
            "price": "₹9,999",
            "delivery_time": "5 Days",
            "pages": "5 Pages (Home, Catalog, Special Offers, Gallery, Contact)",
            "features": "WhatsApp Ordering Catalog, Local SEO, High-Speed Performance, SSL Security"
        },
        {
            "name": "Premium Growth E-Commerce",
            "price": "₹14,999",
            "delivery_time": "7 Days",
            "pages": "Complete Digital Store with Unlimited Products & Customer Inquiries",
            "features": "Custom Branding, Google Analytics, SEO Boost, Priority Support"
        }
    ], nullable=False)

    portfolio_links = Column(JSON, default=lambda: [
        {"title": "Supermarket & Grocery Demo", "url": "https://demo.lexonit.com/supermarket"},
        {"title": "Restaurant & Cafe Demo", "url": "https://demo.lexonit.com/restaurant"},
        {"title": "Gym & Fitness Demo", "url": "https://demo.lexonit.com/gym"},
        {"title": "Pharmacy & Healthcare Demo", "url": "https://demo.lexonit.com/pharmacy"}
    ], nullable=False)

    faqs = Column(JSON, default=lambda: [
        {
            "question": "How long will it take to build our website?",
            "answer": "Our standard starter websites are completed and launched live within 3 to 5 business days."
        },
        {
            "question": "What is the cost of website development?",
            "answer": "Our transparent package pricing starts at ₹4,999 for Starter Presence, ₹9,999 for Professional Local Business, and ₹14,999 for Premium Growth."
        },
        {
            "question": "Can customers place orders on WhatsApp from the website?",
            "answer": "Yes, every website comes with a 1-click WhatsApp order and inquiry integration."
        },
        {
            "question": "Do you provide hosting and domain?",
            "answer": "Yes, free domain assistance, SSL certificate, and high-speed cloud hosting setup are included."
        }
    ], nullable=False)

    contact_phone = Column(String(50), default="+91-9849012345", nullable=False)
    contact_email = Column(String(100), default="contact@lexonit.com", nullable=False)
    business_hours = Column(String(100), default="Monday to Saturday: 9:00 AM - 7:00 PM", nullable=False)
    terms_and_notes = Column(Text, default="No hidden charges. 50% advance on project start, balance after client review and live launch.", nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


# ─── 2. Global AI Settings ────────────────────────────────────────────────────
class AISettings(Base):
    __tablename__ = "ai_settings"

    id = Column(Integer, primary_key=True, index=True)
    ai_enabled = Column(Boolean, default=True, nullable=False)
    ai_auto_reply_enabled = Column(Boolean, default=True, nullable=False)
    confidence_threshold = Column(Float, default=0.75, nullable=False)
    max_ai_messages_per_conv = Column(Integer, default=10, nullable=False)
    human_handoff_enabled = Column(Boolean, default=True, nullable=False)
    auto_lead_classification = Column(Boolean, default=True, nullable=False)
    auto_intent_detection = Column(Boolean, default=True, nullable=False)
    auto_follow_up_enabled = Column(Boolean, default=False, nullable=False)
    ai_tone = Column(String(50), default="PROFESSIONAL", nullable=False)  # PROFESSIONAL, CONVERSATIONAL, DIRECT
    ai_language = Column(String(20), default="en", nullable=False)
    working_hours_start = Column(String(10), default="09:00", nullable=False)
    working_hours_end = Column(String(10), default="19:00", nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


# ─── 3. AI Message Log ────────────────────────────────────────────────────────
class AIMessageLog(Base):
    __tablename__ = "ai_message_logs"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("whatsapp_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    incoming_message_id = Column(Integer, ForeignKey("whatsapp_messages.id", ondelete="SET NULL"), nullable=True)
    
    incoming_text = Column(Text, nullable=False)
    ai_response_text = Column(Text, nullable=False)
    model_used = Column(String(100), default="gemini-1.5-flash", nullable=False)
    
    intent = Column(String(50), default="UNKNOWN", nullable=False, index=True)
    confidence = Column(Float, default=0.85, nullable=False)
    sentiment = Column(String(20), default="NEUTRAL", nullable=False)
    
    tokens_used = Column(Integer, default=0, nullable=False)
    latency_ms = Column(Integer, default=0, nullable=False)
    
    was_sent = Column(Boolean, default=True, nullable=False)
    is_human_override = Column(Boolean, default=False, nullable=False)
    triggered_handoff = Column(Boolean, default=False, nullable=False)
    handoff_reason = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


# ─── 4. Follow-Up Schedule ───────────────────────────────────────────────────
class FollowUpSchedule(Base):
    __tablename__ = "follow_up_schedules"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("whatsapp_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=True, index=True)
    assigned_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    scheduled_for = Column(DateTime, nullable=False, index=True)
    note = Column(Text, nullable=False)
    status = Column(String(50), default="PENDING", nullable=False, index=True)  # PENDING, COMPLETED, CANCELLED
    
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
