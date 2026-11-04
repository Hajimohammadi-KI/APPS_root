import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

type ViewNode = {
  type: unknown;
  props: Record<string, unknown>;
  children: unknown[];
};

function nodes(value: unknown): ViewNode[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("children" in value)) return [];
  const node = value as ViewNode;
  return [node, ...node.children.flatMap(nodes)];
}

function renderComponent(
  file: string,
  name: string,
  context: object,
  props: object,
) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8")
    .replace(/^import[\s\S]*?from\s+["'][^"']+["'];?\r?\n/gm, "")
    .replace(/^export (?=function)/gm, "");
  const script = new Bun.Transpiler({
    loader: "tsx",
    tsconfig: { compilerOptions: { jsx: "react" } },
  }).transformSync(source);
  const sandbox = {
    React: {
      createElement: (
        type: unknown,
        attributes: object | null,
        ...children: unknown[]
      ) => ({
        type,
        props: attributes ?? {},
        children,
      }),
    },
    ...context,
    props,
    result: undefined as unknown,
  };
  runInNewContext(`${script}\nglobalThis.result = ${name}(props);`, sandbox);
  return sandbox.result;
}

const selection = {
  unit: {
    id: "de.c.086",
    title: "Satzklammer im einfachen Hauptsatz",
    level: "A1",
  },
  level: "A1",
  href: "/practice?task=de.c.086.retrieve.1.writing&level=A1",
};

describe("German primary learning-path entry points", () => {
  test("the subscription delegates launch and changed-choice handling to the shared watcher and keeps cleanup", () => {
    for (const search of [
      "?from=daily&activity=5",
      "?level=B1&topic=Nebensatz+mit+weil",
    ]) {
      let request: unknown;
      let cleanup: unknown;
      const stop = () => {};
      renderComponent(
        "./use-learning-path.ts",
        "useLearningPath",
        {
          URLSearchParams,
          window: { location: { search } },
          useState: (initial: unknown) => [initial, () => {}],
          useEffect: (effect: () => unknown) => {
            cleanup = effect();
          },
          watchLearningPath: (
            language: string,
            _callback: unknown,
            readRequest?: () => unknown,
          ) => {
            expect(language).toBe("de");
            request = readRequest;
            return stop;
          },
        },
        {},
      );
      expect(request).toBeUndefined();
      expect(cleanup).toBe(stop);
    }
  });

  test("home displays the shared recommendation and pins its continuation", () => {
    const tree = renderComponent(
      "../../components/learning-home.tsx",
      "LearningHome",
      {
        ArrowRight: "ArrowRight",
        BookOpen: "BookOpen",
        CalendarDays: "CalendarDays",
        Check: "Check",
        ChevronRight: "ChevronRight",
        Headphones: "Headphones",
        RotateCcw: "RotateCcw",
        Settings2: "Settings2",
        Wrench: "Wrench",
      },
      {
        language: "de",
        name: "Learner",
        level: "A1",
        daily: null,
        ready: true,
        learningPath: selection,
      },
    );
    expect(
      nodes(tree).find((node) => node.props.className === "lh-primary")?.props
        .href,
    ).toBe(selection.href);
    expect(JSON.stringify(tree)).toContain(selection.unit.title);
  });

  test.each([false, true])(
    "Automatik offers the same primary step and preserves heading order, embedded=%s",
    (embedded) => {
      const grammar = {
        title: "Nebensatz mit weil",
        level: "B1",
        rule: "Verb zuletzt",
        exercises: [["Ergänze", "weil ich Zeit habe"]],
        examples: ["Ich bleibe, weil ich Zeit habe."],
        testAnswer: "weil ich Zeit habe",
      };
      const tree = renderComponent(
        "./automaticity-lab.tsx",
        "AutomaticityLab",
        {
          useEffect: () => {},
          useRef: () => ({ current: false }),
          useState: (initial: unknown) => [initial, () => {}],
          useLearningPath: () => selection,
          useLearnerState: () => ({
            state: {
              settings: { dailyStudyMinutes: 15 },
              learner: {},
              learningLevel: "B1",
              todayGrammar: { title: grammar.title },
              dailyPlans: {},
              mastery: {},
            },
            hydrated: true,
          }),
          grammarUnits: [grammar],
          lessonKey: (value: string) => value,
          requiredSpeakingSeconds: () => 45,
          shadowingStages: [1, 2, 3, 4, 5],
          useLessonRecorder: () => ({}),
          MissionHero: "MissionHero",
          MissionProgressCard: "MissionProgressCard",
          StepCards: "StepCards",
          QualityGateCard: "QualityGateCard",
          PracticeStepCard: "PracticeStepCard",
          WritingStepCard: "WritingStepCard",
          SpeakingStepCard: "SpeakingStepCard",
          MasteryCard: "MasteryCard",
          PatternPlanCard: "PatternPlanCard",
        },
        { embedded },
      );
      expect(
        nodes(tree).find(
          (node) => node.props["data-learning-path-primary"] !== undefined,
        )?.props.href,
      ).toBe(selection.href);
      expect(JSON.stringify(tree)).toContain(selection.unit.title);
      expect(JSON.stringify(tree)).toContain("Zusatzmission");
      expect(
        nodes(tree).find((node) => node.type === "h1" || node.type === "h2")
          ?.type,
      ).toBe(embedded ? "h2" : "h1");
      expect(
        nodes(tree).find((node) => node.type === "MissionProgressCard")?.props
          .topic,
      ).toBe(grammar.title);
    },
  );

  test.each([false, true])(
    "the existing supplementary mission uses a section heading, embedded=%s",
    (embedded) => {
      const tree = renderComponent(
        "./automaticity-panels.tsx",
        "MissionHero",
        {
          Badge: "Badge",
          Button: "Button",
          Play: "Play",
          ...Object.fromEntries(
            [
              "BookOpenCheck",
              "Check",
              "CircleAlert",
              "Headphones",
              "Mic",
              "PenLine",
              "RotateCcw",
              "Square",
              "Volume2",
            ].map((name) => [name, name]),
          ),
        },
        { embedded, missionMinutes: 15 },
      );
      expect(nodes(tree).filter((node) => node.type === "h1")).toHaveLength(0);
      expect(nodes(tree).filter((node) => node.type === "h2")).toHaveLength(1);
    },
  );

  test("daily keeps seven supplementary activities and a separate primary path host", () => {
    const html = readFileSync(
      new URL("../../../public/replacements/de/heute.html", import.meta.url),
      "utf8",
    );
    expect(html).toContain("data-learning-path-daily");
    expect(html).toContain("data-learning-path-primary");
    expect(html.match(/class="activity(?: active)?"/g)).toHaveLength(7);
    expect(html).toContain("Zusätzlicher Tagesplan");
    expect(html).not.toContain(
      "document.querySelector('.hero-copy .primary').addEventListener('click',()=>document.querySelector('.activity .open').click())",
    );
  });
});
