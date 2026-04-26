import { db } from "./db";
import { mockRequest } from "./client";
import type { Enrollment, Transaction } from "../types";

export const transactionsApi = {
  listByUser: (userId: string) =>
    mockRequest(() =>
      db.transactions.filter((t) => t.userId === userId).map((t) => ({ ...t })),
    ),

  listAll: () => mockRequest(() => db.transactions.map((t) => ({ ...t }))),

  purchase: async (userId: string, courseId: string): Promise<Transaction> => {
    const course = db.courses.find((c) => c.id === courseId);
    if (!course) throw new Error("Course not found.");
    // simulate payment processing delay
    await new Promise((r) => setTimeout(r, 900));
    const tx: Transaction = {
      id: `t-${Date.now()}`,
      userId,
      courseId,
      amount: course.price,
      status: "success",
      date: new Date().toISOString(),
    };
    db.transactions.push(tx);
    const alreadyEnrolled = db.enrollments.some(
      (e) => e.userId === userId && e.courseId === courseId,
    );
    if (!alreadyEnrolled) {
      const enrollment: Enrollment = {
        id: `e-${Date.now() + 1}`,
        userId,
        courseId,
        completedLessonIds: [],
        passedQuizIds: [],
        enrolledAt: new Date().toISOString(),
      };
      db.enrollments.push(enrollment);
    }
    return { ...tx };
  },
};
