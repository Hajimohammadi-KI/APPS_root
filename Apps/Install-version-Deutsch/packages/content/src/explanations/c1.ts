import { defineExplanations } from "./schema";

export const c1Explanations = defineExplanations({
  "Konjunktiv I vollständig": {
    overview:
      "Der Konjunktiv I markiert vor allem indirekte Rede und damit die Quelle einer Aussage. Ein vollständiger Gebrauch umfasst Präsens, Vergangenheit, Zukunft und Passiv sowie Ersatzformen bei Formgleichheit.",
    formation: [
      "Präsens: Infinitivstamm + -e, -est, -e, -en, -et, -en; sein: sei, seiest, sei, seien, seiet, seien.",
      "Vergangenheit: habe/sei im Konjunktiv I + Partizip II.",
      "Zukunft: werde im Konjunktiv I + Infinitiv; Passiv: werde + Partizip II.",
      "Bei Gleichheit mit Indikativ wird zur eindeutigen Markierung häufig Konjunktiv II verwendet.",
    ],
    usage: [
      "Quellengebundene Wiedergabe in Presse, Protokoll und wissenschaftlichem Text.",
      "Anweisungen und formelhafte Wünsche: Man nehme ..., Es lebe ...",
      "Distanzierung, ohne automatisch Zweifel auszudrücken.",
    ],
    wordOrder: [
      "Ohne dass bleibt häufig Verb-zweit: Er sagt, er sei krank.",
      "Mit dass gilt Verb-end-Stellung: Er sagt, dass er krank sei.",
    ],
    specialCases: [
      "Zeit-, Orts- und Personenbezüge müssen zur neuen Sprechsituation passen.",
      "Konsequente Moduswahl verhindert einen unbeabsichtigten Wechsel zwischen Bericht und eigener Behauptung.",
    ],
    memoryTip:
      "Konjunktiv I ist ein Quellenetikett: Inhalt wiedergeben, Urheberschaft sichtbar lassen.",
  },
  "Subjektive Bedeutung der Modalverben": {
    overview:
      "Modalverben können neben Pflicht oder Fähigkeit die Einschätzung des Sprechers ausdrücken. Sie markieren Wahrscheinlichkeit, Behauptung aus zweiter Hand oder nachträgliche Bewertung.",
    formation: [
      "müssen + Infinitiv: sehr sichere Schlussfolgerung.",
      "dürfte + Infinitiv: hohe, vorsichtig formulierte Wahrscheinlichkeit.",
      "können/mögen + Infinitiv: Möglichkeit; sollen/wollen + Infinitiv: fremde bzw. eigene Behauptung.",
      "Vergangenheitsbezug mit Perfektinfinitiv: Er muss gegangen sein.",
    ],
    usage: [
      "Epistemische Bewertung: Das muss ein Irrtum sein.",
      "Distanzierte Quellenangabe: Er soll im Ausland leben.",
      "Nicht bestätigte Selbstbehauptung: Sie will nichts gewusst haben.",
    ],
    wordOrder: [
      "Das finite Modalverb öffnet die Klammer; Infinitiv oder Perfektinfinitiv steht am Ende.",
      "Im Nebensatz steht das Modalverb nach der Infinitivgruppe.",
    ],
    specialCases: [
      "Bedeutung entsteht aus Kontext, Tempus und Betonung; müssen kann Pflicht oder Schlussfolgerung sein.",
      "Sollen im Konjunktiv II kann zusätzlich eine hypothetische Bedingung markieren.",
    ],
    memoryTip:
      "Frage, ob das Modalverb die Handlung steuert oder die Wahrheit der Aussage bewertet.",
  },
  "Ersatzformen des Passivs": {
    overview:
      "Passiversatzformen stellen Vorgang oder Möglichkeit ohne werden-Passiv dar. Sie variieren Perspektive, Register und Bedeutungsnuance.",
    formation: [
      "man + Aktiv: Man kann den Text leicht verstehen.",
      "sein + zu + Infinitiv: Der Text ist leicht zu verstehen.",
      "sich lassen + Infinitiv: Der Text lässt sich leicht verstehen.",
      "Adjektive auf -bar/-lich: ein lösbares Problem, eine verständliche Erklärung.",
    ],
    usage: [
      "Möglichkeit oder Notwendigkeit kompakt ausdrücken.",
      "Akteur unbestimmt lassen, ohne eine schwere Passivkette zu bilden.",
      "Stilistische Wiederholung von werden vermeiden.",
    ],
    wordOrder: [
      "Bei sein + zu steht der Infinitiv mit zu am Ende.",
      "Bei sich lassen steht lassen finit und der Infinitiv am Ende.",
    ],
    specialCases: [
      "Sein + zu kann Möglichkeit oder Pflicht bedeuten; Kontext entscheidet.",
      "Nicht jede -bar-Bildung ist idiomatisch oder semantisch eindeutig.",
    ],
    memoryTip:
      "Prüfe die Paraphrase kann/muss + Passiv, um Bedeutung und passende Ersatzform zu erkennen.",
  },
  "Komplexe Nominalgruppen": {
    overview:
      "Komplexe Nominalgruppen bündeln mehrere Informationen um ein Kernnomen. Attribute können vorangestellt, nachgestellt oder als Nebensatz realisiert werden.",
    formation: [
      "Linksattribute: Artikel, Adjektive, Partizipialattribute und Genitive vor dem Kern.",
      "Rechtsattribute: Genitiv, Präpositionalgruppe, Apposition, Relativ- oder Infinitivsatz.",
      "Kasus, Numerus und Genus werden am Kopf und an kongruierenden Begleitern sichtbar.",
    ],
    usage: [
      "Fachliche Inhalte präzise benennen und wiederaufnehmen.",
      "Mehrere Eigenschaften hierarchisch statt als lose Hauptsätze organisieren.",
      "Nominalstil dosiert für formelle Verdichtung nutzen.",
    ],
    wordOrder: [
      "Das Kernnomen bestimmt die äußere Syntax; eingebettete Attribute gehören intern zur Gruppe.",
      "Sehr schwere Attribute stehen zur Lesbarkeit häufig rechts.",
    ],
    specialCases: [
      "Mehrdeutige Anbindung vermeiden: Jede Ergänzung braucht einen klaren Bezug.",
      "Artikel- und Adjektivendungen trotz großer Distanz zum Kern kontrollieren.",
    ],
    memoryTip:
      "Finde zuerst das Kernnomen; ordne dann jedes Attribut als eigene Schicht darum.",
  },
  Partizipialkonstruktionen: {
    overview:
      "Partizipialkonstruktionen verdichten Nebenhandlungen oder Attribute. Sie sind besonders schriftsprachlich und verlangen einen eindeutigen logischen Bezug.",
    formation: [
      "Partizip I für Gleichzeitigkeit/aktive Lesart: lächelnd betrat sie den Raum.",
      "Partizip II für Vorzeitigkeit oder passive/resultative Lesart: in Berlin angekommen, ...",
      "Erweiterte Attribute stehen vor dem Nomen und erhalten Adjektivendung.",
    ],
    usage: [
      "Relativ- oder Adverbialsätze stilistisch verdichten.",
      "Begleitumstand, Ursache, Zeit oder Art ausdrücken.",
      "Informationsdichte in Berichten und Fachtexten erhöhen.",
    ],
    wordOrder: [
      "Freie Konstruktionen werden durch Komma abgetrennt.",
      "Im Attribut stehen Ergänzungen vor dem Partizip; das Partizip steht unmittelbar vor dem Nomen.",
    ],
    specialCases: [
      "Das unausgesprochene Subjekt muss logisch mit dem Subjekt des Hauptsatzes identisch sein.",
      "Zu lange Ketten besser in Relativ- oder Nebensätze auflösen.",
    ],
    memoryTip:
      "Kontrollfrage: Wer führt die Partiziphandlung aus? Die Antwort muss eindeutig sein.",
  },
  Appositionen: {
    overview:
      "Eine Apposition benennt oder erklärt ein Nomen durch eine zweite Nomengruppe. Sie kongruiert typischerweise im Kasus mit ihrem Bezugswort.",
    formation: [
      "Lockere Apposition mit Kommas: Frau Weber, unsere Dozentin, kommt später.",
      "Enge Apposition ohne Komma: Professor Müller, die Stadt Berlin.",
      "Kasuskongruenz: mit Frau Weber, unserer Dozentin.",
    ],
    usage: [
      "Zusatzinformation, Definition, Titel oder Identifizierung.",
      "Textökonomische Alternative zu Relativsatz oder Kopulasatz.",
      "Präzisierung in wissenschaftlichen und journalistischen Texten.",
    ],
    wordOrder: [
      "Die Apposition steht unmittelbar beim Bezugsnomen.",
      "Lockere Appositionen werden paarig durch Kommas, Gedankenstriche oder Klammern markiert.",
    ],
    specialCases: [
      "Bei Eigennamen und Titeln schwankt die Flexion je nach Artikel und Enge der Verbindung.",
      "Eine überladene Apposition kann den Satzbezug verschleiern.",
    ],
    memoryTip:
      "Bezugswort und Apposition bezeichnen dieselbe Sache und tragen deshalb normalerweise denselben Kasus.",
  },
  "Informationsstruktur und Vorfeld": {
    overview:
      "Das Vorfeld ist die Position vor dem finiten Verb im deutschen Hauptsatz. Seine Besetzung steuert Thema, Anschluss, Kontrast und Perspektive, ohne die Verb-zweit-Regel zu verändern.",
    formation: [
      "Genau eine Konstituente besetzt das Vorfeld; sie kann aus einem Wort oder einer komplexen Gruppe bestehen.",
      "Unmarkiert steht dort häufig bekannte oder thematische Information.",
      "Kontrastives Vorfeld hebt eine Alternative hervor: Dieses Problem müssen wir lösen.",
    ],
    usage: [
      "An vorherigen Text anschließen.",
      "Zeit, Ort oder Gegenstand als Rahmen setzen.",
      "Kontrast und dramaturgische Reihenfolge gestalten.",
    ],
    wordOrder: [
      "Nach jeder Vorfeldbesetzung folgt sofort das finite Verb.",
      "Das Subjekt rückt ins Mittelfeld, wenn ein anderes Element im Vorfeld steht.",
    ],
    specialCases: [
      "Mehrere Wörter im Vorfeld können gemeinsam eine einzige syntaktische Einheit bilden.",
      "Ein leeres Vorfeld erzeugt Verb-Erst-Stellung und wirkt narrativ, konditional oder fragend.",
    ],
    memoryTip: "Vorfeld ist eine Funktionseinheit, keine Ein-Wort-Position.",
  },
  "Ausklammerung und Nachfeld": {
    overview:
      "Im Nachfeld stehen Einheiten rechts von der Satzklammer. Ausklammerung entlastet das Mittelfeld und macht lange Ergänzungen leichter verarbeitbar.",
    formation: [
      "Nebensätze, Infinitivgruppen und Vergleichsgruppen stehen häufig im Nachfeld.",
      "Beispiel: Er hat gestern angekündigt, dass er zurücktritt.",
      "Kurze obligatorische Ergänzungen bleiben normalerweise im Mittelfeld.",
    ],
    usage: [
      "Schwere oder neue Information nach rechts verschieben.",
      "Satzkern früh erkennbar machen.",
      "Nachtrag oder erläuternden Fokus erzeugen.",
    ],
    wordOrder: [
      "Rechte Satzklammer zuerst, ausgeklammerte Einheit danach.",
      "Der Bezug muss trotz Distanz eindeutig bleiben.",
    ],
    specialCases: [
      "Übermäßige Ausklammerung kann nachlässig oder mündlich wirken.",
      "Nicht jede Präpositionalgruppe lässt sich neutral ausklammern; Valenz und Informationsstruktur begrenzen die Möglichkeit.",
    ],
    memoryTip:
      "Leichter Kern in die Klammer, schwere Erklärung kontrolliert danach.",
  },
  "Konzessive und adversative Strukturen": {
    overview:
      "Konzessive Strukturen widersprechen einer Erwartung; adversative Strukturen stellen Alternativen oder Gegensätze gegenüber. Präzise Konnektorwahl zeigt, welche Relation gemeint ist.",
    formation: [
      "Konzessiv: obwohl/obgleich + Verb-end; trotzdem/dennoch + Verb-zweit; trotz + Genitiv.",
      "Adversativ: während/wohingegen + Verb-end; dagegen/jedoch + Verb-zweit.",
      "Zwar ... aber teilt Einräumung und Einschränkung auf zwei Satzteile.",
    ],
    usage: [
      "Ein Hindernis anerkennen, das Ergebnis aber aufrechterhalten.",
      "Zwei Sachverhalte sachlich kontrastieren.",
      "Argumente differenzieren statt nur mit aber zu verbinden.",
    ],
    wordOrder: [
      "Subjunktionen erzwingen Verb-end, Konjunktionaladverbien Verb-zweit.",
      "Korrelative Paare sollten parallele Satzteile verbinden.",
    ],
    specialCases: [
      "Während kann temporal oder adversativ sein.",
      "Jedoch ist beweglich, besetzt aber nicht zwingend allein das Vorfeld.",
    ],
    memoryTip:
      "Konzessiv: Erwartung scheitert. Adversativ: zwei Seiten stehen einander gegenüber.",
  },
  "Wissenschaftliches Hedging": {
    overview:
      "Hedging begrenzt Reichweite und Sicherheit wissenschaftlicher Aussagen. Es ist keine Unklarheit, sondern eine präzise Markierung von Evidenz, Wahrscheinlichkeit und Geltungsbereich.",
    formation: [
      "Modalität: könnte, dürfte, scheint zu, lässt vermuten.",
      "Reichweitenmarker: häufig, tendenziell, unter diesen Bedingungen, in der Stichprobe.",
      "Unpersönliche Evidenzformeln: Die Ergebnisse deuten darauf hin, dass ...",
    ],
    usage: [
      "Unsicherheit oder begrenzte Datenlage angemessen ausdrücken.",
      "Kausalität von Korrelation unterscheiden.",
      "Andere Positionen fair referieren und eigene Schlussfolgerung kalibrieren.",
    ],
    wordOrder: [
      "Der Reichweitenmarker sollte möglichst nah bei der Aussage stehen, die er begrenzt.",
      "Dass- und Infinitivkonstruktionen helfen, Evidenzquelle und Proposition zu trennen.",
    ],
    specialCases: [
      "Zu viele Marker schwächen eine Aussage unnötig; zu wenige machen sie überzogen.",
      "Offenbar, anscheinend und scheinbar unterscheiden sich in Evidenz und Wahrheitsimplikation.",
    ],
    memoryTip:
      "Benennen, wie sicher, für wen und unter welchen Bedingungen eine Aussage gilt.",
  },
  Textkohäsion: {
    overview:
      "Textkohäsion entsteht durch sprachliche Verknüpfungen zwischen Sätzen. Pronomen, Wiederaufnahme, Konnektoren, Tempus und lexikalische Ketten machen Bezüge sichtbar.",
    formation: [
      "Referenz: Pronomen, Demonstrativa und Pronominaladverbien.",
      "Konnektoren markieren logische Beziehungen.",
      "Lexikalische Kohäsion durch kontrollierte Wiederholung, Oberbegriffe und Synonyme.",
    ],
    usage: [
      "Leser durch Argumentation oder Erzählung führen.",
      "Alte und neue Information verbinden.",
      "Absätze thematisch fokussieren.",
    ],
    wordOrder: [
      "Bekannte Information steht häufig früh; neue oder fokussierte Information später.",
      "Vorfeldbesetzung schafft Anschluss an den vorherigen Satz.",
    ],
    specialCases: [
      "Pronomen brauchen ein eindeutiges Bezugswort.",
      "Synonyme sind nicht immer bedeutungsgleich; ungenaue Variation kann Kohärenz beschädigen.",
    ],
    memoryTip:
      "Jeder Satz braucht eine sichtbare Rückbindung und einen klaren neuen Beitrag.",
  },
  "Register und Stil": {
    overview:
      "Register bezeichnet die sprachliche Anpassung an Situation, Medium, Beziehung und Zweck. Grammatik trägt dazu durch Anrede, Satzkomplexität, Modalität und Nominal- oder Verbalstil bei.",
    formation: [
      "Formell: Sie, höflicher Konjunktiv, explizite Verknüpfung, kontrollierte Distanz.",
      "Informell: du, Ellipsen, Partikeln, kürzere Einheiten und stärkere Kontextabhängigkeit.",
      "Fachlich: definierte Begriffe, präzise Nominalgruppen und evidenzbezogene Modalität.",
    ],
    usage: [
      "Textsorte und Adressaten angemessen bedienen.",
      "Nähe, Autorität, Vorsicht oder Sachlichkeit gestalten.",
      "Stilbrüche bewusst einsetzen oder vermeiden.",
    ],
    wordOrder: [
      "Gesprochene Sprache nutzt häufiger Nachträge und Ausklammerung.",
      "Formelle Schrift bevorzugt planbare, eindeutig eingebettete Strukturen.",
    ],
    specialCases: [
      "Formell bedeutet nicht automatisch nominal und kompliziert.",
      "Regionale und soziale Variation ist nicht mit Fehlerhaftigkeit gleichzusetzen; entscheidend ist Situationsangemessenheit.",
    ],
    memoryTip:
      "Vor dem Formulieren klären: Wer spricht mit wem, in welchem Medium und mit welchem Ziel?",
  },
  "Verbalisierung und Nominalisierung abwägen": {
    overview:
      "Verbalisierung macht Akteure, Zeit und Handlung sichtbar; Nominalisierung verdichtet Vorgänge zu Begriffen. Gute Fachtexte wechseln beide Strategien nach Informationszweck.",
    formation: [
      "Nominal: nach der Durchführung der Analyse.",
      "Verbal: nachdem wir die Daten analysiert hatten.",
      "Genitiv- und Präpositionalattribute werden beim Verbalisieren zu Subjekt, Objekt oder Adverbial.",
    ],
    usage: [
      "Nominalisieren für Kategorien, Überschriften und thematische Wiederaufnahme.",
      "Verbalisieren für klare Verantwortlichkeit und dynamische Abläufe.",
      "Informationsdichte an Zielgruppe und Medium anpassen.",
    ],
    wordOrder: [
      "Verbalisierung verteilt Information auf Satzfelder und Nebensätze.",
      "Nominalisierung konzentriert Information innerhalb einer Nomengruppe.",
    ],
    specialCases: [
      "Beim Umformen dürfen logische Rollen und Zeitbeziehungen nicht verloren gehen.",
      "Unnötige Funktionsverbgefüge lassen sich oft durch ein präzises Vollverb ersetzen.",
    ],
    memoryTip:
      "Wenn unklar ist, wer was tut, verbalisiere. Wenn ein Prozess als Begriff gebraucht wird, nominalisiere.",
  },
  Parallelismus: {
    overview:
      "Parallelismus ordnet gleichrangige Gedanken in derselben grammatischen Form. Er verbessert Verständlichkeit, Rhythmus und argumentative Vergleichbarkeit.",
    formation: [
      "Gleiche Wortart oder Phrasenform: schnell, zuverlässig und kostengünstig.",
      "Gleiche Satzstruktur: Wir planen ..., wir prüfen ..., wir verbessern ...",
      "Korrelative Paare verlangen parallele Anschlüsse.",
    ],
    usage: [
      "Aufzählungen, Vergleiche und Kontraste klar strukturieren.",
      "Rhetorischen Rhythmus und Erinnerbarkeit erhöhen.",
      "Komplexe Argumente in wiederkehrende Muster gliedern.",
    ],
    wordOrder: [
      "Entsprechende Elemente sollten an vergleichbaren Positionen stehen.",
      "Gemeinsame Satzteile können ausgespart werden, wenn der Bezug eindeutig bleibt.",
    ],
    specialCases: [
      "Ein Bruch ist möglich, wenn er bewusst einen Fokus erzeugt.",
      "Falsche Parallelität verbindet unterschiedliche grammatische Ebenen und erschwert das Lesen.",
    ],
    memoryTip:
      "Was logisch gleichrangig ist, sollte auch grammatisch gleich aussehen.",
  },
});
