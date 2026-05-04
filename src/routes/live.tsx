import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveSessions } from "@/lib/query/liveSessions";
import { useFeatureFlag } from "@/lib/query/features";
import { LiveSessionCard } from "@/components/LiveSessionCard";
import { Button } from "@/components/ui/button";
import { Radio } from "lucide-react";

export const Route = createFileRoute("/live")({ component: LivePage });

function LivePage() {
  const { data: sessions = [] } = useLiveSessions();
  const enabled = useFeatureFlag("live_sessions");

  if (!enabled) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <Radio className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="font-serif mt-4 text-2xl text-foreground">Live sessions are off</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This feature has been temporarily disabled. Check back soon.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    );
  }

  const live = sessions.filter((s) => {
    const now = Date.now();
    const start = new Date(s.scheduledAt).getTime();
    return now >= start && now < start + s.durationMinutes * 60_000;
  });
  const upcoming = sessions.filter((s) => new Date(s.scheduledAt).getTime() > Date.now());
  const ended = sessions.filter((s) => {
    const start = new Date(s.scheduledAt).getTime();
    return Date.now() >= start + s.durationMinutes * 60_000;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
          <Radio className="h-3 w-3 animate-pulse" /> Live & upcoming
        </span>
        <h1 className="font-serif mt-4 text-4xl text-foreground sm:text-5xl">
          Learn in real time.
        </h1>
        <p className="mt-3 max-w-lg text-muted-foreground">
          Live sessions, workshops, and office hours with your instructors. Show up, ask questions,
          actually learn stuff.
        </p>
      </div>

      {live.length > 0 && (
        <section className="mb-10">
          <h2 className="font-serif mb-4 text-2xl text-foreground">Happening now</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {live.map((s) => (
              <LiveSessionCard key={s.id} session={s} />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="mb-10">
          <h2 className="font-serif mb-4 text-2xl text-foreground">Coming up</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {upcoming.map((s) => (
              <LiveSessionCard key={s.id} session={s} />
            ))}
          </div>
        </section>
      )}

      {ended.length > 0 && (
        <section>
          <h2 className="font-serif mb-4 text-xl text-muted-foreground">Past sessions</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {ended.map((s) => (
              <LiveSessionCard key={s.id} session={s} />
            ))}
          </div>
        </section>
      )}

      {sessions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No sessions scheduled yet. Check back soon.
        </div>
      )}
    </div>
  );
}
