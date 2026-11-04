import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { reviseMasteryContent } from "./lib/mastery-content-revisions";
import { reviseVariationTasks } from "./lib/variation-revisions";
import { assessControlledTask } from "../shared/learning-core/src/automaticity/assessment";
import {
  activePracticeTasks,
  type CurriculumPack,
  type PracticeTask,
} from "../shared/learning-core/src/automaticity/curriculum";
import {
  checkClosedAnswer,
  closedResponseKind,
} from "../shared/learning-core/src/automaticity/closed-answer";
import { isNotebookTask } from "../shared/learning-core/src/automaticity/notebook-practice";
import { LEARNER_NOTEBOOK_PRACTICE } from "../shared/learning-core/src/learner-notebook-practice";
import { normalizeText } from "../shared/learning-core/src/text";
import { assertWritingPrecision } from "../shared/learning-core/src/writing-precision";

const built = (language: "en" | "de") =>
  reviseMasteryContent(
    reviseVariationTasks(
      JSON.parse(
        readFileSync(
          new URL(
            `../shared/learning-core/content/curriculum-${language}.json`,
            import.meta.url,
          ),
          "utf8",
        ),
      ) as CurriculumPack,
    ),
  );
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const assess = (language: "en" | "de", task: PracticeTask, text: string) =>
  assessControlledTask(
    {
      language,
      id: "attempt",
      task: { ...task },
      response: { text, sha256: sha(text) },
    } as never,
    task,
    "2026-11-03T10:00:00.000Z",
    "assessment",
  );
const plain = (text: string) =>
  normalizeText(text, { allowOptionalFinalPeriod: true });

// The learner's error notebook of 3 November 2026: each wrong form (as the
// learner wrote it, in a neutral sentence) and the correction the app accepts.
const NOTEBOOK: Record<"en" | "de", readonly (readonly [string, string])[]> = {
  de: [
    ["Wir testen den neue Ansatz.", "Wir testen den neuen Ansatz."],
    [
      "Der Vorteil ist, dass wir die Methode an verschiedenen Stellen können benutzen.",
      "Der Vorteil ist, dass wir die Methode an verschiedenen Stellen benutzen können.",
    ],
    [
      "Die Firma hat mir das Geld zurückgeerstattet.",
      "Die Firma hat mir das Geld zurückerstattet.",
    ],
    ["Bitte geben mir Bescheid.", "Bitte gib mir Bescheid."],
    [
      "Ich habe verstanden, macht weiter.",
      "Ich habe es verstanden. Mach weiter.",
    ],
    [
      "Bei diesem Lärm kann ich nicht konzentrieren.",
      "Bei diesem Lärm kann ich mich nicht konzentrieren.",
    ],
    [
      "Ich habe mit Herrn Becker kontaktiert.",
      "Ich habe Herrn Becker kontaktiert.",
    ],
    [
      "Mein Nachbar muss sich einer Operation am Knie lassen.",
      "Mein Nachbar muss sich am Knie operieren lassen.",
    ],
    [
      "Bis Freitag müssen wir entscheiden treffen.",
      "Bis Freitag müssen wir eine Entscheidung treffen.",
    ],
    [
      "Ich hätte gerne schicke Ihnen die Fotos.",
      "Gerne schicke ich Ihnen die Fotos.",
    ],
    [
      "Das System ableitet die Antwort aus logischen Regeln.",
      "Das System leitet die Antwort aus logischen Regeln ab.",
    ],
    [
      "Ich wäre dir dankbar, wenn du mir es geben könntest.",
      "Ich wäre dir dankbar, wenn du es mir geben könntest.",
    ],
    [
      "Ich arbeite mit den neuen Entwickler.",
      "Ich arbeite mit den neuen Entwicklern.",
    ],
    [
      "Vom Fenster konnte ich nicht gute Foto machen.",
      "Vom Fenster konnte ich kein gutes Foto machen.",
    ],
    [
      "Ich zeige den neuen Studentinnen den graphbasiert Ansatz.",
      "Ich zeige den neuen Studentinnen den graphbasierten Ansatz.",
    ],
    [
      "Ich erkläre dem neuen Student den Ansatz.",
      "Ich erkläre dem neuen Studenten den Ansatz.",
    ],
    [
      "Ich schreibe Ihnen bezüglich der zwei Mahnung.",
      "Ich schreibe Ihnen bezüglich der zwei Mahnungen.",
    ],
    [
      "Ich wende mich an Sie bezüglich meiner Kurs.",
      "Ich wende mich an Sie bezüglich meines Kurses.",
    ],
    [
      "Ich schreibe Ihnen, weil ich Frage habe.",
      "Ich schreibe Ihnen, weil ich eine Frage habe.",
    ],
    [
      "Vielen Dank für Ihre Verständnis und Ihre Hilfe.",
      "Vielen Dank für Ihr Verständnis und Ihre Hilfe.",
    ],
    [
      "Ich bin mit meiner heutige Aufgabe fertig.",
      "Ich bin mit meiner heutigen Aufgabe fertig.",
    ],
    ["Gibt es einen Alternative Weg?", "Gibt es einen alternativen Weg?"],
    [
      "Mir ist nicht klar, worauf sich diese Rechnungen auf welche Behandlung beziehen.",
      "Mir ist nicht klar, auf welche Behandlung sich diese Rechnungen beziehen.",
    ],
    [
      "Ich brauche eine Übersicht, wie viel habe ich im Jahr 2024 erhalten.",
      "Ich brauche eine Übersicht, wie viel ich im Jahr 2024 erhalten habe.",
    ],
    [
      "Das ist die Karte, dass ich mit ihr den Einkauf bezahlt habe.",
      "Das ist die Karte, mit der ich den Einkauf bezahlt habe.",
    ],
    [
      "Es geht um die zwei Mahnungen, dass ich von Ihnen bekommen habe.",
      "Es geht um die zwei Mahnungen, die ich von Ihnen bekommen habe.",
    ],
    [
      "Letztes Jahr würde unser Haus renoviert.",
      "Letztes Jahr wurde unser Haus renoviert.",
    ],
    [
      "Die Schäden sind gestern gemeldet geworden.",
      "Die Schäden sind gestern gemeldet worden.",
    ],
    [
      "Mein Auto wurde in der Garage gekreuzt.",
      "Mein Auto wurde in der Garage zerkratzt.",
    ],
    [
      "Ohne Brille es fällt mir schwer, kleine Schrift zu lesen.",
      "Ohne Brille fällt es mir schwer, kleine Schrift zu lesen.",
    ],
    [
      "Ich habe mich entschieden, zuerst mein Auto zum prüfen lassen.",
      "Ich habe mich entschieden, zuerst mein Auto prüfen zu lassen.",
    ],
    [
      "Die Universität bekommt weniger Geld. Deshalb sie muss einige Projekte stoppen.",
      "Die Universität bekommt weniger Geld. Deshalb muss sie einige Projekte stoppen.",
    ],
    [
      "Diese Hypothese ist spezifer als die andere.",
      "Diese Hypothese ist spezifischer als die andere.",
    ],
    [
      "Ich habe versucht, den Text kürzer machen.",
      "Ich habe versucht, den Text kürzer zu machen.",
    ],
    ["Sehr geherte Damen und Herren,", "Sehr geehrte Damen und Herren,"],
    [
      "Bis wann wird sich die Werkstatt bei mir melden wird?",
      "Bis wann wird sich die Werkstatt bei mir melden?",
    ],
    [
      "Wenn jemand sucht eine Gruppe, kann er sich bei mir melden.",
      "Wenn jemand eine Gruppe sucht, kann er sich bei mir melden.",
    ],
    [
      "Ich lerne heute Abend, denn morgen ich habe eine Prüfung.",
      "Ich lerne heute Abend, denn morgen habe ich eine Prüfung.",
    ],
    [
      "Die neuen Daten waren nicht in den Training Daten enthalten.",
      "Die neuen Daten waren nicht in den Trainingsdaten enthalten.",
    ],
    [
      "Könnten Sie mir sagen, was sollte ich als Nächstes tun?",
      "Könnten Sie mir sagen, was ich als Nächstes tun sollte?",
    ],
  ],
  en: [
    ["How can program read text?", "How can a program read text?"],
    ["How we can check the result?", "How can we check the result?"],
    [
      "How kann a program recognise the word?",
      "How can a program recognise the word?",
    ],
    [
      "My mean is all words, not just this example.",
      "I mean all words, not just this example.",
    ],
    ["It is my mean.", "That’s what I mean."],
    ["It isnot a plural marker.", "It isn’t a plural marker."],
    [
      "Here, the letter s is not as a plural marker.",
      "Here, the letter s does not function as a plural marker.",
    ],
    ["In Python , can we check this ?", "In Python, can we check this?"],
    [
      "I mean all words, how can we check them?",
      "I mean all words. How can we check them?",
    ],
    ["in python, i can open a file.", "In Python, I can open a file."],
    [
      "My friend drink coffee every morning.",
      "My friend drinks coffee every morning.",
    ],
    ["My friend doesn’t drinks tea.", "My friend doesn’t drink tea."],
    ["Does your friend studies English?", "Does your friend study English?"],
    [
      "I study usually study in the evening.",
      "I usually study in the evening.",
    ],
    ["I practise English everyday.", "I practise English every day."],
    ["I wash my teeth before bed.", "I brush my teeth before bed."],
    ["I was tired, so I stayed on bed.", "I was tired, so I stayed in bed."],
    [
      "I study English because useful.",
      "I study English because it is useful.",
    ],
    ["It was a unwanted purchase.", "It was an unwanted purchase."],
    [
      "Until next week, I may not to use a computer.",
      "Until next week, I may not use a computer.",
    ],
  ],
};

for (const language of ["de", "en"] as const) {
  const tasks = built(language).units.flatMap(activePracticeTasks);
  const notebook = tasks.filter(isNotebookTask);

  test(`learner notebook ${language}: every recorded error is practised, rejected and corrected`, () => {
    for (const [wrong, right] of NOTEBOOK[language]) {
      const task = notebook.find((row) =>
        row.acceptedAnswers.some((answer) => plain(answer) === plain(right)),
      );
      expect(`${right}: ${task ? "practised" : "missing"}`).toBe(
        `${right}: practised`,
      );
      expect(`${right}: ${assess(language, task!, right).verdict}`).toBe(
        `${right}: pass`,
      );
      // A certain error is marked, never only saved without a score.
      expect(`${wrong}: ${assess(language, task!, wrong).verdict}`).toBe(
        `${wrong}: needs_repair`,
      );
    }
  });

  test(`learner notebook ${language}: items are checked, correct and keep no personal data`, () => {
    expect(notebook.length).toBeGreaterThanOrEqual(language === "de" ? 90 : 25);
    for (const task of notebook) {
      expect(task.answerPolicy).toBe("closed");
      expect(task.modality).toBe("writing");
      expect(task.contentReview).toBe("authored");
      expect(assess(language, task, task.solution!).verdict).toBe("pass");
      for (const answer of task.acceptedAnswers)
        expect(`${answer}: ${assess(language, task, answer).verdict}`).toBe(
          `${answer}: pass`,
        );
      for (const rejected of task.rejectedAnswers ?? []) {
        const result = assess(language, task, rejected.answer);
        expect(`${rejected.answer}: ${result.verdict}`).toBe(
          `${rejected.answer}: needs_repair`,
        );
        expect(result.feedback).toContain(rejected.explanation);
      }
      // Names, contact data, invoice numbers and health details of the
      // notebook stay private.
      const text = `${task.prompt} ${task.acceptedAnswers.join(" ")} ${(task.rejectedAnswers ?? []).map((row) => `${row.answer} ${row.explanation}`).join(" ")}`;
      expect(
        /@|Hajimohammadi|Fatemeh|Elahe|Klinger|Gehr|Schmid|Moldan|Balghklam|Maédatex|Mounjaro|Stoßwelle|Spritze|Dosis|Übergabe|\d{5}/u.test(
          text,
        )
          ? `${task.id}: ${text}`
          : "",
      ).toBe("");
    }
    assertWritingPrecision(
      notebook.flatMap((task) => task.acceptedAnswers),
      language,
    );
  });
}

// The daily mission opens the Grammar Labs, so each notebook item is also an
// exercise of its unit there, after the unit's earlier exercises (saved Lab
// progress counts exercises by position), and the Lab marks its wrong forms.
test("learner notebook: every item is in its unit's Grammar Lab and the Lab marks its wrong forms", async () => {
  const labs = {
    en: (
      await import("../Apps/English/English-Automaticity/packages/content/src/index")
    ).grammarUnits,
    de: (
      await import("../Apps/Deutsch/Deutsch-Automaticity/packages/content/src/index")
    ).grammarUnits,
  };
  const titles = new Map(
    (["en", "de"] as const).flatMap((language) =>
      built(language).units.map((unit) => [unit.id, unit] as const),
    ),
  );
  // These units exist only in the learning path; the daily notebook block,
  // which reads the learning path by level, carries their items.
  const pathOnly = new Set<string>();
  for (const row of LEARNER_NOTEBOOK_PRACTICE) {
    const language = row.unit.slice(0, 2) as "en" | "de";
    const source = titles.get(row.unit)!;
    const unit = (
      labs[language] as readonly {
        level: string;
        title: string;
        exercises: readonly (readonly [string, string, unknown?])[];
      }[]
    ).find((lab) => lab.title === source.title && lab.level === source.level);
    if (!unit) {
      pathOnly.add(row.unit);
      continue;
    }
    const index =
      unit?.exercises.findIndex(([prompt]) => prompt === row.prompt) ?? -1;
    expect(
      `${row.notebook} ${row.prompt}: ${index < 0 ? "missing" : "Lab"}`,
    ).toBe(`${row.notebook} ${row.prompt}: Lab`);
    const ownPrompts = new Set(
      LEARNER_NOTEBOOK_PRACTICE.filter((item) => item.unit === row.unit).map(
        (item) => item.prompt,
      ),
    );
    expect(
      unit!.exercises.slice(index).every(([prompt]) => ownPrompts.has(prompt)),
    ).toBe(true);
    const [prompt, answer, metadata] = unit!.exercises[index]! as readonly [
      string,
      string,
      {
        acceptedAnswers?: readonly string[];
        rejectedAnswers?: readonly { answer: string; explanation: string }[];
        mode?: string;
      }?,
    ];
    const accepted = [answer, ...(metadata?.acceptedAnswers ?? [])];
    expect(accepted).toEqual([...row.answers]);
    if (language === "de") expect(metadata?.mode).toBe("closed_recall");
    const task = {
      prompt,
      responseKind: closedResponseKind(prompt),
      acceptedAnswers: accepted,
      rejectedAnswers: metadata?.rejectedAnswers?.map((item) => ({ ...item })),
      modality: "writing" as const,
      terminalFullStop: true,
    };
    expect(checkClosedAnswer(task, row.answers[0]!, language).verdict).toBe(
      "pass",
    );
    for (const wrong of row.rejected ?? []) {
      const check = checkClosedAnswer(task, wrong.answer, language);
      expect(`${wrong.answer}: ${check.verdict}`).toBe(
        `${wrong.answer}: needs_repair`,
      );
      expect(check.feedback).toContain(wrong.explanation);
    }
  }
  expect([...pathOnly].sort()).toEqual([
    "de.c.148",
    "de.c.149",
    "de.c.152",
    "de.c.153",
  ]);
});

test("learner notebook: both daily pages and Lab pages carry the notebook practice", () => {
  const read = (path: string) =>
    readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  for (const page of [
    "Apps/English/English-Automaticity/apps/web/public/replacements/en/daily.html",
    "Apps/Deutsch/Deutsch-Automaticity/apps/web/public/replacements/de/heute.html",
  ]) {
    const html = read(page);
    // The block shows the notebook items of the page's selected level.
    expect(html).toMatch(/<section[^>]*data-notebook-daily[^>]*>/u);
    expect(html).toMatch(/notebookDaily\.dataset\.level\s*=/u);
    expect(html).toContain('src="/learning-core/overview.js"');
  }
  // Both Labs pass the stored wrong forms to the shared verdict.
  expect(
    read(
      "Apps/English/English-Automaticity/apps/web/public/replacements/en/grammar.html",
    ),
  ).toContain("rejectedAnswers: task.rejectedAnswers");
  expect(
    read(
      "Apps/Deutsch/Deutsch-Automaticity/apps/web/public/replacements/de/grammar-runtime.js",
    ),
  ).toContain("rejectedAnswers: exercise[2]?.rejectedAnswers");
});

test("learner notebook: no page tells a visitor the items are their own errors", () => {
  // The items come from one learner's notebook and every visitor sees them,
  // so no shipped page may call them the visitor's own errors.
  const claim =
    /your (own )?(error notebook|written errors)|my (error|writing) notebook|\b(dein|mein)(em|en)? (eigenen )?(Fehlerheft|Schreibfehler)|دفتر خطای خودت/iu;
  for (const file of [
    "shared/learning-core/browser/practice.js",
    "shared/learning-core/browser/overview.js",
    "Apps/English/English-Automaticity/apps/web/public/learning-core/practice.js",
    "Apps/English/English-Automaticity/apps/web/public/learning-core/overview.js",
    "Apps/Deutsch/Deutsch-Automaticity/apps/web/public/learning-core/practice.js",
    "Apps/Deutsch/Deutsch-Automaticity/apps/web/public/learning-core/overview.js",
    "Apps/Deutsch/Deutsch-Automaticity/apps/web/public/replacements/de/grammar-catalog.js",
    "Apps/English/English-Automaticity/apps/web/features/screens/errors-screen.tsx",
    "Apps/Deutsch/Deutsch-Automaticity/apps/web/src/features/errors/error-engine.tsx",
  ]) {
    const text = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    expect(`${file}: ${text.match(claim)?.[0] ?? "none"}`).toBe(
      `${file}: none`,
    );
  }
});

test("daily pages: an activity's bar stays empty until it is done; glyph icons are hidden from screen readers", () => {
  for (const page of [
    "Apps/English/English-Automaticity/apps/web/public/replacements/en/daily.html",
    "Apps/Deutsch/Deutsch-Automaticity/apps/web/public/replacements/de/heute.html",
  ]) {
    const html = readFileSync(new URL(`../${page}`, import.meta.url), "utf8");
    // A block span fills its bar unless it starts at width 0.
    expect(html).toMatch(/\.bar span\s*\{[^}]*width:\s*0[;}]/u);
    // Rendering sets the width from the state, so it also resets.
    expect(html).toMatch(
      /card\.querySelector\(['"]\.bar span['"]\)\.style\.width\s*=\s*done\s*\?\s*['"]100%['"]\s*:\s*['"]0['"]/u,
    );
    expect(html).not.toContain('<div class="act-icon">');
    expect(
      html.match(/<div class="act-icon" aria-hidden="true">/gu)?.length,
    ).toBe(7);
  }
});
