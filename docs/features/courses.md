# Courses

## Routes

| Route | File | Description |
|---|---|---|
| `/courses` | `courses.index.tsx` | Browse and filter the course catalog |
| `/courses/:slug` | `courses.$slug.tsx` | Course detail, reviews, enroll / checkout |
| `/checkout/:slug` | `checkout.$slug.tsx` | Payment flow for paid courses |
| `/wishlist` | `wishlist.tsx` | Saved courses for the current user |

---

## Course Catalog (`/courses`)

- Displays all **approved** courses as a grid of `<CourseCard>` components.
- Filters: category tabs + free/paid toggle + text search (title, summary, instructor, tags).
- All filtering is client-side — no network call on each keystroke.
- If the `courses` feature flag is disabled, the page shows a "coming soon" message.

---

## Course Detail (`/courses/:slug`)

Key sections:
1. **Hero** — cover tile, title, meta (level, category, rating, students, price).
2. **Lesson list** — shows all lessons with duration; first lesson is a free preview.
3. **Instructor** — bio block.
4. **Reviews** — star ratings + written reviews.
5. **Sticky CTA** — "Enroll free" for free courses, "Buy now" for paid courses, "Continue learning" if already enrolled.

### Enrollment flow
- **Free course**: clicking "Enroll free" calls `enrollmentsApi.enroll()` directly (no checkout).
- **Paid course**: redirects to `/checkout/:slug`.
- If already enrolled, the CTA links to `/learn/:slug`.

---

## Checkout (`/checkout/:slug`)

- Displays course title and price.
- "Complete purchase" button calls `transactionsApi.purchase()` which:
  1. Creates a `Transaction` record (status: `"success"`).
  2. Creates an `Enrollment` record with `timeSpentSeconds: 0`.
- On success, redirects to `/learn/:slug`.
- Simulates a 900ms payment delay.

---

## Wishlist

- Add/remove via the heart icon on the course detail page.
- Wishlist items are shown as a grid on `/wishlist`.
- Uses `wishlistApi` + React Query (`useWishlist`, `useToggleWishlist`).
- Wishlist is per-user; unauthenticated users are prompted to sign in.

---

## Seed Data

Six courses are seeded across five categories (Design, Programming, Art, Business, Writing) with prices ranging from free to $129. All are `approved: true`. See `src/lib/seed.ts`.
