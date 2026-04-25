import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AuthFrame, Field } from "./login";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s: Record<string, unknown>) => ({ token: typeof s.token === "string" ? s.token : "" }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const { resetPassword } = useStore();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    setLoading(true);
    try { await resetPassword(token, password); toast.success("Password updated. Please sign in."); navigate({ to: "/login" }); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  };
  if (!token) return (
    <AuthFrame title="Invalid link" subtitle="This reset link is missing a token.">
      <Button asChild className="w-full"><Link to="/forgot-password">Request a new link</Link></Button>
    </AuthFrame>
  );
  return (
    <AuthFrame title="Reset password" subtitle="Choose a new password for your account.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="New password" type="password" value={password} onChange={setPassword} required />
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Updating…" : "Update password"}</Button>
      </form>
    </AuthFrame>
  );
}
