import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("@/views/dashboard/workshop-setup", () => ({
  WorkshopSetupPage: ({ children }: { children: ReactNode }) =>
    createElement("main", null, children),
}));
import { RetreatRegistration } from "@/views/dashboard/retreat-registration";
function renderRegistration(linked: boolean) {
  const props = {
    initialData: {
      linked,
      residential: false,
      attendeeId: "attendee",
      bookingId: "booking",
      practical: {},
      practicalConfirmedAt: null,
    },
    healthProfile: {},
  } as Parameters<typeof RetreatRegistration>[0];
  return renderToStaticMarkup(createElement(RetreatRegistration, props));
}
it("does not ask a linked workshop attendee to link their place again", () => {
  expect(renderRegistration(true)).not.toContain("Your workshop place");
  expect(renderRegistration(true)).not.toContain("Add this workshop");
});
it("explains the claim action only for an unlinked attendee", () => {
  expect(renderRegistration(false)).toContain("Add this workshop to My Studio");
  expect(renderRegistration(false)).toContain("does not make a new booking");
});
