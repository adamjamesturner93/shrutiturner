export type PublicBreadcrumbItem = {
  name: string;
  href: string;
};

const DEFAULT_SITE_ORIGIN = "https://shrutiturner.co.uk";

export function buildBreadcrumbJsonLd(
  items: PublicBreadcrumbItem[],
  siteOrigin = DEFAULT_SITE_ORIGIN
) {
  const origin = siteOrigin.replace(/\/$/, "");

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.href.startsWith("http") ? item.href : `${origin}${item.href}`,
    })),
  };
}
