import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h1 className="font-serif text-5xl text-foreground">About Lumen</h1>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
        Most learning platforms are designed for engagement. Lumen is designed for finishing.
        We curate a small number of courses, pace them carefully, and resist the urge to add another notification.
      </p>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        Our AI assistant helps you decide what to learn, summarize what you've learned, and answer questions when you're stuck.
      </p>
      <div className="mt-10"><Button asChild><Link to="/courses">Browse courses</Link></Button></div>
    </div>
  ),
});
