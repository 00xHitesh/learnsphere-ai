# Development Setup

## Prerequisites

- Node.js 20+ or Bun 1.x
- A modern browser

## Install & Run

```bash
# Install dependencies
npm install
# or
bun install

# Start the dev server
npm run dev
# → http://localhost:3000
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build |
| `npm run build:dev` | Development build (no minification) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format all files with Prettier |
| `npm test` | Run all Vitest tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate HTML coverage report |

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Student | `demo@lumen.io` | `demo1234` |
| Admin | `admin@lumen.io` | `admin123` |

These are also shown in the app footer for convenience.

## Environment

No `.env` file is required. The app runs entirely in-browser with a mock API — no external services.

For Cloudflare Workers deployment, configure `wrangler.jsonc` with your account ID and zone.

## Path Alias

`@/` maps to `src/`. Example: `import { db } from "@/lib/api/db"`.

## Code Style

- ESLint + Prettier are configured. Run `npm run format` before committing.
- TypeScript strict mode is enabled — no `any`, no implicit returns.
- Tailwind CSS 4 syntax: use CSS variable shorthand `shadow-(--shadow-soft)` not `shadow-[var(--shadow-soft)]`.
