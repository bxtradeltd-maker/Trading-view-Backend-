# ADR-003: DerivGateway Design

## Status
Accepted (Phase 2), incorporating Phase 1 findings. Implementation
deferred to Phase 5.

## Context
`ARCHITECTURE.md` establishes a "Single Deriv access point" principle:
exactly one component may call the Deriv API directly. Phase 1
Pre-Build Verification (see `PHASE1_FINDINGS.md`) confirmed several
facts that constrain this design:
- Auth is via Personal Access Token (PAT), not OAuth — this is a
  headless bot, not a third-party app with human end-users.
- The WebSocket endpoint is
  `wss://ws.derivws.com/websockets/v3?app_id=<id>`, shared by demo and
  live — account context comes from which token you `authorize` with,
  not the URL or app_id.
- Sessions time out after 2 minutes of inactivity — a keepalive is
  mandatory, not optional.
- Deriv publishes no fixed rate limit; the correct approach is calling
  `website_status` for the live `api_call_limits` value and
  self-throttling client-side.
- Available contract types per symbol must be checked live via
  `contracts_for`, not hardcoded — TradingView alert payloads should
  be validated against this before a trade is queued.

## Decision
Define `DerivGatewayPort` as the sole interface for all Deriv
interaction: `authenticate`, `getProposal`, `buy`,
`subscribeToContract`, `getPortfolio`, `getActiveSymbols`,
`getContractsFor`, `getApiCallLimits`, `isConnected`. Implement it in
exactly one class, `DerivGatewayAdapter`, which encodes the confirmed
endpoint template and session timeout as exported constants
(`DERIV_WS_ENDPOINT_TEMPLATE`, `DERIV_SESSION_INACTIVITY_TIMEOUT_MS`)
so Phase 5's implementer has a fixed, already-verified reference point
instead of re-deriving these facts from scratch.

No other class — not the Risk Engine, not the Reconciliation Job, not
the Dashboard backend — is permitted to open a WebSocket to Deriv
directly. They all go through this one adapter via
`DerivGatewayPort`.

## Consequences
**Positive:**
- Reconnection/resubscription logic (per the Reconnection Workflow
  sequence diagram in `DOCUMENTATION.md`) lives in exactly one place,
  so a dropped connection is handled identically regardless of which
  higher-level component was mid-call when it happened.
- Rate-limit self-throttling (via `getApiCallLimits`) is centralized —
  the Risk Engine, Trading Engine, and Reconciliation Job don't each
  need their own throttling logic; they all share one gateway's budget.
- Contract-type validation against live `contracts_for` data (Phase 1
  finding, section 5) has one obvious home: this adapter, before
  `getProposal`/`buy` proceed.

**Negative / tradeoffs:**
- Single point of contention: if `DerivGatewayAdapter` is slow or
  blocked, everything downstream of it stalls. This is accepted
  because Deriv itself is architecturally single-connection-per-
  account anyway — the alternative (multiple independent connections)
  would fight Deriv's own session model, not avoid a real bottleneck.

## Open items for Phase 5
- Exact keepalive mechanism (`ping` vs `time` call, and interval —
  Deriv's 2-minute timeout gives headroom, but the specific choice is
  an implementation detail, not an architectural one).
- Whether `DERIV_APP_ID_DEMO`/`DERIV_APP_ID_LIVE` collapse to a single
  `DERIV_APP_ID` per `PHASE1_FINDINGS.md`'s recommendation — currently
  `env.schema.ts` already assumes the collapsed single-ID form; revisit
  if you decide against that recommendation.
