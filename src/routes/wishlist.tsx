import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-store";
import { useCourses } from "@/lib/query/courses";
import { useMyWishlist, useToggleWishlist } from "@/lib/query/wishlist";
import { useMyEnrollments, useEnroll } from "@/lib/query/enrollments";
import { usePurchase } from "@/lib/query/transactions";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/CourseCard";
import { Heart, Star, BookOpen, Bookmark } from "lucide-react";
import { CourseIcon } from "@/components/CourseIcon";
import { toast } from "sonner";
import type { Course } from "@/lib/types";

export const Route = createFileRoute("/wishlist")({ component: WishlistPage });

function WishlistPage() {
  const { currentUser } = useAuth();
  const { data: courses = [] } = useCourses();
  const { data: wishlist = [] } = useMyWishlist(currentUser?.id);
  const { data: enrollments = [] } = useMyEnrollments(currentUser?.id);
  const toggleWishlist = useToggleWishlist();
  const enroll = useEnroll();
  const purchase = usePurchase();
  const navigate = useNavigate();

  if (!currentUser)
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-serif text-2xl">Please sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to view your saved courses.</p>
        <Button asChild className="mt-6">
          <Link to="/login">Sign in</Link>
        </Button>
      </div>
    );

  const wishlistIds = new Set(wishlist.map((w) => w.courseId));
  const enrolledIds = new Set(enrollments.map((e) => e.courseId));

  const list = wishlist
    .map((w) => courses.find((c) => c.id === w.courseId))
    .filter((c): c is Course => !!c);

  const totalValue = list.reduce((sum, c) => sum + c.price, 0);

  const recommendations = courses
    .filter((c) => !wishlistIds.has(c.id) && !enrolledIds.has(c.id))
    .slice(0, 3);

  function handleRemove(courseId: string) {
    toggleWishlist.mutate(
      { userId: currentUser!.id, courseId },
      { onSuccess: () => toast.success("Removed from wishlist") },
    );
  }

  async function handleEnroll(course: Course) {
    if (course.price === 0) {
      enroll.mutate(
        { userId: currentUser!.id, courseId: course.id },
        {
          onSuccess: () => {
            toast.success("Enrolled!");
            navigate({ to: "/dashboard" });
          },
        },
      );
    } else {
      navigate({ to: "/checkout/$slug", params: { slug: course.slug } });
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-foreground sm:text-5xl">Wishlist</h1>
          <p className="mt-2 text-muted-foreground">Courses you've saved for later.</p>
        </div>
        {list.length > 0 && (
          <div className="hidden shrink-0 text-right sm:block">
            <div className="text-xs text-muted-foreground">Total saved value</div>
            <div className="mt-0.5 font-serif text-2xl text-foreground">
              {totalValue === 0 ? "All free" : `$${totalValue}`}
            </div>
          </div>
        )}
      </div>

      {/* Summary bar */}
      {list.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-4 rounded-xl border border-border bg-card px-5 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bookmark className="h-4 w-4 text-primary" />
            <span>
              <span className="font-medium text-foreground">{list.length}</span>{" "}
              {list.length === 1 ? "course" : "courses"} saved
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>
              <span className="font-medium text-foreground">
                {list.filter((c) => c.price === 0).length}
              </span>{" "}
              free
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 text-primary" />
            <span>
              Avg rating{" "}
              <span className="font-medium text-foreground">
                {(list.reduce((s, c) => s + c.rating, 0) / list.length).toFixed(1)}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Wishlist items */}
      {list.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border p-12 text-center">
          <Heart className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-muted-foreground">Nothing saved yet.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/courses">Browse courses</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {list.map((course) => {
            const enrolled = enrolledIds.has(course.id);
            return (
              <WishlistCard
                key={course.id}
                course={course}
                enrolled={enrolled}
                onRemove={() => handleRemove(course.id)}
                onAction={() => {
                  if (enrolled) {
                    navigate({ to: "/dashboard" });
                  } else {
                    handleEnroll(course);
                  }
                }}
                actionPending={enroll.isPending || purchase.isPending}
              />
            );
          })}
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-2xl text-foreground">You might also like</h2>
          <p className="mt-1 text-sm text-muted-foreground">Courses not yet in your wishlist.</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((c, i) => (
              <CourseCard key={c.id} course={c} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function WishlistCard({
  course,
  enrolled,
  onRemove,
  onAction,
  actionPending,
}: {
  course: Course;
  enrolled: boolean;
  onRemove: () => void;
  onAction: () => void;
  actionPending: boolean;
}) {
  const actionLabel = enrolled
    ? "Continue learning"
    : course.price === 0
      ? "Enroll for free"
      : `Buy — $${course.price}`;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md sm:flex-row sm:items-center">
      {/* Cover */}
      <Link
        to="/courses/$slug"
        params={{ slug: course.slug }}
        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"
      >
        <CourseIcon category={course.category} className="h-9 w-9" />
      </Link>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <Link
          to="/courses/$slug"
          params={{ slug: course.slug }}
          className="font-medium text-foreground hover:text-primary"
        >
          {course.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{course.instructor}</span>
          <span className="hidden sm:inline">·</span>
          <span>{course.category}</span>
          <span className="hidden sm:inline">·</span>
          <span className="capitalize">{course.level}</span>
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="font-medium text-foreground">{course.rating.toFixed(1)}</span>
          <span className="text-muted-foreground">({course.students.toLocaleString()} students)</span>
        </div>
      </div>

      {/* Price + actions */}
      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end sm:gap-3">
        <div className="font-serif text-lg text-foreground">
          {course.price === 0 ? "Free" : `$${course.price}`}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onAction} disabled={actionPending}>
            {actionLabel}
          </Button>
          <button
            onClick={onRemove}
            title="Remove from wishlist"
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Heart className="h-4 w-4 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
