"use client";

import * as React from "react";
import { Copy, Mail } from "lucide-react";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_MESSAGE_LIMIT,
  type FeedbackCategory,
  feedbackCategoryLabel,
  feedbackEmail,
} from "@automaticity/learning-core/feedback";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const problems = {
  empty: "Schreibe zuerst dein Feedback.",
  too_long: `Bitte bleibe unter ${FEEDBACK_MESSAGE_LIMIT} Zeichen.`,
  unavailable: "Kontakt ist gerade nicht verfügbar.",
} as const;

/** The page the learner came from on this site, never another site's address. */
function previousPage(): string {
  try {
    const from = new URL(document.referrer);
    if (from.origin === location.origin) return from.pathname;
  } catch {
    // No referrer.
  }
  return location.pathname;
}

/** Composes an email in the learner's own mail app; nothing is sent from the page. */
export function ContactFeedback({ address }: { readonly address: string }) {
  const [category, setCategory] = React.useState<FeedbackCategory>("bug");
  const [message, setMessage] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [release, setRelease] = React.useState("");

  React.useEffect(() => {
    fetch("/web-release.json", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((marker: { release?: unknown } | null) => {
        if (typeof marker?.release === "string") setRelease(marker.release);
      })
      .catch(() => undefined);
  }, []);

  const compose = () =>
    feedbackEmail(
      { app: "de", release, page: previousPage(), category, message },
      address,
    );

  const openEmail = () => {
    const email = compose();
    if (!email.ok) {
      setStatus(problems[email.reason]);
      return;
    }
    setStatus(
      "Deine E-Mail-App sollte sich mit dieser Nachricht öffnen. Gesendet wird erst, wenn du dort auf Senden tippst.",
    );
    location.href = email.href;
  };

  const copyMessage = async () => {
    const email = compose();
    if (!email.ok) {
      setStatus(problems[email.reason]);
      return;
    }
    try {
      await navigator.clipboard.writeText(
        `An: ${email.address}\nBetreff: ${email.subject}\n\n${email.body}`,
      );
      setStatus(`Kopiert. Füge es in eine E-Mail an ${email.address} ein.`);
    } catch {
      setStatus(
        `Kopieren ist hier blockiert. Bitte schreibe an ${email.address}.`,
      );
    }
  };

  return (
    <section
      aria-labelledby="contact-title"
      className="mt-4 rounded-2xl border bg-card p-5 shadow-sm"
      id="contact"
    >
      <h2 className="text-lg font-semibold" id="contact-title">
        Kontakt
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Hast du einen Fehler, eine falsche Lösung oder etwas Unklares gefunden?
        Schreib uns. Deine E-Mail-App öffnet sich mit deiner Nachricht, damit
        wir dir antworten können. Bitte keine Passwörter oder Dinge angeben, die
        du nicht teilen möchtest.
      </p>
      <form
        className="mt-4 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          openEmail();
        }}
      >
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="contact-category">
            Worum geht es?
          </label>
          <select
            className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            id="contact-category"
            onChange={(event) =>
              setCategory(event.target.value as FeedbackCategory)
            }
            value={category}
          >
            {FEEDBACK_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {feedbackCategoryLabel("de", value)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="contact-message">
            Dein Feedback
          </label>
          <Textarea
            id="contact-message"
            maxLength={FEEDBACK_MESSAGE_LIMIT}
            onChange={(event) => setMessage(event.target.value)}
            rows={6}
            value={message}
          />
          <span className="text-xs text-muted-foreground">
            {message.length} / {FEEDBACK_MESSAGE_LIMIT}
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit">
            <Mail aria-hidden className="size-4" />
            E-Mail schreiben
          </Button>
          <Button
            onClick={() => void copyMessage()}
            type="button"
            variant="outline"
          >
            <Copy aria-hidden className="size-4" />
            Nachricht kopieren
          </Button>
        </div>
        <p className="text-sm">
          Oder schreibe an{" "}
          <a
            className="text-primary hover:underline"
            href={`mailto:${address}`}
          >
            {address}
          </a>
          .
        </p>
        <p aria-live="polite" className="text-sm font-medium" role="status">
          {status}
        </p>
      </form>
    </section>
  );
}
