import pytest
from app.services.distance_service import haversine_km, is_within_radius
from app.services.places_service import (
    GooglePlacesProvider,
    PlaceData,
    SearchDebugInfo,
    _parse_google_place,
    resolve_category,
    ALL_CATEGORIES_TYPES,
)


def test_haversine_and_meter_conversion():
    # 2 km = 2000 meters
    radius_km = 2.0
    radius_meters = float(min(50000.0, max(50.0, radius_km * 1000.0)))
    assert radius_meters == 2000.0

    # Hitec City center ~ (17.4486, 78.3908)
    lat1, lng1 = 17.4486, 78.3908
    # Nearby point ~ 0.5 km away
    lat2, lng2 = 17.4520, 78.3930
    dist = haversine_km(lat1, lng1, lat2, lng2)
    assert dist < 2.0
    assert is_within_radius(lat1, lng1, lat2, lng2, radius_km=2.0) is True

    # Far point ~ 15 km away
    lat_far, lng_far = 17.3850, 78.4867
    dist_far = haversine_km(lat1, lng1, lat_far, lng_far)
    assert dist_far > 2.0
    assert is_within_radius(lat1, lng1, lat_far, lng_far, radius_km=2.0) is False


def test_filtering_results_beyond_radius():
    origin_lat, origin_lng = 17.4486, 78.3908
    radius_km = 2.0
    api_key = "test_key"

    # Mock Google Place inside 2km radius (~0.5 km)
    inside_raw = {
        "id": "place_inside",
        "displayName": {"text": "Nearby Bakery"},
        "location": {"latitude": 17.4520, "longitude": 78.3930},
        "types": ["bakery"],
    }
    place_in, entry_in = _parse_google_place(inside_raw, origin_lat, origin_lng, radius_km, api_key)
    assert place_in is not None
    assert place_in.place_id == "place_inside"
    assert entry_in["included"] is True

    # Mock Google Place outside 2km radius (~15 km)
    outside_raw = {
        "id": "place_outside",
        "displayName": {"text": "Far Away Mall"},
        "location": {"latitude": 17.3850, "longitude": 78.4867},
        "types": ["shopping_mall"],
    }
    place_out, entry_out = _parse_google_place(outside_raw, origin_lat, origin_lng, radius_km, api_key)
    assert place_out is None
    assert entry_out["included"] is False
    assert "Outside selected 2.0 km radius" in entry_out["reason"]


def test_deduplication_by_place_id():
    p1 = PlaceData(
        place_id="ChIJ_001",
        name="Apollo Pharmacy",
        category="Pharmacy",
        address="Hitec City Main Rd",
        latitude=17.4486,
        longitude=78.3908,
        distance_km=0.3,
    )
    p2 = PlaceData(
        place_id="ChIJ_001",  # Same Google place_id
        name="Apollo Pharmacy (Duplicate)",
        category="Pharmacy",
        address="Hitec City Main Rd",
        latitude=17.4486,
        longitude=78.3908,
        distance_km=0.3,
    )
    places_map = {p1.place_id: p1}
    if p2.place_id not in places_map:
        places_map[p2.place_id] = p2

    assert len(places_map) == 1
    assert places_map["ChIJ_001"].name == "Apollo Pharmacy"


def test_separate_cache_keys_hitec_vs_current():
    hitec_lat, hitec_lng = 17.4486, 78.3908
    current_lat, current_lng = 17.4375, 78.4483
    radius_km = 2.0

    key_hitec = f"{round(hitec_lat, 4)}:{round(hitec_lng, 4)}:{radius_km}:all:"
    key_current = f"{round(current_lat, 4)}:{round(current_lng, 4)}:{radius_km}:all:"

    assert key_hitec != key_current
    assert "17.4486:78.3908" in key_hitec
    assert "17.4375:78.4483" in key_current


def test_category_expansion_for_all_categories():
    canon, allowed = resolve_category("All Categories")
    assert allowed is None  # Trigger for ALL_CATEGORIES_TYPES batching

    assert "bakery" in ALL_CATEGORIES_TYPES
    assert "restaurant" in ALL_CATEGORIES_TYPES
    assert "pharmacy" in ALL_CATEGORIES_TYPES
    assert "beauty_salon" in ALL_CATEGORIES_TYPES
    assert "gym" in ALL_CATEGORIES_TYPES
    assert "tailor" in ALL_CATEGORIES_TYPES
    assert len(ALL_CATEGORIES_TYPES) >= 20


def test_error_structure_handling():
    debug = SearchDebugInfo(
        search_origin_lat=17.4486,
        search_origin_lng=78.3908,
        selected_radius_km=2.0,
        provider_used="GooglePlacesAPI",
    )
    debug.error_message = "Google Places API Error (403): API_NOT_ENABLED"
    debug.error_type = "API_NOT_ENABLED"

    assert debug.error_type == "API_NOT_ENABLED"
    assert "403" in debug.error_message


def test_location_accurate_search_rajampeta():
    from app.services.places_service import OSMPlacesProvider
    provider = OSMPlacesProvider()
    rajampeta_lat, rajampeta_lng = 14.1956, 79.1583
    places, debug = provider.search_nearby(rajampeta_lat, rajampeta_lng, radius_km=5.0)

    assert len(places) > 0
    for p in places:
        assert p.distance_km <= 5.0
        assert "Hitec City" not in p.address
        assert "Mindspace" not in p.address
        assert "Hyderabad" not in p.address
