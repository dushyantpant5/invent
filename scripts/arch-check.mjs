#!/usr/bin/env node
/**
 * Architecture Check Script
 *
 * Enforces structural patterns that ESLint import rules cannot catch.
 * Complements eslint.config.mjs — ESLint handles what-can-import-what;
 * this script handles how code behaves once it is imported.
 *
 * Exit codes:
 *   0 = all checks passed (warnings may be present)
 *   1 = one or more critical violations found
 *
 * Usage:
 *   node scripts/arch-check.mjs          (normal run)
 *   node scripts/arch-check.mjs --ci     (same — exit 1 on any critical)
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

let errorCount = 0;
let warnCount = 0;
let checkCount = 0;

const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

function rel(filePath) {
  return relative(ROOT, filePath);
}

function critical(file, message) {
  console.error(`  ${RED}${BOLD}✖ CRITICAL${RESET}  ${DIM}${rel(file)}${RESET}`);
  console.error(`             ${message}\n`);
  errorCount++;
}

function warning(file, message) {
  console.warn(`  ${YELLOW}${BOLD}⚠ WARNING${RESET}   ${DIM}${rel(file)}${RESET}`);
  console.warn(`             ${message}\n`);
  warnCount++;
}

function passed(label) {
  console.log(`  ${GREEN}✔${RESET} ${label}`);
  checkCount++;
}

function getAllFiles(dir, extensions = ['.ts', '.tsx']) {
  const results = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (['node_modules', '.next', 'dist', 'build'].includes(entry)) continue;
    if (statSync(fullPath).isDirectory()) {
      results.push(...getAllFiles(fullPath, extensions));
    } else if (extensions.some((ext) => fullPath.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

function read(filePath) {
  return readFileSync(filePath, 'utf-8');
}

function matchesPath(filePath, segment) {
  return filePath.replace(/\\/g, '/').includes(segment);
}

// ─── Collect all source files ─────────────────────────────────────────────────

const allFiles = getAllFiles(SRC);
const routeFiles = allFiles.filter(
  (f) => matchesPath(f, '/app/api/') && f.endsWith('route.ts')
);
const serviceFiles = allFiles.filter(
  (f) => matchesPath(f, '/services/') && !f.endsWith('lib.ts')
);
const repoFiles = allFiles.filter(
  (f) => matchesPath(f, '/repositories/') && !f.endsWith('lib.ts')
);
const featureApiFiles = allFiles.filter(
  (f) => matchesPath(f, '/features/') && f.endsWith('.api.ts')
);
const featureQueryFiles = allFiles.filter(
  (f) => matchesPath(f, '/features/') && f.endsWith('.queries.ts')
);

console.log(`\n${BOLD}Architecture Check${RESET}  —  ${allFiles.length} source files scanned\n`);
console.log('─'.repeat(60));

// ─────────────────────────────────────────────────────────────────────────────
// CRITICAL CHECKS
// ─────────────────────────────────────────────────────────────────────────────

// 1. No `new PrismaClient()` outside repositories/index.ts
// ─────────────────────────────────────────────────────────
{
  const label = 'No raw PrismaClient instantiation outside repositories/index.ts';
  let violations = 0;
  for (const file of allFiles) {
    if (matchesPath(file, '/repositories/index.ts')) continue;
    const content = read(file);
    if (/new\s+PrismaClient\s*\(/.test(content)) {
      critical(
        file,
        '`new PrismaClient()` is only allowed in `src/repositories/index.ts`.\n' +
          '             Import the shared singleton instead: `import prisma from \'@/repositories\''
      );
      violations++;
    }
  }
  if (!violations) passed(label);
}

// 2. All route handlers must use withErrorHandling
// ─────────────────────────────────────────────────
{
  const label = 'All route handlers wrapped with withErrorHandling';
  let violations = 0;
  for (const file of routeFiles) {
    const content = read(file);
    if (!/withErrorHandling/.test(content)) {
      critical(
        file,
        'Route handler is missing `withErrorHandling`.\n' +
          '             Wrap the exported handler: `export const POST = withErrorHandling(async (req) => { ... })`'
      );
      violations++;
    }
  }
  if (!violations) passed(label);
}

// 3. API functions must be pure — no toast calls, no navigation
// ─────────────────────────────────────────────────────────────
{
  const label = 'Feature API functions are pure (no side effects)';
  let violations = 0;
  for (const file of featureApiFiles) {
    const content = read(file);
    if (/ToastService/.test(content)) {
      critical(
        file,
        '`ToastService` must not be called in API functions.\n' +
          '             Move toast calls to the query hook in `*.queries.ts`.'
      );
      violations++;
    }
    if (/useRouter\b|router\.push\b/.test(content)) {
      critical(
        file,
        '`router.push` / `useRouter` must not be used in API functions.\n' +
          '             Move navigation to the query hook via the `redirectTo` option.'
      );
      violations++;
    }
    if (/console\.error\b|console\.warn\b/.test(content)) {
      critical(
        file,
        'API functions must not log errors.\n' +
          '             `useNavigatingMutation` logs errors automatically in its `onError` handler.'
      );
      violations++;
    }
  }
  if (!violations) passed(label);
}

// 4. Services must not call prisma model methods directly
// ────────────────────────────────────────────────────────
// Services may import `prisma` for `$transaction()` — that is allowed.
// Direct model queries (prisma.users.findUnique, etc.) must go through a Repository.
{
  const label = 'Services use Repositories — no direct prisma model calls';
  const directQuery =
    /\bprisma\.(users|sessions|email_otps|inventories|inventory_codes|user_inventory_roles|user_profiles)\./;
  let violations = 0;
  for (const file of serviceFiles) {
    const content = read(file);
    if (directQuery.test(content)) {
      critical(
        file,
        'Service contains a direct `prisma.{model}.*` call.\n' +
          '             Create a method in the relevant Repository and call that instead.'
      );
      violations++;
    }
  }
  if (!violations) passed(label);
}

// 5. Repositories must not import from services
// ─────────────────────────────────────────────
{
  const label = 'Repositories do not import from services (no upward dependency)';
  let violations = 0;
  for (const file of repoFiles) {
    const content = read(file);
    if (/@\/services\/|from ['"]\.\.\/services/.test(content)) {
      critical(
        file,
        'Repository imports from `services/`. Repositories are the lowest layer and must\n' +
          '             not depend on anything above them.'
      );
      violations++;
    }
  }
  if (!violations) passed(label);
}

// ─────────────────────────────────────────────────────────────────────────────
// WARNING CHECKS
// ─────────────────────────────────────────────────────────────────────────────

// 6. console.log in server-side code
// ───────────────────────────────────
{
  const label = 'No console.log in server-side code';
  const serverFiles = [...routeFiles, ...serviceFiles, ...repoFiles];
  let violations = 0;
  for (const file of serverFiles) {
    const content = read(file);
    const matches = [...content.matchAll(/console\.log\s*\(/g)];
    if (matches.length > 0) {
      warning(
        file,
        `${matches.length} console.log() call(s) — remove before shipping to production.`
      );
      violations++;
    }
  }
  if (!violations) passed(label);
}

// 7. useMutation used directly in query files instead of useNavigatingMutation
// ─────────────────────────────────────────────────────────────────────────────
{
  const label = 'Mutation hooks use useNavigatingMutation (not raw useMutation)';
  let violations = 0;
  for (const file of featureQueryFiles) {
    const content = read(file);
    // Detect direct import of useMutation from tanstack (not useNavigatingMutation)
    if (
      /import\s+\{[^}]*\buseMutation\b[^}]*\}\s+from\s+['"]@tanstack\/react-query['"]/.test(content)
    ) {
      warning(
        file,
        '`useMutation` imported directly from TanStack Query.\n' +
          '             Use `useNavigatingMutation` from `@/lib/hooks/use-navigating-mutation` for consistent\n' +
          '             toast, logging, and navigation behaviour.'
      );
      violations++;
    }
  }
  if (!violations) passed(label);
}

// 8. Inline interface/type definitions in service files
// ──────────────────────────────────────────────────────
{
  const label = 'No inline type definitions in service files';
  let violations = 0;
  for (const file of serviceFiles) {
    const content = read(file);
    // Match top-level interface or type alias declarations (not in imports)
    const inlineTypes = content.match(/^(?:export\s+)?(?:interface|type)\s+\w+/gm);
    if (inlineTypes) {
      warning(
        file,
        `${inlineTypes.length} inline type definition(s): ${inlineTypes.map((t) => t.trim().split(/\s+/)[1] ?? t).join(', ')}.\n` +
          '             Move these to `src/types/` so they can be shared across layers.'
      );
      violations++;
    }
  }
  if (!violations) passed(label);
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60));

if (errorCount === 0 && warnCount === 0) {
  console.log(`\n${GREEN}${BOLD}✔ All ${checkCount} architecture checks passed.${RESET}\n`);
  process.exit(0);
}

if (warnCount > 0) {
  console.warn(`${YELLOW}${BOLD}⚠ ${warnCount} warning(s)${RESET} — review before shipping to production.`);
}

if (errorCount > 0) {
  console.error(
    `${RED}${BOLD}✖ ${errorCount} critical violation(s)${RESET} — fix these before merging.\n`
  );
  process.exit(1);
}

console.log('');
