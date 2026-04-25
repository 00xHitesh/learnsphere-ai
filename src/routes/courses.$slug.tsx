import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, CheckCircle2, Circle, Heart, Star, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/courses/$slug")({ component: CourseDetailPage });

function CourseDetailPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { db, currentUser, enroll, isEnrolled, toggleWishlist, inWishlist, toggleLessonComplete, progress } = useStore();
  const course = db.courses.find((c) => c.slug === slug && c.approved);
  if (!course) return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="font-serif text-3xl">Course not found</h1>
      <Link to="/courses" className="mt-4 inline-block text-primary underline">Browse courses</Link>
    </div>
  );
  const enrolled = isEnrolled(course.id);
  const enrollment = currentUser ? db.enrollments.find((e) => e.userId === currentUser.id && e.courseId === course.id) : null;
  const pct = currentUser ? progress(course.id) : 0;
  const handleEnroll = () => {
    if (!currentUser) { toast.message("Please sign in to enroll"); navigate({ to: "/login" }); return; }
    if (course.price === 0) { enroll(course.id); toast.success("Enrolled. Happy learning."); }
    else navigate({ to: "/checkout/$slug", params: { slug: course.slug } });
  };
  return (
    <div>
      <div className="border-b border-border bg-secondary/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[2fr_1fr]">
          <div>
            <Link to="/courses" className="text-xs text-muted-foreground hover:text-foreground">← All courses</Link>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{course.category}</Badge><span>•</span><span>{course.level}</span>
            </div>
            <h1 className="font-serif mt-3 text-4xl text-foreground sm:text-5xl">{course.title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{course.description}</p>
            <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 fill-current text-accent" />{course.rating.toFixed(1)} rating</span>
              <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />{course.students.toLocaleString()} students</span>
              <span>By {course.instructor}</span>
            </div>
          </div>
          <aside className="self-start rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <div className="text-3xl font-medium text-foreground">{course.price === 0 ? "Free" : `$${course.price}`}</div>
            {enrolled ? (
              <div className="mt-4 space-y-3">
                <div className="text-xs text-muted-foreground">Your progress</div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                <div className="text-xs text-muted-foreground">{pct}% complete</div>
                <Button asChild className="w-full"><a href="#curriculum">Continue learning</a></Button>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <Button onClick={handleEnroll} className="w-full">{course.price === 0 ? "Enroll for free" : "Buy this course"}</Button>
                <Button variant="outline" onClick={() => { if (!currentUser) { navigate({ to: "/login" }); return; } toggleWishlist(course.id); toast.success(inWishlist(course.id) ? "Removed from wishlist" : "Saved to wishlist"); }} className="w-full">
                  <Heart className={`mr-2 h-4 w-4 ${inWishlist(course.id) ? "fill-current text-accent" : ""}`} />
                  {inWishlist(course.id) ? "Wishlisted" : "Add to wishlist"}
                </Button>
              </div>
            )}
            <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
              <div>{course.lessons.length} lessons</div><div>Lifetime access</div><div>Certificate of completion</div>
            </div>
          </aside>
        </div>
      </div>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-2 inline-flex items-center gap-2 text-xs text-accent"><Bot className="h-3 w-3" /> AI summary</div>
          <p className="text-sm leading-relaxed text-foreground">{course.summary}</p>
        </div>
      </section>
      <section id="curriculum" className="mx-auto max-w-6xl gap-10 px-4 py-8 sm:px-6 md:grid md:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="font-serif text-2xl text-foreground">Curriculum</h2>
          <ol className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
            {course.lessons.map((lesson, i) => {
              const completed = enrollment?.completedLessonIds.includes(lesson.id) ?? false;
              return (
                <li key={lesson.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <button onClick={() => enrolled && toggleLessonComplete(course.id, lesson.id)} disabled={!enrolled}>
                      {completed ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    <span className="truncate text-foreground">{i + 1}. {lesson.title}</span>
                    {lesson.preview && <Badge variant="outline" className="ml-1">Preview</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                </li>
              );
            })}
          </ol>
        </div>
        <div>
          <h2 className="font-serif text-2xl text-foreground">Preview</h2>
          <div className="mt-4 aspect-video overflow-hidden rounded-lg border border-border bg-black">
            <iframe title="Course preview" className="h-full w-full" src={course.lessons[0]?.videoUrl} allowFullScreen />
          </div>
          <h3 className="font-serif mt-10 text-xl text-foreground">Instructor</h3>
          <div className="mt-3 rounded-lg border border-border bg-card p-4">
            <div className="font-medium text-foreground">{course.instructor}</div>
            <p className="mt-1 text-sm text-muted-foreground">{course.instructorBio}</p>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="font-serif text-2xl text-foreground">Reviews</h2>
        {course.reviews.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No reviews yet.</p> : (
          <ul className="mt-4 space-y-4">
            {course.reviews.map((r) => (
              <li key={r.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{r.user}</span>
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><Star className="h-3.5 w-3.5 fill-current text-accent" />{r.rating}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
