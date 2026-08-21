import { describe, expect, it } from "vitest";
import { getCoachingAdminTodos, getCoachingBillingPhase } from "@/lib/coaching/operations";

describe("coaching operations", () => {
  const now = new Date("2026-08-14T10:00:00.000Z");

  it("flags a scheduled consultation two hours after its start time", () => {
    const beforeThreshold = getCoachingAdminTodos(
      {
        id: "application-1",
        applicantName: "Taylor",
        status: "consultation_scheduled",
        consultationScheduledAt: "2026-08-14T08:01:00.000Z",
      },
      now
    );
    const afterThreshold = getCoachingAdminTodos(
      {
        id: "application-1",
        applicantName: "Taylor",
        status: "consultation_scheduled",
        consultationScheduledAt: "2026-08-14T08:00:00.000Z",
      },
      now
    );

    expect(beforeThreshold).toEqual([]);
    expect(afterThreshold).toEqual([
      expect.objectContaining({
        kind: "record_consultation",
        priority: "overdue",
        href: "/admin/coaching?application=application-1",
      }),
    ]);
  });

  it("derives enquiry, recommendation and Everfit actions without storing task rows", () => {
    expect(
      getCoachingAdminTodos({ id: "new", applicantName: "Alex", status: "submitted" }, now)
    ).toEqual([expect.objectContaining({ kind: "review_enquiry" })]);

    expect(
      getCoachingAdminTodos(
        {
          id: "client",
          applicantName: "Sam",
          status: "consultation_completed",
          coachingProfile: {
            status: "onboarding",
            everfitConnectionStatus: "not_started",
            billingPhase: "active",
          },
        },
        now
      ).map((todo) => todo.kind)
    ).toEqual(["send_recommendation", "everfit_setup"]);
  });

  it("distinguishes a scheduled cancellation from the final month", () => {
    expect(
      getCoachingBillingPhase(
        {
          profileStatus: "active",
          subscriptionStatus: "active",
          cancellationRequestedAt: "2026-08-01T00:00:00.000Z",
          finalPaymentAt: "2026-08-20T00:00:00.000Z",
          endsAt: "2026-09-20T00:00:00.000Z",
        },
        now
      )
    ).toBe("cancellation_scheduled");

    expect(
      getCoachingBillingPhase(
        {
          profileStatus: "active",
          subscriptionStatus: "active",
          cancellationRequestedAt: "2026-08-01T00:00:00.000Z",
          finalPaymentAt: null,
          endsAt: "2026-09-01T00:00:00.000Z",
        },
        now
      )
    ).toBe("final_month");
  });

  it("resolves the Everfit closure task once access is removed", () => {
    const connected = getCoachingAdminTodos(
      {
        id: "completed-client",
        applicantName: "Sam",
        status: "converted",
        coachingProfile: {
          status: "completed",
          everfitConnectionStatus: "connected",
          billingPhase: "completed",
        },
      },
      now
    );
    const removed = getCoachingAdminTodos(
      {
        id: "completed-client",
        applicantName: "Sam",
        status: "converted",
        coachingProfile: {
          status: "completed",
          everfitConnectionStatus: "removed",
          billingPhase: "completed",
        },
      },
      now
    );

    expect(connected.map((todo) => todo.kind)).toContain("close_everfit");
    expect(removed.map((todo) => todo.kind)).not.toContain("close_everfit");
  });
});
