import type { HealthDeclarationStatusDto } from "@/lib/api/types";
import type { DashboardSummaryDto } from "@/lib/api/types";

export type DashboardAccessCard = {
  label: "Membership" | "Class credits";
  value: string | number;
  detail: string;
  statusBadgeLabel: "Membership active" | "Pay as you go";
};

export type ScheduleEmptyState = {
  kind: "none" | "clear_filters" | "week_complete" | "future_week_empty";
  title: string;
  description: string;
};

export function getDashboardAccessCard(
  membership: DashboardSummaryDto["membership"],
  totalCredits: number
): DashboardAccessCard {
  if (membership) {
    return {
      label: "Membership",
      value: "Active",
      detail: "all live classes included",
      statusBadgeLabel: "Membership active",
    };
  }

  return {
    label: "Class credits",
    value: totalCredits,
    detail: totalCredits === 1 ? "1 credit available" : `${totalCredits} credits available`,
    statusBadgeLabel: "Pay as you go",
  };
}

export function shouldPromptForHealthProfile(
  declarationStatus: HealthDeclarationStatusDto,
  hasHealthDataConsent: boolean | undefined,
  needsHealthDataConsentRefresh: boolean | undefined
) {
  return (
    declarationStatus === "incomplete" ||
    !hasHealthDataConsent ||
    Boolean(needsHealthDataConsentRefresh)
  );
}

export function shouldPromptForHealthReview(needsReview: boolean) {
  return needsReview;
}

export function getScheduleEmptyState({
  totalClasses,
  filteredClasses,
  hasActiveFilters,
  weekOffset,
}: {
  totalClasses: number;
  filteredClasses: number;
  hasActiveFilters: boolean;
  weekOffset: number;
}): ScheduleEmptyState {
  if (filteredClasses > 0) {
    return {
      kind: "none",
      title: "",
      description: "",
    };
  }

  if (totalClasses > 0 && hasActiveFilters) {
    return {
      kind: "clear_filters",
      title: "No classes match these filters",
      description:
        "Try a different class type or level, or clear the filters to see everything available this week.",
    };
  }

  if (weekOffset === 0) {
    return {
      kind: "week_complete",
      title: "No classes left this week",
      description: "This week's sessions have finished. Jump ahead now to book into next week.",
    };
  }

  return {
    kind: "future_week_empty",
    title: "Nothing scheduled for this week yet",
    description:
      "There are no sessions published in this week right now. Head back to the current week or check another week.",
  };
}
