import type { StrategyRepositoryPort } from '@trading-platform/application';
import { Strategy } from '@trading-platform/domain';
import { InfrastructureError } from '@trading-platform/application';

export class PostgresStrategyRepository implements StrategyRepositoryPort {
  constructor(private readonly connectionString: string) {}

  async findById(_id: string): Promise<Strategy | null> {
    // TODO(Phase 3): SELECT by primary key, decrypt webhook secret ref
    // via EncryptionPort at the Application layer, not here.
    throw new InfrastructureError(
      'PostgresStrategyRepository.findById not yet implemented (Phase 3)',
    );
  }

  async findAll(): Promise<Strategy[]> {
    // TODO(Phase 3): SELECT * FROM strategies.
    throw new InfrastructureError(
      'PostgresStrategyRepository.findAll not yet implemented (Phase 3)',
    );
  }

  async save(_strategy: Strategy): Promise<void> {
    // TODO(Phase 3): UPSERT, incrementing config_version on change per
    // the Strategy Config Versioning requirement in DATABASE.md.
    throw new InfrastructureError(
      'PostgresStrategyRepository.save not yet implemented (Phase 3)',
    );
  }
}
