import { db } from "./db";
import { mockRequest } from "./client";
import type { ContentStatus, Course } from "../types";

export const coursesApi = {
  list: () => mockRequest(() => db.courses.filter((c) => c.status === "published").map((c) => ({ ...c }))),

  listAll: () => mockRequest(() => db.courses.map((c) => ({ ...c }))),

  getBySlug: (slug: string) =>
    mockRequest(() => {
      const c = db.courses.find((c) => c.slug === slug && c.status === "published");
      return c ? { ...c } : null;
    }),

  upsert: (course: Course) =>
    mockRequest(() => {
      const idx = db.courses.findIndex((c) => c.id === course.id);
      if (idx >= 0) db.courses[idx] = { ...course };
      else db.courses.push({ ...course });
      return { ...course };
    }),

  delete: (id: string) =>
    mockRequest(() => {
      db.courses = db.courses.filter((c) => c.id !== id);
      db.enrollments = db.enrollments.filter((e) => e.courseId !== id);
    }),

  setStatus: (id: string, status: ContentStatus) =>
    mockRequest(() => {
      const course = db.courses.find((c) => c.id === id);
      if (course) course.status = status;
      return course ? { ...course } : null;
    }),
};
