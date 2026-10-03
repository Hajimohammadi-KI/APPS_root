"use client";

import * as React from "react";
import { CircleStop, Mic } from "lucide-react";
import { getTeacherAudio } from "@/lib/teacher-content";

export function HumanAudioPlayer({
  contentId,
  compact = false,
}: {
  contentId: string;
  compact?: boolean;
}) {
  const [url, setUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    setLoading(true);
    void getTeacherAudio(contentId).then((blob) => {
      if (!active) return;
      objectUrl = blob ? URL.createObjectURL(blob) : null;
      setUrl(objectUrl);
      setLoading(false);
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [contentId]);
  if (loading)
    return (
      <span className="text-xs text-muted-foreground">
        Menschliche Aufnahme wird geladen …
      </span>
    );
  if (!url)
    return (
      <span className="text-xs text-muted-foreground">
        Keine menschliche Aufnahme vorhanden.
      </span>
    );
  return (
    <audio
      aria-label="Von einer Lehrkraft aufgenommene Audiodatei"
      className={compact ? "h-9 max-w-full" : "w-full"}
      controls
      preload="metadata"
      src={url}
    />
  );
}

export function HumanAudioRecorder({
  onRecorded,
}: {
  onRecorded: (blob: Blob) => void;
}) {
  const [recording, setRecording] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const recorder = React.useRef<MediaRecorder | null>(null);
  const chunks = React.useRef<Blob[]>([]);
  React.useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );
  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    const next = new MediaRecorder(stream);
    chunks.current = [];
    next.ondataavailable = (event) => {
      if (event.data.size) chunks.current.push(event.data);
    };
    next.onstop = () => {
      const blob = new Blob(chunks.current, {
        type: next.mimeType || "audio/webm",
      });
      stream.getTracks().forEach((track) => track.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      onRecorded(blob);
    };
    recorder.current = next;
    next.start(250);
    setRecording(true);
  }
  function stop() {
    recorder.current?.stop();
    setRecording(false);
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className="teacher-secondary-button"
        onClick={() => void (recording ? Promise.resolve(stop()) : start())}
        type="button"
      >
        {recording ? <CircleStop aria-hidden /> : <Mic aria-hidden />}{" "}
        {recording ? "Aufnahme beenden" : "Stimme aufnehmen"}
      </button>
      {previewUrl ? (
        <audio
          aria-label="Vorschau der neuen Aufnahme"
          className="h-10 max-w-full"
          controls
          src={previewUrl}
        />
      ) : null}
    </div>
  );
}
