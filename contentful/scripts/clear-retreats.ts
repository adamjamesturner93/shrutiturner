import { createClient } from "contentful-management";

import { getContentfulScriptEnv } from "./env.ts";

type ContentfulEntry = {
  sys: { id: string };
  isArchived: () => boolean;
  isPublished: () => boolean;
  unarchive: () => Promise<ContentfulEntry>;
  unpublish: () => Promise<ContentfulEntry>;
  delete: () => Promise<void>;
};

type ContentfulEnvironment = {
  getEntries: (query: Record<string, unknown>) => Promise<{ items?: ContentfulEntry[] }>;
};

const CONTENT_TYPES = [
  "retreatTemplate",
  "retreatScheduleDay",
  "retreatScheduleItem",
  "retreatVenue",
] as const;

const { spaceId, environmentId, managementToken } = getContentfulScriptEnv();
const confirmedEnvironment = process.env.CONTENTFUL_CONFIRM_RETREAT_CLEAR;

if (confirmedEnvironment !== environmentId) {
  throw new Error(
    `Refusing to clear retreat content in Contentful environment "${environmentId}". ` +
      `Set CONTENTFUL_CONFIRM_RETREAT_CLEAR=${environmentId} to confirm the exact target.`
  );
}

const client = createClient({ accessToken: managementToken }, { type: "legacy" });

async function removeEntry(entry: ContentfulEntry) {
  let current = entry;
  if (current.isArchived()) {
    current = await current.unarchive();
  }
  if (current.isPublished()) {
    current = await current.unpublish();
  }
  await current.delete();
}

async function run() {
  const space = await client.getSpace(spaceId);
  const environment = (await space.getEnvironment(environmentId)) as ContentfulEnvironment;
  const report: Record<string, number> = {};

  for (const contentType of CONTENT_TYPES) {
    const response = await environment.getEntries({ content_type: contentType, limit: 1000 });
    const entries = response.items ?? [];
    const entryCount = entries.length;
    for (const entry of entries) {
      await removeEntry(entry);
    }
    report[contentType] = entryCount;
  }

  console.log(`Cleared retreat content from Contentful environment: ${environmentId}`);
  console.table(report);
}

try {
  await run();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Retreat clear failed: ${message}`);
  process.exitCode = 1;
}
