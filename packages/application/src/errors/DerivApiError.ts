import { AppError } from './AppError';

export class DerivApiError extends AppError {
  public readonly code = 'DERIV_API_ERROR';
  public readonly httpStatus = 502;
}
