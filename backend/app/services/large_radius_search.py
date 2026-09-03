import math
from typing import Optional
from app.services.distance_service import haversine_km
from app.services.places_service import PlacesProvider, PlaceData, SearchDebugInfo


def generate_search_centers(lat: float, lng: float, radius_km: float, max_api_radius: float = 50.0) -> list[tuple[float, float]]:
    """
    Generates a grid of center coordinates to fully cover a large radius search area using smaller circles.
    """
    if radius_km <= max_api_radius:
        return [(lat, lng)]
        
    centers = []
    # Square grid spacing d = r * sqrt(2) guarantees full coverage by circles of radius r
    spacing_km = max_api_radius * math.sqrt(2)
    
    # 1 degree of latitude is ~111.32 km
    lat_degree_km = 111.32
    # 1 degree of longitude is ~111.32 * cos(lat) km
    lng_degree_km = 111.32 * math.cos(math.radians(lat))
    
    spacing_lat = spacing_km / lat_degree_km
    spacing_lng = spacing_km / lng_degree_km if lng_degree_km != 0 else spacing_km / lat_degree_km

    # Number of steps in each direction
    steps = int(math.ceil(radius_km / spacing_km))
    
    for i in range(-steps, steps + 1):
        for j in range(-steps, steps + 1):
            center_lat = lat + (i * spacing_lat)
            center_lng = lng + (j * spacing_lng)
            
            dist_to_center = haversine_km(lat, lng, center_lat, center_lng)
            if dist_to_center <= radius_km:
                centers.append((center_lat, center_lng))
                
    return centers


def search_large_area(
    provider: PlacesProvider,
    latitude: float,
    longitude: float,
    radius_km: float,
    category: Optional[str] = None,
    keyword: Optional[str] = None
) -> tuple[list[PlaceData], SearchDebugInfo]:
    """
    Executes a large radius search by dispatching multiple queries and deduplicating.
    Calculates the exact distance of each place from the ORIGINAL latitude/longitude.
    Filters out any places that fall outside the true requested radius_km.
    Returns (places, combined_debug_info).
    """
    max_supported_radius = 50.0
    centers = generate_search_centers(latitude, longitude, radius_km, max_api_radius=max_supported_radius)
    
    combined_debug = SearchDebugInfo(
        search_origin_lat=latitude,
        search_origin_lng=longitude,
        selected_radius_km=radius_km,
        provider_used="large_area_search",
    )
    all_places_dict: dict[str, PlaceData] = {}
    
    for c_lat, c_lng in centers:
        search_radius = min(radius_km, max_supported_radius)
        
        try:
            places, sub_debug = provider.search_nearby(
                latitude=c_lat,
                longitude=c_lng,
                radius_km=search_radius,
                category=category,
                keyword=keyword
            )
            
            combined_debug.google_api_raw_count += sub_debug.google_api_raw_count

            for p in places:
                p_status = (p.business_status or "OPERATIONAL").upper().strip()
                if p_status in ("CLOSED_PERMANENTLY", "PERMANENTLY_CLOSED", "CLOSED"):
                    continue

                if p.place_id not in all_places_dict:
                    # Recalculate distance from the TRUE original origin (not sub-center)
                    true_distance = haversine_km(latitude, longitude, p.latitude, p.longitude)
                    if true_distance <= radius_km:
                        p.distance_km = round(true_distance, 3)
                        all_places_dict[p.place_id] = p
                        
        except Exception as e:
            print(f"Error during large radius sub-search at ({c_lat}, {c_lng}): {e}")
            continue

    results = sorted(all_places_dict.values(), key=lambda p: p.distance_km or 0)
    combined_debug.results_after_filter = len(results)
    combined_debug.rejected_count = combined_debug.google_api_raw_count - len(results)
    return results, combined_debug
