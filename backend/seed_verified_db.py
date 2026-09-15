import sqlite3
import os
from datetime import datetime
from app.services.verified_shops_data import VERIFIED_REGIONAL_PLACES

db_paths = [r"c:\Shop\shop.db", r"c:\Shop\backend\shop.db"]
for p in db_paths:
    if not os.path.exists(p):
        continue
    conn = sqlite3.connect(p)
    cur = conn.cursor()
    inserted = 0
    updated = 0
    for vp in VERIFIED_REGIONAL_PLACES:
        pid = vp["place_id"]
        cur.execute("SELECT id FROM businesses WHERE external_place_id = ?", (pid,))
        row = cur.fetchone()
        gmaps_uri = f"https://maps.google.com/?q={vp['latitude']},{vp['longitude']}"
        web_status = "WEBSITE_AVAILABLE" if vp.get("website_url") else "NO_WEBSITE"
        web_quality = "UNANALYZED"
        web_score = 75 if vp.get("website_url") else 0
        now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

        if row:
            cur.execute("""
                UPDATE businesses
                SET name = ?, category = ?, address = ?, short_address = ?, google_maps_uri = ?,
                    latitude = ?, longitude = ?, phone = ?, website_url = ?, rating = ?, review_count = ?,
                    business_status = 'OPERATIONAL', website_status = ?, website_quality = ?, website_score = ?
                WHERE external_place_id = ?
            """, (vp["name"], vp["category"], vp["address"], vp.get("short_address", vp["address"]),
                  gmaps_uri, vp["latitude"], vp["longitude"], vp.get("phone"), vp.get("website_url"),
                  vp.get("rating"), vp.get("review_count"), web_status, web_quality, web_score, pid))
            updated += 1
        else:
            cur.execute("""
                INSERT INTO businesses (
                    external_place_id, name, category, address, short_address, google_maps_uri,
                    latitude, longitude, phone, website_url, rating, review_count, business_status,
                    website_status, website_quality, website_score, source, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPERATIONAL', ?, ?, ?, 'verified_seed', ?, ?)
            """, (pid, vp["name"], vp["category"], vp["address"], vp.get("short_address", vp["address"]),
                  gmaps_uri, vp["latitude"], vp["longitude"], vp.get("phone"), vp.get("website_url"),
                  vp.get("rating"), vp.get("review_count"), web_status, web_quality, web_score, now, now))
            inserted += 1
    conn.commit()
    cur.execute("SELECT COUNT(*) FROM businesses")
    total = cur.fetchone()[0]
    conn.close()
    print(f"Synced {p}: {inserted} inserted, {updated} updated, Total businesses: {total}")
