"use client";
import { SpeechPracticePanel } from "./speech-practice-panel";
import { LearningNavigation } from "@/components/learning-navigation";
import { Disclosure } from "@/components/ui/disclosure";
import { AutomaticityEvidenceSummary } from "@/features/components/automaticity-evidence-summary";
import { useAppStore } from "@/features/store/app-store";
import { playTeacherAudioByContextKey } from "@/lib/teacher-content";
import { useEffect, useMemo, useState } from "react";
import {
  conversationTopics,
  copy,
  spokenChunksUsed,
  type StudioLanguage,
} from "./conversation-data";
import {
  CoachCard,
  DailyCompleteDialog,
  DailyContextBar,
  IntegratedContextBar,
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
  type IntegratedContext,
  type PracticeMode,
  readStudioEntry,
  returnToPriorContext,
  unique,
} from "./studio-helpers";
import { type ModeCard, TopicOptions } from "./studio-topic-options";
import { useStudioRecorder } from "./use-studio-recorder";

const language: StudioLanguage = "en";
const path = "Complete English";
const stepLabels = [
  "Listen",
  "Answer",
  "Replay",
  "Review",
  "Correct",
  "Improve",
  "Save",
] as const;
const modeCards: readonly ModeCard[] = [
  ["guided", "☵", "Guided conversation", "Practice with a prompt and real correction."],
  ["challenge", "◴", "60-second challenge", "Build fluency under time pressure."],
  [
    "pronunciation",
    "▥",
    "Pronunciation practice",
    "Record and replay carefully; no invented pronunciation score.",
  ],
];
const dailySessionKey = "english-automaticity:daily-session:v1";

export default function Home() {
  const { state, mutate } = useAppStore();
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
  const [dailyReturn, setDailyReturn] = useState("/daily");
  const [dailyComplete, setDailyComplete] = useState(false);
  const [integratedContext, setIntegratedContext] =
    useState<IntegratedContext | null>(null);

  useEffect(() => {
    const entry = readStudioEntry(window.location.search);
    if (!entry) return;
    if (entry.kind === "integrated-skills") {
      setLevel(entry.level);
      if (entry.topicId) setTopicId(entry.topicId);
      setIntegratedContext(entry.context);
      return;
    }
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
  const categories = [allLabel, ...unique(bySkill.map((topic) => topic.category))];
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
    storeAudio: state.settings.saveAudio,
    onlineConsent: state.settings.onlineFeedback,
    variant: state.settings.englishVariant,
    onRecordingStarted: () => setActive(1),
    onRecorded: () => setActive(2),
    onEvaluated: () => setActive(3),
    onSaved: finishDailyActivity,
  });

  const matchedSpokenChunks = useMemo(
    () =>
      spokenChunksUsed(
        `${recorder.transcript} ${recorder.interimTranscript}`.trim(),
        selected.spokenChunks,
      ),
    [recorder.interimTranscript, selected.spokenChunks, recorder.transcript],
  );
  const matchedChunkTexts = useMemo(
    () => new Set(matchedSpokenChunks.map((chunk) => chunk.text)),
    [matchedSpokenChunks],
  );

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
        "No human recording is attached yet. Ask the teacher to add one in Teacher Studio.",
      );
  }

  const chooseTopic = (update: () => void) => {
    update();
    recorder.resetSession();
  };

  return (
    <div className="conversation-page conversation-standalone">
      <aside className="sidebar">
        <a className="studio-brand" href="/">
          English Automaticity
        </a>
        <LearningNavigation language="en" current="/studio" />
      </aside>

      <main className="studio-main">
        <details className="studio-mobile-navigation">
          <summary>Navigation</summary>
          <LearningNavigation language="en" current="/studio" />
        </details>

        <header>
          <div>
            <h1>{text.title}</h1>
            <p>{text.subtitle}</p>
          </div>
          <div className="header-actions">
            <span>
              ● <b>English</b>
            </span>
            <span>Local-first</span>
            <div className="profile">E</div>
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
        {integratedContext !== null && (
          <IntegratedContextBar
            context={integratedContext}
            onReturn={() => returnToPriorContext("/integrated-skills")}
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
          onTopic={(value) => chooseTopic(() => setTopicId(value))}
          modeCards={modeCards}
          practiceMode={practiceMode}
          onMode={(mode) => chooseTopic(() => setPracticeMode(mode))}
        />

        <div className="workspace">
          <section className="studio">
            <StepPicker stepLabels={stepLabels} active={active} onSelect={setActive} />

            <CoachCard
              language={language}
              selected={selected}
              matchedChunkTexts={matchedChunkTexts}
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
                // Manual text is the no-cost recovery path when browser
                // microphone or speech recognition is unavailable.
                setActive(1);
                recorder.transcriptRef.current?.focus();
              }}
              onReplay={() => void recorder.audioRef.current?.play()}
              onRecord={() => void recorder.startRecording()}
              onPauseOrResume={recorder.pauseOrResume}
              onStop={recorder.finishRecording}
              onEvaluate={() => void recorder.evaluateTranscript()}
              consentNeeded={recorder.consentNeeded}
              onAllowOnline={() => {
                mutate((draft) => {
                  draft.settings.onlineFeedback = true;
                });
                void recorder.evaluateTranscript({ consented: true });
              }}
              onTranscriptChange={recorder.editTranscript}
            />

            <SpeechPracticePanel transcript={recorder.transcript} evidence={recorder.recognitionEvidence} language={language} onSpeak={value => void speak(value)} />

            {active === 0 && (
              <ListenPanel
                language={language}
                stepLabel={stepLabels[0]}
                task={selected.task}
                onPlay={() => void speak(selected.task)}
                onReady={() => setActive(1)}
              />
            )}
            {active === 2 && (
              <ReplayPanel
                language={language}
                audioUrl={recorder.audioUrl}
                onRecordAgain={() => void recorder.startRecording()}
                onReview={() => setActive(3)}
              />
            )}
            {active === 3 && (
              <ReviewPanel
                language={language}
                stepLabel={stepLabels[3]}
                evaluation={recorder.evaluation}
                audioUrl={recorder.audioUrl}
                wordCount={recorder.wordCount}
                seconds={recorder.seconds}
                wordsPerMinute={recorder.wordsPerMinute}
                matchedChunks={matchedSpokenChunks.length}
                totalChunks={selected.spokenChunks.length}
                onTryAgain={() => setActive(1)}
                onCorrections={() => setActive(4)}
              />
            )}
            {active === 4 && (
              <CorrectPanel
                language={language}
                stepLabel={stepLabels[4]}
                evaluation={recorder.evaluation}
                providerUnavailable={text.providerUnavailable}
                onBack={() => setActive(3)}
                onImprove={() => setActive(5)}
              />
            )}
            {active === 5 && (
              <ImprovePanel
                language={language}
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
                language={language}
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
            language={language}
            seconds={recorder.seconds}
            wordsPerMinute={recorder.wordsPerMinute}
            wordCount={recorder.wordCount}
            transcript={recorder.transcript}
            evaluation={recorder.evaluation}
            pronunciation={text.pronunciation}
            matchedChunks={matchedSpokenChunks.length}
            totalChunks={selected.spokenChunks.length}
            attempts={recorder.attempts}
            selected={selected}
            showCorrections={showCorrections}
            onToggleCorrections={setShowCorrections}
          />
        </div>
        <Disclosure
          className="studio-saved-evidence"
          summary="Saved responses & learning evidence"
        >
          <AutomaticityEvidenceSummary />
        </Disclosure>
        <StudioFooter
          language={language}
          attempts={recorder.attempts}
          evaluation={recorder.evaluation}
          audioUrl={recorder.audioUrl}
          savedId={recorder.savedId}
          goal={selected.goal}
          active={active}
          onSave={() => setActive(6)}
          onContinue={() => setActive((current) => Math.min(current + 1, 6))}
        />
      </main>
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
