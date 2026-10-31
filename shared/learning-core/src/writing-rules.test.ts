import { expect, test } from "bun:test";
import { writingIssues } from "./writing-rules";
import { countPerfectUses } from "./english-lexicon";
import { CORRECT_DE, CORRECT_EN } from "./writing-precision-fixtures";

test("R100 RED reviewed correct sentences outside the curriculum raise no issue", () => {
  const flagged = [
    ...CORRECT_EN.map((text) => ({ text, issues: writingIssues(text, "en") })),
    ...CORRECT_DE.map((text) => ({ text, issues: writingIssues(text, "de") })),
  ]
    .filter((row) => row.issues.length)
    .map(
      (row) =>
        `${row.text} :: ${row.issues.map((i) => `${i.ruleId} ${i.original}→${i.replacement}`).join(", ")}`,
    );
  expect(flagged).toEqual([]);
});
test("R97 RED unambiguous learner errors in reviewed contexts are found", () => {
  const cases: ReadonlyArray<readonly ["en" | "de", string, string, string]> = [
    ["en", "Did you went to the party?", "EN_AUXILIARY_BASE", "go"],
    ["en", "She did not went home.", "EN_AUXILIARY_BASE", "go"],
    ["en", "He does not goes to school.", "EN_AUXILIARY_BASE", "go"],
    ["en", "If he have time, he will call.", "EN_SUBJECT_AGREEMENT", "has"],
    ["en", "We had a hour-long meeting.", "EN_INITIAL_SOUND", "an"],
    ["en", "It is only a hour's drive.", "EN_INITIAL_SOUND", "an"],
    ["en", "She gave me an advice yesterday.", "EN_UNCOUNTABLE", "some"],
    ["en", "Many advice is useless.", "EN_UNCOUNTABLE", "Some"],
    ["en", "I love london's parks.", "EN_PROPER_NAME", "London's"],
    ["en", "I don't enjoy to watch TV.", "EN_VERB_COMPLEMENT", "watching"],
    ["en", "I enjoy to dance.", "EN_VERB_COMPLEMENT", "dancing"],
    ["de", "Gestern ich war krank.", "DE_V2", "war ich"],
    ["de", "Morgen wir fahren nach Berlin.", "DE_V2", "fahren wir"],
    ["de", "Heute ich spiele Fußball.", "DE_V2", "spiele ich"],
    [
      "de",
      "Ich bleibe zu Hause, weil ich bin sehr müde.",
      "DE_SUBORDINATE_FINAL",
      "weil ich sehr müde bin",
    ],
    [
      "de",
      "Ich esse, weil ich habe Hunger.",
      "DE_SUBORDINATE_FINAL",
      "weil ich Hunger habe",
    ],
    [
      "de",
      "Ich bleibe, weil wir müssen arbeiten.",
      "DE_SUBORDINATE_FINAL",
      "weil wir arbeiten müssen",
    ],
    ["de", "Wir haben pünktlich angekommen.", "DE_PERFEKT_AUXILIARY", "sind"],
    [
      "de",
      "Ich habe gestern nach Berlin gefahren.",
      "DE_PERFEKT_AUXILIARY",
      "bin",
    ],
    ["de", "Ich spreche mit der Mann.", "DE_NOUN_GENDER_CASE", "dem"],
    ["de", "Das ist für der Frau.", "DE_NOUN_GENDER_CASE", "die"],
    ["de", "Ich helfe dem neuen Student.", "DE_WEAK_NOUN", "Studenten"],
    ["de", "Das ist unser haus.", "DE_NOUN_CAPITAL", "Haus"],
  ];
  const missed = cases
    .filter(
      ([language, text, ruleId, replacement]) =>
        !writingIssues(text, language).some(
          (i) => i.ruleId === ruleId && i.replacement === replacement,
        ),
    )
    .map(
      ([, text, ruleId, replacement]) => `${text} :: ${ruleId}→${replacement}`,
    );
  expect(missed).toEqual([]);
});
test("R97 RED reviewed contexts that must still abstain", () => {
  for (const [language, text] of [
    ["en", "Mary and he have arrived."],
    ["en", "Did she say anything?"],
    ["en", "They do needs assessments every year."],
    ["en", "Ask for a research grant."],
    ["en", "A apple a day is a myth."],
    ["de", "Ich fahre ihn nach Hamburg."],
    ["de", "Er hat ihn nach Hamburg gefahren."],
    ["de", "Ich habe mich umgezogen."],
    ["de", "Ich spreche mit der Frau."],
    ["de", "Für die Frau ist das wichtig."],
    ["de", "Ich warte, weil wir arbeiten gehen."],
    ["de", "Habe ich das Buch?"],
  ] as const) {
    const issues = writingIssues(text, language);
    // "A apple" keeps its sentence-initial article check.
    if (text.startsWith("A apple"))
      expect(issues.map((i) => i.replacement)).toEqual(["An"]);
    else expect(issues).toEqual([]);
  }
});

test("W12 a/an follows known initial sounds and abstains on ambiguous words", () => {
  for (const text of [
    "an hour",
    "an honest person",
    "a university",
    "a European city",
    "a one-way street",
    "an apple",
    "a user",
    "an herb",
    "a herb",
    "an SQL query",
  ])
    expect(writingIssues(text, "en")).toEqual([]);
  for (const text of ["a hour", "an university", "a apple", "an user"])
    expect(writingIssues(text, "en")[0]?.ruleId).toBe("EN_INITIAL_SOUND");
});
test("W14 participle lexicon excludes suffix lookalikes and includes irregular forms", () => {
  expect(countPerfectUses("I have a pen. She has green eyes.")).toBe(0);
  expect(
    countPerfectUses("I have sung. She has swum. We have practised."),
  ).toBe(3);
  expect(writingIssues("She doesn't kiss. I did need help.", "en")).toEqual([]);
  expect(
    writingIssues("She doesn't goes. He did went.", "en").map(
      (i) => i.replacement,
    ),
  ).toEqual(["go", "go"]);
});
test("W13 agreement respects questions, modals, subjunctives and noun phrase heads", () => {
  for (const text of [
    "Does she have a car?",
    "He may have left.",
    "I insist that he have a chance.",
    "She and he have arrived.",
  ])
    expect(
      writingIssues(text, "en").filter(
        (i) => i.ruleId === "EN_SUBJECT_AGREEMENT",
      ),
    ).toEqual([]);
  expect(
    writingIssues("The list of items are ready.", "en").some(
      (i) => i.ruleId === "EN_SUBJECT_AGREEMENT",
    ),
  ).toBe(true);
  expect(writingIssues("The lists of items are ready.", "en")).toEqual([]);
  expect(
    writingIssues("He have a car.", "en").some((i) => i.replacement === "has"),
  ).toBe(true);
  expect(
    writingIssues("I know he have a car.", "en").some(
      (i) => i.replacement === "has",
    ),
  ).toBe(true);
});
test("W15 countability and verb complements use a narrow lexicon", () => {
  for (const text of [
    "I need some advice.",
    "I ordered two coffees.",
    "I stopped to smoke.",
    "I stopped smoking.",
    "I enjoy reading books.",
  ])
    expect(writingIssues(text, "en")).toEqual([]);
  expect(writingIssues("I need an advice.", "en")[0]?.ruleId).toBe(
    "EN_UNCOUNTABLE",
  );
  expect(writingIssues("I enjoy to read.", "en")[0]?.replacement).toBe(
    "reading",
  );
});
test("W15 RED noun modifiers and a few are not countability errors", () => {
  for (const text of [
    "I work at a research institute.",
    "She has a homework assignment.",
    "Ask at an information desk.",
    "I read a few research papers.",
    "We bought a furniture store.",
  ])
    expect(writingIssues(text, "en")).toEqual([]);
  for (const text of [
    "I need an advice.",
    "She gave me an information about it.",
    "We bought a furniture for the flat.",
    "He has many homework.",
  ])
    expect(writingIssues(text, "en")[0]?.ruleId).toBe("EN_UNCOUNTABLE");
});
test("W13 RED collective group nouns allow notional plural agreement", () => {
  for (const text of [
    "The group of students are arguing among themselves.",
    "The group of students is small.",
  ])
    expect(writingIssues(text, "en")).toEqual([]);
  expect(
    writingIssues("The box of books are heavy.", "en")[0]?.replacement,
  ).toBe("is");
});
test("W16 reviewed proper names preserve unknown and ambiguous names", () => {
  expect(
    writingIssues("I visited berlin on monday.", "en").map(
      (i) => i.replacement,
    ),
  ).toEqual(["Berlin", "Monday"]);
  for (const text of [
    "I may eat turkey.",
    "I met Xanthe and OpenAI.",
    "I visited Berlin on Monday.",
  ])
    expect(writingIssues(text, "en")).toEqual([]);
  expect(writingIssues("Wir essen heute.", "de")).toEqual([]);
});
test("W17 fixed-case prepositions use unambiguous pronouns", () => {
  for (const text of [
    "Er spricht mit mir.",
    "Das ist für mich.",
    "Ich warte auf dich.",
    "Er spricht mit sie.",
  ])
    expect(writingIssues(text, "de")).toEqual([]);
  expect(writingIssues("Er spricht mit mich.", "de")[0]?.replacement).toBe(
    "mir",
  );
  expect(writingIssues("Das ist für mir.", "de")[0]?.replacement).toBe("mich");
});
test("W17 RED ambiguous ihr and conjunction seit are not case errors", () => {
  for (const text of [
    "Ich spreche mit ihr.",
    "Ich gehe zu ihr.",
    "Das Geschenk ist von ihr.",
    "Das ist für ihr Kind.",
    "Ohne ihr Handy geht sie nicht.",
    "Nach ihr kommt er.",
    "Bei ihr ist es schön.",
    "Seit ich in Berlin wohne, lerne ich Deutsch.",
    "Seit du hier bist, ist alles besser.",
    "Seit er arbeitet, hat er wenig Zeit.",
  ])
    expect(writingIssues(text, "de")).toEqual([]);
  expect(writingIssues("Ich wohne seit mich hier.", "de")[0]?.replacement).toBe(
    "mir",
  );
  expect(writingIssues("Er kommt mit ich.", "de")[0]?.replacement).toBe("mir");
});
test("W18 German field order handles V2 and finite-final with replacement infinitive abstention", () => {
  for (const text of [
    "Heute gehe ich nach Hause.",
    "Ich bleibe, weil ich müde bin.",
    "Ich weiß, dass ich habe arbeiten müssen.",
  ])
    expect(writingIssues(text, "de")).toEqual([]);
  expect(writingIssues("Heute ich gehe nach Hause.", "de")[0]?.ruleId).toBe(
    "DE_V2",
  );
  expect(
    writingIssues("Ich bleibe, weil ich bin müde.", "de")[0]?.replacement,
  ).toBe("weil ich müde bin");
  expect(
    writingIssues("Ich warte, weil er ist in Berlin.", "de")[0]?.replacement,
  ).toBe("weil er in Berlin ist");
});
test("W19 Perfekt auxiliary is tied to its own clause and valency", () => {
  for (const text of [
    "Ich habe gelernt. Er ist gegangen.",
    "Er hat das Auto gefahren.",
    "Sie hat das Flugzeug geflogen.",
    "Er ist nach Berlin gefahren.",
  ])
    expect(writingIssues(text, "de")).toEqual([]);
  const issue = writingIssues(
    "Ich habe gelernt. Er hat nach Berlin gefahren.",
    "de",
  )[0];
  expect(issue).toMatchObject({
    ruleId: "DE_PERFEKT_AUXILIARY",
    original: "hat",
    replacement: "ist",
    start: 21,
  });
  expect(writingIssues("Ich habe gegangen.", "de")[0]?.replacement).toBe("bin");
  expect(
    writingIssues("Ich habe schnell nach Hause gegangen.", "de")[0]
      ?.replacement,
  ).toBe("bin");
  expect(
    writingIssues("Er hat heute nicht gekommen.", "de")[0]?.replacement,
  ).toBe("ist");
});
test("W20 German noun capitalization requires a known noun and determiner context", () => {
  expect(writingIssues("Ich lese ein buch.", "de")[0]?.replacement).toBe(
    "Buch",
  );
  for (const text of [
    "Wir lernen morgen.",
    "Ich liebe dich.",
    "Wir essen zusammen.",
    "Das ist gut.",
    "Das neue ist anders.",
  ])
    expect(writingIssues(text, "de")).toEqual([]);
});
test("W21 lexical gender and weak noun inflection respect case context", () => {
  for (const text of [
    "Ich spreche mit einer Frau.",
    "Das ist der Frau wichtig.",
    "Das ist ein Haus.",
    "Ich sehe den Studenten.",
  ])
    expect(writingIssues(text, "de")).toEqual([]);
  expect(
    writingIssues("Ich spreche mit einem Frau.", "de")[0]?.replacement,
  ).toBe("einer");
  expect(writingIssues("Das ist ein Frau.", "de")[0]?.replacement).toBe("eine");
  expect(writingIssues("Ich helfe dem Student.", "de")[0]?.replacement).toBe(
    "Studenten",
  );
});
test("W22 relative agreement keeps case determined by the relative clause", () => {
  expect(
    writingIssues("Die Frau, der hier wohnt, ist nett.", "de")[0]?.replacement,
  ).toBe("die");
  for (const text of [
    "Die Frau, der ich helfe, ist nett.",
    "Die Frau, die hier wohnt, ist nett.",
    "Die Männer, die hier wohnen, sind nett.",
    "Das Mädchen, dem ich helfe, ist nett.",
  ])
    expect(writingIssues(text, "de")).toEqual([]);
});
