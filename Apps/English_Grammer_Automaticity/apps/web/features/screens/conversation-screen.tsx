"use client";

import * as React from "react";
import {
  Check,
  CirclePause,
  CircleStop,
  Mic,
  Play,
  Save,
  Square,
  Volume2,
} from "lucide-react";
import {
  conversationTopics,
  grammarUnits,
  PATH_GROUPS,
} from "@grammar/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EvaluationResult } from "@/features/components/evaluation-result";
import { ProfileAvatar } from "@/features/components/profile-avatar";
import { recalculateMastery, useAppStore } from "@/features/store/app-store";
import { putAudio } from "@/lib/audio-db";
import {
  classifyError,
  evaluateResponse,
  type Evaluation,
} from "@/lib/assessment";
import { speak } from "@/lib/speech";
import {
  formatSeconds,
  makeId,
  requiredFirst,
  todayKey,
  wordCount,
} from "@/lib/utils";

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition() {
  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

const followUps = [
  "Explain one point in more detail and give a concrete example.",
  "Now contrast your answer with a different situation.",
  "Reformulate the main idea using today’s target grammar again.",
];
const defaultPath = Object.keys(PATH_GROUPS)[0] ?? "Complete English Path";
const defaultTopic = requiredFirst(conversationTopics, "Conversation catalog");
const defaultGrammar = requiredFirst(grammarUnits, "Grammar catalog");

export function ConversationScreen({
  navigate,
}: {
  navigate: (screen: string) => void;
}) {
  const { state, mutate, recordAttempt } = useAppStore();
  const [path, setPath] = React.useState(defaultPath);
  const [level, setLevel] = React.useState("All");
  const [skill, setSkill] = React.useState("All");
  const [category, setCategory] = React.useState("All");
  const [topicIndex, setTopicIndex] = React.useState(0);
  const [transcript, setTranscript] = React.useState("");
  const [chat, setChat] = React.useState<
    Array<{ role: "coach" | "user"; text: string }>
  >([]);
  const [status, setStatus] = React.useState(
     "Choose a topic and start the session.",
  );
  const [evaluation, setEvaluation] = React.useState<Evaluation | null>(null);
  const [turns, setTurns] = React.useState(0);
  const [seconds, setSeconds] = React.useState(0);
  const [uses, setUses] = React.useState(0);
  const [words, setWords] = React.useState(0);
  const [recordingState, setRecordingState] = React.useState<
    "idle" | "recording" | "paused"
  >("idle");
  const [audioUrl, setAudioUrl] = React.useState("");
  const [checking, setChecking] = React.useState(false);
  const [sessionActive, setSessionActive] = React.useState(false);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const audioBlobRef = React.useRef<Blob | null>(null);
  const startedAtRef = React.useRef(0);
  const sessionStartedRef = React.useRef(0);

  const tracks = PATH_GROUPS[path] ?? [path];
  const byTrack = conversationTopics.filter((topic) =>
    tracks.includes(topic.track),
  );
  const levels = ["All", ...new Set(byTrack.map((topic) => topic.level))];
  const byLevel = byTrack.filter(
    (topic) => level === "All" || topic.level === level,
  );
  const skills = ["All", ...new Set(byLevel.map((topic) => topic.skill))];
  const bySkill = byLevel.filter(
    (topic) => skill === "All" || topic.skill === skill,
  );
  const categories = [
    "All",
    ...new Set(bySkill.map((topic) => topic.category)),
  ];
  const filteredTopics = bySkill.filter(
    (topic) => category === "All" || topic.category === category,
  );
  const selected =
    filteredTopics[topicIndex] ?? filteredTopics[0] ?? defaultTopic;
  const grammar =
    grammarUnits.find((unit) => unit.title === state.todayGrammar?.title) ??
    grammarUnits.find((unit) => unit.level === selected.targetGrammar) ??
    defaultGrammar;

  React.useEffect(() => {
    setTopicIndex(0);
  }, [path, level, skill, category]);

  React.useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    },
    [audioUrl],
  );

  const startSession = () => {
    setAudioUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return "";
    });
    audioBlobRef.current = null;
    setChat([{ role: "coach", text: selected.task }]);
    setTranscript("");
    setEvaluation(null);
    setTurns(0);
    setSeconds(0);
    setUses(0);
    setWords(0);
    sessionStartedRef.current = Date.now();
    setSessionActive(true);
    setStatus(
      "Session active. Form a complete English answer from memory.",
    );
    speak(selected.task);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      audioBlobRef.current = null;
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
        setAudioUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return URL.createObjectURL(blob);
        });
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      startedAtRef.current = Date.now();
      setRecordingState("recording");
      setStatus(
        "Recording in progress. Speak naturally and use the target grammar.",
      );

      const SpeechRecognition = getSpeechRecognition();
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;
        let finalText = transcript ? `${transcript} ` : "";
        recognition.onresult = (event) => {
          let interim = "";
          for (
            let index = event.resultIndex;
            index < event.results.length;
            index++
          ) {
            const result = event.results[index];
            const alternative = result?.[0];
            if (!result || !alternative) continue;
            if (result.isFinal) finalText += `${alternative.transcript} `;
            else interim += alternative.transcript;
          }
          setTranscript(`${finalText}${interim}`.trim());
        };
        recognition.start();
        recognitionRef.current = recognition;
      } else {
        setStatus(
          "Speech recognition is unavailable; audio recording will continue.",
        );
      }
    } catch (error) {
      setStatus(
        `${
          error instanceof Error
            ? error.message
            : "The microphone is unavailable."
          } You can type the English answer instead.`,
      );
    }
  };

  const stopRecording = async () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    setSeconds(
      (value) =>
        value +
        Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
    );
    await new Promise<void>((resolve) => {
      recorder.addEventListener("stop", () => resolve(), { once: true });
      recorder.stop();
    });
    try {
      recognitionRef.current?.stop();
    } catch {
      // The browser may already have ended recognition.
    }
    setRecordingState("idle");
    setStatus(
      "Recording stopped. Evaluate your answer once it is complete.",
    );
  };

  const togglePause = () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorder.state === "recording") {
      recorder.pause();
      recognitionRef.current?.stop();
      setRecordingState("paused");
      setStatus("Recording paused.");
    } else if (recorder.state === "paused") {
      recorder.resume();
      try {
        recognitionRef.current?.start();
      } catch {
        // Some engines create a new recognition session only.
      }
      setRecordingState("recording");
      setStatus("Recording resumed.");
    }
  };

  const endSession = async () => {
    if (recordingState !== "idle") await stopRecording();
    try {
      recognitionRef.current?.stop();
    } catch {
      // Recognition may already have ended.
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    recognitionRef.current = null;
    setSessionActive(false);
    setStatus(
      "Session ended. Transcript and saved evidence remain available.",
    );
  };

  const openSavedCorrection = () => {
    if (!evaluation) return;
    mutate((draft) => {
      const related = draft.errors.filter(
        (error) =>
          error.grammarTitle === grammar.title &&
          (error.originalText === evaluation.original ||
            error.correctedText === evaluation.corrected),
      );
      if (related.length > 0) {
        related.forEach((error) => {
          error.repairStatus = "scheduled";
          error.nextRepairAt = Math.min(error.nextRepairAt, Date.now());
        });
        return;
      }
      if (!evaluation.changed && evaluation.matches.length === 0) return;
      const signature = `saved:${grammar.title}:${evaluation.original}:${evaluation.corrected}`;
      draft.errors.push({
        id: signature,
        grammarTitle: grammar.title,
        topic: selected.topic,
        errorClass: "other",
        originalText: evaluation.original,
        correctedText: evaluation.corrected,
        explanation:
          evaluation.matches[0]?.message ??
          "Correction was saved manually from the conversation studio.",
        occurrenceCount: 1,
        repairStatus: "scheduled",
        nextRepairAt: Date.now(),
        lastSeenAt: new Date().toISOString(),
      });
      recalculateMastery(draft, grammar.title);
    });
    navigate("errors");
  };

  const assess = async () => {
    const text = transcript.trim();
    if (!text) {
      setStatus("Speak or type a complete answer first.");
      return;
    }
    if (recordingState !== "idle") await stopRecording();
    setChecking(true);
    setStatus("Running full online evaluation...");
    const result = await evaluateResponse(
      text,
      {
        grammar,
        minWords: state.settings.minWords,
        requiredTargetUses: 1,
        taskPrompt: selected.task,
      },
      state.settings,
    );
    setChecking(false);
    setEvaluation(result);
    const latencyMs = sessionStartedRef.current
      ? Date.now() - sessionStartedRef.current
      : null;
    recordAttempt({
      grammarTitle: grammar.title,
      mode: "speaking",
      inputText: text,
      correctedText: result.corrected,
      targetHit: result.targetUses >= result.required,
      accuracyScore: result.accuracyScore,
      fluencyScore:
        seconds > 0
          ? Math.min(100, Math.round((wordCount(text) / seconds) * 60))
          : 0,
      latencyMs,
      passed: result.masteryEligible && result.pass,
      verified: result.masteryEligible,
    });

    mutate((draft) => {
      result.matches.forEach((match) => {
        const errorClass = classifyError(match);
        const signature = `${grammar.title}:${errorClass}:${
          match.context?.text ?? text
        }`;
        const existing = draft.errors.find((error) => error.id === signature);
        if (existing) {
          existing.occurrenceCount += 1;
          existing.lastSeenAt = new Date().toISOString();
          existing.repairStatus = "scheduled";
          existing.nextRepairAt = Date.now() + 86_400_000;
        } else {
          draft.errors.push({
            id: signature,
            grammarTitle: grammar.title,
            topic: selected.topic,
            errorClass,
            originalText: match.context?.text ?? text,
            correctedText: result.corrected,
            explanation: match.message,
            occurrenceCount: 1,
            repairStatus: "scheduled",
            nextRepairAt: Date.now() + 86_400_000,
            lastSeenAt: new Date().toISOString(),
          });
          draft.reviews.push({
            id: makeId("error-review"),
            sourceType: "error_item",
            sourceId: signature,
            topic: selected.topic,
            original: match.context?.text ?? text,
            corrected: result.corrected,
            intervalDays: 1,
            dueAt: Date.now() + 86_400_000,
            successStreak: 0,
            stabilityScore: 0,
            mode: "repair",
            status: "pending",
          });
        }
      });
      recalculateMastery(draft, grammar.title);
    });

    if (!result.pass) {
      setStatus(
        "Not passed yet. Improve the exact errors and evaluate again.",
      );
      return;
    }
    if (!result.masteryEligible) {
      setStatus(
        "Offline practice accepted. You can continue; mastery changes only after online verification.",
      );
    }

    setTurns((value) => value + 1);
    setUses((value) => value + result.targetUses);
    setWords((value) => value + wordCount(text));
    setChat((current) => {
      const followUp =
        followUps[
          current.filter((item) => item.role === "user").length %
            followUps.length
        ] ?? "Give one more concrete example using today’s target grammar.";
      return [
        ...current,
        { role: "user", text },
        { role: "coach", text: followUp },
      ];
    });
    mutate((draft) => {
      draft.sessions.push({
        id: makeId("session"),
        date: new Date().toISOString(),
        topic: selected.topic,
        grammarTitle: grammar.title,
        transcript: text,
        corrected: result.corrected,
        seconds,
        targetUses: result.targetUses,
      });
      const key = todayKey();
      const plan = draft.dailyPlans[key] ?? { completed: [], answers: {} };
      if (!plan.completed.includes(2)) plan.completed.push(2);
      draft.dailyPlans[key] = plan;
      draft.activity[key] = plan.completed.length;
    });
    if (state.settings.saveAudio && audioBlobRef.current) {
      await putAudio({
        id: makeId("audio"),
        blob: audioBlobRef.current,
        createdAt: new Date().toISOString(),
        grammarTitle: grammar.title,
        topic: selected.topic,
        transcript: text,
        corrected: result.corrected,
        repetitionStatus: "new",
      });
    }
    setTranscript("");
    audioBlobRef.current = null;
    setStatus(
      "Answer evaluated and saved. Continue with the follow-up prompt.",
    );
    speak(result.corrected);
  };

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <h1>Conversation Studio</h1>
          <p>
            Choose from 72 legacy topics, speak or type an answer, receive a
            reliable correction, and collect separate speaking evidence.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge>72 Themen</Badge>
          <Badge variant="secondary">Adaptive follow-up prompts</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="filter-grid">
            <div className="field-stack">
              <Label htmlFor="path">Learning path</Label>
              <Select
                id="path"
                name="conversation-path"
                onChange={(event) => {
                  setPath(event.target.value);
                  setLevel("All");
                  setSkill("All");
                  setCategory("All");
                }}
                value={path}
              >
                {Object.keys(PATH_GROUPS).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </div>
            <div className="field-stack">
              <Label htmlFor="level">Level</Label>
              <Select
                id="level"
                name="conversation-level"
                onChange={(event) => {
                  setLevel(event.target.value);
                  setSkill("All");
                  setCategory("All");
                }}
                value={level}
              >
                {levels.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </div>
            <div className="field-stack">
              <Label htmlFor="skill">Skill</Label>
              <Select
                id="skill"
                name="conversation-skill"
                onChange={(event) => {
                  setSkill(event.target.value);
                  setCategory("All");
                }}
                value={skill}
              >
                {skills.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </div>
            <div className="field-stack">
              <Label htmlFor="category">Category</Label>
              <Select
                id="category"
                name="conversation-category"
                onChange={(event) => setCategory(event.target.value)}
                value={category}
              >
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </div>
            <div className="field-stack">
              <Label htmlFor="topic">Topic</Label>
              <Select
                id="topic"
                name="conversation-topic"
                onChange={(event) => setTopicIndex(Number(event.target.value))}
                value={topicIndex}
              >
                {filteredTopics.map((topic, index) => (
                  <option key={`${topic.topic}-${index}`} value={index}>
                    {topic.topic}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border bg-gradient-to-br from-slate-50 to-white p-4">
            <h2 className="font-extrabold text-primary">{selected.topic}</h2>
            <p className="mt-1 text-sm leading-6">{selected.task}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {path} · {selected.level} · {selected.skill} · {selected.category}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="studio-grid">
        <div className="page-stack">
          <Card>
            <CardContent className="pt-5">
              <div className="coach-stage">
                <div>
                  <ProfileAvatar
                    className="size-20"
                    label="Menschlicher Sprachcoach"
                    variant="coach"
                  />
                  <p className="mt-1 text-center text-xs font-bold">
                    Sprachcoach
                  </p>
                </div>
                <div className="coach-question">
                  <h2>{selected.topic}</h2>
                  <p className="text-sm leading-6">{selected.task}</p>
                </div>
                <div>
                  <ProfileAvatar
                    className="size-20"
                    label={
                      state.learner.displayName
                        ? `Profile photo of ${state.learner.displayName}`
                        : "Dein menschlicher Profilavatar"
                    }
                    photo={state.learner.avatarDataUrl}
                  />
                  <p className="mt-1 text-center text-xs font-bold">Du</p>
                </div>
              </div>

              <div className="control-dock">
                <button
                  className="control-button"
                  data-tone="primary"
                  onClick={startSession}
                  type="button"
                >
                  <Play aria-hidden className="size-5" />
                  Start session
                </button>
                <button
                  className="control-button"
                  disabled={!sessionActive || recordingState !== "idle"}
                  onClick={startRecording}
                  type="button"
                >
                  <Mic aria-hidden className="size-5" />
                  Record answer
                </button>
                <button
                  className="control-button"
                  disabled={recordingState === "idle"}
                  onClick={togglePause}
                  type="button"
                >
                  <CirclePause aria-hidden className="size-5" />
                  {recordingState === "paused" ? "Resume" : "Pause"}
                </button>
                <button
                  className="control-button"
                  disabled={recordingState === "idle"}
                  onClick={stopRecording}
                  type="button"
                >
                  <CircleStop aria-hidden className="size-5" />
                  Stop recording
                </button>
                <button
                  className="control-button"
                  data-tone="primary"
                  disabled={checking}
                  onClick={assess}
                  type="button"
                >
                  <Check aria-hidden className="size-5" />
                  {checking ? "Evaluating..." : "Evaluate answer"}
                </button>
                <button
                  className="control-button"
                  data-tone="danger"
                  onClick={endSession}
                  type="button"
                >
                  <Square aria-hidden className="size-5" />
                  End session
                </button>
              </div>

              {audioUrl ? (
                <audio className="mb-3 w-full" controls src={audioUrl}>
                  <track kind="captions" />
                </audio>
              ) : null}
              <div className="mb-3 flex flex-wrap gap-2">
                <Button onClick={assess} variant="secondary">
                  <Check aria-hidden className="size-4" />
                  Check my answer
                </Button>
                <Button
                  onClick={() => speak(evaluation?.corrected ?? transcript)}
                  variant="outline"
                >
                  <Volume2 aria-hidden className="size-4" />
                  Listen to corrected answer
                </Button>
                <Button onClick={() => navigate("library")} variant="ghost">
                  <Save aria-hidden className="size-4" />
                  Open audio comparison
                </Button>
              </div>
              <Label className="sr-only" htmlFor="conversation-transcript">
                Conversation answer
              </Label>
              <Textarea
                aria-describedby="conversation-status"
                id="conversation-transcript"
                name="conversation-answer"
                onChange={(event) => setTranscript(event.target.value)}
                  placeholder="The transcript appears here. You can also type the full English answer."
                value={transcript}
              />
              <div className="mt-3 chat-log" role="log">
                {chat.length === 0 ? (
                  <p className="p-2 text-sm text-muted-foreground">
                    Start the session to begin the adaptive dialogue.
                  </p>
                ) : (
                  chat.map((message, index) => (
                    <div
                      className={`chat-bubble ${
                        message.role === "user" ? "user" : ""
                      }`}
                      key={`${message.role}-${index}`}
                    >
                      {message.text}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          {evaluation ? <EvaluationResult evaluation={evaluation} /> : null}
        </div>

        <aside className="page-stack">
          <Card>
            <CardHeader>
              <CardTitle>Current Evidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <div className="metric-card">
                  <strong>{turns}</strong>
                  <span>Turns</span>
                </div>
                <div className="metric-card">
                  <strong>{formatSeconds(seconds)}</strong>
                  <span>Speaking time</span>
                </div>
                <div className="metric-card">
                  <strong>{uses}</strong>
                  <span>Target uses</span>
                </div>
                <div className="metric-card">
                  <strong>
                    {seconds > 0 ? Math.round((words / seconds) * 60) : 0}
                  </strong>
                  <span>WPM</span>
                </div>
              </div>
              <p
                aria-live="polite"
                className="mt-3 rounded-xl border bg-secondary p-3 text-sm leading-6"
                id="conversation-status"
                role="status"
              >
                {status}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Grammar Correction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border bg-secondary p-3 text-sm leading-6">
                {evaluation
                  ? evaluation.corrected
                  : "Die korrigierte englische Fassung erscheint hier."}
              </div>
              <Button
                className="mt-3"
                disabled={
                  !evaluation ||
                  (!evaluation.changed && evaluation.matches.length === 0)
                }
                onClick={openSavedCorrection}
                variant="secondary"
              >
                Save to error workshop
              </Button>
              {evaluation ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Detected errors are saved automatically. Open the error
                  workshop to start the repair chain.
                </p>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today's Learning Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge>{grammar.level}</Badge>
              <p className="mt-2 font-extrabold">{grammar.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {grammar.rule}
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
