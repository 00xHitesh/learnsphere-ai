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

- Displays all **published** courses as a grid of `<CourseCard>` components.
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

---

## Pricing

### Dual-price model

Every course has a `listPrice` (full price, USD) and an optional `salePrice` (discounted price, USD). Both are stored in USD and converted for display via the user's `currencyCode`.

- `listPrice === 0` → free course; enroll directly without checkout.
- `salePrice` set → sale badge (`% OFF`) shown on `<CourseCard>` and detail page; `salePrice` is used as the checkout base price.
- Transaction amounts are stored in USD (`salePrice ?? listPrice`).

### Formatting

`usePriceFormatter()` (from `src/lib/query/locale.ts`) returns a function scoped to the current user's currency. It reads `currentUser.currencyCode` and the currencies list from React Query, then delegates to `formatPrice()` in `src/lib/utils/currency.ts`. Falls back to USD display until currencies load.

### Promo codes

Applied at checkout on top of any sale price. Available codes: `WELCOME` (10%), `SUMMER20` (20%), `STUDY50` (50%). Promo discounts are display-only — the stored transaction amount uses the pre-promo base price.

---

## Seed Data

Six courses seeded across five categories (Design, Programming, Art, Business, Writing). Three courses have active sale prices (TypeScript: $49→$29, Watercolor: $39→$24, React Architecture: $129→$89). All are `status: "published"`. See `src/lib/seed.ts`.
