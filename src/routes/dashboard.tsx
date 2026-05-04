import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-store";
import { useCourses } from "@/lib/query/courses";
import { useMyEnrollments } from "@/lib/query/enrollments";
import { useMyTransactions } from "@/lib/query/transactions";
import { CertificateButton } from "@/components/CertificateButton";
import { Button } from "@/components/ui/button";
import { Bot, CheckCircle2, Zap } from "lucide-react";
import { CourseIcon } from "@/components/CourseIcon";
import type { Course, Enrollment } from "@/lib/types";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

const POINTS_PER_LESSON = 10;

function getProgress(enrollment: Enrollment, totalLessons: number) {
  if (!enrollment || totalLessons === 0) return 0;
  return Math.round((enrollment.completedLessonIds.length / totalLessons) * 100);
}

function DashboardPage() {
  const { currentUser } = useAuth();
  const { data: courses = [] } = useCourses();
  const { data: enrollments = [] } = useMyEnrollments(currentUser?.id);
  const { data: transactions = [] } = useMyTransactions(currentUser?.id);

  if (!currentUser)
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-serif text-2xl text-foreground">Psst — you're not logged in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to see your courses and progress.</p>
        <Button asChild className="mt-6">
          <Link to="/login">Sign in</Link>
        </Button>
      </div>
    );

  const myCourses = enrollments
    .map((e) => {
      const course = courses.find((c) => c.id === e.courseId);
      return course ? { course, enrollment: e, pct: getProgress(e, course.lessons.length) } : null;
    })
    .filter((x): x is { course: Course; enrollment: Enrollment; pct: number } => !!x);

  const inProgress = myCourses.filter((x) => x.pct > 0 && x.pct < 100);
  const completed = myCourses.filter((x) => x.pct === 100);
  const notStarted = myCourses.filter((x) => x.pct === 0);

  // Points derived from enrollment data (always accurate)
  const totalPoints =
    enrollments.reduce((sum, e) => sum + e.completedLessonIds.length, 0) * POINTS_PER_LESSON;

  // Pie chart data
  const pieData = [
    { name: "Completed", value: completed.length, color: "oklch(0.52 0.26 290)" },
    { name: "In Progress", value: inProgress.length, color: "oklch(0.60 0.28 340)" },
    { name: "Not Started", value: notStarted.length, color: "oklch(0.75 0.05 290)" },
  ].filter((d) => d.value > 0);

  // Bar chart: actual time spent per course, tracked in the learn page
  const timeData = myCourses.map(({ course, enrollment }) => ({
    name: course.title.length > 18 ? course.title.slice(0, 16) + "…" : course.title,
    minutes: Math.round(enrollment.timeSpentSeconds / 60),
  }));

  const recommended = courses
    .filter(
      (c) =>
        !enrollments.some((e) => e.courseId === c.id) &&
        (currentUser.interests.length === 0 || currentUser.interests.includes(c.category)),
    )
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* ── Hero / Points ─────────────────────────────────────── */}
      <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-foreground sm:text-5xl">
            Hey, {currentUser.name.split(" ")[0]}!
          </h1>
          <p className="mt-2 text-muted-foreground">
            {myCourses.length === 0
              ? "Nothing here yet — let's fix that."
              : `${completed.length} completed · ${inProgress.length} in progress`}
          </p>
        </div>
        <div
          className="flex items-center gap-3 rounded-2xl px-5 py-4"
          style={{ background: "var(--gradient-accent)" }}
        >
          <Zap className="h-6 w-6 text-white" fill="white" />
          <div>
            <div className="text-3xl font-bold text-white leading-none">{totalPoints}</div>
            <div className="mt-0.5 text-xs text-white/80">XP earned</div>
          </div>
        </div>
      </div>

      {/* ── Charts (only when enrolled in courses) ────────────── */}
      {myCourses.length > 0 && (
        <div className="mb-12 grid gap-6 sm:grid-cols-2">
          {/* Pie: course completion breakdown */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-sm font-medium text-foreground">Course breakdown</h3>
            <div className="mt-4 flex items-center gap-6">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    innerRadius={36}
                    outerRadius={56}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: d.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {d.name} <span className="font-medium text-foreground">({d.value})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bar: time spent per course */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-sm font-medium text-foreground">Time spent (minutes)</h3>
            {timeData.every((d) => d.minutes === 0) ? (
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Spend time in a lesson to see your stats
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={120} className="mt-4">
                <BarChart data={timeData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                    }}
                    formatter={(v: number) => [`${v} min`, "Time spent"]}
                  />
                  <Bar
                    dataKey="minutes"
                    radius={[4, 4, 0, 0]}
                    fill="oklch(0.52 0.26 290)"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* ── In Progress ───────────────────────────────────────── */}
      <section>
        <h2 className="font-serif text-2xl text-foreground">Currently cooking</h2>
        {inProgress.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground">No courses in progress yet.</p>
            <Button asChild className="mt-4" style={{ background: "var(--gradient-accent)" }}>
              <Link to="/courses" className="text-white">Browse courses</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {inProgress.map(({ course, pct }) => (
              <CourseProgressCard key={course.id} course={course} pct={pct} />
            ))}
          </ul>
        )}
      </section>

      {/* ── Completed ─────────────────────────────────────────── */}
      {completed.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-2xl text-foreground">Conquered</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {completed.map(({ course }) => (
              <CourseCompletedCard
                key={course.id}
                course={course}
                userName={currentUser.name}
              />
            ))}
          </ul>
        </section>
      )}

      {/* ── Recommendations ───────────────────────────────────── */}
      {recommended.length > 0 && (
        <section className="mt-16">
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent">
              <Bot className="h-3 w-3" /> The algorithm cooked
            </span>
            <h2 className="font-serif mt-1 text-2xl text-foreground">You'd probably vibe with these</h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-3">
            {recommended.map((c) => (
              <li key={c.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="font-serif text-lg text-foreground">{c.title}</div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.summary}</p>
                <Link
                  to="/courses/$slug"
                  params={{ slug: c.slug }}
                  className="mt-3 inline-block text-sm font-medium text-primary"
                >
                  Check it out →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Transactions ──────────────────────────────────────── */}
      {transactions.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-2xl text-foreground">Purchase history</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const c = courses.find((x) => x.id === t.courseId);
                  return (
                    <tr key={t.id} className="border-t border-border">
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">{c?.title ?? "—"}</td>
                      <td className="px-4 py-3">${t.amount}</td>
                      <td className="px-4 py-3 capitalize">{t.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function CourseProgressCard({ course, pct }: { course: Course; pct: number }) {
  return (
    <li className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <CourseIcon category={course.category} className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <Link
            to="/courses/$slug"
            params={{ slug: course.slug }}
            className="font-serif text-lg text-foreground hover:underline"
          >
            {course.title}
          </Link>
          <div className="mt-1 text-xs text-muted-foreground">
            {course.instructor} · {course.lessons.length} lessons
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: "var(--gradient-accent)" }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{pct}% done</span>
            <Link
              to="/learn/$slug"
              params={{ slug: course.slug }}
              className="text-xs font-medium text-primary hover:underline"
            >
              Keep going →
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}

function CourseCompletedCard({
  course,
  userName,
}: {
  course: Course;
  userName: string;
}) {
  return (
    <li className="rounded-2xl border border-primary/20 bg-card p-5">
      <div className="flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <CourseIcon category={course.category} className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <Link
            to="/courses/$slug"
            params={{ slug: course.slug }}
            className="font-serif text-lg text-foreground hover:underline"
          >
            {course.title}
          </Link>
          <div className="mt-1 text-xs text-muted-foreground">
            {course.instructor} · {course.lessons.length} lessons
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <CheckCircle2 className="h-3 w-3" /> Completed
            </span>
            <CertificateButton
              userName={userName}
              courseTitle={course.title}
              instructor={course.instructor}
              variant="outline"
              size="sm"
            />
          </div>
        </div>
      </div>
    </li>
  );
}
