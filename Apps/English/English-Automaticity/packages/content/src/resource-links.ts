import type {
  CefrLevel,
  GrammarResource,
  GrammarUnit,
  OnlineResource,
} from "./types";

const LEARN_ENGLISH_BASE =
  "https://learnenglish.britishcouncil.org/free-resources";
const IELTS_SAMPLE_TESTS =
  "https://ielts.org/take-a-test/preparation-resources/sample-test-questions";

function grammarHub(level: CefrLevel | string): string {
  if (level === "A1" || level === "A2" || level === "A1–A2") {
    return `${LEARN_ENGLISH_BASE}/grammar/a1-a2`;
  }
  if (
    level === "B1" ||
    level === "B1+" ||
    level === "B2" ||
    level === "B1–B2"
  ) {
    return `${LEARN_ENGLISH_BASE}/grammar/b1-b2`;
  }
  return `${LEARN_ENGLISH_BASE}/grammar/c1`;
}

function skillLevel(level: string): string {
  if (level === "B1+") return "b2";
  return level.toLowerCase();
}

function canonicalOnlineResourceUrl(resource: OnlineResource): string {
  if (resource.skill === "IELTS") return IELTS_SAMPLE_TESTS;
  if (resource.skill === "Grammar" || resource.skill === "Use of English") {
    return grammarHub(resource.level);
  }
  if (resource.skill === "Vocabulary") {
    if (resource.level === "A1" || resource.level === "A2") {
      return `${LEARN_ENGLISH_BASE}/vocabulary/a1-a2`;
    }
    if (
      resource.level === "B1" ||
      resource.level === "B1+" ||
      resource.level === "B2"
    ) {
      return `${LEARN_ENGLISH_BASE}/vocabulary/b1-b2`;
    }
    return `${LEARN_ENGLISH_BASE}/vocabulary`;
  }
  if (resource.skill === "Writing" || resource.skill === "Listening") {
    return `${LEARN_ENGLISH_BASE}/${resource.skill.toLowerCase()}/${skillLevel(resource.level)}`;
  }
  return `${LEARN_ENGLISH_BASE}`;
}

export function repairGrammarUnitLinks(unit: GrammarUnit): GrammarUnit {
  const links = unit.links.map((resource): GrammarResource => {
    const [, url, description, role] = resource;
    if (!url.startsWith("https://test-english.com/")) return resource;

    if (url.startsWith("https://test-english.com/grammar-points/")) {
      return [
        role === "exercise" ? "Test-English exercises" : "Test-English explanation",
        url,
        description,
        role,
      ];
    }

    return [
      role === "exercise" ? "Official online exercises" : "Official explanation",
      grammarHub(unit.level),
      role === "exercise"
        ? `British Council ${unit.level} grammar exercises for “${unit.title}”.`
        : `British Council ${unit.level} grammar explanations for “${unit.title}”.`,
      role,
    ];
  });

  return { ...unit, links };
}

export function repairOnlineResource(
  resource: OnlineResource,
): OnlineResource {
  if (
    resource.provider !== "Test-English" &&
    resource.provider !== "British Council"
  ) {
    return resource;
  }

  const isIelts = resource.skill === "IELTS";
  return {
    ...resource,
    provider: isIelts ? "IELTS" : "British Council",
    title: isIelts
      ? "Official IELTS sample test questions"
      : `${resource.level} ${resource.skill} lessons and exercises`,
    url: canonicalOnlineResourceUrl(resource),
  };
}
