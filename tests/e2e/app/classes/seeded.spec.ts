import { expect, test } from "@playwright/test";
import { db } from "../../helpers/db";
import { loginWithEmail, preparePasswordlessCode } from "../../helpers/auth";

const SEEDED_MEMBER_EMAIL = "seed.classes.member.unlimited@example.com";
const SEEDED_SESSION_ID = "seed_class_timetable_booked";

test("seeded member sees the booked timetable session in the dashboard schedule", async ({
  page,
}) => {
  const session = await db.classSession.findUnique({
    where: { id: SEEDED_SESSION_ID },
    select: { id: true },
  });

  test.skip(!session, "Requires `pnpm prisma:seed:billing` seeded class data.");

  await preparePasswordlessCode(SEEDED_MEMBER_EMAIL);
  await loginWithEmail(page, SEEDED_MEMBER_EMAIL);
  await page.goto("/dashboard/schedule?wk=1");

  await expect(page.getByRole("heading", { name: "Class Schedule" })).toBeVisible();
  const seededCard = page.locator("div.rounded-lg.border.p-5").filter({
    hasText: "Seeded Timetable Strength",
  });
  await expect(seededCard).toBeVisible();
  await expect(seededCard.getByText("Booked")).toBeVisible();
});
