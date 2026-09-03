from datetime import datetime, timedelta, date
from typing import Dict, Any, List, Optional
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, distinct, or_

from app.models.whatsapp_crm import (
    Store,
    LeadStatus,
    WhatsAppCrmMessage,
    MessageDirection,
    MessageStatus,
    FollowUp,
    LeadStatusHistory,
)


def get_date_range_bounds(range_key: str = "today", custom_start: Optional[datetime] = None, custom_end: Optional[datetime] = None):
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    if range_key == "yesterday":
        yest = today_start - timedelta(days=1)
        return yest, yest.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif range_key == "7days":
        return today_start - timedelta(days=7), today_end
    elif range_key == "30days":
        return today_start - timedelta(days=30), today_end
    elif range_key == "this_month":
        month_start = today_start.replace(day=1)
        return month_start, today_end
    elif range_key == "custom" and custom_start and custom_end:
        return custom_start, custom_end
    else:  # default "today"
        return today_start, today_end


def compute_whatsapp_crm_analytics(
    db: Session,
    start_dt: datetime,
    end_dt: datetime,
    campaign_id: Optional[int] = None,
    user_id: Optional[int] = None,
    category: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Computes exact CRM & WhatsApp outreach analytics using unique store counts.
    """
    # Base message queries
    msg_query = db.query(WhatsAppCrmMessage).filter(WhatsAppCrmMessage.created_at.between(start_dt, end_dt))
    if campaign_id:
        msg_query = msg_query.filter(WhatsAppCrmMessage.campaign_id == campaign_id)
    if user_id:
        msg_query = msg_query.filter(WhatsAppCrmMessage.sender_user_id == user_id)

    # 1. Total Messages Sent & Received
    messages_sent = msg_query.filter(WhatsAppCrmMessage.direction == MessageDirection.OUTBOUND).count()
    messages_received = msg_query.filter(WhatsAppCrmMessage.direction == MessageDirection.INBOUND).count()

    # 2. Unique Store Owners Contacted (Outbound)
    contacted_store_ids = (
        db.query(distinct(WhatsAppCrmMessage.store_id))
        .filter(
            WhatsAppCrmMessage.direction == MessageDirection.OUTBOUND,
            WhatsAppCrmMessage.created_at.between(start_dt, end_dt),
        )
        .all()
    )
    contacted_set = {r[0] for r in contacted_store_ids if r[0]}
    unique_stores_contacted = len(contacted_set)

    # 3. Unique Store Owners Who Replied (Inbound)
    replied_store_ids = (
        db.query(distinct(WhatsAppCrmMessage.store_id))
        .filter(
            WhatsAppCrmMessage.direction == MessageDirection.INBOUND,
            WhatsAppCrmMessage.created_at.between(start_dt, end_dt),
        )
        .all()
    )
    replied_set = {r[0] for r in replied_store_ids if r[0]}
    unique_stores_replied = len(replied_set)

    # 4. Direct Chats: Unique stores with BOTH outbound and inbound communication
    direct_chats_set = contacted_set.intersection(replied_set)
    direct_chats = len(direct_chats_set)

    # 5. Delivery, Read, Failed status counts
    delivered = msg_query.filter(
        WhatsAppCrmMessage.direction == MessageDirection.OUTBOUND,
        or_(
            WhatsAppCrmMessage.status.in_([MessageStatus.DELIVERED, MessageStatus.READ]),
            WhatsAppCrmMessage.delivered_at.isnot(None),
        )
    ).count()

    read = msg_query.filter(
        WhatsAppCrmMessage.direction == MessageDirection.OUTBOUND,
        or_(
            WhatsAppCrmMessage.status == MessageStatus.READ,
            WhatsAppCrmMessage.read_at.isnot(None),
        )
    ).count()

    failed = msg_query.filter(
        WhatsAppCrmMessage.direction == MessageDirection.OUTBOUND,
        WhatsAppCrmMessage.status == MessageStatus.FAILED
    ).count()

    # 6. Leads & Conversions in range
    # Check current store statuses or status transitions in range
    interested_stores = (
        db.query(distinct(LeadStatusHistory.store_id))
        .filter(
            LeadStatusHistory.new_status == LeadStatus.INTERESTED,
            LeadStatusHistory.created_at.between(start_dt, end_dt),
        )
        .count()
    )
    if interested_stores == 0:
        interested_stores = db.query(Store).filter(Store.lead_status == LeadStatus.INTERESTED).count()

    proposals_sent = (
        db.query(distinct(LeadStatusHistory.store_id))
        .filter(
            LeadStatusHistory.new_status == LeadStatus.WEBSITE_PROPOSAL_SENT,
            LeadStatusHistory.created_at.between(start_dt, end_dt),
        )
        .count()
    )
    if proposals_sent == 0:
        proposals_sent = db.query(Store).filter(Store.lead_status == LeadStatus.WEBSITE_PROPOSAL_SENT).count()

    conversions = (
        db.query(distinct(LeadStatusHistory.store_id))
        .filter(
            LeadStatusHistory.new_status == LeadStatus.CONVERTED,
            LeadStatusHistory.created_at.between(start_dt, end_dt),
        )
        .count()
    )
    if conversions == 0:
        conversions = db.query(Store).filter(Store.lead_status == LeadStatus.CONVERTED).count()

    follow_ups = (
        db.query(FollowUp)
        .filter(FollowUp.follow_up_date.between(start_dt, end_dt))
        .count()
    )

    # 7. Exact Rates Computation
    reply_rate = round((unique_stores_replied / unique_stores_contacted * 100), 1) if unique_stores_contacted > 0 else 0.0
    conversion_rate = round((conversions / unique_stores_contacted * 100), 1) if unique_stores_contacted > 0 else 0.0
    delivery_rate = round((delivered / messages_sent * 100), 1) if messages_sent > 0 else 0.0
    read_rate = round((read / delivered * 100), 1) if delivered > 0 else 0.0

    return {
        "messages_sent": messages_sent,
        "messages_received": messages_received,
        "unique_stores_contacted": unique_stores_contacted,
        "unique_stores_replied": unique_stores_replied,
        "direct_chats": direct_chats,
        "delivered": delivered,
        "read": read,
        "failed": failed,
        "interested": interested_stores,
        "follow_ups": follow_ups,
        "proposals_sent": proposals_sent,
        "conversions": conversions,
        "reply_rate": reply_rate,
        "delivery_rate": delivery_rate,
        "read_rate": read_rate,
        "conversion_rate": conversion_rate,
    }


def compute_daily_trend_series(db: Session, days: int = 7) -> List[Dict[str, Any]]:
    """
    Generates daily time-series statistics for chart visualization.
    """
    now = datetime.utcnow()
    series = []
    
    for i in range(days - 1, -1, -1):
        target_day = now - timedelta(days=i)
        day_start = target_day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = target_day.replace(hour=23, minute=59, second=59, microsecond=999999)
        day_label = target_day.strftime("%b %d")
        
        sent = (
            db.query(WhatsAppCrmMessage)
            .filter(
                WhatsAppCrmMessage.direction == MessageDirection.OUTBOUND,
                WhatsAppCrmMessage.created_at.between(day_start, day_end),
            )
            .count()
        )
        received = (
            db.query(WhatsAppCrmMessage)
            .filter(
                WhatsAppCrmMessage.direction == MessageDirection.INBOUND,
                WhatsAppCrmMessage.created_at.between(day_start, day_end),
            )
            .count()
        )
        replied_unique = (
            db.query(distinct(WhatsAppCrmMessage.store_id))
            .filter(
                WhatsAppCrmMessage.direction == MessageDirection.INBOUND,
                WhatsAppCrmMessage.created_at.between(day_start, day_end),
            )
            .count()
        )
        conversions = (
            db.query(distinct(LeadStatusHistory.store_id))
            .filter(
                LeadStatusHistory.new_status == LeadStatus.CONVERTED,
                LeadStatusHistory.created_at.between(day_start, day_end),
            )
            .count()
        )
        
        series.append({
            "date": day_label,
            "messages_sent": sent,
            "messages_received": received,
            "replies": replied_unique,
            "conversions": conversions,
        })
        
    return series
