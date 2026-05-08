/**
 * Four-column site footer with brand tagline, nav links, and demo credentials.
 * Rendered by Layout so it appears on every page.
 */
import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              A quiet place to learn the things you've been meaning to learn.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-medium text-foreground">Learn</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/courses" className="hover:text-foreground">Browse courses</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-medium text-foreground">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-medium text-foreground">Demo accounts</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Student: <span className="text-foreground">demo@lumen.io</span> / demo1234</li>
              <li>Admin: <span className="text-foreground">admin@lumen.io</span> / admin123</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Lumen. A demo learning platform.
        </div>
      </div>
    </footer>
  );
}