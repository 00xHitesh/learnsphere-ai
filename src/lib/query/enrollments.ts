import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enrollmentsApi } from "../api";
import { qk } from "./keys";

export function useMyEnrollments(userId: string | null | undefined) {
  return useQuery({
    queryKey: qk.enrollments.byUser(userId ?? ""),
    queryFn: () => enrollmentsApi.listByUser(userId!),
    enabled: !!userId,
  });
}

export function useEnrollment(userId: string | null | undefined, courseId: string) {
  return useQuery({
    queryKey: qk.enrollments.detail(userId ?? "", courseId),
    queryFn: () => enrollmentsApi.get(userId!, courseId),
    enabled: !!userId && !!courseId,
  });
}

export function useCourseProgress(
  userId: string | null | undefined,
  courseId: string,
  totalLessons: number,
) {
  const { data: enrollment } = useEnrollment(userId, courseId);
  if (!enrollment || totalLessons === 0) return 0;
  return Math.round((enrollment.completedLessonIds.length / totalLessons) * 100);
}

export function useEnroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, courseId }: { userId: string; courseId: string }) =>
      enrollmentsApi.enroll(userId, courseId),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: qk.enrollments.byUser(userId) });
    },
  });
}

export function useToggleLessonComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      courseId,
      lessonId,
    }: {
      userId: string;
      courseId: string;
      lessonId: string;
    }) => enrollmentsApi.toggleLessonComplete(userId, courseId, lessonId),
    onSuccess: (_, { userId, courseId }) => {
      qc.invalidateQueries({ queryKey: qk.enrollments.detail(userId, courseId) });
      qc.invalidateQueries({ queryKey: qk.enrollments.byUser(userId) });
      qc.invalidateQueries({ queryKey: qk.users.list() });
    },
  });
}

export function useRecordTimeSpent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      courseId,
      seconds,
    }: {
      userId: string;
      courseId: string;
      seconds: number;
    }) => enrollmentsApi.recordTimeSpent(userId, courseId, seconds),
    onSuccess: (_, { userId, courseId }) => {
      qc.invalidateQueries({ queryKey: qk.enrollments.detail(userId, courseId) });
      qc.invalidateQueries({ queryKey: qk.enrollments.byUser(userId) });
    },
  });
}

export function useMarkQuizPassed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      courseId,
      quizId,
    }: {
      userId: string;
      courseId: string;
      quizId: string;
    }) => enrollmentsApi.markQuizPassed(userId, courseId, quizId),
    onSuccess: (_, { userId, courseId }) => {
      qc.invalidateQueries({ queryKey: qk.enrollments.detail(userId, courseId) });
      qc.invalidateQueries({ queryKey: qk.enrollments.byUser(userId) });
    },
  });
}
