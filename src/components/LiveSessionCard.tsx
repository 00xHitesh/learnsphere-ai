import { useEffect, useState } from "react";
import type { LiveSession } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CalendarClock, Users, Radio } from "lucide-react";

function getStatus(scheduledAt: string, durationMinutes: number) {
  const now = Date.now();
  const start = new Date(scheduledAt).getTime();
  const end = start + durationMinutes * 60_000;
  if (now >= start && now < end) return "live" as const;
  if (now < start) return "upcoming" as const;
  return "ended" as const;
}

function formatCountdown(scheduledAt: string): string {
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff <= 0) return "";
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function formatDateTime(scheduledAt: string) {
  return new Date(scheduledAt).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

interface Props {
  session: LiveSession;
  compact?: boolean;
}

export function LiveSessionCard({ session, compact = false }: Props) {
  const [status, setStatus] = useState(() =>
    getStatus(session.scheduledAt, session.durationMinutes),
  );
  const [countdown, setCountdown] = useState(() => formatCountdown(session.scheduledAt));

  useEffect(() => {
    const id = setInterval(() => {
      setStatus(getStatus(session.scheduledAt, session.durationMinutes));
      setCountdown(formatCountdown(session.scheduledAt));
    }, 1_000);
    return () => clearInterval(id);
  }, [session.scheduledAt, session.durationMinutes]);

  const isLive = status === "live";
  const isUpcoming = status === "upcoming";

  return (
    <div
      className={`rounded-2xl border bg-card transition-shadow hover:shadow-(--shadow-soft) ${
        isLive ? "border-accent/40" : "border-border"
      } ${compact ? "p-4" : "p-5"}`}
    >
      {/* Status badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
              <Radio className="h-3 w-3 animate-pulse" /> LIVE NOW
            </span>
          )}
          {isUpcoming && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <CalendarClock className="h-3 w-3" /> Upcoming
            </span>
          )}
          {status === "ended" && (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
              Ended
            </span>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
          {session.topic}
        </span>
      </div>

      {/* Title + instructor */}
      <h3 className={`font-serif mt-3 leading-snug text-foreground ${compact ? "text-base" : "text-lg"}`}>
        {session.title}
      </h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{session.instructor}</p>

      {!compact && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {session.description}
        </p>
      )}

      {/* Meta row */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{formatDateTime(session.scheduledAt)}</span>
        <span>{session.durationMinutes} min</span>
        <span className="inline-flex items-center gap-1">
          <Users className="h-3 w-3" />
          {session.registeredCount.toLocaleString()} / {session.maxAttendees.toLocaleString()}
        </span>
      </div>

      {/* Countdown or join */}
      <div className="mt-4">
        {isLive && (
          <Button
            asChild
            size="sm"
            className="w-full text-white hover:opacity-90"
            style={{ background: "var(--gradient-accent)" }}
          >
            <a href={session.joinUrl} target="_blank" rel="noopener noreferrer">
              Join now →
            </a>
          </Button>
        )}
        {isUpcoming && countdown && (
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm font-medium text-primary tabular-nums">
              {countdown}
            </span>
            <Button asChild size="sm" variant="outline">
              <a href={session.joinUrl} target="_blank" rel="noopener noreferrer">
                Register
              </a>
            </Button>
          </div>
        )}
        {status === "ended" && (
          <p className="text-xs text-muted-foreground">This session has ended.</p>
        )}
      </div>
    </div>
  );
}
