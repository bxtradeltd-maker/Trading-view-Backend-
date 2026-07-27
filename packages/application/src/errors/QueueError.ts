import { AppError } from './AppError';

export class QueueError extends AppError {
  public readonly code = 'QUEUE_ERROR';
  public readonly httpStatus = 503;
}
