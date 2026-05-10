/**
 * Course grid card. Shows a coloured cover tile, category badge, title, 2-line
 * summary, rating, student count, and price. Links to /courses/:slug on click.
 * The cover color cycles through a 4-tone oklch palette keyed by the `index` prop.
 */
import { Link } from "@tanstack/react-router";
import type { Course } from "@/lib/types";
import { usePriceFormatter } from "@/lib/query/locale";
import { Star, Users } from "lucide-react";
import { CourseIcon } from "./CourseIcon";

const palette = [
  "bg-[oklch(0.92_0.08_290)] text-[oklch(0.28_0.15_285)]",
  "bg-[oklch(0.92_0.08_340)] text-[oklch(0.32_0.15_335)]",
  "bg-[oklch(0.91_0.07_200)] text-[oklch(0.28_0.10_200)]",
  "bg-[oklch(0.93_0.07_145)] text-[oklch(0.28_0.08_145)]",
];

export function CourseCard({ course, index = 0 }: { course: Course; index?: number }) {
  const tone = palette[index % palette.length];
  const format = usePriceFormatter();
  const effectivePrice = course.salePrice ?? course.listPrice;
  const discountPct =
    course.salePrice !== undefined
      ? Math.round((1 - course.salePrice / course.listPrice) * 100)
      : 0;

  return (
    <Link
      to="/courses/$slug"
      params={{ slug: course.slug }}
      className="group block overflow-hidden rounded-2xl border border-border/70 bg-card transition-all hover:-translate-y-1 hover:shadow-(--shadow-soft)"
    >
      <div className={`flex aspect-5/3 items-center justify-center ${tone}`}>
        <CourseIcon category={course.category} className="h-14 w-14 opacity-80" />
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">{course.category}</span>
          <span>{course.level}</span>
        </div>
        <h3 className="font-serif text-lg leading-snug text-foreground">{course.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{course.summary}</p>
        <div className="flex items-center justify-between pt-2 text-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-current text-accent" />
              {course.rating.toFixed(1)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {course.students.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-foreground">{format(effectivePrice)}</span>
            {discountPct > 0 && (
              <>
                <span className="text-xs text-muted-foreground line-through">
                  {format(course.listPrice)}
                </span>
                <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                  {discountPct}% OFF
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
