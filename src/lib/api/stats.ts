import { db } from "./db";
import { mockRequest } from "./client";

export const statsApi = {
  overview: () =>
    mockRequest(() => ({
      totalUsers: db.users.length,
      totalCourses: db.courses.length,
      totalEnrollments: db.enrollments.length,
      revenue: db.transactions
        .filter((t) => t.status === "success")
        .reduce((sum, t) => sum + t.amount, 0),
      topCourses: [...db.courses]
        .sort((a, b) => b.students - a.students)
        .slice(0, 5)
        .map((c) => ({ ...c })),
    })),
};
