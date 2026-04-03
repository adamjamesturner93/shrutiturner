import { describe, expect, it } from "vitest";
import {
  getDashboardAccessCard,
  getScheduleEmptyState,
  shouldPromptForHealthProfile,
  shouldPromptForHealthReview,
} from "@/views/dashboard/dashboard-view-model";

describe("dashboard view model helpers", () => {
  it("keeps the access summary focused on membership when a plan is active", () => {
    expect(
      getDashboardAccessCard(
        {
          id: "membership_123",
          plan: "movewell",
          label: "Move Well Membership",
          billingInterval: "monthly",
          isAnnual: false,
          status: "active",
          renewalDate: "2026-04-25",
          classesPerWeek: 99,
          classesUsedThisWeek: 2,
          classesRemaining: 97,
          pricePence: 2900,
          cancelAtPeriodEnd: false,
          accessActive: true,
          endsAt: null,
          compliance: {
            disclosureVersion: "2026-04-03",
            disclosureAcceptedAt: "2026-04-03T10:00:00.000Z",
            inInitialCoolingOff: false,
            inRenewalCoolingOff: false,
            trialEndsAt: "2026-04-17",
            initialCoolingOffEndsAt: "2026-04-17",
            renewalCoolingOffEndsAt: null,
            renewalCoolingOffKind: null,
          },
        },
        9
      )
    ).toEqual({
      label: "Membership",
      value: "Active",
      detail: "all live classes included",
      statusBadgeLabel: "Membership active",
    });
  });

  it("shows a pay-as-you-go access summary when no membership is active", () => {
    expect(getDashboardAccessCard(null, 9)).toEqual({
      label: "Class credits",
      value: 9,
      detail: "9 credits available",
      statusBadgeLabel: "Pay as you go",
    });
  });

  it("prompts for the health profile when consent is missing even if the profile exists", () => {
    expect(shouldPromptForHealthProfile("none_declared", false, false)).toBe(true);
  });

  it("prompts for the health profile when the declaration is still incomplete", () => {
    expect(shouldPromptForHealthProfile("incomplete", true, false)).toBe(true);
  });

  it("does not prompt for the health profile when declaration and consent are complete", () => {
    expect(shouldPromptForHealthProfile("none_declared", true, false)).toBe(false);
  });

  it("prompts for a monthly health review when the declaration is stale", () => {
    expect(shouldPromptForHealthReview(true)).toBe(true);
  });

  it("does not prompt for a monthly health review when the declaration is current", () => {
    expect(shouldPromptForHealthReview(false)).toBe(false);
  });

  it("returns a clear-filters empty state when filters hide available classes", () => {
    expect(
      getScheduleEmptyState({
        totalClasses: 6,
        filteredClasses: 0,
        hasActiveFilters: true,
        weekOffset: 0,
      })
    ).toMatchObject({
      kind: "clear_filters",
      title: "No classes match these filters",
    });
  });

  it("returns a next-week empty state when this week has finished", () => {
    expect(
      getScheduleEmptyState({
        totalClasses: 0,
        filteredClasses: 0,
        hasActiveFilters: false,
        weekOffset: 0,
      })
    ).toMatchObject({
      kind: "week_complete",
      title: "No classes left this week",
    });
  });

  it("returns a future-week empty state for unpublished weeks", () => {
    expect(
      getScheduleEmptyState({
        totalClasses: 0,
        filteredClasses: 0,
        hasActiveFilters: false,
        weekOffset: 2,
      })
    ).toMatchObject({
      kind: "future_week_empty",
      title: "Nothing scheduled for this week yet",
    });
  });
});
