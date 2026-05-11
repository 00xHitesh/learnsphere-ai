import { apiFetch } from "./client";
import type { ContentStatus, LiveSession } from "../types";

interface LiveSessionResponse {
  id: string;
  title: string;
  instructor: string;
  description: string;
  scheduledAt: string;
  durationMinutes: number;
  topic: string;
  joinUrl: string;
  courseId?: string;
  registeredCount: number;
  maxAttendees: number;
  listPrice?: number;
  salePrice?: number;
  status: string;
}

function mapSession(r: LiveSessionResponse): LiveSession {
  return {
    id: r.id,
    title: r.title,
    instructor: r.instructor,
    description: r.description,
    scheduledAt: r.scheduledAt,
    durationMinutes: r.durationMinutes,
    topic: r.topic,
    joinUrl: r.joinUrl,
    courseId: r.courseId || undefined,
    registeredCount: r.registeredCount,
    maxAttendees: r.maxAttendees,
    listPrice: r.listPrice || undefined,
    salePrice: r.salePrice || undefined,
    status: r.status as ContentStatus,
  };
}

export const liveSessionsApi = {
  list: async (): Promise<LiveSession[]> => {
    const res = await apiFetch<LiveSessionResponse[]>("/live-sessions");
    return res.map(mapSession);
  },

  listAll: async (): Promise<LiveSession[]> => {
    const res = await apiFetch<LiveSessionResponse[]>("/live-sessions/all");
    return res.map(mapSession);
  },

  upsert: async (session: LiveSession): Promise<LiveSession> => {
    const res = await apiFetch<LiveSessionResponse>("/live-sessions", {
      method: "PUT",
      body: JSON.stringify({
        id: session.id,
        title: session.title,
        instructor: session.instructor,
        description: session.description,
        scheduledAt: session.scheduledAt,
        durationMinutes: session.durationMinutes,
        topic: session.topic,
        joinUrl: session.joinUrl,
        courseId: session.courseId,
        registeredCount: session.registeredCount,
        maxAttendees: session.maxAttendees,
        listPrice: session.listPrice,
        salePrice: session.salePrice,
        status: session.status,
      }),
    });
    return mapSession(res);
  },

  delete: async (id: string): Promise<void> => {
    await apiFetch<void>(`/live-sessions/${id}`, { method: "DELETE" });
  },

  setStatus: async (id: string, status: ContentStatus): Promise<LiveSession | null> => {
    try {
      const res = await apiFetch<LiveSessionResponse>(`/live-sessions/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      return mapSession(res);
    } catch {
      return null;
    }
  },
};
