export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-serif text-lg leading-none"
      >
        L
      </span>
      <span className="font-serif text-lg tracking-tight text-foreground">Lumen</span>
    </span>
  );
}