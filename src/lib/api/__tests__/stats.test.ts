import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetDb } from "@/test/helpers";
import { db } from "../db";

vi.mock("../client", () => ({
  mockRequest: async <T>(fn: () => T) => fn(),
}));

const { statsApi } = await import("../stats");

beforeEach(() => {
  resetDb();
});

describe("statsApi.overview", () => {
  it("counts total users correctly", async () => {
    const stats = await statsApi.overview();
    expect(stats.totalUsers).toBe(db.users.length);
  });

  it("counts total courses correctly", async () => {
    const stats = await statsApi.overview();
    expect(stats.totalCourses).toBe(db.courses.length);
  });

  it("counts total enrollments correctly", async () => {
    db.enrollments.push(
      { id: "e-1", userId: "u-demo", courseId: db.courses[0].id, completedLessonIds: [], enrolledAt: "" },
      { id: "e-2", userId: "u-admin", courseId: db.courses[0].id, completedLessonIds: [], enrolledAt: "" },
    );
    const stats = await statsApi.overview();
    expect(stats.totalEnrollments).toBe(2);
  });

  it("sums revenue from successful transactions only", async () => {
    db.transactions.push(
      { id: "t-1", userId: "u-demo", courseId: db.courses[0].id, amount: 29, status: "success", date: "" },
      { id: "t-2", userId: "u-demo", courseId: db.courses[0].id, amount: 49, status: "success", date: "" },
      { id: "t-3", userId: "u-demo", courseId: db.courses[0].id, amount: 99, status: "failed", date: "" },
    );
    const stats = await statsApi.overview();
    expect(stats.revenue).toBe(78); // 29 + 49, not 99
  });

  it("returns 0 revenue when there are no transactions", async () => {
    const stats = await statsApi.overview();
    expect(stats.revenue).toBe(0);
  });

  it("returns top courses sorted by student count descending", async () => {
    const stats = await statsApi.overview();
    for (let i = 1; i < stats.topCourses.length; i++) {
      expect(stats.topCourses[i - 1].students).toBeGreaterThanOrEqual(
        stats.topCourses[i].students,
      );
    }
  });

  it("returns at most 5 top courses", async () => {
    const stats = await statsApi.overview();
    expect(stats.topCourses.length).toBeLessThanOrEqual(5);
  });

  it("updates counts dynamically as data changes", async () => {
    const before = await statsApi.overview();
    db.enrollments.push({
      id: "e-new",
      userId: "u-demo",
      courseId: db.courses[0].id,
      completedLessonIds: [],
      enrolledAt: "",
    });
    const after = await statsApi.overview();
    expect(after.totalEnrollments).toBe(before.totalEnrollments + 1);
  });
});
