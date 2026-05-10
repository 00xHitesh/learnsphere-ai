import { useEffect, useState } from "react";
import { useRegions, useCurrencies } from "@/lib/query/locale";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

interface RegionPickerProps {
  onConfirm: (regionCode: string, currencyCode: string) => Promise<void>;
  onSkip: () => void;
}

/**
 * Full-page region/currency selector shown after registration when the browser
 * locale could not be mapped to a known region automatically.
 */
export function RegionPicker({ onConfirm, onSkip }: RegionPickerProps) {
  const { data: regions = [] } = useRegions();
  const { data: currencies = [] } = useCurrencies();
  const [regionCode, setRegionCode] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (regions.length > 0 && !regionCode) {
      setRegionCode(regions[0].code);
      setCurrencyCode(regions[0].defaultCurrencyCode);
    }
  }, [regions, regionCode]);

  const handleRegionChange = (code: string) => {
    setRegionCode(code);
    const region = regions.find((r) => r.code === code);
    if (region) setCurrencyCode(region.defaultCurrencyCode);
  };

  const handleConfirm = async () => {
    if (!regionCode) return;
    setSaving(true);
    await onConfirm(regionCode, currencyCode);
    setSaving(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Globe className="mx-auto mb-3 h-8 w-8 text-primary" />
          <h1 className="font-serif text-3xl text-foreground">Where are you based?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We'll show prices in your local currency. You can always change this in your profile.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-xs text-muted-foreground">Country / Region</span>
            <select
              value={regionCode}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
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
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </label>

          <Button
            onClick={handleConfirm}
            disabled={!regionCode || saving}
            className="w-full text-white hover:opacity-90"
            style={{ background: "var(--gradient-accent)" }}
          >
            {saving ? "Saving…" : "Set my currency →"}
          </Button>

          <button
            type="button"
            onClick={onSkip}
            className="w-full text-center text-sm text-muted-foreground underline-offset-2 hover:underline"
          >
            Skip for now, use USD
          </button>
        </div>
      </div>
    </div>
  );
}
