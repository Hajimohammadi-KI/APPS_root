// Phase 1 authored content for A1.
//
// Why this file exists: the shipped catalog averages 1.79 example sentences
// per unit, and after Phase 0 removed every item a learner could solve by
// copying, most units were left with 3-4 distinct retrieval targets. That is
// far below what automatization needs. The generator cannot invent sentences
// safely -- fabricated examples risk teaching wrong grammar -- so the depth
// has to be authored. This is that authoring, for A1 first, as the pilot the
// roadmap calls for.
//
// `generated/grammar.ts` is marked "do not edit by hand", so nothing here
// modifies it. These entries are merged on top of the generated units in
// curriculum.ts, which keeps provenance obvious: generated = migrated legacy,
// this file = deliberately written.
//
// Each sentence carries the exact token the exercise masks. Auto-picking the
// masked word (longest word, first verb, ...) was rejected: it silently masks
// the wrong thing on sentences it does not understand, which produces items
// that do not test the unit's grammar at all. Naming the target makes every
// generated cloze test the pattern it claims to.

export interface AuthoredExample {
  /** A complete, correct sentence at this level. */
  readonly sentence: string;
  /** The exact substring to blank out. Must occur in `sentence`. */
  readonly target: string;
}

export interface AuthoredUnit {
  readonly examples: readonly AuthoredExample[];
  /**
   * A real model sentence for a NEW situation, replacing the boilerplate
   * "In a new situation, I can use <title> accurately." that 84 of 112 units
   * still carry. The generator skips the transfer item entirely while that
   * placeholder is in place, so authoring this both fixes the measurement and
   * adds a genuine retrieval target.
   */
  readonly transfer: string;
}

export const A1_AUTHORED: Readonly<Record<string, AuthoredUnit>> = {
  "Verb be: am/is/are": {
    examples: [
      { sentence: "I am a student.", target: "am" },
      { sentence: "She is tired.", target: "is" },
      { sentence: "They are in Berlin.", target: "are" },
      { sentence: "My sister is a nurse.", target: "is" },
      { sentence: "We are ready now.", target: "are" },
      { sentence: "He is thirty years old.", target: "is" },
      { sentence: "The shops are closed today.", target: "are" },
      { sentence: "I am at home.", target: "am" },
    ],
    transfer: "The children are hungry after school.",
  },

  "Subject pronouns": {
    examples: [
      { sentence: "She works here.", target: "She" },
      { sentence: "They live nearby.", target: "They" },
      { sentence: "He drives to work.", target: "He" },
      { sentence: "We study together on Fridays.", target: "We" },
      { sentence: "It rains a lot in November.", target: "It" },
      { sentence: "You speak very clearly.", target: "You" },
      { sentence: "I walk to the station.", target: "I" },
      { sentence: "They wait outside the office.", target: "They" },
    ],
    transfer: "He teaches music at a small school.",
  },

  "Articles a/an/the": {
    examples: [
      { sentence: "I saw a doctor.", target: "a" },
      { sentence: "The doctor was kind.", target: "The" },
      { sentence: "She bought an apple.", target: "an" },
      { sentence: "We live in a small flat.", target: "a" },
      { sentence: "He is an engineer.", target: "an" },
      { sentence: "The train leaves at six.", target: "The" },
      { sentence: "I need a pen.", target: "a" },
      { sentence: "The film was very long.", target: "The" },
    ],
    transfer: "She found an old photograph in the box.",
  },

  "Plural nouns": {
    examples: [
      { sentence: "I have two books.", target: "books" },
      { sentence: "We bought three boxes.", target: "boxes" },
      { sentence: "They have two children.", target: "children" },
      { sentence: "The shop sells fresh tomatoes.", target: "tomatoes" },
      { sentence: "My feet are cold.", target: "feet" },
      { sentence: "She washed the dishes.", target: "dishes" },
      { sentence: "Both men work here.", target: "men" },
      { sentence: "The city has many parks.", target: "parks" },
    ],
    transfer: "The teachers gave the students new books.",
  },

  "Possessive adjectives": {
    examples: [
      { sentence: "This is my phone.", target: "my" },
      { sentence: "Their house is new.", target: "Their" },
      { sentence: "Her office is upstairs.", target: "Her" },
      { sentence: "We finished our homework.", target: "our" },
      { sentence: "His car is very old.", target: "His" },
      { sentence: "Is this your bag?", target: "your" },
      { sentence: "The dog hurt its leg.", target: "its" },
      { sentence: "My parents live in Vienna.", target: "My" },
    ],
    transfer: "Our neighbours painted their front door green.",
  },

  "Have/has got": {
    examples: [
      { sentence: "I have got a brother.", target: "have got" },
      { sentence: "She has a car.", target: "has" },
      { sentence: "They have got two dogs.", target: "have got" },
      { sentence: "He has short hair.", target: "has" },
      { sentence: "We have got a small garden.", target: "have got" },
      { sentence: "My flat has three rooms.", target: "has" },
      { sentence: "You have got my number.", target: "have got" },
      { sentence: "She has a headache today.", target: "has" },
    ],
    transfer: "My grandmother has got a beautiful old clock.",
  },

  "Present simple affirmative": {
    examples: [
      { sentence: "He studies every day.", target: "studies" },
      { sentence: "Water boils at 100 degrees.", target: "boils" },
      { sentence: "She works in a hospital.", target: "works" },
      { sentence: "They travel every summer.", target: "travel" },
      { sentence: "My brother plays the guitar.", target: "plays" },
      { sentence: "We start at nine o'clock.", target: "start" },
      { sentence: "The bus arrives at eight.", target: "arrives" },
      { sentence: "I read before bed.", target: "read" },
    ],
    transfer: "My colleague cycles to the office every morning.",
  },

  "Present simple negatives": {
    examples: [
      { sentence: "I do not drive.", target: "do not" },
      { sentence: "She does not work here.", target: "does not" },
      { sentence: "They do not live in London.", target: "do not" },
      { sentence: "He does not eat meat.", target: "does not" },
      { sentence: "We do not open on Sundays.", target: "do not" },
      { sentence: "The shop does not accept cards.", target: "does not" },
      { sentence: "You do not need a ticket.", target: "do not" },
      { sentence: "My sister does not like coffee.", target: "does not" },
    ],
    transfer: "The library does not lend books to visitors.",
  },

  "Present simple questions": {
    examples: [
      { sentence: "Do you live here?", target: "Do" },
      { sentence: "Does he speak English?", target: "Does" },
      { sentence: "Do they work on Saturdays?", target: "Do" },
      { sentence: "Does she drive to work?", target: "Does" },
      { sentence: "Do we need an appointment?", target: "Do" },
      { sentence: "Does the shop open early?", target: "Does" },
      { sentence: "Do your parents live nearby?", target: "Do" },
      { sentence: "Does this bus go to the centre?", target: "Does" },
    ],
    transfer: "Does your brother study at this university?",
  },

  "There is/There are": {
    examples: [
      { sentence: "There is a bank here.", target: "There is" },
      { sentence: "There are two parks.", target: "There are" },
      { sentence: "There is a problem with the door.", target: "There is" },
      { sentence: "There are many people outside.", target: "There are" },
      { sentence: "There is milk in the fridge.", target: "There is" },
      { sentence: "There are three rooms upstairs.", target: "There are" },
      { sentence: "There is a bus at seven.", target: "There is" },
      { sentence: "There are no seats left.", target: "There are" },
    ],
    transfer: "There are two cafes near the station.",
  },

  "Can/can’t": {
    examples: [
      { sentence: "I can swim.", target: "can" },
      { sentence: "Can you help me?", target: "Can" },
      { sentence: "She can drive a bus.", target: "can" },
      { sentence: "We can meet on Tuesday.", target: "can" },
      { sentence: "He can play the piano.", target: "can" },
      { sentence: "They can start tomorrow.", target: "can" },
      { sentence: "Can I open the window?", target: "Can" },
      { sentence: "You can pay by card.", target: "can" },
    ],
    transfer: "My neighbour can speak three languages.",
  },

  Imperatives: {
    examples: [
      { sentence: "Open the door.", target: "Open" },
      { sentence: "Turn left at the corner.", target: "Turn" },
      { sentence: "Please sit down.", target: "sit" },
      { sentence: "Close the window, please.", target: "Close" },
      { sentence: "Call me tonight.", target: "Call" },
      { sentence: "Wait here for ten minutes.", target: "Wait" },
      { sentence: "Take the second street.", target: "Take" },
      { sentence: "Bring your passport.", target: "Bring" },
    ],
    transfer: "Send me the address before Friday.",
  },

  "Prepositions of place": {
    examples: [
      { sentence: "The keys are on the table.", target: "on" },
      { sentence: "The cat is under the chair.", target: "under" },
      { sentence: "She lives in Madrid.", target: "in" },
      { sentence: "The bank is next to the school.", target: "next to" },
      { sentence: "He is waiting at the door.", target: "at" },
      { sentence: "The shop is between the bank and the park.", target: "between" },
      { sentence: "Your coat is on the bed.", target: "on" },
      { sentence: "The milk is in the fridge.", target: "in" },
    ],
    transfer: "The pharmacy is next to the post office.",
  },

  "Countable and uncountable nouns": {
    examples: [
      { sentence: "I have many books.", target: "many" },
      { sentence: "She drinks much water.", target: "much" },
      { sentence: "We need much information.", target: "much" },
      { sentence: "There are few chairs here.", target: "few" },
      { sentence: "He gave me little advice.", target: "little" },
      { sentence: "They bought many apples.", target: "many" },
      { sentence: "I do not have much time.", target: "much" },
      { sentence: "She made few mistakes.", target: "few" },
    ],
    transfer: "The report contains much useful information.",
  },

  "Possessive ’s and whose": {
    examples: [
      { sentence: "This is Maya’s book.", target: "Maya’s" },
      { sentence: "My brother’s room is small.", target: "brother’s" },
      { sentence: "Whose coat is this?", target: "Whose" },
      { sentence: "The teacher’s desk is by the window.", target: "teacher’s" },
      { sentence: "Sara’s bag is on the chair.", target: "Sara’s" },
      { sentence: "Whose keys are these?", target: "Whose" },
      { sentence: "My friend’s car is blue.", target: "friend’s" },
      { sentence: "The doctor’s office opens at eight.", target: "doctor’s" },
    ],
    transfer: "Whose jacket is hanging by the entrance?",
  },

  "Prepositions of time: at, in, on": {
    examples: [
      { sentence: "The lesson starts at seven.", target: "at" },
      { sentence: "We meet on Monday.", target: "on" },
      { sentence: "Her birthday is in July.", target: "in" },
      { sentence: "The shop closes at nine.", target: "at" },
      { sentence: "They arrived on Friday morning.", target: "on" },
      { sentence: "He was born in 1998.", target: "in" },
      { sentence: "The exam is on 3 June.", target: "on" },
      { sentence: "We travel in the summer.", target: "in" },
    ],
    transfer: "The concert begins at eight on Saturday.",
  },
};
