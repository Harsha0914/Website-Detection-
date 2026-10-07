import sqlite3
import os
import json
from datetime import datetime

NEW_TEMPLATE_BODY = (
    "Hello {shop_name},\n\n"
    "This is Lexon IT. We help businesses grow online by building professional websites, web applications, and mobile apps tailored to their needs.\n\n"
    "We noticed that {shop_name} doesn’t currently have a website. Today, customers often search online before choosing a business or service. A professional online presence can help you showcase your products or services, share important information, build trust, and make it easier for customers to contact you — 24/7.\n\n"
    "Whether you need a simple website, an online booking or ordering system, a custom web application, or a mobile app, our team can build it for you at an affordable price."
)

TEMPLATE_SQL_BODY = (
    "Hello {{shop_name}},\n\n"
    "This is Lexon IT. We help businesses grow online by building professional websites, web applications, and mobile apps tailored to their needs.\n\n"
    "We noticed that {{shop_name}} doesn’t currently have a website. Today, customers often search online before choosing a business or service. A professional online presence can help you showcase your products or services, share important information, build trust, and make it easier for customers to contact you — 24/7.\n\n"
    "Whether you need a simple website, an online booking or ordering system, a custom web application, or a mobile app, our team can build it for you at an affordable price."
)

def reset_whatsapp_and_seed_template():
    db_paths = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "shop.db")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "shop.db")),
    ]

    for db_path in db_paths:
        if not os.path.exists(db_path):
            continue
        print(f"Cleaning WhatsApp messages, conversations, and old templates in: {db_path}...")
        con = sqlite3.connect(db_path)
        cur = con.cursor()

        tables_to_clear = [
            "whatsapp_messages",
            "whatsapp_conversations",
            "whatsapp_templates",
            "whatsapp_campaigns",
            "whatsapp_crm_messages",
            "whatsapp_crm_conversations",
            "campaign_recipients",
            "messages",
            "conversations",
            "business_chat_messages",
            "business_chat_conversations",
            "ai_message_logs",
            "follow_up_schedules",
            "follow_ups",
            "webhook_events",
        ]

        for table in tables_to_clear:
            try:
                cur.execute(f'DELETE FROM "{table}"')
                print(f"  [CLEARED] {table}")
            except Exception as e:
                print(f"  [SKIP] {table}: {e}")

        # Insert new official template into whatsapp_templates
        now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        cur.execute(
            """
            INSERT INTO whatsapp_templates (
                id, name, category, language, header_text, body_text, footer_text, variables_json, buttons_json, meta_status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                1,
                "lexon_official_pitch",
                "MARKETING",
                "en",
                "🌟 Lexon IT Official Website & App Pitch",
                TEMPLATE_SQL_BODY,
                "Lexon IT & Web Solutions",
                json.dumps(["shop_name"]),
                json.dumps([
                    {"type": "QUICK_REPLY", "text": "Interested in Demo"},
                    {"type": "QUICK_REPLY", "text": "Share Pricing Details"}
                ]),
                "APPROVED",
                now,
            )
        )
        print("  [SEEDED] Inserted new official template 'lexon_official_pitch'")

        con.commit()
        con.close()

if __name__ == "__main__":
    reset_whatsapp_and_seed_template()
