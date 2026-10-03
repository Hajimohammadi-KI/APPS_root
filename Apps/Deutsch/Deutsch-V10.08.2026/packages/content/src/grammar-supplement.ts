import type { GrammarUnit } from "./index";

type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

interface GrammarSpec {
  readonly level: Level;
  readonly title: string;
  readonly rule: string;
  readonly example: string;
  readonly contrast: string;
  /**
   * Overrides the generic exercise template below. Needed when `example` is
   * not a plain sentence (e.g. a dash-joined pattern), since the generic
   * exercises assume `example` can stand in for a sentence answer.
   */
  readonly exercises?: readonly (readonly [string, string])[];
}

const specs: readonly GrammarSpec[] = [
  {
    level: "A1",
    title: "Imperativ mit du, ihr und Sie",
    rule: "Bilde kurze Aufforderungen mit der passenden Imperativform und wähle die Anrede passend zur Situation.",
    example: "Komm bitte herein. Kommt bitte herein. Kommen Sie bitte herein.",
    contrast: "Nicht: Du komm herein. Sondern: Komm herein.",
  },
  {
    level: "A1",
    title: "Satzklammer im einfachen Hauptsatz",
    rule: "Setze den konjugierten Verbteil an Position zwei und den zweiten Verbteil ans Satzende.",
    example: "Ich stehe jeden Morgen um sieben Uhr auf.",
    contrast:
      "Nicht: Ich aufstehe um sieben Uhr. Sondern: Ich stehe um sieben Uhr auf.",
  },
  {
    level: "A1",
    title: "Uhrzeit, Datum und Reihenfolge",
    rule: "Verwende um für Uhrzeiten, am für Tage und Daten und zuerst, dann, danach für eine klare Reihenfolge.",
    example: "Am Montag beginne ich um neun Uhr. Danach mache ich eine Pause.",
    contrast: "Nicht: in Montag. Sondern: am Montag.",
  },
  {
    level: "A1",
    title: "Temporale Präpositionen am, um und im",
    rule: "Wähle am bei Tagen, um bei Uhrzeiten und im bei Monaten, Jahreszeiten und Jahren.",
    example: "Am Freitag lerne ich um acht Uhr im Augustkurs.",
    contrast: "Nicht: um Freitag. Sondern: am Freitag.",
  },
  {
    level: "A1",
    title: "Häufigkeitsadverbien",
    rule: "Setze oft, manchmal, selten oder nie im Mittelfeld, meist nach dem konjugierten Verb.",
    example: "Ich lerne abends oft Deutsch.",
    contrast: "Nicht: Ich oft lerne Deutsch. Sondern: Ich lerne oft Deutsch.",
  },
  {
    level: "A1",
    title: "es gibt mit Akkusativ",
    rule: "Verwende es gibt mit einem Akkusativobjekt, wenn du sagst, dass etwas vorhanden ist.",
    example: "In meiner Straße gibt es einen Supermarkt.",
    contrast:
      "Nicht: Es gibt ein Supermarkt. Sondern: Es gibt einen Supermarkt.",
  },
  {
    level: "A1",
    title: "man für allgemeine Aussagen",
    rule: "Verwende man mit der Verbform der dritten Person Singular für allgemeine Aussagen.",
    example: "In Deutschland trinkt man viel Kaffee.",
    contrast: "Nicht: man trinken. Sondern: man trinkt.",
  },
  {
    level: "A1",
    title: "und, aber, denn und oder",
    rule: "Verbinde zwei Hauptsätze mit und, aber, denn oder oder; die normale Wortstellung bleibt erhalten.",
    example: "Ich lerne Deutsch, denn ich lebe in Berlin.",
    contrast: "Nicht: denn lebe ich. Sondern: denn ich lebe.",
  },
  {
    level: "A1",
    title: "Mengenwörter viel, wenig und genug",
    rule: "Wähle viel und wenig bei nicht zählbaren Mengen und viele oder wenige bei zählbaren Nomen im Plural.",
    example: "Ich habe wenig Zeit, aber viele Aufgaben.",
    contrast: "Nicht: viele Zeit. Sondern: viel Zeit.",
  },
  {
    level: "A1",
    title: "Akkusativpronomen",
    rule: "Ersetze ein Akkusativobjekt mit mich, dich, ihn, sie, es, uns, euch oder sie.",
    example: "Ich sehe den Bus. Ich sehe ihn.",
    contrast: "Nicht: Ich sehe er. Sondern: Ich sehe ihn.",
  },

  {
    level: "A2",
    title: "Adjektivdeklination nach Artikeln",
    rule: "Passe die Adjektivendung an Artikel, Kasus, Genus und Numerus an.",
    example: "Ich kaufe einen warmen Mantel und eine warme Jacke.",
    contrast: "Nicht: einen warme Mantel. Sondern: einen warmen Mantel.",
  },
  {
    level: "A2",
    title: "Relativsätze mit der, die und das",
    rule: "Verbinde Informationen mit einem Relativpronomen; das Verb steht im Relativsatz am Ende.",
    example: "Das ist die Frau, die nebenan wohnt.",
    contrast: "Nicht: die wohnt nebenan. Sondern: die nebenan wohnt.",
  },
  {
    level: "A2",
    title: "Nebensätze mit ob",
    rule: "Verwende ob für indirekte Ja-Nein-Fragen und stelle das konjugierte Verb ans Ende.",
    example: "Ich weiß nicht, ob der Kurs heute stattfindet.",
    contrast:
      "Nicht: ob findet der Kurs statt. Sondern: ob der Kurs stattfindet.",
  },
  {
    level: "A2",
    title: "darum, deshalb und deswegen",
    rule: "Verwende darum, deshalb oder deswegen als Satzadverb; danach folgt direkt das konjugierte Verb.",
    example: "Ich bin müde. Deshalb gehe ich früh ins Bett.",
    contrast: "Nicht: Deshalb ich gehe. Sondern: Deshalb gehe ich.",
  },
  {
    level: "A2",
    title: "denn und sondern",
    rule: "Begründe mit denn und korrigiere nach einer Verneinung mit sondern; die Hauptsatzstellung bleibt erhalten.",
    example: "Ich fahre nicht, sondern ich gehe zu Fuß.",
    contrast: "Nicht: sondern gehe ich. Sondern: sondern ich gehe.",
  },
  {
    level: "A2",
    title: "Verben mit Dativ und Akkusativ",
    rule: "Ordne bei geben, schicken oder zeigen die Person meist im Dativ und die Sache im Akkusativ zu.",
    example: "Ich zeige meiner Freundin das Foto.",
    contrast:
      "Nicht: Ich zeige meine Freundin das Foto. Sondern: meiner Freundin.",
  },
  {
    level: "A2",
    title: "Verben mit Präpositionen Grundlagen",
    rule: "Lerne Verb und feste Präposition zusammen und bilde die Ergänzung im verlangten Kasus.",
    example: "Ich warte auf den Bus.",
    contrast: "Nicht: Ich warte für den Bus. Sondern: auf den Bus.",
  },
  {
    level: "A2",
    title: "Futur I mit werden",
    rule: "Bilde Futur I mit werden an Position zwei und dem Infinitiv am Satzende.",
    example: "Morgen werde ich länger arbeiten.",
    contrast: "Nicht: Ich werde arbeite. Sondern: Ich werde arbeiten.",
  },
  {
    level: "A2",
    title: "da- und wo-Komposita Grundlagen",
    rule: "Frage bei Sachen mit wo(r)+Präposition und antworte mit da(r)+Präposition.",
    example: "Worauf wartest du? Ich warte darauf.",
    contrast:
      "Bei Personen: Auf wen wartest du? Nicht: Worauf bei einer Person.",
  },
  {
    level: "A2",
    title: "Infinitiv mit zu Grundlagen",
    rule: "Verwende zu vor dem Infinitiv nach passenden Verben und Ausdrücken; bei trennbaren Verben steht zu in der Mitte.",
    example: "Ich versuche, früher aufzustehen.",
    contrast: "Nicht: zu aufstehen. Sondern: aufzustehen.",
  },

  {
    level: "B1",
    title: "Adjektivdeklination vollständig",
    rule: "Bestimme zuerst Artikeltyp, Kasus, Genus und Numerus und wähle danach die vollständige Adjektivendung.",
    example: "Trotz des kalten Wetters besuchen wir den neuen Markt.",
    contrast: "Nicht: trotz des kaltes Wetters. Sondern: des kalten Wetters.",
  },
  {
    level: "B1",
    title: "Pronominaladverbien",
    rule: "Verweise auf Sachen mit daran, darauf, damit oder davon; bei Personen bleibt Präposition plus Pronomen.",
    example: "Ich denke oft daran. An wen denkst du?",
    contrast: "Nicht: daran bei einer Person. Sondern: an ihn oder an sie.",
  },
  {
    level: "B1",
    title: "Futur I für Prognosen und Vermutungen",
    rule: "Verwende werden plus Infinitiv für Prognosen und mit wohl für gegenwärtige Vermutungen.",
    example: "Sie wird wohl noch im Büro sein.",
    contrast:
      "Die Form kann Zukunft oder Vermutung ausdrücken; der Kontext entscheidet.",
  },
  {
    level: "B1",
    title: "Vorgangspassiv und Zustandspassiv",
    rule: "Unterscheide werden plus Partizip für einen Vorgang von sein plus Partizip für ein Ergebnis oder einen Zustand.",
    example: "Die Tür wird geöffnet. Danach ist sie geöffnet.",
    contrast: "Vorgang: wird geöffnet. Zustand: ist geöffnet.",
  },
  {
    level: "B1",
    title: "Temporalsätze mit bevor, nachdem und seitdem",
    rule: "Ordne Ereignisse mit bevor, nachdem und seitdem; im Nebensatz steht das Verb am Ende.",
    example: "Nachdem ich gegessen hatte, ging ich spazieren.",
    contrast:
      "Nicht: Nachdem hatte ich gegessen. Sondern: nachdem ich gegessen hatte.",
  },
  {
    level: "B1",
    title: "ohne zu und anstatt zu",
    rule: "Verkürze Nebensätze bei gleichem Subjekt mit ohne zu oder anstatt zu plus Infinitiv.",
    example: "Er ging, ohne sich zu verabschieden.",
    contrast:
      "Bei verschiedenem Subjekt ist meist ein vollständiger Nebensatz nötig.",
  },
  {
    level: "B1",
    title: "lassen als Vollverb und Hilfsverb",
    rule: "Verwende lassen für zurücklassen, veranlassen oder die Konstruktion lassen plus Infinitiv.",
    example: "Ich lasse mein Fahrrad reparieren.",
    contrast:
      "Nicht: Ich lasse mein Fahrrad zu reparieren. Sondern: reparieren.",
  },
  {
    level: "B1",
    title: "brauchen nicht zu",
    rule: "Verwende brauchen nicht zu plus Infinitiv, wenn etwas nicht notwendig ist.",
    example: "Du brauchst heute nicht zu kommen.",
    contrast:
      "Nicht: Du brauchst nicht kommen in formeller Standardsprache. Besser: nicht zu kommen.",
  },
  {
    level: "B1",
    title: "Zweiteilige Konnektoren",
    rule: "Verbinde gleichwertige Satzteile mit entweder oder, nicht nur sondern auch sowie einerseits andererseits.",
    example:
      "Einerseits spart die App Zeit, andererseits braucht sie Aufmerksamkeit.",
    contrast: "Halte die verbundenen Teile grammatisch parallel.",
  },
  {
    level: "B1",
    title: "Genitivpräpositionen",
    rule: "Verwende trotz, während, wegen und innerhalb in formeller Standardsprache mit dem Genitiv.",
    example: "Wegen des starken Regens blieb ich zu Hause.",
    contrast:
      "Nicht: wegen dem Regen in formeller Sprache. Sondern: wegen des Regens.",
  },

  {
    level: "B2",
    title: "Indirekte Rede mit Konjunktiv I",
    rule: "Gib fremde Aussagen distanziert mit Konjunktiv I wieder und weiche bei Formgleichheit auf Konjunktiv II aus.",
    example: "Sie sagt, sie habe keine Zeit.",
    contrast: "Direkt: Ich habe keine Zeit. Indirekt: sie habe keine Zeit.",
  },
  {
    level: "B2",
    title: "Modalpartikeln im Gespräch",
    rule: "Nutze doch, ja, eben, halt oder mal, um Haltung und Gesprächston zu steuern, ohne den Sachinhalt zu ändern.",
    example: "Komm doch morgen kurz vorbei.",
    contrast:
      "Modalpartikeln sind nicht frei austauschbar; Situation und Ton entscheiden.",
  },
  {
    level: "B2",
    title: "Komplexe Temporalsätze",
    rule: "Verknüpfe parallele, vorzeitige und nachzeitige Ereignisse mit während, sobald, solange, ehe und nachdem.",
    example:
      "Sobald die Ergebnisse vorliegen, informieren wir alle Beteiligten.",
    contrast: "Prüfe das Zeitverhältnis, bevor du den Konnektor wählst.",
  },
  {
    level: "B2",
    title: "Konzessive Verknüpfung mit dennoch und gleichwohl",
    rule: "Markiere einen unerwarteten Gegensatz mit dennoch oder gleichwohl; das finite Verb folgt direkt.",
    example:
      "Die Daten waren unvollständig; dennoch war eine vorsichtige Analyse möglich.",
    contrast:
      "Nicht: dennoch die Analyse war. Sondern: dennoch war die Analyse.",
  },
  {
    level: "B2",
    title: "Kausale und konsekutive Verknüpfung",
    rule: "Unterscheide Ursache mit da, weil, aufgrund und Folge mit sodass, daher oder folglich.",
    example:
      "Die Stichprobe war klein, sodass die Aussagekraft begrenzt blieb.",
    contrast: "Ursache beantwortet warum; Folge beschreibt das Ergebnis.",
  },
  {
    level: "B2",
    title: "Partizipialattribute erweitern",
    rule: "Verdichte Relativsätze mit erweiterten Partizipialattributen und passe die Adjektivendung an.",
    example: "die im Seminar diskutierten Ergebnisse",
    contrast:
      "Entfalte zur Kontrolle: die Ergebnisse, die im Seminar diskutiert wurden.",
  },
  {
    level: "B2",
    title: "Nominalisierte Adjektive",
    rule: "Schreibe nominalisierte Adjektive groß und dekliniere sie wie Adjektive nach dem Begleiter.",
    example: "Viele Lernende wünschen sich mehr Zeit.",
    contrast: "Nicht: die lernenden als Nomen klein. Sondern: die Lernenden.",
  },
  {
    level: "B2",
    title: "Erweiterte Genitivpräpositionen",
    rule: "Verwende angesichts, hinsichtlich, mittels und zugunsten mit dem Genitiv in formellen Texten.",
    example: "Hinsichtlich der Ergebnisse bleiben mehrere Fragen offen.",
    contrast: "Prüfe, ob ein einfacheres Verb im Alltag natürlicher wäre.",
  },
  {
    level: "B2",
    title: "Funktionsverbgefüge systematisch",
    rule: "Verbinde ein bedeutungsarmes Verb mit einem Nomen, etwa eine Entscheidung treffen oder Einfluss nehmen.",
    example: "Das Team trifft morgen eine Entscheidung.",
    contrast:
      "Nicht jedes einfache Verb muss nominal ersetzt werden; Register und Fokus entscheiden.",
  },
  {
    level: "B2",
    title: "Informationsstruktur durch Vorfeldbesetzung",
    rule: "Nutze genau ein Satzglied im Vorfeld und setze das finite Verb weiterhin an Position zwei.",
    example: "Besonders wichtig ist die transparente Dokumentation.",
    contrast: "Nicht zwei Satzglieder vor dem finiten Verb platzieren.",
  },

  {
    level: "C1",
    title: "Diskurspartikeln und Registersteuerung",
    rule: "Wähle Partikeln und Gesprächssignale passend zu Beziehung, Medium, Formalität und kommunikativer Absicht.",
    example: "Die Einschränkung ist allerdings methodisch bedeutsam.",
    contrast:
      "Allerdings wirkt in einem Forschungsbericht anders als halt im Gespräch.",
  },
  {
    level: "C1",
    title: "Tempusfolge in Berichten",
    rule: "Halte Zeitbezüge in Berichten konsistent und markiere Vorzeitigkeit, Gleichzeitigkeit und Nachzeitigkeit eindeutig.",
    example: "Die Autorin berichtete, sie habe die Daten zuvor bereinigt.",
    contrast:
      "Wechsle das Tempus nur, wenn sich Perspektive oder Zeitbezug ändert.",
  },
  {
    level: "C1",
    title: "Komplexe Verbvalenz und Rektion",
    rule: "Lerne Verb, obligatorische Ergänzungen, Präposition und Kasus als gemeinsames Konstruktionsmuster.",
    example: "Die Analyse beruht auf sorgfältig dokumentierten Annahmen.",
    contrast:
      "Eine semantisch ähnliche Präposition kann grammatisch trotzdem falsch sein.",
  },
  {
    level: "C1",
    title: "Infinitiv- und Partizipialverdichtung",
    rule: "Verdichte Nebensätze nur dann zu Infinitiv- oder Partizipialgruppen, wenn Bezug und Zeitverhältnis eindeutig bleiben.",
    example:
      "Nach sorgfältiger Prüfung freigegeben, wurde der Datensatz archiviert.",
    contrast:
      "Vermeide schwebende Bezüge, bei denen das logische Subjekt fehlt.",
  },
  {
    level: "C1",
    title: "Indirekte Rede mit Tempus und Modalität",
    rule: "Übertrage Person, Zeitbezug und Modalität in indirekter Rede, ohne die Haltung der Quelle zu verfälschen.",
    example:
      "Der Autor erklärte, das Verfahren könne die Fehlerquote gesenkt haben.",
    contrast:
      "Konjunktiv markiert Distanz, ersetzt aber keine genaue Quellenangabe.",
  },
  {
    level: "C1",
    title: "Komplexe Konditionalstrukturen",
    rule: "Formuliere reale, potenzielle und irreale Bedingungen mit wenn, sofern, falls, vorausgesetzt dass oder sollte.",
    example:
      "Sollten weitere Daten verfügbar werden, ließe sich die Hypothese erneut prüfen.",
    contrast: "Bedingung und Folge müssen denselben Realitätsgrad ausdrücken.",
  },
  {
    level: "C1",
    title: "Kausale Zuschreibung und wissenschaftliche Positionierung",
    rule: "Trenne belegte Ursache, plausible Erklärung und bloße Korrelation sprachlich präzise.",
    example:
      "Der Befund lässt sich teilweise auf die veränderte Stichprobe zurückführen.",
    contrast: "Nicht jede Korrelation rechtfertigt verursacht durch.",
  },
  {
    level: "C1",
    title: "Thema-Rhema-Gliederung",
    rule: "Ordne bekannte Information vor neuer Information und führe Referenten so ein, dass der Text anschlussfähig bleibt.",
    example:
      "Die erste Studie prüft die Genauigkeit. Diese Genauigkeit bildet den Ausgangspunkt der zweiten Analyse.",
    contrast: "Unvermittelte Themenwechsel schwächen Kohärenz.",
  },
  {
    level: "C1",
    title: "Interpunktion als Bedeutungssignal",
    rule: "Nutze Komma, Doppelpunkt, Gedankenstrich und Semikolon, um syntaktische Beziehungen und Informationsgewicht sichtbar zu machen.",
    example: "Ein Ergebnis blieb stabil: die hohe Präzision.",
    contrast:
      "Satzzeichen ersetzen keine grammatische Verknüpfung, können sie aber verdeutlichen.",
  },
  {
    level: "C1",
    title: "Syntax wissenschaftlicher Zitate",
    rule: "Integriere Paraphrasen und kurze Zitate syntaktisch korrekt und markiere Quelle, Distanz und Aussagefunktion.",
    example: "Wie Müller (2025) zeigt, hängt die Genauigkeit vom Kontext ab.",
    contrast:
      "Eine Quellenklammer ohne grammatische Einbettung macht den Bezug oft unklar.",
  },

  {
    level: "C2",
    title: "Deixis und Perspektivsteuerung",
    rule: "Steuere mit hier, dort, jetzt, damals, dieser und jener präzise die Perspektive von Sprecher, Text und Leser.",
    example:
      "Im damaligen Kontext bedeutete diese Entscheidung etwas anderes als heute.",
    contrast:
      "Deiktische Ausdrücke brauchen einen eindeutig rekonstruierbaren Bezugspunkt.",
  },
  {
    level: "C2",
    title: "Anapher und Katapher",
    rule: "Verweise rückwärts oder voraus, ohne mehrdeutige Bezüge zu erzeugen, und variiere Wiederaufnahme stilistisch kontrolliert.",
    example: "Das war unerwartet: dass sämtliche Messungen übereinstimmten.",
    contrast:
      "Pronomen dürfen nicht auf mehrere gleich plausible Referenten verweisen.",
  },
  {
    level: "C2",
    title: "Skopus und Negation",
    rule: "Platziere Negation und Fokuspartikeln so, dass ihr Geltungsbereich eindeutig und die beabsichtigte Lesart erkennbar ist.",
    example: "Nicht alle Ergebnisse waren signifikant.",
    contrast: "Nicht alle bedeutet etwas anderes als alle nicht.",
  },
  {
    level: "C2",
    title: "Präsupposition und Implikatur",
    rule: "Erkenne vorausgesetzte und nur angedeutete Inhalte und formuliere sie je nach Textziel explizit oder bewusst indirekt.",
    example:
      "Auch die zweite Studie scheiterte setzt voraus, dass bereits eine erste scheiterte.",
    contrast:
      "Implizites darf in wissenschaftlicher Argumentation nicht als belegte Tatsache erscheinen.",
  },
  {
    level: "C2",
    title: "Informationsdichte kontrollieren",
    rule: "Balanciere Nominalgruppen, Nebensätze und verbale Strukturen, damit komplexe Information präzise und lesbar bleibt.",
    example:
      "Die nach mehrfacher Prüfung bestätigte Abweichung erfordert eine neue Erklärung.",
    contrast: "Maximale Verdichtung ist nicht automatisch guter Stil.",
  },
  {
    level: "C2",
    title: "Regionale Variation und Standardregister",
    rule: "Erkenne regionale, umgangssprachliche und standardsprachliche Varianten und wähle sie adressaten- und situationsgerecht.",
    example:
      "Das Perfekt dominiert regional auch dort, wo formelle Texte das Präteritum bevorzugen.",
    contrast:
      "Variation ist nicht automatisch ein Fehler; Kontext und Norm entscheiden.",
  },
  {
    level: "C2",
    title: "Modalität und Evidentialität",
    rule: "Kennzeichne Sicherheit, Quelle und Zugang zum Wissen mit Modalverben, Adverbien, Konjunktiv und evidenziellen Wendungen.",
    example:
      "Den vorliegenden Daten zufolge dürfte der Effekt überschätzt worden sein.",
    contrast:
      "Vermutung, Hörensagen und belegter Befund brauchen unterschiedliche Signale.",
  },
  {
    level: "C2",
    title: "Textsortentransformation",
    rule: "Überführe denselben Inhalt zwischen Bericht, Kommentar, Vortrag und Dialog und passe Syntax, Register und Explizitheit an.",
    example:
      "Ein dichter Befundsatz wird im Vortrag in mehrere hörbare Schritte aufgelöst.",
    contrast: "Eine bloße Wortersetzung verändert die Textsorte noch nicht.",
  },
  {
    level: "C2",
    title: "Syntaktischer Rhythmus",
    rule: "Variiere Satzlänge, Vorfeld, Klammer und Nachtrag so, dass komplexe Inhalte hör- und lesbar gegliedert werden.",
    example: "Die These überzeugt – trotz offener Detailfragen – im Kern.",
    contrast:
      "Rhythmus unterstützt Bedeutung; dekorative Variation ohne Funktion stört.",
    exercises: [
      [
        "Schreibe das Modell ohne Hilfe genau nach: Die These überzeugt – trotz offener Detailfragen – im Kern.",
        "Die These überzeugt – trotz offener Detailfragen – im Kern.",
      ],
      [
        "Schreibe einen weiteren Satz mit demselben Rhythmus (Hauptaussage – Einschub – Kernaussage): Der Plan funktioniert – trotz hoher Kosten – langfristig.",
        "Der Plan funktioniert – trotz hoher Kosten – langfristig.",
      ],
      [
        "Benenne den eingeschobenen Nachtrag im Modell: Die These überzeugt – trotz offener Detailfragen – im Kern.",
        "trotz offener Detailfragen",
      ],
      [
        "Erkläre die Regel: Syntaktischer Rhythmus",
        "Variiere Satzlänge, Vorfeld, Klammer und Nachtrag so, dass komplexe Inhalte hör- und lesbar gegliedert werden.",
      ],
      [
        "Erkläre den Unterschied zwischen funktionalem und dekorativem Rhythmus.",
        "Rhythmus unterstützt Bedeutung; dekorative Variation ohne Funktion stört.",
      ],
    ],
  },
  {
    level: "C2",
    title: "Fehlerdiagnose und präzise Reformulierung",
    rule: "Diagnostiziere Fehler nach Bedeutung, Valenz, Kasus, Wortstellung, Register und Kohärenz und repariere nur die nötige Stelle.",
    example:
      "Aus dem unklaren Satz entsteht durch gezielte Reformulierung eine eindeutige Aussage.",
    contrast:
      "Eine vollständige Neufassung kann den ursprünglichen Gedanken unnötig verändern.",
  },
] as const;

function buildUnit(spec: GrammarSpec, index: number): GrammarUnit {
  const topic = spec.title;
  const answer = spec.example.replace(/[.!?]$/, "");
  return {
    level: spec.level,
    title: topic,
    rule: spec.rule,
    explanation: {
      overview: `${topic} hilft dir, eine konkrete kommunikative Absicht präzise auszudrücken. Du prüfst zuerst Bedeutung und Satzfunktion, wählst dann die passende Form und kontrollierst abschließend Wortstellung, Bezug und Register.`,
      formation: [
        `Bestimme zuerst, welche Information du mit „${topic}“ ausdrücken möchtest und welche Satzteile dafür notwendig sind.`,
        `Bilde die Form nach der Regel: ${spec.rule} Sprich den vollständigen Satz anschließend einmal deutlich aus.`,
      ],
      usage: [
        `Verwende das Muster zunächst in einer vertrauten Alltagssituation und danach in einem neuen persönlichen Zusammenhang.`,
        `Vergleiche die Aussage mit diesem Modell: ${spec.example} Achte dabei besonders auf Bedeutung und Natürlichkeit.`,
      ],
      wordOrder: [
        `Markiere das finite Verb, kontrolliere seine Position und prüfe, ob weitere Verbteile oder Nebensätze korrekt abgeschlossen sind.`,
        `Lies den Satz vom Subjekt bis zum Ende und kontrolliere jeden Bezug, bevor du ihn speicherst oder laut wiederholst.`,
      ],
      specialCases: [
        `Prüfe bei Personen, Sachen, Zahl, Kasus und Register, ob die gewählte Form zur konkreten Situation passt.`,
        `Wenn zwei Varianten möglich sind, entscheide nach Textsorte, Gesprächspartner und der beabsichtigten Hervorhebung.`,
      ],
      memoryTip: `Schließe die Erklärung, rufe „${topic}“ ohne Hilfe ab und bilde sofort einen wahren Satz aus deinem eigenen Leben.`,
    },
    examples: [spec.example, spec.contrast],
    commonError: spec.contrast,
    exercises: spec.exercises ?? [
      [
        `Ergänze oder korrigiere ein passendes Beispiel für „${topic}“.`,
        answer,
      ],
      [`Schreibe das Modell ohne Hilfe neu: ${spec.example}`, answer],
      [
        `Formuliere mit „${topic}“ eine wahre Aussage über deinen heutigen Tag.`,
        spec.example,
      ],
      [
        `Verändere Person, Zeit oder Ort in diesem Beispiel: ${spec.example}`,
        spec.example,
      ],
      [`Bilde eine neue Frage oder Verneinung mit „${topic}“.`, spec.example],
    ],
    links: [
      [
        "Grammatikübersicht",
        "https://deutsch.lingolia.com/de/grammatik",
        `Öffentliche Grammatikübersicht als ergänzende Erklärung zu „${topic}“.`,
        "explanation",
        topic,
      ],
      [
        "Deutsch üben",
        "https://www.goethe.de/de/spr/ueb.html",
        `Öffentliche Übungsangebote als zusätzlicher Transfer zu „${topic}“.`,
        "exercise",
        topic,
      ],
    ],
    testAnswer: answer,
    recallTest: `Erkläre die Grundregel von „${topic}“ in einem Satz und nenne ein eigenes Beispiel.`,
    repairTest: `Korrigiere den typischen Fehler und erkläre die Änderung: ${spec.contrast}`,
    transferTest: `Verwende „${topic}“ in einer neuen Situation, die nicht in den Beispielen vorkommt. Aufgabe ${index + 1}.`,
  };
}

export const supplementalGrammarUnits: readonly GrammarUnit[] =
  specs.map(buildUnit);
