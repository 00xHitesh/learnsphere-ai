/**
 * Brand mark: gradient square badge ("L") alongside the "Lumen" wordmark.
 * Uses var(--gradient-accent) so it automatically adapts to theme changes.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center rounded-lg text-sm font-bold text-white"
        style={{ background: "var(--gradient-accent)" }}
      >
        L
      </span>
      <span className="text-base font-bold tracking-tight text-foreground">Lumen</span>
    </span>
  );
}
