import { createClient } from "contentful-management";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getContentfulScriptEnv } from "./env.ts";

const { spaceId, environmentId, managementToken } = getContentfulScriptEnv();
if (environmentId !== "sandbox") throw new Error("Test testimonials require Contentful sandbox.");
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || !["localhost", "127.0.0.1", "[::1]"].includes(new URL(databaseUrl).hostname))
  throw new Error("Linking test testimonials requires a local database.");
const apply = process.argv.includes("--apply");
const samples = [
  {
    id: "sandbox-home-1",
    area: "Home",
    context: "Class participant — fictional test",
    quote:
      "[TEST QUOTE] I felt welcome from the first session and could move at a pace that suited me.",
  },
  {
    id: "sandbox-home-2",
    area: "Home",
    context: "Class participant — fictional test",
    quote:
      "[TEST QUOTE] The explanations were clear, with plenty of options to make each movement comfortable.",
  },
  {
    id: "sandbox-retreats-1",
    area: "Retreats General",
    context: "Previous retreat attendee — fictional test",
    quote:
      "[TEST QUOTE] There was time to move, time to rest and space to enjoy being with a small group.",
  },
  {
    id: "sandbox-retreats-2",
    area: "Retreats General",
    context: "Previous workshop attendee — fictional test",
    quote:
      "[TEST QUOTE] I arrived unsure what to expect and left feeling included, supported and glad I had joined.",
  },
  {
    id: "sandbox-event-1",
    area: "Retreat",
    context: "Previous retreat attendee — fictional test",
    quote:
      "[TEST QUOTE] The balance of gentle practice, shared meals and quiet time made the weekend feel unhurried.",
  },
  {
    id: "sandbox-event-2",
    area: "Retreat",
    context: "Previous workshop attendee — fictional test",
    quote:
      "[TEST QUOTE] I appreciated the different movement options and being encouraged to choose what worked for me.",
  },
  {
    id: "sandbox-event-3",
    area: "Retreat",
    context: "Class participant — fictional test",
    quote:
      "[TEST QUOTE] Clear guidance and a friendly group helped me feel comfortable trying something new.",
  },
];
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
try {
  const experience = await db.retreatExperience.findUnique({
    where: { slug: "local-powis-room-review" },
  });
  if (!experience) throw new Error("Create the local Powis room-review fixture first.");
  const environment = await (
    await createClient({ accessToken: managementToken }, { type: "legacy" }).getSpace(spaceId)
  ).getEnvironment(environmentId);
  const locales = await environment.getLocales();
  const locale = locales.items.find((item) => item.default)?.code;
  if (!locale) throw new Error("No default Contentful locale.");
  const overview = await environment.getEntries({
    content_type: "testimonialSelection",
    "fields.slug": "retreats-overview",
    limit: 1,
  });
  if (overview.items.some((entry) => entry.sys.id !== "sandbox-retreats-selection"))
    throw new Error("An editorial overview selection already exists; review it before replacing.");
  const entries = await environment.getEntries({
    "sys.id[in]": [...samples.map((sample) => sample.id), "sandbox-retreats-selection"].join(","),
    limit: 100,
  });
  if (entries.items.some((entry) => entry.isPublished() && entry.isUpdated()))
    throw new Error("A test entry has unpublished edits; preserve them before reseeding.");
  for (const sample of samples) {
    console.log(`${apply ? "Publishing" : "Would publish"} ${sample.id}: ${sample.area}`);
    if (!apply) continue;
    const fields = {
      slug: { [locale]: sample.id },
      quote: { [locale]: sample.quote },
      authorName: { [locale]: `Sample attendee ${sample.id.split("-").at(-1)} (TEST)` },
      contextLabel: { [locale]: sample.context },
      approvedPlacements: { [locale]: [sample.area] },
      featured: { [locale]: sample.area === "Home" },
    };
    const existing = entries.items.find((entry) => entry.sys.id === sample.id);
    if (existing) existing.fields = fields;
    const entry = existing
      ? await existing.update()
      : await environment.createEntryWithId("testimonial", sample.id, { fields });
    await entry.publish();
  }
  if (apply) {
    const fields = {
      slug: { [locale]: "retreats-overview" },
      testimonials: {
        [locale]: samples
          .filter((sample) => sample.area === "Retreats General")
          .map((sample) => ({ sys: { type: "Link", linkType: "Entry", id: sample.id } })),
      },
    };
    const existing = entries.items.find((entry) => entry.sys.id === "sandbox-retreats-selection");
    if (existing) existing.fields = fields;
    const selection = existing
      ? await existing.update()
      : await environment.createEntryWithId("testimonialSelection", "sandbox-retreats-selection", {
          fields,
        });
    await selection.publish();
    const testimonialIds = samples
      .filter((sample) => sample.area === "Retreat")
      .map((sample) => sample.id);
    const withQuotes = (content: Prisma.JsonValue): Prisma.InputJsonObject => {
      if (!content || typeof content !== "object" || Array.isArray(content))
        throw new Error("Invalid local fixture content.");
      return { ...content, testimonialIds } as Prisma.InputJsonObject;
    };
    await db.retreatExperience.update({
      where: { id: experience.id },
      data: {
        draftContentJson: withQuotes(experience.draftContentJson),
        publishedContentJson: withQuotes(experience.publishedContentJson),
        publishedRevision: { increment: 1 },
      },
    });
  }
  console.log(
    `${apply ? "Created" : "Planned"}: 2 home, 2 overview, 3 event quotes; linked only to the local Powis test event.`
  );
} finally {
  await db.$disconnect();
}
