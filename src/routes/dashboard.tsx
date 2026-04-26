import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-store";
import { useCourses } from "@/lib/query/courses";
import { useMyEnrollments } from "@/lib/query/enrollments";
import { useMyTransactions } from "@/lib/query/transactions";
import { CertificateButton } from "@/components/CertificateButton";
import { Button } from "@/components/ui/button";
import { Bot, CheckCircle2 } from "lucide-react";
import type { Course, Enrollment } from "@/lib/types";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

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
        <h1 className="font-serif text-2xl text-foreground">Please sign in</h1>
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

  const inProgress = myCourses.filter((x) => x.pct < 100);
  const completed = myCourses.filter((x) => x.pct === 100);

  const recommended = courses
    .filter(
      (c) =>
        !enrollments.some((e) => e.courseId === c.id) &&
        (currentUser.interests.length === 0 || currentUser.interests.includes(c.category)),
    )
    .slice(0, 3);

  const subtitleParts: string[] = [];
  if (inProgress.length > 0)
    subtitleParts.push(`${inProgress.length} in progress`);
  if (completed.length > 0)
    subtitleParts.push(`${completed.length} completed`);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="font-serif text-4xl text-foreground sm:text-5xl">
          Hello, {currentUser.name.split(" ")[0]}.
        </h1>
        <p className="mt-2 text-muted-foreground">
          {myCourses.length === 0
            ? "You haven't enrolled in anything yet. Start with something small."
            : subtitleParts.join(" · ")}
        </p>
      </div>

      {/* ── In Progress ───────────────────────────────────────── */}
      <section>
        <h2 className="font-serif text-2xl text-foreground">In Progress</h2>
        {inProgress.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground">No enrollments yet.</p>
            <Button asChild className="mt-4">
              <Link to="/courses">Browse courses</Link>
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
          <h2 className="font-serif text-2xl text-foreground">Completed</h2>
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
            <span className="inline-flex items-center gap-1.5 text-xs text-accent">
              <Bot className="h-3 w-3" /> AI recommendations
            </span>
            <h2 className="font-serif mt-1 text-2xl text-foreground">You might also like</h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-3">
            {recommended.map((c) => (
              <li key={c.id} className="rounded-xl border border-border bg-card p-5">
                <div className="font-serif text-lg text-foreground">{c.title}</div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.summary}</p>
                <Link
                  to="/courses/$slug"
                  params={{ slug: c.slug }}
                  className="mt-3 inline-block text-sm text-primary"
                >
                  View →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Transactions ──────────────────────────────────────── */}
      {transactions.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-2xl text-foreground">Transactions</h2>
          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Course</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const c = courses.find((x) => x.id === t.courseId);
                  return (
                    <tr key={t.id} className="border-t border-border">
                      <td className="px-4 py-2 text-muted-foreground">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">{c?.title ?? "—"}</td>
                      <td className="px-4 py-2">${t.amount}</td>
                      <td className="px-4 py-2 capitalize">{t.status}</td>
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
    <li className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-primary/10 font-serif text-2xl text-primary">
          {course.cover}
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
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{pct}% complete</span>
            <Link
              to="/learn/$slug"
              params={{ slug: course.slug }}
              className="text-xs text-primary hover:underline"
            >
              Continue →
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
    <li className="rounded-xl border border-primary/20 bg-card p-5">
      <div className="flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-primary/10 font-serif text-2xl text-primary">
          {course.cover}
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
