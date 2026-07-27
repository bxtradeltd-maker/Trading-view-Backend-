/**
 * Value Object representing a monetary amount with currency.
 * Deliberately simple in Phase 2 — arithmetic/precision rules
 * (e.g. decimal libraries for currency-safe math) are a Phase 3+
 * concern once real stake/payout calculations are implemented.
 */
export class Money {
  private readonly amount: number;
  private readonly currency: string;

  constructor(amount: number, currency: string) {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error('Money amount must be a finite, non-negative number');
    }
    if (!currency || currency.trim().length === 0) {
      throw new Error('Money currency must be provided');
    }
    this.amount = amount;
    this.currency = currency.toUpperCase();
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  toString(): string {
    return `${this.amount.toFixed(2)} ${this.currency}`;
  }
}
