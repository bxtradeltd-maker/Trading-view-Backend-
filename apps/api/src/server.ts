import express, { type Express } from 'express';
import type { Container } from './composition-root';
import { HealthLevel } from '@trading-platform/domain';

/**
 * Presentation layer (Express). Talks only to the Container's ports —
 * never to a concrete infrastructure class directly.
 *
 * Phase 2 scope: only `/api/v1/health` is implemented, matching
 * railway.json's healthcheckPath and DOCUMENTATION.md's requirement
 * that the app always serves health even in a Critical state. Full
 * Startup Validation (DB, queue, Deriv connectivity, auth, clock sync,
 * migrations, required env vars) is a Phase 4+ concern — this handler
 * currently reports a static Healthy stub, clearly marked as such.
 */
export function createServer(container: Container): Express {
  const app = express();
  app.use(express.json());

  app.get('/api/v1/health', (_req, res) => {
    // TODO(Phase 4+): replace with real Startup Validation checks
    // (database, queue, Deriv connectivity, auth, clock sync, pending
    // migrations, required env vars) per DOCUMENTATION.md.
    res.status(200).json({
      status: HealthLevel.HEALTHY,
      note: 'Phase 2 stub — real subsystem checks land in Phase 4+',
      checks: {
        database: 'not_implemented',
        queue: 'not_implemented',
        deriv: 'not_implemented',
        telegram: 'not_implemented',
        clockSync: 'not_implemented',
      },
    });
  });

  container.logger.info('Express app configured', { component: 'server' });

  return app;
}
