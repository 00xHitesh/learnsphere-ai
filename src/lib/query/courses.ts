import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coursesApi } from "../api";
import { qk } from "./keys";
import type { ContentStatus, Course, Quiz } from "../types";

export function useCourses() {
  return useQuery({ queryKey: qk.courses.list(), queryFn: coursesApi.list });
}

export function useAdminCourses() {
  return useQuery({ queryKey: qk.courses.adminList(), queryFn: coursesApi.listAll });
}

export function useCourse(slug: string) {
  return useQuery({
    queryKey: qk.courses.detail(slug),
    queryFn: () => coursesApi.getBySlug(slug),
    enabled: !!slug,
  });
}

export function useUpsertCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (course: Course) => coursesApi.upsert(course),
    onSuccess: (saved) => {
      // Update admin list in-place so lessons/quizzes aren't overwritten by a server refetch
      qc.setQueryData<Course[]>(qk.courses.adminList(), (old = []) => {
        const idx = old.findIndex((c) => c.id === saved.id);
        if (idx >= 0) {
          const next = [...old];
          next[idx] = saved;
          return next;
        }
        return [...old, saved];
      });
      // Invalidate published list so status/price changes propagate
      qc.invalidateQueries({ queryKey: qk.courses.list() });
    },
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => coursesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.courses.all() });
    },
  });
}

export function useSetCourseStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContentStatus }) =>
      coursesApi.setStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.courses.all() });
    },
  });
}

export function useSaveCourseWithContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (course: Course) => {
      // 1. Upsert the course metadata
      const saved = await coursesApi.upsert(course);

      // 2. Fetch current server lessons to detect deletions
      const serverCourse = await coursesApi.getBySlug(course.slug);
      const serverLessonIds = new Set((serverCourse?.lessons ?? []).map((l) => l.id));
      const localLessonIds = new Set(course.lessons.map((l) => l.id));

      // Delete lessons removed locally
      const deletions = [...serverLessonIds].filter((id) => !localLessonIds.has(id));
      await Promise.all(deletions.map((id) => coursesApi.deleteLesson(saved.id, id)));

      // Upsert all local lessons
      const updatedLessons = await Promise.all(
        course.lessons.map((lesson, i) => coursesApi.upsertLesson(saved.id, lesson, i)),
      );

      // 3. Sync quiz
      let updatedQuiz: Quiz | undefined;
      if (course.quizzes.length > 0) {
        updatedQuiz = await coursesApi.upsertQuiz(saved.id, course.quizzes[0]);
      } else if (serverCourse?.quizzes.length) {
        await coursesApi.deleteQuiz(saved.id);
      }

      return { ...saved, lessons: updatedLessons, quizzes: updatedQuiz ? [updatedQuiz] : [] };
    },
    onSuccess: (saved) => {
      qc.setQueryData<Course[]>(qk.courses.adminList(), (old = []) => {
        const idx = old.findIndex((c) => c.id === saved.id);
        if (idx >= 0) {
          const next = [...old];
          next[idx] = saved;
          return next;
        }
        return [...old, saved];
      });
      qc.invalidateQueries({ queryKey: qk.courses.list() });
    },
  });
}
