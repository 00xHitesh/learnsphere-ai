# Data Model

All types are defined in `src/lib/types.ts`.

---

## User

```ts
interface User {
  id: string;           // e.g. "u-demo"
  name: string;
  email: string;
  password: string;     // plaintext — mock only, never sent to a real server
  role: "user" | "admin";
  interests: string[];  // category names used for recommendations
  createdAt: string;    // ISO datetime
  points: number;       // XP total; +10 per lesson completed, -10 when un-marked
}
```

---

## Course

```ts
interface Course {
  id: string;           // e.g. "c-1"
  title: string;
  slug: string;         // URL-safe identifier, used in all route params
  description: string;
  summary: string;      // Short AI-style summary shown on cards
  category: string;     // "Design" | "Programming" | "Art" | "Business" | "Writing"
  level: "Beginner" | "Intermediate" | "Advanced";
  price: number;        // 0 = free
  rating: number;
  students: number;
  instructor: string;
  instructorBio: string;
  cover: string;        // Emoji or short label rendered in the course artwork tile
  lessons: Lesson[];
  quizzes: Quiz[];
  reviews: Review[];
  tags: string[];
  approved: boolean;    // Admin must approve before course appears in catalog
  createdAt: string;
}
```

---

## Lesson

```ts
interface Lesson {
  id: string;
  title: string;
  duration: string;     // "MM:SS" format, e.g. "8:24"
  videoUrl?: string;    // YouTube embed URL
  preview?: boolean;    // Visible without enrollment
  description?: string;
  resources?: { label: string; url: string }[];
}
```

---

## Quiz / QuizQuestion / QuizOption

```ts
interface Quiz {
  id: string;
  title: string;
  description?: string;
  passingScore: number; // Percentage 0–100 required to pass
  questions: QuizQuestion[];
}

interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  correctOptionIds: string[]; // Multiple entries = multi-select question
  explanation?: string;
}

interface QuizOption {
  id: string;
  text: string;
}
```

---

## Enrollment

```ts
interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  completedLessonIds: string[];  // IDs of lessons marked complete
  passedQuizIds: string[];       // IDs of quizzes passed
  enrolledAt: string;            // ISO datetime
  timeSpentSeconds: number;      // Actual time accumulated in the learn page
}
```

`timeSpentSeconds` is incremented via `enrollmentsApi.recordTimeSpent()` — the learn page flushes accumulated seconds every time the active lesson changes or the component unmounts (≥5 second threshold).

---

## Transaction

```ts
interface Transaction {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  status: "success" | "failed";
  date: string;  // ISO datetime
}
```

---

## ChatMessage

```ts
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  date: string;  // ISO datetime
}
```

Chat history is stored per-user in `db.chats[userId]`.

---

## LiveSession

```ts
interface LiveSession {
  id: string;
  title: string;
  instructor: string;
  description: string;
  scheduledAt: string;     // ISO datetime
  durationMinutes: number;
  topic: string;
  joinUrl: string;         // External meeting URL (Zoom, Meet, etc.)
  courseId?: string;       // Optional link to a course
  registeredCount: number;
  maxAttendees: number;
}
```

Session status (`"live"` / `"upcoming"` / `"ended"`) is computed dynamically at render time from `scheduledAt` and `durationMinutes`.

---

## FeatureFlag

```ts
interface FeatureFlag {
  id: string;
  name: string;        // Programmatic key, e.g. "live_sessions"
  label: string;       // Human label for the admin UI
  description: string;
  enabled: boolean;
}
```

---

## MockDB Shape

```ts
interface MockDB {
  users: User[];
  courses: Course[];
  enrollments: Enrollment[];
  transactions: Transaction[];
  wishlists: { userId: string; courseId: string }[];
  chats: Record<string, ChatMessage[]>;
  liveSessions: LiveSession[];
  featureFlags: FeatureFlag[];
  resetTokens: { token: string; userId: string; expiresAt: number }[];
}
```
