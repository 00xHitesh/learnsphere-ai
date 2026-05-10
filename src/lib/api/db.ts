import { seedCourses, seedCurrencies, seedFeatureFlags, seedLiveSessions, seedRegions, seedUsers } from "../seed";
import type { ChatMessage, Course, Currency, Enrollment, FeatureFlag, LiveSession, Region, Transaction, User } from "../types";

interface MockDB {
  users: User[];
  courses: Course[];
  enrollments: Enrollment[];
  transactions: Transaction[];
  wishlists: { userId: string; courseId: string }[];
  chats: Record<string, ChatMessage[]>;
  liveSessions: LiveSession[];
  featureFlags: FeatureFlag[];
  currencies: Currency[];
  regions: Region[];
}

// In-memory store that simulates a database.
// Replace each function in the API modules with real fetch() calls when a backend is ready.
// Data resets on page refresh — expected behavior for a mock API.
export const db: MockDB = {
  users: seedUsers.map((u) => ({ ...u })),
  courses: seedCourses.map((c) => ({ ...c })),
  enrollments: [],
  transactions: [],
  wishlists: [],
  chats: {},
  liveSessions: seedLiveSessions.map((s) => ({ ...s })),
  featureFlags: seedFeatureFlags.map((f) => ({ ...f })),
  currencies: seedCurrencies.map((c) => ({ ...c })),
  regions: seedRegions.map((r) => ({ ...r })),
};
