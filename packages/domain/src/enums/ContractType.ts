/**
 * Contract types the platform is designed to support.
 *
 * NOTE: which of these are actually enabled is a Phase 1 decision
 * (see PHASE1_FINDINGS.md, item 3) and must additionally be validated
 * at runtime against Deriv's `contracts_for` call per symbol — this
 * enum defines the vocabulary, not the runtime availability.
 */
export enum ContractType {
  CALL = 'CALL', // Rise
  PUT = 'PUT', // Fall
  MULTUP = 'MULTUP',
  MULTDOWN = 'MULTDOWN',
}

export enum AccountMode {
  DEMO = 'DEMO',
  LIVE = 'LIVE',
}

export enum HealthLevel {
  HEALTHY = 'Healthy',
  DEGRADED = 'Degraded',
  CRITICAL = 'Critical',
}
