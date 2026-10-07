# Data Model

SIMS uses SQLAlchemy models under `backend/app/models/` and Alembic migrations under `backend/alembic/versions/`. This page describes the main concepts; actual nullability, constraints, indexes, enum values, and relationship details are defined by the models and migrations.

## Main records

| Record | Purpose | Relationships / notes |
| --- | --- | --- |
| `User` | Login identity and account state | Has a role; creates orders and approval/audit activity. |
| `Role` | Configurable role name and grants | Used to associate users with access configuration. Backend dependencies enforce authorization. |
| `Customer` | Buyer/contact account | Can be referenced by many sales orders. |
| `Product` | Catalog item and stock position | Has SKU, price, stock and reorder information; participates in order lines and inventory movements. |
| `SalesOrder` | Order header and lifecycle state | Belongs to a customer and creator; contains order items and may have approval records. |
| `SalesOrderItem` | Product, quantity, and captured price for an order line | Belongs to an order and references a product. |
| `OrderApproval` | Approval decision and review audit information | References the order and the reviewing user. |
| `InventoryMovement` | Stock movement history | References a product and may reference the order that caused the movement. Records movement type, quantity, balance after, and reason. |
| `SystemSetting` | Key/value business configuration | Includes the approval threshold used for new order decisions. |
| `EmailLog` | Notification delivery record | Stores email status and related delivery details for audit screens. |
| `Sequence` | Generated identifier support | Supports creation of application sequence values, including order numbering. |

## Order and stock state

Product on-hand stock and reserved stock are separate concepts. An order awaiting approval can reserve units without deducting them from on-hand stock. When approved, the service verifies availability and transitions the reserved quantity to fulfilled stock deduction. Rejected orders release their reservation. Inventory movement records track physical stock movement; reservations describe allocation to pending work.

The stock-sensitive service paths use database transactions and row locking where supported. Model and migration constraints provide additional integrity checks. For transaction details and status flow, see [workflows](workflows.md).

## Schema change workflow

1. Update or add the SQLAlchemy model in `backend/app/models/`.
2. Generate or write a migration in `backend/alembic/versions/`; inspect both upgrade and downgrade operations.
3. Apply migrations with `alembic upgrade head` from `backend/`.
4. Update Pydantic schemas, service/repository code, and frontend types when the changed field crosses the API boundary.
5. Update this page if the new field changes a major entity or relationship.

Do not edit old migrations that may already have been applied to a shared database; add a new revision instead.
