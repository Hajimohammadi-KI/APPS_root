"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  Check,
  CircleStop,
  Headphones,
  LoaderCircle,
  Mic2,
  Pause,
  Play,
  RotateCcw,
  Save,
  Send,
  Square,
  Volume2,
} from "lucide-react";

import {
  grammarUnits,
  speakingTopics,
  type GrammarUnit,
} from "@grammar/content";
import type { EvaluationResponse } from "@grammar/contracts";
import { countWords, errorClassLabels, getTodayKey } from "@grammar/domain";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/profile-avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { saveAudio } from "@/features/audio/audio-repository";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";
import { requestEvaluation as requestEvaluationWithConsent } from "@/lib/evaluation-client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const PATH_GROUPS: Readonly<Record<string, readonly string[]>> = {
  "Kompletter Deutschpfad · A1–C2": [
    "Allgemeines Deutsch",
    "Aspekte-neu-orientiert",
    "Studium und Universität",
    "DSH-Vorbereitung",
    "Digitaler TestDaF",
    "Akademisches Deutsch",
  ],
  "Akademisches Deutsch · B1–C2": [
    "Aspekte-neu-orientiert",
    "Studium und Universität",
    "DSH-Vorbereitung",
    "Digitaler TestDaF",
    "Akademisches Deutsch",
  ],
  "Allgemeines Deutsch": ["Allgemeines Deutsch"],
  "Aspekte neu orientiert": ["Aspekte-neu-orientiert"],
  "Studium und Universität": ["Studium und Universität"],
  "DSH-Vorbereitung": ["DSH-Vorbereitung"],
  "Digitaler TestDaF": ["Digitaler TestDaF"],
};

interface SpeechRecognitionAlternativeLike {
  readonly transcript: string;
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly 0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
}

type SessionStatus = "idle" | "active" | "recording" | "paused" | "ended";

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function speak(text: string) {
  if (!text || !("speechSynthesis" in window)) {
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 0.92;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

function countTargetUses(text: string): number {
  return (
    text.match(
      /\b(weil|obwohl|dass|wenn|würde|hätte|könnte|sollte|damit|während)\b/gi,
    ) ?? []
  ).length;
}

function getAdaptiveFollowUp(
  report: EvaluationResponse,
  topic: string,
  targetGrammar: string,
  turn: number,
): string {
  if (report.nextAction === "repair") {
    const issue = report.issues[0];
    return issue
      ? `Repariere zuerst ${issue.type.toLocaleLowerCase("de")}: Formuliere den korrigierten Satz neu und verwende ${targetGrammar} noch einmal.`
      : `Formuliere deine Antwort korrekt neu und verwende ${targetGrammar} noch einmal.`;
  }

  const prompts = [
    `Warum? Begründe deine Antwort und verwende ${targetGrammar} erneut.`,
    `Nenne ein konkretes Beispiel zum Thema ${topic}.`,
    `Formuliere dieselbe Aussage jetzt in einem anderen zeitlichen Kontext.`,
    `Übertrage die Struktur auf Studium, Arbeit oder Reise.`,
  ] as const;
  return prompts[turn % prompts.length]!;
}

export function ConversationStudio({
  initialTopicIndex = 0,
}: Readonly<{ initialTopicIndex?: number }>) {
  const {
    state,
    addError,
    addSession,
    completeDailyStep,
    markActivity,
    recordAttempt,
  } = useLearnerState();
  const [path, setPath] = useState(Object.keys(PATH_GROUPS)[0]!);
  const [level, setLevel] = useState("Alle");
  const [skill, setSkill] = useState("Alle");
  const [category, setCategory] = useState("Alle");
  const [selectedIndex, setSelectedIndex] = useState(initialTopicIndex);
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState(
    "Wähle ein Thema und starte die Sitzung.",
  );
  const [correction, setCorrection] = useState<EvaluationResponse | null>(null);
  const [chat, setChat] = useState<
    readonly { readonly role: "coach" | "user"; readonly text: string }[]
  >([]);
  const [turns, setTurns] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [totalUses, setTotalUses] = useState(0);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [errorSaved, setErrorSaved] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recordingStartedAtRef = useRef(0);
  const turnStartedAtRef = useRef(0);

  const pathTracks = useMemo(() => PATH_GROUPS[path] ?? [path], [path]);
  const byPath = useMemo(
    () => speakingTopics.filter((topic) => pathTracks.includes(topic.track)),
    [pathTracks],
  );
  const levels = useMemo(
    () => ["Alle", ...unique(byPath.map((topic) => topic.level))],
    [byPath],
  );
  const byLevel = useMemo(
    () => byPath.filter((topic) => level === "Alle" || topic.level === level),
    [byPath, level],
  );
  const skills = useMemo(
    () => ["Alle", ...unique(byLevel.map((topic) => topic.skill))],
    [byLevel],
  );
  const bySkill = useMemo(
    () => byLevel.filter((topic) => skill === "Alle" || topic.skill === skill),
    [byLevel, skill],
  );
  const categories = useMemo(
    () => ["Alle", ...unique(bySkill.map((topic) => topic.category))],
    [bySkill],
  );
  const topics = useMemo(
    () =>
      bySkill.filter(
        (topic) => category === "Alle" || topic.category === category,
      ),
    [bySkill, category],
  );
  const selected =
    topics.find((topic) => speakingTopics.indexOf(topic) === selectedIndex) ??
    topics[0];
  const selectedGlobalIndex = selected ? speakingTopics.indexOf(selected) : -1;
  const dueReviews = state.reviews.filter(
    (review) => !review.mastered && review.due <= Date.now(),
  ).length;
  const targetGrammar =
    grammarUnits.find(
      (grammar) =>
        state.todayGrammar?.date === getTodayKey() &&
        grammar.title === state.todayGrammar.title,
    ) ??
    grammarUnits.find((grammar) => grammar.level === selected?.level) ??
    grammarUnits.find((grammar) => grammar.level === "A2")!;
  const displayedSeconds =
    totalSeconds +
    (status === "recording" || status === "paused" ? liveSeconds : 0);
  const wordsPerMinute = displayedSeconds
    ? Math.round(totalWords / (displayedSeconds / 60))
    : 0;
  const achievements = [
    {
      key: "starter",
      unlocked: turns >= 1,
      title: "Dialog-Starter",
      hint: "1 ausgewertete Antwort",
    },
    {
      key: "precision",
      unlocked: Boolean(correction?.practiceReady && correction?.ok),
      title: "Präzisions-Treffer",
      hint: "1 vollständig richtige Antwort",
    },
    {
      key: "review-zero",
      unlocked: state.reviews.length > 0 && dueReviews === 0,
      title: "Review-Null",
      hint: "Keine fällige Wiederholung offen",
    },
  ] as const;

  useEffect(() => {
    if (status !== "recording") {
      return;
    }
    const timer = window.setInterval(() => {
      setLiveSeconds(
        Math.max(
          1,
          Math.round((Date.now() - recordingStartedAtRef.current) / 1_000),
        ),
      );
    }, 500);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      try {
        recognitionRef.current?.stop();
      } catch {
        // Recognition can already be stopped by the browser.
      }
    },
    [],
  );

  useEffect(
    () => () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    },
    [audioUrl],
  );

  function resetChildFilters(source: "path" | "level" | "skill" | "category") {
    if (source === "path") {
      setLevel("Alle");
    }
    if (source === "path" || source === "level") {
      setSkill("Alle");
    }
    if (source !== "category") {
      setCategory("Alle");
    }
  }

  function startSession() {
    if (!selected) {
      setFeedback("Wähle zuerst ein Gesprächsthema.");
      return;
    }
    setStatus("active");
    setTranscript("");
    setCorrection(null);
    setChat([{ role: "coach", text: selected.task }]);
    setTurns(0);
    setTotalSeconds(0);
    setTotalWords(0);
    setTotalUses(0);
    setLiveSeconds(0);
    setErrorSaved(false);
    audioBlobRef.current = null;
    turnStartedAtRef.current = Date.now();
    setFeedback("Sitzung aktiv. Sprich oder schreibe deine eigene Antwort.");
    speak(selected.task);
  }

  async function startRecording() {
    if (status === "idle" || status === "ended") {
      setFeedback("Starte zuerst die Sitzung.");
      return;
    }
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Dieses Gerät bietet keine Mikrofonaufnahme.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      audioBlobRef.current = null;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        audioBlobRef.current = blob;
        setAudioUrl((previous) => {
          if (previous) {
            URL.revokeObjectURL(previous);
          }
          return URL.createObjectURL(blob);
        });
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      recordingStartedAtRef.current = Date.now();
      setLiveSeconds(0);
      setStatus("recording");
      setFeedback("Aufnahme läuft …");

      const speechWindow = window as SpeechWindow;
      const Recognition =
        speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
      if (Recognition) {
        const recognition = new Recognition();
        recognitionRef.current = recognition;
        recognition.lang = "de-DE";
        recognition.continuous = true;
        recognition.interimResults = true;
        let finalText = transcript.trim();
        recognition.onresult = (event) => {
          let interimText = "";
          for (
            let resultIndex = event.resultIndex;
            resultIndex < event.results.length;
            resultIndex += 1
          ) {
            const result = event.results[resultIndex]!;
            if (result.isFinal) {
              finalText += `${finalText ? " " : ""}${result[0].transcript}`;
            } else {
              interimText += `${interimText ? " " : ""}${result[0].transcript}`;
            }
          }
          setTranscript(`${finalText} ${interimText}`.trim());
        };
        recognition.start();
      } else {
        setFeedback(
          "Aufnahme läuft. Automatische Spracherkennung ist in diesem Browser nicht verfügbar; du kannst das Transkript manuell eingeben.",
        );
      }
    } catch (error) {
      setFeedback(
        `${error instanceof Error ? error.message : "Mikrofon nicht verfügbar."} Du kannst deine Antwort weiterhin eintippen.`,
      );
    }
  }

  async function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return;
    }
    const seconds = Math.max(
      1,
      Math.round((Date.now() - recordingStartedAtRef.current) / 1_000),
    );
    await new Promise<void>((resolve) => {
      recorder.addEventListener("stop", () => resolve(), { once: true });
      recorder.stop();
    });
    try {
      recognitionRef.current?.stop();
    } catch {
      // Recognition may already have stopped.
    }
    setTotalSeconds((value) => value + seconds);
    setLiveSeconds(0);
    setStatus("active");
    setFeedback("Aufnahme beendet. Prüfe das Transkript und werte es aus.");
  }

  function togglePause() {
    const recorder = recorderRef.current;
    if (!recorder) {
      return;
    }
    if (recorder.state === "recording") {
      recorder.pause();
      try {
        recognitionRef.current?.stop();
      } catch {
        // Recognition can stop automatically.
      }
      setStatus("paused");
      setFeedback("Aufnahme pausiert.");
    } else if (recorder.state === "paused") {
      recorder.resume();
      try {
        recognitionRef.current?.start();
      } catch {
        // Some browsers cannot restart the same recognizer.
      }
      setStatus("recording");
      setFeedback("Aufnahme fortgesetzt.");
    }
  }

  async function requestEvaluation(text: string) {
    return requestEvaluationWithConsent({
      allowOnlineFeedback: state.learner.allowOnlineAI,
      apiBaseUrl: API_BASE_URL,
      text,
      grammar: {
        title: targetGrammar.title,
        rule: targetGrammar.rule,
        examples: targetGrammar.examples,
      },
      kind: "conversation",
      ...(selected?.task || selected?.topic
        ? { taskPrompt: selected.task || selected.topic }
        : {}),
      spellingAffectsMastery: state.settings.spellingAffectsMastery,
    });
  }

  async function evaluate({ persist }: Readonly<{ persist: boolean }>) {
    const text = transcript.trim();
    if (!text) {
      setFeedback("Sprich oder schreibe zuerst deine eigene Antwort.");
      return;
    }
    if (
      persist &&
      recorderRef.current &&
      recorderRef.current.state !== "inactive"
    ) {
      await stopRecording();
    }
    const wordCount = countWords(text);
    if (persist && wordCount < state.settings.minWords) {
      setFeedback(
        `Die Antwort ist noch zu kurz: ${wordCount}/${state.settings.minWords} Wörter.`,
      );
      return;
    }

    setEvaluating(true);
    setErrorSaved(false);
    try {
      const report = await requestEvaluation(text);
      setCorrection(report);
      speak(report.corrected);
      if (persist && selected) {
        const blob = audioBlobRef.current;
        const attemptMode = blob || totalSeconds > 0 ? "speaking" : "writing";
        const latencyMs = Math.max(0, Date.now() - turnStartedAtRef.current);
        const fluencyScore =
          attemptMode === "speaking"
            ? Math.min(
                100,
                Math.round(
                  (wordCount / Math.max(1, latencyMs / 60_000) / 120) * 100,
                ),
              )
            : undefined;
        const followUp = getAdaptiveFollowUp(
          report,
          selected.topic,
          targetGrammar.title,
          turns,
        );
        setTurns((value) => value + 1);
        setTotalWords((value) => value + wordCount);
        setTotalUses((value) => value + countTargetUses(text));
        setChat((rows) => [
          ...rows,
          { role: "user", text },
          { role: "coach", text: followUp },
        ]);
        addSession({
          topic: selected,
          transcript: text,
          corrected: report.corrected,
          accuracyScore: report.accuracyScore,
          ...(fluencyScore === undefined ? {} : { fluencyScore }),
          latencyMs,
        });
        recordAttempt({
          topic: targetGrammar.title,
          mode: attemptMode,
          inputText: text,
          correctedText: report.corrected,
          targetHit: report.targetHit && report.practiceReady,
          verified: report.verified,
          accuracyScore: report.accuracyScore,
          ...(fluencyScore === undefined ? {} : { fluencyScore }),
        });
        if (report.practiceReady) {
          completeDailyStep(2);
        }
        const primaryIssue = report.issues[0];
        if (report.changed || primaryIssue) {
          addError({
            topic: targetGrammar.title,
            original: report.original,
            corrected: report.corrected,
            errorClass: primaryIssue?.errorClass ?? "other",
            explanation:
              primaryIssue?.message ??
              "Die ausgewertete Fassung weicht von deiner ursprünglichen Antwort ab.",
            critical: primaryIssue?.severity === "critical",
          });
          setErrorSaved(true);
        }
        markActivity(1);

        if (state.settings.saveAudio && blob) {
          await saveAudio({
            id: `audio-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
            date: new Date().toISOString(),
            topic: selected.topic,
            transcript: text,
            correctedTranscript: report.corrected,
            targetGrammar: targetGrammar.title,
            blob,
          });
          audioBlobRef.current = null;
        }
        turnStartedAtRef.current = Date.now();
        speak(followUp);
      }
      setFeedback(
        report.practiceReady
          ? report.ok
            ? "Die Antwort ist online geprüft. Beantworte jetzt die adaptive Nachfrage im Chat."
            : "Die Offline-Übung ist bereit. Du kannst weiterreden; die Antwort zählt noch nicht als Beherrschungsnachweis."
          : "Der Fehler wurde klassifiziert und als Reparatur eingeplant. Formuliere die Antwort neu.",
      );
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Die Auswertung ist momentan nicht erreichbar.",
      );
    } finally {
      setEvaluating(false);
    }
  }

  function saveCurrentError() {
    if (!correction || !selected) {
      setFeedback("Es gibt noch keine ausgewertete Korrektur.");
      return;
    }
    addError({
      topic: targetGrammar.title,
      original: correction.original,
      corrected: correction.corrected,
      errorClass: correction.issues[0]?.errorClass ?? "other",
      explanation:
        correction.issues[0]?.message ??
        "Die korrigierte Fassung weicht von der ursprünglichen Antwort ab.",
      critical: correction.issues[0]?.severity === "critical",
    });
    setErrorSaved(true);
    setFeedback("Korrektur im Fehlermotor gespeichert.");
  }

  function endSession() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      void stopRecording();
    }
    setStatus("ended");
    setFeedback(
      "Sitzung beendet. Deine Auswertungen wurden lokal gespeichert.",
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="section-kicker">Freie Produktion</p>
        <h1 className="section-title">Gesprächsstudio</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {speakingTopics.length} Gesprächsthemen · {grammarUnits.length}{" "}
          Grammatikthemen · Aufnahme und Transkript bleiben lokal.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thema wählen</CardTitle>
          <CardDescription>
            Die Menüs bauen von links nach rechts aufeinander auf.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <FilterSelect
            label="Lernpfad"
            value={path}
            values={Object.keys(PATH_GROUPS)}
            onChange={(value) => {
              setPath(value);
              resetChildFilters("path");
            }}
          />
          <FilterSelect
            label="Niveau"
            value={levels.includes(level) ? level : "Alle"}
            values={levels}
            onChange={(value) => {
              setLevel(value);
              resetChildFilters("level");
            }}
          />
          <FilterSelect
            label="Fertigkeit"
            value={skills.includes(skill) ? skill : "Alle"}
            values={skills}
            onChange={(value) => {
              setSkill(value);
              resetChildFilters("skill");
            }}
          />
          <FilterSelect
            label="Themenbereich"
            value={categories.includes(category) ? category : "Alle"}
            values={categories}
            onChange={(value) => {
              setCategory(value);
              resetChildFilters("category");
            }}
          />
          <FilterSelect
            label="Thema"
            value={String(selectedGlobalIndex)}
            values={topics.map((topic) =>
              String(speakingTopics.indexOf(topic)),
            )}
            labels={topics.map(
              (topic) => `${topic.topic} — ${topic.level} · ${topic.category}`,
            )}
            onChange={(value) => setSelectedIndex(Number(value))}
          />
        </CardContent>
      </Card>

      {selected && (
        <Card className="border-blue-900/10 bg-blue-50/60">
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge>{selected.level}</Badge>
              <Badge variant="outline">{selected.skill}</Badge>
              <Badge variant="outline">{selected.category}</Badge>
            </div>
            <CardTitle className="mt-2">{selected.topic}</CardTitle>
            <CardDescription className="max-w-4xl text-foreground/75">
              {selected.task}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <section aria-label="Sprechmissionen" className="space-y-2">
        <h2 className="text-sm font-semibold text-sky-900">Schnellmissionen</h2>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
          <article className="min-w-56 rounded-xl border bg-card p-3 text-sm shadow-sm">
            <strong className="block">Mission 1</strong>
            <span className="text-muted-foreground">
              Eine vollständige Antwort sprechen und auswerten.
            </span>
          </article>
          <article className="min-w-56 rounded-xl border bg-card p-3 text-sm shadow-sm">
            <strong className="block">Mission 2</strong>
            <span className="text-muted-foreground">
              Zielgrammatik mindestens 3-mal verwenden.
            </span>
          </article>
          <article className="min-w-56 rounded-xl border bg-card p-3 text-sm shadow-sm">
            <strong className="block">Mission 3</strong>
            <span className="text-muted-foreground">
              {dueReviews} fällige Wiederholung{dueReviews === 1 ? "" : "en"} im
              Blick behalten.
            </span>
          </article>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.55fr)]">
        <div className="space-y-5">
          <Card>
            <CardContent>
              <div className="grid items-center gap-5 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50 p-4 sm:grid-cols-[8rem_1fr_8rem]">
                <Avatar
                  role="coach"
                  label="Coach"
                  talking={status === "active"}
                />
                <div className="text-center sm:text-left">
                  <p className="text-lg font-semibold">
                    {selected?.topic ?? "Bereit zum Sprechen"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {selected?.task ?? "Wähle zuerst ein Thema."}
                  </p>
                  <p className="mt-2 text-xs text-blue-800">
                    Zielgrammatik: {targetGrammar.title}
                  </p>
                </div>
                <Avatar
                  role="user"
                  label="Du"
                  photo={state.learner.avatarDataUrl}
                  talking={status === "recording"}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
                <StudioAction
                  icon={<Play />}
                  label="Sitzung starten"
                  active
                  onClick={startSession}
                />
                <StudioAction
                  icon={<Mic2 />}
                  label="Aufnehmen"
                  disabled={status !== "active"}
                  onClick={() => void startRecording()}
                />
                <StudioAction
                  icon={status === "paused" ? <Play /> : <Pause />}
                  label={status === "paused" ? "Fortsetzen" : "Pause"}
                  disabled={status !== "recording" && status !== "paused"}
                  onClick={togglePause}
                />
                <StudioAction
                  icon={<Square />}
                  label="Stoppen"
                  disabled={status !== "recording" && status !== "paused"}
                  onClick={() => void stopRecording()}
                />
                <StudioAction
                  icon={
                    evaluating ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <Check />
                    )
                  }
                  label="Auswerten"
                  active
                  disabled={
                    evaluating || status === "idle" || status === "ended"
                  }
                  onClick={() => void evaluate({ persist: true })}
                />
                <StudioAction
                  icon={<CircleStop />}
                  label="Beenden"
                  danger
                  disabled={status === "idle" || status === "ended"}
                  onClick={endSession}
                />
              </div>

              {audioUrl && (
                <audio
                  controls
                  src={audioUrl}
                  className="mt-4 w-full"
                  aria-label="Aufgenommene Antwort"
                />
              )}

              <label className="mt-4 grid gap-2 text-sm font-semibold">
                Dein Transkript
                <Textarea
                  className="min-h-36 font-normal"
                  placeholder="Das Transkript erscheint hier. Alternativ kannst du den Text manuell eingeben."
                  value={transcript}
                  onChange={(event) => setTranscript(event.target.value)}
                />
              </label>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Die Korrektur basiert ausschließlich auf deinem gesprochenen
                oder geschriebenen Satz; es wird keine Musterantwort in dein
                Feld eingesetzt.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={evaluating}
                  onClick={() => void evaluate({ persist: false })}
                >
                  <Send data-icon="inline-start" />
                  Meine Antwort prüfen
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    speak(correction?.corrected ?? transcript.trim())
                  }
                >
                  <Volume2 data-icon="inline-start" />
                  Korrigierte Antwort anhören
                </Button>
              </div>

              {chat.length > 0 && (
                <div className="mt-4 max-h-56 space-y-2 overflow-y-auto rounded-xl border bg-muted/30 p-3">
                  {chat.map((bubble, index) => (
                    <div
                      key={`${bubble.role}-${index}`}
                      className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-6 ${
                        bubble.role === "user"
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "bg-white shadow-sm"
                      }`}
                    >
                      {bubble.text}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Grammatikkorrektur</CardTitle>
              <CardDescription>
                LanguageTool plus Nachweis der heutigen Zielstruktur.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {correction ? (
                <ConversationEvaluation
                  report={correction}
                  grammar={targetGrammar}
                />
              ) : (
                <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                  Die korrigierte Fassung erscheint nach der Auswertung hier.
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                disabled={!correction || errorSaved}
                onClick={saveCurrentError}
              >
                <Save data-icon="inline-start" />
                {errorSaved
                  ? "Im Fehlermotor gespeichert"
                  : "Im Fehlermotor speichern"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Live-Nachweise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Metric value={turns} label="Beiträge" />
                <Metric
                  value={`${Math.floor(displayedSeconds / 60)}:${String(
                    displayedSeconds % 60,
                  ).padStart(2, "0")}`}
                  label="Sprechen"
                />
                <Metric value={totalUses} label="Zieltreffer" />
                <Metric value={wordsPerMinute} label="WPM" />
              </div>
              <p
                role="status"
                className="mt-3 rounded-xl border bg-muted/40 p-3 text-sm leading-6"
              >
                {feedback}
              </p>

              <div className="mt-3 rounded-xl border bg-background p-3">
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">
                  Badges
                </p>
                <div className="mt-2 grid gap-2">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.key}
                      className="flex items-center gap-2 rounded-lg border p-2 text-sm"
                    >
                      <Award
                        className={`size-4 ${achievement.unlocked ? "text-amber-600" : "text-muted-foreground"}`}
                      />
                      <span className="min-w-0 flex-1 font-medium">
                        {achievement.title}
                      </span>
                      <Badge
                        variant={achievement.unlocked ? "secondary" : "outline"}
                      >
                        {achievement.unlocked ? "Erreicht" : achievement.hint}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Headphones className="size-4" />
                Aufnahme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Audio speichern:{" "}
                <strong>{state.settings.saveAudio ? "Ja" : "Nein"}</strong>
              </p>
              <p>
                Mindestlänge: <strong>{state.settings.minWords} Wörter</strong>
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTranscript("");
                  setCorrection(null);
                  setFeedback("Antwortfeld geleert.");
                }}
              >
                <RotateCcw data-icon="inline-start" />
                Antwort zurücksetzen
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sitzungsverlauf</CardTitle>
          <CardDescription>
            Die letzten lokal gespeicherten Gesprächsantworten.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {[...state.sessions]
            .reverse()
            .slice(0, 6)
            .map((session) => (
              <div key={session.id} className="rounded-xl border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong>{session.topic?.topic ?? "Gespräch"}</strong>
                  <span className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("de-DE", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(session.date))}
                  </span>
                </div>
                <p className="mt-2 text-muted-foreground">
                  {session.transcript}
                </p>
                {session.corrected !== session.transcript && (
                  <p className="mt-2 text-sky-800">→ {session.corrected}</p>
                )}
              </div>
            ))}
          {state.sessions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Noch keine Sitzungen gespeichert.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  values,
  labels,
  onChange,
}: Readonly<{
  label: string;
  value: string;
  values: readonly string[];
  labels?: readonly string[];
  onChange: (value: string) => void;
}>) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium">
      {label}
      <select
        className="h-9 min-w-0 rounded-lg border bg-background px-3 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {values.map((item, index) => (
          <option key={item} value={item}>
            {labels?.[index] ?? item}
          </option>
        ))}
      </select>
    </label>
  );
}

function StudioAction({
  icon,
  label,
  active,
  danger,
  disabled,
  onClick,
}: Readonly<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
        danger
          ? "border-red-200 bg-red-50 text-red-800 hover:bg-red-100"
          : active
            ? "border-primary bg-primary text-primary-foreground hover:bg-primary/85"
            : "bg-background hover:bg-muted"
      }`}
    >
      <span className="[&>svg]:size-5">{icon}</span>
      {label}
    </button>
  );
}

function Avatar({
  role,
  label,
  photo,
  talking,
}: Readonly<{
  role: "coach" | "user";
  label: string;
  photo?: string;
  talking: boolean;
}>) {
  const coach = role === "coach";
  return (
    <div className="text-center">
      <ProfileAvatar
        className={`mx-auto size-24 transition-transform ${
          talking ? "scale-105 border-sky-400" : "border-white"
        }`}
        label={label}
        photo={coach ? undefined : photo}
        variant={coach ? "coach" : "learner"}
      />
      <strong className="mt-2 block text-sm">{label}</strong>
    </div>
  );
}

function Metric({
  value,
  label,
}: Readonly<{ value: string | number; label: string }>) {
  return (
    <div className="rounded-xl border bg-muted/30 p-3 text-center">
      <strong className="block text-xl text-primary">{value}</strong>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function ConversationEvaluation({
  report,
  grammar,
}: Readonly<{ report: EvaluationResponse; grammar: GrammarUnit }>) {
  return (
    <div className="space-y-3">
      <div
        className={`rounded-xl border p-3 text-sm font-semibold ${
          report.practiceReady
            ? "border-sky-300 bg-sky-50 text-sky-900"
            : "border-red-200 bg-red-50 text-red-900"
        }`}
      >
        {report.ok
          ? "✓ Die Antwort ist online geprüft und richtig."
          : report.practiceReady
            ? "✓ Offline-Übung bereit; noch kein Beherrschungsnachweis."
            : "✗ Die Antwort ist noch nicht vollständig richtig."}{" "}
        <Badge variant="outline" className="ml-1">
          {report.online ? "online geprüft" : "Offline-Ersatzprüfung"}
        </Badge>
        <Badge variant="secondary" className="ml-1">
          Genauigkeit {report.accuracyScore} %
        </Badge>
      </div>
      <EvaluationSection title="Deine Antwort">
        {report.original}
      </EvaluationSection>
      <EvaluationSection title="Gefundene Fehler und Erklärung">
        {report.issues.length ? (
          <ul className="grid gap-2">
            {report.issues.map((issue, index) => (
              <li key={`${issue.type}-${index}`}>
                <span className="mb-1 flex flex-wrap items-center gap-2">
                  <strong>{issue.type}</strong>
                  <Badge variant="outline">
                    {errorClassLabels[issue.errorClass]}
                  </Badge>
                  <Badge
                    variant={
                      issue.severity === "critical"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {issue.severity === "critical"
                      ? "kritisch"
                      : issue.severity === "major"
                        ? "wichtig"
                        : "leicht"}
                  </Badge>
                </span>
                {issue.message}
                {issue.context && (
                  <span className="block text-xs text-muted-foreground">
                    Stelle: {issue.context}
                  </span>
                )}
                {issue.suggestion && (
                  <span className="block text-xs text-muted-foreground">
                    Vorschlag: {issue.suggestion}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          "Keine sprachlichen oder aufgabenbezogenen Fehler gefunden."
        )}
      </EvaluationSection>
      <EvaluationSection title="Richtige oder verbesserte Fassung">
        <strong>{report.corrected}</strong>
      </EvaluationSection>
      <EvaluationSection title={`Passende Lektionen zu „${grammar.title}“`}>
        <div className="grid gap-2 sm:grid-cols-2">
          {grammar.links.map((link) => (
            <a
              key={`${link[0]}-${link[1]}`}
              href={link[1]}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border px-3 py-2 font-medium text-blue-800 hover:bg-blue-50"
            >
              {link[3] === "exercise" ? "Übung" : "Erklärung"} · {link[0]} ↗
            </a>
          ))}
        </div>
      </EvaluationSection>
      {report.networkError && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-900">
          Die Online-Prüfung war nicht erreichbar: {report.networkError}. Die
          Übung darf weitergehen, verändert aber keine Beherrschungs- oder
          GER-Nachweise.
        </p>
      )}
    </div>
  );
}

function EvaluationSection({
  title,
  children,
}: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <section className="rounded-xl border p-3 text-sm leading-6">
      <h3 className="mb-1 font-semibold">{title}</h3>
      {children}
    </section>
  );
}
