# Live Sessions

## Routes

| Route | File | Description |
|---|---|---|
| `/live` | `live.tsx` | Public live sessions listing |
| `/admin/live-sessions` | `admin.live-sessions.tsx` | Admin CRUD for sessions |

---

## Live Sessions Page (`/live`)

Gated by the `live_sessions` feature flag — if disabled, shows a "coming soon" message.

Sessions are grouped into three sections:
1. **Happening now** — sessions where `now >= start && now < start + duration`
2. **Coming up** — future sessions
3. **Past sessions** — ended sessions

Each section uses `<LiveSessionCard>`.

---

## LiveSessionCard

`src/components/LiveSessionCard.tsx`

Displays a single session with real-time status. Status is computed every second via `setInterval`.

**Status logic:**
```ts
if (now >= start && now < end)  → "live"
if (now < start)                → "upcoming"
else                            → "ended"
```

**UI by status:**
| Status | Badge | Action |
|---|---|---|
| `live` | Animated "LIVE NOW" (accent color) | "Join now →" button (opens `joinUrl`) |
| `upcoming` | "Upcoming" (primary color) | Live countdown timer + "Register" link |
| `ended` | "Ended" (muted) | "This session has ended." |

`compact` prop reduces padding and hides the description — used on the homepage.

---

## Homepage Integration

The homepage (`index.tsx`) shows the next 3 sessions in compact mode, gated by the `live_sessions` feature flag.

---

## Admin: Live Sessions (`/admin/live-sessions`)

Uses `useAdminLiveSessions()` (calls `liveSessionsApi.listAll()`) so all sessions are visible regardless of status.

Full CRUD interface:
- **Table** — lists all sessions with scheduled time, topic, registered/max count, status dropdown, and Edit/Delete actions.
- **Status dropdown** — inline `<select>` per row changes `session.status` via `liveSessionsApi.setStatus()`. Options: Published, Draft, In Review, Archived. Only `"published"` sessions appear on the public `/live` page.
- **Create / Edit modal** — `SessionEditor` inline form with fields: title, instructor, description, topic, scheduled datetime, duration, max attendees, join URL, status. New sessions default to `"published"`.
- **Delete** — uses `<ConfirmDialog>` for confirmation before calling `liveSessionsApi.delete()`.

### Content statuses (shared with courses)

| Value | Label | Visible publicly |
|---|---|---|
| `published` | Published | Yes |
| `draft` | Draft | No |
| `in_review` | In Review | No |
| `archived` | Archived | No |

---

## Seed Data

Five sessions are seeded (`seedLiveSessions` in `src/lib/seed.ts`), all with `status: "published"`:
- `ls-0`: Started 2026-05-04, 2880 min duration — always shows as LIVE during the demo period.
- `ls-1` through `ls-4`: Upcoming sessions May 7–14, 2026.
