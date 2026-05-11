import { describe, it, expect, beforeEach, vi } from "vitest";
import { apiOk, apiErr } from "@/test/helpers";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const { enrollmentsApi } = await import("../enrollments");

const enrollmentResp = {
  id: "e-1",
  userId: "u-demo",
  courseId: "c-1",
  completedLessonIds: [],
  passedQuizIds: [],
  enrolledAt: "2025-01-01",
  timeSpentSeconds: 0,
};

beforeEach(() => fetchMock.mockReset());

describe("enrollmentsApi.listByUser", () => {
  it("calls GET /enrollments", async () => {
    fetchMock.mockResolvedValueOnce(apiOk([enrollmentResp]));
    const result = await enrollmentsApi.listByUser("u-demo");
    expect(result).toHaveLength(1);
    expect(result[0].courseId).toBe("c-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/enrollments",
      expect.any(Object),
    );
  });
});

describe("enrollmentsApi.get", () => {
  it("calls GET /enrollments/{courseId}", async () => {
    fetchMock.mockResolvedValueOnce(apiOk(enrollmentResp));
    const result = await enrollmentsApi.get("u-demo", "c-1");
    expect(result?.id).toBe("e-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/enrollments/c-1",
      expect.any(Object),
    );
  });

  it("returns null on error", async () => {
    fetchMock.mockResolvedValueOnce(apiErr("Not enrolled"));
    const result = await enrollmentsApi.get("u-demo", "c-ghost");
    expect(result).toBeNull();
  });
});

describe("enrollmentsApi.enroll", () => {
  it("calls POST /enrollments with courseId body", async () => {
    fetchMock.mockResolvedValueOnce(apiOk(enrollmentResp));
    const result = await enrollmentsApi.enroll("u-demo", "c-1");
    expect(result.courseId).toBe("c-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/enrollments",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ courseId: "c-1" }) }),
    );
  });
});

describe("enrollmentsApi.toggleLessonComplete", () => {
  it("calls PATCH /enrollments/{courseId}/lessons/{lessonId}/toggle", async () => {
    const updated = { ...enrollmentResp, completedLessonIds: ["l-1"] };
    fetchMock.mockResolvedValueOnce(apiOk(updated));
    const result = await enrollmentsApi.toggleLessonComplete("u-demo", "c-1", "l-1");
    expect(result?.completedLessonIds).toContain("l-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/enrollments/c-1/lessons/l-1/toggle",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("returns null on error", async () => {
    fetchMock.mockResolvedValueOnce(apiErr("Not enrolled"));
    expect(await enrollmentsApi.toggleLessonComplete("u-demo", "c-1", "l-1")).toBeNull();
  });
});

describe("enrollmentsApi.recordTimeSpent", () => {
  it("calls PATCH /enrollments/{courseId}/time with seconds", async () => {
    const updated = { ...enrollmentResp, timeSpentSeconds: 120 };
    fetchMock.mockResolvedValueOnce(apiOk(updated));
    const result = await enrollmentsApi.recordTimeSpent("u-demo", "c-1", 120);
    expect(result?.timeSpentSeconds).toBe(120);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/enrollments/c-1/time",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ seconds: 120 }) }),
    );
  });

  it("returns null on error", async () => {
    fetchMock.mockResolvedValueOnce(apiErr("Not enrolled"));
    expect(await enrollmentsApi.recordTimeSpent("u-demo", "c-1", 60)).toBeNull();
  });
});

describe("enrollmentsApi.markQuizPassed", () => {
  it("calls PATCH /enrollments/{courseId}/quiz/{quizId}/pass", async () => {
    const updated = { ...enrollmentResp, passedQuizIds: ["q-1"] };
    fetchMock.mockResolvedValueOnce(apiOk(updated));
    const result = await enrollmentsApi.markQuizPassed("u-demo", "c-1", "q-1");
    expect(result?.passedQuizIds).toContain("q-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/enrollments/c-1/quiz/q-1/pass",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("returns null on error", async () => {
    fetchMock.mockResolvedValueOnce(apiErr("Not enrolled"));
    expect(await enrollmentsApi.markQuizPassed("u-demo", "c-1", "q-1")).toBeNull();
  });
});
