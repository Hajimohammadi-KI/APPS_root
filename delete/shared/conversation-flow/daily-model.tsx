"use client";
import { useEffect, useState } from "react";
import { Volume2, Square } from "lucide-react";
import type { DailyExercise } from "./daily-exercise";
import type { Language } from "./model";
import { PlaybackSpeed, readPlaybackRate } from "./playback";

export const shadowSteps = {
  en: ["Listen", "Repeat in chunks", "Shadow", "Retell", "Compare"],
  de: [
    "Zuhören",
    "Abschnitte nachsprechen",
    "Mitsprechen",
    "Nacherzählen",
    "Vergleichen",
  ],
} as const;

/** Models are authored worksheet sentences; browser speech is explicitly labelled. */
export function DailyModel({
  exercise,
  language,
  step = 0,
}: {
  exercise: DailyExercise;
  language: Language;
  step?: number;
}) {
  const [covered, setCovered] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState("");
  const de = language === "de";
  useEffect(() => {
    const stop = () => {
      window.speechSynthesis?.cancel();
      setPlaying(false);
    };
    window.addEventListener("automaticity-playback-rate", stop);
    return () => {
      stop();
      window.removeEventListener("automaticity-playback-rate", stop);
    };
  }, [step]);
  function play(sentences: readonly string[]) {
    const synth = window.speechSynthesis;
    if (!synth) {
      setMessage(
        de
          ? "Sprachausgabe ist hier nicht verfügbar. Lies das Modell laut."
          : "Speech playback is unavailable here. Read the model aloud.",
      );
      return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(sentences.join(" "));
    utterance.lang = de ? "de-DE" : "en-GB";
    const voice = synth
      .getVoices()
      .find((item) => item.lang.startsWith(language));
    if (voice) utterance.voice = voice;
    utterance.rate = readPlaybackRate();
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => {
      setPlaying(false);
      setMessage(
        de
          ? "Wiedergabe nicht verfügbar. Du kannst das Modell laut lesen."
          : "Playback is unavailable. You can read the model aloud.",
      );
    };
    setMessage("");
    setPlaying(true);
    synth.speak(utterance);
  }
  return (
    <section className="cf-card cf-sand" data-daily-model={exercise.activity}>
      <h2>
        {exercise.activity === 6
          ? shadowSteps[language][step]
          : de
            ? "Lesen, abdecken, abrufen"
            : "Read, cover, recall"}
      </h2>
      {exercise.activity === 6 && (
        <p>
          {step === 0
            ? de
              ? "Höre zuerst das ganze Modell."
              : "Listen to the whole model first."
            : step === 1
              ? de
                ? "Höre einen Satz. Halte kurz an und sprich ihn nach."
                : "Listen to one sentence. Pause and repeat it."
              : step === 2
                ? de
                  ? "Sprich gleichzeitig mit dem Modell. Passe das Tempo bei Bedarf an."
                  : "Speak along with the model. Adjust the speed as needed."
                : de
                  ? "Vergleiche deine Aufnahme mit dem Modell. Prüfe die Zielform und notiere die Ursache einer Abweichung."
                  : "Compare your recording with the model. Check the target form and note why any difference occurred."}
        </p>
      )}
      {!covered && (
        <ol lang={language} dir="ltr">
          {exercise.models.map((sentence, index) => (
            <li key={index}>
              <p>{sentence}</p>
              {exercise.activity === 6 && step === 1 && (
                <button
                  className="cf-secondary"
                  type="button"
                  onClick={() => play([sentence])}
                >
                  <Volume2 aria-hidden size={18} />
                  {de ? "Satz hören" : "Listen to sentence"} {index + 1}
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
      <div className="cf-record-actions">
        <button
          className="cf-secondary"
          type="button"
          onClick={() => play(exercise.models)}
        >
          <Volume2 aria-hidden />
          {de ? "Modell hören" : "Listen to model"}
        </button>
        {playing && (
          <button
            className="cf-secondary"
            type="button"
            onClick={() => {
              window.speechSynthesis.cancel();
              setPlaying(false);
            }}
          >
            <Square aria-hidden />
            {de ? "Stopp" : "Stop"}
          </button>
        )}
        {exercise.activity === 2 && (
          <button
            className="cf-secondary"
            type="button"
            aria-pressed={covered}
            onClick={() => {
              window.speechSynthesis?.cancel();
              setPlaying(false);
              setCovered(!covered);
            }}
          >
            {covered
              ? de
                ? "Modell zeigen"
                : "Show model"
              : de
                ? "Modell abdecken"
                : "Cover model"}
          </button>
        )}
      </div>
      <PlaybackSpeed language={language} />
      <p className="cf-note">
        {de
          ? "Sprachausgabe des Geräts. Beim Ändern des Tempos erneut starten."
          : "Device speech playback. Restart the model after changing speed."}
      </p>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
