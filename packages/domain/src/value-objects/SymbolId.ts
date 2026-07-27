/**
 * Value Object for a Deriv underlying symbol (e.g. "R_100").
 * Validity against Deriv's live `active_symbols` list is an
 * Infrastructure-layer concern (DerivGatewayPort), not enforced here —
 * Domain only guarantees shape, not live tradability.
 */
export class SymbolId {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('SymbolId must be a non-empty string');
    }
    this.value = value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: SymbolId): boolean {
    return this.value === other.value;
  }
}
