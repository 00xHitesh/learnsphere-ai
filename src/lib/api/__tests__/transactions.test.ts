import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetDb } from "@/test/helpers";
import { db } from "../db";

// Remove artificial delays entirely for all tests in this file
vi.mock("../client", () => ({
  mockRequest: async <T>(fn: () => T) => fn(),
}));

// transactions.purchase has its own hard-coded setTimeout(900ms); stub it away
vi.stubGlobal("setTimeout", (fn: () => void) => { fn(); return 0; });

const { transactionsApi } = await import("../transactions");

const USER_ID = "u-demo";

beforeEach(() => {
  resetDb();
});

describe("transactionsApi.listByUser", () => {
  it("returns empty array with no transactions", async () => {
    expect(await transactionsApi.listByUser(USER_ID)).toEqual([]);
  });

  it("returns only transactions for the given user", async () => {
    const courseId = db.courses[0].id;
    db.transactions.push(
      { id: "t-1", userId: USER_ID, courseId, amount: 29, status: "success", date: "" },
      { id: "t-2", userId: "u-other", courseId, amount: 29, status: "success", date: "" },
    );
    const result = await transactionsApi.listByUser(USER_ID);
    expect(result.length).toBe(1);
    expect(result[0].userId).toBe(USER_ID);
  });
});

describe("transactionsApi.listAll", () => {
  it("returns all transactions across users", async () => {
    const courseId = db.courses[0].id;
    db.transactions.push(
      { id: "t-1", userId: USER_ID, courseId, amount: 29, status: "success", date: "" },
      { id: "t-2", userId: "u-other", courseId, amount: 19, status: "success", date: "" },
    );
    const result = await transactionsApi.listAll();
    expect(result.length).toBe(2);
  });
});

describe("transactionsApi.purchase", () => {
  it("creates a transaction record for a valid course", async () => {
    const course = db.courses.find((c) => c.price > 0) ?? db.courses[0];
    await transactionsApi.purchase(USER_ID, course.id);
    expect(db.transactions.length).toBe(1);
    expect(db.transactions[0].userId).toBe(USER_ID);
    expect(db.transactions[0].courseId).toBe(course.id);
    expect(db.transactions[0].status).toBe("success");
  });

  it("auto-enrolls the user after purchase", async () => {
    const course = db.courses[0];
    await transactionsApi.purchase(USER_ID, course.id);
    const enrollment = db.enrollments.find(
      (e) => e.userId === USER_ID && e.courseId === course.id,
    );
    expect(enrollment).toBeTruthy();
  });

  it("does not double-enroll if already enrolled", async () => {
    const course = db.courses[0];
    db.enrollments.push({
      id: "e-existing",
      userId: USER_ID,
      courseId: course.id,
      completedLessonIds: [],
      enrolledAt: "",
    });
    await transactionsApi.purchase(USER_ID, course.id);
    const userEnrollments = db.enrollments.filter(
      (e) => e.userId === USER_ID && e.courseId === course.id,
    );
    expect(userEnrollments.length).toBe(1);
  });

  it("throws when course is not found", async () => {
    await expect(transactionsApi.purchase(USER_ID, "nonexistent-course")).rejects.toThrow(
      "Course not found.",
    );
  });

  it("records the correct price from the course", async () => {
    const course = db.courses.find((c) => c.price > 0);
    if (!course) return; // skip if no paid courses in seed
    await transactionsApi.purchase(USER_ID, course.id);
    expect(db.transactions[0].amount).toBe(course.price);
  });
});
