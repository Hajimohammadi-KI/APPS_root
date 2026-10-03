export type CefrStufe = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export const FERTIGKEITEN = [
  "Hören",
  "Lesen",
  "Sprechen",
  "Schreiben",
  "Mediation",
  "Online-Interaktion",
] as const;

export interface CefrCurriculumLevel {
  readonly stufe: CefrStufe;
  readonly ziel: string;
  readonly aussprache: string;
  readonly wortschatz: readonly string[];
  readonly themen: readonly string[];
  readonly kannBeschreibungen: Readonly<
    Record<(typeof FERTIGKEITEN)[number], string>
  >;
}

const gemeinsameThemen = {
  A1: [
    "Person und Herkunft",
    "Familie und Freunde",
    "Wohnen",
    "Tagesablauf",
    "Essen und Trinken",
    "Einkaufen",
    "Stadt und Weg",
    "Verkehr",
    "Wetter und Kleidung",
    "Freizeit",
    "Gesundheit",
    "Termine",
  ],
  A2: [
    "Erlebnisse",
    "Reiseplanung",
    "Arbeitstag",
    "Lernen",
    "Nachbarschaft",
    "Dienstleistungen",
    "Technik im Alltag",
    "Feiern",
    "Gesundheit und Rat",
    "Medien",
    "Umweltgewohnheiten",
    "Probleme lösen",
  ],
  B1: [
    "Ausbildung",
    "Beruf und Zusammenarbeit",
    "Reisen und Kultur",
    "Gesund leben",
    "Medien prüfen",
    "Umwelt",
    "Beziehungen",
    "Geld und Konsum",
    "Öffentliche Dienste",
    "Gemeinschaft",
    "Ziele und Pläne",
    "Wissenschaft im Alltag",
  ],
  B2: [
    "Digitale Gesellschaft",
    "Bildungspolitik",
    "Arbeitsmodelle",
    "Gesundheitspolitik",
    "Stadtentwicklung",
    "Verbraucherrechte",
    "Kulturkritik",
    "Daten und Trends",
    "Risiko",
    "Wirtschaft",
    "Wissenschaftskommunikation",
    "Teamkonflikte",
  ],
  C1: [
    "Forschungsmethoden",
    "Ethik",
    "Strategie",
    "Öffentliche Politik",
    "Interkulturelle Kommunikation",
    "Komplexe Entscheidungen",
    "Medienanalyse",
    "Literatur und Interpretation",
    "Konfliktmediation",
    "Wissenschaftliche Argumentation",
    "Organisationen",
    "Gesellschaftlicher Wandel",
  ],
  C2: [
    "Erkenntnistheorie",
    "Expertendebatte",
    "Recht und Institutionen",
    "Krisenkommunikation",
    "Diplomatie",
    "Ironie und implizite Bedeutung",
    "Mehrquellenanalyse",
    "Wissenschaftliche Verteidigung",
    "Stil und Stimme",
    "Technologieethik",
    "Komplexe Systeme",
    "Öffentlicher Diskurs",
  ],
} as const;

export const cefrCurriculum: readonly CefrCurriculumLevel[] = [
  {
    stufe: "A1",
    ziel: "Vertraute Wörter und sehr kurze Sätze für unmittelbare persönliche Bedürfnisse verstehen und selbst verwenden.",
    aussprache:
      "Alphabet, deutliche Laute, Wortakzent und kurze sinnvolle Sprecheinheiten.",
    wortschatz: [
      "Person",
      "Familie",
      "Zahlen",
      "Zeit",
      "Ort",
      "Essen",
      "Kleidung",
      "Verkehr",
      "Gesundheit",
      "Alltag",
    ],
    themen: gemeinsameThemen.A1,
    kannBeschreibungen: {
      Hören:
        "Langsame, deutliche Angaben zu Person, Zeit, Preis und Ort erkennen.",
      Lesen:
        "Sehr kurze Hinweise, Nachrichten, Formulare und Schilder verstehen.",
      Sprechen:
        "Sich vorstellen, einfache Fragen stellen und kurze Alltagssituationen bewältigen.",
      Schreiben:
        "Kurze persönliche Angaben und vier verbundene einfache Sätze schreiben.",
      Mediation:
        "Eine sehr einfache Angabe wie Zeit, Preis oder Adresse weitergeben.",
      "Online-Interaktion":
        "Eine kurze Begrüßung, Bestätigung oder Terminantwort online schreiben.",
    },
  },
  {
    stufe: "A2",
    ziel: "In vertrauten Situationen Informationen austauschen und Erfahrungen, Pläne und einfache Probleme beschreiben.",
    aussprache:
      "Satzakzent, verständliche Endungen, Fragenintonation und flüssige kurze Wortgruppen.",
    wortschatz: [
      "Erfahrung",
      "Reise",
      "Arbeit",
      "Lernen",
      "Dienstleistung",
      "Technik",
      "Gesundheit",
      "Umwelt",
      "Medien",
      "Lösung",
    ],
    themen: gemeinsameThemen.A2,
    kannBeschreibungen: {
      Hören:
        "Kernaussage und wichtige Einzelheiten in vertrauten Ansagen und Gesprächen erfassen.",
      Lesen:
        "Kurze Sachtexte, E-Mails und Anleitungen nach Hauptinformation durchsuchen.",
      Sprechen:
        "Erlebnisse berichten, Vorschläge machen und ein einfaches Problem klären.",
      Schreiben:
        "Eine kurze zusammenhängende Nachricht oder Beschreibung mit zeitlicher Ordnung verfassen.",
      Mediation:
        "Die wichtigsten Punkte einer vertrauten Mitteilung für eine andere Person erklären.",
      "Online-Interaktion":
        "Praktische Absprachen treffen und auf Rückfragen verständlich reagieren.",
    },
  },
  {
    stufe: "B1",
    ziel: "Die meisten vertrauten Situationen selbstständig bewältigen und zusammenhängend über Erfahrungen, Meinungen und Ziele sprechen.",
    aussprache:
      "Verständlicher Rhythmus, Kontrastakzent, stabile Endungen und längere Sprecheinheiten.",
    wortschatz: [
      "Begründung",
      "Erfahrung",
      "Vorteil",
      "Nachteil",
      "Ziel",
      "Quelle",
      "Gemeinschaft",
      "Entscheidung",
      "Entwicklung",
      "Lösung",
    ],
    themen: gemeinsameThemen.B1,
    kannBeschreibungen: {
      Hören:
        "Hauptpunkte klarer Standardsprache zu Arbeit, Bildung, Medien und Alltag verstehen.",
      Lesen:
        "Sachtexte verstehen, Positionen erkennen und relevante Belege finden.",
      Sprechen:
        "Eine Meinung begründen, ein Erlebnis strukturiert erzählen und auf Nachfragen eingehen.",
      Schreiben:
        "Klare verbundene Texte zu vertrauten Themen mit Gründen und Beispielen verfassen.",
      Mediation:
        "Kernaussagen eines verständlichen Textes zusammenfassen und praktisch erklären.",
      "Online-Interaktion":
        "An einer sachlichen Online-Diskussion teilnehmen und Missverständnisse klären.",
    },
  },
  {
    stufe: "B2",
    ziel: "Komplexe Texte und Diskussionen verstehen, spontan interagieren und eine differenzierte Position überzeugend vertreten.",
    aussprache:
      "Sicherer Satzakzent, natürliche Verknüpfung, kontrollierte Pausen und angemessene Intonation.",
    wortschatz: [
      "Abwägung",
      "Folge",
      "Annahme",
      "Evidenz",
      "Interessengruppe",
      "Zielkonflikt",
      "Risiko",
      "Umsetzung",
      "Tendenz",
      "Einschränkung",
    ],
    themen: gemeinsameThemen.B2,
    kannBeschreibungen: {
      Hören:
        "Komplexe Argumentationen und längere Beiträge mit vertrautem Fachbezug verfolgen.",
      Lesen:
        "Position, Belege, Einschränkungen und Ton in anspruchsvollen Sachtexten analysieren.",
      Sprechen:
        "Perspektiven vergleichen, Folgen bewerten und spontan auf Gegenargumente reagieren.",
      Schreiben:
        "Detaillierte, klar gegliederte Texte mit Abwägung und begründetem Schluss schreiben.",
      Mediation:
        "Komplexe Informationen für eine Zielgruppe ordnen, vereinfachen und korrekt weitergeben.",
      "Online-Interaktion":
        "Eine mehrteilige Online-Diskussion steuern, Quellen einordnen und Lösungen aushandeln.",
    },
  },
  {
    stufe: "C1",
    ziel: "Anspruchsvolle Sprache flexibel, präzise und wirksam für akademische, berufliche und gesellschaftliche Zwecke einsetzen.",
    aussprache:
      "Feine Bedeutungsunterschiede durch Akzent, Rhythmus, Tempo und Intonation gezielt markieren.",
    wortschatz: [
      "Implikation",
      "Voraussetzung",
      "Gültigkeit",
      "Nuance",
      "Einwand",
      "Synthese",
      "Machbarkeit",
      "Kontext",
      "Register",
      "Vermittlung",
    ],
    themen: gemeinsameThemen.C1,
    kannBeschreibungen: {
      Hören:
        "Lange, implizite und strukturell komplexe Beiträge auch bei nicht ausdrücklich markierten Beziehungen verstehen.",
      Lesen:
        "Komplexe Fach- und Gebrauchstexte kritisch analysieren und implizite Positionen erkennen.",
      Sprechen:
        "Komplexe Sachverhalte präzise darstellen, vermitteln und unter Nachfragen flexibel reformulieren.",
      Schreiben:
        "Gut strukturierte, stilistisch angemessene Texte mit kontrollierter Argumentation verfassen.",
      Mediation:
        "Mehrere Quellen synthetisieren und für unterschiedliche Zielgruppen verantwortungsvoll neu darstellen.",
      "Online-Interaktion":
        "Komplexe kollaborative Online-Arbeit moderieren und kommunikative Spannungen diplomatisch lösen.",
    },
  },
  {
    stufe: "C2",
    ziel: "Nahezu alles mühelos verstehen und Bedeutung, Register, Stil und Implikation mit höchster Präzision steuern.",
    aussprache:
      "Prosodie, Tempo, Stimmführung und stilistische Variation bewusst und adressatengerecht kontrollieren.",
    wortschatz: [
      "Prämisse",
      "Geltungsbereich",
      "Mehrdeutigkeit",
      "Evidentialität",
      "Diskurs",
      "Kohärenz",
      "Konnotation",
      "Reformulierung",
      "Provenienz",
      "Differenzierung",
    ],
    themen: gemeinsameThemen.C2,
    kannBeschreibungen: {
      Hören:
        "Dichte, schnelle und implizite Sprache mit idiomatischen, kulturellen und stilistischen Nuancen erfassen.",
      Lesen:
        "Nahezu jede Textsorte hinsichtlich Argument, Stil, Mehrdeutigkeit und vorausgesetztem Wissen interpretieren.",
      Sprechen:
        "Komplexe Positionen spontan, präzise und stilistisch kontrolliert entwickeln und verteidigen.",
      Schreiben:
        "Anspruchsvolle Texte für verschiedene Genres mit feiner Bedeutungs- und Registerkontrolle gestalten.",
      Mediation:
        "Widersprüchliche Quellen rekonstruieren, Unsicherheit bewahren und komplexe Bedeutung präzise übertragen.",
      "Online-Interaktion":
        "Hochkomplexe Online-Kollaboration oder Debatte sprachlich und sozial souverän leiten.",
    },
  },
];
