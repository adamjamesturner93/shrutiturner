import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("personal programme page shows the refreshed hero and delivery detail", async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("newsletter_shown", "true");
  });

  await page.goto("/coaching/personal-programme");

  await expect(
    page.getByRole("heading", {
      name: /Expert programming for people who want structure without weekly calls\./i,
    })
  ).toBeVisible();
  await expect(page.getByText("Delivered in Everfit")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "A lower-touch route with real structure behind it." })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Enquire First" })).toBeVisible();
});

test("coaching page presents three provisional support levels after the human process", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("newsletter_shown", "true");
  });

  await page.goto("/coaching");

  const main = page.locator("#main-content");
  const hero = main.locator("section").first();
  await expect(
    main.getByRole("heading", { name: /Coaching built around your body and your real life/i })
  ).toBeVisible();
  await expect(hero).not.toContainText("Everfit");
  await expect(
    main.getByRole("img", { name: "Shruti Turner paddleboarding on a lake" })
  ).toHaveAttribute("src", "/images/shruti-paddleboarding.jpeg");
  await expect(
    main.getByRole("img", { name: "Shruti Turner paddleboarding on a lake" }).locator("..")
  ).toHaveClass(/aspect-\[4\/3\]/);
  await expect(
    main.getByRole("heading", {
      name: "Coaching can help when you want a plan that gives you direction.",
    })
  ).toBeVisible();
  for (const heading of [
    "Training that can adapt.",
    "Structure without rigidity.",
    "A coach, not just a programme.",
  ]) {
    await expect(main.getByRole("heading", { name: heading })).toBeVisible();
  }
  await expect(main.getByRole("heading", { name: "Working together" })).toBeVisible();
  await expect(
    main.getByText("A clear plan, ongoing conversation and room to adapt when you need it.", {
      exact: true,
    })
  ).toBeVisible();
  await expect(
    main.getByText(
      "We begin with an enquiry, followed by a 30-minute consultation about what you want to achieve, what movement currently looks like for you and anything your training needs to work around.",
      { exact: true }
    )
  ).toBeVisible();
  await expect(
    main.getByRole("img", { name: "Shruti Turner moving outdoors by the sea" })
  ).toHaveAttribute("src", "/images/shruti-coaching.jpeg");
  await expect(
    main.getByText(
      "Your programme, check-ins and resources live in the Everfit app so they stay easy to access. Shruti is your coach; Everfit is simply where the work is organised.",
      { exact: true }
    )
  ).toBeVisible();

  await expect(main.getByRole("heading", { name: "Monthly Support" })).toBeVisible();
  await expect(main.getByRole("heading", { name: "Weekly Support" })).toBeVisible();
  await expect(main.getByRole("heading", { name: "1:1 Coaching" })).toBeVisible();
  await expect(main.getByText("Monthly review & coaching", { exact: true })).toBeVisible();
  await expect(main.getByText("Weekly review & coaching", { exact: true })).toBeVisible();
  await expect(main.getByText("Responsive, collaborative coaching", { exact: true })).toBeVisible();
  await expect(main.getByText("£95 / month")).toBeVisible();
  await expect(main.getByText("£130 / month")).toBeVisible();
  await expect(main.getByText("£180 / month")).toBeVisible();
  await expect(main.getByText("Closer support", { exact: true })).toHaveCount(0);
  await expect(main.getByRole("button", { name: "See full details" })).toHaveCount(0);
  const weeklyCard = main
    .getByRole("heading", { name: "Weekly Support" })
    .locator("xpath=ancestor::article");
  expect(await weeklyCard.locator("ul li span").allTextContents()).toEqual([
    "Personalised training programme across your week.",
    "Weekly programme review and updates.",
    "30-minute coaching call with Shruti each month.",
    "Check-in and feedback through Everfit.",
    "Exercise comments for questions or feedback between reviews.",
    "Nutrition guidance.",
  ]);
  const oneToOneCard = main
    .getByRole("heading", { name: "1:1 Coaching" })
    .locator("xpath=ancestor::article");
  expect(await oneToOneCard.locator("ul li span").allTextContents()).toEqual([
    "Personalised training programme across your week.",
    "Reactive programme adjustments as your needs change.",
    "30-minute coaching call with Shruti each month.",
    "Check-in and feedback through Everfit.",
    "Ongoing direct messaging through Everfit, typically answered within 24 hours.",
    "Nutrition guidance.",
    "More collaborative planning and adaptation.",
  ]);
  await expect(main.getByText("What Stays the Same", { exact: true })).toBeVisible();
  await expect(
    main.getByRole("heading", {
      name: "Every level includes the same quality, personalisation and attention to your individual needs.",
    })
  ).toBeVisible();
  for (const foundation of [
    "A personalised training programme built around your goals, experience and real life.",
    "Training that can adapt as your body, confidence or circumstances change.",
    "A 30-minute coaching call with Shruti each month.",
    "Regular feedback and check-ins through Everfit.",
    "Clear exercise guidance, options and progressions.",
    "Coaching that considers the context behind your training, not just the exercises.",
  ]) {
    await expect(main.getByText(foundation, { exact: true }).last()).toBeVisible();
  }
  await expect(main.getByRole("link", { name: "Enquire" }).first()).toHaveAttribute(
    "href",
    "/coaching/enquire"
  );

  const accessibilityResults = await new AxeBuilder({ page })
    .include("#main-content")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(accessibilityResults.violations).toEqual([]);
});

test("legacy coaching application redirects to the non-submitting enquiry preview", async ({
  page,
}) => {
  let applicationRequests = 0;

  await page.addInitScript(() => {
    window.sessionStorage.setItem("newsletter_shown", "true");
  });
  await page.route("**/api/coaching/applications", async (route) => {
    applicationRequests += 1;
    await route.abort();
  });

  const redirectResponse = await page.request.get("/coaching/apply?offer=one_to_one_coaching", {
    maxRedirects: 0,
  });
  expect(redirectResponse.status()).toBe(301);
  const redirectLocation = new URL(redirectResponse.headers().location);
  expect(redirectLocation.pathname).toBe("/coaching/enquire");
  expect(redirectLocation.search).toBe("");

  await page.goto("/coaching/apply?offer=one_to_one_coaching");

  await expect(page).toHaveURL(/\/coaching\/enquire$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex,\s*follow/i
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://shrutiturner.co.uk/coaching/enquire"
  );
  await expect(
    page.getByRole("heading", { name: "Let’s find the right support for you." })
  ).toBeVisible();
  await expect(
    page.getByText(
      "You don’t need to know which level of coaching is right for you before getting in touch. Tell me a little about what you’re looking for, and we can work that out together.",
      { exact: true }
    )
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "What happens next" })).toBeVisible();
  await expect(
    page.getByText("No need to choose a level of support before we’ve spoken.", { exact: true })
  ).toBeVisible();
  await expect(page.getByText(/Preview only — please do not enter personal/i)).toBeVisible();
  await expect(page.getByLabel("Name *")).toBeDisabled();
  await expect(page.getByLabel("Email *")).toBeDisabled();
  await expect(page.getByLabel("What would you like support with? *")).toBeDisabled();
  await expect(
    page.getByLabel("What does movement/training currently look like for you?")
  ).toBeDisabled();
  await expect(
    page.getByLabel(
      "Is there anything about your health, body or circumstances you’d like me to know?"
    )
  ).toBeDisabled();
  await expect(page.getByLabel("What would you most like to get from coaching? *")).toBeDisabled();
  await expect(page.getByLabel("Anything else you’d like to tell me?")).toBeDisabled();
  await expect(page.getByLabel("How did you hear about me? *")).toBeDisabled();
  await expect(page.getByLabel("How did you hear about me? *")).toHaveAttribute("required", "");
  await expect(page.getByRole("button", { name: "Send enquiry" })).toBeDisabled();
  await expect(page.getByRole("heading", { name: "What happens after I enquire?" })).toBeVisible();
  await expect(
    page.getByText(
      "I’ll read your enquiry personally and get back to you within two working days to arrange a consultation or ask any questions I need to before we speak.",
      { exact: true }
    )
  ).toBeVisible();
  await expect(page.getByText(/1:1 Agreement/i)).toHaveCount(0);
  expect(applicationRequests).toBe(0);

  const accessibilityResults = await new AxeBuilder({ page })
    .include("#main-content")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(accessibilityResults.violations).toEqual([]);
});
