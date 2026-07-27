import { Trade } from '@trading-platform/domain';

export interface TradeRepositoryPort {
  save(trade: Trade): Promise<void>;
  findById(id: string): Promise<Trade | null>;
  findByAlertId(alertId: string): Promise<Trade | null>;
  findByState(state: string): Promise<Trade[]>;
}
