import { defineExplanations } from "./schema";

export const a1Explanations = defineExplanations({
  "Personalpronomen und sein": {
    overview:
      "Personalpronomen ersetzen Personen oder Dinge als Subjekt. Das Verb sein verbindet das Subjekt mit einer Identität, Eigenschaft, Herkunft oder einem Ort und ist vollständig unregelmäßig.",
    formation: [
      "ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind",
      "Das Pronomen richtet sich nach der gemeinten Person; die Verbform richtet sich immer nach dem Subjekt.",
      "Bei Nomen kann das Pronomen später ersetzen: Lena ist müde. Sie ist müde.",
    ],
    usage: [
      "Identität und Beruf: Ich bin Studentin. Er ist Arzt.",
      "Eigenschaft und Zustand: Wir sind müde. Das Buch ist interessant.",
      "Herkunft und Ort: Sie ist aus Köln. Ihr seid im Kurs.",
    ],
    wordOrder: [
      "Im Aussagesatz steht die finite Form von sein an Position 2: Heute bin ich zu Hause.",
      "In der Ja/Nein-Frage steht sie an Position 1: Bist du neu hier?",
    ],
    specialCases: [
      "Das formelle Sie wird großgeschrieben, verwendet aber dieselbe Verbform wie sie im Plural: Sie sind.",
      "Berufe stehen nach sein normalerweise ohne Artikel: Er ist Ingenieur. Mit Adjektiv steht oft ein Artikel: Er ist ein guter Ingenieur.",
    ],
    memoryTip: "Lerne sein als Rhythmus: bin - bist - ist; sind - seid - sind.",
  },
  haben: {
    overview:
      "Haben drückt Besitz, Beziehungen, körperliche Zustände und viele feste Wendungen aus. Es ist unregelmäßig, aber die Pluralformen folgen dem üblichen Präsensmuster.",
    formation: [
      "ich habe, du hast, er/sie/es hat, wir haben, ihr habt, sie/Sie haben",
      "Nach haben steht das Objekt im Akkusativ: Ich habe einen Termin.",
      "Bei du und er/sie/es fällt der Stammvokal e weg: du hast, er hat.",
    ],
    usage: [
      "Besitz: Wir haben ein Auto.",
      "Beziehungen und Termine: Sie hat zwei Brüder. Ich habe morgen Unterricht.",
      "Feste Ausdrücke: Hunger, Durst, Zeit, Angst, Glück oder Recht haben.",
    ],
    wordOrder: [
      "Haben ist finit und steht im Hauptsatz an Position 2: Heute habe ich viel Zeit.",
      "In Entscheidungsfragen steht es zuerst: Hast du Hunger?",
    ],
    specialCases: [
      "Deutsch verwendet haben, wo andere Sprachen sein verwenden können: Ich habe Hunger, nicht Ich bin Hunger.",
      "Als Hilfsverb bildet haben später viele Perfektformen; dann steht das Partizip am Satzende.",
    ],
    memoryTip:
      "Markiere bei hast und hat das fehlende b: nur diese beiden Präsensformen sind stark verkürzt.",
  },
  "Präsens regelmäßiger Verben": {
    overview:
      "Das Präsens beschreibt Gegenwart, Gewohnheiten, allgemeine Wahrheiten und oft auch eine geplante Zukunft. Regelmäßige Verben behalten ihren Stamm und erhalten feste Personalendungen.",
    formation: [
      "Infinitiv minus -en ergibt den Stamm: machen → mach-.",
      "Endungen: ich -e, du -st, er/sie/es -t, wir -en, ihr -t, sie/Sie -en.",
      "Bei Stämmen auf -d oder -t steht vor -st und -t meist ein zusätzliches e: du arbeitest, er arbeitet.",
    ],
    usage: [
      "Aktuell: Ich lerne jetzt Deutsch.",
      "Gewohnheit: Montags arbeite ich zu Hause.",
      "Zukunft mit Zeitangabe: Morgen besuche ich meine Freundin.",
    ],
    wordOrder: [
      "Die konjugierte Form steht im Aussagesatz an Position 2; andere Satzteile dürfen Position 1 besetzen.",
      "Das Subjekt steht deshalb nicht immer zuerst: Am Abend koche ich.",
    ],
    specialCases: [
      "Verben auf -s, -ß, -z oder -x haben bei du nur -t statt -st: du heißt, du tanzt.",
      "Bei Verben auf -eln fällt in der ich-Form häufig ein e weg: sammeln → ich sammle.",
    ],
    memoryTip: "Sprich die Endungstreppe laut: -e, -st, -t, -en, -t, -en.",
  },
  "Präsens unregelmäßiger Verben": {
    overview:
      "Viele starke Verben ändern im Präsens den Stammvokal, aber nur bei du und er/sie/es. Die Endungen bleiben weitgehend dieselben wie bei regelmäßigen Verben.",
    formation: [
      "e → i/ie: geben → du gibst; lesen → er liest.",
      "a → ä: fahren → du fährst; schlafen → sie schläft.",
      "au → äu: laufen → du läufst.",
      "Wir, ihr und sie/Sie behalten den Infinitivvokal: wir fahren, ihr fahrt, sie fahren.",
    ],
    usage: [
      "Die Bedeutung und die Zeitfunktion entsprechen dem normalen Präsens.",
      "Die Stammänderung muss zusammen mit dem Verb gelernt werden: fahren - du fährst - er fährt.",
    ],
    wordOrder: [
      "Auch ein unregelmäßiges Verb steht als finite Form an Position 2: Heute fährt er nach Bonn.",
      "In der W-Frage folgt es direkt auf das Fragewort: Was liest du?",
    ],
    specialCases: [
      "Nehmen verliert zusätzlich h: du nimmst, er nimmt.",
      "Stoßen und halten verändern Vokal und teilweise Schreibweise: du stößt, er hält.",
      "Die ich-Form hat normalerweise keinen Vokalwechsel: ich fahre, ich lese.",
    ],
    memoryTip:
      "Lerne starke Verben immer als Dreiergruppe: Infinitiv - du-Form - er/sie/es-Form.",
  },
  "W-Fragen": {
    overview:
      "W-Fragen erfragen eine konkrete Information. Das Fragewort bestimmt, welche Information fehlt, und steht am Satzanfang.",
    formation: [
      "Fragewort + finites Verb + Subjekt + Ergänzungen: Wo wohnst du?",
      "Häufige Fragewörter: wer, was, wo, wohin, woher, wann, wie, warum, welcher/welche/welches.",
      "Wer fragt nach einer Person als Subjekt; wen fragt nach Akkusativ, wem nach Dativ.",
    ],
    usage: [
      "Ort: Wo bist du? Richtung: Wohin gehst du? Herkunft: Woher kommst du?",
      "Grund: Warum lernst du Deutsch? Art und Weise: Wie lernst du?",
      "Auswahl: Welchen Kurs besuchst du?",
    ],
    wordOrder: [
      "Das finite Verb steht direkt nach dem Fragewort; das Subjekt folgt, sofern das Fragewort nicht selbst das Subjekt ist.",
      "Bei Wer kommt heute? ist wer bereits das Subjekt, deshalb folgt kein weiteres Subjekt.",
    ],
    specialCases: [
      "Wie viel fragt nach einer nicht zählbaren Menge, wie viele nach zählbaren Dingen.",
      "Präpositionen bleiben bei Personen vor dem Fragewort: Mit wem sprichst du?",
    ],
    memoryTip:
      "Fragewort auf Platz 1, Verb auf Platz 2 - außer das Fragewort ist selbst das Subjekt.",
  },
  "Ja/Nein-Fragen": {
    overview:
      "Ja/Nein-Fragen prüfen, ob eine Aussage stimmt. Sie haben kein Fragewort und werden durch die Verb-Erst-Stellung signalisiert.",
    formation: [
      "Finites Verb + Subjekt + Ergänzungen: Kommst du aus Berlin?",
      "Mit sein und haben: Ist er da? Habt ihr Zeit?",
      "Kurze Antworten wiederholen meist Pronomen und Verb: Ja, das tue ich. Nein, ich komme nicht.",
    ],
    usage: [
      "Information bestätigen: Arbeitest du heute?",
      "Angebot oder Bitte mit Modalverb: Kannst du mir helfen?",
      "Alternative mit oder: Trinkst du Tee oder Kaffee?",
    ],
    wordOrder: [
      "Das finite Verb steht an Position 1; trennbare Bestandteile oder Infinitive bleiben am Ende.",
      "Beispiel Satzklammer: Kannst du morgen kommen? Rufst du mich später an?",
    ],
    specialCases: [
      "Eine Aussage kann durch steigende Intonation zur Rückfrage werden, die neutrale Standardfrage nutzt aber Verb-Erst-Stellung.",
      "Doch widerspricht einer negativ formulierten Frage: Kommst du nicht? - Doch, ich komme.",
    ],
    memoryTip: "Für die Entscheidungsfrage springt das Verb vor das Subjekt.",
  },
  "bestimmter und unbestimmter Artikel": {
    overview:
      "Artikel zeigen Genus, Numerus und Kasus eines Nomens. Der bestimmte Artikel bezeichnet etwas Identifiziertes; der unbestimmte Artikel führt etwas Neues oder nicht näher Bestimmtes ein.",
    formation: [
      "Nominativ bestimmt: der Mann, die Frau, das Kind, die Kinder.",
      "Nominativ unbestimmt: ein Mann, eine Frau, ein Kind; im Plural gibt es keinen unbestimmten Artikel.",
      "Nomen und Artikel werden als Einheit gelernt: immer der Tisch, die Lampe, das Fenster.",
    ],
    usage: [
      "Neu: Dort ist ein Hund. Bekannt: Der Hund ist freundlich.",
      "Einzig oder aus dem Kontext klar: die Sonne, die Lehrerin unseres Kurses.",
      "Ohne Artikel bei Berufen nach sein, Sprachen und vielen Stoffnamen: Sie ist Ärztin. Er spricht Deutsch.",
    ],
    wordOrder: [
      "Der Artikel steht vor Nomen und vor attributivem Adjektiv: ein interessantes Buch.",
      "Weitere Angaben folgen der Nomengruppe: das Buch auf dem Tisch.",
    ],
    specialCases: [
      "Das Genus ist nicht zuverlässig an der Bedeutung erkennbar und muss mitgelernt werden.",
      "Ein- hat keine eigene Pluralform; Plural wird ohne Artikel oder mit andere/keine/meine ausgedrückt.",
    ],
    memoryTip: "Speichere nie nur Buch, sondern immer das Buch - Bücher.",
  },
  Pluralformen: {
    overview:
      "Deutsch bildet den Plural mit mehreren Endungen und manchmal mit Umlaut. Es gibt keine einzige Regel, deshalb gehört die Pluralform zum Lernpaket jedes Nomens.",
    formation: [
      "Häufige Muster: -e (Tage), -er (Kinder), -(e)n (Frauen), -s (Autos) oder keine Endung (Lehrer).",
      "Umlaut kann zusätzlich auftreten: der Apfel → die Äpfel; das Buch → die Bücher.",
      "Alle Pluralnomen haben im Nominativ den Artikel die.",
    ],
    usage: [
      "Der Plural nennt mehrere zählbare Personen oder Dinge.",
      "Nach Zahlen steht normalerweise kein Artikel: drei Bücher.",
      "Nicht zählbare Nomen werden meist im Singular gebraucht: Wasser, Musik, Information im abstrakten Sinn.",
    ],
    wordOrder: [
      "Plural verändert die Verbkongruenz: Das Kind spielt. Die Kinder spielen.",
      "Adjektive und Pronomen müssen ebenfalls zum Plural passen.",
    ],
    specialCases: [
      "Fremdwörter haben häufig -s, feminine Nomen häufig -(e)n.",
      "Einige Formen ändern ihre Bedeutung: die Wörter sind einzelne Wörter; die Worte sind zusammenhängende Äußerungen.",
    ],
    memoryTip: "Lerne jedes Nomen dreiteilig: Artikel + Singular + Plural.",
  },
  Akkusativ: {
    overview:
      "Der Akkusativ markiert häufig das direkte Objekt - die Person oder Sache, auf die eine Handlung unmittelbar gerichtet ist. Nur maskuline Artikel ändern sich im einfachen Nominativ-Akkusativ-Kontrast sichtbar.",
    formation: [
      "Bestimmt: den Mann, die Frau, das Kind, die Kinder.",
      "Unbestimmt: einen Mann, eine Frau, ein Kind; Negativartikel: keinen Mann.",
      "Personalpronomen: mich, dich, ihn, sie, es, uns, euch, sie/Sie.",
    ],
    usage: [
      "Nach transitiven Verben wie haben, brauchen, sehen, kaufen, besuchen oder fragen.",
      "Nach es gibt steht immer Akkusativ: Es gibt einen freien Platz.",
      "Nach Akkusativpräpositionen wie durch, für, gegen, ohne und um.",
    ],
    wordOrder: [
      "Das Objekt steht häufig nach dem Verb: Ich kaufe den Mantel.",
      "Pronomen stehen meist früher als Nomen: Ich kaufe ihn heute. Bei zwei Pronomen steht Akkusativ gewöhnlich vor Dativ: Ich gebe es ihm.",
    ],
    specialCases: [
      "Einige Verben, die semantisch ähnlich wirken, verlangen keinen Akkusativ, etwa helfen + Dativ.",
      "Bei Richtung mit Wechselpräpositionen steht Akkusativ: Ich gehe in die Küche.",
    ],
    memoryTip:
      "Frage wen oder was? und achte besonders auf der → den sowie ein → einen.",
  },
  Possessivartikel: {
    overview:
      "Possessivartikel zeigen Zugehörigkeit. Ihre Endung richtet sich nach dem folgenden Nomen, während der Stamm die besitzende Person bezeichnet.",
    formation: [
      "Stämme: mein-, dein-, sein-, ihr-, unser-, euer-, ihr-/Ihr-.",
      "Nominativ folgt dem ein-Muster: mein Bruder, meine Schwester, mein Kind, meine Freunde.",
      "Euer verliert häufig ein e vor einer Endung: eure Mutter, euren Vater.",
    ],
    usage: [
      "Besitz: Das ist mein Laptop.",
      "Beziehungen: Ihre Schwester wohnt in Köln.",
      "Körperteile und persönliche Bereiche: Ich wasche meine Hände.",
    ],
    wordOrder: [
      "Der Possessivartikel steht an der Artikelposition vor Adjektiv und Nomen.",
      "Er kann nicht gleichzeitig mit einem bestimmten Artikel stehen: mein Buch, nicht das mein Buch.",
    ],
    specialCases: [
      "Sein- bezieht sich auf einen männlichen oder neutralen Besitzer; ihr- auf eine weibliche Besitzerin oder mehrere Besitzer.",
      "Formelles Ihr- wird großgeschrieben: Ist das Ihre Tasche?",
    ],
    memoryTip:
      "Zuerst Besitzer wählen, dann die Endung nach dem besessenen Nomen setzen.",
  },
  "nicht und kein": {
    overview:
      "Nicht negiert Verben, Adjektive, Adverbien, Präpositionalgruppen oder eine ganze Aussage. Kein negiert ein Nomen, das sonst mit ein/eine oder ohne Artikel stehen würde.",
    formation: [
      "Kein wird wie ein dekliniert: kein Mann, keine Frau, kein Kind, keine Kinder; Akkusativ: keinen Mann.",
      "Nicht bleibt unverändert.",
      "Mit bestimmtem Artikel oder Possessivartikel verwendet man nicht: nicht der Bus, nicht mein Buch.",
    ],
    usage: [
      "Kein + Nomen: Ich habe kein Auto.",
      "Nicht + Eigenschaft/Umstand: Das ist nicht teuer. Er fährt nicht schnell.",
      "Kontrastive Negation steht direkt vor dem korrigierten Teil: nicht heute, sondern morgen.",
    ],
    wordOrder: [
      "Bei Satznegation steht nicht meist spät, aber vor einem rechten Verbteil: Ich rufe heute nicht an.",
      "Nicht steht vor Adjektiven, Adverbien und Präpositionalgruppen, die es gezielt negiert.",
    ],
    specialCases: [
      "Nullartikel wird mit kein negiert: Ich trinke Kaffee → Ich trinke keinen Kaffee.",
      "Nicht ein kann einen starken Kontrast ausdrücken, ist aber nicht die neutrale Nominalnegation.",
    ],
    memoryTip:
      "Kannst du ein/eine einsetzen? Dann passt meist kein. Sonst nimm nicht.",
  },
  "Modalverb können": {
    overview:
      "Können drückt Fähigkeit, Möglichkeit oder eine höfliche Bitte aus. Es bildet mit einem zweiten Verb eine Satzklammer.",
    formation: [
      "ich kann, du kannst, er/sie/es kann, wir können, ihr könnt, sie/Sie können",
      "Das Inhaltsverb steht als Infinitiv ohne zu am Satzende: Ich kann gut schwimmen.",
      "Im Singular entfällt bei ich und er/sie/es die normale Endung.",
    ],
    usage: [
      "Fähigkeit: Sie kann Deutsch sprechen.",
      "Möglichkeit: Wir können morgen kommen.",
      "Bitte oder Erlaubnisfrage: Kannst du das wiederholen? Kann ich hier sitzen?",
    ],
    wordOrder: [
      "Hauptsatz: finites Modalverb an Position 2, Infinitiv am Ende.",
      "Frage: Modalverb an Position 1, Infinitiv am Ende: Kann er heute arbeiten?",
    ],
    specialCases: [
      "Können und dürfen unterscheiden sich: können bezeichnet Fähigkeit/Möglichkeit, dürfen eine Erlaubnis.",
      "Wenn das Inhaltsverb aus dem Kontext klar ist, kann es entfallen: Ich kann das.",
    ],
    memoryTip:
      "Das Modalverb öffnet links die Klammer, der Infinitiv schließt sie rechts.",
  },
  "Trennbare Verben": {
    overview:
      "Trennbare Verben bestehen aus einem betonten Präfix und einem Verbstamm. Im einfachen Hauptsatz wird das Präfix abgetrennt; im Infinitiv und in vielen Nebensatzformen bleibt das Verb zusammen.",
    formation: [
      "Beispiele für trennbare Präfixe: ab-, an-, auf-, aus-, ein-, mit-, vor-, weg-, zu-, zurück-.",
      "anrufen → Ich rufe dich an. aufstehen → Du stehst früh auf.",
      "Im Infinitiv bleibt die Form zusammen: Ich möchte dich anrufen.",
    ],
    usage: [
      "Das Präfix verändert die Bedeutung des Grundverbs oft stark: stehen, aufstehen, verstehen.",
      "Die Betonung liegt bei trennbaren Verben auf dem Präfix: ANrufen.",
    ],
    wordOrder: [
      "Im Hauptsatz steht der finite Stamm an Position 2 und das Präfix am Satzende.",
      "In einer Ja/Nein-Frage steht der Stamm zuerst: Rufst du mich an?",
    ],
    specialCases: [
      "Untrennbare Präfixe wie be-, emp-, ent-, er-, ge-, miss-, ver-, zer- werden nicht abgetrennt und sind unbetont.",
      "Einige Präfixe können je nach Bedeutung trennbar oder untrennbar sein, etwa UMfahren versus umFAHren.",
    ],
    memoryTip: "Hör auf die Betonung: betontes Präfix trennt sich meistens.",
  },
  "lokale Präpositionen": {
    overview:
      "Lokale Präpositionen beschreiben Position, Ziel, Herkunft oder Weg. Die passende Präposition hängt sowohl von der räumlichen Beziehung als auch von der Bewegungsrichtung ab.",
    formation: [
      "Wo? häufig mit Dativ: in der Schule, auf dem Tisch, bei meiner Freundin.",
      "Wohin? bei Wechselpräpositionen mit Akkusativ: in die Schule, auf den Tisch.",
      "Woher? meist aus oder von + Dativ: aus der Schweiz, vom Arzt.",
    ],
    usage: [
      "in für Innenräume, Länder mit Artikel und abgegrenzte Bereiche.",
      "an für Kontakt an einer Grenze/Fläche; auf für Oberflächen, Veranstaltungen und manche öffentliche Orte.",
      "nach für Städte und Länder ohne Artikel; zu für Personen und funktionale Ziele.",
    ],
    wordOrder: [
      "Die Ortsangabe steht häufig nach Zeit und Art: Ich fahre morgen mit dem Zug nach Berlin.",
      "Als Vorfeld kann sie betont werden: In Berlin wohnt meine Schwester.",
    ],
    specialCases: [
      "Zu Hause bezeichnet den Ort, nach Hause die Richtung.",
      "Länder mit Artikel verwenden in + Akkusativ für die Richtung: in die Schweiz, in den Iran.",
      "Bei fester Verb-Präposition-Verbindung entscheidet das Verb, nicht die räumliche Logik.",
    ],
    memoryTip:
      "Stelle zuerst die Frage: Wo, wohin oder woher? Dann wähle Präposition und Kasus.",
  },
});
