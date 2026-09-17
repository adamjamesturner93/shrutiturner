import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { fixtureThemes, fixtureReflections, rysPublicCopy } from "../prisma/fixtures/programmes.ts";

// Local visual-review data, separate from both production drafts and automated fixtures.
const url = process.env.DATABASE_URL;
if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname)) {
  throw new Error("Programme demos require a local database");
}
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
const demos = [
  {
    slug: "demo-rebuilding-your-strength",
    title: "Rebuilding Your Strength",
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
          publicVisibility: "coming_soon",
          publicImageUrl: demo.image,
          publicImageAlt: demo.alt,
          whoItsForJson: demo.suitability,
          weekByWeekJson: demo.themes,
          durationLabel: `${demo.themes.length} coached weeks`,
          durationWeeks: demo.themes.length,
          pricePence: 0,
          cohortSize: 0,
          cohortState: "draft",
          enrolmentOpen: false,
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
        update: {},
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
