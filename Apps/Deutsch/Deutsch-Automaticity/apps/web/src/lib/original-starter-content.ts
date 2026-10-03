import type { TeacherContentItem } from "./teacher-content";

const CREATED_AT = "2026-08-29T00:00:00.000Z";

type StarterRow = Omit<TeacherContentItem, "updatedAt" | "status">;

function item(row: StarterRow): TeacherContentItem {
  return { ...row, status: "published", updatedAt: CREATED_AT };
}

// Neu für diese App verfasste Inhalte. Sie sind von lokal lizenziertem
// QSkills-Material getrennt und enthalten keine kopierten Texte oder Medien.
export const originalGermanStarterContent: readonly TeacherContentItem[] = [
  item({
    id: "original-de-a1-verb",
    kind: "verb",
    level: "A1",
    title: "sein bei der Vorstellung",
    contextKey: "teacher.a1.verb.vorstellung",
    body: "Nutze bin, bist, ist, sind für Name, Ort und eine einfache Information: Ich bin ..., Sie ist ..., Wir sind ... .",
  }),
  item({
    id: "original-de-a1-example",
    kind: "example",
    level: "A1",
    title: "Eine erste Nachricht",
    contextKey: "teacher.a1.example.erste-nachricht",
    body: "Hallo, ich bin Neda. Ich komme aus Teheran und wohne jetzt in Berlin. Mein Kurs ist freundlich. Bist du auch neu hier?",
  }),
  item({
    id: "original-de-a1-exercise",
    kind: "exercise",
    level: "A1",
    title: "Vorstellung ergänzen",
    contextKey: "teacher.a1.exercise.vorstellung",
    body: "Ergänze bin, ist oder sind: 1) Mein Name ___ Farid. 2) Wir ___ heute im Kurs. 3) Ich ___ froh, dich zu treffen. Lösungen: ist, sind, bin.",
  }),
  item({
    id: "original-de-a1-conversation",
    kind: "conversation",
    level: "A1",
    title: "Neue Nachbarin kennenlernen",
    contextKey: "teacher.a1.conversation.nachbarin",
    body: "A: Hallo, ich bin Sara. Ich wohne nebenan. B: Schön, dich kennenzulernen. Ich bin Amir. A: Bist du neu in diesem Haus? B: Ja. Wo sind die Geschäfte?",
  }),

  item({
    id: "original-de-a2-verb",
    kind: "verb",
    level: "A2",
    title: "Präteritum für eine Planänderung",
    contextKey: "teacher.a2.verb.plan-aenderung",
    body: "Beschreibe zuerst, was passierte, und dann die Folge: Der Zug hielt an, deshalb ging ich zu Fuß. Ich entschied mich, meine Freundin anzurufen.",
  }),
  item({
    id: "original-de-a2-example",
    kind: "example",
    level: "A2",
    title: "Ein unerwarteter Nachmittag",
    contextKey: "teacher.a2.example.nachmittag",
    body: "Gestern wollte ich die Bibliothek besuchen, aber sie schloss früh. In der Nähe fand ich einen kleinen Park, rief meine Schwester an und wir tranken draußen Tee.",
  }),
  item({
    id: "original-de-a2-exercise",
    kind: "exercise",
    level: "A2",
    title: "Eine Geschichte ordnen",
    contextKey: "teacher.a2.exercise.geschichte",
    body: "Bringe die Handlungen in eine sinnvolle Reihenfolge: am Bahnhof ankommen / den Bus verpassen / den nächsten Bus nehmen / das Treffen erreichen. Erzähle danach mit zuerst, dann und schließlich.",
  }),
  item({
    id: "original-de-a2-conversation",
    kind: "conversation",
    level: "A2",
    title: "Eine Reisemöglichkeit wählen",
    contextKey: "teacher.a2.conversation.reise",
    body: "A: Der Bus ist billiger, aber er dauert länger. B: Der Zug kostet mehr, aber er fährt direkt. A: Nehmen wir den Zug, weil wir Gepäck haben. B: Gute Idee. Ich reserviere die Fahrkarten.",
  }),

  item({
    id: "original-de-b1-verb",
    kind: "verb",
    level: "B1",
    title: "Perfekt für Erfahrungen",
    contextKey: "teacher.b1.verb.erfahrung",
    body: "Nutze haben oder sein plus Partizip II, um Erfahrungen mit der Gegenwart zu verbinden: Ich habe ... ausprobiert, aber ich habe mich noch nicht entschieden.",
  }),
  item({
    id: "original-de-b1-example",
    kind: "example",
    level: "B1",
    title: "Eine Lernentscheidung begründen",
    contextKey: "teacher.b1.example.lernentscheidung",
    body: "Ich habe Videos und Gesprächsgruppen genutzt. Videos halfen mir bei nützlichen Wendungen, aber Gespräche zeigten mir, wo ich zögere. Jetzt verbinde ich beide Methoden.",
  }),
  item({
    id: "original-de-b1-exercise",
    kind: "exercise",
    level: "B1",
    title: "Eine Behauptung prüfen",
    contextKey: "teacher.b1.exercise.behauptung",
    body: "Ein Beitrag verspricht fließendes Deutsch in einer Woche. Formuliere drei Fragen zu Quelle, Belegen und Grenzen, bevor du entscheidest, ob du ihn weiterleitest.",
  }),
  item({
    id: "original-de-b1-conversation",
    kind: "conversation",
    level: "B1",
    title: "Eine Frist klären",
    contextKey: "teacher.b1.conversation.frist",
    body: "A: Ich dachte, der Bericht ist am Donnerstag fällig. B: Im Kalender steht Mittwoch Nachmittag. A: Können wir die ursprüngliche Nachricht prüfen? Wenn Mittwoch stimmt, schicke ich zuerst die Tabelle.",
  }),

  item({
    id: "original-de-b2-verb",
    kind: "verb",
    level: "B2",
    title: "Eine Empfehlung vorsichtig formulieren",
    contextKey: "teacher.b2.verb.vorsichtige-empfehlung",
    body: "Nutze möglicherweise, dürfte, scheint und vermutlich, um eine abgewogene Aussage zu treffen: Die Änderung könnte den Zugang verbessern, obwohl die Kosten zunächst steigen dürften.",
  }),
  item({
    id: "original-de-b2-example",
    kind: "example",
    level: "B2",
    title: "Eine ausgewogene Technikposition",
    contextKey: "teacher.b2.example.technik",
    body: "Digitale Werkzeuge können Routineaufgaben verkürzen. Sie können aber auch Fehler verdecken, wenn Vorschläge ungeprüft übernommen werden. Schulung und klare Kontrollschritte bleiben daher wichtig.",
  }),
  item({
    id: "original-de-b2-exercise",
    kind: "exercise",
    level: "B2",
    title: "Zwei Stadtpläne vergleichen",
    contextKey: "teacher.b2.exercise.stadtplaene",
    body: "Plan A schafft Parkplätze im Zentrum. Plan B schafft eine Busspur und Bäume. Nenne einen Vorteil, einen Nachteil und eine Bedingung, die deinen bevorzugten Plan gerechter machen würde.",
  }),
  item({
    id: "original-de-b2-conversation",
    kind: "conversation",
    level: "B2",
    title: "Auf ein Gegenargument eingehen",
    contextKey: "teacher.b2.conversation.gegenargument",
    body: "A: Homeoffice schafft mehr Flexibilität. B: Das stimmt für manche Rollen; neue Kolleginnen erhalten aber vielleicht weniger Unterstützung. A: Wir könnten Flexibilität behalten und regelmäßige Mentoring-Termine planen.",
  }),

  item({
    id: "original-de-c1-verb",
    kind: "verb",
    level: "C1",
    title: "Eine Schlussfolgerung einschränken",
    contextKey: "teacher.c1.verb.schlussfolgerung",
    body: "Formuliere wissenschaftlich vorsichtig: Die Ergebnisse deuten darauf hin, dass ..., unter der Einschränkung, dass ... . So klingt eine kleine Studie nicht sicherer, als sie ist.",
  }),
  item({
    id: "original-de-c1-example",
    kind: "example",
    level: "C1",
    title: "Eine Forschungsgrenze erklären",
    contextKey: "teacher.c1.example.forschungsgrenze",
    body: "Obwohl die Stichprobe sorgfältig ausgewählt wurde, stammt sie nur aus einem Betrieb. Die Ergebnisse zeigen daher ein nützliches Muster, aber keine automatische Übertragbarkeit.",
  }),
  item({
    id: "original-de-c1-exercise",
    kind: "exercise",
    level: "C1",
    title: "Für die Öffentlichkeit umschreiben",
    contextKey: "teacher.c1.exercise.oeffentlichkeit",
    body: "Schreibe diesen Fachsatz für eine Bürgerversammlung um, ohne Genauigkeit zu verlieren: 'Die Intervention verringerte die Varianz, belegte aber keine Kausalität.' Benenne anschließend eine Bedeutung, die du erhalten hast.",
  }),
  item({
    id: "original-de-c1-conversation",
    kind: "conversation",
    level: "C1",
    title: "Einen Teamkonflikt vermitteln",
    contextKey: "teacher.c1.conversation.teamkonflikt",
    body: "A: Das Team braucht Tempo. B: Das Team braucht einen sichereren Prüfprozess. C: Beide Anliegen sind berechtigt. Können wir dringende Entscheidungen von Entscheidungen mit zweiter Kontrolle trennen?",
  }),

  item({
    id: "original-de-c2-verb",
    kind: "verb",
    level: "C2",
    title: "Unsicherheit präzise markieren",
    contextKey: "teacher.c2.verb.unsicherheit",
    body: "Trenne bestätigte Tatsachen von Deutungen: Die Unterlagen belegen ..., während die vorgeschlagene Erklärung vorläufig bleibt.",
  }),
  item({
    id: "original-de-c2-example",
    kind: "example",
    level: "C2",
    title: "Ein sorgfältiges Krisenupdate",
    contextKey: "teacher.c2.example.krisenupdate",
    body: "Wir können bestätigen, dass die Störung den Ostbezirk zwischen 09:10 und 10:05 betraf. Die Ursache wird noch geprüft; im nächsten Update unterscheiden wir bestätigte Befunde von ersten Annahmen.",
  }),
  item({
    id: "original-de-c2-exercise",
    kind: "exercise",
    level: "C2",
    title: "Widersprüchliche Berichte verbinden",
    contextKey: "teacher.c2.exercise.berichte",
    body: "Zwei Zeugen stimmen beim Zeitpunkt überein, aber nicht beim Ablauf. Schreibe eine Zusammenfassung in fünf Sätzen, die beide Berichte wahrt, gemeinsame Belege nennt und keine Gewissheit erfindet.",
  }),
  item({
    id: "original-de-c2-conversation",
    kind: "conversation",
    level: "C2",
    title: "Eine differenzierte Debatte leiten",
    contextKey: "teacher.c2.conversation.debatte",
    body: "Leitung: Wir teilen das Ziel, nicht aber den Schwellenwert für eine Maßnahme. Benennen wir die Annahmen hinter jedem Vorschlag und entscheiden dann, welche Unsicherheit vertretbar ist und wer das Restrisiko trägt.",
  }),
];
