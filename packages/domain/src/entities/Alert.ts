/**
 * Alert entity — represents one incoming TradingView webhook payload,
 * pre-validation. See docs/API.md for the wire schema this is derived
 * from (schema version 1).
 */
export class Alert {
  constructor(
    public readonly id: string,
    public readonly strategyId: string,
    public readonly schemaVersion: number,
    public readonly symbol: string,
    public readonly contractType: string,
    public readonly stake: number,
    public readonly duration: number,
    public readonly receivedAt: Date,
  ) {}
}
