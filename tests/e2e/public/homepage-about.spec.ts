import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("newsletter_shown", "true");
  });
});

test("homepage follows the streamlined structure and opens the accessible Venn details", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Personal Training & Movement Coaching | Shruti Turner");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Personal training and movement coaching that brings together rehabilitation, fitness and wellbeing. Flexible support built around your body, goals and real life."
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://shrutiturner.co.uk"
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "Movement that works with your body, not against it | Shruti Turner"
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    "https://shrutiturner.co.uk"
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image"
  );

  await expect(
    page.getByRole("heading", { name: "Movement that works with your body, not against it." })
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Shruti Turner strength training with a barbell" })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Work with me", exact: true })).toHaveAttribute(
    "href",
    "/coaching"
  );
  await expect(page.getByRole("link", { name: /Enquire About Working Together/i })).toHaveCount(0);
  await expect(page.getByText("Is This You?", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your body needs a different approach" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Fitness doesn’t feel built for you" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your life doesn’t fit a perfect routine" })
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Placeholder for a video about who Shruti works with" })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Explore Rehabilitation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Explore Fitness" })).toBeVisible();
  const wellbeingButton = page.getByRole("button", { name: "Explore Wellbeing" });
  await expect(wellbeingButton).toBeVisible();
  const restingFill = await wellbeingButton.evaluate(
    (element) => window.getComputedStyle(element).backgroundColor
  );
  await wellbeingButton.hover();
  await expect
    .poll(() =>
      wellbeingButton.evaluate((element) => window.getComputedStyle(element).backgroundColor)
    )
    .not.toBe(restingFill);

  const rehabilitationButton = page.getByRole("button", { name: "Explore Rehabilitation" });
  await rehabilitationButton.focus();
  await expect(rehabilitationButton).toBeFocused();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Rehabilitation" })).toBeVisible();
  await expect(dialog.getByText(/rebuild capacity/i)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  await expect(page.getByText("Meet Shruti", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Researcher. Personal Trainer. Yoga Teacher." })
  ).toBeVisible();
  await expect(page.getByText("The full story stays on About.")).toHaveCount(0);
  await expect(page.getByText("Client Experiences", { exact: true })).toBeVisible();
  await expect(page.locator("blockquote footer")).toHaveCount(3);
  await expect(page.getByText("— Meg K", { exact: true })).toBeVisible();
  await expect(page.getByText("— Lesley R", { exact: true })).toBeVisible();
  await expect(page.getByText("— Megan W", { exact: true })).toBeVisible();
  await expect(page.getByText("Strength & function", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Adaptability", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Confidence & support", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Osteoarthritis", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Long COVID", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Chronic Fatigue", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Not sure what kind of support you need?" })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore coaching", exact: true })).toHaveAttribute(
    "href",
    "/coaching"
  );
  await expect(
    page.getByText(
      "Personal movement and fitness coaching bringing together rehabilitation, fitness and wellbeing. Built around your body, your goals and your real life."
    )
  ).toBeVisible();
  await expect(
    page.getByText("I want newsletter and update emails.", { exact: true })
  ).toBeVisible();
  await expect(page.getByText(/unsubscribe anytime/i)).toHaveCount(1);

  await expect(page.locator("table")).toHaveCount(0);
  await expect(page.getByText("Stay In The Loop", { exact: true })).toHaveCount(0);
  const mainNavigation = page.getByRole("navigation", { name: "Main navigation" });
  await expect(
    mainNavigation.getByRole("link", { name: "Meet Shruti", exact: true })
  ).toBeVisible();
  await expect(
    mainNavigation.getByRole("link", { name: "Work with Shruti", exact: true })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Retreats", exact: true })).toHaveCount(0);
});

test("about page presents the concise story and collapsible qualifications", async ({ page }) => {
  await page.goto("/about");

  const main = page.getByRole("main");
  await expect(page).toHaveTitle("About Shruti Turner | Personal Trainer & Rehabilitation PhD");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Meet Shruti Turner, a Personal Trainer, yoga teacher and rehabilitation researcher bringing together research, coaching and lived experience to support movement and strength."
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://shrutiturner.co.uk/about"
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "Meet Shruti Turner | Research, Coaching & Lived Experience"
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    "https://shrutiturner.co.uk/about"
  );
  await expect(
    main.getByRole("heading", {
      name: "Research-led coaching, shaped by a complicated body of my own.",
    })
  ).toBeVisible();
  await expect(main.getByText("PhD", { exact: true })).toBeVisible();
  await expect(main.getByText("Rehab", { exact: true })).toBeVisible();
  await expect(main.getByText("650+", { exact: true })).toBeVisible();
  await expect(main.getByText("Perspective", { exact: true })).toHaveCount(0);
  await expect(main.getByText("Introduction video coming soon")).toBeVisible();
  await expect(
    main.getByText("Research × Coaching × Lived Experience", { exact: true })
  ).toBeVisible();
  await expect(main.getByRole("heading", { name: "Research", exact: true })).toBeVisible();
  await expect(main.getByRole("heading", { name: "Coaching", exact: true })).toBeVisible();
  await expect(main.getByRole("heading", { name: "Lived experience", exact: true })).toBeVisible();
  await expect(
    main.getByRole("heading", { name: "This work became personal while I was finishing my PhD." })
  ).toBeVisible();
  await expect(
    main.getByRole("img", { name: "Shruti Turner hiking in the mountains" })
  ).toBeVisible();

  const researchQualifications = main.getByRole("button", {
    name: "Research & rehabilitation",
  });
  await expect(researchQualifications).toHaveAttribute("aria-expanded", "false");
  await researchQualifications.click();
  await expect(researchQualifications).toHaveAttribute("aria-expanded", "true");
  await expect(main.getByText(/Doctoral research informing/i)).toBeVisible();

  await expect(main.getByRole("link", { name: "Explore coaching", exact: true })).toHaveAttribute(
    "href",
    "/coaching"
  );
  await expect(main.getByRole("link", { name: "Enquire", exact: true })).toHaveAttribute(
    "href",
    "/coaching/apply"
  );
});
