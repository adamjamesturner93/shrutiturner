import AxeBuilder from "@axe-core/playwright";
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

  await expect(
    page.getByRole("banner").getByRole("img", { name: "Shruti Turner" }).locator("..")
  ).toHaveClass(/h-14 sm:h-16/);
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
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://shrutiturner.co.uk/social/active"
  );

  await expect(
    page.getByRole("heading", { name: "Movement that works with your body, not against it." })
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Shruti Turner deadlifting a barbell in a gym" })
  ).toBeVisible();
  await expect(
    page.getByText(
      "I bring together rehabilitation, fitness and wellbeing to personalise training to work with your body and lifestyle.",
      { exact: true }
    )
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Work with me", exact: true })).toHaveAttribute(
    "href",
    "/coaching"
  );
  await expect(page.getByRole("link", { name: /Enquire About Working Together/i })).toHaveCount(0);
  await expect(page.getByText("Is This You?", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your body needs a different approach." })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Fitness doesn’t feel built for you." })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your life doesn’t fit a perfect routine." })
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Placeholder for a video about who Shruti works with" })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Explore Rehabilitation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Explore Fitness" })).toBeVisible();
  const intersectionButton = page.getByRole("button", {
    name: "Explore Where it comes together",
  });
  await expect(intersectionButton).toBeVisible();
  await expect(intersectionButton).toHaveClass(/bg-background\/95/);
  await expect(intersectionButton).toHaveClass(/p-0\.5/);
  await expect(
    page.getByText(
      "Explore each area to see how it shapes my approach to personalising movement and training.",
      { exact: true }
    )
  ).toBeVisible();
  const wellbeingButton = page.getByRole("button", { name: "Explore Wellbeing" });
  await expect(wellbeingButton).toBeVisible();
  await expect(wellbeingButton).toHaveClass(/bg-transparent/);
  await expect(page.locator('[data-venn-circle="wellbeing"]')).toHaveAttribute("stroke", "#56344a");
  await wellbeingButton.hover();
  await expect(page.locator('[data-venn-circle="wellbeing"]')).toHaveAttribute(
    "data-highlighted",
    "true"
  );

  const rehabilitationButton = page.getByRole("button", { name: "Explore Rehabilitation" });
  await rehabilitationButton.focus();
  await expect(rehabilitationButton).toBeFocused();
  await expect(page.locator('[data-venn-circle="rehabilitation"]')).toHaveAttribute(
    "data-highlighted",
    "true"
  );
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Understanding what your body needs." })
  ).toBeVisible();
  await expect(
    dialog.getByRole("img", {
      name: "Shruti Turner performing a band-assisted chest dip",
    })
  ).toHaveAttribute("src", "/images/shruti-banded-chest-dip.jpeg");
  await expect(
    dialog.getByText(
      "The aim: understand your starting point, adapt where needed and build from it.",
      { exact: true }
    )
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  await page.getByRole("button", { name: "Explore Fitness" }).click();
  await expect(
    dialog.getByRole("heading", { name: "Building strength, capacity and confidence." })
  ).toBeVisible();
  await expect(
    dialog.getByRole("img", { name: "Shruti Turner deadlifting a barbell in a gym" })
  ).toBeVisible();
  await expect(
    dialog.getByText(
      "The aim: build what your body can do, rather than chasing someone else’s idea of fitness.",
      { exact: true }
    )
  ).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Explore Wellbeing" }).click();
  await expect(
    dialog.getByRole("heading", { name: "Making movement work in real life." })
  ).toBeVisible();
  await expect(
    dialog.getByRole("img", { name: "Shruti Turner practising Warrior I with her dog nearby" })
  ).toBeVisible();
  await expect(
    dialog.getByText(
      "The aim: make movement something that supports your life, rather than another thing you have to fit yourself around.",
      { exact: true }
    )
  ).toBeVisible();
  await page.keyboard.press("Escape");

  const vennBounds = await page
    .getByRole("group", { name: "Rehabilitation, fitness and wellbeing explorer" })
    .boundingBox();
  const intersectionBounds = await intersectionButton.boundingBox();
  expect(vennBounds).not.toBeNull();
  expect(intersectionBounds).not.toBeNull();
  const intersectionCentreX =
    (intersectionBounds!.x + intersectionBounds!.width / 2 - vennBounds!.x) / vennBounds!.width;
  const intersectionCentreY =
    (intersectionBounds!.y + intersectionBounds!.height / 2 - vennBounds!.y) / vennBounds!.height;
  expect(intersectionCentreX).toBeCloseTo(0.5, 2);
  expect(intersectionCentreY).toBeCloseTo(0.51, 2);
  await intersectionButton.hover();
  await expect(page.locator("[data-venn-intersection]")).toHaveAttribute(
    "data-highlighted",
    "true"
  );
  for (const area of ["rehabilitation", "fitness", "wellbeing"]) {
    await expect(page.locator(`[data-venn-circle="${area}"]`)).toHaveAttribute(
      "data-highlighted",
      "true"
    );
  }
  await intersectionButton.click();
  await expect(dialog.getByRole("heading", { name: "Where it comes together:" })).toBeVisible();
  await expect(
    dialog.getByRole("img", { name: "Shruti Turner smiling while hiking in the hills" })
  ).toBeVisible();
  await expect(
    dialog.getByRole("img", { name: "Shruti Turner smiling while hiking in the hills" })
  ).toHaveAttribute("src", "/images/shruti-hiking-selfie.jpeg");
  await expect(
    dialog.getByText(
      "My approach brings all three together, so we can adapt when we need to, challenge you when we can and keep your goals and real life at the centre.",
      { exact: true }
    )
  ).toBeVisible();
  await page.keyboard.press("Escape");

  await expect(page.getByText("Meet Shruti", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByRole("main").getByRole("img", { name: "Shruti Turner hiking in Patagonia" })
  ).toBeVisible();
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
  await expect(mainNavigation.getByRole("link", { name: "About", exact: true })).toBeVisible();
  await expect(mainNavigation.getByRole("link", { name: "Coaching", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Enquire", exact: true }).first()).toHaveAttribute(
    "href",
    "/coaching/enquire"
  );
  await expect(mainNavigation.getByRole("link", { name: "Contact", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Retreats", exact: true })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Explore" })).toContainText("Contact");
  await expect(page.getByRole("navigation", { name: "Client links" })).toContainText(
    "Email preferences"
  );
  await expect(page.getByRole("navigation", { name: "Legal" })).toBeVisible();

  const accessibilityResults = await new AxeBuilder({ page })
    .include("#main-content")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(accessibilityResults.violations).toEqual([]);
});

test("homepage Venn details stay usable on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("button", { name: "Explore Fitness" }).click();

  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Building strength, capacity and confidence." })
  ).toBeVisible();
  await expect(
    dialog.getByRole("img", { name: "Shruti Turner deadlifting a barbell in a gym" })
  ).toBeVisible();

  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds?.x).toBeGreaterThanOrEqual(0);
  expect((bounds?.x || 0) + (bounds?.width || 0)).toBeLessThanOrEqual(390);
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
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://shrutiturner.co.uk/social/about"
  );
  await expect(
    main.getByRole("heading", {
      name: "Research-led coaching, shaped by a complicated body of my own.",
    })
  ).toBeVisible();
  await expect(
    main.getByText(
      "I bring together research & experience in rehabilitation, fitness and wellbeing to help people move and train in ways that fit their bodies and their real lives. The work is evidence-informed, practical and personal.",
      { exact: true }
    )
  ).toBeVisible();
  await expect(main.getByText("PhD", { exact: true })).toBeVisible();
  await expect(main.getByText("Rehabilitation", { exact: true })).toBeVisible();
  await expect(main.getByText("Personal Trainer", { exact: true })).toBeVisible();
  await expect(main.getByText("Strength & Conditioning Coach", { exact: true })).toBeVisible();
  await expect(main.getByText("Trauma Informed", { exact: true })).toBeVisible();
  await expect(main.getByText("Yoga Teacher", { exact: true })).toBeVisible();
  await expect(main.getByText("Perspective", { exact: true })).toHaveCount(0);
  await expect(
    main.getByRole("img", { name: "Shruti Turner smiling while hiking in Patagonia" })
  ).toBeVisible();
  await expect(
    main.getByRole("heading", {
      name: "I’m interested in what happens when good movement advice meets real life.",
    })
  ).toBeVisible();
  await expect(
    main.getByText(
      "My background spans rehabilitation research, personal training and yoga, but my approach has also been shaped by living with a body that can fluctuate and by working in very different environments, from academia and corporate roles to shift work and self-employment.",
      { exact: true }
    )
  ).toBeVisible();
  await expect(
    main.getByText("I know there isn’t one version of a “normal” body, schedule or lifestyle.", {
      exact: true,
    })
  ).toBeVisible();
  const aboutVideoButton = main.getByRole("button", {
    name: "Play About Shruti Turner video",
  });
  await expect(aboutVideoButton).toHaveAttribute("data-youtube-id", "XYOTSf6EIek");
  await expect(
    main.getByText("Research × Coaching × Lived Experience", { exact: true })
  ).toBeVisible();
  await expect(
    main.getByText("Each matters on its own. The special part is how they work together.", {
      exact: true,
    })
  ).toBeVisible();
  await expect(main.getByRole("heading", { name: "Research", exact: true })).toBeVisible();
  await expect(main.getByRole("heading", { name: "Coaching", exact: true })).toBeVisible();
  await expect(main.getByRole("heading", { name: "Lived experience", exact: true })).toBeVisible();
  await expect(
    main.getByText(
      "PhD and further research in biomechanics and rehabilitation shape how I consider movement, loading and adaptation.",
      { exact: true }
    )
  ).toBeVisible();
  await expect(
    main.getByText(
      "Personal training, strength and conditioning and yoga give us practical ways to turn theory into tangible steps.",
      { exact: true }
    )
  ).toBeVisible();
  await expect(
    main.getByRole("heading", { name: "This work became personal while I was finishing my PhD." })
  ).toBeVisible();
  await expect(
    main.getByText(
      "I was diagnosed with psoriatic arthritis while completing my PhD in rehabilitation. A body I'd largely been able to rely on suddenly became much less predictable.",
      { exact: true }
    )
  ).toBeVisible();
  await expect(
    main.getByText(
      "That doesn't mean your experience will be the same as mine. It means I know the value of asking better questions, understanding the context and finding an approach that actually fits.",
      { exact: true }
    )
  ).toBeVisible();
  await expect(
    main.getByText(
      "Evidence does not replace lived experience. It changes the questions you know to ask.",
      { exact: true }
    )
  ).toBeVisible();
  await expect(
    main.getByText("Click the category to explore my qualifications.", { exact: true })
  ).toBeVisible();

  const researchQualifications = main.getByRole("button", {
    name: "Research & Rehabilitation",
  });
  await expect(researchQualifications).toHaveAttribute("aria-expanded", "false");
  await researchQualifications.click();
  await expect(researchQualifications).toHaveAttribute("aria-expanded", "true");
  const phdQualification = main.getByText("PhD Rehabilitation, Imperial College London", {
    exact: true,
  });
  const mscQualification = main.getByText("MSc Biomedical Engineering, University of Southampton", {
    exact: true,
  });
  await expect(phdQualification).toBeVisible();
  await expect(mscQualification).toBeVisible();
  const phdBounds = await phdQualification.boundingBox();
  const mscBounds = await mscQualification.boundingBox();
  expect(phdBounds).not.toBeNull();
  expect(mscBounds).not.toBeNull();
  expect(phdBounds!.y).toBeLessThan(mscBounds!.y);

  const fitnessQualifications = main.getByRole("button", { name: "Fitness & Coaching" });
  await fitnessQualifications.click();
  await expect(main.getByText("Level 4 Strength & Conditioning", { exact: true })).toBeVisible();
  await expect(main.getByText("Level 3 Personal Trainer", { exact: true })).toBeVisible();
  await expect(
    main.getByText(
      "Specialist courses: Level 3s Exercise Referral, Pre/Post Natal; Level 4s Nutrition for Athletic Performance, Low Back Pain, Obesity, Diabetes",
      { exact: true }
    )
  ).toBeVisible();

  const yogaQualifications = main.getByRole("button", { name: "Yoga & Wellbeing" });
  await yogaQualifications.click();
  for (const qualification of [
    "200 hours Vinyasa Yoga",
    "200 hours Yin Yang Yoga",
    "60 hours Trauma Informed Yoga",
    "300 hours Yoga (specialist modules in neuroscience and anatomy - in progress)",
  ]) {
    await expect(main.getByText(qualification, { exact: true })).toBeVisible();
  }

  await expect(main.getByRole("link", { name: "Explore coaching", exact: true })).toHaveAttribute(
    "href",
    "/coaching"
  );
  await expect(main.getByRole("link", { name: "Enquire", exact: true })).toHaveAttribute(
    "href",
    "/coaching/enquire"
  );
  await expect(
    main.getByText("Explore the coaching options or enquire.", { exact: true })
  ).toBeVisible();

  const structuredDataScripts = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((scripts) => scripts.map((script) => script.textContent ?? ""));
  const person = structuredDataScripts
    .map(
      (script) =>
        JSON.parse(script) as {
          "@type"?: string;
          hasCredential?: Array<{ name: string }>;
        }
    )
    .find((document) => document["@type"] === "Person");
  expect(person).toBeDefined();
  expect(person?.hasCredential?.map((credential) => credential.name)).toEqual([
    "PhD Rehabilitation, Imperial College London",
    "MSc Biomedical Engineering, University of Southampton",
    "Level 4 Strength & Conditioning",
    "Level 3 Personal Trainer",
    "Specialist courses: Level 3s Exercise Referral, Pre/Post Natal; Level 4s Nutrition for Athletic Performance, Low Back Pain, Obesity, Diabetes",
    "200 hours Vinyasa Yoga",
    "200 hours Yin Yang Yoga",
    "60 hours Trauma Informed Yoga",
    "300 hours Yoga (specialist modules in neuroscience and anatomy - in progress)",
  ]);

  const accessibilityResults = await new AxeBuilder({ page })
    .include("#main-content")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(accessibilityResults.violations).toEqual([]);

  await aboutVideoButton.click();
  await expect(main.getByTitle("About Shruti Turner")).toHaveAttribute(
    "src",
    "https://www.youtube-nocookie.com/embed/XYOTSf6EIek?autoplay=1"
  );
});
