import type { QueuePort, EnqueueOptions } from '@trading-platform/application';
import { QueueError } from '@trading-platform/application';

/**
 * BullMQ implementation of QueuePort. Only this file may import
 * `bullmq` — no other layer is permitted to know it exists.
 *
 * Phase 2 scope: interface satisfied, connection wiring present.
 * Actual job processors and retry/backoff policy are Phase 4 (Queue &
 * Webhook) concerns. TODOs below mark exactly that boundary.
 */
export class BullMqQueueAdapter implements QueuePort {
  private connected = false;

  constructor(private readonly redisUrl: string) {}

  async enqueue(queueName: string, payload: unknown, _options?: EnqueueOptions): Promise<string> {
    // TODO(Phase 4): instantiate `bullmq` Queue for `queueName`, call
    // `.add()` with `_options` mapped to BullMQ's JobsOptions
    // (attempts, delay, jobId), enforcing QUEUE_MAX_DEPTH from config.
    void payload;
    throw new QueueError('BullMqQueueAdapter.enqueue not yet implemented (Phase 4)', {
      queueName,
    });
  }

  process(queueName: string, _handler: (payload: unknown) => Promise<void>): void {
    // TODO(Phase 4): instantiate `bullmq` Worker for `queueName`,
    // wrap `_handler` with dead-letter routing on repeated failure.
    void queueName;
    throw new QueueError('BullMqQueueAdapter.process not yet implemented (Phase 4)', { queueName });
  }

  async retry(queueName: string, jobId: string): Promise<void> {
    // TODO(Phase 4): fetch job by jobId and call `.retry()`.
    throw new QueueError('BullMqQueueAdapter.retry not yet implemented (Phase 4)', {
      queueName,
      jobId,
    });
  }

  async moveToDeadLetter(queueName: string, jobId: string, reason: string): Promise<void> {
    // TODO(Phase 4): move job to a `${queueName}:dead-letter` queue,
    // recording `reason` per the QueuePort dead-letter contract.
    throw new QueueError('BullMqQueueAdapter.moveToDeadLetter not yet implemented (Phase 4)', {
      queueName,
      jobId,
      reason,
    });
  }

  async getDepth(queueName: string): Promise<number> {
    // TODO(Phase 4): return `await queue.count()`.
    throw new QueueError('BullMqQueueAdapter.getDepth not yet implemented (Phase 4)', {
      queueName,
    });
  }

  isConnected(): boolean {
    return this.connected;
  }
}
