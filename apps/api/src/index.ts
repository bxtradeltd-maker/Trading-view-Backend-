import { loadEnv } from './config/env.schema';
import { buildContainer } from './composition-root';
import { createServer } from './server';

/**
 * Entrypoint. Fails fast on invalid configuration — per Phase 2
 * requirement #7, configuration errors must not allow the process to
 * start in a broken state.
 */
function main(): void {
  let env;
  try {
    env = loadEnv();
  } catch (error) {
    // Deliberately using console here: the logger itself depends on
    // validated config (LOG_LEVEL), so it cannot be used yet.
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  const container = buildContainer(env);
  const app = createServer(container);

  app.listen(env.PORT, () => {
    container.logger.info(`Server listening on port ${env.PORT}`, {
      component: 'bootstrap',
      env: env.NODE_ENV,
    });
  });
}

main();
