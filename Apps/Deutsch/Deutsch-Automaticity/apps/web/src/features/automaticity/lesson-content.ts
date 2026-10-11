export function lessonKey(title: string) {
  return `automatik:${title.toLocaleLowerCase("de-DE").replace(/[^a-z0-9äöüß]+/g, "-")}`;
}

export const shadowingStages = [
  "Nur zuhören",
  "Zuhören und Text mitlesen",
  "Satz für Satz nachsprechen",
  "Den ganzen Text mitschatten",
  "Ohne Text frei nacherzählen",
] as const;

export function requiredSpeakingSeconds(level: string) {
  return level === "A1" || level === "A2" ? 30 : 45;
}

export function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 0.84;
  window.speechSynthesis.speak(utterance);
}
