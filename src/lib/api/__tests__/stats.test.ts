import { describe, it, expect, beforeEach, vi } from "vitest";
import { apiOk } from "@/test/helpers";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const { statsApi } = await import("../stats");

const courseResp = {
  id: "c-1", title: "React", slug: "react", description: "desc", summary: "s",
  category: "Programming", level: "Beginner", listPrice: 49, rating: 4.8,
  studentCount: 500, instructor: "Jane", instructorBio: "bio", cover: "⚛",
  lessons: [], quiz: null, reviews: [], tags: [], status: "published", createdAt: "2025-01-01",
};

const overviewResp = {
  totalUsers: 150,
  totalCourses: 10,
  totalEnrollments: 300,
  revenue: 4500,
  topCourses: [courseResp],
};

const periodPoints = [
  { label: "Apr 29", value: 420 },
  { label: "Apr 30", value: 680 },
];

beforeEach(() => fetchMock.mockReset());

describe("statsApi.overview", () => {
  it("returns counts and revenue", async () => {
    fetchMock.mockResolvedValueOnce(apiOk(overviewResp));
    const stats = await statsApi.overview();
    expect(stats.totalUsers).toBe(150);
    expect(stats.totalCourses).toBe(10);
    expect(stats.totalEnrollments).toBe(300);
    expect(stats.revenue).toBe(4500);
  });

  it("maps topCourses studentCount → students", async () => {
    fetchMock.mockResolvedValueOnce(apiOk(overviewResp));
    const stats = await statsApi.overview();
    expect(stats.topCourses[0].students).toBe(500);
  });

  it("calls GET /stats/overview", async () => {
    fetchMock.mockResolvedValueOnce(apiOk(overviewResp));
    await statsApi.overview();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/stats/overview",
      expect.any(Object),
    );
  });
});

describe("statsApi.revenueByPeriod", () => {
  it("calls GET /stats/revenue with period query param", async () => {
    fetchMock.mockResolvedValueOnce(apiOk(periodPoints));
    const result = await statsApi.revenueByPeriod("daily");
    expect(result).toEqual(periodPoints);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/stats/revenue?period=daily",
      expect.any(Object),
    );
  });

  it("each point has a label and numeric value", async () => {
    fetchMock.mockResolvedValueOnce(apiOk(periodPoints));
    const result = await statsApi.revenueByPeriod("weekly");
    for (const point of result) {
      expect(typeof point.label).toBe("string");
      expect(typeof point.value).toBe("number");
    }
  });
});

describe("statsApi.activeUsersByPeriod", () => {
  it("calls GET /stats/active-users with period query param", async () => {
    fetchMock.mockResolvedValueOnce(apiOk(periodPoints));
    await statsApi.activeUsersByPeriod("monthly");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/stats/active-users?period=monthly",
      expect.any(Object),
    );
  });
});
