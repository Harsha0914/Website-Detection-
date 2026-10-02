import logging
import time
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple, List
# pyrefly: ignore [missing-import]
import requests
from sqlalchemy.orm import Session
from app.config import settings

logger = logging.getLogger(__name__)


class MrLadWhatsAppClient:
    """
    Client for LexonIT WhatsApp API integration through the Mr LAD API gateway.
    Based on LexonIT WhatsApp API Guide (Sep 2026).
    """

    _cached_token: Optional[str] = None
    _token_expiry: Optional[datetime] = None

    @classmethod
    def _clean_phone(cls, phone_number: str) -> str:
        """
        Normalizes phone numbers to international format with leading '+'
        e.g., '+919876543210' as required by Mr LAD API.
        """
        digits = "".join(c for c in phone_number if c.isdigit())
        if len(digits) == 10:
            digits = "91" + digits
        return f"+{digits}"

    @classmethod
    def get_token(cls, force_refresh: bool = False) -> Tuple[Optional[str], Optional[str]]:
        """
        Retrieves a valid JWT Bearer token for Mr LAD API.
        Uses static token if configured, or logs in via auth endpoint and caches for 6 days.
        Returns: (token, error_message)
        """
        if settings.LAD_API_TOKEN and not force_refresh:
            return settings.LAD_API_TOKEN, None

        now = datetime.utcnow()
        if (
            not force_refresh
            and cls._cached_token
            and cls._token_expiry
            and now < cls._token_expiry
        ):
            return cls._cached_token, None

        auth_base = settings.LAD_AUTH_BASE_URL.rstrip("/")
        email = (settings.LAD_AUTH_EMAIL or "api@lexonit.com").strip().strip('"\'')
        password = (settings.LAD_AUTH_PASSWORD or "").strip().strip('"\'')

        if not password:
            return None, "LAD_AUTH_PASSWORD is not set. Please provide the account password in .env"

        url = f"{auth_base}/api/auth/login"
        payload = {"email": email, "password": password}

        try:
            logger.info(f"[Mr LAD API] Authenticating {email} at {url}...")
            res = requests.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=15,
            )
            if res.status_code == 200:
                data = res.json()
                token = data.get("token") or data.get("access_token") or data.get("jwt")
                if token:
                    cls._cached_token = token
                    cls._token_expiry = now + timedelta(days=6)
                    logger.info("[Mr LAD API] Authentication successful, token cached.")
                    return token, None
                return None, f"Login succeeded but no token in response: {data}"
            else:
                err_text = res.text
                pwd_hint = f"pwd_len={len(password)}, first={password[:2]!r}, last={password[-2:]!r}" if password else "pwd=empty"
                logger.error(f"[Mr LAD API Auth Error {res.status_code}] email={email!r}, {pwd_hint}: {err_text}")
                return None, f"Auth failed with HTTP {res.status_code} (email={email!r}, {pwd_hint}): {err_text}"
        except Exception as e:
            logger.error(f"[Mr LAD API Auth Exception] {e}")
            return None, str(e)

    @classmethod
    def _find_conversation_id(cls, phone: str, token: str) -> Optional[str]:
        """
        Looks up an existing conversation_id for the given phone number.
        Returns None if not found.
        """
        api_base = settings.LAD_API_BASE_URL.rstrip("/")
        h = {"Authorization": f"Bearer {token}"}
        try:
            r = requests.get(f"{api_base}/api/conversations", headers=h, params={"limit": 100}, timeout=10)
            if r.status_code != 200:
                return None
            convs = r.json().get("data", []) if isinstance(r.json(), dict) else r.json()
            digits = "".join(c for c in phone if c.isdigit())
            for c in convs:
                c_phone = "".join(ch for ch in (c.get("phone") or "") if ch.isdigit())
                if c_phone and c_phone.endswith(digits[-10:]):
                    return c["id"]
        except Exception:
            pass
        return None

    @classmethod
    def send_message(
        cls,
        to_phone: str,
        text_body: Optional[str] = None,
        recipient_name: Optional[str] = None,
        template_name: Optional[str] = None,
        language_code: str = "en_US",
        template_parameters: Optional[List[str]] = None,
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Sends an outbound WhatsApp message via Mr LAD API.

        Strategy:
        - For EXISTING conversations: sends free-text directly via
          POST /api/conversations/{id}/messages  {"content": "..."}
          No template needed — works within any active conversation.
        - For NEW contacts: uses POST /api/conversations/send-template-to-members
          to open the conversation (template required by Meta for first contact),
          then immediately sends the real custom text as a follow-up free-text message.
        """
        recipient = cls._clean_phone(to_phone)
        display_name = recipient_name or "Shop Owner"
        chosen_template = template_name or settings.WHATSAPP_DEFAULT_TEMPLATE_NAME or "signup_otp"

        # Check for test mode or missing credentials
        has_creds = bool(settings.LAD_API_TOKEN or settings.LAD_AUTH_PASSWORD)
        if settings.WHATSAPP_IS_TEST_MODE or not has_creds:
            mock_id = f"wamid.LAD_{uuid.uuid4().hex[:16]}"
            logger.info(
                f"[Mr LAD API Simulator] Sent to {recipient} (Name: {display_name}): "
                f"Text: '{text_body[:50] if text_body else '[no text]'}' (ID: {mock_id})"
            )
            return True, mock_id, {
                "success": True,
                "sent": 1,
                "failed": 0,
                "mode": "simulator",
                "results": [{"id": mock_id, "phone": recipient, "status": "simulated_accepted"}]
            }

        token, auth_err = cls.get_token()
        if not token:
            logger.error(f"[Mr LAD API Send Error] Auth failed: {auth_err}")
            return False, f"Authentication error: {auth_err}", None

        api_base = settings.LAD_API_BASE_URL.rstrip("/")
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        # Auto-refresh expired token on 401
        def _post(url: str, payload: dict) -> requests.Response:
            res = requests.post(url, headers=headers, json=payload, timeout=20)
            if res.status_code in (190, 401):
                new_tok, _ = cls.get_token(force_refresh=True)
                if new_tok:
                    headers["Authorization"] = f"Bearer {new_tok}"
                    res = requests.post(url, headers=headers, json=payload, timeout=20)
            return res

        def _send_freetext(conv_id: str, message: str) -> Tuple[bool, str, dict]:
            """
            Send a free-text message into an existing conversation.
            Uses POST /api/conversations/{id}/messages with {"content": "..."}
            """
            res = _post(f"{api_base}/api/conversations/{conv_id}/messages", {"content": message})
            if res.status_code == 200:
                data = res.json()
                if data.get("success"):
                    inner = data.get("data", {})
                    msg_id = inner.get("id") or inner.get("message_id") or f"wamid.LAD_{uuid.uuid4().hex[:12]}"
                    logger.info(f"[Mr LAD API] Free-text sent to {recipient}. ID: {msg_id}")
                    return True, msg_id, data
            err_data = {}
            try:
                err_data = res.json()
            except Exception:
                pass
            err = err_data.get("detail") or err_data.get("error") or res.text
            logger.error(f"[Mr LAD API Free-text Error {res.status_code}] {err}")
            return False, str(err), err_data

        # Build the actual message to show the shop owner
        outbound_message = text_body or (
            f"Hello {display_name}! I am reaching out from Lexon IT. "
            "We noticed your business on our Website Presence Detection platform. "
            "We help local shops build a professional website, improve Google rankings, "
            "and grow their digital presence - at very affordable prices with 100% customer satisfaction. "
            "Interested? Reply YES for a free consultation!"
        )

        try:
            if not language_code or language_code == "en":
                language_code = "en_US"

            # ── Strategy 1: Existing conversation → try free-text directly ──────────
            conv_id = cls._find_conversation_id(recipient, token)
            if conv_id:
                logger.info(f"[Mr LAD API] Existing conversation ({conv_id}). Sending free-text.")
                ok, msg_id, freetext_data = _send_freetext(conv_id, outbound_message)
                if ok:
                    return True, msg_id, freetext_data
                logger.warning(
                    f"[Mr LAD API] Free-text failed for existing conversation {conv_id} ({msg_id}). "
                    "Falling back to template initiation (e.g. outside 24h customer window)..."
                )

            # ── Strategy 2: New contact or expired 24h window → template to open conversation, then free-text ──
            # Step A: Send approved template to create the conversation (Meta requirement for first contact)
            logger.info(f"[Mr LAD API] New contact {recipient}. Opening conversation with template...")
            member_obj: Dict[str, Any] = {"phone": recipient, "name": display_name}
            init_payload = {
                "members": [member_obj],
                "template_name": chosen_template,
                "language_code": language_code,
            }
            res = _post(f"{api_base}/api/conversations/send-template-to-members", init_payload)
            init_data = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}
            if res.status_code != 200 or not (init_data.get("success") or init_data.get("sent", 0) > 0):
                err_text = init_data.get("error") or init_data.get("message") or res.text
                logger.error(f"[Mr LAD API Init Error {res.status_code}] {err_text}")
                return False, f"HTTP {res.status_code}: {err_text}", init_data

            # Step B: Wait briefly, find the new conversation, send the real website detection message
            logger.info("[Mr LAD API] Template sent. Sending website detection message as follow-up...")
            time.sleep(1.5)
            new_conv_id = cls._find_conversation_id(recipient, token)
            if new_conv_id:
                ok, msg_id, freetext_data = _send_freetext(new_conv_id, outbound_message)
                if ok:
                    return True, msg_id, {"init": init_data, "message": freetext_data}
                logger.warning("[Mr LAD API] Free-text follow-up failed, returning template result.")

            # Fallback: return the template send result
            results = init_data.get("results", [])
            msg_id = (results[0].get("message_id") or results[0].get("id") or "") if results else ""
            if not msg_id:
                msg_id = f"wamid.LAD_{uuid.uuid4().hex[:12]}"
            return True, msg_id, init_data

        except Exception as e:
            logger.error(f"[Mr LAD API Send Exception] {e}")
            return False, str(e), None

    @classmethod
    def get_conversations(cls, limit: int = 50, offset: int = 0) -> Tuple[bool, Any]:
        """
        Reads conversation threads: GET {api-base}/api/conversations
        """
        token, auth_err = cls.get_token()
        if not token:
            return False, auth_err

        api_base = settings.LAD_API_BASE_URL.rstrip("/")
        url = f"{api_base}/api/conversations"
        headers = {"Authorization": f"Bearer {token}"}
        params = {"limit": limit, "offset": offset}

        try:
            res = requests.get(url, headers=headers, params=params, timeout=15)
            if res.status_code == 200:
                return True, res.json()
            return False, f"HTTP {res.status_code}: {res.text}"
        except Exception as e:
            return False, str(e)

    @classmethod
    def get_messages(cls, conversation_id: str, limit: int = 50) -> Tuple[bool, Any]:
        """
        Reads messages in a conversation thread:
        GET {api-base}/api/conversations/{id}/messages
        """
        token, auth_err = cls.get_token()
        if not token:
            return False, auth_err

        api_base = settings.LAD_API_BASE_URL.rstrip("/")
        url = f"{api_base}/api/conversations/{conversation_id}/messages"
        headers = {"Authorization": f"Bearer {token}"}
        params = {"limit": limit}

        try:
            res = requests.get(url, headers=headers, params=params, timeout=15)
            if res.status_code == 200:
                return True, res.json()
            return False, f"HTTP {res.status_code}: {res.text}"
        except Exception as e:
            return False, str(e)

    @classmethod
    def sync_recent_conversations(cls, db: Session) -> Dict[str, Any]:
        """
        Polls Mr LAD API for recent conversations and inbound messages,
        saving any new messages into the database and triggering AI response
        processing when new incoming messages from shop owners are found.
        """
        if settings.WHATSAPP_IS_TEST_MODE or not (settings.LAD_API_TOKEN or settings.LAD_AUTH_PASSWORD):
            return {"status": "skipped", "message": "Test mode active or credentials missing"}

        success, conv_data = cls.get_conversations(limit=20)
        if not success:
            logger.error(f"[Mr LAD Sync] Failed to fetch conversations: {conv_data}")
            return {"status": "error", "message": conv_data}

        threads = conv_data.get("data", []) if isinstance(conv_data, dict) else (conv_data if isinstance(conv_data, list) else [])
        synced_threads = 0
        new_inbound_messages = 0

        # Import processing functions lazily to prevent circular imports
        from app.models.whatsapp import WhatsAppConversation, WhatsAppMessage, WhatsAppDirection, WhatsAppSenderType
        from app.services.whatsapp_service import process_incoming_whatsapp_message

        for thread in threads:
            thread_id = str(thread.get("id") or thread.get("_id") or "")
            if not thread_id:
                continue

            customer_phone = thread.get("phone") or thread.get("customer_phone") or thread.get("recipient")
            if not customer_phone:
                continue

            clean_digits = "".join(c for c in str(customer_phone) if c.isdigit())
            if len(clean_digits) == 10:
                clean_digits = "91" + clean_digits

            # Fetch messages in this thread
            ok, msgs_data = cls.get_messages(thread_id, limit=20)
            if not ok:
                continue

            msgs = msgs_data.get("data", []) if isinstance(msgs_data, dict) else (msgs_data if isinstance(msgs_data, list) else [])
            synced_threads += 1

            for m in msgs:
                msg_id = m.get("id") or m.get("wamid") or m.get("_id") or m.get("external_message_id")
                role = (m.get("role") or "").lower()
                direction = (m.get("direction") or "").lower()
                text = (m.get("content") or m.get("text") or m.get("body") or "").strip()
                sender_name = m.get("sender_name") or m.get("name") or thread.get("contact_name") or "Shop Owner"

                # Check if it's inbound (from customer to LexonIT)
                is_inbound = (role == "user") or direction in ("inbound", "incoming", "in") or m.get("from_customer") is True

                if is_inbound and text and msg_id:
                    # Check if already processed
                    existing = db.query(WhatsAppMessage).filter(
                        WhatsAppMessage.external_message_id == str(msg_id)
                    ).first()

                    if not existing:
                        logger.info(f"[Mr LAD Sync] Found new inbound message {msg_id} from {clean_digits}: {text[:30]}")
                        new_inbound_messages += 1
                        try:
                            # Process incoming message to run AI response
                            in_msg, out_msg, handoff = process_incoming_whatsapp_message(
                                db=db,
                                phone_number=clean_digits,
                                message_text=text,
                                sender_name=sender_name,
                            )
                            if in_msg:
                                in_msg.external_message_id = str(msg_id)
                                db.commit()
                        except Exception as proc_err:
                            logger.error(f"[Mr LAD Sync] Error processing incoming message: {proc_err}")

        return {
            "status": "success",
            "synced_threads": synced_threads,
            "new_inbound_messages": new_inbound_messages,
        }
