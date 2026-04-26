import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { AuthFrame, Field } from "./login";

export const Route = createFileRoute("/admin-login")({ component: AdminLoginPage });

function AdminLoginPage() {
  const { login, logout, currentUser, mounted } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect already-authenticated admin away from this page
  useEffect(() => {
    if (mounted && currentUser?.role === "admin") {
      navigate({ to: "/admin" });
    }
  }, [mounted, currentUser, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role !== "admin") {
        logout();
        toast.error("This portal is for administrators only.");
        return;
      }
      toast.success(`Welcome, ${user.name.split(" ")[0]}`);
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame
      title={
        <span className="flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" />
          Admin Portal
        </span>
      }
      subtitle="Restricted to administrators only."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Admin email" type="email" value={email} onChange={setEmail} required />
        <Field label="Password" type="password" value={password} onChange={setPassword} required />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in as admin"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Not an admin?{" "}
        <Link to="/login" className="text-foreground underline">
          Student login
        </Link>
      </p>

      <div className="mt-8 rounded-md border border-dashed border-border bg-secondary/50 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Demo admin account</p>
        <p>admin@lumen.io / admin123</p>
      </div>
    </AuthFrame>
  );
}
