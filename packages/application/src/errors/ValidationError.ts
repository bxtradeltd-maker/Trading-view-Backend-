import { AppError } from './AppError';

export class ValidationError extends AppError {
  public readonly code = 'VALIDATION_ERROR';
  public readonly httpStatus = 400;
}
