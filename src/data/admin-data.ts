/* ──────────── Admin mock data ──────────── */

// ── Members ──

export interface AdminMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarInitials: string;
  joinedDate: string;
  membershipPlan: "movewell" | "instructor" | null;
  membershipLabel: string;
  status: "active" | "paused" | "cancelled" | "expired";
  creditBalance: number;
  referralCode: string;
  referralsCount: number;
  referralBalance: number;
  totalBookings: number;
  lastClassDate: string;
  notes: string;
  tags: string[];
  newsletterSubscribed: boolean;
  blogSubscribed: boolean;
  /** Whether this user has instructor access */
  isInstructor: boolean;
  /** Whether this user is a 1:1 coaching client */
  isCoachingClient: boolean;
}

export const adminMembers: AdminMember[] = [
  {
    id: "usr_001",
    firstName: "Sarah",
    lastName: "Chen",
    email: "sarah.chen@example.com",
    avatarInitials: "SC",
    joinedDate: "2025-11-15",
    membershipPlan: "movewell",
    membershipLabel: "Move Well Membership",
    status: "active",
    creditBalance: 2,
    referralCode: "SARAH10",
    referralsCount: 3,
    referralBalance: 10,
    totalBookings: 47,
    lastClassDate: "2026-02-20",
    notes:
      "Managing RA. Prefers morning classes. Has progressed well from Foundations to Progression.",
    tags: ["RA", "Regular", "Morning"],
    newsletterSubscribed: true,
    blogSubscribed: true,
    isInstructor: false,
    isCoachingClient: false,
  },
  {
    id: "usr_002",
    firstName: "James",
    lastName: "Whitfield",
    email: "james.w@example.com",
    avatarInitials: "JW",
    joinedDate: "2025-09-03",
    membershipPlan: "movewell",
    membershipLabel: "Move Well Membership",
    status: "active",
    creditBalance: 0,
    referralCode: "JAMES10",
    referralsCount: 1,
    referralBalance: 0,
    totalBookings: 82,
    lastClassDate: "2026-02-21",
    notes: "EDS (hEDS). Very consistent attendance. Helps welcome new members.",
    tags: ["EDS", "Regular", "Ambassador"],
    newsletterSubscribed: true,
    blogSubscribed: false,
    isInstructor: false,
    isCoachingClient: false,
  },
  {
    id: "usr_003",
    firstName: "Priya",
    lastName: "Patel",
    email: "priya.patel@example.com",
    avatarInitials: "PP",
    joinedDate: "2026-01-10",
    membershipPlan: "movewell",
    membershipLabel: "Move Well Membership",
    status: "active",
    creditBalance: 5,
    referralCode: "PRIYA10",
    referralsCount: 0,
    referralBalance: 0,
    totalBookings: 12,
    lastClassDate: "2026-02-19",
    notes: "New member via Sarah's referral. Fibromyalgia. Started with Chair-Based Strength.",
    tags: ["Fibromyalgia", "New", "Referred"],
    newsletterSubscribed: true,
    blogSubscribed: true,
    isInstructor: false,
    isCoachingClient: false,
  },
  {
    id: "usr_004",
    firstName: "David",
    lastName: "Okafor",
    email: "david.o@example.com",
    avatarInitials: "DO",
    joinedDate: "2025-06-20",
    membershipPlan: null,
    membershipLabel: "Pay as you Go",
    status: "expired",
    creditBalance: 1,
    referralCode: "DAVID10",
    referralsCount: 0,
    referralBalance: 0,
    totalBookings: 28,
    lastClassDate: "2026-01-05",
    notes: "Cancelled Steady plan in Jan. Still has 1 credit remaining. May return in spring.",
    tags: ["Chronic pain", "Lapsed"],
    newsletterSubscribed: true,
    blogSubscribed: true,
    isInstructor: false,
    isCoachingClient: false,
  },
  {
    id: "usr_005",
    firstName: "Emily",
    lastName: "Richards",
    email: "emily.r@example.com",
    avatarInitials: "ER",
    joinedDate: "2025-12-01",
    membershipPlan: "movewell",
    membershipLabel: "Move Well Membership",
    status: "active",
    creditBalance: 0,
    referralCode: "EMILY10",
    referralsCount: 2,
    referralBalance: 20,
    totalBookings: 34,
    lastClassDate: "2026-02-21",
    notes: "Lupus, well-managed. Loves HIIT for Complex Bodies. Interested in Portugal retreat.",
    tags: ["Lupus", "Regular", "Retreat interest"],
    newsletterSubscribed: true,
    blogSubscribed: true,
    isInstructor: false,
    isCoachingClient: true,
  },
  {
    id: "usr_006",
    firstName: "Tom",
    lastName: "Bennett",
    email: "tom.b@example.com",
    avatarInitials: "TB",
    joinedDate: "2026-02-01",
    membershipPlan: null,
    membershipLabel: "Pay as you Go",
    status: "active",
    creditBalance: 8,
    referralCode: "TOM10",
    referralsCount: 0,
    referralBalance: 0,
    totalBookings: 4,
    lastClassDate: "2026-02-18",
    notes: "Using 10-class bundle. Chronic fatigue. Mostly attends Chair-Based Strength.",
    tags: ["CFS/ME", "New", "Bundle"],
    newsletterSubscribed: false,
    blogSubscribed: true,
    isInstructor: false,
    isCoachingClient: false,
  },
  {
    id: "usr_007",
    firstName: "Aisha",
    lastName: "Mohammed",
    email: "aisha.m@example.com",
    avatarInitials: "AM",
    joinedDate: "2025-08-15",
    membershipPlan: "movewell",
    membershipLabel: "Move Well Membership",
    status: "paused",
    creditBalance: 0,
    referralCode: "AISHA10",
    referralsCount: 1,
    referralBalance: 10,
    totalBookings: 38,
    lastClassDate: "2026-01-30",
    notes: "Paused membership for surgery recovery. Expected return March 2026.",
    tags: ["Autoimmune", "Paused", "Surgery"],
    newsletterSubscribed: true,
    blogSubscribed: true,
    isInstructor: false,
    isCoachingClient: false,
  },
  {
    id: "usr_008",
    firstName: "Marcus",
    lastName: "Lee",
    email: "marcus.l@example.com",
    avatarInitials: "ML",
    joinedDate: "2025-10-22",
    membershipPlan: "movewell",
    membershipLabel: "Move Well Membership",
    status: "active",
    creditBalance: 3,
    referralCode: "MARCUS10",
    referralsCount: 4,
    referralBalance: 30,
    totalBookings: 56,
    lastClassDate: "2026-02-21",
    notes: "Psoriatic arthritis. Top referrer. Attends yoga + strength mix. Very engaged.",
    tags: ["PsA", "Regular", "Top referrer"],
    newsletterSubscribed: true,
    blogSubscribed: true,
    isInstructor: false,
    isCoachingClient: false,
  },
  {
    id: "usr_009",
    firstName: "Claire",
    lastName: "Wilson",
    email: "claire.w@example.com",
    avatarInitials: "CW",
    joinedDate: "2026-01-20",
    membershipPlan: null,
    membershipLabel: "Pay as you Go",
    status: "active",
    creditBalance: 2,
    referralCode: "CLAIRE10",
    referralsCount: 0,
    referralBalance: 0,
    totalBookings: 6,
    lastClassDate: "2026-02-17",
    notes: "Drop-in user. Chronic back pain. Trying different classes before committing to plan.",
    tags: ["Chronic pain", "New", "Exploring"],
    newsletterSubscribed: true,
    blogSubscribed: false,
    isInstructor: false,
    isCoachingClient: false,
  },
  {
    id: "usr_010",
    firstName: "Rachel",
    lastName: "Thompson",
    email: "rachel.t@example.com",
    avatarInitials: "RT",
    joinedDate: "2025-07-01",
    membershipPlan: "movewell",
    membershipLabel: "Move Well Membership",
    status: "active",
    creditBalance: 0,
    referralCode: "RACHEL10",
    referralsCount: 2,
    referralBalance: 0,
    totalBookings: 95,
    lastClassDate: "2026-02-22",
    notes: "EDS + POTS. Most consistent member. Attends 5-6 classes/week. Recovery advocate.",
    tags: ["EDS", "POTS", "Regular", "Ambassador"],
    newsletterSubscribed: true,
    blogSubscribed: true,
    isInstructor: false,
    isCoachingClient: false,
  },
];

// ── Class instances (upcoming schedule with live data) ──

export interface AdminClassInstance {
  id: string;
  classSlug: string;
  className: string;
  classType: "Yoga" | "Strength" | "HIIT";
  date: string;
  day: string;
  time: string;
  duration: string;
  maxSpaces: number;
  bookedCount: number;
  attendedCount: number;
  status: "scheduled" | "live" | "completed" | "cancelled";
  attendees: {
    memberId: string;
    memberName: string;
    status: "booked" | "attended" | "no-show" | "cancelled";
  }[];
  dailyRoomUrl?: string;
  notes?: string;
}

export const adminClassInstances: AdminClassInstance[] = [
  {
    id: "ci_001",
    classSlug: "adaptive-yoga-flow",
    className: "Adaptive Yoga Flow",
    classType: "Yoga",
    date: "2026-02-23",
    day: "Monday",
    time: "09:00",
    duration: "60 min",
    maxSpaces: 12,
    bookedCount: 9,
    attendedCount: 0,
    status: "scheduled",
    attendees: [
      { memberId: "usr_001", memberName: "Sarah Chen", status: "booked" },
      { memberId: "usr_002", memberName: "James Whitfield", status: "booked" },
      { memberId: "usr_005", memberName: "Emily Richards", status: "booked" },
      { memberId: "usr_008", memberName: "Marcus Lee", status: "booked" },
      { memberId: "usr_010", memberName: "Rachel Thompson", status: "booked" },
      { memberId: "usr_003", memberName: "Priya Patel", status: "booked" },
      { memberId: "usr_007", memberName: "Aisha Mohammed", status: "booked" },
      { memberId: "usr_009", memberName: "Claire Wilson", status: "booked" },
      { memberId: "usr_006", memberName: "Tom Bennett", status: "booked" },
    ],
  },
  {
    id: "ci_002",
    classSlug: "strength-foundations",
    className: "Strength Foundations",
    classType: "Strength",
    date: "2026-02-23",
    day: "Monday",
    time: "18:30",
    duration: "45 min",
    maxSpaces: 10,
    bookedCount: 7,
    attendedCount: 0,
    status: "scheduled",
    attendees: [
      { memberId: "usr_001", memberName: "Sarah Chen", status: "booked" },
      { memberId: "usr_003", memberName: "Priya Patel", status: "booked" },
      { memberId: "usr_005", memberName: "Emily Richards", status: "booked" },
      { memberId: "usr_008", memberName: "Marcus Lee", status: "booked" },
      { memberId: "usr_010", memberName: "Rachel Thompson", status: "booked" },
      { memberId: "usr_006", memberName: "Tom Bennett", status: "booked" },
      { memberId: "usr_009", memberName: "Claire Wilson", status: "booked" },
    ],
  },
  {
    id: "ci_003",
    classSlug: "chair-based-strength",
    className: "Chair-Based Strength",
    classType: "Strength",
    date: "2026-02-24",
    day: "Tuesday",
    time: "10:00",
    duration: "45 min",
    maxSpaces: 8,
    bookedCount: 5,
    attendedCount: 0,
    status: "scheduled",
    attendees: [
      { memberId: "usr_006", memberName: "Tom Bennett", status: "booked" },
      { memberId: "usr_003", memberName: "Priya Patel", status: "booked" },
      { memberId: "usr_010", memberName: "Rachel Thompson", status: "booked" },
      { memberId: "usr_009", memberName: "Claire Wilson", status: "booked" },
      { memberId: "usr_002", memberName: "James Whitfield", status: "booked" },
    ],
  },
  {
    id: "ci_004",
    classSlug: "restorative-yoga",
    className: "Restorative Yoga",
    classType: "Yoga",
    date: "2026-02-25",
    day: "Wednesday",
    time: "09:00",
    duration: "60 min",
    maxSpaces: 12,
    bookedCount: 8,
    attendedCount: 0,
    status: "scheduled",
    attendees: [
      { memberId: "usr_001", memberName: "Sarah Chen", status: "booked" },
      { memberId: "usr_002", memberName: "James Whitfield", status: "booked" },
      { memberId: "usr_005", memberName: "Emily Richards", status: "booked" },
      { memberId: "usr_008", memberName: "Marcus Lee", status: "booked" },
      { memberId: "usr_010", memberName: "Rachel Thompson", status: "booked" },
      { memberId: "usr_003", memberName: "Priya Patel", status: "booked" },
      { memberId: "usr_006", memberName: "Tom Bennett", status: "booked" },
      { memberId: "usr_009", memberName: "Claire Wilson", status: "booked" },
    ],
  },
  {
    id: "ci_005",
    classSlug: "hiit-complex-bodies",
    className: "HIIT for Complex Bodies",
    classType: "HIIT",
    date: "2026-02-25",
    day: "Wednesday",
    time: "19:00",
    duration: "45 min",
    maxSpaces: 10,
    bookedCount: 6,
    attendedCount: 0,
    status: "scheduled",
    attendees: [
      { memberId: "usr_005", memberName: "Emily Richards", status: "booked" },
      { memberId: "usr_008", memberName: "Marcus Lee", status: "booked" },
      { memberId: "usr_010", memberName: "Rachel Thompson", status: "booked" },
      { memberId: "usr_001", memberName: "Sarah Chen", status: "booked" },
      { memberId: "usr_002", memberName: "James Whitfield", status: "booked" },
      { memberId: "usr_003", memberName: "Priya Patel", status: "booked" },
    ],
  },
  // Past completed classes for stats
  {
    id: "ci_past_001",
    classSlug: "adaptive-yoga-flow",
    className: "Adaptive Yoga Flow",
    classType: "Yoga",
    date: "2026-02-16",
    day: "Monday",
    time: "09:00",
    duration: "60 min",
    maxSpaces: 12,
    bookedCount: 10,
    attendedCount: 9,
    status: "completed",
    attendees: [
      { memberId: "usr_001", memberName: "Sarah Chen", status: "attended" },
      { memberId: "usr_002", memberName: "James Whitfield", status: "attended" },
      { memberId: "usr_005", memberName: "Emily Richards", status: "attended" },
      { memberId: "usr_008", memberName: "Marcus Lee", status: "attended" },
      { memberId: "usr_010", memberName: "Rachel Thompson", status: "attended" },
      { memberId: "usr_003", memberName: "Priya Patel", status: "attended" },
      { memberId: "usr_006", memberName: "Tom Bennett", status: "no-show" },
      { memberId: "usr_009", memberName: "Claire Wilson", status: "attended" },
      { memberId: "usr_007", memberName: "Aisha Mohammed", status: "attended" },
      { memberId: "usr_004", memberName: "David Okafor", status: "attended" },
    ],
  },
  {
    id: "ci_past_002",
    classSlug: "strength-foundations",
    className: "Strength Foundations",
    classType: "Strength",
    date: "2026-02-16",
    day: "Monday",
    time: "18:30",
    duration: "45 min",
    maxSpaces: 10,
    bookedCount: 8,
    attendedCount: 7,
    status: "completed",
    attendees: [
      { memberId: "usr_001", memberName: "Sarah Chen", status: "attended" },
      { memberId: "usr_003", memberName: "Priya Patel", status: "attended" },
      { memberId: "usr_005", memberName: "Emily Richards", status: "attended" },
      { memberId: "usr_008", memberName: "Marcus Lee", status: "no-show" },
      { memberId: "usr_010", memberName: "Rachel Thompson", status: "attended" },
      { memberId: "usr_006", memberName: "Tom Bennett", status: "attended" },
      { memberId: "usr_002", memberName: "James Whitfield", status: "attended" },
      { memberId: "usr_009", memberName: "Claire Wilson", status: "attended" },
    ],
  },
];

// ── Programmes (small groups) ──

export interface AdminProgramme {
  id: string;
  name: string;
  description: string;
  duration: string;
  sessionsTotal: number;
  sessionsCompleted: number;
  maxParticipants: number;
  currentParticipants: number;
  status: "active" | "upcoming" | "completed" | "draft";
  startDate: string;
  endDate: string;
  schedule: string;
  price: number;
  participants: {
    memberId: string;
    memberName: string;
    sessionsAttended: number;
    progress: string;
  }[];
  sessions: {
    number: number;
    date: string;
    topic: string;
    status: "completed" | "upcoming" | "cancelled";
    attendanceCount: number;
  }[];
}

export const adminProgrammes: AdminProgramme[] = [
  {
    id: "prog_001",
    name: "Foundations to Confidence",
    description:
      "6-week small group programme for complete beginners. Build fundamental movement patterns, learn to scale training to your capacity, and gain confidence with strength training.",
    duration: "6 weeks",
    sessionsTotal: 12,
    sessionsCompleted: 8,
    maxParticipants: 6,
    currentParticipants: 5,
    status: "active",
    startDate: "2026-01-12",
    endDate: "2026-02-27",
    schedule: "Monday & Thursday, 11:00 - 11:45",
    price: 180,
    participants: [
      {
        memberId: "usr_003",
        memberName: "Priya Patel",
        sessionsAttended: 7,
        progress: "Strong progression. Moving well with lighter loads.",
      },
      {
        memberId: "usr_006",
        memberName: "Tom Bennett",
        sessionsAttended: 6,
        progress: "Good effort despite fatigue challenges. Needs more seated options.",
      },
      {
        memberId: "usr_009",
        memberName: "Claire Wilson",
        sessionsAttended: 8,
        progress: "Excellent attendance. Ready for regular classes after programme.",
      },
      {
        memberId: "prog_ext_01",
        memberName: "Fatima Al-Hassan",
        sessionsAttended: 7,
        progress: "Great technique improvement. Confident with hinge pattern now.",
      },
      {
        memberId: "prog_ext_02",
        memberName: "George Palmer",
        sessionsAttended: 5,
        progress: "Missed 3 sessions (flare). Catching up well. Consider extending.",
      },
    ],
    sessions: [
      {
        number: 1,
        date: "2026-01-12",
        topic: "Movement screening & squat foundations",
        status: "completed",
        attendanceCount: 5,
      },
      {
        number: 2,
        date: "2026-01-15",
        topic: "Hip hinge & deadlift basics",
        status: "completed",
        attendanceCount: 5,
      },
      {
        number: 3,
        date: "2026-01-19",
        topic: "Push patterns (wall/incline press)",
        status: "completed",
        attendanceCount: 4,
      },
      {
        number: 4,
        date: "2026-01-22",
        topic: "Pull patterns (rows & bands)",
        status: "completed",
        attendanceCount: 5,
      },
      {
        number: 5,
        date: "2026-01-26",
        topic: "Core stability foundations",
        status: "completed",
        attendanceCount: 4,
      },
      {
        number: 6,
        date: "2026-01-29",
        topic: "Combining movements + energy management",
        status: "completed",
        attendanceCount: 5,
      },
      {
        number: 7,
        date: "2026-02-02",
        topic: "Progressive overload principles",
        status: "completed",
        attendanceCount: 4,
      },
      {
        number: 8,
        date: "2026-02-05",
        topic: "Mid-programme assessment",
        status: "completed",
        attendanceCount: 5,
      },
      {
        number: 9,
        date: "2026-02-23",
        topic: "Advanced squat & hinge variations",
        status: "upcoming",
        attendanceCount: 0,
      },
      {
        number: 10,
        date: "2026-02-26",
        topic: "Compound movement combinations",
        status: "upcoming",
        attendanceCount: 0,
      },
      {
        number: 11,
        date: "2026-03-02",
        topic: "Building your own programme",
        status: "upcoming",
        attendanceCount: 0,
      },
      {
        number: 12,
        date: "2026-03-05",
        topic: "Final assessment & next steps",
        status: "upcoming",
        attendanceCount: 0,
      },
    ],
  },
  {
    id: "prog_002",
    name: "Hypermobility Strength Protocol",
    description:
      "8-week specialised programme for people with EDS/HSD. Focus on joint stability, proprioception, and building strength safely around hypermobile joints.",
    duration: "8 weeks",
    sessionsTotal: 16,
    sessionsCompleted: 0,
    maxParticipants: 4,
    currentParticipants: 3,
    status: "upcoming",
    startDate: "2026-03-09",
    endDate: "2026-05-01",
    schedule: "Tuesday & Friday, 14:00 - 14:45",
    price: 280,
    participants: [
      {
        memberId: "usr_002",
        memberName: "James Whitfield",
        sessionsAttended: 0,
        progress: "Enrolled. Previous experience with regular classes.",
      },
      {
        memberId: "usr_010",
        memberName: "Rachel Thompson",
        sessionsAttended: 0,
        progress: "Enrolled. Most experienced member. May help peer support.",
      },
      {
        memberId: "prog_ext_03",
        memberName: "Lily Chen",
        sessionsAttended: 0,
        progress: "Enrolled. New referral from physio. First group programme.",
      },
    ],
    sessions: [
      {
        number: 1,
        date: "2026-03-09",
        topic: "Assessment & joint stability baseline",
        status: "upcoming",
        attendanceCount: 0,
      },
      {
        number: 2,
        date: "2026-03-13",
        topic: "Proprioception foundations",
        status: "upcoming",
        attendanceCount: 0,
      },
      {
        number: 3,
        date: "2026-03-16",
        topic: "Shoulder stability protocol",
        status: "upcoming",
        attendanceCount: 0,
      },
      {
        number: 4,
        date: "2026-03-20",
        topic: "Hip & knee stability",
        status: "upcoming",
        attendanceCount: 0,
      },
      {
        number: 5,
        date: "2026-03-23",
        topic: "Spinal stability & core control",
        status: "upcoming",
        attendanceCount: 0,
      },
      {
        number: 6,
        date: "2026-03-27",
        topic: "Upper body strengthening",
        status: "upcoming",
        attendanceCount: 0,
      },
      {
        number: 7,
        date: "2026-03-30",
        topic: "Lower body strengthening",
        status: "upcoming",
        attendanceCount: 0,
      },
      {
        number: 8,
        date: "2026-04-03",
        topic: "Mid-programme assessment",
        status: "upcoming",
        attendanceCount: 0,
      },
      {
        number: 9,
        date: "2026-04-06",
        topic: "Functional movement integration",
        status: "upcoming",
        attendanceCount: 0,
      },
      {
        number: 10,
        date: "2026-04-10",
        topic: "Balance & coordination",
        status: "upcoming",
        attendanceCount: 0,
      },
      {
        number: 11,
        date: "2026-04-13",
        topic: "Progressive loading strategies",
        status: "upcoming",
        attendanceCount: 0,
      },
      {
        number: 12,
        date: "2026-04-17",
        topic: "Compound movements with control",
        status: "upcoming",
        attendanceCount: 0,
      },
      {
        number: 13,
        date: "2026-04-20",
        topic: "Flare management & deload",
        status: "upcoming",
        attendanceCount: 0,
      },
      {
        number: 14,
        date: "2026-04-24",
        topic: "Building long-term habits",
        status: "upcoming",
        attendanceCount: 0,
      },
      {
        number: 15,
        date: "2026-04-27",
        topic: "Final assessment",
        status: "upcoming",
        attendanceCount: 0,
      },
      {
        number: 16,
        date: "2026-05-01",
        topic: "Graduation & transition planning",
        status: "upcoming",
        attendanceCount: 0,
      },
    ],
  },
  {
    id: "prog_003",
    name: "Return to Movement",
    description:
      "4-week gentle reintroduction programme for people returning after surgery, extended flare, or long break from exercise.",
    duration: "4 weeks",
    sessionsTotal: 8,
    sessionsCompleted: 8,
    maxParticipants: 6,
    currentParticipants: 6,
    status: "completed",
    startDate: "2025-11-10",
    endDate: "2025-12-05",
    schedule: "Monday & Thursday, 14:00 - 14:45",
    price: 120,
    participants: [
      {
        memberId: "usr_003",
        memberName: "Priya Patel",
        sessionsAttended: 8,
        progress: "Completed. Transitioned to Steady membership.",
      },
      {
        memberId: "usr_007",
        memberName: "Aisha Mohammed",
        sessionsAttended: 7,
        progress: "Completed. Now attending regular classes.",
      },
      {
        memberId: "prog_ext_04",
        memberName: "Nina Walsh",
        sessionsAttended: 8,
        progress: "Completed. Enrolled in Foundations to Confidence.",
      },
      {
        memberId: "prog_ext_05",
        memberName: "Stuart Mills",
        sessionsAttended: 6,
        progress: "Completed. Decided to continue with drop-ins.",
      },
      {
        memberId: "prog_ext_06",
        memberName: "Hannah Price",
        sessionsAttended: 7,
        progress: "Completed. Signed up for Committed membership.",
      },
      {
        memberId: "prog_ext_07",
        memberName: "Ben Taylor",
        sessionsAttended: 4,
        progress: "Dropped out week 3 (flare). Offered free restart.",
      },
    ],
    sessions: [
      {
        number: 1,
        date: "2025-11-10",
        topic: "Gentle assessment & breath work",
        status: "completed",
        attendanceCount: 6,
      },
      {
        number: 2,
        date: "2025-11-13",
        topic: "Seated movement & mobility",
        status: "completed",
        attendanceCount: 6,
      },
      {
        number: 3,
        date: "2025-11-17",
        topic: "Standing with support",
        status: "completed",
        attendanceCount: 5,
      },
      {
        number: 4,
        date: "2025-11-20",
        topic: "Light resistance introduction",
        status: "completed",
        attendanceCount: 5,
      },
      {
        number: 5,
        date: "2025-11-24",
        topic: "Floor work & transitions",
        status: "completed",
        attendanceCount: 5,
      },
      {
        number: 6,
        date: "2025-11-27",
        topic: "Mini circuit introduction",
        status: "completed",
        attendanceCount: 6,
      },
      {
        number: 7,
        date: "2025-12-01",
        topic: "Energy management strategies",
        status: "completed",
        attendanceCount: 5,
      },
      {
        number: 8,
        date: "2025-12-05",
        topic: "Assessment & next steps planning",
        status: "completed",
        attendanceCount: 6,
      },
    ],
  },
];

// ── Retreats (admin view) ──

export interface AdminRetreat {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  totalSpaces: number;
  bookedSpaces: number;
  waitlistCount: number;
  status: "open" | "sold-out" | "completed" | "draft";
  earlyBirdPrice: number;
  normalPrice: number;
  revenue: number;
  bookings: {
    memberId: string;
    memberName: string;
    email: string;
    bookingDate: string;
    priceType: "early-bird" | "normal";
    pricePaid: number;
    status: "confirmed" | "waitlisted" | "cancelled" | "refunded";
    dietaryRequirements?: string;
    accessibilityNeeds?: string;
  }[];
}

export const adminRetreats: AdminRetreat[] = [
  {
    id: "retreat_001",
    title: "Algarve Adaptive Retreat",
    location: "Algarve, Portugal",
    startDate: "2026-05-15",
    endDate: "2026-05-19",
    totalSpaces: 12,
    bookedSpaces: 8,
    waitlistCount: 0,
    status: "open",
    earlyBirdPrice: 1200,
    normalPrice: 1450,
    revenue: 10200,
    bookings: [
      {
        memberId: "usr_001",
        memberName: "Sarah Chen",
        email: "sarah.chen@example.com",
        bookingDate: "2026-01-05",
        priceType: "early-bird",
        pricePaid: 1200,
        status: "confirmed",
        dietaryRequirements: "Vegetarian",
        accessibilityNeeds: "Ground floor room preferred",
      },
      {
        memberId: "usr_002",
        memberName: "James Whitfield",
        email: "james.w@example.com",
        bookingDate: "2026-01-08",
        priceType: "early-bird",
        pricePaid: 1200,
        status: "confirmed",
        accessibilityNeeds: "EDS-friendly mattress",
      },
      {
        memberId: "usr_005",
        memberName: "Emily Richards",
        email: "emily.r@example.com",
        bookingDate: "2026-01-12",
        priceType: "early-bird",
        pricePaid: 1200,
        status: "confirmed",
      },
      {
        memberId: "usr_008",
        memberName: "Marcus Lee",
        email: "marcus.l@example.com",
        bookingDate: "2026-01-15",
        priceType: "early-bird",
        pricePaid: 1200,
        status: "confirmed",
        dietaryRequirements: "Gluten-free",
      },
      {
        memberId: "usr_010",
        memberName: "Rachel Thompson",
        email: "rachel.t@example.com",
        bookingDate: "2026-01-20",
        priceType: "early-bird",
        pricePaid: 1200,
        status: "confirmed",
        accessibilityNeeds: "POTS: needs air-con, ground floor",
      },
      {
        memberId: "prog_ext_04",
        memberName: "Nina Walsh",
        email: "nina.w@example.com",
        bookingDate: "2026-02-01",
        priceType: "normal",
        pricePaid: 1450,
        status: "confirmed",
      },
      {
        memberId: "prog_ext_06",
        memberName: "Hannah Price",
        email: "hannah.p@example.com",
        bookingDate: "2026-02-05",
        priceType: "normal",
        pricePaid: 1450,
        status: "confirmed",
        dietaryRequirements: "Vegan",
      },
      {
        memberId: "prog_ext_08",
        memberName: "Oliver Grant",
        email: "oliver.g@example.com",
        bookingDate: "2026-02-10",
        priceType: "normal",
        pricePaid: 1450,
        status: "confirmed",
      },
    ],
  },
  {
    id: "retreat_002",
    title: "Cotswolds Weekend Retreat",
    location: "Cotswolds, England",
    startDate: "2026-09-18",
    endDate: "2026-09-20",
    totalSpaces: 8,
    bookedSpaces: 2,
    waitlistCount: 0,
    status: "open",
    earlyBirdPrice: 550,
    normalPrice: 650,
    revenue: 1100,
    bookings: [
      {
        memberId: "usr_001",
        memberName: "Sarah Chen",
        email: "sarah.chen@example.com",
        bookingDate: "2026-02-15",
        priceType: "early-bird",
        pricePaid: 550,
        status: "confirmed",
      },
      {
        memberId: "usr_005",
        memberName: "Emily Richards",
        email: "emily.r@example.com",
        bookingDate: "2026-02-18",
        priceType: "early-bird",
        pricePaid: 550,
        status: "confirmed",
      },
    ],
  },
  {
    id: "retreat_003",
    title: "Virtual Immersion Weekend",
    location: "Online (Live via Video)",
    startDate: "2026-06-13",
    endDate: "2026-06-14",
    totalSpaces: 20,
    bookedSpaces: 6,
    waitlistCount: 0,
    status: "open",
    earlyBirdPrice: 120,
    normalPrice: 150,
    revenue: 720,
    bookings: [
      {
        memberId: "usr_001",
        memberName: "Sarah Chen",
        email: "sarah.chen@example.com",
        bookingDate: "2026-03-01",
        priceType: "early-bird",
        pricePaid: 120,
        status: "confirmed",
      },
      {
        memberId: "usr_003",
        memberName: "Priya Patel",
        email: "priya.patel@example.com",
        bookingDate: "2026-03-05",
        priceType: "early-bird",
        pricePaid: 120,
        status: "confirmed",
        accessibilityNeeds: "May need to lie down during sessions — flare risk",
      },
      {
        memberId: "usr_006",
        memberName: "Tom Bennett",
        email: "tom.b@example.com",
        bookingDate: "2026-03-10",
        priceType: "early-bird",
        pricePaid: 120,
        status: "confirmed",
        accessibilityNeeds: "CFS/ME — will likely have camera off for rest periods",
      },
      {
        memberId: "usr_007",
        memberName: "Aisha Mohammed",
        email: "aisha.m@example.com",
        bookingDate: "2026-03-12",
        priceType: "early-bird",
        pricePaid: 120,
        status: "confirmed",
      },
      {
        memberId: "usr_009",
        memberName: "Claire Wilson",
        email: "claire.w@example.com",
        bookingDate: "2026-03-15",
        priceType: "early-bird",
        pricePaid: 120,
        status: "confirmed",
      },
      {
        memberId: "prog_ext_05",
        memberName: "Stuart Mills",
        email: "stuart.m@example.com",
        bookingDate: "2026-03-20",
        priceType: "early-bird",
        pricePaid: 120,
        status: "confirmed",
      },
    ],
  },
];

// ── Newsletter / Postmark analytics ──

export interface NewsletterCampaign {
  id: string;
  subject: string;
  type: "newsletter" | "blog-notification";
  sentDate: string;
  status: "sent" | "draft" | "scheduled";
  totalRecipients: number;
  delivered: number;
  opened: number;
  uniqueOpens: number;
  clicked: number;
  uniqueClicks: number;
  bounced: number;
  unsubscribed: number;
  spamComplaints: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
  topLinks: {
    url: string;
    label: string;
    clicks: number;
  }[];
}

export const newsletterCampaigns: NewsletterCampaign[] = [
  {
    id: "nl_001",
    subject: "Why your flare days still count as training",
    type: "newsletter",
    sentDate: "2026-02-18",
    status: "sent",
    totalRecipients: 342,
    delivered: 338,
    opened: 248,
    uniqueOpens: 215,
    clicked: 89,
    uniqueClicks: 72,
    bounced: 4,
    unsubscribed: 1,
    spamComplaints: 0,
    openRate: 63.6,
    clickRate: 21.3,
    clickToOpenRate: 33.5,
    topLinks: [
      { url: "/blog/flare-day-training", label: "Read full blog post", clicks: 45 },
      { url: "/schedule", label: "View this week's schedule", clicks: 28 },
      { url: "/pricing", label: "Pricing page", clicks: 16 },
    ],
  },
  {
    id: "nl_002",
    subject: "New: Hypermobility Strength Protocol starting March",
    type: "newsletter",
    sentDate: "2026-02-11",
    status: "sent",
    totalRecipients: 340,
    delivered: 336,
    opened: 262,
    uniqueOpens: 228,
    clicked: 104,
    uniqueClicks: 87,
    bounced: 4,
    unsubscribed: 0,
    spamComplaints: 0,
    openRate: 67.9,
    clickRate: 25.9,
    clickToOpenRate: 38.2,
    topLinks: [
      { url: "/dashboard/programmes", label: "Programme details", clicks: 58 },
      { url: "/blog/hypermobility-strength", label: "Blog post", clicks: 31 },
      { url: "/pricing", label: "Pricing", clicks: 15 },
    ],
  },
  {
    id: "nl_003",
    subject: "Algarve Retreat: Early bird closes soon",
    type: "newsletter",
    sentDate: "2026-01-28",
    status: "sent",
    totalRecipients: 335,
    delivered: 332,
    opened: 276,
    uniqueOpens: 241,
    clicked: 132,
    uniqueClicks: 108,
    bounced: 3,
    unsubscribed: 2,
    spamComplaints: 0,
    openRate: 72.6,
    clickRate: 32.5,
    clickToOpenRate: 44.8,
    topLinks: [
      { url: "/retreats/algarve-adaptive", label: "Retreat details", clicks: 89 },
      { url: "/retreats/algarve-adaptive/checkout", label: "Book now", clicks: 31 },
      { url: "/about", label: "About Shruti", clicks: 12 },
    ],
  },
  {
    id: "nl_004",
    subject: "New blog: Strength Training Matters When You Have Chronic Illness",
    type: "blog-notification",
    sentDate: "2026-01-21",
    status: "sent",
    totalRecipients: 289,
    delivered: 286,
    opened: 178,
    uniqueOpens: 156,
    clicked: 98,
    uniqueClicks: 82,
    bounced: 3,
    unsubscribed: 1,
    spamComplaints: 0,
    openRate: 54.5,
    clickRate: 28.7,
    clickToOpenRate: 52.6,
    topLinks: [
      { url: "/blog/strength-training-chronic-illness", label: "Read blog post", clicks: 82 },
      { url: "/schedule", label: "View schedule", clicks: 10 },
      { url: "/pricing", label: "Pricing", clicks: 6 },
    ],
  },
  {
    id: "nl_005",
    subject: "January reflection: What movement means when everything hurts",
    type: "newsletter",
    sentDate: "2026-01-14",
    status: "sent",
    totalRecipients: 330,
    delivered: 327,
    opened: 234,
    uniqueOpens: 201,
    clicked: 67,
    uniqueClicks: 54,
    bounced: 3,
    unsubscribed: 0,
    spamComplaints: 0,
    openRate: 61.5,
    clickRate: 16.5,
    clickToOpenRate: 26.9,
    topLinks: [
      { url: "/blog/movement-when-it-hurts", label: "Full article", clicks: 38 },
      { url: "/schedule", label: "This week's classes", clicks: 18 },
      { url: "/retreats", label: "Retreats", clicks: 11 },
    ],
  },
  {
    id: "nl_006",
    subject: "Welcome to 2026: Your movement doesn't need a resolution",
    type: "newsletter",
    sentDate: "2026-01-07",
    status: "sent",
    totalRecipients: 325,
    delivered: 322,
    opened: 245,
    uniqueOpens: 210,
    clicked: 78,
    uniqueClicks: 63,
    bounced: 3,
    unsubscribed: 1,
    spamComplaints: 0,
    openRate: 65.2,
    clickRate: 19.6,
    clickToOpenRate: 30.0,
    topLinks: [
      { url: "/schedule", label: "January schedule", clicks: 42 },
      { url: "/pricing", label: "New year pricing", clicks: 22 },
      { url: "/blog/no-resolution-needed", label: "Blog post", clicks: 14 },
    ],
  },
  {
    id: "nl_007",
    subject: "March newsletter: Spring schedule + Cotswolds retreat announced",
    type: "newsletter",
    sentDate: "2026-02-25",
    status: "scheduled",
    totalRecipients: 345,
    delivered: 0,
    opened: 0,
    uniqueOpens: 0,
    clicked: 0,
    uniqueClicks: 0,
    bounced: 0,
    unsubscribed: 0,
    spamComplaints: 0,
    openRate: 0,
    clickRate: 0,
    clickToOpenRate: 0,
    topLinks: [],
  },
];

// ── Aggregate newsletter stats ──

export interface NewsletterAggregateStats {
  totalSubscribers: number;
  newsletterSubscribers: number;
  blogSubscribers: number;
  bothSubscribers: number;
  avgOpenRate: number;
  avgClickRate: number;
  avgClickToOpenRate: number;
  totalCampaignsSent: number;
  subscriberGrowth: { month: string; count: number }[];
  unsubscribes30d: number;
  bounceRate: number;
}

export const newsletterAggregateStats: NewsletterAggregateStats = {
  totalSubscribers: 345,
  newsletterSubscribers: 312,
  blogSubscribers: 289,
  bothSubscribers: 268,
  avgOpenRate: 64.2,
  avgClickRate: 24.1,
  avgClickToOpenRate: 37.7,
  totalCampaignsSent: 24,
  subscriberGrowth: [
    { month: "Sep '25", count: 180 },
    { month: "Oct '25", count: 215 },
    { month: "Nov '25", count: 248 },
    { month: "Dec '25", count: 280 },
    { month: "Jan '26", count: 325 },
    { month: "Feb '26", count: 345 },
  ],
  unsubscribes30d: 3,
  bounceRate: 1.1,
};

// ── Dashboard overview stats ──

export interface AdminDashboardStats {
  activeMembers: number;
  totalMembers: number;
  monthlyRecurringRevenue: number;
  classesThisWeek: number;
  avgAttendanceRate: number;
  newMembersThisMonth: number;
  churnRate: number;
  totalRevenue30d: number;
  classAttendance: { week: string; attendance: number; capacity: number }[];
  membershipBreakdown: { plan: string; count: number }[];
  revenueBySource: { source: string; amount: number }[];
  topReferrers: { name: string; count: number; earned: number }[];
}

export const adminDashboardStats: AdminDashboardStats = {
  activeMembers: 8,
  totalMembers: 10,
  monthlyRecurringRevenue: 402,
  classesThisWeek: 9,
  avgAttendanceRate: 87.5,
  newMembersThisMonth: 2,
  churnRate: 5.0,
  totalRevenue30d: 2562,
  classAttendance: [
    { week: "Jan 27", attendance: 52, capacity: 77 },
    { week: "Feb 3", attendance: 58, capacity: 77 },
    { week: "Feb 10", attendance: 61, capacity: 77 },
    { week: "Feb 17", attendance: 55, capacity: 77 },
  ],
  membershipBreakdown: [
    { plan: "Move Well Membership", count: 2 },
    { plan: "Committed", count: 3 },
    { plan: "Steady", count: 2 },
    { plan: "Pay as you Go", count: 3 },
  ],
  revenueBySource: [
    { source: "Memberships", amount: 402 },
    { source: "Credit packs", amount: 240 },
    { source: "Retreats", amount: 1820 },
    { source: "Programmes", amount: 100 },
  ],
  topReferrers: [
    { name: "Marcus Lee", count: 4, earned: 40 },
    { name: "Sarah Chen", count: 3, earned: 30 },
    { name: "Emily Richards", count: 2, earned: 20 },
    { name: "Rachel Thompson", count: 2, earned: 20 },
  ],
};
