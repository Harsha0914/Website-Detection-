import json
from typing import List, Optional, Dict, Any
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Query, Response, Request, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.whatsapp_crm import (
    Store,
    LeadStatus,
    LeadStatusHistory,
    WhatsAppCrmConversation,
    WhatsAppCrmMessage,
    MessageDirection,
    MessageStatus,
    ConversationState,
    WhatsAppCampaign,
    CampaignRecipient,
    FollowUp,
    FollowUpStatus,
    WhatsAppTemplate,
    WebhookEvent,
    WhatsAppApiSettings,
)
from app.models.user import User, UserRole
from app.schemas.whatsapp_crm import (
    StoreCreate,
    StoreUpdate,
    StoreOut,
    LeadStatusHistoryOut,
    SendMessagePayload,
    WhatsAppCrmMessageOut,
    WhatsAppCrmConversationOut,
    WhatsAppCrmConversationDetail,
    FollowUpCreate,
    FollowUpUpdate,
    FollowUpOut,
    CampaignCreate,
    CampaignOut,
    CampaignRecipientOut,
    TemplateCreate,
    TemplateOut,
    TodayAnalyticsOut,
    AnalyticsOverviewOut,
    WhatsAppSettingsUpdate,
    WhatsAppSettingsOut,
    SimulateIncomingWebhook,
    SimulateStatusWebhook,
)
from app.services.whatsapp_cloud_client import WhatsAppCloudClient, get_whatsapp_settings
from app.services.whatsapp_crm_service import (
    get_or_create_store,
    update_store_lead_status,
    get_or_create_conversation,
    send_whatsapp_message,
    process_incoming_webhook_message,
    process_webhook_status_update,
    create_follow_up,
    get_todays_follow_ups,
    create_and_launch_campaign,
    seed_default_templates,
)
from app.services.whatsapp_analytics_service import (
    compute_whatsapp_crm_analytics,
    compute_daily_trend_series,
    get_date_range_bounds,
)

router = APIRouter(prefix="/api/crm", tags=["WhatsApp Business Outreach & CRM"])


# ─── 1. WhatsApp Messaging & Inbox Endpoints ─────────────────────────────────
@router.post("/whatsapp/send", response_model=WhatsAppCrmMessageOut)
def api_send_whatsapp_message(
    payload: SendMessagePayload,
    db: Session = Depends(get_db),
):
    """
    Sends WhatsApp text, template, or media message to a store owner.
    """
    store = None
    if payload.store_id:
        store = db.query(Store).filter(Store.id == payload.store_id).first()
    elif payload.whatsapp_number:
        store = get_or_create_store(db, whatsapp_number=payload.whatsapp_number)

    if not store:
        raise HTTPException(status_code=404, detail="Store not found or phone number missing")

    msg = send_whatsapp_message(
        db=db,
        store=store,
        message_text=payload.message_text,
        template_name=payload.template_name,
        template_variables=payload.template_variables,
        media_url=payload.media_url,
        media_type=payload.media_type,
    )
    return msg


@router.get("/whatsapp/conversations", response_model=List[WhatsAppCrmConversationOut])
def list_conversations(
    search: Optional[str] = None,
    lead_status: Optional[str] = None,
    assigned_user_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """
    Returns WhatsApp CRM conversations for the 3-Pane inbox with search & status filters.
    """
    query = db.query(WhatsAppCrmConversation).join(Store)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Store.name.ilike(s),
                Store.owner_name.ilike(s),
                Store.whatsapp_number.ilike(s),
                Store.category.ilike(s),
            )
        )

    if lead_status and lead_status != "ALL":
        query = query.filter(WhatsAppCrmConversation.lead_status == lead_status)

    if assigned_user_id:
        query = query.filter(WhatsAppCrmConversation.assigned_user_id == assigned_user_id)

    conversations = (
        query.order_by(WhatsAppCrmConversation.last_message_at.desc())
        .limit(limit)
        .all()
    )
    return conversations


@router.get("/whatsapp/conversations/{conversation_id}", response_model=WhatsAppCrmConversationDetail)
def get_conversation_detail(
    conversation_id: int,
    db: Session = Depends(get_db),
):
    conv = db.query(WhatsAppCrmConversation).filter(WhatsAppCrmConversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Mark messages as read
    conv.unread_messages = 0
    db.query(WhatsAppCrmMessage).filter(
        WhatsAppCrmMessage.conversation_id == conv.id,
        WhatsAppCrmMessage.direction == MessageDirection.INBOUND,
        WhatsAppCrmMessage.status == MessageStatus.RECEIVED,
    ).update({"status": MessageStatus.READ})
    db.commit()
    db.refresh(conv)

    return conv


@router.post("/whatsapp/conversations/{conversation_id}/messages", response_model=WhatsAppCrmMessageOut)
def reply_to_conversation(
    conversation_id: int,
    payload: SendMessagePayload,
    db: Session = Depends(get_db),
):
    conv = db.query(WhatsAppCrmConversation).filter(WhatsAppCrmConversation.id == conversation_id).first()
    if not conv or not conv.store:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msg = send_whatsapp_message(
        db=db,
        store=conv.store,
        message_text=payload.message_text,
        template_name=payload.template_name,
        template_variables=payload.template_variables,
        media_url=payload.media_url,
        media_type=payload.media_type,
    )
    return msg


# ─── 2. Meta WhatsApp Webhook Handshake & Ingestion ───────────────────────────
@router.get("/whatsapp/webhook")
def verify_meta_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
    db: Session = Depends(get_db),
):
    """
    Official Meta Webhook verification handshake.
    """
    settings = get_whatsapp_settings(db)
    if hub_mode == "subscribe" and hub_verify_token == settings.webhook_verify_token:
        if hub_challenge:
            return Response(content=hub_challenge, media_type="text/plain")
        return {"status": "verified"}
    raise HTTPException(status_code=403, detail="Webhook verification token mismatch")


@router.post("/whatsapp/webhook")
async def receive_meta_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Receives incoming WhatsApp messages, delivery receipts, and read receipts from Meta.
    """
    try:
        payload = await request.json()
    except Exception:
        return {"status": "error", "message": "Invalid JSON"}

    # Log webhook event for audit
    entry_list = payload.get("entry", [])
    for entry in entry_list:
        changes = entry.get("changes", [])
        for change in changes:
            value = change.get("value", {})
            messages = value.get("messages", [])
            statuses = value.get("statuses", [])
            contacts = value.get("contacts", [])

            sender_name = "Store Owner"
            if contacts and len(contacts) > 0:
                sender_name = contacts[0].get("profile", {}).get("name", "Store Owner")

            # 1. Inbound Messages
            for msg in messages:
                wamid = msg.get("id")
                from_num = msg.get("from")
                msg_type = msg.get("type", "text")
                body = ""
                if msg_type == "text":
                    body = msg.get("text", {}).get("body", "")
                elif msg_type == "button":
                    body = msg.get("button", {}).get("text", "")
                elif msg_type == "interactive":
                    body = msg.get("interactive", {}).get("button_reply", {}).get("title", "")

                if from_num and body:
                    process_incoming_webhook_message(
                        db=db,
                        whatsapp_number=from_num,
                        message_text=body,
                        whatsapp_message_id=wamid,
                        sender_name=sender_name,
                    )

            # 2. Delivery & Read Receipts
            for st in statuses:
                wamid = st.get("id")
                status_str = st.get("status")
                errors = st.get("errors", [])
                err_code = str(errors[0].get("code")) if errors else None
                err_msg = errors[0].get("message") if errors else None
                if wamid and status_str:
                    process_webhook_status_update(
                        db=db,
                        whatsapp_message_id=wamid,
                        status_str=status_str,
                        error_code=err_code,
                        error_message=err_msg,
                    )

    return {"status": "success"}


@router.post("/whatsapp/webhook/simulate", response_model=Dict[str, Any])
def simulate_webhook_event(
    payload: SimulateIncomingWebhook,
    db: Session = Depends(get_db),
):
    """
    Developer testing tool to simulate incoming customer WhatsApp message in sandbox.
    """
    msg, conv = process_incoming_webhook_message(
        db=db,
        whatsapp_number=payload.whatsapp_number,
        message_text=payload.message_text,
        sender_name=payload.owner_name or payload.store_name,
    )
    return {
        "status": "success",
        "message_id": msg.id,
        "conversation_id": conv.id,
        "store_id": conv.store_id,
        "lead_status": conv.lead_status.value,
        "unread_count": conv.unread_messages,
    }


# ─── 3. Store Owners CRM Endpoints ────────────────────────────────────────────
@router.get("/stores", response_model=List[StoreOut])
def list_stores(
    search: Optional[str] = None,
    category: Optional[str] = None,
    lead_status: Optional[str] = None,
    assigned_user_id: Optional[int] = None,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(Store)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Store.name.ilike(s),
                Store.owner_name.ilike(s),
                Store.whatsapp_number.ilike(s),
                Store.location.ilike(s),
            )
        )

    if category and category != "ALL":
        query = query.filter(Store.category == category)

    if lead_status and lead_status != "ALL":
        query = query.filter(Store.lead_status == lead_status)

    if assigned_user_id:
        query = query.filter(Store.assigned_user_id == assigned_user_id)

    return query.order_by(Store.updated_at.desc()).limit(limit).all()


@router.post("/stores", response_model=StoreOut)
def create_store(
    payload: StoreCreate,
    db: Session = Depends(get_db),
):
    store = get_or_create_store(
        db=db,
        whatsapp_number=payload.whatsapp_number,
        name=payload.name,
        owner_name=payload.owner_name,
        location=payload.location,
        category=payload.category,
        website_url=payload.website_url,
        website_status=payload.website_status or "NO_WEBSITE",
        assigned_user_id=payload.assigned_user_id,
    )
    if payload.lead_status and payload.lead_status != store.lead_status:
        update_store_lead_status(db, store, payload.lead_status, notes="Initial status assignment.")
    return store


@router.patch("/stores/{store_id}", response_model=StoreOut)
def update_store(
    store_id: int,
    payload: StoreUpdate,
    db: Session = Depends(get_db),
):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    if payload.name is not None:
        store.name = payload.name
    if payload.owner_name is not None:
        store.owner_name = payload.owner_name
    if payload.whatsapp_number is not None:
        store.whatsapp_number = "".join(c for c in payload.whatsapp_number if c.isdigit())
    if payload.location is not None:
        store.location = payload.location
    if payload.category is not None:
        store.category = payload.category
    if payload.website_url is not None:
        store.website_url = payload.website_url
    if payload.website_status is not None:
        store.website_status = payload.website_status
    if payload.website_score is not None:
        store.website_score = payload.website_score
    if payload.notes is not None:
        store.notes = payload.notes
    if payload.assigned_user_id is not None:
        store.assigned_user_id = payload.assigned_user_id
    if payload.opt_in_status is not None:
        store.opt_in_status = payload.opt_in_status
    if payload.follow_up_date is not None:
        store.follow_up_date = payload.follow_up_date
    if payload.follow_up_note is not None:
        store.follow_up_note = payload.follow_up_note

    if payload.lead_status and payload.lead_status != store.lead_status:
        update_store_lead_status(db, store, payload.lead_status, notes="Updated from Store CRM.")

    store.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(store)
    return store


@router.get("/stores/{store_id}/history", response_model=List[LeadStatusHistoryOut])
def get_store_lead_history(
    store_id: int,
    db: Session = Depends(get_db),
):
    return (
        db.query(LeadStatusHistory)
        .filter(LeadStatusHistory.store_id == store_id)
        .order_by(LeadStatusHistory.created_at.desc())
        .all()
    )


# ─── 4. Daily & Custom Analytics Endpoints ────────────────────────────────────
@router.get("/analytics/today", response_model=TodayAnalyticsOut)
def get_today_analytics(
    campaign_id: Optional[int] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """
    Returns today's statistics strictly calculated using unique store identifiers.
    """
    start_dt, end_dt = get_date_range_bounds("today")
    stats = compute_whatsapp_crm_analytics(db, start_dt, end_dt, campaign_id=campaign_id, user_id=user_id)
    return stats


@router.get("/analytics/overview", response_model=AnalyticsOverviewOut)
def get_analytics_overview(
    range_key: str = Query("7days", description="today, yesterday, 7days, 30days, this_month"),
    campaign_id: Optional[int] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    start_dt, end_dt = get_date_range_bounds(range_key)
    stats = compute_whatsapp_crm_analytics(db, start_dt, end_dt, campaign_id=campaign_id, user_id=user_id)
    trends = compute_daily_trend_series(db, days=7 if range_key == "7days" else 30)

    # Lead distribution
    lead_counts = {}
    for st in LeadStatus:
        cnt = db.query(Store).filter(Store.lead_status == st).count()
        lead_counts[st.value] = cnt

    return {
        **stats,
        "date_range": range_key,
        "daily_trends": trends,
        "lead_distribution": lead_counts,
        "category_distribution": {},
    }


# ─── 5. Follow-Up System Endpoints ────────────────────────────────────────────
@router.get("/follow-ups", response_model=List[FollowUpOut])
def list_follow_ups(
    filter_type: str = Query("today", description="today, upcoming, overdue, all"),
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    query = db.query(FollowUp).join(Store)

    if user_id:
        query = query.filter(FollowUp.assigned_user_id == user_id)

    if filter_type == "today":
        query = query.filter(FollowUp.status == FollowUpStatus.PENDING, FollowUp.follow_up_date.between(today_start, today_end))
    elif filter_type == "overdue":
        query = query.filter(FollowUp.status == FollowUpStatus.PENDING, FollowUp.follow_up_date < today_start)
    elif filter_type == "upcoming":
        query = query.filter(FollowUp.status == FollowUpStatus.PENDING, FollowUp.follow_up_date > today_end)
    else:
        query = query.filter(FollowUp.status == FollowUpStatus.PENDING)

    return query.order_by(FollowUp.follow_up_date.asc()).all()


@router.post("/follow-ups", response_model=FollowUpOut)
def api_create_follow_up(
    payload: FollowUpCreate,
    db: Session = Depends(get_db),
):
    return create_follow_up(
        db=db,
        store_id=payload.store_id,
        follow_up_date=payload.follow_up_date,
        follow_up_time=payload.follow_up_time or "11:00 AM",
        note=payload.note,
        assigned_user_id=payload.assigned_user_id,
    )


@router.patch("/follow-ups/{follow_up_id}", response_model=FollowUpOut)
def update_follow_up(
    follow_up_id: int,
    payload: FollowUpUpdate,
    db: Session = Depends(get_db),
):
    fu = db.query(FollowUp).filter(FollowUp.id == follow_up_id).first()
    if not fu:
        raise HTTPException(status_code=404, detail="Follow up not found")

    if payload.status:
        fu.status = payload.status
        if payload.status == FollowUpStatus.COMPLETED:
            fu.completed_at = datetime.utcnow()
    if payload.note:
        fu.note = payload.note
    if payload.follow_up_date:
        fu.follow_up_date = payload.follow_up_date
    if payload.follow_up_time:
        fu.follow_up_time = payload.follow_up_time

    db.commit()
    db.refresh(fu)
    return fu


# ─── 6. Campaign Outreach Endpoints ───────────────────────────────────────────
@router.get("/campaigns", response_model=List[CampaignOut])
def list_campaigns(db: Session = Depends(get_db)):
    return db.query(WhatsAppCampaign).order_by(WhatsAppCampaign.created_at.desc()).all()


@router.post("/campaigns", response_model=CampaignOut)
def create_campaign(
    payload: CampaignCreate,
    db: Session = Depends(get_db),
):
    return create_and_launch_campaign(
        db=db,
        name=payload.name,
        template_name=payload.template_name,
        language_code=payload.language_code or "en",
        message_variables=payload.message_variables,
        target_category=payload.target_category,
        target_lead_status=payload.target_lead_status,
        target_location=payload.target_location,
        store_ids=payload.store_ids,
    )


@router.get("/campaigns/{campaign_id}/recipients", response_model=List[CampaignRecipientOut])
def get_campaign_recipients(campaign_id: int, db: Session = Depends(get_db)):
    return db.query(CampaignRecipient).filter(CampaignRecipient.campaign_id == campaign_id).all()


# ─── 7. Template Library Endpoints ────────────────────────────────────────────
@router.get("/templates", response_model=List[TemplateOut])
def list_templates(db: Session = Depends(get_db)):
    seed_default_templates(db)
    return db.query(WhatsAppTemplate).all()


@router.post("/templates", response_model=TemplateOut)
def create_template(
    payload: TemplateCreate,
    db: Session = Depends(get_db),
):
    tpl = WhatsAppTemplate(
        name=payload.name.lower().replace(" ", "_"),
        category=payload.category or "MARKETING",
        language=payload.language or "en",
        header_text=payload.header_text,
        body_text=payload.body_text,
        footer_text=payload.footer_text,
        variables_json=payload.variables_json or [],
        buttons_json=payload.buttons_json or [],
        meta_status="APPROVED",
    )
    db.add(tpl)
    db.commit()
    db.refresh(tpl)
    return tpl


# ─── 8. Team Management Endpoints ─────────────────────────────────────────────
@router.get("/team")
def list_team_members(db: Session = Depends(get_db)):
    users = db.query(User).filter(User.is_active == True).all()
    out = []
    for u in users:
        assigned_stores_cnt = db.query(Store).filter(Store.assigned_user_id == u.id).count()
        out.append({
            "id": u.id,
            "name": u.full_name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role.value,
            "assigned_stores_count": assigned_stores_cnt,
            "is_active": u.is_active,
        })
    return out


# ─── 9. Meta Settings & Configuration ─────────────────────────────────────────
@router.get("/settings", response_model=WhatsAppSettingsOut)
def get_settings(request: Request, db: Session = Depends(get_db)):
    st = get_whatsapp_settings(db)
    base_url = str(request.base_url).rstrip("/")
    webhook_url = f"{base_url}/api/crm/whatsapp/webhook"

    return {
        "meta_app_id": st.meta_app_id,
        "business_account_id": st.business_account_id,
        "phone_number_id": st.phone_number_id,
        "webhook_verify_token": st.webhook_verify_token,
        "api_version": st.api_version,
        "is_test_mode": st.is_test_mode,
        "has_access_token": bool(st.access_token),
        "webhook_url": webhook_url,
    }


@router.post("/settings", response_model=WhatsAppSettingsOut)
def save_settings(
    payload: WhatsAppSettingsUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    st = get_whatsapp_settings(db)
    if payload.meta_app_id is not None:
        st.meta_app_id = payload.meta_app_id
    if payload.meta_app_secret is not None:
        st.meta_app_secret = payload.meta_app_secret
    if payload.business_account_id is not None:
        st.business_account_id = payload.business_account_id
    if payload.phone_number_id is not None:
        st.phone_number_id = payload.phone_number_id
    if payload.access_token is not None and payload.access_token.strip():
        st.access_token = payload.access_token
    if payload.webhook_verify_token is not None:
        st.webhook_verify_token = payload.webhook_verify_token
    if payload.api_version is not None:
        st.api_version = payload.api_version
    if payload.is_test_mode is not None:
        st.is_test_mode = payload.is_test_mode

    st.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(st)

    base_url = str(request.base_url).rstrip("/")
    webhook_url = f"{base_url}/api/crm/whatsapp/webhook"

    return {
        "meta_app_id": st.meta_app_id,
        "business_account_id": st.business_account_id,
        "phone_number_id": st.phone_number_id,
        "webhook_verify_token": st.webhook_verify_token,
        "api_version": st.api_version,
        "is_test_mode": st.is_test_mode,
        "has_access_token": bool(st.access_token),
        "webhook_url": webhook_url,
    }
