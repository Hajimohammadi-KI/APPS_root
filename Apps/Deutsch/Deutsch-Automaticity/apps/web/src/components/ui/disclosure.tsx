import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Collapsible section. "quiet" is the worksheet disclosure used for saved
 * evidence; "boxed" is the bordered panel used for optional settings.
 */
export function Disclosure({
  children,
  className,
  summary,
  summaryClassName,
  variant = "quiet",
  ...props
}: React.ComponentProps<"details"> & {
  summary: React.ReactNode;
  summaryClassName?: string;
  variant?: "quiet" | "boxed";
}) {
  if (variant === "boxed") {
    return (
      <details className={cn("rounded-xl border p-4", className)} {...props}>
        <summary
          className={cn(
            "flex cursor-pointer items-center gap-2 text-sm font-bold",
            summaryClassName,
          )}
        >
          {summary}
        </summary>
        {children}
      </details>
    );
  }
  return (
    <details className={cn("quiet-disclosure", className)} {...props}>
      <summary className={summaryClassName}>{summary}</summary>
      <div>{children}</div>
    </details>
  );
}
