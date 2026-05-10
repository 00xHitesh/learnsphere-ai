import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useRegions, useCurrencies } from "@/lib/query/locale";
import { Button } from "@/components/ui/button";
import { categories } from "@/lib/seed";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({ component: AccountPage });

function AccountPage() {
  const { currentUser, updateInterests, updateLocale } = useAuth();
  const { data: regions = [] } = useRegions();
  const { data: currencies = [] } = useCurrencies();

  if (!currentUser)
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-serif text-2xl">Please sign in</h1>
        <Button asChild className="mt-6">
          <Link to="/login">Sign in</Link>
        </Button>
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-4xl text-foreground sm:text-5xl">Account</h1>
      <div className="mt-8 space-y-8">
        {/* Profile */}
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

        {/* Region & Currency */}
        <LocaleSection
          currentRegionCode={currentUser.regionCode}
          currentCurrencyCode={currentUser.currencyCode}
          regions={regions}
          currencies={currencies}
          onSave={async (regionCode, currencyCode) => {
            try {
              await updateLocale(regionCode, currencyCode);
              toast.success("Region and currency updated");
            } catch {
              toast.error("Failed to update locale");
            }
          }}
        />

        {/* Interests */}
        <InterestsSection
          initialInterests={currentUser.interests}
          onSave={async (interests) => {
            try {
              await updateInterests(interests);
              toast.success("Interests updated");
            } catch {
              toast.error("Failed to update interests");
            }
          }}
        />
      </div>
    </div>
  );
}

function LocaleSection({
  currentRegionCode,
  currentCurrencyCode,
  regions,
  currencies,
  onSave,
}: {
  currentRegionCode: string;
  currentCurrencyCode: string;
  regions: { code: string; name: string; defaultCurrencyCode: string }[];
  currencies: { code: string; symbol: string; name: string }[];
  onSave: (regionCode: string, currencyCode: string) => Promise<void>;
}) {
  const [regionCode, setRegionCode] = useState(currentRegionCode);
  const [currencyCode, setCurrencyCode] = useState(currentCurrencyCode);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRegionCode(currentRegionCode);
    setCurrencyCode(currentCurrencyCode);
  }, [currentRegionCode, currentCurrencyCode]);

  const handleRegionChange = (code: string) => {
    setRegionCode(code);
    const region = regions.find((r) => r.code === code);
    if (region) setCurrencyCode(region.defaultCurrencyCode);
  };

  const isDirty = regionCode !== currentRegionCode || currencyCode !== currentCurrencyCode;

  const save = async () => {
    setSaving(true);
    await onSave(regionCode, currencyCode);
    setSaving(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="font-serif text-lg">Region &amp; Currency</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Prices will be shown in your selected currency across the site.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs text-muted-foreground">Country / Region</span>
          <select
            value={regionCode}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {regions.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Currency</span>
          <select
            value={currencyCode}
            onChange={(e) => setCurrencyCode(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Button className="mt-6" onClick={save} disabled={!isDirty || saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

function InterestsSection({
  initialInterests,
  onSave,
}: {
  initialInterests: string[];
  onSave: (interests: string[]) => Promise<void>;
}) {
  const [selected, setSelected] = useState<string[]>(initialInterests);
  const options = categories.filter((c) => c !== "All");
  const toggle = (c: string) =>
    setSelected((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  return (
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
      <Button className="mt-6" onClick={() => onSave(selected)}>
        Save
      </Button>
    </div>
  );
}
