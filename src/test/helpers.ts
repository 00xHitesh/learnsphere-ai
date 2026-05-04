import { db } from "@/lib/api/db";
import { seedCourses, seedFeatureFlags, seedLiveSessions, seedUsers } from "@/lib/seed";

/** Reset the in-memory DB to seed state before each test */
export function resetDb() {
  db.users = seedUsers.map((u) => ({ ...u }));
  db.courses = seedCourses.map((c) => ({ ...c }));
  db.enrollments = [];
  db.transactions = [];
  db.wishlists = [];
  db.chats = {};
  db.liveSessions = seedLiveSessions.map((s) => ({ ...s }));
  db.featureFlags = seedFeatureFlags.map((f) => ({ ...f }));
}
