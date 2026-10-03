import Link from "next/link";

export function Brand({ compact = false }: Readonly<{ compact?: boolean }>) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      aria-label="Deutsch Automaticity – zur Übersicht"
    >
      <span className="brand-logo grid size-9 place-items-center rounded-xl text-sm font-bold tracking-tight text-white shadow-sm">
        DA
      </span>
      {!compact && (
        <span className="leading-none">
          <strong className="block text-base tracking-tight">
            Deutsch Automaticity
          </strong>
          <span className="mt-1 block text-[0.65rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Messbare tägliche Sprachpraxis
          </span>
        </span>
      )}
    </Link>
  );
}
