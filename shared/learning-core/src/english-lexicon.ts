import { tokenizeText } from "./text";
export const ENGLISH_PARTICIPLES = new Set(
  "been become begun bent bet bitten blown broken brought built burnt burned bought caught chosen come cost cut dealt done drawn dreamt dreamed drunk driven eaten fallen fed felt fought found flown forgotten forgiven frozen got gotten given gone grown hung had heard hidden hit held hurt kept known laid led left lent let lain lit lost made meant met paid put read ridden rung risen run said seen sold sent set shaken shone shot shown shut sung sat slept slid smelt smelled spoken spent spilt spilled split spread stood stolen stuck struck sworn swept swum swung taken taught torn told thought thrown understood woken worn won written worked practised practiced studied visited finished opened closed learned learnt used tried watched played walked helped lived loved arrived called cleaned cooked decided enjoyed explained expected needed offered passed planned prepared received remembered returned started stayed stopped talked tested travelled traveled waited wanted washed written".split(
    " ",
  ),
);
export const ENGLISH_FINITE_TO_BASE: Readonly<Record<string, string>> = {
  goes: "go",
  does: "do",
  has: "have",
  likes: "like",
  works: "work",
  watches: "watch",
  studies: "study",
  wants: "want",
  needs: "need",
  knows: "know",
  sees: "see",
  says: "say",
  went: "go",
  did: "do",
  had: "have",
  saw: "see",
  said: "say",
  ate: "eat",
  wrote: "write",
  took: "take",
  gave: "give",
  came: "come",
  bought: "buy",
  thought: "think",
  wanted: "want",
  needed: "need",
  studied: "study",
  worked: "work",
  visited: "visit",
};
export function countPerfectUses(text: string): number {
  const tokens = tokenizeText(text).map((t) =>
    t.normalized.toLocaleLowerCase("en"),
  );
  let count = 0;
  for (let i = 0; i < tokens.length - 2; i++) {
    const pronoun = ["i", "you", "we", "they", "he", "she", "it"].includes(
      tokens[i]!,
    );
    const noun =
      [
        "friend",
        "teacher",
        "student",
        "mother",
        "father",
        "brother",
        "sister",
        "friends",
        "students",
        "teachers",
      ].includes(tokens[i]!) &&
      ["my", "your", "our", "the", "his", "her", "their"].includes(
        tokens[i - 1] ?? "",
      );
    if (!pronoun && !noun) continue;
    if (!["have", "has"].includes(tokens[i + 1]!)) continue;
    let j = i + 2;
    while (
      [
        "not",
        "never",
        "ever",
        "already",
        "just",
        "recently",
        "yet",
        "still",
      ].includes(tokens[j] ?? "")
    )
      j++;
    if (ENGLISH_PARTICIPLES.has(tokens[j] ?? "")) count++;
  }
  return count;
}
