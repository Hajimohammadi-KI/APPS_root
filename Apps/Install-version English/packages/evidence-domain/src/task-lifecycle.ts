export const TASK_LIFECYCLE_STATES = [
  "draft",
  "in_review",
  "approved",
  "scheduled",
  "published",
  "deprecated",
  "retired",
  "blocked",
  "archived",
] as const;

export type TaskLifecycleState = (typeof TASK_LIFECYCLE_STATES)[number];

export interface TaskLifecycleTransition {
  readonly from: TaskLifecycleState;
  readonly to: TaskLifecycleState;
  readonly eventType: string;
  readonly requiresReason: boolean;
  readonly requiresReplacement: boolean;
  readonly requiresApproval: boolean;
}

const transitions: readonly TaskLifecycleTransition[] = [
  transition("draft", "in_review", "submitted_for_review"),
  transition("draft", "archived", "archived", true),
  transition("in_review", "draft", "review_changes_requested", true),
  transition("in_review", "approved", "review_approved", false, false, true),
  transition("in_review", "archived", "archived", true),
  transition("approved", "draft", "review_changes_requested", true),
  transition("approved", "scheduled", "publication_scheduled", false, false, true),
  transition("approved", "published", "published", false, false, true),
  transition("scheduled", "approved", "publication_cancelled", true),
  transition("scheduled", "published", "published", false, false, true),
  transition("scheduled", "blocked", "blocked", true),
  transition("published", "deprecated", "deprecated", true, true),
  transition("published", "retired", "retired", true),
  transition("published", "blocked", "blocked", true),
  transition("deprecated", "published", "deprecated_reversed", true, false, true),
  transition("deprecated", "retired", "retired", true),
  transition("deprecated", "blocked", "blocked", true),
  transition("retired", "archived", "archived", true),
  transition("blocked", "retired", "retired", true),
  transition("blocked", "archived", "archived", true),
];

function transition(
  from: TaskLifecycleState,
  to: TaskLifecycleState,
  eventType: string,
  requiresReason = false,
  requiresReplacement = false,
  requiresApproval = false,
): TaskLifecycleTransition {
  return Object.freeze({
    from,
    to,
    eventType,
    requiresReason,
    requiresReplacement,
    requiresApproval,
  });
}

export function getTaskLifecycleTransition(
  from: TaskLifecycleState,
  to: TaskLifecycleState,
): TaskLifecycleTransition | undefined {
  return transitions.find((candidate) => candidate.from === from && candidate.to === to);
}

export interface TransitionContext {
  readonly reasonCode?: string;
  readonly replacementIsPublished?: boolean;
  readonly approvedAt?: string;
  readonly scheduledFor?: string;
}

export function assertTaskLifecycleTransition(
  from: TaskLifecycleState,
  to: TaskLifecycleState,
  context: TransitionContext = {},
): TaskLifecycleTransition {
  const rule = getTaskLifecycleTransition(from, to);
  if (!rule) {
    throw new Error(`Invalid task lifecycle transition: ${from} -> ${to}`);
  }
  if (rule.requiresReason && !context.reasonCode?.trim()) {
    throw new Error(`Transition ${from} -> ${to} requires a reason code`);
  }
  if (rule.requiresReplacement && context.replacementIsPublished !== true) {
    throw new Error(`Transition ${from} -> ${to} requires a published replacement`);
  }
  if (rule.requiresApproval && !context.approvedAt) {
    throw new Error(`Transition ${from} -> ${to} requires approval`);
  }
  if (to === "scheduled" && !context.scheduledFor) {
    throw new Error("Scheduling requires scheduledFor");
  }
  return rule;
}
