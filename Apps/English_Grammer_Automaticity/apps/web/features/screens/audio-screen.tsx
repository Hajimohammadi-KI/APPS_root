"use client";

import * as React from "react";
import {
  Check,
  FileMusic,
  RefreshCcw,
  Trash2,
  Volume2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  putAudio,
  type AudioRecord,
} from "@/lib/audio-db";
import { speak } from "@/lib/speech";

function AudioRecordCard({
  record,
  refresh,
}: {
  record: AudioRecord;
  refresh: () => Promise<void>;
}) {
  const source = React.useMemo(() => URL.createObjectURL(record.blob), [record.blob]);

  React.useEffect(
    () => () => {
      URL.revokeObjectURL(source);
    },
    [source],
  );

  return (
    <article className="audio-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge>{record.grammarTitle}</Badge>
            <Badge
              variant={
                record.repetitionStatus === "repeated" ? "success" : "secondary"
              }
            >
              {record.repetitionStatus}
            </Badge>
          </div>
          <h2 className="mt-2 font-extrabold">{record.topic}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Intl.DateTimeFormat(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(record.createdAt))}
          </p>
        </div>
        <Button
          aria-label={`Delete recording ${record.topic}`}
          onClick={async () => {
            if (
              !window.confirm(
                `Delete the saved recording for "${record.topic}"? This cannot be undone.`,
              )
            ) {
              return;
            }
            await deleteAudio(record.id);
            await refresh();
          }}
          size="icon"
          variant="destructive"
        >
          <Trash2 aria-hidden className="size-4" />
        </Button>
      </div>
      <audio className="mt-3 w-full" controls src={source}>
        <track kind="captions" />
      </audio>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border bg-slate-50 p-3 text-sm">
          <p className="text-xs font-bold uppercase text-muted-foreground">
            Transcript
          </p>
          <p className="mt-1 leading-6">{record.transcript}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
          <p className="text-xs font-bold uppercase text-emerald-700">
            Corrected model
          </p>
          <p className="mt-1 leading-6">{record.corrected}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => speak(record.corrected)} variant="secondary">
          <Volume2 aria-hidden className="size-4" />
          Hear corrected model
        </Button>
        <Button
          onClick={async () => {
            await putAudio({
              ...record,
              repetitionStatus: "repeated",
            });
            await refresh();
          }}
          variant="outline"
        >
          <Check aria-hidden className="size-4" />
          I repeated it accurately
        </Button>
      </div>
    </article>
  );
}

export function AudioScreen() {
  const [records, setRecords] = React.useState<AudioRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listAudio();
      setRecords(rows.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <h1>Audio Library</h1>
          <p>
            Local legacy recordings combine original voice, transcript,
            corrected model, listening comparison, and clear review status.
          </p>
        </div>
        <Button onClick={refresh} variant="outline">
          <RefreshCcw aria-hidden className="size-4" />
          Refresh
        </Button>
      </div>
      {loading ? (
        <Card>
          <CardContent className="pt-5 text-sm text-muted-foreground">
            Loading local recordings...
          </CardContent>
        </Card>
      ) : records.length > 0 ? (
        <div className="grid gap-3">
          {records.map((record) => (
            <AudioRecordCard key={record.id} record={record} refresh={refresh} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <Empty className="min-h-52">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileMusic aria-hidden />
                </EmptyMedia>
                <EmptyTitle>No recording saved yet</EmptyTitle>
                <EmptyDescription>
                  Record an answer in the conversation studio and complete a
                  successful evaluation.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
