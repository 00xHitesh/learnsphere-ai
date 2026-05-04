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
      { id: "e-1", userId: "u-demo", courseId: db.courses[0].id, completedLessonIds: [], passedQuizIds: [], enrolledAt: "" },
      { id: "e-2", userId: "u-admin", courseId: db.courses[0].id, completedLessonIds: [], passedQuizIds: [], enrolledAt: "" },
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
      passedQuizIds: [],
      enrolledAt: "",
    });
    const after = await statsApi.overview();
    expect(after.totalEnrollments).toBe(before.totalEnrollments + 1);
  });
});

describe("statsApi.revenueByPeriod", () => {
  it("returns 7 data points for daily", async () => {
    const result = await statsApi.revenueByPeriod("daily");
    expect(result.length).toBe(7);
  });

  it("returns 4 data points for weekly", async () => {
    const result = await statsApi.revenueByPeriod("weekly");
    expect(result.length).toBe(4);
  });

  it("returns 6 data points for monthly", async () => {
    const result = await statsApi.revenueByPeriod("monthly");
    expect(result.length).toBe(6);
  });

  it("each point has a label and a positive value", async () => {
    const result = await statsApi.revenueByPeriod("weekly");
    for (const point of result) {
      expect(typeof point.label).toBe("string");
      expect(point.value).toBeGreaterThan(0);
    }
  });
});

describe("statsApi.activeUsersByPeriod", () => {
  it("returns 7 data points for daily", async () => {
    const result = await statsApi.activeUsersByPeriod("daily");
    expect(result.length).toBe(7);
  });

  it("returns 4 data points for weekly", async () => {
    const result = await statsApi.activeUsersByPeriod("weekly");
    expect(result.length).toBe(4);
  });

  it("returns 6 data points for monthly", async () => {
    const result = await statsApi.activeUsersByPeriod("monthly");
    expect(result.length).toBe(6);
  });

  it("each point has a label and a positive value", async () => {
    const result = await statsApi.activeUsersByPeriod("monthly");
    for (const point of result) {
      expect(typeof point.label).toBe("string");
      expect(point.value).toBeGreaterThan(0);
    }
  });
});
