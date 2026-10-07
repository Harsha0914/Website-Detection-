import os
import sys
import sqlite3
import pymongo
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.config import settings

def clean_and_sync_mongo():
    uri = os.environ.get("MONGODB_URI") or settings.MONGODB_URI
    db_name = os.environ.get("MONGODB_DB_NAME") or settings.MONGODB_DB_NAME or "shop_presence"
    print(f"Connecting to MongoDB Atlas: (DB: {db_name})...")
    
    try:
        client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=8000)
        db = client[db_name]
        
        collections_to_clear = [
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
        
        for coll in collections_to_clear:
            res = db[coll].delete_many({})
            print(f"  [MONGODB CLEARED] Collection '{coll}': removed {res.deleted_count} documents.")
            
        # Re-sync sqlite whatsapp_templates to mongo
        sqlite_path = backend_dir / "shop.db"
        if sqlite_path.exists():
            conn = sqlite3.connect(sqlite_path)
            conn.row_factory = sqlite3.Row
            rows = conn.execute("SELECT * FROM whatsapp_templates").fetchall()
            for r in rows:
                doc = dict(r)
                db["whatsapp_templates"].update_one({"id": doc["id"]}, {"$set": doc}, upsert=True)
            print(f"  [MONGODB SYNCED] Seeded new whatsapp_templates: {len(rows)} record(s).")
            conn.close()

        print("[OK] MongoDB Atlas WhatsApp collections cleaned and synchronized.")
        client.close()
    except Exception as e:
        print(f"[MONGODB NOTE] Could not connect to Atlas or sync: {e}")

if __name__ == "__main__":
    clean_and_sync_mongo()
