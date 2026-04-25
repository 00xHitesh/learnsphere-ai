import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/checkout/$slug")({ component: CheckoutPage });

function CheckoutPage() {
  const { slug } = Route.useParams();
  const { db, currentUser, purchase } = useStore();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const course = db.courses.find((c) => c.slug === slug);
  if (!currentUser) return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="font-serif text-2xl">Please sign in to continue</h1>
      <Button asChild className="mt-6"><Link to="/login">Sign in</Link></Button>
    </div>
  );
  if (!course) return <div className="mx-auto max-w-md px-6 py-24 text-center"><h1 className="font-serif text-2xl">Course not found</h1></div>;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setProcessing(true);
    try { await purchase(course.id); toast.success("Payment successful"); navigate({ to: "/dashboard" }); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Payment failed"); }
    finally { setProcessing(false); }
  };
  const Field = ({ label, defaultValue }: { label: string; defaultValue?: string }) => (
    <label className="block"><span className="text-xs text-muted-foreground">{label}</span>
      <input defaultValue={defaultValue} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
  );
  return (
    <div className="mx-auto grid max-w-4xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.3fr_1fr]">
      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6">
        <h1 className="font-serif text-2xl text-foreground">Checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">This is a demo checkout. No real card will be charged.</p>
        <div className="mt-6 space-y-4">
          <Field label="Cardholder name" defaultValue={currentUser.name} />
          <Field label="Card number" defaultValue="4242 4242 4242 4242" />
          <div className="grid grid-cols-2 gap-4"><Field label="Expiry" defaultValue="12 / 30" /><Field label="CVC" defaultValue="123" /></div>
        </div>
        <Button type="submit" className="mt-6 w-full" disabled={processing}><Lock className="mr-2 h-4 w-4" />{processing ? "Processing…" : `Pay $${course.price}`}</Button>
      </form>
      <aside className="rounded-2xl border border-border bg-secondary/40 p-6">
        <h2 className="font-serif text-lg text-foreground">Order summary</h2>
        <div className="mt-4 flex items-start gap-3 border-b border-border pb-4">
          <div className="grid h-12 w-12 place-items-center rounded-md bg-primary/10 font-serif text-xl text-primary">{course.cover}</div>
          <div><div className="text-sm font-medium text-foreground">{course.title}</div><div className="text-xs text-muted-foreground">{course.instructor}</div></div>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground"><dt>Subtotal</dt><dd>${course.price}</dd></div>
          <div className="flex justify-between text-muted-foreground"><dt>Tax</dt><dd>$0</dd></div>
          <div className="flex justify-between border-t border-border pt-2 font-medium text-foreground"><dt>Total</dt><dd>${course.price}</dd></div>
        </dl>
      </aside>
    </div>
  );
}
