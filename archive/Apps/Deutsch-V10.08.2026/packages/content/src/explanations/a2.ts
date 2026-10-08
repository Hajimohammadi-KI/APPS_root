import { defineExplanations } from "./schema";

export const a2Explanations = defineExplanations({
  "Perfekt mit haben": {
    overview:
      "Das Perfekt ist die häufigste Vergangenheitsform in Gesprächen. Die meisten Verben bilden es mit einer Präsensform von haben und dem Partizip II.",
    formation: [
      "haben konjugieren + Partizip II: Ich habe gearbeitet.",
      "Regelmäßig: ge- + Stamm + -t: machen → gemacht. Stämme auf -d/-t erhalten oft -et: arbeiten → gearbeitet.",
      "Unregelmäßig häufig ge- + veränderter Stamm + -en: schreiben → geschrieben.",
      "Verben auf -ieren und untrennbare Verben haben kein ge-: studiert, besucht, verstanden.",
    ],
    usage: [
      "Abgeschlossene Ereignisse in mündlicher Alltagssprache.",
      "Haben steht bei transitiven Verben, reflexiven Verben und den meisten Verben ohne Orts- oder Zustandswechsel.",
      "Mit Zeitangaben: Gestern habe ich lange gelernt.",
      "Ein abgeschlossenes Ereignis kann ein Ergebnis in der Gegenwart haben: Ich habe meinen Schlüssel verloren, deshalb kann ich nicht hinein.",
    ],
    wordOrder: [
      "Das Hilfsverb steht an Position 2, das Partizip am Satzende.",
      "Im Nebensatz stehen beide am Ende, das Hilfsverb zuletzt: ..., weil ich lange gelernt habe.",
    ],
    specialCases: [
      "Trennbare Verben setzen ge zwischen Präfix und Stamm: eingekauft, angerufen.",
      "Modalverben mit weiterem Infinitiv bilden meist den Ersatzinfinitiv: Ich habe arbeiten müssen.",
      "Ein Zustand, der mit seit begonnen hat und noch andauert, steht im Präsens: Ich wohne seit 2020 hier, nicht im Perfekt.",
    ],
    memoryTip:
      "Baue die Perfektklammer: links habe/hat, ganz rechts das Partizip.",
  },
  "Perfekt mit sein": {
    overview:
      "Eine kleinere Verbgruppe bildet das Perfekt mit sein. Dazu gehören vor allem intransitive Ortsveränderungen und Veränderungen eines Zustands.",
    formation: [
      "sein konjugieren + Partizip II: Ich bin gefahren. Sie ist eingeschlafen.",
      "Typische Bewegungsverben mit sein:",
      "Bewegungsverb: [[gehen]].",
      "Bewegungsverb: [[kommen]].",
      "Bewegungsverb: [[fahren]].",
      "Bewegungsverb: [[fliegen]].",
      "Bewegungsverb: [[laufen]].",
      "Bewegungsverb: [[reisen]].",
      "Typische Zustandswechsel mit sein:",
      "Zustandswechsel: [[aufstehen]].",
      "Zustandswechsel: [[einschlafen]].",
      "Zustandswechsel: [[aufwachen]].",
      "Zustandswechsel: [[sterben]].",
      "Zustandswechsel: [[wachsen]].",
    ],
    usage: [
      "Eine Person oder Sache wechselt tatsächlich Ort oder Zustand.",
      "Auch sein, bleiben und werden bilden das Perfekt mit sein:",
      "sein wird zu [[ist gewesen]].",
      "bleiben wird zu [[ist geblieben]].",
      "werden wird zu [[ist geworden]].",
    ],
    wordOrder: [
      "Hauptsatz: Heute bin ich früh aufgestanden.",
      "Nebensatz: ..., weil ich früh aufgestanden bin.",
    ],
    specialCases: [
      "Bei Bewegungsverben kann die Bedeutung entscheiden: Ich bin nach Hause gefahren, aber ich habe das Auto gefahren.",
      "Liegen, sitzen und stehen beschreiben im Standarddeutschen keinen Wechsel und bilden meist das Perfekt mit haben.",
    ],
    memoryTip:
      "Frage: Hat sich Ort oder Zustand wirklich verändert? Dann ist sein wahrscheinlich.",
  },
  "Präteritum von sein/haben/Modalverben": {
    overview:
      "Sein, haben und Modalverben stehen auch im gesprochenen Deutsch sehr häufig im Präteritum. Diese kurzen Formen vermeiden komplizierte Perfektkonstruktionen.",
    formation: [
      "Präteritum von sein:",
      "Pronomen ich passt zur Form [[war]].",
      "Pronomen du passt zur Form [[warst]].",
      "Pronomen er/sie/es passt zur Form [[war]].",
      "Pronomen wir passt zur Form [[waren]].",
      "Pronomen ihr passt zur Form [[wart]].",
      "Pronomen sie/Sie passt zur Form [[waren]].",
      "Präteritum von haben:",
      "Pronomen ich passt zur Form [[hatte]].",
      "Pronomen du passt zur Form [[hattest]].",
      "Pronomen er/sie/es passt zur Form [[hatte]].",
      "Pronomen wir passt zur Form [[hatten]].",
      "Pronomen ihr passt zur Form [[hattet]].",
      "Pronomen sie/Sie passt zur Form [[hatten]].",
      "Modalverben verlieren meist den Umlaut und erhalten -te:",
      "können wird zu [[konnte]].",
      "müssen wird zu [[musste]].",
      "dürfen wird zu [[durfte]].",
      "sollen wird zu [[sollte]].",
      "wollen wird zu [[wollte]].",
      "mögen wird ausnahmsweise zu [[mochte]].",
    ],
    usage: [
      "Zustand oder Besitz in der Vergangenheit: Ich war krank. Wir hatten keine Zeit.",
      "Vergangene Fähigkeit, Pflicht oder Absicht: Sie konnte nicht kommen.",
      "In Erzählungen und Berichten als Hintergrundinformation.",
    ],
    wordOrder: [
      "Die Präteritumform ist das einzige finite Verb und steht im Hauptsatz an Position 2.",
      "Mit Modalverb bleibt das Inhaltsverb am Ende: Ich musste gestern arbeiten.",
    ],
    specialCases: [
      "Das Perfekt ist möglich, aber oft schwerer: Ich habe arbeiten müssen.",
      "Mochte ohne Umlaut ist Vergangenheit von mögen; möchte mit Umlaut ist eine höfliche Konjunktivform.",
    ],
    memoryTip:
      "War, hatte, konnte: Diese drei Muster decken einen großen Teil gesprochener Vergangenheit ab.",
  },
  Dativ: {
    overview:
      "Der Dativ markiert häufig Empfänger, betroffene Person oder Bezugspunkt. Er folgt außerdem bestimmten Verben und Präpositionen.",
    formation: [
      "Bestimmter Artikel im Dativ:",
      "Maskulin: [[dem Mann]].",
      "Feminin: [[der Frau]].",
      "Neutrum: [[dem Kind]].",
      "Plural: [[den Kindern]].",
      "Unbestimmt: einem Mann, einer Frau, einem Kind; Plural: keinen Kindern.",
      "Personalpronomen im Dativ:",
      "Pronomen ich wird zu [[mir]].",
      "Pronomen du wird zu [[dir]].",
      "Pronomen er wird zu [[ihm]].",
      "Pronomen sie (Singular) wird zu [[ihr]].",
      "Pronomen es wird zu [[ihm]].",
      "Pronomen wir wird zu [[uns]].",
      "Pronomen ihr wird zu [[euch]].",
      "Pronomen sie/Sie (Plural) wird zu [[ihnen/Ihnen]].",
      "Pluralnomen erhalten meist zusätzlich -n, wenn sie nicht schon auf -n oder -s enden.",
    ],
    usage: [
      "Empfänger bei geben, zeigen, schicken: Ich gebe dem Kind das Buch.",
      "Der Dativ folgt auf bestimmte Verben:",
      "Dativverb: [[helfen]].",
      "Dativverb: [[danken]].",
      "Dativverb: [[gefallen]].",
      "Dativverb: [[gehören]].",
      "Dativverb: [[antworten]].",
      "Dativverb: [[folgen]].",
      "Feste Dativpräpositionen:",
      "Dativpräposition [[aus]].",
      "Dativpräposition [[außer]].",
      "Dativpräposition [[bei]].",
      "Dativpräposition [[mit]].",
      "Dativpräposition [[nach]].",
      "Dativpräposition [[seit]].",
      "Dativpräposition [[von]].",
      "Dativpräposition [[zu]].",
    ],
    wordOrder: [
      "Bei zwei Nomen steht der Dativ meist vor dem Akkusativ.",
      "Bei zwei Pronomen steht häufig Akkusativ vor Dativ: Ich gebe es ihm.",
    ],
    specialCases: [
      "Gefallen konstruiert anders als mögen: Das Buch gefällt mir.",
      "Dativbesitz ist umgangssprachlich möglich, standardsprachlich steht häufig Genitiv oder eine von-Gruppe.",
    ],
    memoryTip:
      "Dativ fragt wem? Merke außerdem: mit, nach, aus, zu, von, bei - verlangen Dativ.",
  },
  Wechselpräpositionen: {
    overview:
      "An, auf, hinter, in, neben, über, unter, vor und zwischen können Akkusativ oder Dativ regieren. Nicht Bewegung allein, sondern Zielrichtung gegenüber Position entscheidet.",
    formation: [
      "Wo? Position ohne Zielwechsel → Dativ: Das Bild hängt an der Wand.",
      "Wohin? Ziel oder Platzierung → Akkusativ: Ich hänge das Bild an die Wand.",
      "Kurzformen: an dem → am, in dem → im, in das → ins.",
    ],
    usage: [
      "Dativ beschreibt den Ort eines Geschehens.",
      "Akkusativ beschreibt das Ziel einer Orts- oder Positionsveränderung.",
      "Bei abstrakten festen Verbindungen muss die Rektion mitgelernt werden.",
    ],
    wordOrder: [
      "Die Präpositionalgruppe kann im Mittelfeld oder zur Betonung im Vorfeld stehen.",
      "Bei mehreren Angaben gilt als neutrale Tendenz Zeit vor Art vor Ort.",
    ],
    specialCases: [
      "Ich laufe im Park hat Dativ, obwohl Bewegung stattfindet: Der Park ist der Ort, nicht das Ziel.",
      "Ich laufe in den Park hat Akkusativ, weil die Grenze zum Park überschritten wird.",
    ],
    memoryTip:
      "Nicht fragen: Bewegung? Sondern: Wo findet sie statt oder wohin führt sie?",
  },
  "Modalverben müssen, dürfen, sollen, wollen": {
    overview:
      "Modalverben verändern die Aussage des Inhaltsverbs: müssen bezeichnet Notwendigkeit, dürfen Erlaubnis, sollen Auftrag oder Empfehlung und wollen Absicht.",
    formation: [
      "Singular oft ohne Endung und mit Stammwechsel: ich muss/darf/soll/will; du musst/darfst/sollst/willst.",
      "Plural: wir müssen/dürfen/sollen/wollen; ihr müsst/dürft/sollt/wollt.",
      "Das Inhaltsverb steht als Infinitiv ohne zu am Ende.",
    ],
    usage: [
      "müssen: objektive oder subjektive Notwendigkeit.",
      "dürfen: Erlaubnis; nicht dürfen bedeutet Verbot.",
      "sollen: Auftrag einer anderen Person, Norm oder Rat.",
      "wollen: eigener Plan oder starker Wunsch.",
    ],
    wordOrder: [
      "Finites Modalverb an Position 2, Infinitiv am Ende.",
      "Im Nebensatz steht das Modalverb nach dem Infinitiv: ..., weil ich arbeiten muss.",
    ],
    specialCases: [
      "Nicht müssen bedeutet keine Notwendigkeit, nicht ein Verbot.",
      "Möchten ist höflicher als wollen: Ich möchte einen Kaffee.",
    ],
    memoryTip:
      "Ordne die Quelle: muss = nötig, soll = Auftrag, darf = erlaubt, will = eigener Plan.",
  },
  "Komparativ und Superlativ": {
    overview:
      "Mit Komparativ und Superlativ werden Eigenschaften verglichen. Der Komparativ vergleicht zwei Größen; der Superlativ markiert den höchsten Grad.",
    formation: [
      "Komparativ meist Adjektiv + -er: schnell → schneller.",
      "Superlativ prädikativ: am + Adjektiv + -(e)sten: am schnellsten.",
      "Attributiv: der schnellste Zug; die Endung richtet sich zusätzlich nach Artikel, Kasus und Genus.",
      "Unregelmäßig: gut - besser - am besten; viel - mehr - am meisten; gern - lieber - am liebsten.",
    ],
    usage: [
      "Ungleichheit mit als: Lena ist größer als Mia.",
      "Gleichheit mit so ... wie: Mia ist so groß wie Ali.",
      "Superlativ innerhalb einer Gruppe: Er läuft am schnellsten.",
    ],
    wordOrder: [
      "Vergleichsgruppen mit als oder wie stehen häufig nach dem Vergleichsausdruck.",
      "Am-Superlative funktionieren wie prädikative Adjektive und bleiben unverändert.",
    ],
    specialCases: [
      "Viele einsilbige Adjektive erhalten Umlaut: alt - älter, groß - größer.",
      "Adjektive auf -el/-er können ein e verlieren: dunkel - dunkler, teuer - teurer.",
    ],
    memoryTip:
      "Mehr als, gleich wie: Diese Paarung verhindert den häufigsten Vergleichsfehler.",
  },
  "Nebensatz mit weil": {
    overview:
      "Weil leitet einen kausalen Nebensatz ein und nennt einen Grund. Der Nebensatz kann nach oder vor dem Hauptsatz stehen.",
    formation: [
      "weil + Subjekt + weitere Satzteile + finites Verb: ..., weil ich krank bin.",
      "Perfekt: ..., weil ich zu wenig geschlafen habe.",
      "Modalverb: ..., weil ich heute arbeiten muss.",
    ],
    usage: [
      "Antwort auf warum oder wieso.",
      "Begründung einer Handlung, Meinung oder Folge.",
    ],
    wordOrder: [
      "Das finite Verb steht im weil-Satz am Ende.",
      "Steht der Nebensatz zuerst, folgt im Hauptsatz sofort das finite Verb: Weil ich krank bin, bleibe ich zu Hause.",
    ],
    specialCases: [
      "Denn verbindet zwei Hauptsätze und verändert die Wortstellung nicht.",
      "Das Verb-zweit-Muster nach weil kommt umgangssprachlich vor, ist in Standardsprache und Prüfungen zu vermeiden.",
    ],
    memoryTip: "Weil schickt das konjugierte Verb ans Ende.",
  },
  "Nebensatz mit dass": {
    overview:
      "Ein dass-Satz gibt einen Gedanken, eine Aussage, Wahrnehmung oder Bewertung als Inhalt wieder. Er übernimmt im Gesamtsatz oft die Rolle eines Objekts.",
    formation: [
      "Hauptsatz + dass + Subjekt + Ergänzungen + finites Verb.",
      "Ich weiß, dass er heute kommt.",
      "Bei Perfekt oder Modalverb steht die gesamte Verbgruppe am Ende.",
    ],
    usage: [
      "Dass-Sätze folgen auf diese Verbgruppen:",
      "Verben des [[Sagens]].",
      "Verben des [[Denkens]].",
      "Verben des [[Wissens]].",
      "Verben des [[Hoffens]].",
      "Verben des [[Fühlens]].",
      "Nach unpersönlichen Bewertungen: Es ist wichtig, dass du kommst.",
      "Als Subjektsatz: Dass er kommt, freut mich.",
    ],
    wordOrder: [
      "Komma vor dem dass-Satz; finites Verb am Ende.",
      "Wenn der dass-Satz vorne steht, besetzt er Position 1 und der Hauptsatz beginnt mit dem Verb.",
    ],
    specialCases: [
      "Dass ist eine Konjunktion; das ist Artikel oder Pronomen. Probe: Dieses/welches passt nur bei das.",
      "Bei gleichem Subjekt ist manchmal ein Infinitivsatz mit zu stilistisch knapper.",
    ],
    memoryTip: "Dass verbindet Inhalte; das zeigt oder begleitet ein Nomen.",
  },
  "wenn und als": {
    overview:
      "Wenn und als leiten temporale Nebensätze ein. Als bezeichnet ein einmaliges Ereignis in der Vergangenheit; wenn bezeichnet Wiederholung, Gegenwart, Zukunft oder eine Bedingung.",
    formation: [
      "als + Nebensatz mit Verb am Ende: Als ich zehn war, ...",
      "wenn + Nebensatz mit Verb am Ende: Wenn ich Zeit habe, ...",
      "Bei wiederholter Vergangenheit signalisiert oft immer/jedes Mal die Wahl von wenn.",
    ],
    usage: [
      "als: einmaliger vergangener Zeitpunkt oder Zeitraum.",
      "wenn: wiederholte Ereignisse in jeder Zeit.",
      "wenn: Bedingung im Sinn von falls.",
    ],
    wordOrder: [
      "Nebensatz zuerst: Wenn es regnet, bleibe ich zu Hause.",
      "Hauptsatz zuerst: Ich bleibe zu Hause, wenn es regnet.",
    ],
    specialCases: [
      "Wann ist ein Fragewort oder leitet eine indirekte Zeitfrage ein: Weißt du, wann er kommt?",
      "Für eine abgeschlossene Handlung vor einer anderen kann im als-Satz Plusquamperfekt stehen.",
    ],
    memoryTip:
      "Einmal damals = als; immer, heute, morgen oder Bedingung = wenn.",
  },
  "Reflexive Verben": {
    overview:
      "Bei reflexiven Verben beziehen sich Subjekt und Reflexivpronomen auf dieselbe Person. Manche Verben sind immer reflexiv, andere ändern mit dem Reflexivpronomen ihre Bedeutung.",
    formation: [
      "Reflexivpronomen im Akkusativ:",
      "Pronomen ich wird zu [[mich]].",
      "Pronomen du wird zu [[dich]].",
      "Pronomen er/sie/es wird zu [[sich]].",
      "Pronomen wir wird zu [[uns]].",
      "Pronomen ihr wird zu [[euch]].",
      "Pronomen sie/Sie wird zu [[sich]].",
      "Dativ bei zusätzlichem Akkusativobjekt: Ich wasche mir die Hände.",
      "Infinitiv wird mit sich gelernt: sich freuen, sich interessieren, sich beeilen.",
    ],
    usage: [
      "Echte Reflexivität: Sie wäscht sich.",
      "Feste reflexive Bedeutung: Ich interessiere mich für Kunst.",
      "Reziprok im Plural: Wir treffen uns.",
    ],
    wordOrder: [
      "Das Reflexivpronomen steht im Hauptsatz gewöhnlich nah beim finiten Verb.",
      "Bei Inversion steht das Nomen-Subjekt oft vor sich, ein Pronomen-Subjekt dagegen davor: Heute wäscht sich der Mann; heute wäscht er sich.",
    ],
    specialCases: [
      "Die Präposition gehört bei vielen Verben fest dazu und bestimmt den Kasus.",
      "Körperteile stehen häufig mit bestimmtem Artikel und Dativpronomen.",
    ],
    memoryTip:
      "Lerne immer das ganze Paket: sich interessieren für + Akkusativ.",
  },
  "Adjektiv nach sein": {
    overview:
      "Nach sein, werden und bleiben wird ein Adjektiv prädikativ gebraucht. Es beschreibt das Subjekt und erhält keine Deklinationsendung.",
    formation: [
      "Subjekt + sein + Grundform: Der Kurs ist interessant.",
      "Plural bleibt gleich: Die Kurse sind interessant.",
      "Auch Komparativ und am-Superlativ bleiben prädikativ: Der Kurs ist besser/am besten.",
    ],
    usage: [
      "Eigenschaften: Das Zimmer ist hell.",
      "Zustände: Ich bin müde.",
      "Bewertungen und Vergleiche: Die Aufgabe ist schwierig.",
    ],
    wordOrder: [
      "Das Adjektiv steht im einfachen Satz nach dem Kopulaverb.",
      "Zusätze können folgen: Das Zimmer ist für zwei Personen zu klein.",
    ],
    specialCases: [
      "Vor einem Nomen braucht dasselbe Adjektiv eine Endung: ein interessantes Buch.",
      "Adverbial gebrauchte Adjektive bleiben ebenfalls unverändert: Er spricht langsam.",
    ],
    memoryTip: "Nach sein bleibt das Adjektiv rein - ohne Endung.",
  },
  "Zeitangaben und Wortstellung": {
    overview:
      "Zeitangaben beantworten wann, wie lange, seit wann oder wie oft. Im deutschen Hauptsatz bleibt das finite Verb auf Position 2, auch wenn die Zeitangabe den Satz eröffnet.",
    formation: [
      "Beispiele für Zeitpunkt-Angaben:",
      "Zeitpunkt: [[heute]].",
      "Zeitpunkt: [[am Montag]].",
      "Zeitpunkt: [[um acht Uhr]].",
      "Zeitpunkt: [[im Juli]].",
      "Dauer: zwei Stunden, den ganzen Tag; Beginn mit seit + Dativ.",
      "Neutrale Reihenfolge mehrerer Angaben: temporal - kausal - modal - lokal (TeKaMoLo).",
    ],
    usage: [
      "Eine Zeitangabe schafft den zeitlichen Rahmen der Aussage.",
      "Häufigkeitsadverbien:",
      "Häufigkeit: [[immer]].",
      "Häufigkeit: [[oft]].",
      "Häufigkeit: [[manchmal]].",
      "Häufigkeit: [[selten]].",
      "Häufigkeit: [[nie]].",
      "Seit mit Präsens für einen noch andauernden Zustand: Ich wohne seit 2020 hier.",
    ],
    wordOrder: [
      "Heute lerne ich zu Hause. Nicht: Heute ich lerne.",
      "Im Mittelfeld stehen kurze bekannte Angaben meist vor langen oder neuen Informationen.",
    ],
    specialCases: [
      "TeKaMoLo ist eine neutrale Tendenz, kein starres Gesetz; Betonung kann die Reihenfolge verändern.",
      "Uhrzeiten verwenden um, Tage am, Monate/Jahreszeiten im.",
    ],
    memoryTip: "Was auch auf Platz 1 steht: Das finite Verb behält Platz 2.",
  },
  "Indefinitpronomen man/jemand/niemand": {
    overview:
      "Indefinitpronomen sprechen über nicht näher bestimmte Personen. Man verallgemeinert, jemand bejaht die Existenz einer Person und niemand verneint sie.",
    formation: [
      "man steht nur im Nominativ und verlangt die 3. Person Singular.",
      "Kasusformen von man werden durch einen/einem ersetzt: Das betrifft einen. Das hilft einem.",
      "jemand/niemand: Akkusativ jemanden/niemanden, Dativ jemandem/niemandem; kurze Formen ohne Endung sind teilweise möglich.",
    ],
    usage: [
      "Allgemeine Regeln und Erfahrungen: In Deutschland trinkt man viel Kaffee.",
      "Unbekannte Person: Jemand wartet vor der Tür.",
      "Keine Person: Niemand hat angerufen.",
    ],
    wordOrder: [
      "Die Pronomen besetzen normale Subjekt- oder Objektpositionen.",
      "Bei man bleibt das Verb singular, auch wenn viele Menschen gemeint sind.",
    ],
    specialCases: [
      "Man wird kleingeschrieben; Mann bezeichnet eine männliche Person.",
      "Niemand ist bereits negativ: Standardsprachlich folgt keine zweite Negation.",
    ],
    memoryTip:
      "man = allgemein, jemand = mindestens eine Person, niemand = null Personen.",
  },
});
