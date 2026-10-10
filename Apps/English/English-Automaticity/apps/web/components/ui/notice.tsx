import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const noticeVariants = cva("rounded-xl border p-3 text-sm leading-6", {
  variants: {
    tone: {
      neutral: "bg-slate-50",
      info: "border-violet-200 bg-violet-50",
      success: "border-emerald-200 bg-emerald-50",
      warning: "border-amber-300 bg-amber-50 text-amber-950",
      danger: "border-red-200 bg-red-50",
    },
  },
  defaultVariants: { tone: "neutral" },
});

/** Inline message box; pass `role="alert"` or `role="status"` when the message is announced. */
export function Notice({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof noticeVariants>) {
  return <div className={cn(noticeVariants({ tone }), className)} {...props} />;
}
