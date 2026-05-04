import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero.jpg";
import { useAuth } from "@/lib/auth-store";
import { useCourses } from "@/lib/query/courses";
import { useLiveSessions } from "@/lib/query/liveSessions";
import { useFeatureFlag } from "@/lib/query/features";
import { CourseCard } from "@/components/CourseCard";
import { LiveSessionCard } from "@/components/LiveSessionCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Compass, Radio, Zap } from "lucide-react";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const { currentUser } = useAuth();
  const { data: courses = [] } = useCourses();

  const { data: allSessions = [] } = useLiveSessions();
  const liveSessionsEnabled = useFeatureFlag("live_sessions");

  const upcomingSessions = allSessions
    .filter((s) => {
      const now = Date.now();
      const start = new Date(s.scheduledAt).getTime();
      const end = start + s.durationMinutes * 60_000;
      return now < end;
    })
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3);

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
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
          <div
            className="absolute -top-40 -right-32 h-96 w-96 rounded-full opacity-25"
            style={{ background: "var(--gradient-accent)", filter: "blur(96px)" }}
          />
          <div
            className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full opacity-15"
            style={{ background: "var(--gradient-accent)", filter: "blur(72px)" }}
          />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
              <Zap className="h-3 w-3" />
              Built different. Learn faster.
            </span>
            <h1 className="font-serif mt-6 text-4xl leading-[1.05] text-foreground sm:text-5xl md:text-6xl">
              Level up your skills,
              <br />
              <span style={{ background: "var(--gradient-accent)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                not your stress.
              </span>
            </h1>
            <p className="mt-6 max-w-md text-base text-muted-foreground sm:text-lg">
              Actually good courses, an AI that doesn't gaslight you, and zero dark patterns. We're not like other platforms.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" style={{ background: "var(--gradient-accent)" }} className="text-white hover:opacity-90">
                <Link to="/courses">
                  Explore courses <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to={currentUser ? "/dashboard" : "/register"}>
                  {currentUser ? "My dashboard" : "Join for free"}
                </Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
              <span>{courses.length} handpicked courses</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>AI study sidekick</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>Zero BS</span>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-primary/15 bg-card shadow-(--shadow-elegant)">
              <img
                src={heroImg}
                alt="Illustration of an open book with a rising sun"
                width={1536}
                height={1024}
                className="aspect-3/2 w-full object-cover"
              />
            </div>
            <div
              className="absolute -bottom-3 -right-3 -z-10 h-full w-full rounded-2xl opacity-20"
              style={{ background: "var(--gradient-accent)" }}
            />
          </div>
        </div>
      </section>

      {/* Recommended (only when signed in) */}
      {currentUser && recommended.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent">
                <Bot className="h-3 w-3" /> The AI cooked for you
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

      {/* Live Sessions */}
      {liveSessionsEnabled && upcomingSessions.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
                <Radio className="h-3 w-3 animate-pulse" /> Live &amp; upcoming
              </span>
              <h2 className="font-serif mt-1 text-2xl text-foreground">
                Learn in real time
              </h2>
            </div>
            <Link to="/live" className="text-sm text-muted-foreground hover:text-foreground">
              All sessions →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingSessions.map((s) => (
              <LiveSessionCard key={s.id} session={s} compact />
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Compass className="h-3 w-3" /> Trending rn
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
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Quality over quantity.",
              body: "We'd rather have 10 courses that actually slap than 1,000 that make you fall asleep. Every course is reviewed, paced, and worth your time.",
            },
            {
              title: "Your AI study buddy.",
              body: "Summarizes lessons, answers your actual questions about the actual content, and hypes you up when you need it — without the creepy upsells.",
            },
            {
              title: "Zero toxic patterns.",
              body: "No fake streaks. No guilt-trip notifications. No autoplay traps. Just the next lesson, exactly when you're ready for it.",
            },
          ].map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-serif text-xl text-foreground">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
