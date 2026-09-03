import pytest

def test_get_nearby_businesses(client, user_token):
    response = client.get(
        "/api/businesses/nearby?latitude=12.9716&longitude=77.5946&radius_km=10",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "businesses" in data
    assert "total" in data
    assert "with_websites" in data
    assert "without_websites" in data
    assert len(data["businesses"]) > 0

def test_get_business_detail(client, user_token):
    # First query nearby to populate mock businesses in DB
    nearby_res = client.get(
        "/api/businesses/nearby?latitude=12.9716&longitude=77.5946&radius_km=5",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    biz_id = nearby_res.json()["businesses"][0]["id"]

    res = client.get(f"/api/businesses/{biz_id}", headers={"Authorization": f"Bearer {user_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == biz_id
    assert "name" in data
