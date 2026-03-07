// eslint.config.mjs — ESLint Flat Config (ESLint 9)
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import importPlugin from 'eslint-plugin-import';
import nextPlugin from '@next/eslint-plugin-next';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prettierConfig = JSON.parse(readFileSync(resolve(__dirname, './.prettierrc.json'), 'utf-8'));

// FlatCompat is kept for potential legacy plugin compatibility.
// The recommendedConfig below is not applied — it is only used as a base
// if compat.extends('eslint:recommended') is called, which it is not currently.
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: {
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
});

void compat; // suppress unused variable warning

export default [
  // ─── Global ignores ────────────────────────────────────────────────────────
  {
    ignores: ['node_modules', '.next', 'dist', 'build', 'eslint.config.mjs', 'scripts/'],
  },

  // ─── Base rules — all source files ─────────────────────────────────────────
  {
    files: ['**/*.{js,ts,jsx,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
      'unused-imports': unusedImportsPlugin,
      import: importPlugin,
      next: nextPlugin,
    },
    rules: {
      // ── Formatting ──────────────────────────────────────────────────────────
      'prettier/prettier': ['error', prettierConfig],

      // ── Unused code ─────────────────────────────────────────────────────────
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // ── TypeScript ──────────────────────────────────────────────────────────
      // Upgraded from warn → error: `any` defeats the purpose of TypeScript.
      // Use `unknown` and narrow the type, or define a proper interface.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // ── Import order ────────────────────────────────────────────────────────
      'import/order': [
        'warn',
        {
          groups: [['builtin', 'external'], ['internal'], ['parent', 'sibling', 'index']],
          'newlines-between': 'always',
        },
      ],
    },
  },

  // ─── Layer boundary: features/ ─────────────────────────────────────────────
  // Features are client-side only. They communicate with the server exclusively
  // through API route HTTP calls — never by importing server-side modules.
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/services', '@/services/**'],
              message:
                'Feature modules must not import from services/. ' +
                'Services are server-only. Make an HTTP call via the feature\'s *.api.ts file instead.',
            },
            {
              group: ['@/repositories', '@/repositories/**'],
              message:
                'Feature modules must not import from repositories/. ' +
                'Repositories are server-only and must never run in the browser.',
            },
          ],
        },
      ],
    },
  },

  // ─── Layer boundary: components/ ───────────────────────────────────────────
  // UI components interact with data only through TanStack Query hooks
  // exported from features/. They must not reach into server-side layers.
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/services', '@/services/**'],
              message:
                'Components must not import from services/. ' +
                'Use a query hook from features/ instead (e.g. useProducts, useCreateInventory).',
            },
            {
              group: ['@/repositories', '@/repositories/**'],
              message:
                'Components must not import from repositories/. ' +
                'Repositories are server-only.',
            },
          ],
        },
      ],
    },
  },

  // ─── Layer boundary: services/ ─────────────────────────────────────────────
  // Services are pure business logic. They must not know about the HTTP layer
  // (routes) or the client-side layer (features).
  {
    files: ['src/services/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features', '@/features/**'],
              message:
                'Services must not import from features/. ' +
                'features/ is client-side only. Services have no knowledge of the UI.',
            },
          ],
        },
      ],
      // Allow console.error/warn in services (unexpected failures worth logging).
      // Disallow console.log — use structured logging or remove debug output.
      'no-console': ['warn', { allow: ['error', 'warn'] }],
    },
  },

  // ─── Layer boundary: repositories/ ─────────────────────────────────────────
  // Repositories are the lowest layer — pure data access.
  // They must not depend on anything above them.
  {
    files: ['src/repositories/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/services', '@/services/**'],
              message:
                'Repositories must not import from services/. ' +
                'Repositories are the lowest layer and must not have upward dependencies.',
            },
            {
              group: ['@/features', '@/features/**'],
              message:
                'Repositories must not import from features/. ' +
                'Repositories are server-only and have no knowledge of the UI.',
            },
          ],
        },
      ],
      // Repositories should never log. Throw DatabaseError and let the caller decide.
      'no-console': 'error',
    },
  },

  // ─── Layer boundary: app/api/ (route handlers) ─────────────────────────────
  // Routes are the HTTP boundary. They call services — never repositories directly.
  // They must not import client-side modules.
  {
    files: ['src/app/api/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/repositories', '@/repositories/**'],
              message:
                'Route handlers must not import from repositories/. ' +
                'Call a Service method instead — routes must not bypass the service layer.',
            },
            {
              group: ['@/features', '@/features/**'],
              message:
                'Route handlers must not import from features/. ' +
                'features/ is client-side only.',
            },
          ],
        },
      ],
      // Route handlers should not log debug output.
      'no-console': ['warn', { allow: ['error', 'warn'] }],
    },
  },
];
