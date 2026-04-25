import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const { db, currentUser } = useStore();
  const location = useLocation();
  if (!currentUser || currentUser.role !== "admin") return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="font-serif text-2xl">Admin access required</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sign in as admin@lumen.io / admin123.</p>
      <Button asChild className="mt-6"><Link to="/login">Sign in</Link></Button>
    </div>
  );
  const isRoot = location.pathname === "/admin" || location.pathname === "/admin/";
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-4xl text-foreground">Admin</h1>
      <nav className="mt-6 flex flex-wrap gap-1 border-b border-border">
        <Link to="/admin" activeOptions={{ exact: true }} activeProps={{ className: "border-foreground text-foreground" }} inactiveProps={{ className: "border-transparent text-muted-foreground" }} className="border-b-2 px-4 py-2 text-sm hover:text-foreground">Overview</Link>
        <Link to="/admin/courses" activeProps={{ className: "border-foreground text-foreground" }} inactiveProps={{ className: "border-transparent text-muted-foreground" }} className="border-b-2 px-4 py-2 text-sm hover:text-foreground">Courses</Link>
        <Link to="/admin/users" activeProps={{ className: "border-foreground text-foreground" }} inactiveProps={{ className: "border-transparent text-muted-foreground" }} className="border-b-2 px-4 py-2 text-sm hover:text-foreground">Users</Link>
        <Link to="/admin/transactions" activeProps={{ className: "border-foreground text-foreground" }} inactiveProps={{ className: "border-transparent text-muted-foreground" }} className="border-b-2 px-4 py-2 text-sm hover:text-foreground">Transactions</Link>
      </nav>
      <div className="mt-8">{isRoot ? <Overview /> : <Outlet />}</div>
    </div>
  );

  function Overview() {
    const revenue = db.transactions.filter((t) => t.status === "success").reduce((s, t) => s + t.amount, 0);
    const stats = [
      { label: "Total users", value: db.users.length },
      { label: "Total courses", value: db.courses.length },
      { label: "Enrollments", value: db.enrollments.length },
      { label: "Revenue", value: `$${revenue.toLocaleString()}` },
    ];
    const top = [...db.courses].sort((a, b) => b.students - a.students).slice(0, 5);
    return (
      <div className="space-y-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-5">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="mt-1 font-serif text-3xl text-foreground">{s.value}</div>
            </div>
          ))}
        </div>
        <div>
          <h2 className="font-serif text-xl text-foreground">Top courses</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-xs text-muted-foreground"><tr><th className="px-4 py-2">Course</th><th className="px-4 py-2">Category</th><th className="px-4 py-2">Students</th><th className="px-4 py-2">Rating</th></tr></thead>
              <tbody>{top.map((c) => (<tr key={c.id} className="border-t border-border"><td className="px-4 py-2">{c.title}</td><td className="px-4 py-2 text-muted-foreground">{c.category}</td><td className="px-4 py-2">{c.students.toLocaleString()}</td><td className="px-4 py-2">{c.rating.toFixed(1)}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}
