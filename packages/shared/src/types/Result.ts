/**
 * Result type for operations that can fail without throwing — used
 * where a failure is an expected outcome (e.g. validation) rather
 * than an exceptional one. Shared across layers since it carries no
 * infrastructure or domain-specific meaning of its own.
 */
export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { success: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}
