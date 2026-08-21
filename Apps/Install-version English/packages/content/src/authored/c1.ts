// Phase 1 authored content for C1. Same contract as `authored/a1.ts`.
//
// C1 units describe rhetorical and register control rather than single forms,
// so each sentence here demonstrates the structure in use and masks the part
// that carries it -- the cleft frame, the inverted auxiliary, the hedge -- not
// an incidental content word.

import type { AuthoredUnit } from "./a1";

export const C1_AUTHORED: Readonly<Record<string, AuthoredUnit>> = {
  "Cleft sentences": {
    examples: [
      { sentence: "What I need is practice.", target: "What I need is" },
      { sentence: "It was Maria who solved the problem.", target: "It was Maria who" },
      { sentence: "What surprised us was the cost.", target: "What surprised us was" },
      { sentence: "It is the timing that worries me.", target: "It is the timing that" },
      { sentence: "What she wants is a clear answer.", target: "What she wants is" },
      { sentence: "It was in Vienna that they first met.", target: "It was in Vienna that" },
      { sentence: "What matters most is consistency.", target: "What matters most is" },
      { sentence: "It is the method that needs revision.", target: "It is the method that" },
    ],
    transfer: "What the report lacks is a clear recommendation.",
  },

  "Inversion in conditionals": {
    examples: [
      { sentence: "Had I known, I would have acted differently.", target: "Had I known" },
      { sentence: "Should you need help, please call.", target: "Should you need" },
      { sentence: "Were she available, she would join us.", target: "Were she available" },
      { sentence: "Had they arrived earlier, we could have started.", target: "Had they arrived" },
      { sentence: "Should the weather change, we will postpone.", target: "Should the weather change" },
      { sentence: "Were it not for her support, the project would have failed.", target: "Were it not for" },
      { sentence: "Had we anticipated the delay, we would have warned you.", target: "Had we anticipated" },
      { sentence: "Should any problems arise, contact the office.", target: "Should any problems arise" },
    ],
    transfer: "Had the data been available, the conclusion would have been different.",
  },

  Nominalisation: {
    examples: [
      { sentence: "The decision of the committee was final.", target: "decision" },
      { sentence: "The introduction of the policy caused concern.", target: "introduction" },
      { sentence: "Their refusal surprised everyone.", target: "refusal" },
      { sentence: "The analysis revealed several errors.", target: "analysis" },
      { sentence: "The implementation took three months.", target: "implementation" },
      { sentence: "Her resignation was unexpected.", target: "resignation" },
      { sentence: "The expansion of the network continues.", target: "expansion" },
      { sentence: "The assessment of risk is ongoing.", target: "assessment" },
    ],
    transfer: "The reduction in costs followed a review of every department.",
  },

  "Hedging and stance": {
    examples: [
      { sentence: "The results appear to support the hypothesis.", target: "appear to" },
      { sentence: "This tends to happen in colder climates.", target: "tends to" },
      { sentence: "The findings may indicate a broader pattern.", target: "may" },
      { sentence: "It is arguably the strongest evidence so far.", target: "arguably" },
      { sentence: "The change is likely to affect smaller firms.", target: "likely to" },
      { sentence: "The data seem to suggest a correlation.", target: "seem to" },
      { sentence: "This could partly explain the difference.", target: "could" },
      { sentence: "The effect is possibly overstated.", target: "possibly" },
    ],
    transfer: "The evidence appears to support the claim, though it is arguably limited.",
  },

  "Advanced discourse markers": {
    examples: [
      { sentence: "The costs rose. Nevertheless, the project continued.", target: "Nevertheless" },
      { sentence: "The design is elegant. Moreover, it is cheap to build.", target: "Moreover" },
      { sentence: "Sales fell. Consequently, the branch closed.", target: "Consequently" },
      { sentence: "The plan failed. In other words, we start again.", target: "In other words" },
      { sentence: "She was tired. Even so, she finished the report.", target: "Even so" },
      { sentence: "The route is longer. On the other hand, it is safer.", target: "On the other hand" },
      { sentence: "The trial ended early. Accordingly, the data are limited.", target: "Accordingly" },
      { sentence: "The method is slow. That is to say, it needs patience.", target: "That is to say" },
    ],
    transfer: "The budget was cut. Nevertheless, the team delivered on time.",
  },

  "Substitution and ellipsis": {
    examples: [
      { sentence: "She asked me to review it, and I did so.", target: "did so" },
      { sentence: "He likes jazz and so does she.", target: "so does she" },
      { sentence: "I have the blue one, not the red one.", target: "one" },
      { sentence: "They did not agree and neither did we.", target: "neither did we" },
      { sentence: "She said she would call, and she did.", target: "did" },
      { sentence: "I prefer the shorter ones.", target: "ones" },
      { sentence: "He can swim and so can his brother.", target: "so can" },
      { sentence: "We were asked to comment, and we did so briefly.", target: "did so" },
    ],
    transfer: "The board approved the plan, and the committee did so as well.",
  },

  "Complex relative clauses": {
    examples: [
      { sentence: "The method on which we relied proved unstable.", target: "on which" },
      { sentence: "The colleague to whom I spoke was very helpful.", target: "to whom" },
      { sentence: "The results were delayed, which frustrated everyone.", target: "which" },
      { sentence: "The building in which they work is new.", target: "in which" },
      { sentence: "The author whose book we read is Italian.", target: "whose" },
      { sentence: "The period during which sales fell was brief.", target: "during which" },
      { sentence: "She resigned, which surprised nobody.", target: "which" },
      { sentence: "The rules by which we operate are strict.", target: "by which" },
    ],
    transfer: "The framework on which the study depends has since been revised.",
  },

  "Advanced reporting verbs": {
    examples: [
      { sentence: "He admitted making a mistake.", target: "admitted making" },
      { sentence: "She denied taking the documents.", target: "denied taking" },
      { sentence: "They urged us to reconsider.", target: "urged us to" },
      { sentence: "He suggested postponing the launch.", target: "suggested postponing" },
      { sentence: "She refused to comment.", target: "refused to" },
      { sentence: "They accused him of negligence.", target: "accused him of" },
      { sentence: "He insisted on seeing the manager.", target: "insisted on" },
      { sentence: "She recommended reviewing the contract.", target: "recommended reviewing" },
    ],
    transfer: "The auditor recommended tightening the approval process.",
  },

  "Emphasis with auxiliaries": {
    examples: [
      { sentence: "I do understand your concern.", target: "do understand" },
      { sentence: "She does know the answer.", target: "does know" },
      { sentence: "They did warn us in advance.", target: "did warn" },
      { sentence: "He does care about the outcome.", target: "does care" },
      { sentence: "We do appreciate your patience.", target: "do appreciate" },
      { sentence: "It did seem strange at the time.", target: "did seem" },
      { sentence: "I do apologise for the delay.", target: "do apologise" },
      { sentence: "She did try to reach you.", target: "did try" },
    ],
    transfer: "We do recognise the problem, and we did raise it last month.",
  },

  Fronting: {
    examples: [
      { sentence: "This issue we must address immediately.", target: "This issue" },
      { sentence: "Into the room walked the director.", target: "Into the room" },
      { sentence: "Such generosity I had never seen.", target: "Such generosity" },
      { sentence: "On the table lay the missing file.", target: "On the table" },
      { sentence: "That part of the argument I accept.", target: "That part of the argument" },
      { sentence: "Down came the rain.", target: "Down" },
      { sentence: "His earlier work I admire greatly.", target: "His earlier work" },
      { sentence: "Among the findings was one clear surprise.", target: "Among the findings" },
    ],
    transfer: "These objections the committee has yet to answer.",
  },

  "Complex noun phrases": {
    examples: [
      { sentence: "A carefully designed study produced clear results.", target: "carefully designed" },
      { sentence: "The recently published report on housing is useful.", target: "recently published" },
      { sentence: "A widely accepted definition already exists.", target: "widely accepted" },
      { sentence: "The long-term effects of the policy are unclear.", target: "long-term" },
      { sentence: "A poorly worded question distorted the answers.", target: "poorly worded" },
      { sentence: "The newly appointed director starts in May.", target: "newly appointed" },
      { sentence: "A rapidly growing sector needs regulation.", target: "rapidly growing" },
      { sentence: "The most frequently cited paper is from 2015.", target: "most frequently cited" },
    ],
    transfer: "A thoroughly revised version of the guidance appeared last week.",
  },

  "Register control": {
    examples: [
      { sentence: "We regret to inform you of the delay.", target: "regret to inform you" },
      { sentence: "Please find the details attached.", target: "Please find" },
      { sentence: "I would be grateful if you could reply.", target: "would be grateful if" },
      { sentence: "Kindly confirm receipt of this message.", target: "Kindly confirm" },
      { sentence: "We are writing to request further information.", target: "are writing to request" },
      { sentence: "Should you require assistance, please contact us.", target: "Should you require" },
      { sentence: "I am writing with regard to your enquiry.", target: "with regard to" },
      { sentence: "We look forward to hearing from you.", target: "look forward to hearing" },
    ],
    transfer: "We would be grateful if you could confirm the arrangements in writing.",
  },

  "Advanced tense-aspect choices": {
    examples: [
      { sentence: "By then the team had been working for months.", target: "had been working" },
      { sentence: "She has been leading the department since April.", target: "has been leading" },
      { sentence: "We were reviewing the data when the error appeared.", target: "were reviewing" },
      { sentence: "They will have been operating for a decade by June.", target: "will have been operating" },
      { sentence: "The results had already been published.", target: "had already been published" },
      { sentence: "He is constantly revising his estimates.", target: "is constantly revising" },
      { sentence: "We had been expecting a different outcome.", target: "had been expecting" },
      { sentence: "The policy has been under review since January.", target: "has been" },
    ],
    transfer: "By the time the audit began, the records had already been archived.",
  },

  Parallelism: {
    examples: [
      { sentence: "The role involves planning, analysing, and reporting.", target: "planning, analysing, and reporting" },
      { sentence: "She is efficient, reliable, and thorough.", target: "efficient, reliable, and thorough" },
      { sentence: "We aim to reduce costs, improve quality, and shorten delays.", target: "reduce costs, improve quality, and shorten delays" },
      { sentence: "The course covers reading, writing, and speaking.", target: "reading, writing, and speaking" },
      { sentence: "He works quickly, carefully, and quietly.", target: "quickly, carefully, and quietly" },
      { sentence: "The plan is simple, cheap, and effective.", target: "simple, cheap, and effective" },
      { sentence: "They tested the design, revised it, and tested it again.", target: "tested the design, revised it, and tested it again" },
      { sentence: "Success depends on preparation, timing, and luck.", target: "preparation, timing, and luck" },
    ],
    transfer: "The proposal is clear, concise, and well supported.",
  },

  "Advanced passives review": {
    examples: [
      { sentence: "The work has been completed.", target: "has been completed" },
      { sentence: "The decision is being reviewed.", target: "is being reviewed" },
      { sentence: "The report should have been submitted last week.", target: "should have been submitted" },
      { sentence: "She was given a second chance.", target: "was given" },
      { sentence: "The samples had been tested twice.", target: "had been tested" },
      { sentence: "The funds will be transferred tomorrow.", target: "will be transferred" },
      { sentence: "The issue is being investigated by the team.", target: "is being investigated" },
      { sentence: "He was offered the position last month.", target: "was offered" },
    ],
    transfer: "The findings have been reviewed and will be published in June.",
  },

  "Modals and expressions of probability": {
    examples: [
      { sentence: "He must be at home.", target: "must be" },
      { sentence: "They are bound to notice the change.", target: "are bound to" },
      { sentence: "She is likely to accept the offer.", target: "is likely to" },
      { sentence: "It is conceivable that the data are wrong.", target: "It is conceivable that" },
      { sentence: "The delay might have been avoidable.", target: "might have been" },
      { sentence: "He can't have realised the risk.", target: "can't have realised" },
      { sentence: "The results are unlikely to change.", target: "are unlikely to" },
      { sentence: "She may well be right.", target: "may well" },
    ],
    transfer: "The proposal is bound to attract criticism, though it may well succeed.",
  },

  "Unreal time": {
    examples: [
      { sentence: "It's time we left.", target: "left" },
      { sentence: "I would rather you stayed.", target: "stayed" },
      { sentence: "She behaves as if she knew everything.", target: "knew" },
      { sentence: "I wish he were more careful.", target: "were" },
      { sentence: "It's high time they apologised.", target: "apologised" },
      { sentence: "He speaks as though he had been there.", target: "had been" },
      { sentence: "I would rather we did not discuss it.", target: "did not discuss" },
      { sentence: "She looks as if she had seen a ghost.", target: "had seen" },
    ],
    transfer: "It is time the department reviewed its own procedures.",
  },
};
