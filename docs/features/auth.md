# Authentication

## Routes

| Route | File | Description |
|---|---|---|
| `/login` | `login.tsx` | Email + password sign-in |
| `/register` | `register.tsx` | Create a new student account |
| `/admin-login` | `admin-login.tsx` | Dedicated admin sign-in |
| `/forgot-password` | `forgot-password.tsx` | Request a password reset link |
| `/reset-password` | `reset-password.tsx` | Submit a new password via token |

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

Persistence: user ID is stored in `localStorage` under `lumen-auth-v1`. On mount, `authApi.getUser(userId)` is called to restore the session.

---

## API Layer

`src/lib/api/auth.ts` implements:

- `login(email, password)` — matches against `db.users`, throws on mismatch
- `register(name, email, password)` — creates a new user with `role: "user"` and `points: 0`
- `getUser(id)` — lookup by ID
- `updateInterests(userId, interests)` — mutates user in db
- `requestReset(email)` — generates a mock token stored in `db.resetTokens`
- `resetPassword(token, password)` — validates token and updates password

---

## Admin vs. Student Login

- `/login` accepts both student and admin credentials but redirects students to `/dashboard` and is also used by admins.
- `/admin-login` is a separate page that only accepts `role === "admin"` accounts — intended as the canonical admin entry point so students can't accidentally access admin routes.

Admin routes guard themselves: `admin.tsx` checks `currentUser.role !== "admin"` and shows an access-denied screen.
