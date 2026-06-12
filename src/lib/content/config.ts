import { env } from "@/lib/env";

export interface ContentfulConfig {
  spaceId: string;
  environment: string;
  deliveryToken: string;
  previewToken?: string;
  managementToken?: string;
}

export function getContentfulConfig(): ContentfulConfig | null {
  const spaceId = env.CONTENTFUL_SPACE_ID;
  const deliveryToken = env.CONTENTFUL_DELIVERY_TOKEN;

  if (!spaceId || !deliveryToken) {
    return null;
  }

  return {
    spaceId,
    environment: env.CONTENTFUL_ENVIRONMENT || "master",
    deliveryToken,
    previewToken: env.CONTENTFUL_PREVIEW_TOKEN,
    managementToken: env.CONTENTFUL_MANAGEMENT_TOKEN,
  };
}
