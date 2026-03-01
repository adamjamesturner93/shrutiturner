export interface ClassDetail {
  id: string;
  slug: string;
  name: string;
  type: "Yoga" | "Strength" | "HIIT";
  day: string;
  time: string;
  duration: string;
  level: string;
  maxSpaces: number;
  shortDescription: string;
  longDescription: string;
  whatToExpect: string[];
  whoItsFor: string[];
  equipment: string[];
  benefits: string[];
  instructor: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
}

export const classDetails: ClassDetail[] = [
  {
    id: "adaptive-yoga-flow",
    slug: "adaptive-yoga-flow",
    name: "Adaptive Yoga Flow",
    type: "Yoga",
    day: "Monday",
    time: "09:00",
    duration: "60 min",
    level: "All levels",
    maxSpaces: 12,
    shortDescription:
      "Rehabilitation-informed yoga focusing on stability and nervous system regulation.",
    longDescription: `Adaptive Yoga Flow is a 60-minute rehabilitation-informed practice designed for bodies that need intelligent, adaptive movement rather than generic yoga modifications.

This class prioritises joint stability, nervous system regulation, and mindful movement patterns. Unlike mainstream yoga with bolt-on modifications, every element of this practice is designed from the ground up for people managing chronic conditions, joint hypermobility, autoimmune symptoms, and chronic pain.

Each session includes breath work for nervous system regulation, gentle mobilisation, standing and seated flow sequences adapted in real-time, and a guided rest period. Shruti teaches with the understanding that your capacity fluctuates — some weeks you'll feel strong, others you'll need to dial right back. Both are welcome.`,
    whatToExpect: [
      "Breath work and nervous system regulation (5-10 mins)",
      "Gentle warm-up and joint mobilisation",
      "Flowing sequences adapted in real-time to your capacity",
      "Balance and stability work with chair support available",
      "Guided cool-down and restorative rest (10 mins)",
      "Options for every movement — never just 'easier versions'",
    ],
    whoItsFor: [
      "People with autoimmune conditions (RA, PsA, lupus, etc.)",
      "Those managing chronic pain or fatigue",
      "People with joint hypermobility or EDS",
      "Anyone recovering from injury or surgery",
      "Complete beginners through to experienced practitioners",
    ],
    equipment: [
      "Yoga mat or comfortable surface",
      "2 blocks or thick books (optional but recommended)",
      "Cushion or bolster for seated work",
      "Chair for balance support (optional)",
      "Blanket for rest period",
    ],
    benefits: [
      "Improved joint stability and proprioception",
      "Better nervous system regulation",
      "Reduced stiffness and improved mobility",
      "Enhanced body awareness and movement confidence",
      "Community connection with others who understand",
    ],
    instructor: "Shruti Turner",
    seoTitle:
      "Adaptive Yoga Flow - Online Yoga for Chronic Illness | Shruti Turner",
    seoDescription:
      "Live online adaptive yoga class for people with chronic illness, autoimmune conditions, and complex bodies. Rehabilitation-informed, not just modified mainstream yoga. Mondays 9am GMT.",
    seoKeywords:
      "adaptive yoga online, yoga chronic illness, yoga autoimmune disease, yoga rheumatoid arthritis, rehabilitation yoga, yoga hypermobility, yoga EDS",
  },
  {
    id: "strength-foundations",
    slug: "strength-foundations",
    name: "Strength Foundations",
    type: "Strength",
    day: "Monday",
    time: "18:30",
    duration: "45 min",
    level: "Beginner",
    maxSpaces: 10,
    shortDescription:
      "Introduction to strength training principles for complex bodies.",
    longDescription: `Strength Foundations is a 45-minute beginner-friendly class that introduces evidence-based strength training principles specifically designed for people with chronic illness and complex bodies.

This is not a watered-down version of a regular strength class. It's a ground-up approach to resistance training that accounts for fluctuating energy, joint protection, post-exertional malaise, and the reality of training with chronic conditions.

You'll learn fundamental movement patterns — hinge, squat, push, pull, carry — with modifications and progressions that respect your body's current capacity. The goal is building genuine strength and confidence in the weight room, not just going through the motions.`,
    whatToExpect: [
      "Dynamic warm-up tailored to your mobility needs",
      "Technique instruction on 3-4 fundamental movements",
      "Working sets at your appropriate intensity",
      "Clear guidance on when to push and when to back off",
      "Cool-down and recovery guidance",
      "Take-away notes on movements covered",
    ],
    whoItsFor: [
      "Complete beginners to strength training",
      "People returning to exercise after illness or injury",
      "Those who feel intimidated by traditional gym environments",
      "Anyone with chronic conditions wanting to start safely",
      "People who've been told to 'just rest' and want to reclaim capacity",
    ],
    equipment: [
      "Light dumbbells (2-5kg) or water bottles",
      "Resistance band (light-medium, optional)",
      "Chair for support and seated alternatives",
      "Yoga mat for floor work",
    ],
    benefits: [
      "Build foundational strength safely",
      "Learn proper movement patterns",
      "Increase confidence with resistance training",
      "Understand how to scale training to daily capacity",
      "Reduce risk of injury through technique mastery",
    ],
    instructor: "Shruti Turner",
    seoTitle:
      "Strength Foundations - Beginner Strength Training for Chronic Illness | Shruti Turner",
    seoDescription:
      "Online beginner strength training class for people with chronic illness and complex bodies. Evidence-based programming that builds genuine capacity. Mondays 6:30pm GMT.",
    seoKeywords:
      "beginner strength training, strength training chronic illness, exercise autoimmune disease, safe strength training, chronic pain exercise, resistance training beginners",
  },
  {
    id: "chair-based-strength",
    slug: "chair-based-strength",
    name: "Chair-Based Strength",
    type: "Strength",
    day: "Tuesday",
    time: "10:00",
    duration: "45 min",
    level: "Adaptive",
    maxSpaces: 8,
    shortDescription:
      "Seated strength work for those with mobility limitations or high fatigue.",
    longDescription: `Chair-Based Strength is a 45-minute seated and supported resistance training class designed for people experiencing high fatigue, mobility limitations, or flare periods.

This class proves that effective strength training doesn't require standing for 45 minutes. Using a chair as your base, you'll work through upper body, core, and lower body exercises that build genuine strength and muscular endurance.

This is particularly valuable for people managing post-exertional malaise, those in flare periods, wheelchair users, or anyone who simply needs more support on a given day. The programming is progressive — you won't be doing the same thing every week.`,
    whatToExpect: [
      "Seated warm-up and joint mobilisation",
      "Upper body strength work (shoulders, back, arms)",
      "Core stability exercises from seated position",
      "Lower body work including seated leg exercises",
      "Resistance band and light weight work",
      "Gentle cool-down and stretch",
    ],
    whoItsFor: [
      "People experiencing high fatigue or energy limitations",
      "Those in flare periods needing lower-intensity options",
      "Wheelchair users or those with mobility limitations",
      "Anyone recovering from surgery or acute illness",
      "People who find standing classes too demanding currently",
    ],
    equipment: [
      "Sturdy chair (dining chair, not office chair with wheels)",
      "Light dumbbells (1-3kg) or water bottles/cans",
      "Resistance band (light)",
      "Small towel",
    ],
    benefits: [
      "Maintain and build strength during low-capacity periods",
      "Prevent deconditioning during flares",
      "Improve upper body strength and posture",
      "Build core stability from a supported position",
      "Maintain training consistency without overexertion",
    ],
    instructor: "Shruti Turner",
    seoTitle:
      "Chair-Based Strength - Seated Strength Training Online | Shruti Turner",
    seoDescription:
      "Online seated strength training class for people with mobility limitations, high fatigue, or during flare periods. Effective strength work from a chair. Tuesdays 10am GMT.",
    seoKeywords:
      "chair exercises, seated strength training, adaptive exercise, wheelchair exercise, fatigue exercise, chronic fatigue strength, seated workout",
  },
  {
    id: "restorative-yoga",
    slug: "restorative-yoga",
    name: "Restorative Yoga",
    type: "Yoga",
    day: "Wednesday",
    time: "09:00",
    duration: "60 min",
    level: "All levels",
    maxSpaces: 12,
    shortDescription:
      "Deeply restful practice for nervous system regulation and recovery.",
    longDescription: `Restorative Yoga is a 60-minute deeply restful practice designed to down-regulate the nervous system, reduce pain perception, and support recovery.

This is not active yoga — you won't be building heat or working on strength. Instead, you'll be held in supported positions for 5-10 minutes each, allowing your body to release tension and your nervous system to shift from sympathetic (fight/flight) to parasympathetic (rest/digest) dominance.

For people with chronic illness and autoimmune conditions, this nervous system regulation is not a luxury — it's a fundamental part of managing symptoms and supporting recovery. This practice complements the more active yoga and strength classes in the schedule.`,
    whatToExpect: [
      "Guided body scan and breath awareness",
      "5-6 fully supported poses held for 5-10 minutes each",
      "Props and supports for complete comfort",
      "Minimal movement — maximum restoration",
      "Guided relaxation and yoga nidra-style rest",
      "Gentle transition back to alertness",
    ],
    whoItsFor: [
      "Anyone managing chronic pain or high stress",
      "People experiencing fatigue, insomnia, or anxiety",
      "Those in flare periods needing gentle support",
      "Active class attendees wanting recovery practice",
      "Anyone new to yoga wanting a gentle entry point",
    ],
    equipment: [
      "Yoga mat and blanket",
      "2-3 cushions or pillows",
      "Eye covering (optional)",
      "Bolster if available (pillows work fine)",
      "Warm layers — you'll cool down",
    ],
    benefits: [
      "Nervous system down-regulation",
      "Reduced pain perception and muscle tension",
      "Improved sleep quality",
      "Stress reduction and emotional regulation",
      "Supported recovery between active training",
    ],
    instructor: "Shruti Turner",
    seoTitle:
      "Restorative Yoga - Online Nervous System Regulation | Shruti Turner",
    seoDescription:
      "Online restorative yoga class for nervous system regulation and recovery. Deeply restful practice for chronic illness, pain management, and stress reduction. Wednesdays 9am GMT.",
    seoKeywords:
      "restorative yoga online, yoga nervous system, yoga pain management, yoga chronic pain, yoga stress relief, gentle yoga, yoga recovery",
  },
  {
    id: "hiit-complex-bodies",
    slug: "hiit-complex-bodies",
    name: "HIIT for Complex Bodies",
    type: "HIIT",
    day: "Wednesday",
    time: "19:00",
    duration: "45 min",
    level: "Intermediate",
    maxSpaces: 10,
    shortDescription:
      "Modified high-intensity intervals adapted for chronic conditions.",
    longDescription: `HIIT for Complex Bodies is a 45-minute modified high-intensity interval training class that adapts the cardiovascular and metabolic benefits of HIIT for people managing chronic conditions.

Standard HIIT classes are often built around maximum-effort work intervals that can trigger post-exertional malaise, symptom flares, and burnout for people with chronic illness. This class uses extended rest periods, sub-maximal effort levels, and intelligent exercise selection to deliver the benefits of interval training without the crash.

Work-to-rest ratios are typically 1:2 or 1:3 (compared to the standard 1:1 or 2:1), and you'll always be encouraged to work at YOUR appropriate intensity, not the class's. RPE (rate of perceived exertion) guidance is provided throughout.`,
    whatToExpect: [
      "Extended warm-up (8-10 mins) to prepare joints and cardiovascular system",
      "Interval blocks with generous rest periods",
      "Work intervals at 60-80% effort (not max effort)",
      "Low-impact options for all exercises",
      "Clear RPE guidance throughout",
      "Extended cool-down and recovery breathing",
    ],
    whoItsFor: [
      "People wanting cardiovascular fitness without burnout",
      "Those managing fatigue who miss feeling 'worked out'",
      "Intermediate-level exercisers with chronic conditions",
      "People who've been cleared for moderate-intensity exercise",
      "Those wanting structured, progressive cardio training",
    ],
    equipment: [
      "Yoga mat",
      "Light dumbbells (optional, 2-5kg)",
      "Water bottle (essential)",
      "Towel",
      "Heart rate monitor (optional but useful)",
    ],
    benefits: [
      "Improved cardiovascular fitness",
      "Enhanced metabolic health",
      "Better energy management skills",
      "Increased exercise tolerance over time",
      "Mood and cognitive benefits of interval training",
    ],
    instructor: "Shruti Turner",
    seoTitle:
      "HIIT for Complex Bodies - Modified Interval Training | Shruti Turner",
    seoDescription:
      "Online modified HIIT class for people with chronic illness. Intelligent interval training with extended rest periods, low-impact options, and sub-maximal effort. Wednesdays 7pm GMT.",
    seoKeywords:
      "modified HIIT, HIIT chronic illness, interval training adapted, low impact HIIT, exercise chronic fatigue, cardio chronic pain, adaptive HIIT",
  },
  {
    id: "toning-mobility",
    slug: "toning-mobility",
    name: "Toning & Mobility",
    type: "Strength",
    day: "Thursday",
    time: "10:00",
    duration: "45 min",
    level: "All levels",
    maxSpaces: 10,
    shortDescription:
      "Low-impact strength work combined with joint mobility.",
    longDescription: `Toning & Mobility is a 45-minute class that combines low-impact muscular endurance work with joint mobility exercises. This class bridges the gap between yoga and strength training, making it ideal for people who want both in a single session.

The first half focuses on controlled, low-impact strength exercises — think slow tempo work, isometric holds, and time under tension. The second half addresses joint mobility through active stretching, controlled articular rotations, and movement patterns that improve range of motion.

This class is particularly beneficial for people with arthritis, as the combination of strength and mobility work directly supports joint health.`,
    whatToExpect: [
      "Full-body warm-up emphasising joint health",
      "Muscular endurance work at moderate tempo",
      "Isometric holds and time-under-tension exercises",
      "Active mobility drills for major joints",
      "Controlled articular rotations (CARs)",
      "Stretch and cool-down",
    ],
    whoItsFor: [
      "People with arthritis wanting joint-specific work",
      "Anyone preferring lower-intensity strength sessions",
      "Those wanting combined strength and flexibility work",
      "People looking for a mid-week, moderate session",
      "Beginners and experienced exercisers alike",
    ],
    equipment: [
      "Yoga mat",
      "Light dumbbells (1-4kg) or resistance band",
      "Chair for balance support (optional)",
      "Small towel",
    ],
    benefits: [
      "Improved joint health and mobility",
      "Muscular endurance without high intensity",
      "Better functional movement patterns",
      "Reduced joint stiffness",
      "Balanced strength across muscle groups",
    ],
    instructor: "Shruti Turner",
    seoTitle:
      "Toning & Mobility - Joint Health & Strength Online | Shruti Turner",
    seoDescription:
      "Online toning and mobility class combining low-impact strength with joint mobility work. Ideal for arthritis, stiffness, and functional movement. Thursdays 10am GMT.",
    seoKeywords:
      "toning class, mobility exercises, joint mobility, arthritis exercise, low impact strength, flexibility training, joint health exercise",
  },
  {
    id: "yoga-hypermobility",
    slug: "yoga-hypermobility",
    name: "Yoga for Hypermobility",
    type: "Yoga",
    day: "Friday",
    time: "09:00",
    duration: "60 min",
    level: "Specialised",
    maxSpaces: 8,
    shortDescription:
      "Strength-focused yoga for hypermobile joints and EDS.",
    longDescription: `Yoga for Hypermobility is a specialised 60-minute class designed specifically for people with joint hypermobility, Ehlers-Danlos syndromes (EDS), and hypermobility spectrum disorders (HSD).

Traditional yoga can be actively harmful for hypermobile bodies — stretching already unstable joints, rewarding extreme range of motion, and ignoring the proprioceptive deficits common in hypermobility. This class takes a fundamentally different approach.

Instead of stretching, we focus on end-range control. Instead of going deeper, we focus on stability. Instead of passive flexibility, we build active strength within your available range. This class is informed by the latest evidence on hypermobility management and Shruti's own clinical understanding.`,
    whatToExpect: [
      "Proprioceptive and balance challenges",
      "End-range control exercises (not stretching)",
      "Isometric holds for joint stability",
      "Strength-focused standing poses with joint protection",
      "Core stability work for spinal support",
      "Education on hypermobility-safe movement",
    ],
    whoItsFor: [
      "People diagnosed with hEDS, cEDS, or other EDS types",
      "Those with hypermobility spectrum disorder (HSD)",
      "People with generalised joint hypermobility",
      "Hypermobile individuals who've been injured by yoga before",
      "Physiotherapy patients wanting additional supported practice",
    ],
    equipment: [
      "Yoga mat",
      "2 yoga blocks or thick books",
      "Resistance band (light-medium)",
      "Wall access for balance support",
      "Chair nearby for modifications",
    ],
    benefits: [
      "Improved joint stability and proprioception",
      "Reduced subluxations and dislocations",
      "Better body awareness and movement control",
      "Stronger stabilising muscles around joints",
      "Confidence in movement without fear of injury",
    ],
    instructor: "Shruti Turner",
    seoTitle:
      "Yoga for Hypermobility - EDS-Safe Yoga Online | Shruti Turner",
    seoDescription:
      "Specialised online yoga class for hypermobility and Ehlers-Danlos syndrome. Strength-focused, stability-first approach. No stretching unstable joints. Fridays 9am GMT.",
    seoKeywords:
      "yoga hypermobility, yoga EDS, Ehlers-Danlos yoga, hypermobile yoga, yoga joint stability, yoga HSD, safe yoga hypermobility",
  },
  {
    id: "strength-progression",
    slug: "strength-progression",
    name: "Strength Progression",
    type: "Strength",
    day: "Friday",
    time: "12:00",
    duration: "45 min",
    level: "Intermediate",
    maxSpaces: 10,
    shortDescription:
      "Progressive strength training for those building capacity.",
    longDescription: `Strength Progression is a 45-minute intermediate-level class for people who have foundational strength and want to progress intelligently.

This class follows a periodised program, meaning the exercises and intensity progress over 4-6 week blocks. You'll work through compound movements (squats, deadlifts, rows, presses) with appropriate loading, with clear guidance on how to scale up or down based on your daily capacity.

If you've attended Strength Foundations and feel ready for more challenge, this is your next step. The class maintains the same rehabilitation-informed approach but with more complex movements, higher intensities, and progressive overload.`,
    whatToExpect: [
      "Structured warm-up targeting the day's movement patterns",
      "Compound strength exercises with progressive loading",
      "Supersets and circuits for efficiency",
      "Clear RPE targets for each exercise",
      "Technique coaching and real-time modifications",
      "Cool-down and recovery guidance",
    ],
    whoItsFor: [
      "Graduates of Strength Foundations wanting progression",
      "Intermediate exercisers with chronic conditions",
      "People comfortable with fundamental movement patterns",
      "Those who want structured, progressive programming",
      "Anyone building toward specific strength goals",
    ],
    equipment: [
      "Dumbbells (multiple weights, 3-10kg+ depending on experience)",
      "Resistance bands (medium-heavy)",
      "Yoga mat for floor work",
      "Sturdy chair or bench",
    ],
    benefits: [
      "Progressive strength gains through periodisation",
      "Improved bone density and joint health",
      "Greater confidence with resistance training",
      "Better functional capacity in daily life",
      "Structured progression with clear milestones",
    ],
    instructor: "Shruti Turner",
    seoTitle:
      "Strength Progression - Intermediate Online Strength Training | Shruti Turner",
    seoDescription:
      "Online intermediate strength training class with periodised programming for people with chronic illness. Progressive overload adapted for complex bodies. Fridays 12pm GMT.",
    seoKeywords:
      "intermediate strength training, progressive overload, strength chronic illness, periodised training, compound exercises adapted, strength progression online",
  },
  {
    id: "weekend-yoga-flow",
    slug: "weekend-yoga-flow",
    name: "Weekend Yoga Flow",
    type: "Yoga",
    day: "Saturday",
    time: "10:00",
    duration: "60 min",
    level: "All levels",
    maxSpaces: 15,
    shortDescription:
      "Popular weekend class combining movement and restoration.",
    longDescription: `Weekend Yoga Flow is a 60-minute all-levels class that combines the best elements of the weekday yoga offerings into a balanced Saturday practice.

This is the most popular class on the schedule, and the larger cap (15 spaces) reflects demand. The class blends gentle flow sequences with stability work, breath practice, and a generous restorative finish.

It's designed to be the class you can always attend, regardless of where you are in your week — whether you've had a high-energy week or a low-capacity one. The pacing is unhurried, the cues are detailed, and the modifications are built in, not bolted on.`,
    whatToExpect: [
      "Centering breath practice to arrive",
      "Gentle warm-up and mobilisation",
      "Flowing sequences at a comfortable pace",
      "Stability and balance challenges with options",
      "Longer cool-down and restorative finish (15 mins)",
      "A supportive, welcoming community atmosphere",
    ],
    whoItsFor: [
      "Anyone wanting a weekend yoga practice",
      "People new to Shruti's classes wanting to try",
      "Those who attend weekday classes and want more",
      "Anyone managing chronic conditions, any level",
      "People who prefer a larger, community-focused class",
    ],
    equipment: [
      "Yoga mat",
      "Blocks or books (optional)",
      "Cushion for seated work",
      "Blanket for restorative finish",
    ],
    benefits: [
      "Balanced physical practice for the whole body",
      "Mental clarity and stress relief for the weekend",
      "Consistent weekly practice builds long-term benefits",
      "Social connection with a supportive community",
      "Flexible intensity to match your weekly capacity",
    ],
    instructor: "Shruti Turner",
    seoTitle:
      "Weekend Yoga Flow - Saturday Online Yoga Class | Shruti Turner",
    seoDescription:
      "Popular Saturday online yoga class for all levels. Adaptive flow combining movement, stability, and restoration for people with chronic illness and complex bodies. Saturdays 10am GMT.",
    seoKeywords:
      "weekend yoga class, Saturday yoga online, yoga all levels, adaptive yoga flow, online yoga community, yoga chronic illness Saturday",
  },
];

// Group classes by day for the schedule page
export function getScheduleByDay() {
  const dayOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const grouped: Record<string, ClassDetail[]> = {};

  for (const cls of classDetails) {
    if (!grouped[cls.day]) {
      grouped[cls.day] = [];
    }
    grouped[cls.day].push(cls);
  }

  return dayOrder
    .filter((day) => grouped[day])
    .map((day) => ({
      day,
      classes: grouped[day].sort((a, b) => a.time.localeCompare(b.time)),
    }));
}

export function getClassBySlug(slug: string): ClassDetail | undefined {
  return classDetails.find((cls) => cls.slug === slug);
}

export function getClassesByType(type: string): ClassDetail[] {
  return classDetails.filter(
    (cls) => cls.type.toLowerCase() === type.toLowerCase()
  );
}

export function getTypeColor(type: string) {
  switch (type.toLowerCase()) {
    case "yoga":
      return "bg-[#4B5B32]/20 text-[#4B5B32] border-[#4B5B32]/30";
    case "strength":
      return "bg-primary/20 text-primary border-primary/30";
    case "hiit":
      return "bg-orange-100 text-orange-700 border-orange-200";
    default:
      return "bg-secondary text-secondary-foreground border-secondary";
  }
}
