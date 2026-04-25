import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const { db, currentUser, progress } = useStore();
  if (!currentUser) return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="font-serif text-2xl text-foreground">Please sign in</h1>
      <Button asChild className="mt-6"><Link to="/login">Sign in</Link></Button>
    </div>
  );
  const myEnrollments = db.enrollments.filter((e) => e.userId === currentUser.id);
  const myCourses = myEnrollments.map((e) => db.courses.find((c) => c.id === e.courseId)).filter((c): c is NonNullable<typeof c> => !!c);
  const recommended = db.courses.filter((c) => c.approved && !myEnrollments.some((e) => e.courseId === c.id) && (currentUser.interests.length === 0 || currentUser.interests.includes(c.category))).slice(0, 3);
  const myTransactions = db.transactions.filter((t) => t.userId === currentUser.id);
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="font-serif text-4xl text-foreground sm:text-5xl">Hello, {currentUser.name.split(" ")[0]}.</h1>
        <p className="mt-2 text-muted-foreground">{myCourses.length === 0 ? "You haven't enrolled in anything yet. Start with something small." : `You have ${myCourses.length} course${myCourses.length === 1 ? "" : "s"} in progress.`}</p>
      </div>
      <section>
        <h2 className="font-serif text-2xl text-foreground">My learning</h2>
        {myCourses.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground">No enrollments yet.</p>
            <Button asChild className="mt-4"><Link to="/courses">Browse courses</Link></Button>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {myCourses.map((course) => {
              const pct = progress(course.id);
              return (
                <li key={course.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start gap-4">
                    <div className="grid h-14 w-14 place-items-center rounded-md bg-primary/10 font-serif text-2xl text-primary">{course.cover}</div>
                    <div className="min-w-0 flex-1">
                      <Link to="/courses/$slug" params={{ slug: course.slug }} className="font-serif text-lg text-foreground hover:underline">{course.title}</Link>
                      <div className="mt-1 text-xs text-muted-foreground">{course.instructor} • {course.lessons.length} lessons</div>
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                      <div className="mt-1 text-xs text-muted-foreground">{pct}% complete</div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {recommended.length > 0 && (
        <section className="mt-16">
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-accent"><Bot className="h-3 w-3" /> AI recommendations</span>
            <h2 className="font-serif mt-1 text-2xl text-foreground">You might also like</h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-3">
            {recommended.map((c) => (
              <li key={c.id} className="rounded-xl border border-border bg-card p-5">
                <div className="font-serif text-lg text-foreground">{c.title}</div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.summary}</p>
                <Link to="/courses/$slug" params={{ slug: c.slug }} className="mt-3 inline-block text-sm text-primary">View →</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {myTransactions.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-2xl text-foreground">Transactions</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-xs text-muted-foreground"><tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Course</th><th className="px-4 py-2">Amount</th><th className="px-4 py-2">Status</th></tr></thead>
              <tbody>{myTransactions.map((t) => { const c = db.courses.find((x) => x.id === t.courseId); return (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-4 py-2 text-muted-foreground">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{c?.title ?? "—"}</td>
                  <td className="px-4 py-2">${t.amount}</td>
                  <td className="px-4 py-2 capitalize">{t.status}</td>
                </tr>
              );})}</tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
