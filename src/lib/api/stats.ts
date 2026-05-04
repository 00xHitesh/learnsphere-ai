import { db } from "./db";
import { mockRequest } from "./client";

export type StatPeriod = "daily" | "weekly" | "monthly";

export interface PeriodPoint {
  label: string;
  value: number;
}

// Synthetic historical data — real backend would query time-series tables
const REVENUE_DATA: Record<StatPeriod, PeriodPoint[]> = {
  daily: [
    { label: "Apr 29", value: 420 },
    { label: "Apr 30", value: 680 },
    { label: "May 1", value: 510 },
    { label: "May 2", value: 940 },
    { label: "May 3", value: 730 },
    { label: "May 4", value: 1120 },
    { label: "May 5", value: 890 },
  ],
  weekly: [
    { label: "Apr 7", value: 2800 },
    { label: "Apr 14", value: 3450 },
    { label: "Apr 21", value: 4200 },
    { label: "Apr 28", value: 5100 },
  ],
  monthly: [
    { label: "Nov", value: 8200 },
    { label: "Dec", value: 11400 },
    { label: "Jan", value: 9700 },
    { label: "Feb", value: 13200 },
    { label: "Mar", value: 15800 },
    { label: "Apr", value: 18300 },
  ],
};

const ACTIVE_USERS_DATA: Record<StatPeriod, PeriodPoint[]> = {
  daily: [
    { label: "Apr 29", value: 142 },
    { label: "Apr 30", value: 198 },
    { label: "May 1", value: 175 },
    { label: "May 2", value: 231 },
    { label: "May 3", value: 208 },
    { label: "May 4", value: 267 },
    { label: "May 5", value: 243 },
  ],
  weekly: [
    { label: "Apr 7", value: 680 },
    { label: "Apr 14", value: 820 },
    { label: "Apr 21", value: 910 },
    { label: "Apr 28", value: 1040 },
  ],
  monthly: [
    { label: "Nov", value: 1900 },
    { label: "Dec", value: 2400 },
    { label: "Jan", value: 2100 },
    { label: "Feb", value: 2900 },
    { label: "Mar", value: 3600 },
    { label: "Apr", value: 4200 },
  ],
};

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

  revenueByPeriod: (period: StatPeriod) =>
    mockRequest(() => REVENUE_DATA[period]),

  activeUsersByPeriod: (period: StatPeriod) =>
    mockRequest(() => ACTIVE_USERS_DATA[period]),
};
