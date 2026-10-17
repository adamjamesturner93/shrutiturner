import { migrateReviewAreas } from "../migrations/review-areas.ts";
import { createClient } from "contentful-management";
import { getContentfulScriptEnv } from "./env.ts";

const apply = process.argv.includes("--apply");
if (apply && !process.env.CONTENTFUL_ENVIRONMENT)
  throw new Error("Set CONTENTFUL_ENVIRONMENT explicitly before applying review changes");
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
  if (entry.fields.reviewAreas) return [];
  const current = entry.fields.approvedPlacements || {};
  const fields = migrateReviewAreas(current);
  if (!Object.keys(fields).length) return [];
  if (entry.isPublished() && entry.isUpdated()) {
    throw new Error(`Unpublished edits on ${entry.sys.id}; preserve them before migrating.`);
  }
  return [{ entry, fields }];
});

for (const { entry, fields } of changes) {
  console.log(`${apply ? "Updating" : "Would update"} ${entry.sys.id} (${environmentId})`);
  if (!apply) continue;
  const published = entry.isPublished();
  entry.fields.reviewAreas = fields;
  const updated = await entry.update();
  if (published) await updated.publish();
}
console.log(`${changes.length} testimonial placement updates ${apply ? "applied" : "planned"}.`);
