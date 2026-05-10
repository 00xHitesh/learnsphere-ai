# Authentication

## Routes

| Route | File | Description |
|---|---|---|
| `/login` | `login.tsx` | Email + password sign-in |
| `/register` | `register.tsx` | Create a new student account |
| `/admin-login` | `admin-login.tsx` | Dedicated admin sign-in |
| `/forgot-password` | `forgot-password.tsx` | Request a password reset link |
| `/reset-password` | `reset-password.tsx` | Submit a new password via token |
| `/account` | `account.tsx` | Profile, region/currency, and interest settings |

---

## Auth Store

`src/lib/auth-store.tsx` provides an `AuthContext` with:

| Value | Type | Description |
|---|---|---|
| `currentUser` | `User \| null` | Currently signed-in user |
| `mounted` | `boolean` | `false` until localStorage has been read (prevents hydration flicker) |
| `login(email, password)` | `Promise<User>` | Authenticates and sets `currentUser` |
| `register(name, email, password)` | `Promise<User>` | Creates account and signs in |
| `logout()` | `void` | Clears state and localStorage |
| `requestReset(email)` | `Promise<string>` | Returns a mock reset token |
| `resetPassword(token, password)` | `Promise<void>` | Updates the password |
| `updateInterests(interests)` | `Promise<void>` | Saves interest categories to the user |
| `updateLocale(regionCode, currencyCode)` | `Promise<void>` | Updates the user's region and display currency |

Persistence: user ID is stored in `localStorage` under `lumen-auth-v1`. On mount, `authApi.getUser(userId)` is called to restore the session.

---

## API Layer

`src/lib/api/auth.ts` implements:

- `login(email, password)` — matches against `db.users`, throws on mismatch
- `register(name, email, password)` — creates a new user with `role: "user"`, `points: 0`, `regionCode: "US"`, `currencyCode: "USD"`
- `getUser(id)` — lookup by ID
- `updateInterests(userId, interests)` — mutates user in db
- `updateLocale(userId, regionCode, currencyCode)` — updates region and currency on the user record
- `requestReset(email)` — generates a mock token stored in `db.resetTokens`
- `resetPassword(token, password)` — validates token and updates password

---

## Account Page (`/account`)

Three sections:

1. **Profile** — read-only display of name, email, and role.
2. **Region & Currency** — dropdowns for country/region (ISO 3166-1 alpha-2) and display currency (ISO 4217). Changing the region auto-selects the region's default currency; the currency can then be overridden independently. Saves via `updateLocale()`.
3. **Interests** — category tags used for course recommendations. Saves via `updateInterests()`.

---

## Guest Pricing

`usePriceFormatter()` detects the browser locale via `Intl.DateTimeFormat` for users who are not signed in, maps it to a region, and uses that region's default currency. Falls back to USD if detection fails or the locale has no territory code.

---

## Admin vs. Student Login

- `/login` accepts both student and admin credentials but redirects students to `/dashboard` and is also used by admins.
- `/admin-login` is a separate page that only accepts `role === "admin"` accounts — intended as the canonical admin entry point so students can't accidentally access admin routes.

Admin routes guard themselves: `admin.tsx` checks `currentUser.role !== "admin"` and shows an access-denied screen.
