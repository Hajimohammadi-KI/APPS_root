"use client";

import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type AccordionTone = "blue" | "violet" | "emerald" | "amber" | "rose";

const toneStyles: Record<
  AccordionTone,
  { shell: string; icon: string; eyebrow: string }
> = {
  blue: {
    shell: "border-sky-200 bg-gradient-to-r from-sky-50/90 via-white to-white",
    icon: "bg-sky-100 text-sky-700 ring-sky-200",
    eyebrow: "text-sky-700",
  },
  violet: {
    shell:
      "border-violet-200 bg-gradient-to-r from-violet-50/90 via-white to-white",
    icon: "bg-violet-100 text-violet-700 ring-violet-200",
    eyebrow: "text-violet-700",
  },
  emerald: {
    shell:
      "border-fuchsia-200 bg-gradient-to-r from-fuchsia-50/90 via-white to-white",
    icon: "bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200",
    eyebrow: "text-fuchsia-700",
  },
  amber: {
    shell:
      "border-amber-200 bg-gradient-to-r from-amber-50/90 via-white to-white",
    icon: "bg-amber-100 text-amber-800 ring-amber-200",
    eyebrow: "text-amber-800",
  },
  rose: {
    shell:
      "border-rose-200 bg-gradient-to-r from-rose-50/90 via-white to-white",
    icon: "bg-rose-100 text-rose-700 ring-rose-200",
    eyebrow: "text-rose-700",
  },
};

export function LearningAccordion({
  children,
  className,
  defaultOpen = false,
  eyebrow,
  group,
  icon: Icon,
  summary,
  title,
  tone = "blue",
}: Readonly<{
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  eyebrow?: string;
  group?: string;
  icon?: ComponentType<{ "aria-hidden"?: boolean; className?: string }>;
  summary?: string;
  title: string;
  tone?: AccordionTone;
}>) {
  const styles = toneStyles[tone];
  const itemValue = `bereich-${title
    .toLocaleLowerCase("de")
    .replace(/[^a-z0-9äöüß]+/g, "-")}`;

  return (
    <Accordion
      className={cn(
        "learning-accordion overflow-hidden rounded-2xl border shadow-sm",
        "transition-[border-color,box-shadow,transform] duration-200",
        "has-[[data-state=open]]:-translate-y-0.5 has-[[data-state=open]]:shadow-lg",
        "motion-reduce:transform-none motion-reduce:transition-none",
        styles.shell,
        className,
      )}
      collapsible
      data-accordion-group={group}
      defaultValue={defaultOpen ? itemValue : undefined}
      type="single"
    >
      <AccordionItem className="border-0" value={itemValue}>
        <AccordionTrigger className="min-h-16 gap-3 px-4 py-3 text-left hover:no-underline sm:px-5">
          {Icon ? (
            <span
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-xl ring-1",
                styles.icon,
              )}
            >
              <Icon aria-hidden className="size-5" />
            </span>
          ) : (
            <span
              aria-hidden
              className={cn(
                "size-2.5 shrink-0 rounded-full ring-4",
                styles.icon,
              )}
            />
          )}
          <span className="min-w-0 flex-1">
            {eyebrow ? (
              <span
                className={cn(
                  "block text-[0.68rem] font-black tracking-[0.14em] uppercase",
                  styles.eyebrow,
                )}
              >
                {eyebrow}
              </span>
            ) : null}
            <span className="block text-sm font-bold leading-5 text-slate-950 sm:text-base">
              {title}
            </span>
            {summary ? (
              <span className="mt-0.5 block text-xs leading-5 text-slate-600">
                {summary}
              </span>
            ) : null}
          </span>
        </AccordionTrigger>
        <AccordionContent className="border-t border-slate-200 bg-white/90 px-4 py-4 text-slate-800 sm:px-5">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
