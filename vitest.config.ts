import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'packages/**/*.test.ts', 'apps/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@trading-platform/domain': path.resolve(__dirname, 'packages/domain/src'),
      '@trading-platform/application': path.resolve(__dirname, 'packages/application/src'),
      '@trading-platform/infrastructure': path.resolve(__dirname, 'packages/infrastructure/src'),
      '@trading-platform/shared': path.resolve(__dirname, 'packages/shared/src'),
    },
  },
});
