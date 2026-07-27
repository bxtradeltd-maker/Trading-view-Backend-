import { AppError } from './AppError';

export class RiskError extends AppError {
  public readonly code = 'RISK_ERROR';
  public readonly httpStatus = 422;
}
