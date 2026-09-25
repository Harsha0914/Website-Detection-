import httpx
from app.services.verified_shops_data import VERIFIED_REGIONAL_PLACES
from app.services.distance_service import haversine_km
from app.services.places_service import _get_db_real_places, OSMPlacesProvider, generate_gps_centered_places

lat, lng = 14.4426, 79.9865

print("--- 1. VERIFIED PLACES ---")
all_vp = [p for p in VERIFIED_REGIONAL_PLACES if haversine_km(lat, lng, p.get("latitude", 0), p.get("longitude", 0)) <= 10.0]
print(f"Total within 10km: {len(all_vp)}")
within_2km_all = [p for p in all_vp if haversine_km(lat, lng, p.get("latitude", 0), p.get("longitude", 0)) <= 2.0]
print(f"Total within 2km (all categories): {len(within_2km_all)}")

restaurants_2km = [p for p in within_2km_all if p.get("category") == "Restaurant"]
print(f"Restaurants within 2km: {len(restaurants_2km)}")
for r in restaurants_2km:
    d = haversine_km(lat, lng, r["latitude"], r["longitude"])
    print(f" - {r['name']} ({d:.2f} km)")

restaurants_10km = [p for p in all_vp if p.get("category") == "Restaurant"]
print(f"Restaurants within 10km: {len(restaurants_10km)}")

print("\n--- 2. OSM LIVE QUERY ---")
prov = OSMPlacesProvider()
p_2km, d_2km = prov.search_nearby(lat, lng, 2.0, category="Restaurant")
print(f"search_nearby(2km, Restaurant): {len(p_2km)} results")

p_2km_all, d_2km_all = prov.search_nearby(lat, lng, 2.0, category=None)
print(f"search_nearby(2km, All Categories): {len(p_2km_all)} results")

p_10km, d_10km = prov.search_nearby(lat, lng, 10.0, category="Restaurant")
print(f"search_nearby(10km, Restaurant): {len(p_10km)} results")
