/**
 * Floating AI study assistant widget (bottom-right corner). Only renders for
 * authenticated users. Replies are generated client-side by mockReply() using
 * keyword matching. Chat history is persisted per-user in db.chats via chatApi.
 * Replace mockReply() with a real API call to connect a live LLM.
 */
import { useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useCourses } from "@/lib/query/courses";
import { useAppendChat, useChatMessages, useResetChat } from "@/lib/query/chat";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/lib/types";

function mockReply(text: string, courseTitles: string[]): string {
  const t = text.toLowerCase();
  if (t.includes("recommend") || t.includes("suggest"))
    return `You might enjoy:\n\n• ${courseTitles.slice(0, 3).join("\n• ")}`;
  if (t.includes("price") || t.includes("cost"))
    return "Many courses are free; paid courses are $39–$129.";
  if (t.includes("certificate"))
    return "Certificates are issued automatically when you finish a course.";
  if (t.includes("hi") || t.includes("hello"))
    return "Hello — I'm Lumen's study assistant. What are you trying to learn?";
  return "Good question. Try the Courses page and filter by your interest — I can summarize any course you're curious about.";
}

export function Chatbot() {
  const { currentUser } = useAuth();
  const { data: courses = [] } = useCourses();
  const { data: messages = [] } = useChatMessages(currentUser?.id);
  const appendChat = useAppendChat(currentUser?.id);
  const resetChat = useResetChat(currentUser?.id);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  if (!currentUser) return null;

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      role: "user",
      content: text,
      date: new Date().toISOString(),
    };
    appendChat.mutate(userMsg);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      appendChat.mutate({
        id: `m-${Date.now() + 1}`,
        role: "assistant",
        content: mockReply(text, courses.map((c) => c.title)),
        date: new Date().toISOString(),
      });
      setThinking(false);
    }, 700);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-(--shadow-elegant) transition-transform hover:scale-105"
        >
          <MessageCircle className="h-4 w-4" /> Ask Lumen
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-112 w-88 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-(--shadow-elegant)">
          <div className="flex items-center justify-between border-b border-border bg-secondary px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Study assistant</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => resetChat.mutate()}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Reset
              </button>
              <button onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
            {messages.length === 0 && (
              <p className="text-muted-foreground">
                Hi {currentUser.name.split(" ")[0]}. Ask for a recommendation or study help.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] whitespace-pre-line rounded-lg px-3 py-2 ${m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
              >
                {m.content}
              </div>
            ))}
            {thinking && (
              <div className="inline-block rounded-lg bg-secondary px-3 py-2 text-muted-foreground">
                thinking…
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 border-t border-border bg-background p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a message…"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <Button size="icon" onClick={send} disabled={thinking || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
