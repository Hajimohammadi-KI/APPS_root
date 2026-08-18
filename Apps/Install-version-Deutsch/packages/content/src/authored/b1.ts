// Phase 1 Autorierung für B1. Gleicher Vertrag wie authored/a1.ts.

import type { AuthoredUnit } from "./a1";

export const B1_AUTHORED: Readonly<Record<string, AuthoredUnit>> = {
  "Präteritum in Erzählungen": {
    examples: [
      { sentence: "Er öffnete die Tür und ging hinaus.", target: "öffnete" },
      { sentence: "Sie kam spät nach Hause.", target: "kam" },
      { sentence: "Wir fuhren mit dem Zug nach Wien.", target: "fuhren" },
      { sentence: "Er sah sie zum ersten Mal.", target: "sah" },
      { sentence: "Sie schrieb einen langen Brief.", target: "schrieb" },
      { sentence: "Das Kind lachte laut.", target: "lachte" },
      { sentence: "Er verließ die Stadt für immer.", target: "verließ" },
      { sentence: "Sie fanden das Haus schnell.", target: "fanden" },
    ],
    transfer: "Sie öffnete das Fenster und sah die ersten Schneeflocken fallen.",
  },

  Plusquamperfekt: {
    examples: [
      { sentence: "Nachdem ich gegessen hatte, ging ich spazieren.", target: "hatte" },
      { sentence: "Er war schon angekommen, als wir riefen.", target: "war" },
      { sentence: "Sie hatte den Brief schon geschrieben.", target: "hatte" },
      { sentence: "Wir waren schon eingeschlafen.", target: "waren" },
      { sentence: "Nachdem sie gearbeitet hatte, ruhte sie sich aus.", target: "hatte" },
      { sentence: "Er hatte die Prüfung bestanden, bevor er umzog.", target: "hatte" },
      { sentence: "Ich war schon weg, als du anriefst.", target: "war" },
      { sentence: "Sie hatten das Projekt schon beendet.", target: "hatten" },
    ],
    transfer: "Nachdem wir das Haus verkauft hatten, zogen wir in eine kleinere Wohnung.",
  },

  "Relativsätze Nominativ/Akkusativ Vertiefung": {
    examples: [
      // Zielwort auf das Relativpronomen verkürzt statt den ganzen
      // Nebensatz -- genau der Nominativ/Akkusativ-Kontrast, den die
      // Einheit lehrt -- sonst maskierten beide Sätze zu identischem
      // "Das ist der Mann, ___.". "der" allein wäre zusätzlich falsch: das
      // Wort kommt im ersten Satz zweimal vor (Artikel "der Mann" UND
      // Relativpronomen), und ein Ersetzungsaufruf ohne "g"-Flag träfe
      // immer nur das ERSTE Vorkommen -- den Artikel, nicht das
      // Relativpronomen. "der mir" ist im Satz eindeutig.
      { sentence: "Das ist der Mann, der mir hilft.", target: "der mir" },
      { sentence: "Das ist der Mann, den ich sehe.", target: "den" },
      { sentence: "Die Frau, die dort steht, ist Ärztin.", target: "die dort steht" },
      { sentence: "Die Frau, die ich kenne, wohnt hier.", target: "die ich kenne" },
      { sentence: "Das Buch, das interessant ist, liegt hier.", target: "das interessant ist" },
      { sentence: "Das Buch, das ich lese, ist spannend.", target: "das ich lese" },
      { sentence: "Der Kollege, der uns unterstützt, ist neu.", target: "der uns unterstützt" },
      { sentence: "Der Kollege, den wir suchen, ist krank.", target: "den wir suchen" },
    ],
    transfer: "Das ist der Kollege, den ich gestern getroffen habe und der mir sehr geholfen hat.",
  },

  "Relativsätze Dativ": {
    examples: [
      { sentence: "Die Frau, mit der ich spreche, ist Ärztin.", target: "mit der ich spreche" },
      { sentence: "Der Mann, dem ich helfe, ist mein Nachbar.", target: "dem ich helfe" },
      { sentence: "Das Kind, dem sie vorliest, schläft ein.", target: "dem sie vorliest" },
      { sentence: "Die Kollegen, denen ich vertraue, sind ehrlich.", target: "denen ich vertraue" },
      { sentence: "Der Freund, dem ich schreibe, wohnt in Wien.", target: "dem ich schreibe" },
      { sentence: "Die Freundin, mit der ich rede, versteht mich.", target: "mit der ich rede" },
      { sentence: "Der Chef, dem ich berichte, ist streng.", target: "dem ich berichte" },
      { sentence: "Die Nachbarn, denen ich danke, sind hilfsbereit.", target: "denen ich danke" },
    ],
    transfer: "Das ist die Ärztin, der ich am meisten vertraue, weil sie immer ehrlich ist.",
  },

  "Konjunktiv II mit würde": {
    examples: [
      { sentence: "Ich würde gern mehr sprechen.", target: "würde" },
      { sentence: "Sie würde das nicht machen.", target: "würde" },
      { sentence: "Wir würden gern kommen.", target: "würden" },
      { sentence: "Er würde das Auto kaufen.", target: "würde" },
      { sentence: "Würdest du mir helfen?", target: "Würdest" },
      { sentence: "Ich würde das anders lösen.", target: "würde" },
      { sentence: "Sie würden das gern besuchen.", target: "würden" },
      { sentence: "Würdet ihr uns begleiten?", target: "Würdet" },
    ],
    transfer: "An deiner Stelle würde ich zuerst mit dem Chef sprechen.",
  },

  "Konjunktiv II von sein/haben/Modalverben": {
    examples: [
      { sentence: "Wenn ich Zeit hätte, könnte ich kommen.", target: "hätte" },
      { sentence: "Wenn ich mehr wüsste, könnte ich besser helfen.", target: "könnte" },
      { sentence: "Wäre er hier, würde er helfen.", target: "Wäre" },
      { sentence: "Ich müsste eigentlich früher gehen.", target: "müsste" },
      { sentence: "Sie könnte das besser erklären.", target: "könnte" },
      { sentence: "Wenn ich reich wäre, würde ich reisen.", target: "wäre" },
      { sentence: "Das dürfte richtig sein.", target: "dürfte" },
      { sentence: "Wir hätten gern mehr Zeit.", target: "hätten" },
    ],
    transfer: "Wenn ich mehr Zeit hätte, könnte ich jeden Tag eine Stunde lernen.",
  },

  "Passiv Präsens": {
    examples: [
      { sentence: "Das Haus wird gebaut.", target: "wird" },
      { sentence: "Die Aufgabe wird korrigiert.", target: "wird" },
      { sentence: "Die Türen werden geschlossen.", target: "werden" },
      { sentence: "Der Bericht wird geschrieben.", target: "wird" },
      { sentence: "Die Fenster werden geputzt.", target: "werden" },
      { sentence: "Das Essen wird serviert.", target: "wird" },
      { sentence: "Die Regeln werden erklärt.", target: "werden" },
      { sentence: "Der Fehler wird korrigiert.", target: "wird" },
    ],
    transfer: "Das neue Gebäude wird nächstes Jahr gebaut und die Straße wird dann erneuert.",
  },

  "Passiv Präteritum und Perfekt": {
    examples: [
      { sentence: "Das Haus wurde gebaut.", target: "wurde" },
      { sentence: "Es ist gebaut worden.", target: "worden" },
      { sentence: "Die Aufgabe wurde korrigiert.", target: "wurde" },
      { sentence: "Der Bericht ist geschrieben worden.", target: "worden" },
      { sentence: "Das Fenster wurde geputzt.", target: "wurde" },
      { sentence: "Die Tür ist geschlossen worden.", target: "worden" },
      { sentence: "Die Regel wurde erklärt.", target: "wurde" },
      { sentence: "Das Projekt ist beendet worden.", target: "worden" },
    ],
    transfer: "Das Projekt wurde letztes Jahr begonnen und ist inzwischen abgeschlossen worden.",
  },

  "Infinitiv mit zu": {
    examples: [
      { sentence: "Ich versuche, früher aufzustehen.", target: "aufzustehen" },
      { sentence: "Es ist wichtig, pünktlich zu sein.", target: "zu sein" },
      { sentence: "Sie hat keine Zeit, zu antworten.", target: "zu antworten" },
      { sentence: "Er hofft, die Prüfung zu bestehen.", target: "zu bestehen" },
      { sentence: "Wir haben vor, umzuziehen.", target: "umzuziehen" },
      { sentence: "Es macht Spaß, Deutsch zu lernen.", target: "zu lernen" },
      { sentence: "Sie vergisst oft, anzurufen.", target: "anzurufen" },
      { sentence: "Ich habe die Absicht, zu bleiben.", target: "zu bleiben" },
    ],
    transfer: "Es ist mir wichtig, jeden Tag zu üben, ohne dabei die Motivation zu verlieren.",
  },

  "um...zu / damit": {
    examples: [
      { sentence: "Ich lerne, um die Prüfung zu bestehen.", target: "um die Prüfung zu bestehen" },
      { sentence: "Ich erkläre es, damit du es verstehst.", target: "damit du es verstehst" },
      { sentence: "Sie spart Geld, um ein Auto zu kaufen.", target: "um ein Auto zu kaufen" },
      { sentence: "Er schreibt es auf, damit er es nicht vergisst.", target: "damit er es nicht vergisst" },
      { sentence: "Wir üben täglich, um besser zu werden.", target: "um besser zu werden" },
      { sentence: "Ich rufe an, damit sie Bescheid weiß.", target: "damit sie Bescheid weiß" },
      { sentence: "Sie arbeitet viel, um erfolgreich zu sein.", target: "um erfolgreich zu sein" },
      { sentence: "Er zeigt es mir, damit ich es verstehe.", target: "damit ich es verstehe" },
    ],
    transfer: "Ich schreibe alles auf, damit ich nichts vergesse, und übe täglich, um besser zu werden.",
  },

  "obwohl/trotzdem": {
    examples: [
      { sentence: "Obwohl es regnet, gehe ich raus.", target: "Obwohl" },
      { sentence: "Es regnet; trotzdem gehe ich raus.", target: "trotzdem" },
      { sentence: "Obwohl er müde war, arbeitete er weiter.", target: "Obwohl" },
      { sentence: "Er war müde; trotzdem arbeitete er weiter.", target: "trotzdem" },
      { sentence: "Obwohl die Prüfung schwer war, bestand sie.", target: "Obwohl" },
      { sentence: "Die Prüfung war schwer; trotzdem bestand sie.", target: "trotzdem" },
      { sentence: "Obwohl wir wenig Zeit hatten, schafften wir es.", target: "Obwohl" },
      { sentence: "Wir hatten wenig Zeit; trotzdem schafften wir es.", target: "trotzdem" },
    ],
    transfer: "Obwohl das Wetter schlecht war, sind wir trotzdem spazieren gegangen.",
  },

  Genitivgrundlagen: {
    examples: [
      { sentence: "Das ist wegen des Wetters.", target: "des Wetters" },
      { sentence: "Das ist das Ende des Kurses.", target: "des Kurses" },
      { sentence: "Das ist die Farbe des Autos.", target: "des Autos" },
      { sentence: "Das ist der Name der Firma.", target: "der Firma" },
      { sentence: "Das ist das Haus meiner Eltern.", target: "meiner Eltern" },
      { sentence: "Das ist der Anfang des Buches.", target: "des Buches" },
      { sentence: "Das ist die Tür des Zimmers.", target: "des Zimmers" },
      { sentence: "Das ist der Preis der Wohnung.", target: "der Wohnung" },
    ],
    transfer: "Wegen des schlechten Wetters bleiben wir heute im Haus meiner Eltern.",
  },

  "Adjektivdeklination Wiederholung und Erweiterung": {
    examples: [
      { sentence: "Ich lese ein gutes Buch.", target: "gutes" },
      { sentence: "Das ist der gute Kurs.", target: "gute" },
      { sentence: "Ich lerne mit einem guten Lehrer.", target: "guten" },
      { sentence: "Sie trägt einen roten Mantel.", target: "roten" },
      { sentence: "Das ist eine schwierige Aufgabe.", target: "schwierige" },
      { sentence: "Wir kaufen frisches Brot.", target: "frisches" },
      { sentence: "Ich mag heißen Tee.", target: "heißen" },
      { sentence: "Das ist ein interessantes Thema.", target: "interessantes" },
    ],
    transfer: "Mit einem guten Lehrer und frischem Mut wird die schwierige Prüfung leichter.",
  },

  "indirekte Fragen": {
    examples: [
      { sentence: "Können Sie mir sagen, wann der Kurs beginnt?", target: "wann der Kurs beginnt" },
      // Zielwort auf das Fragewort verkürzt für die beiden Paare, die sich
      // sonst einen identischen Lückensatz teilten ("Ich weiß nicht, ___."
      // bzw. "Sie fragt, ___.").
      { sentence: "Ich weiß nicht, wo der Bahnhof ist.", target: "wo" },
      { sentence: "Sie fragt, wie viel das kostet.", target: "wie viel" },
      { sentence: "Wissen Sie, wer das gesagt hat?", target: "wer das gesagt hat" },
      { sentence: "Ich frage mich, warum er nicht kommt.", target: "warum er nicht kommt" },
      { sentence: "Können Sie erklären, wie das funktioniert?", target: "wie das funktioniert" },
      { sentence: "Ich weiß nicht, was er meint.", target: "was" },
      { sentence: "Sie fragt, wohin wir fahren.", target: "wohin" },
    ],
    transfer: "Können Sie mir bitte sagen, wo ich den nächsten Bus finde?",
  },

  "Adjektivdeklination vollständig": {
    examples: [
      { sentence: "Trotz des kalten Wetters besuchen wir den Markt.", target: "kalten" },
      { sentence: "Der neue Kurs beginnt am Montag.", target: "neue" },
      { sentence: "Ich brauche eine warme Decke.", target: "warme" },
      { sentence: "Das war ein langer Tag.", target: "langer" },
      { sentence: "Sie hat kurze Haare.", target: "kurze" },
      { sentence: "Das ist mein bester Freund.", target: "bester" },
      { sentence: "Wir wohnen in einer ruhigen Straße.", target: "ruhigen" },
      { sentence: "Das ist ein teures Auto.", target: "teures" },
    ],
    transfer: "Trotz des schlechten Wetters besuchen wir den neuen Markt in der ruhigen Altstadt.",
  },

  Pronominaladverbien: {
    examples: [
      { sentence: "Ich denke oft daran.", target: "daran" },
      { sentence: "An wen denkst du?", target: "An wen" },
      { sentence: "Ich freue mich darauf.", target: "darauf" },
      { sentence: "Davon habe ich schon gehört.", target: "Davon" },
      { sentence: "Damit bin ich einverstanden.", target: "Damit" },
      { sentence: "Für wen interessierst du dich?", target: "Für wen" },
      { sentence: "Darüber spreche ich gern.", target: "Darüber" },
      { sentence: "Mit wem hast du gesprochen?", target: "Mit wem" },
    ],
    transfer: "Darüber habe ich schon nachgedacht, aber an wen soll ich mich wenden?",
  },

  "Futur I für Prognosen und Vermutungen": {
    examples: [
      { sentence: "Sie wird wohl noch im Büro sein.", target: "wird" },
      { sentence: "Er wird morgen ankommen.", target: "wird" },
      { sentence: "Es wird wohl regnen.", target: "wird" },
      { sentence: "Das wird sicher gut funktionieren.", target: "wird" },
      { sentence: "Sie werden wohl schon schlafen.", target: "werden" },
      { sentence: "Der Kurs wird nächstes Jahr beginnen.", target: "wird" },
      { sentence: "Das wird wohl niemand bemerken.", target: "wird" },
      { sentence: "Wir werden bald eine Lösung finden.", target: "werden" },
    ],
    transfer: "Er wird die Prüfung wohl bestehen, denn er hat sehr viel gelernt.",
  },

  "Vorgangspassiv und Zustandspassiv": {
    examples: [
      { sentence: "Die Tür wird geöffnet.", target: "wird geöffnet" },
      { sentence: "Danach ist sie geöffnet.", target: "ist sie geöffnet" },
      { sentence: "Das Fenster wird geschlossen.", target: "wird geschlossen" },
      { sentence: "Jetzt ist es geschlossen.", target: "ist es geschlossen" },
      // "wird"-Zielwort verkürzt: die volle Prädikatsmaskierung ließ
      // "Der Brief ___." / "Das Zimmer ___." für beide Sätze des jeweiligen
      // Paares stehen, identisch mit der "ist"-Variante daneben.
      { sentence: "Der Brief wird geschrieben.", target: "wird" },
      { sentence: "Der Brief ist schon geschrieben.", target: "ist schon geschrieben" },
      { sentence: "Das Zimmer wird aufgeräumt.", target: "wird" },
      { sentence: "Das Zimmer ist aufgeräumt.", target: "ist aufgeräumt" },
    ],
    transfer: "Die Tür wird gerade geschlossen, und in ein paar Minuten ist sie geschlossen.",
  },

  "Temporalsätze mit bevor, nachdem und seitdem": {
    examples: [
      { sentence: "Nachdem ich gegessen hatte, ging ich spazieren.", target: "Nachdem" },
      { sentence: "Bevor ich gehe, räume ich noch auf.", target: "Bevor" },
      { sentence: "Seitdem sie umgezogen ist, sehen wir uns selten.", target: "Seitdem" },
      { sentence: "Bevor du fragst, sage ich es dir.", target: "Bevor" },
      { sentence: "Nachdem er angekommen war, rief er an.", target: "Nachdem" },
      { sentence: "Seitdem ich hier wohne, fühle ich mich zu Hause.", target: "Seitdem" },
      { sentence: "Bevor wir starten, prüfen wir alles.", target: "Bevor" },
      { sentence: "Nachdem sie gelernt hatte, machte sie eine Pause.", target: "Nachdem" },
    ],
    transfer: "Bevor ich schlafen gehe, lese ich noch, und nachdem ich gelesen habe, bin ich müde.",
  },

  "ohne zu und anstatt zu": {
    examples: [
      { sentence: "Er ging, ohne sich zu verabschieden.", target: "ohne sich zu verabschieden" },
      { sentence: "Sie half, ohne zu zögern.", target: "ohne zu zögern" },
      { sentence: "Anstatt zu arbeiten, ruhte er sich aus.", target: "Anstatt zu arbeiten" },
      { sentence: "Er antwortete, ohne nachzudenken.", target: "ohne nachzudenken" },
      { sentence: "Anstatt zu schlafen, lernte sie weiter.", target: "Anstatt zu schlafen" },
      { sentence: "Sie ging weg, ohne etwas zu sagen.", target: "ohne etwas zu sagen" },
      { sentence: "Anstatt zu telefonieren, schrieb er eine E-Mail.", target: "Anstatt zu telefonieren" },
      { sentence: "Er half, ohne gefragt zu werden.", target: "ohne gefragt zu werden" },
    ],
    transfer: "Anstatt sich zu beschweren, half sie sofort, ohne zu zögern.",
  },

  "lassen als Vollverb und Hilfsverb": {
    examples: [
      { sentence: "Ich lasse mein Fahrrad reparieren.", target: "lasse" },
      { sentence: "Sie lässt ihr Auto waschen.", target: "lässt" },
      { sentence: "Wir lassen die Kinder spielen.", target: "lassen" },
      { sentence: "Er lässt seine Tasche zu Hause.", target: "lässt" },
      { sentence: "Lass mich in Ruhe.", target: "Lass" },
      { sentence: "Sie lassen das Fenster offen.", target: "lassen" },
      { sentence: "Ich lasse den Brief schreiben.", target: "lasse" },
      { sentence: "Er lässt sich die Haare schneiden.", target: "lässt" },
    ],
    transfer: "Ich lasse mein Auto reparieren, aber ich lasse den Schlüssel bei dir.",
  },

  "brauchen nicht zu": {
    examples: [
      { sentence: "Du brauchst heute nicht zu kommen.", target: "brauchst" },
      { sentence: "Sie braucht nicht zu warten.", target: "braucht" },
      { sentence: "Ihr braucht nicht zu antworten.", target: "braucht" },
      { sentence: "Er braucht sich nicht zu beeilen.", target: "braucht" },
      { sentence: "Wir brauchen nicht zu bezahlen.", target: "brauchen" },
      { sentence: "Du brauchst nicht zu fragen.", target: "brauchst" },
      { sentence: "Sie brauchen sich nicht zu sorgen.", target: "brauchen" },
      { sentence: "Ich brauche nicht zu erklären.", target: "brauche" },
    ],
    transfer: "Du brauchst dir keine Sorgen zu machen, denn wir helfen dir gern.",
  },

  "Zweiteilige Konnektoren": {
    examples: [
      { sentence: "Einerseits spart die App Zeit, andererseits braucht sie Aufmerksamkeit.", target: "Einerseits" },
      { sentence: "Sie spricht entweder Deutsch oder Englisch.", target: "entweder" },
      { sentence: "Er hat nicht nur Talent, sondern auch Fleiß.", target: "nicht nur" },
      { sentence: "Weder er noch sie kam zur Party.", target: "Weder" },
      { sentence: "Einerseits will ich reisen, andererseits fehlt das Geld.", target: "andererseits" },
      { sentence: "Sie kauft entweder das rote oder das blaue Kleid.", target: "oder" },
      { sentence: "Er ist nicht nur klug, sondern auch freundlich.", target: "sondern auch" },
      { sentence: "Weder das Wetter noch die Zeit passten.", target: "noch" },
    ],
    transfer: "Einerseits möchte ich den Job annehmen, andererseits bin ich mir noch unsicher.",
  },

  Genitivpräpositionen: {
    examples: [
      { sentence: "Wegen des starken Regens blieb ich zu Hause.", target: "Wegen des starken Regens" },
      { sentence: "Trotz des schlechten Wetters gingen wir raus.", target: "Trotz des schlechten Wetters" },
      { sentence: "Während des Kurses war es sehr ruhig.", target: "Während des Kurses" },
      { sentence: "Innerhalb einer Woche war alles fertig.", target: "Innerhalb einer Woche" },
      { sentence: "Wegen der Verspätung verpassten wir den Zug.", target: "Wegen der Verspätung" },
      { sentence: "Trotz der hohen Kosten kauften wir das Haus.", target: "Trotz der hohen Kosten" },
      { sentence: "Während der Prüfung war es still.", target: "Während der Prüfung" },
      { sentence: "Innerhalb des Kurses gab es viele Übungen.", target: "Innerhalb des Kurses" },
    ],
    transfer: "Wegen des starken Windes blieben wir während des ganzen Nachmittags zu Hause.",
  },
};
