import { createClient } from "contentful-management";
import { getContentfulScriptEnv } from "./env.ts";

// Dry run by default. Run after the additive testimonial model migration.
const apply = process.argv.includes("--apply");
const { spaceId, environmentId, managementToken } = getContentfulScriptEnv();
const client = createClient({ accessToken: managementToken }, { type: "legacy" });
const environment = await (await client.getSpace(spaceId)).getEnvironment(environmentId);
let skip = 0;
let total = Infinity;
while (skip < total) {
  const entries = await environment.getEntries({ content_type: "testimonial", limit: 100, skip });
  total = entries.total;
  for (const entry of entries.items) {
    const featured = entry.fields.featured || {};
    const placements = entry.fields.approvedPlacements || {};
    const locales = Object.keys(featured).filter(
      (locale) => featured[locale] === true && placements[locale] === undefined
    );
    if (!locales.length) continue;
    if (entry.isPublished() && entry.isUpdated()) {
      console.log(
        `Skipped ${entry.sys.id}: has unpublished edits; approve Homepage manually before publishing.`
      );
      continue;
    }
    console.log(
      `${apply ? "Updating" : "Would update"} ${entry.sys.id}: approve home only (${environmentId})`
    );
    if (!apply) continue;
    const published = entry.isPublished();
    entry.fields.approvedPlacements = {
      ...placements,
      ...Object.fromEntries(locales.map((locale) => [locale, ["Home"]])),
    };
    const updated = await entry.update();
    if (published) await updated.publish();
  }
  skip += entries.items.length;
  if (!entries.items.length) break;
}
