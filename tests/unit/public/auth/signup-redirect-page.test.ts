import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

const page = await import("@/app/(public)/signup/page");

describe("/signup redirect page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login and preserves query params", async () => {
    const result = page.default({
      searchParams: Promise.resolve({
        redirect: "/gift/redeem/abc123",
        ref: "friend-code",
        intent: "book",
      }),
    });
    const content = result.props.children;
    await content.type(content.props);

    expect(redirectMock).toHaveBeenCalledWith(
      "/login?redirect=%2Fgift%2Fredeem%2Fabc123&ref=friend-code&intent=book"
    );
  });

  it("redirects to plain /login when there are no params", async () => {
    const result = page.default({
      searchParams: Promise.resolve({}),
    });
    const content = result.props.children;
    await content.type(content.props);

    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
