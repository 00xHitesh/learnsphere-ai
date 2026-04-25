import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) { toast.error("Please fill in every field."); return; }
    toast.success("Thanks — we'll get back to you soon.");
    setName(""); setEmail(""); setMessage("");
  };
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-serif text-4xl text-foreground sm:text-5xl">Contact</h1>
      <p className="mt-2 text-muted-foreground">We read everything and reply to most things.</p>
      <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6">
        <label className="block"><span className="text-xs text-muted-foreground">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
        <label className="block"><span className="text-xs text-muted-foreground">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
        <label className="block"><span className="text-xs text-muted-foreground">Message</span>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
        <Button type="submit">Send message</Button>
      </form>
    </div>
  );
}
