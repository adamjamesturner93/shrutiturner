import { expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/analytics/receipt/route";
import { makeReceipt } from "@/lib/analytics/receipt";
function request(cookie: string, origin = "https://shrutiturner.co.uk") {
  return new NextRequest("https://shrutiturner.co.uk/api/analytics/receipt", {
    method: "POST",
    headers: { origin, cookie },
  });
}
it("returns a validated receipt only with current consent and clears it", async () => {
  const response = await POST(
    request(`st_analytics=granted; st_analytics_receipt=${makeReceipt("footer", true)}`)
  );
  expect(await response.json()).toMatchObject({ source: "footer", guide: true });
  expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  expect(response.headers.get("cache-control")).toBe("no-store");
});
it("does not trust query parameters, unsigned receipts or missing/withdrawn consent", async () => {
  for (const cookie of [
    "",
    "st_analytics=denied",
    "st_analytics=granted; st_analytics_receipt=success",
    `st_analytics_receipt=${makeReceipt("footer", true)}`,
  ]) {
    expect(await (await POST(request(cookie))).json()).toEqual({});
  }
});
it("rejects cross-origin receipt consumption", async () => {
  expect((await POST(request("st_analytics=granted", "https://other.test"))).status).toBe(403);
});

it("withdrawal deletes the HttpOnly receipt without returning analytics proof", async () => {
  const { DELETE } = await import("@/app/api/analytics/receipt/route");
  const response = await DELETE(request("st_analytics=denied"));
  expect(response.status).toBe(204);
  expect(await response.text()).toBe("");
  expect(response.headers.get("set-cookie")).toContain("st_analytics_receipt=;");
  expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  expect((await DELETE(request("", "https://other.test"))).status).toBe(403);
});
