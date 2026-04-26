import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CourseCard } from "../CourseCard";
import type { Course } from "@/lib/types";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, params, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; params?: Record<string, string> }) => (
    <a href={`${to}/${params?.slug ?? ""}`} {...rest}>
      {children}
    </a>
  ),
}));

const base: Course = {
  id: "c-1",
  title: "Intro to Design",
  slug: "intro-to-design",
  description: "A beginner design course",
  summary: "Learn design fundamentals fast.",
  category: "Design",
  level: "Beginner",
  price: 0,
  rating: 4.7,
  students: 1234,
  instructor: "Jane Doe",
  instructorBio: "Bio",
  cover: "✦",
  lessons: [],
  reviews: [],
  quizzes: [],
  tags: [],
  approved: true,
  createdAt: "2025-01-01",
};

describe("CourseCard", () => {
  it("renders the course title", () => {
    render(<CourseCard course={base} />);
    expect(screen.getByText("Intro to Design")).toBeInTheDocument();
  });

  it("renders the category", () => {
    render(<CourseCard course={base} />);
    expect(screen.getByText("Design")).toBeInTheDocument();
  });

  it("renders the level", () => {
    render(<CourseCard course={base} />);
    expect(screen.getByText("Beginner")).toBeInTheDocument();
  });

  it("renders the summary", () => {
    render(<CourseCard course={base} />);
    expect(screen.getByText("Learn design fundamentals fast.")).toBeInTheDocument();
  });

  it("shows 'Free' for a price of 0", () => {
    render(<CourseCard course={base} />);
    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("shows formatted price for paid courses", () => {
    render(<CourseCard course={{ ...base, price: 39 }} />);
    expect(screen.getByText("$39")).toBeInTheDocument();
  });

  it("renders the rating", () => {
    render(<CourseCard course={base} />);
    expect(screen.getByText("4.7")).toBeInTheDocument();
  });

  it("renders the student count", () => {
    render(<CourseCard course={base} />);
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });

  it("links to the correct course slug", () => {
    render(<CourseCard course={base} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toContain("intro-to-design");
  });

  it("renders the cover emoji", () => {
    render(<CourseCard course={base} />);
    expect(screen.getByText("✦")).toBeInTheDocument();
  });
});
