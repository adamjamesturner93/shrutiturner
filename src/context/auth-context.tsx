import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from "react";
import { classDetails, type ClassDetail } from "../data/schedule-data";

/* ──────────── Types ──────────── */

export interface CreditItem {
  id: string;
  type: "purchased" | "membership";
  /** Display label for this individual credit (used in booking confirmations) */
  label: string;
  /** Source group — credits from the same purchase share a sourceId */
  sourceId: string;
  /** Human-readable name for the source group (e.g. "10-class bundle") */
  sourceLabel: string;
  /** Expiry date ISO string — credits expire after a window from purchase */
  expiresAt?: string;
}

export interface CreditSummary {
  sourceId: string;
  sourceLabel: string;
  type: "purchased";
  remaining: number;
  /** Earliest expiry date among credits in this group */
  expiresAt?: string;
}

export interface Booking {
  id: string;
  classSlug: string;
  className: string;
  classType: string;
  day: string;
  time: string;
  duration: string;
  creditUsed: CreditItem;
  bookedAt: string;
}

/** A recording the user has started watching (counts as a class for capped memberships) */
export interface RecordingWatch {
  classSlug: string;
  className: string;
  watchedAt: string;
  /** Whether this watch consumed a weekly class allowance */
  consumedCredit: boolean;
}

/** A completed class with optional pre/post-class feedback */
export interface AttendanceRecord {
  id: string;
  classSlug: string;
  className: string;
  classType: string;
  date: string;
  time: string;
  /** Pre-class check-in (optional) */
  preClass?: {
    energyLevel: 1 | 2 | 3 | 4 | 5;
    flareToday: boolean;
    notes?: string;
  };
  /** Post-class feedback (optional) */
  postClass?: {
    feeling: "great" | "good" | "okay" | "tough" | "too-much";
    notes?: string;
  };
}

export interface Membership {
  plan: "steady" | "committed" | "unlimited" | "instructor" | null;
  label: string;
  renewalDate: string;
  classesPerWeek: number;
  classesUsedThisWeek: number;
  /** Monthly price in £ before any discounts */
  price: number;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarInitials: string;
  joinedDate: string;
  isOnboarded: boolean;
  dob: string | null;
  gender: string | null;
  ethnicity: string | null;
  timezone: string;
  dateFormat: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  membership: Membership | null;
  credits: CreditItem[];
  bookings: Booking[];
  /** Recordings the user has watched this week */
  recordingWatches: RecordingWatch[];
  /** Past class attendance history */
  attendanceHistory: AttendanceRecord[];
  referralCode: string;
  referralCount: number;
  /** Total £ earned through referrals (lifetime) */
  referralEarned: number;
  /** Current unspent referral balance in £ */
  referralBalance: number;
  /** Whether the current user has instructor/admin access */
  isAdmin: boolean;
  /** Whether the current user is a coaching client */
  isCoachingClient: boolean;
  /** Whether the user is enrolled in any small group programme */
  enrolledProgramIds: string[];
}

interface AuthContextValue extends AuthState {
  login: (email: string) => void;
  logout: () => void;
  bookClass: (classSlug: string) => { success: boolean; message: string; creditUsed?: CreditItem };
  cancelBooking: (bookingId: string) => void;
  canBook: () => { allowed: boolean; reason?: string };
  purchaseCredits: (count: number) => void;
  purchaseDropIn: () => void;
  upgradeMembership: (plan: "steady" | "committed" | "unlimited") => void;
  cancelMembership: () => void;
  completeOnboarding: () => void;
  isClassBooked: (classSlug: string) => boolean;
  getBookingForClass: (classSlug: string) => Booking | undefined;
  /** Total purchased class credits available */
  totalCredits: number;
  /** Grouped view of purchased credits by source for display */
  creditSummary: CreditSummary[];
  /** Earliest credit expiry date (if any credits have expiry) */
  creditExpiryDate: string | null;
  /** Number of credits expiring on the earliest date */
  creditsExpiringSoon: number;
  membershipClassesRemaining: number;
  /**
   * What the referral balance will be applied to.
   * Returns a description string for display.
   */
  referralAppliesTo: string;
  /** Spend from referral balance (e.g. at purchase/renewal time). Returns amount actually deducted. */
  spendReferralBalance: (amount: number) => number;
  /**
   * Check whether the user can watch a class recording.
   * Returns { allowed, reason, consumesCredit }.
   */
  canWatchRecording: (classSlug: string) => {
    allowed: boolean;
    reason?: string;
    consumesCredit: boolean;
  };
  /**
   * Mark a recording as watched. For capped memberships (steady/committed),
   * the first watch of a unique class consumes a weekly class credit.
   * Repeat watches of the same class are free.
   */
  watchRecording: (
    classSlug: string,
    className: string
  ) => {
    success: boolean;
    message: string;
    consumedCredit: boolean;
  };
  /** Check if a recording has already been watched (repeat is free) */
  hasWatchedRecording: (classSlug: string) => boolean;
  /** Submit pre-class check-in for a booking */
  submitPreClassCheckIn: (bookingId: string, data: AttendanceRecord["preClass"]) => void;
  /** Submit post-class feedback for an attendance record */
  submitPostClassFeedback: (attendanceId: string, data: AttendanceRecord["postClass"]) => void;
  /** Quick-book favourite classes — returns list of classDetail slugs the user frequently books */
  favouriteClasses: string[];
  /** Adaptive suggestion placeholder — returns a suggestion object */
  getAdaptiveSuggestion: () => {
    classSlug: string;
    className: string;
    day: string;
    time: string;
    reason: string;
  } | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/* ──────────── Pricing config ──────────── */

export const PLAN_PRICES: Record<string, number> = {
  steady: 49,
  committed: 65,
  unlimited: 79,
};

export const BUNDLE_PRICES: Record<number, number> = {
  1: 12,
  3: 30,
  10: 90,
};

/* ──────────── Mock data ──────────── */

const MOCK_USER: UserProfile = {
  id: "usr_001",
  firstName: "Sarah",
  lastName: "Chen",
  email: "sarah.chen@example.com",
  avatarInitials: "SC",
  joinedDate: "2025-11-15",
  isOnboarded: true,
  dob: "1985-05-15",
  gender: "Female",
  ethnicity: "Asian",
  timezone: "Europe/London",
  dateFormat: "DD/MM/YYYY",
};

/** Instructor / admin mock user */
const MOCK_ADMIN_USER: UserProfile = {
  id: "admin_001",
  firstName: "Shruti",
  lastName: "Turner",
  email: "shruti@shrutiturner.com",
  avatarInitials: "ST",
  joinedDate: "2024-01-01",
  isOnboarded: true,
  dob: "1978-03-22",
  gender: "Female",
  ethnicity: "White",
  timezone: "Europe/London",
  dateFormat: "DD/MM/YYYY",
};

/** Email addresses with instructor access (in production: role from Supabase) */
const ADMIN_EMAILS = ["shruti@shrutiturner.com"];

const MOCK_MEMBERSHIP: Membership = {
  plan: "committed",
  label: "Committed (3/week)",
  renewalDate: "2026-03-22",
  classesPerWeek: 3,
  classesUsedThisWeek: 1,
  price: 65,
};

/** Instructor mock membership — unlimited, no price */
const MOCK_INSTRUCTOR_MEMBERSHIP: Membership = {
  plan: "instructor",
  label: "Unlimited (instructor)",
  renewalDate: "",
  classesPerWeek: 99,
  classesUsedThisWeek: 0,
  price: 0,
};

const MOCK_CREDITS: CreditItem[] = [
  {
    id: "cred_p1",
    type: "purchased",
    label: "Class credit",
    sourceId: "purchase_10pack_jan",
    sourceLabel: "10-class bundle (Jan 2026)",
    expiresAt: "2026-03-12",
  },
  {
    id: "cred_p2",
    type: "purchased",
    label: "Class credit",
    sourceId: "purchase_10pack_jan",
    sourceLabel: "10-class bundle (Jan 2026)",
    expiresAt: "2026-03-12",
  },
];

const MOCK_BOOKINGS: Booking[] = [
  {
    id: "bk_001",
    classSlug: "adaptive-yoga-flow",
    className: "Adaptive Yoga Flow",
    classType: "Yoga",
    day: "Monday",
    time: "09:00",
    duration: "60 min",
    creditUsed: {
      id: "cred_m1",
      type: "membership",
      label: "Committed membership",
      sourceId: "membership",
      sourceLabel: "Committed membership",
    },
    bookedAt: "2026-02-18T10:30:00Z",
  },
  {
    id: "bk_002",
    classSlug: "strength-foundations",
    className: "Strength Foundations",
    classType: "Strength",
    day: "Monday",
    time: "18:30",
    duration: "45 min",
    creditUsed: {
      id: "cred_m2",
      type: "membership",
      label: "Committed membership",
      sourceId: "membership",
      sourceLabel: "Committed membership",
    },
    bookedAt: "2026-02-19T14:00:00Z",
  },
];

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  {
    id: "att_001",
    classSlug: "adaptive-yoga-flow",
    className: "Adaptive Yoga Flow",
    classType: "Yoga",
    date: "2026-02-24",
    time: "09:00",
    postClass: { feeling: "great", notes: "Felt really mobile today" },
  },
  {
    id: "att_002",
    classSlug: "strength-foundations",
    className: "Strength Foundations",
    classType: "Strength",
    date: "2026-02-24",
    time: "18:30",
    preClass: { energyLevel: 3, flareToday: false },
    postClass: { feeling: "good" },
  },
  {
    id: "att_003",
    classSlug: "restorative-yoga",
    className: "Restorative Yoga",
    classType: "Yoga",
    date: "2026-02-19",
    time: "09:00",
    postClass: { feeling: "great" },
  },
  {
    id: "att_004",
    classSlug: "adaptive-yoga-flow",
    className: "Adaptive Yoga Flow",
    classType: "Yoga",
    date: "2026-02-17",
    time: "09:00",
    preClass: { energyLevel: 2, flareToday: true, notes: "Wrists sore" },
    postClass: { feeling: "okay" },
  },
  {
    id: "att_005",
    classSlug: "hiit-complex-bodies",
    className: "HIIT for Complex Bodies",
    classType: "HIIT",
    date: "2026-02-19",
    time: "19:00",
    preClass: { energyLevel: 4, flareToday: false },
    postClass: { feeling: "great" },
  },
  {
    id: "att_006",
    classSlug: "strength-foundations",
    className: "Strength Foundations",
    classType: "Strength",
    date: "2026-02-17",
    time: "18:30",
  },
  {
    id: "att_007",
    classSlug: "chair-based-strength",
    className: "Chair-Based Strength",
    classType: "Strength",
    date: "2026-02-12",
    time: "10:00",
    postClass: { feeling: "good" },
  },
  {
    id: "att_008",
    classSlug: "adaptive-yoga-flow",
    className: "Adaptive Yoga Flow",
    classType: "Yoga",
    date: "2026-02-10",
    time: "09:00",
    postClass: { feeling: "good" },
  },
];

/* ──────────── Provider ──────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [credits, setCredits] = useState<CreditItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recordingWatches, setRecordingWatches] = useState<RecordingWatch[]>([]);
  const [referralCode] = useState("SARAH10");
  const [referralCount] = useState(3);
  const [referralEarned] = useState(30);
  // £10 unspent — e.g. earned £30 total, £20 applied to past renewals
  const [referralBalance, setReferralBalance] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCoachingClient, setIsCoachingClient] = useState(false);
  const [enrolledProgramIds, setEnrolledProgramIds] = useState<string[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);

  const totalCredits = credits.length;
  const membershipClassesRemaining = membership
    ? membership.classesPerWeek - membership.classesUsedThisWeek
    : 0;

  /** Credit expiry tracking */
  const creditExpiryInfo = useMemo(() => {
    const purchasedWithExpiry = credits.filter((c) => c.type === "purchased" && c.expiresAt);
    if (purchasedWithExpiry.length === 0) return { date: null, count: 0 };
    const sorted = [...purchasedWithExpiry].sort((a, b) => (a.expiresAt! > b.expiresAt! ? 1 : -1));
    const earliest = sorted[0].expiresAt!;
    const count = sorted.filter((c) => c.expiresAt === earliest).length;
    return { date: earliest, count };
  }, [credits]);
  const creditExpiryDate = creditExpiryInfo.date;
  const creditsExpiringSoon = creditExpiryInfo.count;

  /** Favourite classes — derived from attendance history + current bookings */
  const favouriteClasses = useMemo(() => {
    const slugCounts = new Map<string, number>();
    for (const a of attendanceHistory) {
      slugCounts.set(a.classSlug, (slugCounts.get(a.classSlug) || 0) + 1);
    }
    // Placeholder: also count current bookings
    for (const b of bookings) {
      slugCounts.set(b.classSlug, (slugCounts.get(b.classSlug) || 0) + 1);
    }
    return [...slugCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([slug]) => slug);
  }, [attendanceHistory, bookings]);

  /**
   * Adaptive suggestion — placeholder implementation.
   * Rules to be defined with PO. Currently suggests a recovery class
   * if the user has attended strength recently, or a strength class otherwise.
   */
  const getAdaptiveSuggestion = useCallback(() => {
    // Placeholder logic — replace with PO-defined rules
    const recentTypes = [...attendanceHistory.slice(-3), ...bookings].map((r) => r.classType);
    const hasRecentStrength = recentTypes.includes("Strength") || recentTypes.includes("HIIT");
    if (hasRecentStrength) {
      const yogaClass = classDetails.find(
        (c) => c.type === "Yoga" && c.slug === "restorative-yoga"
      );
      if (yogaClass) {
        return {
          classSlug: yogaClass.slug,
          className: yogaClass.name,
          day: yogaClass.day,
          time: yogaClass.time,
          reason:
            "Based on your recent strength sessions, a recovery class might feel good this week.",
        };
      }
    }
    const strengthClass = classDetails.find(
      (c) => c.type === "Strength" && c.slug === "strength-foundations"
    );
    if (strengthClass) {
      return {
        classSlug: strengthClass.slug,
        className: strengthClass.name,
        day: strengthClass.day,
        time: strengthClass.time,
        reason: "Building consistency with strength training helps build long-term capacity.",
      };
    }
    return null;
  }, [attendanceHistory, bookings]);

  const submitPreClassCheckIn = useCallback(
    (bookingId: string, data: AttendanceRecord["preClass"]) => {
      console.log("Pre-class check-in:", bookingId, data);
      // In production: POST to API. For now, store locally for the session.
    },
    []
  );

  const submitPostClassFeedback = useCallback(
    (attendanceId: string, data: AttendanceRecord["postClass"]) => {
      console.log("Post-class feedback:", attendanceId, data);
      setAttendanceHistory((prev) =>
        prev.map((a) => (a.id === attendanceId ? { ...a, postClass: data } : a))
      );
    },
    []
  );

  /** Group purchased credits by sourceId for clean display */
  const creditSummary = useMemo<CreditSummary[]>(() => {
    const map = new Map<string, CreditSummary>();
    for (const c of credits) {
      if (c.type === "membership") continue;
      const existing = map.get(c.sourceId);
      if (existing) {
        existing.remaining += 1;
        if (c.expiresAt && (!existing.expiresAt || c.expiresAt < existing.expiresAt)) {
          existing.expiresAt = c.expiresAt;
        }
      } else {
        map.set(c.sourceId, {
          sourceId: c.sourceId,
          sourceLabel: c.sourceLabel,
          type: "purchased",
          remaining: 1,
          expiresAt: c.expiresAt,
        });
      }
    }
    return Array.from(map.values());
  }, [credits]);

  /** Describe where the referral balance will be applied */
  const referralAppliesTo = useMemo<string>(() => {
    if (referralBalance <= 0) return "";
    if (membership) {
      const discountedPrice = Math.max(0, membership.price - referralBalance);
      return `£${referralBalance} off your next renewal (${membership.label} — £${discountedPrice} instead of £${membership.price})`;
    }
    return "£10 off your next class pack or membership purchase";
  }, [referralBalance, membership]);

  const login = useCallback((email: string) => {
    const isAdminLogin = ADMIN_EMAILS.includes(email.toLowerCase().trim());
    // Auto-detect timezone from browser
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London";
    setIsAuthenticated(true);
    setIsAdmin(isAdminLogin);

    if (isAdminLogin) {
      setUser(MOCK_ADMIN_USER);
      setMembership(MOCK_INSTRUCTOR_MEMBERSHIP);
      setCredits([]);
      setBookings([]);
      setReferralBalance(0);
      setEnrolledProgramIds([]);
      setRecordingWatches([]);
      setAttendanceHistory([]);
    } else {
      // Member login — use detected timezone as initial default
      // (In production, the server would return the user's saved timezone;
      // auto-detection only applies to brand-new accounts.)
      setUser({
        ...MOCK_USER,
        timezone: MOCK_USER.timezone || detectedTimezone,
      });
      setMembership(MOCK_MEMBERSHIP);
      setCredits([...MOCK_CREDITS]);
      setBookings([...MOCK_BOOKINGS]);
      setReferralBalance(10);
      // Mock: user is enrolled in one programme
      setEnrolledProgramIds(["shoulder-resilience"]);
      setRecordingWatches([]);
      setAttendanceHistory([...MOCK_ATTENDANCE]);
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setIsCoachingClient(false);
    setUser(null);
    setMembership(null);
    setCredits([]);
    setBookings([]);
    setReferralBalance(0);
    setEnrolledProgramIds([]);
    setRecordingWatches([]);
    setAttendanceHistory([]);
  }, []);

  /**
   * Credit priority for booking:
   *   1. Membership allowance (already paid for this week)
   *   2. Purchased credits (bundles / drop-ins)
   *
   * Referral balance is monetary — applied at payment time, not class booking.
   */
  const canBook = useCallback((): { allowed: boolean; reason?: string } => {
    if (membership && membershipClassesRemaining > 0) return { allowed: true };
    const hasPurchased = credits.some((c) => c.type === "purchased");
    if (hasPurchased) return { allowed: true };
    return { allowed: false, reason: "no_credits" };
  }, [credits, membership, membershipClassesRemaining]);

  const bookClass = useCallback(
    (classSlug: string): { success: boolean; message: string; creditUsed?: CreditItem } => {
      const cls = classDetails.find((c) => c.slug === classSlug);
      if (!cls) return { success: false, message: "Class not found." };
      if (bookings.some((b) => b.classSlug === classSlug))
        return { success: false, message: "Already booked." };

      // Credit priority: membership → purchased
      let creditUsed: CreditItem | undefined;

      if (membership && membershipClassesRemaining > 0) {
        creditUsed = {
          id: `cred_m_${Date.now()}`,
          type: "membership",
          label: membership.label,
          sourceId: "membership",
          sourceLabel: membership.label,
        };
        setMembership((prev) =>
          prev ? { ...prev, classesUsedThisWeek: prev.classesUsedThisWeek + 1 } : prev
        );
      } else {
        const purchasedIdx = credits.findIndex((c) => c.type === "purchased");
        if (purchasedIdx >= 0) {
          creditUsed = credits[purchasedIdx];
          setCredits((prev) => prev.filter((_, i) => i !== purchasedIdx));
        }
      }

      if (!creditUsed) return { success: false, message: "No credits available." };

      const newBooking: Booking = {
        id: `bk_${Date.now()}`,
        classSlug: cls.slug,
        className: cls.name,
        classType: cls.type,
        day: cls.day,
        time: cls.time,
        duration: cls.duration,
        creditUsed,
        bookedAt: new Date().toISOString(),
      };

      setBookings((prev) => [...prev, newBooking]);
      return { success: true, message: "You're booked.", creditUsed };
    },
    [credits, bookings, membership, membershipClassesRemaining]
  );

  const cancelBooking = useCallback((bookingId: string) => {
    setBookings((prev) => {
      const booking = prev.find((b) => b.id === bookingId);
      if (booking) {
        if (booking.creditUsed.type === "membership") {
          setMembership((m) =>
            m ? { ...m, classesUsedThisWeek: Math.max(0, m.classesUsedThisWeek - 1) } : m
          );
        } else {
          setCredits((c) => [...c, booking.creditUsed]);
        }
      }
      return prev.filter((b) => b.id !== bookingId);
    });
  }, []);

  /** Spend from referral balance. Returns amount actually deducted. */
  const spendReferralBalance = useCallback((amount: number): number => {
    let deducted = 0;
    setReferralBalance((prev) => {
      deducted = Math.min(prev, amount);
      return prev - deducted;
    });
    return deducted;
  }, []);

  const purchaseCredits = useCallback((count: number) => {
    const bundleLabel = count === 1 ? "Drop-in" : `${count}-class bundle`;
    const sourceId = `purchase_${count}pack_${Date.now()}`;

    // Expiry window: 3-pack = 4 weeks, 10-pack = 10 weeks, drop-in = 4 weeks
    const expiryWeeks = count >= 10 ? 10 : 4;
    const expiresAt = new Date(Date.now() + expiryWeeks * 7 * 86400000).toISOString().split("T")[0];

    const newCredits: CreditItem[] = Array.from({ length: count }, (_, i) => ({
      id: `cred_p_${Date.now()}_${i}`,
      type: "purchased" as const,
      label: "Class credit",
      sourceId,
      sourceLabel: bundleLabel,
      expiresAt,
    }));

    // Apply referral balance as discount (in a real app this would adjust the Stripe charge)
    setReferralBalance((prev) => {
      if (prev > 0) {
        const price = BUNDLE_PRICES[count] || count * 12;
        const discount = Math.min(prev, price);
        // In production: create Stripe checkout with discount
        console.log(`Applied £${discount} referral discount to ${bundleLabel} purchase`);
        return prev - discount;
      }
      return prev;
    });

    // When purchasing new credits, extend the expiry window for ALL existing credits
    // (countdown renews to the new purchase's expiry window)
    setCredits((prev) => {
      const renewed = prev.map((c) => ({
        ...c,
        expiresAt: c.type === "purchased" ? expiresAt : c.expiresAt,
      }));
      return [...renewed, ...newCredits];
    });
  }, []);

  const purchaseDropIn = useCallback(() => {
    const sourceId = `purchase_dropin_${Date.now()}`;
    setReferralBalance((prev) => {
      if (prev > 0) {
        const discount = Math.min(prev, 12);
        console.log(`Applied £${discount} referral discount to drop-in purchase`);
        return prev - discount;
      }
      return prev;
    });
    setCredits((prev) => [
      ...prev,
      {
        id: `cred_d_${Date.now()}`,
        type: "purchased",
        label: "Drop-in credit",
        sourceId,
        sourceLabel: "Drop-in",
      },
    ]);
  }, []);

  const upgradeMembership = useCallback((plan: "steady" | "committed" | "unlimited") => {
    const config = {
      steady: { label: "Steady (2/week)", classesPerWeek: 2, price: 49 },
      committed: { label: "Committed (3/week)", classesPerWeek: 3, price: 65 },
      unlimited: { label: "Unlimited", classesPerWeek: 99, price: 79 },
    };
    const planConfig = config[plan];
    // Apply referral balance as discount on first month
    setReferralBalance((prev) => {
      if (prev > 0) {
        const discount = Math.min(prev, planConfig.price);
        console.log(`Applied £${discount} referral discount to ${planConfig.label} membership`);
        return prev - discount;
      }
      return prev;
    });
    setMembership({
      plan,
      label: planConfig.label,
      renewalDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      classesPerWeek: planConfig.classesPerWeek,
      classesUsedThisWeek: 0,
      price: planConfig.price,
    });
  }, []);

  const cancelMembership = useCallback(() => {
    setMembership(null);
  }, []);

  const completeOnboarding = useCallback(() => {
    setUser((prev) => (prev ? { ...prev, isOnboarded: true } : prev));
  }, []);

  const isClassBooked = useCallback(
    (classSlug: string) => bookings.some((b) => b.classSlug === classSlug),
    [bookings]
  );

  const getBookingForClass = useCallback(
    (classSlug: string) => bookings.find((b) => b.classSlug === classSlug),
    [bookings]
  );

  /**
   * Check whether the user can watch a class recording.
   * Returns { allowed, reason, consumesCredit }.
   */
  const canWatchRecording = useCallback(
    (classSlug: string) => {
      // No membership — allow if they have purchased credits or are a programme participant
      if (!membership) return { allowed: true, consumesCredit: false };
      // Unlimited / instructor — always free
      if (membership.plan === "unlimited" || membership.plan === "instructor") {
        return { allowed: true, consumesCredit: false };
      }
      // Already watched this class this week — rewatch is free
      const hasWatched = recordingWatches.some((rw) => rw.classSlug === classSlug);
      if (hasWatched) return { allowed: true, consumesCredit: false };
      // Capped membership — check remaining weekly credits
      const remaining = membership.classesPerWeek - membership.classesUsedThisWeek;
      if (remaining <= 0) {
        return {
          allowed: false,
          reason:
            "You've used all your weekly classes. Purchase additional credits or wait until next week.",
          consumesCredit: false,
        };
      }
      return { allowed: true, consumesCredit: true };
    },
    [membership, recordingWatches]
  );

  /**
   * Mark a recording as watched. For capped memberships (steady/committed),
   * the first watch of a unique class consumes a weekly class credit.
   * Repeat watches of the same class are free.
   */
  const watchRecording = useCallback(
    (classSlug: string, className: string) => {
      const canWatch = canWatchRecording(classSlug);
      if (!canWatch.allowed)
        return { success: false, message: "Not allowed", consumedCredit: false };
      const newWatch: RecordingWatch = {
        classSlug,
        className,
        watchedAt: new Date().toISOString(),
        consumedCredit: canWatch.consumesCredit,
      };
      setRecordingWatches((prev) => [...prev, newWatch]);
      if (canWatch.consumesCredit) {
        setMembership((prev) =>
          prev ? { ...prev, classesUsedThisWeek: prev.classesUsedThisWeek + 1 } : prev
        );
      }
      return {
        success: true,
        message: "Recording watched",
        consumedCredit: canWatch.consumesCredit,
      };
    },
    [canWatchRecording]
  );

  /** Check if a recording has already been watched (repeat is free) */
  const hasWatchedRecording = useCallback(
    (classSlug: string) => recordingWatches.some((rw) => rw.classSlug === classSlug),
    [recordingWatches]
  );

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        membership,
        credits,
        bookings,
        recordingWatches,
        attendanceHistory,
        referralCode,
        referralCount,
        referralEarned,
        referralBalance,
        totalCredits,
        creditSummary,
        membershipClassesRemaining,
        creditExpiryDate,
        creditsExpiringSoon,
        referralAppliesTo,
        spendReferralBalance,
        login,
        logout,
        bookClass,
        cancelBooking,
        canBook,
        purchaseCredits,
        purchaseDropIn,
        upgradeMembership,
        cancelMembership,
        completeOnboarding,
        isClassBooked,
        getBookingForClass,
        isAdmin,
        isCoachingClient,
        enrolledProgramIds,
        canWatchRecording,
        watchRecording,
        hasWatchedRecording,
        favouriteClasses,
        getAdaptiveSuggestion,
        submitPreClassCheckIn,
        submitPostClassFeedback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
