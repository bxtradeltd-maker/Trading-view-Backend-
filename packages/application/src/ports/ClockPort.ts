/**
 * ClockPort — abstracts "now" so Application/Domain never call
 * `new Date()` or `Date.now()` directly. Essential for deterministic
 * testing (clock-skew validation, stuck-state detection, etc.).
 */
export interface ClockPort {
  now(): Date;
  nowMs(): number;
}
