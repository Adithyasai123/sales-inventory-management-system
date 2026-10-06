import pytest
from fastapi.testclient import TestClient
from app.models.inventory import MovementType, InventoryMovement


def test_stock_adjustment_in(client: TestClient, manager_headers, seed_data, db_session):
    prod1 = seed_data["prod1"]  # Initial stock: 50
    initial_stock = prod1.stock_quantity

    res = client.post(
        f"/api/v1/products/{prod1.id}/adjust-stock",
        json={"movement_type": "IN", "quantity": 25, "reason": "Restock shipment from supplier"},
        headers=manager_headers,
    )
    assert res.status_code == 200
    assert res.json()["stock_quantity"] == initial_stock + 25

    db_session.refresh(prod1)
    assert prod1.stock_quantity == initial_stock + 25

    movement = (
        db_session.query(InventoryMovement)
        .filter_by(product_id=prod1.id, reason="Restock shipment from supplier")
        .first()
    )
    assert movement is not None
    assert movement.movement_type == MovementType.IN
    assert movement.quantity == 25
    assert movement.balance_after == initial_stock + 25


def test_stock_adjustment_out_excessive_fails(client: TestClient, manager_headers, seed_data):
    prod3 = seed_data["prod3"]  # Stock: 2

    # Attempt to deduct 10 units when only 2 exist
    res = client.post(
        f"/api/v1/products/{prod3.id}/adjust-stock",
        json={"movement_type": "OUT", "quantity": 10, "reason": "Damage write-off"},
        headers=manager_headers,
    )
    assert res.status_code == 400
    assert res.json()["code"] == "INSUFFICIENT_STOCK"


def test_low_stock_alerts_retrieval(client: TestClient, sales_headers, seed_data):
    # prod3 has stock=2 and reorder_level=5, so it must be present
    res = client.get("/api/v1/inventory/low-stock", headers=sales_headers)
    assert res.status_code == 200
    alerts = res.json()
    assert len(alerts) >= 1

    skus = [a["sku"] for a in alerts]
    assert "SKU-LIMITED" in skus


def test_inventory_movements_history(client: TestClient, sales_headers, seed_data):
    res = client.get("/api/v1/inventory/movements", headers=sales_headers)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data


def test_export_inventory_movements_csv(client: TestClient, admin_headers, seed_data):
    res = client.get("/api/v1/inventory/movements/export/csv", headers=admin_headers)
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "Movement ID,Date,Product SKU,Product Name" in res.text
