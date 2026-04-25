import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero.jpg";
import { useAuth } from "@/lib/auth-store";
import { useCourses } from "@/lib/query/courses";
import { CourseCard } from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Compass, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const { currentUser } = useAuth();
  const { data: courses = [] } = useCourses();

  const featured = courses.slice(0, 6);
  const recommended = currentUser
    ? courses
        .filter(
          (c) =>
            currentUser.interests.length === 0 ||
            currentUser.interests.includes(c.category),
        )
        .slice(0, 3)
    : [];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-accent" />
              AI-assisted learning, gently done
            </span>
            <h1 className="font-serif mt-6 text-4xl leading-[1.05] text-foreground sm:text-5xl md:text-6xl">
              A quiet place
              <br /> to learn the things
              <br /> you've meant to learn.
            </h1>
            <p className="mt-6 max-w-md text-base text-muted-foreground sm:text-lg">
              Hand-picked courses, an AI study assistant, and a calm interface that gets out of your
              way.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to="/courses">
                  Browse courses <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to={currentUser ? "/dashboard" : "/register"}>
                  {currentUser ? "Open dashboard" : "Create an account"}
                </Link>
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
              <span>{courses.length} curated courses</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>AI study assistant</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>No noise</span>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elegant)]">
              <img
                src={heroImg}
                alt="Illustration of an open book with a rising sun"
                width={1536}
                height={1024}
                className="aspect-[3/2] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Recommended (only when signed in) */}
      {currentUser && recommended.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs text-accent">
                <Bot className="h-3 w-3" /> AI recommendations
              </span>
              <h2 className="font-serif mt-1 text-2xl text-foreground">
                Picked for you, {currentUser.name.split(" ")[0]}
              </h2>
            </div>
            <Link to="/courses" className="text-sm text-muted-foreground hover:text-foreground">
              See all →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((c, i) => (
              <CourseCard key={c.id} course={c} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Compass className="h-3 w-3" /> Browse
            </span>
            <h2 className="font-serif mt-1 text-3xl text-foreground">Featured courses</h2>
          </div>
          <Link to="/courses" className="text-sm text-muted-foreground hover:text-foreground">
            All courses →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((c, i) => (
            <CourseCard key={c.id} course={c} index={i} />
          ))}
        </div>
      </section>

      {/* Three pillars */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          {[
            {
              title: "Curation, not catalog.",
              body: "We'd rather have one good course than ten near-misses. Each one is reviewed, paced, and finished.",
            },
            {
              title: "An assistant, not a tutor.",
              body: "Our AI helps you find the right course, summarizes lessons, and answers questions — without pretending to be a teacher.",
            },
            {
              title: "Your time, respected.",
              body: "No streaks, no autoplay, no popups. Just the next lesson, when you're ready for it.",
            },
          ].map((p) => (
            <div key={p.title}>
              <h3 className="font-serif text-xl text-foreground">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
