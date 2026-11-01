import {
  handleLearnerFeedback,
  learnerFeedbackConfig,
} from "@automaticity/learning-core/learner-feedback-server";

// Without LEARNER_FEEDBACK_GITHUB_TOKEN and _REPO the route reports
// "unavailable" and sends nothing.
const config = () => learnerFeedbackConfig(process.env);

export async function GET(request: Request) {
  return handleLearnerFeedback(request, config());
}
export async function POST(request: Request) {
  return handleLearnerFeedback(request, config());
}
export async function DELETE(request: Request) {
  return handleLearnerFeedback(request, config());
}
