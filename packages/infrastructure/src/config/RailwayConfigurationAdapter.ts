import type { ConfigurationPort } from '@trading-platform/application';

/**
 * RailwayConfigurationAdapter — reads validated configuration from
 * `process.env`. Named for the deployment target (Railway sets env
 * vars directly; there is no Railway-specific SDK involved), but this
 * would work identically for any 12-factor deployment.
 *
 * Validation itself happens once, at startup, in
 * apps/api/src/config/env.schema.ts — this adapter wraps the already-
 * validated result so ConfigurationPort consumers get type-safe reads
 * without re-validating on every call.
 */
export class RailwayConfigurationAdapter implements ConfigurationPort {
  constructor(private readonly validatedConfig: Readonly<Record<string, unknown>>) {}

  get<T = string>(key: string): T {
    if (!(key in this.validatedConfig)) {
      throw new Error(`Configuration key "${key}" was not found in validated config`);
    }
    return this.validatedConfig[key] as T;
  }

  getOrDefault<T = string>(key: string, fallback: T): T {
    return (this.validatedConfig[key] as T) ?? fallback;
  }

  getAll(): Readonly<Record<string, unknown>> {
    return this.validatedConfig;
  }
}
