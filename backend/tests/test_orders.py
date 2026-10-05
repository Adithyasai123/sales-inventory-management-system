import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from app.models.product import Product
from app.models.inventory import InventoryMovement, MovementType


def test_order_creation_below_threshold_auto_completes(client: TestClient, sales_headers, seed_data, db_session):
    prod1 = seed_data["prod1"]
    customer = seed_data["customer"]
    initial_stock = prod1.stock_quantity

    order_payload = {
        "customer_id": customer.id,
        "items": [
            {"product_id": prod1.id, "quantity": 3},
        ],
        "tax_rate": 0.0,
        "notes": "Small order test",
    }

    # Total = 3 * 100 = $300 (Threshold is $1000)
    response = client.post("/api/v1/orders", json=order_payload, headers=sales_headers)
    assert response.status_code == 201
    data = response.json()

    assert data["status"] == "COMPLETED"
    assert data["requires_approval"] is False
    assert float(data["total_amount"]) == 300.00

    # Verify inventory was deducted immediately
    db_session.refresh(prod1)
    assert prod1.stock_quantity == initial_stock - 3

    # Verify movement ledger entry was created
    movement = (
        db_session.query(InventoryMovement)
        .filter_by(product_id=prod1.id, reference_order_id=data["id"])
        .first()
    )
    assert movement is not None
    assert movement.movement_type == MovementType.OUT
    assert movement.quantity == -3
    assert movement.balance_after == initial_stock - 3


def test_order_creation_above_threshold_requires_approval(client: TestClient, sales_headers, seed_data, db_session):
    prod2 = seed_data["prod2"]  # Price: $1500.00
    customer = seed_data["customer"]
    initial_stock = prod2.stock_quantity

    order_payload = {
        "customer_id": customer.id,
        "items": [
            {"product_id": prod2.id, "quantity": 1},
        ],
        "tax_rate": 5.0,
        "notes": "High value enterprise order",
    }

    # Total = $1500 + 5% tax = $1575.00 (> $1000 threshold)
    response = client.post("/api/v1/orders", json=order_payload, headers=sales_headers)
    assert response.status_code == 201
    data = response.json()

    assert data["status"] == "PENDING_APPROVAL"
    assert data["requires_approval"] is True
    assert float(data["total_amount"]) == 1575.00

    # Stock must NOT be deducted while pending
    db_session.refresh(prod2)
    assert prod2.stock_quantity == initial_stock


def test_order_creation_insufficient_stock_fails(client: TestClient, sales_headers, seed_data):
    prod3 = seed_data["prod3"]  # Stock: 2
    customer = seed_data["customer"]

    order_payload = {
        "customer_id": customer.id,
        "items": [
            {"product_id": prod3.id, "quantity": 10},  # Request 10 when only 2 available
        ],
        "tax_rate": 0.0,
    }

    response = client.post("/api/v1/orders", json=order_payload, headers=sales_headers)
    assert response.status_code == 409
    data = response.json()
    assert data["code"] == "INSUFFICIENT_STOCK"
    assert "Requested: 10, Available: 2" in data["message"]


def test_order_creation_duplicate_lines_rejected(client: TestClient, sales_headers, seed_data):
    prod1 = seed_data["prod1"]
    customer = seed_data["customer"]

    order_payload = {
        "customer_id": customer.id,
        "items": [
            {"product_id": prod1.id, "quantity": 2},
            {"product_id": prod1.id, "quantity": 3},  # Duplicate product
        ],
    }

    response = client.post("/api/v1/orders", json=order_payload, headers=sales_headers)
    assert response.status_code == 400
    assert response.json()["code"] == "DUPLICATE_ORDER_LINE"


def test_cancel_pending_order(client: TestClient, sales_headers, seed_data):
    prod2 = seed_data["prod2"]
    customer = seed_data["customer"]

    # Create pending order
    res = client.post(
        "/api/v1/orders",
        json={"customer_id": customer.id, "items": [{"product_id": prod2.id, "quantity": 1}]},
        headers=sales_headers,
    )
    order_id = res.json()["id"]

    # Cancel order
    cancel_res = client.post(f"/api/v1/orders/{order_id}/cancel", headers=sales_headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"
