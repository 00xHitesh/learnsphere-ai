# API Layer Overview

## Architecture

There is no real backend server. All data operations go through a mock API layer in `src/lib/api/` that reads from and writes to an in-memory singleton (`MockDB`) defined in `src/lib/api/db.ts`.

---

## db.ts — The In-Memory Database

```ts
// Singleton initialised once at module load from seed data
const db: MockDB = {
  users: seedUsers.map(u => ({ ...u })),
  courses: seedCourses.map(c => ({ ...c })),
  enrollments: [],
  transactions: [],
  wishlists: [],
  chats: {},
  liveSessions: seedLiveSessions.map(s => ({ ...s })),
  featureFlags: seedFeatureFlags.map(f => ({ ...f })),
  resetTokens: [],
};
```

`db` is exported and imported directly by every API module. Tests reset it before each suite using `resetDb()` from `src/test/helpers.ts`.

---

## mockRequest Pattern

Every API method wraps its operation in `mockRequest()`:

```ts
// src/lib/api/client.ts
export const mockRequest = async <T>(fn: () => T): Promise<T> => {
  await new Promise(r => setTimeout(r, MOCK_DELAY_MS));
  return fn();
};
```

This simulates network latency so the UI's loading states are exercised during development. In tests, `mockRequest` is mocked to be synchronous:

```ts
vi.mock("../client", () => ({
  mockRequest: async <T>(fn: () => T) => fn(),
}));
```

---

## API Modules

All modules are re-exported from `src/lib/api/index.ts`:

| Export | Module |
|---|---|
| `authApi` | `auth.ts` |
| `coursesApi` | `courses.ts` |
| `enrollmentsApi` | `enrollments.ts` |
| `transactionsApi` | `transactions.ts` |
| `wishlistApi` | `wishlist.ts` |
| `usersApi` | `users.ts` |
| `statsApi` | `stats.ts` |
| `chatApi` | `chat.ts` |
| `liveSessionsApi` | `liveSessions.ts` |
| `featuresApi` | `features.ts` |

---

## React Query Integration

API modules are never called directly from components. Instead, each domain has a query file in `src/lib/query/` that wraps API calls in `useQuery` / `useMutation` hooks.

Query keys are centralised in `src/lib/query/keys.ts` (the `qk` factory object). This ensures consistent cache invalidation across the app.

**Pattern:**
```ts
// Query hook
export function useCourses() {
  return useQuery({ queryKey: qk.courses.list(), queryFn: coursesApi.list });
}

// Mutation hook with cache invalidation
export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => coursesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.courses.all() }),
  });
}
```
