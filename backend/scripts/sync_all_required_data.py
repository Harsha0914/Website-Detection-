import os
import sys
import sqlite3
import pymongo
from pymongo import UpdateOne
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.config import settings

def sync_all_data():
    uri = os.environ.get("MONGODB_URI") or settings.MONGODB_URI
    db_name = os.environ.get("MONGODB_DB_NAME") or settings.MONGODB_DB_NAME or "shop_presence"
    print(f"Connecting to MongoDB Atlas: (DB: {db_name})...")
    
    client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=8000)
    db = client[db_name]
    
    # 1. Connect to SQLite
    sqlite_candidates = [
        backend_dir / "shop.db",
        backend_dir.parent / "shop.db",
    ]
    existing = [c for c in sqlite_candidates if c.is_file()]
    if not existing:
        print("No SQLite shop.db found.")
        return
        
    sqlite_path = max(existing, key=lambda p: p.stat().st_size)
    print(f"Reading all project tables from SQLite: {sqlite_path}...")
    
    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    tables_to_sync = [
        ("businesses", "external_place_id", "id"),
        ("users", "email", "id"),
        ("website_analysis", "id", "id"),
        ("searches", "id", "id"),
        ("whatsapp_conversations", "id", "id"),
        ("whatsapp_messages", "id", "id"),
        ("business_chat_conversations", "id", "id"),
        ("business_chat_messages", "id", "id"),
        ("conversations", "id", "id"),
        ("messages", "id", "id"),
        ("whatsapp_templates", "id", "id"),
        ("whatsapp_api_settings", "id", "id"),
        ("ai_message_logs", "id", "id"),
    ]
    
    for table, primary_key, fallback_key in tables_to_sync:
        try:
            cur.execute(f'SELECT * FROM "{table}"')
            rows = cur.fetchall()
            if not rows:
                print(f"  [{table}]: 0 rows, skipping.")
                continue
            
            ops = []
            for r in rows:
                doc = dict(r)
                key_val = doc.get(primary_key) or doc.get(fallback_key)
                
                # Special handling for geospatial coordinates in businesses
                if table == "businesses":
                    lat = float(doc["latitude"]) if doc.get("latitude") is not None else None
                    lng = float(doc["longitude"]) if doc.get("longitude") is not None else None
                    if lat is not None and lng is not None and -90 <= lat <= 90 and -180 <= lng <= 180:
                        doc["location"] = {
                            "type": "Point",
                            "coordinates": [lng, lat]
                        }
                
                ops.append(UpdateOne({primary_key: key_val}, {"$set": doc}, upsert=True))
                if len(ops) >= 1000:
                    db[table].bulk_write(ops, ordered=False)
                    ops = []
                    
            if ops:
                db[table].bulk_write(ops, ordered=False)
                
            total_in_mongo = db[table].estimated_document_count()
            print(f"  [OK] [{table}]: Synced {len(rows)} records -> MongoDB collection '{table}' (total: {total_in_mongo})")
        except Exception as e:
            print(f"  [ERROR] syncing table '{table}': {e}")
            
    print("\nAll required project data successfully synced to MongoDB Atlas 'shop_presence'!")
    client.close()

if __name__ == "__main__":
    sync_all_data()
