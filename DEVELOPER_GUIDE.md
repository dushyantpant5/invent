# Invent — Developer Guide

Welcome to the project. This document explains how the codebase is structured, how to work within it, and what rules to follow. Read it fully before writing any code.

---

## Table of Contents

1. [Before You Commit — Required Checks](#1-before-you-commit--required-checks)
2. [What This App Does](#2-what-this-app-does)
3. [Tech Stack](#3-tech-stack)
4. [Architecture Overview](#4-architecture-overview)
5. [Folder Structure](#5-folder-structure)
6. [The Request Lifecycle](#6-the-request-lifecycle)
7. [API Routes](#7-api-routes)
8. [Database Access — Repositories](#8-database-access--repositories)
9. [Business Logic — Services](#9-business-logic--services)
10. [TanStack Query — Data Fetching on the Client](#10-tanstack-query--data-fetching-on-the-client)
11. [Validation with Zod](#11-validation-with-zod)
12. [Error Handling](#12-error-handling)
13. [Types and DTOs](#13-types-and-dtos)
14. [Authentication Flow](#14-authentication-flow)
15. [Adding a New Feature — Step-by-Step Checklist](#15-adding-a-new-feature--step-by-step-checklist)
16. [Rules and Best Practices](#16-rules-and-best-practices)
17. [Automated Enforcement — How Rules Are Enforced](#17-automated-enforcement--how-rules-are-enforced)
18. [Known Limitations and Outstanding Items](#18-known-limitations-and-outstanding-items)
19. [Common Mistakes to Avoid](#19-common-mistakes-to-avoid)

---

## 1. Before You Commit — Required Checks

**Most of these checks run automatically** — Husky hooks enforce them at commit and push time. But you should also know how to run them manually when you need to debug a failure.

### All available commands

```bash
# Fix linting errors and auto-format staged code
npm run lint           # ESLint with --fix (run this to fix auto-fixable issues)
npm run lint:ci        # ESLint with --max-warnings=0 (no fixes — used in CI)
npm run format         # Prettier — rewrites files in place
npm run format:check   # Prettier — checks only, no writes (used in CI)

# Check architecture rules
npm run arch-check     # Custom structural check (see section 17)

# Verify the full build
npm run build          # TypeScript + Next.js production build
npm run dev            # Start dev server to test changes manually
```

### What runs automatically and when

| Hook           | Trigger      | What runs                                              |
| -------------- | ------------ | ------------------------------------------------------ |
| **pre-commit** | `git commit` | `lint-staged` — ESLint + Prettier on staged files only |
| **pre-push**   | `git push`   | `npm run arch-check` then `npm run build`              |

> `lint-staged` is fast because it only lints the files you have actually changed, not the whole codebase. The full build runs on push so TypeScript cross-file errors are caught before your code reaches GitHub.

### What runs on GitHub (CI)

Four separate jobs run in parallel on every pull request. **All four must pass before a PR can be merged.**

| CI Job                 | Command                | Blocks merge on                                 |
| ---------------------- | ---------------------- | ----------------------------------------------- |
| **Lint**               | `npm run lint:ci`      | Any ESLint error or warning                     |
| **Format**             | `npm run format:check` | Any unformatted file                            |
| **Build**              | `npm run build`        | TypeScript errors, broken imports, JSX errors   |
| **Architecture Check** | `npm run arch-check`   | Critical structural violations (see section 17) |

### If a hook fails

- **pre-commit fails** — fix the ESLint or Prettier errors it reports, re-stage your files, and commit again. Do not use `--no-verify` to skip the hook.
- **pre-push fails** — fix the error reported by `arch-check` or `build`, then push again.
- **CI fails** — click the failing job in GitHub to read the full output, fix the issue locally, and push the fix.

**Never use `git commit --no-verify` or `git push --no-verify` to bypass hooks.**

---

## 2. What This App Does

Invent is an inventory management web application. Users can:

- Create an account and sign in
- Create a new inventory (they become the admin)
- Join an existing inventory using a share code (they join as staff)
- Manage products within their inventory

---

## 3. Tech Stack

| Technology            | What it does                                                    |
| --------------------- | --------------------------------------------------------------- |
| **Next.js 15**        | The web framework — handles both the UI and the server-side API |
| **TypeScript**        | Adds types to JavaScript — prevents entire categories of bugs   |
| **Prisma**            | Talks to the database. You write TypeScript; Prisma writes SQL  |
| **PostgreSQL**        | The database                                                    |
| **TanStack Query v5** | Manages all data fetching and mutations on the client side      |
| **Zod**               | Validates data shapes — ensures inputs are what you expect      |
| **Axios**             | Makes HTTP requests from the browser to the API                 |
| **jose**              | Creates and verifies JSON Web Tokens (JWTs) for auth            |
| **bcryptjs**          | Hashes passwords before storing them                            |
| **React Hook Form**   | Manages form state in React components                          |
| **Tailwind CSS**      | Utility-first CSS framework for styling                         |
| **sonner**            | Toast notification library                                      |

---

## 4. Architecture Overview

### Design principles this codebase follows

You will hear these terms used throughout the codebase and in code review. Here is what they mean in plain English:

**SOLID — a set of five rules for writing maintainable code:**

- **S — Single Responsibility Principle (SRP):** Every file, class, or function should do exactly one thing. A repository only queries the database. A service only contains business logic. An API function only makes HTTP calls. If something is doing two things, it should be split.

- **O — Open/Closed Principle (OCP):** Code should be easy to extend without having to rewrite it. For example, the `buildApiClient` factory lets you create a new HTTP client in one line — you do not need to duplicate all the HTTP verb methods again.

- **D — Dependency Inversion Principle (DIP):** High-level code should not depend on specific low-level implementations. For example, `useNavigatingMutation` depends on `ToastService` (an abstraction), not on `sonner` (the specific library) directly. This means swapping the toast library later requires changing only `toast.service.ts`.

**DRY — Don't Repeat Yourself:**

If you write the same code in two places, a bug fixed in one place will remain in the other. This codebase extracts repeated patterns into shared utilities (`withErrorHandling`, `useNavigatingMutation`, `buildApiClient`, `extractRequestMeta`, etc.) so there is one place to fix and one place to read.

---

The application uses a **layered architecture**. Each layer has one job and only talks to the layer directly below it.

```
Browser (React components)
        │
        │  HTTP requests (Axios)
        ▼
Next.js API Routes  ──► Middleware (auth guard)
        │
        │  calls
        ▼
   Services  (business logic)
        │
        │  calls
        ▼
  Repositories  (database queries)
        │
        │  calls
        ▼
    Prisma ORM
        │
        ▼
   PostgreSQL DB
```

**Why layers matter:** Each layer only knows about the layer below it. A repository does not know about HTTP. A service does not know about React. A component does not write SQL. This keeps the code predictable and easy to change.

### The three key rules

1. **Components** call hooks from `features/`. They never call repositories or services directly.
2. **Services** contain all business logic. They call repositories. They throw `ServiceError` when something goes wrong.
3. **Repositories** only read and write the database. They throw `DatabaseError` and contain no business logic.

---

## 5. Folder Structure

```
src/
├── app/                        # Next.js App Router
│   ├── api/                    # Server-side API route handlers
│   │   ├── auth/
│   │   │   ├── signIn/route.ts
│   │   │   ├── signUp/
│   │   │   │   ├── request-signup/route.ts
│   │   │   │   └── verify-otp/route.ts
│   │   │   ├── refreshToken/route.ts
│   │   │   └── getCoreToken/route.ts
│   │   └── inventory/
│   │       ├── create-inventory/route.ts
│   │       └── join-inventory/route.ts
│   └── (page routes, layouts, etc.)
│
├── features/                   # Client-side feature modules
│   ├── auth/
│   │   ├── auth.api.ts         # Pure async functions that call the API
│   │   └── auth.queries.ts     # TanStack Query hooks (useRequestSignUp, etc.)
│   ├── inventory/
│   │   ├── inventory.api.ts
│   │   └── inventory.queries.ts
│   └── product/
│       ├── product.api.ts
│       └── product.queries.ts
│
├── services/                   # Server-side business logic
│   ├── auth/
│   │   ├── auth.service.ts     # Sign up, sign in, refresh, OTP
│   │   ├── token-factory/      # JWT creation and verification
│   │   ├── password-factory/   # bcrypt hashing and verification
│   │   └── otp-factory/        # OTP generation and verification
│   ├── inventory/
│   │   └── inventory.service.ts
│   ├── toast/
│   │   └── toast.service.ts    # Wrapper around sonner
│   └── lib.ts                  # ServiceError class
│
├── repositories/               # Database access (Prisma queries only)
│   ├── index.ts                # Prisma client singleton
│   ├── lib.ts                  # DatabaseError class
│   ├── user.repo.ts
│   ├── session.repo.ts
│   ├── otp.repo.ts
│   └── inventory.repo.ts
│
├── types/                      # TypeScript types and DTOs
│   ├── index.ts                # INextResponse<T>
│   ├── auth/
│   │   └── auth.ts             # All auth-related DTOs and interfaces
│   └── inventory/
│       └── inventory.types.ts
│
├── validators/
│   └── index.ts                # All Zod schemas (single source of truth)
│
├── lib/                        # Shared utilities
│   ├── cookies/index.ts        # Cookie read/write/clear helpers
│   ├── crypto/encryption.ts    # AES-GCM encrypt/decrypt
│   ├── email/emailjs.ts        # Email sending via EmailJS
│   ├── hooks/
│   │   └── use-navigating-mutation.ts  # DRY TanStack Query mutation factory
│   ├── http/
│   │   ├── api-client.ts       # Axios client factory for feature modules
│   │   ├── api-error.ts        # ApiError class + error message extractor
│   │   ├── axios.ts            # Main Axios instance (standard API calls)
│   │   └── core-axios.ts       # Axios instance for the core service (with JWT)
│   ├── query-client.ts         # TanStack QueryClient configuration
│   ├── query-keys.ts           # Centralized query key factory
│   └── route-helpers.ts        # withErrorHandling HOF, parseJsonBody, etc.
│
├── constants/                  # App-wide constants
│   ├── tokens.constant.ts      # Cookie names, token TTLs
│   └── otp.constant.ts         # OTP TTL
│
├── providers/
│   └── ReactQueryProvider.tsx  # Wraps the app with TanStack QueryClientProvider
│
├── middleware.ts               # Auth guard — protects /dashboard and /inventory
└── components/                 # Shared UI components
```

---

## 6. The Request Lifecycle

Here is the exact path a user action takes through the system. Understanding this will help you know where to add your code.

### Example: User clicks "Sign In"

```
1. Component (login-form.tsx)
   └─ calls useRequestLogIn().mutate({ email, password })

2. useRequestLogIn (features/auth/auth.queries.ts)
   └─ calls requestLogIn(email, password) via useNavigatingMutation

3. requestLogIn (features/auth/auth.api.ts)
   └─ validates with Zod
   └─ calls POST /api/auth/signIn via Axios

4. POST /api/auth/signIn (app/api/auth/signIn/route.ts)
   └─ parses and validates request body
   └─ calls AuthService.handleSignInUser(...)

5. AuthService.handleSignInUser (services/auth/auth.service.ts)
   └─ calls UserRepository.getUserByEmail(email)
   └─ verifies password with PasswordFactory
   └─ calls SessionRepository.createSession(...)
   └─ calls TokenFactory.getAccessToken(...)
   └─ returns { message, accessToken, refreshToken }

6. Route handler
   └─ sets access/refresh tokens as httpOnly cookies
   └─ returns 200 { message }

7. useNavigatingMutation onSuccess
   └─ shows success toast
   └─ navigates to /dashboard
```

---

## 7. API Routes

API routes live in `src/app/api/`. Each file exports named HTTP method functions (`GET`, `POST`, etc.).

### Pattern — every route follows this exact structure

```ts
import { NextRequest, NextResponse } from 'next/server';
import { mySchema } from '@/validators';
import { MyService } from '@/services/my/my.service';
import { withErrorHandling, parseJsonBody, validationErrorResponse } from '@/lib/route-helpers';

export const POST = withErrorHandling(async (request: NextRequest) => {
  // 1. Parse the request body safely
  const body = await parseJsonBody(request);

  // 2. Validate with Zod
  const validation = mySchema.safeParse(body);
  if (!validation.success) return validationErrorResponse(validation.error);

  // 3. Call the service
  const result = await MyService.doSomething(validation.data);

  // 4. Return a response
  return NextResponse.json({ data: result }, { status: 201 });
});
```

### What `withErrorHandling` does

`withErrorHandling` is a wrapper (called a Higher-Order Function) that removes the need for `try/catch` in every route. If anything throws — a `ServiceError`, `DatabaseError`, or an unexpected crash — `withErrorHandling` catches it and returns the correct HTTP error response automatically.

```
ServiceError('message', 409)  →  HTTP 409 { error: 'message' }
DatabaseError('message')      →  HTTP 500 { error: 'message' }
Unexpected Error              →  HTTP 500 { error: error.message }
```

**Never wrap route logic in a try/catch manually.** Let `withErrorHandling` do it.

### HTTP status codes — use the correct one

| Status | When to use                                          |
| ------ | ---------------------------------------------------- |
| `200`  | Successful read or action (sign in, token refresh)   |
| `201`  | A new resource was created (new user, new inventory) |
| `400`  | Invalid input from the client                        |
| `401`  | Not authenticated (no valid session)                 |
| `403`  | Authenticated but not allowed (wrong role)           |
| `404`  | Resource does not exist                              |
| `409`  | Conflict (e.g. email already registered)             |
| `500`  | Something went wrong on the server                   |

**Never put a `status` field inside the JSON body.** The HTTP status code IS the status. The body only contains `data` or `error`.

```ts
// CORRECT
return NextResponse.json({ data: result }, { status: 201 });
return NextResponse.json({ error: 'Not found' }, { status: 404 });

// WRONG — do not do this
return NextResponse.json({ data: result, status: 201 });
```

### Extracting request metadata

When you need the user's IP address or browser info (e.g. for session tracking):

```ts
import { extractRequestMeta } from '@/lib/route-helpers';

const { userAgent, ipAddress } = extractRequestMeta(request);
```

---

## 8. Database Access — Repositories

Repositories are the **only** place that talks to the database. They live in `src/repositories/`.

### Rules for repositories

- **Only Prisma queries.** No business logic, no validation, no `console.error`, no `if` guards that belong to the service.
- **Wrap every query in try/catch** and throw `DatabaseError` on failure.
- **Use DTOs** (typed input objects) for methods with multiple parameters.
- **Never call another repository's methods** from inside a repository.

### Pattern — a repository method

```ts
import { prisma } from './index';
import { DatabaseError } from './lib';

export class ProductRepository {
  static async getProductById(productId: string) {
    try {
      return await prisma.products.findUnique({ where: { id: productId } });
    } catch {
      throw new DatabaseError('Failed to fetch product');
    }
  }

  static async createProduct(data: ICreateProductDTO) {
    const { name, quantity, inventoryId, tx = prisma } = data;
    try {
      return await tx.products.create({
        data: { name, quantity, inventoryId },
      });
    } catch {
      throw new DatabaseError('Failed to create product');
    }
  }
}
```

### Using transactions

When multiple database writes must succeed or fail together (atomically), use a Prisma transaction. Transactions are always started in the **service layer** and passed to repositories as `tx`.

```ts
// In a service:
await prisma.$transaction(async (tx) => {
  const product = await ProductRepository.createProduct({ ...data, tx });
  await AuditRepository.logCreation({ productId: product.id, tx });
  // If either throws, both are rolled back automatically.
});
```

The repository method must accept an optional `tx` parameter. See `ICreateSessionDTO` in `src/types/auth/auth.ts` for an example of how to type it:

```ts
import { Prisma } from '@prisma/client';

export interface ICreateProductDTO {
  name: string;
  quantity: number;
  inventoryId: string;
  tx?: Prisma.TransactionClient;
}
```

### The Prisma singleton

`src/repositories/index.ts` exports a single shared `prisma` client instance. **Always import from there** — never create `new PrismaClient()` anywhere else.

```ts
import prisma from '@/repositories';
// or for repositories:
import { prisma } from './index';
```

---

## 9. Business Logic — Services

Services live in `src/services/`. They contain all the rules and decisions for how the application behaves.

### Rules for services

- **All business logic lives here.** If you are making a decision (e.g. "does the user already exist?"), it belongs in a service.
- **Call repositories to read and write data.** Never write Prisma queries directly in a service.
- **Throw `ServiceError`** with a meaningful message and the correct HTTP status code when something is wrong.
- **Never reference HTTP, `NextRequest`, or `NextResponse`** — services must not know they are running inside a web server.
- **Never import from `features/`** — services do not know the client side exists.

### Pattern — a service method

```ts
import { ServiceError } from '../lib';
import { ProductRepository } from '@/repositories/product.repo';

export class ProductService {
  static async getProduct(productId: string) {
    const product = await ProductRepository.getProductById(productId);

    if (!product) {
      throw new ServiceError('Product not found', 404);
    }

    return product;
  }

  static async createProduct(data: { name: string; inventoryId: string }) {
    const existing = await ProductRepository.findByNameInInventory(data);

    if (existing) {
      throw new ServiceError('A product with this name already exists', 409);
    }

    return ProductRepository.createProduct(data);
  }
}
```

### ServiceError status codes

```ts
throw new ServiceError('Not found', 404); // resource missing
throw new ServiceError('Already exists', 409); // conflict
throw new ServiceError('Not allowed', 403); // no permission
throw new ServiceError('Please sign in', 401); // not authenticated
throw new ServiceError('Something broke', 500); // unexpected failure
```

The default status code when you omit the second argument is `400`.

---

## 10. TanStack Query — Data Fetching on the Client

TanStack Query manages all server state on the client side — fetching data, caching it, and running mutations (create / update / delete actions).

> **New to TanStack Query?** Think of it as a smart assistant that remembers data you've already loaded (cache), re-fetches it when it might be out of date, and handles loading/error states for you — so you don't have to manage any of that manually.

### The two-file pattern

Every feature has exactly two files:

| File                 | Job                                                                       |
| -------------------- | ------------------------------------------------------------------------- |
| `feature.api.ts`     | Pure async functions that make HTTP calls. No React, no hooks, no toasts. |
| `feature.queries.ts` | React hooks built on top of the API functions. Own all side effects.      |

This separation means you can test API functions in isolation, and components only ever import from `queries.ts`.

### Mutations — `useNavigatingMutation`

For any action that **changes data** (sign in, create inventory, submit a form), use the `useNavigatingMutation` factory from `src/lib/hooks/use-navigating-mutation.ts`.

**Never use `useMutation` directly in feature files.** Always go through `useNavigatingMutation`.

```ts
// features/my-feature/my-feature.queries.ts
'use client';

import { myApiFunction } from './my-feature.api';
import { useNavigatingMutation } from '@/lib/hooks/use-navigating-mutation';

export const useDoSomething = () =>
  useNavigatingMutation({
    mutationFn: (variables: { name: string }) => myApiFunction(variables.name),

    // Optional: where to navigate after success
    redirectTo: '/dashboard',

    // Optional: toast shown on success
    successMessage: 'Done!',

    // Optional: override the error toast message.
    // If omitted, the server's error message is shown automatically.
    errorMessage: 'Something went wrong. Please try again',

    // Optional: dynamic error message based on the actual error
    errorMessage: (error) => `Failed: ${error.message}`,

    // Optional: extra callback after success (e.g. reset a form)
    onSuccess: (data) => console.log(data),
  });
```

`useNavigatingMutation` automatically:

- Shows a success toast (if `successMessage` is provided)
- Navigates to `redirectTo` after success
- Shows an error toast on failure (using the server's message if `errorMessage` is not provided)
- Logs the error to the console

### Using a mutation in a component

```tsx
// components/my-form.tsx
'use client';

import { useDoSomething } from '@/features/my-feature/my-feature.queries';

export function MyForm() {
  const { mutate, isPending } = useDoSomething();

  return (
    <button onClick={() => mutate({ name: 'Example' })} disabled={isPending}>
      {isPending ? 'Loading...' : 'Submit'}
    </button>
  );
}
```

### Queries — reading data

For **reading data** (e.g. fetching a list of products), use `useQuery` directly in the feature's `.queries.ts` file:

```ts
// features/product/product.queries.ts
import { useQuery } from '@tanstack/react-query';
import { getAllProducts } from './product.api';
import { queryKeys } from '@/lib/query-keys';

export const useProducts = () =>
  useQuery({
    queryKey: queryKeys.products.all(),
    queryFn: getAllProducts,
    throwOnError: false,
  });
```

### QueryClient configuration

The QueryClient is configured in `src/lib/query-client.ts` with two important settings:

```ts
mutations: { retry: 0 }          // never retry mutations
queries:   { retry: 1, staleTime: 30_000 }  // cache for 30 seconds
```

**Why `retry: 0` for mutations?** TanStack Query retries failed requests by default. For read operations (queries) this is fine — retrying "fetch products" is safe. But for write operations (mutations), retrying "submit sign up" or "create inventory" could create **duplicate records** in the database. Mutations must never be retried automatically.

**Why `staleTime: 30_000`?** Without a stale time, TanStack Query re-fetches data every time a component mounts. Setting 30 seconds means data is considered fresh for 30 seconds, which reduces unnecessary network requests.

### Query keys

Every `useQuery` call needs a `queryKey`. This is how TanStack Query identifies cached data. **Always use the centralized factory in `src/lib/query-keys.ts`** — never write magic strings inline.

```ts
// CORRECT
queryKey: queryKeys.products.all(); // ['products']
queryKey: queryKeys.products.detail(id); // ['products', 'abc-123']

// WRONG — do not do this
queryKey: ['products'];
queryKey: ['products', id];
```

**Adding a new query key:**

```ts
// src/lib/query-keys.ts
export const queryKeys = {
  products: {
    all: () => ['products'] as const,
    detail: (id: string) => ['products', id] as const,
  },
  inventory: { ... },
  // Add your new domain here:
  orders: {
    all: () => ['orders'] as const,
    byInventory: (inventoryId: string) => ['orders', inventoryId] as const,
  },
} as const;
```

### The API function — `feature.api.ts`

The API file contains plain async functions. **They must follow this contract exactly:**

1. Client-side Zod validation → throw `ApiError(formatZodError(err))` if invalid
2. HTTP call via the axios client
3. Return typed data, or throw `ApiError` / let `AxiosError` propagate naturally
4. **No toasts. No `console.error`. No side effects of any kind.**

This keeps the function testable in isolation and means every error surface is handled in exactly one place (the hook).

**Why are API functions kept pure?** Before this pattern was established, each API function had its own toast calls and error logging. Some errors showed toasts, others were silent. Some logged to console, others did not. The result was an inconsistent user experience and duplicate code across every function. The pure API function + side-effect hook split guarantees consistency: every mutation always shows the right toast, always logs errors, and always navigates on success — regardless of who wrote it.

```ts
// features/product/product.api.ts
import { createApiClient } from '@/lib/http/api-client';
import { ApiError, formatZodError } from '@/lib/http/api-error';
import { createProductSchema } from '@/validators';
import type { INextResponse } from '@/types';

const productClient = createApiClient('/products');

export const createProduct = async (name: string, quantity: number): Promise<void> => {
  const validation = createProductSchema.safeParse({ name, quantity });
  if (!validation.success) throw new ApiError(formatZodError(validation.error));

  await productClient.post('/create', { name, quantity });
};

export const getAllProducts = async () => {
  const response = await productClient.get<INextResponse<Product[]>>('/list');
  return response.data;
};
```

### The two Axios clients

The app has two HTTP clients:

| Client       | Used for                                                | How to get one                     |
| ------------ | ------------------------------------------------------- | ---------------------------------- |
| Standard     | Calls to `/api/*` routes                                | `createApiClient('/path')`         |
| Core service | Calls to external inventory core service (requires JWT) | `createCoreServiceClient('/path')` |

Most features will use `createApiClient`. Only use `createCoreServiceClient` for calls to the external core service.

---

## 11. Validation with Zod

All validation schemas live in `src/validators/index.ts`. **Add new schemas there — do not create schema files elsewhere.**

### What Zod does

Zod checks that data matches the shape you expect. For example:

```ts
const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
});

const result = createProductSchema.safeParse(userInput);

if (!result.success) {
  // result.error contains all the validation messages
  console.log(result.error.issues); // [{ message: 'Name is required', path: ['name'] }]
}
```

### Where validation runs

Validation runs in **two places**:

1. **Client side** (`feature.api.ts`) — catches obvious mistakes before making a network request, giving instant feedback
2. **Server side** (API route) — the authoritative check; never trust client-submitted data

Both use the **same schemas** from `src/validators/index.ts`. One source of truth.

### Adding a new schema

```ts
// src/validators/index.ts
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100),
  quantity: z.number().int().min(0),
});
```

Then use it in the route:

```ts
const validation = createProductSchema.safeParse(body);
if (!validation.success) return validationErrorResponse(validation.error);
```

And in the API function:

```ts
const validation = createProductSchema.safeParse({ name, quantity });
if (!validation.success) throw new ApiError(formatZodError(validation.error));
```

---

## 12. Error Handling

The error system is unified across all layers. Here is how errors flow.

### Error classes

| Class                                   | Where thrown              | HTTP meaning                             |
| --------------------------------------- | ------------------------- | ---------------------------------------- |
| `DatabaseError` (`repositories/lib.ts`) | Repositories              | Always maps to 500                       |
| `ServiceError` (`services/lib.ts`)      | Services                  | Maps to whatever status code you pass in |
| `ApiError` (`lib/http/api-error.ts`)    | Client-side API functions | Shown to the user as a toast             |

### Server-side flow

```
Repository throws DatabaseError  ──►  withErrorHandling  ──►  HTTP 500
Service throws ServiceError(404) ──►  withErrorHandling  ──►  HTTP 404
Unexpected throw                 ──►  withErrorHandling  ──►  HTTP 500
```

No route file needs a try/catch. `withErrorHandling` handles everything.

### Client-side flow

```
ApiError thrown in feature.api.ts
  └─► Caught by useNavigatingMutation's onError
       └─► If errorMessage prop is set → show that message as toast
       └─► If not → extractApiErrorMessage(error) reads the server's { error } field
```

`extractApiErrorMessage` handles three cases:

- `AxiosError` with a response → reads `response.data.error`
- `ApiError` or any `Error` → reads `error.message`
- Unknown → returns a generic message

### Never swallow errors silently

```ts
// WRONG — this hides the error
try {
  await doSomething();
} catch {
  // nothing
}

// CORRECT — always rethrow or handle meaningfully
try {
  await doSomething();
} catch {
  throw new DatabaseError('Failed to do something');
}
```

---

## 13. Types and DTOs

A **DTO** (Data Transfer Object) is a TypeScript interface that describes the shape of data being passed between layers.

### Where types live

| File                                     | Contains                                           |
| ---------------------------------------- | -------------------------------------------------- |
| `src/types/index.ts`                     | `INextResponse<T>` — wrapper for API response data |
| `src/types/auth/auth.ts`                 | All auth and session DTOs                          |
| `src/types/inventory/inventory.types.ts` | All inventory DTOs                                 |

**Add new types to the appropriate domain file in `src/types/`.** Do not define interfaces inline inside service or route files.

### Naming conventions

- All interfaces and types start with `I` or are a `Type`: `ICreateProductDTO`, `IProductResponseDTO`
- DTOs for database input end in `DatabaseRequestDTO`
- DTOs for service input end in just `DTO`
- DTOs for HTTP responses end in `ResponseDTO`

### Example — adding types for a new domain

```ts
// src/types/product/product.types.ts
import { Prisma } from '@prisma/client';

export interface ICreateProductDTO {
  name: string;
  quantity: number;
  inventoryId: string;
  tx?: Prisma.TransactionClient;
}

export interface IProductResponseDTO {
  id: string;
  name: string;
  quantity: number;
}
```

---

## 14. Authentication Flow

Understanding how auth works helps you protect routes correctly.

### Sign-up flow

```
1. User enters email + password
2. /api/auth/signUp/request-signup → creates OTP in DB, sends to email
3. User enters OTP
4. /api/auth/signUp/verify-otp → marks OTP as used
5. User is redirected to dashboard (complete-signup route creates the user account)
```

### Sign-in flow

```
1. User enters email + password
2. /api/auth/signIn → verifies credentials, creates a session
3. Server sets two httpOnly cookies:
   - accessToken  (JWT, expires 30 min)
   - refreshToken (random UUID, expires 30 days)
4. User is redirected to dashboard
```

### Token refresh flow

When the access token expires, `middleware.ts` automatically calls `/api/auth/refreshToken`. If the refresh token is still valid, new tokens are issued and the user continues without interruption. If not, they are redirected to sign-in.

### Protecting pages

To protect a page so only signed-in users can access it, add its path to the `matcher` in `src/middleware.ts`:

```ts
export const config = {
  matcher: ['/dashboard', '/inventory', '/your-new-protected-page'],
};
```

### Getting the current user in an API route

Call `AuthService.getUserSession()` inside your route handler (via the service layer). It reads the access token cookie and returns the user's `id` and `userEmail`. It throws a `ServiceError(401)` if the session is missing or expired.

---

## 15. Adding a New Feature — Step-by-Step Checklist

Follow this exact order when building a new feature (e.g. "create a product").

### Step 1 — Add the Zod schema

In `src/validators/index.ts`:

```ts
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100),
  quantity: z.number().int().min(0),
});
```

### Step 2 — Add types/DTOs

In `src/types/product/product.types.ts`:

```ts
export interface ICreateProductDTO {
  name: string;
  quantity: number;
  inventoryId: string;
  tx?: Prisma.TransactionClient;
}
```

### Step 3 — Add the repository method

In `src/repositories/product.repo.ts`:

```ts
static async createProduct(data: ICreateProductDTO) {
  const { name, quantity, inventoryId, tx = prisma } = data;
  try {
    return await tx.products.create({ data: { name, quantity, inventoryId } });
  } catch {
    throw new DatabaseError('Failed to create product');
  }
}
```

### Step 4 — Add the service method

In `src/services/product/product.service.ts`:

```ts
static async createProduct(data: { name: string; quantity: number }): Promise<IProductResponseDTO> {
  const userData = await AuthService.getUserSession();
  const inventoryData = await InventoryService.getInventorySession();

  const existing = await ProductRepository.findByNameInInventory({
    name: data.name,
    inventoryId: inventoryData.inventoryId,
  });

  if (existing) throw new ServiceError('Product already exists', 409);

  const product = await ProductRepository.createProduct({
    ...data,
    inventoryId: inventoryData.inventoryId,
  });

  return { id: product.id, name: product.name, quantity: product.quantity };
}
```

### Step 5 — Add the API route

Create `src/app/api/products/create/route.ts`:

```ts
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody(request);
  const validation = createProductSchema.safeParse(body);
  if (!validation.success) return validationErrorResponse(validation.error);

  const product = await ProductService.createProduct(validation.data);
  return NextResponse.json({ data: product }, { status: 201 });
});
```

### Step 6 — Add the client API function

In `src/features/product/product.api.ts`:

```ts
export const createProduct = async (name: string, quantity: number): Promise<void> => {
  const validation = createProductSchema.safeParse({ name, quantity });
  if (!validation.success) throw new ApiError(formatZodError(validation.error));

  await productClient.post('/create', { name, quantity });
};
```

### Step 7 — Add the query hook

In `src/features/product/product.queries.ts`:

```ts
export const useCreateProduct = () =>
  useNavigatingMutation({
    mutationFn: (vars: { name: string; quantity: number }) =>
      createProduct(vars.name, vars.quantity),
    successMessage: 'Product created',
    errorMessage: 'Failed to create product',
  });
```

### Step 8 — Use in the component

```tsx
const { mutate, isPending } = useCreateProduct();
mutate({ name: 'Widget', quantity: 10 });
```

### Step 9 — Run the checks

```bash
npm run lint
npm run format
npm run build
```

Fix every error before submitting.

---

## 16. Rules and Best Practices

### Architecture rules (non-negotiable)

- **Never import from a higher layer into a lower layer.** Services do not import from `features/`. Repositories do not import from services.
- **All database queries go through repositories.** No `prisma.` calls in services, routes, or components.
- **All business logic goes in services.** No logic in repositories or routes.
- **All client data fetching uses TanStack Query hooks.** No raw `fetch` or `axios` calls in components.
- **All validation schemas are in `src/validators/index.ts`.** No inline schemas anywhere else.
- **All query keys are in `src/lib/query-keys.ts`.** No magic strings.
- **All types are in `src/types/`.** No inline interfaces in service or route files.

### Code quality rules

- **One concern per function.** If a function does two things, split it.
- **Descriptive names.** `getUserByEmail` is better than `getUser`. `createInventoryRole` is better than `createRole`.
- **Do not add `console.log` to production code.** Remove debug logs before committing. `console.error` in services is acceptable for unexpected failures.
- **Do not add comments that just re-state what the code does.** Comment only when the reason for doing something is not obvious.
- **Never return a `status` field inside a JSON response body.** The HTTP status code is the status.

### TypeScript rules

- **Never use `any`.** If you don't know the type, use `unknown` and narrow it.
- **Never use non-null assertion (`!`) without a clear reason.** If you write `value!`, there must be a guarantee above it that `value` is not null.
- **Prefer `interface` for object shapes and `type` for unions and aliases.**

---

## 17. Automated Enforcement — How Rules Are Enforced

The architecture rules in this guide are not just suggestions — they are enforced automatically at four layers. This section explains each layer in detail so you understand what is checking your code and why.

### Layer 1 — Your editor (instant feedback)

Install the **ESLint extension** for your editor (VS Code: `dbaeumer.vscode-eslint`). It reads `eslint.config.mjs` and highlights violations as you type — before you even save the file.

This is the fastest feedback loop. A red underline in the editor costs nothing to fix. A CI failure costs a push cycle and review time.

### Layer 2 — Pre-commit hook (Husky + lint-staged)

**File:** `.husky/pre-commit`

Runs automatically on every `git commit`. It executes `lint-staged`, which runs ESLint `--fix` and Prettier only on the files you have staged — not the whole codebase. This makes it fast (typically under 5 seconds).

```
git commit -m "feat: add product form"
  → lint-staged runs on changed *.ts, *.tsx files
      → ESLint --fix (auto-fixes what it can)
      → Prettier --write
  → if any errors remain that cannot be auto-fixed → commit is rejected
  → fix the errors, re-stage, commit again
```

**What `lint-staged` is configured to run** (in `package.json`):

```json
"lint-staged": {
  "*.{ts,tsx,js,jsx}": ["eslint --fix --max-warnings=0", "prettier --write"],
  "*.{json,md,css}":   ["prettier --write"]
}
```

### Layer 3 — Pre-push hook (Husky)

**File:** `.husky/pre-push`

Runs automatically on every `git push`. Executes two things in order:

1. **`npm run arch-check`** — the custom architecture check script (see below)
2. **`npm run build`** — the full TypeScript + Next.js production build

The build step catches cross-file type errors that ESLint misses — for example, calling a service method with the wrong argument type, or a missing export that another file depends on.

```
git push origin feature/my-branch
  → arch-check: scans all source files for structural violations
  → npm run build: full TypeScript compile + Next.js build
  → if either fails → push is rejected
  → fix the error, commit the fix, push again
```

### Layer 4 — GitHub Actions (PR gate)

**File:** `.github/workflows/pr-checks.yml`

Four parallel jobs run on every pull request. All four must show a green checkmark before the PR can be merged (once you enable branch protection — see below).

#### Job 1: Lint

```bash
npm run lint:ci   # eslint . --max-warnings=0
```

Runs ESLint across the entire codebase. Zero tolerance — any warning or error fails the job. This includes all layer boundary rules (see ESLint section below).

#### Job 2: Format

```bash
npm run format:check   # prettier --check .
```

Verifies every file is correctly formatted. Does **not** modify files — if this fails, run `npm run format` locally and commit the result.

#### Job 3: Build (TypeScript)

```bash
npm run build
```

Full Next.js production build. Catches TypeScript errors, missing imports, invalid JSX, and anything the compiler flags.

#### Job 4: Architecture Check

```bash
npm run arch-check   # node scripts/arch-check.mjs
```

The custom script. See the full breakdown below.

> **To enforce these as required checks in GitHub:** go to your repository → Settings → Branches → Add branch protection rule for `main` → enable **Require status checks to pass before merging** → search for and select: `Lint`, `Format`, `Build (TypeScript)`, `Architecture Check`.

---

### ESLint layer boundary rules

**File:** `eslint.config.mjs`

The ESLint config has per-directory `no-restricted-imports` rules that enforce who is allowed to import from whom. Violating these is an **ESLint error** — it fails both local lint and CI.

```
Browser (React components)
        │  can import from: features/, lib/, types/, components/
        ▼
   features/
        │  can import from: lib/, types/, validators/
        │  CANNOT import from: services/, repositories/
        ▼
   app/api/ (route handlers)
        │  can import from: services/, lib/, types/, validators/
        │  CANNOT import from: repositories/, features/
        ▼
   services/
        │  can import from: repositories/, lib/, types/, constants/
        │  CANNOT import from: features/
        ▼
   repositories/
        │  can import from: lib/repositories (Prisma client + error class), types/
        │  CANNOT import from: services/, features/
```

| File pattern          | Restricted imports                   | Error message shown                                     |
| --------------------- | ------------------------------------ | ------------------------------------------------------- |
| `src/features/**`     | `@/services/**`, `@/repositories/**` | Feature modules must not import from server-only layers |
| `src/components/**`   | `@/services/**`, `@/repositories/**` | Components must use query hooks from features/          |
| `src/services/**`     | `@/features/**`                      | Services have no knowledge of the UI                    |
| `src/repositories/**` | `@/services/**`, `@/features/**`     | Repositories are the lowest layer                       |
| `src/app/api/**`      | `@/repositories/**`, `@/features/**` | Routes call services, not repositories directly         |

Additional ESLint rules by layer:

| Layer           | `no-console` rule                                                   |
| --------------- | ------------------------------------------------------------------- |
| `repositories/` | **error** — repos must never log; throw `DatabaseError` instead     |
| `services/`     | **warn** — `console.log` disallowed; `console.error`/`warn` allowed |
| `app/api/`      | **warn** — same as services                                         |

`@typescript-eslint/no-explicit-any` is set to **error** globally — using `any` defeats TypeScript entirely.

---

### Architecture check script

**File:** `scripts/arch-check.mjs`

Run with `npm run arch-check`. Scans all `.ts`/`.tsx` files in `src/` and checks patterns that ESLint import rules cannot catch.

#### Critical violations — exit code 1, blocks merge

| Check                                                | What it catches                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| `new PrismaClient()` outside `repositories/index.ts` | Rogue database connection pools — a critical production bug                     |
| Route files without `withErrorHandling`              | Unhandled exceptions escape to the browser as 500s with no useful error message |
| `ToastService` called in `features/*.api.ts`         | Side effect in a pure function — breaks the two-file contract                   |
| `router.push` / `useRouter` in `features/*.api.ts`   | Navigation logic in a pure function — breaks the two-file contract              |
| `console.error` in `features/*.api.ts`               | Error logging in a pure function — `useNavigatingMutation` already does this    |
| `prisma.{model}.{operation}` called in `services/`   | Service bypassing the repository layer — breaks data access encapsulation       |
| `services/` imported in `repositories/`              | Upward dependency — repositories must have no knowledge of layers above them    |

#### Warnings — exit code 0, logged but does not block merge

| Check                                                      | What it catches                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| `console.log` in `services/`, `repositories/`, `app/api/`  | Debug output left in server-side code                                    |
| `useMutation` imported directly in `features/*.queries.ts` | Bypassing `useNavigatingMutation` — inconsistent toast/log/nav behaviour |
| Inline `interface`/`type` definitions in `services/`       | Types defined inline instead of in `src/types/`                          |

Warnings are not blocking but they should be resolved before shipping to production. The architecture check itself documents them clearly so they are not forgotten.

---

## 18. Known Limitations and Outstanding Items

These are known issues in the codebase that have not been resolved yet. Do not work around them in ways that make them worse — flag them if they are blocking you.

| Issue                                          | Location                                                     | Detail                                                                                                                                                                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OTP generation is not cryptographically secure | `services/auth/otp-factory/otp.factory.ts`                   | Uses `Math.random()` — should use `crypto.getRandomValues()` for a 6-digit OTP. Not suitable for production.                                                                                                                |
| Typo in constant name                          | `constants/tokens.constant.ts`                               | `AccessTokenCookieTIme` (capital `I` in `TIme`). Renaming it requires updating every import at the same time.                                                                                                               |
| Email delivery not implemented                 | `services/email/`                                            | `email.service.ts` and `EmailServiceClass.ts` are entirely commented out. Currently the app uses EmailJS (browser-side) for OTP delivery. A server-side transactional email provider should replace this before production. |
| Error pages not using App Router conventions   | `app/errorPages/`                                            | Should be converted to `error.tsx` / `not-found.tsx` files co-located with their routes, per Next.js App Router spec.                                                                                                       |
| Class definitions in `types/`                  | `types/product/product.class.ts`, `types/user/user.class.ts` | Classes belong in `services/` or `models/`, not `types/`. The `types/` folder should only contain interfaces and type aliases.                                                                                              |
| Debug `console.log` statements in middleware   | `middleware.ts`                                              | The refresh token flow has extensive debug logging that should be removed once the flow is stable in production.                                                                                                            |

---

## 19. Common Mistakes to Avoid

| Mistake                                                               | Correct approach                                                                              |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Writing `prisma.users.findUnique(...)` inside a service               | Create a method in `UserRepository` and call that                                             |
| Writing `new PrismaClient()` anywhere outside `repositories/index.ts` | Import `prisma` from `@/repositories`                                                         |
| Using `useMutation` directly in a feature's `.queries.ts`             | Use `useNavigatingMutation` instead                                                           |
| Putting `ToastService.success(...)` inside an API function            | Toasts belong in the hook (`queries.ts`), not the API function                                |
| Defining a Zod schema inside a component or route file                | Add it to `src/validators/index.ts`                                                           |
| Using `['products']` as a query key directly                          | Use `queryKeys.products.all()`                                                                |
| Throwing a `ServiceError` inside a repository                         | Repositories throw `DatabaseError`, not `ServiceError`                                        |
| Adding a validation guard (`if (!id) throw ...`) inside a repository  | Validation belongs in the service layer                                                       |
| Returning `{ data: result, status: 201 }` from a route                | Return `{ data: result }` — the status belongs in `NextResponse.json({...}, { status: 201 })` |
| Writing a try/catch inside a route handler                            | `withErrorHandling` does this — routes should have no try/catch                               |
| Creating a new query key string without adding it to `query-keys.ts`  | Always add to `query-keys.ts` first                                                           |
| Passing 6 separate arguments to a function                            | Use a DTO object — it's cleaner and easier to extend                                          |
