/**
 * ConfigurationPort — type-safe access to validated environment
 * configuration. Validation happens once at startup (fail-fast); see
 * apps/api/src/config/env.schema.ts and RailwayConfigurationAdapter.
 */
export interface ConfigurationPort {
  get<T = string>(key: string): T;
  getOrDefault<T = string>(key: string, fallback: T): T;
  getAll(): Readonly<Record<string, unknown>>;
}
