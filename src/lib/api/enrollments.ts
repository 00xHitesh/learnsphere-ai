import { apiFetch } from "./client";
import type { Enrollment } from "../types";

export const enrollmentsApi = {
  listByUser: (_userId: string): Promise<Enrollment[]> =>
    apiFetch<Enrollment[]>("/enrollments"),

  get: async (_userId: string, courseId: string): Promise<Enrollment | null> => {
    try {
      return await apiFetch<Enrollment>(`/enrollments/${courseId}`);
    } catch {
      return null;
    }
  },

  enroll: (_userId: string, courseId: string): Promise<Enrollment> =>
    apiFetch<Enrollment>("/enrollments", {
      method: "POST",
      body: JSON.stringify({ courseId }),
    }),

  toggleLessonComplete: async (
    _userId: string,
    courseId: string,
    lessonId: string,
  ): Promise<Enrollment | null> => {
    try {
      return await apiFetch<Enrollment>(
        `/enrollments/${courseId}/lessons/${lessonId}/toggle`,
        { method: "PATCH" },
      );
    } catch {
      return null;
    }
  },

  recordTimeSpent: async (
    _userId: string,
    courseId: string,
    seconds: number,
  ): Promise<Enrollment | null> => {
    try {
      return await apiFetch<Enrollment>(`/enrollments/${courseId}/time`, {
        method: "PATCH",
        body: JSON.stringify({ seconds }),
      });
    } catch {
      return null;
    }
  },

  markQuizPassed: async (
    _userId: string,
    courseId: string,
    quizId: string,
  ): Promise<Enrollment | null> => {
    try {
      return await apiFetch<Enrollment>(`/enrollments/${courseId}/quiz/${quizId}/pass`, {
        method: "PATCH",
      });
    } catch {
      return null;
    }
  },
};
