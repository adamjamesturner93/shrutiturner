import { createClient } from "contentful-management";
import { getContentfulScriptEnv } from "./env.ts";

const RETIRED_CONTENT_TYPES = [
  "globalContent",
  "legalDocument",
  "trustBadge",
  "contactBlock",
  "announcementBanner",
  "themedWeekPromo",
  "transactionalEmailTemplate",
  "retreatInstance",
] as const;

type ContentTypeLike = {
  sys: {
    id: string;
    publishedVersion?: number;
  };
  unpublish?: () => Promise<ContentTypeLike>;
  delete: () => Promise<void>;
};

type ContentfulEnvironment = {
  getContentType: (id: string) => Promise<ContentTypeLike>;
  getEntries: (query: Record<string, unknown>) => Promise<{ total?: number }>;
};

const { spaceId, environmentId, managementToken } = getContentfulScriptEnv();

const dryRun = process.env.CONTENTFUL_PRUNE_CONFIRM !== "delete-retired-types";

async function getRetiredType(environment: ContentfulEnvironment, id: string) {
  try {
    return await environment.getContentType(id);
  } catch (error) {
    const details = error as { name?: string; code?: string } | undefined;
    if (details?.name === "NotFound" || details?.code === "NotFound") return null;
    throw error;
  }
}

async function assertNoEntries(environment: ContentfulEnvironment, id: string) {
  const entries = await environment.getEntries({ content_type: id, limit: 1 });
  const total = entries.total || 0;
  if (total > 0) {
    throw new Error(`Refusing to prune ${id}: found ${total} entries.`);
  }
}

async function pruneContentType(contentType: ContentTypeLike) {
  let current = contentType;
  if (current.sys.publishedVersion && current.unpublish) {
    current = await current.unpublish();
  }
  await current.delete();
}

async function run() {
  const client = createClient({ accessToken: managementToken }, { type: "legacy" });
  const space = await client.getSpace(spaceId);
  const environment = (await space.getEnvironment(environmentId)) as ContentfulEnvironment;

  console.log(
    `${dryRun ? "Dry run" : "Delete mode"} for retired Contentful types in ${spaceId}/${environmentId}.`
  );

  for (const id of RETIRED_CONTENT_TYPES) {
    const contentType = await getRetiredType(environment, id);
    if (!contentType) {
      console.log(`${id}: already absent`);
      continue;
    }

    await assertNoEntries(environment, id);
    if (dryRun) {
      console.log(
        `${id}: would prune; set CONTENTFUL_PRUNE_CONFIRM=delete-retired-types to delete`
      );
      continue;
    }

    await pruneContentType(contentType);
    console.log(`${id}: pruned`);
  }
}

try {
  await run();
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: string } | undefined)?.code;
  console.error(`Prune failed${code ? ` (${code})` : ""}: ${message}`);
  process.exitCode = 1;
}
