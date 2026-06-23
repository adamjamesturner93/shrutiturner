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
};

const { spaceId, environmentId, managementToken } = getContentfulScriptEnv();
const client = createClient(
  { accessToken: managementToken },
  { type: "plain", defaults: { spaceId, environmentId } }
);

const dryRun = process.env.CONTENTFUL_PRUNE_CONFIRM !== "delete-retired-types";

async function getRetiredType(id: string) {
  try {
    return (await client.contentType.get({ contentTypeId: id })) as unknown as ContentTypeLike;
  } catch (error) {
    const details = error as { name?: string; code?: string } | undefined;
    if (details?.name === "NotFound" || details?.code === "NotFound") return null;
    throw error;
  }
}

async function assertNoEntries(id: string) {
  const entries = await client.entry.getMany({
    query: { content_type: id, limit: 1 },
  });
  const total = entries.total || 0;
  if (total > 0) {
    throw new Error(`Refusing to prune ${id}: found ${total} entries.`);
  }
}

async function pruneContentType(contentType: ContentTypeLike) {
  let current = contentType;
  if (current.sys.publishedVersion) {
    current = (await client.contentType.unpublish({
      contentTypeId: current.sys.id,
    })) as unknown as ContentTypeLike;
  }
  await client.contentType.delete({ contentTypeId: current.sys.id });
}

async function run() {
  console.log(
    `${dryRun ? "Dry run" : "Delete mode"} for retired Contentful types in ${spaceId}/${environmentId}.`
  );

  for (const id of RETIRED_CONTENT_TYPES) {
    const contentType = await getRetiredType(id);
    if (!contentType) {
      console.log(`${id}: already absent`);
      continue;
    }

    await assertNoEntries(id);
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

run().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: string } | undefined)?.code;
  console.error(`Prune failed${code ? ` (${code})` : ""}: ${message}`);
  process.exitCode = 1;
});
