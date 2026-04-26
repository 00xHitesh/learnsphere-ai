import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminCourses, useDeleteCourse, useToggleCourseApproval, useUpsertCourse } from "@/lib/query/courses";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { Course, Lesson, Quiz, QuizQuestion } from "@/lib/types";

export const Route = createFileRoute("/admin/courses")({ component: AdminCourses });

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const blank = (): Course => ({
  id: `c-${Date.now()}`,
  title: "",
  slug: "",
  description: "",
  summary: "",
  category: "Design",
  level: "Beginner",
  price: 0,
  rating: 4.5,
  students: 0,
  instructor: "",
  instructorBio: "",
  cover: "✦",
  lessons: [],
  quizzes: [],
  reviews: [],
  tags: [],
  approved: true,
  createdAt: new Date().toISOString().slice(0, 10),
});

function AdminCourses() {
  const { data: courses = [] } = useAdminCourses();
  const upsertMutation = useUpsertCourse();
  const deleteMutation = useDeleteCourse();
  const toggleApprovalMutation = useToggleCourseApproval();
  const [editing, setEditing] = useState<Course | null>(null);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-2xl text-foreground">Courses</h2>
        <Button onClick={() => setEditing(blank())}>
          <Plus className="mr-1.5 h-4 w-4" /> New course
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Approved</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-2">{c.title}</td>
                <td className="px-4 py-2 text-muted-foreground">{c.category}</td>
                <td className="px-4 py-2">{c.price === 0 ? "Free" : `$${c.price}`}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => toggleApprovalMutation.mutate(c.id)}
                    className={`rounded-full px-2 py-0.5 text-xs ${c.approved ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}
                  >
                    {c.approved ? "Approved" : "Pending"}
                  </button>
                </td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditing(c)}
                      className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${c.title}"?`)) {
                          deleteMutation.mutate(c.id, {
                            onSuccess: () => toast.success("Course deleted"),
                          });
                        }
                      }}
                      className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <Editor
          course={editing}
          onClose={() => setEditing(null)}
          onSave={(c) => {
            upsertMutation.mutate(
              { ...c, slug: c.slug || slugify(c.title) },
              { onSuccess: () => { toast.success("Course saved"); setEditing(null); } },
            );
          }}
        />
      )}
    </div>
  );
}

function Editor({
  course,
  onClose,
  onSave,
}: {
  course: Course;
  onClose: () => void;
  onSave: (c: Course) => void;
}) {
  const [c, setC] = useState<Course>(course);
  const update = <K extends keyof Course>(key: K, value: Course[K]) =>
    setC((p) => ({ ...p, [key]: value }));

  const F = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)]">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl">{course.title ? "Edit course" : "New course"}</h3>
          <button onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <F label="Title" value={c.title} onChange={(v) => update("title", v)} />
          <F label="Slug (auto if blank)" value={c.slug} onChange={(v) => update("slug", v)} />
          <F label="Category" value={c.category} onChange={(v) => update("category", v)} />
          <F
            label="Level"
            value={c.level}
            onChange={(v) => update("level", v as Course["level"])}
          />
          <F
            label="Price (USD)"
            value={String(c.price)}
            onChange={(v) => update("price", Number(v) || 0)}
          />
          <F label="Instructor" value={c.instructor} onChange={(v) => update("instructor", v)} />
          <F
            label="Cover (1–2 chars)"
            value={c.cover}
            onChange={(v) => update("cover", v.slice(0, 2))}
          />
          <F
            label="Tags (comma sep.)"
            value={c.tags.join(", ")}
            onChange={(v) =>
              update(
                "tags",
                v
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </div>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs text-muted-foreground">Description</span>
            <textarea
              rows={3}
              value={c.description}
              onChange={(e) => update("description", e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">AI summary</span>
            <textarea
              rows={2}
              value={c.summary}
              onChange={(e) => update("summary", e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Lessons (one per line)</span>
            <textarea
              rows={5}
              value={c.lessons.map((l) => l.title).join("\n")}
              onChange={(e) =>
                update(
                  "lessons",
                  e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((title, i) => ({
                      id: `l-${i}-${slugify(title)}`,
                      title,
                      duration: "5:00",
                      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                      preview: i === 0,
                    })),
                )
              }
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(c)} disabled={!c.title}>
            Save course
          </Button>
        </div>
      </div>
    </div>
  );
}
