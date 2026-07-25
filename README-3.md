# Deriv Automated Trading Bot — Backend & Engine

This is the **backend / trading engine** half of the platform: webhook API,
queue, risk engine, Deriv Gateway, reconciliation job, database, and
notifications. The dashboard (React frontend) is a separate package — see
the companion `deriv-trading-dashboard` package/repo.

> **Status:** Pre-implementation. Phase 1 (Pre-Build Verification) has not
> yet been completed and signed off. No trading engine code exists in this
> package until that phase is approved. See [`PHASES.md`](./PHASES.md).

## Scope

Single-operator system (one trader, one Deriv account per environment).
This package owns: webhook ingestion, idempotency, the queue, risk
enforcement, the Deriv Gateway, the trade state machine, reconciliation,
the database, and Telegram notifications. It exposes `/api/v1/*` endpoints
that the dashboard package consumes — it has no dependency on the dashboard.

## Technology Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js (LTS), Express, TypeScript |
| Database | PostgreSQL |
| Queue | BullMQ (Redis-backed), behind a `QueuePort` interface |
| Validation | Zod |
| Logging | Winston |
| Notifications | Telegram |
| Hosting | Railway |

## Architecture Principles

Clean Architecture: Presentation / Application / Domain / Infrastructure.
Business logic never lives in Express routes. Every external dependency
(Deriv, Postgres, Redis, Telegram) is accessed through a port/interface,
with an infrastructure adapter implementing it. `DerivGateway` is the only
component permitted to call the Deriv API directly.

## Documentation

- [Installation Guide](./docs/INSTALLATION.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API.md) — the contract the dashboard consumes
- [Database Design](./docs/DATABASE.md)
- [Sequence Diagrams](./docs/SEQUENCE_DIAGRAMS.md)
- [Operations Runbook](./docs/RUNBOOK.md)
- [Production Readiness Checklist](./docs/PRODUCTION_READINESS_CHECKLIST.md)
- [Architecture Decision Records](./docs/adr/)
- [Full Specification History](./docs/spec/) — v4 through v7
- [Development Phases & Governance](./PHASES.md)

## Getting Started

Setup instructions will be added once Phase 2 (Architecture & Project
Setup) is approved. See [`docs/INSTALLATION.md`](./docs/INSTALLATION.md).

## License

MIT — see [LICENSE](./LICENSE).
