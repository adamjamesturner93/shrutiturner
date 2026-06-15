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
        "/about",
        "/classes",
        "/pricing",
        "/retreats",
        "/schedule",
        "/login",
        "/signup",
        "/auth",
        "/api",
        "/dashboard",
        "/account",
        "/admin",
        "/instructor",
        "/email",
        "/r/",
        "/gift/redeem/",
        "/classes/small-groups/*/checkout",
        "/retreats/*/checkout",
        "/retreats/balance/",
        "/subscribe",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
