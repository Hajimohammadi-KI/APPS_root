import type { Language } from "./contracts";

/** Deliberately small grammars, not a general language checker. Every parse
 * consumes the whole sentence and returns roles before task relevance is judged. */
export type RuleId =
  | "en.inflection"
  | "de.inflection"
  | "en.valency"
  | "de.valency"
  | "en.temporal"
  | "de.temporal"
  | "en.clause"
  | "de.clause"
  | "en.voice"
  | "de.voice"
  | "en.discourse"
  | "de.discourse";
export interface ConstructionParse {
  frame: string[];
  target: boolean;
  grammarError: string | null;
  canonical: string;
}
export const CONSTRUCTION_RULE_VERSION = "1.0.0";
const cap = (s: string) => s.slice(0, 1).toUpperCase() + s.slice(1);
const names = (s: string) => s.replace(/\b(mina|omar)\b/g, cap);
const result = (
  text: string,
  frame: string[],
  error: string | null = null,
  target = true,
): ConstructionParse => ({
  frame,
  target,
  grammarError: error,
  canonical: cap(names(text)),
});

export function parseConstruction(
  rule: RuleId,
  text: string,
): ConstructionParse | null {
  // No substring matching, quote stripping, spelling correction or case-folded grading.
  // Case is checked against a reconstructed written form after syntax is parsed.
  if (text.length > 500) return null;
  const s = text.toLowerCase();
  let m: RegExpMatchArray | null;
  switch (rule) {
    case "en.inflection": {
      m = s.match(
        /^(?:(every day|every evening),? )?(mina|omar|they) (work|works|study|studies) (in the library|at home)(?: (every day|every evening))?$/,
      );
      if (!m || !!m[1] === !!m[5]) return null;
      const [, before, actor, verb, place, after] = m;
      const action = verb!.startsWith("work") ? "work" : "study";
      const expected =
        actor === "they" ? action : action === "work" ? "works" : "studies";
      return result(
        s,
        [actor!, action, place!, (before || after)!],
        verb === expected ? null : "agreement",
      );
    }
    case "de.inflection": {
      m = s.match(
        /^(ich erkläre|wir erklären|ich arbeite mit|wir arbeiten mit) (der|den|dem) (neue|neuen|neuem) (plan|ansatz)$/,
      );
      let phrase: string, article: string, adjective: string, noun: string;
      if (m) [, phrase = "", article = "", adjective = "", noun = ""] = m;
      else {
        m = s.match(
          /^(mit )?(der|den|dem) (neue|neuen|neuem) (plan|ansatz) (erkläre ich|erklären wir|arbeite ich|arbeiten wir)$/,
        );
        if (!m || !!m[1] !== m[5]!.startsWith("arbeit")) return null;
        phrase =
          (m[5]!.endsWith("ich") ? "ich " : "wir ") +
          (m[1] ? "arbeite mit" : "erkläre");
        article = m[2]!;
        adjective = m[3]!;
        noun = m[4]!;
      }
      const withDative = phrase!.includes("mit");
      const parsed = result(
        s,
        [
          phrase!.startsWith("ich") ? "ich" : "wir",
          withDative ? "work" : "explain",
          noun!,
        ],
        article === (withDative ? "dem" : "den") && adjective === "neuen"
          ? null
          : "case-ending",
      );
      parsed.canonical = parsed.canonical.replace(/\b(plan|ansatz)\b/g, cap);
      return parsed;
    }
    case "en.valency": {
      m = s.match(
        /^(mina|omar) (depend|depends|rely|relies) (on|upon|to|with) (mina|omar)$/,
      );
      if (!m) return null;
      const [, actor, verb, prep, object] = m;
      return result(
        s,
        [actor!, "depend", object!],
        !["depends", "relies"].includes(verb!)
          ? "agreement"
          : ["on", "upon"].includes(prep!)
            ? null
            : "valency",
      );
    }
    case "de.valency": {
      m = s.match(
        /^(?:(gestern) (hat|ist) (mina|omar)|(mina|omar) (hat|ist)) (?:((?:mit )?(?:mina|omar)) gestern|(?:gestern )?((?:mit )?(?:mina|omar))) (kontaktiert|kontaktieren)$/,
      );
      if (!m) return null;
      // The two supported positions still require the stated time exactly once.
      if ((s.match(/\bgestern\b/g) ?? []).length !== 1) return null;
      const actor = m[3] || m[4],
        aux = m[2] || m[5],
        object = m[6] || m[7];
      return result(
        s,
        [actor!, "contact", object!.replace(/^mit /, ""), "gestern"],
        object!.startsWith("mit ")
          ? "valency"
          : aux !== "hat" || m[8] !== "kontaktiert"
            ? "perfect"
            : null,
      );
    }
    case "en.temporal": {
      m = s.match(
        /^(?:(yesterday|last monday),? )?(mina|omar) (finished|has finished|have finished|did finish) the report(?: (yesterday|last monday))?$/,
      );
      if (!m || !!m[1] === !!m[4]) return null;
      const parsed = result(
        s,
        [m[2]!, "finish", "report", (m[1] || m[4])!],
        m[3]!.includes("have") || m[3]!.includes("has")
          ? "finished-time"
          : null,
      );
      parsed.canonical = parsed.canonical.replace(/\bmonday\b/g, "Monday");
      return parsed;
    }
    case "de.temporal": {
      m = s.match(
        /^(?:(gestern|am montag) (hat|ist) (mina|omar)|(mina|omar) (hat|ist) (gestern|am montag)) den bericht (geschrieben|schreiben)$/,
      );
      let actor: string, aux: string, time: string, verb: string;
      if (m) {
        actor = (m[3] || m[4])!;
        aux = (m[2] || m[5])!;
        time = (m[1] || m[6])!;
        verb = m[7]!;
      } else {
        m = s.match(
          /^(mina|omar) (hat|ist) den bericht (gestern|am montag) (geschrieben|schreiben)$/,
        );
        if (!m) return null;
        actor = m[1]!;
        aux = m[2]!;
        time = m[3]!;
        verb = m[4]!;
      }
      const parsed = result(
        s,
        [actor, "write", "report", time],
        aux !== "hat" || verb !== "geschrieben" ? "perfect" : null,
      );
      parsed.canonical = parsed.canonical.replace(/\b(bericht|montag)\b/g, cap);
      return parsed;
    }
    case "en.clause": {
      m = s.match(
        /^(mina|omar) (says|say) (?:that )?(mina|omar) (is ready|ready is)$/,
      );
      if (!m) return null;
      return result(
        s,
        [m[1]!, "say", m[3]!, "ready"],
        m[2] !== "says"
          ? "agreement"
          : m[4] !== "is ready"
            ? "clause-order"
            : null,
      );
    }
    case "de.clause": {
      m = s.match(
        /^(mina|omar) bleibt zu hause, weil (mina|omar) (krank ist|ist krank)$/,
      );
      let actor: string, reason: string, correct: boolean;
      if (m) {
        actor = m[1]!;
        reason = m[2]!;
        correct = m[3] === "krank ist";
      } else {
        m = s.match(
          /^weil (mina|omar) (krank ist|ist krank), (bleibt (mina|omar)|(mina|omar) bleibt) zu hause$/,
        );
        if (!m) return null;
        actor = (m[4] || m[5])!;
        reason = m[1]!;
        correct = m[2] === "krank ist" && !!m[4];
      }
      const parsed = result(
        s,
        [actor, "stay-home", reason, "ill"],
        correct ? null : "clause-order",
      );
      parsed.canonical = parsed.canonical.replace(/\bhause\b/g, "Hause");
      return parsed;
    }
    case "en.voice": {
      m = s.match(
        /^the (report|door) (must|has to|can) (be |is )?(checked|check|opened|open)$/,
      );
      if (!m) return null;
      const action = m[4]!.startsWith("check") ? "check" : "open";
      return result(
        s,
        [m[1]!, m[2] === "has to" ? "must" : m[2]!, action],
        m[3] === "be " && ["checked", "opened"].includes(m[4]!)
          ? null
          : "modal-passive",
      );
    }
    case "de.voice": {
      m = s.match(
        /^(der bericht|die tür) (muss|kann) (geprüft|prüfen|geöffnet|öffnen)(?: (werden|wird))?$/,
      );
      if (!m) {
        const front = s.match(
          /^(geprüft|geöffnet) werden (muss|kann) (der bericht|die tür)$/,
        );
        if (!front) return null;
        m = [front[0]!, front[3]!, front[2]!, front[1]!, "werden"];
      }
      const parsed = result(
        s,
        [
          m[1] === "der bericht" ? "report" : "door",
          m[2]!,
          ["geprüft", "prüfen"].includes(m[3]!) ? "check" : "open",
        ],
        ["geprüft", "geöffnet"].includes(m[3]!) && m[4] === "werden"
          ? null
          : "modal-passive",
      );
      parsed.canonical = parsed.canonical.replace(/\b(bericht|tür)\b/g, cap);
      return parsed;
    }
    case "en.discourse": {
      m = s.match(
        /^(although|though|because) (mina|omar) is tired, (mina|omar) (keeps|keep) working$/,
      );
      if (m)
        return result(
          s,
          [m[2]!, "tired", m[3]!, "working"],
          m[4] === "keeps" ? null : "agreement",
          m[1] !== "because",
        );
      m = s.match(
        /^(mina|omar) (keeps|keep) working (although|though|because) (mina|omar) is tired$/,
      );
      if (m)
        return result(
          s,
          [m[4]!, "tired", m[1]!, "working"],
          m[2] === "keeps" ? null : "agreement",
          m[3] !== "because",
        );
      m = s.match(
        /^(mina|omar) is tired, but (mina|omar) (keeps|keep) working$/,
      );
      if (m)
        return result(
          s,
          [m[1]!, "tired", m[2]!, "working"],
          m[3] === "keeps" ? null : "agreement",
        );
      return null;
    }
    case "de.discourse": {
      m = s.match(
        /^(obwohl|weil) (mina|omar) müde ist, (arbeitet (mina|omar)|(mina|omar) arbeitet) weiter$/,
      );
      if (m)
        return result(
          s,
          [m[2]!, "tired", (m[4] || m[5])!, "working"],
          m[4] ? null : "clause-order",
          m[1] === "obwohl",
        );
      m = s.match(
        /^(mina|omar) arbeitet weiter, (obwohl|weil) (mina|omar) (müde ist|ist müde)$/,
      );
      if (m)
        return result(
          s,
          [m[3]!, "tired", m[1]!, "working"],
          m[4] === "müde ist" ? null : "clause-order",
          m[2] === "obwohl",
        );
      m = s.match(
        /^(mina|omar) ist müde, (aber (mina|omar) arbeitet|trotzdem arbeitet (mina|omar)) weiter$/,
      );
      if (m) return result(s, [m[1]!, "tired", (m[3] || m[4])!, "working"]);
      return null;
    }
  }
}

export function constructionFeedback(code: string, language: Language): string {
  const entries: Record<string, [string, string]> = {
    agreement: [
      "Check agreement between the subject and the finite verb.",
      "Prüfe die Kongruenz zwischen Subjekt und finitem Verb.",
    ],
    "case-ending": [
      "Check the article and adjective ending for the required case.",
      "Prüfe Artikel und Adjektivendung: erklären + Akkusativ; mit + Dativ.",
    ],
    valency: [
      "Check the verb's complement: depend/rely on someone.",
      "Kontaktieren hat ein Akkusativobjekt ohne mit.",
    ],
    perfect: [
      "Check the auxiliary and past participle.",
      "Prüfe haben und das Partizip II.",
    ],
    "finished-time": [
      "Use a past form for this event at a specified, finished past time.",
      "Verwende für diese abgeschlossene Zeitangabe eine passende Vergangenheitsform.",
    ],
    "clause-order": [
      "Check the subject–verb order in this statement.",
      "Prüfe die Stellung des finiten Verbs im Nebensatz und im anschließenden Hauptsatz. Die Aufgabe verlangt geschriebenes Standarddeutsch.",
    ],
    "modal-passive": [
      "Use modal + be + past participle for this passive meaning.",
      "Verwende Modalverb + Partizip II + werden für diese Passivbedeutung.",
    ],
    capitalization: [
      "Check sentence starts, names and day names.",
      "Prüfe Satzanfänge, Eigennamen und die Großschreibung der Nomen.",
    ],
    relevance: [
      "This sentence changes the people, roles, action or time in the situation. Keep those facts.",
      "Dieser Satz verändert Personen, Rollen, Handlung oder Zeit der Situation. Behalte diese Angaben bei.",
    ],
    target: [
      "This is a reason, but the task asks you to express a contrast.",
      "Das ist eine Begründung. Die Aufgabe verlangt einen Gegensatz.",
    ],
    pass: [
      "The sentence expresses the requested pattern and preserves the situation. This is practice feedback.",
      "Der Satz verwendet das gefragte Muster und erhält die Bedeutung der Situation. Dies ist eine Übungsrückmeldung.",
    ],
  };
  return (entries[code] ?? entries.pass)![language === "en" ? 0 : 1];
}
