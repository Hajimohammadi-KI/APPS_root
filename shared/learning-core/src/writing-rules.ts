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
const vowelSound = new Set(
  "hour hours hourly honest honestly honour honourable honor honorable heir heiress apple orange egg elephant idea interesting unusual umbrella uncle urgent early old open excellent expensive effective important independent American English"
    .toLowerCase()
    .split(" "),
);
const consonantSound = new Set(
  "university universities universal uniform union unique unit united useful user European euro one one-way once book car dog house student teacher friend new good big small young year yellow"
    .toLowerCase()
    .split(" "),
);
const properNames = [
  "Berlin",
  "London",
  "Tehran",
  "Germany",
  "England",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
  "January",
  "February",
  "March",
  "April",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
  "English",
  "German",
];
const germanPrepositions = new Set(
  "mit aus bei nach seit von zu für durch ohne gegen um in an auf über unter vor hinter neben zwischen".split(
    " ",
  ),
);

/** High precision, finite lexical scope. Absence of issues never establishes correctness. */
export function writingIssues(
  source: string,
  language: "en" | "de",
): WritingIssue[] {
  // A line break ends a clause (headings, list items) unless the next line
  // continues in lowercase, as in hard-wrapped or pasted text.
  const text = source.slice(0, 20000);
  const issues: WritingIssue[] = [];
  let start = 0;
  for (const match of [...text.matchAll(/\n/gu), null]) {
    const end = match ? match.index : text.length;
    if (match && /^[^\S\n]*\p{Ll}/u.test(text.slice(end + 1))) continue;
    for (const issue of lineIssues(text.slice(start, end), language))
      issues.push({
        ...issue,
        start: issue.start + start,
        end: issue.end + start,
      });
    start = end + 1;
  }
  return issues;
}

function lineIssues(source: string, language: "en" | "de"): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const tokens = tokenizeText(source);
  const lower = tokens.map((t) => t.normalized.toLocaleLowerCase(language));
  const add = (
    index: number,
    replacement: string,
    ruleId: string,
    message: string,
  ) => {
    const token = tokens[index]!;
    issues.push({
      ruleId,
      start: token.start,
      end: token.end,
      original: token.text,
      replacement,
      message,
    });
  };
  const sentenceStart = (i: number): boolean => {
    let j = i - 1;
    while (j >= 0 && /^["'“”„«»‘’(]$/u.test(tokens[j]!.text)) j--;
    // "Mr. An" and "Dr. Weber" continue the sentence.
    if (
      tokens[j]?.text === "." &&
      /^(?:mr|mrs|ms|dr|prof|st|hr|fr)$/u.test(lower[j - 1] ?? "")
    )
      return false;
    return j < 0 || /^[.!?]$/u.test(tokens[j]!.text);
  };
  /** A whole-word capital acronym (IT, AN) is never the pronoun or article. */
  const acronym = (i: number) =>
    (tokens[i]?.text.length ?? 0) > 1 &&
    tokens[i]!.text === tokens[i]!.text.toUpperCase() &&
    /\p{Lu}/u.test(tokens[i]!.text);
  /** Tokens up to the end of the sentence, across commas. */
  const sentenceWords = (from: number): string[] => {
    const words: string[] = [];
    for (
      let j = from;
      j < tokens.length && !/^[.!?]$/u.test(tokens[j]!.text);
      j++
    )
      if (isWord(j)) words.push(lower[j]!);
    return words;
  };
  const capitalized = (i: number) => /^\p{Lu}/u.test(tokens[i]?.text ?? "");
  const isWord = (i: number) => tokens[i]?.kind === "word";
  /** Words up to the next punctuation mark, inside the current clause. */
  const clauseWords = (from: number): string[] => {
    const words: string[] = [];
    for (let j = from; j < tokens.length && isWord(j); j++)
      words.push(lower[j]!);
    return words;
  };
  if (language === "en") {
    // "and" is left out: "you and I did…" is a coordinated subject.
    const clauseStart = (i: number) =>
      sentenceStart(i) ||
      tokens[i - 1]?.text === "," ||
      [
        "but",
        "so",
        "because",
        "although",
        "when",
        "if",
        "then",
        "while",
      ].includes(lower[i - 1] ?? "");
    // A token joined to . @ / # _ belongs to an address or file name.
    const inAddress = (i: number) => {
      const { start, end } = tokens[i]!;
      const before = source[start - 1] ?? "",
        after = source[end] ?? "";
      return (
        /[@/#_\\]/u.test(before) ||
        /[@/#_\\]/u.test(after) ||
        (before === "." && /[\p{L}\p{N}]/u.test(source[start - 2] ?? "")) ||
        (after === "." && /[\p{L}\p{N}]/u.test(source[end + 1] ?? ""))
      );
    };
    for (let i = 0; i < tokens.length; i++) {
      const text = tokens[i]!.text;
      const head = text.split(/['’-]/u)[0]!;
      const expected = properNames.find(
        (name) => name.toLowerCase() === head.toLowerCase(),
      );
      // March/April/June/August can be names or ordinary words in special contexts.
      if (
        expected &&
        !["March", "April", "June", "August"].includes(expected) &&
        head === expected.toLowerCase() &&
        !inAddress(i) &&
        // Billiards: "put english on the ball", "left english" (spin).
        !(
          head === "english" &&
          (lower[i + 1] === "on" ||
            [
              "left",
              "right",
              "side",
              "reverse",
              "running",
              "top",
              "bottom",
              "inside",
              "outside",
            ].includes(lower[i - 1] ?? ""))
        )
      )
        add(
          i,
          expected + text.slice(head.length),
          "EN_PROPER_NAME",
          "Capitalize this place, language, day or unambiguous month name.",
        );
    }
    // A following noun makes the uncountable word a modifier (a research
    // institute, a research and development plan); only a clear clause
    // continuation shows that it is the head noun.
    const clauseBoundary = new Set(
      "for about on from to with is was are were in at that which today now here there yesterday tomorrow again too".split(
        " ",
      ),
    );
    for (let i = 0; i < tokens.length - 1; i++) {
      const after = tokens[i + 2];
      if (
        (!after ||
          (after.kind !== "word" && !["/", "&"].includes(after.text)) ||
          clauseBoundary.has(lower[i + 2]!)) &&
        !(lower[i] === "few" && lower[i - 1] === "a") &&
        // many/few research: research is also a verb.
        !(["many", "few"].includes(lower[i]!) && lower[i + 1] === "research") &&
        // A filed information is a countable legal document.
        !(
          lower[i + 1] === "information" &&
          ["file", "files", "filed", "lodged"].includes(lower[i - 1] ?? "")
        ) &&
        [
          "advice",
          "information",
          "furniture",
          "equipment",
          "homework",
          "luggage",
          "research",
        ].includes(lower[i + 1]!) &&
        ["a", "an", "many", "few"].includes(lower[i]!)
      )
        add(
          i,
          capitalized(i) ? "Some" : "some",
          "EN_UNCOUNTABLE",
          "This noun is uncountable in this use; use some or a suitable unit phrase.",
        );
      const gerunds: Readonly<Record<string, string>> = {
        read: "reading",
        swim: "swimming",
        cook: "cooking",
        play: "playing",
        learn: "learning",
        walk: "walking",
        watch: "watching",
        dance: "dancing",
        sing: "singing",
      };
      if (
        ["enjoy", "enjoys", "enjoyed", "enjoying"].includes(lower[i]!) &&
        lower[i + 1] === "to" &&
        gerunds[lower[i + 2] ?? ""]
      ) {
        const from = tokens[i + 1]!,
          to = tokens[i + 2]!;
        issues.push({
          ruleId: "EN_VERB_COMPLEMENT",
          start: from.start,
          end: to.end,
          original: source.slice(from.start, to.end),
          replacement: gerunds[lower[i + 2]!]!,
          message: "Enjoy takes an -ing complement, not a to-infinitive.",
        });
      }
    }
    // do-support needs the base form. Only a clause-initial subject is
    // checked: "What I did had…" and "the ones I didn't had…" are complete.
    const subjects = ["i", "you", "he", "she", "it", "we", "they"];
    const negatedAux = [
      "doesn't",
      "doesn’t",
      "didn't",
      "didn’t",
      "don't",
      "don’t",
    ];
    // Plural nouns as well as verbs: "they did studies", "they do needs assessments".
    const nounHomographs = new Set([
      "studies",
      "works",
      "likes",
      "needs",
      "wants",
      "watches",
    ]);
    const auxiliaryBase = (verbIndex: number, allowHomograph: boolean) => {
      const verb = lower[verbIndex] ?? "";
      const base = ENGLISH_FINITE_TO_BASE[verb];
      if (base && (allowHomograph || !nounHomographs.has(verb)))
        add(
          verbIndex,
          base,
          "EN_AUXILIARY_BASE",
          "After do/does/did, use the base form of the main verb.",
        );
    };
    for (let i = 0; i < tokens.length - 2; i++) {
      const aux = lower[i + 1]!;
      if (
        subjects.includes(lower[i]!) &&
        clauseStart(i) &&
        (negatedAux.includes(aux) || ["did", "does", "do"].includes(aux))
      ) {
        const not = ["not", "never"].includes(lower[i + 2]!);
        auxiliaryBase(not ? i + 3 : i + 2, not || negatedAux.includes(aux));
      }
      // Questions: Did you went…? Does she likes…?
      if (
        sentenceStart(i) &&
        (negatedAux.includes(lower[i]!) ||
          ["did", "does", "do"].includes(lower[i]!)) &&
        subjects.includes(lower[i + 1]!)
      )
        auxiliaryBase(i + 2, true);
    }
    // Verbs whose object can be you or it: "Anyone who knows you has…".
    const cueVerbs = [
      "know",
      "knows",
      "knew",
      "think",
      "thinks",
      "thought",
      "believe",
      "believes",
      "believed",
    ];
    for (let i = 0; i < tokens.length - 1; i++) {
      const subject = lower[i]!,
        verb = lower[i + 1]!;
      const afterCueVerb = cueVerbs.includes(lower[i - 1] ?? "");
      const clauseInitial =
        sentenceStart(i) ||
        ["because", "although", "when", "if"].includes(lower[i - 1] ?? "") ||
        (lower[i - 1] === "that" && cueVerbs.includes(lower[i - 2] ?? ""));
      if (!clauseInitial && !afterCueVerb) continue;
      const subjectForm =
        clauseInitial || ["i", "he", "she", "we", "they"].includes(subject);
      if (
        subjectForm &&
        ["he", "she", "it"].includes(subject) &&
        verb === "have"
      )
        add(
          i + 1,
          "has",
          "EN_SUBJECT_AGREEMENT",
          "Use has with a singular third-person subject in a direct statement.",
        );
      if (
        subjectForm &&
        ["i", "you", "we", "they"].includes(subject) &&
        verb === "has"
      )
        add(
          i + 1,
          "have",
          "EN_SUBJECT_AGREEMENT",
          "Use have with this subject in a direct statement.",
        );
      // A finite, unambiguous head lexicon; no guessing unknown noun number.
      // Collective heads such as group allow notional plural agreement.
      const nounIndex = ["the", "these", "those"].includes(lower[i + 3] ?? "")
        ? i + 4
        : i + 3;
      if (
        clauseInitial &&
        subject === "the" &&
        ["list", "box", "lists", "boxes"].includes(verb) &&
        lower[i + 2] === "of" &&
        ["items", "books", "students"].includes(lower[nounIndex] ?? "")
      ) {
        const finite = lower[nounIndex + 1],
          plural = ["lists", "boxes"].includes(verb);
        if (finite === (plural ? "is" : "are"))
          add(
            nounIndex + 1,
            plural ? "are" : "is",
            "EN_SUBJECT_AGREEMENT",
            "The verb agrees with the head noun, before the of-phrase.",
          );
      }
    }
    for (let i = 0; i < tokens.length - 1; i++) {
      const article = lower[i]!;
      if (article !== "a" && article !== "an") continue;
      // A capital letter mid-sentence is a label (vitamin A) or a name (An).
      if (tokens[i]!.text !== article && !sentenceStart(i)) continue;
      const next = lower[i + 1]!.split(/['’-]/u)[0]!;
      if (
        (article === "a" && vowelSound.has(next)) ||
        (article === "an" && consonantSound.has(lower[i + 1]!)) ||
        (article === "an" && consonantSound.has(next))
      ) {
        let replacement = article === "a" ? "an" : "a";
        if (tokens[i]!.text[0] === "A")
          replacement = replacement[0]!.toUpperCase() + replacement.slice(1);
        add(
          i,
          replacement,
          "EN_INITIAL_SOUND",
          "Choose a/an by the initial sound, not the first letter.",
        );
      }
    }
  }
  if (language === "de") {
    for (let i = 2; i < tokens.length - 3; i++) {
      if (
        tokens[i]!.text !== "," ||
        !["der", "die", "das"].includes(lower[i + 1]!) ||
        lower[i + 2] !== "hier"
      )
        continue;
      // The antecedent must be a determiner + noun phrase of its own, not
      // an attribute: "die Frau mit dem Kind, die…", "das Kind der Frau, das…".
      if (
        ![
          "der",
          "die",
          "das",
          "den",
          "dem",
          "ein",
          "eine",
          "einen",
          "einem",
        ].includes(lower[i - 2]!)
      )
        continue;
      if (
        i - 3 >= 0 &&
        (germanPrepositions.has(lower[i - 3]!) ||
          (isWord(i - 3) && capitalized(i - 3) && !sentenceStart(i - 3)))
      )
        continue;
      const noun = GERMAN_NOUNS[tokens[i - 1]!.normalized];
      const plural = Object.values(GERMAN_NOUNS).some(
        (n) => n.plural === tokens[i - 1]!.normalized,
      );
      const verb = lower[i + 3]!;
      if (
        (!noun || !["wohnt", "arbeitet"].includes(verb)) &&
        (!plural || !["wohnen", "arbeiten"].includes(verb))
      )
        continue;
      const expected = plural
        ? "die"
        : noun!.gender === "m"
          ? "der"
          : noun!.gender === "f"
            ? "die"
            : "das";
      if (lower[i + 1] !== expected)
        add(
          i + 1,
          expected,
          "DE_RELATIVE_AGREEMENT",
          "Das als Subjekt verwendete Relativpronomen stimmt mit dem Bezugsnomen in Genus und Numerus überein.",
        );
    }
    // um/ohne … zu and um … willen are not the case-governing prepositions.
    const infinitiveClause = (i: number) =>
      ["um", "ohne"].includes(lower[i]!) &&
      clauseWords(i + 1).some((w) => w === "zu" || w === "willen");
    const fixedPhrase = (i: number) =>
      (lower[i] === "zu" && lower[i - 1] === "und" && lower[i - 2] === "ab") ||
      (lower[i] === "durch" && lower[i - 1] === "und") ||
      (lower[i] === "für" && lower[i - 1] === "was");
    for (let i = 1; i < tokens.length; i++) {
      const noun = GERMAN_NOUNS[tokens[i]!.normalized];
      if (!noun) continue;
      const article = lower[i - 1]!,
        prep = lower[i - 2] ?? "";
      const governed =
        i >= 2 && !fixedPhrase(i - 2) && !infinitiveClause(i - 2);
      const nounCase =
        governed && ["mit", "aus", "bei", "von", "zu"].includes(prep)
          ? "dat"
          : governed && ["für", "durch", "ohne", "gegen", "um"].includes(prep)
            ? "acc"
            : lower[i - 2] === "ist" &&
                lower[i - 3] === "das" &&
                (!tokens[i + 1] || /[.!?]/u.test(tokens[i + 1]!.text))
              ? "nom"
              : null;
      if (nounCase && /^(?:ein|eine|einen|einem|einer|eines)$/u.test(article)) {
        const expected =
          nounCase === "dat"
            ? noun.gender === "f"
              ? "einer"
              : "einem"
            : noun.gender === "f"
              ? "eine"
              : nounCase === "acc" && noun.gender === "m"
                ? "einen"
                : "ein";
        if (article !== expected)
          add(
            i - 1,
            expected,
            "DE_NOUN_GENDER_CASE",
            "Artikel und Nomen müssen in Genus und Kasus zusammenpassen.",
          );
      }
      if (
        nounCase &&
        nounCase !== "nom" &&
        /^(?:der|die|das|den|dem|des)$/u.test(article)
      ) {
        const expected =
          nounCase === "dat"
            ? noun.gender === "f"
              ? "der"
              : "dem"
            : noun.gender === "m"
              ? "den"
              : noun.gender === "f"
                ? "die"
                : "das";
        if (article !== expected)
          add(
            i - 1,
            expected,
            "DE_NOUN_GENDER_CASE",
            "Artikel und Nomen müssen in Genus und Kasus zusammenpassen.",
          );
      }
      // One inflected adjective may stand between article and noun.
      const articleIndex =
        isWord(i - 1) &&
        !capitalized(i - 1) &&
        /en$/u.test(lower[i - 1]!) &&
        !["den", "dem", "einen", "einem", "des", "eines"].includes(
          lower[i - 1]!,
        )
          ? i - 2
          : i - 1;
      if (
        noun.weak &&
        ["dem", "einem", "des", "eines", "den", "einen"].includes(
          lower[articleIndex] ?? "",
        ) &&
        // ", mit dem Student und Professor kämpfen": a relative pronoun.
        !(
          germanPrepositions.has(lower[articleIndex - 1] ?? "") &&
          tokens[articleIndex - 2]?.text === ","
        )
      )
        add(
          i,
          noun.plural,
          "DE_WEAK_NOUN",
          "Dieses schwache maskuline Nomen erhält außerhalb des Nominativs Singular die Endung -en.",
        );
    }
    for (let i = 1; i < tokens.length; i++) {
      const noun = GERMAN_NOUN_CORPUS[lower[i]!];
      if (
        noun &&
        noun.upper >= 3 &&
        noun.lower === 0 &&
        tokens[i]!.text === lower[i] &&
        [
          "der",
          "die",
          "das",
          "den",
          "dem",
          "des",
          "ein",
          "eine",
          "einen",
          "einem",
          "einer",
          "eines",
          "mein",
          "meine",
          "dein",
          "deine",
          "sein",
          "seine",
          "ihr",
          "ihre",
          "unser",
          "unsere",
          "euer",
          "eure",
          "kein",
          "keine",
        ].includes(lower[i - 1]!) &&
        // "Den buch bitte heute noch!": buchen as an imperative.
        !(
          lower[i] === "buch" &&
          sentenceStart(i - 1) &&
          [
            "bitte",
            "doch",
            "mal",
            "schnell",
            "sofort",
            "heute",
            "jetzt",
            "noch",
          ].includes(lower[i + 1] ?? "")
        )
      )
        add(
          i,
          noun.noun,
          "DE_NOUN_CAPITAL",
          "Dieses durch den Artikel bestimmte Nomen wird großgeschrieben.",
        );
    }
    const sein: Readonly<Record<string, string>> = {
      habe: "bin",
      hast: "bist",
      hat: "ist",
      haben: "sind",
      habt: "seid",
    };
    for (let i = 0; i < tokens.length; i++) {
      if (!sein[lower[i]!]) continue;
      // Capitalized mid-sentence it is a noun or name: in aller Hast, seine Habe.
      if (capitalized(i) && !sentenceStart(i)) continue;
      let end = i + 1;
      while (
        end < tokens.length &&
        tokens[end]!.kind === "word" &&
        !["und", "oder", "aber", "weil", "dass"].includes(lower[end]!)
      )
        end++;
      const phrase = lower.slice(i + 1, end).join(" ");
      const finalParticiple = lower[end - 1] ?? "";
      const interveningFinite = lower
        .slice(i + 1, end - 1)
        .some((word) =>
          [
            "bin",
            "bist",
            "ist",
            "sind",
            "seid",
            "habe",
            "hast",
            "hat",
            "haben",
            "habt",
            "sei",
            "seien",
            "war",
            "waren",
            "wäre",
            "wären",
          ].includes(word),
        );
      if (
        (!interveningFinite &&
          [
            "gegangen",
            "gekommen",
            "geblieben",
            "gereist",
            "aufgestanden",
            "eingeschlafen",
            "geworden",
            "angekommen",
            "zurückgekommen",
            "gestorben",
            "eingestiegen",
            "ausgestiegen",
          ].includes(finalParticiple)) ||
        /^(?:(?:heute|gestern|schon|bereits|nicht) )?(?:gegangen|gekommen|geblieben|aufgestanden|eingeschlafen|geworden)$/u.test(
          phrase,
        ) ||
        // Only a directional phrase right after the auxiliary: "hat ihn nach
        // Hamburg gefahren" (transitive) does not match.
        /^(?:(?:heute|gestern|schon|bereits|nicht) )?(?:nach [\p{L}]+|zum bahnhof) (?:gefahren|geflogen|gelaufen|gereist|gegangen|gekommen)$/u.test(
          phrase,
        )
      )
        add(
          i,
          sein[lower[i]!]!,
          "DE_PERFEKT_AUXILIARY",
          "Dieses intransitive Perfekt benötigt hier das Hilfsverb sein.",
        );
    }
    const modals = new Set(
      "kann kannst können könnt muss musst müssen müsst will willst wollen wollt darf darfst dürfen dürft soll sollst sollen sollt".split(
        " ",
      ),
    );
    const finite = new Set([
      ..."bin bist ist sind seid habe hast hat haben habt war warst waren wart hatte hattest hatten hattet gehe gehst geht gehen komme kommst kommt kommen lerne lernst lernt lernen arbeite arbeitest arbeitet arbeiten bleibe bleibst bleibt bleiben spiele spielst spielt spielen fahre fährst fährt fahren mache machst macht machen wohne wohnst wohnt wohnen".split(
        " ",
      ),
      ...modals,
    ]);
    const pronouns = new Set("ich du er sie es wir ihr".split(" "));
    for (let i = 0; i < tokens.length - 2; i++) {
      if (
        ["heute", "gestern", "morgen", "danach", "deshalb", "dann"].includes(
          lower[i]!,
        ) &&
        sentenceStart(i) &&
        pronouns.has(lower[i + 1]!) &&
        finite.has(lower[i + 2]!)
      ) {
        const first = tokens[i + 1]!,
          last = tokens[i + 2]!;
        issues.push({
          ruleId: "DE_V2",
          start: first.start,
          end: last.end,
          original: source.slice(first.start, last.end),
          replacement: `${last.text} ${first.text}`,
          message:
            "Im Aussagesatz steht das finite Verb an zweiter Satzgliedposition.",
        });
      }
      if (
        !["weil", "dass", "obwohl", "wenn"].includes(lower[i]!) ||
        !pronouns.has(lower[i + 1]!) ||
        !finite.has(lower[i + 2]!)
      )
        continue;
      let end = i + 3;
      while (end < tokens.length && tokens[end]!.kind === "word") end++;
      const tail = lower.slice(i + 3, end).join(" ");
      // Known predicates only; Ersatzinfinitiv clusters intentionally abstain.
      // A bare infinitive tail needs a modal: "weil wir arbeiten gehen" is final already.
      if (
        !/^(?:(?:sehr|so|wirklich|noch|oft|immer|heute) )?(?:müde|krank|hier|zu hause|in berlin|in london|in der schule|keine zeit|zeit|hunger|durst|ein buch|nach hause)$/u.test(
          tail,
        ) &&
        !(
          /^(?:kommen|gehen|lernen|arbeiten)$/u.test(tail) &&
          modals.has(lower[i + 2]!)
        )
      )
        continue;
      const first = tokens[i]!,
        last = tokens[end - 1]!;
      issues.push({
        ruleId: "DE_SUBORDINATE_FINAL",
        start: first.start,
        end: last.end,
        original: source.slice(first.start, last.end),
        replacement: `${first.text} ${tokens[i + 1]!.text} ${source.slice(tokens[i + 3]!.start, last.end)} ${tokens[i + 2]!.text}`,
        message:
          "Im eingeleiteten Nebensatz steht das finite Verb hier am Ende.",
      });
    }
    // ihr is also dative "her" and possessive, so it never signals a case error.
    const dative: Readonly<Record<string, string>> = {
      ich: "mir",
      mich: "mir",
      du: "dir",
      dich: "dir",
      er: "ihm",
      ihn: "ihm",
      wir: "uns",
    };
    const accusative: Readonly<Record<string, string>> = {
      ich: "mich",
      mir: "mich",
      du: "dich",
      dir: "dich",
      er: "ihn",
      ihm: "ihn",
      wir: "uns",
    };
    for (let i = 0; i < tokens.length - 1; i++) {
      // seit before a nominative pronoun is the conjunction (Seit ich hier wohne).
      if (lower[i] === "seit" && pronouns.has(lower[i + 1]!)) continue;
      // Capitalized "Du" and "Ich" are nouns: mit Du anreden, kein Du ohne Ich.
      if (capitalized(i + 1)) continue;
      if (infinitiveClause(i) || fixedPhrase(i)) continue;
      // A pre-nominal attribute: "für mir unbekannte Wörter".
      if (
        isWord(i + 2) &&
        !capitalized(i + 2) &&
        /(?:e|en|er|es|em)$/u.test(lower[i + 2]!) &&
        isWord(i + 3) &&
        capitalized(i + 3)
      )
        continue;
      const forms = ["mit", "aus", "bei", "nach", "seit", "von", "zu"].includes(
        lower[i]!,
      )
        ? dative
        : ["durch", "für", "gegen", "ohne", "um"].includes(lower[i]!)
          ? accusative
          : null;
      const replacement = forms?.[lower[i + 1]!];
      if (replacement)
        add(
          i + 1,
          replacement,
          "DE_PREPOSITION_CASE",
          "Diese Präposition verlangt hier einen anderen Pronomenkasus.",
        );
    }
  }
  return issues;
}
