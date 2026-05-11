import { describe, it, expect, beforeEach, vi } from "vitest";
import { apiOk } from "@/test/helpers";
import type { ChatMessage } from "@/lib/types";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const { BASE_URL } = await import("../client");
const { chatApi } = await import("../chat");

const msgResp = { id: "m-1", role: "user", content: "Hello", createdAt: "2025-05-01T10:00:00Z" };

const msg = (id: string, content: string, role: "user" | "assistant" = "user"): ChatMessage => ({
  id, role, content, date: new Date().toISOString(),
});

beforeEach(() => fetchMock.mockReset());

describe("chatApi.list", () => {
  it("calls GET /chat and maps createdAt → date", async () => {
    fetchMock.mockResolvedValueOnce(apiOk([msgResp]));
    const result = await chatApi.list("u-demo");
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("Hello");
    expect(result[0].date).toBe("2025-05-01T10:00:00Z");
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/chat`,
      expect.any(Object),
    );
  });
});

describe("chatApi.append", () => {
  it("calls POST /chat/messages with content and role", async () => {
    fetchMock.mockResolvedValueOnce(apiOk(msgResp));
    const result = await chatApi.append("u-demo", msg("m-1", "Hello"));
    expect(result.content).toBe("Hello");
    expect(result.role).toBe("user");
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/chat/messages`,
      expect.objectContaining({ method: "POST", body: JSON.stringify({ content: "Hello", role: "user" }) }),
    );
  });

  it("maps response role for assistant messages", async () => {
    const assistantResp = { ...msgResp, id: "m-2", role: "assistant", content: "Hi there" };
    fetchMock.mockResolvedValueOnce(apiOk(assistantResp));
    const result = await chatApi.append("u-demo", msg("m-2", "Hi there", "assistant"));
    expect(result.role).toBe("assistant");
  });
});

describe("chatApi.reset", () => {
  it("calls DELETE /chat", async () => {
    fetchMock.mockResolvedValueOnce(apiOk(null));
    await chatApi.reset("u-demo");
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/chat`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
