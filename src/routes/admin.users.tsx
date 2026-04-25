import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const { db, deleteUser, currentUser } = useStore();
  return (
    <div>
      <h2 className="font-serif text-2xl text-foreground">Users</h2>
      <div className="mt-6 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs text-muted-foreground"><tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Role</th><th className="px-4 py-2">Joined</th><th className="px-4 py-2"></th></tr></thead>
          <tbody>{db.users.map((u) => (
            <tr key={u.id} className="border-t border-border">
              <td className="px-4 py-2">{u.name}</td>
              <td className="px-4 py-2 text-muted-foreground">{u.email}</td>
              <td className="px-4 py-2 capitalize">{u.role}</td>
              <td className="px-4 py-2 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-2"><div className="flex justify-end">
                <button disabled={u.id === currentUser?.id} onClick={() => { if (confirm(`Delete ${u.name}?`)) { deleteUser(u.id); toast.success("User deleted"); } }} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
