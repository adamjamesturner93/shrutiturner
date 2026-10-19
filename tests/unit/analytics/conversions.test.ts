import { beforeEach, expect, it, vi } from "vitest";
const send = vi.hoisted(() => vi.fn());
vi.mock("@/lib/analytics/client", () => ({ track: send, recalledPlan: () => "weekly" }));
import { trackConfirmedEnquiry, trackStartedCheckout } from "@/lib/analytics/conversions";
beforeEach(() => send.mockClear());
it("does not count an opened, failed or honeypot enquiry as a lead", () => {
  for (const response of [null, {}, { ok: false }, { ok: true }])
    trackConfirmedEnquiry(response, "");
  trackConfirmedEnquiry({ ok: true, id: "application-private" }, "bot");
  expect(send).not.toHaveBeenCalled();
});
it("counts only confirmed enquiries and omits their identifying response ID", () => {
  trackConfirmedEnquiry({ ok: true, id: "application-private" }, "");
  expect(send).toHaveBeenCalledExactlyOnceWith("generate_lead", {
    service_type: "coaching",
    form_location: "coaching_enquire",
    plan_interest: "weekly",
  });
  trackConfirmedEnquiry({ ok: true, id: "application-private" }, "");
  expect(send).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(send.mock.calls)).not.toContain("application-private");
});
it("checkout bridge uses the confirmed session amount in pounds", () => {
  trackStartedCheckout({ slug: "pause-and-restore", kind: "online_workshop", amountPence: 3500 });
  expect(send).toHaveBeenCalledExactlyOnceWith(
    "begin_checkout",
    {
      event_id: "pause-and-restore",
      event_type: "workshop",
      currency: "GBP",
      value: 35,
    },
    undefined
  );
});
it("does not invent unknown checkout values", () => {
  trackStartedCheckout({ slug: "powis-house", kind: "residential_retreat" });
  expect(send).toHaveBeenCalledExactlyOnceWith(
    "begin_checkout",
    {
      event_id: "powis-house",
      event_type: "retreat",
      currency: "GBP",
    },
    undefined
  );
});
