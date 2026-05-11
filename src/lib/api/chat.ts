import { apiFetch } from "./client";
import type { ChatMessage } from "../types";

interface ChatMessageResponse {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

function mapMessage(r: ChatMessageResponse): ChatMessage {
  return { id: r.id, role: r.role as ChatMessage["role"], content: r.content, date: r.createdAt };
}

export const chatApi = {
  list: async (_userId: string): Promise<ChatMessage[]> => {
    const res = await apiFetch<ChatMessageResponse[]>("/chat");
    return res.map(mapMessage);
  },

  append: async (_userId: string, msg: ChatMessage): Promise<ChatMessage> => {
    const res = await apiFetch<ChatMessageResponse>("/chat/messages", {
      method: "POST",
      body: JSON.stringify({ content: msg.content, role: msg.role }),
    });
    return mapMessage(res);
  },

  reset: async (_userId: string): Promise<void> => {
    await apiFetch<void>("/chat", { method: "DELETE" });
  },
};
