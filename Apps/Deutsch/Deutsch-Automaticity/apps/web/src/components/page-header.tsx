import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Page title block. The default form is the kicker + `section-title` used
 * inside the app shell; "framed" is the boxed header of the legal pages.
 */
export function PageHeader({
  actions,
  children,
  className,
  description,
  framed = false,
  kicker,
  title,
}: Readonly<{
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  description: ReactNode;
  framed?: boolean;
  kicker: ReactNode;
  title: ReactNode;
}>) {
  if (framed) {
    return (
      <header
        className={cn(
          "mb-8 rounded-3xl border bg-card p-6 shadow-sm sm:p-8",
          className,
        )}
      >
        <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
          {kicker}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-muted-foreground">{description}</p>
        {children}
      </header>
    );
  }
  const copy = (
    <div>
      <p className="section-kicker">{kicker}</p>
      <h1 className="section-title">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {children}
    </div>
  );
  if (!actions) {
    return <header className={className}>{copy}</header>;
  }
  return (
    <header
      className={cn(
        "flex flex-wrap items-end justify-between gap-3",
        className,
      )}
    >
      {copy}
      {actions}
    </header>
  );
}
