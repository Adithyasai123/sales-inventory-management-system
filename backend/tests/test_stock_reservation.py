import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from app.models.product import Product


def test_pending_order_reserves_stock_and_updates_available(
    client: TestClient, sales_headers, seed_data, db_session
):
    """When an order requiring approval is created, it atomically reserves stock without deducting physical inventory."""
    prod2 = seed_data["prod2"]  # Stock: 10, Price: 1500 (> 1000 threshold)
    customer = seed_data["customer"]

    res = client.post(
        "/api/v1/orders",
        json={"customer_id": customer.id, "items": [{"product_id": prod2.id, "quantity": 4}]},
        headers=sales_headers,
    )
    assert res.status_code == 201
    order_data = res.json()
    assert order_data["status"] == "PENDING_APPROVAL"

    # Query product API to verify stock metrics
    prod_res = client.get(f"/api/v1/products/{prod2.id}", headers=sales_headers)
    assert prod_res.status_code == 200
    pdata = prod_res.json()
    assert pdata["stock_quantity"] == 10
    assert pdata["reserved_quantity"] == 4
    assert pdata["available_stock"] == 6


def test_cannot_order_more_than_available_stock_when_partially_reserved(
    client: TestClient, sales_headers, seed_data
):
    """Attempting to order more than available stock (physical - reserved) must return 409 Conflict."""
    prod2 = seed_data["prod2"]  # Stock: 10
    customer = seed_data["customer"]

    # 1. Order 4 units -> 4 reserved, 6 available
    res1 = client.post(
        "/api/v1/orders",
        json={"customer_id": customer.id, "items": [{"product_id": prod2.id, "quantity": 4}]},
        headers=sales_headers,
    )
    assert res1.status_code == 201

    # 2. Try to order 7 units -> exceeds available (6)
    res2 = client.post(
        "/api/v1/orders",
        json={"customer_id": customer.id, "items": [{"product_id": prod2.id, "quantity": 7}]},
        headers=sales_headers,
    )
    assert res2.status_code == 409
    assert res2.json()["code"] == "INSUFFICIENT_STOCK"

    # 3. Order exactly remaining 6 units -> succeeds
    res3 = client.post(
        "/api/v1/orders",
        json={"customer_id": customer.id, "items": [{"product_id": prod2.id, "quantity": 6}]},
        headers=sales_headers,
    )
    assert res3.status_code == 201

    # 4. Now 0 units available -> any subsequent order fails
    res4 = client.post(
        "/api/v1/orders",
        json={"customer_id": customer.id, "items": [{"product_id": prod2.id, "quantity": 1}]},
        headers=sales_headers,
    )
    assert res4.status_code == 409
    assert res4.json()["code"] == "INSUFFICIENT_STOCK"


def test_approval_workflow_stock_lifecycle(
    client: TestClient, sales_headers, manager_headers, seed_data, db_session
):
    """Verifies full lifecycle: Order -> Reserve -> Approval -> Physical Deduct & Unreserve."""
    prod2 = seed_data["prod2"]  # Stock: 10
    customer = seed_data["customer"]

    # Create Order 1 (qty: 3) and Order 2 (qty: 4)
    res1 = client.post(
        "/api/v1/orders",
        json={"customer_id": customer.id, "items": [{"product_id": prod2.id, "quantity": 3}]},
        headers=sales_headers,
    )
    order1_id = res1.json()["id"]

    res2 = client.post(
        "/api/v1/orders",
        json={"customer_id": customer.id, "items": [{"product_id": prod2.id, "quantity": 4}]},
        headers=sales_headers,
    )
    order2_id = res2.json()["id"]

    # Verify 7 units reserved, 3 available
    prod_res = client.get(f"/api/v1/products/{prod2.id}", headers=sales_headers)
    assert prod_res.json()["reserved_quantity"] == 7
    assert prod_res.json()["available_stock"] == 3

    # Manager Approves Order 1
    appr1 = client.post(
        f"/api/v1/approvals/{order1_id}/action",
        json={"decision": "APPROVED", "comment": "Order 1 approved"},
        headers=manager_headers,
    )
    assert appr1.status_code == 200

    # Stock quantity should drop to 7 (10 - 3), reserved drops from 7 to 4, available stays 3 (7 - 4)
    prod_res = client.get(f"/api/v1/products/{prod2.id}", headers=sales_headers)
    assert prod_res.json()["stock_quantity"] == 7
    assert prod_res.json()["reserved_quantity"] == 4
    assert prod_res.json()["available_stock"] == 3

    # Manager Rejects Order 2
    appr2 = client.post(
        f"/api/v1/approvals/{order2_id}/action",
        json={"decision": "REJECTED", "comment": "Order 2 rejected"},
        headers=manager_headers,
    )
    assert appr2.status_code == 200

    # Stock quantity stays 7, reserved drops from 4 to 0, available increases to 7
    prod_res = client.get(f"/api/v1/products/{prod2.id}", headers=sales_headers)
    assert prod_res.json()["stock_quantity"] == 7
    assert prod_res.json()["reserved_quantity"] == 0
    assert prod_res.json()["available_stock"] == 7


def test_order_cancellation_releases_reservation(
    client: TestClient, sales_headers, seed_data
):
    """Cancelling a pending approval order releases its reserved quantity back to available stock."""
    prod2 = seed_data["prod2"]  # Stock: 10
    customer = seed_data["customer"]

    res = client.post(
        "/api/v1/orders",
        json={"customer_id": customer.id, "items": [{"product_id": prod2.id, "quantity": 5}]},
        headers=sales_headers,
    )
    order_id = res.json()["id"]

    # Verify 5 reserved
    prod_res = client.get(f"/api/v1/products/{prod2.id}", headers=sales_headers)
    assert prod_res.json()["reserved_quantity"] == 5
    assert prod_res.json()["available_stock"] == 5

    # Cancel order
    cancel_res = client.post(f"/api/v1/orders/{order_id}/cancel", headers=sales_headers)
    assert cancel_res.status_code == 200

    # Verify reservation released
    prod_res = client.get(f"/api/v1/products/{prod2.id}", headers=sales_headers)
    assert prod_res.json()["reserved_quantity"] == 0
    assert prod_res.json()["available_stock"] == 10
