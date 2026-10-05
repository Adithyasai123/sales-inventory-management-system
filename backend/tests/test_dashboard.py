import pytest
from fastapi.testclient import TestClient


def test_dashboard_summary_default(client: TestClient, seed_data, admin_headers):
    response = client.get("/api/v1/dashboard/summary", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()

    assert "kpis" in data
    assert "sales_trend" in data
    assert "status_distribution" in data
    assert "top_products" in data

    kpis = data["kpis"]
    assert "total_sales_revenue" in kpis
    assert "avg_order_value" in kpis
    assert "inventory_value" in kpis
    assert "revenue_delta" in kpis
    assert "revenue_sparkline" in kpis
    assert isinstance(kpis["revenue_sparkline"], list)
    assert "orders_sparkline" in kpis
    assert "avg_order_value_sparkline" in kpis

    # Verify previous_revenue on sales_trend points
    for point in data["sales_trend"]:
        assert "date" in point
        assert "revenue" in point
        assert "previous_revenue" in point
        assert "orders_count" in point


@pytest.mark.parametrize("range_val", [7, 30, 90])
def test_dashboard_summary_ranges(client: TestClient, seed_data, admin_headers, range_val):
    response = client.get(f"/api/v1/dashboard/summary?range={range_val}", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["range_days"] == range_val
    assert len(data["sales_trend"]) == range_val


def test_dashboard_top_customers(client: TestClient, seed_data, manager_headers):
    response = client.get("/api/v1/dashboard/top-customers?range=30", headers=manager_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    for c in data:
        assert "customer_id" in c
        assert "customer_name" in c
        assert "orders_count" in c
        assert "total_revenue" in c


def test_dashboard_inventory_health(client: TestClient, seed_data, sales_headers):
    response = client.get("/api/v1/dashboard/inventory-health", headers=sales_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) <= 8
    for item in data:
        assert "product_id" in item
        assert "sku" in item
        assert "stock_quantity" in item
        assert "reorder_level" in item
        assert "is_low_stock" in item


def test_dashboard_approval_stats(client: TestClient, seed_data, manager_headers):
    response = client.get("/api/v1/dashboard/approval-stats?range=30", headers=manager_headers)
    assert response.status_code == 200
    data = response.json()
    assert "created_count" in data
    assert "pending_count" in data
    assert "approved_count" in data
    assert "rejected_count" in data
    assert "avg_decision_time_hours" in data
    assert "avg_decision_time_formatted" in data


def test_dashboard_movements_trend(client: TestClient, seed_data, admin_headers):
    response = client.get("/api/v1/dashboard/movements-trend?range=14", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 14
    for point in data:
        assert "date" in point
        assert "in_qty" in point
        assert "out_qty" in point


def test_dashboard_unauthorized(client: TestClient):
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 401
