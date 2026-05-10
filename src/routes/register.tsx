import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useRegions } from "@/lib/query/locale";
import { detectRegionCode } from "@/lib/utils/currency";
import { RegionPicker } from "@/components/RegionPicker";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AuthFrame, Field } from "./login";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
  const { register, updateLocale } = useAuth();
  const navigate = useNavigate();
  const { data: regions = [] } = useRegions();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password needs at least 6 characters — make it a good one!"); return; }
    setLoading(true);
    try {
      await register(name, email, password);
      const detected = detectRegionCode();
      const region = detected ? regions.find((r) => r.code === detected) : null;
      if (region) {
        await updateLocale(region.code, region.defaultCurrencyCode);
        toast.success("You're in! Welcome to the squad.");
        navigate({ to: "/dashboard" });
      } else {
        setShowRegionPicker(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
      setLoading(false);
    }
  };

  if (showRegionPicker) {
    return (
      <RegionPicker
        onConfirm={async (regionCode, currencyCode) => {
          await updateLocale(regionCode, currencyCode);
          toast.success("You're in! Welcome to the squad.");
          navigate({ to: "/dashboard" });
        }}
        onSkip={() => {
          toast.success("You're in! Welcome to the squad.");
          navigate({ to: "/dashboard" });
        }}
      />
    );
  }

  return (
    <AuthFrame title="Join the wave" subtitle="Takes 30 seconds. No credit card. No nonsense.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Your name" value={name} onChange={setName} required />
        <Field label="Email" type="email" value={email} onChange={setEmail} required />
        <Field label="Password" type="password" value={password} onChange={setPassword} required />
        <Button
          type="submit"
          className="w-full text-white hover:opacity-90"
          style={{ background: "var(--gradient-accent)" }}
          disabled={loading}
        >
          {loading ? "Creating your account…" : "Create account →"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary underline">Sign in</Link>
      </p>
    </AuthFrame>
  );
}
