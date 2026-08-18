// Phase 1 Autorierung für C2. Gleicher Vertrag wie authored/a1.ts.
//
// C2-Einheiten benennen Textkompetenzen, deren Quellfeld (rule/commonError)
// oft nur ein Kategorielabel war ("Implizites darf ... nicht erscheinen.")
// statt eines echten Fehlerpaars -- deshalb lagen sie vor der Autorierung bei
// 2-3 statt 11-12 Zielen. Jeder Satz setzt die Kompetenz tatsächlich ein und
// maskiert ein WORT, nie ein Satzzeichen (siehe die Begründung in
// authored/c1.ts bei "Interpunktion als Bedeutungssignal").

import type { AuthoredUnit } from "./a1";

export const C2_AUTHORED: Readonly<Record<string, AuthoredUnit>> = {
  "Feine Bedeutungsunterschiede im Modus": {
    examples: [
      { sentence: "Es wäre denkbar, dass die Maßnahme unbeabsichtigte Folgen hat.", target: "wäre denkbar" },
      { sentence: "Es ist möglich, dass der Effekt überschätzt wurde.", target: "ist möglich" },
      { sentence: "Man könnte annehmen, dass die Ursache anderswo liegt.", target: "könnte annehmen" },
      { sentence: "Es wäre übertrieben zu behaupten, das Problem sei gelöst.", target: "wäre übertrieben" },
      { sentence: "Es dürfte kaum überraschen, dass die Kosten stiegen.", target: "dürfte kaum überraschen" },
      { sentence: "Man müsste eigentlich erwarten, dass sich das ändert.", target: "müsste eigentlich erwarten" },
      { sentence: "Es wäre voreilig, schon jetzt ein Urteil zu fällen.", target: "wäre voreilig" },
      { sentence: "Es könnte sein, dass weitere Faktoren mitwirken.", target: "könnte sein" },
    ],
    transfer: "Es wäre voreilig anzunehmen, dass die Maßnahme keine weiteren Folgen haben könnte.",
  },

  "Markierte Wortstellung": {
    examples: [
      { sentence: "Dieses Ergebnis, das muss betont werden, ist vorläufig.", target: "das muss betont werden" },
      { sentence: "Diese Frage, so viel steht fest, bleibt offen.", target: "so viel steht fest" },
      { sentence: "Genau das, und nur das, war das Ziel.", target: "und nur das" },
      { sentence: "Dieser Punkt, wie bereits erwähnt, ist entscheidend.", target: "wie bereits erwähnt" },
      { sentence: "Erst dieses Detail, so zeigte sich, war ausschlaggebend.", target: "so zeigte sich" },
      { sentence: "Diese Lösung, das sei zugegeben, ist nicht perfekt.", target: "das sei zugegeben" },
      { sentence: "Genau hier, und nirgendwo sonst, lag das Problem.", target: "und nirgendwo sonst" },
      { sentence: "Dieser Aspekt, wie sich zeigte, wurde unterschätzt.", target: "wie sich zeigte" },
    ],
    transfer: "Dieser Befund, das muss deutlich gesagt werden, widerspricht der bisherigen Annahme.",
  },

  "Komplexe Einbettung": {
    examples: [
      { sentence: "Obwohl die Studie klein war, überzeugte ihre Methode, weil sie transparent dokumentiert wurde, was wiederum die Replikation erleichterte.", target: "was wiederum die Replikation erleichterte" },
      { sentence: "Da die Daten fehlten, verschoben wir die Analyse, obwohl der Zeitplan das kaum erlaubte, was zu Spannungen führte.", target: "was zu Spannungen führte" },
      { sentence: "Weil das Ergebnis überraschte, das niemand erwartet hatte, wurde die Studie wiederholt, was Zeit kostete.", target: "was Zeit kostete" },
      { sentence: "Obwohl die Kritik hart war, die viele für ungerecht hielten, reagierte er ruhig, was Respekt einbrachte.", target: "was Respekt einbrachte" },
      { sentence: "Da die Methode neu war, was Skepsis auslöste, testeten wir sie mehrfach, bevor wir sie veröffentlichten.", target: "bevor wir sie veröffentlichten" },
      { sentence: "Weil die Frist nahte, die kaum verschiebbar war, arbeitete das Team durch, obwohl alle erschöpft waren.", target: "obwohl alle erschöpft waren" },
      { sentence: "Obwohl er zweifelte, was seine Kollegen bemerkten, hielt er an seiner These fest, bis neue Daten kamen.", target: "bis neue Daten kamen" },
      { sentence: "Da der Befund unklar blieb, obwohl mehrere Tests liefen, entschieden wir uns, die Frage offenzulassen.", target: "entschieden wir uns" },
    ],
    transfer: "Obwohl die erste Version scheiterte, was niemanden wirklich überraschte, gelang die zweite, weil das Team aus den Fehlern gelernt hatte.",
  },

  "Ellipsen und Substitution": {
    examples: [
      { sentence: "Einige stimmten zu, andere nicht.", target: "andere nicht" },
      { sentence: "Er wollte helfen, sie nicht.", target: "sie nicht" },
      { sentence: "Manche verstanden es sofort, andere erst später.", target: "andere erst später" },
      { sentence: "Sie hatte recht, er nicht.", target: "er nicht" },
      { sentence: "Die einen lobten den Plan, die anderen kritisierten ihn.", target: "die anderen kritisierten ihn" },
      { sentence: "Er kam pünktlich, sie zu spät.", target: "sie zu spät" },
      { sentence: "Manche gewannen, andere verloren.", target: "andere verloren" },
      { sentence: "Die Ergebnisse überzeugten, die Methode weniger.", target: "die Methode weniger" },
    ],
    transfer: "Einige Ergebnisse überzeugten sofort, andere erst nach genauerer Prüfung.",
  },

  "Rhetorische Syntax": {
    examples: [
      { sentence: "Nicht die Menge, sondern die Qualität ist entscheidend.", target: "sondern die Qualität" },
      { sentence: "Nicht Zufall, sondern harte Arbeit führte zum Erfolg.", target: "sondern harte Arbeit" },
      { sentence: "Nicht Worte, sondern Taten überzeugen.", target: "sondern Taten" },
      { sentence: "Nicht Schnelligkeit, sondern Genauigkeit zählt hier.", target: "sondern Genauigkeit" },
      { sentence: "Nicht die Größe, sondern die Wirkung macht den Unterschied.", target: "sondern die Wirkung" },
      { sentence: "Nicht Theorie, sondern Praxis überzeugte die Kritiker.", target: "sondern Praxis" },
      { sentence: "Nicht Lautstärke, sondern Klarheit gewinnt die Debatte.", target: "sondern Klarheit" },
      { sentence: "Nicht der Anfang, sondern das Ende zählt.", target: "sondern das Ende" },
    ],
    transfer: "Nicht die schnelle Lösung, sondern die nachhaltige Wirkung sollte hier den Ausschlag geben.",
  },

  Ambiguitätskontrolle: {
    examples: [
      { sentence: "Die Forscherin informierte die Teilnehmerin, die ausgewählt worden war.", target: "die ausgewählt worden war" },
      { sentence: "Er zeigte dem Kollegen das Dokument, das er überarbeitet hatte.", target: "das er überarbeitet hatte" },
      { sentence: "Sie schickte der Chefin die Datei, die noch fehlte.", target: "die noch fehlte" },
      { sentence: "Der Lehrer lobte die Schülerin, die die Aufgabe gelöst hatte.", target: "die die Aufgabe gelöst hatte" },
      { sentence: "Er gab dem Assistenten das Protokoll zurück, das er korrigiert hatte.", target: "das er korrigiert hatte" },
      { sentence: "Sie zeigte der Praktikantin die Akte, die sie gesucht hatte.", target: "die sie gesucht hatte" },
      { sentence: "Der Chef dankte der Mitarbeiterin, die den Fehler gefunden hatte.", target: "die den Fehler gefunden hatte" },
      { sentence: "Er reichte dem Prüfer die Unterlagen, die vollständig waren.", target: "die vollständig waren" },
    ],
    transfer: "Die Leiterin informierte die Kandidatin, die als Erste ausgewählt worden war, noch am selben Tag.",
  },

  "Idiomatizität und Kollokation": {
    examples: [
      { sentence: "eine Entscheidung treffen, Verantwortung übernehmen", target: "treffen" },
      { sentence: "einen Fehler machen, eine Chance ergreifen", target: "machen" },
      { sentence: "Rücksicht nehmen, einen Beitrag leisten", target: "nehmen" },
      { sentence: "Erfolg haben, ein Risiko eingehen", target: "haben" },
      { sentence: "eine Frage stellen, eine Antwort geben", target: "stellen" },
      { sentence: "Kritik üben, einen Vorschlag machen", target: "üben" },
      { sentence: "Einfluss nehmen, eine Rolle spielen", target: "nehmen" },
      { sentence: "einen Eindruck gewinnen, ein Ziel verfolgen", target: "gewinnen" },
    ],
    transfer: "Das Team musste eine schwierige Entscheidung treffen und dabei ein gewisses Risiko eingehen.",
  },

  "Textsortenspezifische Grammatik": {
    examples: [
      { sentence: "Hiermit beantrage ich eine Förderung für das Projekt.", target: "Hiermit beantrage ich" },
      { sentence: "Der Bericht beschreibt den Ausgangszustand, bewertet die Ergebnisse und empfiehlt konkrete Maßnahmen.", target: "empfiehlt konkrete Maßnahmen" },
      { sentence: "Sehr geehrte Damen und Herren, ich schreibe Ihnen bezüglich meiner Bewerbung.", target: "Sehr geehrte Damen und Herren" },
      { sentence: "Der Antrag begründet den Bedarf und nennt einen überprüfbaren Zeitplan.", target: "nennt einen überprüfbaren Zeitplan" },
      { sentence: "Im Folgenden werden die zentralen Ergebnisse zusammengefasst.", target: "Im Folgenden" },
      { sentence: "Der Vortrag gliedert sich in drei Teile und schließt mit einem Ausblick.", target: "schließt mit einem Ausblick" },
      { sentence: "Hiermit möchte ich Sie höflich um eine Stellungnahme bitten.", target: "Hiermit möchte ich" },
      { sentence: "Zusammenfassend lässt sich festhalten, dass die Methode sich bewährt hat.", target: "Zusammenfassend lässt sich festhalten" },
    ],
    transfer: "Hiermit beantrage ich eine Verlängerung der Frist und begründe dies mit dem erhöhten Arbeitsaufwand.",
  },

  "Stilistische Verdichtung": {
    examples: [
      { sentence: "Die 2025 veröffentlichte, mehrfach zitierte Studie bestätigt den langfristigen Effekt.", target: "mehrfach zitierte" },
      { sentence: "Der sorgfältig geprüfte, oft diskutierte Vorschlag fand breite Zustimmung.", target: "oft diskutierte" },
      { sentence: "Die kürzlich reformierte, viel beachtete Regelung trat sofort in Kraft.", target: "viel beachtete" },
      { sentence: "Der detailliert dokumentierte, unabhängig geprüfte Befund überzeugte alle.", target: "unabhängig geprüfte" },
      { sentence: "Die neu entwickelte, bereits patentierte Technologie setzte Maßstäbe.", target: "bereits patentierte" },
      { sentence: "Der klar formulierte, breit unterstützte Plan wurde schnell umgesetzt.", target: "breit unterstützte" },
      { sentence: "Die gründlich analysierte, oft zitierte Umfrage prägte die Debatte.", target: "oft zitierte" },
      { sentence: "Der frühzeitig erkannte, rasch behobene Fehler blieb ohne Folgen.", target: "rasch behobene" },
    ],
    transfer: "Die sorgfältig geprüfte, mehrfach bestätigte Analyse überzeugte selbst die größten Skeptiker.",
  },

  "Pragmatische Feinsteuerung": {
    examples: [
      { sentence: "Wären Sie so freundlich, mir die Unterlagen bis Freitag zu senden?", target: "Wären Sie so freundlich" },
      { sentence: "Dürfte ich Sie kurz um Ihre Aufmerksamkeit bitten?", target: "Dürfte ich" },
      { sentence: "Es wäre hilfreich, wenn Sie das noch einmal prüfen könnten.", target: "Es wäre hilfreich" },
      { sentence: "Könnten Sie mir freundlicherweise Bescheid geben?", target: "Könnten Sie" },
      { sentence: "Ich wäre Ihnen sehr dankbar für eine kurze Rückmeldung.", target: "wäre Ihnen sehr dankbar" },
      { sentence: "Es würde mich freuen, bald von Ihnen zu hören.", target: "würde mich freuen" },
      { sentence: "Wären Sie einverstanden, den Termin zu verschieben?", target: "Wären Sie einverstanden" },
      { sentence: "Dürfte ich freundlich nachfragen, wie der Stand ist?", target: "Dürfte ich" },
    ],
    transfer: "Wären Sie so freundlich, uns die aktuellen Zahlen bis Ende der Woche zukommen zu lassen?",
  },

  "Kohärenz langer Beiträge": {
    examples: [
      { sentence: "These, Begründung, Einwand, Abwägung und Schluss bilden die Struktur.", target: "Abwägung" },
      { sentence: "Zunächst die Ausgangslage, danach die Analyse, schließlich die Empfehlung.", target: "die Analyse" },
      { sentence: "Erst das Problem, dann die Ursache, zuletzt die Lösung.", target: "die Ursache" },
      { sentence: "Am Anfang die Frage, in der Mitte die Belege, am Ende das Fazit.", target: "die Belege" },
      { sentence: "Zuerst die Beobachtung, dann die Deutung, abschließend die Bewertung.", target: "die Deutung" },
      { sentence: "Einleitung, Hauptteil und Schluss halten den Beitrag zusammen.", target: "Hauptteil" },
      { sentence: "Erst die Fakten, dann die Interpretation, zuletzt die Konsequenz.", target: "die Interpretation" },
      { sentence: "Ausgangspunkt, Argumentation und Fazit bilden einen roten Faden.", target: "Argumentation" },
    ],
    transfer: "These, Begründung und Gegenargument bilden zusammen ein überzeugendes und in sich stimmiges Argument.",
  },

  "Selbstreparatur im Sprechen": {
    examples: [
      { sentence: "Ich habe – besser gesagt: ich hatte – bereits begonnen.", target: "besser gesagt" },
      { sentence: "Er kam gestern – nein, vorgestern – vorbei.", target: "nein" },
      { sentence: "Sie sagte – oder vielmehr, sie schrieb – es sei erledigt.", target: "oder vielmehr" },
      { sentence: "Wir treffen uns um drei – Moment, um vier – Uhr.", target: "Moment" },
      { sentence: "Er wohnt in München – genauer gesagt, in der Nähe von München.", target: "genauer gesagt" },
      { sentence: "Ich meinte den ersten – also den zweiten Vorschlag.", target: "also" },
      { sentence: "Sie kommt am Montag – ich korrigiere mich, am Dienstag.", target: "ich korrigiere mich" },
      { sentence: "Das war 2023 – Verzeihung, 2024.", target: "Verzeihung" },
    ],
    transfer: "Ich habe – genauer gesagt: ich hatte damals schon – ein ungutes Gefühl bei diesem Plan.",
  },

  "Mehrsprachige Interferenzkontrolle": {
    examples: [
      { sentence: "Ich habe Interesse an einer Mitarbeit im Forschungsprojekt.", target: "habe Interesse" },
      { sentence: "Sie ist verantwortlich für das gesamte Projekt.", target: "ist verantwortlich" },
      { sentence: "Er hat Angst vor der Prüfung.", target: "hat Angst" },
      { sentence: "Wir sind gespannt auf die Ergebnisse.", target: "sind gespannt" },
      { sentence: "Sie ist stolz auf ihre Arbeit.", target: "ist stolz" },
      { sentence: "Ich bin sicher, dass es funktioniert.", target: "bin sicher" },
      { sentence: "Er hat recht mit seiner Einschätzung.", target: "hat recht" },
      { sentence: "Wir sind uns bewusst über die Risiken.", target: "sind uns bewusst" },
    ],
    transfer: "Ich habe großes Interesse an dieser Stelle und bin mir der Verantwortung durchaus bewusst.",
  },

  "Integrierte automatische Produktion": {
    examples: [
      { sentence: "Obwohl die Zeit knapp war, blieb die Analyse präzise und gut begründet.", target: "Obwohl die Zeit knapp war" },
      { sentence: "Trotz des Zeitdrucks gelang eine klare und kohärente Darstellung.", target: "Trotz des Zeitdrucks" },
      { sentence: "Selbst unter Druck blieb ihre Argumentation nachvollziehbar und präzise.", target: "Selbst unter Druck" },
      { sentence: "Obwohl wenig Vorbereitungszeit blieb, überzeugte die Präsentation.", target: "Obwohl wenig Vorbereitungszeit blieb" },
      { sentence: "Trotz spontaner Fragen antwortete er ruhig und strukturiert.", target: "Trotz spontaner Fragen" },
      { sentence: "Selbst in der Eile blieb die Wortwahl treffend und angemessen.", target: "Selbst in der Eile" },
      { sentence: "Obwohl das Thema komplex war, blieb der Vortrag verständlich.", target: "Obwohl das Thema komplex war" },
      { sentence: "Trotz begrenzter Zeit gelang eine überzeugende Zusammenfassung.", target: "Trotz begrenzter Zeit" },
    ],
    transfer: "Obwohl die Zeit sehr knapp bemessen war, gelang ihm eine präzise, kohärente und überzeugende Antwort.",
  },

  "Deixis und Perspektivsteuerung": {
    examples: [
      { sentence: "Im damaligen Kontext bedeutete diese Entscheidung etwas anderes als heute.", target: "damaligen" },
      { sentence: "Dort, wo wir früher wohnten, hat sich vieles verändert.", target: "Dort" },
      { sentence: "Jetzt sieht die Lage schon wieder anders aus.", target: "Jetzt" },
      { sentence: "Damals war diese Entscheidung noch umstritten.", target: "Damals" },
      { sentence: "Dieser Vorschlag, hier vorgestellt, unterscheidet sich stark vom ersten.", target: "hier" },
      { sentence: "Jener Ansatz, den wir damals verfolgten, wurde inzwischen aufgegeben.", target: "Jener" },
      { sentence: "Heute bewerten wir diese Entscheidung ganz anders.", target: "Heute" },
      { sentence: "Von dort aus war der Weg deutlich kürzer.", target: "dort" },
    ],
    transfer: "Im damaligen Kontext erschien diese Lösung sinnvoll, während sie aus heutiger Sicht fragwürdig wirkt.",
  },

  "Anapher und Katapher": {
    examples: [
      { sentence: "Das war unerwartet: dass sämtliche Messungen übereinstimmten.", target: "Das war unerwartet" },
      { sentence: "Sie hatte es geahnt: dass die Prüfung schwer werden würde.", target: "Sie hatte es geahnt" },
      { sentence: "Der Grund war einfach: die fehlende Vorbereitung.", target: "Der Grund war einfach" },
      { sentence: "Er befürchtete es: dass der Termin platzen würde.", target: "Er befürchtete es" },
      { sentence: "Das Ergebnis überraschte niemanden: der Effekt blieb aus.", target: "Das Ergebnis überraschte niemanden" },
      { sentence: "Sie wusste es längst: dass die Entscheidung schon gefallen war.", target: "Sie wusste es längst" },
      { sentence: "Die Antwort war klar: eine erneute Prüfung war nötig.", target: "Die Antwort war klar" },
      { sentence: "Er spürte es sofort: dass etwas nicht stimmte.", target: "Er spürte es sofort" },
    ],
    transfer: "Das hatten alle vermutet: dass die zweite Studie das erste Ergebnis bestätigen würde.",
  },

  "Skopus und Negation": {
    examples: [
      { sentence: "Nicht alle Ergebnisse waren signifikant.", target: "Nicht alle" },
      { sentence: "Alle Ergebnisse waren nicht signifikant.", target: "waren nicht" },
      { sentence: "Nicht jeder Teilnehmer stimmte zu.", target: "Nicht jeder" },
      { sentence: "Nur wenige Teilnehmer stimmten nicht zu.", target: "stimmten nicht" },
      { sentence: "Nicht immer war die Methode zuverlässig.", target: "Nicht immer" },
      { sentence: "Die Methode war nicht immer zuverlässig.", target: "nicht immer" },
      { sentence: "Nicht jede Abweichung ist ein Fehler.", target: "Nicht jede" },
      { sentence: "Jede Abweichung ist nicht automatisch ein Fehler.", target: "nicht automatisch" },
    ],
    transfer: "Nicht alle Teilnehmer stimmten zu, aber auch nicht jeder lehnte den Vorschlag rundweg ab.",
  },

  "Präsupposition und Implikatur": {
    examples: [
      { sentence: "Auch die zweite Studie scheiterte setzt voraus, dass bereits eine erste scheiterte.", target: "setzt voraus" },
      { sentence: "Er hörte auf zu rauchen setzt voraus, dass er zuvor rauchte.", target: "setzt voraus" },
      { sentence: "Sie kam wieder pünktlich impliziert, dass sie zuvor unpünktlich war.", target: "impliziert" },
      { sentence: "Er gab den Fehler zu setzt voraus, dass ein Fehler vorlag.", target: "setzt voraus" },
      { sentence: "Sie verbesserte sich diesmal deutet an, dass es vorher Probleme gab.", target: "deutet an" },
      { sentence: "Auch er stimmte am Ende zu setzt voraus, dass andere schon zustimmten.", target: "setzt voraus" },
      { sentence: "Sie kehrte zurück setzt voraus, dass sie vorher weg war.", target: "setzt voraus" },
      { sentence: "Er entschuldigte sich erneut impliziert eine frühere Entschuldigung.", target: "impliziert" },
    ],
    transfer: "Die Formulierung auch das zweite Experiment gelang setzt implizit voraus, dass bereits ein erstes gelungen war.",
  },

  "Informationsdichte kontrollieren": {
    examples: [
      { sentence: "Die nach mehrfacher Prüfung bestätigte Abweichung erfordert eine neue Erklärung.", target: "nach mehrfacher Prüfung" },
      { sentence: "Die trotz sorgfältiger Kontrolle aufgetretene Abweichung blieb unerklärt.", target: "trotz sorgfältiger Kontrolle" },
      { sentence: "Die durch wiederholte Tests bestätigte Wirkung überzeugte die Kritiker.", target: "durch wiederholte Tests" },
      { sentence: "Die trotz aller Vorsicht entstandene Verzögerung kostete Zeit.", target: "trotz aller Vorsicht" },
      { sentence: "Die nach langer Debatte getroffene Entscheidung überraschte niemanden.", target: "nach langer Debatte" },
      { sentence: "Die durch neue Daten gestützte These gewann an Bedeutung.", target: "durch neue Daten" },
      { sentence: "Die trotz Zeitdrucks sorgfältig geprüfte Analyse blieb zuverlässig.", target: "trotz Zeitdrucks" },
      { sentence: "Die nach eingehender Prüfung freigegebene Studie wurde veröffentlicht.", target: "nach eingehender Prüfung" },
    ],
    transfer: "Die nach mehrfacher, sorgfältiger Prüfung bestätigte Abweichung erfordert eine grundlegend neue Erklärung.",
  },

  "Regionale Variation und Standardregister": {
    examples: [
      { sentence: "Das Perfekt dominiert regional auch dort, wo formelle Texte das Präteritum bevorzugen.", target: "dominiert" },
      { sentence: "Im Süden sagt man häufig anders als im Norden.", target: "Im Süden" },
      { sentence: "Umgangssprachlich klingt das natürlicher als in der Schriftsprache.", target: "Umgangssprachlich" },
      { sentence: "In formellen Texten wird diese Form meist vermieden.", target: "In formellen Texten" },
      { sentence: "Regional ist diese Aussprache völlig üblich.", target: "Regional" },
      { sentence: "In der Standardsprache gilt eine strengere Norm.", target: "In der Standardsprache" },
      { sentence: "Mündlich verwendet man oft eine kürzere Form.", target: "Mündlich" },
      { sentence: "Schriftlich erwartet man die vollständige Form.", target: "Schriftlich" },
    ],
    transfer: "Regional ist diese Form durchaus üblich, in formellen schriftlichen Texten wird sie jedoch meist vermieden.",
  },

  "Modalität und Evidentialität": {
    examples: [
      { sentence: "Den vorliegenden Daten zufolge dürfte der Effekt überschätzt worden sein.", target: "zufolge" },
      { sentence: "Berichten zufolge wurde die Entscheidung bereits getroffen.", target: "zufolge" },
      { sentence: "Vermutlich hängt der Effekt mit der Stichprobe zusammen.", target: "Vermutlich" },
      { sentence: "Angeblich soll die Reform schon nächstes Jahr kommen.", target: "Angeblich" },
      { sentence: "Nachweislich verbesserte sich die Genauigkeit deutlich.", target: "Nachweislich" },
      { sentence: "Gerüchten zufolge wird das Projekt bald eingestellt.", target: "zufolge" },
      { sentence: "Offensichtlich war die Methode nicht robust genug.", target: "Offensichtlich" },
      { sentence: "Vermeintlich lag der Fehler in der Software.", target: "Vermeintlich" },
    ],
    transfer: "Ersten Berichten zufolge dürfte der Effekt tatsächlich schwächer ausfallen als ursprünglich vermutet.",
  },

  Textsortentransformation: {
    examples: [
      { sentence: "Ein dichter Befundsatz wird im Vortrag in mehrere hörbare Schritte aufgelöst.", target: "aufgelöst" },
      { sentence: "Der formelle Bericht wird im Gespräch in einfache Sätze übersetzt.", target: "übersetzt" },
      { sentence: "Die komplexe Analyse wird im Kommentar auf das Wesentliche verdichtet.", target: "verdichtet" },
      { sentence: "Der wissenschaftliche Befund wird im Dialog verständlich umformuliert.", target: "umformuliert" },
      { sentence: "Der lange Fachtext wird im Vortrag in klare Abschnitte gegliedert.", target: "gegliedert" },
      { sentence: "Die nüchterne Statistik wird im Kommentar lebendig erzählt.", target: "erzählt" },
      { sentence: "Der Fachbegriff wird im Gespräch einfach erklärt.", target: "erklärt" },
      { sentence: "Die dichte Nominalstruktur wird im Vortrag aufgelockert.", target: "aufgelockert" },
    ],
    transfer: "Der dichte wissenschaftliche Befund wurde für den Vortrag in mehrere klare, hörbare Schritte aufgelöst.",
  },

  "Syntaktischer Rhythmus": {
    examples: [
      { sentence: "Die These überzeugt – trotz offener Detailfragen – im Kern.", target: "trotz offener Detailfragen" },
      { sentence: "Der Plan funktioniert – bei aller Kritik – grundsätzlich gut.", target: "bei aller Kritik" },
      { sentence: "Die Methode bewährt sich – trotz gelegentlicher Fehler – im Alltag.", target: "trotz gelegentlicher Fehler" },
      { sentence: "Das Ergebnis überzeugt – bei genauerer Betrachtung – noch mehr.", target: "bei genauerer Betrachtung" },
      { sentence: "Die Idee funktioniert – anders als erwartet – erstaunlich gut.", target: "anders als erwartet" },
      { sentence: "Der Ansatz überzeugt – trotz aller Skepsis – zunehmend mehr Kollegen.", target: "trotz aller Skepsis" },
      { sentence: "Die Lösung bewährt sich – entgegen ersten Zweifeln – im Praxistest.", target: "entgegen ersten Zweifeln" },
      { sentence: "Das Konzept überzeugt – bei aller Komplexität – am Ende doch.", target: "bei aller Komplexität" },
    ],
    transfer: "Die neue Methode überzeugt – trotz anfänglicher Zweifel und offener Detailfragen – im Kern zunehmend mehr Fachleute.",
  },

  "Fehlerdiagnose und präzise Reformulierung": {
    examples: [
      { sentence: "Aus dem unklaren Satz entsteht durch gezielte Reformulierung eine eindeutige Aussage.", target: "gezielte Reformulierung" },
      { sentence: "Durch eine kleine Korrektur wird der mehrdeutige Satz eindeutig.", target: "eine kleine Korrektur" },
      { sentence: "Eine präzise Umformulierung beseitigt das Missverständnis vollständig.", target: "präzise Umformulierung" },
      { sentence: "Durch gezieltes Nachfragen klärte sich die unklare Aussage.", target: "gezieltes Nachfragen" },
      { sentence: "Eine sorgfältige Reparatur behebt genau die problematische Stelle.", target: "sorgfältige Reparatur" },
      { sentence: "Durch eine minimale Änderung wurde der Satz endlich verständlich.", target: "eine minimale Änderung" },
      { sentence: "Eine gezielte Korrektur reicht, eine vollständige Neufassung nicht nötig.", target: "gezielte Korrektur" },
      { sentence: "Durch präzises Reformulieren blieb der ursprüngliche Gedanke erhalten.", target: "präzises Reformulieren" },
    ],
    transfer: "Durch eine gezielte, minimale Reformulierung wurde aus dem missverständlichen Satz eine klare und eindeutige Aussage.",
  },
};
