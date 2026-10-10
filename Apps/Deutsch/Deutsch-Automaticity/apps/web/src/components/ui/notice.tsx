import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const noticeVariants = cva("rounded-xl border p-3 text-sm leading-6", {
  variants: {
    tone: {
      neutral: "bg-card",
      info: "border-sky-200 bg-sky-50 text-sky-950",
      success: "border-emerald-200 bg-emerald-50 text-emerald-950",
      warning: "border-amber-300 bg-amber-50 text-amber-950",
      danger: "border-red-200 bg-red-50 text-red-950",
    },
  },
  defaultVariants: { tone: "neutral" },
});

/** Inline message box; pass `role="status"` or `role="alert"` when it is announced. */
export function Notice({
  className,
  tone,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof noticeVariants>) {
  return <div className={cn(noticeVariants({ tone }), className)} {...props} />;
}
