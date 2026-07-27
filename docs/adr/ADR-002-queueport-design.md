# ADR-002: QueuePort Design

## Status
Accepted (Phase 2). Implementation deferred to Phase 4.

## Context
Incoming TradingView webhook alerts must be validated, queued, and
processed asynchronously (see `ARCHITECTURE.md`'s component diagram:
`Webhook API -> Queue -> Risk Engine -> Trading Engine`). The queue
also needs a dead-letter mechanism for alerts whose processing fails
repeatedly, and a way to report current depth for the
`QUEUE_MAX_DEPTH` limit and monitoring dashboard.

## Decision
Define `QueuePort` as an Application-layer interface with five
methods: `enqueue`, `process`, `retry`, `moveToDeadLetter`, `getDepth`.
The first (and currently only) implementation is `BullMqQueueAdapter`
in Infrastructure, using Redis-backed BullMQ — matching
`REDIS_URL`/`QUEUE_*` variables already defined in `.env.example` and
the "Queue - BullMQ/Redis" component in the architecture diagram.

The interface is deliberately generic (`QueuePort<TPayload>`) and
contains **no BullMQ types** — `Job`, `JobsOptions`, etc. never appear
above the adapter. `EnqueueOptions` is a small Application-owned shape
(`jobId`, `delayMs`, `attempts`) that the adapter translates into
BullMQ's actual options object internally.

## Consequences
**Positive:**
- The Webhook API, Risk Engine, and Trading Engine (Phases 4, 6, 8)
  will depend on `QueuePort`, not on BullMQ — if a future need arises
  to shard across multiple Redis instances or switch queue technology
  entirely, only `BullMqQueueAdapter` changes.
- Dead-letter handling (`moveToDeadLetter`) is part of the contract
  from day one, not bolted on later — matches the architecture doc's
  requirement that duplicate/invalid alerts are logged as Security
  Events, not silently dropped.

**Negative / tradeoffs:**
- The interface can't expose every BullMQ-specific feature (e.g.
  flow producers, rate limiter groups) without either bloating the
  port or requiring a Postgres-position escape hatch — if a future
  phase needs a BullMQ-specific feature not on this interface, that's
  a signal to extend the port deliberately, not to reach past it.

## Open item for Phase 4
`process()`'s dead-letter routing policy (how many `attempts` before
`moveToDeadLetter` is called automatically vs. manually) is not yet
decided — the interface supports both, but the policy itself belongs
in Phase 4's implementation, not this ADR.
