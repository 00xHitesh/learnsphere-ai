import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coursesApi } from "../api";
import { qk } from "./keys";
import type { ContentStatus, Course } from "../types";

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.courses.all() });
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
