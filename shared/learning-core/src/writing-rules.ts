import { tokenizeText } from "./text";
import { ENGLISH_FINITE_TO_BASE } from "./english-lexicon";
import { GERMAN_NOUN_CORPUS, GERMAN_NOUNS } from "./german-nouns";
export { countPerfectUses } from "./english-lexicon";

export interface WritingIssue {
  readonly ruleId: string;
  readonly start: number;
  readonly end: number;
  readonly original: string;
  readonly replacement: string;
  readonly message: string;
}
const vowelSound = new Set("hour hours hourly honest honestly honour honourable honor honorable heir heiress apple orange egg elephant idea interesting unusual umbrella uncle urgent early old open excellent expensive effective important independent American English".toLowerCase().split(" "));
const consonantSound = new Set("university universities universal uniform union unique unit united useful user European euro one one-way once book car dog house student teacher friend new good big small young year yellow".toLowerCase().split(" "));
const properNames = ["Berlin", "London", "Tehran", "Germany", "England", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "January", "February", "March", "April", "June", "July", "August", "September", "October", "November", "December", "English", "German"];

/** High precision, finite lexical scope. Absence of issues never establishes correctness. */
export function writingIssues(source: string, language: "en" | "de"): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const tokens = tokenizeText(source.slice(0, 20000));
  const lower = tokens.map(t => t.normalized.toLocaleLowerCase(language));
  const add = (index: number, replacement: string, ruleId: string, message: string) => {
    const token = tokens[index]!;
    issues.push({ ruleId, start: token.start, end: token.end, original: token.text, replacement, message });
  };
  if (language === "en") {
    for (let i = 0; i < tokens.length; i++) {
      const expected = properNames.find(name => name.toLowerCase() === lower[i]);
      // March/April/June/August can be names or ordinary words in special contexts.
      if (expected && !["March", "April", "June", "August"].includes(expected) && tokens[i]!.text === expected.toLowerCase())
        add(i, expected, "EN_PROPER_NAME", "Capitalize this place, language, day or unambiguous month name.");
    }
    for (let i = 0; i < tokens.length - 1; i++) {
      if (["advice", "information", "furniture", "equipment", "homework", "luggage", "research"].includes(lower[i+1]!) && ["a", "an", "many", "few"].includes(lower[i]!))
        add(i, "some", "EN_UNCOUNTABLE", "This noun is uncountable in this use; use some or a suitable unit phrase.");
      const gerunds: Readonly<Record<string, string>> = { read: "reading", swim: "swimming", cook: "cooking", play: "playing", learn: "learning", walk: "walking" };
      if (["enjoy", "enjoys", "enjoyed"].includes(lower[i]!) && lower[i+1] === "to" && gerunds[lower[i+2] ?? ""]) {
        const from = tokens[i+1]!, to = tokens[i+2]!;
        issues.push({ ruleId: "EN_VERB_COMPLEMENT", start: from.start, end: to.end, original: source.slice(from.start, to.end), replacement: gerunds[lower[i+2]!]!, message: "Enjoy takes an -ing complement, not a to-infinitive." });
      }
    }
    for (let i = 0; i < tokens.length - 2; i++) {
      if (!["i", "you", "he", "she", "it", "we", "they"].includes(lower[i]!)) continue;
      if (!["did", "doesn't", "doesn’t", "didn't", "didn’t"].includes(lower[i+1]!)) continue;
      const base = ENGLISH_FINITE_TO_BASE[lower[i+2]!];
      if (base) add(i+2, base, "EN_AUXILIARY_BASE", "After do/does/did, use the base form of the main verb.");
    }
    for (let i = 0; i < tokens.length - 1; i++) {
      if (i > 0 && !/[.!?]/u.test(tokens[i-1]!.text)) continue;
      const subject = lower[i]!, verb = lower[i+1]!;
      if (["he", "she", "it"].includes(subject) && verb === "have")
        add(i+1, "has", "EN_SUBJECT_AGREEMENT", "Use has with a singular third-person subject in a direct statement.");
      if (["i", "you", "we", "they"].includes(subject) && verb === "has")
        add(i+1, "have", "EN_SUBJECT_AGREEMENT", "Use have with this subject in a direct statement.");
      // A finite, unambiguous head lexicon; no guessing unknown noun number.
      const nounIndex = ["the", "these", "those"].includes(lower[i+3] ?? "") ? i+4 : i+3;
      if (subject === "the" && ["list", "box", "group", "lists", "boxes", "groups"].includes(verb) && lower[i+2] === "of" && ["items", "books", "students"].includes(lower[nounIndex] ?? "")) {
        const finite = lower[nounIndex+1], plural = ["lists", "boxes", "groups"].includes(verb);
        if (finite === (plural ? "is" : "are")) add(nounIndex+1, plural ? "are" : "is", "EN_SUBJECT_AGREEMENT", "The verb agrees with the head noun, before the of-phrase.");
      }
    }
    for (let i = 0; i < tokens.length - 1; i++) {
      const article = lower[i]!, next = lower[i+1]!;
      if ((article === "a" && vowelSound.has(next)) || (article === "an" && consonantSound.has(next))) {
        let replacement = article === "a" ? "an" : "a";
        if (tokens[i]!.text[0] === "A") replacement = replacement[0]!.toUpperCase() + replacement.slice(1);
        add(i, replacement, "EN_INITIAL_SOUND", "Choose a/an by the initial sound, not the first letter.");
      }
    }
  }
  if (language === "de") {
    for (let i = 1; i < tokens.length - 3; i++) {
      if (tokens[i]!.text !== "," || !["der", "die", "das"].includes(lower[i+1]!) || lower[i+2] !== "hier") continue;
      const noun = GERMAN_NOUNS[tokens[i-1]!.normalized];
      const plural = Object.values(GERMAN_NOUNS).some(n => n.plural === tokens[i-1]!.normalized);
      const verb = lower[i+3]!;
      if ((!noun || !["wohnt", "arbeitet"].includes(verb)) && (!plural || !["wohnen", "arbeiten"].includes(verb))) continue;
      const expected = plural ? "die" : noun!.gender === "m" ? "der" : noun!.gender === "f" ? "die" : "das";
      if (lower[i+1] !== expected) add(i+1, expected, "DE_RELATIVE_AGREEMENT", "Das als Subjekt verwendete Relativpronomen stimmt mit dem Bezugsnomen in Genus und Numerus überein.");
    }
    for (let i = 1; i < tokens.length; i++) {
      const noun = GERMAN_NOUNS[tokens[i]!.normalized];
      if (!noun) continue;
      const article = lower[i-1]!, prep = lower[i-2] ?? "";
      const nounCase = ["mit", "aus", "bei", "von", "zu"].includes(prep) ? "dat" : ["für", "durch", "ohne", "gegen", "um"].includes(prep) ? "acc" : lower[i-2] === "ist" && lower[i-3] === "das" && (!tokens[i+1] || /[.!?]/u.test(tokens[i+1]!.text)) ? "nom" : null;
      if (nounCase && /^(?:ein|eine|einen|einem|einer|eines)$/u.test(article)) {
        const expected = nounCase === "dat" ? noun.gender === "f" ? "einer" : "einem" : noun.gender === "f" ? "eine" : nounCase === "acc" && noun.gender === "m" ? "einen" : "ein";
        if (article !== expected) add(i-1, expected, "DE_NOUN_GENDER_CASE", "Artikel und Nomen müssen in Genus und Kasus zusammenpassen.");
      }
      if (noun.weak && ["dem", "einem", "des", "eines", "den", "einen"].includes(article))
        add(i, noun.plural, "DE_WEAK_NOUN", "Dieses schwache maskuline Nomen erhält außerhalb des Nominativs Singular die Endung -en.");
    }
    for (let i = 1; i < tokens.length; i++) {
      const noun = GERMAN_NOUN_CORPUS[lower[i]!];
      if (noun && noun.upper >= 3 && noun.lower === 0 && tokens[i]!.text === lower[i] && ["der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer", "eines", "mein", "meine", "dein", "deine"].includes(lower[i-1]!))
        add(i, noun.noun, "DE_NOUN_CAPITAL", "Dieses durch den Artikel bestimmte Nomen wird großgeschrieben.");
    }
    const sein: Readonly<Record<string, string>> = { habe: "bin", hast: "bist", hat: "ist", haben: "sind", habt: "seid" };
    for (let i = 0; i < tokens.length; i++) {
      if (!sein[lower[i]!]) continue;
      let end = i+1;
      while (end < tokens.length && tokens[end]!.kind === "word" && !["und", "oder", "aber", "weil", "dass"].includes(lower[end]!)) end++;
      const phrase = lower.slice(i+1, end).join(" ");
      if (/^(?:(?:heute|gestern|schon|bereits|nicht) )?(?:gegangen|gekommen|geblieben|aufgestanden|eingeschlafen|geworden)$/u.test(phrase) || /^(?:nach (?:berlin|hause)|zum bahnhof) (?:gefahren|geflogen|gelaufen|gereist|gegangen|gekommen)$/u.test(phrase))
        add(i, sein[lower[i]!]!, "DE_PERFEKT_AUXILIARY", "Dieses intransitive Perfekt benötigt hier das Hilfsverb sein.");
    }
    const finite = new Set("bin bist ist sind seid habe hast hat haben habt kann kannst können könnt muss musst müssen müsst gehe gehst geht gehen komme kommst kommt kommen lerne lernst lernt lernen arbeite arbeitest arbeitet arbeiten bleibe bleibst bleibt bleiben".split(" "));
    const pronouns = new Set("ich du er sie es wir ihr".split(" "));
    for (let i = 0; i < tokens.length - 2; i++) {
      if (["heute", "gestern", "morgen", "danach", "deshalb", "dann"].includes(lower[i]!) && (i === 0 || /[.!?]/u.test(tokens[i-1]!.text)) && pronouns.has(lower[i+1]!) && finite.has(lower[i+2]!)) {
        const first = tokens[i+1]!, last = tokens[i+2]!;
        issues.push({ ruleId: "DE_V2", start: first.start, end: last.end, original: source.slice(first.start, last.end), replacement: `${last.text} ${first.text}`, message: "Im Aussagesatz steht das finite Verb an zweiter Satzgliedposition." });
      }
      if (!["weil", "dass", "obwohl", "wenn"].includes(lower[i]!) || !pronouns.has(lower[i+1]!) || !finite.has(lower[i+2]!)) continue;
      let end = i+3;
      while (end < tokens.length && tokens[end]!.kind === "word") end++;
      const tail = lower.slice(i+3, end).join(" ");
      // Known predicates only; Ersatzinfinitiv clusters intentionally abstain.
      if (!/^(?:müde|krank|hier|zu hause|keine zeit|ein buch|nach hause|kommen|gehen|lernen|arbeiten)$/u.test(tail)) continue;
      const first = tokens[i]!, last = tokens[end-1]!;
      issues.push({ ruleId: "DE_SUBORDINATE_FINAL", start: first.start, end: last.end, original: source.slice(first.start, last.end), replacement: `${first.text} ${tokens[i+1]!.text} ${source.slice(tokens[i+3]!.start, last.end)} ${tokens[i+2]!.text}`, message: "Im eingeleiteten Nebensatz steht das finite Verb hier am Ende." });
    }
    const dative: Readonly<Record<string, string>> = { ich: "mir", mich: "mir", du: "dir", dich: "dir", er: "ihm", ihn: "ihm", wir: "uns", ihr: "euch" };
    const accusative: Readonly<Record<string, string>> = { ich: "mich", mir: "mich", du: "dich", dir: "dich", er: "ihn", ihm: "ihn", wir: "uns", ihr: "euch" };
    for (let i = 0; i < tokens.length - 1; i++) {
      const forms = ["mit", "aus", "bei", "nach", "seit", "von", "zu"].includes(lower[i]!) ? dative : ["durch", "für", "gegen", "ohne", "um"].includes(lower[i]!) ? accusative : null;
      const replacement = forms?.[lower[i+1]!];
      if (replacement) add(i+1, replacement, "DE_PREPOSITION_CASE", "Diese Präposition verlangt hier einen anderen Pronomenkasus.");
    }
  }
  return issues;
}
