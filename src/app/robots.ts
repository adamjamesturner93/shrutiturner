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
          "/subscribe",
          "/acceptable-use",
          "/coaching-agreement",
          "/health-declaration",
          "/refund-policy",
          "/login",
          "/signup",
          "/auth",
          "/dashboard",
          "/account",
          "/admin",
          "/r/",
          "/gift/redeem/",
          "/unsubscribe",
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
