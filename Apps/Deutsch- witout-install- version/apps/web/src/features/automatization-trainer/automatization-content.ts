import type { CefrLevel } from "@grammar/domain";

// Default shadowing passages, one per CEFR level. A teacher can attach a
// human recording for any of these through /lehrkraft by entering this
// exact contextKey as the "Inhaltsschlüssel" -- the trainer looks that key
// up first and only falls back to TTS when no recording exists, the same
// priority order automaticity-lab.tsx already uses for grammar audio.
export interface ShadowingPassage {
  readonly id: string;
  readonly level: CefrLevel;
  readonly title: string;
  readonly text: string;
  readonly contextKey: string;
  /**
   * Optional rhythm/stress markup, display-only (never used for grading or
   * TTS -- `text` above stays plain for that). Convention: `/` marks a
   * short pause point; `*word*` marks a stressed word or syllable. Shown
   * during precise shadowing (stage 3) as a reading aid.
   */
  readonly markupText?: string;
  /**
   * A small, hand-written set of lexical/structural variants of one
   * sentence from `text`, used by the optional "shadow with variation"
   * drill in stage 3: after two exact repetitions, the learner produces
   * the altered version without audio support. Deliberately not
   * auto-generated -- a curated variant is the point.
   */
  readonly variants?: readonly string[];
}

export const SHADOWING_PASSAGES: readonly ShadowingPassage[] = [
  {
    id: "morgenroutine",
    level: "A1",
    title: "Meine Morgenroutine",
    text: "Ich stehe um sieben Uhr auf. Zuerst trinke ich einen Kaffee. Dann dusche ich schnell. Um acht Uhr gehe ich aus dem Haus.",
    contextKey: "automatisierung-shadowing-morgenroutine",
    markupText:
      "Ich stehe um *sieben* Uhr auf. / Zuerst trinke ich einen *Kaffee*. / Dann dusche ich *schnell*. / Um *acht* Uhr gehe ich aus dem Haus.",
    variants: ["Ich stehe um sieben Uhr auf und trinke sofort einen Tee."],
  },
  {
    id: "wochenende",
    level: "A2",
    title: "Ein Wochenende in der Stadt",
    text: "Am Samstag bin ich mit Freunden in die Stadt gefahren. Wir haben zuerst einen Kaffee getrunken und sind dann durch den Markt gelaufen. Später haben wir in einem kleinen Restaurant zu Abend gegessen.",
    contextKey: "automatisierung-shadowing-wochenende",
    variants: [
      "Am Sonntag bin ich mit meiner Familie ins Museum gefahren.",
    ],
  },
  {
    id: "arbeitsalltag",
    level: "B1",
    title: "Ein typischer Arbeitstag",
    text: "Normalerweise beginnt mein Arbeitstag mit einer kurzen Besprechung. Danach beantworte ich E-Mails, bevor ich mich auf die wichtigsten Aufgaben konzentriere. Gegen Mittag mache ich meistens eine Pause, damit ich am Nachmittag wieder klar denken kann.",
    contextKey: "automatisierung-shadowing-arbeitsalltag",
    markupText:
      "Normalerweise beginnt mein Arbeitstag mit einer *kurzen* Besprechung. / Danach beantworte ich *E-Mails*, / bevor ich mich auf die *wichtigsten* Aufgaben konzentriere. / Gegen Mittag mache ich meistens eine *Pause*, / damit ich am Nachmittag wieder *klar* denken kann.",
  },
  {
    id: "umweltdebatte",
    level: "B2",
    title: "Eine Diskussion über Umweltschutz",
    text: "Immer mehr Menschen achten inzwischen darauf, wie sie ihren Alltag umweltfreundlicher gestalten können. Trotzdem bleibt umstritten, ob individuelles Verhalten tatsächlich ausreicht, um die großen Probleme zu lösen, oder ob es vor allem politische Entscheidungen braucht.",
    contextKey: "automatisierung-shadowing-umweltdebatte",
  },
  {
    id: "digitalisierung",
    level: "C1",
    title: "Digitalisierung am Arbeitsplatz",
    text: "Die fortschreitende Digitalisierung verändert nicht nur einzelne Arbeitsabläufe, sondern stellt ganze Berufsbilder infrage. Während einige Beschäftigte diese Entwicklung als Chance begreifen, sich beruflich neu zu orientieren, empfinden andere sie eher als Bedrohung ihrer bisherigen Sicherheit.",
    contextKey: "automatisierung-shadowing-digitalisierung",
  },
  {
    id: "gesellschaftlicher-wandel",
    level: "C2",
    title: "Gesellschaftlicher Wandel im Zeitraffer",
    text: "Kaum ein gesellschaftlicher Wandel vollzieht sich derart rasant wie jener, der gegenwärtig durch technologische Umbrüche ausgelöst wird, weshalb sich tradierte Vorstellungen von Arbeit, Bildung und sozialem Zusammenhalt in bemerkenswerter Geschwindigkeit neu ausdifferenzieren.",
    contextKey: "automatisierung-shadowing-gesellschaftlicher-wandel",
  },
];

export function shadowingPassagesForLevel(
  level: CefrLevel,
): readonly ShadowingPassage[] {
  const exact = SHADOWING_PASSAGES.filter((passage) => passage.level === level);
  return exact.length > 0 ? exact : SHADOWING_PASSAGES;
}

// Formulaic sequences (Redewendungen / feste Wendungen): fixed or
// semi-fixed multi-word chunks practiced as a whole, not word-by-word --
// distinct from the single-word/short-phrase grammar exercises the
// existing Automatik-Mission already covers. No structured content type
// for this existed anywhere in the app (only external Drive-link metadata
// in packages/content/src/materials.ts's idiomDailyMaterials), so this is
// genuinely new curated content, sized for real practice rather than a
// placeholder set.
export interface FormulaicSequence {
  readonly id: string;
  readonly level: CefrLevel;
  readonly phrase: string;
  readonly meaning: string;
  readonly promptCue: string;
}

export const FORMULAIC_SEQUENCES: readonly FormulaicSequence[] = [
  {
    id: "a1-wie-gehts",
    level: "A1",
    phrase: "Wie geht es dir?",
    meaning: "eine freundliche Frage nach dem Befinden",
    promptCue: "Du triffst eine Freundin. Frage sie höflich, wie es ihr geht.",
  },
  {
    id: "a1-kein-problem",
    level: "A1",
    phrase: "Kein Problem.",
    meaning: "eine lockere Antwort, wenn sich jemand entschuldigt",
    promptCue:
      "Jemand entschuldigt sich, weil er zu spät kommt. Antworte kurz und freundlich.",
  },
  {
    id: "a1-das-macht-nichts",
    level: "A1",
    phrase: "Das macht nichts.",
    meaning: "beruhigende Antwort auf einen kleinen Fehler",
    promptCue: "Jemand hat aus Versehen dein Glas umgestoßen. Beruhige die Person.",
  },
  {
    id: "a2-es-tut-mir-leid",
    level: "A2",
    phrase: "Es tut mir leid, aber ich kann heute nicht.",
    meaning: "eine höfliche Absage",
    promptCue: "Ein Kollege lädt dich zum Essen ein. Sage höflich ab.",
  },
  {
    id: "a2-ich-haette-gern",
    level: "A2",
    phrase: "Ich hätte gern einen Kaffee.",
    meaning: "höfliche Bestellung",
    promptCue: "Du bist im Café. Bestelle höflich einen Kaffee.",
  },
  {
    id: "a2-auf-jeden-fall",
    level: "A2",
    phrase: "Auf jeden Fall.",
    meaning: "eine nachdrückliche Zustimmung",
    promptCue: "Ein Freund fragt, ob du morgen kommst. Stimme nachdrücklich zu.",
  },
  {
    id: "b1-es-kommt-darauf-an",
    level: "B1",
    phrase: "Es kommt darauf an, ob …",
    meaning: "eine differenzierte, bedingte Antwort einleiten",
    promptCue:
      "Jemand fragt, ob du am Wochenende Zeit hast. Deine Antwort hängt vom Wetter ab.",
  },
  {
    id: "b1-im-grunde-genommen",
    level: "B1",
    phrase: "Im Grunde genommen hast du recht.",
    meaning: "teilweise Zustimmung, mit Einschränkung",
    promptCue:
      "Ein Kollege äußert eine Meinung, der du größtenteils, aber nicht ganz zustimmst.",
  },
  {
    id: "b1-das-hat-vor-und-nachteile",
    level: "B1",
    phrase: "Das hat Vor- und Nachteile.",
    meaning: "eine ausgewogene Einschätzung geben",
    promptCue: "Jemand fragt dich, ob Homeoffice gut ist. Antworte ausgewogen.",
  },
  {
    id: "b2-einerseits-andererseits",
    level: "B2",
    phrase: "Einerseits …, andererseits …",
    meaning: "zwei gegensätzliche Perspektiven gegenüberstellen",
    promptCue:
      "Du diskutierst über Homeoffice und willst zwei gegensätzliche Argumente nennen.",
  },
  {
    id: "b2-was-mich-betrifft",
    level: "B2",
    phrase: "Was mich betrifft, so …",
    meaning: "die eigene Position explizit einleiten",
    promptCue:
      "In einer Diskussion sollst du deine persönliche Meinung klar einleiten.",
  },
  {
    id: "b2-nicht-zuletzt",
    level: "B2",
    phrase: "Nicht zuletzt deshalb …",
    meaning: "ein zusätzliches, aber wichtiges Argument einführen",
    promptCue: "Du willst ein letztes, gewichtiges Argument zu deiner Liste hinzufügen.",
  },
  {
    id: "c1-vor-diesem-hintergrund",
    level: "C1",
    phrase: "Vor diesem Hintergrund lässt sich sagen, dass …",
    meaning: "eine Schlussfolgerung aus vorherigen Argumenten ziehen",
    promptCue:
      "Du hast mehrere Argumente genannt und willst nun eine Schlussfolgerung formulieren.",
  },
  {
    id: "c1-es-waere-verfehlt",
    level: "C1",
    phrase: "Es wäre verfehlt zu behaupten, dass …",
    meaning: "eine These vorsichtig, aber deutlich zurückweisen",
    promptCue: "Du widersprichst höflich, aber bestimmt einer zu einfachen These.",
  },
  {
    id: "c1-insofern-als",
    level: "C1",
    phrase: "Insofern, als …, lässt sich das begründen.",
    meaning: "eine präzise Begründung mit Einschränkung liefern",
    promptCue: "Du begründest eine Aussage, willst aber eine Bedingung präzise einbauen.",
  },
  {
    id: "c2-keineswegs-von-der-hand-zu-weisen",
    level: "C2",
    phrase: "Das ist keineswegs von der Hand zu weisen.",
    meaning: "ein Argument als durchaus berechtigt anerkennen",
    promptCue:
      "Ein Gesprächspartner bringt ein starkes Gegenargument. Erkenne es ausdrücklich an.",
  },
  {
    id: "c2-mitnichten",
    level: "C2",
    phrase: "Das trifft mitnichten zu.",
    meaning: "eine gehobene, entschiedene Zurückweisung",
    promptCue: "Du widersprichst einer Behauptung entschieden und in gehobenem Stil.",
  },
  {
    id: "c2-gleichwohl",
    level: "C2",
    phrase: "Gleichwohl bleibt festzuhalten, dass …",
    meaning: "trotz eines vorher genannten Einwands eine Position behaupten",
    promptCue:
      "Du hast einen Einwand akzeptiert, willst deine Kernaussage aber dennoch festhalten.",
  },
] as const;

export function formulaicSequencesForLevel(
  level: CefrLevel,
): readonly FormulaicSequence[] {
  const exact = FORMULAIC_SEQUENCES.filter((entry) => entry.level === level);
  return exact.length > 0 ? exact : FORMULAIC_SEQUENCES;
}
