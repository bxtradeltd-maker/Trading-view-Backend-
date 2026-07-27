import { z } from 'zod';

/**
 * Type-safe environment schema. Validated once at startup — if any
 * required variable is missing or malformed, the process exits
 * immediately (fail-fast) rather than starting in a broken state.
 * Matches the variable set already defined in the backend .env.example.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Deriv (see PHASE1_FINDINGS.md — single APP_ID recommended;
  // DEMO/LIVE distinction comes from which token you authorize with)
  DERIV_APP_ID: z.string().min(1),
  DERIV_API_TOKEN_DEMO: z.string().optional(),
  DERIV_API_TOKEN_LIVE: z.string().optional(),
  DERIV_WS_ENDPOINT: z.string().url().optional(),

  DATABASE_URL: z.string().min(1),
  DB_SECRET_ENCRYPTION_KEY: z.string().min(16, 'must be at least 16 chars'),

  REDIS_URL: z.string().min(1),
  QUEUE_MAX_DEPTH: z.coerce.number().int().positive().default(1000),
  QUEUE_ALERT_EXPIRATION_SECONDS: z.coerce.number().int().positive().default(60),

  WEBHOOK_CLOCK_SKEW_TOLERANCE_SECONDS: z.coerce.number().int().positive().default(30),
  WEBHOOK_SCHEMA_SUPPORTED_VERSIONS: z.string().default('1'),

  IDEMPOTENCY_RETENTION_DAYS: z.coerce.number().int().positive().default(7),

  DEMO_VALIDATION_MIN_DAYS: z.coerce.number().int().positive().default(14),
  DEMO_VALIDATION_MIN_TRADES: z.coerce.number().int().positive().default(30),

  CIRCUIT_BREAKER_FAILURE_THRESHOLD: z.coerce.number().int().positive().default(5),

  RECONCILIATION_INTERVAL_MINUTES: z.coerce.number().int().positive().default(5),
  TRADE_STUCK_STATE_THRESHOLD_SECONDS: z.coerce.number().int().positive().default(30),

  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_CHAT_ID: z.string().min(1),

  CLOCK_DRIFT_THRESHOLD_MS: z.coerce.number().int().positive().default(2000),
});

export type Env = z.infer<typeof envSchema>;

/** Validates `process.env`; throws with a readable message on failure. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}
