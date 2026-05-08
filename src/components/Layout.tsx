/**
 * Root page shell. Wraps every route with Header, Footer, and the floating Chatbot widget.
 * Rendered by __root.tsx so every page inherits this structure automatically.
 */
import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Chatbot } from "./Chatbot";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <Chatbot />
    </div>
  );
}