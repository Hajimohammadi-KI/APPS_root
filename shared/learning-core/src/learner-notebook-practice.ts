/** Checkable written items built from the learner's error notebook of
 * 3 November 2026 (120 German samples and an English review). Each item
 * practises one recorded error in a new, neutral sentence: names, contact
 * data and health details of the notebook are not copied. Items whose
 * correction depended on unknown context, style or a speech transcript were
 * left out or given a cue that leaves one answer.
 *
 * The first answer fits the gap; further answers are equivalent forms.
 * `rejected` holds the learner's recorded wrong forms in the item's sentence,
 * only where they are certainly wrong for its instruction; the app marks such
 * an answer for repair with the explanation. This is authored content, not
 * an independent review or CEFR calibration. */
export const LEARNER_NOTEBOOK_VERSION = "2026-11-03.1";

export interface NotebookItem {
  readonly unit: string;
  /** The notebook entry the item practises (N020, C012, EN07). */
  readonly notebook: string;
  readonly prompt: string;
  readonly answers: readonly string[];
  readonly rejected?: readonly {
    readonly answer: string;
    readonly explanation: string;
  }[];
}
type Row = readonly [
  unit: string,
  notebook: string,
  prompt: string,
  answers: readonly string[],
  rejected?: readonly (readonly [answer: string, explanation: string])[],
];

const satz = " und schreibe den ganzen Satz: ";
const korrigiere = (what: string, wrong: string) =>
  `Korrigiere ${what}. Nicht richtig: ${wrong} Schreibe die vollständige richtige Antwort auf Deutsch.`;
const du = "Du sprichst eine Person mit du an. Setze den Imperativ ein" + satz;

const GERMAN: readonly Row[] = [
  [
    "de.c.003",
    "N046",
    `Setze das Verb in der passenden Form ein${satz}Meine Kollegin arbeitet sehr schnell. Wie ___ sie das? (machen)`,
    ["Meine Kollegin arbeitet sehr schnell. Wie macht sie das?"],
    [
      [
        "Meine Kollegin arbeitet sehr schnell. Wie machen sie das?",
        "sie meint hier eine Person, die Kollegin. Zur 3. Person Singular gehört macht.",
      ],
    ],
  ],
  [
    "de.c.005",
    "N068",
    korrigiere(
      "Rechtschreibung und Großschreibung",
      "Was ist der unterschied zwichen einer Klass und einer Struktur?",
    ),
    ["Was ist der Unterschied zwischen einer Klasse und einer Struktur?"],
    [
      [
        "Was ist der Unterschied zwichen einer Klasse und einer Struktur?",
        "zwischen schreibt man mit sch: zwi-schen.",
      ],
    ],
  ],
  [
    "de.c.006",
    "N056",
    `Bilde eine Ja/Nein-Frage mit dem Verb an Position 1${satz}___ das, dass der Kurs ausfällt? (bedeuten)`,
    ["Bedeutet das, dass der Kurs ausfällt?"],
  ],
  [
    "de.c.007",
    "N039",
    `Setze den Artikel ein${satz}Ich schreibe Ihnen, weil ich ___ Frage habe. (einen / eine)`,
    ["Ich schreibe Ihnen, weil ich eine Frage habe."],
    [
      [
        "Ich schreibe Ihnen, weil ich Frage habe.",
        "Frage ist ein zählbares Nomen im Singular und braucht hier einen Artikel: eine Frage.",
      ],
    ],
  ],
  [
    "de.c.008",
    "N003",
    korrigiere(
      "Plural und Großschreibung",
      "Schreib alle woter mit ihrer bedeutung auf.",
    ),
    [
      "Schreib alle Wörter mit ihrer Bedeutung auf.",
      "Schreibe alle Wörter mit ihrer Bedeutung auf.",
    ],
  ],
  [
    "de.c.009",
    "N040",
    `Setze den Artikel im Akkusativ ein${satz}Gestern habe ich ___ Rechnung bekommen. (einer / eine)`,
    ["Gestern habe ich eine Rechnung bekommen."],
  ],
  [
    "de.c.009",
    "C005",
    `Setze den Artikel im Akkusativ ein${satz}Leider kann ich ___ Kurs nicht finden. (die / den)`,
    ["Leider kann ich den Kurs nicht finden."],
    [
      [
        "Leider kann ich nicht die Kurs finden.",
        "Kurs ist maskulin: den Kurs. nicht steht hier nach dem Objekt: Ich kann den Kurs nicht finden.",
      ],
    ],
  ],
  [
    "de.c.009",
    "N021",
    `Setze den Artikel nach für ein${satz}Ich brauche eine Erklärung für ___ Finanzamt. (dem / das)`,
    ["Ich brauche eine Erklärung für das Finanzamt."],
    [
      [
        "Ich brauche eine Erklärung für Finanzamt.",
        "für verlangt den Akkusativ, und Finanzamt braucht hier den Artikel: für das Finanzamt.",
      ],
    ],
  ],
  [
    "de.c.010",
    "N019",
    `Setze den Possessivartikel ein${satz}Leider habe ich ___ Vorschlag nicht gesehen. (Ihre / Ihren)`,
    ["Leider habe ich Ihren Vorschlag nicht gesehen."],
  ],
  [
    "de.c.010",
    "N044",
    `Setze den Possessivartikel ein${satz}___ Frage ist ganz einfach. (Meinen / Meine)`,
    ["Meine Frage ist ganz einfach."],
  ],
  [
    "de.c.010",
    "N045",
    `Setze den Possessivartikel ein${satz}Vielen Dank für ___ Verständnis. (Ihre / Ihr)`,
    ["Vielen Dank für Ihr Verständnis."],
  ],
  [
    "de.c.010",
    "C016",
    `Setze den Possessivartikel ein${satz}Vielen Dank für Ihr Verständnis und ___ Hilfe. (Ihr / Ihre)`,
    ["Vielen Dank für Ihr Verständnis und Ihre Hilfe."],
    [
      [
        "Vielen Dank für Ihre Verständnis und Ihre Hilfe.",
        "Verständnis ist neutral: Ihr Verständnis. Hilfe ist feminin: Ihre Hilfe.",
      ],
    ],
  ],
  [
    "de.c.011",
    "N043",
    `Verneine das Nomen${satz}Vom Fenster konnte ich ___ gutes Foto machen. (nicht / kein)`,
    ["Vom Fenster konnte ich kein gutes Foto machen."],
    [
      [
        "Vom Fenster konnte ich nicht gute Foto machen.",
        "Ein Nomen ohne bestimmten Artikel verneint man mit kein. Foto ist neutral: kein gutes Foto.",
      ],
    ],
  ],
  [
    "de.c.011",
    "N039",
    `Setze kein in der passenden Form ein${satz}Mein Bruder trägt ___ Brille. (keinen / keine)`,
    ["Mein Bruder trägt keine Brille."],
    [
      [
        "Mein Bruder benutzt keinen Brillen.",
        "Brille ist feminin, hier im Singular: keine Brille. Eine Brille trägt man.",
      ],
    ],
  ],
  [
    "de.c.011",
    "C035",
    `Setze kein in der passenden Form ein${satz}Es gibt ___ Garantie für gute Ergebnisse. (keinen / keine)`,
    ["Es gibt keine Garantie für gute Ergebnisse."],
  ],
  [
    "de.c.013",
    "N015",
    korrigiere(
      "das trennbare Verb und den Kasus",
      "Das System ableitet die Antwort von logische Regeln.",
    ),
    ["Das System leitet die Antwort aus logischen Regeln ab."],
    [
      [
        "Das System ableitet die Antwort aus logischen Regeln.",
        "ableiten ist trennbar: Im Hauptsatz steht leitet an Position 2 und ab am Ende.",
      ],
      [
        "Das System leitet die Antwort aus logische Regeln ab.",
        "aus verlangt den Dativ: aus logischen Regeln.",
      ],
    ],
  ],
  [
    "de.c.015",
    "N002",
    `Bilde das Partizip II${satz}Die Firma hat mir das Geld ___. (zurückerstatten)`,
    ["Die Firma hat mir das Geld zurückerstattet."],
    [
      [
        "Die Firma hat mir das Geld zurückgeerstattet.",
        "erstatten bekommt kein ge-, weil er- untrennbar ist: zurückerstattet.",
      ],
      [
        "Die Firma hat mir das Geld zurückstatt.",
        "Das Partizip II von zurückerstatten heißt zurückerstattet.",
      ],
    ],
  ],
  [
    "de.c.015",
    "C042",
    `Bilde das Partizip II${satz}Ich habe die Firma gestern ___. (kontaktieren)`,
    ["Ich habe die Firma gestern kontaktiert."],
    [
      [
        "Ich habe die Firma gestern kontaktieren.",
        "Im Perfekt steht am Ende das Partizip II: kontaktiert.",
      ],
      [
        "Ich habe mit der Firma gestern kontaktiert.",
        "kontaktieren braucht kein mit: jemanden kontaktieren.",
      ],
    ],
  ],
  [
    "de.c.015",
    "N054",
    `Setze das Hilfsverb ein${satz}Der Arzt ___ mir gesagt, dass ich mich ausruhen soll. (haben)`,
    ["Der Arzt hat mir gesagt, dass ich mich ausruhen soll."],
    [
      [
        "Der Arzt mir gesagt, dass ich mich ausruhen soll.",
        "Im Perfekt braucht der Satz das Hilfsverb: Der Arzt hat mir gesagt …",
      ],
    ],
  ],
  [
    "de.c.018",
    "N022",
    `Setze die Form im Dativ Plural ein${satz}Ich arbeite mit den neuen ___. (Entwickler, Plural)`,
    ["Ich arbeite mit den neuen Entwicklern."],
    [
      [
        "Ich arbeite mit den neuen Entwickler.",
        "Im Dativ Plural bekommt das Nomen meist -n: mit den Entwicklern.",
      ],
    ],
  ],
  [
    "de.c.018",
    "N022",
    `Setze den Artikel im Dativ ein${satz}Ich arbeite mit ___ neuen Entwickler. (den / dem)`,
    ["Ich arbeite mit dem neuen Entwickler."],
  ],
  [
    "de.c.018",
    "N024",
    `Setze von und den Artikel ein${satz}Hier sind die Fotos ___ gemeldeten Schäden. (von die / von den)`,
    ["Hier sind die Fotos von den gemeldeten Schäden."],
  ],
  [
    "de.c.018",
    "C008",
    `Setze die passende Form ein${satz}___ Fenster aus sieht man den Park. (Von / Vom)`,
    ["Vom Fenster aus sieht man den Park."],
  ],
  [
    "de.c.018",
    "C011",
    `Setze die passende Form ein${satz}Morgen kann ich nicht ___ Kontrolle kommen. (zum / zur)`,
    ["Morgen kann ich nicht zur Kontrolle kommen."],
  ],
  [
    "de.c.019",
    "N019",
    `Setze den Artikel ein${satz}Ich habe die Information auf ___ Homepage der Kanzlei gefunden. (die / der)`,
    ["Ich habe die Information auf der Homepage der Kanzlei gefunden."],
  ],
  [
    "de.c.019",
    "N027",
    `Setze Präposition und Artikel ein${satz}Mein Kollege ist gerade ___ Reise. (in einen / auf einer)`,
    ["Mein Kollege ist gerade auf einer Reise."],
  ],
  [
    "de.c.019",
    "N029",
    `Setze die passende Präposition ein${satz}Das Geld ist schon ___ meinem Konto. (in / auf)`,
    ["Das Geld ist schon auf meinem Konto."],
  ],
  [
    "de.c.020",
    "C039",
    `Setze die passende Form ein${satz}Wenn jemand mit mir arbeiten ___, kann er Gruppe 4 wählen. (möchtet / möchte)`,
    ["Wenn jemand mit mir arbeiten möchte, kann er Gruppe 4 wählen."],
  ],
  [
    "de.c.021",
    "C002",
    `Bilde den Komparativ${satz}Diese Hypothese ist ___ als die andere. (spezifisch)`,
    ["Diese Hypothese ist spezifischer als die andere."],
    [
      [
        "Diese Hypothese ist spezifer als die andere.",
        "Der Komparativ hängt -er an das ganze Adjektiv: spezifisch → spezifischer.",
      ],
    ],
  ],
  [
    "de.c.021",
    "C036",
    `Bilde den Komparativ${satz}Modell B ist besser, weil der Testfehler ___ ist. (gering)`,
    ["Modell B ist besser, weil der Testfehler geringer ist."],
    [
      [
        "Modell B ist besser, weil Testfehler weniger ist.",
        "Der Testfehler braucht einen Artikel, und für einen Wert sagt man geringer: weil der Testfehler geringer ist.",
      ],
    ],
  ],
  [
    "de.c.022",
    "N023",
    `Setze das Verb an die richtige Stelle${satz}Ich bleibe heute zu Hause, weil ich Fieber ___. (haben)`,
    ["Ich bleibe heute zu Hause, weil ich Fieber habe."],
    [
      [
        "Ich bleibe heute zu Hause, weil ich habe Fieber.",
        "Im weil-Satz steht das konjugierte Verb am Ende: weil ich Fieber habe.",
      ],
    ],
  ],
  [
    "de.c.023",
    "N001",
    `Setze die passende Form von können ein${satz}Der Vorteil ist, dass wir die Methode an verschiedenen Stellen benutzen ___. (kann / können)`,
    [
      "Der Vorteil ist, dass wir die Methode an verschiedenen Stellen benutzen können.",
    ],
    [
      [
        "Der Vorteil ist, dass wir die Methode an verschiedenen Stellen können benutzen.",
        "Im dass-Satz steht das konjugierte Verb ganz am Ende: benutzen können.",
      ],
    ],
  ],
  [
    "de.c.023",
    "N055",
    `Setze die passende Form von sollen ein${satz}Er hat mir gesagt, dass Sie die Entscheidung treffen ___. (sollte / sollten)`,
    ["Er hat mir gesagt, dass Sie die Entscheidung treffen sollten."],
  ],
  [
    "de.c.023",
    "N054",
    `Setze das Verb ans Ende${satz}Meine Ärztin hat mir gesagt, dass ich mehr Wasser trinken ___. (sollen)`,
    [
      "Meine Ärztin hat mir gesagt, dass ich mehr Wasser trinken soll.",
      "Meine Ärztin hat mir gesagt, dass ich mehr Wasser trinken sollte.",
    ],
    [
      [
        "Meine Ärztin hat mir gesagt, dass ich soll mehr Wasser trinken.",
        "Im dass-Satz steht das konjugierte Verb am Ende: trinken soll.",
      ],
    ],
  ],
  [
    "de.c.023",
    "N060",
    `Setze das trennbare Verb ein${satz}Ein KI-Winter bedeutet, dass die Förderung ___. (zurückgehen)`,
    ["Ein KI-Winter bedeutet, dass die Förderung zurückgeht."],
    [
      [
        "Ein KI-Winter bedeutet, dass die Förderung geht zurück.",
        "Im dass-Satz steht das Verb am Ende, und das trennbare Verb bleibt zusammen: zurückgeht.",
      ],
      [
        "Ein KI-Winter bedeutet, die Förderung zurückgeht.",
        "Mit dass steht das Verb am Ende: dass die Förderung zurückgeht.",
      ],
    ],
  ],
  [
    "de.c.023",
    "C024",
    `Setze das Modalverb ans Ende${satz}Er hat letztes Mal gesagt, dass ich vorher einen Termin vereinbaren ___. (müssen)`,
    [
      "Er hat letztes Mal gesagt, dass ich vorher einen Termin vereinbaren muss.",
    ],
    [
      [
        "Er hat letztes Mal gesagt, dass ich muss vorher einen Termin vereinbaren.",
        "Im dass-Satz steht das konjugierte Verb am Ende: vereinbaren muss.",
      ],
    ],
  ],
  [
    "de.c.024",
    "C003",
    `Setze dann oder denn ein${satz}Wenn nur 12 von 20 Vorhersagen richtig sind, ___ ist die Generalisierung nicht zuverlässig. (denn / dann)`,
    [
      "Wenn nur 12 von 20 Vorhersagen richtig sind, dann ist die Generalisierung nicht zuverlässig.",
    ],
  ],
  [
    "de.c.024",
    "C039",
    `Setze das Verb ans Ende des wenn-Satzes${satz}Wenn jemand eine Gruppe ___, kann er sich bei mir melden. (suchen)`,
    ["Wenn jemand eine Gruppe sucht, kann er sich bei mir melden."],
    [
      [
        "Wenn jemand sucht eine Gruppe, kann er sich bei mir melden.",
        "Im wenn-Satz steht das konjugierte Verb am Ende: wenn jemand eine Gruppe sucht.",
      ],
      [
        "Wenn jemand sucht einen Gruppe, kann er sich bei mir melden.",
        "Gruppe ist feminin (eine Gruppe), und im wenn-Satz steht das Verb am Ende.",
      ],
    ],
  ],
  [
    "de.c.025",
    "N008",
    `Setze das passende Reflexivpronomen ein${satz}Sag mir Bescheid, falls ___ deine Pläne ändern. (dich / sich)`,
    [
      "Sag mir Bescheid, falls sich deine Pläne ändern.",
      "Sag mir Bescheid, falls deine Pläne sich ändern.",
    ],
  ],
  [
    "de.c.025",
    "N047",
    `Setze das Reflexivpronomen ein${satz}Bei diesem Lärm kann ich ___ nicht konzentrieren. (mir / mich)`,
    ["Bei diesem Lärm kann ich mich nicht konzentrieren."],
    [
      [
        "Bei diesem Lärm kann ich nicht konzentrieren.",
        "sich konzentrieren ist reflexiv: Ich kann mich konzentrieren.",
      ],
    ],
  ],
  [
    "de.c.027",
    "N013",
    `Setze das Verb an Position 2${satz}Gerne ___ ich Ihnen die Fotos. (schicken)`,
    ["Gerne schicke ich Ihnen die Fotos."],
    [
      [
        "Gerne ich schicke Ihnen die Fotos.",
        "Steht Gerne am Satzanfang, folgt direkt das Verb: Gerne schicke ich …",
      ],
      [
        "Ich hätte gerne schicke Ihnen die Fotos.",
        "hätte und schicke sind zwei konjugierte Verben; ein Hauptsatz hat nur eines: Gerne schicke ich Ihnen die Fotos.",
      ],
    ],
  ],
  [
    "de.c.027",
    "C008",
    `Setze das Verb an Position 2${satz}Gerne ___ die Fotos selbst prüfen. (Sie können / können Sie)`,
    ["Gerne können Sie die Fotos selbst prüfen."],
    [
      [
        "Gerne Sie können die Fotos selbst prüfen.",
        "Nach Gerne am Satzanfang steht das konjugierte Verb an Position 2: Gerne können Sie …",
      ],
    ],
  ],
  [
    "de.c.027",
    "N014",
    korrigiere(
      "die Wortstellung",
      "Leider heute wurde mein Fahrrad beschädigt.",
    ),
    [
      "Leider wurde mein Fahrrad heute beschädigt.",
      "Leider wurde heute mein Fahrrad beschädigt.",
      "Heute wurde mein Fahrrad leider beschädigt.",
    ],
  ],
  [
    "de.c.027",
    "C029",
    `Setze das Verb an Position 2${satz}Nach zwei Wochen ___ ich den Kurs gewechselt. (haben)`,
    ["Nach zwei Wochen habe ich den Kurs gewechselt."],
    [
      [
        "Nach zwei Wochen, ich habe den Kurs gewechselt.",
        "Nach einer Zeitangabe am Satzanfang folgt direkt das Verb, ohne Komma: Nach zwei Wochen habe ich …",
      ],
    ],
  ],
  [
    "de.c.030",
    "C011",
    `Setze habe oder hatte ein${satz}Ich kann morgen nicht kommen, denn ich ___ die Grippe bekommen. (hatte / habe)`,
    ["Ich kann morgen nicht kommen, denn ich habe die Grippe bekommen."],
  ],
  [
    "de.c.031",
    "N072",
    `Setze das Relativpronomen ein${satz}Das sind die Schäden, ___ gestern gemeldet wurden. (dass / die)`,
    ["Das sind die Schäden, die gestern gemeldet wurden."],
  ],
  [
    "de.c.031",
    "C020",
    `Setze das Relativpronomen ein${satz}Ich möchte den Ring verkaufen, ___ wir vorher gekauft haben. (dass / den)`,
    ["Ich möchte den Ring verkaufen, den wir vorher gekauft haben."],
    [
      [
        "Ich möchte den Ring verkaufen, den wir haben vorher gekauft.",
        "Im Relativsatz steht das konjugierte Verb am Ende: den wir vorher gekauft haben.",
      ],
    ],
  ],
  [
    "de.c.032",
    "N066",
    `Setze Präposition und Relativpronomen ein${satz}Das ist die Karte, ___ ich den Einkauf bezahlt habe. (mit die / mit der)`,
    ["Das ist die Karte, mit der ich den Einkauf bezahlt habe."],
    [
      [
        "Das ist die Karte, dass ich mit ihr den Einkauf bezahlt habe.",
        "dass ist kein Relativpronomen. Für die Karte mit der Präposition mit: mit der.",
      ],
    ],
  ],
  [
    "de.c.032",
    "N065",
    `Setze Präposition und Relativpronomen ein${satz}Können Sie mir bitte alle Tage nennen, ___ der Kurs stattfindet? (dass / an denen)`,
    ["Können Sie mir bitte alle Tage nennen, an denen der Kurs stattfindet?"],
  ],
  [
    "de.c.033",
    "C032",
    `Setze würde oder hätte ein${satz}Ich ___ gerne an meiner Aussprache arbeiten. (hätte / würde)`,
    ["Ich würde gerne an meiner Aussprache arbeiten."],
  ],
  [
    "de.c.034",
    "C032",
    `Setze würde oder hätte ein${satz}Ich ___ gerne einen Kaffee. (würde / hätte)`,
    ["Ich hätte gerne einen Kaffee."],
  ],
  [
    "de.c.034",
    "N018",
    `Formuliere die höfliche Bitte mit könnten${satz}Ich wäre Ihnen dankbar, wenn Sie meinen Termin ___. (verschieben)`,
    ["Ich wäre Ihnen dankbar, wenn Sie meinen Termin verschieben könnten."],
  ],
  [
    "de.c.034",
    "N074",
    `Setze die passende Form ein${satz}Ich wäre Ihnen dankbar, wenn Sie mir die Rechnung noch einmal zusenden ___. (könntest / könnten)`,
    [
      "Ich wäre Ihnen dankbar, wenn Sie mir die Rechnung noch einmal zusenden könnten.",
    ],
  ],
  [
    "de.c.034",
    "N073",
    `Setze die passende Form von können ein${satz}Ich wäre dir dankbar, wenn du die Materialien mitbringen ___. (könnten / könntest)`,
    ["Ich wäre dir dankbar, wenn du die Materialien mitbringen könntest."],
    [
      [
        "Ich wäre dir dankbar, wenn du die Materialien mit bringen könntest.",
        "mitbringen schreibt man im Infinitiv zusammen.",
      ],
      [
        "Ich wäre dir dankbar, wenn du die Materialien mitbringen.",
        "Im wenn-Satz fehlt das konjugierte Verb am Ende: mitbringen könntest.",
      ],
    ],
  ],
  [
    "de.c.036",
    "N070",
    `Setze wurde oder würde ein${satz}Am Montag ___ das Paket geliefert. (würde / wurde)`,
    ["Am Montag wurde das Paket geliefert."],
  ],
  [
    "de.c.036",
    "N070",
    `Bilde das Präteritum Passiv${satz}Letztes Jahr ___ unser Haus renoviert. (werden)`,
    ["Letztes Jahr wurde unser Haus renoviert."],
    [
      [
        "Letztes Jahr würde unser Haus renoviert.",
        "würde ist Konjunktiv II. Für ein Ereignis in der Vergangenheit im Passiv: wurde + Partizip II.",
      ],
      [
        "Letztes Jahr würde unser Haus renoviert wurde.",
        "Nimm nur ein Hilfsverb: wurde … renoviert.",
      ],
    ],
  ],
  [
    "de.c.036",
    "N072",
    `Bilde das Perfekt Passiv${satz}Die Schäden sind gestern gemeldet ___. (werden)`,
    ["Die Schäden sind gestern gemeldet worden."],
    [
      [
        "Die Schäden sind gestern gemeldet geworden.",
        "Im Perfekt Passiv heißt die Form worden, nicht geworden.",
      ],
    ],
  ],
  [
    "de.c.036",
    "N071",
    `Bilde das Partizip II${satz}Mein Auto wurde in der Garage ___. (zerkratzen)`,
    ["Mein Auto wurde in der Garage zerkratzt."],
    [
      [
        "Mein Auto wurde in der Garage gekreuzt.",
        "kreuzen bedeutet überqueren oder sich schneiden. Für Kratzer im Lack sagt man zerkratzen: zerkratzt.",
      ],
      [
        "Mein Auto wurde in der Garage gezerkratzt.",
        "zer- ist untrennbar; das Partizip II hat kein ge-: zerkratzt.",
      ],
    ],
  ],
  [
    "de.c.037",
    "C004",
    `Ergänze die Infinitivgruppe${satz}Ich habe versucht, den Text kürzer ___. (machen)`,
    ["Ich habe versucht, den Text kürzer zu machen."],
    [
      [
        "Ich habe versucht, den Text kürzer machen.",
        "Nach versuchen folgt zu + Infinitiv: kürzer zu machen.",
      ],
    ],
  ],
  [
    "de.c.037",
    "N077",
    `Ergänze die Infinitivgruppe${satz}Ich habe mich entschieden, zuerst mein Auto ___. (prüfen lassen)`,
    ["Ich habe mich entschieden, zuerst mein Auto prüfen zu lassen."],
    [
      [
        "Ich habe mich entschieden, zuerst mein Auto zum prüfen lassen.",
        "zum ersetzt hier nicht zu. Bei lassen steht zu direkt davor: prüfen zu lassen.",
      ],
      [
        "Ich habe mich entschieden, zuerst mein Auto prüfen lassen.",
        "Nach sich entscheiden folgt zu + Infinitiv: prüfen zu lassen.",
      ],
    ],
  ],
  [
    "de.c.040",
    "N034",
    `Setze den Genitiv ein${satz}Der Vorteil ___ Methode ist ihre Flexibilität. (eine / einer)`,
    ["Der Vorteil einer Methode ist ihre Flexibilität."],
  ],
  [
    "de.c.040",
    "N035",
    `Setze den Genitiv ein${satz}Am Ende dieses ___ fasse ich alles zusammen. (Chat)`,
    ["Am Ende dieses Chats fasse ich alles zusammen."],
    [
      [
        "Am Ende dieses Chat fasse ich alles zusammen.",
        "Maskuline und neutrale Nomen bekommen im Genitiv Singular meist -s: dieses Chats.",
      ],
    ],
  ],
  [
    "de.c.041",
    "N031",
    `Setze das Adjektiv mit Endung ein${satz}Ich zeige den neuen Studentinnen den ___ Ansatz. (graphbasiert)`,
    ["Ich zeige den neuen Studentinnen den graphbasierten Ansatz."],
    [
      [
        "Ich zeige den neuen Studentinnen den graphbasiert Ansatz.",
        "Nach den (Akkusativ, maskulin) endet das Adjektiv auf -en: den graphbasierten Ansatz.",
      ],
      [
        "Ich zeige den neuen Studentinen den graphbasierten Ansatz.",
        "Studentin schreibt man im Plural mit nn: Studentinnen.",
      ],
    ],
  ],
  [
    "de.c.041",
    "C033",
    `Setze die Adjektivendung ein${satz}Das Modell macht Fehler, weil die ___ Daten anders sind. (neu)`,
    ["Das Modell macht Fehler, weil die neuen Daten anders sind."],
    [
      [
        "Das Modell macht Fehler, weil die neue Daten anders sind.",
        "Nach die im Plural endet das Adjektiv auf -en: die neuen Daten.",
      ],
    ],
  ],
  [
    "de.c.042",
    "N062",
    `Bilde die indirekte Frage${satz}Mir ist nicht klar, auf welche Behandlung ___. (diese Rechnungen, sich beziehen)`,
    [
      "Mir ist nicht klar, auf welche Behandlung sich diese Rechnungen beziehen.",
      "Mir ist nicht klar, auf welche Behandlung diese Rechnungen sich beziehen.",
    ],
    [
      [
        "Mir ist nicht klar, worauf sich diese Rechnungen auf welche Behandlung beziehen.",
        "Das Fragewort steht nur einmal: auf welche Behandlung. worauf fällt weg.",
      ],
      [
        "Mir ist nicht klar, auf welche Behandlung beziehen sich diese Rechnungen.",
        "In der indirekten Frage steht das konjugierte Verb am Ende: … sich diese Rechnungen beziehen.",
      ],
    ],
  ],
  [
    "de.c.042",
    "N063",
    `Bilde die indirekte Frage${satz}Ich brauche eine Übersicht, wie viel ich im Jahr 2024 ___. (erhalten, haben)`,
    ["Ich brauche eine Übersicht, wie viel ich im Jahr 2024 erhalten habe."],
    [
      [
        "Ich brauche eine Übersicht, wie viel habe ich im Jahr 2024 erhalten.",
        "In der indirekten Frage steht das konjugierte Verb am Ende: wie viel ich … erhalten habe.",
      ],
    ],
  ],
  [
    "de.c.042",
    "C005",
    `Setze das Fragewort in der passenden Form ein${satz}Könnten Sie mir bitte mitteilen, an ___ Fakultät der Kurs angeboten wird? (welchen / welcher)`,
    [
      "Könnten Sie mir bitte mitteilen, an welcher Fakultät der Kurs angeboten wird?",
    ],
    [
      [
        "Könnten Sie mir bitte mitteilen, dass an welcher Fakultät der Kurs angeboten wird?",
        "Eine indirekte Frage beginnt mit dem Fragewort, ohne dass.",
      ],
    ],
  ],
  [
    "de.c.042",
    "C042",
    `Bilde die indirekte Frage${satz}Könnten Sie mir sagen, was ich als Nächstes ___? (tun, sollen)`,
    [
      "Könnten Sie mir sagen, was ich als Nächstes tun sollte?",
      "Könnten Sie mir sagen, was ich als Nächstes tun soll?",
    ],
    [
      [
        "Könnten Sie mir sagen, was sollte ich als Nächstes tun?",
        "In der indirekten Frage steht das konjugierte Verb am Ende: was ich als Nächstes tun sollte.",
      ],
    ],
  ],
  [
    "de.c.047",
    "N048",
    `Setze Student in der passenden Form ein${satz}Ich erkläre dem neuen ___ den Ansatz. (Student)`,
    ["Ich erkläre dem neuen Studenten den Ansatz."],
    [
      [
        "Ich erkläre dem neuen Student den Ansatz.",
        "Student gehört zur n-Deklination: dem Studenten.",
      ],
    ],
  ],
  [
    "de.c.047",
    "N010",
    `Setze Herr in der passenden Form ein${satz}Ich habe gestern ___ Becker kontaktiert. (Herr / Herrn)`,
    ["Ich habe gestern Herrn Becker kontaktiert."],
    [
      [
        "Ich habe gestern mit Herrn Becker kontaktiert.",
        "kontaktieren braucht kein mit: jemanden kontaktieren.",
      ],
    ],
  ],
  [
    "de.c.048",
    "C007",
    `Bilde aus dem Verb ein Partizip als Adjektiv${satz}Ich schicke Ihnen Fotos von dem ___ Schaden. (melden)`,
    ["Ich schicke Ihnen Fotos von dem gemeldeten Schaden."],
    [
      [
        "Ich schicke Ihnen Fotos von dem gemeldete Schaden.",
        "Nach dem (Dativ) endet das Adjektiv auf -en: dem gemeldeten Schaden.",
      ],
    ],
  ],
  [
    "de.c.054",
    "N012",
    `Setze das passende Nomen ein${satz}Bis Freitag müssen wir eine ___ treffen. (entscheiden)`,
    ["Bis Freitag müssen wir eine Entscheidung treffen."],
    [
      [
        "Bis Freitag müssen wir entscheiden treffen.",
        "Entweder eine Entscheidung treffen oder entscheiden, nicht beides zusammen.",
      ],
    ],
  ],
  [
    "de.c.054",
    "N077",
    korrigiere("die Verbindung", "Ich habe entschieden getroffen."),
    [
      "Ich habe eine Entscheidung getroffen.",
      "Ich habe mich entschieden.",
      "Ich habe entschieden.",
    ],
  ],
  [
    "de.c.055",
    "N016",
    "Schreibe den Satz in neutraler Wortstellung, das Pronomen vor dem Nomen: Ich habe ___ angehängt. (meinen Entwurf, dir)",
    ["Ich habe dir meinen Entwurf angehängt."],
  ],
  [
    "de.c.055",
    "N017",
    `Setze die Pronomen in der neutralen Reihenfolge ein${satz}Ich wäre dir dankbar, wenn du ___ geben könntest. (mir, es)`,
    ["Ich wäre dir dankbar, wenn du es mir geben könntest."],
    [
      [
        "Ich wäre dir dankbar, wenn du mir es geben könntest.",
        "Bei zwei Pronomen steht der Akkusativ vor dem Dativ: es mir.",
      ],
      [
        "Ich wäre dir dankbar, wenn du es mir geben.",
        "Im wenn-Satz fehlt das konjugierte Verb am Ende: geben könntest.",
      ],
    ],
  ],
  [
    "de.c.068",
    "C010",
    "Schreibe die formelle Anrede richtig: ___ Damen und Herren, (sehr geehrt)",
    ["Sehr geehrte Damen und Herren,"],
    [
      [
        "Sehr geherte Damen und Herren,",
        "geehrt schreibt man mit zwei e: ge-ehrt, also Sehr geehrte.",
      ],
      [
        "Sehr gehrtee Damen und Herren,",
        "geehrt schreibt man mit zwei e: ge-ehrt, also Sehr geehrte.",
      ],
    ],
  ],
  [
    "de.c.085",
    "N007",
    du + "Bitte ___ mir Bescheid. (geben)",
    ["Bitte gib mir Bescheid."],
    [
      [
        "Bitte geben mir Bescheid.",
        "Der Imperativ mit du von geben heißt gib (e → i).",
      ],
      [
        "Bitte gebt mir Bescheid.",
        "gebt ist die ihr-Form; für eine Person mit du: gib.",
      ],
      [
        "Bitte geben di mir Bescheid.",
        "Für du heißt es gib; di ist kein deutsches Pronomen.",
      ],
    ],
  ],
  [
    "de.c.085",
    "N007",
    `Du sprichst eine Person mit Sie an. Setze den Imperativ ein${satz}Bitte ___ mir Bescheid. (geben)`,
    ["Bitte geben Sie mir Bescheid."],
    [
      [
        "Bitte geben mir Bescheid.",
        "Beim Imperativ mit Sie steht Sie nach dem Verb: Bitte geben Sie mir Bescheid.",
      ],
    ],
  ],
  [
    "de.c.085",
    "N005",
    du + "Ich habe es verstanden. ___ weiter. (machen)",
    [
      "Ich habe es verstanden. Mach weiter.",
      "Ich habe es verstanden. Mache weiter.",
    ],
    [
      [
        "Ich habe es verstanden. Macht weiter.",
        "macht ist die ihr-Form; für eine Person mit du: mach oder mache.",
      ],
      [
        "Ich habe verstanden, macht weiter.",
        "Für eine Person mit du heißt es mach weiter; macht ist die ihr-Form.",
      ],
    ],
  ],
  [
    "de.c.085",
    "N006",
    `Du sprichst zwei Personen mit ihr an. Setze den Imperativ ein${satz}___ mir zuerst den Unterschied. (erklären)`,
    ["Erklärt mir zuerst den Unterschied."],
    [
      [
        "Erklär mir zuerst den Unterschied.",
        "erklär ist die du-Form; für zwei Personen mit ihr: erklärt.",
      ],
      [
        "Erkläre mir zuerst den Unterschied.",
        "erkläre ist die du-Form; für zwei Personen mit ihr: erklärt.",
      ],
    ],
  ],
  [
    "de.c.085",
    "N004",
    du + "___ die Bedeutungen in Notion und mach weiter. (schreiben)",
    [
      "Schreib die Bedeutungen in Notion und mach weiter.",
      "Schreibe die Bedeutungen in Notion und mach weiter.",
    ],
    [
      [
        "Schreiben die Bedeutungen in Notion und mach weiter.",
        "schreiben ist der Infinitiv; für du heißt der Imperativ schreib oder schreibe.",
      ],
      [
        "Schreibt die Bedeutungen in Notion und mach weiter.",
        "schreibt ist die ihr-Form; für eine Person mit du: schreib oder schreibe.",
      ],
    ],
  ],
  [
    "de.c.088",
    "N026",
    `Setze dies- in der passenden Form ein${satz}Er kann an ___ Tag leider nicht kommen. (diesen / diesem)`,
    ["Er kann an diesem Tag leider nicht kommen."],
  ],
  [
    "de.c.088",
    "C023",
    `Setze die passende Präposition ein${satz}Ich habe ___ September einen Termin. (am / im)`,
    ["Ich habe im September einen Termin."],
  ],
  [
    "de.c.092",
    "N060",
    `Setze das Verb an Position 2${satz}Ich lerne heute Abend, denn morgen ___ ich eine Prüfung. (haben)`,
    ["Ich lerne heute Abend, denn morgen habe ich eine Prüfung."],
    [
      [
        "Ich lerne heute Abend, denn morgen ich habe eine Prüfung.",
        "Nach denn folgt ein Hauptsatz mit dem Verb an Position 2: denn morgen habe ich …",
      ],
      [
        "Ich lerne heute Abend, denn morgen ich eine Prüfung habe.",
        "denn leitet keinen Nebensatz ein; das Verb steht an Position 2: denn morgen habe ich …",
      ],
    ],
  ],
  [
    "de.c.093",
    "N025",
    `Setze den festen Ausdruck ein${satz}Nach ___ paar Monaten konnte ich besser Deutsch sprechen. (dem / ein)`,
    ["Nach ein paar Monaten konnte ich besser Deutsch sprechen."],
  ],
  [
    "de.c.095",
    "N020",
    `Setze die Adjektivendung ein${satz}Wir testen den ___ Ansatz. (neu)`,
    ["Wir testen den neuen Ansatz."],
    [
      [
        "Wir testen den neue Ansatz.",
        "Nach den (Akkusativ, maskulin) endet das Adjektiv auf -en: den neuen Ansatz.",
      ],
    ],
  ],
  [
    "de.c.095",
    "N043",
    `Setze die Adjektivendung ein${satz}Ich konnte kein ___ Foto machen. (gut)`,
    ["Ich konnte kein gutes Foto machen."],
    [
      [
        "Ich konnte kein gute Foto machen.",
        "Nach kein (neutral, Akkusativ) endet das Adjektiv auf -es: kein gutes Foto.",
      ],
    ],
  ],
  [
    "de.c.095",
    "N050",
    `Setze die Adjektivendung ein${satz}Ich bin mit meiner ___ Aufgabe fertig. (heutig)`,
    ["Ich bin mit meiner heutigen Aufgabe fertig."],
    [
      [
        "Ich bin mit meiner heutige Aufgabe fertig.",
        "Nach meiner (Dativ, feminin) endet das Adjektiv auf -en: meiner heutigen Aufgabe.",
      ],
    ],
  ],
  [
    "de.c.095",
    "C019",
    `Setze das Adjektiv mit Endung ein${satz}Gibt es einen ___ Weg? (alternativ)`,
    ["Gibt es einen alternativen Weg?"],
    [
      [
        "Gibt es einen Alternative Weg?",
        "Adjektive schreibt man klein, und nach einen (Akkusativ, maskulin) endet das Adjektiv auf -en.",
      ],
      [
        "Gibt es einen alternative Weg?",
        "Nach einen (Akkusativ, maskulin) endet das Adjektiv auf -en: einen alternativen Weg.",
      ],
    ],
  ],
  [
    "de.c.095",
    "N073",
    `Setze die Adjektivendung ein${satz}Bring bitte meine ___ Materialien mit. (bisherig)`,
    [
      "Bring bitte meine bisherigen Materialien mit.",
      "Bringe bitte meine bisherigen Materialien mit.",
    ],
    [
      [
        "Bring bitte meiner bisherigen Materialien mit.",
        "mitbringen braucht den Akkusativ: meine bisherigen Materialien.",
      ],
      [
        "Bring bitte meine bisherige Materialien mit.",
        "Nach meine im Plural endet das Adjektiv auf -en: meine bisherigen Materialien.",
      ],
    ],
  ],
  [
    "de.c.096",
    "N064",
    `Setze das Relativpronomen ein${satz}Es geht um die zwei Mahnungen, ___ ich von Ihnen bekommen habe. (dass / die)`,
    ["Es geht um die zwei Mahnungen, die ich von Ihnen bekommen habe."],
  ],
  [
    "de.c.098",
    "C001",
    `Setze das Verb nach deshalb ein${satz}Die Universität bekommt weniger Geld. Deshalb ___ sie einige Projekte stoppen. (müssen)`,
    [
      "Die Universität bekommt weniger Geld. Deshalb muss sie einige Projekte stoppen.",
    ],
    [
      [
        "Die Universität bekommt weniger Geld. Deshalb sie muss einige Projekte stoppen.",
        "Nach deshalb am Satzanfang folgt direkt das Verb: Deshalb muss sie …",
      ],
      [
        "Die Universität bekommt weniger Geld. Deshalb sie einige Projekte stoppen muss.",
        "deshalb leitet keinen Nebensatz ein; das Verb steht an Position 2: Deshalb muss sie …",
      ],
    ],
  ],
  [
    "de.c.098",
    "C009",
    `Setze die Form von sein ein${satz}Du schreibst nur die Endung. Deswegen ___ es für mich nicht verständlich. (sein)`,
    [
      "Du schreibst nur die Endung. Deswegen ist es für mich nicht verständlich.",
    ],
    [
      [
        "Du schreibst nur die Endung. Deswegen es ist für mich nicht verständlich.",
        "Nach deswegen am Satzanfang folgt direkt das Verb: Deswegen ist es …",
      ],
      [
        "Du schreibst nur die Endung. Deswegen für mich es nicht verständlich.",
        "Der Satz braucht ein Verb an Position 2: Deswegen ist es für mich nicht verständlich.",
      ],
    ],
  ],
  [
    "de.c.100",
    "N010",
    korrigiere("Verbindung und Kasus", "Ich habe mit Herr Becker kontaktiert."),
    [
      "Ich habe Herrn Becker kontaktiert.",
      "Ich habe mit Herrn Becker Kontakt aufgenommen.",
    ],
    [
      [
        "Ich habe mit Herrn Becker kontaktiert.",
        "kontaktieren braucht kein mit: jemanden kontaktieren (Akkusativ).",
      ],
      [
        "Ich habe Herr Becker kontaktiert.",
        "Im Akkusativ heißt es Herrn: Ich habe Herrn Becker kontaktiert.",
      ],
    ],
  ],
  [
    "de.c.100",
    "N019",
    korrigiere("die Präposition", "Nächste Woche rufe ich auf Kanzlei an."),
    [
      "Nächste Woche rufe ich die Kanzlei an.",
      "Nächste Woche rufe ich in der Kanzlei an.",
    ],
  ],
  [
    "de.c.101",
    "N009",
    korrigiere("das Verb", "Die Firma wird mir morgen anmelden."),
    ["Die Firma wird sich morgen bei mir melden."],
  ],
  [
    "de.c.101",
    "C039",
    `Setze Präposition und Artikel ein${satz}Ich bin auf der Suche ___ Gruppe. (eine / nach einer)`,
    ["Ich bin auf der Suche nach einer Gruppe."],
  ],
  [
    "de.c.101",
    "N032",
    `Setze das Verb mit Präposition ein${satz}Software ___ Anweisungen und Daten. (bestehen, aus)`,
    ["Software besteht aus Anweisungen und Daten."],
  ],
  [
    "de.c.101",
    "C037",
    `Setze die passende Präposition ein${satz}Ich möchte mich ___ den Kurs anmelden. (an / für)`,
    ["Ich möchte mich für den Kurs anmelden."],
  ],
  [
    "de.c.102",
    "N061",
    `Setze die passende Form von werden ein${satz}Bis wann ___ sich die Werkstatt bei mir melden? (werden)`,
    [
      "Bis wann wird sich die Werkstatt bei mir melden?",
      "Bis wann wird die Werkstatt sich bei mir melden?",
    ],
    [
      [
        "Bis wann wird sich die Werkstatt bei mir melden wird?",
        "wird steht in der Frage nur einmal, direkt nach dem Fragewort; melden steht am Ende.",
      ],
      [
        "Bis wann wird die Werkstatt sich wird bei mir melden?",
        "wird steht nur einmal, direkt nach dem Fragewort: Bis wann wird sich …",
      ],
      [
        "Bis wann die Werkstatt wird sich bei mir melden?",
        "In der W-Frage steht das konjugierte Verb direkt nach dem Fragewort: Bis wann wird …",
      ],
    ],
  ],
  [
    "de.c.104",
    "N076",
    `Ergänze die Infinitivgruppe${satz}Es fällt mir schwer, früh ___. (aufstehen)`,
    ["Es fällt mir schwer, früh aufzustehen."],
    [
      [
        "Es fällt mir schwer, früh aufstehen.",
        "Nach es fällt mir schwer folgt zu + Infinitiv; bei trennbaren Verben steht zu in der Mitte: aufzustehen.",
      ],
      [
        "Es fällt mir schwer, früh zu aufstehen.",
        "Bei trennbaren Verben steht zu zwischen Vorsilbe und Verb: aufzustehen.",
      ],
    ],
  ],
  [
    "de.c.109",
    "N058",
    `Setze Danach oder Nachdem ein${satz}Die Software liest die Daten. ___ verarbeitet sie die Daten. (Nachdem / Danach)`,
    ["Die Software liest die Daten. Danach verarbeitet sie die Daten."],
  ],
  [
    "de.c.109",
    "N058",
    `Setze Nachdem oder Danach ein${satz}___ die Software die Daten gelesen hat, erzeugt sie eine Ausgabe. (Danach / Nachdem)`,
    ["Nachdem die Software die Daten gelesen hat, erzeugt sie eine Ausgabe."],
  ],
  [
    "de.c.109",
    "N059",
    `Setze das Verb ans Ende${satz}Ich möchte die Rechnung bezahlen, bevor ich eine Mahnung ___. (erhalten)`,
    ["Ich möchte die Rechnung bezahlen, bevor ich eine Mahnung erhalte."],
    [
      [
        "Ich möchte die Rechnung bezahlen, bevor ich erhalte eine Mahnung.",
        "Im bevor-Satz steht das konjugierte Verb am Ende: bevor ich eine Mahnung erhalte.",
      ],
    ],
  ],
  [
    "de.c.111",
    "N011",
    `Bilde den Satz mit lassen${satz}Mein Nachbar muss sich am Knie ___. (lassen, operieren)`,
    ["Mein Nachbar muss sich am Knie operieren lassen."],
    [
      [
        "Mein Nachbar muss sich am Knie lassen operieren.",
        "Mit Modalverb stehen beide Verben am Ende, lassen zuletzt: operieren lassen.",
      ],
      [
        "Mein Nachbar muss sich einer Operation am Knie lassen.",
        "Mische die Muster nicht: sich operieren lassen oder sich einer Operation unterziehen.",
      ],
    ],
  ],
  [
    "de.c.111",
    "N011",
    `Setze lassen in der passenden Form ein${satz}Meine Nachbarin ___ die Heizung reparieren. (lassen)`,
    ["Meine Nachbarin lässt die Heizung reparieren."],
  ],
  [
    "de.c.114",
    "N036",
    `Setze den Genitiv Plural ein${satz}Ich schreibe Ihnen bezüglich der zwei ___. (Mahnung)`,
    ["Ich schreibe Ihnen bezüglich der zwei Mahnungen."],
    [
      [
        "Ich schreibe Ihnen bezüglich der zwei Mahnung.",
        "Nach zwei steht das Nomen im Plural: Mahnungen.",
      ],
      [
        "Ich schreibe Ihnen bezüglich Zwei Mahnung.",
        "bezüglich verlangt hier den Genitiv mit Artikel: der zwei Mahnungen. zwei schreibt man klein.",
      ],
    ],
  ],
  [
    "de.c.114",
    "N037",
    `Setze den Genitiv ein${satz}Ich wende mich an Sie bezüglich meines ___. (Kurs)`,
    ["Ich wende mich an Sie bezüglich meines Kurses."],
    [
      [
        "Ich wende mich an Sie bezüglich meiner Kurs.",
        "Kurs ist maskulin; im Genitiv heißt es meines Kurses.",
      ],
    ],
  ],
  [
    "de.c.114",
    "N038",
    `Setze den Artikel ein${satz}Ich rufe wegen ___ Garantie an. (die / der)`,
    ["Ich rufe wegen der Garantie an."],
  ],
  [
    "de.c.114",
    "C043",
    `Setze den Possessivartikel im Genitiv ein${satz}Ich habe den Text auf Grundlage ___ Hinweise überarbeitet. (Ihre / Ihrer)`,
    ["Ich habe den Text auf Grundlage Ihrer Hinweise überarbeitet."],
  ],
  [
    "de.c.114",
    "N061",
    `Setze den Genitiv ein${satz}Ich rufe wegen ___ Schadens an. (dem / des)`,
    ["Ich rufe wegen des Schadens an."],
  ],
  [
    "de.c.117",
    "C015",
    `Setze das Verb ans Ende${satz}Ich möchte nicht warten, bis ich eine zweite Mahnung ___. (erhalten)`,
    ["Ich möchte nicht warten, bis ich eine zweite Mahnung erhalte."],
    [
      [
        "Ich möchte nicht, warten bis ich eine zweite Mahnung erhalte.",
        "Das Komma steht vor dem Nebensatz mit bis: nicht warten, bis ich …",
      ],
    ],
  ],
  [
    "de.c.148",
    "N028",
    `Setze dies- in der passenden Form ein${satz}Was ist die heutige Aufgabe in ___ Roadmap? (dieses / dieser)`,
    ["Was ist die heutige Aufgabe in dieser Roadmap?"],
  ],
  [
    "de.c.148",
    "N042",
    `Setze dies- in der passenden Form ein${satz}Ich brauche ___ Geld für die Miete. (diese / dieses)`,
    ["Ich brauche dieses Geld für die Miete."],
  ],
  [
    "de.c.149",
    "N020",
    `Setze den Artikel ein${satz}Wir testen ___ neue System. (den / das)`,
    ["Wir testen das neue System."],
  ],
  [
    "de.c.149",
    "N041",
    `Setze den Artikel ein${satz}Wir bilden ___ Gruppe. (einen / eine)`,
    ["Wir bilden eine Gruppe."],
  ],
  [
    "de.c.149",
    "N035",
    `Setze den Artikel ein${satz}___ Ende des Kurses ist im Juli. (Die / Das)`,
    ["Das Ende des Kurses ist im Juli."],
  ],
  [
    "de.c.149",
    "N049",
    `Setze den Artikel ein${satz}___ Bett im Hotel war kaputt. (Die / Das)`,
    ["Das Bett im Hotel war kaputt."],
  ],
  [
    "de.c.149",
    "C020",
    `Setze den Artikel ein${satz}Ich möchte ___ Konto eröffnen. (einen / ein)`,
    ["Ich möchte ein Konto eröffnen."],
  ],
  [
    "de.c.152",
    "N076",
    `Setze schwerfallen mit es ein${satz}Ohne Brille ___ mir schwer, kleine Schrift zu lesen. (fallen, es)`,
    ["Ohne Brille fällt es mir schwer, kleine Schrift zu lesen."],
    [
      [
        "Ohne Brille es fällt mir schwer, kleine Schrift zu lesen.",
        "Nach Ohne Brille am Satzanfang folgt direkt das Verb: Ohne Brille fällt es mir schwer …",
      ],
      [
        "Ohne Brille mir ist sehr schwer, kleine Schrift zu lesen.",
        "Für eine Schwierigkeit sagt man es fällt mir schwer, und das Verb steht an Position 2.",
      ],
    ],
  ],
  [
    "de.c.153",
    "C013",
    `Bilde ein zusammengesetztes Nomen${satz}Bitte nennen Sie die ___. (Rechnung, Nummer)`,
    ["Bitte nennen Sie die Rechnungsnummer."],
    [
      [
        "Bitte nennen Sie die Rechnungnummer.",
        "Nach Rechnung steht ein Fugen-s: Rechnungsnummer.",
      ],
      [
        "Bitte nennen Sie die Rechnung Nummer.",
        "Ein zusammengesetztes Nomen schreibt man zusammen: Rechnungsnummer.",
      ],
    ],
  ],
  [
    "de.c.153",
    "C034",
    `Bilde ein zusammengesetztes Nomen${satz}Die neuen Daten waren nicht in den ___ enthalten. (Training, Daten)`,
    ["Die neuen Daten waren nicht in den Trainingsdaten enthalten."],
    [
      [
        "Die neuen Daten waren nicht in den Training Daten enthalten.",
        "Ein zusammengesetztes Nomen schreibt man zusammen, hier mit Fugen-s: Trainingsdaten.",
      ],
    ],
  ],
  [
    "de.c.153",
    "C042",
    `Bilde ein zusammengesetztes Nomen${satz}Die Werkstatt hat mir einen ___ geschickt. (Kosten, Voranschlag)`,
    ["Die Werkstatt hat mir einen Kostenvoranschlag geschickt."],
    [
      [
        "Die Werkstatt hat mir einen Kosten Vorschlag geschickt.",
        "Das Wort heißt Kostenvoranschlag und wird zusammengeschrieben.",
      ],
    ],
  ],
];

const ENGLISH: readonly Row[] = [
  [
    "en.c.001",
    "EN24",
    "Correct the sentence: I study English because useful.",
    [
      "I study English because it is useful.",
      "I study English because it’s useful.",
    ],
  ],
  [
    "en.c.003",
    "EN05",
    "Correct the sentence: How can program read text?",
    [
      "How can a program read text?",
      "How can the program read text?",
      "How can my program read text?",
    ],
  ],
  [
    "en.c.003",
    "EN06",
    "Correct the sentence: This letter is part of word.",
    ["This letter is part of a word.", "This letter is part of the word."],
  ],
  [
    "en.c.003",
    "C021",
    "Complete the sentence with a or an: It was ___ unwanted purchase.",
    ["It was an unwanted purchase."],
  ],
  [
    "en.c.007",
    "EN15",
    "Use the verb in brackets in the present simple: My friend ___ coffee every morning. (drink)",
    ["My friend drinks coffee every morning."],
    [
      [
        "My friend drink coffee every morning.",
        "With he, she, it or one person, the present simple verb takes -s: drinks.",
      ],
    ],
  ],
  [
    "en.c.007",
    "EN15",
    "Correct the sentence: My brother study English every evening.",
    ["My brother studies English every evening."],
    [
      [
        "My brother studys English every evening.",
        "After a consonant, y changes to -ies: studies.",
      ],
    ],
  ],
  [
    "en.c.007",
    "EN07",
    "Correct the sentence: My mean is all words, not just this example.",
    ["I mean all words, not just this example."],
  ],
  [
    "en.c.007",
    "EN23",
    "Correct the sentence: It is my mean.",
    ["That’s what I mean.", "That is what I mean."],
  ],
  [
    "en.c.007",
    "EN20",
    "Complete the sentence with brush or wash: I ___ my teeth before bed.",
    ["I brush my teeth before bed."],
  ],
  [
    "en.c.008",
    "EN16",
    "Correct the sentence: My friend doesn’t drinks tea.",
    ["My friend doesn’t drink tea.", "My friend does not drink tea."],
    [
      [
        "My friend don’t drink tea.",
        "With one person, use doesn’t: My friend doesn’t drink tea.",
      ],
    ],
  ],
  [
    "en.c.009",
    "EN17",
    "Complete the question with Do or Does: ___ your friend study English?",
    ["Does your friend study English?"],
    [
      [
        "Does your friend studies English?",
        "After does, the main verb stays in the base form: study.",
      ],
    ],
  ],
  [
    "en.c.009",
    "EN17",
    "Correct the question: Does she can study today?",
    ["Can she study today?"],
  ],
  [
    "en.c.011",
    "EN03",
    "Put the words in the right order and write the question: how / we / can / check / the result",
    ["How can we check the result?"],
    [
      [
        "How we can check the result?",
        "In a direct question, can comes before the subject: How can we …?",
      ],
    ],
  ],
  [
    "en.c.011",
    "EN04",
    "Correct the question: How can open the files on my laptop?",
    [
      "How can I open the files on my laptop?",
      "How can we open the files on my laptop?",
    ],
  ],
  [
    "en.c.011",
    "EN02",
    "Correct the question: How kann a program recognise the word?",
    [
      "How can a program recognise the word?",
      "How can a program recognize the word?",
    ],
  ],
  [
    "en.c.011",
    "C021",
    "Correct the sentence: Until next week, I may not to use a computer.",
    [
      "Until next week, I may not use a computer.",
      "Until next week, I am not allowed to use a computer.",
    ],
  ],
  [
    "en.c.013",
    "EN21",
    "Complete the sentence with in or on: I was tired, so I stayed ___ bed.",
    ["I was tired, so I stayed in bed."],
  ],
  [
    "en.c.013",
    "EN21",
    "Complete the sentence with in or on: The bag is ___ the bed.",
    ["The bag is on the bed."],
  ],
  [
    "en.c.026",
    "EN18",
    "Correct the sentence: I study usually study in the evening.",
    ["I usually study in the evening."],
  ],
  [
    "en.c.026",
    "EN19",
    "Complete the sentence: I practise English ___. (every day / everyday)",
    ["I practise English every day.", "I practice English every day."],
  ],
  [
    "en.c.026",
    "EN19",
    "Complete the sentence: These are ___ tasks. (every day / everyday)",
    ["These are everyday tasks."],
  ],
  [
    "en.c.035",
    "C021",
    "Complete the sentence with would and it: I ___ if you could reply soon. (appreciate)",
    [
      "I would appreciate it if you could reply soon.",
      "I’d appreciate it if you could reply soon.",
    ],
  ],
  [
    "en.c.081",
    "EN10",
    "Correct the spacing: In Python , can we check this ?",
    ["In Python, can we check this?"],
  ],
  [
    "en.c.081",
    "EN11",
    "Correct the punctuation: I mean all words how can we check them",
    ["I mean all words. How can we check them?"],
    [
      [
        "I mean all words, how can we check them?",
        "A comma cannot join a statement and a question. End the statement with a full stop: … words. How can we …?",
      ],
    ],
  ],
  [
    "en.c.091",
    "EN01",
    "Correct the capital letters: in python, i can open a file.",
    ["In Python, I can open a file."],
  ],
  [
    "en.c.091",
    "EN08",
    "Correct the sentence: It isnot a plural marker.",
    ["It isn’t a plural marker.", "It is not a plural marker."],
  ],
  [
    "en.c.101",
    "EN09",
    "Complete the sentence with function and as: Here, the letter s does not ___ a plural marker. (function)",
    ["Here, the letter s does not function as a plural marker."],
    [
      [
        "Here, the letter s is not as a plural marker.",
        "Use as after a verb such as function or serve, or leave out as: The letter s is not a plural marker.",
      ],
    ],
  ],
  [
    "en.c.106",
    "EN14",
    "Complete the question with whether or that: How can we tell ___ a file is empty or contains data?",
    [
      "How can we tell whether a file is empty or contains data?",
      "How can we tell if a file is empty or contains data?",
    ],
  ],
];

export const LEARNER_NOTEBOOK_PRACTICE: readonly NotebookItem[] = [
  ...GERMAN,
  ...ENGLISH,
].map(([unit, notebook, prompt, answers, rejected]) => ({
  unit,
  notebook,
  prompt,
  answers,
  ...(rejected && {
    rejected: rejected.map(([answer, explanation]) => ({
      answer,
      explanation,
    })),
  }),
}));
