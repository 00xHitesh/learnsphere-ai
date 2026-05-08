# Architecture Overview

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Routing | TanStack Router 1.x (file-based) |
| Data fetching | TanStack React Query 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (Radix UI) |
| Charts | Recharts 2 |
| Icons | Lucide React |
| Build | Vite 7 |
| Runtime | Cloudflare Workers (Wrangler) |
| Package manager | Bun / npm |
| Testing | Vitest + Testing Library + jsdom |

---

## Folder Structure

```
src/
├── assets/             Static files (hero image)
├── components/         Reusable UI components
│   └── ui/             shadcn/ui primitives (button, dialog, badge, …)
├── hooks/              Custom React hooks (use-mobile)
├── lib/
│   ├── api/            Mock backend API layer
│   ├── query/          TanStack Query hooks (one file per domain)
│   ├── auth-store.tsx  Auth context + localStorage persistence
│   ├── theme-store.tsx Light / dark / system theme
│   ├── seed.ts         Development seed data
│   ├── types.ts        All shared TypeScript interfaces
│   └── utils.ts        cn() helper for Tailwind class merging
├── routes/             File-based route components
├── test/               Vitest setup + shared resetDb() helper
├── router.tsx          Router instantiation
└── styles.css          Tailwind base + CSS custom properties (design tokens)
```

---

## Key Conventions

### Path alias
All imports from `src/` use `@/`. Example: `import { db } from "@/lib/api/db"`.

### Mock API layer
There is no real backend. `src/lib/api/db.ts` holds a module-level in-memory object (`MockDB`) that acts as the database. Every API module calls `mockRequest()` which wraps the operation in a simulated async delay. See [API Overview](../api/overview.md).

### State management
- **Server state** (courses, enrollments, sessions, …) lives in TanStack Query. Every query has a key defined in `src/lib/query/keys.ts`.
- **Auth state** lives in a React context (`auth-store.tsx`), persisted to `localStorage` as `lumen-auth-v1`.
- **Theme state** lives in a React context (`theme-store.tsx`), persisted to `localStorage`.

### Design tokens
All colors, gradients, and shadows are CSS custom properties defined in `styles.css` using `oklch`. The primary gradient is `var(--gradient-accent)`.

### Routing
Routes are defined as files in `src/routes/`. Nested routes use dot-notation (`admin.courses.tsx`). Dynamic segments use `$param` notation (`courses.$slug.tsx`). See [Routing](./routing.md).
