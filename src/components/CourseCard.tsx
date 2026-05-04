import { Link } from "@tanstack/react-router";
import type { Course } from "@/lib/types";
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
          <span className="font-bold text-foreground">
            {course.price === 0 ? "Free" : `$${course.price}`}
          </span>
        </div>
      </div>
    </Link>
  );
}
