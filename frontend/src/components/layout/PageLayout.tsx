import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
export function PageLayout({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-[60svh] bg-background">
      <header className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-[1400px] px-6 py-10 md:py-14">
          <p className="mb-4 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">
              PACK
            </Link>{" "}
            / {eyebrow}
          </p>
          <h1 className="font-display text-4xl md:text-5xl">{title}</h1>
        </div>
      </header>
      <div className="mx-auto max-w-[1400px] px-6 py-10">{children}</div>
    </main>
  );
}
