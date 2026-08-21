"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpenCheck,
  Check,
  Clock,
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
import {
  createEmptyMasteryRecord,
  nextPracticeStage,
  PRACTICE_STAGE_TARGET_ACCURACY,
} from "@grammar/domain";
import { saveAudio } from "@/features/audio/audio-repository";
import {
  analyzeWeilClause,
  computeRestoredDraft,
  evaluatePracticeAnswer,
  type AutomatikAnalysis,
  type AutomatikIssue,
} from "@/features/automaticity/automaticity-analysis";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";
import { DailyAutomaticityProgram } from "@/features/daily-program/daily-automaticity-program";
import { playTeacherAudioByContextKey } from "@/lib/teacher-content";
import {
  analyzeAudioFluency,
  scoreFromActiveSpeech,
  type AudioFluencyAnalysis,
} from "@/lib/audio-fluency";
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
export const TRANSFER_SITUATIONS = [
  "Eine Freundin, die nicht dabei war, fragt, was passiert ist. Erkläre es ihr, ohne den Hintergrund vorauszusetzen.",
  "Du schreibst einer neuen Kollegin zum ersten Mal darüber. Gib ihr die Kurzfassung.",
  "Jemand, den du gerade erst kennengelernt hast, fragt im Gespräch danach. Antworte natürlich, so wie du es laut sagen würdest.",
  "Schreibe eine kurze Notiz für jemanden, der dich vertritt und die wichtigsten Fakten schnell braucht.",
] as const;

export function transferSituation(
  title: string,
  priorTransferAttempts: number,
) {
  let hash = 0;
  for (let index = 0; index < title.length; index += 1) {
    hash = (hash * 31 + title.charCodeAt(index)) >>> 0;
  }
  const startOffset = hash % TRANSFER_SITUATIONS.length;
  const index =
    (startOffset + priorTransferAttempts) % TRANSFER_SITUATIONS.length;
  return TRANSFER_SITUATIONS[index];
}

// Obergrenze einer Runde, keine Zusage. exercise-completion.ts garantiert
// seit der Entfernung der Abtipp-Aufgaben nur noch
// MINIMUM_CONTROLLED_EXERCISES (5) pro Einheit, und nach dedupeByAnswer
// bleiben davon je nach Einheit 2-5 verschiedene Antworten übrig. Eine Runde
// ist also oft kürzer als dieser Wert -- das ist die ehrliche Ausbeute der
// vorhandenen Inhalte und keine Regression. Der frühere Kommentar versprach
// hier 10 Aufgaben pro Einheit; diese Zahl kam nur zustande, weil drei
// Aufgabenfamilien ihre eigene Lösung im Prompt abdruckten.
const ROUND_SIZE = 6;

// UI-facing half of the timed-practice model -- the scoring/transition rule
// itself (nextPracticeStage, PRACTICE_STAGE_TARGET_ACCURACY) lives in
// @grammar/domain so it is shared, testable logic rather than duplicated
// per screen. The per-item second budgets are a presentation choice (which
// exact midpoint of the spec's 8-10s / 3-5s bands to show), so they stay
// local like English's equivalent constants in automaticity-screen.tsx.
const STAGE_SECONDS_PER_ITEM: Readonly<Record<1 | 2 | 3, number | null>> = {
  1: null,
  2: 9,
  3: 4,
};
const STAGE_LABEL: Readonly<Record<1 | 2 | 3, string>> = {
  1: "Stufe 1 · unbegrenzte Zeit",
  2: "Stufe 2 · leichtes Zeitlimit",
  3: "Stufe 3 · Echtzeit-Produktion",
};

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

// Eine Runde darf nie zweimal nach derselben Antwort fragen. Mehrere Einheiten
// führen zwei Aufgabenstellungen, die auf dieselbe erwartete Zeichenkette
// zeigen (etwa „Regel aus dem Gedächtnis nennen“ und „Regel ohne Nachschlagen
// abrufen“ -- beide erwarten die Regel wörtlich). Beide in dieselbe Runde zu
// ziehen ergab eine 6-Aufgaben-Runde mit nur 3 verschiedenen Antworten, sodass
// die Punktzahl teilweise das doppelte Tippen einer Zeichenkette maß. Der Pool
// behält beide Formulierungen -- ein erneuter Abruf in einer SPÄTEREN Runde ist
// echtes verteiltes Üben -- nur die Dopplung innerhalb einer Runde entfällt.
function dedupeByAnswer<T extends { expected: string }>(
  pool: readonly T[],
): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const item of pool) {
    const answerKey = item.expected.trim().toLocaleLowerCase("de");
    if (seen.has(answerKey)) continue;
    seen.add(answerKey);
    unique.push(item);
  }
  return unique;
}

function pickRound<T extends { expected: string }>(
  pool: readonly T[],
  size: number,
): T[] {
  return dedupeByAnswer(shuffled(pool)).slice(0, size);
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

// A real human-audio store already exists (lib/teacher-content.ts,
// authored via /lehrkraft) with a priority-playback function
// (playTeacherAudioByContextKey) -- Conversation Studio already used it,
// but Mission's model-sentence playback called speechSynthesis directly
// with no attempt to check for a human recording first, so a teacher's
// recorded voice could never actually take priority over the synthetic
// one here. contextKey convention: "grammar-<unit title>", so a teacher
// adding a recording for "Akkusativ" in /lehrkraft types
// "grammar-Akkusativ" as the Inhaltsschlüssel.
async function speak(text: string, contextKey?: string) {
  if (contextKey) {
    const played = await playTeacherAudioByContextKey(contextKey).catch(
      () => false,
    );
    if (played) return;
  }
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
          className="h-full origin-left rounded-full bg-violet-700 transition-transform duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
          style={{
            transform: `scaleX(${Math.min(100, Math.max(0, value)) / 100})`,
          }}
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

// Exported so the Automatisierungstrainer (features/automatization-trainer)
// can reuse the exact same immediate-feedback presentation for its free
// retelling stage instead of re-implementing this per the "reuse existing
// patterns" requirement.
export function Feedback({
  analysis,
}: Readonly<{ analysis: AutomatikAnalysis }>) {
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
                <span className="mr-1 font-bold text-violet-900">Übe das:</span>
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
    completeDailyStep,
    scheduleReview,
    setMastery,
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
  // Auch hier dedupliziert (nicht nur in pickRound), damit die allererste,
  // bewusst ungemischte Runde derselben Regel „eine Antwort pro Runde“ folgt.
  const [roundExercises, setRoundExercises] = useState(() =>
    dedupeByAnswer(exercises).slice(0, ROUND_SIZE),
  );
  const [answers, setAnswers] = useState<string[]>(() =>
    roundExercises.map(() => ""),
  );
  const [checkedAnswers, setCheckedAnswers] = useState<readonly boolean[]>([]);
  const [practiceRounds, setPracticeRounds] = useState(0);
  // Nur eine Aufgabe ist gleichzeitig aktiv/editierbar -- die Runde
  // rendersierte vorher alle 6 gleichzeitig, genau das Muster "mehrere
  // Aufgaben konkurrieren um Aufmerksamkeit", das die eigenen
  // Gestaltungsprinzipien ausschliessen. checkPractice() wertet weiterhin
  // das gesamte answers-Array auf einmal aus (aufgerufen von der letzten
  // Aufgabe); an der Bewertung oder dem gemeinsamen Timer der Runde
  // aendert sich nichts, nur wie viele Eingabefelder gleichzeitig sichtbar
  // sind.
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const practiceStage = state.mastery[TOPIC]?.practiceStage ?? 1;
  const stageSecondsPerItem = STAGE_SECONDS_PER_ITEM[practiceStage];
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  // Immer aktuell gehalten (jedes Rendern), damit der Timeout-Effekt unten
  // die neueste checkPractice-Closure aufruft (mit dem aktuellen `answers`)
  // statt einer veralteten aus dem Rendern, in dem der Countdown-Effekt
  // ursprünglich lief -- das übliche Stale-Closure-Problem bei setInterval
  // in einer Funktionskomponente.
  const checkPracticeRef = useRef<() => void>(() => {});
  // Zeitanker für die aktuell angezeigte Runde -- wird bei jeder neuen Runde
  // zurückgesetzt und in checkPractice() gelesen, damit ein kontrollierter
  // Übungsversuch endlich eine echte latencyMs trägt statt gar keine.
  const roundStartRef = useRef<number | null>(null);

  // (Re-)startet den Runden-Countdown und den Zeitanker bei jeder neuen Runde
  // (roundExercises bekommt eine neue Identität durch practiceAgain() oder
  // Themenwechsel) oder Stufenwechsel, und stoppt den Countdown, sobald die
  // Runde geprüft wurde.
  useEffect(() => {
    roundStartRef.current = Date.now();
    if (stageSecondsPerItem === null || checkedAnswers.length > 0) {
      setSecondsRemaining(null);
      return;
    }
    setSecondsRemaining(stageSecondsPerItem * roundExercises.length);
    const interval = setInterval(() => {
      setSecondsRemaining((value) =>
        value === null ? null : Math.max(0, value - 1),
      );
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- checkedAnswers.length wird nur für den 0/ungleich-0-Übergang gelesen, nicht für seinen Wert
  }, [roundExercises, stageSecondsPerItem, checkedAnswers.length]);

  // Sendet die Runde automatisch ab, wenn das Zeitbudget abläuft, damit
  // „ohne lange Zögerlichkeit“ tatsächlich durchgesetzt wird statt nur
  // angezeigt.
  useEffect(() => {
    if (secondsRemaining === 0 && checkedAnswers.length === 0) {
      checkPracticeRef.current();
    }
  }, [secondsRemaining, checkedAnswers.length]);
  // Abrufübung misst nur dann Abruf, wenn die Antwort NICHT auf dem Bildschirm
  // steht. Jede erwartete Antwort dieses Schritts stammt aus Regel, Beispielen
  // oder typischem Fehler der Einheit -- genau dem Text, den die Lektionsfelder
  // direkt über den Eingabefeldern anzeigen. Mit offenen Feldern ist „Regel aus
  // dem Gedächtnis nennen“ eine Abschreibaufgabe, und die daraus entstehenden
  // 100 % belegen nichts. Die Lektion bleibt (sie IST die Vermittlung); sie
  // wird beim Antworten nur geschlossen. Eine Runde mit sichtbarer Regel bleibt
  // echte Übung, wird aber als Lernen statt als bestätigter Abrufnachweis
  // erfasst, damit Beherrschung nicht durch Abschreiben steigen kann.
  const [lessonOpen, setLessonOpen] = useState(true);
  const [peeked, setPeeked] = useState(false);
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
    setCurrentExerciseIndex(0);
    setPracticeRounds(0);
    // Ein neues Thema beginnt wieder in der Lernphase: die Regel dieser Einheit
    // wurde noch nicht gesehen, ein geschlossener Start wäre eine Prüfung vor
    // jeder Vermittlung.
    setLessonOpen(true);
    setPeeked(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `exercises` is derived from `grammar`, which KEY already uniquely identifies; re-running per `exercises` identity would refire every render
  }, [KEY]);
  const [journal, setJournal] = useState("");
  const [transcript, setTranscript] = useState("");
  const [journalAnalysis, setJournalAnalysis] =
    useState<AutomatikAnalysis | null>(null);
  const [speechAnalysis, setSpeechAnalysis] =
    useState<AutomatikAnalysis | null>(null);
  const [audioFluencyResult, setAudioFluencyResult] =
    useState<AudioFluencyAnalysis | null>(null);
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
  // Im Grammatik-Labor (embedded) wird Schritt 2 (Sprechen) nie automatisch
  // ausgewählt -- er lebt jetzt im Gesprächsstudio, nicht mehr eingebettet
  // hier. Ohne diese Ausnahme würde diese Initialisierung, sobald Schritt 0
  // und 1 erledigt sind, standardmäßig auf Schritt 2 springen und die volle
  // Aufnahme-Oberfläche zeigen, obwohl nichts in der Grammatik-Labor-Oberfläche
  // mehr dorthin verlinkt.
  const [activeStep, setActiveStep] = useState<number>(
    focusedStep ??
      (embedded ? [0, 1] : [0, 1, 2]).find(
        (step) => !plan.completed.includes(step),
      ) ??
      (embedded ? 1 : 0),
  );
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [hasAudioBlob, setHasAudioBlob] = useState(false);
  const startedAtRef = useRef(0);
  // Keyed (not boolean) so a topic change re-syncs journal/transcript to the
  // new topic's saved draft instead of leaving the previous topic's text in
  // state -- a once-only guard here let stale evidence from one topic bleed
  // into the next when the screen stayed mounted across a topic change (the
  // learner's draft was attributed to the wrong grammar topic in saveWriting).
  const restoredKeyRef = useRef<string | null>(null);
  // Timestamp of the first keystroke in the writing/transfer Textareas,
  // cleared after save -- feeds writingLatenciesMs / WRITING_LATENCY_THRESHOLD_MS
  // in packages/domain/src/mastery.ts (a separate, more generous gate than
  // AUTOMATICITY_LATENCY_THRESHOLD_MS, which is for recognition/speaking
  // recall speed, not composing a sentence).
  const journalStartRef = useRef<number | null>(null);
  const transferStartRef = useRef<number | null>(null);

  useEffect(() => {
    const draft = computeRestoredDraft(
      hydrated,
      KEY,
      restoredKeyRef.current,
      plan.answers,
    );
    if (!draft.shouldRestore) return;
    restoredKeyRef.current = KEY;
    setJournal(draft.journal);
    setTranscript(draft.transcript);
  }, [hydrated, KEY, plan.answers]);

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
    // Sichtbare Regel (nie geschlossen oder mitten in der Runde wieder
    // geöffnet) macht die Runde zur Übung mit offenem Buch. Als ein Merker
    // geführt, damit erfasster Versuch und Rückmeldung immer übereinstimmen.
    const openBook = lessonOpen || peeked;
    // secondsRemaining ist sowohl beim automatischen Absenden durch den
    // Timeout-Effekt als auch im Moment eines manuellen Klicks bei genau 0
    // gleich 0 -- in beiden Fällen wurde das gesamte Zeitbudget der Runde
    // verbraucht, und genau das bedeutet hier „Zeit abgelaufen“.
    const timedOut = stageSecondsPerItem !== null && secondsRemaining === 0;
    const latencyMs = roundStartRef.current
      ? Date.now() - roundStartRef.current
      : undefined;
    // evaluatePracticeAnswer statt practiceAnswerMatches: bei „Korrigiere den
    // Satz ...“ schreibt die lernende Person den reparierten Satz selbst, und
    // ein korrekter Satz, der von der gespeicherten Zeichenkette abweicht,
    // wurde bisher als falsch gewertet. Alle anderen Aufgabentypen prüft die
    // Funktion weiterhin exakt.
    const results = answers.map((answer, index) =>
      evaluatePracticeAnswer(answer, {
        prompt: roundExercises[index]?.prompt ?? "",
        expected: roundExercises[index]?.expected ?? "",
      }),
    );
    setCheckedAnswers(results);
    const score = Math.round(
      (results.filter(Boolean).length / roundExercises.length) * 100,
    );

    const stageTarget = PRACTICE_STAGE_TARGET_ACCURACY[practiceStage];
    const nextStage = nextPracticeStage(practiceStage, score, openBook);

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
      // for writing/speaking. `verified` means trustworthy, not correct: a
      // wrong closed-book answer must lower the score instead of disappearing
      // -- aber nur, wenn die Antwort zum Zeitpunkt der
      // Prüfung nicht ablesbar war. Eine Runde mit offenem Buch ist echte
      // Übung, aber kein Abrufnachweis, und darf die Beherrschung nicht heben.
      verified: !openBook,
      accuracyScore: score,
      ...(latencyMs === undefined ? {} : { latencyMs }),
    });

    if (nextStage !== practiceStage) {
      const current = state.mastery[TOPIC] ?? createEmptyMasteryRecord();
      setMastery(TOPIC, { ...current, practiceStage: nextStage });
    }

    const stageNote =
      openBook || nextStage === practiceStage
        ? ""
        : nextStage > practiceStage
          ? ` Stufe ${practiceStage} bestanden mit ${score}% (Ziel ${stageTarget}%) -- weiter zu Stufe ${nextStage}.`
          : ` Genauigkeit auf ${score}% gefallen bei Stufe ${practiceStage} -- zurück zu Stufe ${nextStage} für mehr Übung.`;
    const timeoutNote =
      timedOut && !results.every(Boolean) ? "Zeit abgelaufen. " : "";

    if (results.every(Boolean)) {
      setDailyAnswer(`${KEY}:practice`, "done");
      // Home's "heutige Übung" progress reads plan.completed, which only
      // completeDailyStep ever writes to -- setDailyAnswer alone (an
      // unrelated per-topic draft store) never touched it, so a learner
      // could finish this step here and see 0% on Home forever. Same
      // completion semantics as the message below: open-book still counts
      // as finishing the step (it's work done, not a mastery claim --
      // mastery stays gated on `verified` in recordAttempt, untouched here).
      completeDailyStep(0);
      setMessage(
        (openBook
          ? "Alles richtig, aber die Regel war sichtbar -- das zählt als Lernen, nicht als Abruf. Blende sie aus und mache eine weitere Runde für den Nachweis."
          : "Kontrollierte Übung geschafft, aus dem Gedächtnis beantwortet. Jetzt produzierst du eigene Sprache.") +
          stageNote,
      );
    } else {
      setMessage(
        timeoutNote +
          "Vergleiche die Modellantworten und korrigiere die markierten Sätze." +
          stageNote,
      );
    }
    markActivity(1);
  }

  useEffect(() => {
    checkPracticeRef.current = checkPractice;
  });

  // Repetition without repeating the same round: draws a fresh shuffled
  // subset from the full exercise pool (up to 10 items per topic since the
  // exercise-completion.ts pool expansion) so a learner can do several
  // genuinely different retrieval rounds on the same topic in one sitting.
  function practiceAgain() {
    const nextRound = pickRound(exercises, ROUND_SIZE);
    setRoundExercises(nextRound);
    setAnswers(nextRound.map(() => ""));
    setCheckedAnswers([]);
    setCurrentExerciseIndex(0);
    setPracticeRounds((count) => count + 1);
    // Eine neue Runde bekommt eine neue Chance mit geschlossenem Buch: der
    // Blick in die Regel während der vorherigen Runde soll nicht jede spätere
    // dauerhaft entwerten.
    setLessonOpen(false);
    setPeeked(false);
    setMessage(
      "Neue Runde bereit, Regel ausgeblendet. Der Schritt bleibt trotzdem abgeschlossen.",
    );
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
      // verified means "the online evaluator actually ran," not "and it
      // passed" -- recordVerifiedMasteryAttempt discards the whole attempt
      // when verified is false, so gating this on targetHit too silently
      // threw away every genuinely-checked failure instead of letting it
      // pull the score down like recordMasteryAttempt's capped-score logic
      // (targetHit false -> score capped at 59) already does correctly.
      verified: analysis.online,
      assessedBy: analysis.online ? "online" : "offline",
      contentVersion: "20.8.24",
      accuracyScore: analysis.score,
      ...(latencyMs === undefined ? {} : { latencyMs }),
    });
    saveDetectedErrors(analysis, journal);
    if (analysis.targetHit) {
      setDailyAnswer(`${KEY}:writing`, "done");
      completeDailyStep(1);
    }
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
      const latencyMs = transferStartRef.current
        ? Date.now() - transferStartRef.current
        : undefined;
      transferStartRef.current = null;
      recordAttempt({
        topic: TOPIC,
        mode: "transfer",
        inputText: transferAttempt,
        correctedText: transferAttempt,
        targetHit: analysis.targetHit,
        // See saveWriting's comment -- verified must track "the online
        // check ran," not "and passed," or every genuinely-checked
        // failure gets silently discarded instead of scored.
        verified: analysis.online,
        assessedBy: analysis.online ? "online" : "offline",
        contentVersion: "20.8.24",
        accuracyScore: analysis.score,
        ...(latencyMs === undefined ? {} : { latencyMs }),
      });
      saveDetectedErrors(analysis, transferAttempt);
      if (analysis.targetHit) {
        setDailyAnswer(`${KEY}:transfer`, "done");
        // Step 2's card covers shadowing *and* free transfer together, so
        // either sub-part reaching real evidence completes the step --
        // completeDailyStep is idempotent (guards on plan.completed already
        // containing the index), so calling it from both this and
        // saveSpeaking() below can't double-count.
        completeDailyStep(2);
      }
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
      // audioFluencyResult was missing here -- stale pause/pitch numbers
      // from the prior attempt could keep displaying while a new recording
      // was already in progress, since it was previously only ever reset at
      // save time (saveSpeaking()).
      setAudioFluencyResult(null);
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
    // Real, audio-derived fluency (active-speech time from amplitude, not
    // a wordCount/seconds text proxy which counts recording time
    // including pauses as if it were speaking time).
    const audioFluency = audioRef.current
      ? await analyzeAudioFluency(audioRef.current)
      : null;
    setAudioFluencyResult(audioFluency);
    // No text-derived fallback: if the audio didn't decode, fluency is
    // not_assessed (0), not a wordCount/seconds guess presented as measured
    // -- the same contract-required rule this function's own comment above
    // already states but the old fallback silently violated.
    const fluencyScore = audioFluency
      ? scoreFromActiveSpeech(
          analysis.wordCount,
          audioFluency.activeSpeechSeconds,
        )
      : 0;
    // analysis.targetHit already requires result.practiceReady, which is
    // spelling-accommodated (see evaluation-client.ts): purely-spelling
    // slips don't block it unless spellingAffectsMastery is enabled.
    // Re-checking raw analysis.issues.length here would re-introduce a
    // spelling-only block, so we rely on targetHit alone.
    const speakingReady = analysis.targetHit;
    const requestedAudioPath = state.settings.saveAudio
      ? `automatik-audio-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
      : undefined;
    let audioPath: string | undefined;
    if (requestedAudioPath && audioRef.current) {
      try {
        await saveAudio({
          id: requestedAudioPath,
          date: new Date().toISOString(),
          topic: `${TOPIC} im Alltag`,
          transcript,
          correctedTranscript: transcript,
          targetGrammar: TOPIC,
          blob: audioRef.current,
        });
        audioPath = requestedAudioPath;
      } catch {
        // Keep the in-memory speaking evidence, but never persist a dangling
        // reference when IndexedDB could not retain the recording.
      }
    }

    recordAttempt({
      topic: TOPIC,
      mode: "speaking",
      inputText: transcript,
      correctedText: transcript,
      targetHit: speakingReady,
      // evidenceBlock above already required real audio, full shadowing,
      // and minimum duration before this point is ever reached. verified
      // must track "the online check ran" (see saveWriting's comment),
      // not "and passed" -- gating it on speakingReady too silently
      // discarded every genuinely-checked failed speaking attempt instead
      // of letting recordMasteryAttempt's capped-score logic score it.
      verified: analysis.online,
      assessedBy: analysis.online ? "online" : "offline",
      contentVersion: "20.8.24",
      accuracyScore: analysis.score,
      fluencyScore,
      // Feeds calculateMasteryStatus's median-latency gate
      // (AUTOMATICITY_LATENCY_THRESHOLD_MS) -- previously never passed here,
      // so that gate could never be satisfied by Mission speaking attempts.
      latencyMs: seconds * 1_000,
      audioCaptured: Boolean(audioRef.current),
      ...(audioPath ? { audioPath } : {}),
    });
    saveDetectedErrors(analysis, transcript);

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
    completeDailyStep(2);
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

  if (!embedded) {
    return (
      <div className="space-y-5">
        <section className="flex flex-col gap-4 overflow-hidden rounded-3xl border border-violet-200 bg-violet-50 p-5 shadow-sm sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge className="mb-3 bg-violet-700 text-white">
              Heute · {missionMinutes} Minuten
            </Badge>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Dein vollständiges tägliches Automatikprogramm
            </h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              Grammatik, gemischtes Training, Gespräch, Wiederholung und
              Automatisierung bilden jetzt einen Zeitplan. Längere Einheiten
              enthalten mehr Übung; die Qualitätsgrenzen bleiben gleich.
            </p>
          </div>
          <Button
            className="bg-violet-700 text-white hover:bg-violet-800"
            size="lg"
            onClick={() =>
              document
                .getElementById("daily-program-title")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <Play /> Zeit wählen und starten
          </Button>
        </section>

        <DailyAutomaticityProgram />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Vollständig auf !embedded gesperrt statt nur die Überschrift zu
          ändern -- vorher zeigte das Grammatik-Labor dieselbe große
          Überschrift und denselben "Nachweis starten"-Knopf wie die volle
          Mission, obendrüber der Seite "Grammatik-Labor" selbst. Zwei
          Überschriften und zwei Startknöpfe auf einer Seite, genau das
          Problem, das in der englischen App unter "one route instead of five
          competing starts" behoben wurde. */}
      {!embedded && !focusedStep && focusedStep !== 0 ? (
        <section className="flex flex-col gap-4 overflow-hidden rounded-3xl border border-violet-200 bg-violet-50 p-5 shadow-sm sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge className="mb-3 bg-violet-700 text-white">
              Heute · {missionMinutes} Minuten
            </Badge>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Automatik-Mission
            </h1>
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

      {!embedded && focusedStep === undefined ? (
        <DailyAutomaticityProgram />
      ) : null}

      {!embedded && focusedStep === undefined ? (
        <Card className="border-violet-200 bg-violet-50/70" id="mission">
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <strong>
                  {TOPIC} · {selectedLevel}
                </strong>
                <p className="text-sm text-muted-foreground">{grammar.rule}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{progress}% erledigt</Badge>
              </div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white ring-1 ring-violet-200">
              <div
                className="h-full origin-left rounded-full bg-violet-700 transition-transform duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                style={{
                  transform: `scaleX(${Math.min(100, Math.max(0, progress)) / 100})`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Nachricht lebte vorher nur in der oben gesperrten Karte -- eine Seite,
          die diese Komponente einbettet, hätte damit jede Rückmeldung
          verloren. Läuft jetzt in beiden Modi immer mit. */}
      <p
        aria-live="polite"
        className="rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm font-bold text-violet-950"
      >
        {message}
      </p>

      {/* Positionsleiste und die drei Schrittkarten sind absichtlich NICHT auf
          embedded gesperrt. Sie sind der Weg durch die Einheit -- gerade eine
          Seite, die diese Komponente einbettet (Grammatik-Labor), braucht sie
          am meisten. Diese Seite lässt stattdessen die doppelte Überschrift
          und die Themenleiste weg. */}
      <div className="rounded-2xl border border-violet-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <strong className="text-sm">
            Schritt {Math.min(activeStep + 1, 3)} von 3 ·{" "}
            {[
              "Aktivieren & korrekt anwenden",
              "Automatisieren & schreiben",
              "Frei sprechen & übertragen",
            ][activeStep] ?? ""}
          </strong>
          <span className="text-sm text-muted-foreground">
            {completion.filter(Boolean).length} von 3 erledigt
            {completion.every(Boolean)
              ? " · Einheit abgeschlossen, Nachweis gespeichert"
              : " · alle drei erledigen, um die Einheit abzuschließen"}
          </span>
        </div>
        <div className="mt-2 flex gap-1" aria-hidden>
          {completion.map((done, index) => (
            <span
              className={`h-1.5 flex-1 rounded-full ${
                done
                  ? "bg-violet-700"
                  : index === activeStep
                    ? "bg-violet-400"
                    : "bg-violet-100"
              }`}
              key={`progress-${index}`}
            />
          ))}
        </div>
      </div>

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
        ].map((step, index) => {
          const isCurrent = activeStep === index;
          // "Beginne hier" nur auf dem aktuellen Schritt, solange noch nichts
          // erledigt ist, damit immer genau eine Karte als Einstieg gilt.
          const roleLabel = step.done
            ? "Erledigt"
            : isCurrent
              ? completion.some(Boolean)
                ? "Du bist hier"
                : "Beginne hier"
              : "Als Nächstes";
          // Im Grammatik-Labor (embedded) öffnet der Sprechschritt nicht mehr
          // eingebettet -- er führt ins Gesprächsstudio. Das Grammatik-Labor
          // ist für Regel sowie kontrollierte und schriftliche Übung; Aufnahme
          // und Shadowing gehören ins Studio, das bereits eine eigene
          // Aufnahme-Oberfläche und Themenauswahl hat. Die volle,
          // nicht eingebettete Automatik-Mission (außerhalb des Grammatik-
          // Labors) bleibt unverändert und behält Schritt 3 eingebettet, da
          // diese Seite die vollständige Tagesmission ist, keine
          // Grammatik-Nachschlageseite.
          const opensStudio = embedded && index === 2;
          const cardBody = (
            <Card
              className={
                step.done
                  ? "border-violet-500"
                  : isCurrent
                    ? "border-violet-600 ring-2 ring-violet-300"
                    : ""
              }
            >
              <span
                className={`ml-5 mt-3 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  step.done
                    ? "bg-violet-100 text-violet-800"
                    : isCurrent
                      ? "bg-violet-700 text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {opensStudio ? "Öffnet das Gesprächsstudio" : roleLabel}
              </span>
              <CardContent className="flex gap-3 pt-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-800">
                  {step.done ? <Check /> : <step.icon />}
                </span>
                <div>
                  <strong>{step.title}</strong>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {opensStudio
                      ? // Absichtlich nicht "für diese Einheit" -- das Studio
                        // sucht anhand von Niveau und Thema in seinem eigenen,
                        // allgemeinen Gesprächskatalog und speichert keinen
                        // Nachweis gegen diese konkrete Grammatik-Einheit. Der
                        // Shadowing-und-Übertragen-Schritt dieser Einheit wird
                        // weiterhin über die vollständige Automatik-Mission
                        // abgeschlossen; diese Karte verhindert nur, dass die
                        // Aufnahme-Oberfläche auch im Grammatik-Labor läuft.
                        `Aufnahme und Shadowing für ${selectedLevel} laufen im Gesprächsstudio.`
                      : step.detail}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
          if (opensStudio) {
            return (
              <Link
                className="text-left"
                href={`/studio?from=grammatik&level=${encodeURIComponent(selectedLevel)}&grammar=${encodeURIComponent(TOPIC)}`}
                key={step.title}
              >
                {cardBody}
              </Link>
            );
          }
          return (
            <button
              aria-pressed={isCurrent}
              className="text-left"
              key={step.title}
              onClick={() => setActiveStep(index)}
              type="button"
            >
              {cardBody}
            </button>
          );
        })}
      </div>

      {!embedded ? (
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
            {/* Die Regel stand bisher auch hier in der Beschreibung, also
                außerhalb der ausblendbaren Felder -- sie muss mit ausgeblendet
                werden, sonst bleibt die Antwort trotzdem lesbar. */}
            {lessonOpen ? (
              <CardDescription>{grammar.rule}</CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Lernphase: Lektion offen, mit klarem Hinweis, dass erst das
                Ausblenden aus den Aufgaben unten echten Abruf macht.
                Abrufphase: eine schmale Leiste ersetzt sie, mit einem ehrlichen
                Rückweg, der erfasst statt stillschweigend verziehen wird. */}
            {lessonOpen ? (
              <div className="space-y-3">
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
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-violet-200 bg-white p-3">
                  <Button onClick={() => setLessonOpen(false)} type="button">
                    Regel ausblenden und aus dem Gedächtnis antworten
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Jede Antwort unten steht in diesen Feldern. Abschreiben ist
                    Lernen, kein Abruf -- nur eine Runde mit ausgeblendeter
                    Regel zählt als Nachweis.
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-3">
                <span className="text-sm font-bold text-violet-900">
                  Regel ausgeblendet — antworte aus dem Gedächtnis.
                </span>
                <Button
                  onClick={() => {
                    setLessonOpen(true);
                    setPeeked(true);
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Regel wieder anzeigen
                </Button>
              </div>
            )}
            {checkedAnswers.length === 0 && roundExercises.length > 0 ? (
              <>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Aufgabe {currentExerciseIndex + 1} von {roundExercises.length}
                </p>
                {(() => {
                  const item = roundExercises[currentExerciseIndex];
                  if (!item) return null;
                  return (
                    <label className="block space-y-2" key={item.prompt}>
                      <span className="text-sm font-bold">{item.prompt}</span>
                      <input
                        className="min-h-11 w-full rounded-xl border bg-background px-3"
                        onChange={(event) => {
                          const value = event.target.value;
                          setAnswers((rows) => {
                            const next = [...rows];
                            next[currentExerciseIndex] = value;
                            return next;
                          });
                        }}
                        value={answers[currentExerciseIndex] ?? ""}
                      />
                    </label>
                  );
                })()}
                <div className="flex flex-wrap items-center gap-3">
                  {currentExerciseIndex > 0 ? (
                    <Button
                      onClick={() =>
                        setCurrentExerciseIndex((index) =>
                          Math.max(0, index - 1),
                        )
                      }
                      type="button"
                      variant="outline"
                    >
                      Zurück
                    </Button>
                  ) : null}
                  {currentExerciseIndex < roundExercises.length - 1 ? (
                    <Button
                      onClick={() =>
                        setCurrentExerciseIndex((index) =>
                          Math.min(roundExercises.length - 1, index + 1),
                        )
                      }
                      type="button"
                    >
                      Weiter
                    </Button>
                  ) : (
                    <Button onClick={checkPractice} type="button">
                      Antworten prüfen
                    </Button>
                  )}
                </div>
              </>
            ) : null}
            {checkedAnswers.length > 0
              ? roundExercises.map((item, index) => (
                  <div className="block space-y-1" key={item.prompt}>
                    <span className="text-sm font-bold">{item.prompt}</span>
                    <span
                      className={
                        checkedAnswers[index]
                          ? "block text-sm font-bold text-violet-800"
                          : "block text-sm font-bold text-red-800"
                      }
                    >
                      {checkedAnswers[index]
                        ? "Richtig"
                        : `Modell: ${item.expected}`}
                    </span>
                  </div>
                ))
              : null}
            <div className="flex flex-wrap items-center gap-3">
              {checkedAnswers.length &&
              exercises.length > roundExercises.length ? (
                <Button onClick={practiceAgain} variant="outline">
                  <RotateCcw /> Neue Runde üben
                </Button>
              ) : null}
              {practiceRounds > 0 ? (
                <Badge>{practiceRounds + 1} Runden in dieser Sitzung</Badge>
              ) : null}
              {/* Die Nachweis-Folge VOR der Abgabe benennen, nicht erst in der
                  Rückmeldung danach. */}
              <Badge variant={lessonOpen || peeked ? "outline" : "default"}>
                {lessonOpen || peeked
                  ? "Offenes Buch — zählt als Lernen"
                  : "Aus dem Gedächtnis — zählt als Nachweis"}
              </Badge>
              <Badge variant="secondary">{STAGE_LABEL[practiceStage]}</Badge>
              {secondsRemaining !== null ? (
                <Badge
                  variant={secondsRemaining <= 5 ? "outline" : "secondary"}
                >
                  <Clock className="size-3" /> {secondsRemaining}s übrig
                </Badge>
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

      {/* Zusätzlich auf !embedded gesperrt. Das Grammatik-Labor hat keinen
          UI-Pfad mehr, der activeStep auf 2 setzt (siehe die Initialisierung
          oben und den Link-ins-Studio-Zweig der Schritt-3-Karte) -- das hier
          ist zusätzliche Absicherung, falls ein künftiger Codepfad diesen
          Zustand doch wieder erreichbar macht: die Aufnahme-Oberfläche darf
          im Grammatik-Labor trotzdem nie erscheinen. */}
      {!embedded && (focusedStep ?? activeStep) === 2 ? (
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
                onClick={() => void speak(modelText, `grammar-${TOPIC}`)}
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
            {audioFluencyResult ? (
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm sm:grid-cols-4">
                <div>
                  <strong className="block text-lg">
                    {audioFluencyResult.activeSpeechSeconds.toFixed(1)}s
                  </strong>
                  aktive Sprechzeit
                </div>
                <div>
                  <strong className="block text-lg">
                    {audioFluencyResult.pauseCount}
                  </strong>
                  Pause(n)
                </div>
                <div>
                  <strong className="block text-lg">
                    {audioFluencyResult.medianPitchHz
                      ? `${Math.round(audioFluencyResult.medianPitchHz)} Hz`
                      : "—"}
                  </strong>
                  typische Tonhöhe
                </div>
                <div>
                  <strong className="block text-lg">
                    {audioFluencyResult.pitchVarietySemitones !== null
                      ? audioFluencyResult.pitchVarietySemitones < 1.5
                        ? "Monoton"
                        : audioFluencyResult.pitchVarietySemitones < 3.5
                          ? "Etwas Variation"
                          : "Abwechslungsreich"
                      : "—"}
                  </strong>
                  Intonation
                </div>
                <p className="col-span-2 text-xs text-muted-foreground sm:col-span-4">
                  Die Tonhöhe wird direkt aus der Aufnahme geschätzt (kein
                  externer Dienst) -- ein grobes Intonationssignal, keine
                  phonembasierte Aussprachebewertung.
                </p>
              </div>
            ) : null}

            <div className="mt-2 space-y-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
              <div>
                <p className="text-sm font-bold text-violet-950">
                  Übertragung: eine neue Situation
                </p>
                <p className="text-sm text-muted-foreground">{situation}</p>
              </div>
              <Textarea
                aria-label="Übertragungsantwort"
                onChange={(event) => {
                  if (transferStartRef.current === null) {
                    transferStartRef.current = Date.now();
                  }
                  setTransferAttempt(event.target.value);
                }}
                placeholder="Reagiere auf die Situation oben und verwende dabei die heutige Struktur."
                value={transferAttempt}
              />
              <Button
                disabled={!transferAttempt.trim() || transferChecking}
                onClick={() => void saveTransfer()}
              >
                {transferChecking ? "Wird geprüft …" : "Übertragung prüfen"}
              </Button>
              {transferAnalysis ? (
                <Feedback analysis={transferAnalysis} />
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Einspaltig, seit „Mein Grammatik-Musterplan“ neben dieser Karte
          entfernt wurde. Diese Karte behauptete „Aus den heutigen Schreib- und
          Sprechfehlern erzeugt“, zeigte aber drei fest einprogrammierte
          Listenpunkte, die für jede lernende Person, jede Einheit und jede
          Fehlerhistorie identisch blieben -- sie warb mit Personalisierung,
          die es nie gab. Ihr „Neue Wiederholung“-Knopf ist nicht verloren:
          practiceAgain() neben „Antworten prüfen“ startet eine echte neue
          Runde, statt nur Anzeigen zurückzusetzen. */}
      {focusedStep === undefined ? (
        <div className="grid gap-4">
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
        </div>
      ) : null}
    </div>
  );
}
