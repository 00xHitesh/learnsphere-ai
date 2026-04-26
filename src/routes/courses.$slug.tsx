import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-store";
import { useCourse, useCourses } from "@/lib/query/courses";
import {
  useCourseProgress,
  useEnroll,
  useEnrollment,
  useToggleLessonComplete,
} from "@/lib/query/enrollments";
import { useInWishlist, useToggleWishlist } from "@/lib/query/wishlist";
import { CourseCard } from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  Bot,
  CheckCircle2,
  Circle,
  ClipboardList,
  Clock,
  Globe,
  Heart,
  Play,
  Star,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { Lesson } from "@/lib/types";

export const Route = createFileRoute("/courses/$slug")({ component: CourseDetailPage });

function formatDuration(lessons: Lesson[]): string {
  const total = lessons.reduce((sum, l) => {
    const [m, s] = l.duration.split(":").map(Number);
    return sum + (m || 0) * 60 + (s || 0);
  }, 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function CourseDetailPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const { data: course, isLoading } = useCourse(slug);
  const { data: allCourses = [] } = useCourses();
  const { data: enrollment } = useEnrollment(currentUser?.id, course?.id ?? "");
  const pct = useCourseProgress(currentUser?.id, course?.id ?? "", course?.lessons.length ?? 0);
  const inWishlist = useInWishlist(currentUser?.id, course?.id ?? "");
  const enrollMutation = useEnroll();
  const toggleWishlistMutation = useToggleWishlist();
  const toggleLessonMutation = useToggleLessonComplete();

  if (isLoading)
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );

  if (!course)
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-serif text-3xl">Course not found</h1>
        <Link to="/courses" className="mt-4 inline-block text-primary underline">
          Browse courses
        </Link>
      </div>
    );

  const enrolled = !!enrollment;
  const related = allCourses
    .filter((c) => c.category === course.category && c.id !== course.id)
    .slice(0, 3);
  const avgRating =
    course.reviews.length > 0
      ? course.reviews.reduce((s, r) => s + r.rating, 0) / course.reviews.length
      : course.rating;

  const handleEnroll = () => {
    if (!currentUser) {
      toast.message("Please sign in to enroll");
      navigate({ to: "/login" });
      return;
    }
    if (course.price === 0) {
      enrollMutation.mutate(
        { userId: currentUser.id, courseId: course.id },
        { onSuccess: () => toast.success("Enrolled. Happy learning.") },
      );
    } else {
      navigate({ to: "/checkout/$slug", params: { slug: course.slug } });
    }
  };

  const handleToggleWishlist = () => {
    if (!currentUser) {
      navigate({ to: "/login" });
      return;
    }
    const wasIn = inWishlist;
    toggleWishlistMutation.mutate(
      { userId: currentUser.id, courseId: course.id },
      { onSuccess: () => toast.success(wasIn ? "Removed from wishlist" : "Saved to wishlist") },
    );
  };

  return (
    <div>
      {/* ── Hero header ────────────────────────────────── */}
      <div className="border-b border-border bg-secondary/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[2fr_1fr]">
          <div>
            <Link to="/courses" className="text-xs text-muted-foreground hover:text-foreground">
              ← All courses
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{course.category}</Badge>
              <span>•</span>
              <span>{course.level}</span>
            </div>
            <h1 className="font-serif mt-3 text-4xl text-foreground sm:text-5xl">{course.title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              {course.description}
            </p>

            {/* Stats row */}
            <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-current text-accent" />
                {avgRating.toFixed(1)} rating
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {course.students.toLocaleString()} students
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {formatDuration(course.lessons)}
              </span>
              <span>By {course.instructor}</span>
            </div>

            {/* Tags */}
            {course.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {course.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Sidebar card ── */}
          <aside className="self-start rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <div className="text-3xl font-medium text-foreground">
              {course.price === 0 ? "Free" : `$${course.price}`}
            </div>

            {enrolled ? (
              <div className="mt-4 space-y-3">
                <div className="text-xs text-muted-foreground">Your progress</div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-xs text-muted-foreground">{pct}% complete</div>
                <Button asChild className="w-full">
                  <Link to="/learn/$slug" params={{ slug: course.slug }}>
                    Continue learning
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <Button
                  onClick={handleEnroll}
                  className="w-full"
                  disabled={enrollMutation.isPending}
                >
                  {course.price === 0 ? "Enroll for free" : "Buy this course"}
                </Button>
                {course.price === 0 && (
                  <Button asChild variant="secondary" className="w-full">
                    <Link to="/learn/$slug" params={{ slug: course.slug }}>
                      Start learning
                    </Link>
                  </Button>
                )}
                <Button variant="outline" onClick={handleToggleWishlist} className="w-full">
                  <Heart
                    className={`mr-2 h-4 w-4 ${inWishlist ? "fill-current text-accent" : ""}`}
                  />
                  {inWishlist ? "Wishlisted" : "Add to wishlist"}
                </Button>
              </div>
            )}

            {/* Meta list */}
            <ul className="mt-6 space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 shrink-0" />
                English
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {formatDuration(course.lessons)} total
              </li>
              <li className="flex items-center gap-2">
                <Bot className="h-3.5 w-3.5 shrink-0" />
                {course.lessons.length} lessons
              </li>
              <li className="flex items-center gap-2">
                <Award className="h-3.5 w-3.5 shrink-0" />
                Certificate on completion
              </li>
            </ul>
          </aside>
        </div>
      </div>

      {/* ── What you'll cover ───────────────────────────── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <h2 className="font-serif text-2xl text-foreground">What you'll cover</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {course.lessons.map((l) => (
              <div key={l.id} className="flex items-start gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{l.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI summary ──────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-2 inline-flex items-center gap-2 text-xs text-accent">
            <Bot className="h-3 w-3" /> AI summary
          </div>
          <p className="text-sm leading-relaxed text-foreground">{course.summary}</p>
        </div>
      </section>

      {/* ── Curriculum + Preview ────────────────────────── */}
      <section
        id="curriculum"
        className="mx-auto max-w-6xl gap-10 px-4 py-8 sm:px-6 md:grid md:grid-cols-[1.4fr_1fr]"
      >
        <div>
          <h2 className="font-serif text-2xl text-foreground">Curriculum</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {course.lessons.length} lessons · {formatDuration(course.lessons)} total length
          </p>
          <ol className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
            {course.lessons.map((lesson, i) => {
              const completed = enrollment?.completedLessonIds.includes(lesson.id) ?? false;
              return (
                <li
                  key={lesson.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      onClick={() => {
                        if (!enrolled || !currentUser) return;
                        toggleLessonMutation.mutate({
                          userId: currentUser.id,
                          courseId: course.id,
                          lessonId: lesson.id,
                        });
                      }}
                      disabled={!enrolled}
                      aria-label={completed ? "Mark incomplete" : "Mark complete"}
                    >
                      {completed ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    <span className="truncate text-foreground">
                      {i + 1}. {lesson.title}
                    </span>
                    {lesson.preview && (
                      <Badge variant="outline" className="ml-1 shrink-0">
                        Preview
                      </Badge>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{lesson.duration}</span>
                </li>
              );
            })}
          </ol>
        </div>
        <div>
          <h2 className="font-serif text-2xl text-foreground">Preview</h2>
          <div className="mt-4 aspect-video overflow-hidden rounded-lg border border-border bg-black">
            <iframe
              title="Course preview"
              className="h-full w-full"
              src={course.lessons[0]?.videoUrl}
              allowFullScreen
            />
          </div>
          <h3 className="font-serif mt-10 text-xl text-foreground">Instructor</h3>
          <div className="mt-3 rounded-lg border border-border bg-card p-4">
            <div className="font-medium text-foreground">{course.instructor}</div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {course.instructorBio}
            </p>
          </div>
        </div>
      </section>

      {/* ── Quizzes ─────────────────────────────────────── */}
      {course.quizzes?.length > 0 && (
        <section className="border-t border-border bg-secondary/30">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="flex items-baseline justify-between">
              <div>
                <h2 className="font-serif text-2xl text-foreground">Quizzes</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Check your understanding as you progress.
                </p>
              </div>
            </div>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {course.quizzes.map((q) => (
                <li
                  key={q.id}
                  className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ClipboardList className="h-3.5 w-3.5" />
                      <span>
                        {q.questions.length} questions · pass at {q.passingScore}%
                      </span>
                    </div>
                    <h3 className="mt-1 font-medium text-foreground">{q.title}</h3>
                    {q.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{q.description}</p>
                    )}
                  </div>
                  <Button asChild variant="outline" size="sm" className="shrink-0">
                    <Link
                      to="/learn/$slug"
                      params={{ slug: course.slug }}
                      search={{ quiz: q.id }}
                    >
                      <Play className="mr-1.5 h-3.5 w-3.5" /> Start
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Reviews ─────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex items-baseline gap-4">
            <h2 className="font-serif text-2xl text-foreground">Reviews</h2>
            {course.reviews.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {course.reviews.length} review{course.reviews.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {course.reviews.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No reviews yet.</p>
          ) : (
            <>
              {/* Rating distribution */}
              <div className="mt-6 flex items-center gap-6">
                <div className="text-center">
                  <div className="font-serif text-5xl text-foreground">
                    {avgRating.toFixed(1)}
                  </div>
                  <div className="mt-1 flex justify-center">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`h-4 w-4 ${n <= Math.round(avgRating) ? "fill-current text-accent" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">Course rating</div>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = course.reviews.filter((r) => Math.round(r.rating) === star).length;
                    const pct = course.reviews.length
                      ? Math.round((count / course.reviews.length) * 100)
                      : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-3 text-right text-muted-foreground">{star}</span>
                        <Star className="h-3 w-3 fill-current text-accent" />
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                          <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-6 text-muted-foreground">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review cards */}
              <ul className="mt-8 space-y-4">
                {course.reviews.map((r) => (
                  <li key={r.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{r.user}</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-current text-accent" : "text-muted-foreground/30"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.comment}</p>
                    <p className="mt-2 text-xs text-muted-foreground/60">{r.date}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      {/* ── Related courses ─────────────────────────────── */}
      {related.length > 0 && (
        <section className="border-t border-border bg-secondary/30">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="font-serif text-2xl text-foreground">More in {course.category}</h2>
              <Link
                to="/courses"
                search={{ category: course.category } as never}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                See all →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((c, i) => (
                <CourseCard key={c.id} course={c} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
