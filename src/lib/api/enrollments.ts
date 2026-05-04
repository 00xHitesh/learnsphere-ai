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
        passedQuizIds: [],
        enrolledAt: new Date().toISOString(),
        timeSpentSeconds: 0,
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
      const user = db.users.find((u) => u.id === userId);
      if (user) user.points += has ? -10 : 10;
      return { ...e };
    }),

  recordTimeSpent: (userId: string, courseId: string, seconds: number) =>
    mockRequest(() => {
      const e = db.enrollments.find((e) => e.userId === userId && e.courseId === courseId);
      if (!e) return null;
      e.timeSpentSeconds += seconds;
      return { ...e };
    }),

  markQuizPassed: (userId: string, courseId: string, quizId: string) =>
    mockRequest(() => {
      const e = db.enrollments.find((e) => e.userId === userId && e.courseId === courseId);
      if (!e) return null;
      if (!e.passedQuizIds.includes(quizId)) {
        e.passedQuizIds = [...e.passedQuizIds, quizId];
      }
      return { ...e };
    }),
};
