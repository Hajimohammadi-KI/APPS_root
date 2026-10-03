"use client";

import { useEffect, useState } from "react";

type ReadingRulerProps = {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  zoom: number;
};

const rulerHeightFor = (fontSize: number, lineHeight: number) =>
  Math.min(78, Math.max(34, lineHeight + Math.max(12, fontSize * 0.55)));

export default function ReadingRuler({ enabled, onToggle, zoom }: ReadingRulerProps) {
  const [rulerTop, setRulerTop] = useState(160);
  const [rulerHeight, setRulerHeight] = useState(() => rulerHeightFor(16 * zoom, 26 * zoom));

  useEffect(() => {
    if (!enabled) return;

    const followPointer = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : document.body;
      const style = getComputedStyle(target);
      const fontSize = Number.parseFloat(style.fontSize) || 16 * zoom;
      const measuredLineHeight = Number.parseFloat(style.lineHeight);
      const lineHeight = Number.isFinite(measuredLineHeight) ? measuredLineHeight : fontSize * 1.65;
      const nextHeight = rulerHeightFor(fontSize, lineHeight);
      setRulerHeight(nextHeight);
      setRulerTop(Math.min(window.innerHeight - nextHeight / 2, Math.max(nextHeight / 2, event.clientY)));
    };

    window.addEventListener("pointermove", followPointer, { passive: true });
    return () => window.removeEventListener("pointermove", followPointer);
  }, [enabled, zoom]);

  return (
    <>
      {enabled ? (
        <div
          aria-hidden="true"
          className="global-reading-ruler"
          style={{ height: rulerHeight, top: rulerTop }}
        />
      ) : null}
      <label className="global-reading-ruler-toggle">
        <input
          aria-label="Leselineal auf dieser Seite"
          checked={enabled}
          onChange={(event) => onToggle(event.target.checked)}
          type="checkbox"
        />
        <span>Leselineal</span>
      </label>
    </>
  );
}
