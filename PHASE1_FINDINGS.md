# Phase 1: Pre-Build Verification — Findings

> Status: Findings documented, pending your review/approval before Phase 2 begins.
> Source: Deriv official developer docs (developers.deriv.com), Deriv API GitHub repos, Deriv community forum.

---

## 1. Authentication Flow

Deriv supports two auth methods. **Recommendation: use API Token (PAT), not OAuth**, since this is a server-side automated bot with no end-user browser login step.

| Method | How it works | Fit for this project |
|---|---|---|
| **API Token (PAT)** | You generate a long-lived token yourself (Deriv account → Security & Limits → API Token), store it as an env var, send it via the `authorize` WebSocket call. | ✅ Matches `DERIV_AUTH_MODE=api_token` already in `.env.example`. No redirects, no user interaction — correct for a headless trading engine. |
| **OAuth 2.0 (+PKCE)** | Browser redirect flow: user logs into Deriv, approves, you exchange a code for a token. Requires a registered `redirect_uri` and HTTPS callback. | ❌ Not needed here — this is for third-party apps with human end-users signing in, not a single-operator bot. |

**Auth sequence for the bot (confirmed):**
1. Open WebSocket connection with `app_id`.
2. Send `authorize` request with the API token as the argument.
3. Server responds with account info (balance, currency, landing company, scopes).
4. All subsequent private calls (buy, portfolio, proposal) run in that authorized session.

**Action item for you:** decide token scopes when generating it — you'll want **Read**, **Trade**, and **Trading information** scopes at minimum. Avoid granting **Payments/Withdrawal** scope to a bot token (least privilege).

**Open question / needs your decision:** `.env.example` has separate `DERIV_API_TOKEN_DEMO` / `DERIV_API_TOKEN_LIVE`. This is correct — each Deriv account (demo and real) has its own token. However `DERIV_APP_ID_DEMO` / `DERIV_APP_ID_LIVE` as *separate* app IDs may be unnecessary: a single registered `app_id` works against both demo and real accounts — the demo-vs-live distinction comes from *which token* you authorize with, not the app_id. Recommend collapsing to a single `DERIV_APP_ID` unless you have a specific reason (e.g. separate markup/analytics tracking) to register two apps.

---

## 2. WebSocket Endpoint

**Base endpoint (confirmed from official Deriv API and SDK docs):**
```
wss://ws.derivws.com/websockets/v3?app_id=YOUR_APP_ID
```

Notes:
- Same endpoint for demo and real trading — account context comes from `authorize`, not the URL.
- `app_id=1089` is Deriv's public test app ID (rate-limited, shared) — **do not use in production**; register your own app at the Deriv API dashboard.
- **Session timeout: 2 minutes of inactivity.** If no request/response happens in that window, Deriv closes the connection. Your `DerivGateway` needs a keepalive (e.g. periodic `ping` or `time` call) — this should be added as an explicit requirement to the Architecture doc's reconnect logic, not left implicit.
- Reconnection must re-run `authorize` and re-subscribe to any open contract streams (this matches the reconnect sequence diagram already in your docs).

---

## 3. Rate Limits

**Key finding: Deriv does not publish fixed numeric rate limits.** This is different from what a lot of scaffolding assumes. Confirmed from Deriv's own API FAQ:

- No fixed published limit on simultaneous or per-minute calls; limits vary by endpoint type and system load.
- **Correct way to check your actual limit programmatically:** call `website_status` and read the `api_call_limits` field — this returns your current, live limits.
- If you exceed limits, you get an error response (no IP ban on first offense) — but persistent abuse can lead to temporary/permanent suspension per Deriv's Terms.
- Deriv's own guidance: implement client-side rate limiting + exponential backoff on retries, and prefer **subscriptions** (`ticks`, `proposal_open_contract` with `subscribe: 1`) over repeated polling to reduce call volume.

**Action item for architecture:** `DerivGateway` (per your ADR) should:
1. Call `website_status` on startup/reconnect and cache `api_call_limits`.
2. Implement a token-bucket or leaky-bucket limiter client-side using that value, rather than a hardcoded assumption.
3. Use exponential backoff on any rate-limit error response.

This should be added as an explicit non-functional requirement in the ADR — it's more important than typical since your Risk Engine and Reconciliation Job will also be making concurrent calls to the same Deriv session.

---

## 4. App ID Registration

- Register at the Deriv API dashboard (linked from developers.deriv.com) → Applications → create new app.
- You'll set: app name, **redirect URI** (only required for OAuth flow — since you're using PAT, this can be a placeholder), and scopes.
- Output: a numeric `app_id` you put in `DERIV_APP_ID` (see collapsing note above).
- **You need to do this yourself** — it requires logging into your own Deriv account. I can't create this on your behalf.

---

## 5. Supported Symbols & Contract Types

- **`active_symbols`** call returns all currently tradable underlyings (e.g. synthetic indices like `R_100`, `R_50`, forex, commodities). Common for Deriv bots to target **Synthetic Indices** since they trade 24/7 (matches your dashboard status bar mentioning "24/7" style monitoring).
- **`contracts_for`** call (pass a symbol from `active_symbols`) returns which contract types, durations, and barriers are currently valid for that symbol. **This must be queried at runtime, not hardcoded** — available contracts per symbol can change.
- Basic contract types relevant to a TradingView-triggered bot: `CALL`/`PUT` (Rise/Fall), with `MULTUP`/`MULTDOWN` (Multipliers) as a possible later addition — but confirm which contract types your strategies actually target before Phase 5 (Deriv Integration), since barrier rules differ (Synthetic Indices support both relative and absolute barriers; most other assets need relative barriers under 24h duration).

**Action item:** Your webhook payload schema (from `API.md`) has `contract_type` and `duration` as freeform fields. Recommend validating incoming webhook `contract_type` against a live `contracts_for` lookup for that symbol before enqueueing, rather than trusting TradingView's alert blindly — this closes a gap the current API spec doesn't explicitly cover.

---

## Summary of Decisions Needed From You

Before Phase 2 starts, please confirm:
1. ✅ / ❌ — Use API Token (PAT) auth, not OAuth (recommended: yes)
2. ✅ / ❌ — Collapse `DERIV_APP_ID_DEMO`/`DERIV_APP_ID_LIVE` into one `DERIV_APP_ID` (recommended: yes, unless you have a markup-tracking reason not to)
3. Which contract type(s) your strategies will actually trade first (Rise/Fall only, or also Multipliers?) — affects Domain layer's Strategy/Trade entity design
4. Confirm you'll register the app yourself at Deriv's dashboard and provide the resulting `app_id` + tokens as Railway env vars (never committed to the repo)

Once you confirm these, Phase 2 (Architecture & Project Setup, including `QueuePort` and `DerivGatewayPort` interfaces) can begin.
