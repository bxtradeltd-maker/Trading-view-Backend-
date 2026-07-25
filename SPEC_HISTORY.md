# Specification History (merged: v4, v6, v7)


<!-- ===================== docs/spec/deriv-trading-platform-spec-v4.md ===================== -->

# Build a Production-Ready TradingView → Deriv Automated Trading Platform (v4)

> **Revision note:** Builds on v3. Changes from the latest review are marked
> `[NEW]` or `[UPDATED]`. Unmarked sections are unchanged from v3.

## Mission

Design and build a production-grade automated trading platform that receives
TradingView webhook alerts and executes trades on Deriv using the current
official Deriv API and its supported authentication mechanism.

Priorities: Reliability, Correctness, Low Latency, Security, Simplicity,
Scalability, Maintainability, Operational Safety.

This is not a prototype. The final deliverable must be suitable for
production deployment.

`[NEW]` **Scope confirmation:** this system is single-operator (one trader,
one Deriv account per environment). No multi-tenant user management, no
per-user auth/roles beyond the single admin. If multi-user support is ever
needed, treat it as a separate future phase, not part of this build.

---

## Pre-Build Verification (Mandatory)

Before generating any code, verify and document from the latest official
Deriv documentation:

**Authentication** — determine which flow currently applies (API Token
authorization vs. OTP/session-based). Design the auth layer around the
verified implementation, not assumptions.

**WebSocket** — current endpoint, authorization flow, proposal workflow, buy
workflow, contract monitoring mechanism, ping/pong requirements, idle
timeout, rate limits, error responses. Never implement deprecated endpoints.

**Trading** — demo App ID, live App ID, supported symbols, supported
contract types, proposal availability, buy availability. Document all
findings.

---

## Architecture

Clean Architecture. Layers: Presentation, Application, Domain, Infrastructure.
Business logic never exists inside Express routes, controllers, or React
components — it belongs in Application and Domain layers. TypeScript
throughout.

`[NEW]` **Queue port requirement:** define a `QueuePort` interface (enqueue,
process, retry, dead-letter) in the Domain/Application layer. BullMQ is
strictly an Infrastructure-layer adapter implementing this port. No BullMQ
types, job objects, or Redis-specific concepts may appear outside the
Infrastructure layer. This is what actually makes "swap the backend later"
true, rather than aspirational.

---

## Technology Stack

Backend: Node.js (LTS), Express, TypeScript
Frontend: React, Vite, Tailwind CSS, TradingView Lightweight Charts
Database: PostgreSQL
Queue: BullMQ (default backend: Redis), behind the `QueuePort` interface above
Validation: Zod
Logging: Winston
Notifications: Telegram
Hosting: Railway
Version Control: GitHub

---

## API

Versioned endpoints: `/api/v1/webhook`, `/api/v1/trades`, `/api/v1/status`,
`/api/v1/health`

---

## Trading Workflow

TradingView Alert → Validation → Idempotency Check → Queue → Risk Engine →
Authentication → Proposal → Buy → Contract Monitoring → Trade Journal →
Notifications

---

## Webhook

`POST /api/v1/webhook`

Requirements: JSON only, secret validation, schema validation, timestamp
validation, replay attack prevention, duplicate detection, proper HTTP
responses.

Every webhook contains: `alert_id`, `strategy`, `timestamp`.

`[NEW]` **Clock skew tolerance:** timestamp validation must allow a
configurable window (default ±30 seconds) between alert timestamp and
server-received time. Requests outside this window are rejected as
potential replay attempts; log the rejection with the actual skew observed.

`[NEW]` **Payload versioning:** every webhook payload includes a `version`
field. Zod schemas are versioned accordingly, so a future TradingView alert
format change fails validation explicitly and loudly instead of silently
misparsing fields.

---

## Idempotency

Every alert executes exactly once. Duplicate `alert_id` → HTTP 200, no
re-trade, record the duplicate. Deduplication records have a configurable
retention period (default 7 days) with automatic cleanup.

---

## Queue

Never execute trades inside the webhook handler. The queue must isolate
strategies, prevent race conditions, preserve required ordering, support
retries only for safe operations, and never retry an uncertain buy
operation. Each strategy executes independently so one strategy's failure
never blocks another.

---

## Trading Engine

One persistent Deriv WebSocket connection per authenticated account.
Automatic reconnect, automatic reauthorization, connection health
monitoring, ping/pong support, resume subscriptions, recover open contracts,
recover queue workers, validate every API response. After any restart or
reconnect, the system restores its operational state automatically.

`[UPDATED]` **Contract monitoring mechanism (explicit):** subscribe to
`proposal_open_contract` with `subscribe: 1` for every open position. On
every reconnect, re-subscribe to all contracts that were open before the
disconnect (reconciled against the database, not just in-memory state).
Do not poll for contract status as the primary mechanism — subscription is
the source of truth; polling/reconciliation (below) is the safety net.

---

## `[NEW]` Reconciliation

A scheduled job (default: every 5 minutes, configurable) compares Deriv's
actual account state (`portfolio` and/or `proposal_open_contract` for all
open positions) against the local `trades` table where status = `active`.

On mismatch (a position exists on Deriv but not locally, or vice versa):
- Log the discrepancy at error level with full detail
- Notify Telegram immediately
- Do not attempt automatic correction — surface it for manual review

This is the safety net that catches drift from WebSocket gaps, missed
messages, or the crash scenario described in Database below.

---

## Database

PostgreSQL. Schema migrations. Database transactions for all trade lifecycle
operations. Indexes on `alert_id`, `trade_id`, `strategy`, `timestamp`.

`[UPDATED]` **Trade write ordering (critical):** a trade row must be written
with status `pending` *before* the Buy request is sent to Deriv, not after.
On response: update to `filled` (with contract details) or `failed`. This
ordering exists specifically so that a crash between "Deriv accepts the buy"
and "local write succeeds" leaves a `pending` row that reconciliation (above)
can catch — writing only after success would leave a real open position
with zero local trace if the process dies at the wrong moment.

`[NEW]` **Secrets at rest:** per-strategy webhook secrets stored in Postgres
must be encrypted at the column level (e.g. `pgcrypto` or app-level
encryption with a key from environment/secrets manager), never stored in
plaintext. A database dump or leaked backup must not expose usable secrets.

---

## Dashboard

Professional, minimal, fast, dark theme only, no decorative UI — an
operational console.

Sections: Header (account/balance/equity/P&L/status), Live Market (chart,
price, symbol, timeframe, markers, executed trades), Active Trades, Trade
History, Statistics, Status Bar (TradingView / Queue / Deriv / Database /
Railway / Last Signal / Last Trade / Current Latency).

---

## Account Modes

Deriv Demo (default) and Deriv Live only.

`[UPDATED]` **Concrete demo validation criteria** (previously unspecified —
this is now a hard, non-negotiable gate):
- Minimum **14 consecutive calendar days** in Demo mode with the strategy
  enabled (configurable, but 14 is the default and floor)
- Minimum **30 completed trades** in that period
- Maximum drawdown in Demo during that period must not exceed the
  configured `Maximum Daily Loss` rule scaled to the validation window
- All three conditions must pass simultaneously — meeting the day count with
  too few trades, or vice versa, does not unlock Live

Before Live can be enabled: demo validation criteria met (checked
programmatically, not self-reported) → system health checks pass → user
types the literal string `ENABLE LIVE TRADING` to confirm.

Switching accounts: disconnect → authenticate → verify account → resume
monitoring. Never trade before authentication succeeds.

---

## Strategy Management

Each strategy: Name, Secret (encrypted at rest, see Database), Symbol,
Contract, Stake, Duration, Enabled, Risk Limits. Runs independently, uses
its own webhook secret, cannot affect other strategies if it fails.

---

## Risk Management

Maximum Daily Loss, Daily Profit Target, Maximum Trades, Maximum Stake (%
of account balance), Consecutive Loss Limit, Trading Hours, Emergency Stop.
Reject violating trades, record every rejection, notify Telegram.

---

## Circuit Breaker

Default: 5 consecutive Deriv API failures (configurable). On trigger: stop
automated trading, continue monitoring, notify Telegram, require manual
reset.

---

## Maintenance Mode

Accept and validate webhooks, log events, execute no trades, return a
maintenance response.

---

## Trade Journal

Strategy, Signal, Entry, Exit, Stake, P&L, Result, Execution Time, Latency,
Errors.

---

## Monitoring

Queue depth, average latency, p50/p95 execution time, WebSocket uptime,
memory usage, CPU usage, restart count, webhook success rate. Performance
targets are monitored continuously, never assumed.

---

## Logging

**Application logs:** webhooks, trades, errors, queue, risk events,
reconnect events.

**Audit logs:** every configuration change records timestamp, user,
previous value, new value, reason. Audit logs are immutable (append-only,
no update/delete permission at the DB role level).

---

## Security

Helmet, CORS, rate limiting, input validation, secure headers, environment
variables, secret rotation procedure, structured error handling. Never
expose credentials.

`[NEW]` **Non-blocking notifications:** a Telegram outage must never delay,
queue-block, or otherwise affect the trading pipeline. Notification sends
are fire-and-forget with their own retry/backoff, decoupled from trade
execution.

---

## Notifications (Telegram)

Trade Executed, Trade Closed, Trade Rejected, Connection Lost/Restored,
Circuit Breaker, Daily Summary, Critical Errors, `[NEW]` Reconciliation
Mismatch Detected.

---

## Runtime Verification

On startup and periodically: Deriv API availability, current API limits,
database health, queue health, WebSocket health, Telegram connectivity,
system clock, pending migrations. If critical checks fail: disable Live
trading, notify the administrator.

---

## Deployment

Railway. `railway.json`, environment configuration, health endpoint,
readiness endpoint, deployment documentation.

---

## GitHub

README, Installation Guide, Architecture Guide, API Documentation,
Environment Setup, `.gitignore`, MIT License.

---

## Testing

Test thoroughly using Deriv Demo. Include: webhook tests, queue tests,
duplicate alert tests, risk engine tests, reconnection tests, circuit
breaker tests, strategy isolation tests, end-to-end execution tests, demo
validation period tests.

`[NEW]` **Failure-injection tests** (required, not optional, given this is
explicitly production-grade):
- WebSocket drops mid-buy (between proposal and buy response)
- Redis/queue unavailable during webhook receipt
- Postgres unavailable during trade write
- Deriv returns a malformed or unexpected response shape
- Reconciliation job finds a mismatch — verify alerting fires and no
  auto-correction is attempted

---

## Development Process

Each phase: explain the design, generate complete production-ready code,
include tests, wait for approval before continuing.

## Development Phases

1. Pre-Build Verification
2. Architecture & Project Setup (including `QueuePort` interface definition)
3. Database & Migrations (including pending-trade write pattern, encrypted
   secrets column)
4. Queue & Webhook (including clock skew tolerance, payload versioning)
5. Deriv Integration
6. Trading Engine (including contract monitoring subscriptions)
7. `[NEW]` Reconciliation Job
8. Risk Engine
9. Dashboard
10. Notifications (including non-blocking design)
11. Testing (including failure-injection suite)
12. Railway Deployment
13. Production Readiness Review

---

## Final Deliverable

A complete, production-ready GitHub repository, deployable to Railway,
executing TradingView alerts on Deriv using the verified current API, with
concrete (not aspirational) safeguards around demo validation, trade-write
ordering, state reconciliation, and secrets handling. Every component fully
documented, tested, and maintainable.

---

<!-- ===================== docs/spec/deriv-trading-platform-addendum-v6.md ===================== -->

# Production Specification Addendum (v6)

> This addendum extends v5 (which extends the main v4 spec) and supersedes
> any conflicting requirements. Changes from the latest review are marked
> `[NEW]` or `[UPDATED]`. Unmarked sections are unchanged from v5.

---

## Architecture Principles

Clean Architecture and Domain-Driven Design (DDD). Business logic remains
independent of Express, React, BullMQ, PostgreSQL, Railway, and Deriv
SDK/API implementation details. Every external dependency is accessed
through well-defined interfaces (ports), with infrastructure-specific
adapters implementing those interfaces.

---

## Architecture Decision Records (ADR)

`/docs/adr` directory. Each major decision: Context, Decision, Alternatives
considered, Rationale, Consequences.

Create ADRs for at least:

- Authentication approach
- Queue implementation
- Database design
- Trade reconciliation
- Risk engine
- Dashboard architecture
- Deployment strategy
- `[NEW]` Queue overflow / backpressure policy
- `[NEW]` Contract monitoring mechanism (subscription vs. polling, and why)

---

## Execution State Machine

`[UPDATED]` States, with proposal expiry now explicit:

```
RECEIVED
  ↓
VALIDATED
  ↓
QUEUED
  ↓
AUTHENTICATED
  ↓
PROPOSAL_RECEIVED
  ↓
BUY_SENT
  ↓
BUY_CONFIRMED
  ↓
MONITORING
  ↓
SETTLED
  ↓
COMPLETED
```

Failure states:

- VALIDATION_FAILED
- RISK_REJECTED
- BUY_FAILED
- CONNECTION_FAILED
- RECONCILIATION_REQUIRED
- `[NEW]` PROPOSAL_EXPIRED

`[NEW]` **Proposal expiry handling:** Deriv proposals are tick-priced and
expire within roughly one second. If the time between `PROPOSAL_RECEIVED`
and the intended `BUY_SENT` exceeds the proposal's validity window, the
trade transitions to `PROPOSAL_EXPIRED`, not `BUY_SENT`. The engine must
request a fresh proposal and re-evaluate risk rules against the new price
before proceeding — it must never buy against a stale proposal.

Every state transition is timestamped, persisted, includes the triggering
event, and includes any relevant error details.

`[NEW]` **Stuck-state detection:** if a trade remains in a non-terminal
state (e.g. `BUY_SENT`) for longer than a configurable threshold (default
30 seconds) without progressing, treat this the same as a reconciliation
mismatch — log at error level, notify Telegram, transition to
`RECONCILIATION_REQUIRED`, and surface for manual review. This catches
gateway or event-handling bugs that a pure portfolio-diff reconciliation
check (see main spec) would miss, since the trade may not yet exist on
Deriv's side at all.

---

## Event-Driven Design

Communication between major components occurs through domain events rather
than direct service calls whenever practical.

Core events: AlertReceived, AlertValidated, AlertRejected, TradeQueued,
ProposalReceived, TradeExecuted, TradeClosed, TradeRejected,
CircuitBreakerTriggered, ReconciliationMismatch, MaintenanceModeEnabled,
MaintenanceModeDisabled, `[NEW]` ProposalExpired, `[NEW]` TradeStuckDetected.

`[NEW]` **Correlation ID requirement:** every domain event carries a
`correlation_id` equal to the originating `alert_id`. This is mandatory, not
optional — without it, tracing a single trade's full event history across
an event-driven architecture becomes impractical once volume grows. Include
`correlation_id` in every log line and Telegram notification tied to a
specific trade.

---

## Configuration Versioning

All trading configuration is versioned. Every trade record stores
Configuration version and Strategy version, so historical trades trace back
to the exact configuration that generated them.

`[NEW]` **Interaction with demo validation (critical):** any change to a
strategy's configuration version (stake, risk limits, symbol, contract type,
duration, etc.) resets that strategy's demo validation clock and completed
trade count to zero. A strategy cannot accumulate validation progress under
one configuration and then go Live under a different one. This closes a gap
where editing parameters mid-validation would otherwise let stale progress
count toward the Live-mode gate defined in the main spec.

---

## Deriv Gateway

All interaction with Deriv goes through a single abstraction, `DerivGateway`.
No other component calls the Deriv API directly. Responsible for:
Authentication, Proposal requests, Buy requests, Contract monitoring,
Portfolio queries, Reconnection, Rate-limit handling, Error translation.

`[NEW]` **Rate-limit precedence (resolves conflict with Backpressure
below):** `DerivGateway` is the sole enforcer of Deriv's actual rate limits
and is the only component permitted to throttle outbound API calls based on
those limits. The queue's backpressure rules (below) govern *ingestion* of
alerts into the system — they do not, and must not, attempt to independently
pace *dispatch* to Deriv. If the gateway is throttling, the queue simply
backs up (subject to its own max-depth/overflow rules); it does not try to
out-guess the gateway's pacing.

---

## Backpressure Handling

The queue defines: Maximum queue depth, Overflow behavior, Queue priority
rules, Alert expiration policy. When limits are exceeded: log the event,
notify Telegram, prevent system instability.

`[UPDATED]` Scope clarified: these rules govern how alerts are accepted and
ordered into the queue. Dispatch rate to Deriv is governed exclusively by
`DerivGateway`'s rate-limit handling (see above) — the two must not both try
to enforce pacing.

---

## Time Synchronization

The application verifies host clock synchronization. If clock drift exceeds
the configured threshold: reject new webhook processing, raise a critical
alert, continue monitoring until synchronization is restored.

---

## Health Levels

Three levels: Healthy, Degraded, Critical.

Healthy — everything operational.
Degraded — Telegram unavailable, high latency.
Critical — queue unavailable, database unavailable, Deriv unavailable, risk
engine disabled unexpectedly.

Live trading must never be enabled while the system is in a Critical state.

`[UPDATED]` **Maintenance Mode exception:** entering Maintenance Mode
deliberately does not, by itself, count as a Critical condition, even though
it also halts trading. Maintenance Mode is a separate, intentional state
shown distinctly on the dashboard and status bar — it must not be conflated
with an unplanned Critical failure. The "risk engine disabled" Critical
trigger applies only to *unexpected* risk engine failure/crash, not to an
operator intentionally disabling it via Maintenance Mode.

---

## API Contract Validation

Automated contract tests against the current Deriv API. If request/response
schemas change unexpectedly: fail the tests, produce clear diagnostics,
prevent deployment until reviewed.

---

## Disaster Recovery

Document and test recovery procedures for: Railway restart, PostgreSQL
recovery, Redis recovery, Network interruption, Failed deployment,
Unexpected process termination. Recovery procedures preserve trade integrity
and avoid duplicate execution.

`[NEW]` **Redis persistence requirement (previously implicit, now
explicit):** Redis must run with AOF (appendonly) enabled, or RDB snapshots
at an interval short enough that an acceptable amount of queued/in-flight
alert data could be lost on restart — document the chosen interval and the
resulting worst-case data-loss window explicitly. "Redis recovery" as a bare
bullet is not sufficient; without persistence configured, an unplanned Redis
restart silently drops in-flight queued alerts with no error raised.

---

## Startup Validation

On every startup, verify: Database connectivity, Queue connectivity, Deriv
connectivity, Authentication, Strategy configuration, Pending migrations,
Time synchronization, API compatibility, Required environment variables.

`[UPDATED]` **Failure mode specified (previously ambiguous):** if any
mandatory check fails, the process does **not** crash or crash-loop. It
boots into a `Critical` health state with the HTTP server still running, so
`/health` and `/ready` report the specific failing check(s). Automated
trading stays disabled until checks pass. This matters operationally on
Railway specifically — a crash-looping process triggers repeated redeploy
cycles that look like (and effectively cause) an outage, whereas a running
process reporting `Critical` with a clear reason is diagnosable and doesn't
fight the platform's restart policy.

---

## Operational Philosophy

The system always favors:

1. Correctness over speed.
2. Safety over automation.
3. Consistency over convenience.
4. Explicit failure over silent failure.
5. Recovery over restart.
6. Observability over guesswork.

The platform fails safely, recovers predictably, and provides sufficient
logs and telemetry to diagnose every significant event.

---

<!-- ===================== docs/spec/deriv-trading-platform-addendum-v7.md ===================== -->

# Production Specification Addendum (v7)

This addendum extends v6 and supersedes any conflicting requirements. It
finalizes the production specification before implementation.

---

## Idempotency Integrity

Idempotency applies to both the alert identifier and the payload.

- An `alert_id` may only be accepted once.
- Same `alert_id`, identical payload → HTTP 200, record duplicate, no
  re-execution.
- Same `alert_id`, modified payload → reject, record as a **Security
  Event**, notify Telegram immediately, never execute a trade from the
  modified request.

## Webhook Schema Compatibility

Every webhook payload includes a mandatory schema version. Accept only
explicitly supported versions; reject unsupported/future versions; never
silently downgrade or guess payload formats; log validation failures;
document supported versions in the API docs.

## Strategy-Level Reconciliation

Mismatches affecting only one strategy: pause that strategy only, continue
operating unaffected strategies, preserve diagnostic evidence, notify
Telegram immediately, require manual review before resuming. Mismatches
affecting shared infrastructure or overall system integrity: escalate to a
platform-wide Critical state, disable automated trading until resolved.

## Documentation Requirements

- Architecture Diagram — see `docs/ARCHITECTURE.md`
- Database ER Diagram — see `docs/DATABASE.md`
- Sequence Diagrams (Alert→Execution, Reconnection & Recovery,
  Reconciliation, Circuit Breaker, Demo→Live) — see
  `docs/SEQUENCE_DIAGRAMS.md`
- Operations Runbook — see `docs/RUNBOOK.md`

## Development Governance

Development proceeds only in approved phases — see `PHASES.md`. Each phase:
explain design, reference relevant ADRs, generate complete production-ready
code, generate automated tests, verify acceptance criteria, wait for
explicit approval before continuing.

## Acceptance Criteria

A phase is complete only when: all planned functionality is implemented,
tests pass, documentation is updated, code follows the approved
architecture, no critical defects remain, no unresolved TODOs or
placeholder implementations remain.

## Production Readiness Checklist

See `docs/PRODUCTION_READINESS_CHECKLIST.md` for the full enforced checklist
before Live trading can be enabled.

## Final Objective

A production-ready GitHub repository, deployable to Railway, reliably
executing TradingView alerts on Deriv using the verified current Deriv API —
emphasizing correctness, resilience, observability, security, operational
safety, and maintainability. Every component documented, tested, auditable,
and designed to fail safely with predictable recovery.

---
