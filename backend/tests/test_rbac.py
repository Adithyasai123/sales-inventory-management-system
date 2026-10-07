import pytest
from fastapi.testclient import TestClient


def test_sales_forbidden_on_user_admin(client: TestClient, sales_headers):
    response = client.get("/api/v1/users", headers=sales_headers)
    assert response.status_code == 403
    assert response.json()["code"] == "PERMISSION_DENIED"


def test_manager_can_access_user_admin(client: TestClient, manager_headers):
    response = client.get("/api/v1/users", headers=manager_headers)
    assert response.status_code == 200
    assert "items" in response.json()


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


def test_warehouse_can_adjust_stock_but_cannot_create_orders(client: TestClient, warehouse_headers, seed_data):
    prod = seed_data["prod1"]
    # Warehouse can adjust stock
    adj_resp = client.post(
        f"/api/v1/products/{prod.id}/adjust-stock",
        json={"movement_type": "IN", "quantity": 10, "reason": "Cycle count replenishment"},
        headers=warehouse_headers,
    )
    assert adj_resp.status_code == 200
    assert adj_resp.json()["stock_quantity"] == 60

    # Warehouse cannot create sales orders
    order_resp = client.post(
        "/api/v1/orders",
        json={
            "customer_id": seed_data["customer"].id,
            "items": [{"product_id": prod.id, "quantity": 1}],
        },
        headers=warehouse_headers,
    )
    assert order_resp.status_code == 403
    assert order_resp.json()["code"] == "PERMISSION_DENIED"


def test_finance_can_access_audit_stats_but_cannot_adjust_stock(client: TestClient, finance_headers, seed_data):
    # Finance can view audit stats
    stats_resp = client.get("/api/v1/audit/stats", headers=finance_headers)
    assert stats_resp.status_code == 200

    # Finance cannot adjust stock
    prod = seed_data["prod1"]
    adj_resp = client.post(
        f"/api/v1/products/{prod.id}/adjust-stock",
        json={"movement_type": "IN", "quantity": 5, "reason": "Finance adjustment"},
        headers=finance_headers,
    )
    assert adj_resp.status_code == 403
    assert adj_resp.json()["code"] == "PERMISSION_DENIED"


def test_list_dynamic_roles_from_database(client: TestClient, admin_headers):
    resp = client.get("/api/v1/roles", headers=admin_headers)
    assert resp.status_code == 200
    roles = resp.json()
    assert len(roles) >= 5
    role_names = [r["name"] for r in roles]
    assert "ADMIN" in role_names
    assert "WAREHOUSE" in role_names
    assert "FINANCE" in role_names


def test_create_custom_dynamic_role_in_database(client: TestClient, admin_headers):
    resp = client.post(
        "/api/v1/roles",
        json={
            "name": "AUDITOR",
            "display_name": "External Auditor",
            "description": "Read-only access for compliance and financial inspection",
            "allowed_screens": ["dashboard", "orders", "audit"],
            "can_view_audit": True,
        },
        headers=admin_headers,
    )
    assert resp.status_code == 201
    created = resp.json()
    assert created["name"] == "AUDITOR"
    assert created["is_system"] is False
    assert "audit" in created["allowed_screens"]


def test_cannot_delete_system_role(client: TestClient, admin_headers):
    # Fetch roles
    resp = client.get("/api/v1/roles", headers=admin_headers)
    roles = resp.json()
    admin_role = next(r for r in roles if r["name"] == "ADMIN")

    del_resp = client.delete(f"/api/v1/roles/{admin_role['id']}", headers=admin_headers)
    assert del_resp.status_code == 400
    assert "System roles" in del_resp.json()["message"]
