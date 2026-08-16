"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { GermanHoverHelp } from "@/components/german-hover-help";
import { LearnerStateProvider } from "@/features/learner-state/learner-state-provider";
import { PwaProvider } from "@/features/pwa/pwa-provider";

export function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <PwaProvider>
      <LearnerStateProvider>
        <TooltipProvider delay={300}>
          {children}
          <GermanHoverHelp />
        </TooltipProvider>
      </LearnerStateProvider>
    </PwaProvider>
  );
}
