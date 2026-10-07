# SIMS Documentation

This directory contains maintained guides for the Sales & Inventory Management System (SIMS). Use the root [README](../README.md) for the quickstart, service URLs, seeded accounts, and a guided approval walkthrough. [`AUDIT.md`](../AUDIT.md) is a dated audit report and should be read as a point-in-time assessment, not as current operating documentation.

## Guides

- [Architecture and code map](architecture.md) — runtime services, backend layers, frontend structure, and database responsibilities.
- [Business workflows and access](workflows.md) — order lifecycle, stock reservations, approvals, inventory changes, and role model.
- [HTTP API reference](api.md) — API base path and endpoint catalog, with links to the live OpenAPI docs.
- [Development guide](development.md) — local setup, migrations, seeding, frontend/backend commands, and test locations.
- [Configuration reference](configuration.md) — environment variables, defaults, and Docker networking notes.
- [Feature guide](features.md) — what each screen does and where its behavior is implemented.
- [Data model](data-model.md) — key entities, relationships, and stock/order state.

## Keeping documentation current

When a change affects setup, configuration, an API route, a role, a business workflow, or the architecture, update the matching guide and this index if the guide list changes. Keep examples consistent with `docker-compose.yml`, `.env.example`, and the implementation. Put dated findings and review conclusions in audit documents so they are not mistaken for current system behavior.
