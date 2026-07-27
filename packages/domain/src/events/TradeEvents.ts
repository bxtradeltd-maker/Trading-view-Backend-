import { DomainEvent } from './DomainEvent';
import { CorrelationId } from '../value-objects/CorrelationId';
import { TradeState } from '../enums/TradeState';

/**
 * Fired whenever a Trade transitions from one state to another.
 * Transition logic itself lives in Phase 6 (Trading Engine) — this
 * event shape is defined now so Application/Infrastructure can wire
 * subscribers ahead of that implementation.
 */
export class TradeStateChangedEvent extends DomainEvent {
  public readonly eventName = 'trade.state_changed';

  constructor(
    correlationId: CorrelationId,
    public readonly tradeId: string,
    public readonly previousState: TradeState,
    public readonly newState: TradeState,
  ) {
    super(correlationId);
  }
}

/** Fired when a webhook alert is received and passes initial validation. */
export class AlertReceivedEvent extends DomainEvent {
  public readonly eventName = 'alert.received';

  constructor(
    correlationId: CorrelationId,
    public readonly alertId: string,
    public readonly strategyId: string,
  ) {
    super(correlationId);
  }
}

/** Fired when the Risk Engine rejects a proposed trade. */
export class RiskRejectedEvent extends DomainEvent {
  public readonly eventName = 'risk.rejected';

  constructor(
    correlationId: CorrelationId,
    public readonly alertId: string,
    public readonly reason: string,
  ) {
    super(correlationId);
  }
}
