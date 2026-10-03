import type * as React from "react";
import { cn } from "@/lib/utils";

export function Checkbox({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "size-4 rounded border-slate-300 accent-primary focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
      type="checkbox"
      {...props}
    />
  );
}
