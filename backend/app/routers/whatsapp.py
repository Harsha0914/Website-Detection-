from typing import List, Optional

# pyrefly: ignore [missing-import]
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Response,
    Request,
)

# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.whatsapp import (
    WhatsAppConversation,
    WhatsAppMessage,
)

from app.schemas.whatsapp import (
    WhatsAppConversationOut,
    WhatsAppConversationDetail,
    WhatsAppMessageOut,
    ManualMessageCreate,
    ToggleAISchema,
    ToggleTakeoverSchema,
    UpdateLeadStatusSchema,
    UpdateRequirementsSchema,
    SimulateIncomingMessage,
)

from app.services.whatsapp_service import (
    get_or_create_whatsapp_conversation,
    process_incoming_whatsapp_message,
    send_manual_operator_message,
    toggle_whatsapp_ai_bot,
    toggle_human_takeover,
    mark_conversation_as_read,
    update_conversation_lead_status,
    update_conversation_requirements,
)


# =============================================================================
# ROUTER
# =============================================================================

router = APIRouter(
    prefix="/api/whatsapp",
    tags=["WhatsApp Bot & Live Chat"],
)


# =============================================================================
# META WEBHOOK CONFIGURATION
# =============================================================================

# IMPORTANT:
# This must be the same verification token configured in Meta.
WEBHOOK_VERIFY_TOKEN = "shoppresence_whatsapp_webhook_token_123"


# =============================================================================
# 1. META WHATSAPP WEBHOOK VERIFICATION
# =============================================================================

@router.get("/webhook")
def verify_whatsapp_webhook(
    hub_mode: Optional[str] = Query(
        None,
        alias="hub.mode",
    ),
    hub_verify_token: Optional[str] = Query(
        None,
        alias="hub.verify_token",
    ),
    hub_challenge: Optional[str] = Query(
        None,
        alias="hub.challenge",
    ),
):
    """
    Meta WhatsApp Cloud API webhook verification endpoint.

    Meta sends a GET request during webhook setup.

    Meta expects:

        hub.mode = subscribe
        hub.verify_token = your verification token
        hub.challenge = challenge value

    We return the challenge if the token is correct.
    """

    if (
        hub_mode == "subscribe"
        and hub_verify_token == WEBHOOK_VERIFY_TOKEN
    ):
        if hub_challenge:
            return Response(
                content=hub_challenge,
                media_type="text/plain",
            )

        return {
            "status": "verified"
        }

    raise HTTPException(
        status_code=403,
        detail="Webhook verification token mismatch",
    )


# =============================================================================
# 2. META WHATSAPP WEBHOOK RECEIVER
# =============================================================================

@router.post("/webhook")
async def receive_whatsapp_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Receives incoming WhatsApp messages from Meta Cloud API.

    Flow:

        Meta WhatsApp
              ↓
        /api/whatsapp/webhook
              ↓
        Extract phone number
              ↓
        Extract sender name
              ↓
        Extract message text
              ↓
        process_incoming_whatsapp_message()
              ↓
        AI classification
              ↓
        AI response generation
              ↓
        WhatsAppCloudClient.send_text()
              ↓
        Meta WhatsApp
              ↓
        Shop owner receives AI reply

    Non-text messages and WhatsApp status events are ignored safely.

    IMPORTANT:
    The actual AI + Meta sending logic lives in:
        app/services/whatsapp_service.py

    This router only receives and forwards the webhook event.
    """

    # -------------------------------------------------------------------------
    # Read JSON safely
    # -------------------------------------------------------------------------

    try:
        payload = await request.json()

    except Exception as exc:
        print(
            "[WhatsApp Webhook] Invalid JSON payload:",
            exc,
        )

        raise HTTPException(
            status_code=400,
            detail="Invalid webhook JSON payload",
        )

    # -------------------------------------------------------------------------
    # Validate basic Meta webhook structure
    # -------------------------------------------------------------------------

    if not isinstance(payload, dict):
        return {
            "status": "success",
            "message": "Webhook payload ignored",
        }

    try:

        entries = payload.get(
            "entry",
            [],
        )

        if not isinstance(entries, list):
            entries = []

        # ---------------------------------------------------------------------
        # Loop through Meta entries
        # ---------------------------------------------------------------------

        for entry in entries:

            if not isinstance(entry, dict):
                continue

            changes = entry.get(
                "changes",
                [],
            )

            if not isinstance(changes, list):
                continue

            # -----------------------------------------------------------------
            # Loop through changes
            # -----------------------------------------------------------------

            for change in changes:

                if not isinstance(change, dict):
                    continue

                value = change.get(
                    "value",
                    {},
                )

                if not isinstance(value, dict):
                    continue

                # -------------------------------------------------------------
                # Meta sends both:
                #
                # messages
                # contacts
                # metadata
                # statuses
                #
                # We only need messages for incoming chat.
                # -------------------------------------------------------------

                messages = value.get(
                    "messages",
                    [],
                )

                contacts = value.get(
                    "contacts",
                    [],
                )

                metadata = value.get(
                    "metadata",
                    {},
                )

                # -------------------------------------------------------------
                # WhatsApp phone number ID
                #
                # Example:
                #
                # "phone_number_id": "123456789..."
                #
                # We currently don't need to pass this to the service,
                # because WhatsAppCloudClient gets its configuration from DB.
                # -------------------------------------------------------------

                phone_number_id = ""

                if isinstance(metadata, dict):

                    phone_number_id = str(
                        metadata.get(
                            "phone_number_id",
                            "",
                        )
                        or ""
                    )

                if not isinstance(messages, list):
                    continue

                # -----------------------------------------------------------------
                # Process every incoming message
                # -----------------------------------------------------------------

                for msg in messages:

                    if not isinstance(msg, dict):
                        continue

                    # -------------------------------------------------------------
                    # Message type
                    # -------------------------------------------------------------

                    message_type = msg.get(
                        "type",
                        "",
                    )

                    # -------------------------------------------------------------
                    # At the moment we process TEXT messages.
                    #
                    # Image/document/audio/etc. are ignored here.
                    # -------------------------------------------------------------

                    if message_type != "text":
                        print(
                            "[WhatsApp Webhook] Ignoring message type:",
                            message_type,
                        )
                        continue

                    # -------------------------------------------------------------
                    # Sender phone number
                    # -------------------------------------------------------------

                    phone_number = str(
                        msg.get(
                            "from",
                            "",
                        )
                        or ""
                    ).strip()

                    # -------------------------------------------------------------
                    # Message body
                    # -------------------------------------------------------------

                    text_object = msg.get(
                        "text",
                        {},
                    )

                    if not isinstance(
                        text_object,
                        dict,
                    ):
                        text_object = {}

                    body = str(
                        text_object.get(
                            "body",
                            "",
                        )
                        or ""
                    ).strip()

                    # -------------------------------------------------------------
                    # Skip incomplete messages
                    # -------------------------------------------------------------

                    if not phone_number or not body:
                        print(
                            "[WhatsApp Webhook] "
                            "Skipping message without phone/body"
                        )
                        continue

                    # -------------------------------------------------------------
                    # Find contact name
                    # -------------------------------------------------------------

                    contact_name = "Shop Owner"

                    if (
                        isinstance(
                            contacts,
                            list,
                        )
                        and contacts
                    ):

                        # Usually Meta returns the matching contact here.
                        #
                        # We use the first contact because this webhook
                        # currently handles one sender at a time.

                        first_contact = contacts[0]

                        if isinstance(
                            first_contact,
                            dict,
                        ):

                            profile = first_contact.get(
                                "profile",
                                {},
                            )

                            if isinstance(
                                profile,
                                dict,
                            ):

                                contact_name = str(
                                    profile.get(
                                        "name",
                                        "Shop Owner",
                                    )
                                    or "Shop Owner"
                                ).strip()

                    # -------------------------------------------------------------
                    # Log received message
                    # -------------------------------------------------------------

                    print(
                        "[WhatsApp Webhook] "
                        f"Incoming message from {phone_number}"
                    )

                    print(
                        "[WhatsApp Webhook] "
                        f"Contact: {contact_name}"
                    )

                    print(
                        "[WhatsApp Webhook] "
                        f"Message: {body}"
                    )

                    if phone_number_id:
                        print(
                            "[WhatsApp Webhook] "
                            f"Phone Number ID: {phone_number_id}"
                        )

                    # -------------------------------------------------------------
                    # IMPORTANT:
                    #
                    # Send incoming message into whatsapp_service.py
                    #
                    # whatsapp_service.py handles:
                    #
                    # 1. Create/find conversation
                    # 2. Save inbound message
                    # 3. Classify intent
                    # 4. Calculate lead score
                    # 5. Extract requirements
                    # 6. Check AI settings
                    # 7. Generate AI reply
                    # 8. Send reply through Meta Cloud API
                    # 9. Save outbound message
                    # 10. Save AI audit log
                    # -------------------------------------------------------------

                    inbound, outbound_ai, is_ai_replied = (
                        process_incoming_whatsapp_message(
                            db=db,
                            phone_number=phone_number,
                            message_text=body,
                            sender_name=contact_name,
                        )
                    )

                    # -------------------------------------------------------------
                    # Log result
                    # -------------------------------------------------------------

                    print(
                        "[WhatsApp Webhook] "
                        f"Inbound message saved: {inbound.id}"
                    )

                    if outbound_ai:

                        print(
                            "[WhatsApp Webhook] "
                            f"AI reply generated: {outbound_ai.id}"
                        )

                    else:

                        print(
                            "[WhatsApp Webhook] "
                            "No AI reply generated"
                        )

                    print(
                        "[WhatsApp Webhook] "
                        f"AI replied: {is_ai_replied}"
                    )

        # ---------------------------------------------------------------------
        # IMPORTANT:
        #
        # Always return success for valid Meta webhook events.
        #
        # Meta uses the HTTP response to determine whether delivery succeeded.
        # ---------------------------------------------------------------------

        return {
            "status": "success"
        }

    except Exception as exc:

        # ---------------------------------------------------------------------
        # Roll back DB transaction if something failed.
        # ---------------------------------------------------------------------

        try:
            db.rollback()
        except Exception:
            pass

        print(
            "[WhatsApp Webhook] "
            "Error processing Meta webhook:",
            exc,
        )

        # ---------------------------------------------------------------------
        # Return error response.
        # ---------------------------------------------------------------------

        return {
            "status": "error",
            "message": str(exc),
        }


# =============================================================================
# 3. DEVELOPER / APP MESSAGE SIMULATOR
# =============================================================================

@router.post(
    "/simulate-incoming",
    response_model=dict,
)
def simulate_incoming_whatsapp(
    payload: SimulateIncomingMessage,
    db: Session = Depends(get_db),
):
    """
    Simulates an incoming WhatsApp reply from a shop owner.

    Useful for development/testing.

    This uses the exact same processing function as the real Meta webhook.
    """

    inbound, outbound_ai, is_ai_replied = (
        process_incoming_whatsapp_message(
            db=db,
            phone_number=payload.phone_number,
            message_text=payload.message,
            sender_name=(
                payload.sender_name
                or payload.shop_name
                or "Shop Owner"
            ),
            business_id=payload.business_id,
            shop_name=payload.shop_name,
        )
    )

    conv = (
        db.query(WhatsAppConversation)
        .filter(
            WhatsAppConversation.id
            == inbound.conversation_id
        )
        .first()
    )

    if not conv:
        raise HTTPException(
            status_code=404,
            detail="WhatsApp conversation not found",
        )

    return {
        "status": "success",
        "conversation_id": conv.id,
        "auto_ai_enabled": conv.auto_ai_enabled,
        "lead_status": conv.lead_status,
        "unread_count": conv.unread_count,
        "human_takeover": conv.human_takeover,
        "business_details_extracted": (
            conv.business_details_extracted
        ),
        "is_ai_replied": is_ai_replied,
        "inbound_message": (
            WhatsAppMessageOut.model_validate(
                inbound
            )
        ),
        "ai_reply_message": (
            WhatsAppMessageOut.model_validate(
                outbound_ai
            )
            if outbound_ai
            else None
        ),
    }


# =============================================================================
# 4. START OR FETCH WHATSAPP CONVERSATION
# =============================================================================

@router.post(
    "/start",
    response_model=WhatsAppConversationDetail,
)
def start_whatsapp_conversation(
    phone_number: str = Query(...),
    shop_name: str = Query("Local Shop"),
    business_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Initializes or retrieves the active WhatsApp conversation thread.
    """

    conv = get_or_create_whatsapp_conversation(
        db=db,
        phone_number=phone_number,
        shop_name=shop_name,
        business_id=business_id,
    )

    messages = (
        db.query(WhatsAppMessage)
        .filter(
            WhatsAppMessage.conversation_id
            == conv.id
        )
        .order_by(
            WhatsAppMessage.created_at.asc()
        )
        .all()
    )

    last_msg = (
        messages[-1].message_body
        if messages
        else None
    )

    return WhatsAppConversationDetail(
        id=conv.id,
        business_id=conv.business_id,
        phone_number=conv.phone_number,
        shop_name=conv.shop_name,
        auto_ai_enabled=conv.auto_ai_enabled,
        lead_status=(
            conv.lead_status
            or "CONTACTED"
        ),
        unread_count=(
            conv.unread_count
            or 0
        ),
        human_takeover=(
            conv.human_takeover
            or False
        ),
        business_details_extracted=(
            conv.business_details_extracted
            or "{}"
        ),
        last_message_at=conv.last_message_at,
        created_at=conv.created_at,
        message_count=len(messages),
        last_message=last_msg,
        messages=[
            WhatsAppMessageOut.model_validate(m)
            for m in messages
        ],
    )


# =============================================================================
# 5. LIST ALL WHATSAPP CONVERSATIONS
# =============================================================================

@router.get(
    "/conversations",
    response_model=List[WhatsAppConversationOut],
)
def list_whatsapp_conversations(
    db: Session = Depends(get_db),
):
    """
    Lists all WhatsApp conversation threads
    sorted by last activity.
    """

    convs = (
        db.query(WhatsAppConversation)
        .order_by(
            WhatsAppConversation.last_message_at.desc()
        )
        .all()
    )

    result = []

    for c in convs:

        msgs = (
            db.query(WhatsAppMessage)
            .filter(
                WhatsAppMessage.conversation_id
                == c.id
            )
            .order_by(
                WhatsAppMessage.created_at.asc()
            )
            .all()
        )

        last_txt = (
            msgs[-1].message_body
            if msgs
            else None
        )

        result.append(
            WhatsAppConversationOut(
                id=c.id,
                business_id=c.business_id,
                phone_number=c.phone_number,
                shop_name=c.shop_name,
                auto_ai_enabled=c.auto_ai_enabled,
                lead_status=(
                    c.lead_status
                    or "CONTACTED"
                ),
                unread_count=(
                    c.unread_count
                    or 0
                ),
                human_takeover=(
                    c.human_takeover
                    or False
                ),
                business_details_extracted=(
                    c.business_details_extracted
                    or "{}"
                ),
                last_message_at=c.last_message_at,
                created_at=c.created_at,
                message_count=len(msgs),
                last_message=last_txt,
            )
        )

    return result


# =============================================================================
# 6. GET SINGLE WHATSAPP CONVERSATION
# =============================================================================

@router.get(
    "/conversations/{conversation_id}",
    response_model=WhatsAppConversationDetail,
)
def get_whatsapp_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
):
    """
    Retrieves full message history and status
    for a WhatsApp conversation.
    """

    conv = (
        db.query(WhatsAppConversation)
        .filter(
            WhatsAppConversation.id
            == conversation_id
        )
        .first()
    )

    if not conv:
        raise HTTPException(
            status_code=404,
            detail="WhatsApp conversation not found",
        )

    messages = (
        db.query(WhatsAppMessage)
        .filter(
            WhatsAppMessage.conversation_id
            == conv.id
        )
        .order_by(
            WhatsAppMessage.created_at.asc()
        )
        .all()
    )

    last_txt = (
        messages[-1].message_body
        if messages
        else None
    )

    return WhatsAppConversationDetail(
        id=conv.id,
        business_id=conv.business_id,
        phone_number=conv.phone_number,
        shop_name=conv.shop_name,
        auto_ai_enabled=conv.auto_ai_enabled,
        lead_status=(
            conv.lead_status
            or "CONTACTED"
        ),
        unread_count=(
            conv.unread_count
            or 0
        ),
        human_takeover=(
            conv.human_takeover
            or False
        ),
        business_details_extracted=(
            conv.business_details_extracted
            or "{}"
        ),
        last_message_at=conv.last_message_at,
        created_at=conv.created_at,
        message_count=len(messages),
        last_message=last_txt,
        messages=[
            WhatsAppMessageOut.model_validate(m)
            for m in messages
        ],
    )


# =============================================================================
# 7. SEND MANUAL OPERATOR REPLY
# =============================================================================

@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=WhatsAppMessageOut,
)
def send_manual_whatsapp_reply(
    conversation_id: int,
    payload: ManualMessageCreate,
    db: Session = Depends(get_db),
):
    """
    Sends a manual response from Lexonity Team
    to the shop owner over WhatsApp.
    """

    try:

        msg = send_manual_operator_message(
            db=db,
            conversation_id=conversation_id,
            message_text=payload.message,
            operator_name=(
                payload.operator_name
                or "Lexonity Team"
            ),
        )

        return WhatsAppMessageOut.model_validate(
            msg
        )

    except ValueError as ex:

        raise HTTPException(
            status_code=404,
            detail=str(ex),
        )


# =============================================================================
# 8. TOGGLE AI AUTO BOT
# =============================================================================

@router.put(
    "/conversations/{conversation_id}/toggle-ai",
    response_model=WhatsAppConversationOut,
)
def toggle_whatsapp_ai_state(
    conversation_id: int,
    payload: ToggleAISchema,
    db: Session = Depends(get_db),
):
    """
    Toggles the Auto AI Bot switch.
    """

    try:

        conv = toggle_whatsapp_ai_bot(
            db=db,
            conversation_id=conversation_id,
            enabled=payload.enabled,
        )

        msgs = (
            db.query(WhatsAppMessage)
            .filter(
                WhatsAppMessage.conversation_id
                == conv.id
            )
            .order_by(
                WhatsAppMessage.created_at.asc()
            )
            .all()
        )

        last_txt = (
            msgs[-1].message_body
            if msgs
            else None
        )

        return WhatsAppConversationOut(
            id=conv.id,
            business_id=conv.business_id,
            phone_number=conv.phone_number,
            shop_name=conv.shop_name,
            auto_ai_enabled=conv.auto_ai_enabled,
            lead_status=(
                conv.lead_status
                or "CONTACTED"
            ),
            unread_count=(
                conv.unread_count
                or 0
            ),
            human_takeover=(
                conv.human_takeover
                or False
            ),
            business_details_extracted=(
                conv.business_details_extracted
                or "{}"
            ),
            last_message_at=conv.last_message_at,
            created_at=conv.created_at,
            message_count=len(msgs),
            last_message=last_txt,
        )

    except ValueError as ex:

        raise HTTPException(
            status_code=404,
            detail=str(ex),
        )


# =============================================================================
# 9. HUMAN TAKEOVER MODE
# =============================================================================

@router.put(
    "/conversations/{conversation_id}/takeover",
    response_model=WhatsAppConversationOut,
)
def toggle_takeover(
    conversation_id: int,
    payload: ToggleTakeoverSchema,
    db: Session = Depends(get_db),
):
    """
    Toggles human takeover mode.
    """

    try:

        conv = toggle_human_takeover(
            db=db,
            conversation_id=conversation_id,
            takeover=payload.takeover,
        )

        msgs = (
            db.query(WhatsAppMessage)
            .filter(
                WhatsAppMessage.conversation_id
                == conv.id
            )
            .order_by(
                WhatsAppMessage.created_at.asc()
            )
            .all()
        )

        last_txt = (
            msgs[-1].message_body
            if msgs
            else None
        )

        return WhatsAppConversationOut(
            id=conv.id,
            business_id=conv.business_id,
            phone_number=conv.phone_number,
            shop_name=conv.shop_name,
            auto_ai_enabled=conv.auto_ai_enabled,
            lead_status=(
                conv.lead_status
                or "CONTACTED"
            ),
            unread_count=(
                conv.unread_count
                or 0
            ),
            human_takeover=(
                conv.human_takeover
                or False
            ),
            business_details_extracted=(
                conv.business_details_extracted
                or "{}"
            ),
            last_message_at=conv.last_message_at,
            created_at=conv.created_at,
            message_count=len(msgs),
            last_message=last_txt,
        )

    except ValueError as ex:

        raise HTTPException(
            status_code=404,
            detail=str(ex),
        )


# =============================================================================
# 10. MARK CONVERSATION AS READ
# =============================================================================

@router.post(
    "/conversations/{conversation_id}/mark-read",
    response_model=dict,
)
def mark_read(
    conversation_id: int,
    db: Session = Depends(get_db),
):
    """
    Marks all messages as read and resets unread badge.
    """

    try:

        mark_conversation_as_read(
            db=db,
            conversation_id=conversation_id,
        )

        return {
            "status": "success",
            "conversation_id": conversation_id,
            "unread_count": 0,
        }

    except ValueError as ex:

        raise HTTPException(
            status_code=404,
            detail=str(ex),
        )


# =============================================================================
# 11. UPDATE LEAD STATUS
# =============================================================================

@router.put(
    "/conversations/{conversation_id}/status",
    response_model=WhatsAppConversationOut,
)
def update_status(
    conversation_id: int,
    payload: UpdateLeadStatusSchema,
    db: Session = Depends(get_db),
):
    """
    Updates the lead status of a conversation.
    """

    try:

        conv = update_conversation_lead_status(
            db=db,
            conversation_id=conversation_id,
            lead_status=payload.lead_status,
        )

        msgs = (
            db.query(WhatsAppMessage)
            .filter(
                WhatsAppMessage.conversation_id
                == conv.id
            )
            .order_by(
                WhatsAppMessage.created_at.asc()
            )
            .all()
        )

        last_txt = (
            msgs[-1].message_body
            if msgs
            else None
        )

        return WhatsAppConversationOut(
            id=conv.id,
            business_id=conv.business_id,
            phone_number=conv.phone_number,
            shop_name=conv.shop_name,
            auto_ai_enabled=conv.auto_ai_enabled,
            lead_status=conv.lead_status,
            unread_count=(
                conv.unread_count
                or 0
            ),
            human_takeover=(
                conv.human_takeover
                or False
            ),
            business_details_extracted=(
                conv.business_details_extracted
                or "{}"
            ),
            last_message_at=conv.last_message_at,
            created_at=conv.created_at,
            message_count=len(msgs),
            last_message=last_txt,
        )

    except ValueError as ex:

        raise HTTPException(
            status_code=404,
            detail=str(ex),
        )


# =============================================================================
# 12. UPDATE BUSINESS REQUIREMENTS
# =============================================================================

@router.put(
    "/conversations/{conversation_id}/requirements",
    response_model=WhatsAppConversationOut,
)
def update_requirements(
    conversation_id: int,
    payload: UpdateRequirementsSchema,
    db: Session = Depends(get_db),
):
    """
    Saves and updates extracted business requirements.
    """

    try:

        conv = update_conversation_requirements(
            db=db,
            conversation_id=conversation_id,
            details=payload.details,
        )

        msgs = (
            db.query(WhatsAppMessage)
            .filter(
                WhatsAppMessage.conversation_id
                == conv.id
            )
            .order_by(
                WhatsAppMessage.created_at.asc()
            )
            .all()
        )

        last_txt = (
            msgs[-1].message_body
            if msgs
            else None
        )

        return WhatsAppConversationOut(
            id=conv.id,
            business_id=conv.business_id,
            phone_number=conv.phone_number,
            shop_name=conv.shop_name,
            auto_ai_enabled=conv.auto_ai_enabled,
            lead_status=conv.lead_status,
            unread_count=(
                conv.unread_count
                or 0
            ),
            human_takeover=(
                conv.human_takeover
                or False
            ),
            business_details_extracted=(
                conv.business_details_extracted
                or "{}"
            ),
            last_message_at=conv.last_message_at,
            created_at=conv.created_at,
            message_count=len(msgs),
            last_message=last_txt,
        )

    except ValueError as ex:

        raise HTTPException(
            status_code=404,
            detail=str(ex),
        )


# =============================================================================
# 13. WHATSAPP ANALYTICS
# =============================================================================

@router.get("/stats")
def get_whatsapp_stats(
    period: str = Query(
        "today",
        regex="^(today|yesterday|7days|30days|custom)$",
    ),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Returns calculated WhatsApp communication
    and automation statistics.

    Supports:

        today
        yesterday
        7days
        30days
        custom
    """

    from app.services.whatsapp_service import (
        get_whatsapp_analytics_stats,
    )

    return get_whatsapp_analytics_stats(
        db=db,
        period=period,
        start_date=start_date,
        end_date=end_date,
    )


# =============================================================================
# 14. TRACK OUTBOUND CONTACT
# =============================================================================

@router.post("/track-contact")
def track_outbound_contact(
    phone_number: str = Query(...),
    shop_name: str = Query(...),
    business_id: Optional[int] = Query(None),
    message_text: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Records an outbound WhatsApp interaction
    when a user clicks WhatsApp for a shop.
    """

    from app.services.whatsapp_service import (
        track_whatsapp_outbound_contact,
    )

    msg = track_whatsapp_outbound_contact(
        db=db,
        phone_number=phone_number,
        shop_name=shop_name,
        business_id=business_id,
        message_text=message_text,
    )

    return {
        "status": "success",
        "message_id": msg.id,
        "conversation_id": msg.conversation_id,
        "shop_name": shop_name,
        "phone_number": phone_number,
        "direction": "OUTBOUND",
    }


# =============================================================================
# 15. RECORD SHOP REPLY
# =============================================================================

@router.post("/record-reply")
def record_shop_reply(
    phone_number: str = Query(...),
    message_text: str = Query(
        "I want this website"
    ),
    shop_name: Optional[str] = Query(None),
    lead_status: Optional[str] = Query(
        "INTERESTED"
    ),
    db: Session = Depends(get_db),
):
    """
    Records an incoming WhatsApp reply
    from a shop owner.

    This uses the same processing flow as
    the real Meta webhook.
    """

    (
        inbound,
        outbound_ai,
        is_ai_replied,
    ) = process_incoming_whatsapp_message(
        db=db,
        phone_number=phone_number,
        message_text=message_text,
        sender_name=shop_name or "Shop Owner",
        shop_name=shop_name,
    )

    if lead_status:

        conv = (
            db.query(WhatsAppConversation)
            .filter(
                WhatsAppConversation.id
                == inbound.conversation_id
            )
            .first()
        )

        if conv:

            conv.lead_status = lead_status

            db.commit()

    return {
        "status": "success",
        "conversation_id": (
            inbound.conversation_id
        ),
        "phone_number": phone_number,
        "message_body": inbound.message_body,
        "direction": "INBOUND",
        "lead_status": (
            lead_status
            or "INTERESTED"
        ),
        "is_ai_replied": is_ai_replied,
        "ai_reply_message_id": (
            outbound_ai.id
            if outbound_ai
            else None
        ),
    }


# =============================================================================
# 16. RESET WHATSAPP HISTORY
# =============================================================================

@router.delete("/reset")
def reset_history(
    db: Session = Depends(get_db),
):
    """
    Resets all test WhatsApp logs and conversations.
    """

    from app.services.whatsapp_service import (
        reset_whatsapp_history,
    )

    return reset_whatsapp_history(
        db=db
    )


# =============================================================================
# 17. META WHATSAPP CLOUD API CONFIGURATION & TEST
# =============================================================================

@router.get("/settings")
def get_whatsapp_api_settings_route(
    db: Session = Depends(get_db),
):
    """
    Retrieves the current Meta WhatsApp Cloud API credentials and webhook status.
    """
    from app.services.whatsapp_cloud_client import get_whatsapp_settings
    settings = get_whatsapp_settings(db)
    return {
        "meta_app_id": settings.meta_app_id or "",
        "business_account_id": settings.business_account_id or "",
        "phone_number_id": settings.phone_number_id or "",
        "access_token_configured": bool(settings.access_token),
        "access_token_preview": f"{settings.access_token[:8]}...{settings.access_token[-6:]}" if settings.access_token and len(settings.access_token) > 16 else "",
        "webhook_verify_token": settings.webhook_verify_token or "shoppresence_whatsapp_webhook_token_123",
        "api_version": settings.api_version or "v21.0",
        "is_test_mode": bool(settings.is_test_mode),
        "webhook_url": "/api/whatsapp/webhook"
    }


@router.put("/settings")
def update_whatsapp_api_settings_route(
    payload: dict,
    db: Session = Depends(get_db),
):
    """
    Updates the Meta WhatsApp Cloud API credentials (Phone Number ID, Access Token, etc.).
    """
    from app.services.whatsapp_cloud_client import get_whatsapp_settings
    settings = get_whatsapp_settings(db)
    
    if "meta_app_id" in payload:
        settings.meta_app_id = payload["meta_app_id"]
    if "meta_app_secret" in payload:
        settings.meta_app_secret = payload["meta_app_secret"]
    if "business_account_id" in payload:
        settings.business_account_id = payload["business_account_id"]
    if "phone_number_id" in payload:
        settings.phone_number_id = payload["phone_number_id"]
    if "access_token" in payload and payload["access_token"]:
        settings.access_token = payload["access_token"]
    if "webhook_verify_token" in payload and payload["webhook_verify_token"]:
        settings.webhook_verify_token = payload["webhook_verify_token"]
    if "api_version" in payload and payload["api_version"]:
        settings.api_version = payload["api_version"]
    if "is_test_mode" in payload:
        settings.is_test_mode = bool(payload["is_test_mode"])
        
    db.commit()
    db.refresh(settings)
    return {
        "status": "success",
        "message": "WhatsApp Cloud API settings saved successfully",
        "phone_number_id": settings.phone_number_id,
        "is_test_mode": settings.is_test_mode
    }


@router.post("/settings/test")
def test_whatsapp_cloud_message(
    to_phone: str = Query(..., description="Recipient phone number with country code, e.g. 919154189219"),
    message: str = Query("Hello! This is a test verification message from Lexon IT WhatsApp Cloud API.", description="Test text body"),
    db: Session = Depends(get_db),
):
    """
    Sends a test verification message using the configured Meta WhatsApp Cloud API credentials.
    """
    from app.services.whatsapp_cloud_client import WhatsAppCloudClient
    success, result, raw = WhatsAppCloudClient.send_text(
        db=db,
        to_phone=to_phone,
        text_body=message,
        preview_url=True
    )
    if success:
        return {
            "status": "success",
            "message": f"Test message sent successfully to {to_phone}",
            "wamid": result,
            "raw_response": raw
        }
    else:
        return {
            "status": "failed",
            "error": result,
            "raw_response": raw
        }


# =============================================================================
# 18. BULK AI WHATSAPP BROADCAST (ALIAS)
# =============================================================================

@router.post("/broadcast-all")
def broadcast_all_whatsapp_alias(
    payload: dict,
    db: Session = Depends(get_db),
):
    """
    Alias for /api/ai-whatsapp/broadcast-all.
    Dispatches bulk AI WhatsApp website outreach messages to multiple shops.
    """
    from app.routers.ai_whatsapp_hub import broadcast_all_whatsapp_shops, BulkWhatsAppBroadcastSchema
    schema = BulkWhatsAppBroadcastSchema(**payload)
    return broadcast_all_whatsapp_shops(payload=schema, db=db)