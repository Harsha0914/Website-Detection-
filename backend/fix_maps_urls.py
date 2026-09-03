import sqlite3

conn = sqlite3.connect(r'shop.db')
cur = conn.cursor()

cur.execute("""
    SELECT id, external_place_id, latitude, longitude, google_maps_uri
    FROM businesses
    WHERE google_maps_uri LIKE '%maps/search%'
       OR google_maps_uri IS NULL
""")
rows = cur.fetchall()
print(f'Found {len(rows)} records to update')

updated = 0
for biz_id, ext_id, lat, lng, uri in rows:
    bad_prefixes = ('dyn_', 'osm_', 'mock_', 'nom_')
    if ext_id and not any(ext_id.startswith(p) for p in bad_prefixes):
        new_uri = f'https://www.google.com/maps/place/?q=place_id:{ext_id}'
    elif lat and lng:
        new_uri = f'https://maps.google.com/?q={lat},{lng}'
    else:
        continue
    cur.execute('UPDATE businesses SET google_maps_uri = ? WHERE id = ?', (new_uri, biz_id))
    updated += 1

conn.commit()
conn.close()
print(f'Updated {updated} records successfully')
