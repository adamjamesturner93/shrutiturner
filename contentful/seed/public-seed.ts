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
      headline: "Inclusive Movement Coach",
      bio: "Shruti combines strength coaching, adaptive yoga and evidence-based rehab principles to support people living with chronic illness, pain and fluctuating energy. Her approach centers on long-term capacity, nervous system safety and practical strategies that fit real life.",
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
        "Learn about Shruti Turner's adaptive strength and yoga teaching approach for chronic illness, autoimmune conditions and injury recovery.",
    },
    {
      name: "Amina Patel",
      slug: "amina-patel",
      headline: "Guest Yoga Teacher for Restorative and Breath-Led Practice",
      bio: "Amina teaches slow, accessible yoga for people navigating fatigue, stress, pain and recovery. Her classes focus on choice, nervous system down-regulation and building trust in movement without pressure.",
      credentials: ["Yoga Teacher", "Restorative Yoga Specialist", "Breathwork Facilitator"],
      specialties: ["Restorative yoga", "Fatigue-aware movement", "Breath-led practice"],
      avatarImageUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Amina%20Patel",
      avatarAlt: "Portrait illustration of Amina Patel",
      featuredQuote: "Gentle practice still deserves clear teaching, useful options and respect.",
      active: true,
      seoTitle: "Amina Patel - Instructor Profile",
      seoDescription:
        "Learn about Amina Patel's restorative and breath-led yoga teaching for chronic illness, autoimmune conditions and injury recovery.",
    },
  ],
};

export const TESTIMONIAL_SEED = {
  contentType: "testimonial",
  entries: [
    {
      slug: "testimonial-sarah-yoga",
      quote:
        "Finally, a yoga teacher who understands chronic illness, injury history and real recovery needs.",
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
    {
      slug: "testimonial-nadia-pt",
      quote:
        "The plan finally matched my energy instead of pretending every week would be the same.",
      authorName: "Nadia",
      authorCondition: "Long COVID",
      service: "pt",
      featured: true,
    },
    {
      slug: "testimonial-morgan-retreat",
      quote:
        "I expected rest, but I also left with practical strength work I could keep using at home.",
      authorName: "Morgan",
      authorCondition: "Fibromyalgia",
      service: "retreat",
      featured: false,
    },
    {
      slug: "testimonial-ali-yoga",
      quote:
        "Every option felt intentional. I never felt like I was being given the watered-down version.",
      authorName: "Ali",
      authorCondition: "Post-surgical recovery",
      service: "yoga",
      featured: false,
    },
    {
      slug: "testimonial-rachel-strength",
      quote:
        "I can carry shopping, climb stairs and trust my knees more. Those are the wins that matter.",
      authorName: "Rachel",
      authorCondition: "Osteoarthritis",
      service: "strength",
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
  entries: [
    ...blogPosts.map((p) => ({
      title: p.title,
      slug: p.id,
      coverImageUrl: compactImageUrl(p.coverImage),
      coverAlt: p.coverAlt,
      excerpt: p.excerpt,
      content: p.content,
      authorSlugs: p.authors.map((author) => author.slug),
      tags: p.tags,
      readTime: p.readTime,
      seoTitle: p.title,
      seoDescription: p.excerpt,
    })),
    {
      title: "How to Choose Between Yoga, Strengthand 1:1 Coaching",
      slug: "choose-yoga-strength-or-coaching",
      coverImageUrl:
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1080&q=80&fit=crop",
      coverAlt: "Yoga mat and dumbbells arranged in a bright studio",
      excerpt:
        "A practical guide to choosing the right support when your symptoms, goals and confidence all need to be considered.",
      content: `# How to Choose Between Yoga, Strengthand 1:1 Coaching

Most people do not need the hardest option. They need the right starting point.

Choose yoga when you want a lower-intensity practice focused on mobility, regulation, breathand body awareness. Choose strength classes when you want progressive loading with a clear structure and options. Choose 1:1 coaching when you need closer support because symptoms, pain, confidence, or medical history make generic advice hard to apply.

The useful question is not "what should I be able to do?" It is "what support would make this repeatable for the next eight weeks?"`,
      authorSlugs: ["shruti-turner"],
      tags: ["Getting Started", "Yoga", "Strength Training"],
      readTime: "4 min read",
      seoTitle: "How to Choose Between Yoga, Strengthand 1:1 Coaching",
      seoDescription:
        "A practical guide to choosing the right movement support for chronic illness, autoimmune conditions and injury recovery.",
    },
    {
      title: "Pain During Exercise: When to Modify and When to Stop",
      slug: "pain-during-exercise-modify-or-stop",
      coverImageUrl:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1080&q=80&fit=crop",
      coverAlt: "Coach supporting a client during a controlled exercise",
      excerpt:
        "Pain is information, but it is not always a simple stop sign. Here is a clearer framework for training decisions.",
      content: `# Pain During Exercise: When to Modify and When to Stop

Pain deserves attention. It does not deserve panic.

During training, we look at intensity, location, quality and what happens after the session. A familiar low-level ache that settles quickly may call for a smaller range, lighter load, or slower tempo. Sharp pain, escalating pain, new neurological symptoms, or symptoms that persist after training mean the plan needs to change.

Good programming removes guesswork. You should know the modification before you need it.`,
      authorSlugs: ["dr-hannah-lewis"],
      tags: ["Pain", "Exercise", "Clinical Reasoning"],
      readTime: "5 min read",
      seoTitle: "Pain During Exercise: When to Modify and When to Stop",
      seoDescription:
        "A practical framework for exercise pain decisions in chronic illness and injury recovery.",
    },
    {
      title: "What a Good Small Group Programme Should Feel Like",
      slug: "good-small-group-programme",
      coverImageUrl:
        "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=1080&q=80&fit=crop",
      coverAlt: "Small group strength class with supportive coaching",
      excerpt:
        "Small group training should feel personal enough to be useful and structured enough to build momentum.",
      content: `# What a Good Small Group Programme Should Feel Like

Small group work is not just a cheaper version of 1:1 coaching. Done well, it gives you structure, accountability, shared contextand enough individual attention to keep the work relevant.

You should know what the block is trying to build. You should have options for lower-energy days. You should feel seen without needing to explain your whole health history every session.

The best small groups create consistency without flattening everyone into the same body.`,
      authorSlugs: ["shruti-turner"],
      tags: ["Small Groups", "Strength Training", "Coaching"],
      readTime: "4 min read",
      seoTitle: "What a Good Small Group Programme Should Feel Like",
      seoDescription:
        "What to expect from supportive small group strength training for chronic illness, autoimmune conditions and injury recovery.",
    },
    {
      title: "Breathwork for Chronic Pain Without Over-Promising",
      slug: "breathwork-for-chronic-pain",
      coverImageUrl:
        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1080&q=80&fit=crop",
      coverAlt: "Person resting on a yoga mat during a quiet breathwork practice",
      excerpt:
        "Breathwork can support regulation and pain management, but it works best when taught with realistic expectations.",
      content: `# Breathwork for Chronic Pain Without Over-Promising

Breathwork is not a cure for chronic pain. It can still be useful.

Slow, supported breathing can help some people down-shift arousal, reduce guarding and build a sense of control during difficult symptoms. The key is choice. Practices should be short, adaptable and easy to stop if they increase dizziness, anxiety, or discomfort.

The goal is not perfect calm. The goal is another tool you can reach for when your system is working hard.`,
      authorSlugs: ["maya-thompson"],
      tags: ["Breathwork", "Chronic Pain", "Yoga"],
      readTime: "4 min read",
      seoTitle: "Breathwork for Chronic Pain Without Over-Promising",
      seoDescription:
        "A realistic look at breathwork as one support tool for chronic pain and nervous system regulation.",
    },
    {
      title: "Why Rest Weeks Belong in Strength Programmes",
      slug: "why-rest-weeks-belong-in-strength-programmes",
      coverImageUrl:
        "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1080&q=80&fit=crop",
      coverAlt: "Training journal, water bottle and resistance bands on a gym floor",
      excerpt:
        "Deload weeks are not lost progress. They are one of the ways sustainable training keeps working.",
      content: `# Why Rest Weeks Belong in Strength Programmes

Progress needs recovery. That is especially true when your baseline stress load is already high.

A rest or deload week can mean fewer sets, lighter loads, shorter sessions, or more technique work. It gives joints, connective tissue and your nervous system time to absorb the work you have done.

If a programme only works when life is perfect, it is not a robust programme.`,
      authorSlugs: ["shruti-turner"],
      tags: ["Recovery", "Strength Training", "Programming"],
      readTime: "3 min read",
      seoTitle: "Why Rest Weeks Belong in Strength Programmes",
      seoDescription:
        "Why deload and rest weeks matter in sustainable strength training for chronic illness.",
    },
    {
      title: "A Coach and Physio Discuss Returning After a Flare",
      slug: "returning-after-a-flare-coach-physio",
      coverImageUrl:
        "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=1080&q=80&fit=crop",
      coverAlt: "Two professionals reviewing a training plan together",
      excerpt:
        "A joint perspective on rebuilding movement after a symptom flare without rushing the process.",
      content: `# A Coach and Physio Discuss Returning After a Flare

After a flare, the temptation is often to either do nothing or jump straight back to the old plan. Usually, the useful answer is in the middle.

From a coaching perspective, the first session back should rebuild rhythm and confidence. From a physio perspective, it should also check whether pain, swelling, fatigue, or neurological symptoms have changed the risk profile.

Start with the smallest useful dose. Keep the session boring. Then use the next 24 to 48 hours as feedback before progressing.`,
      authorSlugs: ["shruti-turner", "dr-hannah-lewis"],
      tags: ["Flares", "Physiotherapy", "Strength Training"],
      readTime: "5 min read",
      seoTitle: "Returning After a Flare: Coach and Physio Advice",
      seoDescription:
        "A joint coach and physiotherapist perspective on returning to training after a symptom flare.",
    },
  ],
};

export const AUTHOR_PROFILE_SEED = {
  contentType: "authorProfile",
  entries: [
    ...blogAuthors.map((author) => ({
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
    {
      slug: "maya-thompson",
      name: "Maya Thompson",
      role: "Guest Yoga and Breathwork Teacher",
      bio: "Maya writes about accessible yoga, breath-led practice, fatigue-aware teaching and practical nervous system support for people with chronic illness, autoimmune conditions and injury recovery needs.",
      avatarImageUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Maya%20Thompson",
      avatarAlt: "Portrait illustration of Maya Thompson",
      websiteUrl: "https://example.com/maya-thompson",
      instagramHandle: "@mayathompsonyoga",
      isGuestContributor: true,
      active: true,
    },
  ],
};

export const FAQ_SEED = {
  contentType: "faqItem",
  entries: [
    {
      slug: "faq-pricing-class-credits",
      question: "Can I use class credits on any class?",
      answer:
        "Yes. Drop-in, 3-class and 10-class bundles can be used on any yoga, strength, or HIIT class in the schedule. Monthly membership classes work the same way.",
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
        "Every 1:1 engagement is tailored. Your conditions, goals and support needs determine the programming. Submit an enquiry and we will provide a clear quote with no obligation.",
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
    {
      slug: "faq-classes-first-class",
      question: "What should I book for my first class?",
      answer:
        "If you are unsure, start with an adaptive yoga class or contact us before booking. We can help you choose based on symptoms, confidence and what kind of support you want.",
      category: "classes",
      sortOrder: 10,
      targetPage: "classes",
    },
    {
      slug: "faq-classes-access-needs",
      question: "Can classes be adapted around pain, fatigue, or mobility needs?",
      answer:
        "Yes. Classes include options for range, load, pace and rest. Please share anything important before class so the teacher can plan useful alternatives.",
      category: "classes",
      sortOrder: 20,
      targetPage: "classes",
    },
    {
      slug: "faq-schedule-missed-class",
      question: "What happens if I miss a booked class?",
      answer:
        "If you cancel within the stated cancellation window, your credit is returned. Late cancellations and no-shows may use the credit because spaces are limited.",
      category: "schedule",
      sortOrder: 10,
      targetPage: "schedule",
    },
    {
      slug: "faq-blog-medical-advice",
      question: "Is the blog medical advice?",
      answer:
        "No. Blog articles are educational and should not replace advice from your clinician. Use them as prompts for discussion and decision-making with appropriate support.",
      category: "blog",
      sortOrder: 10,
      targetPage: "blog",
    },
    {
      slug: "faq-newsletter-frequency",
      question: "How often will I receive emails?",
      answer:
        "Usually once or twice a month, with occasional updates about new resources, classes, or retreats. You can unsubscribe at any time.",
      category: "newsletter",
      sortOrder: 10,
      targetPage: "blog",
      targetSection: "newsletter",
    },
    {
      slug: "faq-contact-before-booking",
      question: "Can I ask a question before booking?",
      answer:
        "Yes. If you are not sure which service fits, send a short message with your main goal and any access needs. We will point you to the most suitable next step.",
      category: "contact",
      sortOrder: 10,
      targetPage: "contact",
    },
  ],
};

export const LEAD_MAGNET_SEED = {
  contentType: "leadMagnet",
  entries: [
    {
      slug: "why-some-bodies-need-strength-before-more-stretching",
      title: "Why Some Bodies Need Strength Before More Stretching",
      hookText: 'Get the free guide to your inbox - "Why Some Bodies Need Strength Before More Stretching"',
      landingHeadline: "Why Some Bodies Need Strength Before More Stretching",
      landingDescription:
        "A free guide exploring stability, control and capacity in flexible bodies.",
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
    {
      slug: "flare-day-training-plan",
      title: "Flare Day Training Plan",
      hookText: "Get a simple flare-day movement plan for lower-energy days.",
      landingHeadline: "A Flare Day Training Plan You Can Actually Use",
      landingDescription:
        "A short guide to scaling strength and yoga practice when symptoms are louder than usual.",
      ctaLabel: "Send Me the Plan",
      emailSubject: "Your flare day training plan",
      emailPreviewText: "A practical guide for lower-energy movement days.",
      emailBody:
        "Hi {{firstName}},\n\nHere is your flare day training plan:\n\n{{leadMagnetLink}}\n\nUse it as a menu, not a rulebook.\n\nShruti",
      deliveryType: "link",
      assetUrl: "https://shrutiturner.co.uk/guides/flare-day-training-plan.pdf",
      active: true,
    },
    {
      slug: "first-strength-session-checklist",
      title: "First Strength Session Checklist",
      hookText: "Download a checklist for your first supported strength session.",
      landingHeadline: "Feel Prepared for Your First Strength Session",
      landingDescription:
        "A practical checklist covering kit, pacing, symptoms, questions and what to track afterwards.",
      ctaLabel: "Get the Checklist",
      emailSubject: "Your first strength session checklist",
      emailPreviewText: "A quick checklist to make your first session less guessy.",
      emailBody:
        "Hi {{firstName}},\n\nHere is your first strength session checklist:\n\n{{leadMagnetLink}}\n\nBring questions, not pressure.\n\nShruti",
      deliveryType: "link",
      assetUrl: "https://shrutiturner.co.uk/guides/first-strength-session-checklist.pdf",
      active: false,
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
        "Join the mailing list for research-backed articles on strength, movementand chronic illness management. No spam, unsubscribe anytime.",
    },
  ],
};

export const NEWSLETTER_TEMPLATE_SEED = {
  contentType: "newsletterTemplate",
  entries: [
    {
      slug: "monthly-update-default",
      title: "Monthly Update",
      subject: "This month: classes, resources and upcoming retreats",
      previewText: "Your monthly update from Shruti Turner.",
      body: "Hi {{firstName}},\n\nThis month we are focusing on sustainable consistency: adapting classes around symptoms, using rest weeks well and choosing the right starting point.\n\nNew on the blog:\n- How to Choose Between Yoga, Strengthand 1:1 Coaching\n- Why Rest Weeks Belong in Strength Programmes\n\nSee you soon,\nShruti",
      segmentation: "all_subscribers",
    },
    {
      slug: "spring-strength-reset",
      title: "Spring Strength Reset",
      subject: "A steadier way to restart strength work this spring",
      previewText: "Start smaller, build repeatability and avoid boom-and-bust.",
      body: "Hi {{firstName}},\n\nIf spring makes you want to restart everything at once, this is your reminder to start with the smallest repeatable dose.\n\nA good first week might be two short sessions, one walk and one proper rest day. The point is not intensity. The point is a rhythm your body can recover from.\n\nShruti",
      segmentation: "all_subscribers",
    },
    {
      slug: "retreat-waitlist-warmup",
      title: "Retreat Waitlist Warmup",
      subject: "Thinking about a retreat but not sure if it is for you?",
      previewText:
        "What to expect from a retreat designed for chronic illness, autoimmune conditions and injury recovery.",
      body: "Hi {{firstName}},\n\nA retreat should not ask you to perform wellness. It should give you rest, options, useful movement, good food and space to be honest about your body.\n\nThis email is a test campaign for retreat interest and waitlist nurturing.\n\nShruti",
      segmentation: "all_subscribers",
    },
    {
      slug: "blog-roundup-flare-friendly-training",
      title: "Blog Roundup: Flare-Friendly Training",
      subject: "Three reads for training around flares",
      previewText: "A short roundup on pain, pacing and returning after symptoms spike.",
      body: "Hi {{firstName}},\n\nHere are three useful reads for weeks when symptoms are not behaving:\n\n1. Programming Strength Training Around Flares and Bad Days\n2. Pain During Exercise: When to Modify and When to Stop\n3. A Coach and Physio Discuss Returning After a Flare\n\nSave them for the week you need fewer decisions.\n\nShruti",
      segmentation: "all_subscribers",
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
