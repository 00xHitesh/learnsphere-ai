import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/admin/transactions")({ component: AdminTransactions });

function AdminTransactions() {
  const { db } = useStore();
  return (
    <div>
      <h2 className="font-serif text-2xl text-foreground">Transactions</h2>
      {db.transactions.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No transactions yet.</p> : (
        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs text-muted-foreground"><tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">User</th><th className="px-4 py-2">Course</th><th className="px-4 py-2">Amount</th><th className="px-4 py-2">Status</th></tr></thead>
            <tbody>{db.transactions.map((t) => { const u = db.users.find((x) => x.id === t.userId); const c = db.courses.find((x) => x.id === t.courseId); return (
              <tr key={t.id} className="border-t border-border">
                <td className="px-4 py-2 text-muted-foreground">{new Date(t.date).toLocaleDateString()}</td>
                <td className="px-4 py-2">{u?.name ?? "—"}</td>
                <td className="px-4 py-2">{c?.title ?? "—"}</td>
                <td className="px-4 py-2">${t.amount}</td>
                <td className="px-4 py-2 capitalize">{t.status}</td>
              </tr>
            );})}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
