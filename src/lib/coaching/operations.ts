import type { CoachingAdminTodoDto, CoachingBillingPhase } from "@/lib/api/types";

const CONSULTATION_FOLLOW_UP_MS = 2 * 60 * 60 * 1000;

type BillingStateInput = {
  profileStatus?: string | null;
  cancellationRequestedAt?: Date | string | null;
  finalPaymentAt?: Date | string | null;
  endsAt?: Date | string | null;
  subscriptionStatus?: string | null;
};

function time(value: Date | string | null | undefined) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

export function getCoachingBillingPhase(
  input: BillingStateInput,
  now = new Date()
): CoachingBillingPhase {
  if (input.profileStatus === "completed" || input.subscriptionStatus === "canceled") {
    return "completed";
  }
  if (["past_due", "unpaid", "incomplete"].includes(input.subscriptionStatus || "")) {
    return "payment_problem";
  }
  if (!input.subscriptionStatus && !input.cancellationRequestedAt) return "not_configured";
  if (!input.cancellationRequestedAt) return "active";

  const finalPaymentAt = time(input.finalPaymentAt);
  const endsAt = time(input.endsAt);
  if (endsAt && now.getTime() >= endsAt) return "completed";
  if (!finalPaymentAt || now.getTime() >= finalPaymentAt) return "final_month";
  return "cancellation_scheduled";
}

type AdminTodoInput = {
  id: string;
  applicantName: string;
  status: string;
  consultationScheduledAt?: string | null;
  coachingProfile?: null | {
    status: string;
    everfitConnectionStatus: string;
    billingPhase: CoachingBillingPhase;
    billingEndsAt?: string | null;
  };
};

export function getCoachingAdminTodos(
  application: AdminTodoInput,
  now = new Date()
): CoachingAdminTodoDto[] {
  const href = `/admin/coaching?application=${encodeURIComponent(application.id)}`;
  const base = {
    applicationId: application.id,
    clientName: application.applicantName,
    href,
  };
  const todos: CoachingAdminTodoDto[] = [];

  if (application.status === "submitted") {
    todos.push({
      ...base,
      id: `review-${application.id}`,
      kind: "review_enquiry",
      priority: "action",
      title: "Review new coaching enquiry",
      detail: `${application.applicantName}'s enquiry has not been reviewed.`,
      dueAt: null,
    });
  }

  if (application.status === "follow_up_needed") {
    todos.push({
      ...base,
      id: `follow-up-${application.id}`,
      kind: "follow_up",
      priority: "action",
      title: "Send coaching follow-up",
      detail: `${application.applicantName} is waiting for follow-up questions.`,
      dueAt: null,
    });
  }

  const consultationAt = time(application.consultationScheduledAt);
  if (
    application.status === "consultation_scheduled" &&
    consultationAt &&
    now.getTime() >= consultationAt + CONSULTATION_FOLLOW_UP_MS
  ) {
    const dueAt = new Date(consultationAt + CONSULTATION_FOLLOW_UP_MS).toISOString();
    todos.push({
      ...base,
      id: `consultation-${application.id}`,
      kind: "record_consultation",
      priority: "overdue",
      title: "Record consultation outcome",
      detail: `${application.applicantName}'s consultation has passed and needs an outcome.`,
      dueAt,
    });
  }

  if (application.status === "consultation_completed") {
    todos.push({
      ...base,
      id: `recommendation-${application.id}`,
      kind: "send_recommendation",
      priority: "action",
      title: "Send coaching recommendation",
      detail: `${application.applicantName}'s consultation is complete.`,
      dueAt: null,
    });
  }

  const profile = application.coachingProfile;
  if (profile && profile.status !== "completed") {
    if (profile.everfitConnectionStatus === "not_started") {
      todos.push({
        ...base,
        id: `everfit-setup-${application.id}`,
        kind: "everfit_setup",
        priority: "action",
        title: "Set up client in Everfit",
        detail: `${application.applicantName}'s coaching profile is ready for manual Everfit setup.`,
        dueAt: null,
      });
    }
    if (profile.everfitConnectionStatus === "sync_issue") {
      todos.push({
        ...base,
        id: `everfit-attention-${application.id}`,
        kind: "everfit_attention",
        priority: "overdue",
        title: "Resolve Everfit issue",
        detail: `${application.applicantName}'s Everfit setup needs attention.`,
        dueAt: null,
      });
    }
    if (profile.billingPhase === "payment_problem") {
      todos.push({
        ...base,
        id: `billing-${application.id}`,
        kind: "billing_attention",
        priority: "overdue",
        title: "Review coaching payment",
        detail: `${application.applicantName}'s Stripe subscription needs attention.`,
        dueAt: null,
      });
    }
    if (profile.billingPhase === "final_month") {
      todos.push({
        ...base,
        id: `handover-${application.id}`,
        kind: "final_month_handover",
        priority: "action",
        title: "Plan final-month handover",
        detail: `${application.applicantName}'s coaching ends at the close of the current paid period.`,
        dueAt: profile.billingEndsAt || null,
      });
    }
  }

  if (
    profile?.status === "completed" &&
    profile.everfitConnectionStatus !== "not_started" &&
    profile.everfitConnectionStatus !== "closed"
  ) {
    todos.push({
      ...base,
      id: `close-everfit-${application.id}`,
      kind: "close_everfit",
      priority: "action",
      title: "Close Everfit access",
      detail: `${application.applicantName}'s website coaching profile is complete.`,
      dueAt: profile.billingEndsAt || null,
    });
  }

  return todos;
}

export function sortCoachingAdminTodos(todos: CoachingAdminTodoDto[]) {
  return [...todos].sort((left, right) => {
    if (left.priority !== right.priority) return left.priority === "overdue" ? -1 : 1;
    if (left.dueAt && right.dueAt) return left.dueAt.localeCompare(right.dueAt);
    if (left.dueAt) return -1;
    if (right.dueAt) return 1;
    return left.clientName.localeCompare(right.clientName);
  });
}
