import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-store";
import { useAdminStats, useRevenueByPeriod, useActiveUsersByPeriod } from "@/lib/query/stats";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { StatPeriod } from "@/lib/api/stats";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser || currentUser.role !== "admin")
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-serif text-2xl">Admin access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in through the admin portal to continue.
        </p>
        <Button asChild className="mt-6">
          <Link to="/admin-login">Go to admin login</Link>
        </Button>
      </div>
    );

  const isRoot = location.pathname === "/admin" || location.pathname === "/admin/";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-4xl text-foreground">Admin</h1>
      <nav className="mt-6 flex flex-wrap gap-1 border-b border-border">
        <Link
          to="/admin"
          activeOptions={{ exact: true }}
          activeProps={{ className: "border-foreground text-foreground" }}
          inactiveProps={{ className: "border-transparent text-muted-foreground" }}
          className="border-b-2 px-4 py-2 text-sm hover:text-foreground"
        >
          Overview
        </Link>
        <Link
          to="/admin/courses"
          activeProps={{ className: "border-foreground text-foreground" }}
          inactiveProps={{ className: "border-transparent text-muted-foreground" }}
          className="border-b-2 px-4 py-2 text-sm hover:text-foreground"
        >
          Courses
        </Link>
        <Link
          to="/admin/users"
          activeProps={{ className: "border-foreground text-foreground" }}
          inactiveProps={{ className: "border-transparent text-muted-foreground" }}
          className="border-b-2 px-4 py-2 text-sm hover:text-foreground"
        >
          Users
        </Link>
        <Link
          to="/admin/transactions"
          activeProps={{ className: "border-foreground text-foreground" }}
          inactiveProps={{ className: "border-transparent text-muted-foreground" }}
          className="border-b-2 px-4 py-2 text-sm hover:text-foreground"
        >
          Transactions
        </Link>
        <Link
          to="/admin/live-sessions"
          activeProps={{ className: "border-foreground text-foreground" }}
          inactiveProps={{ className: "border-transparent text-muted-foreground" }}
          className="border-b-2 px-4 py-2 text-sm hover:text-foreground"
        >
          Live Sessions
        </Link>
        <Link
          to="/admin/features"
          activeProps={{ className: "border-foreground text-foreground" }}
          inactiveProps={{ className: "border-transparent text-muted-foreground" }}
          className="border-b-2 px-4 py-2 text-sm hover:text-foreground"
        >
          Features
        </Link>
      </nav>
      <div className="mt-8">{isRoot ? <Overview /> : <Outlet />}</div>
    </div>
  );
}

const PERIOD_LABELS: Record<StatPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

function PeriodTabs({
  value,
  onChange,
}: {
  value: StatPeriod;
  onChange: (p: StatPeriod) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg bg-secondary p-1">
      {(["daily", "weekly", "monthly"] as StatPeriod[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
            value === p
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  );
}

function Overview() {
  const { data: stats } = useAdminStats();
  const [revenuePeriod, setRevenuePeriod] = useState<StatPeriod>("weekly");
  const [usersPeriod, setUsersPeriod] = useState<StatPeriod>("weekly");

  const { data: revenueData = [] } = useRevenueByPeriod(revenuePeriod);
  const { data: activeUsersData = [] } = useActiveUsersByPeriod(usersPeriod);

  const statItems = [
    { label: "Total users", value: stats?.totalUsers ?? "—" },
    { label: "Total courses", value: stats?.totalCourses ?? "—" },
    { label: "Enrollments", value: stats?.totalEnrollments ?? "—" },
    { label: "Revenue", value: stats ? `$${stats.revenue.toLocaleString()}` : "—" },
  ];

  const tooltipStyle = {
    fontSize: 12,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--card)",
  };

  return (
    <div className="space-y-10">
      {/* ── Stat tiles ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="mt-1 font-serif text-3xl text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Revenue chart ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-xl text-foreground">Revenue</h2>
          <PeriodTabs value={revenuePeriod} onChange={setRevenuePeriod} />
        </div>
        <ResponsiveContainer width="100%" height={220} className="mt-6">
          <BarChart data={revenueData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
            />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              fill="oklch(0.52 0.26 290)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Active users chart ─────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-xl text-foreground">Active users</h2>
          <PeriodTabs value={usersPeriod} onChange={setUsersPeriod} />
        </div>
        <ResponsiveContainer width="100%" height={220} className="mt-6">
          <LineChart data={activeUsersData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [v.toLocaleString(), "Active users"]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="oklch(0.60 0.28 340)"
              strokeWidth={2}
              dot={{ r: 4, fill: "oklch(0.60 0.28 340)", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Top courses table ──────────────────────────────────── */}
      <div>
        <h2 className="font-serif text-xl text-foreground">Top courses</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Course</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Students</th>
                <th className="px-4 py-2">Rating</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.topCourses ?? []).map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-2">{c.title}</td>
                  <td className="px-4 py-2 text-muted-foreground">{c.category}</td>
                  <td className="px-4 py-2">{c.students.toLocaleString()}</td>
                  <td className="px-4 py-2">{c.rating.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
