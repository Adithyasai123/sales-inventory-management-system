# Development Guide

## Prerequisites

- Python 3.11 or newer
- Node.js 20 or newer and npm
- MySQL 8 for a MySQL development database, or SQLite for local test configurations
- Docker Compose (optional; recommended for running the complete stack)

## Start the full stack with Docker

From the repository root:

```sh
docker compose up --build
```

Open the app at `http://localhost:3000`, API docs at `http://localhost:8000/docs`, and Mailpit at `http://localhost:8025`. Stop the stack with `Ctrl+C`; use `docker compose down` to stop and remove containers while retaining the named database volume. Inspect [configuration](configuration.md) before using this setup outside local development.

## Backend without Docker

From the repository root, create a virtual environment and install dependencies:

```sh
cd backend
python -m venv .venv
```

Activate `.venv` for your shell, then run:

```sh
pip install -r requirements.txt
```

From `backend/`, create `backend/.env` from the repository's `.env.example` and set `DATABASE_URL` for a running database. Then apply migrations, optionally seed development data, and start the API:

```sh
alembic upgrade head
python scripts/seed.py
uvicorn app.main:app --reload --port 8000
```

The API docs are at `http://localhost:8000/docs`.

## Frontend without Docker

In a second terminal:

```sh
cd frontend
npm install
npm run dev
```

Vite serves the frontend at `http://localhost:5173`. Configure the API URL or development proxy as needed for your backend address.

## Useful commands

| Scope | Command | Purpose |
| --- | --- | --- |
| Backend | `alembic upgrade head` (from `backend/`) | Apply database migrations |
| Backend | `python scripts/seed.py` (from `backend/`) | Load/update sample development records |
| Backend | `uvicorn app.main:app --reload --port 8000` (from `backend/`) | Run the API with reload |
| Backend | `pytest -v` (from `backend/`) | Run backend tests |
| Frontend | `npm run dev` (from `frontend/`) | Run Vite development server |
| Frontend | `npm run build` (from `frontend/`) | Type-check and create a production build |

Backend tests live in `backend/tests/`. Frontend package scripts are declared in `frontend/package.json`.

## Database changes

Create a new Alembic revision for schema changes, implement its upgrade/downgrade operations, and apply it locally before exercising affected workflows. Keep ORM models and schemas aligned with the migration. See the [architecture guide](architecture.md) for the main data layers.
