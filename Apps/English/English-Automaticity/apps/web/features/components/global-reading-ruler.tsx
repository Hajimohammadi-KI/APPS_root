"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { useAppStore } from "@/features/store/app-store";

export function GlobalReadingRuler() {
  const pathname = usePathname();
  const { state, mutate } = useAppStore();
  const [rulerTop, setRulerTop] = useState(160);
  const [rulerHeight, setRulerHeight] = useState(
    Math.round(32 * (state.settings.textScale / 100)),
  );
  const isStandalonePage = pathname !== "/";
  const enabled = state.settings.readingRuler;

  useEffect(() => {
    if (!isStandalonePage || !enabled) return;

    const moveRuler = (event: PointerEvent) => {
      setRulerTop(event.clientY);
      const target =
        event.target instanceof Element
          ? event.target
          : document.elementFromPoint(event.clientX, event.clientY);
      const fontSize = target
        ? Number.parseFloat(window.getComputedStyle(target).fontSize)
        : 16 * (state.settings.textScale / 100);
      setRulerHeight(
        Math.round(Math.min(72, Math.max(28, (fontSize || 16) * 1.9))),
      );
    };

    window.addEventListener("pointermove", moveRuler, { passive: true });
    return () => window.removeEventListener("pointermove", moveRuler);
  }, [enabled, isStandalonePage, state.settings.textScale]);

  if (!isStandalonePage) return null;

  return (
    <>
      {enabled ? (
        <div
          aria-hidden="true"
          className="neuro-reading-ruler"
          style={{ height: rulerHeight, top: rulerTop }}
        />
      ) : null}
      <label className="neuro-ruler-toggle standalone-neuro-ruler-toggle">
        <input
          aria-label="Reading ruler on this page"
          checked={enabled}
          onChange={(event) =>
            mutate((draft) => {
              draft.settings.readingRuler = event.target.checked;
            })
          }
          type="checkbox"
        />
        <span>Reading ruler</span>
      </label>
    </>
  );
}
