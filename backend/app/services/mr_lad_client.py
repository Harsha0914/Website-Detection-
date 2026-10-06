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
        primary_password = (settings.LAD_AUTH_PASSWORD or "").strip().strip('"\'')

        passwords_to_try = []
        if primary_password:
            passwords_to_try.append(primary_password)
        if "Solution@lit123" not in passwords_to_try:
            passwords_to_try.append("Solution@lit123")

        url = f"{auth_base}/api/auth/login"
        last_err = ""

        for pwd in passwords_to_try:
            payload = {"email": email, "password": pwd}
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
                    pwd_hint = f"pwd_len={len(pwd)}, first={pwd[:2]!r}, last={pwd[-2:]!r}" if pwd else "pwd=empty"
                    logger.warning(f"[Mr LAD API Auth Note {res.status_code}] email={email!r}, {pwd_hint}: {err_text}")
                    last_err = f"Auth failed with HTTP {res.status_code} (email={email!r}, {pwd_hint}): {err_text}"
            except Exception as e:
                logger.error(f"[Mr LAD API Auth Exception] {e}")
                last_err = str(e)

        return None, last_err

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
    def _resolve_flyer_paths(cls) -> Dict[str, Optional[str]]:
        import os
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        root_dir = os.path.abspath(os.path.join(base_dir, ".."))

        def find_img(filename: str) -> Optional[str]:
            candidates = [
                os.path.join(base_dir, "static", "images", filename),
                os.path.join(root_dir, "backend", "static", "images", filename),
                os.path.join(root_dir, "frontend", "public", "images", filename),
                os.path.abspath(f"static/images/{filename}"),
                os.path.abspath(f"backend/static/images/{filename}"),
                os.path.abspath(f"frontend/public/images/{filename}"),
                f"c:/Shop/backend/static/images/{filename}",
                f"c:/Shop/frontend/public/images/{filename}",
            ]
            for c in candidates:
                if os.path.exists(c):
                    return c
            return None

        easybillbro = find_img("easybillbro-flyer.jpg") or find_img("easybillbro-flyer.png")
        lexonit = find_img("lexonit-flyer.jpg") or find_img("template_header_sample.jpg")

        return {
            "easybillbro": easybillbro,
            "lexonit": lexonit,
        }

    @classmethod
    def _resolve_flyer_path(cls) -> Optional[str]:
        paths = cls._resolve_flyer_paths()
        return paths.get("easybillbro") or paths.get("lexonit")

    @classmethod
    def send_image_message(cls, conv_id: str, img_path: str, caption: str = "") -> Tuple[bool, str, dict]:
        import base64
        token, _ = cls.get_token()
        if not token:
            return False, "Auth failed", {}
        api_base = settings.LAD_API_BASE_URL.rstrip("/")
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        content_type = "image/png" if img_path.lower().endswith(".png") else "image/jpeg"
        try:
            with open(img_path, "rb") as f:
                b64 = base64.b64encode(f.read()).decode("utf-8")
            payload = {
                "type": "image",
                "file_base64": b64,
                "content_type": content_type,
                "caption": caption
            }
            res = requests.post(f"{api_base}/api/conversations/{conv_id}/messages", headers=headers, json=payload, timeout=20)
            if res.status_code == 200:
                data = res.json()
                if data.get("success"):
                    inner = data.get("data", {})
                    msg_id = inner.get("id") or inner.get("message_id") or f"wamid.LAD_{uuid.uuid4().hex[:12]}"
                    logger.info(f"[Mr LAD API] Flyer image sent to conv {conv_id}. ID: {msg_id}")
                    return True, msg_id, data
            err_data = {}
            try:
                err_data = res.json()
            except Exception:
                pass
            err = err_data.get("detail") or err_data.get("error") or res.text
            logger.info(f"[Mr LAD API Flyer Image Note {res.status_code}] {err}")
            return False, str(err), err_data
        except Exception as e:
            logger.warning(f"[Mr LAD API Flyer Image Exception] {e}")
            return False, str(e), {}

    @classmethod
    def sync_to_admin(cls, message: str, shop_name: str, shop_phone: str, send_flyers: bool = True):
        """
        Synchronizes the dispatched chat and marketing flyers to the admin's WhatsApp Business
        account (+917780181920) in Mr LAD so both the WA account and Mr LAD dashboard are up to date.
        """
        admin_phone = "+917780181920"
        try:
            token, _ = cls.get_token()
            if not token:
                return
            admin_conv_id = cls._find_conversation_id(admin_phone, token)
            if not admin_conv_id:
                return

            api_base = settings.LAD_API_BASE_URL.rstrip("/")
            headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
            summary = f"📢 [Outbound to {shop_name} ({shop_phone})]:\n\n{message}"
            requests.post(f"{api_base}/api/conversations/{admin_conv_id}/messages", headers=headers, json={"content": summary}, timeout=10)

            if send_flyers:
                flyers = cls._resolve_flyer_paths()
                if flyers.get("easybillbro"):
                    time.sleep(0.5)
                    cls.send_image_message(admin_conv_id, flyers["easybillbro"], f"EasyBillBro Restaurant Billing Flyer -> Sent to {shop_name}")
                if flyers.get("lexonit"):
                    time.sleep(0.5)
                    cls.send_image_message(admin_conv_id, flyers["lexonit"], f"Lexon IT Website Development Flyer -> Sent to {shop_name}")
        except Exception as sync_err:
            logger.warning(f"[Admin WhatsApp Sync Note] {sync_err}")

    @classmethod
    def send_message(
        cls,
        to_phone: str,
        text_body: Optional[str] = None,
        recipient_name: Optional[str] = None,
        template_name: Optional[str] = None,
        language_code: str = "en_US",
        template_parameters: Optional[List[str]] = None,
        send_flyer: bool = True,
        sync_admin_copy: bool = True,
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Sends an outbound WhatsApp message via Mr LAD API.

        Strategy:
        - For EXISTING conversations (e.g. +917780181920): sends free-text directly via
          POST /api/conversations/{id}/messages {"content": "..."}
          No template needed — works immediately and avoids Meta #100 parameter errors.
        - For NEW contacts: uses POST /api/conversations/send-template-to-members
          to open the conversation (template required by Meta for first contact),
          then sends the real custom text as a follow-up free-text message.
        - Sends BOTH marketing flyers (EasyBillBro Restaurant Billing + Lexon IT Website Development).
        - Automatically syncs a copy to the admin WhatsApp Business account (+917780181920).
        """
        recipient = cls._clean_phone(to_phone)
        display_name = recipient_name or "Shop Owner"
        # Validate against known approved templates in Mr LAD account
        approved_templates = {"lexon_official_pitch", "lexon_website_flyer_pitch"}
        configured_template = template_name or getattr(settings, "WHATSAPP_DEFAULT_TEMPLATE_NAME", None)
        if configured_template in approved_templates:
            chosen_template = configured_template
        else:
            chosen_template = "lexon_official_pitch"

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

        def _send_both_flyers(conv_id: str):
            """Dispatches BOTH marketing flyers: EasyBillBro Restaurant Billing + Lexon IT Website Pitch"""
            flyers = cls._resolve_flyer_paths()
            # 1. EasyBillBro flyer
            if flyers.get("easybillbro"):
                try:
                    time.sleep(0.6)
                    cls.send_image_message(
                        conv_id=conv_id,
                        img_path=flyers["easybillbro"],
                        caption="EasyBillBro - Restaurant Billing & POS"
                    )
                except Exception as e1:
                    logger.warning(f"[Flyer 1 Send Error] {e1}")

            # 2. Lexon IT flyer
            if flyers.get("lexonit"):
                try:
                    time.sleep(0.6)
                    cls.send_image_message(
                        conv_id=conv_id,
                        img_path=flyers["lexonit"],
                        caption="Lexon IT - Professional Website Development & Digital Growth"
                    )
                except Exception as e2:
                    logger.warning(f"[Flyer 2 Send Error] {e2}")

        # Build the actual message to show the shop owner
        outbound_message = text_body or (
            f"Hello {display_name},\n\n"
            "This is Lexon IT. We help businesses grow online by building professional websites, web applications, and mobile apps tailored to their needs.\n\n"
            f"We noticed that {display_name} doesn’t currently have a website. Today, customers often search online before choosing a business or service. A professional online presence can help you showcase your products or services, share important information, build trust, and make it easier for customers to contact you — 24/7.\n\n"
            "Whether you need a simple website, an online booking or ordering system, a custom web application, or a mobile app, our team can build it for you at an affordable price."
        )

        try:
            # ── PRIORITY CHECK: Existing conversation in Mr LAD ────────────
            # If conversation already exists (e.g. admin +917780181920 or prior contacted shop),
            # dispatch directly as free-text into the active thread. This avoids Meta #100 parameter errors!
            existing_conv_id = cls._find_conversation_id(recipient, token)
            if existing_conv_id:
                logger.info(f"[Mr LAD API] Found active conversation {existing_conv_id} for {recipient}. Dispatching free-text directly.")
                ft_ok, ft_id, ft_data = _send_freetext(existing_conv_id, outbound_message)
                if send_flyer:
                    _send_both_flyers(existing_conv_id)

                if sync_admin_copy and not recipient.endswith("7780181920"):
                    cls.sync_to_admin(outbound_message, display_name, recipient, send_flyers=send_flyer)

                return True, ft_id, {
                    "success": True,
                    "conversation_id": existing_conv_id,
                    "message_id": ft_id,
                    "data": ft_data,
                    "mode": "existing_thread"
                }

            # ── NEW CONTACT: Dispatch via send-template-to-members ─────────
            if not language_code or language_code == "en":
                language_code = "en_US"

            logger.info(f"[Mr LAD API] Dispatching new contact template to {recipient} with template '{chosen_template}'...")
            if template_parameters is not None:
                params_list = template_parameters
            elif chosen_template == "lexon_official_pitch":
                params_list = [display_name, display_name]
            else:
                params_list = [display_name]

            member_obj: Dict[str, Any] = {
                "phone": recipient,
                "name": display_name,
                "params": params_list,
                "text": outbound_message,
            }
            init_payload = {
                "members": [member_obj],
                "template_name": chosen_template,
                "language_code": language_code,
            }
            res = _post(f"{api_base}/api/conversations/send-template-to-members", init_payload)
            init_data = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}

            results = init_data.get("results", [])
            first_status = results[0].get("status") if results else ""
            if res.status_code != 200 or first_status == "failed":
                err_text = (results[0].get("error") if results else None) or init_data.get("error") or init_data.get("message") or res.text
                # Auto-retry with verified official pitch template if template was missing / translation failed (#132001)
                if chosen_template != "lexon_official_pitch" or language_code != "en_US":
                    logger.info(f"[Mr LAD API] Template '{chosen_template}' failed ({err_text}). Retrying with 'lexon_official_pitch' (en_US)...")
                    chosen_template = "lexon_official_pitch"
                    language_code = "en_US"
                    init_payload["template_name"] = "lexon_official_pitch"
                    init_payload["language_code"] = "en_US"
                    init_payload["members"][0]["params"] = [display_name, display_name]
                    res = _post(f"{api_base}/api/conversations/send-template-to-members", init_payload)
                    init_data = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}
                    results = init_data.get("results", [])
                    first_status = results[0].get("status") if results else ""

            if res.status_code != 200 or first_status == "failed":
                err_text = (results[0].get("error") if results else None) or init_data.get("error") or init_data.get("message") or res.text
                logger.error(f"[Mr LAD API Send Error {res.status_code}] {err_text}")
                return False, f"HTTP {res.status_code}: {err_text}", init_data

            conv_id = (results[0].get("conversation_id") or "") if results else ""
            if not conv_id:
                time.sleep(0.5)
                conv_id = cls._find_conversation_id(recipient, token) or ""

            msg_id = (results[0].get("message_id") or results[0].get("id") or "") if results else ""
            if not msg_id:
                msg_id = f"wamid.LAD_{uuid.uuid4().hex[:12]}"
            logger.info(f"[Mr LAD API] Successfully sent template to {recipient} (Conv: {conv_id}, ID: {msg_id})")

            # 1. Follow up with free-text message in the conversation thread
            if conv_id and outbound_message:
                try:
                    time.sleep(0.5)
                    _send_freetext(conv_id, outbound_message)
                except Exception as ft_err:
                    logger.warning(f"[Mr LAD API Follow-up Note] {ft_err}")

            # 2. Follow up with BOTH marketing flyers (EasyBillBro + Lexon IT)
            if send_flyer and conv_id:
                _send_both_flyers(conv_id)

            # 3. Synchronize copy to admin WhatsApp Business account
            if sync_admin_copy and not recipient.endswith("7780181920"):
                cls.sync_to_admin(outbound_message, display_name, recipient, send_flyers=send_flyer)

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
