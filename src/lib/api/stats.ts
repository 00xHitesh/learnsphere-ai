import { apiFetch } from "./client";
import { mapCourse } from "./courses";
import type { Course } from "../types";

export type StatPeriod = "daily" | "weekly" | "monthly";

export interface PeriodPoint {
  label: string;
  value: number;
}

interface OverviewResponse {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  revenue: number;
  topCourses: Parameters<typeof mapCourse>[0][];
}

export const statsApi = {
  overview: async (): Promise<{
    totalUsers: number;
    totalCourses: number;
    totalEnrollments: number;
    revenue: number;
    topCourses: Course[];
  }> => {
    const res = await apiFetch<OverviewResponse>("/stats/overview");
    return {
      totalUsers: res.totalUsers,
      totalCourses: res.totalCourses,
      totalEnrollments: res.totalEnrollments,
      revenue: res.revenue,
      topCourses: (res.topCourses ?? []).map(mapCourse),
    };
  },

  revenueByPeriod: (period: StatPeriod): Promise<PeriodPoint[]> =>
    apiFetch<PeriodPoint[]>(`/stats/revenue?period=${period}`),

  activeUsersByPeriod: (period: StatPeriod): Promise<PeriodPoint[]> =>
    apiFetch<PeriodPoint[]>(`/stats/active-users?period=${period}`),
};
