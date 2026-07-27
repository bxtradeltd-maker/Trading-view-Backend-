# Folder Structure Guide

```
trading-platform/
├── apps/
│   ├── api/                        Presentation layer host
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── env.schema.ts   Zod schema + fail-fast loadEnv()
│   │   │   ├── composition-root.ts Manual DI wiring (the one place
│   │   │   │                       concrete adapters meet ports)
│   │   │   ├── server.ts           Express app, /api/v1/health
│   │   │   └── index.ts            Entrypoint (loads env, builds
│   │   │                           container, starts server)
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── dashboard/                  Placeholder — Phase 9
│       └── README.md
│
├── packages/
│   ├── domain/                     Zero external dependencies
│   │   └── src/
│   │       ├── entities/           Trade, Strategy, Alert, RiskProfile,
│   │       │                       TradingSession
│   │       ├── value-objects/      Money, SymbolId, CorrelationId
│   │       ├── events/             DomainEvent base + Trade/Alert/Risk events
│   │       └── enums/              TradeState (16-state machine, definitions
│   │                               only), ContractType, AccountMode, HealthLevel
│   │
│   ├── application/                Depends only on domain
│   │   └── src/
│   │       ├── ports/              All 10 required ports (one file each)
│   │       ├── errors/             AppError base + 6 concrete error types
│   │       └── events/             EventDispatcher (in-process EventBusPort impl)
│   │
│   ├── infrastructure/             Implements application ports only
│   │   └── src/
│   │       ├── queue/              BullMqQueueAdapter
│   │       ├── persistence/        PostgresTradeRepository, PostgresStrategyRepository
│   │       ├── deriv/               DerivGatewayAdapter
│   │       ├── notifications/      TelegramNotificationAdapter
│   │       ├── logging/            WinstonLoggerAdapter
│   │       ├── config/             RailwayConfigurationAdapter
│   │       ├── crypto/             NodeEncryptionAdapter
│   │       └── clock/              SystemClockAdapter
│   │
│   └── shared/                     Cross-cutting utility types
│       └── src/types/              Result<T,E>
│
├── docs/
│   ├── ARCHITECTURE_OVERVIEW.md
│   ├── FOLDER_STRUCTURE.md         (this file)
│   ├── DEPENDENCY_RULES.md
│   └── adr/
│       ├── ADR-001-clean-architecture.md
│       ├── ADR-002-queueport-design.md
│       └── ADR-003-derivgateway-design.md
│
├── tests/
│   └── unit/
│       └── composition-root.test.ts  Proves DI wiring works end-to-end
│
├── scripts/                        Empty — populated as later phases need
│                                    operational scripts (migrate, seed, etc.)
│
├── package.json                    npm workspaces root
├── tsconfig.base.json              Shared compiler options + path aliases
└── vitest.config.ts                Test runner config, matches path aliases
```

## Why this shape

- **`apps/` vs `packages/`** — apps are deployable units (the API
  server, eventually the dashboard); packages are libraries consumed
  by one or more apps. Only `apps/api` has a `start`/`dev` script;
  packages are compiled but never run standalone.
- **One port per file** under `packages/application/src/ports/` —
  keeps each interface reviewable independently and makes it obvious
  at a glance which ports exist (matches the Phase 2 required list
  exactly: QueuePort, DerivGatewayPort, TradeRepository,
  StrategyRepository, EventBusPort, NotificationPort, ClockPort,
  LoggerPort, ConfigurationPort, EncryptionPort).
- **One adapter per file** under `packages/infrastructure/src/` —
  mirrors the ports 1:1 so it's easy to trace "which class implements
  this interface" without searching.
