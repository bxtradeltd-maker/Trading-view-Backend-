import { DomainEvent } from '@trading-platform/domain';
import { EventBusPort, EventHandler } from '../ports/EventBusPort';
import { LoggerPort } from '../ports/LoggerPort';

/**
 * In-process implementation of EventBusPort. This is the Phase 2
 * reference implementation — sufficient for a single-process
 * deployment. A future distributed bus (e.g. Redis pub/sub) could
 * implement EventBusPort identically without any calling code changing,
 * which is the point of depending on the port rather than this class.
 *
 * Constructor injection only: takes its LoggerPort dependency directly,
 * no service locator, no global singleton.
 */
export class EventDispatcher implements EventBusPort {
  private readonly handlers = new Map<string, EventHandler[]>();

  constructor(private readonly logger: LoggerPort) {}

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventName) ?? [];

    this.logger.debug('Dispatching event', {
      component: 'EventDispatcher',
      correlationId: event.correlationId.toString(),
      eventName: event.eventName,
      handlerCount: handlers.length,
    });

    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error('Event handler threw', {
          component: 'EventDispatcher',
          correlationId: event.correlationId.toString(),
          eventName: event.eventName,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }
  }

  subscribe<T extends DomainEvent>(eventName: string, handler: EventHandler<T>): void {
    const existing = this.handlers.get(eventName) ?? [];
    existing.push(handler as EventHandler);
    this.handlers.set(eventName, existing);
  }
}
