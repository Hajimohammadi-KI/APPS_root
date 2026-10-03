"use client";
import {AutomaticityEvidenceSummary} from "@/features/components/automaticity-evidence-summary";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  appendEvidenceInvalidationToStorage,
  appendLearningEvidenceBundleToStorage,
  buildAttemptVerticalSlice,
  normalizeDailySessionMinutes,
  type DailySessionMinutes,
} from "@automaticity/learning-core";
import {
  conversationTopics,
  copy,
  speechLocale,
  spokenChunksUsed,
  type StudioLanguage,
} from "./conversation-data";
import {
  integratedSkillsLevels,
  type IntegratedSkillsUnit,
} from "@grammar/content";
import {
  saveConversationSession,
  type StoredEvaluationIssue,
} from "./conversation-storage";
import { playTeacherAudioByContextKey } from "@/lib/teacher-content";
import { AvaCoachAvatar } from "@/features/components/ava-coach-avatar";

const nav = [
  "Home",
  "Today’s Practice",
  "Lessons",
  "Speaking Studio",
  "Review",
  "Progress",
  "Vocabulary",
  "Notebook",
];
const navRoutes = [
  "/",
  "/daily",
  "/grammar",
  "/studio",
  "/?screen=errors",
  "/?screen=progress",
  "/flashcards",
  "/notebook",
];
const navIcons = ["⌂", "◷", "▤", "♩", "◴", "▥", "▧", "▣"];

type RecordingState = "idle" | "recording" | "paused";
type PracticeMode = "guided" | "challenge" | "pronunciation";

interface EvaluationResponse {
  readonly original: string;
  readonly corrected: string;
  readonly provider: "LanguageTool";
  readonly checkedAt: string;
  readonly issues: readonly StoredEvaluationIssue[];
}

interface RecognitionAlternativeLike {
  readonly transcript: string;
}

interface RecognitionResultLike {
  readonly isFinal: boolean;
  readonly 0: RecognitionAlternativeLike;
}

interface RecognitionEventLike {
  readonly resultIndex: number;
  readonly results: ArrayLike<RecognitionResultLike>;
}

interface RecognitionErrorLike {
  readonly error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: RecognitionErrorLike) => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

function recognitionConstructor(): SpeechRecognitionConstructor | undefined {
  const browserWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return (
    browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition
  );
}

function isEvaluationResponse(value: unknown): value is EvaluationResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.original === "string" &&
    typeof candidate.corrected === "string" &&
    candidate.provider === "LanguageTool" &&
    typeof candidate.checkedAt === "string" &&
    Array.isArray(candidate.issues)
  );
}

function Icon({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <span className="icon" aria-hidden="true">
      {children}
    </span>
  );
}

function unique(values: readonly string[]) {
  return [...new Set(values)];
}

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function safeSameOriginPath(value: string | null, fallback: string) {
  if (!value) return fallback;
  try {
    const candidate = new URL(value, window.location.origin);
    if (candidate.origin !== window.location.origin) return fallback;
    return `${candidate.pathname}${candidate.search}${candidate.hash}`;
  } catch {
    return fallback;
  }
}

function returnToPriorContext(returnPath: string) {
  const safePath = safeSameOriginPath(returnPath, "/");
  const target = new URL(safePath, window.location.origin);
  const referrer = document.referrer
    ? new URL(document.referrer, window.location.origin)
    : null;
  const referrerMatches =
    referrer?.origin === target.origin &&
    referrer.pathname === target.pathname &&
    (!target.search || referrer.search === target.search);

  // Real browser history preserves the caller's scroll and lesson state and
  // avoids creating a Return/Back loop. A direct-open tab uses the safe path.
  if (referrerMatches && window.history.length > 1) window.history.back();
  else window.location.assign(safePath);
}

function currentStudioLanguage(): StudioLanguage {
  return "en";
}

function currentSessionMinutes(): DailySessionMinutes {
  try {
    const state = JSON.parse(
      window.localStorage.getItem("grammar-automaticity:v27") ?? "{}",
    ) as { settings?: { dailyStudyMinutes?: number } };
    return normalizeDailySessionMinutes(
      state.settings?.dailyStudyMinutes ?? 15,
    );
  } catch {
    return 15;
  }
}

function comparableTokens(value: string) {
  const ignored = new Set(["a", "an", "and", "clearly", "the", "to", "your"]);
  return (
    value
      .toLowerCase()
      .match(/[a-z]+/g)
      ?.map((token) => token.replace(/(ing|ed|es|s|e)$/u, ""))
      .filter((token) => token.length > 2 && !ignored.has(token)) ?? []
  );
}

function topicForIntegratedUnit(level: string, unit: IntegratedSkillsUnit) {
  const unitTokens = new Set(comparableTokens(`${unit.title} ${unit.outcome}`));
  return conversationTopics
    .filter((topic) => topic.level === level)
    .map((topic) => ({
      topic,
      score: comparableTokens(`${topic.topic} ${topic.task}`).filter((token) =>
        unitTokens.has(token),
      ).length,
    }))
    .sort((left, right) => right.score - left.score)[0]?.topic;
}

export default function Home() {
  const path = "Complete English";
  const language = currentStudioLanguage();
  const text = copy[language];
  const stepLabels =
    language === "de"
      ? [
          "Hören",
          "Antwort",
          "Replay",
          "Prüfen",
          "Korrigieren",
          "Verbessern",
          "Speichern",
        ]
      : ["Listen", "Answer", "Replay", "Review", "Correct", "Improve", "Save"];
  const [level, setLevel] = useState("All");
  const [skill, setSkill] = useState("All");
  const [category, setCategory] = useState("All");
  const [topicId, setTopicId] = useState(conversationTopics[0]?.id ?? "");
  const [active, setActive] = useState(1);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("guided");
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [hasAudioBlob, setHasAudioBlob] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
  const [baseline, setBaseline] = useState<EvaluationResponse | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showCorrections, setShowCorrections] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [dailyActivity, setDailyActivity] = useState<number | null>(null);
  const [dailyReturn, setDailyReturn] = useState("/daily");
  const [dailyComplete, setDailyComplete] = useState(false);
  const [integratedContext, setIntegratedContext] = useState<{
    level: string;
    number: number;
    title: string;
  } | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const transcriptRef = useRef<HTMLTextAreaElement | null>(null);
  const attemptIdRef = useRef<string | null>(null);
  const savedEvidenceIdRef = useRef<string | null>(null);
  const [voiceRecoveryAvailable, setVoiceRecoveryAvailable] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("source") === "integrated-skills") {
      const requestedUnit = params.get("unit");
      const requestedLevel = params.get("level");
      const integratedLevel = integratedSkillsLevels.find(
        (candidate) => !requestedLevel || candidate.cefr === requestedLevel,
      );
      const integratedUnit = integratedLevel?.units.find(
        (candidate) => candidate.id === requestedUnit,
      );
      if (integratedLevel && integratedUnit) {
        setLevel(integratedLevel.cefr);
        const matching = topicForIntegratedUnit(
          integratedLevel.cefr,
          integratedUnit,
        );
        if (matching) setTopicId(matching.id);
        setIntegratedContext({
          level: integratedLevel.cefr,
          number: integratedUnit.number,
          title: integratedUnit.title,
        });
      }
      return;
    }
    if (params.get("from") !== "daily") return;
    const activity = Number(params.get("activity"));
    const requestedLevel = params.get("level");
    const requestedTopic = params.get("topic")?.toLowerCase();
    setDailyActivity(Number.isFinite(activity) ? activity : 2);
    setDailyReturn(safeSameOriginPath(params.get("return"), "/daily"));
    if (requestedLevel) setLevel(requestedLevel);
    const matching =
      conversationTopics.find(
        (topic) =>
          (!requestedLevel || topic.level === requestedLevel) &&
          (!requestedTopic ||
            topic.topic.toLowerCase().includes(requestedTopic) ||
            requestedTopic.includes(topic.topic.toLowerCase())),
      ) ??
      conversationTopics.find(
        (topic) => !requestedLevel || topic.level === requestedLevel,
      );
    if (matching) setTopicId(matching.id);
  }, []);

  function finishDailyActivity() {
    if (dailyActivity === null) return;
    const key = "english-automaticity:daily-session:v1";
    const current = JSON.parse(localStorage.getItem(key) || "{}");
    const completed = [
      ...new Set([...(current.completedActivities || []), dailyActivity]),
    ];
    const mistakes = evaluation?.issues?.length
      ? [
          ...(current.mistakes || []),
          ...evaluation.issues.map((issue) => ({
            activity: dailyActivity,
            topic: selected.topic,
            message: issue.message,
            correction: evaluation.corrected,
          })),
        ]
      : current.mistakes || [];
    localStorage.setItem(
      key,
      JSON.stringify({
        ...current,
        currentActivity: dailyActivity,
        completedActivities: completed,
        mistakes,
        updatedAt: new Date().toISOString(),
      }),
    );
    setDailyComplete(true);
  }
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const allForPath = useMemo(
    () => conversationTopics.filter((topic) => topic.path === path),
    [path],
  );
  const allLabel = text.all;
  const levels = [allLabel, ...unique(allForPath.map((topic) => topic.level))];
  const byLevel = allForPath.filter(
    (topic) => level === allLabel || topic.level === level,
  );
  const skills = [allLabel, ...unique(byLevel.map((topic) => topic.skill))];
  const bySkill = byLevel.filter(
    (topic) => skill === allLabel || topic.skill === skill,
  );
  const categories = [
    allLabel,
    ...unique(bySkill.map((topic) => topic.category)),
  ];
  const filteredTopics = bySkill.filter(
    (topic) => category === allLabel || topic.category === category,
  );
  // A missing authored catalog is a build-time data error, not a value that
  // should reach the learner UI through an unsafe non-null assertion.
  const fallbackTopic = allForPath[0] ?? conversationTopics[0];
  if (!fallbackTopic) {
    throw new Error("Conversation Studio requires at least one topic.");
  }
  const selected =
    filteredTopics.find((topic) => topic.id === topicId) ??
    filteredTopics[0] ??
    fallbackTopic;
  const maxSeconds = practiceMode === "challenge" ? 60 : 120;
  const wordCount = transcript.trim().match(/[\p{L}\p{N}'’-]+/gu)?.length ?? 0;
  const wordsPerMinute =
    seconds > 0 ? Math.round(wordCount / (seconds / 60)) : 0;
  const matchedSpokenChunks = useMemo(
    () =>
      spokenChunksUsed(
        `${transcript} ${interimTranscript}`.trim(),
        selected.spokenChunks,
      ),
    [interimTranscript, selected.spokenChunks, transcript],
  );

  useEffect(() => {
    if (recordingState !== "recording") return;
    const timer = window.setInterval(() => {
      setSeconds((current) => Math.min(current + 1, maxSeconds));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [maxSeconds, recordingState]);

  useEffect(() => {
    if (recordingState !== "recording" || seconds < maxSeconds) return;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    try {
      recognitionRef.current?.stop();
    } catch {
      /* already stopped */
    }
  }, [maxSeconds, recordingState, seconds]);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      try {
        recognitionRef.current?.stop();
      } catch {
        // The recognition engine can already be stopped by the browser.
      }
      window.speechSynthesis?.cancel();
    },
    [],
  );

  useEffect(
    () => () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    },
    [audioUrl],
  );

  function resetSession(clearBaseline = true) {
    setTranscript("");
    setInterimTranscript("");
    setEvaluation(null);
    if (clearBaseline) setBaseline(null);
    setSavedId(null);
    setSeconds(0);
    setMessage(null);
    audioBlobRef.current = null;
    attemptIdRef.current = null;
    savedEvidenceIdRef.current = null;
    setHasAudioBlob(false);
    setAudioUrl(null);
    window.speechSynthesis?.cancel();
  }

  async function speak(contextKey?: string) {
    const teacherKey =
      contextKey === selected.task
        ? `conversation.${selected.id}`
        : contextKey?.startsWith("conversation.")
          ? contextKey
          : undefined;
    const played = teacherKey
      ? await playTeacherAudioByContextKey(teacherKey)
      : false;
    if (!played)
      setMessage(
        "No human recording is attached yet. Ask the teacher to add one in Teacher Studio.",
      );
  }

  function startSpeechRecognition(initialText: string) {
    const Recognition = recognitionConstructor();
    if (!Recognition) return false;
    const recognition = new Recognition();
    recognition.lang = speechLocale[language];
    recognition.continuous = true;
    recognition.interimResults = true;
    let finalText = initialText.trim();
    recognition.onresult = (event) => {
      let interim = "";
      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];
        const words = result?.[0]?.transcript ?? "";
        if (result?.isFinal) finalText += `${finalText ? " " : ""}${words}`;
        else interim += `${interim ? " " : ""}${words}`;
      }
      setTranscript(finalText.trim());
      setInterimTranscript(interim.trim());
    };
    recognition.onerror = (event) => {
      if (event.error !== "aborted" && event.error !== "no-speech") {
        setMessage(
          `${language === "de" ? "Spracherkennung" : "Speech recognition"}: ${event.error}`,
        );
      }
    };
    try {
      recognition.start();
      recognitionRef.current = recognition;
      return true;
    } catch {
      recognitionRef.current = null;
      return false;
    }
  }

  async function startRecording({
    keepBaseline = false,
  }: { keepBaseline?: boolean } = {}) {
    setMessage(null);
    setVoiceRecoveryAvailable(false);
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setMessage(
        language === "de"
          ? "Audioaufnahme wird von diesem Browser nicht unterstützt."
          : "Audio recording is not supported in this browser.",
      );
      setVoiceRecoveryAvailable(true);
      return;
    }
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      const nextAttemptId = crypto.randomUUID();
      if (savedEvidenceIdRef.current) {
        appendEvidenceInvalidationToStorage(window.localStorage, {
          evidenceId: savedEvidenceIdRef.current,
          occurredAt: new Date().toISOString(),
          supersedingResponseId: `${nextAttemptId}:response`,
        });
      }
      attemptIdRef.current = nextAttemptId;
      savedEvidenceIdRef.current = null;
      streamRef.current = stream;
      chunksRef.current = [];
      audioBlobRef.current = null;
      setHasAudioBlob(false);
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        audioBlobRef.current = blob;
        setHasAudioBlob(blob.size > 0);
        setAudioUrl(blob.size > 0 ? URL.createObjectURL(blob) : null);
        stream.getTracks().forEach((track) => track.stop());
        setRecordingState("idle");
        setActive(2);
      };

      setTranscript("");
      setInterimTranscript("");
      setEvaluation(null);
      if (!keepBaseline) setBaseline(null);
      setSavedId(null);
      setSeconds(0);
      setAudioUrl(null);

      if (!startSpeechRecognition("")) {
        setMessage(
          language === "de"
            ? "Audio wird aufgenommen, aber Live-Transkription ist nicht verfügbar. Du kannst das Transkript manuell eingeben."
            : "Audio is recording, but live transcription is unavailable. You can enter the transcript manually.",
        );
        setVoiceRecoveryAvailable(true);
      }
      recorder.start(250);
      setRecordingState("recording");
      setActive(1);
    } catch (error) {
      const blocked =
        error instanceof DOMException &&
        ["NotAllowedError", "SecurityError"].includes(error.name);
      setMessage(
        blocked
          ? language === "de"
            ? "Mikrofonzugriff wurde blockiert. Erlaube ihn im Browser und versuche es erneut."
            : "Microphone access was blocked. Allow it in your browser and try again."
          : language === "de"
            ? "Das Mikrofon konnte nicht gestartet werden."
            : "The microphone could not be started.",
      );
      setVoiceRecoveryAvailable(true);
    }
  }

  function pauseOrResume() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    if (recorder.state === "recording") {
      recorder.pause();
      const reviewedTranscript = `${transcript} ${interimTranscript}`.trim();
      setTranscript(reviewedTranscript);
      setInterimTranscript("");
      try {
        recognitionRef.current?.stop();
      } catch {
        /* already stopped */
      }
      setRecordingState("paused");
      return;
    }
    recorder.resume();
    startSpeechRecognition(transcript.trim());
    setRecordingState("recording");
  }

  function finishRecording() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    try {
      recognitionRef.current?.stop();
    } catch {
      /* already stopped */
    }
    setRecordingState("idle");
  }

  async function evaluateTranscript() {
    const reviewedTranscript = `${transcript} ${interimTranscript}`.trim();
    if (!reviewedTranscript) {
      setMessage(
        language === "de"
          ? "Prüfe oder ergänze zuerst dein Transkript."
          : "Review or enter your transcript first.",
      );
      return;
    }
    setTranscript(reviewedTranscript);
    setInterimTranscript("");
    setEvaluating(true);
    setMessage(null);
    try {
      const response = await fetch("/api/conversation/evaluate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: reviewedTranscript, language }),
      });
      const payload: unknown = await response.json();
      if (!response.ok || !isEvaluationResponse(payload))
        throw new Error("Provider response was unavailable or invalid.");
      setEvaluation(payload);
      setAttempts((current) => current + 1);
      setActive(3);
    } catch {
      setEvaluation(null);
      setMessage(text.providerUnavailable);
    } finally {
      setEvaluating(false);
    }
  }

  async function practiceImprovedVersion() {
    if (!evaluation) return;
    setBaseline(evaluation);
    await startRecording({ keepBaseline: true });
  }

  async function saveSession() {
    if (!evaluation || !audioBlobRef.current) {
      setMessage(
        language === "de"
          ? "Für das Speichern werden Aufnahme und echte Auswertung benötigt."
          : "A recording and a real evaluation are required before saving.",
      );
      return;
    }
    const id = attemptIdRef.current ?? crypto.randomUUID();
    const occurredAt = new Date().toISOString();
    try {
      await saveConversationSession({
        id,
        createdAt: occurredAt,
        language,
        topicId: selected.id,
        transcript: evaluation.original,
        corrected: evaluation.corrected,
        durationSeconds: seconds,
        wordCount,
        wordsPerMinute,
        provider: evaluation.provider,
        checkedAt: evaluation.checkedAt,
        issues: evaluation.issues,
        audio: audioBlobRef.current,
      });
      const bundle = buildAttemptVerticalSlice({
        attemptId: id,
        occurredAt,
        language,
        cefrLevel: selected.level,
        contentVersion: selected.contentVersion,
        topic: selected.topic,
        targetForm: selected.targetForm,
        prompt: selected.task,
        mode: "speaking",
        inputText: evaluation.original,
        correctedText: evaluation.corrected,
        targetHit: evaluation.issues.length === 0,
        accuracyScore: Math.max(0, 100 - evaluation.issues.length * 10),
        fluencyScore: Math.min(100, wordsPerMinute),
        latencyMs: seconds * 1_000,
        attemptVerified: true,
        assessedBy: "online",
        sessionMinutes: currentSessionMinutes(),
        audioCaptured: audioBlobRef.current.size > 0,
        audioReferenceId: id,
        sourceId: selected.sourceId,
      });
      appendLearningEvidenceBundleToStorage(window.localStorage, bundle);
      savedEvidenceIdRef.current = bundle.evidence.id;
      setSavedId(id);
      setMessage(text.saved);
      finishDailyActivity();
    } catch {
      setMessage(
        language === "de"
          ? "Die Sitzung konnte in diesem Browser nicht gespeichert werden."
          : "The session could not be saved in this browser.",
      );
    }
  }

  const modeCards =
    language === "de"
      ? ([
          [
            "guided",
            "☵",
            "Geführtes Gespräch",
            "Mit Aufgabe und Korrektur üben.",
          ],
          [
            "challenge",
            "◴",
            "60-Sekunden-Challenge",
            "Flüssigkeit unter Zeitdruck trainieren.",
          ],
          [
            "pronunciation",
            "▥",
            "Aussprachetraining",
            "Aufnehmen und genau nachhören; ohne erfundene Aussprachewertung.",
          ],
        ] as const)
      : ([
          [
            "guided",
            "☵",
            "Guided conversation",
            "Practice with a prompt and real correction.",
          ],
          [
            "challenge",
            "◴",
            "60-second challenge",
            "Build fluency under time pressure.",
          ],
          [
            "pronunciation",
            "▥",
            "Pronunciation practice",
            "Record and replay carefully; no invented pronunciation score.",
          ],
        ] as const);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">{language === "de" ? "D" : "E"}</div>
          <div>
            <strong>
              {language === "de" ? (
                <>
                  Deutsch
                  <br />
                  Automaticity
                </>
              ) : (
                <>
                  English
                  <br />
                  Automaticity
                </>
              )}
            </strong>
          </div>
        </div>
        <nav aria-label="Main navigation">
          {nav.map((item, index) => (
            <button
              key={item}
              className={index === 3 ? "nav-active" : ""}
              onClick={() => {
                window.location.href = navRoutes[index] ?? "/";
              }}
            >
              <Icon>{navIcons[index]}</Icon>
              {item}
            </button>
          ))}
        </nav>
        <div className="nav-divider" />
        <nav aria-label="Support navigation">
          <button
            onClick={() => {
              window.location.href = "/settings";
            }}
          >
            <Icon>⚙</Icon>Settings
          </button>
          <button
            onClick={() => {
              window.location.href = "/support";
            }}
          >
            <Icon>?</Icon>Help & support
          </button>
        </nav>
        <div className="growth">
          <Icon>♔</Icon>
          <div>
            <b>
              {language === "de"
                ? "Du automatisierst dein Deutsch."
                : "You’re building English automaticity."}
            </b>
            <span>
              {language === "de"
                ? "Regelmäßige Produktion schafft Sicherheit."
                : "Consistent production creates lasting progress."}
            </span>
          </div>
        </div>
      </aside>

      <main>
<AutomaticityEvidenceSummary />
        <header>
          <div>
            <h1>{text.title}</h1>
            <p>{text.subtitle}</p>
          </div>
          <div className="header-actions">
            <span>
              ● <b>{language === "de" ? "Deutsch" : "English"}</b>
            </span>
            <span>Local-first</span>
            <div className="profile">E</div>
          </div>
        </header>

        {dailyActivity !== null && (
          <section
            className="daily-context-bar"
            aria-label="Today's practice navigation"
          >
            <button
              onClick={() =>
                active > 0
                  ? setActive((current) => current - 1)
                  : returnToPriorContext(dailyReturn)
              }
            >
              ← Previous
            </button>
            <strong>
              Today’s speaking practice · activity {dailyActivity}
            </strong>
            <button onClick={() => returnToPriorContext(dailyReturn)}>
              Return to Today’s Practice
            </button>
          </section>
        )}
        {integratedContext !== null && (
          <section
            className="daily-context-bar"
            aria-label="Integrated Skills navigation"
          >
            <button
              onClick={() => returnToPriorContext("/?screen=integrated-skills")}
            >
              ← Integrated Skills
            </button>
            <strong>
              {integratedContext.level} · Unit {integratedContext.number} ·{" "}
              {integratedContext.title}
            </strong>
            <button
              onClick={() => returnToPriorContext("/?screen=integrated-skills")}
            >
              Return to lesson
            </button>
          </section>
        )}

        <section
          className="conversation-filter"
          aria-labelledby="filter-heading"
        >
          <h2 id="filter-heading">{text.filterTitle}</h2>
          <div className="conversation-filter-grid">
            <input type="hidden" value={path} readOnly />
            <label>
              <span>{text.labels[1]}</span>
              <select
                disabled={recordingState !== "idle"}
                value={levels.includes(level) ? level : allLabel}
                onChange={(event) => {
                  setLevel(event.target.value);
                  setSkill(allLabel);
                  setCategory(allLabel);
                  setTopicId("");
                  resetSession();
                }}
              >
                {levels.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              <span>{text.labels[2]}</span>
              <select
                disabled={recordingState !== "idle"}
                value={skills.includes(skill) ? skill : allLabel}
                onChange={(event) => {
                  setSkill(event.target.value);
                  setCategory(allLabel);
                  setTopicId("");
                  resetSession();
                }}
              >
                {skills.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              <span>{text.labels[3]}</span>
              <select
                disabled={recordingState !== "idle"}
                value={categories.includes(category) ? category : allLabel}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setTopicId("");
                  resetSession();
                }}
              >
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              <span>{text.labels[4]}</span>
              <select
                disabled={recordingState !== "idle"}
                value={selected.id}
                onChange={(event) => {
                  setTopicId(event.target.value);
                  resetSession();
                }}
              >
                {filteredTopics.map((topic) => (
                  <option value={topic.id} key={topic.id}>
                    {topic.topic}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="mode-cards" aria-label="Practice mode">
          {modeCards.map(([mode, icon, title, description], index) => (
            <button
              disabled={recordingState !== "idle"}
              key={mode}
              className={`mode ${practiceMode === mode ? "active-mode" : ""}`}
              onClick={() => {
                setPracticeMode(mode);
                resetSession();
              }}
            >
              <span
                className={
                  index === 1 ? "orange-mode" : index === 2 ? "green-mode" : ""
                }
              >
                {icon}
              </span>
              <div>
                <b>{title}</b>
                <small>{description}</small>
              </div>
              {practiceMode === mode && <i>✓</i>}
            </button>
          ))}
        </section>

        <div className="workspace">
          <section className="studio">
            <div className="steps" aria-label="Practice steps">
              {stepLabels.map((step, index) => (
                <button
                  key={step}
                  onClick={() => setActive(index)}
                  className={active === index ? "active" : ""}
                >
                  <b>{index + 1}</b>
                  <Icon>{["♧", "♩", "▷", "▧", "✓", "↗", "▯"][index]}</Icon>
                  <span>{step}</span>
                </button>
              ))}
            </div>

            <div className="coach-card">
              <div className="coach-topic">
                <h2>{selected.topic}</h2>
                <span>
                  {selected.level} · {selected.category}
                </span>
              </div>
              <div className="coach-stage">
                <div className="coach-glow">
                  <AvaCoachAvatar className="coach-avatar" />
                </div>
                <div className="coach-dialogue">
                  <strong>
                    Ava ·{" "}
                    {language === "de"
                      ? "Deine Sprechtrainerin"
                      : "Your speaking coach"}
                  </strong>
                  <p>{selected.task}</p>
                  <button
                    className="prompt-audio"
                    onClick={() => speak(selected.task)}
                  >
                    ▶ {language === "de" ? "Aufgabe anhören" : "Hear prompt"}
                  </button>
                </div>
              </div>
              <section
                className="spoken-chunk-bank"
                aria-labelledby="spoken-chunk-title"
              >
                <div className="spoken-chunk-heading">
                  <div>
                    <small>NATURAL SPOKEN ENGLISH</small>
                    <h3 id="spoken-chunk-title">
                      Build your answer with chunks
                    </h3>
                    <p>
                      Choose at least two and adapt the ending to this topic.
                      The examples are models, not lines to memorize.
                    </p>
                  </div>
                  <strong aria-live="polite">
                    {matchedSpokenChunks.length}/{selected.spokenChunks.length}{" "}
                    used
                  </strong>
                </div>
                <ul className="spoken-chunk-list">
                  {selected.spokenChunks.map((chunk) => {
                    const used = matchedSpokenChunks.some(
                      (matched) => matched.text === chunk.text,
                    );
                    return (
                      <li key={chunk.text} data-used={used}>
                        <div>
                          <b>{chunk.text}</b>
                          <small>{chunk.purpose}</small>
                          <p>
                            <span>Example:</span> {chunk.example}
                          </p>
                        </div>
                        <div className="spoken-chunk-actions">
                          <button
                            type="button"
                            onClick={() => speak(chunk.example)}
                            aria-label={`Hear ${chunk.text}`}
                          >
                            ▶ Hear
                          </button>
                          {used && <span>✓ Used</span>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>

            <div className="record-card">
              <div
                className={`mic ${recordingState === "recording" ? "recording" : ""}`}
                aria-hidden="true"
              >
                ♩
              </div>
              <div className="record-main">
                <h3>
                  {recordingState === "recording"
                    ? text.recording
                    : audioUrl
                      ? text.recorded
                      : text.record}
                </h3>
                <strong>
                  {formatTime(seconds)} / {formatTime(maxSeconds)}
                </strong>
                <span className="ready">
                  {recordingState === "paused"
                    ? "Paused"
                    : recordingState === "recording"
                      ? "Listening"
                      : text.ready}
                </span>
                <div
                  className={`wave ${recordingState === "recording" ? "live" : ""}`}
                  aria-hidden="true"
                >
                  {Array.from({ length: 58 }, (_, index) => (
                    <i
                      key={index}
                      style={{ height: `${8 + ((index * 17) % 30)}px` }}
                    />
                  ))}
                </div>
                {message && (
                  <p className="mic-error" role="status">
                    {message}
                  </p>
                )}
                {voiceRecoveryAvailable && (
                  <button
                    className="prompt-audio"
                    onClick={() => {
                      // Manual text is the no-cost recovery path when browser
                      // microphone or speech recognition is unavailable.
                      setActive(1);
                      transcriptRef.current?.focus();
                    }}
                    type="button"
                  >
                    Continue by typing
                  </button>
                )}
                {audioUrl && (
                  <audio
                    ref={audioRef}
                    className="audio-player"
                    src={audioUrl}
                    controls
                    aria-label="Recorded answer"
                  />
                )}
                <div className="record-controls">
                  <button
                    onClick={() => void audioRef.current?.play()}
                    disabled={!audioUrl}
                  >
                    ♧ Replay
                  </button>
                  <button
                    onClick={() => void startRecording()}
                    disabled={recordingState !== "idle"}
                  >
                    <em /> Record
                  </button>
                  <button
                    onClick={pauseOrResume}
                    disabled={recordingState === "idle"}
                  >
                    Ⅱ {recordingState === "paused" ? "Resume" : "Pause"}
                  </button>
                  <button
                    onClick={finishRecording}
                    disabled={recordingState === "idle"}
                  >
                    ■ Stop
                  </button>
                  <button
                    className="primary"
                    disabled={
                      evaluating ||
                      (!transcript.trim() && !interimTranscript.trim())
                    }
                    onClick={() => void evaluateTranscript()}
                  >
                    ✣ {evaluating ? text.evaluating : text.evaluate}
                  </button>
                </div>
              </div>
              <div className="levels" aria-hidden="true">
                ▂▄▆█
              </div>
              <label className="transcript">
                <b>{text.transcript}</b>
                <textarea
                  ref={transcriptRef}
                  value={`${transcript}${interimTranscript ? ` ${interimTranscript}` : ""}`}
                  placeholder={text.transcriptPlaceholder}
                  onChange={(event) => {
                    setTranscript(event.target.value);
                    setInterimTranscript("");
                    setEvaluation(null);
                    setSavedId(null);
                  }}
                />
              </label>
            </div>

            {active === 0 && (
              <section className="flow-panel listen-panel">
                <div className="flow-title">
                  <span>♧</span>
                  <div>
                    <small>STEP 1 · {stepLabels[0]}</small>
                    <h3>
                      {language === "de"
                        ? "Höre die Aufgabe"
                        : "Listen to the task"}
                    </h3>
                  </div>
                </div>
                <blockquote>{selected.task}</blockquote>
                <div className="flow-actions">
                  <button onClick={() => speak(selected.task)}>▶ Play</button>
                  <button className="primary" onClick={() => setActive(1)}>
                    {language === "de" ? "Ich bin bereit →" : "I’m ready →"}
                  </button>
                </div>
              </section>
            )}

            {active === 2 && (
              <section className="flow-panel replay-panel">
                <div className="flow-title">
                  <span>▷</span>
                  <div>
                    <small>STEP 3 · REPLAY</small>
                    <h3>
                      {language === "de"
                        ? "Höre deine echte Aufnahme"
                        : "Listen to your real recording"}
                    </h3>
                  </div>
                </div>
                {audioUrl ? (
                  <>
                    <audio src={audioUrl} controls className="review-audio" />
                    <p className="flow-note">
                      {language === "de"
                        ? "Höre zuerst ohne Text und prüfe danach das Transkript."
                        : "Listen once without reading, then verify the transcript."}
                    </p>
                    <div className="flow-actions">
                      <button onClick={() => void startRecording()}>
                        Record again
                      </button>
                      <button className="primary" onClick={() => setActive(3)}>
                        Review →
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flow-empty">
                    {language === "de"
                      ? "Noch keine Aufnahme vorhanden."
                      : "No recording yet."}
                  </div>
                )}
              </section>
            )}

            {active === 3 && (
              <section className="flow-panel review-panel">
                <div className="flow-title">
                  <span>▧</span>
                  <div>
                    <small>STEP 4 · {stepLabels[3]}</small>
                    <h3>
                      {language === "de"
                        ? "Prüfe deine Antwort"
                        : "Review your answer"}
                    </h3>
                  </div>
                </div>
                {evaluation ? (
                  <>
                    <div className="review-grid">
                      <article>
                        <small>AUDIO</small>
                        {audioUrl && <audio src={audioUrl} controls />}
                      </article>
                      <article>
                        <small>TRANSCRIPT</small>
                        <p>{evaluation.original}</p>
                      </article>
                      <article>
                        <small>MEASURED</small>
                        <p>
                          <b>{wordCount}</b> words ·{" "}
                          <b>{formatTime(seconds)}</b> · <b>{wordsPerMinute}</b>{" "}
                          WPM
                        </p>
                      </article>
                    </div>
                    <p className="spoken-chunk-review" role="status">
                      <b>
                        Natural spoken chunks detected: {matchedSpokenChunks.length}/
                        {selected.spokenChunks.length}.
                      </b>{" "}
                      {matchedSpokenChunks.length >= 2
                        ? "You reached the practice target. This is transcript guidance, not a mastery score."
                        : "Try again with at least two chunks. This is transcript guidance, not a mastery score."}
                    </p>
                    <div className="flow-actions">
                      <button onClick={() => setActive(1)}>Try again</button>
                      <button className="primary" onClick={() => setActive(4)}>
                        Corrections →
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flow-empty">
                    {language === "de"
                      ? "Noch keine echte Auswertung vorhanden."
                      : "No verified evaluation yet."}
                  </div>
                )}
              </section>
            )}

            {active === 4 && (
              <section className="flow-panel correct-panel">
                <div className="flow-title">
                  <span>✓</span>
                  <div>
                    <small>STEP 5 · {stepLabels[4]}</small>
                    <h3>
                      {language === "de"
                        ? "Korrekturen verstehen"
                        : "Understand the correction"}
                    </h3>
                  </div>
                </div>
                {evaluation ? (
                  <>
                    <div className="correction-grid">
                      <article>
                        <small>
                          {language === "de" ? "DEINE VERSION" : "YOU SAID"}
                        </small>
                        <p>{evaluation.original}</p>
                      </article>
                      <article>
                        <small>
                          {language === "de"
                            ? "KORRIGIERTE VERSION"
                            : "CORRECTED VERSION"}
                        </small>
                        <p>{evaluation.corrected}</p>
                      </article>
                    </div>
                    {evaluation.issues.length > 0 ? (
                      <ul className="issue-list">
                        {evaluation.issues.map((issue, index) => (
                          <li key={`${issue.ruleId}-${issue.offset}-${index}`}>
                            <b>{issue.category}</b> — {issue.message}
                            {issue.replacements[0]
                              ? ` → ${issue.replacements[0]}`
                              : ""}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="flow-note">
                        {language === "de"
                          ? "LanguageTool hat keine Textfehler erkannt."
                          : "LanguageTool detected no text errors."}
                      </p>
                    )}
                    <div className="flow-actions">
                      <button onClick={() => setActive(3)}>Back</button>
                      <button className="primary" onClick={() => setActive(5)}>
                        Improve →
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flow-empty">{text.providerUnavailable}</div>
                )}
              </section>
            )}

            {active === 5 && (
              <section className="improve-panel">
                <div className="improve-heading">
                  <span>↗</span>
                  <div>
                    <p>STEP 6 · {stepLabels[5]}</p>
                    <h3>
                      {language === "de"
                        ? "Die korrigierte Version erneut produzieren"
                        : "Produce the corrected version again"}
                    </h3>
                  </div>
                </div>
                {evaluation ? (
                  <>
                    <div className="improve-compare">
                      <article>
                        <small>{baseline ? "FIRST ATTEMPT" : "ORIGINAL"}</small>
                        <p>{baseline?.original ?? evaluation.original}</p>
                      </article>
                      <article className="better">
                        <small>
                          {baseline
                            ? "NEW VERIFIED ATTEMPT"
                            : "LANGUAGETOOL CORRECTION"}
                        </small>
                        <p>{evaluation.corrected}</p>
                      </article>
                    </div>
                    <div className="speaking-tip">
                      <b>
                        {language === "de" ? "Ehrliche Grenze" : "Honest limit"}
                      </b>
                      <p>{text.pronunciation}</p>
                    </div>
                    <div className="improve-actions">
                      <button onClick={() => speak(evaluation.corrected)}>
                        ▶ Hear model
                      </button>
                      <button
                        className="primary"
                        onClick={() => void practiceImprovedVersion()}
                      >
                        ♩{" "}
                        {language === "de"
                          ? "Neue Aufnahme"
                          : "Record improved attempt"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="improve-empty">
                    <p>
                      {language === "de"
                        ? "Nimm zuerst eine Antwort auf und werte sie aus."
                        : "Record and evaluate an answer first."}
                    </p>
                  </div>
                )}
              </section>
            )}

            {active === 6 && (
              <section className="flow-panel save-panel">
                <div className="flow-title">
                  <span>▯</span>
                  <div>
                    <small>STEP 7 · {stepLabels[6]}</small>
                    <h3>
                      {savedId
                        ? text.saved
                        : language === "de"
                          ? "Sitzung lokal speichern"
                          : "Save the session locally"}
                    </h3>
                  </div>
                </div>
                <div className="save-summary">
                  <span>
                    <b>{wordCount}</b> words
                  </span>
                  <span>
                    <b>{formatTime(seconds)}</b> speaking
                  </span>
                  <span>
                    <b>{evaluation ? "LanguageTool" : "Not evaluated"}</b>{" "}
                    result
                  </span>
                </div>
                <p className="flow-note">
                  {language === "de"
                    ? "Audio, Transkript und Auswertung werden in IndexedDB dieses Browsers gespeichert."
                    : "Audio, transcript, and provider evaluation are stored in this browser’s IndexedDB."}
                </p>
                <div className="flow-actions">
                  <button onClick={() => setActive(5)}>Back</button>
                  <button
                    className="primary"
                    disabled={Boolean(savedId) || !evaluation || !hasAudioBlob}
                    onClick={() => void saveSession()}
                  >
                    ✓ {savedId ? "Saved" : "Save session"}
                  </button>
                </div>
              </section>
            )}
          </section>

          <aside className="evidence">
            <section className="panel feedback">
              <h3>
                {language === "de"
                  ? "Echte Sprechdaten"
                  : "Real speaking evidence"}
              </h3>
              <div className="feedback-row f0">
                <span>◫</span>
                <div>
                  <b>Fluency</b>
                  <small>
                    {seconds
                      ? `${wordsPerMinute} WPM from ${formatTime(seconds)} audio`
                      : "Waiting for recorded timing"}
                  </small>
                </div>
                <strong>{seconds ? `${wordsPerMinute}` : "—"}</strong>
              </div>
              <div className="feedback-row f1">
                <span>◉</span>
                <div>
                  <b>Pronunciation</b>
                  <small>{text.pronunciation}</small>
                </div>
                <strong>—</strong>
              </div>
              <div className="feedback-row f2">
                <span>G</span>
                <div>
                  <b>Grammar</b>
                  <small>
                    {evaluation
                      ? `${evaluation.issues.length} LanguageTool issue(s)`
                      : "Not checked"}
                  </small>
                </div>
                <strong>{evaluation ? evaluation.issues.length : "—"}</strong>
              </div>
              <div className="feedback-row f3">
                <span>Aa</span>
                <div>
                  <b>Transcript</b>
                  <small>
                    {transcript
                      ? "Browser transcript reviewed by learner"
                      : "Waiting for speech"}
                  </small>
                </div>
                <strong>{wordCount || "—"}</strong>
              </div>
              <div className="feedback-row f4">
                <span>Ch</span>
                <div>
                  <b>Natural chunks</b>
                  <small>
                    Matched in the transcript for practice; not a mastery score
                  </small>
                </div>
                <strong>
                  {matchedSpokenChunks.length}/{selected.spokenChunks.length}
                </strong>
              </div>
              <div className="coach-tip">
                <b>☼ Evidence rule</b>
                <p>
                  {language === "de"
                    ? "Keine Bewertung wird angezeigt, wenn der echte Anbieter nicht geantwortet hat."
                    : "No evaluation is shown when the real provider has not responded."}
                </p>
              </div>
            </section>
            <section className="panel">
              <h3>Session evidence</h3>
              <div className="metrics">
                <div>
                  <b>{attempts}</b>
                  <span>Turns</span>
                </div>
                <div>
                  <b>{formatTime(seconds)}</b>
                  <span>Speaking</span>
                </div>
                <div>
                  <b>{wordCount}</b>
                  <span>Words</span>
                </div>
                <div>
                  <b>{wordsPerMinute}</b>
                  <span>WPM</span>
                </div>
              </div>
              <p className="encourage">♙ {selected.goal}</p>
            </section>
            <section className="panel correction">
              <div className="panel-title">
                <h3>Grammar correction</h3>
                <label>
                  Show{" "}
                  <input
                    type="checkbox"
                    checked={showCorrections}
                    onChange={(event) =>
                      setShowCorrections(event.target.checked)
                    }
                  />
                </label>
              </div>
              {showCorrections && (
                <>
                  <div className="original">
                    <b>Original</b>
                    <p>{evaluation?.original ?? "—"}</p>
                  </div>
                  <div className="corrected">
                    <b>
                      {evaluation?.issues.length
                        ? "Corrected"
                        : "Provider result"}
                    </b>
                    <p>{evaluation?.corrected ?? "—"}</p>
                  </div>
                </>
              )}
            </section>
            <section className="panel goal">
              <span>{selected.level}</span>
              <h3>{language === "de" ? "Heutiges Ziel" : "Today’s goal"}</h3>
              <b>{selected.topic}</b>
              <p>{selected.goal}</p>
            </section>
          </aside>
        </div>
        <footer>
          <div className="turns">
            <b>
              {attempts} {attempts === 1 ? "attempt" : "attempts"}
            </b>
            <span>
              {evaluation ? "●" : "○"} {audioUrl ? "●" : "○"}{" "}
              {savedId ? "●" : "○"}
            </span>
          </div>
          <div className="footer-coach">
            <span>👩🏻</span>
            <p>
              <b>Ava</b>
              <br />
              {selected.goal}
            </p>
          </div>
          <button className="save-lite" onClick={() => setActive(6)}>
            ▯ Save practice
          </button>
          <button
            className="continue"
            onClick={() => setActive((current) => Math.min(current + 1, 6))}
          >
            {active === 6
              ? savedId
                ? "Session saved ✓"
                : "Save session"
              : `${language === "de" ? "Weiter" : "Continue"} →`}
          </button>
        </footer>
      </main>
      {dailyComplete && (
        <div
          className="daily-complete-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="daily-complete-title"
        >
          <section className="daily-complete-card">
            <h2 id="daily-complete-title">
              Today’s conversation practice is complete.
            </h2>
            <p>
              Your recording, transcript, corrections, and result were saved.
            </p>
            <button
              className="primary"
              onClick={() => returnToPriorContext(dailyReturn)}
            >
              OK · Return to Today’s Practice
            </button>
            <button
              onClick={() => {
                setDailyComplete(false);
                resetSession();
                setActive(0);
              }}
            >
              Practise again
            </button>
            <button
              onClick={() => {
                setDailyComplete(false);
                setActive(4);
              }}
            >
              Review my mistakes
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
