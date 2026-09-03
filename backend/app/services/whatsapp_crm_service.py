import json
from datetime import datetime, date
from typing import List, Optional, Tuple, Dict, Any
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

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
    CampaignStatus,
    FollowUp,
    FollowUpStatus,
    WhatsAppTemplate,
    WebhookEvent,
    WhatsAppApiSettings,
)
from app.models.user import User
from app.services.whatsapp_cloud_client import WhatsAppCloudClient


# ─── 1. Store CRM & Lead Progression ──────────────────────────────────────────
def get_or_create_store(
    db: Session,
    whatsapp_number: str,
    name: Optional[str] = None,
    owner_name: Optional[str] = None,
    location: Optional[str] = None,
    category: Optional[str] = "General Store",
    website_url: Optional[str] = None,
    website_status: str = "NO_WEBSITE",
    assigned_user_id: Optional[int] = None,
) -> Store:
    cleaned_number = "".join(c for c in whatsapp_number if c.isdigit())
    store = db.query(Store).filter(Store.whatsapp_number == cleaned_number).first()
    
    if not store:
        store = Store(
            name=name or f"Store {cleaned_number[-4:]}",
            owner_name=owner_name,
            whatsapp_number=cleaned_number,
            location=location,
            category=category or "General Store",
            website_url=website_url,
            website_status=website_status,
            lead_status=LeadStatus.NEW,
            assigned_user_id=assigned_user_id,
            opt_in_status=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(store)
        db.commit()
        db.refresh(store)
        
        # Log initial history
        history = LeadStatusHistory(
            store_id=store.id,
            old_status=None,
            new_status=LeadStatus.NEW,
            changed_by_user_id=assigned_user_id,
            notes="New store lead created in CRM.",
            created_at=datetime.utcnow(),
        )
        db.add(history)
        db.commit()
    
    return store


def update_store_lead_status(
    db: Session,
    store: Store,
    new_status: LeadStatus,
    changed_by_user_id: Optional[int] = None,
    notes: Optional[str] = None,
) -> Store:
    if store.lead_status == new_status:
        return store
    
    old_status = store.lead_status
    store.lead_status = new_status
    store.updated_at = datetime.utcnow()
    
    # Update active conversation status accordingly
    if store.conversation:
        store.conversation.lead_status = new_status
        if new_status in [LeadStatus.CONVERTED, LeadStatus.CLOSED, LeadStatus.NOT_INTERESTED]:
            store.conversation.status = ConversationState.CLOSED
        elif new_status == LeadStatus.FOLLOW_UP:
            store.conversation.status = ConversationState.FOLLOW_UP
        else:
            store.conversation.status = ConversationState.OPEN
    
    # Append history entry
    history = LeadStatusHistory(
        store_id=store.id,
        old_status=old_status,
        new_status=new_status,
        changed_by_user_id=changed_by_user_id,
        notes=notes or f"Status changed from {old_status.value} to {new_status.value}",
        created_at=datetime.utcnow(),
    )
    db.add(history)
    db.commit()
    db.refresh(store)
    return store


# ─── 2. WhatsApp Conversation & Messaging Engine ──────────────────────────────
def get_or_create_conversation(
    db: Session,
    store: Store,
    assigned_user_id: Optional[int] = None,
) -> WhatsAppCrmConversation:
    conv = db.query(WhatsAppCrmConversation).filter(WhatsAppCrmConversation.store_id == store.id).first()
    if not conv:
        conv = WhatsAppCrmConversation(
            store_id=store.id,
            whatsapp_number=store.whatsapp_number,
            assigned_user_id=assigned_user_id or store.assigned_user_id,
            total_messages=0,
            inbound_messages=0,
            outbound_messages=0,
            unread_messages=0,
            status=ConversationState.OPEN,
            lead_status=store.lead_status,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
    return conv


def send_whatsapp_message(
    db: Session,
    store: Store,
    message_text: Optional[str] = None,
    template_name: Optional[str] = None,
    template_variables: Optional[Dict[str, Any]] = None,
    media_url: Optional[str] = None,
    media_type: Optional[str] = None,
    sender_user_id: Optional[int] = None,
    campaign_id: Optional[int] = None,
) -> WhatsAppCrmMessage:
    """
    Sends outbound WhatsApp message, records it in DB, and dispatches to Meta Cloud API.
    """
    conv = get_or_create_conversation(db, store, assigned_user_id=sender_user_id)
    
    content = message_text or ""
    msg_type = "text"
    
    # 1. Dispatch through Meta Cloud API
    if template_name:
        msg_type = "template"
        content = f"[Template: {template_name}] " + (json.dumps(template_variables) if template_variables else "")
        success, wamid_or_err, raw_res = WhatsAppCloudClient.send_template(
            db=db,
            to_phone=store.whatsapp_number,
            template_name=template_name,
            variables=template_variables,
        )
    elif media_url and media_type:
        msg_type = media_type
        content = f"[{media_type.upper()}] {media_url} - {message_text or ''}"
        success, wamid_or_err, raw_res = WhatsAppCloudClient.send_media(
            db=db,
            to_phone=store.whatsapp_number,
            media_type=media_type,
            media_url=media_url,
            caption=message_text,
        )
    else:
        success, wamid_or_err, raw_res = WhatsAppCloudClient.send_text(
            db=db,
            to_phone=store.whatsapp_number,
            text_body=content,
        )
    
    status = MessageStatus.SENT if success else MessageStatus.FAILED
    wamid = wamid_or_err if success else None
    err_msg = None if success else wamid_or_err
    now = datetime.utcnow()
    
    msg = WhatsAppCrmMessage(
        whatsapp_message_id=wamid,
        store_id=store.id,
        conversation_id=conv.id,
        direction=MessageDirection.OUTBOUND,
        message_type=msg_type,
        message_content=content,
        template_name=template_name,
        status=status,
        error_message=err_msg,
        sent_at=now if success else None,
        campaign_id=campaign_id,
        sender_user_id=sender_user_id,
        created_at=now,
    )
    db.add(msg)
    
    # Update conversation metrics
    if not conv.first_message_at:
        conv.first_message_at = now
    conv.last_message_at = now
    conv.last_outbound_message_at = now
    conv.total_messages += 1
    conv.outbound_messages += 1
    conv.status = ConversationState.WAITING_FOR_REPLY
    
    # Update Store dates
    if not store.first_contacted_date:
        store.first_contacted_date = now
    store.last_contacted_date = now
    
    # Auto transition lead status from NEW to MESSAGE_SENT
    if store.lead_status == LeadStatus.NEW:
        update_store_lead_status(db, store, LeadStatus.MESSAGE_SENT, changed_by_user_id=sender_user_id, notes="Initial WhatsApp outreach sent.")
    
    db.commit()
    db.refresh(msg)
    return msg


# ─── 3. Inbound Webhook Processing (Idempotent) ───────────────────────────────
def process_incoming_webhook_message(
    db: Session,
    whatsapp_number: str,
    message_text: str,
    whatsapp_message_id: Optional[str] = None,
    sender_name: Optional[str] = None,
) -> Tuple[WhatsAppCrmMessage, WhatsAppCrmConversation]:
    """
    Idempotently handles incoming WhatsApp message from Meta webhook.
    Auto-upgrades store lead status to REPLIED and updates conversation unread count.
    """
    cleaned_number = "".join(c for c in whatsapp_number if c.isdigit())
    now = datetime.utcnow()
    
    # Idempotency check
    if whatsapp_message_id:
        existing = db.query(WhatsAppCrmMessage).filter(WhatsAppCrmMessage.whatsapp_message_id == whatsapp_message_id).first()
        if existing:
            return existing, existing.conversation
    
    store = get_or_create_store(
        db=db,
        whatsapp_number=cleaned_number,
        name=sender_name or f"Store {cleaned_number[-4:]}",
        owner_name=sender_name,
    )
    conv = get_or_create_conversation(db, store)
    
    msg = WhatsAppCrmMessage(
        whatsapp_message_id=whatsapp_message_id,
        store_id=store.id,
        conversation_id=conv.id,
        direction=MessageDirection.INBOUND,
        message_type="text",
        message_content=message_text,
        status=MessageStatus.RECEIVED,
        received_at=now,
        created_at=now,
    )
    db.add(msg)
    
    # Update conversation metrics
    conv.last_message_at = now
    conv.last_inbound_message_at = now
    conv.total_messages += 1
    conv.inbound_messages += 1
    conv.unread_messages += 1
    conv.status = ConversationState.OPEN
    
    # Update Store dates
    store.last_reply_date = now
    
    # Automatic Lead Detection: If lead was contacted/new/message_sent, auto update to REPLIED
    if store.lead_status in [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.MESSAGE_SENT, LeadStatus.NO_RESPONSE]:
        update_store_lead_status(
            db=db,
            store=store,
            new_status=LeadStatus.REPLIED,
            notes=f"Auto-updated to REPLIED via incoming message: '{message_text[:30]}...'"
        )
    
    # Check for keyword intent in customer reply
    lower_text = message_text.lower()
    if any(w in lower_text for w in ["interested", "yes", "how much", "price", "cost", "details", "call me", "send proposal", "website"]):
        if store.lead_status == LeadStatus.REPLIED:
            update_store_lead_status(
                db=db,
                store=store,
                new_status=LeadStatus.INTERESTED,
                notes=f"Auto-detected interest keyword in incoming message: '{message_text[:30]}...'"
            )
    
    db.commit()
    db.refresh(msg)
    db.refresh(conv)
    return msg, conv


def process_webhook_status_update(
    db: Session,
    whatsapp_message_id: str,
    status_str: str,  # sent, delivered, read, failed
    error_code: Optional[str] = None,
    error_message: Optional[str] = None,
) -> Optional[WhatsAppCrmMessage]:
    """
    Updates delivery & read timestamps on existing outbound message.
    """
    msg = db.query(WhatsAppCrmMessage).filter(WhatsAppCrmMessage.whatsapp_message_id == whatsapp_message_id).first()
    if not msg:
        return None
    
    now = datetime.utcnow()
    norm_status = status_str.lower()
    
    if norm_status == "delivered":
        msg.status = MessageStatus.DELIVERED
        if not msg.delivered_at:
            msg.delivered_at = now
    elif norm_status == "read":
        msg.status = MessageStatus.READ
        if not msg.read_at:
            msg.read_at = now
        if not msg.delivered_at:
            msg.delivered_at = now
    elif norm_status == "failed":
        msg.status = MessageStatus.FAILED
        msg.error_code = error_code
        msg.error_message = error_message
    
    db.commit()
    db.refresh(msg)
    return msg


# ─── 4. Follow-Up System ──────────────────────────────────────────────────────
def create_follow_up(
    db: Session,
    store_id: int,
    follow_up_date: datetime,
    follow_up_time: str = "11:00 AM",
    note: str = "Follow up regarding website package proposal.",
    assigned_user_id: Optional[int] = None,
) -> FollowUp:
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise ValueError("Store not found")
    
    follow_up = FollowUp(
        store_id=store_id,
        assigned_user_id=assigned_user_id or store.assigned_user_id,
        follow_up_date=follow_up_date,
        follow_up_time=follow_up_time,
        note=note,
        status=FollowUpStatus.PENDING,
        created_at=datetime.utcnow(),
    )
    db.add(follow_up)
    
    # Also sync onto store record
    store.follow_up_date = follow_up_date
    store.follow_up_note = f"[{follow_up_time}] {note}"
    
    # Auto-update status to FOLLOW_UP if currently contacted or interested
    if store.lead_status in [LeadStatus.REPLIED, LeadStatus.INTERESTED, LeadStatus.CONTACTED]:
        update_store_lead_status(
            db=db,
            store=store,
            new_status=LeadStatus.FOLLOW_UP,
            changed_by_user_id=assigned_user_id,
            notes=f"Follow-up scheduled for {follow_up_date.strftime('%Y-%m-%d')} at {follow_up_time}"
        )
    
    db.commit()
    db.refresh(follow_up)
    return follow_up


def get_todays_follow_ups(db: Session, user_id: Optional[int] = None) -> List[FollowUp]:
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = datetime.utcnow().replace(hour=23, minute=59, second=59, microsecond=999999)
    
    query = db.query(FollowUp).filter(
        FollowUp.status == FollowUpStatus.PENDING,
        FollowUp.follow_up_date >= today_start,
        FollowUp.follow_up_date <= today_end,
    )
    if user_id:
        query = query.filter(FollowUp.assigned_user_id == user_id)
    
    return query.order_by(FollowUp.follow_up_date.asc()).all()


# ─── 5. Campaign Outreach Engine ──────────────────────────────────────────────
def create_and_launch_campaign(
    db: Session,
    name: str,
    template_name: str,
    language_code: str = "en",
    message_variables: Optional[Dict[str, Any]] = None,
    target_category: Optional[str] = None,
    target_lead_status: Optional[str] = None,
    target_location: Optional[str] = None,
    store_ids: Optional[List[int]] = None,
    created_by_user_id: Optional[int] = None,
) -> WhatsAppCampaign:
    campaign = WhatsAppCampaign(
        name=name,
        template_name=template_name,
        language_code=language_code,
        message_variables=message_variables or {},
        target_category=target_category,
        target_lead_status=target_lead_status,
        target_location=target_location,
        created_by_user_id=created_by_user_id,
        status=CampaignStatus.RUNNING,
        scheduled_at=datetime.utcnow(),
        created_at=datetime.utcnow(),
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    
    # Filter target stores
    store_query = db.query(Store).filter(Store.opt_in_status == True)
    if store_ids and len(store_ids) > 0:
        store_query = store_query.filter(Store.id.in_(store_ids))
    else:
        if target_category and target_category != "ALL":
            store_query = store_query.filter(Store.category == target_category)
        if target_lead_status and target_lead_status != "ALL":
            store_query = store_query.filter(Store.lead_status == target_lead_status)
        if target_location:
            store_query = store_query.filter(Store.location.ilike(f"%{target_location}%"))
    
    target_stores = store_query.all()
    campaign.total_recipients = len(target_stores)
    
    # Batch send messages
    for store in target_stores:
        campaign.messages_attempted += 1
        vars_copy = dict(message_variables or {})
        vars_copy["store_name"] = store.name
        vars_copy["category"] = store.category or "Store"
        
        try:
            msg = send_whatsapp_message(
                db=db,
                store=store,
                template_name=template_name,
                template_variables=vars_copy,
                sender_user_id=created_by_user_id,
                campaign_id=campaign.id,
            )
            
            status_val = "SENT" if msg.status == MessageStatus.SENT else "FAILED"
            if msg.status == MessageStatus.SENT:
                campaign.messages_sent += 1
            else:
                campaign.messages_failed += 1
                
            rec = CampaignRecipient(
                campaign_id=campaign.id,
                store_id=store.id,
                whatsapp_number=store.whatsapp_number,
                status=status_val,
                whatsapp_message_id=msg.whatsapp_message_id,
                sent_at=datetime.utcnow(),
                error_message=msg.error_message,
            )
            db.add(rec)
        except Exception as e:
            campaign.messages_failed += 1
            rec = CampaignRecipient(
                campaign_id=campaign.id,
                store_id=store.id,
                whatsapp_number=store.whatsapp_number,
                status="FAILED",
                error_message=str(e),
            )
            db.add(rec)
    
    campaign.status = CampaignStatus.COMPLETED
    campaign.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(campaign)
    return campaign


# ─── 6. Seed Default Templates ────────────────────────────────────────────────
def seed_default_templates(db: Session):
    existing = db.query(WhatsAppTemplate).first()
    if existing:
        return
    
    templates = [
        WhatsAppTemplate(
            name="website_launch_offer",
            category="MARKETING",
            language="en",
            header_text="🚀 Special Online Website Proposal for {{store_name}}",
            body_text=(
                "Namaste {{store_name}}! We noticed your shop does not have an official online ordering website. "
                "Lexon IT helps local {{category}} shops get a modern mobile website with WhatsApp ordering, "
                "Google Maps listing, and product catalog for just ₹2,999.\n\n"
                "Would you like to see a free live demo for your store today?"
            ),
            footer_text="Lexon IT Web Services",
            variables_json=["store_name", "category"],
            buttons_json=[
                {"type": "QUICK_REPLY", "text": "Yes, show me demo"},
                {"type": "QUICK_REPLY", "text": "Call me later"},
            ],
            meta_status="APPROVED",
        ),
        WhatsAppTemplate(
            name="follow_up_website_pitch",
            category="MARKETING",
            language="en",
            header_text="Website Upgrade for {{store_name}}",
            body_text=(
                "Hello {{store_name}} team! Following up on our website design offer. "
                "Having your own website allows customers to browse items 24/7 and place direct WhatsApp orders.\n\n"
                "Can we connect for a quick 2-minute call today?"
            ),
            footer_text="Lexon IT",
            variables_json=["store_name"],
            buttons_json=[
                {"type": "QUICK_REPLY", "text": "Schedule Call"},
                {"type": "QUICK_REPLY", "text": "Send Pricing PDF"},
            ],
            meta_status="APPROVED",
        ),
        WhatsAppTemplate(
            name="proposal_ready",
            category="UTILITY",
            language="en",
            header_text="Website Package Proposal Ready",
            body_text=(
                "Hi {{store_name}}! Your custom website design proposal and digital menu architecture are ready. "
                "Check out the features including online catalogue, payment links, and instant WhatsApp alerts.\n\n"
                "Reply YES to confirm your slot."
            ),
            footer_text="Lexon IT Solutions",
            variables_json=["store_name"],
            buttons_json=[],
            meta_status="APPROVED",
        ),
    ]
    for t in templates:
        db.add(t)
    db.commit()
