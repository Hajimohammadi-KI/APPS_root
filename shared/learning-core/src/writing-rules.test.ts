import { expect, test } from "bun:test";
import { writingIssues } from "./writing-rules";
import { countPerfectUses } from "./english-lexicon";

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
  expect(writingIssues("Ich warte, weil er ist in Berlin.", "de")[0]?.replacement).toBe("weil er in Berlin ist");
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
  expect(writingIssues("Ich habe schnell nach Hause gegangen.", "de")[0]?.replacement).toBe("bin");
  expect(writingIssues("Er hat heute nicht gekommen.", "de")[0]?.replacement).toBe("ist");
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
