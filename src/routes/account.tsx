import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { categories } from "@/lib/seed";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({ component: AccountPage });

function AccountPage() {
  const { currentUser, updateInterests } = useAuth();
  if (!currentUser)
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-serif text-2xl">Please sign in</h1>
        <Button asChild className="mt-6">
          <Link to="/login">Sign in</Link>
        </Button>
      </div>
    );

  const [selected, setSelected] = useState<string[]>(currentUser.interests);
  const options = categories.filter((c) => c !== "All");
  const toggle = (c: string) =>
    setSelected((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  const save = async () => {
    try {
      await updateInterests(selected);
      toast.success("Interests updated");
    } catch {
      toast.error("Failed to update interests");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-4xl text-foreground sm:text-5xl">Account</h1>
      <div className="mt-8 space-y-8">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-serif text-lg">Profile</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Name</dt>
              <dd>{currentUser.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{currentUser.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Role</dt>
              <dd className="capitalize">{currentUser.role}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-serif text-lg">Interests</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We'll use these to recommend courses.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {options.map((c) => {
              const on = selected.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggle(c)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${on ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-foreground"}`}
                >
                  {c}
                </button>
              );
            })}
          </div>
          <Button className="mt-6" onClick={save}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
