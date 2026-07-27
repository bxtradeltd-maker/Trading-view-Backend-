import { TradeState } from '../enums/TradeState';
import { ContractType } from '../enums/ContractType';
import { Money } from '../value-objects/Money';
import { SymbolId } from '../value-objects/SymbolId';

/**
 * Trade entity — the aggregate root for a single executed (or attempted)
 * contract. This is a Phase 2 model definition only: no transition
 * methods, no persistence, no business rules beyond basic invariants.
 */
export class Trade {
  constructor(
    public readonly id: string,
    public readonly alertId: string,
    public readonly strategyId: string,
    public readonly symbol: SymbolId,
    public readonly contractType: ContractType,
    public readonly stake: Money,
    public state: TradeState,
    public readonly createdAt: Date,
  ) {}
}
