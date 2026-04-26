import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useCourse } from "@/lib/query/courses";
import { usePurchase } from "@/lib/query/transactions";
import { Button } from "@/components/ui/button";
import { CourseIcon } from "@/components/CourseIcon";
import { toast } from "sonner";
import { Lock, Tag } from "lucide-react";

export const Route = createFileRoute("/checkout/$slug")({ component: CheckoutPage });

const PROMO_CODES: Record<string, number> = {
  WELCOME: 0.1,
  SUMMER20: 0.2,
  STUDY50: 0.5,
};

function CheckoutPage() {
  const { slug } = Route.useParams();
  const { currentUser } = useAuth();
  const { data: course, isLoading } = useCourse(slug);
  const purchaseMutation = usePurchase();
  const navigate = useNavigate();
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (code === promoApplied) { toast.info("Promo already applied"); return; }
    if (PROMO_CODES[code] !== undefined) {
      setDiscount(PROMO_CODES[code]);
      setPromoApplied(code);
      toast.success(`${Math.round(PROMO_CODES[code] * 100)}% discount applied`);
    } else {
      toast.error("Invalid promo code");
    }
  };

  if (!currentUser)
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-serif text-2xl">Please sign in to continue</h1>
        <Button asChild className="mt-6">
          <Link to="/login">Sign in</Link>
        </Button>
      </div>
    );

  if (isLoading)
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );

  if (!course)
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-serif text-2xl">Course not found</h1>
      </div>
    );

  const finalPrice = +(course.price * (1 - discount)).toFixed(2);
  const discountAmount = +(course.price * discount).toFixed(2);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await purchaseMutation.mutateAsync({ userId: currentUser.id, courseId: course.id });
      toast.success("Payment successful");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    }
  };

  const Field = ({ label, defaultValue }: { label: string; defaultValue?: string }) => (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );

  return (
    <div className="mx-auto grid max-w-4xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.3fr_1fr]">
      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6">
        <h1 className="font-serif text-2xl text-foreground">Checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This is a demo checkout. No real card will be charged.
        </p>
        <div className="mt-6 space-y-4">
          <Field label="Cardholder name" defaultValue={currentUser.name} />
          <Field label="Card number" defaultValue="4242 4242 4242 4242" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Expiry" defaultValue="12 / 30" />
            <Field label="CVC" defaultValue="123" />
          </div>

          {/* Promo code */}
          <div>
            <span className="text-xs text-muted-foreground">Promo code</span>
            <div className="mt-1 flex gap-2">
              <input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyPromo())}
                placeholder="e.g. WELCOME"
                disabled={!!promoApplied}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm uppercase outline-none placeholder:normal-case focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              <Button
                type="button"
                variant="outline"
                onClick={applyPromo}
                disabled={!!promoApplied || !promoInput.trim()}
              >
                <Tag className="mr-1.5 h-3.5 w-3.5" />
                {promoApplied ? "Applied" : "Apply"}
              </Button>
            </div>
            {promoApplied && (
              <p className="mt-1.5 text-xs text-primary">
                ✓ {Math.round(discount * 100)}% off applied
                <button
                  type="button"
                  className="ml-2 text-muted-foreground underline hover:text-foreground"
                  onClick={() => { setPromoApplied(null); setDiscount(0); setPromoInput(""); }}
                >
                  Remove
                </button>
              </p>
            )}
            <p className="mt-1 text-[10px] text-muted-foreground">Try: WELCOME · SUMMER20 · STUDY50</p>
          </div>
        </div>
        <Button type="submit" className="mt-6 w-full" disabled={purchaseMutation.isPending}>
          <Lock className="mr-2 h-4 w-4" />
          {purchaseMutation.isPending ? "Processing…" : `Pay $${finalPrice}`}
        </Button>
      </form>
      <aside className="rounded-2xl border border-border bg-secondary/40 p-6">
        <h2 className="font-serif text-lg text-foreground">Order summary</h2>
        <div className="mt-4 flex items-start gap-3 border-b border-border pb-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <CourseIcon category={course.category} className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">{course.title}</div>
            <div className="text-xs text-muted-foreground">{course.instructor}</div>
          </div>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <dt>Subtotal</dt>
            <dd>${course.price}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-primary">
              <dt>Promo ({promoApplied})</dt>
              <dd>−${discountAmount}</dd>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <dt>Tax</dt>
            <dd>$0</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-medium text-foreground">
            <dt>Total</dt>
            <dd>${finalPrice}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
