import {
  WinstonLoggerAdapter,
  RailwayConfigurationAdapter,
  NodeEncryptionAdapter,
  TelegramNotificationAdapter,
  SystemClockAdapter,
  BullMqQueueAdapter,
  PostgresTradeRepository,
  PostgresStrategyRepository,
  DerivGatewayAdapter,
} from '@trading-platform/infrastructure';
import { EventDispatcher } from '@trading-platform/application';
import type {
  LoggerPort,
  ConfigurationPort,
  EncryptionPort,
  NotificationPort,
  ClockPort,
  QueuePort,
  TradeRepositoryPort,
  StrategyRepositoryPort,
  DerivGatewayPort,
  EventBusPort,
} from '@trading-platform/application';
import type { Env } from './config/env.schema';

/**
 * Composition root — the ONE place in the whole application where
 * concrete Infrastructure classes are instantiated and wired together.
 * Everywhere else, code depends on ports (interfaces) only.
 *
 * Per Phase 2 requirements: constructor injection only, no DI
 * container/framework, no service locator, no global singletons.
 * Swapping an adapter (e.g. Postgres -> a test double) means changing
 * exactly one line here — nothing else in the app needs to know.
 */
export interface Container {
  logger: LoggerPort;
  config: ConfigurationPort;
  encryption: EncryptionPort;
  notifier: NotificationPort;
  clock: ClockPort;
  queue: QueuePort;
  tradeRepository: TradeRepositoryPort;
  strategyRepository: StrategyRepositoryPort;
  derivGateway: DerivGatewayPort;
  eventBus: EventBusPort;
}

export function buildContainer(env: Env): Container {
  const logger: LoggerPort = new WinstonLoggerAdapter(env.LOG_LEVEL);
  const config: ConfigurationPort = new RailwayConfigurationAdapter(env);
  const encryption: EncryptionPort = new NodeEncryptionAdapter(env.DB_SECRET_ENCRYPTION_KEY);
  const notifier: NotificationPort = new TelegramNotificationAdapter(
    env.TELEGRAM_BOT_TOKEN,
    env.TELEGRAM_CHAT_ID,
  );
  const clock: ClockPort = new SystemClockAdapter();
  const queue: QueuePort = new BullMqQueueAdapter(env.REDIS_URL);
  const tradeRepository: TradeRepositoryPort = new PostgresTradeRepository(env.DATABASE_URL);
  const strategyRepository: StrategyRepositoryPort = new PostgresStrategyRepository(
    env.DATABASE_URL,
  );
  const derivGateway: DerivGatewayPort = new DerivGatewayAdapter(env.DERIV_APP_ID);
  const eventBus: EventBusPort = new EventDispatcher(logger);

  return {
    logger,
    config,
    encryption,
    notifier,
    clock,
    queue,
    tradeRepository,
    strategyRepository,
    derivGateway,
    eventBus,
  };
}
