"use client";

import { useEffect, useRef, useState } from "react";
import { grammarUnits } from "@grammar/content";
import { detectAnswerLanguage } from "@grammar/domain";
import {
  appendLearningEvidenceBundleToStorage,
  buildAttemptVerticalSlice,
  normalizeDailySessionMinutes,
  type CefrLevel,
} from "@automaticity/learning-core";
import { saveAudio } from "@/features/audio/audio-repository";
import {
  analyzeWeilClause,
  practiceAnswerMatches,
  type AutomatikAnalysis,
} from "@/features/automaticity/automaticity-analysis";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";
import { requestEvaluation } from "@/lib/evaluation-client";
import { API_BASE_URL } from "@/lib/api-config";
import {
  MasteryCard,
  MissionHero,
  MissionProgressCard,
  PatternPlanCard,
  PracticeStepCard,
  QualityGateCard,
  SpeakingStepCard,
  StepCards,
  WritingStepCard,
} from "./automaticity-panels";
import {
  lessonKey,
  requiredSpeakingSeconds,
  shadowingStages,
  speak,
} from "./lesson-content";
import { speakingEvidenceBlock } from "./speaking-evidence";
import { useLessonRecorder } from "./use-lesson-recorder";

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
  const exercises = grammar.exercises.slice(0, 3).map((exercise) => ({
    prompt: exercise[0] ?? "Bearbeite die Aufgabe.",
    expected: exercise[1] ?? grammar.testAnswer,
  }));
  const modelText = grammar.examples.join(" ");
  const today = new Date().toISOString().slice(0, 10);
  const plan = state.dailyPlans[today] ?? { completed: [], answers: {} };
  const [answers, setAnswers] = useState(["", "", ""]);
  const [checkedAnswers, setCheckedAnswers] = useState<readonly boolean[]>([]);
  const [journal, setJournal] = useState("");
  const [transcript, setTranscript] = useState("");
  const [journalAnalysis, setJournalAnalysis] =
    useState<AutomatikAnalysis | null>(null);
  const [speechAnalysis, setSpeechAnalysis] =
    useState<AutomatikAnalysis | null>(null);
  const [message, setMessage] = useState(
    `Bereit für deinen ${missionMinutes}-Minuten-Nachweis.`,
  );
  const [activeStep, setActiveStep] = useState<number>(
    focusedStep ??
      [0, 1, 2].find((step) => !plan.completed.includes(step)) ??
      0,
  );
  const recorder = useLessonRecorder({
    setTranscript,
    onStart: () => setSpeechAnalysis(null),
  });
  const restoredRef = useRef(false);

  useEffect(() => {
    if (!hydrated || restoredRef.current) return;
    restoredRef.current = true;
    setJournal(plan.answers[`${KEY}:journal`] ?? "");
    setTranscript(plan.answers[`${KEY}:transcript`] ?? "");
  }, [hydrated, plan.answers]);

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
  const requiredSeconds = requiredSpeakingSeconds(selectedLevel);

  async function analyzeLessonOutput(
    text: string,
    minimumSentences: number,
  ): Promise<AutomatikAnalysis | null> {
    if (detectAnswerLanguage(text) !== "de") {
      setMessage(
        "Die Sprache ist für diese Prüfung nicht eindeutig Deutsch. Die Antwort wurde noch nicht bewertet.",
      );
      return null;
    }
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
    if (result.accuracyScore === null) {
      setMessage(
        result.issues[0]?.message ?? "Die Antwort wurde noch nicht bewertet.",
      );
      return null;
    }
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
      verified: result.verified,
      online: result.online,
      corrected: result.corrected,
      sentenceCount,
      wordCount,
      targetUses: result.targetHit ? 1 : 0,
      score: result.accuracyScore,
      targetHit:
        result.practiceReady &&
        result.targetHit &&
        sentenceCount >= minimumSentences,
      issues,
    };
  }

  function checkPractice() {
    const results = answers.map((answer, index) =>
      practiceAnswerMatches(answer, exercises[index]?.expected ?? ""),
    );
    setCheckedAnswers(results);
    const score = Math.round(
      (results.filter(Boolean).length / exercises.length) * 100,
    );
    recordAttempt({
      topic: TOPIC,
      mode: "recognition",
      inputText: answers.join("\n"),
      correctedText: exercises.map((item) => item.expected).join("\n"),
      targetHit: results.every(Boolean),
      verified: false,
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
    const occurredAt = new Date().toISOString();
    setJournalAnalysis(analysis);
    setDailyAnswer(`${KEY}:journal`, journal);
    if (!analysis) return;
    recordAttempt({
      topic: TOPIC,
      mode: "writing",
      inputText: journal,
      correctedText: analysis.corrected,
      targetHit: analysis.targetHit,
      verified: analysis.verified,
      accuracyScore: analysis.score,
    });
    appendLearningEvidenceBundleToStorage(
      window.localStorage,
      buildAttemptVerticalSlice({
        attemptId: crypto.randomUUID(),
        occurredAt,
        language: "de",
        cefrLevel: grammar.level as CefrLevel,
        contentVersion: `20.8.23-${grammar.level.toLowerCase()}-runtime`,
        topic: TOPIC,
        targetForm: grammar.rule,
        prompt: `Schreibe vier eigene Sätze mit ${TOPIC}.`,
        mode: "writing",
        inputText: journal,
        correctedText: analysis.corrected,
        targetHit: analysis.targetHit,
        accuracyScore: analysis.score,
        attemptVerified: analysis.verified,
        assessedBy: analysis.online ? "online" : "offline",
        sessionMinutes: normalizeDailySessionMinutes(missionMinutes),
        sourceId: "deutsch-authored-grammar-curriculum-v20",
      }),
    );
    saveDetectedErrors(analysis, journal);
    if (analysis.targetHit) setDailyAnswer(`${KEY}:writing`, "done");
    markActivity(1);
    setMessage(
      analysis.targetHit
        ? "Tagebuch gespeichert. Du hast die Zielstruktur selbst produziert."
        : `Entwurf gespeichert. Nutze die Hinweise und verwende „${TOPIC}“ in vollständigen eigenen Sätzen.`,
    );
  }

  async function startRecording() {
    const error = await recorder.startRecording();
    setMessage(
      error
        ? `${error} Du kannst das Transkript weiterhin eintippen.`
        : `Aufnahme läuft. Sprich frei und verwende ${TOPIC}.`,
    );
  }

  async function stopRecording() {
    if (await recorder.stopRecording()) {
      setMessage(
        "Aufnahme beendet. Prüfe das Transkript und speichere den Nachweis.",
      );
    }
  }

  async function saveSpeaking() {
    if (recorder.recording) await stopRecording();
    const seconds = recorder.seconds;
    const audio = recorder.audioBlob();

    const evidenceBlock = speakingEvidenceBlock({
      audioSize: audio?.size ?? 0,
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
    if (!analysis) return;
    const fluencyScore = Math.min(
      100,
      Math.round((analysis.wordCount / Math.max(1, seconds) / 2) * 100),
    );
    const speakingReady = analysis.issues.length === 0 && analysis.targetHit;

    recordAttempt({
      topic: TOPIC,
      mode: "speaking",
      inputText: transcript,
      correctedText: transcript,
      targetHit: speakingReady,
      verified: false,
      accuracyScore: analysis.score,
      fluencyScore,
    });
    saveDetectedErrors(analysis, transcript);

    if (state.settings.saveAudio && audio) {
      await saveAudio({
        id: `automatik-audio-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        date: new Date().toISOString(),
        topic: `${TOPIC} im Alltag`,
        transcript,
        correctedTranscript: transcript,
        targetGrammar: TOPIC,
        blob: audio,
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

  const step = focusedStep ?? activeStep;

  return (
    <div className="space-y-5">
      {!focusedStep && focusedStep !== 0 ? (
        <MissionHero embedded={embedded} missionMinutes={missionMinutes} />
      ) : null}

      {focusedStep === undefined ? (
        <>
          <MissionProgressCard
            topic={TOPIC}
            level={selectedLevel}
            grammar={grammar}
            progress={progress}
            message={message}
          />
          <StepCards
            completion={completion}
            activeStep={activeStep}
            onSelect={setActiveStep}
          />
          <QualityGateCard />
        </>
      ) : null}

      {step === 0 ? (
        <PracticeStepCard
          grammar={grammar}
          exercises={exercises}
          answers={answers}
          checkedAnswers={checkedAnswers}
          onAnswer={(index, value) =>
            setAnswers((rows) =>
              rows.map((row, rowIndex) => (rowIndex === index ? value : row)),
            )
          }
          onCheck={checkPractice}
        />
      ) : null}

      {step === 1 ? (
        <WritingStepCard
          topic={TOPIC}
          grammar={grammar}
          value={journal}
          analysis={journalAnalysis}
          onChange={setJournal}
          onSave={() => void saveWriting()}
        />
      ) : null}

      {step === 2 ? (
        <SpeakingStepCard
          modelText={modelText}
          shadowing={shadowing}
          recording={recorder.recording}
          seconds={recorder.seconds}
          requiredSeconds={requiredSeconds}
          audioUrl={recorder.audioUrl}
          canSave={recorder.hasAudioBlob && !recorder.recording}
          transcript={transcript}
          analysis={speechAnalysis}
          onPlayModel={() => speak(modelText)}
          onToggleStage={(index) =>
            setDailyAnswer(
              `${KEY}:shadow:${index}`,
              shadowing[index] ? "" : "done",
            )
          }
          onRecord={() => void startRecording()}
          onStop={() => void stopRecording()}
          onTranscript={setTranscript}
          onSave={() => void saveSpeaking()}
        />
      ) : null}

      {focusedStep === undefined ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <MasteryCard
            recognition={
              checkedAnswers.length
                ? Math.round((checkedAnswers.filter(Boolean).length / 3) * 100)
                : (verifiedMastery?.scores.recognition ?? 0)
            }
            writing={
              journalAnalysis?.score ?? verifiedMastery?.scores.writing ?? 0
            }
            speaking={
              speechAnalysis?.score ?? verifiedMastery?.scores.speaking ?? 0
            }
            previousThreshold={verifiedMastery?.scores.automaticity ?? 0}
          />
          <PatternPlanCard
            topic={TOPIC}
            issueCount={
              (journalAnalysis?.issues.length ?? 0) +
              (speechAnalysis?.issues.length ?? 0)
            }
            onReset={() => {
              setCheckedAnswers([]);
              setJournalAnalysis(null);
              setSpeechAnalysis(null);
              setMessage(
                "Neue Wiederholung gestartet. Gespeicherte Nachweise bleiben erhalten.",
              );
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
