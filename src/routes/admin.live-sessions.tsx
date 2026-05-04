import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useLiveSessions, useUpsertLiveSession, useDeleteLiveSession } from "@/lib/query/liveSessions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { LiveSession } from "@/lib/types";

export const Route = createFileRoute("/admin/live-sessions")({ component: AdminLiveSessions });

const blankSession = (): LiveSession => ({
  id: `ls-${Date.now()}`,
  title: "",
  instructor: "",
  description: "",
  scheduledAt: new Date(Date.now() + 86_400_000).toISOString().slice(0, 16) + ":00.000Z",
  durationMinutes: 60,
  topic: "All Topics",
  joinUrl: "",
  registeredCount: 0,
  maxAttendees: 100,
});

function AdminLiveSessions() {
  const { data: sessions = [] } = useLiveSessions();
  const upsertMutation = useUpsertLiveSession();
  const deleteMutation = useDeleteLiveSession();
  const [editing, setEditing] = useState<LiveSession | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-2xl text-foreground">Live Sessions</h2>
        <Button onClick={() => setEditing(blankSession())}>
          <Plus className="mr-1.5 h-4 w-4" /> New session
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Instructor</th>
              <th className="px-4 py-3">Scheduled</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Spots</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{s.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.instructor}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(s.scheduledAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{s.durationMinutes} min</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {s.registeredCount} / {s.maxAttendees}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditing(s)}
                      className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ id: s.id, title: s.title })}
                      className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No sessions yet. Create the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <SessionEditor
          session={editing}
          onClose={() => setEditing(null)}
          onSave={(s) =>
            upsertMutation.mutate(s, {
              onSuccess: () => {
                toast.success("Session saved");
                setEditing(null);
              },
            })
          }
        />
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title={`Delete "${confirmDelete?.title}"?`}
        body="This will permanently remove the session."
        confirmLabel="Delete session"
        onConfirm={() => {
          if (confirmDelete) {
            deleteMutation.mutate(confirmDelete.id, {
              onSuccess: () => toast.success("Session deleted"),
            });
          }
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function F({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function SessionEditor({
  session,
  onClose,
  onSave,
}: {
  session: LiveSession;
  onClose: () => void;
  onSave: (s: LiveSession) => void;
}) {
  const [s, setS] = useState<LiveSession>(session);
  const set = <K extends keyof LiveSession>(key: K, value: LiveSession[K]) =>
    setS((p) => ({ ...p, [key]: value }));

  const scheduledLocal = s.scheduledAt.slice(0, 16);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-(--shadow-elegant)">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl">{session.title ? "Edit session" : "New session"}</h3>
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <F label="Title" value={s.title} onChange={(v) => set("title", v)} />
          </div>
          <F label="Instructor" value={s.instructor} onChange={(v) => set("instructor", v)} />
          <F label="Topic" value={s.topic} onChange={(v) => set("topic", v)} />
          <F
            label="Scheduled at (local time)"
            type="datetime-local"
            value={scheduledLocal}
            onChange={(v) => set("scheduledAt", new Date(v).toISOString())}
          />
          <F
            label="Duration (minutes)"
            type="number"
            value={String(s.durationMinutes)}
            onChange={(v) => set("durationMinutes", Math.max(1, Number(v) || 60))}
          />
          <div className="sm:col-span-2">
            <F label="Join URL" value={s.joinUrl} onChange={(v) => set("joinUrl", v)} />
          </div>
          <F
            label="Max attendees"
            type="number"
            value={String(s.maxAttendees)}
            onChange={(v) => set("maxAttendees", Math.max(1, Number(v) || 100))}
          />
          <F
            label="Registered count"
            type="number"
            value={String(s.registeredCount)}
            onChange={(v) => set("registeredCount", Math.max(0, Number(v) || 0))}
          />
          <div className="sm:col-span-2">
            <label className="block">
              <span className="text-xs text-muted-foreground">Description</span>
              <textarea
                rows={3}
                value={s.description}
                onChange={(e) => set("description", e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(s)} disabled={!s.title || !s.joinUrl}>
            Save session
          </Button>
        </div>
      </div>
    </div>
  );
}
