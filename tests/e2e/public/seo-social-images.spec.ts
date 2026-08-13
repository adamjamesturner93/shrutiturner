import { expect, test } from "@playwright/test";

for (const variant of ["active", "about", "blog"]) {
  test(`${variant} social card is a 1200 by 630 PNG`, async ({ request }) => {
    const response = await request.get(`/social/${variant}`);

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");

    const image = await response.body();
    expect(image.subarray(1, 4).toString()).toBe("PNG");
    expect(image.readUInt32BE(16)).toBe(1200);
    expect(image.readUInt32BE(20)).toBe(630);
  });
}

test("unknown social card variants return not found", async ({ request }) => {
  const response = await request.get("/social/unknown");
  expect(response.status()).toBe(404);
});
