import { defineExplanations } from "./schema";

export const c2Explanations = defineExplanations({
  "Feine Bedeutungsunterschiede im Modus": {
    overview:
      "Indikativ, Konjunktiv I und Konjunktiv II unterscheiden nicht nur Realität und Irrealität. Sie markieren Quellenstatus, Sprecherhaltung, Höflichkeit, Evidenz und kontrafaktische Distanz.",
    formation: [
      "Indikativ präsentiert eine Aussage aus der aktuellen Sprecherperspektive.",
      "Konjunktiv I markiert primär berichtete Geltung.",
      "Konjunktiv II markiert Irrealität, Distanz, Potenzialität oder soziale Abschwächung.",
      "Lexikalische Modalität und Modalverben können die Moduswirkung verstärken oder verändern.",
    ],
    usage: [
      "Zwischen neutraler Wiedergabe, skeptischer Distanz und kontrafaktischer Korrektur unterscheiden.",
      "Höflichkeit graduieren: Können Sie ...? Könnten Sie ...? Wären Sie so freundlich ...?",
      "Hypothesen nach zeitlichem und epistemischem Status staffeln.",
    ],
    wordOrder: [
      "Modus verändert die finite Form, nicht grundsätzlich das Satzfeldmodell.",
      "In komplexer indirekter Rede muss der Modus über eingebettete Ebenen klar zugeordnet bleiben.",
    ],
    specialCases: [
      "Konjunktiv I signalisiert keine zwingende Skepsis.",
      "Konjunktiv II kann zugleich zeitlich vergangen, epistemisch distanziert und höflich wirken; Kontext löst die Mehrdeutigkeit.",
    ],
    memoryTip:
      "Bestimme getrennt: Wer ist Quelle, wie real ist der Inhalt und welche soziale Distanz ist beabsichtigt?",
  },
  "Markierte Wortstellung": {
    overview:
      "Markierte Wortstellung weicht bewusst von einer neutralen Reihenfolge ab, um Kontrast, Korrektur, Dramatisierung oder thematische Rahmung zu erzeugen.",
    formation: [
      "Kontrastives Vorfeld: Diesen Vorschlag lehne ich ab.",
      "Links- oder Rechtsversetzung mit Wiederaufnahme: Den neuen Kollegen, den kenne ich noch nicht.",
      "Verb-Erst-Stellung in Narration oder uneingeleiteter Bedingung: Hätte ich das gewusst, ...",
    ],
    usage: [
      "Fokus auf unerwartete Information legen.",
      "Gesprochenen Diskurs gliedern und Referenten etablieren.",
      "Rhetorische Spannung oder knappe Konditionalität erzeugen.",
    ],
    wordOrder: [
      "Die Verb-zweit-Regel bleibt im deklarativen Kernsatz erhalten.",
      "Prosodie und Interpunktion tragen wesentlich zur Interpretation markierter Strukturen bei.",
    ],
    specialCases: [
      "Nicht jede grammatisch mögliche Voranstellung ist stilistisch neutral.",
      "Linksversetzung braucht meist ein resumptives Pronomen; Topikalisierung nicht.",
    ],
    memoryTip:
      "Eine Abweichung braucht eine Funktion: Was soll der Hörer gerade als Kontrast oder Thema erkennen?",
  },
  "Komplexe Einbettung": {
    overview:
      "Komplexe Einbettung ordnet mehrere Neben-, Relativ-, Infinitiv- oder Inhaltssätze hierarchisch. Verständlichkeit hängt stärker von eindeutigen Bezügen als von bloßer grammatischer Korrektheit ab.",
    formation: [
      "Jede Einbettung hat einen regierenden Kopf: Verb, Nomen, Adjektiv oder Präposition.",
      "Kommas und Verbpositionen markieren Ebenengrenzen.",
      "Korrelate wie es, daran oder darauf können lange Ergänzungssätze ankündigen.",
    ],
    usage: [
      "Propositionen, Bedingungen, Einschränkungen und Quellen präzise verschachteln.",
      "Argumentationshierarchie sichtbar machen.",
      "Information gewichten, ohne viele unverbundene Sätze zu erzeugen.",
    ],
    wordOrder: [
      "Die Verbgruppe jedes Nebensatzes gehört zu seiner eigenen Ebene.",
      "Nachfeld und Extraposition können tiefe Einbettung entlasten.",
    ],
    specialCases: [
      "Mehr als zwei bis drei Ebenen sind kognitiv teuer und sollten häufig aufgeteilt werden.",
      "Relativpronomen, Korrelate und Ellipsen müssen einen eindeutigen Bezug behalten.",
    ],
    memoryTip:
      "Zeichne bei Unsicherheit Klammern: Jeder Satz hat einen Kopf, einen Anschluss und eine eigene Verbgruppe.",
  },
  "Ellipsen und Substitution": {
    overview:
      "Ellipsen lassen erschließbare Elemente weg; Substitution ersetzt sie durch Pronomen, Proformen oder Hilfsverben. Beide vermeiden Wiederholung und gestalten Informationsfluss.",
    formation: [
      "Koordinationsellipse: Anna liest Romane und Paul Gedichte.",
      "Antwortellipse: Kommst du? - Später.",
      "Substitutionsmittel:",
      "Substitution durch [[derjenige]].",
      "Substitution durch [[das tun]].",
      "Substitution durch [[so]].",
      "Substitution durch [[dort]].",
      "Substitution durch [[dabei]].",
      "Substitution durch [[es]].",
    ],
    usage: [
      "Gesprochene Interaktion ökonomisch halten.",
      "Parallele Strukturen verdichten.",
      "Textbezüge herstellen, ohne vollständige Ausdrücke zu wiederholen.",
    ],
    wordOrder: [
      "Die verbleibenden Elemente müssen die syntaktische Funktion der Lücke erkennen lassen.",
      "Kontrastakzent kann zeigen, welche Teile trotz Ellipse verschieden sind.",
    ],
    specialCases: [
      "Eine Ellipse ist nur gelungen, wenn Form und Bedeutung eindeutig rekonstruierbar sind.",
      "Deutsch erlaubt nicht jede aus anderen Sprachen bekannte Verb- oder Nominalellipse.",
    ],
    memoryTip:
      "Streiche nur, was der Empfänger eindeutig und ohne grammatischen Konflikt ergänzen kann.",
  },
  "Rhetorische Syntax": {
    overview:
      "Rhetorische Syntax nutzt Satzform und Reihenfolge als Wirkungsmittel. Parallelismus, Inversion, Anakoluth, rhetorische Frage und Periodenbau steuern Aufmerksamkeit und Haltung.",
    formation: [
      "Anapher wiederholt Satzanfänge; Parallelismus wiederholt Strukturen.",
      "Rhetorische Frage hat formal Fragegestalt, erwartet aber keine echte Information.",
      "Parenthese, Nachtrag und Ausklammerung verändern Rhythmus und Gewicht.",
    ],
    usage: [
      "Argumente zuspitzen, Kontraste inszenieren oder emotionale Beteiligung erzeugen.",
      "Mündliche Rede erinnerbar und rhythmisch gestalten.",
      "In Essays und Kommentaren eine erkennbare Stimme entwickeln.",
    ],
    wordOrder: [
      "Markierte Positionen tragen den stärksten Fokus.",
      "Interpunktion und Prosodie sind Teil der syntaktischen Wirkung.",
    ],
    specialCases: [
      "Anakoluth kann bewusst mündlich wirken, gilt in neutraler Standardschrift aber oft als Strukturbruch.",
      "Rhetorische Mittel verlieren Wirkung bei zu dichter Wiederholung.",
    ],
    memoryTip:
      "Erst grammatische Grundform sichern, dann Abweichung gezielt als Wirkungsmittel einsetzen.",
  },
  Ambiguitätskontrolle: {
    overview:
      "Ambiguitätskontrolle erkennt und beseitigt unbeabsichtigte Mehrdeutigkeit. Kritisch sind Pronomenbezug, Attributanschluss, Skopus, Koordination und Komposita.",
    formation: [
      "Referenten wiederholen oder präziser benennen, wenn Pronomen mehrere Kandidaten haben.",
      "Attribute direkt beim Bezugswort platzieren.",
      "Skopusmarkierende Konnektoren:",
      "Skopusmarker: [[nur]].",
      "Skopusmarker: [[nicht]].",
      "Skopusmarker: [[auch]].",
      "Skopusmarker: [[fast]].",
    ],
    usage: [
      "Fachliche, rechtliche und organisatorische Aussagen eindeutig machen.",
      "Missverständnisse in langen Sätzen vermeiden.",
      "Beabsichtigte Wortspiele von unbeabsichtigter Mehrdeutigkeit unterscheiden.",
    ],
    wordOrder: [
      "Je näher ein Attribut oder Fokuspartikel am Ziel steht, desto eindeutiger ist meist sein Bezug.",
      "Kommas trennen Ebenen, lösen aber nicht jede semantische Ambiguität.",
    ],
    specialCases: [
      "Kasusgleichheit kann syntaktische Rollen verdecken; Aktivierung oder Wiederholung hilft.",
      "Lexikalische Mehrdeutigkeit braucht Kontext oder Terminologiedefinition.",
    ],
    memoryTip:
      "Lies den Satz absichtlich in der falschen Bedeutung; wenn das leicht geht, formuliere den Bezug expliziter.",
  },
  "Idiomatizität und Kollokation": {
    overview:
      "Idiomatizität bedeutet, dass eine Formulierung für kompetente Sprecher konventionell klingt. Kollokationen sind bevorzugte Wortverbindungen; Redewendungen haben oft eine nicht vollständig wörtliche Gesamtbedeutung.",
    formation: [
      "Kollokation: eine Entscheidung treffen, Verantwortung übernehmen, Kritik üben.",
      "Redewendung: eine feste Kombination mit stabiler oder übertragener Bedeutung.",
      "Grammatische Form, Artikel und Präposition gehören häufig zur Einheit.",
    ],
    usage: [
      "Natürlichkeit und registersichere Präzision erhöhen.",
      "Zwischen neutraler Kollokation, informeller Redewendung und markiertem Sprichwort wählen.",
      "Variation nur dort einsetzen, wo die Verbindung flexibel ist.",
    ],
    wordOrder: [
      "Trennbare Bestandteile folgen den normalen Satzklammerregeln.",
      "Fokus kann Teile verschieben, darf die feste Verbindung aber nicht unkenntlich machen.",
    ],
    specialCases: [
      "Wörtliche Übersetzung aus einer anderen Sprache erzeugt oft unidiomatische Kombinationen.",
      "Redewendungen können regional, historisch oder stilistisch markiert sein.",
    ],
    memoryTip:
      "Nicht Einzelwörter sammeln, sondern typische Nachbarn, Kasus und einen echten Verwendungskontext.",
  },
  "Textsortenspezifische Grammatik": {
    overview:
      "Textsorten haben typische grammatische Profile. Anleitung, Bericht, Erörterung, wissenschaftlicher Text und Gespräch unterscheiden sich in Tempus, Person, Modalität und Informationsdichte.",
    formation: [
      "Anleitung: Imperativ, Infinitiv oder unpersönliches Passiv.",
      "Bericht: klare Tempuslinie und Quellenmarkierung.",
      "Argumentation: Konnektoren, Konzession, Evidenz und abgestufte Modalität.",
      "Wissenschaft: definierte Nominalgruppen, Kohäsion und kontrolliertes Hedging.",
    ],
    usage: [
      "Erwartungen der Leser erfüllen und Information schnell auffindbar machen.",
      "Perspektive und Verantwortlichkeit passend markieren.",
      "Register innerhalb eines Dokuments konsistent halten.",
    ],
    wordOrder: [
      "Informationsstruktur folgt dem Zweck: chronologisch, problemorientiert oder argumentativ.",
      "Absatzanfänge und Vorfeldbesetzung tragen zur Makrostruktur bei.",
    ],
    specialCases: [
      "Hybride digitale Formate mischen Textsorten, brauchen aber weiterhin klare Funktionswechsel.",
      "Eine formellere Textsorte verlangt Präzision, nicht maximale Satzlänge.",
    ],
    memoryTip:
      "Vor dem Schreiben das kommunikative Muster bestimmen: informieren, anleiten, berichten, überzeugen oder interagieren.",
  },
  "Stilistische Verdichtung": {
    overview:
      "Stilistische Verdichtung reduziert Redundanz und bündelt Information, ohne logische Beziehungen zu verlieren. Mittel sind Partizipien, Nominalgruppen, Appositionen, Ellipsen und präzise Verben.",
    formation: [
      "Nebensatz zu Attribut oder Präpositionalgruppe umformen.",
      "Funktionsverbgefüge gegebenenfalls durch ein Vollverb ersetzen.",
      "Gemeinsame Elemente paralleler Strukturen kontrolliert auslassen.",
    ],
    usage: [
      "Überschriften, Abstracts und fachliche Zusammenfassungen komprimieren.",
      "Bekannte Information nicht unnötig wiederholen.",
      "Rhythmus zwischen dichten und entlastenden Sätzen gestalten.",
    ],
    wordOrder: [
      "Dichte Nominalgruppen brauchen einen klaren Kopf und eindeutige Attributgrenzen.",
      "Neue, schwere Information nicht vollständig vor dem Verb stapeln.",
    ],
    specialCases: [
      "Kürzer ist nicht automatisch klarer; implizite Rollen oder Relationen müssen rekonstruierbar bleiben.",
      "Mündliche Kommunikation verträgt andere Verdichtungsformen als Fachschrift.",
    ],
    memoryTip: "Entferne Wiederholung, nicht Orientierung.",
  },
  "Pragmatische Feinsteuerung": {
    overview:
      "Pragmatische Feinsteuerung passt eine Äußerung an Beziehung, Gesichtswahrung, Gesprächsziel und gemeinsamen Wissensstand an. Grammatik wirkt dabei mit Partikeln, Modus, Person und Satztyp.",
    formation: [
      "Abschwächende Ausdrücke:",
      "Abschwächung: [[vielleicht]].",
      "Abschwächung: [[etwas]].",
      "Abschwächung: [[könnte]].",
      "Abschwächung: [[würde]].",
      "Abschwächung: [[wohl]].",
      "Verstärkende Ausdrücke:",
      "Verstärkung: [[unbedingt]].",
      "Verstärkung: [[tatsächlich]].",
      "Verstärkung: [[doch]].",
      "Verstärkung: [[ja]].",
      "Indirekter Sprechakt: Könnten Sie das Fenster schließen?",
    ],
    usage: [
      "Bitten, Kritik, Widerspruch und Rat sozial angemessen gestalten.",
      "Annahmen über gemeinsames Wissen markieren.",
      "Sicherheit, Überraschung oder Erwartung signalisieren.",
    ],
    wordOrder: [
      "Modalpartikeln stehen typischerweise im Mittelfeld und sind unbetont.",
      "Fokuspartikeln stehen nahe bei ihrem Bezugsbereich.",
    ],
    specialCases: [
      "Partikeln haben selten eine direkte Einzelwortübersetzung und sind stark kontextabhängig.",
      "Zu starke Abschwächung kann unklar, zu direkte Formulierung unhöflich wirken.",
    ],
    memoryTip:
      "Prüfe neben dem Satzinhalt immer die soziale Handlung: Was tue ich mit diesem Satz?",
  },
  "Kohärenz langer Beiträge": {
    overview:
      "Kohärenz ist der nachvollziehbare gedankliche Zusammenhang eines längeren Beitrags. Sie entsteht aus Themenführung, Argumentationslogik, Referenz und passender grammatischer Verknüpfung.",
    formation: [
      "Makrostruktur mit Einleitung, Entwicklung, Übergängen und Schluss.",
      "Absätze mit klarer Leitidee und progressiver Informationsfolge.",
      "Referenzketten, Konnektoren und Tempuslinien konsistent führen.",
    ],
    usage: [
      "Längere mündliche oder schriftliche Beiträge verständlich planen.",
      "Argumentative Bausteine unterscheiden:",
      "Baustein: [[Behauptung]].",
      "Baustein: [[Begründung]].",
      "Baustein: [[Beleg]].",
      "Baustein: [[Einwand]].",
      "Baustein: [[Schlussfolgerung]].",
      "Themenwechsel ankündigen und Rückbezüge explizit machen.",
    ],
    wordOrder: [
      "Vorfelder verbinden Sätze thematisch; Satzenden tragen häufig neue Information.",
      "Parallel gebaute Abschnitte erleichtern den Vergleich komplexer Punkte.",
    ],
    specialCases: [
      "Viele Konnektoren erzeugen keine Kohärenz, wenn die logische Relation unklar ist.",
      "Lokale Korrektheit reicht nicht: Pronomen und Schlüsselbegriffe müssen über Absatzgrenzen stabil bleiben.",
    ],
    memoryTip:
      "Jeder Abschnitt beantwortet eine Leitfrage und baut sichtbar auf dem vorherigen auf.",
  },
  "Selbstreparatur im Sprechen": {
    overview:
      "Selbstreparatur korrigiert während des Sprechens Form, Wortwahl oder Aussage, ohne den Gesprächsfaden zu verlieren. Sie ist ein Zeichen fortgeschrittener Sprachkontrolle, nicht des Scheiterns.",
    formation: [
      "Abbruch und Neustart: Ich war - ich bin gestern nach Bonn gefahren.",
      "Explizite Korrekturmarker:",
      "Korrekturmarker: [[besser gesagt]].",
      "Korrekturmarker: [[genauer]].",
      "Korrekturmarker: [[ich meine]].",
      "Korrekturmarker: [[vielmehr]].",
      "Lokale Reparatur nur des fehlerhaften Segments statt vollständiger Wiederholung.",
    ],
    usage: [
      "Kasus, Kongruenz, Tempus oder Wortwahl unmittelbar verbessern.",
      "Aussage präzisieren oder Missverständnis vorbeugen.",
      "Zeit gewinnen, ohne unverbundene Füllwörter zu häufen.",
    ],
    wordOrder: [
      "Nach dem Marker wird die korrigierte syntaktische Einheit vollständig genug wiederaufgenommen.",
      "Prosodische Pause und Akzent signalisieren den Reparaturbereich.",
    ],
    specialCases: [
      "Zu häufige globale Neustarts stören Flüssigkeit; lokale Reparatur bevorzugen.",
      "Nicht jeder kleine Versprecher braucht Korrektur, wenn Bedeutung und Form eindeutig bleiben.",
    ],
    memoryTip:
      "Stopp - Marker - korrekte Einheit - weiter: kurz reparieren, nicht den ganzen Beitrag neu beginnen.",
  },
  "Mehrsprachige Interferenzkontrolle": {
    overview:
      "Interferenz entsteht, wenn Muster einer anderen Sprache unpassend auf Deutsch übertragen werden. Kontrolle bedeutet, persönliche Risikobereiche zu erkennen und deutsche Form-Funktions-Pakete zu automatisieren.",
    formation: [
      "Kontrastfelder zwischen Sprachen:",
      "Kontrastfeld: [[Verbposition]].",
      "Kontrastfeld: [[Artikel/Genus]].",
      "Kontrastfeld: [[Kasus]].",
      "Kontrastfeld: [[Präposition]].",
      "Kontrastfeld: [[Tempus]] und [[falsche Freunde]].",
      "Fehler nicht nur korrigieren, sondern als Auslöser → falsches Muster → deutsches Zielmuster dokumentieren.",
      "Minimalpaare und Chunks trainieren: warten auf, helfen + Dativ, seit + Präsens.",
    ],
    usage: [
      "Wiederkehrende individuelle Fehlerquellen systematisch abbauen.",
      "Beim Planen, Sprechen und Überarbeiten unterschiedliche Kontrollstufen nutzen.",
      "Positive Übertragung verwandter Strukturen bewusst einsetzen.",
    ],
    wordOrder: [
      "Besonders die deutsche Satzklammer und Verb-end-Stellung als ganze Muster abrufen.",
      "Kasus nicht über lineare Position, sondern über Verb- und Präpositionsrektion bestimmen.",
    ],
    specialCases: [
      "Nicht jede Abweichung ist Interferenz; Übergeneralisierung innerhalb des Deutschen ist ebenfalls häufig.",
      "Mehrsprachigkeit ist eine Ressource, solange Unterschiede explizit kartiert werden.",
    ],
    memoryTip:
      "Führe eine persönliche Top-5-Liste mit Auslöser, Zielmuster und eigenem Beispielsatz.",
  },
  "Integrierte automatische Produktion": {
    overview:
      "Integrierte automatische Produktion verbindet Grammatik, Wortschatz, Aussprache, Register und Diskursplanung unter Echtzeitbedingungen. Ziel ist kontrollierte Flüssigkeit statt bloßer Regelkenntnis.",
    formation: [
      "Abruf in Chunks: Konnektor + Satzmuster, Verb + Rektion, Nomen + Artikel/Plural.",
      "Planung in Sinneinheiten statt Wort-für-Wort-Übersetzung.",
      "Zyklus der automatischen Produktion:",
      "Schritt 1: [[produzieren]].",
      "Schritt 2: [[gezielt prüfen]].",
      "Schritt 3: [[lokal reparieren]].",
      "Schritt 4: [[erneut übertragen]].",
    ],
    usage: [
      "Spontane längere Beiträge mit stabiler Grammatik halten.",
      "Komplexität an Zeitdruck und kommunikatives Ziel anpassen.",
      "Gelernte Strukturen flexibel auf neue Themen übertragen.",
    ],
    wordOrder: [
      "Satzklammer früh planen und rechte Verbteile mental reservieren.",
      "Kohäsive Vorfelder und klare Nachfelder helfen bei längeren Beiträgen.",
    ],
    specialCases: [
      "Automatizität bedeutet nicht fehlerfreie Geschwindigkeit, sondern verlässlichen Abruf mit effizienter Reparatur.",
      "Unter hoher Belastung ist eine sichere einfachere Struktur besser als eine abgebrochene komplexe.",
    ],
    memoryTip:
      "Erst korrektes Muster langsam stabilisieren, dann unter wechselnden Themen und Zeitdruck beschleunigen.",
  },
});
