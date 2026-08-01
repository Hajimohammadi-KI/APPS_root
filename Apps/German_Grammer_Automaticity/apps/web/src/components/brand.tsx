import Link from "next/link";

export function Brand({ compact = false }: Readonly<{ compact?: boolean }>) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      aria-label="DeutschFlow – zur Übersicht"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-sky-700 text-sm font-bold tracking-tight text-white shadow-sm">
        DF
      </span>
      {!compact && (
        <span className="leading-none">
          <strong className="block text-base tracking-tight">
            DeutschFlow
          </strong>
          <span className="mt-1 block text-[0.65rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Grammatik automatisieren
          </span>
        </span>
      )}
    </Link>
  );
}
