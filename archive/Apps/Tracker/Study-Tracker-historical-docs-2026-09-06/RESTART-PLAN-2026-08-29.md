# Study Tracker restart plan — 2026-08-29

## Decision

The tracker records the plan as **not started**. No missed lesson or design day
is counted as overdue work.

## Calendar-aware schedule

- 2, 5, and 7 September: the three remaining live course sessions only.
- 10 September through 13 October: protected break; no required study tasks.
- 14 through 18 October: optional 12-minute rescue-mode re-entry.
- 19 October 2026: Week 1 starts in 70-minute light mode at 15:00
  Europe/Berlin.
- 24 November 2026: design phase ends.
- 30 November 2026: technical phase starts.
- 10 April 2027: Week 25 ends.

Sessions 1–7 and transfers whose former deadlines fall inside the protected
break are archived reference material. They do not lower progress or the
streak and are never scheduled automatically.

## Revision 6: abandon old backlog

- Live sessions 8–10 are observer-only: zero preparation and no required
  artifact. After an attended session, the only output is at most three lines:
  understood point, thesis relevance, and open question.
- A missed live session is not made up before the main plan starts.
- Sessions 1–7 may be opened after the current week's required artifact, at
  most once per week, and only when the session directly blocks that week's
  artifact, test, or evidence. Otherwise it is skipped permanently.
- W1–W6 are future project weeks, not missed work. The changelog is explicitly
  labeled as information rather than a task list.
- If recovery makes 19 October unsuitable, the learner selects a later date;
  all 25 weeks shift together and are never compressed or doubled.
- Clinical restrictions always override the planned date, time, and streak.

## Privacy boundary

Only generic availability windows are stored in the public source. Calendar
names, medical event titles, providers, and unrelated appointments are not
copied into the repository or exported by the tracker.

## Preservation boundary

Revision 6 keeps stable `wN-dN` task IDs and includes the full Revision 4 date
map for older date-keyed data. Install, Update, and Repair preserve `.wrangler`
and `.env.local`; lifecycle verification must confirm that task progress,
notes, settings, focus sessions, and PDF sessions survive.
