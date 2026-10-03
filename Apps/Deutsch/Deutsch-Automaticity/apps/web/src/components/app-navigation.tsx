"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavigationItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function AppNavigation({
  ariaLabel,
  items,
  onNavigate,
}: Readonly<{
  ariaLabel: string;
  items: readonly NavigationItem[];
  onNavigate?: () => void;
}>) {
  const pathname = usePathname();

  return (
    // Each navigation group has a distinct accessible name so landmark lists stay useful.
    <nav aria-label={ariaLabel}>
      <ul className="space-y-1">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          const className = cn(
            "flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
            active &&
              "bg-violet-100 text-violet-800 font-extrabold hover:text-violet-800",
          );
          const content = (
            <>
              <Icon className="size-4.5" aria-hidden="true" />
              {item.label}
            </>
          );
          const usesStaticCompatibilityPage =
            item.href === "/heute" || item.href === "/grammatik";

          return (
            <li key={item.href}>
              {usesStaticCompatibilityPage ? (
                <a
                  aria-current={active ? "page" : undefined}
                  className={className}
                  href={item.href}
                  onClick={onNavigate}
                >
                  {content}
                </a>
              ) : (
                <Link
                  className={className}
                  href={item.href as Route}
                  {...(onNavigate === undefined ? {} : { onClick: onNavigate })}
                  {...(active ? { "aria-current": "page" as const } : {})}
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
