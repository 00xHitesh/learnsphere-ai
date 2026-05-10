import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetDb } from "@/test/helpers";
import { db } from "../db";
import type { ContentStatus } from "@/lib/types";

vi.mock("../client", () => ({
  mockRequest: async <T>(fn: () => T) => fn(),
}));

const { liveSessionsApi } = await import("../liveSessions");

beforeEach(() => {
  resetDb();
});

describe("liveSessionsApi.list", () => {
  it("returns only published sessions", async () => {
    db.liveSessions[0].status = "draft";
    const result = await liveSessionsApi.list();
    expect(result.every((s) => s.status === "published")).toBe(true);
    expect(result.find((s) => s.id === db.liveSessions[0].id)).toBeUndefined();
  });

  it("returns copies — mutations do not affect db", async () => {
    const result = await liveSessionsApi.list();
    result[0].title = "Mutated";
    const again = await liveSessionsApi.list();
    expect(again[0].title).not.toBe("Mutated");
  });
});

describe("liveSessionsApi.listAll", () => {
  it("returns all sessions regardless of status", async () => {
    db.liveSessions[0].status = "draft";
    const result = await liveSessionsApi.listAll();
    expect(result.length).toBe(db.liveSessions.length);
    expect(result.find((s) => s.status !== "published")).toBeTruthy();
  });
});

describe("liveSessionsApi.upsert", () => {
  it("creates a new session when id does not exist", async () => {
    const before = db.liveSessions.length;
    await liveSessionsApi.upsert({
      id: "ls-new",
      title: "Test Session",
      instructor: "Tester",
      description: "desc",
      scheduledAt: "2026-06-01T10:00:00.000Z",
      durationMinutes: 60,
      topic: "Programming",
      joinUrl: "https://meet.example.com/test",
      registeredCount: 0,
      maxAttendees: 50,
      status: "published" as ContentStatus,
    });
    expect(db.liveSessions.length).toBe(before + 1);
  });

  it("updates an existing session when id matches", async () => {
    const id = db.liveSessions[0].id;
    const before = db.liveSessions.length;
    await liveSessionsApi.upsert({ ...db.liveSessions[0], title: "Updated Title" });
    expect(db.liveSessions.length).toBe(before);
    expect(db.liveSessions.find((s) => s.id === id)?.title).toBe("Updated Title");
  });
});

describe("liveSessionsApi.setStatus", () => {
  it("sets status to draft", async () => {
    await liveSessionsApi.setStatus(db.liveSessions[0].id, "draft");
    expect(db.liveSessions[0].status).toBe("draft");
  });

  it("sets status to archived", async () => {
    await liveSessionsApi.setStatus(db.liveSessions[0].id, "archived");
    expect(db.liveSessions[0].status).toBe("archived");
  });

  it("returns null for unknown id", async () => {
    const result = await liveSessionsApi.setStatus("ghost", "published");
    expect(result).toBeNull();
  });
});

describe("liveSessionsApi.delete", () => {
  it("removes the session from db", async () => {
    const id = db.liveSessions[0].id;
    await liveSessionsApi.delete(id);
    expect(db.liveSessions.find((s) => s.id === id)).toBeUndefined();
  });

  it("is a no-op for a non-existent id", async () => {
    const before = db.liveSessions.length;
    await liveSessionsApi.delete("ghost");
    expect(db.liveSessions.length).toBe(before);
  });
});
