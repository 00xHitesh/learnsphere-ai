# Testing

## Stack

- **Vitest** — test runner
- **Testing Library** — component tests (`@testing-library/react`)
- **jsdom** — DOM environment for all tests
- **Coverage** — v8 provider, HTML report

## Running Tests

```bash
npm test              # single run
npm run test:watch    # watch mode
npm run test:coverage # coverage report → coverage/index.html
```

## Test Structure

```
src/
├── lib/
│   ├── api/__tests__/        API unit tests (one file per module)
│   │   ├── auth.test.ts
│   │   ├── chat.test.ts
│   │   ├── courses.test.ts
│   │   ├── enrollments.test.ts
│   │   ├── features.test.ts
│   │   ├── liveSessions.test.ts
│   │   ├── stats.test.ts
│   │   ├── transactions.test.ts
│   │   ├── users.test.ts
│   │   └── wishlist.test.ts
│   └── __tests__/
│       └── utils.test.ts
└── components/__tests__/     Component tests
    ├── CourseCard.test.tsx
    └── CertificateButton.test.tsx
```

## API Test Pattern

All API tests follow the same structure:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetDb } from "@/test/helpers";
import { db } from "../db";

// Mock mockRequest to be synchronous
vi.mock("../client", () => ({
  mockRequest: async <T>(fn: () => T) => fn(),
}));

// Top-level await import (after mock is set up)
const { coursesApi } = await import("../courses");

beforeEach(() => {
  resetDb(); // Reset db to seed state before each test
});

describe("coursesApi.list", () => {
  it("returns only approved courses", async () => {
    const result = await coursesApi.list();
    expect(result.every(c => c.approved)).toBe(true);
  });
});
```

**Key rules:**
1. Always call `resetDb()` in `beforeEach` — never rely on state from a previous test.
2. Import the module under test with `await import(...)` *after* setting up `vi.mock`.
3. Mutate `db` directly in tests to set up state (e.g. `db.enrollments.push(...)`).
4. Enrollment objects pushed to `db.enrollments` must include `timeSpentSeconds: 0`.

## resetDb()

`src/test/helpers.ts` resets the singleton `db` to a clean copy of seed data:

```ts
export function resetDb() {
  db.users = seedUsers.map(u => ({ ...u }));
  db.courses = seedCourses.map(c => ({ ...c }));
  db.enrollments = [];
  db.transactions = [];
  db.wishlists = [];
  db.chats = {};
  db.liveSessions = seedLiveSessions.map(s => ({ ...s }));
  db.featureFlags = seedFeatureFlags.map(f => ({ ...f }));
}
```

## Writing New Tests

When you add a new API method:
1. Add test cases to the relevant `__tests__/*.test.ts` file.
2. Cover the happy path, idempotency, and null/no-op cases.
3. Run `npm test` to confirm all 130+ tests still pass before committing.

When you add a new feature:
- Add API tests for any new `xxxApi` methods.
- Component tests are optional but welcome for complex UI logic.

## Coverage

Coverage is reported for `src/lib/**` and `src/components/**`. The following are excluded:
- `src/lib/seed.ts` (static data)
- `src/components/ui/**` (shadcn/ui primitives — treated as a dependency)
