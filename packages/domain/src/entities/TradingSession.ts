import { AccountMode } from '../enums/ContractType';

/**
 * TradingSession entity — represents the currently active Deriv
 * account context (Demo or Live) that the Trading Engine is operating
 * under. Switching modes is gated by the Production Readiness
 * Checklist (see DOCUMENTATION.md) — enforcement logic is Phase 8+.
 */
export class TradingSession {
  constructor(
    public readonly accountMode: AccountMode,
    public readonly startedAt: Date,
    public isActive: boolean,
  ) {}
}
