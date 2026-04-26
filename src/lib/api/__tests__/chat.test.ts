import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetDb } from "@/test/helpers";
import { db } from "../db";
import type { ChatMessage } from "@/lib/types";

vi.mock("../client", () => ({
  mockRequest: async <T>(fn: () => T) => fn(),
}));

const { chatApi } = await import("../chat");

const USER_ID = "u-demo";

const msg = (id: string, content: string, role: "user" | "assistant" = "user"): ChatMessage => ({
  id,
  role,
  content,
  date: new Date().toISOString(),
});

beforeEach(() => {
  resetDb();
});

describe("chatApi.list", () => {
  it("returns empty array when no chat history exists", async () => {
    const result = await chatApi.list(USER_ID);
    expect(result).toEqual([]);
  });

  it("returns messages for the given user", async () => {
    db.chats[USER_ID] = [msg("m-1", "Hello")];
    const result = await chatApi.list(USER_ID);
    expect(result.length).toBe(1);
    expect(result[0].content).toBe("Hello");
  });

  it("does not return messages for other users", async () => {
    db.chats["u-other"] = [msg("m-1", "Other's message")];
    const result = await chatApi.list(USER_ID);
    expect(result).toEqual([]);
  });

  it("returns a copy — mutations do not affect db", async () => {
    db.chats[USER_ID] = [msg("m-1", "Original")];
    const result = await chatApi.list(USER_ID);
    result[0].content = "Mutated";
    const again = await chatApi.list(USER_ID);
    expect(again[0].content).toBe("Original");
  });
});

describe("chatApi.append", () => {
  it("appends a message to a new chat history", async () => {
    await chatApi.append(USER_ID, msg("m-1", "First message"));
    expect(db.chats[USER_ID].length).toBe(1);
    expect(db.chats[USER_ID][0].content).toBe("First message");
  });

  it("appends to an existing chat history", async () => {
    db.chats[USER_ID] = [msg("m-1", "First")];
    await chatApi.append(USER_ID, msg("m-2", "Second"));
    expect(db.chats[USER_ID].length).toBe(2);
    expect(db.chats[USER_ID][1].content).toBe("Second");
  });

  it("returns the appended message", async () => {
    const m = msg("m-1", "Returned");
    const result = await chatApi.append(USER_ID, m);
    expect(result.id).toBe("m-1");
    expect(result.content).toBe("Returned");
  });

  it("preserves message role and date", async () => {
    const m = msg("m-1", "AI reply", "assistant");
    await chatApi.append(USER_ID, m);
    expect(db.chats[USER_ID][0].role).toBe("assistant");
  });
});

describe("chatApi.reset", () => {
  it("clears all messages for the user", async () => {
    db.chats[USER_ID] = [msg("m-1", "A"), msg("m-2", "B")];
    await chatApi.reset(USER_ID);
    expect(db.chats[USER_ID]).toEqual([]);
  });

  it("does not affect other users' chat histories", async () => {
    db.chats[USER_ID] = [msg("m-1", "Mine")];
    db.chats["u-other"] = [msg("m-2", "Other's")];
    await chatApi.reset(USER_ID);
    expect(db.chats["u-other"].length).toBe(1);
  });

  it("is safe to call when no chat history exists", async () => {
    await expect(chatApi.reset("ghost-user")).resolves.toBeUndefined();
    expect(db.chats["ghost-user"]).toEqual([]);
  });
});
