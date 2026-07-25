# Development Phases & Governance

Development proceeds only in approved phases. No phase begins until the
prior phase is reviewed and explicitly approved.

For every phase:
1. Explain the design decisions.
2. Reference the relevant ADRs (see `docs/adr/`).
3. Generate complete production-ready code.
4. Generate automated tests.
5. Verify all acceptance criteria for that phase.
6. Wait for explicit approval before proceeding.

## Acceptance Criteria (applies to every phase)

A phase is complete only when:
- All planned functionality is implemented
- Tests pass successfully
- Documentation is updated
- Code follows the approved architecture
- No critical defects remain
- No unresolved TODOs or placeholder implementations remain

## Phase Tracker

| # | Phase | Status |
|---|---|---|
| 1 | Pre-Build Verification (auth flow, WS endpoint, rate limits, app IDs, supported symbols/contracts) | ⬜ Not started |
| 2 | Architecture & Project Setup (incl. `QueuePort`, `DerivGatewayPort` interface definitions) | ⬜ Not started |
| 3 | Database & Migrations (pending-trade write pattern, encrypted secrets column) | ⬜ Not started |
| 4 | Queue & Webhook (clock skew tolerance, payload versioning, idempotency integrity) | ⬜ Not started |
| 5 | Deriv Integration | ⬜ Not started |
| 6 | Trading Engine (contract monitoring subscriptions, proposal expiry handling) | ⬜ Not started |
| 7 | Reconciliation Job (portfolio diff + stuck-state detection) | ⬜ Not started |
| 8 | Risk Engine | ⬜ Not started |
| 9 | Dashboard | ⬜ Not started |
| 10 | Notifications (non-blocking design) | ⬜ Not started |
| 11 | Testing (incl. failure-injection suite) | ⬜ Not started |
| 12 | Railway Deployment | ⬜ Not started |
| 13 | Production Readiness Review | ⬜ Not started |

## Current Status

This repository currently contains **documentation and scaffolding only**.
No trading engine, gateway, or business logic code exists yet — that begins
at Phase 2, after Phase 1 verification findings are documented and
approved.
