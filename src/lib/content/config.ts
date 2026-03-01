import type { ContentSource } from "./types";

const DEFAULT_SOURCE: ContentSource = "local";

export function getContentSource(): ContentSource {
  const source = (process.env.CONTENT_SOURCE || DEFAULT_SOURCE).toLowerCase();
  if (source === "local" || source === "hybrid" || source === "contentful") {
    return source;
  }
  return DEFAULT_SOURCE;
}

export interface ContentfulConfig {
  spaceId: string;
  environment: string;
  deliveryToken: string;
  previewToken?: string;
  managementToken?: string;
}

export function getContentfulConfig(): ContentfulConfig | null {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const deliveryToken = process.env.CONTENTFUL_DELIVERY_TOKEN;

  if (!spaceId || !deliveryToken) {
    return null;
  }

  return {
    spaceId,
    environment: process.env.CONTENTFUL_ENVIRONMENT || "master",
    deliveryToken,
    previewToken: process.env.CONTENTFUL_PREVIEW_TOKEN,
    managementToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
  };
}
