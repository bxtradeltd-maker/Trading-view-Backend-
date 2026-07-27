import type { TradeRepositoryPort } from '@trading-platform/application';
import { Trade } from '@trading-platform/domain';
import { InfrastructureError } from '@trading-platform/application';

/**
 * PostgreSQL implementation of TradeRepositoryPort. Only this file
 * (and PostgresStrategyRepository) may import a `pg` client.
 *
 * Phase 2 scope: interface satisfied. Actual SQL, migrations, and the
 * transactional pending-trade write pattern described in DATABASE.md
 * are Phase 3 (Database & Migrations) concerns.
 */
export class PostgresTradeRepository implements TradeRepositoryPort {
  constructor(private readonly connectionString: string) {}

  async save(_trade: Trade): Promise<void> {
    // TODO(Phase 3): INSERT ... ON CONFLICT for upsert semantics,
    // wrapped in a transaction per the pending-trade write pattern.
    throw new InfrastructureError('PostgresTradeRepository.save not yet implemented (Phase 3)');
  }

  async findById(_id: string): Promise<Trade | null> {
    // TODO(Phase 3): SELECT by primary key.
    throw new InfrastructureError('PostgresTradeRepository.findById not yet implemented (Phase 3)');
  }

  async findByAlertId(_alertId: string): Promise<Trade | null> {
    // TODO(Phase 3): SELECT by alert_id (used by webhook idempotency check).
    throw new InfrastructureError(
      'PostgresTradeRepository.findByAlertId not yet implemented (Phase 3)',
    );
  }

  async findByState(_state: string): Promise<Trade[]> {
    // TODO(Phase 3): SELECT WHERE state = $1 (used by Reconciliation Job).
    throw new InfrastructureError(
      'PostgresTradeRepository.findByState not yet implemented (Phase 3)',
    );
  }
}
