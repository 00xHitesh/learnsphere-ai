# API Reference

All methods are async (return `Promise<T>`). Parameters and return types reference the interfaces in [Data Model](../architecture/data-model.md).

---

## authApi

| Method | Signature | Returns |
|---|---|---|
| `login` | `(email, password)` | `User` — throws if credentials don't match |
| `register` | `(name, email, password)` | `User` — throws if email already taken |
| `getUser` | `(id)` | `User \| null` |
| `updateInterests` | `(userId, interests: string[])` | `User` |
| `requestReset` | `(email)` | `string` (mock reset token) |
| `resetPassword` | `(token, password)` | `void` — throws if token invalid/expired |

---

## coursesApi

| Method | Signature | Returns |
|---|---|---|
| `list` | `()` | `Course[]` — approved only |
| `adminList` | `()` | `Course[]` — all including unapproved |
| `getBySlug` | `(slug)` | `Course \| null` |
| `upsert` | `(course: Course)` | `Course` — creates or replaces by ID |
| `delete` | `(id)` | `void` — cascade-deletes enrollments |
| `toggleApproved` | `(id)` | `Course` |

---

## enrollmentsApi

| Method | Signature | Returns |
|---|---|---|
| `listByUser` | `(userId)` | `Enrollment[]` |
| `get` | `(userId, courseId)` | `Enrollment \| null` |
| `enroll` | `(userId, courseId)` | `Enrollment` — idempotent |
| `toggleLessonComplete` | `(userId, courseId, lessonId)` | `Enrollment \| null` — awards/deducts 10 XP |
| `recordTimeSpent` | `(userId, courseId, seconds)` | `Enrollment \| null` — additive |
| `markQuizPassed` | `(userId, courseId, quizId)` | `Enrollment \| null` — idempotent |

---

## transactionsApi

| Method | Signature | Returns |
|---|---|---|
| `listByUser` | `(userId)` | `Transaction[]` |
| `listAll` | `()` | `Transaction[]` |
| `purchase` | `(userId, courseId)` | `Transaction` — also creates enrollment; 900ms delay |

---

## wishlistApi

| Method | Signature | Returns |
|---|---|---|
| `getByUser` | `(userId)` | `{ userId, courseId }[]` |
| `toggle` | `(userId, courseId)` | `{ added: boolean }` |

---

## usersApi

| Method | Signature | Returns |
|---|---|---|
| `list` | `()` | `User[]` |
| `delete` | `(id)` | `void` — cascade-deletes enrollments, transactions, wishlists, chats |

---

## statsApi

| Method | Signature | Returns |
|---|---|---|
| `overview` | `()` | `{ totalUsers, totalCourses, totalEnrollments, revenue, topCourses }` |
| `revenueByPeriod` | `(period: "daily" \| "weekly" \| "monthly")` | `PeriodPoint[]` — synthetic data |
| `activeUsersByPeriod` | `(period)` | `PeriodPoint[]` — synthetic data |

`PeriodPoint = { label: string; value: number }`. Daily → 7 points, weekly → 4 points, monthly → 6 points.

---

## chatApi

| Method | Signature | Returns |
|---|---|---|
| `getMessages` | `(userId)` | `ChatMessage[]` |
| `append` | `(userId, message: ChatMessage)` | `ChatMessage[]` |
| `reset` | `(userId)` | `void` |

---

## liveSessionsApi

| Method | Signature | Returns |
|---|---|---|
| `list` | `()` | `LiveSession[]` |
| `upsert` | `(session: LiveSession)` | `LiveSession` — creates or replaces by ID |
| `delete` | `(id)` | `void` — no-op for unknown IDs |

---

## featuresApi

| Method | Signature | Returns |
|---|---|---|
| `list` | `()` | `FeatureFlag[]` |
| `toggle` | `(name)` | `void` — flips `enabled`; no-op for unknown names |
