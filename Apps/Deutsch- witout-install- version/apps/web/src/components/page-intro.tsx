import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

export function PageIntro({
  actions,
  eyebrow,
  title,
  description,
}: Readonly<{
  actions?: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}>) {
  return (
    <header className="learning-page-intro relative overflow-hidden rounded-3xl border border-primary/15 bg-card px-5 py-6 shadow-sm sm:px-7 sm:py-8">
      <div
        aria-hidden="true"
        className="learning-page-intro-orb pointer-events-none absolute -top-16 -right-12 size-48 rounded-full bg-secondary"
      />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="learning-page-intro-copy min-w-0 max-w-3xl">
          <Badge variant="secondary">{eyebrow}</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            {description}
          </p>
        </div>
        {actions ? (
          <div className="learning-page-intro-actions shrink-0">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
