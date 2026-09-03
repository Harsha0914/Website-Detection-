import pytest

def test_admin_endpoints_require_admin_role(client, user_token):
    # Normal user should be rejected with 403 Forbidden
    res = client.get("/api/admin/statistics", headers={"Authorization": f"Bearer {user_token}"})
    assert res.status_code == 403

def test_admin_get_statistics_success(client, admin_token):
    res = client.get("/api/admin/statistics", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "total_users" in data
    assert "total_businesses" in data
    assert "website_available" in data

def test_admin_export_csv(client, admin_token):
    res = client.get("/api/admin/reports/csv", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "Business Name" in res.text
