import { db } from "./db";
import { mockRequest } from "./client";
import type { ChatMessage } from "../types";

export const chatApi = {
  list: (userId: string) =>
    mockRequest(() => [...(db.chats[userId] ?? [])], 50),

  append: (userId: string, msg: ChatMessage) =>
    mockRequest(() => {
      if (!db.chats[userId]) db.chats[userId] = [];
      db.chats[userId].push({ ...msg });
      return { ...msg };
    }, 0),

  reset: (userId: string) =>
    mockRequest(() => {
      db.chats[userId] = [];
    }, 0),
};
