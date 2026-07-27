import winston from 'winston';
import type { LoggerPort, LogContext } from '@trading-platform/application';

/**
 * Winston implementation of LoggerPort. Only this file may import
 * `winston`. Every log line includes the structured fields required
 * by DOCUMENTATION.md: timestamp, correlation ID, alert/strategy/trade
 * ID, level, component, message.
 */
export class WinstonLoggerAdapter implements LoggerPort {
  private readonly logger: winston.Logger;

  constructor(level: string = 'info') {
    this.logger = winston.createLogger({
      level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [new winston.transports.Console()],
    });
  }

  debug(message: string, context: LogContext = {}): void {
    this.logger.debug(message, context);
  }

  info(message: string, context: LogContext = {}): void {
    this.logger.info(message, context);
  }

  warn(message: string, context: LogContext = {}): void {
    this.logger.warn(message, context);
  }

  error(message: string, context: LogContext & { error?: Error } = {}): void {
    const { error, ...rest } = context;
    this.logger.error(message, {
      ...rest,
      errorMessage: error?.message,
      errorStack: error?.stack,
    });
  }
}
