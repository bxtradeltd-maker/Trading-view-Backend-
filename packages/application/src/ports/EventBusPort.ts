import { DomainEvent } from '@trading-platform/domain';

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void> | void;

/**
 * EventBusPort — abstracts publish/subscribe for domain events.
 * The Phase 2 in-process EventDispatcher (see ../events/EventDispatcher.ts)
 * is one possible implementer; a distributed bus could implement the
 * same interface later without changing any calling code.
 */
export interface EventBusPort {
  publish(event: DomainEvent): Promise<void>;
  subscribe<T extends DomainEvent>(eventName: string, handler: EventHandler<T>): void;
}
