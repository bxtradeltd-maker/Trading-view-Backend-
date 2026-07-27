# Trading Platform — Project Skeleton (Phase 2)

TradingView-triggered automated trading platform for Deriv, built with
Clean Architecture. This repository currently contains **Phase 2:
Architecture & Project Setup** only — see `PHASES.md` for the full
governance and phase tracker, and `PHASE1_FINDINGS.md` for the Deriv
API research this design is built on.

**No trading logic is implemented yet.** Every Infrastructure adapter
either fully implements its interface (Logger, Config, Encryption,
Telegram, Clock) or throws a clearly-labeled `not yet implemented
(Phase N)` error where real behavior belongs (Queue, Postgres, Deriv).
This is intentional — see Phase 2 acceptance criteria in `PHASES.md`.

## Scope

Single-operator system (one trader, one Deriv account per
environment). This package owns: webhook ingestion, idempotency, the
queue, risk enforcement, the Deriv Gateway, the trade state machine,
reconciliation, the database, and Telegram notifications. The
dashboard (`apps/dashboard`, Phase 9) consumes `/api/v1/*` endpoints
from this package; this package has no dependency on the dashboard.

## Technology Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js (LTS), Express, TypeScript |
| Database | PostgreSQL |
| Queue | BullMQ (Redis-backed), behind `QueuePort` |
| Validation | Zod |
| Logging | Winston |
| Notifications | Telegram |
| Hosting | Railway |

## Documentation

- [Installation Guide](./DOCUMENTATION.md#docs-installationmd) · [Architecture Overview](./docs/ARCHITECTURE_OVERVIEW.md) · [Folder Structure](./docs/FOLDER_STRUCTURE.md) · [Dependency Rules](./docs/DEPENDENCY_RULES.md)
- [API Documentation](./DOCUMENTATION.md#docs-apimd) · [Database Design](./DOCUMENTATION.md#docs-databasemd) · [Sequence Diagrams](./DOCUMENTATION.md#docs-sequence_diagramsmd) · [Operations Runbook](./DOCUMENTATION.md#docs-runbookmd) · [Production Readiness Checklist](./DOCUMENTATION.md#docs-production_readiness_checklistmd)
- [Architecture Decision Records](./docs/adr/) · [Phase 1 Findings](./PHASE1_FINDINGS.md) · [Development Phases & Governance](./PHASES.md) · [Full Specification History](./SPEC_HISTORY.md)

## Repository Structure

```
apps/
  api/          Presentation layer host (Express) — entrypoint, composition root
  dashboard/    Placeholder — Phase 9, not started
packages/
  domain/         Zero external dependencies: entities, value objects, events, enums
  application/    Depends only on domain: ports, error hierarchy, event dispatcher
  infrastructure/ Implements application ports: BullMQ, Postgres, Deriv, Telegram, Winston, etc.
  shared/         Cross-cutting utility types (Result<T,E>)
docs/
  adr/            Architecture Decision Records
tests/
  unit/           Cross-cutting tests (e.g. composition root wiring)
scripts/          Operational scripts (empty until a phase needs one)
```

See `docs/FOLDER_STRUCTURE.md` for a per-directory breakdown and
`docs/DEPENDENCY_RULES.md` for the enforced dependency direction.

## Build Instructions

```bash
npm install                # installs all workspaces
npm run build               # tsc --build, respects project references
```

> Note: this repo was scaffolded in an offline environment and has
> **not been `npm install`-ed or compiled with real dependencies yet**.
> The dependency-free `packages/domain` layer was verified to type-check
> cleanly in isolation; the remaining layers are logically consistent
> but need a real `npm install` (with network access) to fully verify —
> do this before your first Railway deploy.

## Test Instructions

```bash
npm test              # vitest run
npm run test:watch    # vitest watch mode
npm run test:coverage # vitest run --coverage
```

The sample test at `tests/unit/composition-root.test.ts` proves
dependency injection is wired correctly: it builds the real
composition root, confirms every port has a concrete adapter, and
proves the event bus delivers a published event to a subscriber
end-to-end — all without touching a real database, queue, or Deriv
connection.

## Running Locally

1. Copy `.env.example` to `.env` and fill in values (`DERIV_APP_ID` is
   the only Deriv variable required to satisfy config validation in
   Phase 2 — auth tokens aren't used until Phase 5).
2. `npm install`
3. `npm run dev` (runs `apps/api` via `tsx watch`)
4. `curl http://localhost:3000/api/v1/health` — should return a
   `Healthy` stub response (see `server.ts` for what's still a
   placeholder vs. real).

## Architectural Decisions

See `docs/adr/`:
- **ADR-001** — Why Clean Architecture (and its enforced dependency direction)
- **ADR-002** — QueuePort design (why an interface, why BullMQ specifically as the first adapter)
- **ADR-003** — DerivGateway design (why a single access point, what Phase 1 findings constrain it)
