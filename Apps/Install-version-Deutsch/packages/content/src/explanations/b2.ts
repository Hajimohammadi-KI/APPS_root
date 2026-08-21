import { defineExplanations } from "./schema";

export const b2Explanations = defineExplanations({
  "Konjunktiv II Vergangenheit": {
    overview:
      "Der Konjunktiv II der Vergangenheit beschreibt irreale, nicht eingetretene oder bedauerte Ereignisse in der Vergangenheit. Die Aussage steht im Gegensatz zur bekannten Realität.",
    formation: [
      "hätte/wäre + Partizip II: Ich hätte gelernt. Sie wäre gekommen.",
      "Die Wahl von hätte oder wäre folgt der Perfektbildung des Verbs.",
      "Mit Modalverb: hätte + Infinitiv + Modalinfinitiv: Ich hätte früher gehen müssen.",
    ],
    usage: [
      "Irreale Bedingung: Wenn ich Zeit gehabt hätte, wäre ich gekommen.",
      "Bedauern oder Vorwurf: Du hättest anrufen sollen.",
      "Vermutete Alternative: Ohne Hilfe wäre das Projekt gescheitert.",
    ],
    wordOrder: [
      "Im Hauptsatz steht hätte/wäre auf Position 2 und das Partizip am Ende.",
      "Im Nebensatz steht hätte/wäre regulär zuletzt; bei Ersatzinfinitiv steht das Hilfsverb davor: ..., weil ich hätte arbeiten müssen.",
    ],
    specialCases: [
      "Der reale Hintergrund wird oft mit aber formuliert: Ich wäre gekommen, aber ich war krank.",
      "Würde + Perfektinfinitiv ist möglich, aber die hätte/wäre-Form ist meist natürlicher.",
    ],
    memoryTip:
      "Irreal vergangen = Konjunktiv von haben/sein plus dieselbe Partizipwahl wie im Perfekt.",
  },
  "Passiv mit Modalverben": {
    overview:
      "Passiv mit Modalverb kombiniert Notwendigkeit, Möglichkeit oder Erlaubnis mit einem Vorgang. Der Prozess bleibt zentral, der Handelnde kann ungenannt bleiben.",
    formation: [
      "Modalverb konjugiert + Partizip II + werden: Die Aufgabe muss erledigt werden.",
      "Präteritum: Die Aufgabe musste erledigt werden.",
      "Perfekt: Die Aufgabe hat erledigt werden müssen.",
    ],
    usage: [
      "Regeln und Pflichten: Formulare müssen unterschrieben werden.",
      "Möglichkeiten: Der Fehler kann korrigiert werden.",
      "Erlaubnis oder Empfehlung: Das Gerät darf benutzt werden.",
    ],
    wordOrder: [
      "Im Hauptsatz steht das Modalverb auf Position 2; Partizip II + werden schließen die Klammer.",
      "Im Nebensatz mit Präsens/Präteritum steht das Modalverb ganz am Ende.",
    ],
    specialCases: [
      "Im Perfekt entsteht ein Dreifachinfinitiv; das Hilfsverb steht im Nebensatz vor dieser Gruppe.",
      "Eine man-Konstruktion kann stilistisch leichter sein, wenn die Verbgruppe zu schwer wird.",
    ],
    memoryTip:
      "Das Passiv liefert Partizip + werden; das Modalverb kommt als finiter Rahmen dazu.",
  },
  Zustandspassiv: {
    overview:
      "Das Zustandspassiv beschreibt das Ergebnis eines abgeschlossenen Vorgangs, nicht den Vorgang selbst. Es wird mit sein und Partizip II gebildet.",
    formation: [
      "sein + Partizip II: Die Tür ist geschlossen.",
      "Vergangenheit: Die Tür war geschlossen.",
      "Das Partizip verhält sich prädikativ und erhält keine Adjektivendung.",
    ],
    usage: [
      "Resultierender Zustand: Das Essen ist vorbereitet.",
      "Kontrast zum Vorgangspassiv: Die Tür wird geschlossen = Prozess.",
      "Kontrast zum Perfekt Aktiv: Er hat die Tür geschlossen = Akteur im Vordergrund.",
    ],
    wordOrder: [
      "Sein steht an Position 2, das Partizip am Satzende oder im einfachen Prädikat direkt danach.",
      "Im Nebensatz steht sein am Ende: ..., weil die Tür geschlossen ist.",
    ],
    specialCases: [
      "Nicht jedes Partizip beschreibt eindeutig einen resultierenden Zustand; manche Formen sind lexikalisierte Adjektive.",
      "Mit von + Dativ klingt das Zustandspassiv oft unnatürlich, weil der Akteur für den Zustand meist irrelevant ist.",
    ],
    memoryTip:
      "Wird geschlossen zeigt die Handlung; ist geschlossen zeigt das sichtbare Ergebnis.",
  },
  Nominalisierung: {
    overview:
      "Nominalisierung verwandelt Verben oder Adjektive in Nomen. Sie verdichtet Informationen und ist in Fach-, Verwaltungs- und Wissenschaftssprache häufig, kann Texte aber schwerer machen.",
    formation: [
      "Infinitiv als Neutrum: prüfen → das Prüfen; reisen → das Reisen.",
      "Suffixe: -ung, -heit, -keit, -tion, -ität: entscheiden → Entscheidung; möglich → Möglichkeit.",
      "Nominalisierte Adjektive/Partizipien werden dekliniert: der Reisende, etwas Neues.",
    ],
    usage: [
      "Prozesse als Begriffe behandeln: die Durchführung der Studie.",
      "Akteure ausblenden und sachlich verdichten.",
      "Textverknüpfung durch Wiederaufnahme eines vorherigen Vorgangs.",
    ],
    wordOrder: [
      "Verbale Ergänzungen werden oft zu Genitiv- oder Präpositionalattributen.",
      "Lange Nominalgruppen bündeln Information vor dem finiten Verb.",
    ],
    specialCases: [
      "Zu viele Nominalisierungen erzeugen schwer lesbaren Nominalstil.",
      "Verbalisieren, wenn Akteur, Zeit oder Handlungslinie wichtig sind.",
    ],
    memoryTip: "Nominalisiere für Begriffe, verbalisiere für klare Handlungen.",
  },
  "N-Deklination": {
    overview:
      "Bestimmte maskuline Nomen erhalten in allen Fällen außer Nominativ Singular die Endung -(e)n. Sie bezeichnen häufig Personen oder Lebewesen.",
    formation: [
      "der Student, den/dem/des Studenten; die Studenten.",
      "Häufige Gruppen: Nomen auf -e wie Junge, Kunde, Kollege sowie Fremdwörter auf -ant, -ent, -ist, -oge.",
      "Herr → Herrn; Mensch → Menschen; Name zusätzlich Genitiv Namens.",
    ],
    usage: [
      "Die Kasusendung erscheint unabhängig davon, ob ein Artikel davorsteht.",
      "Die Pluralform ist häufig mit den gebeugten Singularformen identisch.",
    ],
    wordOrder: [
      "Die N-Deklination verändert nicht die Satzstellung, aber sie macht den Kasus der Nomengruppe sichtbar.",
      "Adjektiv- und Artikelendungen folgen zusätzlich den normalen Regeln.",
    ],
    specialCases: [
      "Nicht jedes maskuline Personenwort gehört dazu: der Lehrer → den Lehrer.",
      "Einige gemischte Nomen haben im Genitiv zusätzlich -s: des Namens, des Herzens.",
    ],
    memoryTip:
      "Maskuline Person auf -e/-ent/-ist? Prüfe, ob außer der-Form überall -n steht.",
  },
  "Partizipien als Adjektive": {
    overview:
      "Partizip I und II können wie Adjektive ein Nomen beschreiben. Partizip I betont einen gleichzeitig ablaufenden Vorgang; Partizip II meist einen abgeschlossenen Vorgang oder Zustand.",
    formation: [
      "Partizip I: Infinitiv + -d: lachen → lachend; der lachende Mann.",
      "Partizip II wie in Perfekt/Passiv: das geschlossene Fenster.",
      "Als Attribut erhalten beide die normalen Adjektivendungen.",
    ],
    usage: [
      "Partizip I aktiv und gleichzeitig: die wartenden Gäste.",
      "Partizip II häufig passiv/resultativ: die reparierte Maschine.",
      "Verdichtung eines Relativsatzes: die Gäste, die warten → die wartenden Gäste.",
    ],
    wordOrder: [
      "Erweiterungen stehen vor dem Partizip innerhalb der Nomengruppe.",
      "Lange Partizipialattribute sind schriftsprachlich und müssen klar auf das Nomen bezogen sein.",
    ],
    specialCases: [
      "Bei intransitiven Verben kann Partizip II aktiv-perfektiv sein: die angekommenen Gäste.",
      "Lexikalisierte Partizipien können eine eigene Adjektivbedeutung entwickeln: bekannt, spannend.",
    ],
    memoryTip:
      "Partizip I läuft noch; Partizip II ist meist bereits geschehen.",
  },
  "je...desto/umso": {
    overview:
      "Je ... desto/umso verbindet zwei proportionale Veränderungen: Wenn der Grad im je-Satz steigt oder fällt, verändert sich der Grad im Hauptsatz entsprechend.",
    formation: [
      "je + Komparativ + Nebensatz, desto/umso + Komparativ + Hauptsatz.",
      "Je länger ich übe, desto sicherer spreche ich.",
      "Desto und umso sind in dieser Konstruktion austauschbar.",
    ],
    usage: [
      "Gleichgerichtete Entwicklung: mehr → mehr.",
      "Gegengerichtete Entwicklung: mehr → weniger.",
      "Allgemeine Zusammenhänge und argumentierende Texte.",
    ],
    wordOrder: [
      "Im je-Satz steht das finite Verb am Ende.",
      "Desto/umso + Komparativ besetzt das Vorfeld; danach folgt sofort das finite Verb.",
    ],
    specialCases: [
      "In knappen festen Formeln kann das Verb entfallen: Je früher, desto besser.",
      "Beide Teile brauchen semantisch vergleichbare Skalen.",
    ],
    memoryTip: "Je endet mit dem Verb; desto startet die Verb-zweit-Hälfte.",
  },
  "sowohl...als auch / weder...noch": {
    overview:
      "Sowohl ... als auch verbindet zwei bejahte gleichrangige Elemente. Weder ... noch verbindet zwei verneinte Elemente ohne zusätzliche Negation.",
    formation: [
      "sowohl A als auch B: Sie spricht sowohl Deutsch als auch Englisch.",
      "weder A noch B: Er trinkt weder Kaffee noch Tee.",
      "Die verbundenen Teile sollten dieselbe grammatische Form haben.",
    ],
    usage: [
      "Sowohl ... als auch betont, dass beide Alternativen gelten.",
      "Weder ... noch schließt beide Alternativen aus.",
      "Möglich mit Wörtern, Gruppen oder ganzen Satzteilen.",
    ],
    wordOrder: [
      "Bei verbundenen Subjekten steht das Verb normalerweise im Plural.",
      "Bei verbundenen Satzteilen stehen die Korrelate direkt vor den parallelen Elementen.",
    ],
    specialCases: [
      "Keine doppelte Negation mit weder ... noch.",
      "Nicht nur ... sondern auch setzt zusätzlich einen steigernden oder korrigierenden Fokus.",
    ],
    memoryTip:
      "Baue links und rechts dieselbe Struktur - Parallelität macht das Paar klar.",
  },
  "erweiterte Relativsätze": {
    overview:
      "Erweiterte Relativsätze kombinieren Relativpronomen mit Präposition, Genitiv, komplexen Verbgruppen oder Bezug auf ganze Aussagen. Die Grundregel bleibt: Bezug vom Nomen, Kasus aus dem Relativsatz.",
    formation: [
      "Präposition + Pronomen: die Methode, mit der wir arbeiten.",
      "Genitiv: der Mann, dessen Auto; die Frau, deren Idee.",
      "Wo(r)+Präposition bei unpersönlichem Bezug: etwas, worüber wir sprechen.",
    ],
    usage: [
      "Komplexe Attribute präzise in einen Satz integrieren.",
      "Besitz mit dessen/deren ausdrücken.",
      "Auf einen ganzen Satz mit was Bezug nehmen: Er kam zu spät, was mich ärgerte.",
    ],
    wordOrder: [
      "Relativausdruck am Anfang, vollständige Verbgruppe am Ende.",
      "Der Relativsatz sollte möglichst nah bei seinem eindeutigen Bezugswort stehen.",
    ],
    specialCases: [
      "Dessen/deren bleibt unverändert und ersetzt den Artikel des folgenden Nomens.",
      "Wo ist standardsprachlich vor allem bei Ortsbezug passend; sonst Präposition + Pronomen bevorzugen.",
    ],
    memoryTip:
      "Erst die Lücke rekonstruieren, dann Präposition und Kasus in das Relativpronomen übertragen.",
  },
  "Verben mit Präpositionen": {
    overview:
      "Viele Verben verlangen eine feste Präposition mit festem Kasus. Die Bedeutung lässt sich nicht zuverlässig aus der Präposition allein ableiten, daher wird die Verbindung als Einheit gelernt.",
    formation: [
      "warten auf + Akkusativ, teilnehmen an + Dativ, sich interessieren für + Akkusativ.",
      "Fragen nach Personen: auf wen, mit wem.",
      "Sachen: worauf, womit; Antwort: darauf, damit.",
    ],
    usage: [
      "Die feste Verbindung ergänzt das Verb semantisch.",
      "Pronominaladverbien vermeiden Wiederholung von Sachen oder Sachverhalten.",
      "Dass- oder Infinitivsätze können mit da(r)-Form angekündigt werden: Ich freue mich darauf, ...",
    ],
    wordOrder: [
      "Die Präpositionalergänzung steht typischerweise im Mittelfeld.",
      "Im Relativsatz bleibt die Präposition beim Relativpronomen.",
    ],
    specialCases: [
      "Für Personen verwendet man keine wo(r)-Form.",
      "Ähnliche Verben können unterschiedliche Rektion haben: bitten um, fragen nach, sich bewerben um.",
    ],
    memoryTip: "Lerne vierteilig: Verb + Präposition + Kasus + Beispielsatz.",
  },
  "indirekte Rede Grundlagen": {
    overview:
      "Indirekte Rede gibt fremde Aussagen mit sprachlicher Distanz wieder. Der Konjunktiv I signalisiert, dass der Sprecher die Information berichtet, ohne sie als eigene Tatsache zu bestätigen.",
    formation: [
      "Konjunktiv I meist vom Infinitivstamm: er sei, habe, komme; Plural häufig seien, hätten oder kämen zur Eindeutigkeit.",
      "Pronomen sowie Orts- und Zeitangaben werden an die Berichtssituation angepasst.",
      "Direkte Frage wird zu ob- oder W-Nebensatz.",
    ],
    usage: [
      "Nachrichten, Protokolle, wissenschaftliche Wiedergabe und formelle Berichte.",
      "Distanz zur Wahrheit oder Verantwortlichkeit der Aussage.",
      "Alltagssprache nutzt häufig dass + Indikativ.",
    ],
    wordOrder: [
      "Mit dass steht das finite Verb am Ende; ohne dass kann Verb-zweit-Stellung bleiben.",
      "Eingebettete Fragen haben Nebensatzstellung.",
    ],
    specialCases: [
      "Ist Konjunktiv I mit Indikativ identisch, verwendet man oft Konjunktiv II als Ersatz.",
      "Konjunktiv bedeutet nicht automatisch Zweifel; primär markiert er Quellenabstand.",
    ],
    memoryTip:
      "Indirekte Rede beantwortet: Wer behauptet das? Der Modus hält diese Quelle sichtbar.",
  },
  "Nomen-Verb-Verbindungen / Funktionsverbgefüge": {
    overview:
      "Funktionsverbgefüge verbinden ein abstraktes Nomen mit einem bedeutungsarmen Verb. Die Gesamtverbindung funktioniert wie ein präzises Verb und ist besonders in formeller Sprache üblich.",
    formation: [
      "eine Entscheidung treffen = entscheiden.",
      "zur Verfügung stehen = verfügbar sein; in Betracht ziehen = erwägen.",
      "Artikel und Präposition gehören häufig fest zur Verbindung.",
    ],
    usage: [
      "Formelle Prozesse differenzieren: Maßnahmen ergreifen, Kritik üben.",
      "Aktionsart ausdrücken: in Bewegung setzen versus in Bewegung sein.",
      "Typische Kollokationen in Beruf, Verwaltung und Wissenschaft.",
    ],
    wordOrder: [
      "Das Funktionsverb trägt Tempus und Satzposition; das Nomen bleibt Teil des Prädikats.",
      "Trennbare oder passive Formen folgen der Grammatik des Funktionsverbs.",
    ],
    specialCases: [
      "Wörter sind nicht frei austauschbar: eine Frage stellen, nicht machen.",
      "Ein einfaches Verb ist oft klarer; das Gefüge ist sinnvoll, wenn Register oder Bedeutungsnuance es verlangt.",
    ],
    memoryTip: "Behandle die ganze Verbindung wie ein einziges Vokabelpaket.",
  },
  "Wortstellung im Mittelfeld": {
    overview:
      "Das Mittelfeld liegt zwischen linkem und rechtem Satzklammerteil. Seine Reihenfolge wird durch Pronomen, Bekanntheit, Kasus, Gewicht und kommunikative Betonung gesteuert.",
    formation: [
      "Unbetonte Pronomen stehen früh; meist Nominativ vor Akkusativ vor Dativ.",
      "Bei Nomen steht Dativ gewöhnlich vor Akkusativ.",
      "Angaben folgen neutral oft temporal - kausal - modal - lokal.",
    ],
    usage: [
      "Bekannte, kurze Information steht tendenziell vor neuer, langer Information.",
      "Abweichung von der neutralen Reihenfolge setzt Fokus oder Kontrast.",
      "Definite Gruppen stehen häufig vor indefiniten.",
    ],
    wordOrder: [
      "Linke Klammer + Mittelfeld + rechte Klammer: Ich habe ihm das Buch gestern im Büro gegeben.",
      "Schwere Nebensätze werden gern ins Nachfeld verschoben.",
    ],
    specialCases: [
      "TeKaMoLo ist nur eine Grundtendenz und konkurriert mit Pronomen- und Informationsregeln.",
      "Nicht steht unmittelbar vor dem Teil, den es fokussiert, oder spät bei Satznegation.",
    ],
    memoryTip: "Früh: kurz, bekannt, pronominal. Spät: lang, neu, fokussiert.",
  },
  "Konnektoren und Satzverknüpfung": {
    overview:
      "Konnektoren zeigen die logische Beziehung zwischen Aussagen. Ihre Wortart entscheidet, ob Verb-zweit-, Verb-erst- oder Verb-end-Stellung folgt.",
    formation: [
      "Koordinierend ohne Stellungswechsel: und, aber, denn, sondern, oder.",
      "Subordinierend mit Verb am Ende: weil, obwohl, während, damit, falls.",
      "Konjunktionaladverb mit Verb-zweit: deshalb, trotzdem, außerdem, danach.",
    ],
    usage: [
      "Kausal, konsekutiv, konzessiv, adversativ, temporal, konditional oder final verknüpfen.",
      "Beziehungen explizit machen und Textkohärenz verbessern.",
      "Passenden Konnektor nach Bedeutung und Register wählen.",
    ],
    wordOrder: [
      "Konjunktionaladverb im Vorfeld zählt als Position 1; danach folgt das Verb.",
      "Nebensatzkonjunktion steht außerhalb der Felder und schickt das finite Verb ans Ende.",
    ],
    specialCases: [
      "Aber und sondern unterscheiden sich: sondern korrigiert nach expliziter Negation.",
      "Daher/deshalb beschreiben Folge, denn/weil den Grund.",
    ],
    memoryTip:
      "Lerne jeden Konnektor zusammen mit seiner Bedeutung und seinem Satzbaumuster.",
  },
});
