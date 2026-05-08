# Learning

## Route

`/learn/:slug` — `src/routes/learn.$slug.tsx`

The learn page is the core content experience. It renders a two-column layout: a lesson/quiz sidebar on the left and the active content area on the right.

---

## Layout

```
┌──────────────────┬──────────────────────────────────────┐
│  Sidebar         │  Content area                        │
│  ─ Progress bar  │  ─ Video player (YouTube embed)      │
│  ─ Lesson list   │  ─ Lesson description                │
│  ─ Quiz list     │  ─ Mark complete / Prev / Next       │
└──────────────────┴──────────────────────────────────────┘
```

---

## Navigation

Active lesson is controlled via URL search params: `?lesson=<lessonId>` and `?quiz=<quizId>`. Navigating between lessons uses `navigate({ search: { lesson: id } })` — no page reload.

---

## Enrollment Guard

- Unauthenticated users see a sign-in prompt.
- Users not enrolled in a paid course see an "Enroll to access" prompt.
- Free courses auto-enroll the user on page entry.

---

## Lesson Completion

Clicking **Mark complete** calls `enrollmentsApi.toggleLessonComplete()`, which:
1. Adds/removes the lesson ID from `enrollment.completedLessonIds`.
2. Awards/deducts **10 XP** from `user.points`.

The progress bar in the sidebar updates immediately via React Query optimistic invalidation.

---

## Time Tracking

A `useEffect` tied to `activeLessonId` starts a timer when a lesson becomes active. When the active lesson changes or the component unmounts, the elapsed time is flushed to `enrollment.timeSpentSeconds` via `enrollmentsApi.recordTimeSpent()`.

- Minimum threshold: **5 seconds** (ignores accidental navigation clicks).
- Accumulates across multiple sessions — time is always additive.
- The dashboard bar chart reads this stored value directly.

---

## Quizzes

- Quiz view replaces the lesson content area (same `?quiz=<quizId>` search param).
- Supports single-answer (radio) and multi-select (checkbox) questions.
- Score is computed client-side on submit.
- Passing score is defined per quiz (default 70%).
- `enrollmentsApi.markQuizPassed()` is called on a passing score.
- Certificate is unlocked only when all lessons **and** all quizzes are complete.

---

## Completion Screen

When `pct === 100` and all quizzes are passed, a modal overlay appears once (tracked via `completionShown` ref). It offers:
- Download Certificate button
- View Dashboard link
- "Keep reviewing" dismiss

---

## Certificates

`<CertificateButton>` renders a 1200×848px PNG entirely on a `<canvas>` element:
- Student name, course title, instructor, issue date, random certificate ID.
- Gold border, corner diamonds, watermark seal.
- Downloaded as `<course-slug>-certificate.png`.

No server call — everything happens in the browser.
