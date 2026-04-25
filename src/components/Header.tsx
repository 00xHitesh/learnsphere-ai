import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

export function Header() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link to="/" aria-label="Lumen home"><Logo /></Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground" }} inactiveProps={{ className: "text-muted-foreground" }} className="text-sm hover:text-foreground">Home</Link>
            <Link to="/courses" activeProps={{ className: "text-foreground" }} inactiveProps={{ className: "text-muted-foreground" }} className="text-sm hover:text-foreground">Courses</Link>
            <Link to="/about" activeProps={{ className: "text-foreground" }} inactiveProps={{ className: "text-muted-foreground" }} className="text-sm hover:text-foreground">About</Link>
            <Link to="/contact" activeProps={{ className: "text-foreground" }} inactiveProps={{ className: "text-muted-foreground" }} className="text-sm hover:text-foreground">Contact</Link>
          </nav>
        </div>
        <div className="hidden items-center gap-2 md:flex">
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
              <Button asChild size="sm"><Link to="/register">Get started</Link></Button>
            </>
          )}
        </div>
        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            <Link to="/" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-secondary">Home</Link>
            <Link to="/courses" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-secondary">Courses</Link>
            <Link to="/about" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-secondary">About</Link>
            <Link to="/contact" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-secondary">Contact</Link>
            <div className="my-2 h-px bg-border" />
            {currentUser ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-secondary">Dashboard</Link>
                {currentUser.role === "admin" && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-secondary">Admin</Link>
                )}
                <Link to="/wishlist" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-secondary">Wishlist</Link>
                <Link to="/account" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-secondary">Account</Link>
                <button onClick={() => { logout(); setOpen(false); navigate({ to: "/" }); }} className="rounded-md px-3 py-2 text-left text-sm hover:bg-secondary">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-secondary">Sign in</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}