// Domain layer barrel export. Zero external dependencies — see
// docs/DEPENDENCY_RULES.md. Do not import from Application or
// Infrastructure here.

export * from './entities/Trade';
export * from './entities/Strategy';
export * from './entities/Alert';
export * from './entities/RiskProfile';
export * from './entities/TradingSession';

export * from './value-objects/Money';
export * from './value-objects/SymbolId';
export * from './value-objects/CorrelationId';

export * from './events/DomainEvent';
export * from './events/TradeEvents';

export * from './enums/TradeState';
export * from './enums/ContractType';
