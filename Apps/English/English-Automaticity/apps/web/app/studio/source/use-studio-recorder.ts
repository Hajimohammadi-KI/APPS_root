import { useEffect, useRef, useState } from "react";
import {
  appendEvidenceInvalidationToStorage,
  appendLearningEvidenceBundleToStorage,
  buildAttemptVerticalSlice,
} from "@automaticity/learning-core";
import {
  copy,
  speechLocale,
  type ConversationTopic,
  type StudioLanguage,
} from "./conversation-data";
import { saveConversationSession } from "./conversation-storage";
import {
  countWords,
  currentSessionMinutes,
  type EvaluationResponse,
  isEvaluationResponse,
  recognitionConstructor,
  type RecordingState,
  type SpeechRecognitionLike,
} from "./studio-helpers";

interface RecorderOptions {
  readonly language: StudioLanguage;
  readonly selected: ConversationTopic;
  readonly maxSeconds: number;
  readonly onRecordingStarted: () => void;
  readonly onRecorded: () => void;
  readonly onEvaluated: () => void;
  readonly onSaved: (evaluation: EvaluationResponse) => void;
}

/** Microphone, live transcript, LanguageTool evaluation and local saving for one studio session. */
export function useStudioRecorder({
  language,
  selected,
  maxSeconds,
  onRecordingStarted,
  onRecorded,
  onEvaluated,
  onSaved,
}: RecorderOptions) {
  const text = copy[language];
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
  const [attempts, setAttempts] = useState(0);
  const [voiceRecoveryAvailable, setVoiceRecoveryAvailable] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const transcriptRef = useRef<HTMLTextAreaElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const attemptIdRef = useRef<string | null>(null);
  const savedEvidenceIdRef = useRef<string | null>(null);

  const wordCount = countWords(transcript);
  const wordsPerMinute =
    seconds > 0 ? Math.round(wordCount / (seconds / 60)) : 0;

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

  function editTranscript(value: string) {
    setTranscript(value);
    setInterimTranscript("");
    setEvaluation(null);
    setSavedId(null);
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
        onRecorded();
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
      onRecordingStarted();
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
      onEvaluated();
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
      onSaved(evaluation);
    } catch {
      setMessage(
        language === "de"
          ? "Die Sitzung konnte in diesem Browser nicht gespeichert werden."
          : "The session could not be saved in this browser.",
      );
    }
  }

  return {
    recordingState,
    seconds,
    transcript,
    interimTranscript,
    audioUrl,
    hasAudioBlob,
    evaluation,
    baseline,
    evaluating,
    savedId,
    message,
    attempts,
    voiceRecoveryAvailable,
    wordCount,
    wordsPerMinute,
    transcriptRef,
    audioRef,
    setMessage,
    resetSession,
    editTranscript,
    startRecording,
    pauseOrResume,
    finishRecording,
    evaluateTranscript,
    practiceImprovedVersion,
    saveSession,
  };
}

export type StudioRecorder = ReturnType<typeof useStudioRecorder>;
