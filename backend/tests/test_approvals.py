import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from app.models.inventory import InventoryMovement, MovementType
from app.core.security import create_access_token


def test_manager_approves_order_deducts_stock(client: TestClient, sales_headers, manager_headers, seed_data, db_session):
    prod2 = seed_data["prod2"]  # Stock: 10, Price: 1500
    customer = seed_data["customer"]
    initial_stock = prod2.stock_quantity

    # 1. Sales creates high-value order
    res = client.post(
        "/api/v1/orders",
        json={"customer_id": customer.id, "items": [{"product_id": prod2.id, "quantity": 2}]},
        headers=sales_headers,
    )
    order_id = res.json()["id"]
    assert res.json()["status"] == "PENDING_APPROVAL"

    # 2. Manager approves order
    appr_res = client.post(
        f"/api/v1/approvals/{order_id}/action",
        json={"decision": "APPROVED", "comment": "Approved by Regional Manager."},
        headers=manager_headers,
    )
    assert appr_res.status_code == 200
    data = appr_res.json()
    assert data["status"] == "COMPLETED"

    # 3. Verify stock deducted
    db_session.refresh(prod2)
    assert prod2.stock_quantity == initial_stock - 2

    # 4. Verify ledger
    movement = (
        db_session.query(InventoryMovement)
        .filter_by(product_id=prod2.id, reference_order_id=order_id)
        .first()
    )
    assert movement is not None
    assert movement.movement_type == MovementType.OUT
    assert movement.quantity == -2
    assert movement.balance_after == initial_stock - 2


def test_manager_rejects_order(client: TestClient, sales_headers, manager_headers, seed_data, db_session):
    prod2 = seed_data["prod2"]
    customer = seed_data["customer"]
    initial_stock = prod2.stock_quantity

    # Create order
    res = client.post(
        "/api/v1/orders",
        json={"customer_id": customer.id, "items": [{"product_id": prod2.id, "quantity": 1}]},
        headers=sales_headers,
    )
    order_id = res.json()["id"]

    # Reject order
    reject_res = client.post(
        f"/api/v1/approvals/{order_id}/action",
        json={"decision": "REJECTED", "comment": "Credit check failed."},
        headers=manager_headers,
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "REJECTED"

    # Verify stock untouched
    db_session.refresh(prod2)
    assert prod2.stock_quantity == initial_stock


def test_prevent_self_approval(client: TestClient, seed_data):
    manager = seed_data["manager"]
    customer = seed_data["customer"]
    prod2 = seed_data["prod2"]

    manager_token = create_access_token(subject=manager.id, role="MANAGER")
    headers = {"Authorization": f"Bearer {manager_token}"}

    # Manager creates an order
    res = client.post(
        "/api/v1/orders",
        json={"customer_id": customer.id, "items": [{"product_id": prod2.id, "quantity": 1}]},
        headers=headers,
    )
    order_id = res.json()["id"]

    # Manager attempts to approve their OWN order
    appr_res = client.post(
        f"/api/v1/approvals/{order_id}/action",
        json={"decision": "APPROVED", "comment": "Self-approving my own deal"},
        headers=headers,
    )
    assert appr_res.status_code == 400
    assert appr_res.json()["code"] == "SELF_APPROVAL_FORBIDDEN"


def test_approval_stock_depleted_in_meantime_returns_409(client: TestClient, sales_headers, manager_headers, seed_data, db_session):
    prod3 = seed_data["prod3"]  # Stock: 2, Price: $50
    customer = seed_data["customer"]

    # We temporarily set threshold to $40 so this requires approval
    client.put("/api/v1/settings/threshold", json={"threshold": 40.00}, headers=manager_headers)

    # Sales creates order for 2 units ($100 total > $40 threshold)
    res = client.post(
        "/api/v1/orders",
        json={"customer_id": customer.id, "items": [{"product_id": prod3.id, "quantity": 2}]},
        headers=sales_headers,
    )
    order_id = res.json()["id"]
    assert res.json()["status"] == "PENDING_APPROVAL"

    # Deplete stock before manager approves (e.g. inventory loss or manual adjustment)
    prod3.stock_quantity = 0
    db_session.commit()

    # Manager attempts to approve
    appr_res = client.post(
        f"/api/v1/approvals/{order_id}/action",
        json={"decision": "APPROVED", "comment": "Approved"},
        headers=manager_headers,
    )
    # Must fail with 409 Conflict
    assert appr_res.status_code == 409
    assert appr_res.json()["code"] == "INSUFFICIENT_STOCK"


def test_sales_role_cannot_approve(client: TestClient, sales_headers, seed_data):
    customer = seed_data["customer"]
    prod2 = seed_data["prod2"]

    # Create order
    res = client.post(
        "/api/v1/orders",
        json={"customer_id": customer.id, "items": [{"product_id": prod2.id, "quantity": 1}]},
        headers=sales_headers,
    )
    order_id = res.json()["id"]

    # Sales user tries to approve
    appr_res = client.post(
        f"/api/v1/approvals/{order_id}/action",
        json={"decision": "APPROVED", "comment": "Attempt"},
        headers=sales_headers,
    )
    assert appr_res.status_code == 403
    assert appr_res.json()["code"] == "PERMISSION_DENIED"
