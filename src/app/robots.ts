import type { MetadataRoute } from "next";
import { getBaseSiteUrl } from "@/lib/app-url";
import { isHoldingStage } from "@/lib/site-stage";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseSiteUrl();

  if (isHoldingStage()) {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/about",
          "/blog",
          "/classes",
          "/coaching",
          "/contact",
          "/pricing",
          "/pt",
          "/retreats",
          "/schedule",
          "/auth",
          "/api",
          "/dashboard",
          "/account",
          "/admin",
          "/instructor",
          "/email",
          "/r/",
          "/gift/redeem/",
        ],
      },
      sitemap: `${baseUrl}/sitemap.xml`,
      host: baseUrl,
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/auth",
        "/api",
        "/dashboard",
        "/account",
        "/admin",
        "/instructor",
        "/email",
        "/r/",
        "/gift/redeem/",
        "/retreats/*/checkout",
        "/retreats/balance/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
