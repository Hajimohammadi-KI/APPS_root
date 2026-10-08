// Playback preferences never alter the captured audio or its measurement clock.
export const playbackKey = "automaticity:playback-speed:v1";
export const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
export function readPlaybackRate(): number {
  try {
    const value = Number(localStorage.getItem(playbackKey));
    return playbackRates.some((rate) => rate === value) ? value : 1;
  } catch {
    return 1;
  }
}
export function bindPlaybackRate(audio: HTMLAudioElement) {
  const update = (event?: Event) => {
    const value: unknown =
      event instanceof CustomEvent ? event.detail : readPlaybackRate();
    audio.playbackRate =
      typeof value === "number" && playbackRates.some((rate) => rate === value)
        ? value
        : 1;
    audio.preservesPitch = true;
  };
  update();
  window.addEventListener("automaticity-playback-rate", update);
  return () => window.removeEventListener("automaticity-playback-rate", update);
}
