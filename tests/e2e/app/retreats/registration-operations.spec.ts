import { createHash, randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { db } from "../../helpers/db";

async function signIn(page: Page, email: string, path: string) {
  await page.route("**/api/auth/send-code", async (route) => {
    await db.authChallenge.create({
      data: {
        email,
        purpose: "login",
        codeHash: createHash("sha256")
          .update(`${process.env.AUTH_SECRET || "development-auth-secret"}:123456`)
          .digest("hex"),
        expiresAt: new Date(Date.now() + 600_000),
        maxAttempts: 3,
      },
    });
    await route.fulfill({ json: { success: true } });
  });
  await page.goto(`/login?redirect=${encodeURIComponent(path)}`);
  const main = page.locator("#main-content");
  await main.getByRole("button", { name: "Continue with Email" }).click();
  await main.getByLabel("Email Address").fill(email);
  await main.getByRole("button", { name: "Send Verification Code" }).click();
  await main.getByLabel("Verification Code").fill("123456");
  await main.getByRole("button", { name: "Continue", exact: true }).click();
  await page.waitForURL(`**${path}`, { timeout: 30_000 });
}

test("two guests remain grouped, register privately, and have an operational admin view", async ({
  page,
  browser,
}) => {
  test.setTimeout(300_000);
  page.setDefaultTimeout(30_000);
  const key = randomUUID();
  const adminEmail = `e2e-retreat-admin-${key}@example.com`;
  const guestEmail = `e2e-retreat-guest-${key}@example.com`;
  const admin = await db.user.create({
    data: {
      email: adminEmail,
      role: "admin",
      emailVerified: new Date(),
      firstName: "Alex",
      lastName: "Buyer",
    },
  });
  const guest = await db.user.create({
    data: { email: guestEmail, emailVerified: new Date(), firstName: "Sam", lastName: "Friend" },
  });
  const date = await db.retreatDate.create({
    data: {
      externalDateId: `e2e-registration-${key}`,
      retreatSlug: "pause-move-breathe-stirling",
      retreatTitleSnapshot: "Registration operations fixture",
      retreatLocationSnapshot: "Stirling",
      startsAt: new Date("2030-09-18T15:00:00Z"),
      endsAt: new Date("2030-09-20T13:00:00Z"),
      capacity: 10,
      status: "closed",
      pricePence: 42500,
      depositAmountPence: 8500,
    },
  });
  const booking = await db.retreatBooking.create({
    data: {
      retreatDateId: date.id,
      purchaserUserId: admin.id,
      attendeeUserId: admin.id,
      purchaserFirstName: "Alex",
      purchaserLastName: "Buyer",
      purchaserEmail: adminEmail,
      attendeeFirstName: "Alex",
      attendeeLastName: "Buyer",
      attendeeEmail: adminEmail,
      phone: "01234567890",
      emergencyContactName: "Fixture Contact",
      emergencyContactPhone: "01234567891",
      attendeeCount: 2,
      totalPricePence: 91000,
      depositAmountPence: 18200,
      depositPaidPence: 18200,
      balanceAmountPence: 72800,
      paymentStatus: "deposit_paid",
      bookingStatus: "deposit_paid",
      bedPreference: "twin",
      roomType: "Private King Room",
      attendees: {
        create: [
          {
            userId: admin.id,
            email: adminEmail,
            firstName: "Alex",
            lastName: "Buyer",
            displayName: "Alex Buyer",
            isPrimary: true,
            isPurchaser: true,
            status: "claimed",
          },
          { email: guestEmail, firstName: "Sam", lastName: "Friend", displayName: "Sam Friend" },
        ],
      },
    },
    include: { attendees: true },
  });
  const primary = booking.attendees.find((attendee) => attendee.isPrimary)!;
  const secondary = booking.attendees.find((attendee) => !attendee.isPrimary)!;
  let guestContext: Awaited<ReturnType<typeof browser.newContext>> | undefined;
  try {
    await signIn(page, adminEmail, `/admin/retreats/${date.id}`);
    await expect(page.getByRole("heading", { name: "At a glance" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /early bird/i })).toHaveCount(0);
    await page.getByRole("button", { name: "Attendees & bookings", exact: true }).click();
    const group = page.getByRole("article", { name: "Booking for Alex Buyer" });
    await expect(group.getByText("Alex Buyer", { exact: true })).toBeVisible();
    await expect(group.getByText("Sam Friend", { exact: true })).toBeVisible();
    await expect(group.getByText("Registration needed", { exact: true })).toHaveCount(2);
    await group.getByRole("button", { name: "Send registration invitation" }).last().click();
    await expect(page.getByRole("dialog")).toContainText(guestEmail);
    await page.getByRole("dialog").getByRole("button", { name: "Cancel", exact: true }).click();
    await page.getByLabel("View", { exact: true }).selectOption("people");
    await expect(page.getByText(/With Alex Buyer/)).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    const menuButton = page.getByRole("button", { name: "Open admin navigation" });
    await menuButton.click();
    const menu = page.getByRole("dialog", { name: "Admin navigation" });
    await expect(menu.getByRole("link", { name: "View website" })).toHaveAttribute("href", "/");
    await expect(menu.getByRole("button", { name: "Sign out", exact: true })).toBeVisible();
    expect(
      (
        await new AxeBuilder({ page })
          .include('[role="dialog"]')
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations
    ).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(menuButton).toBeFocused();
    expect(
      (
        await new AxeBuilder({ page })
          .include("main")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations
    ).toEqual([]);
    await page.getByRole("button", { name: "Payments", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Booking payments" })).toBeVisible();
    await expect(page.getByText("£182.00 paid · £728.00 outstanding")).toBeVisible();
    await expect(page.getByText("Guest details and invitation history")).toHaveCount(0);
    await page.getByText("More actions", { exact: true }).click();
    await page.getByRole("button", { name: "Cancel event…", exact: true }).click();
    const cancellationDialog = page.getByRole("dialog");
    await expect(cancellationDialog).toContainText("1 bookings · 2 guests");
    await expect(cancellationDialog).toContainText("£182.00");
    await expect(
      cancellationDialog.getByRole("button", { name: "Cancel event and start refunds" })
    ).toBeDisabled();
    await cancellationDialog.getByRole("button", { name: "Keep event", exact: true }).click();
    expect((await db.retreatDate.findUniqueOrThrow({ where: { id: date.id } })).status).toBe(
      "closed"
    );

    console.log(
      "Admin grouping, payment view and mobile accessibility verified; signing in guest."
    );
    await page.goto("/dashboard/retreats");
    const bookingCard = page.locator('[data-slot="card"]').filter({
      has: page.getByRole("heading", { name: "Registration operations fixture", exact: true }),
    });
    await expect(bookingCard).toContainText("2 guests · booked together");
    await expect(bookingCard).toContainText("Alex Buyer (you)");
    await expect(bookingCard).toContainText("Sam Friend");
    await expect(bookingCard.getByRole("link", { name: "Public retreat page" })).toHaveAttribute(
      "href",
      new RegExp(`date=${date.id}`)
    );
    guestContext = await browser.newContext({ baseURL: test.info().project.use.baseURL });
    const guestPage = await guestContext.newPage();
    guestPage.setDefaultTimeout(30_000);
    await signIn(guestPage, guestEmail, `/dashboard/retreats/registration/${secondary.id}`);
    await expect(
      guestPage.getByRole("heading", { name: "Your registration", exact: true })
    ).toBeVisible();
    console.log("Guest registration page visible; checking API ownership.");
    expect(
      (
        await guestContext.request.get(`/api/me/retreat-registrations/${primary.id}`, {
          timeout: 15_000,
        })
      ).status()
    ).toBe(404);
    const registration = await guestContext.request.get(
      `/api/me/retreat-registrations/${secondary.id}`,
      { timeout: 15_000 }
    );
    const data = (await registration.json()).data;
    expect(data).not.toHaveProperty("totalPricePence");
    expect(data).not.toHaveProperty("purchaserEmail");
    await guestPage.getByLabel("Your phone", { exact: true }).fill("07700000001");
    await guestPage.getByLabel("Emergency contact name", { exact: true }).fill("Pat Friend");
    await guestPage.getByLabel("Emergency contact phone", { exact: true }).fill("07700000002");
    await guestPage
      .getByLabel("Dietary requirements (leave blank if none)")
      .fill("Fixture guest-only dietary note");
    await guestPage.getByLabel("These are my details and I confirm they are current.").check();
    await guestPage.getByRole("button", { name: "Save my registration details" }).click();
    await expect(
      guestPage.getByText("Practical details confirmed.", { exact: true })
    ).toBeVisible();
    const saved = await db.retreatAttendee.findUniqueOrThrow({ where: { id: secondary.id } });
    expect(saved.userId).toBe(guest.id);
    expect(saved.practicalConfirmedAt).not.toBeNull();
    expect(
      (await db.retreatAttendee.findUniqueOrThrow({ where: { id: primary.id } }))
        .dietaryRequirements
    ).toBeNull();
    const purchaserData = await page.request.get(`/api/me/retreats/${booking.id}`, {
      timeout: 15_000,
    });
    expect(purchaserData.ok()).toBe(true);
    expect(JSON.stringify(await purchaserData.json())).not.toContain(
      "Fixture guest-only dietary note"
    );
  } finally {
    await guestContext?.close().catch(() => undefined);
    await db.retreatBooking.delete({ where: { id: booking.id } });
    await db.retreatDate.delete({ where: { id: date.id } });
    await db.authChallenge.deleteMany({ where: { email: { in: [adminEmail, guestEmail] } } });
    await db.user.deleteMany({ where: { id: { in: [admin.id, guest.id] } } });
  }
});

test("creation continues into draft setup and copies settings only when requested", async ({
  page,
}) => {
  test.setTimeout(120_000);
  page.setDefaultTimeout(30_000);
  const email = `e2e-retreat-create-${randomUUID()}@example.com`;
  const admin = await db.user.create({ data: { email, role: "admin", emailVerified: new Date() } });
  const dateIds: string[] = [];
  try {
    await signIn(page, email, "/admin/retreats");
    const templates = (await (
      await page.request.get("/api/admin/retreats/templates")
    ).json()) as Array<{ slug: string; title: string; location: string; retreatType: string }>;
    const template = templates.find((item) => item.retreatType === "online");
    expect(template).toBeTruthy();
    await page.getByRole("link", { name: "Create event" }).click();
    await expect(page).toHaveURL(/\/admin\/retreats\/new$/);
    await page.getByRole("radio", { name: "Another date for an existing theme" }).check();
    await page
      .getByLabel("Existing theme", { exact: true })
      .selectOption({ label: template!.title });
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: `Reuse ${template!.title}` })).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Start / arrival").fill("2031-10-04T09:30");
    await page.getByLabel("End / departure").fill("2031-10-04T12:00");
    await page.getByLabel("Starting price (£)").fill("0");
    await page.getByRole("button", { name: "Continue" }).click();
    const createdResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/admin/retreats/create-draft") &&
        response.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Create draft and continue" }).click();
    const created = await createdResponse;
    expect(created.status()).toBe(201);
    const {
      data: { id },
    } = await created.json();
    dateIds.push(id);
    await expect(page).toHaveURL(new RegExp(`/admin/retreats/${id}\\?section=setup`));
    await expect(page.getByRole("heading", { name: "Get ready to open bookings" })).toBeVisible();
    const draft = await db.retreatDate.findUniqueOrThrow({ where: { id } });
    expect(draft.status).toBe("draft");
    expect(draft.pricePence).toBe(0);
    expect(draft.accommodationConfiguredAt).toBeNull();
    await expect(page.getByRole("button", { name: "Open bookings", exact: true })).toBeDisabled();
    const prices = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Ticket prices", exact: true }) });
    await prices.getByRole("spinbutton").fill("35");
    const savedResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/admin/retreats/${id}/ticket-prices`) &&
        response.request().method() === "PUT"
    );
    await prices.getByRole("button", { name: "Save ticket prices" }).click();
    expect((await savedResponse).status()).toBe(200);
    expect((await db.retreatDate.findUniqueOrThrow({ where: { id } })).pricePence).toBe(3500);
    expect(
      (await db.retreatDate.findUniqueOrThrow({ where: { id } })).accommodationConfiguredAt
    ).not.toBeNull();
    const copy = await page.request.post("/api/admin/retreats", {
      data: {
        retreatSlug: template!.slug,
        title: template!.title,
        location: template!.location,
        retreatType: "online",
        startsAt: "2032-10-04T09:30:00Z",
        endsAt: "2032-10-04T12:00:00Z",
        capacity: 30,
        pricePence: 0,
        paymentPolicy: "full_payment",
        copyFromDateId: id,
      },
    });
    expect(copy.status()).toBe(201);
    const copiedId = (await copy.json()).id;
    dateIds.push(copiedId);
    const copied = await db.retreatDate.findUniqueOrThrow({
      where: { id: copiedId },
      include: { bookings: true, roomOptions: { include: { ratePlans: true } } },
    });
    expect(copied.status).toBe("draft");
    expect(copied.bookings).toHaveLength(0);
    expect(
      copied.roomOptions.flatMap((option) => option.ratePlans).map((rate) => rate.totalPricePence)
    ).toEqual([3500]);
    expect(copied.accommodationConfiguredAt).toBeNull();
  } finally {
    await db.adminEventCreation.deleteMany({ where: { actorUserId: admin.id } });
    for (const id of dateIds.reverse()) await db.retreatDate.delete({ where: { id } });
    await db.authChallenge.deleteMany({ where: { email } });
    await db.user.delete({ where: { id: admin.id } });
  }
});
