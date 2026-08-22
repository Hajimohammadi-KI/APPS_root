# Consent-first guarded in-app nudges

Status: implemented for English and German as a local, in-app-only feature.

## Learner contract

- The feature is off by default and is enabled explicitly in Settings.
- It shows only inside the open app. It sends no push notification, email, SMS,
  or external message.
- The copy contains no shame, loss framing, fabricated urgency, hidden penalty,
  or claim that a streak freeze means practice occurred.
- Closing or dismissing a prompt has no penalty and does not change mastery,
  streak, evidence, or the daily plan.
- The prompt is announced through a polite live region and is inserted without
  moving keyboard focus.

## Deterministic guard contract

`evaluateNudge` is pure and stops at the first failed guard in this order:

1. an active time-based implementation intention matches from its planned
   minute through the next 30 minutes;
2. the same technical intention ID has not produced a shown event in the last
   72 elapsed hours;
3. local time is outside quiet hours (21:00–08:00);
4. bounded practice-readiness is at least 0.35;
5. the due-review backlog is at most 40;
6. global in-app opt-in is true;
7. shown-event caps remain below one per local day and three per local ISO week.

`after_event`, `context`, and `feeling` plans are never inferred from browser or
device behaviour. The current adapter evaluates only explicit time plans on app
start, `pageshow`, and return from a hidden tab. It uses no `setInterval` and no
closed-PWA scheduler.

## Local data boundary

The profile remains at `adherence-core-v1`. Minimal nudge events use the
versioned key `adherence-nudge-events-v1` and contain only:

- opaque stable event ID and technical trigger ID;
- `evaluated`, `shown`, `accepted`, or `dismissed`;
- timestamp, local date/week, and first-failure decision code;
- fixed `engagementOnly: true` and `learningOutcome: "not-evaluated"` markers.

No intention label, response, transcript, audio, email, prompt text, or medical
inference is stored. Events expire after 90 days and are capped at 500 rows.
They remain separate from the research measurement export. A prompt action is
an engagement event, never evidence of learning, mastery, or automaticity.

## Verification

- Pure tests cover guard order, cooldown, quiet hours, daily/weekly caps,
  timezone/DST boundaries, storage deduplication/retention, default opt-out, and
  EN/DE/FA supportive copy.
- English and German Settings E2E verify the UI opt-in, no prompt while opted
  out, visible prompt after opt-in, polite announcement, unchanged focus,
  local evaluated/shown/dismissed events, and no raw text in event storage.
- The prompt and Settings flow have no horizontal overflow at 800×1280 and
  412×915.
