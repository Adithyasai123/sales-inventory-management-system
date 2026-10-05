import pytest
from fastapi.testclient import TestClient


def test_sales_forbidden_on_user_admin(client: TestClient, sales_headers):
    response = client.get("/api/v1/users", headers=sales_headers)
    assert response.status_code == 403
    assert response.json()["code"] == "PERMISSION_DENIED"


def test_manager_forbidden_on_user_admin(client: TestClient, manager_headers):
    response = client.get("/api/v1/users", headers=manager_headers)
    assert response.status_code == 403
    assert response.json()["code"] == "PERMISSION_DENIED"


def test_admin_can_access_user_admin(client: TestClient, admin_headers):
    response = client.get("/api/v1/users", headers=admin_headers)
    assert response.status_code == 200
    assert "items" in response.json()


def test_sales_forbidden_on_settings_update(client: TestClient, sales_headers):
    response = client.put(
        "/api/v1/settings/threshold",
        json={"threshold": 2000.00},
        headers=sales_headers,
    )
    assert response.status_code == 403
    assert response.json()["code"] == "PERMISSION_DENIED"


def test_manager_can_update_settings(client: TestClient, manager_headers):
    response = client.put(
        "/api/v1/settings/threshold",
        json={"threshold": 2500.00},
        headers=manager_headers,
    )
    assert response.status_code == 200
    assert response.json()["value"] == "2500.00"


def test_unauthenticated_request_rejected(client: TestClient):
    response = client.get("/api/v1/orders")
    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHORIZED"
