import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AuthFrame, Field } from "./login";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    setLoading(true);
    try { await register(name, email, password); toast.success("Account created"); navigate({ to: "/dashboard" }); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Registration failed"); }
    finally { setLoading(false); }
  };
  return (
    <AuthFrame title="Create your account" subtitle="A calmer way to learn online.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name" value={name} onChange={setName} required />
        <Field label="Email" type="email" value={email} onChange={setEmail} required />
        <Field label="Password" type="password" value={password} onChange={setPassword} required />
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating…" : "Create account"}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">Already have an account? <Link to="/login" className="text-foreground underline">Sign in</Link></p>
    </AuthFrame>
  );
}
