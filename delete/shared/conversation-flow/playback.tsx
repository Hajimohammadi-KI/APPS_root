"use client";
import { useEffect, useState } from "react";
import {
  playbackKey as KEY,
  playbackRates,
  readPlaybackRate,
} from "./playback-rate";
export { readPlaybackRate } from "./playback-rate";
export function usePlaybackRate() {
  const [rate, setRate] = useState(1);
  useEffect(() => {
    const update = (event?: Event) =>
      setRate(
        event instanceof CustomEvent &&
          playbackRates.some((value) => value === event.detail)
          ? event.detail
          : readPlaybackRate(),
      );
    update();
    window.addEventListener("automaticity-playback-rate", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("automaticity-playback-rate", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return rate;
}
export function PlaybackSpeed({ language = "en" }: { language?: "en" | "de" }) {
  const rate = usePlaybackRate();
  return (
    <label className="audio-playback-speed">
      {language === "de" ? "Abspieltempo" : "Playback speed"}
      <select
        aria-label={language === "de" ? "Abspieltempo" : "Playback speed"}
        value={rate}
        onChange={(event) => {
          const value = Number(event.target.value);
          try {
            localStorage.setItem(KEY, String(value));
          } catch {
            /* Playback remains usable without persistent settings. */
          }
          document.querySelectorAll("audio").forEach((audio) => {
            audio.playbackRate = value;
            audio.preservesPitch = true;
          });
          window.dispatchEvent(
            new CustomEvent("automaticity-playback-rate", { detail: value }),
          );
        }}
      >
        {playbackRates.map((value) => (
          <option key={value} value={value}>
            {value}×
          </option>
        ))}
      </select>
    </label>
  );
}
export function AudioPlayback({
  src,
  language,
  label,
}: {
  src: string;
  language: "en" | "de";
  label: string;
}) {
  const rate = usePlaybackRate();
  return (
    <div className="audio-playback">
      <audio
        key={src}
        aria-label={label}
        controls
        preload="metadata"
        src={src}
        ref={(audio) => {
          if (audio) {
            audio.playbackRate = rate;
            audio.preservesPitch = true;
          }
        }}
      />
      <PlaybackSpeed language={language} />
    </div>
  );
}
