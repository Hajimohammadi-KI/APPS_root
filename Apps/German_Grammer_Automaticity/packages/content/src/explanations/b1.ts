import { defineExplanations } from "./schema";

export const b1Explanations = defineExplanations({
  "Präteritum in Erzählungen": {
    overview:
      "Das Präteritum ist die typische Erzählzeit schriftlicher Berichte, Literatur und Nachrichten. Es präsentiert vergangene Ereignisse als zusammenhängende Handlungslinie.",
    formation: [
      "Regelmäßig: Stamm + -te + Personalendung: machte, machtest, machten.",
      "Stark: eigene Stammform, meist ohne -te: ging, kam, schrieb; Plural mit -en.",
      "Gemischt: Stammwechsel + -te: bringen → brachte, denken → dachte, wissen → wusste.",
    ],
    usage: [
      "Schriftliche Erzählung und Bericht: Plötzlich öffnete sich die Tür.",
      "Hintergrund und Zustände besonders mit sein, haben und Modalverben.",
      "Mündlich bleibt bei vielen Vollverben das Perfekt üblicher.",
    ],
    wordOrder: [
      "Die Präteritumform steht wie jedes finite Verb auf Position 2.",
      "Zeitliche Abfolge wird durch Adverbien wie zuerst, dann, danach und schließlich klar.",
    ],
    specialCases: [
      "Norddeutsche und formellere Varietäten nutzen das Präteritum mündlich häufiger.",
      "In einem zusammenhängenden Text sollte ein Tempuswechsel eine erkennbare Funktion haben.",
    ],
    memoryTip:
      "Perfekt erzählt im Gespräch; Präteritum trägt die schriftliche Handlungslinie.",
  },
  Plusquamperfekt: {
    overview:
      "Das Plusquamperfekt bezeichnet eine Handlung, die vor einem anderen vergangenen Zeitpunkt bereits abgeschlossen war. Es ordnet also zwei Vergangenheiten.",
    formation: [
      "Präteritum von haben/sein + Partizip II: hatte gelernt, war gegangen.",
      "Die Wahl von haben oder sein folgt denselben Regeln wie im Perfekt.",
      "Im Nebensatz steht das Hilfsverb zuletzt: ..., nachdem er gegangen war.",
    ],
    usage: [
      "Vorvergangenheit: Als ich ankam, hatte der Film schon begonnen.",
      "Erklärung eines vergangenen Ergebnisses oder Zustands.",
      "Häufig mit nachdem, bevor, als oder bereits/schon.",
    ],
    wordOrder: [
      "Hauptsatzklammer: hatte/war an Position 2, Partizip am Ende.",
      "Nachdem-Satz im Plusquamperfekt, nachfolgende Handlung oft im Präteritum oder Perfekt.",
    ],
    specialCases: [
      "Wenn die zeitliche Reihenfolge eindeutig ist, verwendet Alltagssprache manchmal zweimal Perfekt.",
      "Das Plusquamperfekt ist keine allgemein fernere Vergangenheit, sondern braucht einen vergangenen Bezugspunkt.",
    ],
    memoryTip:
      "Setze einen Punkt in der Vergangenheit; alles, was davor fertig war, steht im Plusquamperfekt.",
  },
  "Relativsätze Nominativ/Akkusativ": {
    overview:
      "Relativsätze beschreiben ein Bezugsnomen genauer. Das Relativpronomen übernimmt im Nebensatz eine Satzfunktion; Genus und Numerus kommen vom Bezugsnomen, der Kasus vom Relativsatz.",
    formation: [
      "Nominativ: der/die/das/die: Das ist der Mann, der hier arbeitet.",
      "Akkusativ: den/die/das/die: Das ist der Mann, den ich kenne.",
      "Relativsatz wird durch Kommas abgetrennt; das finite Verb steht am Ende.",
    ],
    usage: [
      "Nominativ, wenn das Relativpronomen Subjekt des Relativsatzes ist.",
      "Akkusativ, wenn ein anderes Subjekt vorhanden ist und das Verb ein direktes Objekt verlangt.",
      "Informationen verbinden, ohne das Nomen zu wiederholen.",
    ],
    wordOrder: [
      "Relativpronomen zuerst, Verb am Ende.",
      "Der Relativsatz steht gewöhnlich direkt nach seinem Bezugsnomen.",
    ],
    specialCases: [
      "Das Pronomen was folgt oft auf alles, nichts, etwas oder einen ganzen Satz.",
      "Wer ohne Bezugsnomen bedeutet die Person, die: Wer übt, verbessert sich.",
    ],
    memoryTip: "Genus vom Nomen, Kasus aus der Lücke im Relativsatz.",
  },
  "Relativsätze Dativ": {
    overview:
      "Ein Relativpronomen steht im Dativ, wenn das Verb oder eine Präposition im Relativsatz Dativ verlangt. Die Beziehung zum Bezugsnomen bestimmt weiterhin Genus und Numerus.",
    formation: [
      "dem für maskulin/neutrum, der für feminin, denen für Plural.",
      "Das ist die Kollegin, der ich helfe.",
      "Plural erhält denen, nicht den: die Leute, mit denen ich arbeite.",
    ],
    usage: [
      "Nach Dativverben: helfen, danken, gefallen, gehören, folgen.",
      "Nach Dativpräpositionen: mit dem, von der, bei denen.",
      "Für Empfänger: Der Mann, dem ich das Buch gebe, ...",
    ],
    wordOrder: [
      "Eine Präposition steht direkt vor dem Relativpronomen.",
      "Das finite Verb schließt den Relativsatz.",
    ],
    specialCases: [
      "Bei wo als umgangssprachlichem Ersatz geht die präzise Kasusinformation verloren; Standardsprache bevorzugt Präposition + Relativpronomen.",
      "Wessen ist Genitiv und gehört zu einem anderen Paradigma.",
    ],
    memoryTip:
      "Prüfe den isolierten Satz: Ich helfe dem Mann → der Mann, dem ich helfe.",
  },
  "Konjunktiv II mit würde": {
    overview:
      "Würde + Infinitiv bildet eine produktive Konjunktiv-II-Form für Irreales, Wünsche, höfliche Bitten und vorsichtige Vorschläge.",
    formation: [
      "würde, würdest, würde, würden, würdet, würden + Infinitiv am Ende.",
      "Wenn ich Zeit hätte, würde ich reisen.",
      "Der wenn-Satz kann entfallen: Ich würde gern mehr lesen.",
    ],
    usage: [
      "Irreale oder unwahrscheinliche Bedingung.",
      "Wunsch: Ich würde gern am Meer wohnen.",
      "Höflichkeit: Würden Sie mir bitte helfen?",
    ],
    wordOrder: [
      "Würde steht an Position 2, der Infinitiv am Ende.",
      "Im Nebensatz steht würde nach dem Infinitiv: ..., weil ich gern reisen würde.",
    ],
    specialCases: [
      "Bei sein, haben und Modalverben sind die einfachen Formen üblicher: wäre, hätte, könnte.",
      "Würde würde klingt schwerfällig; bei werden nutzt man möglichst eine andere Formulierung.",
    ],
    memoryTip: "Würde öffnet die Irrealis-Klammer, der Infinitiv schließt sie.",
  },
  "Konjunktiv II von sein/haben/Modalverben": {
    overview:
      "Die häufigsten Konjunktiv-II-Verben haben eigene kurze Formen. Sie wirken natürlicher als würde-Konstruktionen und tragen Bedeutung wie Möglichkeit, Wunsch oder Höflichkeit.",
    formation: [
      "sein → wäre; haben → hätte.",
      "können → könnte, müssen → müsste, dürfen → dürfte, sollen → sollte, mögen → möchte.",
      "Die Personalendungen folgen weitgehend -e, -est, -e, -en, -et, -en.",
    ],
    usage: [
      "Irreale Bedingung: Wenn ich Zeit hätte, wäre ich dabei.",
      "Höfliche Bitte oder Rat: Könnten Sie helfen? Du solltest mehr schlafen.",
      "Vermutung: Das dürfte stimmen.",
    ],
    wordOrder: [
      "Die finite Konjunktivform steht im Hauptsatz an Position 2.",
      "Mit Inhaltsverb bildet das Modalverb die Satzklammer: Ich könnte morgen kommen.",
    ],
    specialCases: [
      "Sollte kann Rat, schwache Bedingung oder unerwarteten Fall ausdrücken.",
      "Müsste kann Notwendigkeit oder vorsichtige Schlussfolgerung bedeuten.",
    ],
    memoryTip:
      "Umlaut signalisiert oft Abstand zur Wirklichkeit: war → wäre, hatte → hätte, konnte → könnte.",
  },
  "Passiv Präsens": {
    overview:
      "Das Vorgangspassiv stellt Handlung oder Prozess in den Mittelpunkt. Der Handelnde ist unwichtig, unbekannt oder wird mit von/durch ergänzt.",
    formation: [
      "werden im Präsens + Partizip II: Das Paket wird geliefert.",
      "Das Akkusativobjekt des Aktivsatzes wird zum Nominativsubjekt.",
      "Handelnde Person mit von + Dativ; Mittel oder Ursache oft mit durch + Akkusativ.",
    ],
    usage: [
      "Prozesse und Anweisungen: Die Daten werden gespeichert.",
      "Sachliche Texte, wenn die Handlung wichtiger als der Akteur ist.",
      "Akteur kann genannt werden: Das Haus wird von einer Firma gebaut.",
    ],
    wordOrder: [
      "Werden steht an Position 2, Partizip II am Satzende.",
      "Nebensatz: ..., weil das Paket heute geliefert wird.",
    ],
    specialCases: [
      "Nicht jedes Verb ist passivfähig; haben, besitzen und viele Zustandsverben bilden normalerweise kein Vorgangspassiv.",
      "Man-Sätze sind oft eine natürlichere aktive Alternative.",
    ],
    memoryTip: "Aktiv fragt wer handelt; Passiv fragt was geschieht.",
  },
  "Passiv Präteritum und Perfekt": {
    overview:
      "Vergangenes Vorgangspassiv wird im Präteritum mit wurde und im Perfekt mit ist ... worden gebildet. Beide beschreiben einen abgeschlossenen oder vergangenen Prozess.",
    formation: [
      "Präteritum: wurde/wurden + Partizip II: Die Straße wurde gesperrt.",
      "Perfekt: ist/sind + Partizip II + worden: Die Straße ist gesperrt worden.",
      "Worden ist das Passivpartizip von werden; geworden bezeichnet meist eine Zustandsveränderung.",
    ],
    usage: [
      "Präteritum besonders in schriftlichen Berichten und Nachrichten.",
      "Perfekt besonders in mündlicher Rückschau.",
      "Plusquamperfekt passiv: war + Partizip II + worden.",
    ],
    wordOrder: [
      "Präteritumsklammer: wurde an Position 2, Partizip am Ende.",
      "Im Perfekt stehen Partizip II und worden am Ende; im Nebensatz folgt danach ist/war.",
    ],
    specialCases: [
      "Nicht verwechseln: Die Tür ist geschlossen worden = Vorgang; die Tür ist geschlossen = Zustand.",
      "Das Agens bleibt optional und wird wie im Präsens mit von oder durch ergänzt.",
    ],
    memoryTip: "Passiv-Perfekt endet auf Partizip + worden, niemals geworden.",
  },
  "Infinitiv mit zu": {
    overview:
      "Ein Infinitivsatz mit zu ergänzt ein Verb, Adjektiv oder Nomen, ohne ein eigenes ausgesprochenes Subjekt zu wiederholen. Das gedachte Subjekt ist meist aus dem Hauptsatz ableitbar.",
    formation: [
      "zu + Infinitiv am Ende: Ich versuche, früher zu kommen.",
      "Bei trennbaren Verben steht zu zwischen Präfix und Stamm: anzurufen.",
      "Bei Modalverben sowie lassen, sehen, hören und gehen steht normalerweise kein zu.",
    ],
    usage: [
      "Nach versuchen, planen, hoffen, vergessen, versprechen und ähnlichen Verben.",
      "Nach Adjektiven: Es ist wichtig, genug zu schlafen.",
      "Nach Nomen: Ich habe den Wunsch, im Ausland zu studieren.",
    ],
    wordOrder: [
      "Die Infinitivgruppe steht häufig im Nachfeld und endet mit dem Infinitiv.",
      "Ein Komma ist bei um/ohne/anstatt, bei Bezugsnomen und zur Verdeutlichung erforderlich oder sinnvoll.",
    ],
    specialCases: [
      "Bei verschiedenem Subjekt braucht man meist einen dass-Satz.",
      "Perfektinfinitiv: gearbeitet zu haben, gegangen zu sein.",
    ],
    memoryTip:
      "Gleiches gedachtes Subjekt? Dann ist zu + Infinitiv oft die kompakte Lösung.",
  },
  "um...zu / damit": {
    overview:
      "Um ... zu und damit drücken ein Ziel oder einen Zweck aus. Um ... zu ist möglich, wenn Haupt- und Infinitivhandlung denselben Handelnden haben; damit erlaubt unterschiedliche Subjekte.",
    formation: [
      "um + Ergänzungen + zu + Infinitiv: Ich lerne, um die Prüfung zu bestehen.",
      "damit + Nebensatz mit finitem Verb am Ende: Ich spreche langsam, damit du mich verstehst.",
      "Bei trennbaren Verben: um früh aufzustehen.",
    ],
    usage: [
      "Absicht einer Handlung.",
      "Um ... zu für identische Subjekte und knappe Formulierung.",
      "Damit für verschiedene Subjekte oder wenn das Subjekt ausdrücklich genannt werden soll.",
    ],
    wordOrder: [
      "Beide Konstruktionen werden mit Komma abgetrennt.",
      "Um ... zu endet mit Infinitiv; damit endet mit finitem Verb.",
    ],
    specialCases: [
      "Zum + nominalisierter Infinitiv kann denselben Zweck sehr knapp ausdrücken: zum Lernen.",
      "Nicht jeder Folgesatz ist ein Zweck; sodass beschreibt eine Folge, nicht eine Absicht.",
    ],
    memoryTip: "Gleiches Subjekt = um ... zu; neues Subjekt = damit.",
  },
  "obwohl/trotzdem": {
    overview:
      "Obwohl und trotzdem markieren einen Gegensatz zwischen Erwartung und Ergebnis. Obwohl leitet einen Nebensatz ein; trotzdem ist ein Satzadverb in einem Hauptsatz.",
    formation: [
      "obwohl + Nebensatz mit Verb am Ende.",
      "trotzdem + Hauptsatz mit Verb auf Position 2.",
      "Obwohl es regnet, gehen wir. Es regnet; trotzdem gehen wir.",
    ],
    usage: [
      "Konzession: Ein Umstand verhindert die Handlung entgegen der Erwartung nicht.",
      "Obwohl verbindet den Gegenumstand syntaktisch untergeordnet.",
      "Trotzdem verweist selbstständig auf die vorherige Aussage.",
    ],
    wordOrder: [
      "Nach vorangestelltem obwohl-Satz folgt das Hauptsatzverb direkt.",
      "Steht trotzdem im Vorfeld, folgt sofort das Verb: Trotzdem gehen wir.",
    ],
    specialCases: [
      "Obwohl und aber sollten denselben Gegensatz nicht doppelt markieren.",
      "Trotz + Genitiv/Dativ ist die präpositionale Alternative: trotz des Regens.",
    ],
    memoryTip:
      "Obwohl schickt das Verb ans Ende; trotzdem hält das Verb auf Platz 2.",
  },
  Genitivgrundlagen: {
    overview:
      "Der Genitiv markiert Zugehörigkeit, Teil-Ganzes-Beziehungen und formelle Präpositionalergänzungen. In der Alltagssprache wird er teilweise durch von + Dativ ersetzt.",
    formation: [
      "Bestimmt: des Mannes, der Frau, des Kindes, der Kinder.",
      "Maskuline und neutrale Nomen erhalten meist -(e)s.",
      "Unbestimmt: eines Mannes, einer Frau, eines Kindes.",
    ],
    usage: [
      "Attribut: das Fahrrad meines Bruders.",
      "Eigennamen oft vorangestellt ohne Artikel: Annas Fahrrad.",
      "Nach Präpositionen wie trotz, während, wegen und innerhalb in formeller Standardsprache.",
    ],
    wordOrder: [
      "Das Genitivattribut steht gewöhnlich nach dem Bezugsnomen.",
      "Vorangestellte Eigennamen erhalten im Schriftbild direkt -s ohne Apostroph.",
    ],
    specialCases: [
      "Apostroph nur bei Namen, die bereits auf s-Laut enden: Max' Fahrrad.",
      "Schwache maskuline Nomen erhalten -en statt -s: des Studenten.",
    ],
    memoryTip:
      "Des und eines rufen bei Maskulinum und Neutrum fast immer ein zusätzliches -(e)s am Nomen.",
  },
  "Adjektivdeklination Grundlagen": {
    overview:
      "Ein Adjektiv vor einem Nomen trägt eine Endung. Sie zeigt gemeinsam mit Artikel und Nomen Genus, Numerus und Kasus.",
    formation: [
      "Nach bestimmtem Artikel meist schwach: der gute Film, den guten Film, die gute Idee.",
      "Nach ein-Wörtern gemischt: ein guter Film, einen guten Film, eine gute Idee.",
      "Ohne Artikel stark: guter Kaffee, frisches Brot, mit kaltem Wasser.",
    ],
    usage: [
      "Nur attributive Adjektive werden dekliniert.",
      "Prädikativ und adverbial bleiben sie unverändert: Der Film ist gut. Er spricht leise.",
    ],
    wordOrder: [
      "Artikel + Adjektiv + Nomen bildet eine Nomengruppe.",
      "Mehrere gleichrangige Adjektive tragen dieselbe Endungslogik.",
    ],
    specialCases: [
      "Die Endung -en dominiert nach bestimmten Artikeln in allen Formen außer fünf Nominativ/Akkusativ-Grundformen.",
      "Viel, wenig und einige können je nach Gebrauch artikelähnlich oder adjektivisch wirken.",
    ],
    memoryTip:
      "Zeigt der Artikel die Kasusinformation klar, trägt das Adjektiv meist nur -e oder -en.",
  },
  "indirekte Fragen": {
    overview:
      "Indirekte Fragen betten eine Frage als Nebensatz ein. Sie klingen höflicher und können als Objekt nach Verben wie wissen, fragen oder erklären stehen.",
    formation: [
      "W-Frage: Ich weiß nicht, wann der Zug kommt.",
      "Ja/Nein-Frage mit ob: Weißt du, ob der Zug kommt?",
      "Das finite Verb steht am Ende; kein Fragezeichen, wenn der Gesamtsatz eine Aussage ist.",
    ],
    usage: [
      "Höfliche Informationsfrage: Können Sie mir sagen, wo der Bahnhof ist?",
      "Unsicherheit oder Wissen: Ich frage mich, warum er fehlt.",
      "Wiedergabe einer offenen oder geschlossenen Frage.",
    ],
    wordOrder: [
      "Fragewort/ob eröffnet den Nebensatz, Verb am Ende.",
      "Die direkte Inversion entfällt: wo der Bahnhof ist, nicht wo ist der Bahnhof.",
    ],
    specialCases: [
      "Ob bedeutet whether, nicht falls in jeder Bedingung.",
      "Bei Präpositionsfragen bleibt die Präposition erhalten: Ich weiß nicht, mit wem sie spricht.",
    ],
    memoryTip:
      "Die Frage steckt im Satz; deshalb verhält sie sich grammatisch wie ein Nebensatz.",
  },
});
