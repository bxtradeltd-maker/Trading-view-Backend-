import { AppError } from './AppError';

export class AuthenticationError extends AppError {
  public readonly code = 'AUTHENTICATION_ERROR';
  public readonly httpStatus = 401;
}
