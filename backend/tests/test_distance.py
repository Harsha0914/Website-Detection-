from app.services.distance_service import haversine_km, is_within_radius

def test_haversine_same_point():
    assert haversine_km(12.9716, 77.5946, 12.9716, 77.5946) == 0.0

def test_haversine_known_distance():
    # Distance between Bangalore (12.9716, 77.5946) and Mysore (12.2958, 76.6394) is ~128 km
    dist = haversine_km(12.9716, 77.5946, 12.2958, 76.6394)
    assert 120 < dist < 140

def test_is_within_radius():
    assert is_within_radius(12.9716, 77.5946, 12.9720, 77.5950, radius_km=1.0) is True
    assert is_within_radius(12.9716, 77.5946, 13.5000, 78.5000, radius_km=5.0) is False
