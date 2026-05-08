# Points (XP) System

## Overview

Every student earns XP (experience points) by completing lessons. Points are stored on the `User` record and derived from enrollment data on the dashboard.

---

## Earning Rules

| Action | Points |
|---|---|
| Mark a lesson complete | **+10 XP** |
| Un-mark a lesson (toggle back to incomplete) | **−10 XP** |

Points are updated atomically inside `enrollmentsApi.toggleLessonComplete()` — when the lesson is added to `completedLessonIds`, `user.points += 10`; when removed, `user.points -= 10`.

---

## Storage

- `User.points` — persisted on the user record in `db.users`.
- The dashboard computes displayed points from enrollment data (`completedLessonIds.length × 10` across all enrollments) rather than `currentUser.points` to stay accurate even if the auth store is stale.

---

## Time Tracking (Related)

In addition to XP, actual time spent in the learn page is stored as `Enrollment.timeSpentSeconds`.

**How it works:**
1. When a lesson becomes active, a `Date.now()` timestamp is recorded in a ref.
2. When the active lesson changes or the page unmounts, elapsed seconds are flushed via `enrollmentsApi.recordTimeSpent()`.
3. A minimum of **5 seconds** must elapse before recording (filters out accidental navigations).
4. Time is cumulative — multiple sessions on the same course add up.

**Where it's used:**
- Dashboard bar chart — "Time spent (minutes)" per course.

---

## Schema

```sql
-- users table
points INTEGER NOT NULL DEFAULT 0

-- enrollments table
time_spent_seconds INTEGER NOT NULL DEFAULT 0
```

---

## Future Extensions

When connecting a real backend:
- Consider a `user_points_log` table for an audit trail of point changes.
- `time_spent_seconds` would be updated via an authenticated API call when the learn page flushes accumulated time.
