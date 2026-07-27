/**
 * LoggerPort — structured logging abstraction. Every log call carries
 * the correlation/trace fields required by DOCUMENTATION.md's
 * observability requirements. The concrete adapter (Winston) lives in
 * Infrastructure and is never referenced above this interface.
 */
export interface LogContext {
  correlationId?: string;
  alertId?: string;
  strategyId?: string;
  tradeId?: string;
  component?: string;
  [key: string]: unknown;
}

export interface LoggerPort {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext & { error?: Error }): void;
}
