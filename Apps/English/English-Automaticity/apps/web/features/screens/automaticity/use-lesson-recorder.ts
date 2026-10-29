import { RecognitionCollector, type SpeechRecognitionLike } from "@automaticity/learning-core/speech";
import * as React from "react";

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

/** Microphone capture with a live transcript for the free-speaking step. */
export function useLessonRecorder({
  transcript,
  setTranscript,
}: {
  transcript: string;
  setTranscript: (value: string) => void;
}) {
  const [recording, setRecording] = React.useState(false);
  const [seconds, setSeconds] = React.useState(0);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const audioRef = React.useRef<Blob | null>(null);
  const startedAtRef = React.useRef(0);

  React.useEffect(() => {
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

  React.useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      try {
        recognitionRef.current?.stop();
      } catch {
        /* already stopped */
      }
    },
    [],
  );

  /** Resolves with the error message when the microphone could not start. */
  async function startRecording(): Promise<string | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      audioRef.current = null;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        audioRef.current = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      startedAtRef.current = Date.now();
      setSeconds(0);
      setRecording(true);

      const Recognition = getSpeechRecognition();
      if (Recognition) {
        const recognition = new Recognition();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 3;
        const collector = new RecognitionCollector(transcript);
        recognition.onresult = event => {
          const result = collector.update(event);
          setTranscript([result.finalText, result.interimText].filter(Boolean).join(" "));
        };
        recognition.start();
        recognitionRef.current = recognition;
      }
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Microphone unavailable.";
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
      /* already stopped */
    }
    setRecording(false);
    return true;
  }

  return {
    recording,
    seconds,
    audioBlob: () => audioRef.current,
    startRecording,
    stopRecording,
  };
}
