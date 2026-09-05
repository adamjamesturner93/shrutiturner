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
  let alreadySimple = 0;
  let missingLegacySchedule = 0;

  for (const template of templates.items) {
    const scheduleField = template.fields.schedule || {};
    const locale = Object.keys(scheduleField)[0] || "en-US";
    const schedule = scheduleField[locale];
    const existingScheduleDays = template.fields.scheduleDays?.[locale];
    if (Array.isArray(existingScheduleDays) && existingScheduleDays.length > 0) {
      let templateChanged = false;
      for (const dayLink of existingScheduleDays) {
        const linkedDayId = record(dayLink)?.sys;
        const dayId = record(linkedDayId)?.id;
        if (typeof dayId !== "string") continue;
        const dayEntry = await environment.getEntry(dayId);
        const currentActivities = dayEntry.fields.activities?.[locale];
        if (typeof currentActivities === "string" && currentActivities.trim()) continue;

        const itemLinks = dayEntry.fields.items?.[locale];
        if (!Array.isArray(itemLinks)) continue;
        const activities: Array<{ title: string; order: number }> = [];
        for (const [itemIndex, itemLink] of itemLinks.entries()) {
          const linkedItemId = record(record(itemLink)?.sys)?.id;
          if (typeof linkedItemId !== "string") continue;
          const itemEntry = await environment.getEntry(linkedItemId);
          const title = itemEntry.fields.title?.[locale];
          if (typeof title !== "string" || !title.trim()) continue;
          const displayOrder = itemEntry.fields.displayOrder?.[locale];
          activities.push({
            title: title.trim(),
            order: typeof displayOrder === "number" ? displayOrder : itemIndex,
          });
        }
        if (activities.length === 0) continue;
        dayEntry.fields.activities = {
          [locale]: activities
            .sort((a, b) => a.order - b.order)
            .map((activity) => activity.title)
            .join("\n"),
        };
        const updatedDay = await dayEntry.update();
        if (dayEntry.sys.publishedVersion) await updatedDay.publish();
        templateChanged = true;
      }
      if (templateChanged) migrated += 1;
      else alreadySimple += 1;
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
      const activities: string[] = [];
      for (const rawItem of rawItems) {
        const item = record(rawItem) || { title: String(rawItem || "Session") };
        const title = String(item.title || "Session").trim();
        if (title) activities.push(title);
      }

      const dayId = `rsd-${template.sys.id}-${dayIndex + 1}`;
      const dayLabel = String(day.day || `Day ${dayIndex + 1}`);
      await upsertEntry(
        environment,
        "retreatScheduleDay",
        dayId,
        {
          title: { [locale]: String(day.title || dayLabel) },
          ...(typeof day.subtitle === "string" && day.subtitle.trim()
            ? { subtitle: { [locale]: day.subtitle.trim() } }
            : {}),
          activities: { [locale]: activities.join("\n") },
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
    `Retreat schedule migration complete: ${migrated} migrated, ${alreadySimple} already simple, ${missingLegacySchedule} without legacy schedules.`
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
