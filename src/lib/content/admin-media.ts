import "server-only";
import { getAssets } from "@/lib/content/contentful-client";
import { getContentfulConfig } from "@/lib/content/config";

type AssetFields = {
  title?: string;
  description?: string;
  file?: { url?: string; contentType?: string };
};

export async function listAdminImages(query: string, page: number) {
  const config = getContentfulConfig();
  if (!config) throw new Error("MEDIA_NOT_CONFIGURED");
  const result = await getAssets<AssetFields>({
    mimetype_group: "image",
    query: query || undefined,
    limit: 24,
    skip: (page - 1) * 24,
    order: "-sys.updatedAt",
  });
  return {
    items: result.items.flatMap(({ sys, fields }) => {
      const source = fields.file?.url;
      if (!source || !fields.file?.contentType?.startsWith("image/")) return [];
      const url = source.startsWith("//") ? `https:${source}` : source;
      if (!url.startsWith("https://")) return [];
      return [
        {
          assetId: sys.id,
          url,
          title: fields.title || "Untitled image",
          alt: fields.description || "",
        },
      ];
    }),
    page,
    hasMore: result.skip + result.limit < result.total,
    environment: config.environment,
    libraryUrl: `https://app.contentful.com/spaces/${encodeURIComponent(config.spaceId)}/environments/${encodeURIComponent(config.environment)}/assets`,
  };
}
