"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Headphones, RotateCcw, Sparkles, Volume2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";

type GermanCase = "Nominativ" | "Akkusativ" | "Dativ" | "Genitiv";
// Six real steps, not four: find the word that governs the case, name the
// sentence role that word creates, only then decide the case itself, build
// article + ending, speak it aloud, and (via nextChallenge) apply the same
// pattern to a new sentence -- the transfer step.
type Stage = "verb" | "role" | "case" | "article" | "ending" | "speak";

type Challenge = Readonly<{
  id: string;
  level: "A1" | "A2" | "B1";
  pattern: string;
  completed: string;
  question: string;
  // The verb or preposition that actually forces this case -- e.g. "helfe"
  // (helfen governs Dativ) or "mit" (always Dativ). For genitive attributes
  // there's no governing verb, so this is the noun being modified instead
  // ("Fahrrad des Mannes" -- Fahrrad is what's possessed).
  keyWord: string;
  keyWordOptions: readonly string[];
  role: string;
  caseAnswer: GermanCase;
  articleAnswer: string;
  articleOptions: readonly string[];
  endingAnswer: string;
  endingOptions: readonly string[];
  clue: string;
  explanation: string;
}>;

const CASES: readonly GermanCase[] = [
  "Nominativ",
  "Akkusativ",
  "Dativ",
  "Genitiv",
];

const ROLE_SUBJECT = "Subjekt (Nominativ)";
const ROLE_DIRECT_OBJECT = "direktes Objekt (Akkusativ)";
const ROLE_DATIVE = "Dativobjekt / Präpositionalobjekt (Dativ)";
const ROLE_GENITIVE = "Genitivattribut (Zugehörigkeit)";
const ROLE_OPTIONS: readonly string[] = [
  ROLE_SUBJECT,
  ROLE_DIRECT_OBJECT,
  ROLE_DATIVE,
  ROLE_GENITIVE,
];

export const caseAutomaticityChallenges: readonly Challenge[] = [
  {
    id: "nom-m-def",
    level: "A1",
    pattern: "___ ruhig___ Mann wartet vor der Tür.",
    completed: "Der ruhige Mann wartet vor der Tür.",
    question: "Wer wartet?",
    keyWord: "wartet",
    keyWordOptions: ["wartet", "ruhige", "Tür"],
    role: ROLE_SUBJECT,
    caseAnswer: "Nominativ",
    articleAnswer: "der",
    articleOptions: ["der", "den", "dem", "des"],
    endingAnswer: "-e",
    endingOptions: ["-e", "-en", "-er", "-em"],
    clue: "Finde die handelnde Person.",
    explanation:
      "Der Mann ist das Subjekt; deshalb steht die Nomengruppe im Nominativ. Der Artikel der trägt das Kasussignal, das Adjektiv erhält -e.",
  },
  {
    id: "acc-m-def",
    level: "A1",
    pattern: "Ich sehe ___ ruhig___ Mann.",
    completed: "Ich sehe den ruhigen Mann.",
    question: "Wen sehe ich?",
    keyWord: "sehe",
    keyWordOptions: ["sehe", "ruhigen", "Ich"],
    role: ROLE_DIRECT_OBJECT,
    caseAnswer: "Akkusativ",
    articleAnswer: "den",
    articleOptions: ["der", "den", "dem", "des"],
    endingAnswer: "-en",
    endingOptions: ["-e", "-en", "-er", "-es"],
    clue: "Auf wen richtet sich das Sehen direkt?",
    explanation:
      "sehen verlangt ein direktes Objekt. Im Maskulinum wird der zu den; das Adjektiv erhält danach -en.",
  },
  {
    id: "dat-m-def",
    level: "A2",
    pattern: "Ich helfe ___ ruhig___ Mann.",
    completed: "Ich helfe dem ruhigen Mann.",
    question: "Wem helfe ich?",
    keyWord: "helfe",
    keyWordOptions: ["helfe", "ruhigen", "Ich"],
    role: ROLE_DATIVE,
    caseAnswer: "Dativ",
    articleAnswer: "dem",
    articleOptions: ["der", "den", "dem", "des"],
    endingAnswer: "-en",
    endingOptions: ["-e", "-en", "-em", "-er"],
    clue: "Das Verb helfen verlangt den Dativ.",
    explanation:
      "Die Person, die Hilfe erhält, steht im Dativ. Der maskuline Artikel lautet dem; das Adjektiv erhält -en.",
  },
  {
    id: "gen-m-def",
    level: "B1",
    pattern: "Das Fahrrad ___ ruhig___ Mannes ist neu.",
    completed: "Das Fahrrad des ruhigen Mannes ist neu.",
    question: "Wessen Fahrrad ist das?",
    keyWord: "Fahrrad",
    keyWordOptions: ["Fahrrad", "ruhigen", "neu"],
    role: ROLE_GENITIVE,
    caseAnswer: "Genitiv",
    articleAnswer: "des",
    articleOptions: ["der", "den", "dem", "des"],
    endingAnswer: "-en",
    endingOptions: ["-e", "-en", "-es", "-em"],
    clue: "Finde die Besitzbeziehung.",
    explanation:
      "Der Besitzer steht im Genitiv: des und die Adjektivendung -en. Auch Mann verändert sich zu Mannes.",
  },
  {
    id: "nom-f-def",
    level: "A1",
    pattern: "___ jung___ Ärztin arbeitet heute.",
    completed: "Die junge Ärztin arbeitet heute.",
    question: "Wer arbeitet heute?",
    keyWord: "arbeitet",
    keyWordOptions: ["arbeitet", "junge", "heute"],
    role: ROLE_SUBJECT,
    caseAnswer: "Nominativ",
    articleAnswer: "die",
    articleOptions: ["die", "der", "den", "das"],
    endingAnswer: "-e",
    endingOptions: ["-e", "-en", "-er", "-es"],
    clue: "Finde zuerst das Subjekt des Satzes.",
    explanation:
      "Die Ärztin ist das feminine Subjekt. Deshalb stehen die und die Adjektivendung -e.",
  },
  {
    id: "acc-f-def",
    level: "A1",
    pattern: "Ich besuche ___ jung___ Ärztin.",
    completed: "Ich besuche die junge Ärztin.",
    question: "Wen besuche ich?",
    keyWord: "besuche",
    keyWordOptions: ["besuche", "junge", "Ich"],
    role: ROLE_DIRECT_OBJECT,
    caseAnswer: "Akkusativ",
    articleAnswer: "die",
    articleOptions: ["die", "der", "den", "das"],
    endingAnswer: "-e",
    endingOptions: ["-e", "-en", "-er", "-em"],
    clue: "besuchen verlangt ein direktes Objekt.",
    explanation:
      "Die feminine Nomengruppe behält im Akkusativ die; das Adjektiv erhält -e.",
  },
  {
    id: "dat-f-def",
    level: "A2",
    pattern: "Ich danke ___ jung___ Ärztin.",
    completed: "Ich danke der jungen Ärztin.",
    question: "Wem danke ich?",
    keyWord: "danke",
    keyWordOptions: ["danke", "jungen", "Ich"],
    role: ROLE_DATIVE,
    caseAnswer: "Dativ",
    articleAnswer: "der",
    articleOptions: ["die", "der", "den", "dem"],
    endingAnswer: "-en",
    endingOptions: ["-e", "-en", "-er", "-em"],
    clue: "Das Verb danken steht mit dem Dativ.",
    explanation:
      "Im femininen Dativ wird die zu der; das Adjektiv erhält die Endung -en.",
  },
  {
    id: "gen-f-def",
    level: "B1",
    pattern: "Die Praxis ___ jung___ Ärztin ist modern.",
    completed: "Die Praxis der jungen Ärztin ist modern.",
    question: "Wessen Praxis ist das?",
    keyWord: "Praxis",
    keyWordOptions: ["Praxis", "jungen", "modern"],
    role: ROLE_GENITIVE,
    caseAnswer: "Genitiv",
    articleAnswer: "der",
    articleOptions: ["die", "der", "den", "dem"],
    endingAnswer: "-en",
    endingOptions: ["-e", "-en", "-er", "-es"],
    clue: "Finde Besitz oder Zugehörigkeit.",
    explanation:
      "Im femininen Genitiv steht der und das Adjektiv erhält -en; das feminine Nomen bekommt keine zusätzliche Endung.",
  },
  {
    id: "nom-n-def",
    level: "A1",
    pattern: "___ klein___ Kind lacht.",
    completed: "Das kleine Kind lacht.",
    question: "Wer lacht?",
    keyWord: "lacht",
    keyWordOptions: ["lacht", "kleine", "Kind"],
    role: ROLE_SUBJECT,
    caseAnswer: "Nominativ",
    articleAnswer: "das",
    articleOptions: ["das", "dem", "des", "den"],
    endingAnswer: "-e",
    endingOptions: ["-e", "-en", "-es", "-em"],
    clue: "Finde die Person, die lacht.",
    explanation:
      "Das Kind ist ein neutrales Subjekt. Deshalb stehen das und die Adjektivendung -e.",
  },
  {
    id: "acc-n-def",
    level: "A1",
    pattern: "Wir hören ___ klein___ Kind.",
    completed: "Wir hören das kleine Kind.",
    question: "Wen hören wir?",
    keyWord: "hören",
    keyWordOptions: ["hören", "kleine", "Wir"],
    role: ROLE_DIRECT_OBJECT,
    caseAnswer: "Akkusativ",
    articleAnswer: "das",
    articleOptions: ["das", "dem", "des", "den"],
    endingAnswer: "-e",
    endingOptions: ["-e", "-en", "-es", "-er"],
    clue: "hören verlangt ein direktes Objekt.",
    explanation:
      "Im neutralen Akkusativ bleibt das unverändert; das Adjektiv erhält danach -e.",
  },
  {
    id: "dat-n-def",
    level: "A2",
    pattern: "Sie gibt ___ klein___ Kind Wasser.",
    completed: "Sie gibt dem kleinen Kind Wasser.",
    question: "Wem gibt sie Wasser?",
    keyWord: "gibt",
    keyWordOptions: ["gibt", "kleinen", "Wasser"],
    role: ROLE_DATIVE,
    caseAnswer: "Dativ",
    articleAnswer: "dem",
    articleOptions: ["das", "dem", "des", "den"],
    endingAnswer: "-en",
    endingOptions: ["-e", "-en", "-es", "-em"],
    clue: "Finde den Empfänger des Wassers.",
    explanation:
      "Der Empfänger steht im Dativ. Beim Neutrum stehen dem und die Adjektivendung -en.",
  },
  {
    id: "gen-n-def",
    level: "B1",
    pattern: "Das Spielzeug ___ klein___ Kindes liegt hier.",
    completed: "Das Spielzeug des kleinen Kindes liegt hier.",
    question: "Wessen Spielzeug ist das?",
    keyWord: "Spielzeug",
    keyWordOptions: ["Spielzeug", "kleinen", "hier"],
    role: ROLE_GENITIVE,
    caseAnswer: "Genitiv",
    articleAnswer: "des",
    articleOptions: ["das", "dem", "des", "den"],
    endingAnswer: "-en",
    endingOptions: ["-e", "-en", "-es", "-em"],
    clue: "Finde die Besitzbeziehung.",
    explanation:
      "Im neutralen Genitiv stehen des und die Adjektivendung -en. Kind verändert sich außerdem zu Kindes.",
  },
  {
    id: "nom-pl-def",
    level: "A1",
    pattern: "___ neu___ Bücher sind interessant.",
    completed: "Die neuen Bücher sind interessant.",
    question: "Was ist interessant?",
    keyWord: "sind",
    keyWordOptions: ["sind", "neuen", "Bücher"],
    role: ROLE_SUBJECT,
    caseAnswer: "Nominativ",
    articleAnswer: "die",
    articleOptions: ["die", "den", "der", "des"],
    endingAnswer: "-en",
    endingOptions: ["-e", "-en", "-er", "-es"],
    clue: "Finde das Subjekt im Plural.",
    explanation:
      "Das Subjekt im Plural steht im Nominativ mit die. Nach dem bestimmten Artikel im Plural erhält das Adjektiv -en.",
  },
  {
    id: "acc-pl-def",
    level: "A1",
    pattern: "Ich kaufe ___ neu___ Bücher.",
    completed: "Ich kaufe die neuen Bücher.",
    question: "Was kaufe ich?",
    keyWord: "kaufe",
    keyWordOptions: ["kaufe", "neuen", "Ich"],
    role: ROLE_DIRECT_OBJECT,
    caseAnswer: "Akkusativ",
    articleAnswer: "die",
    articleOptions: ["die", "den", "der", "des"],
    endingAnswer: "-en",
    endingOptions: ["-e", "-en", "-er", "-em"],
    clue: "kaufen verlangt ein direktes Objekt.",
    explanation:
      "Im Akkusativ Plural bleibt die erhalten; das Adjektiv erhält -en.",
  },
  {
    id: "dat-pl-def",
    level: "A2",
    pattern: "Ich lerne mit ___ neu___ Büchern.",
    completed: "Ich lerne mit den neuen Büchern.",
    question: "Mit welchen Büchern lerne ich?",
    keyWord: "mit",
    keyWordOptions: ["mit", "lerne", "neuen"],
    role: ROLE_DATIVE,
    caseAnswer: "Dativ",
    articleAnswer: "den",
    articleOptions: ["die", "den", "der", "des"],
    endingAnswer: "-en",
    endingOptions: ["-e", "-en", "-er", "-em"],
    clue: "Die Präposition mit verlangt immer den Dativ.",
    explanation:
      "Im Dativ Plural stehen den und die Adjektivendung -en. Bücher erhält zusätzlich ein -n und wird zu Büchern.",
  },
  {
    id: "gen-pl-def",
    level: "B1",
    pattern: "Die Seiten ___ neu___ Bücher sind sauber.",
    completed: "Die Seiten der neuen Bücher sind sauber.",
    question: "Die Seiten welcher Bücher?",
    keyWord: "Seiten",
    keyWordOptions: ["Seiten", "neuen", "sauber"],
    role: ROLE_GENITIVE,
    caseAnswer: "Genitiv",
    articleAnswer: "der",
    articleOptions: ["die", "den", "der", "des"],
    endingAnswer: "-en",
    endingOptions: ["-e", "-en", "-er", "-es"],
    clue: "Finde die Zugehörigkeit zwischen Seiten und Büchern.",
    explanation:
      "Im Genitiv Plural steht der; das Adjektiv erhält die Endung -en.",
  },
  {
    id: "nom-m-indef",
    level: "A2",
    pattern: "___ gut___ Plan hilft uns.",
    completed: "Ein guter Plan hilft uns.",
    question: "Was hilft uns?",
    keyWord: "hilft",
    keyWordOptions: ["hilft", "guter", "uns"],
    role: ROLE_SUBJECT,
    caseAnswer: "Nominativ",
    articleAnswer: "ein",
    articleOptions: ["ein", "einen", "einem", "eines"],
    endingAnswer: "-er",
    endingOptions: ["-e", "-en", "-er", "-es"],
    clue: "Das Subjekt ist maskulin; ein zeigt die Endung von der nicht.",
    explanation:
      "Im maskulinen Nominativ mit ein trägt das Adjektiv das sichtbare Signal -er: ein guter Plan.",
  },
  {
    id: "acc-m-indef",
    level: "A2",
    pattern: "Wir brauchen ___ gut___ Plan.",
    completed: "Wir brauchen einen guten Plan.",
    question: "Was brauchen wir?",
    keyWord: "brauchen",
    keyWordOptions: ["brauchen", "guten", "Wir"],
    role: ROLE_DIRECT_OBJECT,
    caseAnswer: "Akkusativ",
    articleAnswer: "einen",
    articleOptions: ["ein", "einen", "einem", "eines"],
    endingAnswer: "-en",
    endingOptions: ["-e", "-en", "-er", "-es"],
    clue: "brauchen verlangt ein direktes Objekt.",
    explanation:
      "Im maskulinen Akkusativ wird ein zu einen; das Adjektiv erhält -en.",
  },
  {
    id: "dat-f-indef",
    level: "A2",
    pattern: "Ich antworte ___ neu___ Kollegin.",
    completed: "Ich antworte einer neuen Kollegin.",
    question: "Wem antworte ich?",
    keyWord: "antworte",
    keyWordOptions: ["antworte", "neuen", "Ich"],
    role: ROLE_DATIVE,
    caseAnswer: "Dativ",
    articleAnswer: "einer",
    articleOptions: ["eine", "einer", "einen", "einem"],
    endingAnswer: "-en",
    endingOptions: ["-e", "-en", "-er", "-em"],
    clue: "Die angesprochene Person steht bei antworten im Dativ.",
    explanation: "Im femininen Dativ stehen einer und die Adjektivendung -en.",
  },
  {
    id: "nom-n-indef",
    level: "A2",
    pattern: "___ klein___ Problem bleibt.",
    completed: "Ein kleines Problem bleibt.",
    question: "Was bleibt?",
    keyWord: "bleibt",
    keyWordOptions: ["bleibt", "kleines", "Problem"],
    role: ROLE_SUBJECT,
    caseAnswer: "Nominativ",
    articleAnswer: "ein",
    articleOptions: ["ein", "einem", "eines", "einen"],
    endingAnswer: "-es",
    endingOptions: ["-e", "-en", "-er", "-es"],
    clue: "Das Subjekt ist neutral; ein zeigt das Signal von das nicht vollständig.",
    explanation:
      "Im neutralen Nominativ mit ein trägt das Adjektiv die Endung -es: ein kleines Problem.",
  },
  {
    id: "nom-m-strong",
    level: "B1",
    pattern: "___ frisch___ Kaffee ist fertig.",
    completed: "Frischer Kaffee ist fertig.",
    question: "Was ist fertig?",
    keyWord: "ist",
    keyWordOptions: ["ist", "frischer", "fertig"],
    role: ROLE_SUBJECT,
    caseAnswer: "Nominativ",
    articleAnswer: "ohne Artikel",
    articleOptions: ["ohne Artikel", "der", "ein", "den"],
    endingAnswer: "-er",
    endingOptions: ["-e", "-en", "-er", "-es"],
    clue: "Ohne Artikel muss das Adjektiv Kasus und Genus deutlich markieren.",
    explanation:
      "Kaffee ist ein maskulines Subjekt ohne Artikel. Deshalb erhält das Adjektiv die starke Endung -er.",
  },
  {
    id: "acc-n-strong",
    level: "B1",
    pattern: "Wir brauchen ___ frisch___ Wasser.",
    completed: "Wir brauchen frisches Wasser.",
    question: "Was brauchen wir?",
    keyWord: "brauchen",
    keyWordOptions: ["brauchen", "frisches", "Wir"],
    role: ROLE_DIRECT_OBJECT,
    caseAnswer: "Akkusativ",
    articleAnswer: "ohne Artikel",
    articleOptions: ["ohne Artikel", "das", "ein", "dem"],
    endingAnswer: "-es",
    endingOptions: ["-e", "-en", "-er", "-es"],
    clue: "Das Objekt ist neutral und hat keinen Artikel.",
    explanation:
      "Im neutralen Akkusativ ohne Artikel trägt das Adjektiv das Signal -es.",
  },
  {
    id: "dat-pl-strong",
    level: "B1",
    pattern: "Sie spricht mit ___ gut___ Freunden.",
    completed: "Sie spricht mit guten Freunden.",
    question: "Mit wem spricht sie?",
    keyWord: "mit",
    keyWordOptions: ["mit", "spricht", "guten"],
    role: ROLE_DATIVE,
    caseAnswer: "Dativ",
    articleAnswer: "ohne Artikel",
    articleOptions: ["ohne Artikel", "die", "den", "der"],
    endingAnswer: "-en",
    endingOptions: ["-e", "-en", "-er", "-em"],
    clue: "mit verlangt immer den Dativ; die Nomengruppe steht außerdem im Plural.",
    explanation:
      "Im Dativ Plural ohne Artikel erhält das Adjektiv -en; Freunde endet bereits auf -n.",
  },
];

const STORAGE_KEY = "deutschflow-case-automaticity-v1";

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 0.86;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

function stageLabel(stage: Stage) {
  if (stage === "verb") return "Signalwort finden";
  if (stage === "role") return "Satzrolle bestimmen";
  if (stage === "case") return "Kasus ableiten";
  if (stage === "article") return "Artikel wählen";
  if (stage === "ending") return "Adjektivendung bilden";
  return "Laut sprechen";
}

const STAGE_ORDER: readonly Stage[] = [
  "verb",
  "role",
  "case",
  "article",
  "ending",
  "speak",
];

export function CaseAutomaticityTrainer() {
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("verb");
  const [selected, setSelected] = useState("");
  const [passed, setPassed] = useState(false);
  const [message, setMessage] = useState("");
  const [spoke, setSpoke] = useState(false);
  const [sessionGoal, setSessionGoal] = useState(4);
  const [sessionDone, setSessionDone] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const challenge =
    caseAutomaticityChallenges[
      challengeIndex % caseAutomaticityChallenges.length
    ]!;
  const stageNumber = STAGE_ORDER.indexOf(stage) + 1;
  const sessionComplete = sessionDone >= sessionGoal;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as {
        challengeIndex?: number;
        totalCompleted?: number;
      };
      if (Number.isFinite(saved.challengeIndex)) {
        setChallengeIndex(Math.max(0, saved.challengeIndex ?? 0));
      }
      if (Number.isFinite(saved.totalCompleted)) {
        setTotalCompleted(Math.max(0, saved.totalCompleted ?? 0));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const options = useMemo<readonly string[]>(() => {
    if (stage === "verb") return challenge.keyWordOptions;
    if (stage === "role") return ROLE_OPTIONS;
    if (stage === "case") return CASES;
    if (stage === "article") return challenge.articleOptions;
    if (stage === "ending") return challenge.endingOptions;
    return [];
  }, [challenge, stage]);

  const answer =
    stage === "verb"
      ? challenge.keyWord
      : stage === "role"
        ? challenge.role
        : stage === "case"
          ? challenge.caseAnswer
          : stage === "article"
            ? challenge.articleAnswer
            : challenge.endingAnswer;

  function choose(option: string) {
    setSelected(option);
    if (option === answer) {
      setPassed(true);
      setMessage(
        stage === "verb"
          ? "Richtig. Dieses Wort erzwingt den Kasus -- jetzt die Rolle benennen, die es der Wortgruppe gibt."
          : stage === "role"
            ? "Richtig. Aus dieser Rolle folgt der Kasus fast automatisch."
            : stage === "case"
              ? `Richtig. ${challenge.explanation}`
              : stage === "article"
                ? "Richtig. Wähle jetzt die Adjektivendung passend zu diesem Artikel."
                : "Richtig. Höre jetzt den vollständigen Satz und sprich ihn selbst laut.",
      );
    } else {
      setPassed(false);
      setMessage(`Noch nicht; das ist in Ordnung. ${challenge.clue}`);
    }
  }

  function continueStage() {
    if (!passed) return;
    setSelected("");
    setPassed(false);
    setMessage("");
    const currentIndex = STAGE_ORDER.indexOf(stage);
    const next = STAGE_ORDER[currentIndex + 1];
    if (next) setStage(next);
  }

  function nextChallenge() {
    if (!spoke) return;
    const nextIndex = challengeIndex + 1;
    const nextTotal = totalCompleted + 1;
    setChallengeIndex(nextIndex);
    setTotalCompleted(nextTotal);
    setSessionDone((value) => value + 1);
    setStage("verb");
    setSelected("");
    setPassed(false);
    setMessage("");
    setSpoke(false);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ challengeIndex: nextIndex, totalCompleted: nextTotal }),
    );
  }

  function startAnotherSession() {
    setSessionDone(0);
    setStage("verb");
    setSelected("");
    setPassed(false);
    setMessage("");
    setSpoke(false);
  }

  return (
    <Card className="overflow-hidden border-violet-300 bg-gradient-to-br from-violet-50 via-background to-amber-50/50">
      <CardHeader className="border-b border-violet-200/80">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge>Kasus-Automatik</Badge>
              <Badge variant="secondary">{challenge.level}</Badge>
              <Badge variant="outline">
                {totalCompleted} Übungen gespeichert
              </Badge>
            </div>
            <CardTitle>
              Kasus und Deklination schrittweise automatisieren
            </CardTitle>
            <CardDescription className="mt-2 max-w-3xl text-sm leading-6">
              Triff immer nur eine Entscheidung: zuerst die Satzrolle, dann den
              Artikel, danach die Adjektivendung und zuletzt den Satz laut
              sprechen. Eine falsche Antwort kostet keine Punkte; dasselbe
              Signal kehrt in einem neuen Satz zurück.
            </CardDescription>
          </div>
          <label className="grid gap-1 text-xs font-bold">
            Übungszeit heute
            <Select
              onChange={(event) => setSessionGoal(Number(event.target.value))}
              value={sessionGoal}
            >
              <option value={4}>5 Minuten · 4 Sätze</option>
              <option value={8}>10 Minuten · 8 Sätze</option>
              <option value={12}>15 Minuten · 12 Sätze</option>
            </Select>
          </label>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <Progress
          aria-label={`Sitzungsfortschritt: ${sessionDone} von ${sessionGoal}`}
          value={(Math.min(sessionDone, sessionGoal) / sessionGoal) * 100}
        />

        {sessionComplete ? (
          <div className="grid min-h-64 place-items-center rounded-2xl border border-violet-200 bg-background/90 p-6 text-center">
            <div className="max-w-lg">
              <Sparkles
                className="mx-auto size-8 text-violet-700"
                aria-hidden="true"
              />
              <h3 className="mt-3 text-xl font-black">
                Heutige Übung abgeschlossen
              </h3>
              <p className="mt-2 leading-7 text-muted-foreground">
                Du hast {sessionGoal} Sätze in vier Schritten aufgebaut. Mache
                jetzt am besten eine Pause. Wenn du noch Energie hast, kannst du
                eine weitere kurze Runde beginnen.
              </p>
              <Button
                className="mt-4"
                onClick={startAnotherSession}
                type="button"
                variant="outline"
              >
                <RotateCcw data-icon="inline-start" />
                Neue kurze Runde starten
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(17rem,0.75fr)]">
            <section className="rounded-2xl border bg-background p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-extrabold tracking-[0.12em] text-violet-800 uppercase">
                  Schritt {stageNumber} von {STAGE_ORDER.length} · {stageLabel(stage)}
                </p>
                <Badge variant="outline">
                  Satz {sessionDone + 1} von {sessionGoal}
                </Badge>
              </div>
              <p
                className="mt-5 rounded-xl bg-slate-950 px-4 py-5 text-lg font-bold text-white"
                dir="ltr"
              >
                {stage === "speak" ? challenge.completed : challenge.pattern}
              </p>

              {stage === "speak" ? (
                <div className="mt-5">
                  <p className="leading-7">
                    Höre zuerst den Satz. Sage ihn dann einmal ohne Hinsehen,
                    vergleiche und wiederhole ihn noch einmal richtig und
                    flüssig.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      title="Spielt den vollständigen deutschen Satz langsam ab."
                      onClick={() => speak(challenge.completed)}
                      type="button"
                      variant="outline"
                    >
                      <Volume2 data-icon="inline-start" />
                      Satz anhören
                    </Button>
                    <Button
                      title="Nach dem lauten Sprechen bestätigen."
                      onClick={() => setSpoke(true)}
                      type="button"
                      variant={spoke ? "default" : "secondary"}
                    >
                      {spoke ? (
                        <Check data-icon="inline-start" />
                      ) : (
                        <Headphones data-icon="inline-start" />
                      )}
                      {spoke ? "Laut gesprochen" : "Jetzt spreche ich"}
                    </Button>
                    <Button
                      disabled={!spoke}
                      onClick={nextChallenge}
                      type="button"
                      title="Wendet denselben Entscheidungsweg auf einen neuen Satz an."
                    >
                      Weiter: neuer Satz, gleiches Muster
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <strong className="block text-amber-950">Leitfrage</strong>
                    <span className="mt-1 block text-sm leading-6 text-amber-950">
                      {stage === "verb"
                        ? "Welches Wort in diesem Satz bestimmt den Kasus der markierten Wortgruppe?"
                        : stage === "role"
                          ? `Welche Rolle spielt die Wortgruppe im Satz, ausgehend von „${challenge.keyWord}“?`
                          : challenge.question}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {options.map((option) => (
                      <Button
                        aria-pressed={selected === option}
                        className="min-h-11"
                        title={`Diese Antwort für den Schritt „${stageLabel(stage)}“ wählen.`}
                        key={option}
                        onClick={() => choose(option)}
                        type="button"
                        variant={
                          selected === option
                            ? passed
                              ? "default"
                              : "destructive"
                            : "outline"
                        }
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                  {message ? (
                    <p
                      className={`mt-4 rounded-xl p-3 text-sm leading-7 ${passed ? "bg-emerald-50 text-emerald-950" : "bg-rose-50 text-rose-950"}`}
                    >
                      {message}
                    </p>
                  ) : null}
                  <Button
                    className="mt-4"
                    disabled={!passed}
                    onClick={continueStage}
                    type="button"
                  >
                    Mit demselben Satz weiter
                  </Button>
                </>
              )}
            </section>

            <aside className="space-y-3">
              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                <strong className="text-violet-950">Entscheidungsweg (6 Schritte)</strong>
                <ol className="mt-3 grid gap-2 text-sm leading-6 text-violet-950">
                  {STAGE_ORDER.map((step, index) => (
                    <li
                      className={step === stage ? "font-extrabold text-violet-700" : undefined}
                      key={step}
                    >
                      {index + 1}. {stageLabel(step)}
                    </li>
                  ))}
                </ol>
              </div>
              <details className="rounded-2xl border bg-background p-4">
                <summary className="cursor-pointer font-bold">
                  Die vier Fälle kurz erklärt
                </summary>
                <div className="mt-3 grid gap-2 text-sm leading-6">
                  <p>
                    <bdi dir="ltr">Nominativ</bdi>: handelnde Person oder
                    Satzthema
                  </p>
                  <p>
                    <bdi dir="ltr">Akkusativ</bdi>: direktes Objekt
                  </p>
                  <p>
                    <bdi dir="ltr">Dativ</bdi>: Empfänger oder indirektes Objekt
                  </p>
                  <p>
                    <bdi dir="ltr">Genitiv</bdi>: Besitz oder Zugehörigkeit
                  </p>
                </div>
              </details>
              <p className="rounded-xl border border-dashed border-slate-300 p-3 text-xs leading-6 text-muted-foreground">
                Alle Übungssätze wurden für diese App neu formuliert. Aus den
                lokalen Quellen werden nur die Methoden kurze Übung, aktiver
                Abruf, lautes Sprechen und gezielte Fehlerkorrektur verwendet.
              </p>
            </aside>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
