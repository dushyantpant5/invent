import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    threads: true,
    maxThreads: 8,
    minThreads: 2,
    isolate: true,
    include: ['tests/**/*.test.ts'],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'src/components/**',
      'src/providers/**',
      'src/types/**',
      '**/.DS_Store',
    ],
    clearMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      include: [
        'src/services/**',
        'src/repositories/**',
        'src/lib/**',
        'src/validators/**',
        'src/app/api/**',
      ],
      exclude: [
        'src/types/**',
        'src/components/**',
        'src/providers/**',
        'src/constants/**',
        '**/.DS_Store',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});
