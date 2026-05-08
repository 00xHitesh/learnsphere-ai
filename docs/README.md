# Lumen — Documentation

Lumen is a modern e-learning platform built with React 19, TanStack Router, and TanStack Query. It supports course browsing, live sessions, progress tracking, XP points, an AI study assistant, and a full admin panel.

---

## Contents

| Section | What's inside |
|---|---|
| [Architecture](./architecture/overview.md) | Tech stack, folder structure, key conventions |
| [Data Model](./architecture/data-model.md) | All TypeScript interfaces and field descriptions |
| [Routing](./architecture/routing.md) | File-based routing conventions and nesting rules |
| **Features** | |
| [Auth](./features/auth.md) | Login, register, password reset, admin login |
| [Courses](./features/courses.md) | Browse, detail, checkout, wishlist |
| [Learning](./features/learning.md) | Lesson player, progress, quizzes, certificates |
| [Dashboard](./features/dashboard.md) | User dashboard, charts, XP points |
| [Points System](./features/points-system.md) | XP earning rules and time tracking |
| [Live Sessions](./features/live-sessions.md) | Real-time countdown, join flow |
| [Feature Flags](./features/feature-flags.md) | Admin-controlled feature toggles |
| [Admin Panel](./features/admin.md) | Full admin overview |
| **API** | |
| [API Overview](./api/overview.md) | Mock API layer, mockRequest pattern |
| [API Reference](./api/reference.md) | Every module and method |
| **Components** | |
| [Components Overview](./components/overview.md) | All components, props, and usage |
| **Development** | |
| [Setup](./development/setup.md) | Local dev, env, demo credentials |
| [Testing](./development/testing.md) | Test structure and conventions |

---

## Quick Start

```bash
npm install
npm run dev       # http://localhost:3000
npm test          # run all tests
```

Demo credentials are in [Setup](./development/setup.md).

---

## Update Policy

> **After every new feature or change:** add or update the relevant file in `docs/features/`, and add an entry to this README table if it's a new section.
