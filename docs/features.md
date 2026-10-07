# Feature Guide

This page is a screen-by-screen orientation to SIMS. API paths are listed in the [API reference](api.md); route declarations and authorization logic in `backend/app/routers/` remain authoritative.

## Sign-in and session

The login screen authenticates with email and password. The backend returns access and refresh JWTs, and the frontend API client attaches the access token and refreshes credentials when needed. Login requests are rate limited. The current-user endpoint supplies the profile and permissions used to build the signed-in experience. Relevant code: `backend/app/routers/auth.py`, `backend/app/services/auth_service.py`, `frontend/src/context/AuthContext.tsx`, and `frontend/src/lib/axios.ts`.

## Dashboard

The dashboard presents summary metrics, sales activity, top customers/products, inventory health, approval statistics, and stock movement trends. Its endpoints require authentication and accept bounded date ranges where applicable. Relevant code: `backend/app/routers/dashboard.py`, `backend/app/services/dashboard_service.py`, and `frontend/src/pages/dashboard/`.

## Customers

Users with customer access can search and page through customer records, create or edit a record, inspect a customer, and export records as CSV. Deletion and restoration are available through the API. Customer data is associated with sales orders. Relevant code: `backend/app/routers/customers.py`, `backend/app/models/customer.py`, and `frontend/src/pages/customers/`.

## Products and catalog

The product catalog stores SKU, descriptive and pricing information, stock, and reorder data. Authorized users can create, edit, deactivate/restore, export, and adjust stock. Order placement uses backend product data to calculate values and validate stock. Relevant code: `backend/app/routers/products.py`, `backend/app/services/order_service.py`, `backend/app/models/product.py`, and `frontend/src/pages/products/`.

## Sales orders

The orders area lists and filters orders, opens order details, creates orders with line items, exports CSV, and allows eligible cancellations. The backend validates customer and product records, computes totals, determines whether approval is needed, and applies the appropriate stock transition. Relevant code: `backend/app/routers/orders.py`, `backend/app/services/order_service.py`, and `frontend/src/pages/orders/`.

## Approvals

Manager/admin users can page through pending approvals and submit an approve or reject action. Approval rechecks stock while holding database locks before fulfillment. Rejection records the decision and releases reserved stock. The requester can receive an email notification. Creators cannot approve their own orders. Relevant code: `backend/app/routers/approvals.py`, `backend/app/services/approval_service.py`, and `frontend/src/pages/approvals/`.

## Inventory

The inventory area provides a filterable, paginated stock movement ledger, CSV export, and low-stock alerts. Ledger records show movement type, quantity, resulting balance, reference order, and reason. Movement history is intended as an audit trail for stock changes. Relevant code: `backend/app/routers/inventory.py`, `backend/app/services/inventory_service.py`, `backend/app/models/inventory.py`, and `frontend/src/pages/inventory/`.

## Users and roles

User administration supports listing, creating, editing, deactivating/deleting, and restoring accounts as permitted. Role administration exposes create/read/update/delete operations for role records. The backend authorization dependencies determine access; screen visibility alone does not grant access. Relevant code: `backend/app/routers/users.py`, `backend/app/routers/roles.py`, `backend/app/dependencies.py`, and the user/settings pages.

## Settings

Authenticated users can read settings for application behavior and formatting. Admin/manager users can change the approval threshold and update setting values. Orders compare their calculated total against the active threshold when created. Relevant code: `backend/app/routers/settings.py`, `backend/app/repositories/setting_repo.py`, and `frontend/src/pages/settings/`.

## Audit and notifications

Admin, manager, and finance-role users can query email delivery logs (optionally by status) and view aggregate email/movement counts. Notification sending uses SMTP configured for the backend; Mailpit is the local Compose default. Relevant code: `backend/app/routers/audit.py`, `backend/app/services/email_service.py`, `backend/app/models/email_log.py`, and `frontend/src/pages/audit/`.

## Related references

- [Business workflows and access](workflows.md) explains cross-screen order and inventory transitions.
- [Data model](data-model.md) explains the persisted entities and relationships.
- [Architecture](architecture.md) maps the source tree and request flow.
