// Phase 1 authored content for A2. Same contract and reasoning as
// `authored/a1.ts` -- see that file's header for why this depth has to be
// written rather than generated, and why each sentence names its own masked
// token instead of leaving that to a heuristic.

import type { AuthoredUnit } from "./a1";

export const A2_AUTHORED: Readonly<Record<string, AuthoredUnit>> = {
  "Present continuous": {
    examples: [
      { sentence: "I am studying now.", target: "am studying" },
      { sentence: "She is working from home today.", target: "is working" },
      { sentence: "They are waiting outside.", target: "are waiting" },
      { sentence: "We are having dinner at the moment.", target: "are having" },
      { sentence: "He is learning Spanish this year.", target: "is learning" },
      { sentence: "The children are playing in the garden.", target: "are playing" },
      { sentence: "It is raining again.", target: "is raining" },
      { sentence: "I am reading a very long book.", target: "am reading" },
    ],
    transfer: "My colleagues are preparing the report this week.",
  },

  "Present simple vs continuous": {
    examples: [
      { sentence: "I know him well.", target: "know" },
      { sentence: "She is cooking dinner right now.", target: "is cooking" },
      { sentence: "We usually travel by train.", target: "travel" },
      { sentence: "He is staying with friends this month.", target: "is staying" },
      { sentence: "The shop opens at nine every day.", target: "opens" },
      { sentence: "They are building a new bridge.", target: "are building" },
      { sentence: "I understand the problem now.", target: "understand" },
      { sentence: "She works in a bank.", target: "works" },
    ],
    transfer: "He teaches history, but this term he is teaching geography.",
  },

  "Past simple regular": {
    examples: [
      { sentence: "We visited Rome last year.", target: "visited" },
      { sentence: "She finished the report on Monday.", target: "finished" },
      { sentence: "They walked to the station.", target: "walked" },
      { sentence: "I called you yesterday evening.", target: "called" },
      { sentence: "He studied medicine in Vienna.", target: "studied" },
      { sentence: "The film started at eight.", target: "started" },
      { sentence: "We arrived very late.", target: "arrived" },
      { sentence: "She opened the letter carefully.", target: "opened" },
    ],
    transfer: "They painted the kitchen last weekend.",
  },

  "Past simple irregular": {
    examples: [
      { sentence: "She went home early.", target: "went" },
      { sentence: "I saw him at the market.", target: "saw" },
      { sentence: "We took the first train.", target: "took" },
      { sentence: "He wrote three letters.", target: "wrote" },
      { sentence: "They came back on Sunday.", target: "came" },
      { sentence: "I bought a new jacket.", target: "bought" },
      { sentence: "She gave me good advice.", target: "gave" },
      { sentence: "The meeting began at ten.", target: "began" },
    ],
    transfer: "He found his keys under the sofa.",
  },

  "Past simple questions and negatives": {
    examples: [
      { sentence: "Did you call me?", target: "Did" },
      { sentence: "She did not come to the party.", target: "did not" },
      { sentence: "Did they finish the work?", target: "Did" },
      { sentence: "We did not know the answer.", target: "did not" },
      { sentence: "Did he say anything?", target: "Did" },
      { sentence: "I did not see the message.", target: "did not" },
      { sentence: "Did the train arrive on time?", target: "Did" },
      { sentence: "They did not understand the question.", target: "did not" },
    ],
    transfer: "Did your sister enjoy the concert?",
  },

  "Future with will": {
    examples: [
      { sentence: "I will help you.", target: "will help" },
      { sentence: "She will call you tomorrow.", target: "will call" },
      { sentence: "They will arrive before lunch.", target: "will arrive" },
      { sentence: "It will rain later.", target: "will rain" },
      { sentence: "We will send the details tonight.", target: "will send" },
      { sentence: "He will be twenty in May.", target: "will be" },
      { sentence: "I will wait here.", target: "will wait" },
      { sentence: "The shop will close at six.", target: "will close" },
    ],
    transfer: "I will phone the doctor this afternoon.",
  },

  "Be going to": {
    examples: [
      { sentence: "I am going to study tonight.", target: "am going to" },
      { sentence: "She is going to move to Berlin.", target: "is going to" },
      { sentence: "They are going to buy a house.", target: "are going to" },
      { sentence: "We are going to leave early.", target: "are going to" },
      { sentence: "He is going to start a new job.", target: "is going to" },
      { sentence: "It is going to snow tonight.", target: "is going to" },
      { sentence: "I am going to book the tickets.", target: "am going to" },
      { sentence: "You are going to like this film.", target: "are going to" },
    ],
    transfer: "My parents are going to visit us in October.",
  },

  Comparatives: {
    examples: [
      { sentence: "This exercise is easier than the last one.", target: "easier" },
      { sentence: "My flat is smaller than yours.", target: "smaller" },
      { sentence: "The second book was more interesting.", target: "more interesting" },
      { sentence: "Today is colder than yesterday.", target: "colder" },
      { sentence: "Trains are faster than buses.", target: "faster" },
      { sentence: "This route is more direct.", target: "more direct" },
      { sentence: "Her office is bigger than mine.", target: "bigger" },
      { sentence: "The new version is more expensive.", target: "more expensive" },
    ],
    transfer: "The southern route is shorter than the coastal one.",
  },

  Superlatives: {
    examples: [
      { sentence: "This is the easiest exercise.", target: "the easiest" },
      { sentence: "She is the tallest in the class.", target: "the tallest" },
      { sentence: "It was the most interesting talk.", target: "the most interesting" },
      { sentence: "That is the cheapest option.", target: "the cheapest" },
      { sentence: "He is the best player here.", target: "the best" },
      { sentence: "This is the most difficult part.", target: "the most difficult" },
      { sentence: "Monday is the busiest day.", target: "the busiest" },
      { sentence: "It is the oldest building in town.", target: "the oldest" },
    ],
    transfer: "That was the most useful lesson of the course.",
  },

  "Some/any/no": {
    examples: [
      { sentence: "I do not have any time.", target: "any" },
      { sentence: "There is some milk in the fridge.", target: "some" },
      { sentence: "Do you have any questions?", target: "any" },
      { sentence: "She bought some bread.", target: "some" },
      { sentence: "We have no tickets left.", target: "no" },
      { sentence: "Is there any coffee?", target: "any" },
      { sentence: "He gave me some good advice.", target: "some" },
      { sentence: "They did not make any mistakes.", target: "any" },
    ],
    transfer: "There are some seats free, but I cannot see any near the front.",
  },

  "Much/many/a lot of": {
    examples: [
      { sentence: "I have many books.", target: "many" },
      { sentence: "She does not drink much coffee.", target: "much" },
      { sentence: "There are a lot of people here.", target: "a lot of" },
      { sentence: "We do not have much time.", target: "much" },
      { sentence: "He asked many questions.", target: "many" },
      { sentence: "They have a lot of experience.", target: "a lot of" },
      { sentence: "How much water do you need?", target: "much" },
      { sentence: "Many students arrived late.", target: "Many" },
    ],
    transfer: "The course needs a lot of preparation and many hours of practice.",
  },

  "Adverbs of frequency": {
    examples: [
      { sentence: "I often study in the evening.", target: "often" },
      { sentence: "She is always on time.", target: "always" },
      { sentence: "They usually eat at home.", target: "usually" },
      { sentence: "He never drinks coffee.", target: "never" },
      { sentence: "We sometimes work on Saturdays.", target: "sometimes" },
      { sentence: "The bus is rarely late.", target: "rarely" },
      { sentence: "I always check my email first.", target: "always" },
      { sentence: "She often travels for work.", target: "often" },
    ],
    transfer: "My manager is usually available before nine.",
  },

  "Object pronouns": {
    examples: [
      { sentence: "Please call me.", target: "me" },
      { sentence: "I saw them yesterday.", target: "them" },
      { sentence: "She helped us with the forms.", target: "us" },
      { sentence: "We invited him to dinner.", target: "him" },
      { sentence: "Can you tell her the news?", target: "her" },
      { sentence: "I found it under the desk.", target: "it" },
      { sentence: "They thanked me warmly.", target: "me" },
      { sentence: "He sent us the documents.", target: "us" },
    ],
    transfer: "The teacher gave them extra time and explained it again.",
  },

  "Must/have to": {
    examples: [
      { sentence: "I must go now.", target: "must" },
      { sentence: "She has to work on Saturday.", target: "has to" },
      { sentence: "We must finish this today.", target: "must" },
      { sentence: "You have to show your passport.", target: "have to" },
      { sentence: "He must be more careful.", target: "must" },
      { sentence: "They have to leave before six.", target: "have to" },
      { sentence: "I have to renew my licence.", target: "have to" },
      { sentence: "Students must register online.", target: "must" },
    ],
    transfer: "Visitors have to sign in, and staff must wear a badge.",
  },

  "Adjectives and prepositions": {
    examples: [
      { sentence: "She is good at maths.", target: "good at" },
      { sentence: "I am interested in history.", target: "interested in" },
      { sentence: "He is afraid of dogs.", target: "afraid of" },
      { sentence: "They are proud of their work.", target: "proud of" },
      { sentence: "We are ready for the exam.", target: "ready for" },
      { sentence: "She is married to a doctor.", target: "married to" },
      { sentence: "I am tired of waiting.", target: "tired of" },
      { sentence: "He is famous for his novels.", target: "famous for" },
    ],
    transfer: "My sister is responsible for the whole department.",
  },

  "Adjectives ending in -ed and -ing": {
    examples: [
      { sentence: "I was bored during the lecture.", target: "bored" },
      { sentence: "The lecture was boring.", target: "boring" },
      { sentence: "She is interested in the topic.", target: "interested" },
      { sentence: "The topic is interesting.", target: "interesting" },
      { sentence: "We were tired after the trip.", target: "tired" },
      { sentence: "The trip was tiring.", target: "tiring" },
      { sentence: "He felt confused by the instructions.", target: "confused" },
      { sentence: "The instructions were confusing.", target: "confusing" },
    ],
    transfer: "The results were surprising, and everyone was surprised.",
  },

  "Infinitive of purpose": {
    examples: [
      { sentence: "I went to the shop to buy milk.", target: "to buy" },
      { sentence: "She called to ask a question.", target: "to ask" },
      { sentence: "We stopped to rest.", target: "to rest" },
      { sentence: "He came here to study medicine.", target: "to study" },
      { sentence: "They wrote to explain the delay.", target: "to explain" },
      { sentence: "I opened the window to get some air.", target: "to get" },
      { sentence: "She left early to catch the train.", target: "to catch" },
      { sentence: "We met to discuss the project.", target: "to discuss" },
    ],
    transfer: "He took a second job to pay for the course.",
  },

  "Quantifiers: few, a few, little, a little": {
    examples: [
      { sentence: "There are a few chairs.", target: "a few" },
      { sentence: "I have a little time before lunch.", target: "a little" },
      { sentence: "Few people came to the meeting.", target: "Few" },
      { sentence: "There is little hope now.", target: "little" },
      { sentence: "She made a few mistakes.", target: "a few" },
      { sentence: "We need a little more salt.", target: "a little" },
      { sentence: "Few shops open on Sunday.", target: "Few" },
      { sentence: "He gave me a few examples.", target: "a few" },
    ],
    transfer: "We have a little money and a few days to decide.",
  },
};
