import { mockRequest } from "./client";
import { db } from "./db";
import type { LiveSession } from "../types";

export const liveSessionsApi = {
  list: () => mockRequest(() => db.liveSessions.map((s) => ({ ...s }))),

  upsert: (session: LiveSession) =>
    mockRequest(() => {
      const idx = db.liveSessions.findIndex((s) => s.id === session.id);
      if (idx >= 0) {
        db.liveSessions[idx] = { ...session };
      } else {
        db.liveSessions.push({ ...session });
      }
      return { ...session };
    }),

  delete: (id: string) =>
    mockRequest(() => {
      db.liveSessions = db.liveSessions.filter((s) => s.id !== id);
    }),
};
