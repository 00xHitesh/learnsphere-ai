import { describe, it, expect, beforeEach, vi } from "vitest";
import { apiOk, apiErr } from "@/test/helpers";
import type { ContentStatus } from "@/lib/types";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const { liveSessionsApi } = await import("../liveSessions");

const sessionResp = {
  id: "ls-1",
  title: "React Deep Dive",
  instructor: "Jane",
  description: "Advanced React patterns",
  scheduledAt: "2026-06-01T10:00:00Z",
  durationMinutes: 90,
  topic: "Programming",
  joinUrl: "https://meet.example.com/ls-1",
  courseId: "c-1",
  registeredCount: 10,
  maxAttendees: 50,
  listPrice: 29,
  salePrice: 19,
  status: "published",
};

beforeEach(() => fetchMock.mockReset());

describe("liveSessionsApi.list", () => {
  it("calls GET /live-sessions and returns mapped sessions", async () => {
    fetchMock.mockResolvedValueOnce(apiOk([sessionResp]));
    const result = await liveSessionsApi.list();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("React Deep Dive");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/live-sessions",
      expect.any(Object),
    );
  });
});

describe("liveSessionsApi.listAll", () => {
  it("calls GET /live-sessions/all", async () => {
    fetchMock.mockResolvedValueOnce(apiOk([sessionResp]));
    await liveSessionsApi.listAll();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/live-sessions/all",
      expect.any(Object),
    );
  });
});

describe("liveSessionsApi.upsert", () => {
  it("calls PUT /live-sessions and returns mapped session", async () => {
    fetchMock.mockResolvedValueOnce(apiOk(sessionResp));
    const session = {
      id: "ls-1", title: "React Deep Dive", instructor: "Jane", description: "Advanced",
      scheduledAt: "2026-06-01T10:00:00Z", durationMinutes: 90, topic: "Programming",
      joinUrl: "https://meet.example.com/ls-1", registeredCount: 0, maxAttendees: 50,
      status: "published" as ContentStatus,
    };
    const result = await liveSessionsApi.upsert(session);
    expect(result.title).toBe("React Deep Dive");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/live-sessions",
      expect.objectContaining({ method: "PUT" }),
    );
  });
});

describe("liveSessionsApi.setStatus", () => {
  it("calls PATCH /live-sessions/{id}/status with status body", async () => {
    fetchMock.mockResolvedValueOnce(apiOk({ ...sessionResp, status: "draft" }));
    const result = await liveSessionsApi.setStatus("ls-1", "draft");
    expect(result?.status).toBe("draft");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/live-sessions/ls-1/status",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ status: "draft" }) }),
    );
  });

  it("returns null on error", async () => {
    fetchMock.mockResolvedValueOnce(apiErr("Not found"));
    expect(await liveSessionsApi.setStatus("ghost", "published")).toBeNull();
  });
});

describe("liveSessionsApi.delete", () => {
  it("calls DELETE /live-sessions/{id}", async () => {
    fetchMock.mockResolvedValueOnce(apiOk(null));
    await liveSessionsApi.delete("ls-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/live-sessions/ls-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
