import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useCourse } from "@/lib/query/courses";
import { useEnrollment, useEnroll, useToggleLessonComplete } from "@/lib/query/enrollments";
import { CertificateButton } from "@/components/CertificateButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  ClipboardList,
  LayoutDashboard,
  RotateCcw,
  X,
} from "lucide-react";
import { CourseIcon } from "@/components/CourseIcon";
import { toast } from "sonner";
import type { Course, Quiz, User } from "@/lib/types";

type LearnSearch = { lesson?: string; quiz?: string };

export const Route = createFileRoute("/learn/$slug")({
  validateSearch: (search: Record<string, unknown>): LearnSearch => ({
    lesson: typeof search.lesson === "string" ? search.lesson : undefined,
    quiz: typeof search.quiz === "string" ? search.quiz : undefined,
  }),
  component: LearnPage,
});


function LearnPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const { data: course, isLoading } = useCourse(slug);
  const { data: enrollment } = useEnrollment(currentUser?.id, course?.id ?? "");
  const enrollMutation = useEnroll();
  const toggleLesson = useToggleLessonComplete();

  const [showCompletion, setShowCompletion] = useState(false);
  const prevPctRef = useRef<number | null>(null);

  const total = course?.lessons.length ?? 0;
  const done = enrollment?.completedLessonIds.length ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  // Default to first lesson if none selected
  const activeLessonId = search.lesson ?? course?.lessons[0]?.id;
  const activeQuizId = search.quiz;
  const lesson = course?.lessons.find((l) => l.id === activeLessonId);
  const quiz = course?.quizzes?.find((q) => q.id === activeQuizId);

  // Auto-enroll for free courses on entry
  useEffect(() => {
    if (!course || !currentUser || enrollment) return;
    if (course.price === 0) {
      enrollMutation.mutate({ userId: currentUser.id, courseId: course.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?.id, currentUser?.id, enrollment]);

  // Show completion screen when all lessons are marked done
  useEffect(() => {
    if (enrollment === undefined) return; // still loading
    if (prevPctRef.current === null) {
      prevPctRef.current = pct; // initialise without triggering
      return;
    }
    if (pct === 100 && prevPctRef.current < 100) {
      setShowCompletion(true);
    }
    prevPctRef.current = pct;
  }, [pct, enrollment]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!course) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-serif text-3xl">Course not found</h1>
        <Link to="/courses" className="mt-4 inline-block text-primary underline">
          Browse courses
        </Link>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-serif text-3xl text-foreground">Sign in to keep learning</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You need an account to track your progress through {course.title}.
        </p>
        <Button asChild className="mt-6">
          <Link to="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (!enrollment && course.price > 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-serif text-3xl text-foreground">Enroll to access this course</h1>
        <p className="mt-2 text-sm text-muted-foreground">{course.title} is a paid course.</p>
        <Button asChild className="mt-6">
          <Link to="/courses/$slug" params={{ slug: course.slug }}>
            View course
          </Link>
        </Button>
      </div>
    );
  }

  const completedIds = enrollment?.completedLessonIds ?? [];

  const lessonIndex = course.lessons.findIndex((l) => l.id === activeLessonId);
  const prevLesson = lessonIndex > 0 ? course.lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex >= 0 && lessonIndex < total - 1 ? course.lessons[lessonIndex + 1] : null;

  const goLesson = (id: string) => navigate({ to: "/learn/$slug", params: { slug }, search: { lesson: id } });
  const goQuiz = (id: string) => navigate({ to: "/learn/$slug", params: { slug }, search: { quiz: id } });

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[300px_1fr]">
      {/* Sidebar */}
      <aside className="self-start rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <Link
            to="/courses/$slug"
            params={{ slug: course.slug }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Course details
          </Link>
          <h2 className="font-serif mt-2 text-lg leading-tight text-foreground">{course.title}</h2>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {done}/{total} lessons · {pct}%
          </div>
        </div>

        <div className="px-2 py-2">
          <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            Lessons
          </div>
          <ol className="space-y-0.5">
            {course.lessons.map((l, i) => {
              const isActive = !activeQuizId && l.id === activeLessonId;
              const isDone = completedIds.includes(l.id);
              return (
                <li key={l.id}>
                  <button
                    onClick={() => goLesson(l.id)}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="min-w-0 flex-1 truncate">
                      {i + 1}. {l.title}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{l.duration}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          {course.quizzes?.length > 0 && (
            <>
              <div className="mt-3 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                Quizzes
              </div>
              <ol className="space-y-0.5">
                {course.quizzes.map((q) => {
                  const isActive = q.id === activeQuizId;
                  return (
                    <li key={q.id}>
                      <button
                        onClick={() => goQuiz(q.id)}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-secondary"
                        }`}
                      >
                        <ClipboardList className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate">{q.title}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {q.questions.length}q
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="min-w-0">
        {quiz ? (
          <QuizView
            quiz={quiz}
            onExit={() => goLesson(activeLessonId ?? course.lessons[0].id)}
          />
        ) : lesson ? (
          <article>
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">Lesson {lessonIndex + 1}</Badge>
              <span>·</span>
              <span>{lesson.duration}</span>
              {lesson.preview && (
                <>
                  <span>·</span>
                  <Badge variant="outline">Preview</Badge>
                </>
              )}
            </div>
            <h1 className="font-serif text-3xl text-foreground">{lesson.title}</h1>

            <div className="mt-5 min-h-45 rounded-xl border border-border bg-card p-6 sm:p-8">
              {lesson.description ? (
                <p className="text-base leading-relaxed text-foreground">{lesson.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No description available for this lesson.</p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <Button
                variant="outline"
                onClick={() =>
                  toggleLesson.mutate(
                    { userId: currentUser.id, courseId: course.id, lessonId: lesson.id },
                    {
                      onSuccess: () =>
                        toast.success(
                          completedIds.includes(lesson.id) ? "Marked incomplete" : "Lesson complete",
                        ),
                    },
                  )
                }
              >
                {completedIds.includes(lesson.id) ? (
                  <>
                    <Circle className="mr-2 h-4 w-4" /> Mark incomplete
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Mark complete
                  </>
                )}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  disabled={!prevLesson}
                  onClick={() => prevLesson && goLesson(prevLesson.id)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                {nextLesson ? (
                  <Button onClick={() => goLesson(nextLesson.id)}>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : course.quizzes?.length > 0 ? (
                  <Button onClick={() => goQuiz(course.quizzes[0].id)}>
                    Take quiz <ClipboardList className="ml-2 h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          </article>
        ) : (
          <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
            Select a lesson to begin.
          </div>
        )}
      </main>

      {showCompletion && currentUser && (
        <CompletionOverlay
          user={currentUser}
          course={course}
          onClose={() => setShowCompletion(false)}
        />
      )}
    </div>
  );
}

function CompletionOverlay({
  user,
  course,
  onClose,
}: {
  user: User;
  course: Course;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
        {/* Dismiss */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Cover + confetti-ish decoration */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-primary/20 bg-primary/10 text-primary">
            <CourseIcon category={course.category} className="h-10 w-10" />
          </div>
          <div className="mt-1 text-2xl">🎉</div>

          <h2 className="font-serif mt-4 text-3xl text-foreground">Course Complete!</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Congratulations, <span className="font-medium text-foreground">{user.name.split(" ")[0]}</span>!
            You've finished every lesson in{" "}
            <span className="font-medium text-foreground">{course.title}</span>.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3">
          <CertificateButton
            userName={user.name}
            courseTitle={course.title}
            instructor={course.instructor}
            className="w-full"
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate({ to: "/dashboard" })}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" /> View Dashboard
          </Button>
          <button
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Keep reviewing lessons
          </button>
        </div>
      </div>
    </div>
  );
}

function QuizView({ quiz, onExit }: { quiz: Quiz; onExit: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(() => {
    const correct = quiz.questions.filter((q) => {
      const selected = answers[q.id] ?? [];
      const correctSet = new Set(q.correctOptionIds);
      const selectedSet = new Set(selected);
      return correctSet.size === selectedSet.size && [...correctSet].every((id) => selectedSet.has(id));
    }).length;
    return Math.round((correct / quiz.questions.length) * 100);
  }, [answers, quiz]);

  const passed = score >= quiz.passingScore;
  const allAnswered = quiz.questions.every((q) => (answers[q.id]?.length ?? 0) > 0);

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  const toggle = (qId: string, optId: string, isMulti: boolean) => {
    setAnswers((prev) => {
      if (isMulti) {
        const current = prev[qId] ?? [];
        const next = current.includes(optId)
          ? current.filter((id) => id !== optId)
          : [...current, optId];
        return { ...prev, [qId]: next };
      }
      return { ...prev, [qId]: [optId] };
    });
  };

  return (
    <article>
      <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">Quiz</Badge>
        <span>·</span>
        <span>{quiz.questions.length} questions</span>
        <span>·</span>
        <span>Pass at {quiz.passingScore}%</span>
      </div>
      <h1 className="font-serif text-3xl text-foreground">{quiz.title}</h1>
      {quiz.description && (
        <p className="mt-2 text-sm text-muted-foreground">{quiz.description}</p>
      )}

      {submitted && (
        <div
          className={`mt-6 rounded-xl border p-5 ${
            passed
              ? "border-primary/30 bg-primary/5 text-foreground"
              : "border-destructive/30 bg-destructive/5 text-foreground"
          }`}
        >
          <div className="font-serif text-2xl">
            {passed ? "Passed" : "Not yet"} — {score}%
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {passed
              ? "Nice work. Review the answers below or move on to the next lesson."
              : `You need ${quiz.passingScore}% to pass. Review the explanations and try again.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="mr-2 h-4 w-4" /> Retake
            </Button>
            <Button onClick={onExit}>Back to lessons</Button>
          </div>
        </div>
      )}

      <ol className="mt-8 space-y-6">
        {quiz.questions.map((q, i) => {
          const isMulti = q.correctOptionIds.length > 1;
          const selected = answers[q.id] ?? [];
          return (
            <li key={q.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Question {i + 1}</span>
                {isMulti && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide">
                    Select all that apply
                  </span>
                )}
              </div>
              <h3 className="mt-1 text-base font-medium text-foreground">{q.prompt}</h3>
              <div className="mt-4 space-y-2">
                {q.options.map((opt) => {
                  const isSelected = selected.includes(opt.id);
                  const isCorrect = submitted && q.correctOptionIds.includes(opt.id);
                  const isWrong = submitted && isSelected && !q.correctOptionIds.includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                        isCorrect
                          ? "border-primary/50 bg-primary/5"
                          : isWrong
                            ? "border-destructive/50 bg-destructive/5"
                            : isSelected
                              ? "border-primary/40 bg-secondary"
                              : "border-border hover:bg-secondary"
                      }`}
                    >
                      <input
                        type={isMulti ? "checkbox" : "radio"}
                        name={q.id}
                        className="mt-1"
                        checked={isSelected}
                        disabled={submitted}
                        onChange={() => toggle(q.id, opt.id, isMulti)}
                      />
                      <span className="flex-1 text-foreground">{opt.text}</span>
                    </label>
                  );
                })}
              </div>
              {submitted && q.explanation && (
                <p className="mt-3 rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
                  {q.explanation}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {!submitted && (
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onExit}>
            Cancel
          </Button>
          <Button onClick={() => setSubmitted(true)} disabled={!allAnswered}>
            Submit quiz
          </Button>
        </div>
      )}
    </article>
  );
}