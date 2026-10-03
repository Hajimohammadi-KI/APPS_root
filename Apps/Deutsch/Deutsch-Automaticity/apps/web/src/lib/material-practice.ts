import {
  discussionAudioMaterials,
  discussionGuideMaterials,
  driveMaterialCollections,
  errorRepairMaterials,
  grammarTrainingMaterials,
  idiomDailyMaterials,
  type DriveMaterialItem,
} from "@grammar/content";

import generatedFocus from "./material-practice-focus.generated.json";

export type PracticeFocusId =
  | "adjective-endings"
  | "cases-articles"
  | "connectors"
  | "discussion"
  | "error-repair"
  | "grammar-transfer"
  | "idioms"
  | "indirect-speech"
  | "infinitive"
  | "modal-verbs"
  | "nominalization"
  | "orthography"
  | "participles"
  | "passive"
  | "prepositions"
  | "pronouns"
  | "quotes"
  | "sentence-structure"
  | "tense"
  | "text-analysis"
  | "verb-prefixes"
  | "word-choice";

export interface PracticeExercise {
  readonly id: string;
  readonly stage: "Erkennen" | "Anwenden" | "Reparieren";
  readonly instruction: string;
  readonly prompt: string;
  readonly type: "choice" | "text";
  readonly options?: readonly string[];
  readonly acceptedAnswers: readonly string[];
  readonly answerLabel: string;
  readonly hint: string;
  readonly explanation: string;
  readonly errorClass:
    | "article"
    | "case"
    | "ending"
    | "other"
    | "spelling"
    | "target_grammar"
    | "tense"
    | "word_order";
}

interface PracticeLesson {
  readonly focusId: PracticeFocusId;
  readonly focus: string;
  readonly objective: string;
  readonly rule: string;
  readonly exercises: readonly PracticeExercise[];
}

export interface PracticeMaterial extends DriveMaterialItem {
  readonly sourceDescription?: string;
}

export interface MaterialPracticePlan extends PracticeLesson {
  readonly material: PracticeMaterial;
  readonly relatedFocus: readonly string[];
  readonly copyrightNote: string;
}

const exercise = (
  value: Omit<PracticeExercise, "id">,
  id: string,
): PracticeExercise => ({ id, ...value });

const lessons: Readonly<Record<PracticeFocusId, PracticeLesson>> = {
  "cases-articles": {
    focusId: "cases-articles",
    focus: "Kasus, Artikel und Deklination",
    objective:
      "Kasus am Verb oder an der Präposition erkennen und die passende Form sicher bilden.",
    rule: "Frage zuerst: Wer handelt? Wen oder was betrifft die Handlung? Wem gilt sie? Erst danach wählst du Artikel und Endung.",
    exercises: [
      exercise(
        {
          stage: "Erkennen",
          instruction: "Wähle die passende Form.",
          prompt: "Die Ärztin erklärt ___ neuen Patienten den Ablauf.",
          type: "choice",
          options: ["der", "den", "dem", "des"],
          acceptedAnswers: ["dem"],
          answerLabel: "dem",
          hint: "erklären: jemandem etwas erklären",
          explanation:
            "„Der Patient“ ist der Empfänger der Erklärung. Das Verb „erklären“ verlangt für die Person den Dativ: dem neuen Patienten.",
          errorClass: "case",
        },
        "case-1",
      ),
      exercise(
        {
          stage: "Anwenden",
          instruction: "Ergänze Artikel und Endung.",
          prompt: "Wir sprechen mit ein__ erfahren__ Beraterin.",
          type: "text",
          acceptedAnswers: ["einer erfahrenen"],
          answerLabel: "einer erfahrenen",
          hint: "„mit“ steht immer mit Dativ.",
          explanation:
            "Nach „mit“ folgt der Dativ. Feminin lautet der unbestimmte Artikel „einer“; das Adjektiv erhält hier die Endung -en.",
          errorClass: "ending",
        },
        "case-2",
      ),
      exercise(
        {
          stage: "Reparieren",
          instruction: "Schreibe den Satz korrekt.",
          prompt: "Trotz dem starken Regen ging die Gruppe weiter.",
          type: "text",
          acceptedAnswers: ["Trotz des starken Regens ging die Gruppe weiter"],
          answerLabel: "Trotz des starken Regens ging die Gruppe weiter.",
          hint: "In der Standardsprache verlangt „trotz“ meist den Genitiv.",
          explanation:
            "„Trotz“ wird standardsprachlich mit Genitiv verwendet. Deshalb werden Artikel, Adjektiv und Nomen zu „des starken Regens“.",
          errorClass: "case",
        },
        "case-3",
      ),
    ],
  },
  prepositions: {
    focusId: "prepositions",
    focus: "Präpositionen und Rektion",
    objective: "Präposition, Verb und Kasus als feste Verbindung abrufen.",
    rule: "Lerne nicht nur das Verb, sondern immer das ganze Muster: Verb + Präposition + Kasus.",
    exercises: [
      exercise(
        {
          stage: "Erkennen",
          instruction: "Wähle die feste Präposition.",
          prompt: "Die Teilnehmenden warten ___ eine Rückmeldung.",
          type: "choice",
          options: ["an", "auf", "für", "über"],
          acceptedAnswers: ["auf"],
          answerLabel: "auf",
          hint: "warten + Präposition + Akkusativ",
          explanation:
            "Die feste Verbindung lautet „auf etwas warten“. Das folgende Objekt steht im Akkusativ.",
          errorClass: "target_grammar",
        },
        "prep-1",
      ),
      exercise(
        {
          stage: "Anwenden",
          instruction: "Ergänze Präposition und Artikel.",
          prompt: "Sie nimmt regelmäßig ___ Fortbildung teil.",
          type: "text",
          acceptedAnswers: ["an der"],
          answerLabel: "an der",
          hint: "teilnehmen + an + Dativ",
          explanation:
            "„Teilnehmen“ verbindet sich mit „an“ und Dativ. „Die Fortbildung“ wird deshalb zu „an der Fortbildung“.",
          errorClass: "case",
        },
        "prep-2",
      ),
      exercise(
        {
          stage: "Reparieren",
          instruction: "Schreibe den Satz korrekt.",
          prompt: "Wir interessieren uns an nachhaltigen Lösungen.",
          type: "text",
          acceptedAnswers: ["Wir interessieren uns für nachhaltige Lösungen"],
          answerLabel: "Wir interessieren uns für nachhaltige Lösungen.",
          hint: "sich interessieren + ?",
          explanation:
            "Die feste Rektion lautet „sich für etwas interessieren“. „Für“ verlangt den Akkusativ.",
          errorClass: "target_grammar",
        },
        "prep-3",
      ),
    ],
  },
  passive: {
    focusId: "passive",
    focus: "Passiv und Passiversatzformen",
    objective:
      "Den Vorgang in den Mittelpunkt stellen und die passende Passivform wählen.",
    rule: "Vorgangspassiv: werden + Partizip II. Zustandspassiv: sein + Partizip II. Frage dich, ob etwas passiert oder bereits fertig ist.",
    exercises: [
      exercise(
        {
          stage: "Erkennen",
          instruction: "Wähle die Form für einen laufenden Vorgang.",
          prompt: "Die Unterlagen ___ gerade geprüft.",
          type: "choice",
          options: ["sind", "werden", "wurden", "wären"],
          acceptedAnswers: ["werden"],
          answerLabel: "werden",
          hint: "„gerade“ beschreibt hier den Prozess.",
          explanation:
            "Ein laufender Vorgang wird mit „werden + Partizip II“ gebildet: Die Unterlagen werden geprüft.",
          errorClass: "target_grammar",
        },
        "passive-1",
      ),
      exercise(
        {
          stage: "Anwenden",
          instruction: "Forme ins Passiv um.",
          prompt: "Die Technikerin aktualisiert das System.",
          type: "text",
          acceptedAnswers: ["Das System wird von der Technikerin aktualisiert"],
          answerLabel: "Das System wird von der Technikerin aktualisiert.",
          hint: "Das Akkusativobjekt wird zum Subjekt.",
          explanation:
            "„Das System“ wird zum Subjekt. Präsens-Passiv besteht aus „wird“ und dem Partizip „aktualisiert“.",
          errorClass: "target_grammar",
        },
        "passive-2",
      ),
      exercise(
        {
          stage: "Reparieren",
          instruction: "Korrigiere die Passivform.",
          prompt: "Der Bericht ist morgen veröffentlicht werden.",
          type: "text",
          acceptedAnswers: ["Der Bericht wird morgen veröffentlicht"],
          answerLabel: "Der Bericht wird morgen veröffentlicht.",
          hint: "Für den geplanten Vorgang brauchst du nur „werden + Partizip II“.",
          explanation:
            "„Ist ... werden“ vermischt Zustand und Vorgang. Für die geplante Handlung heißt es „wird veröffentlicht“.",
          errorClass: "target_grammar",
        },
        "passive-3",
      ),
    ],
  },
  "indirect-speech": {
    focusId: "indirect-speech",
    focus: "Indirekte Rede und Konjunktiv",
    objective: "Aussagen distanziert und grammatisch eindeutig wiedergeben.",
    rule: "In formeller indirekter Rede steht meist Konjunktiv I. Ist die Form mit dem Indikativ identisch, hilft häufig Konjunktiv II.",
    exercises: [
      exercise(
        {
          stage: "Erkennen",
          instruction: "Wähle die passende Form.",
          prompt: "Die Sprecherin sagt, sie ___ alle Daten geprüft.",
          type: "choice",
          options: ["hat", "habe", "hätte", "haben"],
          acceptedAnswers: ["habe"],
          answerLabel: "habe",
          hint: "Die Aussage wird neutral wiedergegeben.",
          explanation:
            "„Habe“ ist Konjunktiv I von „haben“ und markiert, dass die Aussage von einer anderen Person stammt.",
          errorClass: "target_grammar",
        },
        "reported-1",
      ),
      exercise(
        {
          stage: "Anwenden",
          instruction: "Forme in indirekte Rede um.",
          prompt: "Mila sagt: „Ich komme später.“",
          type: "text",
          acceptedAnswers: ["Mila sagt, sie komme später"],
          answerLabel: "Mila sagt, sie komme später.",
          hint: "Ändere Pronomen und Verbform.",
          explanation:
            "„Ich“ wird zu „sie“; „komme“ bleibt äußerlich gleich, ist hier aber Konjunktiv I in der dritten Person Singular.",
          errorClass: "target_grammar",
        },
        "reported-2",
      ),
      exercise(
        {
          stage: "Reparieren",
          instruction: "Korrigiere die Wiedergabe.",
          prompt:
            "Der Zeuge erklärte, er ist zur fraglichen Zeit zu Hause gewesen.",
          type: "text",
          acceptedAnswers: [
            "Der Zeuge erklärte, er sei zur fraglichen Zeit zu Hause gewesen",
          ],
          answerLabel:
            "Der Zeuge erklärte, er sei zur fraglichen Zeit zu Hause gewesen.",
          hint: "Konjunktiv I von „sein“",
          explanation:
            "Mit „sei“ wird die Aussage als fremde Information gekennzeichnet; der Bericht übernimmt sie nicht als eigene Tatsache.",
          errorClass: "target_grammar",
        },
        "reported-3",
      ),
    ],
  },
  participles: {
    focusId: "participles",
    focus: "Partizipien und Partizipialkonstruktionen",
    objective: "Handlungen knapp als Eigenschaften ausdrücken.",
    rule: "Partizip I beschreibt meist Gleichzeitigkeit und Aktivität; Partizip II meist ein Ergebnis oder eine passive Bedeutung.",
    exercises: [
      exercise(
        {
          stage: "Erkennen",
          instruction: "Wähle die passende Form.",
          prompt: "Die im Flur ___ Gäste warten auf Einlass.",
          type: "choice",
          options: ["wartenden", "gewarteten", "wartete", "warten"],
          acceptedAnswers: ["wartenden"],
          answerLabel: "wartenden",
          hint: "Die Gäste führen die Handlung selbst aus.",
          explanation:
            "Die Gäste warten aktiv und gleichzeitig. Daher verwendet man das Partizip I „wartend“ mit Adjektivendung: die wartenden Gäste.",
          errorClass: "ending",
        },
        "part-1",
      ),
      exercise(
        {
          stage: "Anwenden",
          instruction: "Verdichte den Relativsatz.",
          prompt: "die Dokumente, die gestern unterschrieben wurden",
          type: "text",
          acceptedAnswers: ["die gestern unterschriebenen Dokumente"],
          answerLabel: "die gestern unterschriebenen Dokumente",
          hint: "Nutze Partizip II als Adjektiv.",
          explanation:
            "Die Handlung ist abgeschlossen und passiv. Deshalb wird „unterschrieben“ attributiv gebraucht und erhält die Endung -en.",
          errorClass: "ending",
        },
        "part-2",
      ),
      exercise(
        {
          stage: "Reparieren",
          instruction: "Korrigiere die Form.",
          prompt: "Die gelesende Studentin machte sich Notizen.",
          type: "text",
          acceptedAnswers: ["Die lesende Studentin machte sich Notizen"],
          answerLabel: "Die lesende Studentin machte sich Notizen.",
          hint: "Infinitiv + d",
          explanation:
            "Das Partizip I von „lesen“ lautet „lesend“, nicht „gelesend“. Mit der Endung heißt es „die lesende Studentin“.",
          errorClass: "ending",
        },
        "part-3",
      ),
    ],
  },
  "adjective-endings": {
    focusId: "adjective-endings",
    focus: "Adjektive, Adverbien und Endungen",
    objective:
      "Adjektivfunktion erkennen und Endungen aus Artikel, Genus und Kasus ableiten.",
    rule: "Steht das Adjektiv direkt vor einem Nomen, braucht es eine Endung. Beschreibt es ein Verb, bleibt es meist unverändert.",
    exercises: [
      exercise(
        {
          stage: "Erkennen",
          instruction: "Wähle die richtige Form.",
          prompt: "Sie erklärte den Ablauf sehr ___.",
          type: "choice",
          options: ["genaue", "genauen", "genau", "genauer"],
          acceptedAnswers: ["genau"],
          answerLabel: "genau",
          hint: "Das Wort beschreibt „erklärte“.",
          explanation:
            "Hier beschreibt „genau“ die Art des Erklärens und wird adverbial gebraucht. Deshalb erhält es keine Endung.",
          errorClass: "ending",
        },
        "adj-1",
      ),
      exercise(
        {
          stage: "Anwenden",
          instruction: "Ergänze die Endungen.",
          prompt: "ein verständlich__ Beispiel mit klar__ Regeln",
          type: "text",
          acceptedAnswers: ["ein verständliches Beispiel mit klaren Regeln"],
          answerLabel: "ein verständliches Beispiel mit klaren Regeln",
          hint: "Nominativ Neutrum; danach Dativ Plural.",
          explanation:
            "Nach „ein“ zeigt das Adjektiv bei Neutrum die Endung -es. „Mit“ verlangt Dativ; im Plural lautet die Endung -en.",
          errorClass: "ending",
        },
        "adj-2",
      ),
      exercise(
        {
          stage: "Reparieren",
          instruction: "Korrigiere die Endung.",
          prompt: "Wir brauchen eine zuverlässig Lösung.",
          type: "text",
          acceptedAnswers: ["Wir brauchen eine zuverlässige Lösung"],
          answerLabel: "Wir brauchen eine zuverlässige Lösung.",
          hint: "Akkusativ Feminin nach „eine“",
          explanation:
            "Das Adjektiv steht vor einem femininen Nomen im Akkusativ. Nach „eine“ lautet die Endung -e.",
          errorClass: "ending",
        },
        "adj-3",
      ),
    ],
  },
  pronouns: {
    focusId: "pronouns",
    focus: "Pronomen und Verweiswörter",
    objective: "Bezüge eindeutig machen und die passende Pronomenform wählen.",
    rule: "Prüfe immer, auf welches Nomen das Pronomen verweist und welche Funktion es im neuen Satz hat.",
    exercises: [
      exercise(
        {
          stage: "Erkennen",
          instruction: "Wähle das passende Relativpronomen.",
          prompt: "Das ist die Kollegin, ___ Idee umgesetzt wurde.",
          type: "choice",
          options: ["die", "der", "deren", "dessen"],
          acceptedAnswers: ["deren"],
          answerLabel: "deren",
          hint: "Wessen Idee?",
          explanation:
            "„Deren“ ist das feminine Genitiv-Relativpronomen und zeigt: Die Idee gehört der Kollegin.",
          errorClass: "case",
        },
        "pron-1",
      ),
      exercise(
        {
          stage: "Anwenden",
          instruction: "Ergänze das passende Pronomen.",
          prompt: "Niemand wusste, ob ___ noch freie Plätze gab.",
          type: "text",
          acceptedAnswers: ["es"],
          answerLabel: "es",
          hint: "Unpersönliche Konstruktion: es gibt",
          explanation:
            "Die feste unpersönliche Konstruktion lautet „es gibt“. Das „es“ hat hier keinen konkreten Gegenstand als Bezug.",
          errorClass: "target_grammar",
        },
        "pron-2",
      ),
      exercise(
        {
          stage: "Reparieren",
          instruction: "Korrigiere den Bezug.",
          prompt: "Die Firma, dessen Leitung gewechselt hat, wächst schnell.",
          type: "text",
          acceptedAnswers: [
            "Die Firma, deren Leitung gewechselt hat, wächst schnell",
          ],
          answerLabel:
            "Die Firma, deren Leitung gewechselt hat, wächst schnell.",
          hint: "„Firma“ ist feminin.",
          explanation:
            "Das Genitivpronomen richtet sich nach dem Bezugswort „die Firma“. Deshalb lautet es „deren“, nicht „dessen“.",
          errorClass: "case",
        },
        "pron-3",
      ),
    ],
  },
  connectors: {
    focusId: "connectors",
    focus: "Konnektoren und logische Verbindungen",
    objective:
      "Logische Beziehungen ausdrücken und die richtige Wortstellung sichern.",
    rule: "Unterordnende Konnektoren schicken das finite Verb ans Satzende; Konjunktionaladverbien stehen im Hauptsatz und lösen Inversion aus.",
    exercises: [
      exercise(
        {
          stage: "Erkennen",
          instruction: "Wähle die passende Verbindung.",
          prompt:
            "___ die Daten unvollständig waren, wurde die Entscheidung verschoben.",
          type: "choice",
          options: ["Trotzdem", "Weil", "Deshalb", "Dennoch"],
          acceptedAnswers: ["Weil"],
          answerLabel: "Weil",
          hint: "Gesucht ist ein Grund mit Verb am Satzende.",
          explanation:
            "„Weil“ leitet einen kausalen Nebensatz ein; das finite Verb „waren“ steht korrekt am Ende.",
          errorClass: "word_order",
        },
        "conn-1",
      ),
      exercise(
        {
          stage: "Anwenden",
          instruction: "Verbinde die Aussagen mit „obwohl“.",
          prompt: "Der Weg war lang. Die Gruppe blieb motiviert.",
          type: "text",
          acceptedAnswers: [
            "Obwohl der Weg lang war, blieb die Gruppe motiviert",
            "Die Gruppe blieb motiviert, obwohl der Weg lang war",
          ],
          answerLabel: "Obwohl der Weg lang war, blieb die Gruppe motiviert.",
          hint: "Im obwohl-Satz steht das Verb am Ende.",
          explanation:
            "„Obwohl“ drückt einen Gegensatz aus und leitet einen Nebensatz ein. Daher steht „war“ am Ende dieses Teilsatzes.",
          errorClass: "word_order",
        },
        "conn-2",
      ),
      exercise(
        {
          stage: "Reparieren",
          instruction: "Korrigiere die Wortstellung.",
          prompt: "Die Frist war kurz, trotzdem wir reichten den Antrag ein.",
          type: "text",
          acceptedAnswers: [
            "Die Frist war kurz, trotzdem reichten wir den Antrag ein",
          ],
          answerLabel:
            "Die Frist war kurz, trotzdem reichten wir den Antrag ein.",
          hint: "Nach „trotzdem“ folgt im Hauptsatz das Verb.",
          explanation:
            "„Trotzdem“ ist ein Konjunktionaladverb. Es besetzt Position eins; deshalb folgen finites Verb und danach das Subjekt.",
          errorClass: "word_order",
        },
        "conn-3",
      ),
    ],
  },
  "sentence-structure": {
    focusId: "sentence-structure",
    focus: "Satzbau und Wortstellung",
    objective:
      "Verbposition und Satzklammer auch in längeren Aussagen stabil halten.",
    rule: "Im Hauptsatz steht das finite Verb an Position zwei; im Nebensatz steht es am Ende. Nicht-finite Verbteile schließen die Satzklammer.",
    exercises: [
      exercise(
        {
          stage: "Erkennen",
          instruction: "Wähle den korrekten Satz.",
          prompt: "Welche Wortstellung stimmt?",
          type: "choice",
          options: [
            "Morgen ich werde den Bericht senden.",
            "Morgen werde ich den Bericht senden.",
            "Morgen werde den Bericht ich senden.",
          ],
          acceptedAnswers: ["Morgen werde ich den Bericht senden."],
          answerLabel: "Morgen werde ich den Bericht senden.",
          hint: "„Morgen“ steht auf Position eins.",
          explanation:
            "Wenn „Morgen“ Position eins besetzt, muss das finite Verb „werde“ auf Position zwei folgen; danach kommt das Subjekt.",
          errorClass: "word_order",
        },
        "order-1",
      ),
      exercise(
        {
          stage: "Anwenden",
          instruction: "Ordne die Wörter zu einem Satz.",
          prompt: "weil / heute / länger / arbeitet / sie",
          type: "text",
          acceptedAnswers: ["weil sie heute länger arbeitet"],
          answerLabel: "weil sie heute länger arbeitet",
          hint: "Nebensatz: finites Verb am Ende.",
          explanation:
            "„Weil“ leitet einen Nebensatz ein. Das Subjekt steht früh, und das finite Verb „arbeitet“ schließt den Satz.",
          errorClass: "word_order",
        },
        "order-2",
      ),
      exercise(
        {
          stage: "Reparieren",
          instruction: "Korrigiere den Satz.",
          prompt: "Ich habe gestern müssen länger arbeiten.",
          type: "text",
          acceptedAnswers: ["Ich habe gestern länger arbeiten müssen"],
          answerLabel: "Ich habe gestern länger arbeiten müssen.",
          hint: "Bei Modalverben im Perfekt steht der Ersatzinfinitiv am Ende.",
          explanation:
            "Mit Modalverb verwendet man hier den Doppelinfinitiv „arbeiten müssen“. Beide infiniten Teile stehen am Ende.",
          errorClass: "word_order",
        },
        "order-3",
      ),
    ],
  },
  infinitive: {
    focusId: "infinitive",
    focus: "Infinitiv mit und ohne zu",
    objective:
      "Infinitivgruppen erkennen und „zu“ an der richtigen Stelle verwenden.",
    rule: "Nach Modalverben steht kein „zu“. Bei trennbaren Verben steht „zu“ zwischen Präfix und Verbstamm.",
    exercises: [
      exercise(
        {
          stage: "Erkennen",
          instruction: "Wähle die korrekte Form.",
          prompt: "Sie hofft, die Prüfung bald ___.",
          type: "choice",
          options: ["bestehen", "zu bestehen", "bestanden", "bestehen zu"],
          acceptedAnswers: ["zu bestehen"],
          answerLabel: "zu bestehen",
          hint: "„hoffen“ leitet häufig eine Infinitivgruppe ein.",
          explanation:
            "Wenn das Subjekt gleich bleibt, kann nach „hoffen“ eine Infinitivgruppe mit „zu“ folgen: sie hofft, die Prüfung zu bestehen.",
          errorClass: "target_grammar",
        },
        "inf-1",
      ),
      exercise(
        {
          stage: "Anwenden",
          instruction: "Ergänze die richtige Infinitivform.",
          prompt: "Er versucht, den Computer neu ___. (starten)",
          type: "text",
          acceptedAnswers: ["zu starten"],
          answerLabel: "zu starten",
          hint: "Das Verb ist nicht trennbar.",
          explanation:
            "Nach „versuchen“ steht eine Infinitivgruppe mit „zu“. Bei „starten“ steht „zu“ direkt vor dem Infinitiv.",
          errorClass: "target_grammar",
        },
        "inf-2",
      ),
      exercise(
        {
          stage: "Reparieren",
          instruction: "Korrigiere die Form.",
          prompt: "Wir müssen die Datei zu speichern.",
          type: "text",
          acceptedAnswers: ["Wir müssen die Datei speichern"],
          answerLabel: "Wir müssen die Datei speichern.",
          hint: "Nach einem Modalverb ...",
          explanation:
            "Nach dem Modalverb „müssen“ folgt der reine Infinitiv ohne „zu“.",
          errorClass: "target_grammar",
        },
        "inf-3",
      ),
    ],
  },
  nominalization: {
    focusId: "nominalization",
    focus: "Nominalisierung und Substantivierung",
    objective:
      "Verben oder ganze Aussagen in kompakte Nominalstrukturen übertragen.",
    rule: "Substantivierte Infinitive sind Neutrum und werden großgeschrieben. In formellen Texten können Verbalstrukturen gezielt nominalisiert werden.",
    exercises: [
      exercise(
        {
          stage: "Erkennen",
          instruction: "Wähle die richtige Schreibung.",
          prompt: "Beim ___ kann ich mich gut konzentrieren.",
          type: "choice",
          options: ["lesen", "Lesen", "gelesen", "Lese"],
          acceptedAnswers: ["Lesen"],
          answerLabel: "Lesen",
          hint: "Präposition + Artikel weisen auf ein Nomen hin.",
          explanation:
            "„Beim“ enthält „bei dem“. Danach steht ein substantivierter Infinitiv, der großgeschrieben wird: beim Lesen.",
          errorClass: "spelling",
        },
        "nom-1",
      ),
      exercise(
        {
          stage: "Anwenden",
          instruction: "Nominalisiere den markierten Inhalt.",
          prompt:
            "Weil die Kosten gestiegen sind, wurde das Projekt angepasst. → Wegen ...",
          type: "text",
          acceptedAnswers: [
            "Wegen des Kostenanstiegs wurde das Projekt angepasst",
            "Wegen der gestiegenen Kosten wurde das Projekt angepasst",
          ],
          answerLabel: "Wegen des Kostenanstiegs wurde das Projekt angepasst.",
          hint: "„wegen“ + Genitiv",
          explanation:
            "Der Kausalsatz wird zu einer Präpositionalgruppe. „Der Kostenanstieg“ steht nach „wegen“ im Genitiv: des Kostenanstiegs.",
          errorClass: "target_grammar",
        },
        "nom-2",
      ),
      exercise(
        {
          stage: "Reparieren",
          instruction: "Korrigiere Groß- und Kleinschreibung.",
          prompt: "Vor dem schlafen liest er zehn Minuten.",
          type: "text",
          acceptedAnswers: ["Vor dem Schlafen liest er zehn Minuten"],
          answerLabel: "Vor dem Schlafen liest er zehn Minuten.",
          hint: "Nach „dem“ folgt ein Nomen.",
          explanation:
            "„Schlafen“ ist hier ein substantivierter Infinitiv und wird deshalb großgeschrieben.",
          errorClass: "spelling",
        },
        "nom-3",
      ),
    ],
  },
  "verb-prefixes": {
    focusId: "verb-prefixes",
    focus: "Trennbare und untrennbare Verbpräfixe",
    objective: "Präfixbedeutung erkennen und Verbteile korrekt positionieren.",
    rule: "Trennbare Präfixe tragen meist die Betonung und wandern im Hauptsatz ans Ende. Untrennbare Präfixe bleiben beim Verbstamm.",
    exercises: [
      exercise(
        {
          stage: "Erkennen",
          instruction: "Wähle den korrekten Satz.",
          prompt: "Das Verb ist „vorbereiten“.",
          type: "choice",
          options: [
            "Sie bereitet das Gespräch vor.",
            "Sie vorbreitet das Gespräch.",
            "Sie bereitet vor das Gespräch.",
          ],
          acceptedAnswers: ["Sie bereitet das Gespräch vor."],
          answerLabel: "Sie bereitet das Gespräch vor.",
          hint: "„vor-“ ist hier trennbar.",
          explanation:
            "Im Hauptsatz steht das finite Verb an Position zwei; das trennbare Präfix „vor“ bildet das Satzende.",
          errorClass: "word_order",
        },
        "prefix-1",
      ),
      exercise(
        {
          stage: "Anwenden",
          instruction: "Setze das Verb im Perfekt ein.",
          prompt: "Die Gruppe hat pünktlich ___. (ankommen)",
          type: "text",
          acceptedAnswers: ["angekommen"],
          answerLabel: "angekommen",
          hint: "Bei trennbaren Verben steht „ge“ zwischen Präfix und Stamm.",
          explanation:
            "„Ankommen“ ist trennbar. Das Partizip II lautet deshalb „an-ge-kommen“.",
          errorClass: "target_grammar",
        },
        "prefix-2",
      ),
      exercise(
        {
          stage: "Reparieren",
          instruction: "Korrigiere die Verbform.",
          prompt: "Er hat die Nachricht be-ge-antwortet.",
          type: "text",
          acceptedAnswers: ["Er hat die Nachricht beantwortet"],
          answerLabel: "Er hat die Nachricht beantwortet.",
          hint: "„be-“ ist untrennbar.",
          explanation:
            "Verben mit dem untrennbaren Präfix „be-“ bilden das Partizip II ohne „ge“: beantwortet.",
          errorClass: "target_grammar",
        },
        "prefix-3",
      ),
    ],
  },
  "modal-verbs": {
    focusId: "modal-verbs",
    focus: "Modalverben und Bedeutungsnuancen",
    objective:
      "Sicherheit, Vermutung, Pflicht und Möglichkeit sprachlich unterscheiden.",
    rule: "Modalverben beschreiben nicht nur Pflicht oder Fähigkeit; sie können auch ausdrücken, wie sicher eine Information eingeschätzt wird.",
    exercises: [
      exercise(
        {
          stage: "Erkennen",
          instruction: "Wähle die Bedeutung.",
          prompt: "„Sie muss schon angekommen sein.“ bedeutet hier:",
          type: "choice",
          options: [
            "Sie hat eine Pflicht.",
            "Der Sprecher hält es für fast sicher.",
            "Sie darf nicht ankommen.",
          ],
          acceptedAnswers: ["Der Sprecher hält es für fast sicher."],
          answerLabel: "Der Sprecher hält es für fast sicher.",
          hint: "Modalverb + Infinitiv Perfekt",
          explanation:
            "In dieser Konstruktion drückt „müssen“ keine Pflicht aus, sondern eine sehr starke Vermutung.",
          errorClass: "target_grammar",
        },
        "modal-1",
      ),
      exercise(
        {
          stage: "Anwenden",
          instruction: "Formuliere eine vorsichtige Vermutung mit „könnte“.",
          prompt: "Vielleicht liegt die Verzögerung am Wetter.",
          type: "text",
          acceptedAnswers: ["Die Verzögerung könnte am Wetter liegen"],
          answerLabel: "Die Verzögerung könnte am Wetter liegen.",
          hint: "könnte + Infinitiv am Ende",
          explanation:
            "Konjunktiv II von „können“ schwächt die Aussage ab und kennzeichnet sie als Möglichkeit, nicht als Tatsache.",
          errorClass: "target_grammar",
        },
        "modal-2",
      ),
      exercise(
        {
          stage: "Reparieren",
          instruction: "Korrigiere den Doppelinfinitiv.",
          prompt: "Sie hätte früher kommen gemusst.",
          type: "text",
          acceptedAnswers: ["Sie hätte früher kommen müssen"],
          answerLabel: "Sie hätte früher kommen müssen.",
          hint: "Modalverb im Konjunktiv II der Vergangenheit",
          explanation:
            "Bei Modalverben steht in dieser Form der Ersatzinfinitiv: „hätte ... kommen müssen“, nicht das Partizip „gemusst“.",
          errorClass: "target_grammar",
        },
        "modal-3",
      ),
    ],
  },
  tense: {
    focusId: "tense",
    focus: "Zeitformen und zeitliche Bezüge",
    objective: "Zeitform nach Bedeutung und Textsorte wählen.",
    rule: "Perfekt dominiert häufig im Gespräch, Präteritum in Erzählungen und Berichten. Plusquamperfekt markiert das frühere von zwei vergangenen Ereignissen.",
    exercises: [
      exercise(
        {
          stage: "Erkennen",
          instruction: "Wähle die passende Form für die Vorvergangenheit.",
          prompt: "Nachdem sie den Bericht ___, schickte sie ihn ab.",
          type: "choice",
          options: ["prüfte", "geprüft hat", "geprüft hatte", "prüfen wird"],
          acceptedAnswers: ["geprüft hatte"],
          answerLabel: "geprüft hatte",
          hint: "Die Prüfung geschieht vor dem Abschicken.",
          explanation:
            "Das Plusquamperfekt „hatte geprüft“ kennzeichnet die Handlung, die vor einer anderen vergangenen Handlung abgeschlossen war.",
          errorClass: "tense",
        },
        "tense-1",
      ),
      exercise(
        {
          stage: "Anwenden",
          instruction: "Setze ins Perfekt.",
          prompt: "Wir besprechen alle offenen Fragen.",
          type: "text",
          acceptedAnswers: ["Wir haben alle offenen Fragen besprochen"],
          answerLabel: "Wir haben alle offenen Fragen besprochen.",
          hint: "haben + Partizip II",
          explanation:
            "„Besprechen“ bildet das Perfekt mit „haben“; das Partizip II lautet wegen des untrennbaren Präfixes „besprochen“.",
          errorClass: "tense",
        },
        "tense-2",
      ),
      exercise(
        {
          stage: "Reparieren",
          instruction: "Korrigiere die Zeitfolge.",
          prompt: "Nachdem er ankam, hatte die Sitzung begonnen.",
          type: "text",
          acceptedAnswers: [
            "Nachdem er angekommen war, hatte die Sitzung begonnen",
          ],
          answerLabel: "Nachdem er angekommen war, hatte die Sitzung begonnen.",
          hint: "Welche Handlung liegt noch weiter zurück?",
          explanation:
            "Hier soll das Ankommen vor dem bereits vergangenen Beginn liegen. Der nachdem-Satz braucht daher Plusquamperfekt: „angekommen war“.",
          errorClass: "tense",
        },
        "tense-3",
      ),
    ],
  },
  orthography: {
    focusId: "orthography",
    focus: "Rechtschreibung und Zeichensetzung",
    objective: "Schreibsignale erkennen und häufige Fehler bewusst reparieren.",
    rule: "Prüfe Nomen-Signale, Wortbildung und Satzgrenzen getrennt. So bleibt die Aufgabe klein und kontrollierbar.",
    exercises: [
      exercise(
        {
          stage: "Erkennen",
          instruction: "Wähle die richtige Schreibung.",
          prompt: "Welche Form ist korrekt?",
          type: "choice",
          options: [
            "die Prozess analyse",
            "die Prozess-Analyse",
            "die prozess Analyse",
          ],
          acceptedAnswers: ["die Prozess-Analyse"],
          answerLabel: "die Prozess-Analyse",
          hint: "Ein Bindestrich kann komplexe Zusammensetzungen lesbarer machen.",
          explanation:
            "Beide Bestandteile sind Nomen und werden großgeschrieben. Der Bindestrich macht die Zusammensetzung hier deutlich lesbar.",
          errorClass: "spelling",
        },
        "spell-1",
      ),
      exercise(
        {
          stage: "Anwenden",
          instruction: "Setze das Komma richtig.",
          prompt: "Um den Fehler zu finden prüft sie jeden Schritt.",
          type: "text",
          acceptedAnswers: ["Um den Fehler zu finden, prüft sie jeden Schritt"],
          answerLabel: "Um den Fehler zu finden, prüft sie jeden Schritt.",
          hint: "„um ... zu“ bildet eine Infinitivgruppe.",
          explanation:
            "Eine Infinitivgruppe mit „um ... zu“ wird durch Komma vom Hauptsatz getrennt.",
          errorClass: "spelling",
        },
        "spell-2",
      ),
      exercise(
        {
          stage: "Reparieren",
          instruction: "Korrigiere die Großschreibung.",
          prompt: "Das gemeinsame planen spart später Zeit.",
          type: "text",
          acceptedAnswers: ["Das gemeinsame Planen spart später Zeit"],
          answerLabel: "Das gemeinsame Planen spart später Zeit.",
          hint: "Artikel + Adjektiv + Infinitiv",
          explanation:
            "„Planen“ ist durch Artikel und Adjektiv substantiviert und wird deshalb großgeschrieben.",
          errorClass: "spelling",
        },
        "spell-3",
      ),
    ],
  },
  "word-choice": {
    focusId: "word-choice",
    focus: "Wortwahl und Bedeutungsunterschiede",
    objective:
      "Ähnliche Wörter nach Kontext, Register und Bedeutung unterscheiden.",
    rule: "Ersetze ein Wort nicht isoliert. Prüfe typische Wortpartner, die Situation und die beabsichtigte Bedeutungsnuance.",
    exercises: [
      exercise(
        {
          stage: "Erkennen",
          instruction: "Wähle das passende Verb.",
          prompt: "Die neue Regel soll den Energieverbrauch positiv ___.",
          type: "choice",
          options: ["wirken", "bewirken", "beeinflussen", "auswirken"],
          acceptedAnswers: ["beeinflussen"],
          answerLabel: "beeinflussen",
          hint: "Das Verb braucht hier ein Akkusativobjekt.",
          explanation:
            "„Etwas beeinflussen“ bedeutet, auf eine Entwicklung einzuwirken. „Wirken“ wäre in dieser Struktur nicht transitiv.",
          errorClass: "other",
        },
        "word-1",
      ),
      exercise(
        {
          stage: "Anwenden",
          instruction: "Ergänze das treffende Wort.",
          prompt: "Im Gebäude wohnen 80 Menschen. Sie sind seine ___.",
          type: "text",
          acceptedAnswers: ["Bewohner"],
          answerLabel: "Bewohner",
          hint: "Menschen, die in einem Gebäude wohnen",
          explanation:
            "„Bewohner“ leben in einem Haus oder Gebiet. „Anwohner“ wohnen in der Nähe eines bestimmten Ortes.",
          errorClass: "other",
        },
        "word-2",
      ),
      exercise(
        {
          stage: "Reparieren",
          instruction: "Ersetze das unpassende Verb.",
          prompt: "Die Maßnahme wirkt eine deutliche Verbesserung.",
          type: "text",
          acceptedAnswers: ["Die Maßnahme bewirkt eine deutliche Verbesserung"],
          answerLabel: "Die Maßnahme bewirkt eine deutliche Verbesserung.",
          hint: "Gesucht ist ein transitives Verb im Sinn von „verursachen“.",
          explanation:
            "„Bewirken“ bedeutet „als Ergebnis hervorrufen“ und kann direkt ein Akkusativobjekt haben.",
          errorClass: "other",
        },
        "word-3",
      ),
    ],
  },
  "text-analysis": {
    focusId: "text-analysis",
    focus: "Textaufbau, Analyse und Redemittel",
    objective:
      "Aussagen strukturieren, begründen und sprachlich angemessen verbinden.",
    rule: "Ein klarer Beitrag nennt zuerst die Position, liefert dann einen Grund oder Beleg und endet mit einer Folgerung.",
    exercises: [
      exercise(
        {
          stage: "Erkennen",
          instruction:
            "Wähle den stärksten Einstieg in eine sachliche Analyse.",
          prompt: "Welcher Satz trennt Beobachtung und Bewertung?",
          type: "choice",
          options: [
            "Der Text ist einfach schlecht.",
            "Der Text nennt drei Vorteile; Belege für den zweiten fehlen jedoch.",
            "Ich mag das Thema nicht.",
          ],
          acceptedAnswers: [
            "Der Text nennt drei Vorteile; Belege für den zweiten fehlen jedoch.",
          ],
          answerLabel:
            "Der Text nennt drei Vorteile; Belege für den zweiten fehlen jedoch.",
          hint: "Suche eine überprüfbare Beobachtung mit begründeter Einschränkung.",
          explanation:
            "Der Satz beschreibt zuerst ein erkennbares Merkmal und bewertet danach präzise, was fehlt. Das ist nachvollziehbarer als ein Geschmacksurteil.",
          errorClass: "other",
        },
        "text-1",
      ),
      exercise(
        {
          stage: "Anwenden",
          instruction: "Ergänze ein passendes Redemittel.",
          prompt:
            "___ spricht die Kostenersparnis für den Vorschlag; andererseits fehlen Langzeitdaten.",
          type: "text",
          acceptedAnswers: ["Einerseits"],
          answerLabel: "Einerseits",
          hint: "Das Gegenstück steht bereits im Satz.",
          explanation:
            "Die zweiteilige Verbindung lautet „einerseits ... andererseits“ und stellt zwei Perspektiven ausgewogen gegenüber.",
          errorClass: "target_grammar",
        },
        "text-2",
      ),
      exercise(
        {
          stage: "Reparieren",
          instruction: "Formuliere die pauschale Aussage sachlicher.",
          prompt: "Alle finden diese Lösung besser.",
          type: "text",
          acceptedAnswers: [
            "Viele Beteiligte bewerten diese Lösung positiver",
            "Mehrere Beteiligte bewerten diese Lösung positiver",
          ],
          answerLabel: "Viele Beteiligte bewerten diese Lösung positiver.",
          hint: "Vermeide eine unbelegte absolute Behauptung.",
          explanation:
            "„Alle“ ist ohne Beleg zu absolut. „Viele“ oder „mehrere“ begrenzt die Aussage und macht sie wissenschaftlich vorsichtiger.",
          errorClass: "other",
        },
        "text-3",
      ),
    ],
  },
  "error-repair": {
    focusId: "error-repair",
    focus: "Fehler erkennen und nachhaltig reparieren",
    objective:
      "Nur einen Fehlertyp auf einmal finden, erklären und in einem neuen Satz korrekt anwenden.",
    rule: "Nutze die Reparaturschleife: Fehlerstelle markieren, Regel benennen, Satz korrigieren, anschließend ein ähnliches Muster lösen.",
    exercises: [
      exercise(
        {
          stage: "Erkennen",
          instruction: "Welche Fehlerklasse liegt vor?",
          prompt: "„Sie hilft den neue Mitarbeiter.“",
          type: "choice",
          options: [
            "Zeitform",
            "Kasus und Endung",
            "Wortstellung",
            "Rechtschreibung",
          ],
          acceptedAnswers: ["Kasus und Endung"],
          answerLabel: "Kasus und Endung",
          hint: "helfen + Person",
          explanation:
            "„Helfen“ verlangt Dativ. Zusätzlich braucht das Adjektiv nach „dem“ die Endung -en: dem neuen Mitarbeiter.",
          errorClass: "case",
        },
        "repair-1",
      ),
      exercise(
        {
          stage: "Anwenden",
          instruction: "Korrigiere den Satz.",
          prompt: "Obwohl sie war müde, arbeitete sie weiter.",
          type: "text",
          acceptedAnswers: ["Obwohl sie müde war, arbeitete sie weiter"],
          answerLabel: "Obwohl sie müde war, arbeitete sie weiter.",
          hint: "Nebensatz mit „obwohl“",
          explanation:
            "„Obwohl“ leitet einen Nebensatz ein. Das finite Verb „war“ muss deshalb am Ende stehen.",
          errorClass: "word_order",
        },
        "repair-2",
      ),
      exercise(
        {
          stage: "Reparieren",
          instruction: "Korrigiere Präposition und Kasus.",
          prompt: "Er bedankt sich bei die Kollegin für die Hilfe.",
          type: "text",
          acceptedAnswers: ["Er bedankt sich bei der Kollegin für die Hilfe"],
          answerLabel: "Er bedankt sich bei der Kollegin für die Hilfe.",
          hint: "„bei“ verlangt Dativ.",
          explanation:
            "Die feste Struktur lautet „sich bei jemandem für etwas bedanken“. Feminin Dativ ist „bei der Kollegin“.",
          errorClass: "case",
        },
        "repair-3",
      ),
    ],
  },
  "grammar-transfer": {
    focusId: "grammar-transfer",
    focus: "Grammatiktransfer und Fehlerkontrolle",
    objective:
      "Regeln nicht nur erkennen, sondern in einem neuen Kontext korrekt anwenden.",
    rule: "Lies kurz, decke die Regel ab, löse aus dem Gedächtnis und erkläre anschließend genau eine Entscheidung.",
    exercises: [
      exercise(
        {
          stage: "Erkennen",
          instruction: "Wähle den korrekten Satz.",
          prompt: "Welche Form ist standardsprachlich korrekt?",
          type: "choice",
          options: [
            "Wegen dem Termin komme ich später.",
            "Wegen des Termins komme ich später.",
            "Wegen den Termin komme ich später.",
          ],
          acceptedAnswers: ["Wegen des Termins komme ich später."],
          answerLabel: "Wegen des Termins komme ich später.",
          hint: "„wegen“ + Genitiv",
          explanation:
            "In der Standardsprache verlangt „wegen“ den Genitiv: des Termins.",
          errorClass: "case",
        },
        "transfer-1",
      ),
      exercise(
        {
          stage: "Anwenden",
          instruction: "Verbinde die Sätze sinnvoll.",
          prompt:
            "Die Erklärung war kurz. Sie war verständlich. (nicht nur ... sondern auch)",
          type: "text",
          acceptedAnswers: [
            "Die Erklärung war nicht nur kurz, sondern auch verständlich",
          ],
          answerLabel:
            "Die Erklärung war nicht nur kurz, sondern auch verständlich.",
          hint: "Beide Eigenschaften werden betont.",
          explanation:
            "Der zweiteilige Konnektor verbindet gleichrangige Satzteile und hebt hervor, dass beide Aussagen gelten.",
          errorClass: "target_grammar",
        },
        "transfer-2",
      ),
      exercise(
        {
          stage: "Reparieren",
          instruction: "Korrigiere den Satz.",
          prompt: "Heute ich überprüfe die Lösung noch einmal.",
          type: "text",
          acceptedAnswers: ["Heute überprüfe ich die Lösung noch einmal"],
          answerLabel: "Heute überprüfe ich die Lösung noch einmal.",
          hint: "Hauptsatz: Verb auf Position zwei.",
          explanation:
            "„Heute“ besetzt Position eins. Deshalb folgt direkt das finite Verb „überprüfe“ und erst danach das Subjekt.",
          errorClass: "word_order",
        },
        "transfer-3",
      ),
    ],
  },
  idioms: {
    focusId: "idioms",
    focus: "Redewendungen sicher im Kontext verwenden",
    objective:
      "Bildhafte Bedeutung erkennen und die Wendung in einer passenden Situation einsetzen.",
    rule: "Lerne eine Redewendung immer mit Bedeutung, Situation und einem eigenen Beispiel. Die Wörter allein reichen nicht.",
    exercises: [
      exercise(
        {
          stage: "Erkennen",
          instruction: "Wähle die passende Bedeutung.",
          prompt: "„Jemandem grünes Licht geben“ bedeutet:",
          type: "choice",
          options: [
            "jemanden warnen",
            "etwas erlauben oder genehmigen",
            "jemanden ignorieren",
          ],
          acceptedAnswers: ["etwas erlauben oder genehmigen"],
          answerLabel: "etwas erlauben oder genehmigen",
          hint: "Denke an ein Signal zum Starten.",
          explanation:
            "Grünes Licht signalisiert, dass begonnen oder weitergemacht werden darf. Die Wendung drückt Zustimmung aus.",
          errorClass: "other",
        },
        "idiom-1",
      ),
      exercise(
        {
          stage: "Anwenden",
          instruction: "Ergänze die Wendung.",
          prompt: "Kurz vor der Präsentation bekam er kalte ___.",
          type: "text",
          acceptedAnswers: ["Füße"],
          answerLabel: "Füße",
          hint: "Die Wendung beschreibt plötzliches Zögern aus Angst.",
          explanation:
            "„Kalte Füße bekommen“ bedeutet, kurz vor einer schwierigen Handlung unsicher zu werden oder zurückzuschrecken.",
          errorClass: "other",
        },
        "idiom-2",
      ),
      exercise(
        {
          stage: "Reparieren",
          instruction: "Wähle die passende Situation.",
          prompt: "Wann passt „den Nagel auf den Kopf treffen“?",
          type: "choice",
          options: [
            "Wenn jemand das Kernproblem genau benennt.",
            "Wenn jemand zu spät kommt.",
            "Wenn jemand schweigt.",
          ],
          acceptedAnswers: ["Wenn jemand das Kernproblem genau benennt."],
          answerLabel: "Wenn jemand das Kernproblem genau benennt.",
          hint: "Die Aussage ist besonders präzise.",
          explanation:
            "Die Wendung lobt eine Aussage, die genau den entscheidenden Punkt erfasst.",
          errorClass: "other",
        },
        "idiom-3",
      ),
    ],
  },
  quotes: {
    focusId: "quotes",
    focus: "Aussagen und Zitate eigenständig interpretieren",
    objective:
      "Kernaussage, Begründung und mögliche Gegenposition voneinander trennen.",
    rule: "Interpretiere nicht Wort für Wort. Formuliere zuerst die Kernaussage in eigenen Worten und prüfe dann, in welcher Situation sie gilt.",
    exercises: [
      exercise(
        {
          stage: "Erkennen",
          instruction: "Wähle die stärkste Interpretation.",
          prompt:
            "App-eigener Satz: „Ein guter Plan zeigt auch, wann man ihn ändern muss.“",
          type: "choice",
          options: [
            "Pläne sind nutzlos.",
            "Planung braucht klare Ziele und zugleich Anpassungsfähigkeit.",
            "Man soll jeden Tag alles ändern.",
          ],
          acceptedAnswers: [
            "Planung braucht klare Ziele und zugleich Anpassungsfähigkeit.",
          ],
          answerLabel:
            "Planung braucht klare Ziele und zugleich Anpassungsfähigkeit.",
          hint: "Beachte beide Teile des Satzes.",
          explanation:
            "Der Satz lehnt Planung nicht ab. Er verbindet Orientierung mit der Fähigkeit, auf neue Informationen zu reagieren.",
          errorClass: "other",
        },
        "quote-1",
      ),
      exercise(
        {
          stage: "Anwenden",
          instruction: "Ergänze das passende Interpretationssignal.",
          prompt:
            "Die Aussage ___, dass Fortschritt nicht immer geradlinig verläuft.",
          type: "text",
          acceptedAnswers: ["verdeutlicht", "zeigt", "betont"],
          answerLabel: "verdeutlicht",
          hint: "Gesucht ist ein neutrales Verb für Interpretation.",
          explanation:
            "„Verdeutlicht“, „zeigt“ oder „betont“ verbindet die Aussage mit deiner Deutung, ohne sie als wörtliches Zitat auszugeben.",
          errorClass: "other",
        },
        "quote-2",
      ),
      exercise(
        {
          stage: "Reparieren",
          instruction: "Wähle die wissenschaftlichere Formulierung.",
          prompt: "Welche Deutung ist vorsichtig und begründet?",
          type: "choice",
          options: [
            "Der Satz beweist für immer, dass Pausen gut sind.",
            "Der Satz lässt sich als Plädoyer für bewusste Pausen verstehen.",
            "Der Satz ist hundertprozentig richtig.",
          ],
          acceptedAnswers: [
            "Der Satz lässt sich als Plädoyer für bewusste Pausen verstehen.",
          ],
          answerLabel:
            "Der Satz lässt sich als Plädoyer für bewusste Pausen verstehen.",
          hint: "Interpretation ist keine absolute Tatsache.",
          explanation:
            "„Lässt sich ... verstehen“ kennzeichnet die Aussage als begründete Deutung und vermeidet einen unbelegten Absolutheitsanspruch.",
          errorClass: "other",
        },
        "quote-3",
      ),
    ],
  },
  discussion: {
    focusId: "discussion",
    focus: "Diskutieren, zuhören und begründet reagieren",
    objective:
      "Position, Begründung, Beispiel und Gegenargument klar verbinden.",
    rule: "Eine überzeugende Antwort hat vier kleine Schritte: Position nennen, Grund geben, Beispiel anführen, auf eine Gegenposition reagieren.",
    exercises: [
      exercise(
        {
          stage: "Erkennen",
          instruction: "Wähle die konstruktivste Reaktion.",
          prompt: "Eine Gesprächspartnerin nennt ein Gegenargument.",
          type: "choice",
          options: [
            "Das ist falsch.",
            "Ich verstehe den Einwand; dennoch sprechen die aktuellen Daten für einen Testlauf.",
            "Darüber rede ich nicht.",
          ],
          acceptedAnswers: [
            "Ich verstehe den Einwand; dennoch sprechen die aktuellen Daten für einen Testlauf.",
          ],
          answerLabel:
            "Ich verstehe den Einwand; dennoch sprechen die aktuellen Daten für einen Testlauf.",
          hint: "Anerkennen und dann begründet abgrenzen.",
          explanation:
            "Die Antwort zeigt aktives Zuhören, markiert den Gegensatz mit „dennoch“ und liefert einen sachlichen Grund.",
          errorClass: "other",
        },
        "discussion-1",
      ),
      exercise(
        {
          stage: "Anwenden",
          instruction: "Ergänze ein passendes Redemittel.",
          prompt:
            "___ meines Erachtens ist, dass beide Gruppen Zugang zu den Daten erhalten.",
          type: "text",
          acceptedAnswers: ["Entscheidend", "Wichtig"],
          answerLabel: "Entscheidend",
          hint: "Der Satz hebt den zentralen Punkt hervor.",
          explanation:
            "„Entscheidend ist ...“ strukturiert die eigene Position und lenkt die Aufmerksamkeit auf das Hauptargument.",
          errorClass: "other",
        },
        "discussion-2",
      ),
      exercise(
        {
          stage: "Reparieren",
          instruction: "Wähle den klarsten Schluss.",
          prompt: "Welche Formulierung fasst eine Abwägung zusammen?",
          type: "choice",
          options: [
            "Also keine Ahnung.",
            "Insgesamt überwiegen die Vorteile, sofern der Datenschutz verbindlich geregelt wird.",
            "Alle müssen zustimmen.",
          ],
          acceptedAnswers: [
            "Insgesamt überwiegen die Vorteile, sofern der Datenschutz verbindlich geregelt wird.",
          ],
          answerLabel:
            "Insgesamt überwiegen die Vorteile, sofern der Datenschutz verbindlich geregelt wird.",
          hint: "Fazit plus Bedingung",
          explanation:
            "Der Satz nennt ein Ergebnis der Abwägung und begrenzt es zugleich durch eine klare Voraussetzung.",
          errorClass: "other",
        },
        "discussion-3",
      ),
    ],
  },
};

const generatedGrammarFocus = generatedFocus as Readonly<
  Record<
    string,
    {
      readonly focusId: PracticeFocusId;
      readonly focus: string;
      readonly relatedFocus: readonly string[];
    }
  >
>;

const collectionMaterials: readonly PracticeMaterial[] =
  driveMaterialCollections.map((collection) => ({
    id: collection.id,
    title: collection.title,
    level: collection.level,
    format: collection.assetSummary.includes("PDF") ? "PDF" : "Ordner",
    url: collection.url,
    sourceDescription: collection.description,
  }));

export const practiceMaterials: readonly PracticeMaterial[] = [
  ...idiomDailyMaterials,
  ...discussionGuideMaterials,
  ...discussionAudioMaterials,
  ...grammarTrainingMaterials.filter((item) => item.format !== "Archiv"),
  ...errorRepairMaterials,
  ...collectionMaterials,
];

const materialMap = new Map(
  practiceMaterials.map((material) => [material.id, material]),
);

function inferFocusId(material: PracticeMaterial): PracticeFocusId {
  const generated = generatedGrammarFocus[material.id];
  if (generated) return generated.focusId;
  if (material.id.startsWith("idiom-day-")) {
    return /Zitat|Zitieren/i.test(material.title) ? "quotes" : "idioms";
  }
  if (
    material.id.startsWith("discussion-") ||
    material.id.includes("conversation")
  ) {
    return "discussion";
  }
  if (/error|fehler/i.test(`${material.id} ${material.title}`)) {
    return "error-repair";
  }
  if (/A1|A2/i.test(material.level)) return "cases-articles";
  if (/B1/i.test(material.level)) return "sentence-structure";
  return "grammar-transfer";
}

export function getMaterialPracticePlan(
  materialId: string,
): MaterialPracticePlan | null {
  const material = materialMap.get(materialId);
  if (!material) return null;
  const generated = generatedGrammarFocus[material.id];
  const focusId = inferFocusId(material);
  const lesson = lessons[focusId];
  return {
    ...lesson,
    material,
    relatedFocus: generated?.relatedFocus ?? [],
    exercises: lesson.exercises.map((item) => ({
      ...item,
      id: `${material.id}-${item.id}`,
    })),
    copyrightNote:
      "Die Themen orientieren sich an der gewählten Quelle. Alle Beispielsätze, Aufgaben, Lösungen und Begründungen auf dieser Seite wurden neu für DeutschFlow formuliert.",
  };
}

export function normalizePracticeAnswer(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("de-DE")
    .replace(/[.!?„“\"']/g, "")
    .replace(/\s+/g, " ");
}

export function isPracticeAnswerCorrect(
  answer: string,
  acceptedAnswers: readonly string[],
): boolean {
  const normalized = normalizePracticeAnswer(answer);
  return acceptedAnswers.some(
    (accepted) => normalizePracticeAnswer(accepted) === normalized,
  );
}
