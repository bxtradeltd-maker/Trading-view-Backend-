# Architecture Decision Records (merged)


<!-- ===================== docs/adr/0000-template.md ===================== -->

# ADR NNNN: <Title>

**Status:** Proposed | Accepted | Superseded by ADR-XXXX

## Context

What is the issue we're facing? What constraints apply?

## Decision

What did we decide to do?

## Alternatives Considered

- Option A — why not chosen
- Option B — why not chosen

## Rationale

Why this decision, given the context and alternatives?

## Consequences

What becomes easier or harder as a result? What follow-up work does this
create?

---

<!-- ===================== docs/adr/0001-authentication-approach.md ===================== -->

# ADR 0001: Deriv Authentication Approach

**Status:** Proposed — pending Phase 1 Pre-Build Verification findings

## Context

Deriv currently exposes at least two distinct authentication flows:
- Legacy: static API Token exchanged via an `authorize` call over
  `wss://ws.derivws.com/websockets/v3?app_id=X`
- Newer Options API: a REST call exchanges a Bearer token for a short-lived
  OTP embedded in a WebSocket URL
  (`wss://api.derivws.com/trading/v1/options/ws/{demo|real}?otp=...`)

Which of these applies depends on how the target app_id/account is
provisioned, and must be confirmed against the live Deriv documentation and
the actual account before this ADR can be finalized.

## Decision

*To be finalized once Phase 1 verification confirms which API generation
applies.* `DerivGateway` will implement whichever flow is confirmed, behind
the `DerivGatewayPort` interface, so the rest of the system is unaware of
the distinction.

## Alternatives Considered

- Supporting both flows simultaneously — rejected for v1 as unnecessary
  complexity unless the account genuinely requires switching between them.

## Rationale

Pending verification.

## Consequences

The Infrastructure-layer `DerivGateway` adapter is the only place this
decision affects; Application/Domain layers depend only on
`DerivGatewayPort`.

---

<!-- ===================== docs/adr/0002-queue-implementation.md ===================== -->

# ADR 0002: Queue Implementation

**Status:** Accepted

## Context

Webhook alerts must never be executed synchronously inside the request
handler. A durable, retry-capable queue is required, with strategy
isolation and safe-retry-only semantics.

## Decision

Use BullMQ backed by Redis as the default queue implementation, accessed
exclusively through a `QueuePort` interface defined in the
Application/Domain layer. No BullMQ or Redis types may appear outside the
Infrastructure-layer adapter implementing `QueuePort`.

## Alternatives Considered

- Direct in-process queue (e.g. an array/EventEmitter) — rejected: does not
  survive process restarts, breaks idempotency guarantees on crash.
- RabbitMQ / SQS — rejected for v1: more operational overhead than needed
  for a single-operator system on Railway; BullMQ+Redis is simpler to run
  and Railway-hosts Redis natively.

## Rationale

BullMQ provides retry, backoff, and dead-letter semantics out of the box,
and Redis is straightforward to run and persist on Railway. The `QueuePort`
abstraction keeps the option open to swap backends later without touching
business logic.

## Consequences

- Redis persistence (AOF or short-interval RDB) becomes a hard operational
  requirement — see the Disaster Recovery section and Runbook.
- Reconciliation and stuck-state detection serve as the safety net for any
  queue-level data loss that persistence settings don't fully prevent.

---

<!-- ===================== docs/adr/0003-database-design.md ===================== -->

# ADR 0003: Database Design

**Status:** Accepted

## Context

Trade lifecycle data, strategy configuration, audit history, and
reconciliation records all need durable, transactional, queryable storage
with strong integrity guarantees given this handles real trading activity.

## Decision

PostgreSQL, with:
- Transactions wrapping all trade lifecycle writes
- A trade row written (state `RECEIVED`/pending) before any externally
  irreversible action (e.g. before the Buy request is sent), not only after
  a response is received
- Column-level encryption for per-strategy webhook secrets
- An append-only audit log table (no `UPDATE`/`DELETE` grants at the DB
  role level)
- Config versioning tables so every trade traces to the exact strategy
  configuration that produced it

See [`DATABASE.md`](../DATABASE.md) for the full ER diagram.

## Alternatives Considered

- MongoDB / document store — rejected: trade lifecycle integrity benefits
  strongly from relational transactions and foreign key constraints; this
  system does not need document flexibility.
- Writing trade records only after a confirmed Buy response — rejected: see
  Consequences below.

## Rationale

Transactional guarantees and the pending-write-before-buy pattern directly
address the failure mode where a crash between "Deriv accepts the buy" and
"local write succeeds" would otherwise leave an unrecorded open position.

## Consequences

- Slightly more write volume (a pending row plus subsequent updates per
  trade) in exchange for a materially safer failure mode.
- Reconciliation depends on this pattern being followed correctly —
  any code path that writes only after success reintroduces the exact risk
  this ADR exists to close.

---

<!-- ===================== docs/adr/0004-trade-reconciliation.md ===================== -->

# ADR 0004: Trade Reconciliation

**Status:** Accepted

## Context

WebSocket subscriptions, missed messages, or process crashes can cause the
local trade record to drift from Deriv's actual account state. Silent drift
in a trading system is unacceptable.

## Decision

A scheduled reconciliation job (default interval: 5 minutes) that:
1. Compares Deriv's actual portfolio/open contracts against local trades in
   an active state, and
2. Separately detects trades stuck in a non-terminal state longer than a
   configurable threshold (default 30s), independent of the portfolio diff.

On any mismatch: log at error level, notify Telegram immediately, transition
the affected trade to `RECONCILIATION_REQUIRED`, and require manual review.
No automatic correction is attempted.

Mismatches affecting only one strategy pause that strategy alone; mismatches
implicating shared infrastructure escalate to a platform-wide Critical
state.

## Alternatives Considered

- Reconciliation via portfolio diff alone — rejected: would miss trades
  that never reached Deriv at all (e.g. a crash before the Buy request was
  sent), which stuck-state detection catches instead.
- Automatic correction on mismatch (e.g. auto-closing or auto-recording) —
  rejected: too risky to automate against real money without a human
  reviewing the specific discrepancy first.

## Rationale

Two independent detection mechanisms catch two different failure classes;
neither alone is sufficient.

## Consequences

Requires the reconciliation job to have read access to both Deriv's
portfolio query and the full local trade state table, and a clear escalation
path (per-strategy pause vs. platform-wide Critical) that other components
must respect.

---

<!-- ===================== docs/adr/0005-risk-engine.md ===================== -->

# ADR 0005: Risk Engine

**Status:** Accepted

## Context

Automated trading requires hard, enforced limits independent of strategy
logic, since a strategy bug or bad signal should never be able to exceed
account-level risk tolerance.

## Decision

A dedicated Risk Engine, separate from strategy execution logic, enforces:
Maximum Daily Loss, Daily Profit Target, Maximum Trades, Maximum Stake
(expressed as a percentage of current account balance, not a flat figure),
Consecutive Loss Limit, Trading Hours, and Emergency Stop. Every rejection
is logged and notified via Telegram. The Risk Engine sits between the Queue
and the Deriv Gateway in the trade workflow — no trade reaches
`DerivGateway` without passing risk evaluation first.

## Alternatives Considered

- Embedding risk checks inside each strategy — rejected: duplicates logic
  per strategy and makes it easy to accidentally skip a check for a new
  strategy.
- Flat currency stake cap only — rejected: doesn't scale down automatically
  during a losing streak as account balance drops.

## Rationale

Centralizing risk logic in one engine, evaluated against current account
state at execution time (not just at alert time), ensures limits hold even
as balance changes intraday.

## Consequences

Every new strategy automatically inherits the same enforced limits; no
per-strategy bypass path should exist without an explicit, audited
configuration change.

---

<!-- ===================== docs/adr/0007-deployment-strategy.md ===================== -->

# ADR 0007: Deployment Strategy

**Status:** Accepted

## Context

The system needs a hosting platform simple enough for a single operator to
run reliably, with attached Postgres and Redis, health-check-based
deployment gating, and straightforward rollback.

## Decision

Deploy to Railway. `railway.json` defines the service configuration.
Health (`/api/v1/health`) and readiness endpoints gate whether a deployment
is considered successful. On startup validation failure, the process stays
running and reports `Critical` via `/api/v1/health` rather than
crash-looping, since Railway's restart policy would otherwise treat a
crash-looping process as repeated outages rather than a diagnosable state.

## Alternatives Considered

- Self-managed VPS — rejected: more operational burden (patching, Redis/
  Postgres administration) than justified for this scope.
- Crash-and-restart on startup validation failure — rejected: produces
  confusing crash-loop behavior on Railway and hides the actual failing
  check from `/health`.

## Rationale

Railway's managed Postgres/Redis and deploy/rollback tooling fit a
single-operator system well; the explicit "stay up, report Critical"
pattern keeps failures diagnosable rather than looking like a platform
outage.

## Consequences

Requires discipline in the startup validation code path specifically: it
must never `process.exit()` on a failed check, only set health state.

---

<!-- ===================== docs/adr/0008-queue-backpressure-policy.md ===================== -->

# ADR 0008: Queue Overflow / Backpressure Policy

**Status:** Accepted

## Context

TradingView can, in principle, send alerts faster than the system should
safely ingest or Deriv can safely accept. Two separate concerns exist:
how many alerts the queue accepts (ingestion), and how fast dispatch to
Deriv happens (rate limiting) — these must not be conflated or both try to
independently pace the same thing.

## Decision

- The queue defines: maximum queue depth, overflow behavior (reject new
  alerts past the limit, do not silently drop older ones without logging),
  priority rules (if any), and an alert expiration policy (an alert too old
  to act on meaningfully is expired, not executed late).
- `DerivGateway` is the sole enforcer of Deriv's actual rate limits and is
  the only component permitted to pace outbound API calls. The queue's
  backpressure rules govern ingestion only.
- Exceeding any backpressure limit is logged and triggers a Telegram
  notification.

## Alternatives Considered

- Letting the queue also throttle dispatch based on its own estimate of
  Deriv's rate limits — rejected: creates two independent, potentially
  conflicting pacing mechanisms and duplicates logic that `DerivGateway`
  already owns via live `server_status` data.

## Rationale

Single responsibility: ingestion control and dispatch-rate control are
different concerns solved by different components, avoiding the
conflicting-throttle failure mode.

## Consequences

If `DerivGateway` is throttling (approaching a rate limit), the queue will
simply back up — which is expected and handled by the queue's own overflow
policy, not by the queue trying to slow down dispatch itself.

---

<!-- ===================== docs/adr/0009-contract-monitoring-mechanism.md ===================== -->

# ADR 0009: Contract Monitoring Mechanism

**Status:** Accepted

## Context

Once a contract is bought, the system must track its status through to
settlement, and must recover this tracking correctly after any
reconnection.

## Decision

Subscribe to `proposal_open_contract` with `subscribe: 1` for every open
position, as the primary mechanism — not polling. On every reconnect,
re-subscribe to all contracts that were open before the disconnect,
reconciled against the database (not just in-memory state, which is lost on
process restart). The scheduled Reconciliation Job (ADR 0004) acts as the
safety net that catches any gaps this subscription-based approach misses.

## Alternatives Considered

- Polling `proposal_open_contract` or portfolio on a fixed interval as the
  primary mechanism — rejected: higher latency for detecting settlement,
  higher API call volume against rate limits, no benefit over subscription
  for a system that's already maintaining a persistent connection.

## Rationale

Subscriptions give near-real-time settlement detection with lower API
overhead; reconciliation exists precisely because subscriptions can still
be missed (e.g. during a reconnect window), so combining both mechanisms is
more robust than relying on either alone.

## Consequences

Reconnection logic must query the database (not memory) for the list of
contracts needing re-subscription, since the in-memory list is lost on
process restart.

---
