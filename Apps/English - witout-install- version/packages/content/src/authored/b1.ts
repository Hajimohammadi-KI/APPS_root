// Phase 1 authored content for B1. Same contract and reasoning as
// `authored/a1.ts` -- see that file's header.
//
// Note on "Present perfect": that unit already has a hand-built exercise set
// in the app (presentPerfectExercises in automaticity-screen.tsx, which an e2e
// spec depends on). The sentences here feed the catalog's cloze items and do
// not touch that set.

import type { AuthoredUnit } from "./a1";

export const B1_AUTHORED: Readonly<Record<string, AuthoredUnit>> = {
  "Present perfect": {
    examples: [
      { sentence: "I have lived here for three years.", target: "have lived" },
      { sentence: "She has finished the report.", target: "has finished" },
      { sentence: "We have never been to Japan.", target: "have never been" },
      { sentence: "He has worked here since 2019.", target: "has worked" },
      { sentence: "They have already left.", target: "have already left" },
      { sentence: "I have lost my keys.", target: "have lost" },
      { sentence: "She has written three books.", target: "has written" },
      { sentence: "The price has risen twice this year.", target: "has risen" },
    ],
    transfer: "My colleague has managed this team since April.",
  },

  "Present perfect vs past simple": {
    examples: [
      { sentence: "I saw it yesterday.", target: "saw" },
      { sentence: "I have seen that film twice.", target: "have seen" },
      { sentence: "She visited Paris in 2019.", target: "visited" },
      { sentence: "She has visited Paris three times.", target: "has visited" },
      { sentence: "We finished the work last week.", target: "finished" },
      { sentence: "We have finished the work.", target: "have finished" },
      { sentence: "He started the course in March.", target: "started" },
      { sentence: "He has started a new course.", target: "has started" },
    ],
    transfer: "They moved in 2020, and since then they have bought two more shops.",
  },

  "For and since": {
    examples: [
      { sentence: "I have known her for two years.", target: "for" },
      { sentence: "She has worked here since 2018.", target: "since" },
      { sentence: "We have waited for twenty minutes.", target: "for" },
      { sentence: "He has been ill since Monday.", target: "since" },
      { sentence: "They have lived abroad for a long time.", target: "for" },
      { sentence: "I have not seen him since the summer.", target: "since" },
      { sentence: "The shop has been closed for a week.", target: "for" },
      { sentence: "She has played the violin since childhood.", target: "since" },
    ],
    transfer: "He has led the project since January, so for about six months.",
  },

  "Past continuous": {
    examples: [
      { sentence: "I was studying when you called.", target: "was studying" },
      { sentence: "They were waiting at the door.", target: "were waiting" },
      { sentence: "She was cooking when the phone rang.", target: "was cooking" },
      { sentence: "We were driving through the mountains.", target: "were driving" },
      { sentence: "He was reading in the garden.", target: "was reading" },
      { sentence: "It was raining all morning.", target: "was raining" },
      { sentence: "The children were sleeping upstairs.", target: "were sleeping" },
      { sentence: "I was working late that night.", target: "was working" },
    ],
    transfer: "At six o'clock we were still discussing the budget.",
  },

  "Past continuous vs past simple": {
    examples: [
      { sentence: "The phone rang once.", target: "rang" },
      { sentence: "I was cooking when the phone rang.", target: "was cooking" },
      { sentence: "She was walking home when it started to rain.", target: "was walking" },
      { sentence: "We met while we were studying in Rome.", target: "met" },
      { sentence: "He broke his arm while he was skiing.", target: "broke" },
      { sentence: "They were talking when the lights went out.", target: "were talking" },
      { sentence: "I saw her while I was waiting for the bus.", target: "saw" },
      { sentence: "The train arrived while we were buying tickets.", target: "arrived" },
    ],
    transfer: "I was checking the report when my manager called.",
  },

  "First conditional": {
    examples: [
      { sentence: "If I have time, I will call you.", target: "have" },
      { sentence: "If it rains, we will stay at home.", target: "rains" },
      { sentence: "She will help you if you ask her.", target: "will help" },
      { sentence: "If they arrive early, we will start.", target: "arrive" },
      { sentence: "I will send it if you give me the address.", target: "will send" },
      { sentence: "If he studies, he will pass.", target: "studies" },
      { sentence: "We will cancel the trip if the weather is bad.", target: "will cancel" },
      { sentence: "If you wait here, I will bring the car.", target: "wait" },
    ],
    transfer: "If the supplier confirms today, we will place the order tomorrow.",
  },

  "Second conditional": {
    examples: [
      { sentence: "If I had time, I would call you.", target: "had" },
      { sentence: "If she knew the answer, she would tell us.", target: "knew" },
      { sentence: "I would travel more if I had the money.", target: "would travel" },
      { sentence: "If they lived nearer, we would visit them.", target: "lived" },
      { sentence: "He would accept the job if the pay were better.", target: "would accept" },
      { sentence: "If I were you, I would wait.", target: "were" },
      { sentence: "We would move if we found a bigger flat.", target: "would move" },
      { sentence: "If it were cheaper, I would buy it.", target: "were" },
    ],
    transfer: "If the office were closer, I would cycle to work.",
  },

  "Relative clauses": {
    examples: [
      { sentence: "The woman who called is my neighbour.", target: "who" },
      { sentence: "The book which I bought is excellent.", target: "which" },
      { sentence: "The man that lives here works nights.", target: "that" },
      { sentence: "This is the house which we rented.", target: "which" },
      { sentence: "The student who won the prize is only sixteen.", target: "who" },
      { sentence: "The film that we saw was very long.", target: "that" },
      { sentence: "I know a doctor who speaks Arabic.", target: "who" },
      { sentence: "The train which leaves at six is faster.", target: "which" },
    ],
    transfer: "The colleague who wrote the report has already left.",
  },

  "Gerunds and infinitives": {
    examples: [
      { sentence: "I enjoy reading before bed.", target: "reading" },
      { sentence: "She decided to leave early.", target: "to leave" },
      { sentence: "They avoided answering the question.", target: "answering" },
      { sentence: "He hopes to find a new job.", target: "to find" },
      { sentence: "We finished painting the kitchen.", target: "painting" },
      { sentence: "I want to learn Italian.", target: "to learn" },
      { sentence: "She suggested taking the train.", target: "taking" },
      { sentence: "They agreed to postpone the meeting.", target: "to postpone" },
    ],
    transfer: "He promised to call, but he keeps forgetting.",
  },

  "Modal verbs of advice": {
    examples: [
      { sentence: "You should practise every day.", target: "should" },
      { sentence: "She should not work so late.", target: "should not" },
      { sentence: "You should see a doctor.", target: "should" },
      { sentence: "They should book the tickets now.", target: "should" },
      { sentence: "He should not drive when he is tired.", target: "should not" },
      { sentence: "We should leave a little earlier.", target: "should" },
      { sentence: "You should ask for help.", target: "should" },
      { sentence: "She should take a short break.", target: "should" },
    ],
    transfer: "You should confirm the booking before Friday.",
  },

  "Passive present and past": {
    examples: [
      { sentence: "The bridge was built in 1990.", target: "was built" },
      { sentence: "The letters are delivered every morning.", target: "are delivered" },
      { sentence: "This room is cleaned twice a week.", target: "is cleaned" },
      { sentence: "The results were announced yesterday.", target: "were announced" },
      { sentence: "The film was directed by a Spanish woman.", target: "was directed" },
      { sentence: "These cars are made in Japan.", target: "are made" },
      { sentence: "The documents were sent last week.", target: "were sent" },
      { sentence: "Breakfast is served until ten.", target: "is served" },
    ],
    transfer: "The new policy was approved by the committee.",
  },

  "Reported statements": {
    examples: [
      { sentence: "She said she was tired.", target: "was" },
      { sentence: "He told me he had finished.", target: "had finished" },
      { sentence: "They said they would come later.", target: "would come" },
      { sentence: "She explained that she lived alone.", target: "lived" },
      { sentence: "He said he could not help.", target: "could not" },
      { sentence: "I told her I had seen the film.", target: "had seen" },
      { sentence: "They said the shop was closed.", target: "was" },
      { sentence: "She mentioned that she was moving.", target: "was moving" },
    ],
    transfer: "He said he had already sent the invoice.",
  },

  "Question tags": {
    examples: [
      { sentence: "You are ready, aren't you?", target: "aren't you" },
      { sentence: "She works here, doesn't she?", target: "doesn't she" },
      { sentence: "They did not call, did they?", target: "did they" },
      { sentence: "He can swim, can't he?", target: "can't he" },
      { sentence: "It is cold today, isn't it?", target: "isn't it" },
      { sentence: "You have finished, haven't you?", target: "haven't you" },
      { sentence: "We are late, aren't we?", target: "aren't we" },
      { sentence: "She did not know, did she?", target: "did she" },
    ],
    transfer: "The meeting starts at nine, doesn't it?",
  },

  "Too/enough": {
    examples: [
      { sentence: "The instructions were clear enough.", target: "clear enough" },
      { sentence: "This coffee is too hot.", target: "too hot" },
      { sentence: "He is not old enough to drive.", target: "old enough" },
      { sentence: "The room was too small for us.", target: "too small" },
      { sentence: "She spoke slowly enough for everyone.", target: "slowly enough" },
      { sentence: "It is too late to call him.", target: "too late" },
      { sentence: "The bag was not light enough.", target: "light enough" },
      { sentence: "This exercise is too difficult.", target: "too difficult" },
    ],
    transfer: "The report is detailed enough, but it is too long.",
  },

  "Capital letters and apostrophes": {
    examples: [
      { sentence: "My sisters live in Canada.", target: "Canada" },
      { sentence: "That is Sara's bag.", target: "Sara's" },
      { sentence: "We travel to Spain in April.", target: "Spain" },
      { sentence: "The children's books are upstairs.", target: "children's" },
      { sentence: "She doesn't work on Mondays.", target: "doesn't" },
      { sentence: "My friend's car is outside.", target: "friend's" },
      { sentence: "They speak English and Arabic.", target: "English" },
      { sentence: "It's a very long journey.", target: "It's" },
    ],
    transfer: "Peter's flight to Munich leaves on Tuesday.",
  },

  "Contrasting ideas: although, despite, however": {
    examples: [
      { sentence: "Although it was raining, we went out.", target: "Although" },
      { sentence: "Despite the rain, we went out.", target: "Despite" },
      { sentence: "It was raining. However, we went out.", target: "However" },
      { sentence: "Even though he was tired, he finished the work.", target: "Even though" },
      { sentence: "In spite of the delay, they arrived on time.", target: "In spite of" },
      { sentence: "Although the flat is small, it is comfortable.", target: "Although" },
      { sentence: "Despite working late, she felt fine.", target: "Despite" },
      { sentence: "The price is high. However, the quality is excellent.", target: "However" },
    ],
    transfer: "Although the budget is tight, the project will continue.",
  },

  "Used to, be used to, get used to": {
    examples: [
      { sentence: "I am used to working at night.", target: "am used to" },
      { sentence: "She used to live in Rome.", target: "used to" },
      { sentence: "He is getting used to the new system.", target: "is getting used to" },
      { sentence: "We used to walk to school.", target: "used to" },
      { sentence: "They are used to the cold weather.", target: "are used to" },
      { sentence: "I used to smoke, but I stopped.", target: "used to" },
      { sentence: "She got used to the long journey.", target: "got used to" },
      { sentence: "He is used to speaking in public.", target: "is used to" },
    ],
    transfer: "I used to dread meetings, but now I am used to leading them.",
  },

  "Intensifiers: so and such": {
    examples: [
      { sentence: "It was such a good film.", target: "such a" },
      { sentence: "The film was so good.", target: "so" },
      { sentence: "She is such a kind person.", target: "such a" },
      { sentence: "He drives so carefully.", target: "so" },
      { sentence: "There were so many people.", target: "so many" },
      { sentence: "We had such bad luck.", target: "such" },
      { sentence: "The exam was so difficult.", target: "so" },
      { sentence: "It takes so much time.", target: "so much" },
    ],
    transfer: "It was such a long meeting that everyone was so tired.",
  },

  "Past ability: could, was able to, managed to": {
    examples: [
      { sentence: "Yesterday I managed to fix the computer.", target: "managed to" },
      { sentence: "She could swim when she was five.", target: "could" },
      { sentence: "We were able to finish before lunch.", target: "were able to" },
      { sentence: "He could play the piano as a child.", target: "could" },
      { sentence: "They managed to catch the last train.", target: "managed to" },
      { sentence: "I was able to reach him by phone.", target: "was able to" },
      { sentence: "She could read before she started school.", target: "could" },
      { sentence: "We managed to book a table.", target: "managed to" },
    ],
    transfer: "He could always solve puzzles, and yesterday he managed to finish one in ten minutes.",
  },

  "Past habits: used to, would, past simple": {
    examples: [
      { sentence: "We used to live in Madrid.", target: "used to" },
      { sentence: "Every summer we would visit my grandmother.", target: "would" },
      { sentence: "She moved to Berlin in 2015.", target: "moved" },
      { sentence: "He used to play football every weekend.", target: "used to" },
      { sentence: "They would talk for hours on the phone.", target: "would" },
      { sentence: "I used to hate mornings.", target: "used to" },
      { sentence: "We bought the house in 2019.", target: "bought" },
      { sentence: "My father would read to us every night.", target: "would" },
    ],
    transfer: "She used to commute daily, but last year she started working from home.",
  },

  "Phrasal verbs": {
    examples: [
      { sentence: "Please fill in the form.", target: "fill in" },
      { sentence: "I gave up smoking last year.", target: "gave up" },
      { sentence: "She looked after the children.", target: "looked after" },
      { sentence: "We put off the meeting.", target: "put off" },
      { sentence: "He turned down the offer.", target: "turned down" },
      { sentence: "They ran out of milk.", target: "ran out of" },
      { sentence: "I picked up the parcel this morning.", target: "picked up" },
      { sentence: "She found out the truth.", target: "found out" },
    ],
    transfer: "We had to call off the trip and sort out the refunds.",
  },

  "Present perfect: just, yet, still, already": {
    examples: [
      { sentence: "I have just finished the report.", target: "just" },
      { sentence: "She has already left.", target: "already" },
      { sentence: "Have you eaten yet?", target: "yet" },
      { sentence: "They have not replied yet.", target: "yet" },
      { sentence: "He has just arrived.", target: "just" },
      { sentence: "I still have not heard from her.", target: "still" },
      { sentence: "We have already paid the bill.", target: "already" },
      { sentence: "The parcel has not come yet.", target: "yet" },
    ],
    transfer: "I have just sent the file, but she has not opened it yet.",
  },

  "Reflexive pronouns": {
    examples: [
      { sentence: "He cut himself while cooking.", target: "himself" },
      { sentence: "She taught herself Italian.", target: "herself" },
      { sentence: "I hurt myself yesterday.", target: "myself" },
      { sentence: "They enjoyed themselves at the party.", target: "themselves" },
      { sentence: "We built the shed ourselves.", target: "ourselves" },
      { sentence: "Help yourself to more coffee.", target: "yourself" },
      { sentence: "The door closed by itself.", target: "itself" },
      { sentence: "He introduced himself to the group.", target: "himself" },
    ],
    transfer: "She organised the whole conference herself.",
  },

  "Using as and like": {
    examples: [
      { sentence: "He works as a teacher at the school.", target: "as" },
      { sentence: "She sings like a professional.", target: "like" },
      { sentence: "Do it as I showed you.", target: "as" },
      { sentence: "He works as a designer.", target: "as" },
      { sentence: "This room smells like a hospital.", target: "like" },
      { sentence: "She used the box as a table.", target: "as" },
      { sentence: "He speaks English like a native.", target: "like" },
      { sentence: "I work as a translator.", target: "as" },
    ],
    transfer: "She started as an intern and now works like a full team member.",
  },

  "Verbs and prepositions": {
    examples: [
      { sentence: "It depends on the weather.", target: "depends on" },
      { sentence: "This book belongs to me.", target: "belongs to" },
      { sentence: "We talked about the proposal.", target: "talked about" },
      { sentence: "She apologized for the delay.", target: "apologized for" },
      { sentence: "He listens to the radio every morning.", target: "listens to" },
      { sentence: "They agreed with our decision.", target: "agreed with" },
      { sentence: "I am waiting for the bus.", target: "waiting for" },
      { sentence: "She succeeded in finding a solution.", target: "succeeded in" },
    ],
    transfer: "The result depends on how quickly they reply to our email.",
  },

  "Stative and dynamic verbs": {
    examples: [
      { sentence: "I know the answer.", target: "know" },
      { sentence: "She is writing an email.", target: "is writing" },
      { sentence: "We believe him.", target: "believe" },
      { sentence: "They are building a garage.", target: "are building" },
      { sentence: "He owns two shops.", target: "owns" },
      { sentence: "I am reading a report.", target: "am reading" },
      { sentence: "This soup tastes good.", target: "tastes" },
      { sentence: "She is preparing dinner.", target: "is preparing" },
    ],
    transfer: "I understand the process, and right now I am testing it.",
  },
};
