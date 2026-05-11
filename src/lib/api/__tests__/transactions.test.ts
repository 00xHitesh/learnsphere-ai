import { describe, it, expect, beforeEach, vi } from "vitest";
import { apiOk, apiErr } from "@/test/helpers";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const { BASE_URL } = await import("../client");
const { transactionsApi } = await import("../transactions");

const txResp = {
  id: "t-1",
  userId: "u-demo",
  courseId: "c-1",
  amount: 29,
  status: "success",
  createdAt: "2025-05-01T10:00:00Z",
};

beforeEach(() => fetchMock.mockReset());

describe("transactionsApi.listByUser", () => {
  it("calls GET /transactions and maps createdAt → date", async () => {
    fetchMock.mockResolvedValueOnce(apiOk([txResp]));
    const result = await transactionsApi.listByUser("u-demo");
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2025-05-01T10:00:00Z");
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/transactions`,
      expect.any(Object),
    );
  });
});

describe("transactionsApi.listAll", () => {
  it("calls GET /transactions/all", async () => {
    fetchMock.mockResolvedValueOnce(apiOk([txResp]));
    await transactionsApi.listAll();
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/transactions/all`,
      expect.any(Object),
    );
  });
});

describe("transactionsApi.purchase", () => {
  it("calls POST /transactions with courseId and returns transaction", async () => {
    const enrollResp = { id: "e-1", userId: "u-demo", courseId: "c-1", completedLessonIds: [], passedQuizIds: [], enrolledAt: "", timeSpentSeconds: 0 };
    fetchMock.mockResolvedValueOnce(apiOk({ transaction: txResp, enrollment: enrollResp }));
    const result = await transactionsApi.purchase("u-demo", "c-1");
    expect(result.id).toBe("t-1");
    expect(result.amount).toBe(29);
    expect(result.status).toBe("success");
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/transactions`,
      expect.objectContaining({ method: "POST", body: JSON.stringify({ courseId: "c-1" }) }),
    );
  });

  it("throws on server error", async () => {
    fetchMock.mockResolvedValueOnce(apiErr("Course not found."));
    await expect(transactionsApi.purchase("u-demo", "c-ghost")).rejects.toThrow("Course not found.");
  });
});
