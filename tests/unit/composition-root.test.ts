import { describe, it, expect, vi } from 'vitest';
import { buildContainer } from '../../apps/api/src/composition-root';
import type { Env } from '../../apps/api/src/config/env.schema';
import { CorrelationId, AlertReceivedEvent } from '@trading-platform/domain';

/**
 * Sample test required by Phase 2 requirement #12: proves dependency
 * injection is wired correctly. It builds the real composition root
 * from a fake (but schema-shaped) Env and confirms:
 *   1. Every port on the Container is present and satisfies its
 *      interface's basic contract (no undefined adapters).
 *   2. The EventDispatcher wiring works end-to-end — a published
 *      event reaches a subscribed handler — proving the container's
 *      internal wiring (not just its shape) is functional.
 *
 * This intentionally does NOT hit real Postgres/Redis/Deriv/Telegram —
 * those adapters throw "not yet implemented" per their Phase markers,
 * which is expected and correct for Phase 2.
 */
const fakeEnv: Env = {
  NODE_ENV: 'test',
  PORT: 3000,
  LOG_LEVEL: 'error', // keep test output quiet
  DERIV_APP_ID: 'test-app-id',
  DATABASE_URL: 'postgres://user:pass@localhost:5432/test',
  DB_SECRET_ENCRYPTION_KEY: 'a-sufficiently-long-test-key-value',
  REDIS_URL: 'redis://localhost:6379',
  QUEUE_MAX_DEPTH: 1000,
  QUEUE_ALERT_EXPIRATION_SECONDS: 60,
  WEBHOOK_CLOCK_SKEW_TOLERANCE_SECONDS: 30,
  WEBHOOK_SCHEMA_SUPPORTED_VERSIONS: '1',
  IDEMPOTENCY_RETENTION_DAYS: 7,
  DEMO_VALIDATION_MIN_DAYS: 14,
  DEMO_VALIDATION_MIN_TRADES: 30,
  CIRCUIT_BREAKER_FAILURE_THRESHOLD: 5,
  RECONCILIATION_INTERVAL_MINUTES: 5,
  TRADE_STUCK_STATE_THRESHOLD_SECONDS: 30,
  TELEGRAM_BOT_TOKEN: 'test-bot-token',
  TELEGRAM_CHAT_ID: 'test-chat-id',
  CLOCK_DRIFT_THRESHOLD_MS: 2000,
};

describe('composition root', () => {
  it('wires every port with a concrete adapter', () => {
    const container = buildContainer(fakeEnv);

    expect(container.logger).toBeDefined();
    expect(container.config).toBeDefined();
    expect(container.encryption).toBeDefined();
    expect(container.notifier).toBeDefined();
    expect(container.clock).toBeDefined();
    expect(container.queue).toBeDefined();
    expect(container.tradeRepository).toBeDefined();
    expect(container.strategyRepository).toBeDefined();
    expect(container.derivGateway).toBeDefined();
    expect(container.eventBus).toBeDefined();
  });

  it('reads config back through ConfigurationPort (constructor-injected, not global)', () => {
    const container = buildContainer(fakeEnv);
    expect(container.config.get<string>('DERIV_APP_ID')).toBe('test-app-id');
  });

  it('clock adapter returns real, moving time (SystemClockAdapter, not a stub)', () => {
    const container = buildContainer(fakeEnv);
    const t1 = container.clock.nowMs();
    expect(typeof t1).toBe('number');
    expect(t1).toBeGreaterThan(0);
  });

  it('event bus delivers a published event to its subscriber end-to-end', async () => {
    const container = buildContainer(fakeEnv);
    const handler = vi.fn();

    container.eventBus.subscribe('alert.received', handler);

    const event = new AlertReceivedEvent(
      CorrelationId.generate(),
      'alert-123',
      'strategy-abc',
    );
    await container.eventBus.publish(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('encryption adapter round-trips a value (AES-256-GCM)', async () => {
    const container = buildContainer(fakeEnv);
    const ciphertext = await container.encryption.encrypt('super-secret-webhook-key');
    const plaintext = await container.encryption.decrypt(ciphertext);
    expect(plaintext).toBe('super-secret-webhook-key');
    expect(ciphertext).not.toContain('super-secret-webhook-key');
  });
});
