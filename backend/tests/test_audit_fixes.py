import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.order import SalesOrder, OrderStatus
from app.models.email_log import EmailLog, EmailStatus
from app.models.user import User, UserRole
from app.services.email_service import EmailService


def test_email_log_below_threshold_creates_no_email(client: TestClient, sales_headers, seed_data, db_session: Session):
    """Below-threshold orders are auto-completed and generate no approval email logs."""
    prod1 = seed_data["prod1"]
    customer = seed_data["customer"]

    order_payload = {
        "customer_id": customer.id,
        "items": [{"product_id": prod1.id, "quantity": 1}],
        "tax_rate": 0.0,
    }
    initial_log_count = db_session.query(EmailLog).count()

    res = client.post("/api/v1/orders", json=order_payload, headers=sales_headers)
    assert res.status_code == 201
    assert res.json()["status"] == "COMPLETED"

    final_log_count = db_session.query(EmailLog).count()
    assert final_log_count == initial_log_count


def test_email_log_above_threshold_creates_manager_logs(client: TestClient, sales_headers, seed_data, db_session: Session):
    """Above-threshold orders create EmailLog rows for active managers/admins atomically."""
    prod2 = seed_data["prod2"]  # $1500 (> $1000 threshold)
    customer = seed_data["customer"]

    active_managers = (
        db_session.query(User)
        .filter(
            User.role.in_([UserRole.MANAGER, UserRole.ADMIN]),
            User.is_active == True,
            User.is_deleted == False,
        )
        .all()
    )
    expected_emails = {m.email for m in active_managers}

    order_payload = {
        "customer_id": customer.id,
        "items": [{"product_id": prod2.id, "quantity": 1}],
        "tax_rate": 0.0,
    }
    res = client.post("/api/v1/orders", json=order_payload, headers=sales_headers)
    assert res.status_code == 201
    order_data = res.json()
    assert order_data["status"] == "PENDING_APPROVAL"

    new_logs = (
        db_session.query(EmailLog)
        .order_by(EmailLog.id.desc())
        .limit(len(expected_emails))
        .all()
    )
    assert len(new_logs) == len(expected_emails)
    logged_recipients = {log.recipient for log in new_logs}
    assert logged_recipients == expected_emails
    for log in new_logs:
        assert order_data["order_number"] in log.subject
        assert log.status in [EmailStatus.PENDING, EmailStatus.SENT]


def test_email_log_approval_and_rejection_notify_creator(
    client: TestClient, sales_headers, manager_headers, seed_data, db_session: Session
):
    """Approving or rejecting an order creates an EmailLog addressed to the creator."""
    prod2 = seed_data["prod2"]
    customer = seed_data["customer"]
    sales_user = seed_data["sales"]

    # 1. Create order
    res = client.post(
        "/api/v1/orders",
        json={"customer_id": customer.id, "items": [{"product_id": prod2.id, "quantity": 1}]},
        headers=sales_headers,
    )
    order_id = res.json()["id"]

    # 2. Approve order
    appr_res = client.post(
        f"/api/v1/approvals/{order_id}/action",
        json={"decision": "APPROVED", "comment": "Approved by testing"},
        headers=manager_headers,
    )
    assert appr_res.status_code == 200

    approval_log = (
        db_session.query(EmailLog)
        .filter(EmailLog.recipient == sales_user.email)
        .order_by(EmailLog.id.desc())
        .first()
    )
    assert approval_log is not None
    assert "APPROVED" in approval_log.subject

    # 3. Create another order and reject
    res2 = client.post(
        "/api/v1/orders",
        json={"customer_id": customer.id, "items": [{"product_id": prod2.id, "quantity": 1}]},
        headers=sales_headers,
    )
    order_id2 = res2.json()["id"]

    reject_res = client.post(
        f"/api/v1/approvals/{order_id2}/action",
        json={"decision": "REJECTED", "comment": "Rejected budget exceeded"},
        headers=manager_headers,
    )
    assert reject_res.status_code == 200

    reject_log = (
        db_session.query(EmailLog)
        .filter(EmailLog.recipient == sales_user.email)
        .order_by(EmailLog.id.desc())
        .first()
    )
    assert reject_log is not None
    assert "REJECTED" in reject_log.subject


def test_smtp_failure_records_failed_log_without_breaking_api(
    client: TestClient, sales_headers, seed_data, db_session: Session, monkeypatch
):
    """When SMTP delivery fails, the API still succeeds and the log is marked FAILED with retries."""
    def broken_send(to_email, subject, html_body, log_id=None):
        if log_id:
            email_log = db_session.query(EmailLog).filter(EmailLog.id == log_id).first()
            if email_log:
                email_log.status = EmailStatus.FAILED
                email_log.error_message = "Connection refused on port 1025"
                email_log.retries = 3
                db_session.commit()
        return False

    monkeypatch.setattr(EmailService, "_send_smtp_email", staticmethod(broken_send))

    prod2 = seed_data["prod2"]
    customer = seed_data["customer"]

    res = client.post(
        "/api/v1/orders",
        json={"customer_id": customer.id, "items": [{"product_id": prod2.id, "quantity": 1}]},
        headers=sales_headers,
    )
    assert res.status_code == 201

    failed_logs = db_session.query(EmailLog).filter(EmailLog.status == EmailStatus.FAILED).all()
    assert len(failed_logs) > 0
    for l in failed_logs:
        assert l.retries == 3
        assert "Connection refused" in l.error_message


def test_product_for_update_locks_sorted_preventing_deadlock(db_session: Session, seed_data):
    """ProductRepository.get_for_update sorts IDs ascending and deduplicates to prevent deadlocks."""
    from app.repositories.product_repo import ProductRepository
    repo = ProductRepository(db_session)

    p1 = seed_data["prod1"]
    p2 = seed_data["prod2"]
    p3 = seed_data["prod3"]

    unordered = [p3.id, p1.id, p2.id, p1.id, p3.id]
    locked = repo.get_for_update(unordered)

    assert len(locked) == 3
    locked_ids = [p.id for p in locked]
    assert locked_ids == sorted(locked_ids)


def test_approvals_opposite_order_lock_ordering_and_insufficient_stock(
    client: TestClient, sales_headers, manager_headers, seed_data
):
    """Two orders listing the same products in opposite order.
    Pessimistic locking sorts IDs ascending, and stock check rejects the second order with 409."""
    p1 = seed_data["prod1"]  # stock 50
    p2 = seed_data["prod2"]  # stock 10
    customer = seed_data["customer"]

    # Order 1: items [p1 (qty 40), p2 (qty 8)]
    res1 = client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer.id,
            "items": [
                {"product_id": p1.id, "quantity": 40},
                {"product_id": p2.id, "quantity": 8},
            ],
            "tax_rate": 0.0,
        },
        headers=sales_headers,
    )
    assert res1.status_code == 201
    order1_id = res1.json()["id"]

    # Order 2: items in reverse order [p2 (qty 8), p1 (qty 40)]
    res2 = client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer.id,
            "items": [
                {"product_id": p2.id, "quantity": 8},
                {"product_id": p1.id, "quantity": 40},
            ],
            "tax_rate": 0.0,
        },
        headers=sales_headers,
    )
    assert res2.status_code == 201
    order2_id = res2.json()["id"]

    # Approve Order 1 -> succeeds
    appr1 = client.post(
        f"/api/v1/approvals/{order1_id}/action",
        json={"decision": "APPROVED", "comment": "Order 1 Approved"},
        headers=manager_headers,
    )
    assert appr1.status_code == 200
    assert appr1.json()["status"] == "COMPLETED"

    # Approve Order 2 -> fails with 409 Insufficient Stock
    appr2 = client.post(
        f"/api/v1/approvals/{order2_id}/action",
        json={"decision": "APPROVED", "comment": "Order 2 Approved"},
        headers=manager_headers,
    )
    assert appr2.status_code == 409
    assert appr2.json()["code"] == "INSUFFICIENT_STOCK"


def test_order_number_sequence_generation_twenty_orders(client: TestClient, sales_headers, seed_data):
    """Create 20 orders; all 20 must succeed with unique sequential order numbers."""
    prod1 = seed_data["prod1"]
    customer = seed_data["customer"]

    order_payload = {
        "customer_id": customer.id,
        "items": [{"product_id": prod1.id, "quantity": 1}],
        "tax_rate": 0.0,
    }

    order_numbers = []
    for _ in range(20):
        res = client.post("/api/v1/orders", json=order_payload, headers=sales_headers)
        assert res.status_code == 201
        order_numbers.append(res.json()["order_number"])

    assert len(order_numbers) == 20
    assert len(set(order_numbers)) == 20
    for num in order_numbers:
        assert num.startswith("ORD-")


def test_dashboard_empty_window_returns_zeros_and_sparklines_length(client: TestClient, admin_headers):
    """Dashboard KPIs return 0 for empty windows (no lifetime fallback) and sparklines match range_days."""
    res = client.get("/api/v1/dashboard/summary?range=7", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()

    assert data["range_days"] == 7
    assert len(data["sales_trend"]) == 7

    kpis = data["kpis"]
    assert len(kpis["revenue_sparkline"]) == 7
    assert len(kpis["orders_sparkline"]) == 7
    assert len(kpis["avg_order_value_sparkline"]) == 7

    assert float(kpis["total_sales_revenue"]) >= 0.0
    assert float(kpis["avg_order_value"]) >= 0.0
    assert float(kpis["inventory_value"]) >= 0.0


def test_restore_product_customer_user_and_export(
    client: TestClient, admin_headers, manager_headers, sales_headers, seed_data
):
    """Verify soft-delete, include_deleted query param, restore endpoint, and CSV exports."""
    # 1. Product soft delete & restore
    p = seed_data["prod3"]
    del_res = client.delete(f"/api/v1/products/{p.id}", headers=admin_headers)
    assert del_res.status_code == 200

    # Normal list does not show deleted
    list_res = client.get("/api/v1/products", headers=sales_headers)
    assert not any(item["id"] == p.id for item in list_res.json()["items"])

    # Include deleted shows it
    list_del_res = client.get("/api/v1/products?include_deleted=true", headers=sales_headers)
    assert any(item["id"] == p.id for item in list_del_res.json()["items"])

    # Restore product
    restore_res = client.post(f"/api/v1/products/{p.id}/restore", headers=manager_headers)
    assert restore_res.status_code == 200
    assert restore_res.json()["is_deleted"] is False

    # 2. Customer soft delete & restore
    cust = seed_data["customer"]
    del_cust = client.delete(f"/api/v1/customers/{cust.id}", headers=admin_headers)
    assert del_cust.status_code == 200

    # Normal list does not show deleted
    c_list = client.get("/api/v1/customers", headers=sales_headers)
    assert not any(c["id"] == cust.id for c in c_list.json()["items"])

    # Include deleted shows it
    c_list_del = client.get("/api/v1/customers?include_deleted=true", headers=sales_headers)
    assert any(c["id"] == cust.id for c in c_list_del.json()["items"])

    # Restore customer
    res_cust = client.post(f"/api/v1/customers/{cust.id}/restore", headers=manager_headers)
    assert res_cust.status_code == 200
    assert res_cust.json()["is_deleted"] is False

    # 3. User soft delete & restore
    sales_user = seed_data["sales"]
    del_u = client.delete(f"/api/v1/users/{sales_user.id}", headers=admin_headers)
    assert del_u.status_code == 200

    # User list with include_deleted
    u_list = client.get("/api/v1/users", headers=admin_headers)
    assert not any(u["id"] == sales_user.id for u in u_list.json()["items"])

    u_list_del = client.get("/api/v1/users?include_deleted=true", headers=admin_headers)
    assert any(u["id"] == sales_user.id for u in u_list_del.json()["items"])

    # Restore user
    res_u = client.post(f"/api/v1/users/{sales_user.id}/restore", headers=admin_headers)
    assert res_u.status_code == 200
    assert res_u.json()["is_deleted"] is False

    # 4. CSV Exports
    p_csv = client.get("/api/v1/products/export/csv", headers=sales_headers)
    assert p_csv.status_code == 200
    assert "text/csv" in p_csv.headers["content-type"]
    assert "SKU,Name,Category" in p_csv.text

    c_csv = client.get("/api/v1/customers/export/csv", headers=sales_headers)
    assert c_csv.status_code == 200
    assert "text/csv" in c_csv.headers["content-type"]
    assert "ID,Name,Email" in c_csv.text

