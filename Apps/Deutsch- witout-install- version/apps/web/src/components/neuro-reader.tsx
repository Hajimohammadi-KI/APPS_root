"use client";

import { useEffect, useState } from "react";
import { AudioLines, Settings2, Square } from "lucide-react";

import type { LearnerSettings } from "@grammar/domain";

import { Button } from "@/components/ui/button";

export function NeuroReader({
  settings,
  onOpenSettings,
  onToggleReadingRuler,
}: Readonly<{
  settings: LearnerSettings;
  onOpenSettings: () => void;
  onToggleReadingRuler: (enabled: boolean) => void;
}>) {
  const [speaking, setSpeaking] = useState(false);
  const [currentWords, setCurrentWords] = useState("");
  const [rulerTop, setRulerTop] = useState(160);
  const [rulerHeight, setRulerHeight] = useState(
    Math.round(32 * (settings.textScale / 100)),
  );

  useEffect(() => {
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

  useEffect(
    () => () => {
      window.speechSynthesis?.cancel();
    },
    [],
  );

  function stop() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setCurrentWords("");
  }

  function read() {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      stop();
      return;
    }
    const selection = window.getSelection()?.toString().trim();
    const pageText =
      document.querySelector<HTMLElement>("#main-content")?.innerText;
    const text = (selection || pageText || "").replace(/\s+/g, " ").trim();
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
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
  }

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
            aria-label="Leselineal auf dieser Seite"
            checked={settings.readingRuler}
            onChange={(event) => onToggleReadingRuler(event.target.checked)}
            type="checkbox"
          />
          <span>Leselineal</span>
        </label>
        <Button
          aria-label={
            speaking
              ? "Vorlesen stoppen"
              : "Markierten Text oder aktuelle Seite vorlesen"
          }
          aria-pressed={speaking}
          onClick={read}
          size="icon"
          title={speaking ? "Vorlesen stoppen" : "Vorlesen"}
          type="button"
          variant="outline"
        >
          {speaking ? (
            <Square aria-hidden="true" />
          ) : (
            <AudioLines aria-hidden="true" />
          )}
        </Button>
        <Button
          aria-label="ADHS- und Dyslexie-Einstellungen öffnen"
          onClick={onOpenSettings}
          size="icon"
          title="Lese- und Fokuseinstellungen"
          type="button"
          variant="outline"
        >
          <Settings2 aria-hidden="true" />
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
