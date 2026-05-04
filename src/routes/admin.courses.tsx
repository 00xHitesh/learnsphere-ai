import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminCourses, useDeleteCourse, useToggleCourseApproval, useUpsertCourse } from "@/lib/query/courses";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);

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
                      onClick={() => setConfirmDelete({ id: c.id, title: c.title })}
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
      <ConfirmDialog
        open={confirmDelete !== null}
        title={`Delete "${confirmDelete?.title}"?`}
        body="This will permanently remove the course and cannot be undone."
        confirmLabel="Delete course"
        onConfirm={() => {
          if (confirmDelete) {
            deleteMutation.mutate(confirmDelete.id, {
              onSuccess: () => toast.success("Course deleted"),
            });
          }
        }}
        onCancel={() => setConfirmDelete(null)}
      />
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
          <LessonsEditor
            lessons={c.lessons}
            onChange={(lessons) => update("lessons", lessons)}
          />
          <QuizzesEditor
            quizzes={c.quizzes ?? []}
            onChange={(quizzes) => update("quizzes", quizzes)}
          />
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

function LessonsEditor({
  lessons,
  onChange,
}: {
  lessons: Lesson[];
  onChange: (lessons: Lesson[]) => void;
}) {
  const update = (idx: number, patch: Partial<Lesson>) => {
    onChange(lessons.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };
  const add = () =>
    onChange([
      ...lessons,
      {
        id: `l-${Date.now()}`,
        title: "Untitled lesson",
        duration: "5:00",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        preview: lessons.length === 0,
      },
    ]);
  const remove = (idx: number) => onChange(lessons.filter((_, i) => i !== idx));
  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= lessons.length) return;
    const next = [...lessons];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Lessons</span>
        <Button type="button" size="sm" variant="outline" onClick={add}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add lesson
        </Button>
      </div>
      {lessons.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">No lessons yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {lessons.map((l, i) => (
            <li key={l.id} className="rounded-md border border-border bg-background p-3">
              <div className="flex items-start gap-2">
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    className="rounded p-1 text-muted-foreground hover:bg-secondary"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    className="rounded p-1 text-muted-foreground hover:bg-secondary"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
                <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_100px]">
                  <input
                    value={l.title}
                    onChange={(e) => update(i, { title: e.target.value })}
                    placeholder="Lesson title"
                    className="rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    value={l.duration}
                    onChange={(e) => update(i, { duration: e.target.value })}
                    placeholder="5:00"
                    className="rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    value={l.videoUrl ?? ""}
                    onChange={(e) => update(i, { videoUrl: e.target.value })}
                    placeholder="YouTube/Vimeo URL"
                    className="rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring sm:col-span-2"
                  />
                  <textarea
                    rows={2}
                    value={l.description ?? ""}
                    onChange={(e) => update(i, { description: e.target.value })}
                    placeholder="Short description (optional)"
                    className="rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring sm:col-span-2"
                  />
                  <label className="col-span-full flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={!!l.preview}
                      onChange={(e) => update(i, { preview: e.target.checked })}
                    />
                    Free preview
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function QuizzesEditor({
  quizzes,
  onChange,
}: {
  quizzes: Quiz[];
  onChange: (quizzes: Quiz[]) => void;
}) {
  const updateQuiz = (idx: number, patch: Partial<Quiz>) =>
    onChange(quizzes.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  const addQuiz = () =>
    onChange([
      ...quizzes,
      {
        id: `q-${Date.now()}`,
        title: "New quiz",
        passingScore: 70,
        questions: [],
      },
    ]);
  const removeQuiz = (idx: number) => onChange(quizzes.filter((_, i) => i !== idx));

  const addQuestion = (qIdx: number) => {
    const id = `qq-${Date.now()}`;
    const newQ: QuizQuestion = {
      id,
      prompt: "New question",
      options: [
        { id: "a", text: "Option A" },
        { id: "b", text: "Option B" },
      ],
      correctOptionIds: ["a"],
    };
    updateQuiz(qIdx, { questions: [...quizzes[qIdx].questions, newQ] });
  };
  const updateQuestion = (qIdx: number, qqIdx: number, patch: Partial<QuizQuestion>) => {
    const next = quizzes[qIdx].questions.map((q, i) => (i === qqIdx ? { ...q, ...patch } : q));
    updateQuiz(qIdx, { questions: next });
  };
  const removeQuestion = (qIdx: number, qqIdx: number) => {
    updateQuiz(qIdx, {
      questions: quizzes[qIdx].questions.filter((_, i) => i !== qqIdx),
    });
  };
  const addOption = (qIdx: number, qqIdx: number) => {
    const q = quizzes[qIdx].questions[qqIdx];
    const nextLetter = String.fromCharCode("a".charCodeAt(0) + q.options.length);
    updateQuestion(qIdx, qqIdx, {
      options: [...q.options, { id: nextLetter, text: `Option ${nextLetter.toUpperCase()}` }],
    });
  };
  const updateOption = (qIdx: number, qqIdx: number, oIdx: number, text: string) => {
    const q = quizzes[qIdx].questions[qqIdx];
    const opts = q.options.map((o, i) => (i === oIdx ? { ...o, text } : o));
    updateQuestion(qIdx, qqIdx, { options: opts });
  };
  const removeOption = (qIdx: number, qqIdx: number, oIdx: number) => {
    const q = quizzes[qIdx].questions[qqIdx];
    if (q.options.length <= 2) return;
    const opts = q.options.filter((_, i) => i !== oIdx);
    const remaining = q.correctOptionIds.filter((id) => opts.some((o) => o.id === id));
    const correctOptionIds = remaining.length > 0 ? remaining : [opts[0].id];
    updateQuestion(qIdx, qqIdx, { options: opts, correctOptionIds });
  };

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Quizzes</span>
        <Button type="button" size="sm" variant="outline" onClick={addQuiz}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add quiz
        </Button>
      </div>
      {quizzes.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">No quizzes yet.</p>
      ) : (
        <ul className="mt-3 space-y-4">
          {quizzes.map((quiz, qIdx) => (
            <li key={quiz.id} className="rounded-md border border-border bg-background p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
                <input
                  value={quiz.title}
                  onChange={(e) => updateQuiz(qIdx, { title: e.target.value })}
                  placeholder="Quiz title"
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={quiz.passingScore}
                  onChange={(e) =>
                    updateQuiz(qIdx, { passingScore: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })
                  }
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => removeQuiz(qIdx)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <textarea
                rows={2}
                value={quiz.description ?? ""}
                onChange={(e) => updateQuiz(qIdx, { description: e.target.value })}
                placeholder="Quiz description (optional)"
                className="mt-2 w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
              />

              <div className="mt-3 space-y-3">
                {quiz.questions.map((qq, qqIdx) => (
                  <div key={qq.id} className="rounded-md border border-border bg-card p-3">
                    <div className="flex items-start gap-2">
                      <textarea
                        rows={2}
                        value={qq.prompt}
                        onChange={(e) => updateQuestion(qIdx, qqIdx, { prompt: e.target.value })}
                        placeholder="Question prompt"
                        className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIdx, qqIdx)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {qq.options.map((opt, oIdx) => (
                        <li key={opt.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={qq.correctOptionIds.includes(opt.id)}
                            onChange={() => {
                              const current = qq.correctOptionIds;
                              const next = current.includes(opt.id)
                                ? current.length > 1 ? current.filter((id) => id !== opt.id) : current
                                : [...current, opt.id];
                              updateQuestion(qIdx, qqIdx, { correctOptionIds: next });
                            }}
                            title="Mark as correct answer"
                          />
                          <input
                            value={opt.text}
                            onChange={(e) => updateOption(qIdx, qqIdx, oIdx, e.target.value)}
                            className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(qIdx, qqIdx, oIdx)}
                            disabled={qq.options.length <= 2}
                            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => addOption(qIdx, qqIdx)}
                        className="text-xs text-primary hover:underline"
                      >
                        + Add option
                      </button>
                      <input
                        value={qq.explanation ?? ""}
                        onChange={(e) =>
                          updateQuestion(qIdx, qqIdx, { explanation: e.target.value })
                        }
                        placeholder="Explanation (optional)"
                        className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => addQuestion(qIdx)}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add question
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
