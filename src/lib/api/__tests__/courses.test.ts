import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetDb } from "@/test/helpers";
import { db } from "../db";
import type { ContentStatus, Course } from "@/lib/types";

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
  listPrice: 0,
  rating: 4.5,
  students: 100,
  instructor: "Tester",
  instructorBio: "Bio",
  cover: "✦",
  lessons: [],
  reviews: [],
  quizzes: [],
  tags: ["test"],
  status: "published" as ContentStatus,
  createdAt: "2025-01-01",
});

describe("coursesApi.list", () => {
  it("returns only published courses", async () => {
    db.courses[0].status = "draft";
    const courses = await coursesApi.list();
    expect(courses.every((c) => c.status === "published")).toBe(true);
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
  it("returns all courses regardless of status", async () => {
    db.courses[0].status = "draft";
    const all = await coursesApi.listAll();
    expect(all.length).toBe(db.courses.length);
    expect(all.find((c) => c.status !== "published")).toBeTruthy();
  });
});

describe("coursesApi.getBySlug", () => {
  it("returns the matching published course", async () => {
    const first = db.courses.find((c) => c.status === "published")!;
    const course = await coursesApi.getBySlug(first.slug);
    expect(course?.id).toBe(first.id);
  });

  it("returns null for an unknown slug", async () => {
    const course = await coursesApi.getBySlug("does-not-exist");
    expect(course).toBeNull();
  });

  it("returns null for a non-published course slug", async () => {
    const c = db.courses[0];
    c.status = "draft";
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

describe("coursesApi.setStatus", () => {
  it("sets status to draft", async () => {
    const c = db.courses.find((x) => x.status === "published")!;
    await coursesApi.setStatus(c.id, "draft");
    expect(db.courses.find((x) => x.id === c.id)?.status).toBe("draft");
  });

  it("sets status to in_review", async () => {
    await coursesApi.setStatus(db.courses[0].id, "in_review");
    expect(db.courses[0].status).toBe("in_review");
  });

  it("sets status to published", async () => {
    db.courses[0].status = "draft";
    await coursesApi.setStatus(db.courses[0].id, "published");
    expect(db.courses[0].status).toBe("published");
  });

  it("sets status to archived", async () => {
    await coursesApi.setStatus(db.courses[0].id, "archived");
    expect(db.courses[0].status).toBe("archived");
  });

  it("returns null for unknown id", async () => {
    const result = await coursesApi.setStatus("unknown-id", "published");
    expect(result).toBeNull();
  });
});
