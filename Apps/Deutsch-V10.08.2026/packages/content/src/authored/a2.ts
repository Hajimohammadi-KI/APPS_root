// Phase 1 Autorierung für A2. Gleicher Vertrag wie authored/a1.ts.

import type { AuthoredUnit } from "./a1";

export const A2_AUTHORED: Readonly<Record<string, AuthoredUnit>> = {
  "Perfekt mit haben": {
    examples: [
      { sentence: "Ich habe gestern gearbeitet.", target: "habe" },
      { sentence: "Sie hat den Brief geschrieben.", target: "hat" },
      { sentence: "Wir haben lange gewartet.", target: "haben" },
      { sentence: "Er hat das Buch gelesen.", target: "hat" },
      { sentence: "Habt ihr schon gegessen?", target: "Habt" },
      { sentence: "Ich habe das Auto gekauft.", target: "habe" },
      { sentence: "Sie haben viel gelernt.", target: "haben" },
      { sentence: "Du hast das Zimmer aufgeräumt.", target: "hast" },
    ],
    transfer: "Ich habe gestern lange gearbeitet und dann ein Buch gelesen.",
  },

  "Perfekt mit sein": {
    examples: [
      { sentence: "Wir sind nach Berlin gefahren.", target: "sind" },
      { sentence: "Sie ist früh aufgestanden.", target: "ist" },
      { sentence: "Er ist nach Hause gegangen.", target: "ist" },
      { sentence: "Ich bin schnell gelaufen.", target: "bin" },
      { sentence: "Seid ihr pünktlich angekommen?", target: "Seid" },
      { sentence: "Sie sind zusammen gereist.", target: "sind" },
      { sentence: "Er ist gestern gekommen.", target: "ist" },
      { sentence: "Wir sind spät aufgewacht.", target: "sind" },
    ],
    transfer: "Wir sind gestern nach München gefahren und spät angekommen.",
  },

  "Präteritum von sein/haben/Modalverben": {
    examples: [
      { sentence: "Ich war krank.", target: "war" },
      { sentence: "Sie musste arbeiten.", target: "musste" },
      { sentence: "Er hatte keine Zeit.", target: "hatte" },
      { sentence: "Wir konnten nicht kommen.", target: "konnten" },
      { sentence: "Du warst gestern nicht da.", target: "warst" },
      { sentence: "Sie wollte früh gehen.", target: "wollte" },
      { sentence: "Es war sehr kalt.", target: "war" },
      { sentence: "Wir hatten viel Arbeit.", target: "hatten" },
    ],
    transfer: "Ich war letzte Woche krank und musste zu Hause bleiben.",
  },

  Dativ: {
    examples: [
      { sentence: "Ich gebe dem Mann das Buch.", target: "dem Mann" },
      { sentence: "Sie hilft der Frau.", target: "der Frau" },
      { sentence: "Wir danken dem Lehrer.", target: "dem Lehrer" },
      { sentence: "Er schreibt seiner Mutter einen Brief.", target: "seiner Mutter" },
      { sentence: "Ich glaube dir nicht.", target: "dir" },
      { sentence: "Das gehört den Kindern.", target: "den Kindern" },
      { sentence: "Sie zeigt mir den Weg.", target: "mir" },
      { sentence: "Wir folgen dem Guide.", target: "dem Guide" },
    ],
    transfer: "Ich danke meinem Kollegen, denn er hilft mir jeden Tag.",
  },

  Wechselpräpositionen: {
    examples: [
      { sentence: "Das Bild hängt an der Wand.", target: "an der Wand" },
      { sentence: "Ich hänge es an die Wand.", target: "an die Wand" },
      { sentence: "Er steht in der Küche.", target: "in der Küche" },
      { sentence: "Er geht in die Küche.", target: "in die Küche" },
      { sentence: "Das Buch liegt auf dem Tisch.", target: "auf dem Tisch" },
      { sentence: "Ich lege das Buch auf den Tisch.", target: "auf den Tisch" },
      { sentence: "Sie sitzt neben dem Fenster.", target: "neben dem Fenster" },
      { sentence: "Sie setzt sich neben das Fenster.", target: "neben das Fenster" },
    ],
    transfer: "Ich stelle die Tasse auf den Tisch, und jetzt steht sie auf dem Tisch.",
  },

  "Modalverben müssen, dürfen, sollen, wollen": {
    examples: [
      { sentence: "Ich muss heute lernen.", target: "muss" },
      { sentence: "Du darfst hier parken.", target: "darfst" },
      { sentence: "Sie soll morgen kommen.", target: "soll" },
      { sentence: "Wir wollen ins Kino gehen.", target: "wollen" },
      { sentence: "Er muss den Arzt anrufen.", target: "muss" },
      { sentence: "Ihr dürft jetzt gehen.", target: "dürft" },
      { sentence: "Ich will das Buch kaufen.", target: "will" },
      { sentence: "Sie müssen sich beeilen.", target: "müssen" },
    ],
    transfer: "Ich muss heute noch arbeiten, aber ich will danach ins Kino gehen.",
  },

  "Komparativ und Superlativ": {
    examples: [
      { sentence: "Deutsch ist leichter als gedacht.", target: "leichter" },
      { sentence: "Das ist am besten.", target: "am besten" },
      { sentence: "Er ist größer als ich.", target: "größer" },
      { sentence: "Das ist die schnellste Lösung.", target: "schnellste" },
      { sentence: "Dieses Auto ist teurer.", target: "teurer" },
      { sentence: "Das ist der wichtigste Punkt.", target: "wichtigste" },
      { sentence: "Sie läuft schneller als er.", target: "schneller" },
      { sentence: "Das war der schönste Tag.", target: "schönste" },
    ],
    transfer: "Diese Wohnung ist kleiner, aber sie ist die günstigste Option.",
  },

  "Nebensatz mit weil": {
    examples: [
      { sentence: "Ich lerne Deutsch, weil ich in Deutschland lebe.", target: "weil ich in Deutschland lebe" },
      { sentence: "Er bleibt zu Hause, weil er krank ist.", target: "weil er krank ist" },
      { sentence: "Sie ist froh, weil sie die Prüfung bestanden hat.", target: "weil sie die Prüfung bestanden hat" },
      { sentence: "Wir gehen nicht raus, weil es regnet.", target: "weil es regnet" },
      { sentence: "Ich rufe an, weil ich eine Frage habe.", target: "weil ich eine Frage habe" },
      { sentence: "Er lernt viel, weil er die Prüfung schreibt.", target: "weil er die Prüfung schreibt" },
      { sentence: "Sie kommt spät, weil der Bus Verspätung hat.", target: "weil der Bus Verspätung hat" },
      { sentence: "Ich bin müde, weil ich wenig geschlafen habe.", target: "weil ich wenig geschlafen habe" },
    ],
    transfer: "Ich bleibe heute zu Hause, weil ich mich nicht gut fühle.",
  },

  "Nebensatz mit dass": {
    examples: [
      { sentence: "Ich glaube, dass er heute kommt.", target: "dass er heute kommt" },
      { sentence: "Sie sagt, dass sie müde ist.", target: "dass sie müde ist" },
      { sentence: "Ich hoffe, dass es morgen nicht regnet.", target: "dass es morgen nicht regnet" },
      { sentence: "Er weiß, dass die Prüfung schwer ist.", target: "dass die Prüfung schwer ist" },
      { sentence: "Wir denken, dass der Kurs gut ist.", target: "dass der Kurs gut ist" },
      { sentence: "Ich finde, dass das eine gute Idee ist.", target: "dass das eine gute Idee ist" },
      { sentence: "Sie merkt, dass etwas fehlt.", target: "dass etwas fehlt" },
      { sentence: "Ich vermute, dass er Recht hat.", target: "dass er Recht hat" },
    ],
    transfer: "Ich glaube, dass diese Lösung für uns alle am besten ist.",
  },

  "wenn und als": {
    examples: [
      { sentence: "Als ich klein war, spielte ich oft draußen.", target: "Als" },
      { sentence: "Wenn ich Zeit habe, lese ich ein Buch.", target: "Wenn" },
      { sentence: "Als er ankam, regnete es.", target: "Als" },
      { sentence: "Wenn es regnet, bleibe ich zu Hause.", target: "Wenn" },
      { sentence: "Als wir jung waren, reisten wir viel.", target: "Als" },
      { sentence: "Wenn du fertig bist, ruf mich an.", target: "Wenn" },
      { sentence: "Als sie ankamen, war das Essen fertig.", target: "Als" },
      { sentence: "Wenn ich Geld habe, kaufe ich das Auto.", target: "Wenn" },
    ],
    transfer: "Als ich in Berlin ankam, wusste ich noch nicht, wenn ich wieder zurückfahren würde.",
  },

  "Reflexive Verben": {
    examples: [
      { sentence: "Ich interessiere mich für Musik.", target: "mich" },
      { sentence: "Er freut sich auf die Reise.", target: "sich" },
      { sentence: "Wir treffen uns um acht.", target: "uns" },
      { sentence: "Sie erinnert sich an den Film.", target: "sich" },
      { sentence: "Ich fühle mich heute besser.", target: "mich" },
      { sentence: "Beeilt euch bitte.", target: "euch" },
      { sentence: "Er ärgert sich über den Fehler.", target: "sich" },
      { sentence: "Wir setzen uns hin.", target: "uns" },
    ],
    transfer: "Ich freue mich sehr, weil wir uns endlich wiedersehen.",
  },

  "Adjektiv nach sein": {
    examples: [
      { sentence: "Der Kurs ist interessant.", target: "interessant" },
      { sentence: "Das Wetter bleibt schön.", target: "schön" },
      { sentence: "Sie wird müde.", target: "müde" },
      { sentence: "Das Essen ist lecker.", target: "lecker" },
      { sentence: "Er bleibt ruhig.", target: "ruhig" },
      { sentence: "Die Aufgabe ist schwer.", target: "schwer" },
      { sentence: "Das Zimmer wird warm.", target: "warm" },
      { sentence: "Der Film war spannend.", target: "spannend" },
    ],
    transfer: "Der neue Kurs ist wirklich interessant, aber am Anfang war er schwer.",
  },

  "Zeitangaben und Wortstellung": {
    examples: [
      { sentence: "Morgen fahre ich mit dem Zug nach Berlin.", target: "Morgen fahre ich" },
      { sentence: "Heute Abend koche ich für dich.", target: "Heute Abend koche ich" },
      { sentence: "Nächste Woche beginnt der Kurs.", target: "Nächste Woche beginnt" },
      { sentence: "Am Montag treffe ich meinen Chef.", target: "Am Montag treffe ich" },
      { sentence: "Gestern habe ich lange gearbeitet.", target: "Gestern habe ich" },
      { sentence: "Um acht Uhr beginnt der Unterricht.", target: "Um acht Uhr beginnt" },
      { sentence: "Bald ziehen wir um.", target: "Bald ziehen wir" },
      { sentence: "Später rufe ich dich an.", target: "Später rufe ich" },
    ],
    transfer: "Nächste Woche fahre ich nach Hamburg und besuche meine Familie.",
  },

  "Indefinitpronomen man/jemand/niemand": {
    examples: [
      { sentence: "In Deutschland trinkt man viel Kaffee.", target: "man" },
      { sentence: "Jemand hat angerufen.", target: "Jemand" },
      { sentence: "Niemand war zu Hause.", target: "Niemand" },
      { sentence: "Man kann hier gut essen.", target: "Man" },
      { sentence: "Hat jemand meine Tasche gesehen?", target: "jemand" },
      { sentence: "Niemand hat die Antwort gewusst.", target: "Niemand" },
      { sentence: "Man sollte immer pünktlich sein.", target: "Man" },
      { sentence: "Ist jemand da?", target: "jemand" },
    ],
    transfer: "Hat jemand eine Idee, oder weiß niemand die Antwort?",
  },

  "Adjektivdeklination nach Artikeln": {
    examples: [
      { sentence: "Ich kaufe einen warmen Mantel.", target: "warmen" },
      { sentence: "Sie trägt eine warme Jacke.", target: "warme" },
      { sentence: "Das ist ein neues Auto.", target: "neues" },
      { sentence: "Der große Tisch steht dort.", target: "große" },
      { sentence: "Ich sehe die kleine Katze.", target: "kleine" },
      { sentence: "Wir kaufen ein schönes Haus.", target: "schönes" },
      { sentence: "Er trägt einen alten Hut.", target: "alten" },
      { sentence: "Das ist eine gute Idee.", target: "gute" },
    ],
    transfer: "Ich brauche einen neuen Rucksack und eine warme Jacke für den Winter.",
  },

  "Relativsätze mit der, die und das": {
    examples: [
      { sentence: "Das ist die Frau, die nebenan wohnt.", target: "die nebenan wohnt" },
      { sentence: "Der Mann, der dort steht, ist mein Chef.", target: "der dort steht" },
      { sentence: "Das Buch, das ich lese, ist spannend.", target: "das ich lese" },
      { sentence: "Die Kinder, die dort spielen, sind laut.", target: "die dort spielen" },
      { sentence: "Das ist der Lehrer, der uns hilft.", target: "der uns hilft" },
      { sentence: "Ich kenne die Frau, die dort arbeitet.", target: "die dort arbeitet" },
      { sentence: "Das Auto, das dort steht, ist neu.", target: "das dort steht" },
      { sentence: "Er ist der Freund, der mir immer hilft.", target: "der mir immer hilft" },
    ],
    transfer: "Das ist der Kollege, der mir gestern bei der Arbeit geholfen hat.",
  },

  "Nebensätze mit ob": {
    examples: [
      // Zielwort auf "ob" verkürzt für die beiden Paare, die sich sonst
      // einen identischen Lückensatz teilten ("Ich weiß nicht, ___." bzw.
      // "Sie fragt, ___."). "ob" ist ohnehin der eigentliche Lerngegenstand.
      { sentence: "Ich weiß nicht, ob der Kurs heute stattfindet.", target: "ob" },
      { sentence: "Sie fragt, ob er kommt.", target: "ob" },
      { sentence: "Ich bin nicht sicher, ob das stimmt.", target: "ob das stimmt" },
      { sentence: "Weißt du, ob sie Zeit hat?", target: "ob sie Zeit hat" },
      { sentence: "Er fragt, ob wir mitkommen.", target: "ob wir mitkommen" },
      { sentence: "Ich weiß nicht, ob es regnet.", target: "ob" },
      { sentence: "Sie fragt, ob ich helfen kann.", target: "ob" },
      { sentence: "Wir wissen nicht, ob der Zug pünktlich ist.", target: "ob der Zug pünktlich ist" },
    ],
    transfer: "Kannst du mir sagen, ob der Termin morgen noch stattfindet?",
  },

  "darum, deshalb und deswegen": {
    examples: [
      { sentence: "Ich bin müde. Deshalb gehe ich früh ins Bett.", target: "Deshalb gehe ich" },
      { sentence: "Es regnet. Darum bleibe ich zu Hause.", target: "Darum bleibe ich" },
      { sentence: "Sie ist krank. Deswegen kommt sie nicht.", target: "Deswegen kommt sie" },
      { sentence: "Er hat wenig Zeit. Deshalb arbeitet er schnell.", target: "Deshalb arbeitet er" },
      { sentence: "Der Bus kam spät. Darum war ich verspätet.", target: "Darum war ich" },
      { sentence: "Ich habe Hunger. Deswegen koche ich jetzt.", target: "Deswegen koche ich" },
      { sentence: "Es war kalt. Deshalb trug ich eine Jacke.", target: "Deshalb trug ich" },
      { sentence: "Sie lernt viel. Darum besteht sie die Prüfung.", target: "Darum besteht sie" },
    ],
    transfer: "Ich habe heute viel gearbeitet. Deshalb bin ich jetzt sehr müde.",
  },

  "denn und sondern": {
    examples: [
      { sentence: "Ich fahre nicht, sondern ich gehe zu Fuß.", target: "sondern ich gehe" },
      { sentence: "Er kommt nicht, sondern er ruft an.", target: "sondern er ruft an" },
      { sentence: "Ich lerne Deutsch, denn ich brauche es für die Arbeit.", target: "denn ich brauche es" },
      { sentence: "Sie ist nicht müde, sondern sie ist krank.", target: "sondern sie ist krank" },
      { sentence: "Wir bleiben zu Hause, denn es regnet stark.", target: "denn es regnet stark" },
      { sentence: "Er trinkt keinen Kaffee, sondern er trinkt Tee.", target: "sondern er trinkt Tee" },
      { sentence: "Ich rufe an, denn ich habe eine Frage.", target: "denn ich habe eine Frage" },
      { sentence: "Sie kauft kein Auto, sondern sie kauft ein Fahrrad.", target: "sondern sie kauft ein Fahrrad" },
    ],
    transfer: "Ich fahre heute nicht mit dem Auto, sondern ich nehme den Zug, denn er ist schneller.",
  },

  "Verben mit Dativ und Akkusativ": {
    examples: [
      { sentence: "Ich zeige meiner Freundin das Foto.", target: "meiner Freundin" },
      { sentence: "Er gibt dem Kind ein Geschenk.", target: "dem Kind" },
      { sentence: "Sie schickt ihrem Bruder einen Brief.", target: "ihrem Bruder" },
      { sentence: "Wir erklären den Studenten die Regel.", target: "den Studenten" },
      { sentence: "Ich leihe meinem Freund das Auto.", target: "meinem Freund" },
      { sentence: "Er schenkt seiner Mutter Blumen.", target: "seiner Mutter" },
      { sentence: "Sie erzählt den Kindern eine Geschichte.", target: "den Kindern" },
      { sentence: "Wir bringen dem Lehrer die Hausaufgabe.", target: "dem Lehrer" },
    ],
    transfer: "Ich zeige meinem Kollegen den Bericht und erkläre ihm die wichtigsten Punkte.",
  },

  "Verben mit Präpositionen Grundlagen": {
    examples: [
      { sentence: "Ich warte auf den Bus.", target: "warte auf" },
      { sentence: "Sie denkt an ihre Familie.", target: "denkt an" },
      { sentence: "Wir freuen uns auf die Ferien.", target: "freuen uns auf" },
      { sentence: "Er interessiert sich für Musik.", target: "interessiert sich für" },
      { sentence: "Ich spreche mit meinem Chef.", target: "spreche mit" },
      { sentence: "Sie kümmert sich um die Kinder.", target: "kümmert sich um" },
      { sentence: "Wir gehören zu diesem Team.", target: "gehören zu" },
      { sentence: "Er bittet um Hilfe.", target: "bittet um" },
    ],
    transfer: "Ich warte schon lange auf eine Antwort und denke oft an dieses Problem.",
  },

  "Futur I mit werden": {
    examples: [
      { sentence: "Morgen werde ich länger arbeiten.", target: "werde" },
      { sentence: "Sie wird bald ankommen.", target: "wird" },
      { sentence: "Wir werden das Projekt fertigstellen.", target: "werden" },
      { sentence: "Er wird nächstes Jahr umziehen.", target: "wird" },
      { sentence: "Ich werde dich morgen anrufen.", target: "werde" },
      { sentence: "Sie werden bald eine Entscheidung treffen.", target: "werden" },
      { sentence: "Wirst du morgen kommen?", target: "Wirst" },
      { sentence: "Es wird bald regnen.", target: "wird" },
    ],
    transfer: "Ich werde nächste Woche eine wichtige Entscheidung treffen.",
  },

  "da- und wo-Komposita Grundlagen": {
    examples: [
      { sentence: "Worauf wartest du? Ich warte darauf.", target: "darauf" },
      { sentence: "Womit schreibst du? Ich schreibe damit.", target: "damit" },
      { sentence: "Wovon sprichst du? Ich spreche davon.", target: "davon" },
      { sentence: "Woran denkst du? Ich denke daran.", target: "daran" },
      { sentence: "Worüber freust du dich? Ich freue mich darüber.", target: "darüber" },
      { sentence: "Auf wen wartest du? Ich warte auf ihn.", target: "auf ihn" },
      { sentence: "Wofür interessierst du dich? Ich interessiere mich dafür.", target: "dafür" },
      { sentence: "Mit wem sprichst du? Ich spreche mit ihr.", target: "mit ihr" },
    ],
    transfer: "Worauf freust du dich am meisten? Ich freue mich besonders darauf.",
  },

  "Infinitiv mit zu Grundlagen": {
    examples: [
      { sentence: "Ich versuche, früher aufzustehen.", target: "aufzustehen" },
      { sentence: "Sie hofft, die Prüfung zu bestehen.", target: "zu bestehen" },
      { sentence: "Er beginnt, Deutsch zu lernen.", target: "zu lernen" },
      { sentence: "Wir haben vor, nach Berlin zu fahren.", target: "zu fahren" },
      { sentence: "Ich vergesse oft, die Tür abzuschließen.", target: "abzuschließen" },
      { sentence: "Sie plant, ein Buch zu schreiben.", target: "zu schreiben" },
      { sentence: "Er hat Lust, spazieren zu gehen.", target: "zu gehen" },
      { sentence: "Ich versuche, pünktlich anzukommen.", target: "anzukommen" },
    ],
    transfer: "Ich versuche jeden Tag, früher aufzustehen und pünktlich anzukommen.",
  },
};
