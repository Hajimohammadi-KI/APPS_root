"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Headphones, RefreshCw, Trash2, Volume2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  deleteAudio,
  listAudio,
  markAudioRepeated,
  type AudioRecord,
} from "@/features/audio/audio-repository";

interface AudioView {
  readonly record: AudioRecord;
  readonly url: string;
}

function speak(text: string) {
  if (!text || !("speechSynthesis" in window)) {
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 0.92;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

export function AudioLibrary() {
  const [rows, setRows] = useState<readonly AudioView[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const records = await listAudio();
      setRows((current) => {
        current.forEach((row) => URL.revokeObjectURL(row.url));
        return [...records]
          .reverse()
          .map((record) => ({ record, url: URL.createObjectURL(record.blob) }));
      });
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Audio-Bibliothek konnte nicht geöffnet werden.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(
    () => () => {
      rows.forEach((row) => URL.revokeObjectURL(row.url));
    },
    [rows],
  );

  async function remove(id: string) {
    if (!window.confirm("Diese Aufnahme wirklich löschen?")) {
      return;
    }
    await deleteAudio(id);
    await load();
    setMessage("Aufnahme gelöscht.");
  }

  async function completeComparison(id: string) {
    await markAudioRepeated(id);
    await load();
    setMessage(
      "Vergleich abgeschlossen. Die korrigierte Fassung wurde als laut wiederholt markiert.",
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-kicker">Lokal aufgenommen</p>
          <h1 className="section-title">Audio-Bibliothek</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gesprächsaufnahmen und Transkripte aus IndexedDB.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => void load()}
        >
          <RefreshCw
            className={loading ? "animate-spin" : ""}
            data-icon="inline-start"
          />
          Aktualisieren
        </Button>
      </div>

      <div className="grid gap-4">
        {rows.map(({ record, url }) => (
          <Card key={record.id}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <CardTitle>{record.topic}</CardTitle>
                {record.repeatedAt && (
                  <Badge variant="secondary">Wiederholt ✓</Badge>
                )}
              </div>
              <CardDescription>
                {new Intl.DateTimeFormat("de-DE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(record.date))}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border bg-muted/40 p-3 text-sm leading-6">
                  <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                    Dein Transkript
                  </span>
                  {record.transcript}
                </div>
                <div className="rounded-xl border bg-sky-50/60 p-3 text-sm leading-6">
                  <span className="mb-1 block text-xs font-semibold text-sky-800">
                    Korrigierte Fassung
                  </span>
                  {record.correctedTranscript ?? record.transcript}
                </div>
              </div>
              <audio
                controls
                src={url}
                className="w-full"
                aria-label={`Aufnahme: ${record.topic}`}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    speak(record.correctedTranscript ?? record.transcript)
                  }
                >
                  <Volume2 data-icon="inline-start" />
                  Korrektur anhören
                </Button>
                <Button
                  type="button"
                  onClick={() => void completeComparison(record.id)}
                >
                  <Check data-icon="inline-start" />
                  Laut wiederholt
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => void remove(record.id)}
                >
                  <Trash2 data-icon="inline-start" />
                  Löschen
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && rows.length === 0 && (
        <Card>
          <CardContent>
            <Empty className="min-h-64">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Headphones aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>Noch keine Aufnahmen</EmptyTitle>
                <EmptyDescription>
                  Aktiviere „Audio lokal speichern“ und nimm im Studio eine
                  Antwort auf.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      )}

      {message && (
        <p role="status" className="rounded-xl border p-3 text-sm">
          {message}
        </p>
      )}
    </div>
  );
}
