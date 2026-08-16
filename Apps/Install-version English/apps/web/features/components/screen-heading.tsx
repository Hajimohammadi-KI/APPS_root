import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

export function ScreenHeading({
  actions,
  description,
  eyebrow,
  title,
}: {
  actions?: ReactNode;
  description: string;
  eyebrow?: string;
  title: string;
}) {
  return (
    <header className="learning-page-intro relative mb-5 overflow-hidden rounded-3xl border border-primary/15 bg-card px-5 py-6 shadow-card sm:px-7 sm:py-8">
      <div
        aria-hidden
        className="learning-page-intro-orb pointer-events-none absolute -top-16 -right-12 size-48 rounded-full bg-secondary"
      />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="learning-page-intro-copy min-w-0">
          {eyebrow ? (
            <Badge className="mb-3" variant="secondary">
              {eyebrow}
            </Badge>
          ) : null}
          <h1 className="text-3xl font-black tracking-tight text-foreground text-balance sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
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
