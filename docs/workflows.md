# Business Workflows and Access

This guide describes the core application behavior. The configured threshold and currency are environment/system settings; see [configuration](configuration.md).

## Sales order lifecycle

1. A permitted user creates an order for a customer with one or more product lines.
2. The backend validates product availability and calculates order values from catalog data. The browser's displayed estimate is not authoritative.
3. If the total is at or below the configured approval threshold, the order can complete immediately and its stock is deducted.
4. If the total exceeds the threshold, the order becomes `PENDING_APPROVAL`. Requested stock is reserved so other orders cannot consume it, but it is not yet deducted from on-hand stock.
5. An authorized manager/admin reviews the order and records a decision with a comment.
6. Approval fulfills the order by deducting reserved stock and recording inventory movement. Rejection releases the reservation. Cancellation follows the status and authorization rules enforced by the API.

The order service serializes stock-sensitive operations with database row locks where supported. The database remains the source of truth for quantities and status transitions.

## Inventory

Inventory movements provide a history of stock changes, including references to their cause. Product stock adjustment and order fulfillment affect stock through backend operations. Reserved quantity represents stock allocated to pending orders; available quantity must account for those reservations. The inventory screen also exposes low-stock information and CSV export.

## Roles and permissions

The application has configurable role records and screen-level permissions. Seed data includes Admin, Manager, Warehouse Lead, Finance/Auditor, and Sales Rep accounts. Actual authorization is enforced by backend dependencies and route logic; the frontend only hides or guards screens for usability and is not a security boundary.

Typical responsibilities:

- **Admin:** user and role administration and system-wide access.
- **Manager:** review orders awaiting approval and manage assigned business operations.
- **Warehouse Lead:** stock management and inventory operations.
- **Finance/Auditor:** review business and audit information, generally without stock mutation rights.
- **Sales Rep:** customer and sales order workflows.

Permissions may be changed in the application; consult the role configuration and backend authorization code for the effective grants. A user cannot approve their own order.

## Notifications and audit

Order approval events can send email notifications through the configured SMTP server. In Docker Compose, Mailpit captures these messages for inspection at `http://localhost:8025`. Audit screens expose email logs and aggregate activity data to authorized users.

## Feature map

| Area | Frontend section | API resource |
| --- | --- | --- |
| Dashboard | Dashboard | `/dashboard` |
| Customers | Customers | `/customers` |
| Catalog and stock | Products | `/products` |
| Sales | Orders | `/orders` |
| Reviews | Approvals | `/approvals` |
| Movement history | Inventory | `/inventory` |
| Accounts | Users | `/users` |
| Role setup | Settings / roles | `/roles` |
| Business settings | Settings | `/settings` |
| Audit | Audit | `/audit` |

See the [API reference](api.md) for endpoint operations and the root [README](../README.md) for a complete order/approval walkthrough.
