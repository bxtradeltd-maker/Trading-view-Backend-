import type { ClockPort } from '@trading-platform/application';

/** Real-time implementation of ClockPort. Trivial, but essential — no
 *  Application/Domain code may call `new Date()` directly, which is
 *  what makes clock-skew and stuck-state logic testable in Phase 4/7. */
export class SystemClockAdapter implements ClockPort {
  now(): Date {
    return new Date();
  }

  nowMs(): number {
    return Date.now();
  }
}
