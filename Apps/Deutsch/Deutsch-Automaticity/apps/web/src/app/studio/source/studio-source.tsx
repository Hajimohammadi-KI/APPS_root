"use client";
import { useEffect, useMemo, useState } from "react";
import { normalizeDailySessionMinutes } from "@automaticity/learning-core";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";
import { playTeacherAudioByContextKey } from "@/lib/teacher-content";
import {
  conversationTopics,
  copy,
  type StudioLanguage,
} from "./conversation-data";
import {
  CoachCard,
  DailyCompleteDialog,
  DailyContextBar,
  RecordCard,
  StepPicker,
} from "./studio-cards";
import { SessionEvidence, StudioFooter } from "./studio-evidence";
import {
  CorrectPanel,
  ImprovePanel,
  ListenPanel,
  ReplayPanel,
  ReviewPanel,
  SavePanel,
} from "./studio-flow-panels";
import {
  type EvaluationResponse,
  type PracticeMode,
  readStudioEntry,
  returnToPriorContext,
  unique,
} from "./studio-helpers";
import { type ModeCard, TopicOptions } from "./studio-topic-options";
import { useStudioRecorder } from "./use-studio-recorder";

const language: StudioLanguage = "de";
const path = "Komplettes Deutsch";
const stepLabels = [
  "Hören",
  "Antwort",
  "Replay",
  "Prüfen",
  "Korrigieren",
  "Verbessern",
  "Speichern",
] as const;
const modeCards: readonly ModeCard[] = [
  ["guided", "☵", "Geführtes Gespräch", "Mit Aufgabe und Korrektur üben."],
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
];
const dailySessionKey = "deutsch-automaticity:daily-session:v1";

export default function Home() {
  const { state } = useLearnerState();
  const text = copy[language];
  const allLabel: string = text.all;
  const [level, setLevel] = useState<string>(allLabel);
  const [skill, setSkill] = useState<string>(allLabel);
  const [category, setCategory] = useState<string>(allLabel);
  const [topicId, setTopicId] = useState(conversationTopics[0]?.id ?? "");
  const [active, setActive] = useState(1);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("guided");
  const [showCorrections, setShowCorrections] = useState(true);
  const [dailyActivity, setDailyActivity] = useState<number | null>(null);
  const [dailyReturn, setDailyReturn] = useState("/heute");
  const [dailyComplete, setDailyComplete] = useState(false);

  useEffect(() => {
    const entry = readStudioEntry(window.location.search);
    if (!entry) return;
    setDailyActivity(entry.activity);
    setDailyReturn(entry.returnPath);
    if (entry.level) setLevel(entry.level);
    if (entry.topicId) setTopicId(entry.topicId);
  }, []);

  const allForPath = useMemo(
    () => conversationTopics.filter((topic) => topic.path === path),
    [],
  );
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
  const fallbackTopic = allForPath[0] ?? conversationTopics[0];
  if (!fallbackTopic) {
    throw new Error("Das Konversationsstudio benötigt mindestens ein Thema.");
  }
  const selected =
    filteredTopics.find((topic) => topic.id === topicId) ??
    filteredTopics[0] ??
    fallbackTopic;
  const maxSeconds = practiceMode === "challenge" ? 60 : 120;

  function finishDailyActivity(evaluation: EvaluationResponse) {
    if (dailyActivity === null) return;
    const current = JSON.parse(localStorage.getItem(dailySessionKey) || "{}");
    const completed = [
      ...new Set([...(current.completedActivities || []), dailyActivity]),
    ];
    const mistakes = evaluation.issues.length
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
      dailySessionKey,
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

  const recorder = useStudioRecorder({
    language,
    selected,
    maxSeconds,
    minWords: state.settings.minWords,
    sessionMinutes: normalizeDailySessionMinutes(
      state.settings.dailyStudyMinutes,
    ),
    onRecordingStarted: () => setActive(1),
    onRecorded: () => setActive(2),
    onEvaluated: () => setActive(3),
    onSaved: finishDailyActivity,
  });

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
      recorder.setMessage(
        "Noch keine menschliche Aufnahme vorhanden. Bitte im Lehrkraft-Studio hinzufügen.",
      );
  }

  const chooseTopic = (update: () => void) => {
    update();
    recorder.resetSession();
  };

  return (
    <div className="conversation-page">
      <div className="studio-main">
        <header>
          <div>
            <h1>{text.title}</h1>
            <p>{text.subtitle}</p>
          </div>
          <div className="header-actions">
            <span>
              ● <b>Deutsch</b>
            </span>
            <span>Lokal gespeichert</span>
            <div className="profile">D</div>
          </div>
        </header>

        {dailyActivity !== null && (
          <DailyContextBar
            activity={dailyActivity}
            onPrevious={() =>
              active > 0
                ? setActive((current) => current - 1)
                : returnToPriorContext(dailyReturn)
            }
            onReturn={() => returnToPriorContext(dailyReturn)}
          />
        )}

        <TopicOptions
          text={text}
          path={path}
          selected={selected}
          disabled={recorder.recordingState !== "idle"}
          levels={levels}
          skills={skills}
          categories={categories}
          topics={filteredTopics}
          level={level}
          skill={skill}
          category={category}
          allLabel={allLabel}
          onLevel={(value) =>
            chooseTopic(() => {
              setLevel(value);
              setSkill(allLabel);
              setCategory(allLabel);
              setTopicId("");
            })
          }
          onSkill={(value) =>
            chooseTopic(() => {
              setSkill(value);
              setCategory(allLabel);
              setTopicId("");
            })
          }
          onCategory={(value) =>
            chooseTopic(() => {
              setCategory(value);
              setTopicId("");
            })
          }
          onTopic={(value) => {
            chooseTopic(() => setTopicId(value));
            recorder.setMessage(
              "Thema geändert. Die vorige Antwort wurde verworfen; es wird keine alte Bewertung übernommen.",
            );
          }}
          modeCards={modeCards}
          practiceMode={practiceMode}
          onMode={(mode) => chooseTopic(() => setPracticeMode(mode))}
        />

        <div className="workspace">
          <section className="studio">
            <StepPicker
              stepLabels={stepLabels}
              active={active}
              onSelect={setActive}
            />

            <CoachCard
              selected={selected}
              onSpeak={(value) => void speak(value)}
            />

            <RecordCard
              text={text}
              recordingState={recorder.recordingState}
              audioUrl={recorder.audioUrl}
              seconds={recorder.seconds}
              maxSeconds={maxSeconds}
              message={recorder.message}
              voiceRecoveryAvailable={recorder.voiceRecoveryAvailable}
              transcript={recorder.transcript}
              interimTranscript={recorder.interimTranscript}
              evaluating={recorder.evaluating}
              audioRef={recorder.audioRef}
              transcriptRef={recorder.transcriptRef}
              onContinueTyping={() => {
                // Tippen bleibt der kostenlose Wiederherstellungsweg,
                // wenn Mikrofon oder Spracherkennung nicht verfügbar ist.
                setActive(1);
                recorder.transcriptRef.current?.focus();
              }}
              onReplay={() => void recorder.audioRef.current?.play()}
              onRecord={() => void recorder.startRecording()}
              onPauseOrResume={recorder.pauseOrResume}
              onStop={recorder.finishRecording}
              onEvaluate={() => void recorder.evaluateTranscript()}
              onTranscriptChange={recorder.editTranscript}
            />

            {active === 0 && (
              <ListenPanel
                stepLabel={stepLabels[0]}
                task={selected.task}
                onPlay={() => void speak(selected.task)}
                onReady={() => setActive(1)}
              />
            )}
            {active === 2 && (
              <ReplayPanel
                audioUrl={recorder.audioUrl}
                onRecordAgain={() => void recorder.startRecording()}
                onReview={() => setActive(3)}
              />
            )}
            {active === 3 && (
              <ReviewPanel
                stepLabel={stepLabels[3]}
                evaluation={recorder.evaluation}
                audioUrl={recorder.audioUrl}
                wordCount={recorder.wordCount}
                seconds={recorder.seconds}
                wordsPerMinute={recorder.wordsPerMinute}
                onTryAgain={() => setActive(1)}
                onCorrections={() => setActive(4)}
              />
            )}
            {active === 4 && (
              <CorrectPanel
                stepLabel={stepLabels[4]}
                evaluation={recorder.evaluation}
                providerUnavailable={text.providerUnavailable}
                onBack={() => setActive(3)}
                onImprove={() => setActive(5)}
              />
            )}
            {active === 5 && (
              <ImprovePanel
                stepLabel={stepLabels[5]}
                evaluation={recorder.evaluation}
                baseline={recorder.baseline}
                pronunciation={text.pronunciation}
                onHearModel={() => void speak(recorder.evaluation?.corrected)}
                onRecordImproved={() => void recorder.practiceImprovedVersion()}
              />
            )}
            {active === 6 && (
              <SavePanel
                stepLabel={stepLabels[6]}
                savedId={recorder.savedId}
                savedText={text.saved}
                wordCount={recorder.wordCount}
                seconds={recorder.seconds}
                evaluation={recorder.evaluation}
                canSave={
                  !recorder.savedId &&
                  Boolean(recorder.evaluation) &&
                  recorder.hasAudioBlob
                }
                onBack={() => setActive(5)}
                onSave={() => void recorder.saveSession()}
              />
            )}
          </section>

          <SessionEvidence
            seconds={recorder.seconds}
            wordsPerMinute={recorder.wordsPerMinute}
            wordCount={recorder.wordCount}
            transcript={recorder.transcript}
            evaluation={recorder.evaluation}
            pronunciation={text.pronunciation}
            attempts={recorder.attempts}
            selected={selected}
            showCorrections={showCorrections}
            onToggleCorrections={setShowCorrections}
          />
        </div>
        <StudioFooter
          attempts={recorder.attempts}
          evaluation={recorder.evaluation}
          audioUrl={recorder.audioUrl}
          savedId={recorder.savedId}
          goal={selected.goal}
          active={active}
          onSave={() => setActive(6)}
          onContinue={() => setActive((current) => Math.min(current + 1, 6))}
        />
      </div>
      {dailyComplete && (
        <DailyCompleteDialog
          onReturn={() => returnToPriorContext(dailyReturn)}
          onPractiseAgain={() => {
            setDailyComplete(false);
            recorder.resetSession();
            setActive(0);
          }}
          onReviewMistakes={() => {
            setDailyComplete(false);
            setActive(4);
          }}
        />
      )}
    </div>
  );
}
