# Architecture and Code Map

SIMS is a browser application backed by a JSON API. In Docker Compose, Nginx serves the frontend and forwards `/api/` traffic to FastAPI. FastAPI uses SQLAlchemy to access MySQL; notification email is sent through SMTP (Mailpit in the development Compose stack).

```text
Browser → Nginx / React SPA → FastAPI (/api/v1) → SQLAlchemy → MySQL
                                           └──── SMTP → Mailpit or configured mail server
```

## Runtime services

| Service | Compose service | Local endpoint | Responsibility |
| --- | --- | --- | --- |
| Web app | `frontend` | `http://localhost:3000` | React application served by Nginx |
| API | `backend` | `http://localhost:8000` | FastAPI routes, validation, authentication, and business workflows |
| Database | `mysql` | `localhost:3306` | Persistent relational data |
| Email sink | `mailpit` | SMTP `localhost:1025`; UI `http://localhost:8025` | Capture development notification email |

## Backend layout

The backend is in `backend/app/`:

- `main.py` creates the FastAPI application and mounts the versioned API.
- `routers/` defines HTTP endpoints by resource; `routers/api.py` includes them under `/api/v1`.
- `schemas/` contains request and response validation models.
- `services/` owns business operations such as order placement, inventory, approval decisions, and dashboard aggregation.
- `repositories/` contains reusable data access where present.
- `models/` defines SQLAlchemy entities and relationships.
- `core/` contains settings, database setup, security, logging, and exception handling.
- `dependencies.py` supplies database, authenticated-user, and authorization dependencies.
- `alembic/versions/` contains ordered database migrations. Apply them with `alembic upgrade head`.
- `tests/` contains backend tests organized around application features.

The important persisted concepts include users and dynamic roles, customers, products, orders and line items, approval decisions, inventory movements, system settings, email logs, and order-number sequences.

## Frontend layout

The frontend is in `frontend/src/`:

- `App.tsx` defines application routes and guarded screens.
- `pages/` contains the dashboard, authentication, customer, product, order, inventory, approval, user, audit, and settings screens.
- `components/` contains shared layout and user interface components.
- `api/` and `lib/axios.ts` implement HTTP access and token handling.
- `hooks/` wraps feature API calls and server state with TanStack Query.
- `context/` holds shared authentication state.
- `theme/` and `index.css` define theme tokens and global presentation.
- `types/` contains shared TypeScript API models.

## Request and state flow

1. A page calls a feature hook.
2. The hook calls the API client; the Axios interceptor attaches the access token and handles refresh behavior.
3. FastAPI validates input with Pydantic schemas and applies authentication/authorization dependencies.
4. A service performs the business operation and uses the database session/repositories to persist it.
5. The API returns a schema-validated JSON response; TanStack Query caches and refreshes frontend data.

For exact endpoint paths, see the [API reference](api.md). For stock and approval behavior, see [business workflows](workflows.md).
