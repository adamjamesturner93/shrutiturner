import { buildAbsoluteUrl } from "@/lib/app-url";
import type { FaqItemContent, RetreatCombinedContent } from "@/lib/content/types";
import type { JsonLdData } from "@/components/json-ld";

const ORGANIZATION_NAME = "Shruti Turner";

export function createOrganizationSchema(): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORGANIZATION_NAME,
    url: buildAbsoluteUrl("/"),
    logo: buildAbsoluteUrl("/logos/logo-colour-icon-only.svg"),
  };
}

export function createWebSiteSchema(): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: ORGANIZATION_NAME,
    url: buildAbsoluteUrl("/"),
    publisher: {
      "@type": "Organization",
      name: ORGANIZATION_NAME,
    },
  };
}

export function createWebPageSchema(input: {
  name: string;
  path: string;
  description?: string;
  type?: "WebPage" | "AboutPage" | "CollectionPage";
}): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": input.type || "WebPage",
    name: input.name,
    description: input.description,
    url: buildAbsoluteUrl(input.path),
    isPartOf: {
      "@type": "WebSite",
      name: ORGANIZATION_NAME,
      url: buildAbsoluteUrl("/"),
    },
  };
}

export function createPersonSchema(): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Shruti Turner",
    url: buildAbsoluteUrl("/about"),
    jobTitle: "Strength and Yoga Coach",
    worksFor: {
      "@type": "Organization",
      name: ORGANIZATION_NAME,
    },
    sameAs: ["https://instagram.com/shrutiturner"],
  };
}

export function createServiceSchema(input: {
  name: string;
  path: string;
  description: string;
  serviceType: string;
}): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    serviceType: input.serviceType,
    url: buildAbsoluteUrl(input.path),
    provider: {
      "@type": "Person",
      name: "Shruti Turner",
      url: buildAbsoluteUrl("/about"),
    },
    areaServed: "United Kingdom",
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: buildAbsoluteUrl(input.path),
      serviceLocation: {
        "@type": "VirtualLocation",
        url: buildAbsoluteUrl(input.path),
      },
    },
  };
}

export function createBlogSchema(input: {
  posts: Array<{ id: string; title: string; excerpt: string; date: string }>;
}): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Shruti Turner Blog",
    url: buildAbsoluteUrl("/blog"),
    blogPost: input.posts.slice(0, 20).map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      datePublished: post.date,
      url: buildAbsoluteUrl(`/blog/${post.id}`),
    })),
  };
}

export function createRetreatEventSchema(retreat: RetreatCombinedContent): JsonLdData {
  const nextDate = retreat.dates[0];

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: retreat.title,
    description: retreat.shortDescription,
    url: buildAbsoluteUrl(`/retreats/${retreat.slug}`),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    startDate: nextDate?.startDate,
    endDate: nextDate?.endDate,
    location: {
      "@type": "Place",
      name: retreat.venueName || retreat.location,
      address: retreat.location,
    },
    organizer: {
      "@type": "Organization",
      name: ORGANIZATION_NAME,
      url: buildAbsoluteUrl("/"),
    },
  };
}

export function createFaqPageSchema(faqs: FaqItemContent[]): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function createBreadcrumbListSchema(
  items: Array<{ name: string; path: string }>
): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildAbsoluteUrl(item.path),
    })),
  };
}
