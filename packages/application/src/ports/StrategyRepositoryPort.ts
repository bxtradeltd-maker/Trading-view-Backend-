import { Strategy } from '@trading-platform/domain';

export interface StrategyRepositoryPort {
  findById(id: string): Promise<Strategy | null>;
  findAll(): Promise<Strategy[]>;
  save(strategy: Strategy): Promise<void>;
}
