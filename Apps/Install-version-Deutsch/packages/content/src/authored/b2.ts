// Phase 1 Autorierung für B2. Gleicher Vertrag wie authored/a1.ts.

import type { AuthoredUnit } from "./a1";

export const B2_AUTHORED: Readonly<Record<string, AuthoredUnit>> = {
  "Konjunktiv II Vergangenheit": {
    examples: [
      { sentence: "Wenn ich mehr gelernt hätte, hätte ich bestanden.", target: "hätte ich bestanden" },
      { sentence: "Wäre ich früher gegangen, hätte ich den Bus erreicht.", target: "hätte ich den Bus erreicht" },
      { sentence: "Hätte sie es gewusst, wäre sie gekommen.", target: "wäre sie gekommen" },
      { sentence: "Wenn wir Zeit gehabt hätten, wären wir geblieben.", target: "wären wir geblieben" },
      { sentence: "Hätte er zugehört, hätte er es verstanden.", target: "hätte er es verstanden" },
      { sentence: "Wäre das Wetter besser gewesen, wären wir gewandert.", target: "wären wir gewandert" },
      { sentence: "Wenn du früher gefragt hättest, hätte ich geholfen.", target: "hätte ich geholfen" },
      { sentence: "Hätten wir es gewusst, hätten wir anders geplant.", target: "hätten wir anders geplant" },
    ],
    transfer: "Wäre ich vorsichtiger gewesen, hätte ich diesen Fehler vermeiden können.",
  },

  "Passiv mit Modalverben": {
    examples: [
      { sentence: "Der Bericht muss heute geschrieben werden.", target: "muss heute geschrieben werden" },
      { sentence: "Die Regeln müssen beachtet werden.", target: "müssen beachtet werden" },
      { sentence: "Das Problem kann gelöst werden.", target: "kann gelöst werden" },
      { sentence: "Die Tür darf nicht geöffnet werden.", target: "darf nicht geöffnet werden" },
      { sentence: "Der Vertrag soll unterschrieben werden.", target: "soll unterschrieben werden" },
      { sentence: "Die Fehler müssen korrigiert werden.", target: "müssen korrigiert werden" },
      { sentence: "Das Formular kann online ausgefüllt werden.", target: "kann online ausgefüllt werden" },
      { sentence: "Die Prüfung muss bestanden werden.", target: "muss bestanden werden" },
    ],
    transfer: "Der Bericht muss bis Freitag geschrieben werden, sonst kann er nicht mehr eingereicht werden.",
  },

  Zustandspassiv: {
    examples: [
      { sentence: "Die Tür ist geschlossen.", target: "ist geschlossen" },
      { sentence: "Das Fenster ist geöffnet.", target: "ist geöffnet" },
      { sentence: "Der Laden ist geschlossen.", target: "ist geschlossen" },
      { sentence: "Das Formular ist ausgefüllt.", target: "ist ausgefüllt" },
      { sentence: "Die Arbeit ist erledigt.", target: "ist erledigt" },
      { sentence: "Das Auto ist repariert.", target: "ist repariert" },
      { sentence: "Der Vertrag ist unterschrieben.", target: "ist unterschrieben" },
      { sentence: "Die Rechnung ist bezahlt.", target: "ist bezahlt" },
    ],
    transfer: "Die Rechnung ist schon bezahlt, und der Vertrag ist unterschrieben.",
  },

  Nominalisierung: {
    examples: [
      { sentence: "die Durchführung der Studie", target: "Durchführung" },
      { sentence: "nach Abschluss der Arbeit", target: "Abschluss" },
      { sentence: "die Entscheidung des Chefs", target: "Entscheidung" },
      { sentence: "die Untersuchung der Ursachen", target: "Untersuchung" },
      { sentence: "die Erklärung des Fehlers", target: "Erklärung" },
      { sentence: "nach der Ankunft des Zuges", target: "Ankunft" },
      { sentence: "die Verbesserung der Ergebnisse", target: "Verbesserung" },
      { sentence: "die Bearbeitung des Antrags", target: "Bearbeitung" },
    ],
    transfer: "Nach der Durchführung der Studie folgte die Auswertung der Ergebnisse.",
  },

  "N-Deklination": {
    examples: [
      { sentence: "mit dem Studenten", target: "Studenten" },
      { sentence: "ich sehe den Kollegen", target: "Kollegen" },
      { sentence: "der Name des Herrn", target: "Herrn" },
      { sentence: "ich frage den Journalisten", target: "Journalisten" },
      { sentence: "mit dem Kunden sprechen", target: "Kunden" },
      { sentence: "ich kenne den Präsidenten", target: "Präsidenten" },
      { sentence: "die Meinung des Experten", target: "Experten" },
      { sentence: "ich danke dem Nachbarn", target: "Nachbarn" },
    ],
    transfer: "Ich habe mit dem Kunden gesprochen und dem Kollegen danach alles erklärt.",
  },

  "Partizipien als Adjektive": {
    examples: [
      { sentence: "die wartenden Gäste", target: "wartenden" },
      { sentence: "die geschlossene Tür", target: "geschlossene" },
      { sentence: "der schlafende Hund", target: "schlafende" },
      { sentence: "das geöffnete Fenster", target: "geöffnete" },
      { sentence: "die lachenden Kinder", target: "lachenden" },
      { sentence: "der reparierte Wagen", target: "reparierte" },
      { sentence: "die steigenden Preise", target: "steigenden" },
      { sentence: "das gelöste Problem", target: "gelöste" },
    ],
    transfer: "Die wartenden Gäste sahen das geöffnete Fenster und die lachenden Kinder.",
  },

  "je...desto/umso": {
    examples: [
      { sentence: "Je mehr ich übe, desto sicherer spreche ich.", target: "desto sicherer" },
      { sentence: "Je länger wir warten, desto ungeduldiger werden wir.", target: "desto ungeduldiger" },
      { sentence: "Je früher du beginnst, umso leichter wird es.", target: "umso leichter" },
      { sentence: "Je schneller er arbeitet, desto mehr Fehler macht er.", target: "desto mehr Fehler" },
      { sentence: "Je älter man wird, desto weiser wird man.", target: "desto weiser" },
      { sentence: "Je mehr Geld sie verdient, umso mehr spart sie.", target: "umso mehr" },
      { sentence: "Je klarer die Regel ist, desto einfacher ist die Übung.", target: "desto einfacher" },
      { sentence: "Je öfter man übt, desto besser wird man.", target: "desto besser" },
    ],
    transfer: "Je mehr wir üben, desto sicherer werden wir, und je sicherer wir werden, desto mehr Spaß macht es.",
  },

  "sowohl...als auch / weder...noch": {
    examples: [
      { sentence: "Sie spricht sowohl Deutsch als auch Englisch.", target: "sowohl Deutsch als auch" },
      { sentence: "Er mag weder Kaffee noch Tee.", target: "weder Kaffee noch" },
      { sentence: "Wir besuchen sowohl Berlin als auch München.", target: "sowohl Berlin als auch" },
      { sentence: "Sie hat weder Zeit noch Lust.", target: "weder Zeit noch" },
      { sentence: "Er ist sowohl klug als auch fleißig.", target: "sowohl klug als auch" },
      { sentence: "Wir haben weder Geld noch Zeit dafür.", target: "weder Geld noch" },
      { sentence: "Sie kann sowohl kochen als auch backen.", target: "sowohl kochen als auch" },
      { sentence: "Er will weder umziehen noch kündigen.", target: "weder umziehen noch" },
    ],
    transfer: "Sie spricht sowohl Deutsch als auch Französisch, aber weder Spanisch noch Italienisch.",
  },

  "erweiterte Relativsätze": {
    examples: [
      { sentence: "Das Thema, über das wir sprechen, betrifft alle Studierenden.", target: "über das wir sprechen" },
      { sentence: "Der Kollege, dessen Büro nebenan liegt, ist neu.", target: "dessen Büro nebenan liegt" },
      { sentence: "Die Firma, deren Produkte bekannt sind, wächst schnell.", target: "deren Produkte bekannt sind" },
      { sentence: "Das ist der Grund, weshalb ich abgesagt habe.", target: "weshalb ich abgesagt habe" },
      { sentence: "Der Vertrag, auf den wir gewartet haben, ist da.", target: "auf den wir gewartet haben" },
      { sentence: "Die Autorin, deren Buch bekannt ist, kommt heute.", target: "deren Buch bekannt ist" },
      { sentence: "Das Projekt, an dem wir arbeiten, ist fast fertig.", target: "an dem wir arbeiten" },
      { sentence: "Der Ort, wo wir uns trafen, war ruhig.", target: "wo wir uns trafen" },
    ],
    transfer: "Das Team, dessen Ergebnisse überzeugend waren, hat das Projekt, an dem alle arbeiteten, erfolgreich beendet.",
  },

  "Verben mit Präpositionen": {
    examples: [
      { sentence: "Ich warte auf den Bus.", target: "warte auf" },
      { sentence: "Worauf wartest du?", target: "Worauf wartest du" },
      { sentence: "Sie kämpft für ihre Rechte.", target: "kämpft für" },
      { sentence: "Er zweifelt an der Entscheidung.", target: "zweifelt an" },
      { sentence: "Wir bestehen auf einer Erklärung.", target: "bestehen auf" },
      { sentence: "Sie leidet unter dem Stress.", target: "leidet unter" },
      { sentence: "Er verzichtet auf das Angebot.", target: "verzichtet auf" },
      { sentence: "Wir profitieren von der Erfahrung.", target: "profitieren von" },
    ],
    transfer: "Wir bestehen auf einer klaren Antwort und warten geduldig darauf.",
  },

  "indirekte Rede Grundlagen": {
    examples: [
      { sentence: "Er sagt, er sei krank.", target: "er sei krank" },
      { sentence: "Sie behauptet, sie habe recht.", target: "sie habe recht" },
      { sentence: "Er meint, das Projekt sei fertig.", target: "das Projekt sei fertig" },
      { sentence: "Sie erklärt, die Zahlen seien korrekt.", target: "die Zahlen seien korrekt" },
      // Zielwort auf das Konjunktiv-I-Verb verkürzt -- genau der
      // Lerngegenstand -- statt der vollen Klausel, sonst maskierte dieser
      // Satz zu "Er sagt, er ___.", identisch mit dem ersten Satz oben.
      { sentence: "Er sagt, er komme später.", target: "komme" },
      { sentence: "Sie berichtet, der Termin sei verschoben.", target: "der Termin sei verschoben" },
      { sentence: "Er behauptet, er habe es nicht gewusst.", target: "er habe es nicht gewusst" },
      { sentence: "Sie sagt, sie brauche mehr Zeit.", target: "sie brauche mehr Zeit" },
    ],
    transfer: "Er sagt, er sei bereit, aber sie meint, das Projekt sei noch nicht fertig.",
  },

  "Nomen-Verb-Verbindungen / Funktionsverbgefüge": {
    examples: [
      { sentence: "eine Entscheidung treffen", target: "treffen" },
      { sentence: "in Betracht ziehen", target: "ziehen" },
      { sentence: "Einfluss nehmen", target: "nehmen" },
      { sentence: "eine Frage stellen", target: "stellen" },
      { sentence: "Rücksicht nehmen", target: "nehmen" },
      { sentence: "einen Vorschlag machen", target: "machen" },
      { sentence: "Verantwortung übernehmen", target: "übernehmen" },
      { sentence: "zur Verfügung stehen", target: "stehen" },
    ],
    transfer: "Das Team muss eine Entscheidung treffen und dabei Rücksicht auf alle nehmen.",
  },

  "Wortstellung im Mittelfeld": {
    examples: [
      { sentence: "Ich habe es ihm gestern gegeben.", target: "es ihm" },
      { sentence: "Sie hat es mir schon erklärt.", target: "es mir" },
      { sentence: "Wir haben ihm die Zahlen heute geschickt.", target: "ihm die Zahlen" },
      { sentence: "Er hat es uns nicht gesagt.", target: "es uns" },
      { sentence: "Ich zeige es dir gleich.", target: "es dir" },
      { sentence: "Sie gibt es ihnen morgen.", target: "es ihnen" },
      { sentence: "Wir bringen ihr das Paket heute.", target: "ihr das Paket" },
      { sentence: "Er erklärt es uns geduldig.", target: "es uns" },
    ],
    transfer: "Ich habe ihm die Unterlagen gestern gegeben, und er hat sie mir heute zurückgeschickt.",
  },

  "Konnektoren und Satzverknüpfung": {
    examples: [
      { sentence: "Die Daten sind begrenzt; dennoch ist der Trend klar.", target: "dennoch" },
      { sentence: "Der Preis stieg; folglich sank die Nachfrage.", target: "folglich" },
      { sentence: "Sie war müde; hingegen arbeitete er weiter.", target: "hingegen" },
      { sentence: "Es regnete stark; deshalb blieben wir zu Hause.", target: "deshalb" },
      { sentence: "Die Qualität sank; außerdem stiegen die Kosten.", target: "außerdem" },
      { sentence: "Er war spät dran; dennoch kam er pünktlich an.", target: "dennoch" },
      { sentence: "Die Zahlen fehlten; folglich verschoben wir die Analyse.", target: "folglich" },
      { sentence: "Sie stimmte zu; er hingegen widersprach.", target: "hingegen" },
    ],
    transfer: "Die Ergebnisse waren vorläufig; dennoch entschieden wir uns, sie zu veröffentlichen.",
  },

  "Indirekte Rede mit Konjunktiv I": {
    examples: [
      { sentence: "Sie sagt, sie habe keine Zeit.", target: "sie habe keine Zeit" },
      { sentence: "Er erklärt, das Ergebnis sei überraschend.", target: "das Ergebnis sei überraschend" },
      { sentence: "Sie berichtet, die Firma wachse schnell.", target: "die Firma wachse schnell" },
      { sentence: "Er behauptet, er sei unschuldig.", target: "er sei unschuldig" },
      { sentence: "Sie meint, der Plan funktioniere gut.", target: "der Plan funktioniere gut" },
      { sentence: "Er sagt, die Sitzung beginne später.", target: "die Sitzung beginne später" },
      { sentence: "Sie erklärt, sie könne nicht kommen.", target: "sie könne nicht kommen" },
      // Zielwort verkürzt: die volle Klausel maskierte diesen Satz zu
      // "Er behauptet, ___.", identisch mit dem "er sei unschuldig"-Satz.
      { sentence: "Er behauptet, das sei nicht wahr.", target: "sei" },
    ],
    transfer: "Die Sprecherin erklärte, die Zahlen seien vorläufig und müssten noch geprüft werden.",
  },

  "Modalpartikeln im Gespräch": {
    examples: [
      { sentence: "Komm doch morgen kurz vorbei.", target: "doch" },
      { sentence: "Das ist ja wirklich überraschend.", target: "ja" },
      { sentence: "Frag ihn eben selbst.", target: "eben" },
      { sentence: "Ich habe es halt vergessen.", target: "halt" },
      { sentence: "Schau mal, was ich gefunden habe.", target: "mal" },
      { sentence: "Das ist doch klar.", target: "doch" },
      { sentence: "Er ist ja noch neu hier.", target: "ja" },
      { sentence: "Komm mal näher.", target: "mal" },
    ],
    transfer: "Sag mal, kommst du morgen wirklich vorbei, oder hast du das schon wieder vergessen?",
  },

  "Komplexe Temporalsätze": {
    examples: [
      { sentence: "Sobald die Ergebnisse vorliegen, informieren wir alle Beteiligten.", target: "Sobald" },
      { sentence: "Solange es regnet, bleiben wir drinnen.", target: "Solange" },
      { sentence: "Während er arbeitete, las sie ein Buch.", target: "Während" },
      { sentence: "Ehe wir beginnen, prüfen wir alle Daten.", target: "Ehe" },
      { sentence: "Nachdem der Bericht fertig war, verschickten wir ihn.", target: "Nachdem" },
      { sentence: "Solange du hier bist, bin ich beruhigt.", target: "Solange" },
      { sentence: "Sobald ich Zeit habe, rufe ich dich an.", target: "Sobald" },
      { sentence: "Während die Kinder schliefen, arbeiteten wir weiter.", target: "Während" },
    ],
    transfer: "Sobald die Prüfung vorbei ist, feiern wir, solange es noch hell ist.",
  },

  "Konzessive Verknüpfung mit dennoch und gleichwohl": {
    examples: [
      { sentence: "Die Daten waren unvollständig; dennoch war eine vorsichtige Analyse möglich.", target: "dennoch war" },
      { sentence: "Die Stichprobe war klein; gleichwohl blieb der Trend erkennbar.", target: "gleichwohl blieb" },
      { sentence: "Es regnete stark; dennoch fand das Fest statt.", target: "dennoch fand" },
      { sentence: "Die Kosten waren hoch; gleichwohl lohnte sich die Investition.", target: "gleichwohl lohnte" },
      { sentence: "Er war unerfahren; dennoch löste er das Problem.", target: "dennoch löste" },
      { sentence: "Die Zeit war knapp; gleichwohl gelang das Projekt.", target: "gleichwohl gelang" },
      { sentence: "Die Bedingungen waren schwierig; dennoch schaffte sie es.", target: "dennoch schaffte" },
      { sentence: "Die Kritik war hart; gleichwohl blieb er ruhig.", target: "gleichwohl blieb" },
    ],
    transfer: "Die Ergebnisse waren begrenzt; dennoch war die Untersuchung insgesamt hilfreich.",
  },

  "Kausale und konsekutive Verknüpfung": {
    examples: [
      { sentence: "Die Stichprobe war klein, sodass die Aussagekraft begrenzt blieb.", target: "sodass" },
      { sentence: "Da es regnete, blieben wir zu Hause.", target: "Da" },
      { sentence: "Die Kosten stiegen, daher überarbeiteten wir den Plan.", target: "daher" },
      { sentence: "Weil die Zeit fehlte, verschoben wir das Treffen.", target: "Weil" },
      { sentence: "Aufgrund der Verspätung verpassten wir den Zug.", target: "Aufgrund" },
      { sentence: "Die Ergebnisse waren klar, folglich handelten wir sofort.", target: "folglich" },
      { sentence: "Da die Nachfrage stieg, produzierten wir mehr.", target: "Da" },
      { sentence: "Die Daten fehlten, sodass wir warten mussten.", target: "sodass" },
    ],
    transfer: "Weil die Zahlen fehlten, verschoben wir die Analyse, sodass wir mehr Zeit hatten.",
  },

  "Partizipialattribute erweitern": {
    examples: [
      { sentence: "die im Seminar diskutierten Ergebnisse", target: "diskutierten" },
      { sentence: "der gestern veröffentlichte Bericht", target: "veröffentlichte" },
      { sentence: "die von uns geprüften Daten", target: "geprüften" },
      { sentence: "das lange erwartete Ergebnis", target: "erwartete" },
      { sentence: "die im Labor entwickelte Methode", target: "entwickelte" },
      { sentence: "der oft zitierte Artikel", target: "zitierte" },
      { sentence: "die neu gegründete Firma", target: "gegründete" },
      { sentence: "das kürzlich reparierte Gerät", target: "reparierte" },
    ],
    transfer: "Die im Seminar diskutierten Ergebnisse bestätigen die im Labor entwickelte Methode.",
  },

  "Nominalisierte Adjektive": {
    examples: [
      { sentence: "Viele Lernende wünschen sich mehr Zeit.", target: "Lernende" },
      { sentence: "Der Angestellte kam pünktlich.", target: "Angestellte" },
      { sentence: "Die Reisenden warteten am Bahnsteig.", target: "Reisenden" },
      { sentence: "Ein Fremder fragte nach dem Weg.", target: "Fremder" },
      { sentence: "Die Erwachsenen sprachen leise.", target: "Erwachsenen" },
      { sentence: "Der Verletzte wurde ins Krankenhaus gebracht.", target: "Verletzte" },
      { sentence: "Die Studierenden bereiteten sich vor.", target: "Studierenden" },
      { sentence: "Ein Bekannter half uns.", target: "Bekannter" },
    ],
    transfer: "Viele Studierende und Lernende trafen sich, um über das Thema zu sprechen.",
  },

  "Erweiterte Genitivpräpositionen": {
    examples: [
      { sentence: "Hinsichtlich der Ergebnisse bleiben mehrere Fragen offen.", target: "Hinsichtlich" },
      { sentence: "Angesichts der Lage entschieden wir schnell.", target: "Angesichts" },
      { sentence: "Mittels dieser Methode lösten wir das Problem.", target: "Mittels" },
      { sentence: "Zugunsten der Umwelt verzichten wir auf Plastik.", target: "Zugunsten" },
      { sentence: "Hinsichtlich des Budgets müssen wir sparen.", target: "Hinsichtlich" },
      { sentence: "Angesichts der Kosten überdachten wir den Plan.", target: "Angesichts" },
      { sentence: "Mittels eines neuen Verfahrens sparten wir Zeit.", target: "Mittels" },
      { sentence: "Zugunsten der Kunden senkten wir den Preis.", target: "Zugunsten" },
    ],
    transfer: "Angesichts der neuen Daten und hinsichtlich der Kosten überarbeiten wir den gesamten Plan.",
  },

  "Funktionsverbgefüge systematisch": {
    examples: [
      { sentence: "Das Team trifft morgen eine Entscheidung.", target: "trifft" },
      { sentence: "Er nimmt Einfluss auf das Ergebnis.", target: "nimmt" },
      { sentence: "Sie übt Kritik an dem Vorschlag.", target: "übt" },
      { sentence: "Wir leisten Widerstand gegen die Änderung.", target: "leisten" },
      { sentence: "Er gibt eine Erklärung ab.", target: "gibt" },
      { sentence: "Sie stellt einen Antrag.", target: "stellt" },
      { sentence: "Wir ziehen einen Schluss daraus.", target: "ziehen" },
      { sentence: "Er nimmt an der Sitzung teil.", target: "nimmt" },
    ],
    transfer: "Das Team trifft eine Entscheidung und nimmt damit Einfluss auf das gesamte Projekt.",
  },

  "Informationsstruktur durch Vorfeldbesetzung": {
    examples: [
      { sentence: "Besonders wichtig ist die transparente Dokumentation.", target: "Besonders wichtig" },
      { sentence: "In diesem Fall gilt eine andere Regel.", target: "In diesem Fall" },
      { sentence: "Nach langer Diskussion einigten wir uns.", target: "Nach langer Diskussion" },
      { sentence: "Trotz der Kritik blieb er bei seiner Meinung.", target: "Trotz der Kritik" },
      { sentence: "Am Ende zählt nur das Ergebnis.", target: "Am Ende" },
      { sentence: "Unter diesen Umständen ist Vorsicht geboten.", target: "Unter diesen Umständen" },
      { sentence: "Vor allem die Kosten spielten eine Rolle.", target: "Vor allem" },
      { sentence: "Aus diesem Grund lehnten wir den Vorschlag ab.", target: "Aus diesem Grund" },
    ],
    transfer: "Besonders wichtig ist in diesem Fall eine klare und transparente Kommunikation.",
  },
};
