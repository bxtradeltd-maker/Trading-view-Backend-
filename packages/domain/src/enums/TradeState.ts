/**
 * Trade lifecycle states.
 *
 * Definitions only — transitions are NOT implemented in this phase
 * (Phase 2 scope: Architecture & Project Setup). The state machine's
 * transition rules, guards, and side effects are implemented in
 * Phase 6 (Trading Engine) per PHASES.md.
 */
export enum TradeState {
  RECEIVED = 'RECEIVED',
  VALIDATED = 'VALIDATED',
  QUEUED = 'QUEUED',
  AUTHENTICATED = 'AUTHENTICATED',
  PROPOSAL_RECEIVED = 'PROPOSAL_RECEIVED',
  BUY_SENT = 'BUY_SENT',
  BUY_CONFIRMED = 'BUY_CONFIRMED',
  MONITORING = 'MONITORING',
  SETTLED = 'SETTLED',
  COMPLETED = 'COMPLETED',
  PROPOSAL_EXPIRED = 'PROPOSAL_EXPIRED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  RISK_REJECTED = 'RISK_REJECTED',
  BUY_FAILED = 'BUY_FAILED',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  RECONCILIATION_REQUIRED = 'RECONCILIATION_REQUIRED',
}

/**
 * Terminal states — a trade in one of these states will not transition
 * further under normal operation. Used by Phase 6+ to short-circuit
 * processing; defined here since the state set itself belongs to Domain.
 */
export const TERMINAL_TRADE_STATES: ReadonlySet<TradeState> = new Set([
  TradeState.COMPLETED,
  TradeState.PROPOSAL_EXPIRED,
  TradeState.VALIDATION_FAILED,
  TradeState.RISK_REJECTED,
  TradeState.BUY_FAILED,
]);
