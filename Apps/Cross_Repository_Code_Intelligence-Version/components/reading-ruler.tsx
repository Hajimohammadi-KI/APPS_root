"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_WERKZEUG_SETTINGS,
  normalizeWerkzeugSettings,
  type WerkzeugSettings,
} from "../lib/werkzeug-settings";

const SETTINGS_KEYS = ["einstellungen-settings-v1", "werkzeug-settings-v1"] as const;
export const READING_RULER_EVENT = "werkzeug:reading-ruler-changed";

function storedSettings(): WerkzeugSettings {
  for (const key of SETTINGS_KEYS) {
    const value = localStorage.getItem(key);
    if (!value) continue;
    try {
      return normalizeWerkzeugSettings(JSON.parse(value));
    } catch {
      // Try the next compatible storage key.
    }
  }
  return DEFAULT_WERKZEUG_SETTINGS;
}

export default function ReadingRuler() {
  const [settings, setSettings] = useState<WerkzeugSettings>(DEFAULT_WERKZEUG_SETTINGS);
  const [rulerTop, setRulerTop] = useState(160);
  const [rulerHeight, setRulerHeight] = useState(32);
  const enabled = settings.accessibility.readingRuler;

  useEffect(() => {
    queueMicrotask(() => setSettings(storedSettings()));

    const receiveSettings = (event: Event) => {
      const detail = (event as CustomEvent<WerkzeugSettings>).detail;
      if (detail) setSettings(normalizeWerkzeugSettings(detail));
    };
    const receiveStorage = (event: StorageEvent) => {
      if (event.key && SETTINGS_KEYS.includes(event.key as (typeof SETTINGS_KEYS)[number])) {
        setSettings(storedSettings());
      }
    };

    window.addEventListener(READING_RULER_EVENT, receiveSettings);
    window.addEventListener("storage", receiveStorage);
    return () => {
      window.removeEventListener(READING_RULER_EVENT, receiveSettings);
      window.removeEventListener("storage", receiveStorage);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const followPointer = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : document.body;
      const style = getComputedStyle(target);
      const fontSize = Number.parseFloat(style.fontSize) || 16;
      const measuredLineHeight = Number.parseFloat(style.lineHeight);
      const lineHeight = Number.isFinite(measuredLineHeight) ? measuredLineHeight : fontSize * 1.65;
      // Keep the guide around a line of text. It must never tint the text itself.
      const nextHeight = Math.min(78, Math.max(34, lineHeight + Math.max(12, fontSize * 0.55)));
      setRulerHeight(nextHeight);
      setRulerTop(Math.min(window.innerHeight - nextHeight / 2, Math.max(nextHeight / 2, event.clientY)));
    };

    window.addEventListener("pointermove", followPointer, { passive: true });
    return () => window.removeEventListener("pointermove", followPointer);
  }, [enabled]);

  const toggle = (readingRuler: boolean) => {
    const next = normalizeWerkzeugSettings({
      ...settings,
      accessibility: { ...settings.accessibility, readingRuler },
      updatedAt: new Date().toISOString(),
    });
    setSettings(next);
    localStorage.setItem(SETTINGS_KEYS[0], JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(READING_RULER_EVENT, { detail: next }));
    void fetch("/api/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ settings: next }),
    }).catch(() => undefined);
  };

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
          id="global-reading-ruler-toggle"
          name="global-reading-ruler"
          checked={enabled}
          onChange={(event) => toggle(event.target.checked)}
          type="checkbox"
        />
        <span>Leselineal</span>
      </label>
    </>
  );
}
