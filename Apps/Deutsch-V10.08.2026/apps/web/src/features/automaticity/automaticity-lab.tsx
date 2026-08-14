"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpenCheck,
  Check,
  CircleAlert,
  Headphones,
  Mic,
  PenLine,
  Play,
  RotateCcw,
  Square,
  Volume2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { grammarUnits } from "@grammar/content";
import { saveAudio } from "@/features/audio/audio-repository";
import {
  analyzeWeilClause,
  practiceAnswerMatches,
  type AutomatikAnalysis,
  type AutomatikIssue,
} from "@/features/automaticity/automaticity-analysis";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";
import { requestEvaluation } from "@/lib/evaluation-client";
import { API_BASE_URL } from "@/lib/api-config";
import { speakingEvidenceBlock } from "./speaking-evidence";

function lessonKey(title: string) {
  return `automatik:${title.toLocaleLowerCase("de-DE").replace(/[^a-z0-9äöüß]+/g, "-")}`;
}

// German's mastery model (packages/domain/src/mastery.ts) defines a
// "transfer" MasteryMode and requires scores.transfer >= 75 to ever reach
// "automatic" status -- but nothing in this Mission ever recorded a
// transfer-mode attempt, so that score stayed permanently at 0 and
// "automatic" was structurally unreachable regardless of how well a learner
// did elsewhere. This mirrors the fix already applied to the English app's
// equivalent Mission flow. Four fixed situations rotate by how many prior
// transfer attempts this topic already has, so repeated practice of the
// same grammar point keeps landing on a different framing instead of
// reproducing a memorized answer to the same prompt every time.
const TRANSFER_SITUATIONS = [
  "Eine Freundin, die nicht dabei war, fragt, was passiert ist. Erkläre es ihr, ohne den Hintergrund vorauszusetzen.",
  "Du schreibst einer neuen Kollegin zum ersten Mal darüber. Gib ihr die Kurzfassung.",
  "Jemand, den du gerade erst kennengelernt hast, fragt im Gespräch danach. Antworte natürlich, so wie du es laut sagen würdest.",
  "Schreibe eine kurze Notiz für jemanden, der dich vertritt und die wichtigsten Fakten schnell braucht.",
] as const;

function transferSituation(title: string, priorTransferAttempts: number) {
  let hash = 0;
  for (let index = 0; index < title.length; index += 1) {
    hash = (hash * 31 + title.charCodeAt(index)) >>> 0;
  }
  const startOffset = hash % TRANSFER_SITUATIONS.length;
  const index = (startOffset + priorTransferAttempts) % TRANSFER_SITUATIONS.length;
  return TRANSFER_SITUATIONS[index];
}

// The full pool a topic can draw rounds from -- exercise-completion.ts
// guarantees at least MINIMUM_CONTROLLED_EXERCISES (10) well-formed
// exercises per unit. Each Mission round only shows ROUND_SIZE of them, so
// a learner can repeat controlled practice on the same topic several times
// without seeing an identical round, instead of a one-shot fixed set.
const ROUND_SIZE = 6;

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temp = copy[index]!;
    copy[index] = copy[swapIndex]!;
    copy[swapIndex] = temp;
  }
  return copy;
}

function pickRound<T>(pool: readonly T[], size: number): T[] {
  return shuffled(pool).slice(0, Math.min(size, pool.length));
}

const shadowingStages = [
  "Nur zuhören",
  "Zuhören und Text mitlesen",
  "Satz für Satz nachsprechen",
  "Den ganzen Text mitschatten",
  "Ohne Text frei nacherzählen",
] as const;

interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: ArrayLike<{
    readonly isFinal: boolean;
    readonly 0: { readonly transcript: string };
  }>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 0.84;
  window.speechSynthesis.speak(utterance);
}

function Axis({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm font-bold">
        <span>{label}</span>
        <span className="tabular-nums">{value}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-violet-100">
        <div
          aria-hidden="true"
          className="h-full rounded-full bg-violet-700 transition-[width]"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

// Verwandelt das "Warum" einer Korrektur in eine konkrete nächste Handlung,
// statt nur einen Satz zu lesen. Jeder Fehlercode bekommt eine eigene
// Übungsanweisung -- genau der fehlende Korrekturschritt, den es vorher
// nicht gab (nur eine Zeile Nachricht + ein bloßes original -> corrected).
function correctiveExerciseFor(issue: AutomatikIssue): string {
  switch (issue.code) {
    case "word_order":
      return `Sprich die korrigierte Wortstellung dreimal laut, dann schreibe einen neuen Satz mit demselben Muster: „${issue.corrected}"`;
    case "missing_comma":
      return `Lies den Satz laut mit einer Pause an der Kommastelle, dann speichere die korrigierte Form: „${issue.corrected}"`;
    case "missing_target": {
      const target = issue.corrected;
      return `Schreibe den Satz so um, dass die Zielstruktur eindeutig vorkommt: „${target}"`;
    }
    case "unfinished_sentence":
      return "Lies deinen Satz laut vor und ergänze das fehlende Satzzeichen, bevor du erneut speicherst.";
  }
}

function Feedback({ analysis }: Readonly<{ analysis: AutomatikAnalysis }>) {
  return (
    <div className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50 p-4">
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <strong className="block text-lg">{analysis.sentenceCount}</strong>
          Sätze
        </div>
        <div>
          <strong className="block text-lg">{analysis.targetUses}</strong>
          Zielstrukturen
        </div>
        <div>
          <strong className="block text-lg">{analysis.score}%</strong>Übungswert
        </div>
      </div>
      {analysis.issues.length ? (
        <ul className="space-y-3 text-sm">
          {analysis.issues.map((issue) => (
            <li
              className="space-y-1.5 rounded-xl bg-white p-3"
              key={`${issue.code}-${issue.original}`}
            >
              <p>
                <span className="mr-1 font-bold text-red-800">Wo:</span>
                {issue.original}
              </p>
              <p>
                <span className="mr-1 font-bold text-red-800">Warum:</span>
                {issue.message}
              </p>
              <p>
                <span className="mr-1 font-bold text-violet-900">
                  Korrekte Form:
                </span>
                {issue.corrected}
              </p>
              <p className="text-muted-foreground">
                <span className="mr-1 font-bold text-violet-900">
                  Übe das:
                </span>
                {correctiveExerciseFor(issue)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 text-sm font-bold text-violet-900">
          <Check className="size-4" /> Die Offline-Musterprüfung findet keinen
          Zielfehler.
        </p>
      )}
    </div>
  );
}

export function AutomaticityLab({
  embedded = false,
  focusedStep,
}: {
  embedded?: boolean;
  focusedStep?: number;
} = {}) {
  const {
    state,
    hydrated,
    setDailyAnswer,
    addError,
    addSession,
    recordAttempt,
    markActivity,
    scheduleReview,
  } = useLearnerState();
  const missionMinutes = state.settings.dailyStudyMinutes;
  const selectedLevel =
    state.learningLevel ?? state.learner.selfDeclaredLevel ?? "A1";
  const grammar =
    grammarUnits.find((unit) => unit.title === state.todayGrammar?.title) ??
    grammarUnits.find((unit) => unit.level === selectedLevel) ??
    grammarUnits[0]!;
  const TOPIC = grammar.title;
  const KEY = lessonKey(TOPIC);
  const exercises = grammar.exercises.map((exercise) => ({
    prompt: exercise[0] ?? "Bearbeite die Aufgabe.",
    expected: exercise[1] ?? grammar.testAnswer,
  }));
  const modelText = grammar.examples.join(" ");
  const today = new Date().toISOString().slice(0, 10);
  const plan = state.dailyPlans[today] ?? { completed: [], answers: {} };
  // Deterministic (unshuffled) for the very first render so server and
  // client agree during hydration -- pickRound() uses Math.random(), which
  // runs independently during SSR and the initial client render and would
  // otherwise produce two different rounds, a real hydration mismatch
  // (caught by an actual e2e run, not typecheck/unit tests).
  const [roundExercises, setRoundExercises] = useState(() =>
    exercises.slice(0, ROUND_SIZE),
  );
  const [answers, setAnswers] = useState<string[]>(() =>
    roundExercises.map(() => ""),
  );
  const [checkedAnswers, setCheckedAnswers] = useState<readonly boolean[]>([]);
  const [practiceRounds, setPracticeRounds] = useState(0);
  // Re-shuffles into a genuine random round on mount (client-only, so it
  // never runs during SSR/hydration), and again any time KEY changes -- KEY
  // is derived from the grammar topic, so this also resets the round
  // whenever the topic changes on a re-render rather than a full remount
  // (e.g. picking a different unit in Grammatik-Labor, which renders this
  // same AutomaticityLab instance with a new `grammar` prop instead of
  // unmounting it). Without this, roundExercises/answers stayed frozen on
  // whatever topic was active at the *first* mount -- the heading and rule
  // text would correctly show the newly selected topic while the exercises
  // below kept showing the old one, a real mismatch an actual e2e run
  // caught that no amount of typechecking would have.
  const previousKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (previousKeyRef.current === KEY) return;
    previousKeyRef.current = KEY;
    const freshRound = pickRound(exercises, ROUND_SIZE);
    setRoundExercises(freshRound);
    setAnswers(freshRound.map(() => ""));
    setCheckedAnswers([]);
    setPracticeRounds(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `exercises` is derived from `grammar`, which KEY already uniquely identifies; re-running per `exercises` identity would refire every render
  }, [KEY]);
  const [journal, setJournal] = useState("");
  const [transcript, setTranscript] = useState("");
  const [journalAnalysis, setJournalAnalysis] =
    useState<AutomatikAnalysis | null>(null);
  const [speechAnalysis, setSpeechAnalysis] =
    useState<AutomatikAnalysis | null>(null);
  const [transferAttempt, setTransferAttempt] = useState("");
  const [transferAnalysis, setTransferAnalysis] =
    useState<AutomatikAnalysis | null>(null);
  const [transferChecking, setTransferChecking] = useState(false);
  // Was recomputed by filtering the whole attempts array on every render,
  // including ones triggered by unrelated state (typing in a Textarea
  // re-renders this component without changing state.attempts).
  const priorTransferAttempts = useMemo(
    () =>
      state.attempts.filter(
        (attempt) => attempt.topic === TOPIC && attempt.mode === "transfer",
      ).length,
    [state.attempts],
  );
  const situation = transferSituation(TOPIC, priorTransferAttempts);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState(
    `Bereit für deinen ${missionMinutes}-Minuten-Nachweis.`,
  );
  const [activeStep, setActiveStep] = useState<number>(
    focusedStep ??
      [0, 1, 2].find((step) => !plan.completed.includes(step)) ??
      0,
  );
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [hasAudioBlob, setHasAudioBlob] = useState(false);
  const startedAtRef = useRef(0);
  const restoredRef = useRef(false);
  // Timestamp of the first keystroke in the writing Textarea, cleared after
  // save -- feeds AUTOMATICITY_LATENCY_THRESHOLD_MS in
  // packages/domain/src/mastery.ts, which already gates "automatic" status
  // on median response latency but never received a writing latency
  // before (only saveSpeaking passed latencyMs).
  const journalStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hydrated || restoredRef.current) return;
    restoredRef.current = true;
    setJournal(plan.answers[`${KEY}:journal`] ?? "");
    setTranscript(plan.answers[`${KEY}:transcript`] ?? "");
  }, [hydrated, plan.answers]);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(
      () =>
        setSeconds(
          Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1_000)),
        ),
      500,
    );
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      try {
        recognitionRef.current?.stop();
      } catch {
        /* bereits gestoppt */
      }
    },
    [],
  );

  useEffect(
    () => () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    },
    [audioUrl],
  );

  const completion = [
    plan.answers[`${KEY}:practice`] === "done",
    plan.answers[`${KEY}:writing`] === "done",
    plan.answers[`${KEY}:speaking`] === "done",
  ];
  const progress =
    completion.filter(Boolean).length * 33 +
    (completion.every(Boolean) ? 1 : 0);
  const shadowing = shadowingStages.map(
    (_, index) => plan.answers[`${KEY}:shadow:${index}`] === "done",
  );
  const verifiedMastery = state.mastery[TOPIC];

  async function analyzeLessonOutput(
    text: string,
    minimumSentences: number,
  ): Promise<AutomatikAnalysis> {
    if (TOPIC === "Nebensatz mit weil") return analyzeWeilClause(text);
    const result = await requestEvaluation({
      allowOnlineFeedback: state.learner.allowOnlineAI,
      apiBaseUrl: API_BASE_URL,
      text,
      grammar: {
        title: grammar.title,
        rule: grammar.rule,
        examples: grammar.examples,
      },
      kind: "sentences",
      taskPrompt: `Verwende ${grammar.title} in eigenen, zusammenhängenden Sätzen.`,
      spellingAffectsMastery: state.settings.spellingAffectsMastery,
    });
    const sentenceCount = text
      .split(/(?:[.!?]+|\n+)/)
      .map((row) => row.trim())
      .filter(Boolean).length;
    const wordCount =
      text.match(/[A-Za-zÄÖÜäöüß]+(?:[-’'][A-Za-zÄÖÜäöüß]+)*/g)?.length ?? 0;
    const issues: AutomatikAnalysis["issues"][number][] = result.issues.map(
      (issue) => ({
        code:
          issue.errorClass === "word_order" ? "word_order" : "missing_target",
        message: issue.message,
        original: issue.context ?? text,
        corrected: issue.suggestion ?? result.corrected,
      }),
    );
    if (sentenceCount < minimumSentences) {
      issues.push({
        code: "unfinished_sentence",
        message: `Schreibe mindestens ${minimumSentences} vollständige Sätze.`,
        original: text,
        corrected: grammar.examples[0] ?? grammar.testAnswer,
      });
    }
    return {
      sentenceCount,
      wordCount,
      targetUses: result.targetHit ? 1 : 0,
      score: result.accuracyScore,
      targetHit:
        result.practiceReady &&
        result.targetHit &&
        sentenceCount >= minimumSentences,
      issues,
      online: result.online,
    };
  }

  function checkPractice() {
    const results = answers.map((answer, index) =>
      practiceAnswerMatches(answer, roundExercises[index]?.expected ?? ""),
    );
    setCheckedAnswers(results);
    const score = Math.round(
      (results.filter(Boolean).length / roundExercises.length) * 100,
    );
    recordAttempt({
      topic: TOPIC,
      mode: "recognition",
      inputText: answers.join("\n"),
      correctedText: roundExercises.map((item) => item.expected).join("\n"),
      targetHit: results.every(Boolean),
      // practiceAnswerMatches is a deterministic exact-match check against a
      // known-correct answer -- not self-rated, not a network call, not
      // fabricated. That's a legitimate verification basis in its own
      // right, distinct from (and not requiring) the online provider used
      // for writing/speaking.
      verified: results.every(Boolean),
      accuracyScore: score,
    });
    if (results.every(Boolean)) {
      setDailyAnswer(`${KEY}:practice`, "done");
      setMessage(
        "Kontrollierte Übung geschafft. Jetzt produzierst du eigene Sprache.",
      );
    } else {
      setMessage(
        "Vergleiche die Modellantworten und korrigiere die markierten Sätze.",
      );
    }
    markActivity(1);
  }

  // Repetition without repeating the same round: draws a fresh shuffled
  // subset from the full exercise pool (up to 10 items per topic since the
  // exercise-completion.ts pool expansion) so a learner can do several
  // genuinely different retrieval rounds on the same topic in one sitting.
  function practiceAgain() {
    const nextRound = pickRound(exercises, ROUND_SIZE);
    setRoundExercises(nextRound);
    setAnswers(nextRound.map(() => ""));
    setCheckedAnswers([]);
    setPracticeRounds((count) => count + 1);
    setMessage("Neue Runde bereit. Der Schritt bleibt trotzdem abgeschlossen.");
  }

  function saveDetectedErrors(analysis: AutomatikAnalysis, sourceText: string) {
    for (const issue of analysis.issues.filter(
      (row) => row.code !== "unfinished_sentence",
    )) {
      addError({
        topic: TOPIC,
        original: issue.original || sourceText,
        corrected: issue.corrected,
        errorClass:
          issue.code === "word_order"
            ? "word_order"
            : issue.code === "missing_comma"
              ? "spelling"
              : "target_grammar",
        explanation: issue.message,
        critical: issue.code === "word_order",
      });
    }
  }

  async function saveWriting() {
    const analysis = await analyzeLessonOutput(journal, 4);
    setJournalAnalysis(analysis);
    setDailyAnswer(`${KEY}:journal`, journal);
    const latencyMs = journalStartRef.current
      ? Date.now() - journalStartRef.current
      : undefined;
    journalStartRef.current = null;
    recordAttempt({
      topic: TOPIC,
      mode: "writing",
      inputText: journal,
      correctedText: journal,
      targetHit: analysis.targetHit,
      verified: analysis.online && analysis.targetHit,
      accuracyScore: analysis.score,
      ...(latencyMs === undefined ? {} : { latencyMs }),
    });
    saveDetectedErrors(analysis, journal);
    if (analysis.targetHit) setDailyAnswer(`${KEY}:writing`, "done");
    markActivity(1);
    setMessage(
      analysis.targetHit
        ? "Tagebuch gespeichert. Du hast die Zielstruktur selbst produziert."
        : `Entwurf gespeichert. Nutze die Hinweise und verwende „${TOPIC}“ in vollständigen eigenen Sätzen.`,
    );
  }

  async function saveTransfer() {
    setTransferChecking(true);
    try {
      const analysis = await analyzeLessonOutput(transferAttempt, 2);
      setTransferAnalysis(analysis);
      recordAttempt({
        topic: TOPIC,
        mode: "transfer",
        inputText: transferAttempt,
        correctedText: transferAttempt,
        targetHit: analysis.targetHit,
        verified: analysis.online && analysis.targetHit,
        accuracyScore: analysis.score,
      });
      saveDetectedErrors(analysis, transferAttempt);
      if (analysis.targetHit) setDailyAnswer(`${KEY}:transfer`, "done");
      markActivity(1);
    } finally {
      setTransferChecking(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      chunksRef.current = [];
      audioRef.current = null;
      setHasAudioBlob(false);
      setSpeechAnalysis(null);
      setTranscript("");
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        audioRef.current = blob;
        setHasAudioBlob(blob.size > 0);
        if (blob.size > 0) setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start(250);
      startedAtRef.current = Date.now();
      setSeconds(0);
      setRecording(true);

      const Recognition = getSpeechRecognition();
      if (Recognition) {
        const recognition = new Recognition();
        recognition.lang = "de-DE";
        recognition.continuous = true;
        recognition.interimResults = true;
        let finalText = "";
        recognition.onresult = (event) => {
          let interim = "";
          for (
            let index = event.resultIndex;
            index < event.results.length;
            index += 1
          ) {
            const result = event.results[index];
            if (!result) continue;
            if (result.isFinal)
              finalText += `${finalText ? " " : ""}${result[0].transcript}`;
            else interim += `${interim ? " " : ""}${result[0].transcript}`;
          }
          setTranscript(`${finalText} ${interim}`.trim());
        };
        recognition.start();
        recognitionRef.current = recognition;
      }
      setMessage(`Aufnahme läuft. Sprich frei und verwende ${TOPIC}.`);
    } catch (error) {
      setMessage(
        `${error instanceof Error ? error.message : "Mikrofon nicht verfügbar."} Du kannst das Transkript weiterhin eintippen.`,
      );
    }
  }

  async function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    await new Promise<void>((resolve) => {
      recorder.addEventListener("stop", () => resolve(), { once: true });
      recorder.stop();
    });
    try {
      recognitionRef.current?.stop();
    } catch {
      /* bereits gestoppt */
    }
    setRecording(false);
    setMessage(
      "Aufnahme beendet. Prüfe das Transkript und speichere den Nachweis.",
    );
  }

  async function saveSpeaking() {
    if (recording) await stopRecording();

    const requiredSeconds =
      selectedLevel === "A1" || selectedLevel === "A2" ? 30 : 45;
    const evidenceBlock = speakingEvidenceBlock({
      audioSize: audioRef.current?.size ?? 0,
      seconds,
      requiredSeconds,
      shadowingComplete: shadowing.every(Boolean),
    });

    if (evidenceBlock === "missing-audio") {
      setMessage(
        "Noch kein echter Sprechnachweis: Nimm deine Stimme auf und stoppe die Aufnahme zuerst.",
      );
      return;
    }
    if (evidenceBlock === "too-short") {
      setMessage(
        `Sprich mindestens ${requiredSeconds} Sekunden. Aktuell sind ${seconds} Sekunden aufgenommen.`,
      );
      return;
    }
    if (evidenceBlock === "incomplete-shadowing") {
      setMessage(
        "Schließe zuerst alle fünf Shadowing-Stufen ab. Danach kann der Sprechnachweis bewertet werden.",
      );
      return;
    }

    const analysis = await analyzeLessonOutput(transcript, 2);
    setSpeechAnalysis(analysis);
    setDailyAnswer(`${KEY}:transcript`, transcript);
    const fluencyScore = Math.min(
      100,
      Math.round((analysis.wordCount / Math.max(1, seconds) / 2) * 100),
    );
    // analysis.targetHit already requires result.practiceReady, which is
    // spelling-accommodated (see evaluation-client.ts): purely-spelling
    // slips don't block it unless spellingAffectsMastery is enabled.
    // Re-checking raw analysis.issues.length here would re-introduce a
    // spelling-only block, so we rely on targetHit alone.
    const speakingReady = analysis.targetHit;

    recordAttempt({
      topic: TOPIC,
      mode: "speaking",
      inputText: transcript,
      correctedText: transcript,
      targetHit: speakingReady,
      // evidenceBlock above already required real audio, full shadowing,
      // and minimum duration before this point is ever reached -- the only
      // remaining condition for mastery credit is that the transcript was
      // actually checked online and passed.
      verified: analysis.online && speakingReady,
      accuracyScore: analysis.score,
      fluencyScore,
      // Feeds calculateMasteryStatus's median-latency gate
      // (AUTOMATICITY_LATENCY_THRESHOLD_MS) -- previously never passed here,
      // so that gate could never be satisfied by Mission speaking attempts.
      latencyMs: seconds * 1_000,
    });
    saveDetectedErrors(analysis, transcript);

    if (state.settings.saveAudio && audioRef.current) {
      await saveAudio({
        id: `automatik-audio-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        date: new Date().toISOString(),
        topic: `${TOPIC} im Alltag`,
        transcript,
        correctedTranscript: transcript,
        targetGrammar: TOPIC,
        blob: audioRef.current,
      });
    }

    if (!speakingReady) {
      setMessage(
        `Aufnahme gespeichert, aber noch nicht abgeschlossen. Repariere die Hinweise und verwende „${TOPIC}“ korrekt.`,
      );
      return;
    }

    addSession({
      topic: {
        topic: `${TOPIC} im Alltag`,
        level: selectedLevel,
        category: "Automatik",
      },
      transcript,
      corrected: transcript,
      accuracyScore: analysis.score,
      fluencyScore,
      latencyMs: seconds * 1_000,
    });
    setDailyAnswer(`${KEY}:speaking`, "done");
    scheduleReview(TOPIC, transcript, transcript, {
      sourceType: "grammar_topic",
      sourceId: TOPIC,
      reviewMode: "production",
    });
    markActivity(1);
    setMessage(
      "Sprechnachweis abgeschlossen und gespeichert. Höre ihn an und wiederhole ihn bei Bedarf.",
    );
  }
  return (
    <div className="space-y-5">
      {!focusedStep && focusedStep !== 0 ? (
        <section className="flex flex-col gap-4 overflow-hidden rounded-3xl border border-violet-200 bg-violet-50 p-5 shadow-sm sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge className="mb-3 bg-violet-700 text-white">
              Heute · {missionMinutes} Minuten
            </Badge>
            {embedded ? (
              <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                Vertiefender Nachweis
              </h2>
            ) : (
              <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                Automatik-Mission
              </h1>
            )}
            <p className="mt-2 max-w-3xl text-muted-foreground">
              Aktivieren, korrekt anwenden, laut automatisieren und frei
              übertragen. Die Mission endet mit einem gespeicherten Nachweis,
              nicht mit bloßem Durchklicken.
            </p>
          </div>
          <Button
            className="bg-violet-700 text-white hover:bg-violet-800"
            size="lg"
            onClick={() =>
              document
                .getElementById("mission")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <Play /> Nachweis starten
          </Button>
        </section>
      ) : null}

      {focusedStep === undefined ? (
        <Card className="border-violet-200 bg-violet-50/70" id="mission">
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <strong>
                  {TOPIC} · {selectedLevel}
                </strong>
                <p className="text-sm text-muted-foreground">{grammar.rule}</p>
              </div>
              <Badge>{progress}% erledigt</Badge>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white ring-1 ring-violet-200">
              <div
                className="h-full rounded-full bg-violet-700 transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p
              aria-live="polite"
              className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-violet-950"
            >
              {message}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {focusedStep === undefined ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            {
              icon: BookOpenCheck,
              title: "1. Aktivieren & korrekt anwenden",
              detail: "3 Min. · drei kontrollierte Umformungen",
              done: completion[0],
            },
            {
              icon: PenLine,
              title: "2. Automatisieren & schreiben",
              detail: "4 Min. · sechs Sätze mit vier Zielstrukturen",
              done: completion[1],
            },
            {
              icon: Mic,
              title: "3. Frei sprechen & übertragen",
              detail: "5 Min. · Shadowing und 60 Sekunden ohne Vorlage",
              done: completion[2],
            },
          ].map((step, index) => (
            <button
              aria-pressed={activeStep === index}
              className="text-left"
              key={step.title}
              onClick={() => setActiveStep(index)}
              type="button"
            >
              <Card className={step.done ? "border-violet-500" : ""}>
                <CardContent className="flex gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-800">
                    {step.done ? <Check /> : <step.icon />}
                  </span>
                  <div>
                    <strong>{step.title}</strong>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {step.detail}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      ) : null}

      {focusedStep === undefined ? (
        <Card className="border-violet-200">
          <CardHeader>
            <CardTitle>Qualitätsgrenze der Mission</CardTitle>
            <CardDescription>
              „Erledigt“ bedeutet nicht automatisch „beherrscht“. Automatik wird
              erst durch drei getrennte Nachweise sichtbar.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-violet-50 p-4 text-sm">
              <strong>Genau</strong>
              <p className="mt-1 text-muted-foreground">
                Zielstruktur korrekt in eigenen Sätzen.
              </p>
            </div>
            <div className="rounded-2xl bg-violet-50 p-4 text-sm">
              <strong>Spontan</strong>
              <p className="mt-1 text-muted-foreground">
                Mindestens 60 Sekunden ohne Ablesen sprechen.
              </p>
            </div>
            <div className="rounded-2xl bg-violet-50 p-4 text-sm">
              <strong>Behalten</strong>
              <p className="mt-1 text-muted-foreground">
                Die Struktur bei der nächsten Wiederholung erneut abrufen.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {(focusedStep ?? activeStep) === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Lektion und kontrollierte Übung</CardTitle>
            <CardDescription>{grammar.rule}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-violet-50 p-4">
                <strong>Regel und Form</strong>
                <p className="mt-2">{grammar.examples[0]}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4">
                <strong>Typischer Fehler</strong>
                <p className="mt-2">{grammar.commonError}</p>
              </div>
            </div>
            {roundExercises.map((item, index) => (
              <label className="block space-y-2" key={item.prompt}>
                <span className="text-sm font-bold">{item.prompt}</span>
                <input
                  className="min-h-11 w-full rounded-xl border bg-background px-3"
                  onChange={(event) => {
                    const value = event.target.value;
                    setAnswers((rows) => {
                      const next = [...rows];
                      next[index] = value;
                      return next;
                    });
                  }}
                  value={answers[index]}
                />
                {checkedAnswers.length ? (
                  <span
                    className={
                      checkedAnswers[index]
                        ? "text-sm font-bold text-violet-800"
                        : "text-sm font-bold text-red-800"
                    }
                  >
                    {checkedAnswers[index]
                      ? "Richtig"
                      : `Modell: ${item.expected}`}
                  </span>
                ) : null}
              </label>
            ))}
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={checkPractice}>Antworten prüfen</Button>
              {checkedAnswers.length && exercises.length > roundExercises.length ? (
                <Button onClick={practiceAgain} variant="outline">
                  <RotateCcw /> Neue Runde üben
                </Button>
              ) : null}
              {practiceRounds > 0 ? (
                <Badge>{practiceRounds + 1} Runden in dieser Sitzung</Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {(focusedStep ?? activeStep) === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Grammatik-Tagebuch</CardTitle>
            <CardDescription>
              Schreibe mindestens vier zusammenhängende Sätze aus deinem Alltag
              und verwende dabei die heutige Struktur „{TOPIC}“.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              aria-label={`${TOPIC}-Tagebuch`}
              onChange={(event) => {
                if (journalStartRef.current === null) {
                  journalStartRef.current = Date.now();
                }
                setJournal(event.target.value);
              }}
              placeholder={grammar.examples[0] ?? grammar.testAnswer}
              value={journal}
            />
            <Button onClick={saveWriting}>
              <PenLine /> Schreiben analysieren und speichern
            </Button>
            {journalAnalysis ? <Feedback analysis={journalAnalysis} /> : null}
          </CardContent>
        </Card>
      ) : null}

      {(focusedStep ?? activeStep) === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle>Fünfstufiges Shadowing und freies Sprechen</CardTitle>
            <CardDescription>
              Höre den Rhythmus, sprich mit und übertrage die Struktur danach
              ohne Ablesen in deine eigene Situation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl bg-violet-950 p-5 text-violet-50">
              <p className="leading-7">{modelText}</p>
              <Button
                className="mt-4 bg-white text-violet-950 hover:bg-violet-100"
                onClick={() => speak(modelText)}
              >
                <Volume2 /> Modell abspielen
              </Button>
            </div>
            <div className="grid gap-2 md:grid-cols-5">
              {shadowingStages.map((stage, index) => (
                <button
                  className={`min-h-24 rounded-2xl border p-3 text-left text-sm font-bold ${shadowing[index] ? "border-violet-700 bg-violet-100 text-violet-950" : "bg-background"}`}
                  key={stage}
                  onClick={() =>
                    setDailyAnswer(
                      `${KEY}:shadow:${index}`,
                      shadowing[index] ? "" : "done",
                    )
                  }
                  type="button"
                >
                  <span className="mb-2 block text-xs text-muted-foreground">
                    Stufe {index + 1}
                  </span>
                  {shadowing[index] ? (
                    <Check className="mb-1 size-4" />
                  ) : (
                    <Headphones className="mb-1 size-4" />
                  )}
                  {stage}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={recording} onClick={startRecording}>
                <Mic /> Aufnehmen
              </Button>
              <Button
                disabled={!recording}
                onClick={stopRecording}
                variant="outline"
              >
                <Square /> Stoppen
              </Button>
              <Badge>{seconds} Sek.</Badge>
            </div>
            {audioUrl ? (
              <audio
                aria-label="Eigene Aufnahme anhören"
                className="w-full"
                controls
                src={audioUrl}
              />
            ) : null}
            <Textarea
              aria-label="Sprechtranskript"
              onChange={(event) => setTranscript(event.target.value)}
              placeholder="Live- oder manuell eingegebenes Transkript …"
              value={transcript}
            />
            <p className="text-sm leading-6 text-muted-foreground">
              Für einen gültigen Nachweis brauchst du alle fünf Stufen, eine
              echte Aufnahme und mindestens{" "}
              {selectedLevel === "A1" || selectedLevel === "A2" ? 30 : 45}{" "}
              Sekunden freie Sprache.
            </p>
            <Button
              disabled={!hasAudioBlob || recording}
              onClick={saveSpeaking}
            >
              Sprechen analysieren und speichern
            </Button>
            {speechAnalysis ? <Feedback analysis={speechAnalysis} /> : null}

            <div className="mt-2 space-y-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
              <div>
                <p className="text-sm font-bold text-violet-950">
                  Übertragung: eine neue Situation
                </p>
                <p className="text-sm text-muted-foreground">{situation}</p>
              </div>
              <Textarea
                aria-label="Übertragungsantwort"
                onChange={(event) => setTransferAttempt(event.target.value)}
                placeholder="Reagiere auf die Situation oben und verwende dabei die heutige Struktur."
                value={transferAttempt}
              />
              <Button
                disabled={!transferAttempt.trim() || transferChecking}
                onClick={() => void saveTransfer()}
              >
                {transferChecking ? "Wird geprüft …" : "Übertragung prüfen"}
              </Button>
              {transferAnalysis ? <Feedback analysis={transferAnalysis} /> : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {focusedStep === undefined ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Transparente Beherrschung</CardTitle>
              <CardDescription>
                Übungsnachweise sind sofort sichtbar. Nur online oder fachlich
                geprüfte Versuche erhöhen den bestätigten Beherrschungswert.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Axis
                label="Erkennen und Umformen"
                value={
                  checkedAnswers.length
                    ? Math.round(
                        (checkedAnswers.filter(Boolean).length /
                          checkedAnswers.length) *
                          100,
                      )
                    : (verifiedMastery?.scores.recognition ?? 0)
                }
              />
              <Axis
                label="Eigenes Schreiben"
                value={
                  journalAnalysis?.score ?? verifiedMastery?.scores.writing ?? 0
                }
              />
              <Axis
                label="Freies Sprechen"
                value={
                  speechAnalysis?.score ?? verifiedMastery?.scores.speaking ?? 0
                }
              />
              <div className="flex flex-wrap gap-2">
                <Badge>Offline-Übung</Badge>
                <Badge variant="outline">
                  Bestätigte Automatik:{" "}
                  {verifiedMastery?.scores.automaticity ?? 0}%
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Mein Grammatik-Musterplan</CardTitle>
              <CardDescription>
                Aus den heutigen Schreib- und Sprechfehlern erzeugt.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                <li className="rounded-xl bg-violet-50 p-3">
                  <b>1. Reparieren:</b> fünf ähnliche Sätze korrigieren.
                </li>
                <li className="rounded-xl bg-violet-50 p-3">
                  <b>2. Übertragen:</b> fünf neue eigene Sätze mit „{TOPIC}“
                  bilden.
                </li>
                <li className="rounded-xl bg-violet-50 p-3">
                  <b>3. Automatisieren:</b> einmal shadowen und frei
                  nacherzählen.
                </li>
              </ol>
              <Button
                className="mt-4"
                onClick={() => {
                  setCheckedAnswers([]);
                  setJournalAnalysis(null);
                  setSpeechAnalysis(null);
                  setMessage(
                    "Neue Wiederholung gestartet. Gespeicherte Nachweise bleiben erhalten.",
                  );
                }}
                variant="outline"
              >
                <RotateCcw /> Neue Wiederholung
              </Button>
              {(journalAnalysis?.issues.length ?? 0) +
                (speechAnalysis?.issues.length ?? 0) >
              0 ? (
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" /> Erkannte
                  Fehler wurden zusätzlich im Fehlermotor für die verteilte
                  Reparatur gespeichert.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
