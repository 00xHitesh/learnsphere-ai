import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth-store";
import { useTheme, type Theme } from "@/lib/theme-store";
import { Button } from "@/components/ui/button";
import { Menu, Moon, Sun, Monitor } from "lucide-react";
import { useState } from "react";

const THEME_CYCLE: Theme[] = ["light", "dark", "system"];

const THEME_ICON: Record<Theme, React.ReactNode> = {
  light: <Sun className="h-4 w-4" />,
  dark: <Moon className="h-4 w-4" />,
  system: <Monitor className="h-4 w-4" />,
};

const THEME_LABEL: Record<Theme, string> = {
  light: "Light mode",
  dark: "Dark mode",
  system: "System theme",
};

function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const next = THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length];
  return (
    <button
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${THEME_LABEL[next]}`}
      title={THEME_LABEL[theme]}
      className={`rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground ${className ?? ""}`}
    >
      {THEME_ICON[theme]}
    </button>
  );
}

export function Header() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link to="/" aria-label="Lumen home"><Logo /></Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground font-medium" }} inactiveProps={{ className: "text-muted-foreground" }} className="text-sm transition-colors hover:text-foreground">Home</Link>
            <Link to="/courses" activeProps={{ className: "text-foreground font-medium" }} inactiveProps={{ className: "text-muted-foreground" }} className="text-sm transition-colors hover:text-foreground">Courses</Link>
            <Link to="/live" activeProps={{ className: "text-foreground font-medium" }} inactiveProps={{ className: "text-muted-foreground" }} className="text-sm transition-colors hover:text-foreground">Live</Link>
            <Link to="/about" activeProps={{ className: "text-foreground font-medium" }} inactiveProps={{ className: "text-muted-foreground" }} className="text-sm transition-colors hover:text-foreground">About</Link>
            <Link to="/contact" activeProps={{ className: "text-foreground font-medium" }} inactiveProps={{ className: "text-muted-foreground" }} className="text-sm transition-colors hover:text-foreground">Contact</Link>
          </nav>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {currentUser ? (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/dashboard">Dashboard</Link></Button>
              {currentUser.role === "admin" && (
                <Button asChild variant="ghost" size="sm"><Link to="/admin">Admin</Link></Button>
              )}
              <Button asChild variant="ghost" size="sm"><Link to="/wishlist">Wishlist</Link></Button>
              <Button asChild variant="ghost" size="sm"><Link to="/account">Account</Link></Button>
              <Button size="sm" variant="outline" onClick={() => { logout(); navigate({ to: "/" }); }}>Sign out</Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/login">Sign in</Link></Button>
              <Button asChild size="sm" style={{ background: "var(--gradient-accent)" }} className="text-white hover:opacity-90">
                <Link to="/register">Join free</Link>
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button onClick={() => setOpen((o) => !o)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            <Link to="/" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-secondary">Home</Link>
            <Link to="/courses" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-secondary">Courses</Link>
            <Link to="/live" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-secondary">Live</Link>
            <Link to="/about" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-secondary">About</Link>
            <Link to="/contact" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-secondary">Contact</Link>
            <div className="my-2 h-px bg-border" />
            {currentUser ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-secondary">Dashboard</Link>
                {currentUser.role === "admin" && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-secondary">Admin</Link>
                )}
                <Link to="/wishlist" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-secondary">Wishlist</Link>
                <Link to="/account" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-secondary">Account</Link>
                <button onClick={() => { logout(); setOpen(false); navigate({ to: "/" }); }} className="rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-secondary">Sign in</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-primary-foreground" style={{ background: "var(--gradient-accent)" }}>Join free</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
