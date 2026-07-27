# ADR-001: Clean Architecture as the Structural Foundation

## Status
Accepted (Phase 2)

## Context
This platform executes real trades with real money once Live mode is
enabled (see `PRODUCTION_READINESS_CHECKLIST.md`). Business rules
(risk limits, state transitions, idempotency) must be correct,
testable in isolation, and not accidentally coupled to a specific
database, queue technology, or the Deriv API's specific quirks —
because any of those could change (e.g. swapping BullMQ for another
queue, or Deriv changing its API surface) without the trading rules
themselves needing to change.

## Decision
Adopt Clean Architecture with four layers — Presentation, Application,
Domain, Infrastructure — with dependencies pointing strictly inward.
Domain has zero external dependencies (verified: it type-checks with
no npm packages beyond Node's built-in `crypto`). External systems
(Deriv, Postgres, Redis, Telegram) are accessed exclusively through
Ports defined in Application, implemented by Adapters in
Infrastructure.

## Consequences
**Positive:**
- Domain and Application logic (once implemented in later phases) can
  be unit-tested without a real database, queue, or Deriv connection —
  demonstrated in Phase 2 by `tests/unit/composition-root.test.ts`,
  which wires the whole container and tests the event bus without
  touching any real infrastructure.
- Infrastructure is swappable: e.g. replacing `PostgresTradeRepository`
  with a different implementation requires changing one line in
  `composition-root.ts`, not touching Domain/Application code.

**Negative / tradeoffs:**
- More files and more indirection than a simple monolithic script —
  appropriate here because trade execution correctness has real
  financial stakes, but this is deliberately more structure than a
  disposable prototype would need.
- Every new external integration requires defining a Port before
  writing the Adapter — slightly slower to add new integrations, in
  exchange for the testability and swappability above.

## Alternatives considered
- **Simple layered MVC-style structure** (routes call services call
  DB directly): rejected — would couple business rules to Express and
  a specific DB client, making the Risk Engine and Trading Engine
  (Phases 6, 8) hard to test in isolation from real infrastructure.
