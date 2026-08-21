// Phase 1 authored content for B2. Same contract and reasoning as
// `authored/a1.ts` -- see that file's header.

import type { AuthoredUnit } from "./a1";

export const B2_AUTHORED: Readonly<Record<string, AuthoredUnit>> = {
  "Present perfect continuous": {
    examples: [
      { sentence: "I have been working since eight.", target: "have been working" },
      { sentence: "She has been studying all afternoon.", target: "has been studying" },
      { sentence: "They have been waiting for two hours.", target: "have been waiting" },
      { sentence: "He has been living here since March.", target: "has been living" },
      { sentence: "We have been trying to reach you.", target: "have been trying" },
      { sentence: "It has been raining all week.", target: "has been raining" },
      { sentence: "You have been talking for twenty minutes.", target: "have been talking" },
      { sentence: "The team has been preparing for the launch.", target: "has been preparing" },
    ],
    transfer: "She has been negotiating the contract since Monday.",
  },

  "Past perfect": {
    examples: [
      { sentence: "The train had left before we arrived.", target: "had left" },
      { sentence: "She had finished the report by lunchtime.", target: "had finished" },
      { sentence: "They had already eaten when I called.", target: "had already eaten" },
      { sentence: "He had never seen the sea before that trip.", target: "had never seen" },
      { sentence: "We had booked the hotel weeks earlier.", target: "had booked" },
      { sentence: "By the time she spoke, everyone had left.", target: "had left" },
      { sentence: "I had forgotten his name completely.", target: "had forgotten" },
      { sentence: "The shop had closed before we got there.", target: "had closed" },
    ],
    transfer: "The committee had approved the budget before the meeting began.",
  },

  "Past perfect continuous": {
    examples: [
      { sentence: "She had been waiting for an hour before he came.", target: "had been waiting" },
      { sentence: "They had been arguing all morning.", target: "had been arguing" },
      { sentence: "He had been driving for six hours.", target: "had been driving" },
      { sentence: "We had been discussing the plan for weeks.", target: "had been discussing" },
      { sentence: "I had been reading when the power failed.", target: "had been reading" },
      { sentence: "It had been snowing since midnight.", target: "had been snowing" },
      { sentence: "The staff had been complaining for months.", target: "had been complaining" },
      { sentence: "She had been training hard before the injury.", target: "had been training" },
    ],
    transfer: "They had been renovating the building long before the sale.",
  },

  "Future continuous": {
    examples: [
      { sentence: "I will be travelling next week.", target: "will be travelling" },
      { sentence: "She will be working late tonight.", target: "will be working" },
      { sentence: "They will be waiting at the airport.", target: "will be waiting" },
      { sentence: "We will be discussing this tomorrow.", target: "will be discussing" },
      { sentence: "He will be staying with friends.", target: "will be staying" },
      { sentence: "This time next year I will be studying abroad.", target: "will be studying" },
      { sentence: "The team will be testing the system all day.", target: "will be testing" },
      { sentence: "You will be hearing from us shortly.", target: "will be hearing" },
    ],
    transfer: "At nine tomorrow the auditors will be reviewing our accounts.",
  },

  "Future perfect": {
    examples: [
      { sentence: "By Friday I will have finished the report.", target: "will have finished" },
      { sentence: "She will have left by then.", target: "will have left" },
      { sentence: "They will have completed the work by June.", target: "will have completed" },
      { sentence: "We will have saved enough by next year.", target: "will have saved" },
      { sentence: "He will have retired before the merger.", target: "will have retired" },
      { sentence: "By midnight the results will have arrived.", target: "will have arrived" },
      { sentence: "I will have read the whole file by Monday.", target: "will have read" },
      { sentence: "The builders will have finished by autumn.", target: "will have finished" },
    ],
    transfer: "By the end of the quarter we will have doubled the output.",
  },

  "Third conditional": {
    examples: [
      { sentence: "If I had studied, I would have passed.", target: "had studied" },
      { sentence: "If she had called, we would have waited.", target: "had called" },
      { sentence: "They would have come if you had invited them.", target: "would have come" },
      { sentence: "If we had left earlier, we would have caught the train.", target: "had left" },
      { sentence: "He would have helped if he had known.", target: "had known" },
      { sentence: "If it had not rained, the match would have continued.", target: "had not rained" },
      { sentence: "I would have told you if I had been sure.", target: "would have told" },
      { sentence: "If they had listened, the problem would have been avoided.", target: "had listened" },
    ],
    transfer: "If the supplier had warned us, we would have changed the schedule.",
  },

  "Mixed conditionals": {
    examples: [
      { sentence: "If I had taken that job, I would be in Berlin now.", target: "had taken" },
      { sentence: "If she were more organised, she would have finished yesterday.", target: "were" },
      { sentence: "If we had saved more, we would own a house today.", target: "had saved" },
      { sentence: "If he were not so shy, he would have spoken up.", target: "were not" },
      { sentence: "If they had studied medicine, they would be doctors now.", target: "had studied" },
      { sentence: "I would be fluent today if I had practised daily.", target: "had practised" },
      { sentence: "If you were less careless, you would not have lost it.", target: "were" },
      { sentence: "If I had slept properly, I would not feel so tired.", target: "had slept" },
    ],
    transfer: "If we had invested earlier, the company would be profitable today.",
  },

  "Modal deduction present": {
    examples: [
      { sentence: "She must be busy.", target: "must be" },
      { sentence: "He might be at home.", target: "might be" },
      { sentence: "They can't be serious.", target: "can't be" },
      { sentence: "That must be the manager.", target: "must be" },
      { sentence: "It might be a mistake.", target: "might be" },
      { sentence: "She can't be older than thirty.", target: "can't be" },
      { sentence: "He must know the answer.", target: "must know" },
      { sentence: "They might not have the details yet.", target: "might not have" },
    ],
    transfer: "The office is dark, so everyone must be at lunch.",
  },

  "Modal deduction past": {
    examples: [
      { sentence: "They must have forgotten.", target: "must have forgotten" },
      { sentence: "She might have missed the train.", target: "might have missed" },
      { sentence: "He can't have finished so quickly.", target: "can't have finished" },
      { sentence: "We must have taken the wrong turning.", target: "must have taken" },
      { sentence: "They might have left already.", target: "might have left" },
      { sentence: "She can't have known about the change.", target: "can't have known" },
      { sentence: "He must have been very tired.", target: "must have been" },
      { sentence: "The parcel might have arrived yesterday.", target: "might have arrived" },
    ],
    transfer: "Nobody replied, so they must have been in the meeting.",
  },

  "Causative have/get": {
    examples: [
      { sentence: "I had my laptop repaired.", target: "had my laptop repaired" },
      { sentence: "She got her hair cut yesterday.", target: "got her hair cut" },
      { sentence: "We had the kitchen painted last month.", target: "had the kitchen painted" },
      { sentence: "He got his car serviced.", target: "got his car serviced" },
      { sentence: "They had the documents translated.", target: "had the documents translated" },
      { sentence: "I need to get these photos printed.", target: "get these photos printed" },
      { sentence: "She had her passport renewed.", target: "had her passport renewed" },
      { sentence: "We are having the roof replaced.", target: "having the roof replaced" },
    ],
    transfer: "The company had its accounts audited by an external firm.",
  },

  "Advanced passive": {
    examples: [
      { sentence: "He is believed to be abroad.", target: "is believed" },
      { sentence: "The proposal is said to be controversial.", target: "is said" },
      { sentence: "The work must be completed by Friday.", target: "must be completed" },
      { sentence: "She is thought to have left the country.", target: "is thought" },
      { sentence: "The results are expected to be published soon.", target: "are expected" },
      { sentence: "The rules can be changed at any time.", target: "can be changed" },
      { sentence: "It is reported that talks have resumed.", target: "is reported" },
      { sentence: "The building is known to be unsafe.", target: "is known" },
    ],
    transfer: "The policy is understood to have been approved last week.",
  },

  "Participle clauses": {
    examples: [
      { sentence: "Having finished the report, she left.", target: "Having finished" },
      { sentence: "Walking home, I met an old friend.", target: "Walking" },
      { sentence: "Written in 1920, the novel still feels modern.", target: "Written" },
      { sentence: "Having been warned, they took a different route.", target: "Having been warned" },
      { sentence: "Feeling tired, he went to bed early.", target: "Feeling" },
      { sentence: "Built on sand, the wall soon collapsed.", target: "Built" },
      { sentence: "Not knowing the answer, she stayed silent.", target: "Not knowing" },
      { sentence: "Having read the contract, we signed it.", target: "Having read" },
    ],
    transfer: "Having reviewed the figures, the board postponed the decision.",
  },

  "Wish and if only": {
    examples: [
      { sentence: "I wish I knew the answer.", target: "knew" },
      { sentence: "If only I had studied harder.", target: "had studied" },
      { sentence: "She wishes she lived nearer.", target: "lived" },
      { sentence: "I wish you had told me earlier.", target: "had told" },
      { sentence: "If only he were here now.", target: "were" },
      { sentence: "They wish they had accepted the offer.", target: "had accepted" },
      { sentence: "I wish it were not so expensive.", target: "were" },
      { sentence: "If only we had left on time.", target: "had left" },
    ],
    transfer: "I wish I had asked more questions during the interview.",
  },

  "Inversion after negative adverbials": {
    examples: [
      { sentence: "Never have I seen such a mess.", target: "have I seen" },
      { sentence: "Rarely does he arrive late.", target: "does he arrive" },
      { sentence: "Not only did she apologise, she also paid.", target: "did she apologise" },
      { sentence: "Seldom have we faced such a challenge.", target: "have we faced" },
      { sentence: "Under no circumstances should you sign this.", target: "should you sign" },
      { sentence: "No sooner had we sat down than the phone rang.", target: "had we sat" },
      { sentence: "Little did they know what was coming.", target: "did they know" },
      { sentence: "At no time was the public informed.", target: "was the public informed" },
    ],
    transfer: "Never before had the department missed a deadline.",
  },

  "Gradable and non-gradable adjectives": {
    examples: [
      { sentence: "The water was absolutely freezing.", target: "absolutely" },
      { sentence: "The room was fairly warm.", target: "fairly" },
      { sentence: "His answer was completely wrong.", target: "completely" },
      { sentence: "The film was very interesting.", target: "very" },
      { sentence: "She was utterly exhausted.", target: "utterly" },
      { sentence: "The instructions were quite clear.", target: "quite" },
      { sentence: "That is absolutely impossible.", target: "absolutely" },
      { sentence: "The test was rather difficult.", target: "rather" },
    ],
    transfer: "The evidence was fairly strong, though not entirely conclusive.",
  },

  "British and American grammar": {
    examples: [
      { sentence: "I have just eaten lunch.", target: "have just eaten" },
      { sentence: "She has already gone home.", target: "has already gone" },
      { sentence: "The team are playing well.", target: "are" },
      { sentence: "I have got two brothers.", target: "have got" },
      { sentence: "He learnt the piece by heart.", target: "learnt" },
      { sentence: "We have not seen him yet.", target: "have not seen" },
      { sentence: "She travelled across the country.", target: "travelled" },
      { sentence: "They have gone to the shops.", target: "have gone" },
    ],
    transfer: "I have just spoken to the supplier about the delay.",
  },

  "Modifying comparatives": {
    examples: [
      { sentence: "This route is much shorter.", target: "much" },
      { sentence: "The new model is far better.", target: "far" },
      { sentence: "She is slightly taller than her sister.", target: "slightly" },
      { sentence: "The exam was a bit easier this year.", target: "a bit" },
      { sentence: "It is almost as expensive as the original.", target: "almost" },
      { sentence: "The results were considerably worse.", target: "considerably" },
      { sentence: "This version is exactly as fast.", target: "exactly" },
      { sentence: "Their offer was significantly higher.", target: "significantly" },
    ],
    transfer: "The second proposal is far more detailed than the first.",
  },

  "Reported speech: questions": {
    examples: [
      { sentence: "She asked where I lived.", target: "where I lived" },
      { sentence: "He asked if I had finished.", target: "if I had finished" },
      { sentence: "They asked whether we were coming.", target: "whether we were coming" },
      { sentence: "She wanted to know why he had left.", target: "why he had left" },
      { sentence: "He asked what time the meeting started.", target: "what time the meeting started" },
      { sentence: "I asked if she could help.", target: "if she could help" },
      { sentence: "They asked how long it would take.", target: "how long it would take" },
      { sentence: "She asked who had written the report.", target: "who had written" },
    ],
    transfer: "The interviewer asked whether I had managed a team before.",
  },

  "Future degrees of certainty": {
    examples: [
      { sentence: "She will probably accept.", target: "probably" },
      { sentence: "They will definitely arrive on time.", target: "definitely" },
      { sentence: "He is likely to refuse.", target: "is likely to" },
      { sentence: "We are unlikely to finish today.", target: "are unlikely to" },
      { sentence: "It will almost certainly rain.", target: "almost certainly" },
      { sentence: "The price is likely to rise.", target: "is likely to" },
      { sentence: "She will possibly join us later.", target: "possibly" },
      { sentence: "They are bound to notice.", target: "are bound to" },
    ],
    transfer: "The committee is unlikely to reach a decision before June.",
  },

  "Gerund or infinitive: change in meaning": {
    examples: [
      { sentence: "I stopped smoking last year.", target: "smoking" },
      { sentence: "We stopped to buy petrol.", target: "to buy" },
      { sentence: "She remembered locking the door.", target: "locking" },
      { sentence: "She remembered to lock the door.", target: "to lock" },
      { sentence: "He forgot telling me the news.", target: "telling" },
      { sentence: "He forgot to tell me the news.", target: "to tell" },
      { sentence: "They tried changing the settings.", target: "changing" },
      { sentence: "They tried to change the settings.", target: "to change" },
    ],
    transfer: "I regret telling him, though I do not regret to say it was necessary.",
  },

  "Word order in phrasal verbs": {
    examples: [
      { sentence: "Turn it down.", target: "it down" },
      { sentence: "Please fill in the form.", target: "fill in" },
      { sentence: "She threw them away.", target: "them away" },
      { sentence: "He picked up the parcel.", target: "picked up" },
      { sentence: "Can you switch it off?", target: "it off" },
      { sentence: "They called off the meeting.", target: "called off" },
      { sentence: "I looked it up online.", target: "it up" },
      { sentence: "We put off the decision.", target: "put off" },
    ],
    transfer: "She wrote the number down and then read it back to me.",
  },
};
