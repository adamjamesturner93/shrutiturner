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
  keywords = "personal training, movement coaching, strength training, rehabilitation, fitness, wellbeing",
  ogImage = "https://shrutiturner.co.uk/social/active",
  ogType = "website",
  canonicalUrl,
  noIndex = false,
}: SEOProps) {
  const platformSettings = usePlatformSettings();
  const resolvedTitle =
    title ||
    platformSettings.defaultSeoTitle ||
    "Personal Training & Movement Coaching | Shruti Turner";
  const resolvedDescription =
    description ||
    platformSettings.defaultSeoDescription ||
    "Personal training and movement coaching bringing together rehabilitation, fitness and wellbeing, built around your body, goals and real life.";

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
