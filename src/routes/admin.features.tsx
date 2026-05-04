import { createFileRoute } from "@tanstack/react-router";
import { useFeatureFlags, useToggleFeatureFlag } from "@/lib/query/features";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/features")({ component: AdminFeatures });

function AdminFeatures() {
  const { data: flags = [] } = useFeatureFlags();
  const toggleMutation = useToggleFeatureFlag();

  const handleToggle = (name: string, currentlyEnabled: boolean) => {
    toggleMutation.mutate(name, {
      onSuccess: () =>
        toast.success(`"${name}" ${currentlyEnabled ? "disabled" : "enabled"}`),
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-2xl text-foreground">Feature Flags</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Toggle features on or off for all users. Changes take effect immediately.
        </p>
      </div>
      <ul className="space-y-3">
        {flags.map((flag) => (
          <li
            key={flag.id}
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-5"
          >
            <div className="min-w-0 flex-1 pr-6">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{flag.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    flag.enabled
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {flag.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{flag.description}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground/60">{flag.name}</p>
            </div>
            <button
              onClick={() => handleToggle(flag.name, flag.enabled)}
              disabled={toggleMutation.isPending}
              aria-label={`${flag.enabled ? "Disable" : "Enable"} ${flag.label}`}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
                flag.enabled ? "bg-primary" : "bg-secondary"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                  flag.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
