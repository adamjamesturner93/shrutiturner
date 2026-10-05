import { createClient } from "contentful-management";
import { getContentfulScriptEnv } from "./env.ts";

const labels: Record<string, string> = {
  home: "Home",
  coaching: "Coaching",
  "retreats-overview": "Retreats General",
  "event-page": "Retreat",
};
const allowed = new Set(Object.values(labels));
const apply = process.argv.includes("--apply");
const { spaceId, environmentId, managementToken } = getContentfulScriptEnv();
const environment = await (
  await createClient({ accessToken: managementToken }, { type: "legacy" }).getSpace(spaceId)
).getEnvironment(environmentId);
const entries = [];
let skip = 0;
while (true) {
  const batch = await environment.getEntries({ content_type: "testimonial", limit: 100, skip });
  entries.push(...batch.items);
  skip += batch.items.length;
  if (skip >= batch.total || !batch.items.length) break;
}

// Preflight every entry before writing; never publish another editor's draft edits.
const changes = entries.flatMap((entry) => {
  const current = entry.fields.approvedPlacements || {};
  let changed = false;
  const fields = Object.fromEntries(
    Object.entries(current).map(([locale, value]) => {
      if (!Array.isArray(value)) throw new Error(`Invalid placements: ${entry.sys.id}`);
      const mapped = value.map((item: unknown) => {
        if (typeof item !== "string" || (!labels[item] && !allowed.has(item))) {
          throw new Error(`Unsupported placement on ${entry.sys.id}; review before migration.`);
        }
        if (labels[item]) changed = true;
        return labels[item] || item;
      });
      return [locale, [...new Set(mapped)]];
    })
  );
  if (!changed) return [];
  if (entry.isPublished() && entry.isUpdated()) {
    throw new Error(`Unpublished edits on ${entry.sys.id}; preserve them before migrating.`);
  }
  return [{ entry, fields }];
});

for (const { entry, fields } of changes) {
  console.log(`${apply ? "Updating" : "Would update"} ${entry.sys.id} (${environmentId})`);
  if (!apply) continue;
  const published = entry.isPublished();
  entry.fields.approvedPlacements = fields;
  const updated = await entry.update();
  if (published) await updated.publish();
}
console.log(`${changes.length} testimonial placement updates ${apply ? "applied" : "planned"}.`);
