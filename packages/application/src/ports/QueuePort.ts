/**
 * QueuePort — abstracts the job queue (implemented by BullMQ in
 * Infrastructure). Application and Domain code depend only on this
 * interface; no BullMQ types may leak above Infrastructure.
 */
export interface EnqueueOptions {
  jobId?: string;
  delayMs?: number;
  attempts?: number;
}

export interface QueuePort<TPayload = unknown> {
  enqueue(queueName: string, payload: TPayload, options?: EnqueueOptions): Promise<string>;
  process(queueName: string, handler: (payload: TPayload) => Promise<void>): void;
  retry(queueName: string, jobId: string): Promise<void>;
  moveToDeadLetter(queueName: string, jobId: string, reason: string): Promise<void>;
  getDepth(queueName: string): Promise<number>;
}
