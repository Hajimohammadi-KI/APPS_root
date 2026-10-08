"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleStop,
  Download,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Volume2,
} from "lucide-react";
import {
  priorityIssues,
  attachEvaluation,
  confirmTranscript,
  editTranscript,
  makeReview,
  microphoneProblem,
  speechMeasurements,
  type Attempt,
  type Issue,
  type Language,
  type Review,
  type Stage,
  type Topic,
} from "./model";
import { readStudio, saveAttempt, saveReview } from "./storage";
import { StudioRecorder, type RecordingSnapshot } from "./recorder";
import { AudioPlayback, PlaybackSpeed, readPlaybackRate } from "./playback";
import { words, type CopyKey } from "./copy";
import {
  dailyExercise,
  type DailyExercise,
  type DailyWorksheet,
} from "./daily-exercise";
import { DailyModel, shadowSteps } from "./daily-model";

type RecordingState =
  "ready" | "requesting" | "recording" | "paused" | "stopped";
interface Props {
  language: Language;
  topics: readonly Topic[];
  getExampleAudio(topicId: string): Promise<Blob | null>;
  onComplete?(attempt: Attempt): void;
  initialTopicId?: string;
}
function useBlobUrl(blob: Blob | undefined) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob?.size) {
      setUrl(undefined);
      return;
    }
    const value = URL.createObjectURL(blob);
    setUrl(value);
    return () => URL.revokeObjectURL(value);
  }, [blob]);
  return url;
}
const formatTime = (ms: number) =>
  `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;

export default function StudioFlow(props: Props) {
  const [context, setContext] = useState<{
    ready: boolean;
    exercise?: DailyExercise;
    error?: string;
  }>({ ready: false });
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (
      params.get("from") !== "daily" ||
      ![2, 3, 6].includes(Number(params.get("activity")))
    ) {
      setContext({ ready: true });
      return;
    }
    const controller = new AbortController();
    // Wait for the exact worksheet before mounting the recorder; never flash an unrelated task.
    void fetch(`/replacements/${props.language}/daily-worksheets.json`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Daily content unavailable");
        const data = (await response.json()) as {
          worksheets: DailyWorksheet[];
        };
        const exercise = dailyExercise(params, data.worksheets, props.language);
        if (!exercise) throw new Error("Daily activity unavailable");
        if (!controller.signal.aborted) setContext({ ready: true, exercise });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setContext({
            ready: true,
            error:
              props.language === "de"
                ? "Diese Tagesübung konnte nicht geladen werden. Öffne sie erneut über den Tagesplan."
                : "This daily exercise could not be loaded. Reopen it from your daily plan.",
          });
      });
    return () => controller.abort();
  }, [props.language]);
  const dailyTopics = useMemo(
    () => (context.exercise ? [context.exercise.topic] : props.topics),
    [context.exercise, props.topics],
  );
  if (!context.ready || context.error)
    return (
      <main className="conversation-flow">
        <p role="status">
          {context.error ||
            (props.language === "de"
              ? "Übung wird geladen …"
              : "Loading exercise …")}
        </p>
        {context.error && (
          <a href={props.language === "de" ? "/heute" : "/daily"}>
            {props.language === "de"
              ? "Zurück zum Tagesplan"
              : "Back to daily plan"}
          </a>
        )}
      </main>
    );
  return context.exercise ? (
    <StudioContent
      {...props}
      topics={dailyTopics}
      daily={context.exercise}
      initialTopicId={context.exercise.topic.id}
    />
  ) : (
    <StudioContent {...props} />
  );
}

function StudioContent({
  language,
  topics,
  getExampleAudio,
  onComplete,
  initialTopicId,
  daily,
}: Props & { daily?: DailyExercise }) {
  const [preparationStep, setPreparationStep] = useState(0);
  const [stage, setStage] = useState<Stage>("prepare");
  const [instructions, setInstructions] = useState<Language | "fa">(language);
  const text = (key: CopyKey): string =>
    words[key][instructions === "fa" ? 2 : instructions === "de" ? 1 : 0];
  const [topicId, setTopicId] = useState(initialTopicId ?? topics[0]?.id ?? "");
  const [returnPath, setReturnPath] = useState(
    language === "de" ? "/heute" : "/daily",
  );
  const [level, setLevel] = useState("");
  const topic: Topic =
    topics.find((item) => item.id === topicId) ??
    topics[0] ??
    (() => {
      throw new Error("A conversation catalog is required.");
    })();
  const [hints, setHints] = useState<string[]>([]);
  const [mode, setMode] = useState<"monologue" | "dialogue">("monologue");
  const [attempt, setAttempt] = useState<Attempt>();
  const current = useRef<Attempt | undefined>(undefined);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [review, setReview] = useState<Review>();
  const [retryParent, setRetryParent] = useState<Attempt>();
  const [recording, setRecording] = useState<RecordingState>("ready");
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<CopyKey>();
  const [saveStatus, setSaveStatus] = useState<
    "saving" | "saved" | "saveFailed"
  >();
  const [evaluating, setEvaluating] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [example, setExample] = useState<Blob>();
  const [partnerText, setPartnerText] = useState("");
  const [partnerPlaying, setPartnerPlaying] = useState(false);
  const recorder = useRef<StudioRecorder | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const latestLevel = useRef(0);
  const alive = useRef(true);
  const abort = useRef<AbortController | null>(null);
  const audioUrl = useBlobUrl(attempt?.audio);
  const exampleUrl = useBlobUrl(example);
  const actualTask =
    review?.task ?? retryParent?.task ?? attempt?.task ?? topic.task;
  const measurement = useMemo(
    () => (attempt ? speechMeasurements(attempt) : null),
    [attempt],
  );
  const issues = useMemo(
    () => priorityIssues(attempt?.evaluation?.issues ?? []),
    [attempt?.evaluation],
  );
  const busy = ["requesting", "recording", "paused"].includes(recording);

  useEffect(() => {
    alive.current = true;
    void readStudio(language)
      .then(({ attempts: stored, reviews: scheduled }) => {
        if (alive.current) {
          setAttempts(stored);
          setReviews(scheduled);
          const requestedAttempt = new URLSearchParams(location.search).get(
            "attempt",
          );
          const draft = stored.find(
            (item) =>
              item.id === requestedAttempt &&
              (!daily || item.topicId === daily.topic.id),
          );
          if (draft) {
            current.current = draft;
            setAttempt(draft);
            setTopicId(draft.topicId);
            setStage("feedback");
            setRecording("stopped");
            setElapsed(draft.durationMs);
            setReview(scheduled.find((item) => item.id === draft.reviewId));
          }
        }
      })
      .catch(() => setSaveStatus("saveFailed"))
      .finally(() => setLoaded(true));
    try {
      const saved = localStorage.getItem(`studio:instructions:${language}`);
      if (saved === "en" || saved === "de" || saved === "fa")
        setInstructions(saved);
      const params = new URLSearchParams(location.search);
      const back = params.get("return");
      if (
        back?.startsWith("/") &&
        !back.startsWith("//") &&
        !back.includes("\\")
      )
        setReturnPath(back);
      const requested = params.get("topic")?.toLowerCase();
      const requestedLevel = params.get("level");
      const match = topics.find(
        (item) =>
          (!requestedLevel || item.level === requestedLevel) &&
          (requested
            ? item.id === requested ||
              item.topic.toLowerCase().includes(requested) ||
              requested.includes(item.topic.toLowerCase())
            : true),
      );
      if (initialTopicId) setTopicId(initialTopicId);
      else if (match) setTopicId(match.id);
    } catch {
      /* Defaults work without local preferences. */
    }
    return () => {
      alive.current = false;
      abort.current?.abort();
      recorder.current?.dispose();
      window.speechSynthesis?.cancel();
    };
  }, [language, topics, initialTopicId, daily]);

  function persist(next: Attempt, quiet = false) {
    if (!alive.current) return saveAttempt(next).catch(() => undefined);
    current.current = next;
    setAttempt(next);
    if (!quiet) setSaveStatus("saving");
    return saveAttempt(next)
      .then(() => {
        if (!alive.current) return;
        setAttempts((items) => [
          next,
          ...items.filter((item) => item.id !== next.id),
        ]);
        if (
          current.current?.id === next.id &&
          current.current?.updatedAt === next.updatedAt
        )
          setSaveStatus("saved");
      })
      .catch(() => {
        if (alive.current) setSaveStatus("saveFailed");
      });
  }
  function reset(nextTopicId = topic.id) {
    abort.current?.abort();
    window.speechSynthesis?.cancel();
    setPartnerPlaying(false);
    setEvaluating(false);
    setTopicId(nextTopicId);
    setStage("prepare");
    setAttempt(undefined);
    current.current = undefined;
    setHints([]);
    setRetryParent(undefined);
    setReview(undefined);
    setExample(undefined);
    setPartnerText("");
    setStatus(undefined);
    setSaveStatus(undefined);
    setRecording("ready");
    setElapsed(0);
  }
  function draw(ms: number, amplitude: number) {
    setElapsed(ms);
    latestLevel.current = amplitude;
    const ctx = canvas.current?.getContext("2d");
    if (!ctx || !canvas.current) return;
    const width = canvas.current.width;
    const height = canvas.current.height;
    ctx.drawImage(canvas.current, -3, 0);
    ctx.clearRect(width - 3, 0, 3, height);
    ctx.strokeStyle = "#3D5A9E";
    ctx.lineWidth = 2;
    const bar = Math.min(height / 2 - 2, amplitude * height * 3);
    ctx.beginPath();
    ctx.moveTo(width - 2, height / 2 - bar);
    ctx.lineTo(width - 2, height / 2 + bar);
    ctx.stroke();
  }
  async function start() {
    if (busy || partnerPlaying) return;
    // Check capability before creating an ID: insecure mobile origins lack both APIs.
    if (
      !window.isSecureContext ||
      !navigator.mediaDevices?.getUserMedia ||
      !window.MediaRecorder
    ) {
      setStatus("unsupported");
      return;
    }
    setStatus(undefined);
    setRecording("requesting");
    setElapsed(0);
    abort.current?.abort();
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const base: Attempt = {
      id,
      sessionId:
        retryParent?.sessionId ?? review?.sessionId ?? crypto.randomUUID(),
      topicId: topic.id,
      language,
      createdAt: now,
      updatedAt: now,
      kind: review
        ? "delayed-new-context"
        : retryParent
          ? "immediate-retry"
          : "initial",
      parentId: retryParent?.id,
      reviewId: review?.id,
      task: actualTask,
      contentVersion: topic.contentVersion,
      hintsUsed: review ? [] : hints,
      audio: new Blob(),
      captureState: "recording",
      durationMs: 0,
      rawTranscript: "",
      transcriptSource: "unavailable",
      editedTranscript: "",
      errorNote: "",
      contrastNote: "",
    };
    const snapshotAttempt = (snapshot: RecordingSnapshot): Attempt => ({
      ...base,
      ...snapshot,
      editedTranscript: snapshot.rawTranscript,
      updatedAt: new Date().toISOString(),
    });
    const capture = new StudioRecorder(language, {
      tick: draw,
      checkpoint: (snapshot) => {
        void persist(snapshotAttempt(snapshot), true);
      },
      stopped: (snapshot) => {
        const next = snapshotAttempt(snapshot);
        // The stopped capture is durable even if grammar feedback or recognition is unavailable.
        void persist(next);
        if (alive.current) {
          setRecording("stopped");
          setStage("feedback");
        }
      },
      recognitionUnavailable: () => setStatus("asr"),
      interrupted: () => {
        if (alive.current) {
          setRecording("paused");
          setStatus("interrupted");
        }
      },
    });
    recorder.current = capture;
    try {
      await capture.start();
      if (alive.current) setRecording("recording");
    } catch (error) {
      capture.dispose();
      setRecording("ready");
      setStatus(microphoneProblem(error) as CopyKey);
    }
  }
  function pauseOrResume() {
    if (recording === "recording") {
      recorder.current?.pause();
      setRecording("paused");
    } else {
      recorder.current?.resume();
      setRecording("recording");
      setStatus(undefined);
    }
  }
  function retry() {
    if (!attempt || busy) return;
    abort.current?.abort();
    setRetryParent(attempt);
    setReview(undefined);
    setAttempt(undefined);
    current.current = undefined;
    setRecording("ready");
    setElapsed(0);
    setStage("speak");
    setStatus(undefined);
    setPartnerText("");
  }
  async function evaluate() {
    if (!attempt?.confirmedAt || evaluating) return;
    const source = attempt;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setEvaluating(true);
    setStatus(undefined);
    try {
      const response = await fetch("/api/conversation/evaluate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: source.editedTranscript, language }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Provider unavailable");
      const result: unknown = await response.json();
      if (
        current.current?.id !== source.id ||
        current.current?.confirmedAt !== source.confirmedAt
      )
        return;
      await persist(attachEvaluation(source, result));
    } catch {
      if (!controller.signal.aborted) setStatus("provider");
    } finally {
      if (abort.current === controller) setEvaluating(false);
    }
  }
  async function schedule(day: Review["day"]) {
    if (!attempt) return;
    const next = makeReview(attempt, day);
    // Rescheduling is idempotent; it never awards a completed review or overwrites its response.
    if (reviews.some((item) => item.id === next.id)) return;
    try {
      await saveReview(next);
      setReviews((items) => [...items, next]);
      setStatus("scheduled");
    } catch {
      setSaveStatus("saveFailed");
    }
  }
  async function finish() {
    if (!attempt?.audio.size) return;
    const next = {
      ...attempt,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await saveAttempt(next);
      current.current = next;
      setAttempt(next);
      setAttempts((items) => [
        next,
        ...items.filter((item) => item.id !== next.id),
      ]);
      if (review) {
        const reviewed = {
          ...review,
          responseId: next.id,
          completedAt: next.completedAt,
        };
        await saveReview(reviewed);
        setReviews((items) =>
          items.map((item) => (item.id === reviewed.id ? reviewed : item)),
        );
      }
      onComplete?.(next);
      setStatus("complete");
      setSaveStatus("saved");
    } catch {
      setSaveStatus("saveFailed");
    }
  }
  function openDraft(item: Attempt) {
    reset(item.topicId);
    current.current = item;
    setAttempt(item);
    setStage("feedback");
    setElapsed(item.durationMs);
    setRecording("stopped");
    setReview(reviews.find((r) => r.id === item.reviewId));
    if (item.captureState !== "stopped") setStatus("interrupted");
  }
  function startReview(item: Review) {
    if (Date.parse(item.dueAt) > Date.now()) return;
    reset(item.topicId);
    setReview(item); // No prior transcript, corrections or hints are rendered in review mode.
  }
  async function listenExample() {
    try {
      const audio = await getExampleAudio(topic.id);
      if (audio) setExample(audio);
      else setStatus("noExample");
    } catch {
      setStatus("noExample");
    }
  }
  function speakPartner(followUp = false) {
    const prompt =
      language === "de"
        ? followUp
          ? "Kannst du dazu ein weiteres Beispiel nennen und mir eine passende Frage stellen?"
          : `Unser Thema ist „${topic.topic}“. Was möchtest du dazu erzählen?`
        : followUp
          ? "Can you give another example and ask me a related question?"
          : `Let's talk about ${topic.topic}. What would you like to tell me?`;
    setPartnerText(prompt);
    if (recording === "recording") {
      recorder.current?.pause();
      setRecording("paused");
    }
    const voice = window.speechSynthesis
      ?.getVoices()
      .find((v) => v.lang.startsWith(language));
    if (!voice) {
      setStatus("noVoice");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(prompt);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = readPlaybackRate();
    utterance.onend = utterance.onerror = () => setPartnerPlaying(false);
    window.speechSynthesis.cancel();
    setPartnerPlaying(true);
    window.speechSynthesis.speak(utterance);
  }
  function correction(issue: Issue, index: number) {
    if (!attempt?.evaluation) return null;
    const original = attempt.evaluation.original;
    const before = original.slice(issue.offset, issue.offset + issue.length);
    const replacement = issue.replacements[0];
    return (
      <div
        className="cf-correction"
        key={`${issue.ruleId}-${issue.offset}-${index}`}
      >
        <div>
          <span>{text("original")}</span>
          <p lang={language} dir="ltr">
            {original.slice(0, issue.offset)}
            <mark>{before}</mark>
            {original.slice(issue.offset + issue.length)}
          </p>
        </div>
        {replacement !== undefined && (
          <div>
            <span>{text("better")}</span>
            <p lang={language} dir="ltr">
              {original.slice(0, issue.offset)}
              <strong>{replacement}</strong>
              {original.slice(issue.offset + issue.length)}
            </p>
          </div>
        )}
        <div className="cf-cause">
          <strong>{text("why")}</strong>
          <p>{issue.message}</p>
          <small>{issue.category} · LanguageTool</small>
        </div>
      </div>
    );
  }
  return (
    <main
      className="conversation-flow"
      data-stage={stage}
      data-language={language}
      data-hydrated={loaded}
      data-daily-activity={daily?.activity}
    >
      <header className="cf-top">
        <a href={returnPath}>
          <ArrowLeft size={18} aria-hidden />
          {text("home")}
        </a>
        {!busy && (
          <label>
            {text("instructions")}
            <select
              value={instructions}
              onChange={(e) => {
                const value = e.target.value as Language | "fa";
                setInstructions(value);
                try {
                  localStorage.setItem(
                    `studio:instructions:${language}`,
                    value,
                  );
                } catch {
                  /* Preference is optional. */
                }
              }}
            >
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="fa">فارسی</option>
            </select>
          </label>
        )}
      </header>
      <nav className="cf-steps" aria-label={text("mode")}>
        {(daily?.activity === 6
          ? (["prepare", "prepare", "prepare", "speak", "feedback"] as const)
          : (["prepare", "speak", "feedback"] as const)
        ).map((value, index) => (
          <button
            type="button"
            key={index}
            aria-current={
              stage === value &&
              (daily?.activity !== 6 ||
                value !== "prepare" ||
                preparationStep === index)
                ? "step"
                : undefined
            }
            disabled={busy || (value === "feedback" && !attempt)}
            onClick={() => {
              setStage(value);
              if (daily?.activity === 6 && index < 3) setPreparationStep(index);
              setStatus(undefined);
            }}
          >
            <span>{index + 1}</span>
            {daily?.activity === 6 ? shadowSteps[language][index] : text(value)}
          </button>
        ))}
      </nav>
      <div className="cf-content" dir={instructions === "fa" ? "rtl" : "ltr"}>
        {stage === "prepare" && (
          <>
            {daily ? (
              <p className="cf-topic-picker">
                {topic.level} · {topic.topic}
              </p>
            ) : (
              <details className="cf-topic-picker">
                <summary>
                  {topic.level} · {topic.topic}
                  <ChevronDown aria-hidden size={18} />
                </summary>
                <div>
                  <label>
                    {text("level")}
                    <select
                      value={level}
                      onChange={(e) => {
                        const value = e.target.value;
                        setLevel(value);
                        const first = topics.find(
                          (item) => !value || item.level === value,
                        );
                        if (first) reset(first.id);
                      }}
                    >
                      <option value="">{text("all")}</option>
                      {[...new Set(topics.map((item) => item.level))].map(
                        (value) => (
                          <option key={value}>{value}</option>
                        ),
                      )}
                    </select>
                  </label>
                  <label>
                    {text("choose")}
                    <select
                      value={topic.id}
                      onChange={(e) => reset(e.target.value)}
                    >
                      {topics
                        .filter((item) => !level || item.level === level)
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.level} · {item.topic}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>
              </details>
            )}
            <section className="cf-card cf-task">
              <h1>{daily ? topic.topic.split(" · ")[0] : text("task")}</h1>
              <p lang={language} dir="ltr">
                {actualTask}
              </p>
            </section>
            {!review && daily && daily.activity !== 3 && (
              <DailyModel
                exercise={daily}
                language={language}
                step={preparationStep}
              />
            )}
            {!review && !daily && (
              <div className="cf-example">
                <button
                  className="cf-secondary"
                  type="button"
                  onClick={() => void listenExample()}
                >
                  <Volume2 aria-hidden />
                  {text("example")}
                </button>
                {exampleUrl && (
                  <AudioPlayback
                    src={exampleUrl}
                    language={language}
                    label={text("example")}
                  />
                )}
              </div>
            )}
            {!review && topic.hints.length > 0 && (
              <section className="cf-card cf-sand">
                <h2>{text("hints")}</h2>
                {topic.hints.slice(0, 2).map((hint) => (
                  <label className="cf-hint" key={hint}>
                    <input
                      type="checkbox"
                      checked={hints.includes(hint)}
                      onChange={(e) =>
                        setHints((items) =>
                          e.target.checked
                            ? [...items, hint]
                            : items.filter((item) => item !== hint),
                        )
                      }
                    />
                    <span lang={language} dir="ltr">
                      {hint}
                    </span>
                  </label>
                ))}
              </section>
            )}
            {(!daily || daily.activity === 3) && (
              <div className="cf-mode">
                <label>
                  {text("mode")}
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as typeof mode)}
                  >
                    <option value="monologue">{text("monologue")}</option>
                    <option value="dialogue">{text("dialogue")}</option>
                  </select>
                </label>
                {mode === "dialogue" && <PlaybackSpeed language={language} />}
              </div>
            )}
            <button
              type="button"
              className="cf-primary cf-wide"
              onClick={() => {
                if (daily?.activity === 6 && preparationStep < 2) {
                  setPreparationStep(preparationStep + 1);
                  return;
                }
                setStage("speak");
                setStatus(undefined);
              }}
            >
              {daily?.activity === 6
                ? shadowSteps[language][preparationStep + 1]
                : text("continue")}
              <ArrowRight aria-hidden />
            </button>
            <p className="cf-note">{text("local")}</p>
            <details className="cf-library">
              <summary>{text("library")}</summary>
              {attempts.length === 0 && <p>{text("empty")}</p>}
              {attempts
                .filter((item) => !daily || item.topicId === daily.topic.id)
                .slice(0, 20)
                .map((item) => (
                  <div key={item.id}>
                    <span>
                      {topics.find((t) => t.id === item.topicId)?.topic} ·{" "}
                      {new Date(item.createdAt).toLocaleString(language)}
                      {item.completedAt && ` · ${text("complete")}`}
                    </span>
                    <button type="button" onClick={() => openDraft(item)}>
                      {text("open")}
                    </button>
                  </div>
                ))}
              {reviews
                .filter((item) => !daily || item.topicId === daily.topic.id)
                .map((item) => (
                  <div key={item.id}>
                    <span>
                      {text("day")} {item.day} · {text("due")}{" "}
                      {new Date(item.dueAt).toLocaleDateString(language)}
                      {item.completedAt && ` · ${text("complete")}`}
                    </span>
                    <button
                      type="button"
                      disabled={
                        !!item.completedAt ||
                        Date.parse(item.dueAt) > Date.now()
                      }
                      onClick={() => startReview(item)}
                    >
                      {text("startReview")}
                    </button>
                  </div>
                ))}
            </details>
          </>
        )}
        {stage === "speak" && (
          <section className="cf-speaking" aria-label={text("speak")}>
            {retryParent && <p className="cf-note">{text("immediate")}</p>}
            {mode === "dialogue" && recording !== "recording" && (
              <div className="cf-partner">
                <button
                  type="button"
                  className="cf-secondary"
                  disabled={partnerPlaying}
                  onClick={() => speakPartner(recording === "paused")}
                >
                  <Volume2 aria-hidden />
                  {text(recording === "paused" ? "nextTurn" : "partner")}
                </button>
                <small>{text("partnerLabel")}</small>
                {partnerText && (
                  <p lang={language} dir="ltr">
                    {partnerText}
                  </p>
                )}
                <PlaybackSpeed language={language} />
              </div>
            )}
            <button
              type="button"
              className="cf-mic"
              data-recording={recording === "recording"}
              aria-label={text(
                busy ? (recording === "paused" ? "resume" : "pause") : "record",
              )}
              disabled={recording === "requesting" || partnerPlaying}
              onClick={() => (busy ? pauseOrResume() : void start())}
            >
              {recording === "recording" ? (
                <Pause aria-hidden />
              ) : (
                <Mic aria-hidden />
              )}
            </button>
            <output
              className="cf-time"
              aria-label={language === "de" ? "Aufnahmezeit" : "Recording time"}
            >
              {formatTime(elapsed)}
            </output>
            <p className="cf-record-state" role="status">
              {text(recording === "stopped" ? "ready" : recording)}
            </p>
            <canvas
              ref={canvas}
              width={500}
              height={56}
              className="cf-wave"
              aria-label={
                language === "de"
                  ? "Tatsächlicher Mikrofonpegel"
                  : "Actual microphone level"
              }
            />
            {recording === "recording" &&
              elapsed > 4000 &&
              latestLevel.current < 0.002 && (
                <p className="cf-note">{text("silence")}</p>
              )}
            <div className="cf-record-actions">
              {(recording === "recording" || recording === "paused") && (
                <>
                  <button
                    type="button"
                    className="cf-secondary"
                    disabled={partnerPlaying}
                    onClick={pauseOrResume}
                  >
                    {recording === "paused" ? (
                      <Play aria-hidden />
                    ) : (
                      <Pause aria-hidden />
                    )}
                    {text(recording === "paused" ? "resume" : "pause")}
                  </button>
                  <button
                    type="button"
                    className="cf-secondary"
                    onClick={() => recorder.current?.stop()}
                  >
                    <CircleStop aria-hidden />
                    {text("stop")}
                  </button>
                </>
              )}
            </div>
            <div className="cf-reminders">
              <details>
                <summary>{text("showTask")}</summary>
                <p lang={language} dir="ltr">
                  {actualTask}
                </p>
              </details>
              {hints.length > 0 && !review && (
                <details>
                  <summary>{text("showHints")}</summary>
                  {hints.map((hint) => (
                    <p key={hint} lang={language} dir="ltr">
                      {hint}
                    </p>
                  ))}
                </details>
              )}
            </div>
          </section>
        )}
        {stage === "feedback" && attempt && (
          <>
            {daily?.activity === 6 && (
              <details className="cf-card">
                <summary>
                  {language === "de"
                    ? "Mit dem Modell vergleichen"
                    : "Compare with the model"}
                </summary>
                <DailyModel exercise={daily} language={language} step={4} />
              </details>
            )}
            <section className="cf-card">
              <h1>{text("transcript")}</h1>
              {!attempt.evaluation && (
                <p className="cf-note">{text("transcriptHelp")}</p>
              )}
              {audioUrl && (
                <AudioPlayback
                  src={audioUrl}
                  language={language}
                  label={text("attempt")}
                />
              )}
              <details
                className="cf-transcript-editor"
                open={!attempt.evaluation}
              >
                <summary>{text("transcript")}</summary>
                <label className="cf-transcript">
                  <span>{text("transcript")}</span>
                  <textarea
                    dir="ltr"
                    lang={language}
                    value={attempt.editedTranscript}
                    rows={3}
                    maxLength={8000}
                    onChange={(e) => {
                      abort.current?.abort();
                      setEvaluating(false);
                      void persist(editTranscript(attempt, e.target.value));
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="cf-secondary"
                  disabled={
                    !attempt.editedTranscript.trim() || !!attempt.confirmedAt
                  }
                  onClick={() => void persist(confirmTranscript(attempt))}
                >
                  <Check aria-hidden />
                  {text(attempt.confirmedAt ? "confirmed" : "confirm")}
                </button>
                {attempt.confirmedAt && !attempt.evaluation && (
                  <button
                    type="button"
                    className="cf-primary"
                    disabled={evaluating}
                    onClick={() => void evaluate()}
                  >
                    {text(evaluating ? "evaluating" : "evaluate")}
                  </button>
                )}
              </details>
            </section>
            {attempt.evaluation && (
              <section className="cf-card">
                <h2>{text("focus")}</h2>
                {issues[0] ? (
                  correction(issues[0], 0)
                ) : (
                  <p>{text("noIssues")}</p>
                )}
                {issues.length > 1 && (
                  <details>
                    <summary>
                      {text("more")} ({issues.length - 1})
                    </summary>
                    {issues.slice(1).map(correction)}
                  </details>
                )}
                <details className="cf-error-log">
                  <summary>{text("errorLog")}</summary>
                  <label>
                    {text("why")}
                    <textarea
                      rows={2}
                      value={attempt.errorNote}
                      onChange={(e) =>
                        void persist({
                          ...attempt,
                          errorNote: e.target.value,
                          updatedAt: new Date().toISOString(),
                        })
                      }
                    />
                  </label>
                  <label>
                    {text("contrast")}
                    <textarea
                      dir="ltr"
                      lang={language}
                      rows={2}
                      value={attempt.contrastNote}
                      onChange={(e) =>
                        void persist({
                          ...attempt,
                          contrastNote: e.target.value,
                          updatedAt: new Date().toISOString(),
                        })
                      }
                    />
                  </label>
                </details>
              </section>
            )}
            <button
              className="cf-primary cf-wide"
              type="button"
              onClick={retry}
            >
              <RotateCcw aria-hidden />
              {text("retry")}
            </button>
            <p className="cf-note">{text("comparison")}</p>
            <details className="cf-card cf-measurements">
              <summary>{text("measurements")}</summary>
              <p>{text("measurementHelp")}</p>
              <dl>
                <dt>{text("words")}</dt>
                <dd>{measurement?.words ?? "—"}</dd>
                <dt>{text("wpm")}</dt>
                <dd>{measurement?.wordsPerMinute ?? "—"}</dd>
              </dl>
              <p className="cf-muted">{text("pronunciation")}</p>
              <details>
                <summary>{text("raw")}</summary>
                <p dir="ltr" lang={language}>
                  {attempt.rawTranscript || text("asr")}
                </p>
              </details>
              {attempt.parentId && (
                <button
                  type="button"
                  onClick={() => {
                    const parent = attempts.find(
                      (item) => item.id === attempt.parentId,
                    );
                    if (parent) openDraft(parent);
                  }}
                >
                  {text("attempt")} 1
                </button>
              )}
            </details>
            <section className="cf-card cf-sand">
              <h2>{text("review")}</h2>
              <div className="cf-review-days">
                {([1, 3, 7, 14] as const).map((day) => (
                  <label key={day}>
                    <input
                      type="checkbox"
                      checked={reviews.some(
                        (item) => item.id === `${attempt.sessionId}:day-${day}`,
                      )}
                      disabled={reviews.some(
                        (item) => item.id === `${attempt.sessionId}:day-${day}`,
                      )}
                      onChange={() => void schedule(day)}
                    />
                    {text("day")} {day}
                  </label>
                ))}
              </div>
            </section>
            <div className="cf-bottom">
              <button
                type="button"
                className="cf-secondary"
                disabled={!!attempt.completedAt || !attempt.audio.size}
                onClick={() => void finish()}
              >
                {text(attempt.completedAt ? "complete" : "finish")}
              </button>
              <button type="button" onClick={() => void persist(attempt)}>
                {text("saveLater")}
              </button>
              {audioUrl && (
                <a
                  href={audioUrl}
                  download={`speaking-${attempt.id}.${attempt.audio.type.includes("mp4") ? "m4a" : "webm"}`}
                >
                  <Download aria-hidden size={18} />
                  {text("download")}
                </a>
              )}
            </div>
          </>
        )}
        {status && (
          <p className="cf-status" role="status">
            {text(status)}
          </p>
        )}
        {saveStatus && (
          <p
            className={`cf-save ${saveStatus === "saveFailed" ? "cf-failure" : ""}`}
            role={saveStatus === "saveFailed" ? "alert" : "status"}
          >
            {text(saveStatus)}
          </p>
        )}
      </div>
    </main>
  );
}
