// Phase 1 Autorierung für A1 (Deutsch). Spiegelt die englische App
// (packages/content/src/authored/a1.ts dort), angepasst an die deutsche
// Pipeline: keine "generated"-Datei, die nicht von Hand bearbeitet werden
// darf -- grammar.json ist de-facto generiert, aber ohne Markierung, und
// grammar-supplement.ts ist ohnehin von Hand geschrieben. Diese Datei liefert
// zusätzliche, ECHTE Beispielsätze pro Einheit, die in index.ts VOR
// completeControlledExercises() eingemischt werden (siehe withAuthoredContent
// dort). Ohne das lag die ehrliche Ausbeute bei 2-5 verschiedenen
// Abrufzielen pro Einheit (siehe exercise-completion.ts: die Kandidaten-Pool
// liefert höchstens vier verschiedene Antworten, weil zwei Kandidatenpaare
// dieselbe Antwort erwarten).
//
// Jeder Satz benennt sein eigenes Zielwort (target) statt es automatisch zu
// bestimmen -- eine Heuristik (längstes Wort, erstes Verb) maskiert auf
// Sätzen, die sie nicht versteht, zuverlässig das falsche Wort und erzeugt
// Aufgaben, die die Grammatik der Einheit gar nicht prüfen.

export interface AuthoredExample {
  /** Ein vollständiger, korrekter Satz auf diesem Niveau. */
  readonly sentence: string;
  /** Die exakte Teilzeichenkette, die als Lücke maskiert wird. Muss in `sentence` vorkommen. */
  readonly target: string;
}

export interface AuthoredUnit {
  readonly examples: readonly AuthoredExample[];
  /**
   * Ein echter Mustersatz für eine NEUE Situation -- ersetzt den
   * Platzhalter "In einer neuen Situation kann ich <Titel> korrekt
   * verwenden.", den fast jede Einheit sonst trägt. Ohne einen echten Satz
   * hier überspringt der Generator den Transfer-Kandidaten ganz (siehe
   * TRANSFER_PLACEHOLDER-Logik in exercise-completion.ts).
   */
  readonly transfer: string;
}

export const A1_AUTHORED: Readonly<Record<string, AuthoredUnit>> = {
  "Personalpronomen und sein": {
    examples: [
      { sentence: "Ich bin Studentin.", target: "bin" },
      { sentence: "Du bist mein Freund.", target: "bist" },
      { sentence: "Er ist müde.", target: "ist" },
      { sentence: "Sie ist Ärztin.", target: "ist" },
      { sentence: "Wir sind hier.", target: "sind" },
      { sentence: "Ihr seid pünktlich.", target: "seid" },
      { sentence: "Sie sind sehr freundlich.", target: "sind" },
      { sentence: "Es ist kalt heute.", target: "ist" },
    ],
    transfer: "Meine Schwester ist Lehrerin, und wir sind stolz auf sie.",
  },

  haben: {
    examples: [
      { sentence: "Ich habe einen Termin.", target: "habe" },
      { sentence: "Er hat zwei Kinder.", target: "hat" },
      { sentence: "Du hast eine gute Idee.", target: "hast" },
      { sentence: "Wir haben Zeit.", target: "haben" },
      { sentence: "Sie hat einen Hund.", target: "hat" },
      { sentence: "Ihr habt viele Fragen.", target: "habt" },
      { sentence: "Sie haben ein neues Auto.", target: "haben" },
      { sentence: "Ich habe keinen Hunger.", target: "habe" },
    ],
    transfer: "Meine Eltern haben ein kleines Haus am See.",
  },

  "Präsens regelmäßiger Verben": {
    examples: [
      { sentence: "Ich lerne Deutsch.", target: "lerne" },
      { sentence: "Heute lerne ich Deutsch.", target: "lerne" },
      { sentence: "Sie arbeitet in Berlin.", target: "arbeitet" },
      { sentence: "Wir wohnen in München.", target: "wohnen" },
      { sentence: "Du kochst sehr gut.", target: "kochst" },
      { sentence: "Er spielt Fußball.", target: "spielt" },
      { sentence: "Ihr lernt schnell.", target: "lernt" },
      { sentence: "Morgen arbeite ich zu Hause.", target: "arbeite" },
    ],
    transfer: "Am Wochenende koche ich für meine Familie.",
  },

  "Präsens unregelmäßiger Verben": {
    examples: [
      { sentence: "Du fährst nach Hause.", target: "fährst" },
      { sentence: "Er liest ein Buch.", target: "liest" },
      { sentence: "Sie spricht Deutsch.", target: "spricht" },
      { sentence: "Er isst gern Nudeln.", target: "isst" },
      { sentence: "Du siehst müde aus.", target: "siehst" },
      { sentence: "Sie nimmt den Bus.", target: "nimmt" },
      { sentence: "Er hilft mir gern.", target: "hilft" },
      { sentence: "Du gibst mir das Buch.", target: "gibst" },
    ],
    transfer:
      "Meine Tochter liest jeden Abend ein Buch und schläft dann schnell ein.",
  },

  "W-Fragen": {
    examples: [
      // Zielwort auf das Fragewort verkürzt (statt der ganzen Frage) --
      // ansonsten blieb hinter der Lücke bei vielen dieser Sätze nur "?"
      // übrig, und mehrere Aufgaben erzeugten denselben Lückensatz.
      { sentence: "Wo wohnst du?", target: "Wo" },
      { sentence: "Warum lernst du Deutsch?", target: "Warum" },
      { sentence: "Wann beginnt der Kurs?", target: "Wann" },
      { sentence: "Was machst du heute?", target: "Was" },
      { sentence: "Wer kommt morgen?", target: "Wer" },
      { sentence: "Wie heißt du?", target: "Wie" },
      { sentence: "Woher kommst du?", target: "Woher" },
      { sentence: "Wie viel kostet das Buch?", target: "Wie viel" },
    ],
    transfer: "Wann kommst du morgen zu Besuch?",
  },

  "Ja/Nein-Fragen": {
    examples: [
      { sentence: "Kommst du morgen?", target: "Kommst du" },
      { sentence: "Haben Sie Zeit?", target: "Haben Sie" },
      { sentence: "Wohnst du in Berlin?", target: "Wohnst du" },
      { sentence: "Sprichst du Deutsch?", target: "Sprichst du" },
      { sentence: "Ist das dein Buch?", target: "Ist das" },
      { sentence: "Arbeitest du heute?", target: "Arbeitest du" },
      { sentence: "Kann ich helfen?", target: "Kann ich" },
      { sentence: "Trinkst du Kaffee?", target: "Trinkst du" },
    ],
    transfer: "Hast du morgen früh schon einen Termin?",
  },

  "bestimmter und unbestimmter Artikel": {
    examples: [
      { sentence: "Das ist ein Buch.", target: "ein" },
      { sentence: "Das Buch ist neu.", target: "Das" },
      { sentence: "Ich sehe eine Frau.", target: "eine" },
      { sentence: "Die Frau ist Lehrerin.", target: "Die" },
      { sentence: "Er hat einen Hund.", target: "einen" },
      { sentence: "Der Hund ist klein.", target: "Der" },
      { sentence: "Wir kaufen ein Auto.", target: "ein" },
      { sentence: "Das Auto ist teuer.", target: "Das" },
    ],
    transfer: "Ich brauche einen Stift. Der Stift liegt auf dem Tisch.",
  },

  Pluralformen: {
    examples: [
      { sentence: "Ich habe zwei Bücher.", target: "Bücher" },
      { sentence: "Die Frauen arbeiten heute.", target: "Frauen" },
      { sentence: "Wir kaufen drei Tische.", target: "Tische" },
      { sentence: "Die Kinder spielen draußen.", target: "Kinder" },
      { sentence: "Ich sehe zwei Autos.", target: "Autos" },
      { sentence: "Die Männer sind müde.", target: "Männer" },
      { sentence: "Wir haben vier Stühle.", target: "Stühle" },
      { sentence: "Die Häuser sind alt.", target: "Häuser" },
    ],
    transfer: "In der Straße stehen viele Häuser und Autos.",
  },

  Akkusativ: {
    examples: [
      { sentence: "Ich sehe den Mann.", target: "den Mann" },
      { sentence: "Ich kaufe einen Tisch.", target: "einen Tisch" },
      { sentence: "Sie liest ein Buch.", target: "ein Buch" },
      { sentence: "Wir brauchen die Karte.", target: "die Karte" },
      { sentence: "Er trinkt einen Kaffee.", target: "einen Kaffee" },
      { sentence: "Ich frage den Lehrer.", target: "den Lehrer" },
      { sentence: "Sie sucht eine Wohnung.", target: "eine Wohnung" },
      { sentence: "Wir bestellen das Essen.", target: "das Essen" },
    ],
    transfer: "Ich kaufe einen Rucksack und suche eine passende Jacke.",
  },

  Possessivartikel: {
    examples: [
      { sentence: "Das ist meine Tasche.", target: "meine" },
      { sentence: "Unser Kurs beginnt heute.", target: "Unser" },
      { sentence: "Dein Buch liegt hier.", target: "Dein" },
      { sentence: "Ihre Wohnung ist schön.", target: "Ihre" },
      { sentence: "Sein Auto ist neu.", target: "Sein" },
      { sentence: "Euer Zimmer ist groß.", target: "Euer" },
      { sentence: "Ihr Name ist Maria.", target: "Ihr" },
      { sentence: "Meine Eltern wohnen hier.", target: "Meine" },
    ],
    transfer: "Unser Lehrer erklärt seine Regeln immer sehr genau.",
  },

  "nicht und kein": {
    examples: [
      { sentence: "Ich habe kein Auto.", target: "kein" },
      { sentence: "Ich komme heute nicht.", target: "nicht" },
      { sentence: "Sie hat keine Zeit.", target: "keine" },
      { sentence: "Er arbeitet heute nicht.", target: "nicht" },
      { sentence: "Wir haben keinen Hunger.", target: "keinen" },
      { sentence: "Das ist nicht richtig.", target: "nicht" },
      { sentence: "Ich trinke keinen Kaffee.", target: "keinen" },
      { sentence: "Das Buch ist nicht neu.", target: "nicht" },
    ],
    transfer: "Ich habe heute keine Zeit und komme deshalb nicht mit.",
  },

  "Modalverb können": {
    examples: [
      { sentence: "Ich kann gut schwimmen.", target: "kann" },
      { sentence: "Kannst du mir helfen?", target: "Kannst" },
      { sentence: "Sie kann sehr gut kochen.", target: "kann" },
      { sentence: "Wir können morgen kommen.", target: "können" },
      { sentence: "Er kann nicht schwimmen.", target: "kann" },
      { sentence: "Könnt ihr mir helfen?", target: "Könnt" },
      { sentence: "Ich kann heute nicht kommen.", target: "kann" },
      { sentence: "Sie können gut Deutsch sprechen.", target: "können" },
    ],
    transfer: "Kannst du mir morgen bei der Arbeit helfen?",
  },

  "Trennbare Verben": {
    examples: [
      { sentence: "Ich stehe um sieben Uhr auf.", target: "auf" },
      { sentence: "Sie macht das Fenster zu.", target: "zu" },
      { sentence: "Wir rufen dich morgen an.", target: "an" },
      { sentence: "Er räumt sein Zimmer auf.", target: "auf" },
      { sentence: "Ich mache die Tür auf.", target: "auf" },
      { sentence: "Der Zug kommt um acht an.", target: "an" },
      { sentence: "Sie packt ihren Koffer aus.", target: "aus" },
      { sentence: "Wir sehen heute Abend fern.", target: "fern" },
    ],
    transfer: "Ich stehe früh auf und rufe dann meine Mutter an.",
  },

  "lokale Präpositionen": {
    examples: [
      { sentence: "Das Buch liegt auf dem Tisch.", target: "auf" },
      { sentence: "Die Katze sitzt unter dem Stuhl.", target: "unter" },
      { sentence: "Er wohnt in der Stadt.", target: "in" },
      { sentence: "Die Bank ist neben der Schule.", target: "neben" },
      { sentence: "Sie steht an der Tür.", target: "an" },
      { sentence: "Der Park liegt zwischen den Häusern.", target: "zwischen" },
      { sentence: "Das Bild hängt an der Wand.", target: "an" },
      { sentence: "Meine Tasche steht neben dem Bett.", target: "neben" },
    ],
    transfer:
      "Die Apotheke liegt neben der Post, zwischen dem Café und der Bank.",
  },

  "Imperativ mit du, ihr und Sie": {
    examples: [
      // Die drei du/ihr/Sie-Varianten brauchen unterschiedlichen Resttext,
      // sonst maskiert die Lücke bei allen dreien exakt "___ bitte herein."
      // und die Aufgaben werden für den Prompt-Vergleich ununterscheidbar.
      { sentence: "Komm bitte jetzt herein.", target: "Komm" },
      { sentence: "Kommt bitte alle herein.", target: "Kommt" },
      { sentence: "Kommen Sie bitte gleich herein.", target: "Kommen Sie" },
      { sentence: "Warte bitte hier.", target: "Warte" },
      { sentence: "Öffnen Sie bitte das Fenster.", target: "Öffnen Sie" },
      { sentence: "Setzt euch bitte hin.", target: "Setzt" },
      { sentence: "Ruf mich bitte an.", target: "Ruf" },
      { sentence: "Nehmen Sie bitte Platz.", target: "Nehmen Sie" },
    ],
    transfer: "Setzen Sie sich bitte, und warten Sie hier einen Moment.",
  },

  "Satzklammer im einfachen Hauptsatz": {
    examples: [
      {
        sentence: "Ich stehe jeden Morgen um sieben Uhr auf.",
        target: "stehe",
      },
      { sentence: "Sie hat gestern lange gearbeitet.", target: "hat" },
      { sentence: "Wir werden morgen früh abfahren.", target: "werden" },
      { sentence: "Er räumt sein Zimmer jeden Samstag auf.", target: "räumt" },
      { sentence: "Ich habe das Buch schon gelesen.", target: "habe" },
      { sentence: "Sie kann sehr gut Klavier spielen.", target: "kann" },
      { sentence: "Wir machen heute Abend die Tür zu.", target: "machen" },
      { sentence: "Er hat den Brief noch nicht geschrieben.", target: "hat" },
    ],
    transfer:
      "Ich habe heute Morgen lange geschlafen und bin spät aufgestanden.",
  },

  "Uhrzeit, Datum und Reihenfolge": {
    examples: [
      { sentence: "Am Montag beginne ich um neun Uhr.", target: "Am Montag" },
      { sentence: "Danach mache ich eine Pause.", target: "Danach" },
      { sentence: "Zuerst esse ich, dann arbeite ich.", target: "Zuerst" },
      { sentence: "Der Kurs beginnt um acht Uhr.", target: "um acht Uhr" },
      { sentence: "Am 3. Mai habe ich Geburtstag.", target: "Am 3. Mai" },
      { sentence: "Zuerst lese ich die E-Mail.", target: "Zuerst" },
      { sentence: "Danach rufe ich meine Mutter an.", target: "Danach" },
      { sentence: "Am Freitag habe ich frei.", target: "Am Freitag" },
    ],
    transfer:
      "Am Samstag stehe ich spät auf, zuerst frühstücke ich, danach gehe ich einkaufen.",
  },

  "Temporale Präpositionen am, um und im": {
    examples: [
      {
        sentence: "Am Freitag lerne ich um acht Uhr im Augustkurs.",
        target: "Am",
      },
      { sentence: "Um sieben Uhr stehe ich auf.", target: "Um" },
      { sentence: "Im Sommer fahre ich nach Italien.", target: "Im" },
      { sentence: "Am Montag habe ich einen Termin.", target: "Am" },
      { sentence: "Im Januar beginnt der neue Kurs.", target: "Im" },
      { sentence: "Um zwölf Uhr esse ich zu Mittag.", target: "Um" },
      { sentence: "Im Winter ist es kalt.", target: "Im" },
      { sentence: "Am Wochenende arbeite ich nicht.", target: "Am" },
    ],
    transfer: "Im Dezember, am 24., feiern wir um sechs Uhr abends.",
  },

  Häufigkeitsadverbien: {
    examples: [
      { sentence: "Ich lerne abends oft Deutsch.", target: "oft" },
      { sentence: "Sie kommt manchmal spät.", target: "manchmal" },
      { sentence: "Er trinkt selten Kaffee.", target: "selten" },
      { sentence: "Wir gehen nie ins Kino.", target: "nie" },
      { sentence: "Ich bin immer pünktlich.", target: "immer" },
      { sentence: "Sie liest oft am Abend.", target: "oft" },
      { sentence: "Er ruft manchmal seine Eltern an.", target: "manchmal" },
      { sentence: "Wir arbeiten selten am Wochenende.", target: "selten" },
    ],
    transfer: "Ich koche oft zu Hause, aber ich esse selten allein.",
  },

  "es gibt mit Akkusativ": {
    examples: [
      {
        sentence: "In meiner Straße gibt es einen Supermarkt.",
        target: "einen Supermarkt",
      },
      { sentence: "Hier gibt es eine Apotheke.", target: "eine Apotheke" },
      { sentence: "Es gibt keinen Parkplatz.", target: "keinen Parkplatz" },
      { sentence: "Gibt es hier einen Bahnhof?", target: "einen Bahnhof" },
      { sentence: "In der Stadt gibt es viele Cafés.", target: "viele Cafés" },
      {
        sentence: "Es gibt heute keinen Unterricht.",
        target: "keinen Unterricht",
      },
      { sentence: "Gibt es einen Bus zum Flughafen?", target: "einen Bus" },
      { sentence: "In dem Park gibt es einen See.", target: "einen See" },
    ],
    transfer: "In unserem Viertel gibt es einen Markt und einen kleinen Park.",
  },

  "man für allgemeine Aussagen": {
    examples: [
      {
        sentence: "In Deutschland trinkt man viel Kaffee.",
        target: "trinkt man",
      },
      { sentence: "Hier spricht man Deutsch.", target: "spricht man" },
      { sentence: "Man isst hier viel Brot.", target: "Man isst" },
      { sentence: "Man kann hier gut parken.", target: "Man kann" },
      { sentence: "Im Winter trägt man eine Jacke.", target: "trägt man" },
      {
        sentence: "Man lernt Sprachen am besten mit Übung.",
        target: "Man lernt",
      },
      { sentence: "Hier darf man nicht rauchen.", target: "darf man" },
      { sentence: "Man sieht das Museum von hier.", target: "Man sieht" },
    ],
    transfer: "In dieser Stadt fährt man meistens mit dem Fahrrad.",
  },

  "und, aber, denn und oder": {
    examples: [
      {
        sentence: "Ich lerne Deutsch, denn ich lebe in Berlin.",
        target: "denn",
      },
      { sentence: "Ich koche, und du deckst den Tisch.", target: "und" },
      { sentence: "Er ist müde, aber er arbeitet weiter.", target: "aber" },
      { sentence: "Willst du Tee oder Kaffee?", target: "oder" },
      {
        sentence: "Sie lernt viel, denn die Prüfung ist bald.",
        target: "denn",
      },
      {
        sentence: "Wir bleiben zu Hause, aber wir lesen ein Buch.",
        target: "aber",
      },
      {
        sentence: "Ich rufe an, oder ich schreibe eine E-Mail.",
        target: "oder",
      },
      { sentence: "Er kocht, und sie räumt auf.", target: "und" },
    ],
    transfer:
      "Ich bin müde, aber ich gehe noch spazieren, denn die Luft ist frisch.",
  },

  "Mengenwörter viel, wenig und genug": {
    examples: [
      {
        sentence: "Ich habe wenig Zeit, aber viele Aufgaben.",
        target: "wenig Zeit",
      },
      // Zielwort auf das Mengenwort verkürzt: "Wir haben genug Brot." und
      // "Wir haben viele Fragen." maskierten sonst beide zu "Wir haben ___.",
      // ebenso "Sie hat viel Geld." / "Sie hat viele Bücher.".
      { sentence: "Wir haben genug Brot.", target: "genug" },
      { sentence: "Sie hat viel Geld.", target: "viel" },
      { sentence: "Er hat wenige Freunde.", target: "wenige Freunde" },
      { sentence: "Wir haben viele Fragen.", target: "viele" },
      { sentence: "Ich trinke wenig Wasser.", target: "wenig Wasser" },
      { sentence: "Habt ihr genug Platz?", target: "genug Platz" },
      { sentence: "Sie hat viele Bücher.", target: "viele" },
    ],
    transfer: "Wir haben genug Zeit, aber wenig Geduld für viele Fragen.",
  },

  Akkusativpronomen: {
    examples: [
      { sentence: "Ich sehe den Bus. Ich sehe ihn.", target: "ihn" },
      { sentence: "Ich kenne dich gut.", target: "dich" },
      { sentence: "Er ruft mich an.", target: "mich" },
      { sentence: "Wir sehen sie morgen.", target: "sie" },
      { sentence: "Ich brauche es jetzt.", target: "es" },
      { sentence: "Sie besucht uns am Wochenende.", target: "uns" },
      { sentence: "Ich rufe euch später an.", target: "euch" },
      { sentence: "Kennst du sie schon?", target: "sie" },
    ],
    transfer:
      "Ich habe den Brief gestern geschrieben und ihn dir dann geschickt.",
  },
};
