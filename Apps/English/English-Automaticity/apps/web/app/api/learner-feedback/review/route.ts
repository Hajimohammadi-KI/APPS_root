import {
  handleLearnerFeedbackReview,
  learnerFeedbackConfig,
} from "@automaticity/learning-core/learner-feedback-server";

// The owner's review list; also needs LEARNER_FEEDBACK_REVIEW_KEY.
const config = () => learnerFeedbackConfig(process.env);

export async function GET(request: Request) {
  return handleLearnerFeedbackReview(request, config());
}
export async function POST(request: Request) {
  return handleLearnerFeedbackReview(request, config());
}
