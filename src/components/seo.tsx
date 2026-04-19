import { useEffect } from "react";
import { usePlatformSettings } from "@/context/platform-settings-context";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

export function SEO({
  title,
  description,
  keywords = "strength training chronic illness, yoga autoimmune disease, adaptive yoga, chronic pain exercise, rheumatoid arthritis coaching, psoriatic arthritis training, hypermobility strength, complex bodies fitness, rehabilitation informed training",
  ogImage = "/og-image.jpg",
  ogType = "website",
  canonicalUrl,
  noIndex = false,
}: SEOProps) {
  const platformSettings = usePlatformSettings();
  const resolvedTitle =
    title ||
    platformSettings.defaultSeoTitle ||
    "Shruti Turner - Strength & Yoga Coaching for Complex Bodies";
  const resolvedDescription =
    description ||
    platformSettings.defaultSeoDescription ||
    "Science-backed strength and yoga coaching for adults with chronic illness, autoimmune conditions, and complex bodies. Rehabilitation-informed training that builds capacity without pretending your body is simple.";

  useEffect(() => {
    // Set title
    document.title = resolvedTitle;

    // Helper function to update or create meta tags
    const updateMetaTag = (selector: string, content: string, attributeName: string = "name") => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attributeName, selector.replace(/\[.*?["']|["']\]/g, ""));
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Standard meta tags
    updateMetaTag('meta[name="description"]', resolvedDescription);
    updateMetaTag('meta[name="keywords"]', keywords);
    updateMetaTag('meta[name="author"]', platformSettings.businessName);
    updateMetaTag('meta[name="robots"]', noIndex ? "noindex, nofollow" : "index, follow");
    updateMetaTag('meta[name="viewport"]', "width=device-width, initial-scale=1.0");

    // Open Graph tags
    updateMetaTag('meta[property="og:title"]', resolvedTitle, "property");
    updateMetaTag('meta[property="og:description"]', resolvedDescription, "property");
    updateMetaTag('meta[property="og:type"]', ogType, "property");
    updateMetaTag('meta[property="og:image"]', ogImage, "property");

    if (canonicalUrl) {
      updateMetaTag('meta[property="og:url"]', canonicalUrl, "property");
    }

    // Twitter Card tags
    updateMetaTag('meta[name="twitter:card"]', "summary_large_image");
    updateMetaTag('meta[name="twitter:title"]', resolvedTitle);
    updateMetaTag('meta[name="twitter:description"]', resolvedDescription);
    updateMetaTag('meta[name="twitter:image"]', ogImage);

    // Canonical URL
    if (canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonicalUrl);
    }
  }, [
    resolvedTitle,
    resolvedDescription,
    keywords,
    ogImage,
    ogType,
    canonicalUrl,
    noIndex,
    platformSettings.businessName,
  ]);

  return null;
}
