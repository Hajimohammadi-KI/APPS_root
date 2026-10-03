"use client";
import { useEffect, useState } from "react";
import type { Attempt, Language } from "./model";
import { readStudio } from "./storage";
import { AudioPlayback } from "./playback";

function Recording({
  attempt,
  language,
}: {
  attempt: Attempt;
  language: Language;
}) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const source = URL.createObjectURL(attempt.audio);
    setUrl(source);
    return () => URL.revokeObjectURL(source);
  }, [attempt.audio]);
  const label =
    attempt.kind === "initial"
      ? language === "de"
        ? "Erste Aufnahme"
        : "First recording"
      : attempt.kind === "immediate-retry"
        ? language === "de"
          ? "Direkte Wiederholung"
          : "Immediate retry"
        : language === "de"
          ? "Verzögerter Abruf"
          : "Delayed recall";
  return (
    <article className="conversation-library-card">
      <h3>
        {label} · {new Date(attempt.createdAt).toLocaleString(language)}
      </h3>
      <p>{attempt.task}</p>
      <AudioPlayback src={url} language={language} label={label} />
      <a href={`/studio?attempt=${encodeURIComponent(attempt.id)}`}>
        {language === "de"
          ? "Transkript und Rückmeldung öffnen"
          : "Open transcript and feedback"}
      </a>
    </article>
  );
}
export function ConversationRecordings({
  language,
  refreshKey,
}: {
  language: Language;
  refreshKey: boolean;
}) {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    void readStudio(language)
      .then((data) => {
        if (active) {
          setAttempts(data.attempts.filter((item) => item.audio.size > 0));
          setFailed(false);
        }
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [language, refreshKey]);
  return (
    <section className="conversation-library">
      <h2>
        {language === "de" ? "Gesprächsaufnahmen" : "Conversation recordings"}
      </h2>
      <p>
        {language === "de"
          ? "Aufnahmen werden auch ohne Grammatikprüfung gespeichert."
          : "Recordings are saved even without a grammar check."}
      </p>
      {failed && (
        <p role="alert">
          {language === "de"
            ? "Lokale Aufnahmen konnten nicht geladen werden."
            : "Local recordings could not be loaded."}
        </p>
      )}
      {!failed && attempts.length === 0 && (
        <p>
          {language === "de"
            ? "Noch keine Gesprächsaufnahmen."
            : "No conversation recordings yet."}
        </p>
      )}
      {attempts.map((attempt) => (
        <Recording key={attempt.id} attempt={attempt} language={language} />
      ))}
    </section>
  );
}
