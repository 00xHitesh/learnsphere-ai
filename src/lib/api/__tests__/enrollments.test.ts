import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetDb } from "@/test/helpers";
import { db } from "../db";

vi.mock("../client", () => ({
  mockRequest: async <T>(fn: () => T) => fn(),
}));

const { enrollmentsApi } = await import("../enrollments");

beforeEach(() => {
  resetDb();
});

const USER_ID = "u-demo";
const COURSE_ID = () => db.courses[0].id;

describe("enrollmentsApi.listByUser", () => {
  it("returns empty array when user has no enrollments", async () => {
    const result = await enrollmentsApi.listByUser(USER_ID);
    expect(result).toEqual([]);
  });

  it("returns only the enrollments for the specified user", async () => {
    db.enrollments.push(
      { id: "e-1", userId: USER_ID, courseId: COURSE_ID(), completedLessonIds: [], passedQuizIds: [], enrolledAt: "" },
      { id: "e-2", userId: "u-other", courseId: COURSE_ID(), completedLessonIds: [], passedQuizIds: [], enrolledAt: "" },
    );
    const result = await enrollmentsApi.listByUser(USER_ID);
    expect(result.length).toBe(1);
    expect(result[0].userId).toBe(USER_ID);
  });
});

describe("enrollmentsApi.get", () => {
  it("returns the enrollment when found", async () => {
    db.enrollments.push({
      id: "e-1",
      userId: USER_ID,
      courseId: COURSE_ID(),
      completedLessonIds: [],
      passedQuizIds: [],
      enrolledAt: "",
    });
    const result = await enrollmentsApi.get(USER_ID, COURSE_ID());
    expect(result?.id).toBe("e-1");
  });

  it("returns null when not enrolled", async () => {
    const result = await enrollmentsApi.get(USER_ID, COURSE_ID());
    expect(result).toBeNull();
  });
});

describe("enrollmentsApi.enroll", () => {
  it("creates a new enrollment and returns it", async () => {
    const result = await enrollmentsApi.enroll(USER_ID, COURSE_ID());
    expect(result.userId).toBe(USER_ID);
    expect(result.courseId).toBe(COURSE_ID());
    expect(result.completedLessonIds).toEqual([]);
    expect(db.enrollments.length).toBe(1);
  });

  it("is idempotent — returns existing enrollment without creating a duplicate", async () => {
    await enrollmentsApi.enroll(USER_ID, COURSE_ID());
    await enrollmentsApi.enroll(USER_ID, COURSE_ID());
    expect(db.enrollments.length).toBe(1);
  });
});

describe("enrollmentsApi.toggleLessonComplete", () => {
  it("marks a lesson complete", async () => {
    await enrollmentsApi.enroll(USER_ID, COURSE_ID());
    const courseId = COURSE_ID();
    const lessonId = db.courses[0].lessons[0]?.id ?? "l-0";
    const result = await enrollmentsApi.toggleLessonComplete(USER_ID, courseId, lessonId);
    expect(result?.completedLessonIds).toContain(lessonId);
  });

  it("marks a lesson incomplete on second toggle", async () => {
    await enrollmentsApi.enroll(USER_ID, COURSE_ID());
    const courseId = COURSE_ID();
    const lessonId = db.courses[0].lessons[0]?.id ?? "l-0";
    await enrollmentsApi.toggleLessonComplete(USER_ID, courseId, lessonId);
    const result = await enrollmentsApi.toggleLessonComplete(USER_ID, courseId, lessonId);
    expect(result?.completedLessonIds).not.toContain(lessonId);
  });

  it("returns null when user is not enrolled", async () => {
    const result = await enrollmentsApi.toggleLessonComplete(USER_ID, COURSE_ID(), "l-0");
    expect(result).toBeNull();
  });
});

describe("enrollmentsApi.markQuizPassed", () => {
  it("adds the quiz id to passedQuizIds", async () => {
    await enrollmentsApi.enroll(USER_ID, COURSE_ID());
    const result = await enrollmentsApi.markQuizPassed(USER_ID, COURSE_ID(), "q-1");
    expect(result?.passedQuizIds).toContain("q-1");
  });

  it("is idempotent — does not add duplicate quiz ids", async () => {
    await enrollmentsApi.enroll(USER_ID, COURSE_ID());
    await enrollmentsApi.markQuizPassed(USER_ID, COURSE_ID(), "q-1");
    await enrollmentsApi.markQuizPassed(USER_ID, COURSE_ID(), "q-1");
    const e = db.enrollments.find((e) => e.userId === USER_ID);
    expect(e?.passedQuizIds.filter((id) => id === "q-1").length).toBe(1);
  });

  it("returns null when user is not enrolled", async () => {
    const result = await enrollmentsApi.markQuizPassed(USER_ID, COURSE_ID(), "q-1");
    expect(result).toBeNull();
  });
});
