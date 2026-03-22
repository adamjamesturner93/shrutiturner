import type { MetadataRoute } from "next";
import { getBaseSiteUrl } from "@/lib/app-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/login",
        "/signup",
        "/auth",
        "/dashboard",
        "/admin",
        "/r/",
        "/gift/redeem/",
        "/classes/small-groups/*/checkout",
        "/retreats/*/checkout",
        "/retreats/balance/",
        "/subscribe",
        "/unsubscribe",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
