/**
 * Base class for the unified error hierarchy. Every error carries
 * structured metadata (not just a message string) so LoggerPort
 * consumers and API error responses can surface consistent, filterable
 * detail — per DOCUMENTATION.md's error-payload requirements.
 */
export abstract class AppError extends Error {
  public abstract readonly code: string;
  public abstract readonly httpStatus: number;

  constructor(
    message: string,
    public readonly metadata: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      metadata: this.metadata,
    };
  }
}
