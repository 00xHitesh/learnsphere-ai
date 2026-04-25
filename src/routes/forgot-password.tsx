import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AuthFrame, Field } from "./login";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPasswordPage });

function ForgotPasswordPage() {
  const { requestReset } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { const t = await requestReset(email); setToken(t); toast.success("Reset link generated. (Demo)"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  };
  return (
    <AuthFrame title="Forgot your password?" subtitle="Enter your email and we'll generate a reset link.">
      {!token ? (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</Button>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">In a real app we'd email a link. For this demo, click below to reset your password.</p>
          <Button className="w-full" onClick={() => navigate({ to: "/reset-password", search: { token } })}>Continue to reset</Button>
        </div>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground"><Link to="/login" className="hover:text-foreground">Back to sign in</Link></p>
    </AuthFrame>
  );
}
