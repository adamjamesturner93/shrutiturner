import { buildAbsoluteUrl } from "@/lib/app-url";
import type {
  ClassDefinitionContent,
  FaqItemContent,
  RetreatCombinedContent,
} from "@/lib/content/types";
import type { JsonLdData } from "@/components/json-ld";
import {
  getEffectiveRetreatRatePricePence,
  isRetreatEarlyBirdActive,
} from "@/lib/retreats/pricing";

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
    jobTitle: "Personal Trainer and Movement Coach",
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

export function createClassesItemListSchema(classes: ClassDefinitionContent[]): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Move Well Classes",
    itemListElement: classes.map((classDefinition, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: buildAbsoluteUrl(`/classes/${classDefinition.slug}`),
      name: classDefinition.name,
    })),
  };
}

export function createClassCourseSchema(classDefinition: ClassDefinitionContent): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: classDefinition.name,
    description: classDefinition.shortDescription,
    url: buildAbsoluteUrl(`/classes/${classDefinition.slug}`),
    provider: {
      "@type": "Organization",
      name: ORGANIZATION_NAME,
      sameAs: buildAbsoluteUrl("/"),
    },
    courseMode: "online",
    educationalLevel: classDefinition.level,
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

function createRetreatDateEventSchema(
  retreat: RetreatCombinedContent,
  retreatDate: RetreatCombinedContent["dates"][number]
): JsonLdData {
  const isOnline =
    retreat.deliveryMode === "online_live" || retreat.deliveryMode === "online_on_demand";
  const lowestPrice = retreatDate.roomOptions
    .flatMap((option) => option.ratePlans || [])
    .reduce<number | null>((lowest, rate) => {
      const pricePence = isRetreatEarlyBirdActive(rate)
        ? getEffectiveRetreatRatePricePence(rate)
        : rate.totalPricePence;
      const price = pricePence / 100;
      return lowest === null || price < lowest ? price : lowest;
    }, null);

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: retreat.title,
    description: retreat.shortDescription,
    url: buildAbsoluteUrl(`/retreats/${retreat.slug}`),
    image: retreat.imageUrl || undefined,
    eventAttendanceMode: isOnline
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    startDate: retreatDate.startDate,
    endDate: retreatDate.endDate,
    location: isOnline
      ? {
          "@type": "VirtualLocation",
          url: buildAbsoluteUrl(`/retreats/${retreat.slug}`),
        }
      : {
          "@type": "Place",
          name: retreat.venueName || retreat.location,
          address: retreat.location,
        },
    offers:
      lowestPrice !== null
        ? {
            "@type": "Offer",
            url: buildAbsoluteUrl(`/retreats/${retreat.slug}`),
            price: lowestPrice.toFixed(2),
            priceCurrency: retreat.currency,
            availability:
              retreatDate.availableSpaces > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/SoldOut",
          }
        : undefined,
    organizer: {
      "@type": "Organization",
      name: ORGANIZATION_NAME,
      url: buildAbsoluteUrl("/"),
    },
  };
}

export function createRetreatEventSchemas(retreat: RetreatCombinedContent): JsonLdData[] {
  return retreat.dates.map((retreatDate) => createRetreatDateEventSchema(retreat, retreatDate));
}

export function createRetreatEventSchema(retreat: RetreatCombinedContent): JsonLdData {
  const firstDate = retreat.dates[0];
  if (!firstDate) {
    return {
      "@context": "https://schema.org",
      "@type": "Event",
      name: retreat.title,
      description: retreat.shortDescription,
      url: buildAbsoluteUrl(`/retreats/${retreat.slug}`),
    };
  }
  return createRetreatDateEventSchema(retreat, firstDate);
}

export function createRetreatItemListSchema(retreats: RetreatCombinedContent[]): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Retreats and online workshops",
    itemListElement: retreats.map((retreat, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: retreat.title,
      url: buildAbsoluteUrl(`/retreats/${retreat.slug}`),
    })),
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
