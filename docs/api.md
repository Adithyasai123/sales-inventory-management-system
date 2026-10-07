# HTTP API Reference

The API is versioned under `/api/v1`. With the local Docker Compose stack, interactive Swagger documentation is available at [`http://localhost:8000/docs`](http://localhost:8000/docs), and the OpenAPI schema at `http://localhost:8000/openapi.json`. The live schema is the source of truth for request fields, response shapes, query parameters, and status codes.

Routes generally use bearer access tokens. Obtain tokens with `POST /auth/login`; refresh them with `POST /auth/refresh`. `GET /auth/me` returns the current account. Protected routes also enforce role/screen permissions on the server.

## Endpoint catalog

All paths below are relative to `/api/v1`.

| Resource | Endpoints |
| --- | --- |
| Authentication | `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me` |
| Users | `GET /users`, `POST /users`, `GET /users/{id}`, `PUT /users/{id}`, `DELETE /users/{id}`, `POST /users/{id}/restore` |
| Roles | `GET /roles`, `POST /roles`, `GET /roles/{id}`, `PUT /roles/{id}`, `DELETE /roles/{id}` |
| Customers | `GET /customers`, `POST /customers`, `GET /customers/{id}`, `PUT /customers/{id}`, `DELETE /customers/{id}`, `POST /customers/{id}/restore`, `GET /customers/export/csv` |
| Products | `GET /products`, `POST /products`, `GET /products/{id}`, `PUT /products/{id}`, `DELETE /products/{id}`, `POST /products/{id}/restore`, `POST /products/{id}/adjust-stock`, `GET /products/export/csv` |
| Orders | `GET /orders`, `POST /orders`, `GET /orders/{id}`, `POST /orders/{id}/cancel`, `GET /orders/export/csv` |
| Approvals | `GET /approvals/pending`, `POST /approvals/{id}/action` |
| Inventory | `GET /inventory/movements`, `GET /inventory/movements/export/csv`, `GET /inventory/low-stock` |
| Dashboard | `GET /dashboard/summary`, `/dashboard/top-customers`, `/dashboard/inventory-health`, `/dashboard/approval-stats`, `/dashboard/movements-trend` |
| Settings | `GET /settings`, `PUT /settings/threshold`, `PUT /settings/{key}` |
| Audit | `GET /audit/emails`, `GET /audit/stats` |

## Conventions

- List routes may support pagination and filtering; check the interactive schema for each route's query parameters.
- Create operations commonly return `201 Created`; validation and permission failures use appropriate HTTP error responses.
- CSV endpoints return downloadable streams rather than JSON.
- Resource deletion may be soft deletion with a matching restore operation, depending on the resource.
- Approval action values, payloads, and authorization are defined in the OpenAPI schema and approval router.

For the business meaning of these endpoints, see [workflows](workflows.md). For local API setup, see [development](development.md).
