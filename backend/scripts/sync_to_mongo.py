import os
import sys
import sqlite3
import pymongo
from pymongo import UpdateOne
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.config import settings

def sync():
    uri = os.environ.get("MONGODB_URI") or settings.MONGODB_URI
    db_name = os.environ.get("MONGODB_DB_NAME") or settings.MONGODB_DB_NAME or "shop_presence"
    print(f"Connecting to MongoDB: {uri.split('@')[-1] if '@' in uri else uri} (DB: {db_name})...")
    
    client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=8000)
    db = client[db_name]
    
    # Test ping
    db.command("ping")
    print("Connected successfully to MongoDB Atlas!")
    
    # Ensure indexes
    print("Ensuring indexes on 'businesses' collection...")
    db.businesses.create_index([("external_place_id", pymongo.ASCENDING)], unique=True, sparse=True)
    db.businesses.create_index([("location", pymongo.GEOSPHERE)])
    db.businesses.create_index([("name", pymongo.TEXT), ("category", pymongo.TEXT), ("address", pymongo.TEXT)])
    db.businesses.create_index([("category", pymongo.ASCENDING)])
    
    # Connect to SQLite
    sqlite_candidates = [
        backend_dir / "shop.db",
        backend_dir.parent / "shop.db",
    ]
    existing = [c for c in sqlite_candidates if c.is_file()]
    if not existing:
        print("No SQLite shop.db found to sync.")
        return
        
    sqlite_path = max(existing, key=lambda p: p.stat().st_size)
    print(f"Reading from SQLite database: {sqlite_path}...")
    
    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    # Sync businesses
    cur.execute("SELECT * FROM businesses")
    rows = cur.fetchall()
    print(f"Total businesses in SQLite: {len(rows)}")
    
    ops = []
    synced_count = 0
    for r in rows:
        row = dict(r)
        place_id = row.get("external_place_id") or f"id_{row.get('id')}"
        lat = float(row["latitude"]) if row.get("latitude") is not None else None
        lng = float(row["longitude"]) if row.get("longitude") is not None else None
        
        doc = dict(row)
        if lat is not None and lng is not None and -90 <= lat <= 90 and -180 <= lng <= 180:
            doc["location"] = {
                "type": "Point",
                "coordinates": [lng, lat]
            }
        
        ops.append(UpdateOne({"external_place_id": place_id}, {"$set": doc}, upsert=True))
        
        if len(ops) >= 1000:
            db.businesses.bulk_write(ops, ordered=False)
            synced_count += len(ops)
            print(f"Synced {synced_count}/{len(rows)} businesses to MongoDB...")
            ops = []
            
    if ops:
        db.businesses.bulk_write(ops, ordered=False)
        synced_count += len(ops)
        
    print(f"Businesses sync complete: {synced_count} records processed.")
    print(f"Total businesses now in MongoDB 'businesses' collection: {db.businesses.count_documents({})}")
    
    # Sync users
    try:
        cur.execute("SELECT * FROM users")
        user_rows = cur.fetchall()
        user_ops = []
        for ur in user_rows:
            udoc = dict(ur)
            user_ops.append(UpdateOne({"email": udoc.get("email")}, {"$set": udoc}, upsert=True))
        if user_ops:
            db.users.bulk_write(user_ops, ordered=False)
            print(f"Synced {len(user_rows)} users to MongoDB 'users' collection.")
    except Exception as e:
        print(f"User sync note: {e}")
        
    client.close()
    print("Done!")

if __name__ == "__main__":
    sync()
