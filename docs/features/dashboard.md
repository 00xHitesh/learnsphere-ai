# User Dashboard

## Route

`/dashboard` — `src/routes/dashboard.tsx`

The dashboard is the home base for logged-in students. It shows learning progress, XP points, charts, and quick-access to all enrolled courses.

---

## Sections

### 1. Hero + XP Badge

- Greeting: "Hey, {firstName}!"
- Subtitle counts: `N completed · N in progress · N not started`
- XP badge (gradient background): total points earned, computed as `completedLessonIds.length × 10` across all enrollments.

### 2. Charts

Shown only when the user has at least one enrollment.

**Course Breakdown (Pie Chart)**
- Slices: Completed, In Progress, Not Started.
- Rendered with Recharts `PieChart` (donut style, 120×120px).
- Colors: violet (completed), pink (in-progress), muted (not started).

**Time Spent (Bar Chart)**
- One bar per enrolled course.
- Value: `enrollment.timeSpentSeconds / 60` — actual tracked time from the learn page.
- Shows "Spend time in a lesson to see your stats" when all values are 0.
- Rendered with Recharts `BarChart` (responsive, 120px height).

### 3. Currently Cooking

- In-progress courses (`0 < pct < 100`).
- Each card shows: course icon, title, instructor, lesson count, gradient progress bar, "Keep going →" link.
- Empty state links to `/courses`.

### 4. Conquered

- Completed courses (`pct === 100`).
- Each card shows: title, instructor, "Completed" badge, Download Certificate button.
- Only rendered if at least one course is complete.

### 5. In Your Library

- Enrolled courses with `pct === 0` (purchased/enrolled but never started).
- Each card shows: muted course icon, title, instructor, lesson count, "Start now →" link.
- Subtitle says "Purchased, paid for, just waiting on you."

### 6. You'd Probably Vibe With These

- Recommendation section: up to 3 courses not yet enrolled, filtered by `currentUser.interests`.
- Falls back to any unenrolled course if no interest match.

### 7. Purchase History

- Table of past transactions: Date, Course (linked to course detail page), Amount, Status.
- Course names are clickable links to `/courses/:slug`.
- Only rendered if the user has transactions.

---

## Data Dependencies

| Query | Hook | Data used |
|---|---|---|
| Courses | `useCourses()` | Course titles, slugs, lesson counts |
| Enrollments | `useMyEnrollments(userId)` | Progress, completedLessonIds, timeSpentSeconds |
| Transactions | `useMyTransactions(userId)` | Purchase history table |
