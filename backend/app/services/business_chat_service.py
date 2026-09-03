from datetime import datetime
from typing import List, Optional
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from app.models.business_chat import (
    BusinessChatConversation,
    BusinessChatMessage,
    BusinessChatSender,
    ConversationStatus,
)
from app.models.business import Business
from app.models.user import User


def get_or_create_business_conversation(
    db: Session,
    business_id: int,
    user: Optional[User] = None,
    customer_name: Optional[str] = None,
    customer_phone: Optional[str] = None,
    customer_email: Optional[str] = None,
    subject: Optional[str] = "Direct Inquiry",
    initial_message: Optional[str] = None,
) -> BusinessChatConversation:
    """
    Finds an existing active conversation for this user and business, or creates a new one.
    """
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise ValueError("Business not found")

    conv = None
    if user:
        conv = (
            db.query(BusinessChatConversation)
            .filter(
                BusinessChatConversation.business_id == business_id,
                BusinessChatConversation.customer_id == user.id,
                BusinessChatConversation.status == ConversationStatus.ACTIVE,
            )
            .first()
        )

    if not conv:
        c_name = customer_name or (user.full_name if user else "Local Customer")
        c_phone = customer_phone or (user.phone if user else None)
        c_email = customer_email or (user.email if user else None)

        conv = BusinessChatConversation(
            business_id=business_id,
            customer_id=user.id if user else None,
            customer_name=c_name,
            customer_phone=c_phone,
            customer_email=c_email,
            subject=subject or f"Inquiry for {biz.name}",
            status=ConversationStatus.ACTIVE,
            unread_by_owner_count=0,
            unread_by_customer_count=0,
            last_message_at=datetime.utcnow(),
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

        # Welcome message from Shop Owner
        welcome_text = (
            f"Hello! Welcome to **{biz.name}**'s direct business line. "
            f"I am the store manager/owner. Send us any inquiry regarding our products, "
            f"opening hours, delivery, or custom orders, and we'll reply directly!"
        )
        welcome_msg = BusinessChatMessage(
            conversation_id=conv.id,
            sender_type=BusinessChatSender.SHOP_OWNER,
            sender_name=f"{biz.name} (Store Owner)",
            message_text=welcome_text,
            is_read=True,
            created_at=datetime.utcnow(),
        )
        db.add(welcome_msg)
        conv.last_message_text = welcome_text
        conv.last_message_at = datetime.utcnow()
        db.commit()
        db.refresh(conv)

    if initial_message:
        send_customer_message(
            db=db,
            conversation=conv,
            message_text=initial_message,
            sender_user=user,
            sender_name=customer_name or (user.full_name if user else "Customer"),
        )

    return conv


def send_customer_message(
    db: Session,
    conversation: BusinessChatConversation,
    message_text: str,
    sender_user: Optional[User] = None,
    sender_name: Optional[str] = None,
) -> BusinessChatMessage:
    """
    Appends a message from the customer to the shop owner.
    """
    name = sender_name or (sender_user.full_name if sender_user else conversation.customer_name or "Customer")
    
    msg = BusinessChatMessage(
        conversation_id=conversation.id,
        sender_type=BusinessChatSender.CUSTOMER,
        sender_id=sender_user.id if sender_user else None,
        sender_name=name,
        message_text=message_text,
        is_read=False,
        created_at=datetime.utcnow(),
    )
    db.add(msg)
    
    conversation.last_message_text = message_text
    conversation.last_message_at = datetime.utcnow()
    conversation.unread_by_owner_count = (conversation.unread_by_owner_count or 0) + 1
    conversation.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(msg)
    db.refresh(conversation)
    return msg


def send_owner_reply(
    db: Session,
    conversation: BusinessChatConversation,
    reply_text: str,
    sender_user: Optional[User] = None,
    sender_name: Optional[str] = None,
) -> BusinessChatMessage:
    """
    Appends a reply from the shop owner to the customer.
    """
    biz = conversation.business
    biz_name = biz.name if biz else "Shop"
    default_name = f"{biz_name} Owner"
    name = sender_name or (sender_user.full_name if sender_user else default_name)

    msg = BusinessChatMessage(
        conversation_id=conversation.id,
        sender_type=BusinessChatSender.SHOP_OWNER,
        sender_id=sender_user.id if sender_user else None,
        sender_name=name,
        message_text=reply_text,
        is_read=False,
        created_at=datetime.utcnow(),
    )
    db.add(msg)
    
    conversation.last_message_text = reply_text
    conversation.last_message_at = datetime.utcnow()
    conversation.unread_by_customer_count = (conversation.unread_by_customer_count or 0) + 1
    conversation.unread_by_owner_count = 0  # Owner just replied
    conversation.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(msg)
    db.refresh(conversation)
    return msg


def mark_conversation_as_read(
    db: Session,
    conversation: BusinessChatConversation,
    reader: str = "CUSTOMER",
) -> None:
    """
    Marks messages as read for either customer or shop owner.
    """
    if reader == "CUSTOMER":
        conversation.unread_by_customer_count = 0
        db.query(BusinessChatMessage).filter(
            BusinessChatMessage.conversation_id == conversation.id,
            BusinessChatMessage.sender_type != BusinessChatSender.CUSTOMER,
            BusinessChatMessage.is_read == False,
        ).update({"is_read": True})
    else:
        conversation.unread_by_owner_count = 0
        db.query(BusinessChatMessage).filter(
            BusinessChatMessage.conversation_id == conversation.id,
            BusinessChatMessage.sender_type == BusinessChatSender.CUSTOMER,
            BusinessChatMessage.is_read == False,
        ).update({"is_read": True})
    
    db.commit()
    db.refresh(conversation)


def simulate_owner_quick_response(
    db: Session,
    conversation: BusinessChatConversation,
    custom_text: Optional[str] = None,
) -> BusinessChatMessage:
    """
    Simulates a realistic, professional direct reply from the shop owner.
    Useful for testing, demos, or automated instant-acknowledgments.
    """
    biz = conversation.business
    biz_name = biz.name if biz else "our store"
    
    if custom_text:
        reply_body = custom_text
    else:
        last_cust_msg = (
            db.query(BusinessChatMessage)
            .filter(
                BusinessChatMessage.conversation_id == conversation.id,
                BusinessChatMessage.sender_type == BusinessChatSender.CUSTOMER,
            )
            .order_by(BusinessChatMessage.created_at.desc())
            .first()
        )
        msg_lower = (last_cust_msg.message_text.lower() if last_cust_msg else "")
        
        if "website" in msg_lower or "online" in msg_lower or "catalog" in msg_lower:
            reply_body = (
                f"Hello! Thank you for reaching out regarding online presence for **{biz_name}**. "
                f"We are interested in setting up a digital catalog and website. "
                f"Please share the package proposal and pricing breakdown, and we will review it immediately."
            )
        elif "price" in msg_lower or "cost" in msg_lower or "quote" in msg_lower:
            reply_body = (
                f"Thanks for asking! Our prices are updated daily and we offer local discounts. "
                f"Feel free to let us know the exact items or services you're looking for."
            )
        elif "time" in msg_lower or "hour" in msg_lower or "open" in msg_lower:
            reply_body = (
                f"We are open today! Feel free to visit **{biz_name}** or place an order for quick pickup."
            )
        elif "deliver" in msg_lower or "order" in msg_lower:
            reply_body = (
                f"Yes, local delivery is available within our neighborhood. "
                f"Send us your list of items and address, and we will confirm delivery ETA."
            )
        else:
            reply_body = (
                f"Hi! Thanks for your message to **{biz_name}**. "
                f"We have received your inquiry and are happy to assist you. Let us know how we can help!"
            )

    return send_owner_reply(
        db=db,
        conversation=conversation,
        reply_text=reply_body,
        sender_name=f"{biz_name} (Store Owner)",
    )
