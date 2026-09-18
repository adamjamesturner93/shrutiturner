import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { fixtureThemes, fixtureReflections, rysPublicCopy } from "../prisma/fixtures/programmes.ts";

// Local bookable demos. --clean removes other programme records after a private backup.
const url = process.env.DATABASE_URL;
if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname)) {
  throw new Error("Programme demos require a local database");
}
if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
  throw new Error("Bookable demos require a Stripe test key");
}
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
const demos = [
  {
    slug: "demo-rebuilding-your-strength",
    title: "Rebuilding Your Strength",
    pricePence: 12500,
    startsAt: "2027-01-25T00:00:00Z",
    image: "/images/shruti-coaching.jpeg",
    alt: "Shruti coaching a strength exercise",
    subtitle: rysPublicCopy.subtitle,
    summary: rysPublicCopy.shortDescription,
    suitability: rysPublicCopy.whoItsForJson,
    themes: fixtureThemes,
    reflections: fixtureReflections,
  },
  {
    slug: "demo-move-with-confidence",
    title: "Move With Confidence",
    pricePence: 8000,
    startsAt: "2027-02-08T00:00:00Z",
    image: "/images/shruti.jpeg",
    alt: "Shruti Turner",
    subtitle: "Make space for movement that works for you.",
    summary:
      "A four-week small-group programme to explore comfortable movement, build confidence and find practical ways to move more in everyday life.",
    suitability: [
      "You would like to return to movement at your own pace.",
      "You want options for days when your energy or capacity changes.",
      "You enjoy learning alongside a small, supportive group.",
    ],
    themes: [
      "Find Your Starting Point",
      "Explore Your Options",
      "Build Everyday Confidence",
      "Make It Your Own",
    ],
    reflections: [
      "What felt comfortable this week?",
      "Which variation worked well for you?",
      "Where is movement feeling more familiar?",
      "What would you like to keep practising?",
    ],
  },
];
try {
  if (process.argv.includes("--clean")) {
    const keep = demos.map((demo) => `${demo.slug}-2027`);
    await db.$transaction(
      async (tx) => {
        const programmes = await tx.smallGroupProgramme.findMany({
          where: { id: { notIn: keep } },
          include: {
            sessions: true,
            enrollments: true,
            weeks: true,
            posts: true,
            messages: true,
            clearances: true,
            replayAssets: { include: { entitlements: true } },
            instructorAssignments: true,
            giftPurchases: true,
          },
        });
        const ids = programmes.map((p) => p.id);
        const emailIds = programmes.flatMap((p) => p.messages.map((m) => `programme-${m.id}`));
        const emails = await tx.emailDelivery.findMany({ where: { id: { in: emailIds } } });
        const definitions = await tx.programmeDefinition.findMany();
        const backup = join(tmpdir(), `programme-cleanup-${Date.now()}.json`);
        writeFileSync(backup, JSON.stringify({ programmes, definitions, emails }, null, 2), {
          mode: 0o600,
        });
        await tx.emailDelivery.deleteMany({ where: { id: { in: emailIds } } });
        await tx.offeringClearance.deleteMany({ where: { programmeId: { in: ids } } });
        await tx.programmePost.updateMany({
          where: { programmeId: { in: ids } },
          data: { parentId: null },
        });
        await tx.smallGroupProgramme.deleteMany({ where: { id: { in: ids } } });
        await tx.programmeDefinition.deleteMany({
          where: { cohorts: { none: {} }, slug: { notIn: demos.map((d) => d.slug) } },
        });
        console.log(`Removed ${ids.length} old programme records. Private backup: ${backup}`);
      },
      { timeout: 30000 }
    );
  }
  for (const demo of demos) {
    const start = new Date(demo.startsAt);
    const day = (offset: number, hour = 0, minute = 0) =>
      new Date(start.getTime() + offset * 86400000 + hour * 3600000 + minute * 60000);
    await db.$transaction(async (tx) => {
      const definition = await tx.programmeDefinition.upsert({
        where: { slug: demo.slug },
        create: { slug: demo.slug, title: demo.title, description: demo.summary },
        update: {},
      });
      const id = `${demo.slug}-2027`;
      await tx.smallGroupProgramme.upsert({
        where: { id },
        create: {
          id,
          slug: id,
          runSlug: id,
          templateSlug: demo.slug,
          definitionId: definition.id,
          title: `${demo.title} — ${demo.slug.includes("rebuilding") ? "Jan" : "Feb"} '27`,
          subtitle: demo.subtitle,
          shortDescription: demo.summary,
          salesCopy: demo.summary,
          publicVisibility: "listed",
          publicImageUrl: demo.image,
          publicImageAlt: demo.alt,
          whoItsForJson: demo.suitability,
          weekByWeekJson: demo.themes,
          durationLabel: `${demo.themes.length} coached weeks`,
          durationWeeks: demo.themes.length,
          pricePence: demo.pricePence,
          salePricePence: demo.pricePence,
          maximumParticipants: 12,
          cohortSize: 12,
          cohortState: "on_sale",
          enrolmentOpen: true,
          refundWording:
            "Local test programme: payments use Stripe test mode. If this cohort is cancelled, the programme fee is refunded. Contact Shruti before the programme starts to request cancellation.",
          startDate: start,
          timezone: "Europe/London",
          minimumParticipants: 4,
          liveCoachingEndsAt: day((demo.themes.length - 1) * 7 + 4),
          structuredProgrammeEndsAt: day((demo.themes.length - 1) * 7 + 5),
          followUpAccessEndsAt: new Date("2027-03-31T23:00:00Z"),
          confirmationDeadline: day(-7, 9),
          communityOpenAt: day(-3, 9),
          enrolmentClosesAt: day(-1, 18),
          equipment:
            "A sturdy chair, a resistance band and space to move comfortably. Session equipment is provisional for this local demo.",
          closingBody:
            "What Next? Reflect on what you have learned and choose a manageable way to keep moving.",
          resourcesJson: [
            {
              title: "How this programme works",
              body: "Learn each week, join the live session, and use the community to ask questions. This local demo has provisional content and dates.",
            },
          ],
        },
        update: {
          publicVisibility: "listed",
          cohortState: "on_sale",
          enrolmentOpen: true,
          pricePence: demo.pricePence,
          salePricePence: demo.pricePence,
          maximumParticipants: 12,
          cohortSize: 12,
          refundWording:
            "Local test programme: payments use Stripe test mode. If this cohort is cancelled, the programme fee is refunded. Contact Shruti before the programme starts to request cancellation.",
        },
      });
      for (let i = 0; i < demo.themes.length; i++) {
        const sessionId = `${id}-session-${i + 1}`;
        await tx.smallGroupProgrammeSession.upsert({
          where: { programmeId_sequenceNumber: { programmeId: id, sequenceNumber: i + 1 } },
          create: {
            id: sessionId,
            programmeId: id,
            sequenceNumber: i + 1,
            title: `Week ${i + 1} Live Workout`,
            startsAt: day(i * 7 + 2, 18, 30),
            endsAt: day(i * 7 + 2, 19, 15),
          },
          update: {},
        });
        await tx.programmeWeek.upsert({
          where: { programmeId_number: { programmeId: id, number: i + 1 } },
          create: {
            id: `${id}-week-${i + 1}`,
            programmeId: id,
            number: i + 1,
            title: demo.themes[i],
            theme: demo.themes[i],
            sessionId,
            education: `This week we explore ${demo.themes[i].toLowerCase()}. Start with what feels manageable and notice how your capacity changes. This is sample educational copy for local review.`,
            takeaways: [
              "Start with a manageable option.",
              "Adapt to how you feel today.",
              "Bring your questions to the group.",
            ],
            releasesAt: day(i * 7),
            reflectionAt: day(i * 7 + 4, 9),
            reflection: demo.reflections[i],
          },
          update: {},
        });
      }
    });
    console.log(`${demo.title}: /programmes/${demo.slug} | /admin/programmes/${demo.slug}-2027`);
  }
} finally {
  await db.$disconnect();
}
