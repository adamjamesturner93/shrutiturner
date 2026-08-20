import { expect, test } from "@playwright/test";

test("retired offer routes use permanent redirects that crawlers can reach", async ({
  request,
}) => {
  for (const path of [
    "/classes",
    "/classes/yoga",
    "/classes/small-groups/retired-programme",
    "/pricing",
    "/schedule",
    "/schedule/retired-session",
    "/pt",
  ]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(301);
    expect(new URL(response.headers().location).pathname, path).toBe("/coaching");
  }

  const robots = await request.get("/robots.txt");
  const robotsBody = await robots.text();
  expect(robotsBody).not.toContain("Disallow: /classes");
  expect(robotsBody).not.toContain("Disallow: /pricing");
  expect(robotsBody).not.toContain("Disallow: /schedule");
});

test("obsolete technical posts return Gone for GET and HEAD", async ({ request }) => {
  for (const path of ["/posts", "/posts/old-machine-learning-article"]) {
    const getResponse = await request.get(path);
    expect(getResponse.status(), path).toBe(410);
    await expect(getResponse.text()).resolves.toBe("This content has been permanently removed.");

    const headResponse = await request.head(path);
    expect(headResponse.status(), path).toBe(410);
    await expect(headResponse.text()).resolves.toBe("");
  }
});
