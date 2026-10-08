import type { Language } from "./model";
const englishA1: readonly (readonly string[])[] = [
  ["My name is …", "I live in …"],
  ["There are … people in my family.", "My … likes …"],
  ["There is a … near my home.", "My room has …"],
  ["I usually … at …", "After that, I …"],
  ["For breakfast, I have …", "I like … because …"],
  ["I'd like …, please.", "How much is …?"],
  ["How do I get to …?", "Go straight and turn …"],
  ["I have a …", "It hurts here."],
  ["I work as a …", "At work, I …"],
  ["I'm learning …", "I study … every day."],
  ["In my free time, I …", "At weekends, I like to …"],
  ["Today it is …", "In summer, I …"],
];
const germanA1: readonly (readonly string[])[] = [
  ["Ich heiße …", "Ich wohne in …"],
  ["Zu meiner Familie gehören …", "Mein Bruder / Meine Schwester …"],
  ["In meiner Wohnung gibt es …", "In der Nähe ist …"],
  ["Um … Uhr stehe ich auf.", "Danach …"],
  ["Zum Frühstück esse ich …", "Ich trinke gern …"],
  ["Ich hätte gern …", "Wie viel kostet …?"],
  ["Wie komme ich zum / zur …?", "Gehen Sie geradeaus und dann …"],
  ["Ich habe …", "Seit … Tagen …"],
  ["Ich arbeite als …", "Bei der Arbeit …"],
  ["Ich lerne …", "Jeden Tag übe ich …"],
  ["In meiner Freizeit …", "Am Wochenende …"],
  ["Heute ist es …", "Im Sommer …"],
];
export function topicHints(
  index: number,
  level: string,
  title: string,
  language: Language,
): readonly string[] {
  // The first twelve catalog entries are the authored A1 situations in each app.
  const early = (language === "de" ? germanA1 : englishA1)[index];
  if (level === "A1" && early) return early;
  if (/Vortrag|Vorlesung|Referat|lecture|summari/i.test(title))
    return language === "de"
      ? ["Im Vortrag geht es um …", "Ein zentraler Punkt ist …"]
      : ["The main point is …", "The speaker explains that …"];
  if (level === "A2")
    return language === "de"
      ? ["Ein Beispiel aus meinem Alltag ist …", "Deshalb möchte ich …"]
      : ["One example from my life is …", "That's why I want to …"];
  return language === "de"
    ? [
        "Ein konkretes Beispiel dafür ist …",
        "Dabei muss man berücksichtigen, dass …",
      ]
    : ["A concrete example of this is …", "One point to consider is that …"];
}
