import type { ReactNode } from "react";

/** Horizontal rail of three short missions; scrolls on phones, a grid from `sm`. */
export function MissionRail({
  children,
  heading = "Schnellmissionen",
  label,
}: Readonly<{ children: ReactNode; heading?: string; label: string }>) {
  return (
    <section aria-label={label} className="space-y-2">
      <h2 className="text-sm font-semibold text-sky-900">{heading}</h2>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
        {children}
      </div>
    </section>
  );
}

export function MissionTile({
  children,
  title,
}: Readonly<{ children: ReactNode; title: ReactNode }>) {
  return (
    <article className="min-w-56 rounded-xl border bg-card p-3 text-sm shadow-sm">
      <strong className="block">{title}</strong>
      <span className="text-muted-foreground">{children}</span>
    </article>
  );
}
