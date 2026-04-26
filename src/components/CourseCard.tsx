import { Link } from "@tanstack/react-router";
import type { Course } from "@/lib/types";
import { Star, Users } from "lucide-react";
import { CourseIcon } from "./CourseIcon";

const palette = [
  "bg-[oklch(0.92_0.04_85)] text-[oklch(0.35_0.06_60)]",
  "bg-[oklch(0.88_0.05_145)] text-[oklch(0.3_0.05_145)]",
  "bg-[oklch(0.9_0.06_55)] text-[oklch(0.35_0.08_50)]",
  "bg-[oklch(0.9_0.04_220)] text-[oklch(0.3_0.05_220)]",
];

export function CourseCard({ course, index = 0 }: { course: Course; index?: number }) {
  const tone = palette[index % palette.length];
  return (
    <Link
      to="/courses/$slug"
      params={{ slug: course.slug }}
      className="group block overflow-hidden rounded-xl border border-border/70 bg-card transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
    >
      <div className={`flex aspect-5/3 items-center justify-center ${tone}`}>
        <CourseIcon category={course.category} className="h-14 w-14 opacity-75" />
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="rounded-full bg-secondary px-2.5 py-1">{course.category}</span>
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
          <span className="font-medium text-foreground">
            {course.price === 0 ? "Free" : `$${course.price}`}
          </span>
        </div>
      </div>
    </Link>
  );
}