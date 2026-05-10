# Admin Panel

## Access

Route: `/admin` — `src/routes/admin.tsx`

Only users with `role === "admin"` can access admin routes. Others see an access-denied screen with a link to `/admin-login`.

Demo admin credentials: `admin@lumen.io` / `admin123`

---

## Navigation Tabs

| Tab | Route | Description |
|---|---|---|
| Overview | `/admin` | Stats, revenue chart, active users chart |
| Courses | `/admin/courses` | Approve, edit, delete courses |
| Users | `/admin/users` | View and delete users |
| Transactions | `/admin/transactions` | Full transaction history |
| Live Sessions | `/admin/live-sessions` | Create and manage live sessions |
| Features | `/admin/features` | Enable / disable feature flags |

---

## Overview

`/admin` renders the `Overview` component directly (not via `<Outlet />`).

**Stat tiles:**
- Total users, Total courses, Enrollments, Revenue (from successful transactions only)

**Revenue chart:**
- Bar chart (Recharts `BarChart`) with daily / weekly / monthly period filter.
- Synthetic historical data generated in `statsApi.revenueByPeriod(period)`.
- `PeriodTabs` pill switcher updates the chart instantly.

**Active users chart:**
- Line chart (Recharts `LineChart`) with the same three-period filter.
- Data from `statsApi.activeUsersByPeriod(period)`.

**Top courses table:**
- Top 5 courses by student count.

---

## Courses (`/admin/courses`)

`src/routes/admin.courses.tsx`

- Lists all courses (all statuses visible to admin).
- **Status dropdown** — inline `<select>` per row changes `course.status` via `coursesApi.setStatus()`. Options: Published, Draft, In Review, Archived. Only `"published"` courses appear in the public catalog.
- **Edit** — opens an inline editor with all course fields. New courses default to `"draft"`.
- **Delete** — requires confirmation via `<ConfirmDialog>`.

### Content statuses

| Value | Label | Visible to students |
|---|---|---|
| `published` | Published | Yes |
| `draft` | Draft | No |
| `in_review` | In Review | No |
| `archived` | Archived | No |

---

## Users (`/admin/users`)

`src/routes/admin.users.tsx`

- Lists all users with role badge, email, join date.
- **Delete** — confirmation required. Cascade-deletes enrollments, transactions, wishlists, and chat history for that user.

---

## Transactions (`/admin/transactions`)

`src/routes/admin.transactions.tsx`

Read-only table of all transactions across all users. Columns: user email, course title, amount, status, date.

---

## Live Sessions (`/admin/live-sessions`)

See [Live Sessions](./live-sessions.md) for full details.

---

## Features (`/admin/features`)

See [Feature Flags](./feature-flags.md) for full details.
