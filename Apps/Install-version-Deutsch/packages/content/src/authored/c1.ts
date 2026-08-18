// Phase 1 Autorierung für C1. Gleicher Vertrag wie authored/a1.ts.
//
// C1-Einheiten benennen Register- und Diskurskompetenzen statt einzelner
// Formen, daher zeigt jeder Satz die Struktur im Einsatz und maskiert das
// Element, das sie trägt (den Konjunktiv-Marker, den Hedging-Ausdruck, den
// Konnektor) statt eines beliebigen Inhaltsworts.

import type { AuthoredUnit } from "./a1";

export const C1_AUTHORED: Readonly<Record<string, AuthoredUnit>> = {
  "Konjunktiv I vollständig": {
    examples: [
      { sentence: "Die Autorin erklärt, die Ergebnisse seien vorläufig.", target: "seien" },
      { sentence: "Er behauptet, er habe recht.", target: "habe" },
      { sentence: "Sie sagt, sie komme später.", target: "komme" },
      { sentence: "Der Sprecher erklärt, die Lage sei ernst.", target: "sei" },
      { sentence: "Sie meint, die Zahlen seien korrekt.", target: "seien" },
      { sentence: "Er berichtet, das Projekt werde fortgesetzt.", target: "werde" },
      { sentence: "Sie erklärt, sie könne nicht kommen.", target: "könne" },
      { sentence: "Der Minister sagt, die Reform sei notwendig.", target: "sei" },
    ],
    transfer: "Der Sprecher erklärte, die Verhandlungen seien noch nicht abgeschlossen.",
  },

  "Subjektive Bedeutung der Modalverben": {
    examples: [
      { sentence: "Er soll sehr erfahren sein.", target: "soll" },
      { sentence: "Sie dürfte angekommen sein.", target: "dürfte" },
      { sentence: "Das müsste eigentlich stimmen.", target: "müsste" },
      { sentence: "Er will nichts davon gewusst haben.", target: "will" },
      { sentence: "Sie soll die beste Kandidatin sein.", target: "soll" },
      { sentence: "Das dürfte die richtige Lösung sein.", target: "dürfte" },
      { sentence: "Er muss den Termin vergessen haben.", target: "muss" },
      { sentence: "Sie will es nicht so gemeint haben.", target: "will" },
    ],
    transfer: "Er soll die Ergebnisse schon gekannt haben, obwohl er es abstreitet.",
  },

  "Ersatzformen des Passivs": {
    examples: [
      { sentence: "Das Problem lässt sich lösen.", target: "lässt sich" },
      { sentence: "Die Aufgabe ist zu erledigen.", target: "ist zu erledigen" },
      { sentence: "Er bekommt die Unterlagen geschickt.", target: "bekommt" },
      { sentence: "Diese Frage lässt sich nicht einfach beantworten.", target: "lässt sich" },
      { sentence: "Der Fehler ist noch zu korrigieren.", target: "ist noch zu korrigieren" },
      { sentence: "Das lässt sich leicht erklären.", target: "lässt sich" },
      { sentence: "Sie bekommt das Projekt übertragen.", target: "bekommt" },
      { sentence: "Die Regeln sind zu beachten.", target: "sind zu beachten" },
    ],
    transfer: "Dieses Problem lässt sich lösen, aber die Details sind noch zu klären.",
  },

  "Komplexe Nominalgruppen": {
    examples: [
      { sentence: "die im Rahmen der Studie erhobenen Daten", target: "im Rahmen der Studie" },
      { sentence: "die trotz aller Kritik erfolgreiche Reform", target: "trotz aller Kritik" },
      { sentence: "die vor Kurzem veröffentlichte Untersuchung", target: "vor Kurzem" },
      { sentence: "der aus mehreren Gründen abgelehnte Antrag", target: "aus mehreren Gründen" },
      { sentence: "die nach langer Debatte getroffene Entscheidung", target: "nach langer Debatte" },
      { sentence: "die trotz des Widerstands durchgesetzte Regel", target: "trotz des Widerstands" },
      { sentence: "die im letzten Jahr gesammelten Erfahrungen", target: "im letzten Jahr" },
      { sentence: "der seit Langem erwartete Bericht", target: "seit Langem" },
    ],
    transfer: "Die im Rahmen der Konferenz vorgestellten und seit Langem erwarteten Ergebnisse überzeugten alle.",
  },

  Partizipialkonstruktionen: {
    examples: [
      { sentence: "Von den Ergebnissen ausgehend, schlagen wir eine neue Untersuchung vor.", target: "Von den Ergebnissen ausgehend" },
      { sentence: "Angesichts der Lage entscheidend, handelte sie sofort.", target: "Angesichts der Lage entscheidend" },
      { sentence: "Auf die Studie gestützt, argumentierte er überzeugend.", target: "Auf die Studie gestützt" },
      { sentence: "Von der Kritik überrascht, überarbeitete sie den Text.", target: "Von der Kritik überrascht" },
      { sentence: "Auf Erfahrung bauend, traf er die Entscheidung schnell.", target: "Auf Erfahrung bauend" },
      { sentence: "Von den Zahlen überzeugt, stimmten alle zu.", target: "Von den Zahlen überzeugt" },
      { sentence: "Auf den Bericht verweisend, erklärte sie die Lage.", target: "Auf den Bericht verweisend" },
      { sentence: "Vom Erfolg ermutigt, plante er das nächste Projekt.", target: "Vom Erfolg ermutigt" },
    ],
    transfer: "Von den neuen Daten überzeugt, schlug das Team eine überarbeitete Strategie vor.",
  },

  Appositionen: {
    examples: [
      { sentence: "Frau Müller, die Projektleiterin, eröffnet die Sitzung.", target: "die Projektleiterin" },
      { sentence: "Herr Weber, unser neuer Kollege, stellt sich vor.", target: "unser neuer Kollege" },
      { sentence: "Berlin, die Hauptstadt Deutschlands, wächst schnell.", target: "die Hauptstadt Deutschlands" },
      { sentence: "Frau Klein, die Autorin des Buches, hält einen Vortrag.", target: "die Autorin des Buches" },
      { sentence: "Herr Schmidt, der Leiter der Abteilung, entscheidet das.", target: "der Leiter der Abteilung" },
      { sentence: "München, die bayerische Landeshauptstadt, ist teuer.", target: "die bayerische Landeshauptstadt" },
      { sentence: "Frau Braun, die Sprecherin des Vereins, antwortet.", target: "die Sprecherin des Vereins" },
      { sentence: "Der Rhein, der längste Fluss Deutschlands, fließt hier.", target: "der längste Fluss Deutschlands" },
    ],
    transfer: "Frau Wagner, die Vorsitzende des Ausschusses, eröffnete die Diskussion mit einer klaren Position.",
  },

  "Informationsstruktur und Vorfeld": {
    examples: [
      { sentence: "Besonders wichtig ist die regelmäßige Wiederholung.", target: "Besonders wichtig ist" },
      { sentence: "Entscheidend bleibt die genaue Analyse.", target: "Entscheidend bleibt" },
      { sentence: "Auffällig war die schnelle Reaktion.", target: "Auffällig war" },
      { sentence: "Unbestritten ist der langfristige Nutzen.", target: "Unbestritten ist" },
      { sentence: "Bemerkenswert erscheint die klare Struktur.", target: "Bemerkenswert erscheint" },
      { sentence: "Zentral bleibt die Frage der Finanzierung.", target: "Zentral bleibt" },
      { sentence: "Fraglich bleibt die tatsächliche Wirkung.", target: "Fraglich bleibt" },
      { sentence: "Offensichtlich war der Erfolg des Projekts.", target: "Offensichtlich war" },
    ],
    transfer: "Besonders auffällig bleibt die deutliche Verbesserung der Ergebnisse.",
  },

  "Ausklammerung und Nachfeld": {
    examples: [
      { sentence: "Es hat sich gezeigt, dass regelmäßiger Abruf entscheidend ist.", target: "dass regelmäßiger Abruf entscheidend ist" },
      { sentence: "Wir haben festgestellt, dass die Methode zuverlässig funktioniert.", target: "dass die Methode zuverlässig funktioniert" },
      { sentence: "Es wurde deutlich, dass mehr Zeit nötig war.", target: "dass mehr Zeit nötig war" },
      { sentence: "Sie erwähnte, dass die Kosten gestiegen seien.", target: "dass die Kosten gestiegen seien" },
      { sentence: "Es zeigte sich, dass der Plan überarbeitet werden musste.", target: "dass der Plan überarbeitet werden musste" },
      { sentence: "Er betonte, dass Qualität wichtiger sei als Tempo.", target: "dass Qualität wichtiger sei als Tempo" },
      { sentence: "Es stellte sich heraus, dass die Annahme falsch war.", target: "dass die Annahme falsch war" },
      { sentence: "Sie erklärte, dass weitere Tests nötig seien.", target: "dass weitere Tests nötig seien" },
    ],
    transfer: "Es hat sich gezeigt, dass eine klare Struktur die Verständlichkeit deutlich verbessert.",
  },

  "Konzessive und adversative Strukturen": {
    examples: [
      { sentence: "Wenngleich die Stichprobe klein ist, sind die Ergebnisse relevant.", target: "Wenngleich" },
      { sentence: "Selbst wenn es regnet, findet die Veranstaltung statt.", target: "Selbst wenn" },
      { sentence: "Während er zustimmte, blieb sie skeptisch.", target: "Während" },
      { sentence: "Wohingegen die erste Gruppe zustimmte, lehnte die zweite ab.", target: "Wohingegen" },
      { sentence: "Wenngleich der Aufwand hoch war, lohnte sich das Projekt.", target: "Wenngleich" },
      { sentence: "Selbst wenn die Kosten steigen, bleibt der Plan sinnvoll.", target: "Selbst wenn" },
      { sentence: "Während die Theorie überzeugt, fehlt die praktische Erprobung.", target: "Während" },
      { sentence: "Wohingegen früher Zweifel bestanden, ist man heute sicher.", target: "Wohingegen" },
    ],
    transfer: "Wenngleich die Ergebnisse vorläufig sind, während andere Studien noch ausstehen, zeigt sich bereits ein klarer Trend.",
  },

  "Wissenschaftliches Hedging": {
    examples: [
      { sentence: "Die Daten legen nahe, dass weitere Untersuchungen erforderlich sind.", target: "legen nahe" },
      { sentence: "Die Ergebnisse scheinen den Trend zu bestätigen.", target: "scheinen" },
      { sentence: "Möglicherweise beeinflusst dieser Faktor das Ergebnis.", target: "Möglicherweise" },
      { sentence: "Die Methode dürfte tendenziell zuverlässiger sein.", target: "tendenziell" },
      { sentence: "Die Befunde deuten darauf hin, dass der Effekt real ist.", target: "deuten darauf hin" },
      { sentence: "Es ist denkbar, dass weitere Faktoren eine Rolle spielen.", target: "denkbar" },
      { sentence: "Die Analyse legt eine vorsichtige Interpretation nahe.", target: "legt eine vorsichtige Interpretation nahe" },
      { sentence: "Der Effekt scheint unter bestimmten Bedingungen aufzutreten.", target: "scheint" },
    ],
    transfer: "Die vorliegenden Daten legen nahe, dass der Effekt tendenziell stärker ausfällt als erwartet.",
  },

  Textkohäsion: {
    examples: [
      { sentence: "Die Stichprobe ist klein. Diese Einschränkung mindert die Aussagekraft.", target: "Diese Einschränkung" },
      { sentence: "Die Finanzierung fehlt. Ein solcher Faktor kann das Projekt verzögern.", target: "Ein solcher Faktor" },
      { sentence: "Die Methode ist neu. Dieser Ansatz verspricht bessere Ergebnisse.", target: "Dieser Ansatz" },
      { sentence: "Die Kosten steigen. Diese Entwicklung besorgt viele Unternehmen.", target: "Diese Entwicklung" },
      { sentence: "Die Nachfrage sinkt. Dieser Rückgang betrifft die ganze Branche.", target: "Dieser Rückgang" },
      { sentence: "Die Regeln ändern sich. Eine solche Änderung braucht Zeit.", target: "Eine solche Änderung" },
      { sentence: "Der Plan scheiterte. Dieses Ergebnis überraschte niemanden.", target: "Dieses Ergebnis" },
      { sentence: "Die Zahlen fehlen. Diese Lücke erschwert die Analyse.", target: "Diese Lücke" },
    ],
    transfer: "Die Studie war klein angelegt. Diese Einschränkung schmälert jedoch nicht ihre grundsätzliche Aussagekraft.",
  },

  "Register und Stil": {
    examples: [
      { sentence: "Könnten Sie dies näher erläutern?", target: "Könnten Sie" },
      { sentence: "Wir bitten Sie höflich um eine Rückmeldung.", target: "bitten Sie höflich" },
      { sentence: "Dürfte ich Sie um Ihre Meinung bitten?", target: "Dürfte ich" },
      { sentence: "Es wäre freundlich, wenn Sie antworten könnten.", target: "Es wäre freundlich" },
      { sentence: "Wir würden uns über eine Antwort freuen.", target: "würden uns über eine Antwort freuen" },
      { sentence: "Wären Sie so freundlich, das zu bestätigen?", target: "Wären Sie so freundlich" },
      { sentence: "Ich erlaube mir, Sie darauf hinzuweisen.", target: "erlaube mir" },
      { sentence: "Es wäre hilfreich, wenn Sie sich melden könnten.", target: "Es wäre hilfreich" },
    ],
    transfer: "Wären Sie so freundlich, uns bis Freitag eine Rückmeldung zukommen zu lassen?",
  },

  "Verbalisierung und Nominalisierung abwägen": {
    examples: [
      { sentence: "Wir analysierten die Daten.", target: "analysierten" },
      { sentence: "Nach der Analyse der Daten veröffentlichten wir die Ergebnisse.", target: "der Analyse" },
      { sentence: "Wir untersuchten die Ursachen genau.", target: "untersuchten" },
      { sentence: "Nach der Untersuchung der Ursachen folgte der Bericht.", target: "der Untersuchung" },
      { sentence: "Sie prüften die Ergebnisse sorgfältig.", target: "prüften" },
      { sentence: "Nach der Prüfung der Ergebnisse folgte die Freigabe.", target: "der Prüfung" },
      { sentence: "Wir werteten die Antworten aus.", target: "werteten die Antworten aus" },
      { sentence: "Nach der Auswertung der Antworten schrieben wir den Bericht.", target: "der Auswertung" },
    ],
    transfer: "Wir analysierten die Daten sorgfältig, und nach der Analyse folgte die ausführliche Diskussion.",
  },

  Parallelismus: {
    examples: [
      { sentence: "planen, durchführen und auswerten", target: "durchführen" },
      { sentence: "lesen, verstehen und anwenden", target: "verstehen" },
      { sentence: "sammeln, ordnen und präsentieren", target: "ordnen" },
      { sentence: "fragen, zuhören und antworten", target: "zuhören" },
      { sentence: "prüfen, korrigieren und veröffentlichen", target: "korrigieren" },
      { sentence: "beobachten, dokumentieren und berichten", target: "dokumentieren" },
      { sentence: "entwerfen, testen und verbessern", target: "testen" },
      { sentence: "sammeln, analysieren und interpretieren", target: "analysieren" },
    ],
    transfer: "Das Team musste planen, koordinieren und schließlich präsentieren, ohne die Frist zu verpassen.",
  },

  "Diskurspartikeln und Registersteuerung": {
    examples: [
      { sentence: "Die Einschränkung ist allerdings methodisch bedeutsam.", target: "allerdings" },
      { sentence: "Das ist ja bekanntlich nicht neu.", target: "ja" },
      { sentence: "Immerhin zeigt die Studie einen klaren Trend.", target: "Immerhin" },
      { sentence: "Das war eben nicht anders zu erwarten.", target: "eben" },
      { sentence: "Allerdings bleibt die Ursache noch unklar.", target: "Allerdings" },
      { sentence: "Das ist doch offensichtlich, oder?", target: "doch" },
      { sentence: "Immerhin konnten wir die Frist einhalten.", target: "Immerhin" },
      { sentence: "Das Ergebnis war halt nicht überraschend.", target: "halt" },
    ],
    transfer: "Die Ergebnisse sind allerdings vorläufig, immerhin zeigen sie schon einen klaren Trend.",
  },

  "Tempusfolge in Berichten": {
    examples: [
      { sentence: "Die Autorin berichtete, sie habe die Daten zuvor bereinigt.", target: "habe" },
      { sentence: "Er erklärte, er werde die Ergebnisse später vorstellen.", target: "werde" },
      { sentence: "Sie sagte, sie sei am Vortag angereist.", target: "sei" },
      { sentence: "Der Sprecher berichtete, das Team habe hart gearbeitet.", target: "habe" },
      { sentence: "Sie erklärte, die Prüfung werde bald stattfinden.", target: "werde" },
      { sentence: "Er sagte, er habe die Unterlagen bereits gesendet.", target: "habe" },
      { sentence: "Sie berichtete, die Reise sei problemlos verlaufen.", target: "sei" },
      { sentence: "Er erklärte, die Entscheidung werde morgen fallen.", target: "werde" },
    ],
    transfer: "Sie berichtete, das Team habe die Daten zuvor bereinigt und werde die Ergebnisse nächste Woche vorstellen.",
  },

  "Komplexe Verbvalenz und Rektion": {
    examples: [
      { sentence: "Die Analyse beruht auf sorgfältig dokumentierten Annahmen.", target: "beruht auf" },
      { sentence: "Die Studie bezieht sich auf frühere Ergebnisse.", target: "bezieht sich auf" },
      { sentence: "Der Erfolg hängt von der Vorbereitung ab.", target: "hängt von der Vorbereitung ab" },
      { sentence: "Die Entscheidung richtet sich nach den Regeln.", target: "richtet sich nach" },
      { sentence: "Das Ergebnis resultiert aus einer langen Untersuchung.", target: "resultiert aus" },
      { sentence: "Die Methode basiert auf statistischen Verfahren.", target: "basiert auf" },
      { sentence: "Die Kritik bezieht sich hauptsächlich auf die Methode.", target: "bezieht sich hauptsächlich auf" },
      { sentence: "Der Plan besteht aus mehreren Schritten.", target: "besteht aus" },
    ],
    transfer: "Die Schlussfolgerung beruht auf Daten, die sich auf mehrere unabhängige Studien beziehen.",
  },

  "Infinitiv- und Partizipialverdichtung": {
    examples: [
      { sentence: "Nach sorgfältiger Prüfung freigegeben, wurde der Datensatz archiviert.", target: "freigegeben" },
      { sentence: "Um Missverständnisse zu vermeiden, formulierte sie es genauer.", target: "Um Missverständnisse zu vermeiden" },
      { sentence: "Erst kürzlich veröffentlicht, fand die Studie große Beachtung.", target: "veröffentlicht" },
      { sentence: "Um die Frist einzuhalten, arbeitete das Team am Wochenende.", target: "Um die Frist einzuhalten" },
      { sentence: "Sorgfältig ausgewählt, überzeugten die Beispiele das Publikum.", target: "ausgewählt" },
      { sentence: "Um Kosten zu sparen, verzichteten sie auf eine zweite Runde.", target: "Um Kosten zu sparen" },
      { sentence: "Gründlich überprüft, galten die Daten als zuverlässig.", target: "überprüft" },
      { sentence: "Um Klarheit zu schaffen, ergänzten sie ein Beispiel.", target: "Um Klarheit zu schaffen" },
    ],
    transfer: "Um Missverständnisse zu vermeiden, wurde der Bericht vor der Veröffentlichung noch einmal sorgfältig geprüft.",
  },

  "Indirekte Rede mit Tempus und Modalität": {
    examples: [
      { sentence: "Der Autor erklärte, das Verfahren könne die Fehlerquote gesenkt haben.", target: "könne" },
      { sentence: "Sie sagte, die Ergebnisse müssten noch überprüft werden.", target: "müssten" },
      { sentence: "Er meinte, die Methode dürfte sich bewährt haben.", target: "dürfte" },
      { sentence: "Sie erklärte, der Effekt könne stärker sein als angenommen.", target: "könne" },
      { sentence: "Er berichtete, die Analyse müsse wiederholt werden.", target: "müsse" },
      { sentence: "Sie sagte, das Ergebnis dürfte robust sein.", target: "dürfte" },
      { sentence: "Er erklärte, die Daten könnten fehlerhaft sein.", target: "könnten" },
      { sentence: "Sie meinte, die Studie müsse erweitert werden.", target: "müsse" },
    ],
    transfer: "Der Autor erklärte, das Ergebnis könne zuverlässig sein, müsse aber noch unabhängig bestätigt werden.",
  },

  "Komplexe Konditionalstrukturen": {
    examples: [
      { sentence: "Sollten weitere Daten verfügbar werden, ließe sich die Hypothese erneut prüfen.", target: "Sollten" },
      { sentence: "Falls die Mittel reichen, wird das Projekt fortgesetzt.", target: "Falls" },
      { sentence: "Sofern nichts dagegenspricht, beginnen wir morgen.", target: "Sofern" },
      { sentence: "Vorausgesetzt, dass alle zustimmen, ändern wir den Plan.", target: "Vorausgesetzt" },
      { sentence: "Sollte der Test fehlschlagen, prüfen wir die Annahmen erneut.", target: "Sollte" },
      { sentence: "Falls es nötig wird, passen wir die Methode an.", target: "Falls" },
      { sentence: "Sofern die Zeit reicht, ergänzen wir ein weiteres Beispiel.", target: "Sofern" },
      { sentence: "Vorausgesetzt, dass die Daten stimmen, gilt das Ergebnis als sicher.", target: "Vorausgesetzt" },
    ],
    transfer: "Sollten die Ergebnisse bestätigt werden, ließe sich die Methode auf weitere Fälle übertragen.",
  },

  "Kausale Zuschreibung und wissenschaftliche Positionierung": {
    examples: [
      { sentence: "Der Befund lässt sich teilweise auf die veränderte Stichprobe zurückführen.", target: "lässt sich teilweise auf die veränderte Stichprobe zurückführen" },
      { sentence: "Diese Entwicklung könnte mit dem neuen Verfahren zusammenhängen.", target: "könnte mit dem neuen Verfahren zusammenhängen" },
      { sentence: "Der Effekt hängt vermutlich mit äußeren Faktoren zusammen.", target: "hängt vermutlich mit äußeren Faktoren zusammen" },
      { sentence: "Die Abweichung lässt sich auf einen Messfehler zurückführen.", target: "lässt sich auf einen Messfehler zurückführen" },
      { sentence: "Dieser Trend könnte auf saisonale Effekte zurückgehen.", target: "könnte auf saisonale Effekte zurückgehen" },
      { sentence: "Der Unterschied hängt möglicherweise mit der Stichprobengröße zusammen.", target: "hängt möglicherweise mit der Stichprobengröße zusammen" },
      { sentence: "Das Ergebnis lässt sich nicht allein auf Zufall zurückführen.", target: "lässt sich nicht allein auf Zufall zurückführen" },
      { sentence: "Diese Korrelation könnte auf einen dritten Faktor hinweisen.", target: "könnte auf einen dritten Faktor hinweisen" },
    ],
    transfer: "Der beobachtete Effekt lässt sich teilweise auf methodische Unterschiede zurückführen, hängt aber wohl auch mit der Stichprobe zusammen.",
  },

  "Thema-Rhema-Gliederung": {
    examples: [
      { sentence: "Die erste Studie prüft die Genauigkeit. Diese Genauigkeit bildet den Ausgangspunkt der zweiten Analyse.", target: "Diese Genauigkeit" },
      { sentence: "Der Bericht beschreibt die Methode. Diese Methode wurde später verfeinert.", target: "Diese Methode" },
      { sentence: "Zuerst wurde das Problem definiert. Dieses Problem betraf mehrere Abteilungen.", target: "Dieses Problem" },
      { sentence: "Die Umfrage erfasste die Meinungen. Diese Meinungen wichen stark voneinander ab.", target: "Diese Meinungen" },
      { sentence: "Der erste Schritt war die Datensammlung. Diese Daten bildeten die Grundlage.", target: "Diese Daten" },
      { sentence: "Man identifizierte zunächst die Ursache. Diese Ursache erklärte vieles.", target: "Diese Ursache" },
      { sentence: "Die Analyse ergab ein Muster. Dieses Muster wiederholte sich mehrfach.", target: "Dieses Muster" },
      { sentence: "Zuerst entstand eine Hypothese. Diese Hypothese wurde später bestätigt.", target: "Diese Hypothese" },
    ],
    transfer: "Die erste Untersuchung lieferte ein überraschendes Ergebnis. Dieses Ergebnis wurde zum Ausgangspunkt aller weiteren Studien.",
  },

  "Interpunktion als Bedeutungssignal": {
    // Ziele sind Wörter, nicht die Satzzeichen selbst -- ein Zielwort mit
    // einem Buchstaben direkt davor (z.B. "l" vor ":" in "stabil:") kann die
    // Wortgrenzen-Regex nie treffen, weil ihre Lookarounds genau das
    // verlangen. Derselbe Fehler wurde in der englischen App für die
    // C2-Einheit "Advanced punctuation and grammar" gefunden und dort auf
    // dieselbe Weise behoben: das Wort neben dem Satzzeichen maskieren, das
    // die Gliederung trägt, statt das Zeichen selbst.
    examples: [
      { sentence: "Ein Ergebnis blieb stabil: die hohe Präzision.", target: "Präzision" },
      { sentence: "Die Methode war klar, die Umsetzung jedoch schwierig.", target: "jedoch" },
      { sentence: "Drei Faktoren spielten eine Rolle: Zeit, Geld und Personal.", target: "Personal" },
      { sentence: "Er war vorbereitet; dennoch scheiterte der erste Versuch.", target: "dennoch" },
      { sentence: "Die Idee war gut, die Umsetzung fehlte jedoch.", target: "fehlte" },
      { sentence: "Ein Punkt bleibt offen: die genaue Ursache.", target: "Ursache" },
      { sentence: "Die Daten waren vollständig; die Analyse dauerte trotzdem lange.", target: "trotzdem" },
      { sentence: "Zwei Optionen standen zur Wahl: sparen oder investieren.", target: "investieren" },
    ],
    transfer: "Ein Aspekt blieb ungeklärt, nämlich die tatsächliche Ursache der Abweichung.",
  },

  "Syntax wissenschaftlicher Zitate": {
    examples: [
      { sentence: "Wie Müller (2025) zeigt, hängt die Genauigkeit vom Kontext ab.", target: "Wie Müller (2025) zeigt" },
      { sentence: "Nach Schmidt (2023) ist der Effekt eindeutig belegt.", target: "Nach Schmidt (2023)" },
      { sentence: "Wie bereits erwähnt wurde, bestätigt sich der Trend.", target: "Wie bereits erwähnt wurde" },
      { sentence: "Laut Weber (2024) ist die Methode zuverlässig.", target: "Laut Weber (2024)" },
      { sentence: "Wie die Studie zeigt, bleibt die Ursache unklar.", target: "Wie die Studie zeigt" },
      { sentence: "Gemäß Fischer (2022) ist eine weitere Prüfung nötig.", target: "Gemäß Fischer (2022)" },
      { sentence: "Wie oben dargestellt, ergaben sich zwei Muster.", target: "Wie oben dargestellt" },
      { sentence: "Nach Ansicht von Braun (2021) reicht die Evidenz nicht aus.", target: "Nach Ansicht von Braun (2021)" },
    ],
    transfer: "Wie Müller (2025) zeigt, hängt die Genauigkeit stark vom jeweiligen Kontext der Studie ab.",
  },
};
