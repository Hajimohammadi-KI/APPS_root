import type { ReactNode } from "react";

/** Titled text box used on the legal and support pages. */
export function SectionBox({
  children,
  footer,
  title,
}: Readonly<{ children: ReactNode; footer?: ReactNode; title: ReactNode }>) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
      {footer}
    </section>
  );
}
