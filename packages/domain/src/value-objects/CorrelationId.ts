import { randomUUID } from 'node:crypto';

/**
 * Value Object wrapping a correlation identifier used to trace a single
 * alert/trade across logs, events, and infrastructure boundaries.
 * Immutable by construction; equality is by value, not reference.
 */
export class CorrelationId {
  private readonly value: string;

  private constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('CorrelationId must be a non-empty string');
    }
    this.value = value;
  }

  static generate(): CorrelationId {
    return new CorrelationId(randomUUID());
  }

  static fromString(value: string): CorrelationId {
    return new CorrelationId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: CorrelationId): boolean {
    return this.value === other.value;
  }
}
