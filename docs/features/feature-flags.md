# Feature Flags

## Overview

Admins can enable or disable features at runtime without a deployment. Flags are stored in `db.featureFlags` and toggled from `/admin/features`.

---

## Admin UI (`/admin/features`)

Route: `src/routes/admin.features.tsx`

A simple toggle list showing each flag's label, description, and an on/off switch. Toggling calls `featuresApi.toggle(name)` which flips `enabled` in the db and invalidates the features query immediately.

---

## Using Flags in Code

```ts
// Read a single flag (returns true if flag not found — fail open while loading)
const isEnabled = useFeatureFlag("live_sessions");

// Read all flags
const { data: flags } = useFeatureFlags();
```

`useFeatureFlag(name)` is in `src/lib/query/features.ts`. It returns `flag?.enabled ?? true` so features remain visible while the query is loading.

---

## Available Flags

| Name | Label | What it gates |
|---|---|---|
| `courses` | Courses | Course catalog and all course detail pages |
| `live_sessions` | Live Sessions | Live sessions section on homepage and `/live` page |

---

## Adding a New Flag

1. Add an entry to `seedFeatureFlags` in `src/lib/seed.ts`:
   ```ts
   { id: "ff-3", name: "my_feature", label: "My Feature", description: "...", enabled: true }
   ```
2. Gate the UI with `useFeatureFlag("my_feature")` in the relevant route/component.
3. The admin toggle UI picks it up automatically — no UI changes needed.

---

## API

`src/lib/api/features.ts`

| Method | Description |
|---|---|
| `featuresApi.list()` | Returns all feature flags (copies) |
| `featuresApi.toggle(name)` | Flips `enabled` for the flag with the given name; no-op for unknown names |
