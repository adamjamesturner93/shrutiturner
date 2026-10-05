import { createElement } from "react";
import { renderToReadableStream } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import type { RetreatCheckoutPage } from "@/views/retreat-checkout";

const { auth, retreat, requirements, policy, view } = vi.hoisted(() => ({
  auth: vi.fn(),
  retreat: vi.fn(),
  requirements: vi.fn(),
  policy: vi.fn(),
  view: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/retreats/service", () => ({ getOperationalRetreatBySlug: retreat }));
vi.mock("@/lib/legal/acceptance-service", () => ({ getAcceptanceRequirementStates: requirements }));
vi.mock("@/lib/legal/policy-service", () => ({ getCurrentPolicyVersion: policy }));
vi.mock("@/components/public-loading", () => ({ RetreatCheckoutPageLoading: () => null }));
vi.mock("@/views/retreat-checkout", () => ({
  RetreatCheckoutPage: (props: Parameters<typeof RetreatCheckoutPage>[0]) => {
    view(props);
    return createElement("p", null, "Checkout");
  },
}));
import Page from "@/app/(public)/retreats/[slug]/checkout/page";

beforeEach(() => {
  retreat.mockResolvedValue({ slug: "test-retreat" });
  policy.mockResolvedValue({ version: "current-terms" });
});

async function renderPage() {
  const stream = await renderToReadableStream(
    createElement(Page, {
      params: Promise.resolve({ slug: "test-retreat" }),
    })
  );
  await stream.allReady;
  await new Response(stream).text();
  return view.mock.calls[0][0] as Parameters<typeof RetreatCheckoutPage>[0];
}

it.each([false, true])(
  "uses the current acceptance record before checkout (current: %s)",
  async (isCurrent) => {
    auth.mockResolvedValue({ user: { id: "buyer", hasAgreedToTerms: true } });
    const requirement = { type: "terms", currentVersion: "latest-terms", isCurrent };
    requirements.mockResolvedValue([requirement]);
    const props = await renderPage();
    expect(requirements).toHaveBeenCalledWith("buyer", [
      { type: "terms", surface: "retreat_checkout" },
    ]);
    expect(props.initialTermsRequirement).toEqual(requirement);
    expect(props.termsVersion).toBe("latest-terms");
    expect(policy).not.toHaveBeenCalled();
  }
);

it("loads the current policy version for a guest instead of a bundled version", async () => {
  auth.mockResolvedValue(null);
  const props = await renderPage();
  expect(requirements).not.toHaveBeenCalled();
  expect(props.initialTermsRequirement).toBeNull();
  expect(props.termsVersion).toBe("current-terms");
});
