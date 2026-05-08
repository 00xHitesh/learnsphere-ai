# Components Overview

Custom components live in `src/components/`. UI primitives (shadcn/ui) live in `src/components/ui/`.

---

## Layout Components

### Layout
`src/components/Layout.tsx`

Root page shell. Composes `<Header>`, `<Footer>`, and `<Chatbot>` around a `<main>` flex column. Every route renders inside this wrapper via `__root.tsx`.

### Header
`src/components/Header.tsx`

Sticky top navigation bar. Contains:
- Logo (links to `/`)
- Nav links: Home, Courses, Live, About, Contact
- Auth-aware actions: Dashboard, Admin (admin only), Wishlist, Account, Sign out — or Sign in / Join free for guests
- `ThemeToggle` button (cycles light → dark → system)
- Collapsible mobile menu (hamburger)

### Footer
`src/components/Footer.tsx`

Four-column footer grid: brand tagline, Learn links, Company links, demo account credentials. Shows the current year in the copyright line.

---

## Course Components

### CourseCard
`src/components/CourseCard.tsx`

Grid card that links to `/courses/:slug`. Displays a coloured cover tile (4-color oklch palette cycling by index), category badge, title, summary (2-line clamp), rating, student count, and price.

**Props:**
| Prop | Type | Default |
|---|---|---|
| `course` | `Course` | required |
| `index` | `number` | `0` — used to pick the palette color |

### CourseIcon
`src/components/CourseIcon.tsx`

Renders a Lucide icon based on course category. Mapping: Design → Palette, Programming → Code2, Art → Paintbrush, Business → Briefcase, Writing → PenLine. Falls back to BookOpen for unknown categories.

**Props:** `category: string`, `className?: string`

---

## Session Components

### LiveSessionCard
`src/components/LiveSessionCard.tsx`

Displays a live session with real-time status. Uses a 1-second `setInterval` to update status (`"live"` / `"upcoming"` / `"ended"`) and countdown display.

- **Live**: accent border, animated "LIVE NOW" badge, "Join now →" button.
- **Upcoming**: countdown timer (days/hours/minutes/seconds), "Register" link.
- **Ended**: muted badge, static message.

**Props:**
| Prop | Type | Default |
|---|---|---|
| `session` | `LiveSession` | required |
| `compact` | `boolean` | `false` — hides description, reduces padding |

---

## Utility Components

### ConfirmDialog
`src/components/ConfirmDialog.tsx`

Accessible confirmation modal that replaces browser `confirm()`. Renders a backdrop with click-to-dismiss, an alert icon, title, optional body text, and Cancel / Confirm action buttons. Returns `null` when `open` is false (zero DOM cost when hidden).

**Props:**
| Prop | Type | Default |
|---|---|---|
| `open` | `boolean` | required |
| `title` | `string` | required |
| `body` | `string` | — |
| `confirmLabel` | `string` | `"Delete"` |
| `onConfirm` | `() => void` | required |
| `onCancel` | `() => void` | required |

### CertificateButton
`src/components/CertificateButton.tsx`

Generates and downloads a course completion certificate as a PNG. Renders a 1200×848px layout entirely on a `<canvas>` element (no server required). Includes student name, course title, instructor, issue date, and a random certificate ID.

**Props:**
| Prop | Type | Default |
|---|---|---|
| `userName` | `string` | required |
| `courseTitle` | `string` | required |
| `instructor` | `string` | required |
| `variant` | Button variant | `"default"` |
| `size` | Button size | — |
| `className` | `string` | — |

### Chatbot
`src/components/Chatbot.tsx`

Floating chat widget (bottom-right corner). Only renders for authenticated users. Shows a "Ask Lumen" FAB; clicking opens a chat panel with message history, a text input, and a Send button.

Replies are generated client-side by `mockReply()` — keyword matching on recommendation, price, certificate, and greeting intents. Chat history is persisted per-user in `db.chats` via `chatApi`.

### Logo
`src/components/Logo.tsx`

Brand mark: gradient square badge with the letter "L" alongside the wordmark "Lumen". Uses `var(--gradient-accent)` for the badge background.

---

## UI Primitives (shadcn/ui)

44 component files in `src/components/ui/`. These are Radix UI–based primitives styled with Tailwind. They are not modified — treat them as a dependency. Full list: accordion, alert-dialog, alert, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input-otp, input, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toggle-group, toggle, tooltip.
