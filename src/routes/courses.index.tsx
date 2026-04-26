import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCourses } from "@/lib/query/courses";
import { CourseCard } from "@/components/CourseCard";
import { categories } from "@/lib/seed";
import { Search } from "lucide-react";

export const Route = createFileRoute("/courses/")({
  head: () => ({
    meta: [
      { title: "Courses — Lumen" },
      {
        name: "description",
        content: "Browse curated courses across design, programming, art, business, and writing.",
      },
      { property: "og:title", content: "Courses — Lumen" },
      { property: "og:description", content: "Browse curated courses across many disciplines." },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  const { data: allCourses = [] } = useCourses();
  const [category, setCategory] = useState<string>("All");
  const [price, setPrice] = useState<"all" | "free" | "paid">("all");
  const [sort, setSort] = useState<"popular" | "newest" | "price-low" | "price-high">("popular");
  const [q, setQ] = useState("");

  const courses = useMemo(() => {
    let list = [...allCourses];
    if (category !== "All") list = list.filter((c) => c.category === category);
    if (price === "free") list = list.filter((c) => c.price === 0);
    if (price === "paid") list = list.filter((c) => c.price > 0);
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(needle) ||
          c.tags.join(" ").toLowerCase().includes(needle) ||
          c.instructor.toLowerCase().includes(needle),
      );
    }
    switch (sort) {
      case "newest":
        return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      case "price-low":
        return [...list].sort((a, b) => a.price - b.price);
      case "price-high":
        return [...list].sort((a, b) => b.price - a.price);
      default:
        return [...list].sort((a, b) => b.students - a.students);
    }
  }, [allCourses, category, price, sort, q]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="font-serif text-4xl text-foreground sm:text-5xl">Courses</h1>
        <p className="mt-2 text-muted-foreground">
          {allCourses.length} curated courses, ready when you are.
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search courses, tags, or instructors"
            className="w-full rounded-md border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={price}
            onChange={(e) => setPrice(e.target.value as typeof price)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="all">All prices</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="popular">Most popular</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          No courses match those filters.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c, i) => (
            <CourseCard key={c.id} course={c} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}