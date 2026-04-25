import { db } from "./db";
import { mockRequest } from "./client";
import type { Enrollment } from "../types";

export const enrollmentsApi = {
  listByUser: (userId: string) =>
    mockRequest(() => db.enrollments.filter((e) => e.userId === userId).map((e) => ({ ...e }))),

  get: (userId: string, courseId: string) =>
    mockRequest(() => {
      const e = db.enrollments.find((e) => e.userId === userId && e.courseId === courseId);
      return e ? { ...e } : null;
    }),

  enroll: (userId: string, courseId: string) =>
    mockRequest(() => {
      const existing = db.enrollments.find(
        (e) => e.userId === userId && e.courseId === courseId,
      );
      if (existing) return { ...existing };
      const enrollment: Enrollment = {
        id: `e-${Date.now()}`,
        userId,
        courseId,
        completedLessonIds: [],
        enrolledAt: new Date().toISOString(),
      };
      db.enrollments.push(enrollment);
      return { ...enrollment };
    }),

  toggleLessonComplete: (userId: string, courseId: string, lessonId: string) =>
    mockRequest(() => {
      const e = db.enrollments.find((e) => e.userId === userId && e.courseId === courseId);
      if (!e) return null;
      const has = e.completedLessonIds.includes(lessonId);
      e.completedLessonIds = has
        ? e.completedLessonIds.filter((id) => id !== lessonId)
        : [...e.completedLessonIds, lessonId];
      return { ...e };
    }),
};
