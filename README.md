# Sales & Inventory Management System (SIMS)

An enterprise-grade, full-stack web application designed for comprehensive catalog management, multi-line sales order creation, real-time inventory tracking, and transactional manager approval workflows.

---

## 1. System Architecture

```text
                                  ┌────────────────────────┐
                                  │   Browser Client (SPA) │
                                  │   React 18 + TS + Vite │
                                  └───────────┬────────────┘
                                              │ HTTP / JSON
                                              ▼
                                  ┌────────────────────────┐
                                  │  Nginx Reverse Proxy   │
                                  │   (Port 3000 / 80)     │
                                  └───────────┬────────────┘
                                              │ /api/v1/*
                                              ▼
                                  ┌────────────────────────┐
                                  │   FastAPI Application  │
                                  │   Python 3.11 / Uvicorn│
                                  └─────┬────────────┬─────┘
                     SQLAlchemy 2.0     │            │  SMTP (BackgroundTasks)
                     (InnoDB / ACID)    │            │  Port 1025
                                        ▼            ▼
                           ┌─────────────────┐ ┌──────────────┐
                           │  MySQL 8.0 DB   │ │   Mailpit    │
                           │  (Port 3306)    │ │ (Web UI: 8025│
                           └─────────────────┘ └──────────────┘
```

### Key Technical Capabilities:
- **ACID Transaction Integrity:** Real-time stock validation and pessimistic row-level locking (`SELECT ... FOR UPDATE`) during order fulfillment to eliminate overselling and race conditions.
- **Database Non-Negative Stock Guarantee:** Direct InnoDB table constraint `CONSTRAINT chk_stock_non_negative CHECK (stock_quantity >= 0)`.
- **Configurable Approval Workflow:** Orders exceeding a dynamic monetary threshold (default `$1,000.00`) automatically transition to `PENDING_APPROVAL`, trigger asynchronous email dispatch to all active managers, and halt stock deduction until managerial sign-off.
- **Strict Role-Based Access Control (RBAC):** Granular authorization across `ADMIN`, `MANAGER`, and `SALES` roles. Creators are strictly prohibited from approving their own orders (preventing conflict of interest).
- **Two-Color Forest & Mint Design System:** Strict UI styling utilizing Forest ink (`#0F2E2A`) and soft low-contrast Mint (`#BFEBD5`) with MongoDB-style typography (**Source Serif 4** headings & big KPI numbers; **Figtree** body; `tabular-nums` for all financial values).

---

## 2. Technology Stack

### Backend
- **Framework:** FastAPI (Python 3.11)
- **Database ORM:** SQLAlchemy 2.0 (Modern Declarative Mapping)
- **Database Migrations:** Alembic (Idempotent DDL scripts)
- **Database Engine:** MySQL 8.0 InnoDB
- **Validation & Settings:** Pydantic v2 & `pydantic-settings`
- **Authentication:** JWT Access (15m) & Refresh Tokens (7d), Bcrypt password hashing
- **Email Delivery:** Python SMTP via FastAPI `BackgroundTasks`, logged to `email_logs`
- **Testing:** Pytest & FastAPI TestClient

### Frontend
- **Framework:** React 18 + TypeScript (Vite)
- **Routing:** React Router v6
- **Server State & Caching:** TanStack React Query v5
- **HTTP Client:** Axios with JWT request injection and silent token refresh queue
- **Form Management:** React Hook Form + Zod schema validation
- **Styling:** Tailwind CSS ("Forest & Mint" design tokens)
- **Charts:** Recharts (30-day daily sales trend bar chart)
- **Icons & Notifications:** Lucide React & `react-hot-toast`

---

## 3. Quickstart with Docker Compose (Recommended)

Running the entire stack with Docker Compose takes one command and requires zero manual database setup:

```bash
# Clone and enter the repository
git clone https://github.com/Adithyasai123/sales-inventory-management-system.git
cd sales-inventory-management-system

# Spin up all 4 services (MySQL, Mailpit, FastAPI backend, React frontend)
docker compose up --build
```

### Service Endpoints:
| Service | URL | Description |
| :--- | :--- | :--- |
| **Frontend Application** | `http://localhost:3000` | React web application |
| **Backend API Docs** | `http://localhost:8000/docs` | Swagger / OpenAPI interactive documentation |
| **Mailpit Web UI** | `http://localhost:8025` | View outgoing notification emails in real time |
| **MySQL Database** | `localhost:3306` | User: `sims_user`, Pass: `sims_password`, DB: `sims_db` |

---

## 4. Default Seed Credentials

The database is seeded idempotently on first startup with three pre-configured enterprise roles:

| Role | Email Address | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@sims.local` *(or `admin@sims.com`)* | `Admin@123456` | Full administrative control, user management, settings |
| **Manager** | `manager@sims.local` *(or `manager@sims.com`)* | `Manager@123456` | Review/approve orders, adjust stock, manage catalog, settings |
| **Sales Rep** | `sales@sims.local` *(or `sales@sims.com`)* | `Sales@123456` | Create sales orders, view catalog, register customers |

*Tip: The login page includes 1-click quick-fill buttons for all three accounts.*

---

## 5. End-to-End Walkthrough: Order Creation & Approval Flow

### Step 1: Place a High-Value Order as a Sales Rep
1. Navigate to `http://localhost:3000` and click the **Sales Rep** quick-fill button to log in as `sales@sims.local`.
2. Go to **Sales Orders** → **Create Order**.
3. Select customer **Apex Global Logistics**.
4. Add line items:
   - Select `PROD-SERVER-05` (Enterprise Rackmount Server, Unit Price: `$2,850.00`, Qty: `1`).
5. Notice the **live server calculation**: Total is `$2,850.00`.
6. Notice the calm **"Needs Manager Approval"** banner: because `$2,850.00 > $1,000.00` threshold, the order will require review.
7. Click **Submit for Manager Approval**.
8. The order is placed in status `PENDING_APPROVAL`. Verify that the warehouse stock for `PROD-SERVER-05` has **not** been deducted yet.

### Step 2: Inspect the Automated Manager Notification Email
1. Open your browser and navigate to the **Mailpit Web UI** at `http://localhost:8025`.
2. You will see an email with subject:
   `[Action Required] Order ORD-YYYYMMDD-XXXX Requires Manager Approval`
3. The email details the customer name, order number, line items total, and requesting sales representative.

### Step 3: Manager Review & Approval
1. Log out and log in as **Manager** (`manager@sims.local`).
2. Navigate to the **Approvals** screen in the sidebar (notice the badge indicator `1`).
3. Click **Review** on the pending order to inspect line items in the SlideOver drawer.
4. Click **Approve**.
5. Enter a mandatory audit comment: *"Credit check verified. Fulfillment approved."*
6. Click **Confirm Approval**.

### Step 4: Verification of Stock Deduction & Audit Trail
1. The order status immediately transitions to `COMPLETED`.
2. Under **Products**, inspect `PROD-SERVER-05`: available stock has been decremented by 1 unit.
3. Under **Inventory** → **Movement Ledger**: an immutable ledger record of type `OUT` is visible with the reference order number and the resulting `balance_after`.
4. In Mailpit (`http://localhost:8025`), inspect the second email sent to `sales@sims.local` confirming:
   `[Order Update] Your Order ORD-YYYYMMDD-XXXX has been APPROVED`.

---

## 6. Local Development Setup (Without Docker)

### Prerequisites
- Python 3.11+
- Node.js 20+ & npm 10+
- MySQL 8.0 running locally (or SQLite for instant zero-config testing)

### Backend Setup:
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install locked dependencies
pip install -r requirements.txt

# Configure environment (copy template)
cp ../.env.example .env

# Run database migrations
alembic upgrade head

# Seed initial database records
python scripts/seed.py

# Start development server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup:
```bash
cd frontend

# Install npm dependencies
npm install

# Start development server with API proxy
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 7. Running the Automated Test Suite

The backend includes a comprehensive `pytest` test suite covering authentication, order workflows below and above the threshold, pessimistic row-level locking, conflict handling (`409`), inventory movement ledgers, and RBAC security boundaries:

```bash
cd backend

# Run the full test suite
pytest -v

# Run with test coverage report
pytest --cov=app tests/
```

### Test Coverage Highlights:
- `test_order_creation_below_threshold_auto_completes`: Auto-completes order and deducts stock when total $\le$ threshold.
- `test_order_creation_above_threshold_requires_approval`: Keeps status `PENDING_APPROVAL` with zero stock mutation.
- `test_prevent_self_approval`: Blocks order creators from approving their own orders.
- `test_approval_stock_depleted_in_meantime_returns_409`: Verifies pessimistic row locking and returns HTTP `409 Conflict` if inventory is depleted before approval.
- `test_stock_adjustment_in` & `test_stock_adjustment_out_excessive_fails`: Validates immutable inventory movement audit trail and non-negative constraints.
- `test_rbac.py`: Validates role enforcement across `ADMIN`, `MANAGER`, and `SALES`.

---

## 8. License
MIT License.