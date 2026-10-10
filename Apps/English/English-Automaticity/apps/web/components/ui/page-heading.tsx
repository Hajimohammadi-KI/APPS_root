import type * as React from "react";
import { cn } from "@/lib/utils";

/** Screen title block; `.page-heading` carries the per-screen worksheet styling. */
export function PageHeading({
  actions,
  className,
  description,
  eyebrow,
  title,
  ...props
}: Omit<React.HTMLAttributes<HTMLDivElement>, "title"> & {
  actions?: React.ReactNode;
  description: React.ReactNode;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
}) {
  return (
    <div className={cn("page-heading", className)} {...props}>
      <div>
        {eyebrow}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions}
    </div>
  );
}
