import { describe, expect, it } from "vitest";
import { getRetreatCardImagePosition } from "@/lib/retreats/images";

describe("retreat card photo focus", () => {
  it("keeps the hiking selfie focused lower in the portrait, including with a query", () => {
    expect(getRetreatCardImagePosition("/images/shruti-hiking-selfie.jpeg")).toBe("50% 68%");
    expect(getRetreatCardImagePosition("/images/shruti-hiking-selfie.jpeg?v=2")).toBe("50% 68%");
  });
  it("preserves the coaching portrait crop and centres unfamiliar images", () => {
    expect(getRetreatCardImagePosition("/images/shruti-coaching.jpeg")).toBe("50% 0%");
    expect(getRetreatCardImagePosition("https://images.ctfassets.net/photo.jpg")).toBe("50% 50%");
  });
});
