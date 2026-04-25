import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { CourseCard } from "@/components/CourseCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/wishlist")({ component: WishlistPage });

function WishlistPage() {
  const { db, currentUser } = useStore();
  if (!currentUser) return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="font-serif text-2xl">Please sign in</h1>
      <Button asChild className="mt-6"><Link to="/login">Sign in</Link></Button>
    </div>
  );
  const list = db.wishlists.filter((w) => w.userId === currentUser.id).map((w) => db.courses.find((c) => c.id === w.courseId)).filter((c): c is NonNullable<typeof c> => !!c);
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-4xl text-foreground sm:text-5xl">Wishlist</h1>
      <p className="mt-2 text-muted-foreground">Courses you've saved for later.</p>
      {list.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">Nothing here yet.</div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{list.map((c, i) => <CourseCard key={c.id} course={c} index={i} />)}</div>
      )}
    </div>
  );
}
