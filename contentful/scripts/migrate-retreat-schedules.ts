import { createClient } from "contentful-management";
import { getContentfulScriptEnv } from "./env.ts";

const { spaceId, environmentId, managementToken } = getContentfulScriptEnv();
const client = createClient({ accessToken: managementToken }, { type: "legacy" });

type Entry = {
  sys: { id: string; publishedVersion?: number };
  fields: Record<string, Record<string, unknown>>;
  update: () => Promise<Entry>;
  publish: () => Promise<Entry>;
};

type Environment = {
  getEntries: (query: Record<string, unknown>) => Promise<{ items: Entry[] }>;
  getEntry: (id: string) => Promise<Entry>;
  createEntryWithId: (
    contentType: string,
    id: string,
    payload: { fields: Record<string, Record<string, unknown>> }
  ) => Promise<Entry>;
};

function link(id: string) {
  return { sys: { type: "Link", linkType: "Entry", id } };
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

async function getEntry(environment: Environment, id: string) {
  try {
    return await environment.getEntry(id);
  } catch (error) {
    const details = error as { name?: string; code?: string; status?: number };
    if (details.name === "NotFound" || details.code === "NotFound" || details.status === 404) {
      return null;
    }
    throw error;
  }
}

async function upsertEntry(
  environment: Environment,
  contentType: string,
  id: string,
  fields: Record<string, Record<string, unknown>>,
  publish: boolean
) {
  const existing = await getEntry(environment, id);
  let entry: Entry;
  if (existing) {
    existing.fields = fields;
    entry = await existing.update();
  } else {
    entry = await environment.createEntryWithId(contentType, id, { fields });
  }
  return publish ? entry.publish() : entry;
}

async function run() {
  const space = await client.getSpace(spaceId);
  const environment = (await space.getEnvironment(environmentId)) as Environment;
  const templates = await environment.getEntries({ content_type: "retreatTemplate", limit: 1000 });
  let migrated = 0;
  let alreadyStructured = 0;
  let missingLegacySchedule = 0;

  for (const template of templates.items) {
    const scheduleField = template.fields.schedule || {};
    const locale = Object.keys(scheduleField)[0] || "en-US";
    const schedule = scheduleField[locale];
    const existingScheduleDays = template.fields.scheduleDays?.[locale];
    if (Array.isArray(existingScheduleDays) && existingScheduleDays.length > 0) {
      alreadyStructured += 1;
      continue;
    }
    if (!Array.isArray(schedule) || schedule.length === 0) {
      missingLegacySchedule += 1;
      const title = template.fields.title?.[locale];
      console.warn(
        `No schedule to migrate: ${typeof title === "string" ? title : template.sys.id}`
      );
      continue;
    }

    const publish = Boolean(template.sys.publishedVersion);
    const dayLinks: Array<ReturnType<typeof link>> = [];
    for (const [dayIndex, rawDay] of schedule.entries()) {
      const day = record(rawDay) || {};
      const rawItems = Array.isArray(day.items)
        ? day.items
        : Array.isArray(day.activities)
          ? day.activities.map((activity) => ({ title: activity }))
          : [];
      const itemLinks: Array<ReturnType<typeof link>> = [];
      for (const [itemIndex, rawItem] of rawItems.entries()) {
        const item = record(rawItem) || { title: String(rawItem || "Session") };
        const itemId = `rsi-${template.sys.id}-${dayIndex + 1}-${itemIndex + 1}`;
        const itemFields: Record<string, Record<string, unknown>> = {
          title: { [locale]: String(item.title || "Session") },
          slug: { [locale]: itemId },
          isOptional: { [locale]: item.isOptional === true },
          displayOrder: { [locale]: itemIndex + 1 },
        };
        for (const field of ["startTime", "endTime", "description", "category"] as const) {
          if (typeof item[field] === "string" && item[field].trim()) {
            itemFields[field] = { [locale]: item[field].trim() };
          }
        }
        await upsertEntry(environment, "retreatScheduleItem", itemId, itemFields, publish);
        itemLinks.push(link(itemId));
      }

      const dayId = `rsd-${template.sys.id}-${dayIndex + 1}`;
      const dayLabel = String(day.day || `Day ${dayIndex + 1}`);
      await upsertEntry(
        environment,
        "retreatScheduleDay",
        dayId,
        {
          title: { [locale]: String(day.title || dayLabel) },
          slug: { [locale]: dayId },
          dayLabel: { [locale]: dayLabel },
          displayOrder: { [locale]: dayIndex + 1 },
          items: { [locale]: itemLinks },
        },
        publish
      );
      dayLinks.push(link(dayId));
    }

    template.fields.scheduleDays = { [locale]: dayLinks };
    const updated = await template.update();
    if (publish) await updated.publish();
    migrated += 1;
    console.log(`Migrated retreat schedule: ${template.sys.id}`);
  }

  console.log(
    `Retreat schedule migration complete: ${migrated} migrated, ${alreadyStructured} already structured, ${missingLegacySchedule} without legacy schedules.`
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
