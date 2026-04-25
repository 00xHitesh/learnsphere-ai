import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ChatMessage,
  Course,
  Enrollment,
  Transaction,
  User,
} from "./types";
import { seedCourses, seedUsers } from "./seed";

const KEY = "lumen-lms-v1";

interface DB {
  users: User[];
  courses: Course[];
  enrollments: Enrollment[];
  transactions: Transaction[];
  wishlists: { userId: string; courseId: string }[];
  chats: Record<string, ChatMessage[]>; // userId -> messages
  currentUserId: string | null;
}

function load(): DB {
  if (typeof window === "undefined") {
    return {
      users: seedUsers,
      courses: seedCourses,
      enrollments: [],
      transactions: [],
      wishlists: [],
      chats: {},
      currentUserId: null,
    };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch {
    /* ignore */
  }
  const fresh: DB = {
    users: seedUsers,
    courses: seedCourses,
    enrollments: [],
    transactions: [],
    wishlists: [],
    chats: {},
    currentUserId: null,
  };
  localStorage.setItem(KEY, JSON.stringify(fresh));
  return fresh;
}

function save(db: DB) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(db));
}

interface StoreContextValue {
  db: DB;
  currentUser: User | null;
  // auth
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  requestReset: (email: string) => Promise<string>; // returns mock token
  resetPassword: (token: string, password: string) => Promise<void>;
  updateInterests: (interests: string[]) => void;
  // courses
  upsertCourse: (course: Course) => void;
  deleteCourse: (id: string) => void;
  // enrollments
  enroll: (courseId: string) => void;
  isEnrolled: (courseId: string) => boolean;
  toggleLessonComplete: (courseId: string, lessonId: string) => void;
  progress: (courseId: string) => number;
  // wishlist
  toggleWishlist: (courseId: string) => void;
  inWishlist: (courseId: string) => boolean;
  // payments
  purchase: (courseId: string) => Promise<Transaction>;
  // admin
  deleteUser: (id: string) => void;
  // chat
  appendChat: (msg: ChatMessage) => void;
  resetChat: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const RESET_TOKENS: Record<string, string> = {}; // token -> email

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => load());

  useEffect(() => {
    save(db);
  }, [db]);

  const currentUser =
    db.users.find((u) => u.id === db.currentUserId) ?? null;

  const value: StoreContextValue = useMemo(() => {
    const update = (fn: (prev: DB) => DB) => setDb((prev) => fn(prev));

    return {
      db,
      currentUser,
      async login(email, password) {
        const user = db.users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
        );
        if (!user) throw new Error("Invalid email or password.");
        update((p) => ({ ...p, currentUserId: user.id }));
        return user;
      },
      async register(name, email, password) {
        if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
          throw new Error("An account with that email already exists.");
        }
        const user: User = {
          id: `u-${Date.now()}`,
          name,
          email,
          password,
          role: "user",
          interests: [],
          createdAt: new Date().toISOString(),
        };
        update((p) => ({ ...p, users: [...p.users, user], currentUserId: user.id }));
        return user;
      },
      logout() {
        update((p) => ({ ...p, currentUserId: null }));
      },
      async requestReset(email) {
        const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!user) throw new Error("No account with that email.");
        const token = Math.random().toString(36).slice(2, 10);
        RESET_TOKENS[token] = user.email;
        return token;
      },
      async resetPassword(token, password) {
        const email = RESET_TOKENS[token];
        if (!email) throw new Error("Invalid or expired reset link.");
        update((p) => ({
          ...p,
          users: p.users.map((u) =>
            u.email.toLowerCase() === email.toLowerCase() ? { ...u, password } : u,
          ),
        }));
        delete RESET_TOKENS[token];
      },
      updateInterests(interests) {
        if (!currentUser) return;
        update((p) => ({
          ...p,
          users: p.users.map((u) => (u.id === currentUser.id ? { ...u, interests } : u)),
        }));
      },
      upsertCourse(course) {
        update((p) => {
          const exists = p.courses.some((c) => c.id === course.id);
          return {
            ...p,
            courses: exists
              ? p.courses.map((c) => (c.id === course.id ? course : c))
              : [...p.courses, course],
          };
        });
      },
      deleteCourse(id) {
        update((p) => ({
          ...p,
          courses: p.courses.filter((c) => c.id !== id),
          enrollments: p.enrollments.filter((e) => e.courseId !== id),
        }));
      },
      enroll(courseId) {
        if (!currentUser) return;
        if (db.enrollments.some((e) => e.userId === currentUser.id && e.courseId === courseId))
          return;
        const enrollment: Enrollment = {
          id: `e-${Date.now()}`,
          userId: currentUser.id,
          courseId,
          completedLessonIds: [],
          enrolledAt: new Date().toISOString(),
        };
        update((p) => ({ ...p, enrollments: [...p.enrollments, enrollment] }));
      },
      isEnrolled(courseId) {
        if (!currentUser) return false;
        return db.enrollments.some(
          (e) => e.userId === currentUser.id && e.courseId === courseId,
        );
      },
      toggleLessonComplete(courseId, lessonId) {
        if (!currentUser) return;
        update((p) => ({
          ...p,
          enrollments: p.enrollments.map((e) => {
            if (e.userId !== currentUser.id || e.courseId !== courseId) return e;
            const has = e.completedLessonIds.includes(lessonId);
            return {
              ...e,
              completedLessonIds: has
                ? e.completedLessonIds.filter((id) => id !== lessonId)
                : [...e.completedLessonIds, lessonId],
            };
          }),
        }));
      },
      progress(courseId) {
        if (!currentUser) return 0;
        const course = db.courses.find((c) => c.id === courseId);
        const enrollment = db.enrollments.find(
          (e) => e.userId === currentUser.id && e.courseId === courseId,
        );
        if (!course || !enrollment || course.lessons.length === 0) return 0;
        return Math.round(
          (enrollment.completedLessonIds.length / course.lessons.length) * 100,
        );
      },
      toggleWishlist(courseId) {
        if (!currentUser) return;
        update((p) => {
          const exists = p.wishlists.some(
            (w) => w.userId === currentUser.id && w.courseId === courseId,
          );
          return {
            ...p,
            wishlists: exists
              ? p.wishlists.filter(
                  (w) => !(w.userId === currentUser.id && w.courseId === courseId),
                )
              : [...p.wishlists, { userId: currentUser.id, courseId }],
          };
        });
      },
      inWishlist(courseId) {
        if (!currentUser) return false;
        return db.wishlists.some(
          (w) => w.userId === currentUser.id && w.courseId === courseId,
        );
      },
      async purchase(courseId) {
        if (!currentUser) throw new Error("Please sign in to purchase.");
        const course = db.courses.find((c) => c.id === courseId);
        if (!course) throw new Error("Course not found.");
        // Mock processing delay
        await new Promise((r) => setTimeout(r, 900));
        const tx: Transaction = {
          id: `t-${Date.now()}`,
          userId: currentUser.id,
          courseId,
          amount: course.price,
          status: "success",
          date: new Date().toISOString(),
        };
        const enrollment: Enrollment = {
          id: `e-${Date.now()}`,
          userId: currentUser.id,
          courseId,
          completedLessonIds: [],
          enrolledAt: new Date().toISOString(),
        };
        update((p) => ({
          ...p,
          transactions: [...p.transactions, tx],
          enrollments: p.enrollments.some(
            (e) => e.userId === currentUser.id && e.courseId === courseId,
          )
            ? p.enrollments
            : [...p.enrollments, enrollment],
        }));
        return tx;
      },
      deleteUser(id) {
        update((p) => ({
          ...p,
          users: p.users.filter((u) => u.id !== id),
          enrollments: p.enrollments.filter((e) => e.userId !== id),
          transactions: p.transactions.filter((t) => t.userId !== id),
        }));
      },
      appendChat(msg) {
        if (!currentUser) return;
        update((p) => ({
          ...p,
          chats: {
            ...p.chats,
            [currentUser.id]: [...(p.chats[currentUser.id] ?? []), msg],
          },
        }));
      },
      resetChat() {
        if (!currentUser) return;
        update((p) => ({ ...p, chats: { ...p.chats, [currentUser.id]: [] } }));
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, currentUser]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}