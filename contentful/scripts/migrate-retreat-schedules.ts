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

function firstLocale(fields: Record<string, Record<string, unknown>>, ...fieldIds: string[]) {
  for (const fieldId of fieldIds) {
    const locale = Object.keys(fields[fieldId] || {})[0];
    if (locale) return locale;
  }
  return "en-US";
}

function localizedString(field: Record<string, unknown> | undefined, locale: string) {
  const preferred = field?.[locale];
  if (typeof preferred === "string" && preferred.trim()) return preferred.trim();
  const fallback = Object.values(field || {}).find(
    (value): value is string => typeof value === "string" && Boolean(value.trim())
  );
  return fallback?.trim() || "";
}

function localizedArray(field: Record<string, unknown> | undefined, locale: string) {
  const preferred = field?.[locale];
  if (Array.isArray(preferred)) return preferred;
  return Object.values(field || {}).find(Array.isArray) || [];
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

async function migrateLinkedScheduleDay(environment: Environment, dayEntry: Entry) {
  const locale = firstLocale(dayEntry.fields, "activities", "items", "title");
  if (localizedString(dayEntry.fields.activities, locale)) return "already-simple" as const;

  const itemLinks = localizedArray(dayEntry.fields.items, locale);
  const activities: string[] = [];
  for (const itemLink of itemLinks) {
    const linkedItemId = record(record(itemLink)?.sys)?.id;
    if (typeof linkedItemId !== "string") continue;
    const itemEntry = await getEntry(environment, linkedItemId);
    if (!itemEntry) continue;
    const title = localizedString(itemEntry.fields.title, locale);
    if (title) activities.push(title);
  }
  if (activities.length === 0) return "empty" as const;

  dayEntry.fields.activities = {
    ...(dayEntry.fields.activities || {}),
    [locale]: activities.join("\n"),
  };
  const updatedDay = await dayEntry.update();
  if (dayEntry.sys.publishedVersion) await updatedDay.publish();
  console.log(`Migrated schedule day ${dayEntry.sys.id}: ${activities.length} activities`);
  return "migrated" as const;
}

async function run() {
  const space = await client.getSpace(spaceId);
  const environment = (await space.getEnvironment(environmentId)) as Environment;
  const templates = await environment.getEntries({ content_type: "retreatTemplate", limit: 1000 });
  const scheduleDays = await environment.getEntries({
    content_type: "retreatScheduleDay",
    limit: 1000,
  });
  let migrated = 0;
  let alreadySimple = 0;
  let missingLegacySchedule = 0;

  for (const dayEntry of scheduleDays.items) {
    const result = await migrateLinkedScheduleDay(environment, dayEntry);
    if (result === "migrated") migrated += 1;
    if (result === "already-simple") alreadySimple += 1;
  }

  for (const template of templates.items) {
    const scheduleField = template.fields.schedule || {};
    const locale = firstLocale(template.fields, "scheduleDays", "schedule", "title");
    const schedule = scheduleField[locale];
    const existingScheduleDays = template.fields.scheduleDays?.[locale];
    if (Array.isArray(existingScheduleDays) && existingScheduleDays.length > 0) {
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

  const verifiedDays = await environment.getEntries({
    content_type: "retreatScheduleDay",
    limit: 1000,
  });
  const incompleteDays = verifiedDays.items.filter((dayEntry) => {
    const locale = firstLocale(dayEntry.fields, "activities", "items", "title");
    return (
      localizedArray(dayEntry.fields.items, locale).length > 0 &&
      !localizedString(dayEntry.fields.activities, locale)
    );
  });
  if (incompleteDays.length > 0) {
    throw new Error(
      `Schedule migration incomplete for: ${incompleteDays.map((day) => day.sys.id).join(", ")}`
    );
  }

  console.log(
    `Retreat schedule migration complete: ${migrated} entries migrated, ${alreadySimple} days already simple, ${missingLegacySchedule} templates without schedules. Verified ${verifiedDays.items.length} schedule days.`
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
