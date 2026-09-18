import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("@/components/layout", () => ({
  Layout: ({ children }: { children: ReactNode }) => children,
}));
import {
  ProgrammePurchaseConfirmation,
  type ProgrammeConfirmationProps,
} from "@/views/programmes/purchase-confirmation";
const props: ProgrammeConfirmationProps = {
  id: "cohort",
  title: "Rebuilding Your Strength",
  start: "2027-01-25T00:00:00Z",
  end: "2027-02-26T23:59:59Z",
  accessEnd: "2027-03-31T22:59:59Z",
  timezone: "Europe/London",
  state: "paid",
  signedIn: true,
  participant: true,
  gift: false,
};
const render = (changes: Partial<ProgrammeConfirmationProps> = {}) =>
  renderToStaticMarkup(createElement(ProgrammePurchaseConfirmation, { ...props, ...changes }));
describe("programme purchase confirmation", () => {
  it("recognises the signed-in participant", () => {
    const html = render();
    expect(html).toContain("Continue to programme onboarding");
    expect(html).toContain("You&#x27;re signed in");
    expect(html).not.toContain("Sign in or activate");
  });
  it("directs an unsigned participant to account activation", () => {
    expect(render({ signedIn: false, participant: false })).toContain(
      "Sign in or activate account"
    );
  });
  it("does not give a gift purchaser participant links", () => {
    const html = render({ gift: true, participant: false });
    expect(html).toContain("Go to My Studio");
    expect(html).not.toContain("/calendar");
    expect(html).not.toContain("/onboarding");
  });
  it("withholds participant actions while payment is pending", () => {
    const html = render({ state: "pending" });
    expect(html).toContain("payment is being confirmed");
    expect(html).not.toContain("/calendar");
    expect(html).not.toContain("/onboarding");
  });
});
