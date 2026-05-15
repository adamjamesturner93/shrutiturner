import { blogAuthors, blogPosts } from "../../src/data/blog-data.ts";
import { classDetails } from "../../src/data/schedule-data.ts";
import { retreats } from "../../src/data/retreat-data.ts";
import { smallGroupTemplates } from "../../src/data/small-group-programmes.ts";

function compactImageUrl(raw: string): string {
  try {
    const url = new URL(raw);
    // Keep only size/format params and remove tracking/search metadata params.
    const keepParams = ["w", "q", "fm", "fit", "crop", "cs", "auto"];
    const next = new URL(`${url.origin}${url.pathname}`);
    for (const key of keepParams) {
      const value = url.searchParams.get(key);
      if (value) {
        next.searchParams.set(key, value);
      }
    }

    const compact = next.toString();
    if (compact.length <= 255) {
      return compact;
    }

    // Last resort: no query params at all.
    return `${url.origin}${url.pathname}`;
  } catch {
    if (raw.length <= 255) {
      return raw;
    }
    return raw.slice(0, 255);
  }
}

export const CLASS_TEMPLATE_SEED = {
  contentType: "classDefinition",
  entries: classDetails.map((c) => ({
    name: c.name,
    slug: c.slug,
    type: c.type,
    classCategory: c.type === "Yoga" ? "yoga" : c.type === "HIIT" ? "small-group" : "strength",
    level: c.level,
    defaultDay: c.day,
    defaultTime: c.time,
    duration: c.duration,
    maxCapacity: c.maxSpaces,
    shortDescription: c.shortDescription,
    longDescription: c.longDescription,
    whatToExpect: c.whatToExpect,
    whoItsFor: c.whoItsFor,
    equipment: c.equipment,
    benefits: c.benefits,
    defaultInstructorProfileSlug: "shruti-turner",
    seoTitle: c.seoTitle,
    seoDescription: c.seoDescription,
    seoKeywords: c.seoKeywords,
  })),
};

export const INSTRUCTOR_PROFILE_SEED = {
  contentType: "instructorProfile",
  entries: [
    {
      name: "Shruti Turner",
      slug: "shruti-turner",
      headline: "Strength & Yoga Coach for Complex Bodies",
      bio: "Shruti combines strength coaching, adaptive yoga, and evidence-based rehab principles to support people living with chronic illness, pain, and fluctuating energy. Her approach centers on long-term capacity, nervous system safety, and practical strategies that fit real life.",
      credentials: ["PhD Biomechanics", "Strength Coach", "Yoga Teacher"],
      specialties: [
        "Chronic illness",
        "Autoimmune conditions",
        "Hypermobility",
        "Pain-informed training",
      ],
      avatarImageUrl: "https://images.ctfassets.net/vkravdtcwp5q/shruti-placeholder.jpg",
      avatarAlt: "Shruti Turner",
      featuredQuote:
        "Strength and yoga should meet your body where it is today, while building what is possible tomorrow.",
      active: true,
      seoTitle: "Shruti Turner - Instructor Profile",
      seoDescription:
        "Learn about Shruti Turner's adaptive strength and yoga teaching approach for chronic illness and complex bodies.",
    },
  ],
};

export const TESTIMONIAL_SEED = {
  contentType: "testimonial",
  entries: [
    {
      slug: "testimonial-sarah-yoga",
      quote: "Finally, a yoga teacher who understands that my body isn't just tight, it's complex.",
      authorName: "Sarah",
      authorCondition: "Hypermobility EDS",
      service: "yoga",
      featured: true,
    },
    {
      slug: "testimonial-james-strength",
      quote: "I've built more strength in 12 weeks than in years of trying generic programmes.",
      authorName: "James",
      authorCondition: "Rheumatoid Arthritis",
      service: "strength",
      featured: true,
    },
    {
      slug: "testimonial-elena-small-group",
      quote:
        "The small group programme gave me accountability and a community that actually gets it.",
      authorName: "Elena",
      authorCondition: "Chronic Fatigue",
      service: "small-group",
      featured: true,
    },
  ],
};

export const SMALL_GROUP_PROGRAMME_SEED = {
  contentType: "smallGroupProgramme",
  entries: smallGroupTemplates.map((programme) => ({
    slug: programme.slug,
    title: programme.title,
    subtitle: programme.subtitle,
    shortSummary: programme.shortSummary,
    fullDescription: programme.fullDescription,
    longDescription: programme.longDescription,
    outcomes: programme.outcomes,
    durationLabel: programme.durationLabel,
    durationWeeks: programme.durationWeeks,
    cohortSize: programme.cohortSize,
    sessionsPerWeek: programme.sessionsPerWeek,
    defaultPricePence: programme.defaultPricePence,
    whoItsFor: programme.whoItsFor,
    equipment: programme.equipment,
    inclusions: programme.inclusions,
    weekByWeek: programme.weekByWeek,
  })),
};

const venueEntries = new Map<
  string,
  {
    slug: string;
    name: string;
    displayLocation: string;
    description: string;
    address: string;
    accommodationOptions: string[];
    travelInformation: string;
    accommodationType: string;
    facilities: string[];
    accessibilityNotes: string;
  }
>();
for (const retreat of retreats) {
  const slug =
    retreat.slug === "virtual-immersion"
      ? "online"
      : retreat.location.toLowerCase().replace(/\s+/g, "-");
  if (!venueEntries.has(slug)) {
    venueEntries.set(slug, {
      slug,
      name: retreat.location,
      displayLocation: retreat.location,
      description: retreat.accommodation,
      address: retreat.location,
      accommodationOptions: [retreat.accommodation],
      travelInformation: "Travel details provided after booking confirmation.",
      accommodationType: retreat.accommodation,
      facilities: [],
      accessibilityNotes: "Contact us to discuss accessibility requirements for this venue.",
    });
  }
}

export const RETREAT_VENUE_SEED = {
  contentType: "retreatVenue",
  entries: Array.from(venueEntries.values()),
};

export const RETREAT_TEMPLATE_SEED = {
  contentType: "retreatTemplate",
  entries: retreats.map((r) => ({
    title: r.title,
    subtitle: r.subtitle,
    slug: r.slug,
    shortDescription: r.shortDescription,
    fullDescription: r.fullDescription,
    suitableFor: r.suitableFor,
    included: r.included,
    notIncluded: r.notIncluded,
    seoTitle: `${r.title} - ${r.subtitle}`,
    seoDescription: r.shortDescription,
    venueSlug:
      r.slug === "virtual-immersion" ? "online" : r.location.toLowerCase().replace(/\s+/g, "-"),
  })),
};

export const BLOG_SEED = {
  contentType: "blogPost",
  entries: blogPosts.map((p) => ({
    title: p.title,
    slug: p.id,
    coverImage: compactImageUrl(p.coverImage),
    coverAlt: p.coverAlt,
    excerpt: p.excerpt,
    content: p.content,
    authorName: p.authors[0]?.name || p.author || "Shruti Turner",
    authorSlugs: p.authors.map((author) => author.slug),
    publishDate: p.date,
    tags: p.tags,
    readTime: p.readTime,
    isNewsletter: false,
    seoTitle: p.title,
    seoDescription: p.excerpt,
  })),
};

export const AUTHOR_PROFILE_SEED = {
  contentType: "authorProfile",
  entries: blogAuthors.map((author) => ({
    slug: author.slug,
    name: author.name,
    role: author.role,
    bio: author.bio,
    avatarImageUrl: author.avatarImageUrl,
    avatarAlt: author.avatarAlt,
    websiteUrl: author.websiteUrl,
    instagramHandle: author.instagramHandle,
    isGuestContributor: author.isGuestContributor,
    active: author.active ?? true,
  })),
};

export const FAQ_SEED = {
  contentType: "faqItem",
  entries: [
    {
      slug: "faq-pricing-class-credits",
      question: "Can I use class credits on any class?",
      answer:
        "Yes. Drop-in, 3-class, and 10-class bundles can be used on any yoga, strength, or HIIT class in the schedule. Monthly membership classes work the same way.",
      category: "pricing",
      targetPage: "pricing",
      sortOrder: 10,
    },
    {
      slug: "faq-pricing-bundles-vs-memberships",
      question: "What's the difference between bundles and memberships?",
      answer:
        "Bundles give you a set number of credits to use flexibly within a time window. Memberships give you a weekly class allowance that renews monthly. If you attend regularly, memberships are better value.",
      category: "pricing",
      sortOrder: 20,
      targetPage: "pricing",
    },
    {
      slug: "faq-pricing-refunds",
      question: "Do you offer refunds?",
      answer:
        "For 1:1 training: no refunds after sessions begin, but we can pause for illness or flare. For class bundles: unused credits can be transferred. For memberships: cancel anytime with 30 days' notice. For retreats: see individual retreat cancellation policies.",
      category: "pricing",
      sortOrder: 30,
      targetPage: "pricing",
    },
    {
      slug: "faq-pricing-affordability",
      question: "What if I can't afford these prices?",
      answer:
        "Limited sliding scale spots are available for people on disability benefits or experiencing financial hardship. Please contact us directly to discuss options.",
      category: "pricing",
      sortOrder: 40,
      targetPage: "pricing",
    },
    {
      slug: "faq-pricing-insurance",
      question: "Is this covered by insurance?",
      answer:
        "Some private health insurance policies may cover 1:1 personal training or exercise therapy. Check with your provider. We can provide invoices and documentation to support your claim.",
      category: "pricing",
      sortOrder: 50,
      targetPage: "pricing",
    },
    {
      slug: "faq-pricing-1-1-pricing",
      question: "How does the 1:1 pricing work?",
      answer:
        "Every 1:1 engagement is tailored. Your conditions, goals, and support needs determine the programming. Submit an enquiry and we will provide a clear quote with no obligation.",
      category: "pricing",
      sortOrder: 60,
      targetPage: "pricing",
    },
    {
      slug: "faq-retreats-experience",
      question: "Do I need yoga or strength training experience?",
      answer:
        "No. Retreats are designed for all levels. Everything is adapted to your current capacity and condition, with individualized guidance.",
      category: "retreats",
      sortOrder: 10,
      targetPage: "retreats",
    },
    {
      slug: "faq-retreats-flare",
      question: "What if I'm having a flare during the retreat?",
      answer:
        "All sessions are optional and adaptable. If you need to rest, that is fully supported. Retreats are designed for fluctuating symptoms.",
      category: "retreats",
      sortOrder: 20,
      targetPage: "retreats",
    },
    {
      slug: "faq-retreats-dietary",
      question: "Can you accommodate dietary requirements?",
      answer:
        "Yes. Dietary requirements and allergies are accommodated. You can provide details during booking.",
      category: "retreats",
      sortOrder: 30,
      targetPage: "retreats",
    },
    {
      slug: "faq-retreats-cancellation",
      question: "What's the cancellation policy?",
      answer:
        "Full refund if cancelled more than 60 days before retreat. 50% refund 30-60 days before. No refund within 30 days unless we can fill your space.",
      category: "retreats",
      sortOrder: 40,
      targetPage: "retreats",
    },
    {
      slug: "faq-retreats-accessibility",
      question: "What if I have specific mobility needs?",
      answer:
        "Please contact us before booking to discuss your requirements so we can confirm venue and activity accessibility.",
      category: "retreats",
      sortOrder: 50,
      targetPage: "retreats",
    },
  ],
};

export const LEAD_MAGNET_SEED = {
  contentType: "leadMagnet",
  entries: [
    {
      slug: "why-some-bodies-need-strength-before-more-stretching",
      title: "Why Some Bodies Need Strength Before More Stretching",
      hookText: 'Get "Why Some Bodies Need Strength Before More Stretching" - free:',
      landingHeadline: "Why Some Bodies Need Strength Before More Stretching",
      landingDescription:
        "A free guide exploring stability, control, and capacity in flexible bodies.",
      ctaLabel: "Get Free Guide",
      emailSubject: "Your free guide: Why Some Bodies Need Strength Before More Stretching",
      emailPreviewText: "Here is your welcome gift and how to get started.",
      emailBody:
        "Hi {{firstName}},\n\nThanks for joining. Here is your guide: Why Some Bodies Need Strength Before More Stretching.\n\n{{leadMagnetLink}}\n\nShruti",
      deliveryType: "link",
      assetUrl:
        "https://shrutiturner.co.uk/guides/why-some-bodies-need-strength-before-more-stretching.pdf",
      active: true,
    },
  ],
};

export const NEWSLETTER_SIGNUP_CONTENT_SEED = {
  contentType: "newsletterSignupContent",
  entries: [
    {
      slug: "default",
      activeLeadMagnetSlug: "why-some-bodies-need-strength-before-more-stretching",
      formPlaceholder: "your.email@example.com",
      buttonLabel: "Subscribe",
      successMessage: "You're subscribed! Check your inbox.",
      consentText: "No spam. Unsubscribe anytime.",
      popupTitle: "Get Evidence-Based Insights",
      popupDescription:
        "Join the mailing list for research-backed articles on strength, movement, and chronic illness management. No spam, unsubscribe anytime.",
    },
  ],
};

export const NEWSLETTER_TEMPLATE_SEED = {
  contentType: "newsletterTemplate",
  entries: [
    {
      slug: "monthly-update-default",
      title: "Monthly Update",
      subject: "This month: classes, resources, and upcoming retreats",
      previewText: "Your monthly update from Shruti Turner.",
      body: "Replace with newsletter body content.",
      status: "draft",
    },
  ],
};

export const SEED_GROUPS = [
  AUTHOR_PROFILE_SEED,
  INSTRUCTOR_PROFILE_SEED,
  CLASS_TEMPLATE_SEED,
  SMALL_GROUP_PROGRAMME_SEED,
  RETREAT_VENUE_SEED,
  RETREAT_TEMPLATE_SEED,
  BLOG_SEED,
  TESTIMONIAL_SEED,
  FAQ_SEED,
  LEAD_MAGNET_SEED,
  NEWSLETTER_SIGNUP_CONTENT_SEED,
  NEWSLETTER_TEMPLATE_SEED,
];
