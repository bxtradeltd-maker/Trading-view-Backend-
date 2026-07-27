import { CorrelationId } from '../value-objects/CorrelationId';

/**
 * Base class for all Domain Events. Every event carries a correlation
 * ID (for tracing an alert through the whole pipeline) and an
 * occurredAt timestamp. Concrete events extend this and add their own
 * payload; they remain plain data — no behavior, no infrastructure.
 */
export abstract class DomainEvent {
  public readonly correlationId: CorrelationId;
  public readonly occurredAt: Date;
  public abstract readonly eventName: string;

  protected constructor(correlationId: CorrelationId, occurredAt: Date = new Date()) {
    this.correlationId = correlationId;
    this.occurredAt = occurredAt;
  }
}
