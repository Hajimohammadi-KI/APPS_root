"use client";

import * as React from "react";
import {
  ArrowRight,
  CircleHelp,
  Mic2,
  Repeat2,
  Route,
  ShieldCheck,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const guideSteps = [
  {
    description:
      "Your daily path gives you one clear practice order for today.",
    icon: Route,
    label: "Start daily path",
  },
  {
    description:
      "Speak or type in the studio, review the correction, and improve your sentence.",
    icon: Mic2,
    label: "Speak and repair",
  },
  {
    description:
      "Open the error workshop for due repairs and finish only today's target scope.",
    icon: Repeat2,
    label: "Review due errors",
  },
] as const;

export function UserGuideButton({
  navigate,
}: {
  navigate: (screen: string) => void;
}) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  const close = () => dialogRef.current?.close();
  const goTo = (screen: string) => {
    close();
    navigate(screen);
  };

  return (
    <>
      <Button
        aria-label="Open help"
        className="user-guide-trigger"
        onClick={() => dialogRef.current?.showModal()}
        size="sm"
        variant="outline"
      >
        <CircleHelp aria-hidden />
        <span>Help</span>
      </Button>
      <dialog
        aria-labelledby="user-guide-title"
        className="user-guide-dialog"
        ref={dialogRef}
      >
        <div className="user-guide-dialog-panel">
          <button
            aria-label="Close help"
            className="user-guide-close"
            onClick={close}
            type="button"
          >
            <X aria-hidden />
          </button>
          <header className="user-guide-header">
            <span className="user-guide-mark">
              <CircleHelp aria-hidden />
            </span>
            <p>Quick help</p>
            <h2 id="user-guide-title">How to use English Automaticity</h2>
            <span>
              If you are unsure, always start with Step 1. Your progress is
              automatically saved on this device.
            </span>
          </header>
          <GuideSteps />
          <div className="user-guide-safe">
            <ShieldCheck aria-hidden />
            <div>
              <strong>You cannot break anything</strong>
              <span>
                Your work stays on this device. You can export an additional
                backup any time from Settings.
              </span>
            </div>
          </div>
          <footer className="user-guide-footer">
            <Button onClick={() => goTo("daily")}>
              Start with Step 1
              <ArrowRight aria-hidden />
            </Button>
            <Button onClick={() => goTo("settings")} variant="outline">
              Settings and backup
            </Button>
          </footer>
        </div>
      </dialog>
    </>
  );
}

export function QuickStartGuide({
  navigate,
}: {
  navigate: (screen: string) => void;
}) {
  return (
    <section className="quick-start-guide" aria-labelledby="quick-start-title">
      <div className="quick-start-heading">
        <span className="quick-start-icon">
          <CircleHelp aria-hidden />
        </span>
        <div>
          <p>New here?</p>
          <h2 id="quick-start-title">Start confidently in three steps</h2>
          <span>
            Follow this order. Everything is saved automatically.
          </span>
        </div>
      </div>
      <GuideSteps compact />
      <Button
        className="quick-start-action"
        onClick={() => navigate("daily")}
      >
        Start Step 1
        <ArrowRight aria-hidden />
      </Button>
    </section>
  );
}

function GuideSteps({ compact = false }: { compact?: boolean }) {
  return (
    <ol className="guide-step-list" data-compact={compact}>
      {guideSteps.map((step, index) => {
        const Icon = step.icon;
        return (
          <li key={step.label}>
            <span className="guide-step-number">{index + 1}</span>
            <span className="guide-step-icon">
              <Icon aria-hidden />
            </span>
            <span className="guide-step-copy">
              <strong>{step.label}</strong>
              <span>{step.description}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
