import { AppError } from './AppError';

export class InfrastructureError extends AppError {
  public readonly code = 'INFRASTRUCTURE_ERROR';
  public readonly httpStatus = 503;
}
