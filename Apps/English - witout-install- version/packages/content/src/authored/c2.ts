// Phase 1 authored content for C2. Same contract as `authored/a1.ts`.
//
// C2 units name discourse-level skills rather than single structures, so the
// migrated source for several of them holds only a category label ("Unclear
// pronoun reference.") instead of a usable sentence -- which is exactly why
// they sat at 2-3 distinct retrieval targets. Each sentence below therefore
// puts the skill into an actual sentence and masks the element that carries
// it, giving the unit something concrete to retrieve.

import type { AuthoredUnit } from "./a1";

export const C2_AUTHORED: Readonly<Record<string, AuthoredUnit>> = {
  "Marked word order": {
    examples: [
      { sentence: "Only then did the implications become clear.", target: "did the implications become" },
      { sentence: "Rarely have we encountered such resistance.", target: "have we encountered" },
      { sentence: "Not until the audit did anyone question the figures.", target: "did anyone question" },
      { sentence: "So compelling was the argument that nobody objected.", target: "So compelling was" },
      { sentence: "Little had they expected such a response.", target: "had they expected" },
      { sentence: "Only after the meeting did she raise the issue.", target: "did she raise" },
      { sentence: "Such was the demand that stocks ran out.", target: "Such was" },
      { sentence: "Never before had the process been questioned.", target: "had the process been questioned" },
    ],
    transfer: "Only in retrospect did the pattern become obvious.",
  },

  "Layered subordination": {
    examples: [
      { sentence: "The report, which the committee commissioned after the delay was announced, remains unpublished.", target: "which the committee commissioned" },
      { sentence: "Because the data were incomplete, the team, who had worked for months, restarted the analysis.", target: "who had worked for months" },
      { sentence: "Although she agreed, she noted that the timing, which nobody had discussed, was awkward.", target: "which nobody had discussed" },
      { sentence: "The proposal that the board rejected had been drafted before the rules changed.", target: "that the board rejected" },
      { sentence: "When the results arrived, the manager, realising the error, called a meeting.", target: "realising the error" },
      { sentence: "The method, although widely used, fails when the sample is small.", target: "although widely used" },
      { sentence: "He argued that the policy, since it predated the merger, no longer applied.", target: "since it predated the merger" },
      { sentence: "The decision, made after consultation, satisfied nobody.", target: "made after consultation" },
    ],
    transfer: "The clause, which the lawyers added late, changes what the contract actually requires.",
  },

  "Nuanced modality": {
    examples: [
      { sentence: "You need not have paid in advance.", target: "need not have paid" },
      { sentence: "She should have been informed earlier.", target: "should have been informed" },
      { sentence: "They didn't have to attend the session.", target: "didn't have to" },
      { sentence: "He might well have misunderstood the request.", target: "might well have" },
      { sentence: "We ought to have checked the figures.", target: "ought to have checked" },
      { sentence: "You could have mentioned it sooner.", target: "could have mentioned" },
      { sentence: "She would have refused under any circumstances.", target: "would have refused" },
      { sentence: "The claim cannot possibly be accurate.", target: "cannot possibly" },
    ],
    transfer: "They need not have rushed, though they should have warned us.",
  },

  "Counterfactual distance": {
    examples: [
      { sentence: "I wonder if you could help me with this.", target: "could" },
      { sentence: "I was hoping you might reconsider.", target: "was hoping" },
      { sentence: "Would it be possible to reschedule?", target: "Would it be possible" },
      { sentence: "I had wondered whether you were available.", target: "had wondered" },
      { sentence: "We were thinking of asking for an extension.", target: "were thinking" },
      { sentence: "It might be worth reviewing the terms.", target: "might be worth" },
      { sentence: "I would suggest a shorter timeline.", target: "would suggest" },
      { sentence: "Perhaps we could revisit this next week.", target: "could" },
    ],
    transfer: "I was wondering whether you might be able to look at this today.",
  },

  "Advanced cohesion": {
    examples: [
      { sentence: "The study reported three findings. These were later disputed.", target: "These" },
      { sentence: "Two options were proposed. The former was cheaper.", target: "The former" },
      { sentence: "The policy changed in 2020. Such reforms are rare.", target: "Such reforms" },
      { sentence: "Costs rose sharply. This trend continued all year.", target: "This trend" },
      { sentence: "They tested two methods. The latter proved faster.", target: "The latter" },
      { sentence: "The team missed the deadline. That failure had consequences.", target: "That failure" },
      { sentence: "Several errors appeared. Each of them was minor.", target: "Each of them" },
      { sentence: "The argument has two parts. The first concerns cost.", target: "The first" },
    ],
    transfer: "The committee raised two objections. Neither of them was addressed.",
  },

  "Rhetorical grammar": {
    examples: [
      { sentence: "It was not the cost that worried them, but the delay.", target: "not the cost that worried them, but" },
      { sentence: "The plan was bold, ambitious, and entirely unfunded.", target: "and entirely unfunded" },
      { sentence: "We can wait, or we can act.", target: "or we can act" },
      { sentence: "The more they explained, the less anyone understood.", target: "The more they explained, the less" },
      { sentence: "This is not a small problem; it is the whole problem.", target: "it is the whole problem" },
      { sentence: "What began as a trial became a policy.", target: "What began as a trial became" },
      { sentence: "They promised transparency. They delivered silence.", target: "They delivered silence" },
      { sentence: "Not only was it late, it was also incomplete.", target: "Not only was it late" },
    ],
    transfer: "It was not the decision itself that caused concern, but the way it was announced.",
  },

  "Compressed academic structures": {
    examples: [
      { sentence: "The results, published last year, remain contested.", target: "published last year" },
      { sentence: "Smith, a leading researcher, disputes the finding.", target: "a leading researcher" },
      { sentence: "The samples analysed showed no significant variation.", target: "analysed" },
      { sentence: "Three factors, all economic, explain the shift.", target: "all economic" },
      { sentence: "The data collected in 2019 support this view.", target: "collected in 2019" },
      { sentence: "The approach, now standard, was once controversial.", target: "now standard" },
      { sentence: "Participants completing the survey received a summary.", target: "completing the survey" },
      { sentence: "The theory, first proposed in 1970, still holds.", target: "first proposed in 1970" },
    ],
    transfer: "The framework, developed over a decade, underpins current practice.",
  },

  "Idiomatic clause patterns": {
    examples: [
      { sentence: "It stands to reason that costs will rise.", target: "It stands to reason that" },
      { sentence: "There is no point in arguing about it.", target: "There is no point in" },
      { sentence: "It goes without saying that safety comes first.", target: "It goes without saying that" },
      { sentence: "It is worth noting that the sample was small.", target: "It is worth noting that" },
      { sentence: "There is little to be gained from delaying.", target: "There is little to be gained from" },
      { sentence: "It remains to be seen whether it works.", target: "It remains to be seen whether" },
      { sentence: "It came as no surprise that she resigned.", target: "It came as no surprise that" },
      { sentence: "There is much to be said for the simpler option.", target: "There is much to be said for" },
    ],
    transfer: "It goes without saying that the deadline cannot move again.",
  },

  "Ambiguity control": {
    examples: [
      { sentence: "The manager approved the plan that the team had drafted.", target: "that the team had drafted" },
      { sentence: "After the director resigned, the deputy took over.", target: "After the director resigned" },
      { sentence: "She told Anna that Anna's report was late.", target: "Anna's report" },
      { sentence: "Only the finance team reviewed the figures.", target: "Only the finance team" },
      { sentence: "The report, not the summary, was circulated.", target: "not the summary" },
      { sentence: "We rejected the proposal because it was incomplete.", target: "because it was incomplete" },
      { sentence: "The letter from the lawyer arrived on Tuesday.", target: "from the lawyer" },
      { sentence: "Each manager submitted his or her own budget.", target: "his or her own" },
    ],
    transfer: "The auditor questioned the invoice that the supplier had issued in March.",
  },

  "Style shifting": {
    examples: [
      { sentence: "We regret that the service was unsatisfactory.", target: "We regret that" },
      { sentence: "Sorry the service was so poor.", target: "Sorry" },
      { sentence: "The company acknowledges the delay.", target: "acknowledges" },
      { sentence: "We know it took ages.", target: "took ages" },
      { sentence: "Compensation will be issued in due course.", target: "in due course" },
      { sentence: "You will get your money back soon.", target: "get your money back" },
      { sentence: "Please accept our sincere apologies.", target: "Please accept our sincere apologies" },
      { sentence: "We are really sorry about this.", target: "really sorry" },
    ],
    transfer: "The board regrets the disruption and will address it at the next review.",
  },

  "Advanced punctuation and grammar": {
    // Targets are words, not punctuation marks. A bare ";" cannot be masked by
    // the whole-word matcher -- the character before it is a letter, so the
    // lookbehind rejects it -- and a lone "___" standing for a semicolon would
    // not read as a task anyway. Masking the connector that the punctuation
    // works with tests the same clause-hierarchy control and is answerable.
    examples: [
      { sentence: "The trial ended early; the data are therefore limited.", target: "therefore" },
      { sentence: "We tested three variants: red, blue, and green.", target: "variants" },
      { sentence: "The report, which ran to sixty pages, arrived late.", target: "which" },
      { sentence: "She finished the draft, and he reviewed it.", target: "and" },
      { sentence: "The results were clear, but nobody accepted them.", target: "but" },
      { sentence: "He argued, however, that the method was flawed.", target: "however" },
      { sentence: "Three teams applied; only one qualified.", target: "only" },
      { sentence: "The deadline, originally June, was extended.", target: "originally" },
    ],
    transfer: "The evidence was strong; nevertheless, the committee hesitated.",
  },

  "Editing for naturalness": {
    examples: [
      { sentence: "She made a decision quickly.", target: "made a decision" },
      { sentence: "We reached an agreement on Friday.", target: "reached an agreement" },
      { sentence: "He took responsibility for the error.", target: "took responsibility" },
      { sentence: "They raised concerns about the timing.", target: "raised concerns" },
      { sentence: "The change had a significant impact.", target: "had a significant impact" },
      { sentence: "She paid close attention to the detail.", target: "paid close attention" },
      { sentence: "We drew a clear conclusion from the data.", target: "drew a clear conclusion" },
      { sentence: "He gave a brief explanation of the delay.", target: "gave a brief explanation" },
    ],
    transfer: "The team reached a decision and took full responsibility for it.",
  },

  "Genre-specific grammar": {
    examples: [
      { sentence: "The study concludes that the effect is small.", target: "concludes that" },
      { sentence: "Then she opened the door and everything changed.", target: "Then" },
      { sentence: "This report sets out three recommendations.", target: "sets out" },
      { sentence: "We propose that the deadline be extended.", target: "be extended" },
      { sentence: "As shown in Figure 2, the trend is upward.", target: "As shown in Figure 2" },
      { sentence: "First, I will outline the background.", target: "First" },
      { sentence: "It is recommended that costs be reviewed annually.", target: "be reviewed" },
      { sentence: "In summary, the approach is sound but slow.", target: "In summary" },
    ],
    transfer: "This proposal recommends that the pilot be extended by six months.",
  },

  "Integrated automatic production": {
    examples: [
      { sentence: "Although the deadline moved, the team delivered on time.", target: "Although the deadline moved" },
      { sentence: "Having reviewed the figures, we approved the budget.", target: "Having reviewed the figures" },
      { sentence: "The results, which arrived late, confirmed our estimate.", target: "which arrived late" },
      { sentence: "If the supplier confirms, we will proceed immediately.", target: "If the supplier confirms" },
      { sentence: "The report has been revised and will be circulated today.", target: "has been revised" },
      { sentence: "Not only did costs fall, but quality also improved.", target: "Not only did costs fall" },
      { sentence: "What the project needs is a clear owner.", target: "What the project needs is" },
      { sentence: "The plan is likely to succeed, provided funding continues.", target: "provided funding continues" },
    ],
    transfer: "Having weighed the options, the board decided that the pilot should continue.",
  },
};
