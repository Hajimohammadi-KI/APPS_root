"use client";

import * as React from "react";
import { AudioLines, Settings2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Settings } from "@/features/store/app-store";

export function NeuroReader({
  settings,
  onOpenSettings,
  onToggleReadingRuler,
}: {
  settings: Settings;
  onOpenSettings: () => void;
  onToggleReadingRuler: (enabled: boolean) => void;
}) {
  const [speaking, setSpeaking] = React.useState(false);
  const [currentWords, setCurrentWords] = React.useState("");
  const [rulerTop, setRulerTop] = React.useState(160);
  const [rulerHeight, setRulerHeight] = React.useState(
    Math.round(32 * (settings.textScale / 100)),
  );

  React.useEffect(() => {
    if (!settings.readingRuler) return;
    const moveRuler = (event: PointerEvent) => {
      setRulerTop(event.clientY);
      const target =
        event.target instanceof Element
          ? event.target
          : document.elementFromPoint(event.clientX, event.clientY);
      const fontSize = target
        ? Number.parseFloat(window.getComputedStyle(target).fontSize)
        : 16 * (settings.textScale / 100);
      setRulerHeight(
        Math.round(Math.min(72, Math.max(28, (fontSize || 16) * 1.9))),
      );
    };
    window.addEventListener("pointermove", moveRuler, { passive: true });
    return () => window.removeEventListener("pointermove", moveRuler);
  }, [settings.readingRuler, settings.textScale]);

  React.useEffect(
    () => () => {
      window.speechSynthesis?.cancel();
    },
    [],
  );

  const stop = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setCurrentWords("");
  };

  const read = () => {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      stop();
      return;
    }
    const selection = window.getSelection()?.toString().trim();
    const mainText =
      document.querySelector<HTMLElement>("#main-content")?.innerText;
    const text = (selection || mainText || "").replace(/\s+/g, " ").trim();
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = settings.ttsRate;
    utterance.onstart = () => setSpeaking(true);
    utterance.onboundary = (event) => {
      if (event.name !== "word") return;
      const start = Math.max(0, event.charIndex - 24);
      const end = Math.min(
        text.length,
        event.charIndex + event.charLength + 48,
      );
      setCurrentWords(text.slice(start, end));
    };
    utterance.onend = stop;
    utterance.onerror = stop;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      {settings.readingRuler ? (
        <div
          aria-hidden="true"
          className="neuro-reading-ruler"
          style={{ height: rulerHeight, top: rulerTop }}
        />
      ) : null}
      <div className="neuro-reader-controls">
        <label className="neuro-ruler-toggle">
          <input
            aria-label="Reading ruler on this page"
            checked={settings.readingRuler}
            onChange={(event) => onToggleReadingRuler(event.target.checked)}
            type="checkbox"
          />
          <span>Reading ruler</span>
        </label>
        <Button
          aria-label={
            speaking
              ? "Stop reading aloud"
              : "Read selected text or current page aloud"
          }
          aria-pressed={speaking}
          onClick={read}
          size="icon"
          title={speaking ? "Stop reading aloud" : "Read aloud"}
          type="button"
          variant="outline"
        >
          {speaking ? <Square aria-hidden /> : <AudioLines aria-hidden />}
        </Button>
        <Button
          aria-label="Open ADHD and dyslexia settings"
          onClick={onOpenSettings}
          size="icon"
          title="Reading and focus settings"
          type="button"
          variant="outline"
        >
          <Settings2 aria-hidden />
        </Button>
      </div>
      {speaking && currentWords ? (
        <div aria-live="polite" className="neuro-reader-caption" role="status">
          {currentWords}
        </div>
      ) : null}
    </>
  );
}
