import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva("inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-xs font-semibold", {
  variants: {
    variant: {
      success: "border-violet-200 bg-violet-50 text-violet-900",
      warning: "border-amber-200 bg-amber-50 text-amber-900",
      neutral: "border-slate-200 bg-slate-50 text-slate-700",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
