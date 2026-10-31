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
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const problems = {
  empty: "Write your feedback first.",
  too_long: `Please keep your message under ${FEEDBACK_MESSAGE_LIMIT} characters.`,
  unavailable: "Contact is not available right now.",
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
export function ContactFeedback({ address }: { address: string }) {
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
      {
        app: "en",
        release,
        page: previousPage(),
        category,
        message,
      },
      address,
    );

  const openEmail = () => {
    const email = compose();
    if (!email.ok) return setStatus(problems[email.reason]);
    setStatus(
      "Your email app should open with this message. Nothing is sent until you press Send there.",
    );
    location.href = email.href;
  };

  const copyMessage = async () => {
    const email = compose();
    if (!email.ok) return setStatus(problems[email.reason]);
    try {
      await navigator.clipboard.writeText(
        `To: ${email.address}\nSubject: ${email.subject}\n\n${email.body}`,
      );
      setStatus(`Copied. Paste it into an email to ${email.address}.`);
    } catch {
      setStatus(`Copying is blocked here. Please write to ${email.address}.`);
    }
  };

  return (
    <section
      aria-labelledby="contact-title"
      className="legal-card legal-contact"
      id="contact"
    >
      <h2 id="contact-title">Contact us</h2>
      <p>
        Found a mistake, a wrong answer key or something confusing? Tell us.
        Your email app opens with your message, so we can reply to you. Please
        do not include passwords or anything you do not want to share.
      </p>
      <form
        className="mt-4 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          openEmail();
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="contact-category">What is it about?</Label>
          <Select
            id="contact-category"
            onChange={(event) =>
              setCategory(event.target.value as FeedbackCategory)
            }
            value={category}
          >
            {FEEDBACK_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {feedbackCategoryLabel("en", value)}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="contact-message">Your feedback</Label>
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
            Write email
          </Button>
          <Button
            onClick={() => void copyMessage()}
            type="button"
            variant="outline"
          >
            <Copy aria-hidden className="size-4" />
            Copy message
          </Button>
        </div>
        <p className="text-sm">
          Or write to <a href={`mailto:${address}`}>{address}</a>.
        </p>
        <p aria-live="polite" className="text-sm font-semibold" role="status">
          {status}
        </p>
      </form>
    </section>
  );
}
