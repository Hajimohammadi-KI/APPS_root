"use client";

import { deleteCompleteLearnerData } from "@automaticity/learning-core/automaticity";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CONFIRMATION = "LÖSCHEN";

/** Deletes everything a complete backup covers, only after a backup (or the
 * explicit choice to skip it) and the typed confirmation word. */
export function DeleteAllDataCard({
  onExport,
}: {
  onExport: () => Promise<boolean>;
}) {
  const [backedUp, setBackedUp] = useState(false);
  const [skipBackup, setSkipBackup] = useState(false);
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const ready =
    (backedUp || skipBackup) &&
    typed.trim().toLocaleUpperCase("de-DE") === CONFIRMATION &&
    !busy;

  async function backup() {
    setBusy(true);
    try {
      setBackedUp(await onExport());
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!ready) return;
    setBusy(true);
    setStatus("Deine Daten auf diesem Gerät werden gelöscht …");
    try {
      await deleteCompleteLearnerData(
        { storage: localStorage, indexedDB },
        "de",
      );
      setStatus(
        "Alle deine Daten in dieser App wurden gelöscht. Die App startet leer neu.",
      );
      window.location.replace("/");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Das Löschen wurde angehalten. Dein Lernfortschritt wurde nicht gelöscht.",
      );
      setBusy(false);
    }
  }

  return (
    <Card data-delete-all-data>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 aria-hidden className="size-5" />
          Alle meine Daten löschen
        </CardTitle>
        <CardDescription>
          Entfernt Fortschritt, Antworten, Aufnahmen und Einstellungen dieser
          App von diesem Gerät. Die App speichert nichts auf einem Server. Ziehe
          gesendete Kommentare vorher zurück: Ihre Quittung wird mitgelöscht.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            disabled={busy || backedUp}
            onClick={() => void backup()}
            variant="outline"
          >
            {backedUp
              ? "Sicherung heruntergeladen"
              : "1. Zuerst eine Sicherung herunterladen"}
          </Button>
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={skipBackup}
              disabled={busy}
              onChange={(event) => setSkipBackup(event.target.checked)}
              type="checkbox"
            />
            Ohne Sicherung löschen
          </label>
        </div>
        <label className="flex flex-wrap items-center gap-2 text-sm">
          2. Zur Bestätigung {CONFIRMATION} eingeben
          <input
            autoComplete="off"
            className="rounded-md border px-2 py-1"
            disabled={busy}
            onChange={(event) => setTyped(event.target.value)}
            spellCheck={false}
            value={typed}
          />
        </label>
        <div>
          <Button
            disabled={!ready}
            onClick={() => void remove()}
            variant="destructive"
          >
            <Trash2 aria-hidden />
            3. Alle meine Daten löschen
          </Button>
        </div>
        <p className="text-sm text-muted-foreground" role="status">
          {status}
        </p>
      </CardContent>
    </Card>
  );
}
