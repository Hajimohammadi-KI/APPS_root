import {
  RecognitionCollector,
  type SpeechRecognitionLike,
} from "@automaticity/learning-core/speech";
import { useEffect, useRef, useState } from "react";

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

/** Mikrofonaufnahme mit Live-Transkript und abspielbarer Aufnahme für den Sprechschritt. */
export function useLessonRecorder({
  setTranscript,
  onStart,
}: {
  setTranscript: (value: string) => void;
  onStart: () => void;
}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [hasAudioBlob, setHasAudioBlob] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<Blob | null>(null);
  const startedAtRef = useRef(0);

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

  /** Liefert die Fehlermeldung, wenn das Mikrofon nicht gestartet werden konnte. */
  async function startRecording(): Promise<string | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      chunksRef.current = [];
      audioRef.current = null;
      setHasAudioBlob(false);
      onStart();
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
        recognition.maxAlternatives = 3;
        const collector = new RecognitionCollector("");
        recognition.onresult = (event) => {
          const result = collector.update(event);
          setTranscript(
            [result.finalText, result.interimText].filter(Boolean).join(" "),
          );
        };
        recognition.start();
        recognitionRef.current = recognition;
      }
      return null;
    } catch (error) {
      return error instanceof Error
        ? error.message
        : "Mikrofon nicht verfügbar.";
    }
  }

  async function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return false;
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
    return true;
  }

  return {
    recording,
    seconds,
    audioUrl,
    hasAudioBlob,
    audioBlob: () => audioRef.current,
    startRecording,
    stopRecording,
  };
}
