import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetDb } from "@/test/helpers";
import { db } from "../db";
import type { Course } from "@/lib/types";

vi.mock("../client", () => ({
  mockRequest: async <T>(fn: () => T) => fn(),
}));

const { coursesApi } = await import("../courses");

beforeEach(() => {
  resetDb();
});

const mockCourse = (): Course => ({
  id: "c-test-1",
  title: "Test Course",
  slug: "test-course",
  description: "A test course",
  summary: "Short summary",
  category: "Design",
  level: "Beginner",
  price: 0,
  rating: 4.5,
  students: 100,
  instructor: "Tester",
  instructorBio: "Bio",
  cover: "✦",
  lessons: [],
  reviews: [],
  quizzes: [],
  tags: ["test"],
  approved: true,
  createdAt: "2025-01-01",
});

describe("coursesApi.list", () => {
  it("returns only approved courses", async () => {
    db.courses[0].approved = false;
    const courses = await coursesApi.list();
    expect(courses.every((c) => c.approved)).toBe(true);
    expect(courses.find((c) => c.id === db.courses[0].id)).toBeUndefined();
  });

  it("returns copies (mutations do not affect the DB)", async () => {
    const courses = await coursesApi.list();
    courses[0].title = "Mutated";
    const again = await coursesApi.list();
    expect(again[0].title).not.toBe("Mutated");
  });
});

describe("coursesApi.listAll", () => {
  it("returns all courses regardless of approval status", async () => {
    db.courses[0].approved = false;
    const all = await coursesApi.listAll();
    expect(all.length).toBe(db.courses.length);
    expect(all.find((c) => !c.approved)).toBeTruthy();
  });
});

describe("coursesApi.getBySlug", () => {
  it("returns the matching approved course", async () => {
    const first = db.courses.find((c) => c.approved)!;
    const course = await coursesApi.getBySlug(first.slug);
    expect(course?.id).toBe(first.id);
  });

  it("returns null for an unknown slug", async () => {
    const course = await coursesApi.getBySlug("does-not-exist");
    expect(course).toBeNull();
  });

  it("returns null for an unapproved course slug", async () => {
    const c = db.courses[0];
    c.approved = false;
    const course = await coursesApi.getBySlug(c.slug);
    expect(course).toBeNull();
  });
});

describe("coursesApi.upsert", () => {
  it("inserts a new course when id does not exist", async () => {
    const before = db.courses.length;
    const c = mockCourse();
    await coursesApi.upsert(c);
    expect(db.courses.length).toBe(before + 1);
    expect(db.courses.find((x) => x.id === "c-test-1")).toBeTruthy();
  });

  it("updates an existing course when id matches", async () => {
    const c = mockCourse();
    await coursesApi.upsert(c);
    await coursesApi.upsert({ ...c, title: "Updated Title" });
    const found = db.courses.find((x) => x.id === c.id);
    expect(found?.title).toBe("Updated Title");
    expect(db.courses.filter((x) => x.id === c.id).length).toBe(1);
  });
});

describe("coursesApi.delete", () => {
  it("removes the course from db", async () => {
    const c = mockCourse();
    await coursesApi.upsert(c);
    await coursesApi.delete(c.id);
    expect(db.courses.find((x) => x.id === c.id)).toBeUndefined();
  });

  it("cascades — removes related enrollments", async () => {
    const c = mockCourse();
    await coursesApi.upsert(c);
    db.enrollments.push({ id: "e-1", userId: "u-demo", courseId: c.id, completedLessonIds: [], passedQuizIds: [], enrolledAt: "", timeSpentSeconds: 0 });
    await coursesApi.delete(c.id);
    expect(db.enrollments.find((e) => e.courseId === c.id)).toBeUndefined();
  });
});

describe("coursesApi.toggleApproval", () => {
  it("toggles approved from true to false", async () => {
    const c = db.courses.find((x) => x.approved)!;
    await coursesApi.toggleApproval(c.id);
    expect(db.courses.find((x) => x.id === c.id)?.approved).toBe(false);
  });

  it("toggles approved from false to true", async () => {
    db.courses[0].approved = false;
    await coursesApi.toggleApproval(db.courses[0].id);
    expect(db.courses[0].approved).toBe(true);
  });

  it("returns null for unknown id", async () => {
    const result = await coursesApi.toggleApproval("unknown-id");
    expect(result).toBeNull();
  });
});
