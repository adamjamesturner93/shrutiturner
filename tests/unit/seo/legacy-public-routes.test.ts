import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/retreats/service", () => ({
  getRetreatBalancePaymentStateByToken: vi.fn(),
}));

vi.mock("@/views/retreat-balance", () => ({
  RetreatBalancePage: () => null,
}));

const postsRoute = await import("@/app/(public)/posts/[[...slug]]/route");
const balancePage = await import("@/app/(public)/retreats/balance/[token]/page");
const { redirectLegacyOfferToCoaching } = await import("@/lib/seo/legacy-redirect");

describe("legacy and transactional public routes", () => {
  it("returns Gone for retired posts on GET and HEAD", async () => {
    const getResponse = postsRoute.GET();
    const headResponse = postsRoute.HEAD();

    expect(getResponse.status).toBe(410);
    await expect(getResponse.text()).resolves.toBe("This content has been permanently removed.");
    expect(headResponse.status).toBe(410);
    await expect(headResponse.text()).resolves.toBe("");
  });

  it("permanently redirects retired offers to coaching", () => {
    const response = redirectLegacyOfferToCoaching(
      new Request("https://shrutiturner.co.uk/classes")
    );

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://shrutiturner.co.uk/coaching");
  });

  it("keeps tokenised retreat balance pages out of search", () => {
    expect(balancePage.metadata.robots).toEqual({ index: false, follow: false });
  });
});
