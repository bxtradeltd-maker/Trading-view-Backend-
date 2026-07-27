/**
 * RiskProfile entity — per-strategy risk configuration referenced by
 * the Risk Engine (Phase 8). Only the shape is defined here; the
 * actual evaluation logic is out of scope for Phase 2.
 */
export class RiskProfile {
  constructor(
    public readonly strategyId: string,
    public readonly maxStakePerTrade: number,
    public readonly maxDailyLoss: number,
    public readonly maxConcurrentTrades: number,
    public readonly circuitBreakerFailureThreshold: number,
  ) {}
}
