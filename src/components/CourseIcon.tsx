/**
 * Renders a Lucide icon representing a course category.
 * Falls back to BookOpen for any category not in the map.
 */
import { Palette, Code2, Paintbrush, Briefcase, PenLine, BookOpen } from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Design: Palette,
  Programming: Code2,
  Art: Paintbrush,
  Business: Briefcase,
  Writing: PenLine,
};

export function CourseIcon({ category, className }: { category: string; className?: string }) {
  const Icon = ICONS[category] ?? BookOpen;
  return <Icon className={className} />;
}
