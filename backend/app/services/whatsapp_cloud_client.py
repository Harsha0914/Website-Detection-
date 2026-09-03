import json
import uuid
import logging
from typing import Dict, Any, Optional, Tuple
# pyrefly: ignore [missing-import]
import requests
from sqlalchemy.orm import Session
from app.models.whatsapp_crm import WhatsAppApiSettings

logger = logging.getLogger(__name__)


def get_whatsapp_settings(db: Session) -> WhatsAppApiSettings:
    """
    Retrieves or creates default WhatsApp Cloud API settings.
    """
    settings = db.query(WhatsAppApiSettings).first()
    if not settings:
        settings = WhatsAppApiSettings(
            meta_app_id="",
            meta_app_secret="",
            business_account_id="",
            phone_number_id="",
            access_token="",
            webhook_verify_token="shoppresence_whatsapp_webhook_token_123",
            api_version="v21.0",
            is_test_mode=True,
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


class WhatsAppCloudClient:
    """
    Official Meta WhatsApp Cloud API client.
    Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
    """

    @staticmethod
    def _clean_phone(phone_number: str) -> str:
        """
        Normalizes phone number to digits only with country code (e.g., 919876543210).
        """
        cleaned = "".join(c for c in phone_number if c.isdigit())
        if len(cleaned) == 10:  # Default India code 91 if missing
            cleaned = "91" + cleaned
        return cleaned

    @classmethod
    def send_text(
        cls,
        db: Session,
        to_phone: str,
        text_body: str,
        preview_url: bool = True,
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Sends standard text message via Meta Cloud API.
        Returns: (success: bool, wamid_or_error: str, raw_response: dict)
        """
        settings = get_whatsapp_settings(db)
        recipient = cls._clean_phone(to_phone)

        # Test Mode / Sandbox Simulation
        if settings.is_test_mode or not settings.access_token or not settings.phone_number_id:
            mock_wamid = f"wamid.HBgL{uuid.uuid4().hex[:16]}="
            logger.info(f"[Meta Cloud API Simulator] Sent TEXT to {recipient}: {text_body[:40]}... (ID: {mock_wamid})")
            return True, mock_wamid, {"messaging_product": "whatsapp", "messages": [{"id": mock_wamid}]}

        url = f"https://graph.facebook.com/{settings.api_version}/{settings.phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {settings.access_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": recipient,
            "type": "text",
            "text": {
                "preview_url": preview_url,
                "body": text_body,
            },
        }

        try:
            res = requests.post(url, headers=headers, json=payload, timeout=15)
            data = res.json()
            if res.status_code == 200 and "messages" in data and len(data["messages"]) > 0:
                wamid = data["messages"][0]["id"]
                return True, wamid, data
            else:
                err_msg = data.get("error", {}).get("message", res.text)
                logger.error(f"[Meta Cloud API Error] {err_msg}")
                return False, err_msg, data
        except Exception as e:
            logger.error(f"[Meta Cloud API Exception] {e}")
            return False, str(e), None

    @classmethod
    def send_template(
        cls,
        db: Session,
        to_phone: str,
        template_name: str,
        language_code: str = "en",
        variables: Optional[Dict[str, Any]] = None,
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Sends approved Meta WhatsApp Template message with variable replacement.
        """
        settings = get_whatsapp_settings(db)
        recipient = cls._clean_phone(to_phone)

        # Format variables into body components
        body_parameters = []
        if variables:
            for k, v in variables.items():
                body_parameters.append({"type": "text", "text": str(v)})

        components = []
        if body_parameters:
            components.append({"type": "body", "parameters": body_parameters})

        if settings.is_test_mode or not settings.access_token or not settings.phone_number_id:
            mock_wamid = f"wamid.HBgL{uuid.uuid4().hex[:16]}="
            logger.info(f"[Meta Cloud API Simulator] Sent TEMPLATE '{template_name}' to {recipient} (ID: {mock_wamid})")
            return True, mock_wamid, {"messaging_product": "whatsapp", "messages": [{"id": mock_wamid}]}

        url = f"https://graph.facebook.com/{settings.api_version}/{settings.phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {settings.access_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": recipient,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": language_code},
                "components": components,
            },
        }

        try:
            res = requests.post(url, headers=headers, json=payload, timeout=15)
            data = res.json()
            if res.status_code == 200 and "messages" in data and len(data["messages"]) > 0:
                wamid = data["messages"][0]["id"]
                return True, wamid, data
            else:
                err_msg = data.get("error", {}).get("message", res.text)
                logger.error(f"[Meta Cloud API Error] {err_msg}")
                return False, err_msg, data
        except Exception as e:
            logger.error(f"[Meta Cloud API Exception] {e}")
            return False, str(e), None

    @classmethod
    def send_media(
        cls,
        db: Session,
        to_phone: str,
        media_type: str,  # image, document
        media_url: str,
        caption: Optional[str] = None,
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Sends image/document media message.
        """
        settings = get_whatsapp_settings(db)
        recipient = cls._clean_phone(to_phone)

        if settings.is_test_mode or not settings.access_token or not settings.phone_number_id:
            mock_wamid = f"wamid.HBgL{uuid.uuid4().hex[:16]}="
            logger.info(f"[Meta Cloud API Simulator] Sent MEDIA ({media_type}) to {recipient} (ID: {mock_wamid})")
            return True, mock_wamid, {"messaging_product": "whatsapp", "messages": [{"id": mock_wamid}]}

        url = f"https://graph.facebook.com/{settings.api_version}/{settings.phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {settings.access_token}",
            "Content-Type": "application/json",
        }
        media_payload = {"link": media_url}
        if caption:
            media_payload["caption"] = caption

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": recipient,
            "type": media_type,
            media_type: media_payload,
        }

        try:
            res = requests.post(url, headers=headers, json=payload, timeout=15)
            data = res.json()
            if res.status_code == 200 and "messages" in data and len(data["messages"]) > 0:
                wamid = data["messages"][0]["id"]
                return True, wamid, data
            else:
                err_msg = data.get("error", {}).get("message", res.text)
                return False, err_msg, data
        except Exception as e:
            return False, str(e), None
