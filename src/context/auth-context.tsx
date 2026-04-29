import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { signOut as nextAuthSignOut, useSession } from "next-auth/react";
import { isStaffAdminRole } from "@/lib/authz/roles";
import type {
  HealthDeclarationStatusDto,
  MembershipStateDto,
  OnboardingStateDto,
} from "@/lib/api/types";
import {
  CURRENT_HEALTH_DATA_CONSENT_VERSION,
  CURRENT_HEALTH_WAIVER_VERSION,
  CURRENT_TERMS_VERSION,
} from "@/data/legal-documents";
import { getApiErrorMessage, isApiSuccess } from "@/lib/api/client";

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
  plan: "movewell" | "instructor" | null;
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
  hasHealthProfile: boolean;
  healthDeclarationStatus: HealthDeclarationStatusDto;
  healthDeclarationLastConfirmedAt: string;
  healthDeclarationNeedsReview: boolean;
  tracksFlareCheckIns: boolean;
  dob: string | null;
  gender: string | null;
  ethnicity: string | null;
  timezone: string;
  dateFormat: string;
  hasAgreedToTerms: boolean;
  hasAgreedToHealth: boolean;
  termsAgreedAt: string | null;
  healthAgreedAt: string | null;
  acceptedTermsVersion: string | null;
  acceptedHealthWaiverVersion: string | null;
  currentTermsVersion: string;
  currentHealthWaiverVersion: string;
  needsTermsReacceptance: boolean;
  needsHealthWaiverReacceptance: boolean;
  hasConsentedToHealthData: boolean;
  healthDataConsentedAt: string | null;
  acceptedHealthDataConsentVersion: string | null;
  currentHealthDataConsentVersion: string;
  needsHealthDataConsentRefresh: boolean;
  heardAboutSource: string | null;
  heardAboutDetail: string | null;
  onboarding: OnboardingStateDto;
}

export interface AuthState {
  authStatus: "loading" | "authenticated" | "unauthenticated";
  isProfileLoading: boolean;
  isSigningOut: boolean;
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
  logout: () => Promise<void>;
  bookClass: (classSlug: string) => { success: boolean; message: string; creditUsed?: CreditItem };
  cancelBooking: (bookingId: string) => void;
  canBook: () => { allowed: boolean; reason?: string };
  purchaseCredits: (count: number) => void;
  purchaseDropIn: () => void;
  upgradeMembership: (plan: "movewell") => void;
  cancelMembership: () => void;
  completeOnboarding: () => Promise<void>;
  acceptTermsAndHealth: (terms: boolean, health: boolean) => Promise<void>;
  acceptHealthDataConsent: () => Promise<void>;
  saveOnboardingSource: (source: string, detail?: string) => Promise<void>;
  refreshAccountProfile: () => Promise<AccountAndReferralResponse | null>;
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
   * Mark a recording as watched. For capped memberships,
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
  /** Reload membership/credits/referral snapshot from backend. */
  refreshMembershipState: () => Promise<void>;
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

type AccountAndReferralResponse = {
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
    isCoachingClient?: boolean;
    hasHealthProfile?: boolean;
    healthDeclarationStatus?: HealthDeclarationStatusDto;
    healthDeclarationLastConfirmedAt?: string;
    healthDeclarationNeedsReview?: boolean;
    tracksFlareCheckIns?: boolean;
    dob?: string | null;
    gender?: string | null;
    ethnicity?: string | null;
    timezone?: string;
    dateFormat?: string;
    isOnboarded?: boolean;
    hasAgreedToTerms?: boolean;
    hasAgreedToHealth?: boolean;
    termsAgreedAt?: string | null;
    healthAgreedAt?: string | null;
    acceptedTermsVersion?: string | null;
    acceptedHealthWaiverVersion?: string | null;
    currentTermsVersion?: string;
    currentHealthWaiverVersion?: string;
    needsTermsReacceptance?: boolean;
    needsHealthWaiverReacceptance?: boolean;
    hasConsentedToHealthData?: boolean;
    healthDataConsentedAt?: string | null;
    acceptedHealthDataConsentVersion?: string | null;
    currentHealthDataConsentVersion?: string;
    needsHealthDataConsentRefresh?: boolean;
    heardAboutSource?: string | null;
    heardAboutDetail?: string | null;
    onboarding?: OnboardingStateDto;
  };
  referral?: {
    referralCode?: string;
    referralCount?: number;
    referralEarnedPence?: number;
    referralBalancePence?: number;
  };
};

/* ──────────── Pricing config ──────────── */

export const PLAN_PRICES: Record<string, number> = {
  movewell: 29,
  annual: 290,
};

export const BUNDLE_PRICES: Record<number, number> = {
  1: 9,
  3: 24,
  10: 70,
};

/* ──────────── Defaults ──────────── */

/** Instructor / admin mock user */
const MOCK_ADMIN_USER: UserProfile = {
  id: "admin_001",
  firstName: "Shruti",
  lastName: "Turner",
  email: "shruti@shrutiturner.com",
  avatarInitials: "ST",
  joinedDate: "2024-01-01",
  isOnboarded: true,
  hasHealthProfile: true,
  healthDeclarationStatus: "context_declared",
  healthDeclarationLastConfirmedAt: "",
  healthDeclarationNeedsReview: false,
  tracksFlareCheckIns: false,
  dob: "1978-03-22",
  gender: "Female",
  ethnicity: "White",
  timezone: "Europe/London",
  dateFormat: "DD/MM/YYYY",
  hasAgreedToTerms: true,
  hasAgreedToHealth: true,
  termsAgreedAt: null,
  healthAgreedAt: null,
  acceptedTermsVersion: CURRENT_TERMS_VERSION,
  acceptedHealthWaiverVersion: CURRENT_HEALTH_WAIVER_VERSION,
  currentTermsVersion: CURRENT_TERMS_VERSION,
  currentHealthWaiverVersion: CURRENT_HEALTH_WAIVER_VERSION,
  needsTermsReacceptance: false,
  needsHealthWaiverReacceptance: false,
  hasConsentedToHealthData: true,
  healthDataConsentedAt: null,
  acceptedHealthDataConsentVersion: CURRENT_HEALTH_DATA_CONSENT_VERSION,
  currentHealthDataConsentVersion: CURRENT_HEALTH_DATA_CONSENT_VERSION,
  needsHealthDataConsentRefresh: false,
  heardAboutSource: null,
  heardAboutDetail: null,
  onboarding: {
    isComplete: true,
    checklistComplete: true,
    nextStep: "complete",
    missingSteps: [],
  },
};

/** Instructor mock membership */
const MOCK_INSTRUCTOR_MEMBERSHIP: Membership = {
  plan: "instructor",
  label: "Unlimited (instructor)",
  renewalDate: "",
  classesPerWeek: 99,
  classesUsedThisWeek: 0,
  price: 0,
};

function buildAvatarInitials(firstName: string, lastName: string, fallback?: string) {
  const fromNames = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
  if (fromNames) return fromNames;
  return (fallback || "?").slice(0, 2).toUpperCase();
}

function splitName(name: string | null | undefined) {
  const trimmed = (name || "").trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const [firstName, ...rest] = trimmed.split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
}

/* ──────────── Provider ──────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status: authStatus } = useSession();
  const isAuthenticated = authStatus === "authenticated" && Boolean(session?.user);
  const isAdmin = isStaffAdminRole(session?.user?.role);
  const sessionUserId = session?.user?.id || "";
  const sessionUserEmail = session?.user?.email || "";
  const sessionUserName = session?.user?.name || "";
  const hydratedUserIdRef = useRef<string>("");
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [credits, setCredits] = useState<CreditItem[]>([]);
  const [creditBalance, setCreditBalance] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recordingWatches, setRecordingWatches] = useState<RecordingWatch[]>([]);
  const [referralCode, setReferralCode] = useState("SARAH10");
  const [referralCount, setReferralCount] = useState(0);
  const [referralEarned, setReferralEarned] = useState(0);
  // £10 unspent — e.g. earned £30 total, £20 applied to past renewals
  const [referralBalance, setReferralBalance] = useState(0);
  const [isCoachingClient, setIsCoachingClient] = useState(false);
  const [enrolledProgramIds, setEnrolledProgramIds] = useState<string[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);

  const applyMembershipState = useCallback((state: MembershipStateDto) => {
    if (state.membership?.accessActive) {
      setMembership({
        plan: state.membership.plan,
        label: state.membership.label,
        renewalDate: state.membership.renewalDate || "",
        classesPerWeek: state.membership.classesPerWeek,
        classesUsedThisWeek: state.membership.classesUsedThisWeek,
        price: Math.floor(state.membership.pricePence / 100),
      });
    } else {
      setMembership(null);
    }

    const nextCredits: CreditItem[] = state.credits.summary.flatMap((group) =>
      Array.from({ length: Math.max(0, group.remaining) }).map((_, i) => ({
        id: `${group.sourceId}_${i}`,
        type: "purchased" as const,
        label: "Class credit",
        sourceId: group.sourceId,
        sourceLabel: group.sourceLabel,
        expiresAt: group.expiresAt || undefined,
      }))
    );
    setCredits(nextCredits);
    setCreditBalance(state.credits.balance || 0);
    setReferralBalance(Math.floor((state.referral.balancePence || 0) / 100));
  }, []);

  const loadMembershipState = useCallback(async () => {
    try {
      const response = await fetch("/api/me/membership", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as unknown;
      const data = isApiSuccess<MembershipStateDto>(payload)
        ? payload.data
        : (payload as MembershipStateDto);
      applyMembershipState(data);
    } catch {
      // Leave fallback local state in place.
    }
  }, [applyMembershipState]);

  const totalCredits = creditBalance;
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
  const getAdaptiveSuggestion = useCallback(() => null, []);

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

  const resetLocalState = useCallback(() => {
    setIsProfileLoading(false);
    setIsCoachingClient(false);
    setUser(null);
    setMembership(null);
    setCredits([]);
    setCreditBalance(0);
    setBookings([]);
    setReferralCode("SARAH10");
    setReferralCount(0);
    setReferralEarned(0);
    setReferralBalance(0);
    setEnrolledProgramIds([]);
    setRecordingWatches([]);
    setAttendanceHistory([]);
  }, []);

  const refreshAccountProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (!res.ok) return null;
      const payload = (await res.json().catch(() => null)) as unknown;
      if (!isApiSuccess<AccountAndReferralResponse>(payload)) return null;
      const data = payload.data;

      setUser((prev) =>
        prev
          ? {
              ...prev,
              firstName: data.profile?.firstName || prev.firstName,
              lastName: data.profile?.lastName || prev.lastName,
              dob: data.profile?.dob || null,
              gender: data.profile?.gender || null,
              ethnicity: data.profile?.ethnicity || null,
              timezone: data.profile?.timezone || prev.timezone,
              dateFormat: data.profile?.dateFormat || prev.dateFormat,
              isOnboarded: data.profile?.isOnboarded ?? prev.isOnboarded,
              hasHealthProfile: data.profile?.hasHealthProfile ?? prev.hasHealthProfile,
              healthDeclarationStatus:
                data.profile?.healthDeclarationStatus ?? prev.healthDeclarationStatus,
              healthDeclarationLastConfirmedAt:
                data.profile?.healthDeclarationLastConfirmedAt ??
                prev.healthDeclarationLastConfirmedAt,
              healthDeclarationNeedsReview:
                data.profile?.healthDeclarationNeedsReview ?? prev.healthDeclarationNeedsReview,
              tracksFlareCheckIns: data.profile?.tracksFlareCheckIns ?? prev.tracksFlareCheckIns,
              hasAgreedToTerms: data.profile?.hasAgreedToTerms ?? prev.hasAgreedToTerms,
              hasAgreedToHealth: data.profile?.hasAgreedToHealth ?? prev.hasAgreedToHealth,
              termsAgreedAt: data.profile?.termsAgreedAt ?? prev.termsAgreedAt,
              healthAgreedAt: data.profile?.healthAgreedAt ?? prev.healthAgreedAt,
              acceptedTermsVersion: data.profile?.acceptedTermsVersion ?? prev.acceptedTermsVersion,
              acceptedHealthWaiverVersion:
                data.profile?.acceptedHealthWaiverVersion ?? prev.acceptedHealthWaiverVersion,
              currentTermsVersion: data.profile?.currentTermsVersion ?? prev.currentTermsVersion,
              currentHealthWaiverVersion:
                data.profile?.currentHealthWaiverVersion ?? prev.currentHealthWaiverVersion,
              needsTermsReacceptance:
                data.profile?.needsTermsReacceptance ?? prev.needsTermsReacceptance,
              needsHealthWaiverReacceptance:
                data.profile?.needsHealthWaiverReacceptance ?? prev.needsHealthWaiverReacceptance,
              hasConsentedToHealthData:
                data.profile?.hasConsentedToHealthData ?? prev.hasConsentedToHealthData,
              healthDataConsentedAt:
                data.profile?.healthDataConsentedAt ?? prev.healthDataConsentedAt,
              acceptedHealthDataConsentVersion:
                data.profile?.acceptedHealthDataConsentVersion ??
                prev.acceptedHealthDataConsentVersion,
              currentHealthDataConsentVersion:
                data.profile?.currentHealthDataConsentVersion ??
                prev.currentHealthDataConsentVersion,
              needsHealthDataConsentRefresh:
                data.profile?.needsHealthDataConsentRefresh ?? prev.needsHealthDataConsentRefresh,
              heardAboutSource: data.profile?.heardAboutSource ?? prev.heardAboutSource,
              heardAboutDetail: data.profile?.heardAboutDetail ?? prev.heardAboutDetail,
              onboarding: data.profile?.onboarding ?? prev.onboarding,
            }
          : prev
      );
      setIsCoachingClient(data.profile?.isCoachingClient === true);
      setReferralCode(data.referral?.referralCode || "");
      setReferralCount(data.referral?.referralCount || 0);
      setReferralEarned(Math.floor((data.referral?.referralEarnedPence || 0) / 100));
      setReferralBalance(Math.floor((data.referral?.referralBalancePence || 0) / 100));
      return data;
    } catch {
      // Keep existing state when refresh fails.
      return null;
    }
  }, []);

  useEffect(() => {
    if (authStatus === "loading") return;
    if (!isAuthenticated || !sessionUserId) {
      hydratedUserIdRef.current = "";
      resetLocalState();
      return;
    }

    const email = sessionUserEmail.toLowerCase();
    const fullName = sessionUserName;
    const { firstName, lastName } = splitName(fullName);
    const initials = buildAvatarInitials(firstName, lastName, sessionUserEmail || undefined);
    const userSwitched = hydratedUserIdRef.current !== sessionUserId;

    if (isAdmin) {
      setIsProfileLoading(false);
      hydratedUserIdRef.current = sessionUserId;
      setUser({
        ...MOCK_ADMIN_USER,
        id: sessionUserId,
        email,
        firstName: firstName || MOCK_ADMIN_USER.firstName,
        lastName: lastName || MOCK_ADMIN_USER.lastName,
        avatarInitials: initials,
      });
      setMembership(MOCK_INSTRUCTOR_MEMBERSHIP);
      setCredits([]);
      setCreditBalance(0);
      setBookings([]);
      setReferralCode("INSTRUCTOR");
      setReferralCount(0);
      setReferralEarned(0);
      setReferralBalance(0);
      setEnrolledProgramIds([]);
      setRecordingWatches([]);
      setAttendanceHistory([]);
      return;
    }

    if (userSwitched) {
      setIsProfileLoading(true);
      setUser({
        id: sessionUserId,
        firstName: firstName || "Member",
        lastName: lastName || "",
        email,
        avatarInitials: initials,
        joinedDate: "",
        isOnboarded: false,
        hasHealthProfile: false,
        healthDeclarationStatus: "incomplete",
        healthDeclarationLastConfirmedAt: "",
        healthDeclarationNeedsReview: false,
        tracksFlareCheckIns: false,
        dob: null,
        gender: null,
        ethnicity: null,
        timezone: "Europe/London",
        dateFormat: "DD/MM/YYYY",
        hasAgreedToTerms: false,
        hasAgreedToHealth: false,
        termsAgreedAt: null,
        healthAgreedAt: null,
        acceptedTermsVersion: null,
        acceptedHealthWaiverVersion: null,
        currentTermsVersion: CURRENT_TERMS_VERSION,
        currentHealthWaiverVersion: CURRENT_HEALTH_WAIVER_VERSION,
        needsTermsReacceptance: true,
        needsHealthWaiverReacceptance: true,
        hasConsentedToHealthData: false,
        healthDataConsentedAt: null,
        acceptedHealthDataConsentVersion: null,
        currentHealthDataConsentVersion: CURRENT_HEALTH_DATA_CONSENT_VERSION,
        needsHealthDataConsentRefresh: true,
        heardAboutSource: null,
        heardAboutDetail: null,
        onboarding: {
          isComplete: false,
          checklistComplete: false,
          nextStep: "profile",
          missingSteps: ["profile", "legal", "source", "health"],
        },
      });
      setMembership(null);
      setCredits([]);
      setCreditBalance(0);
      setBookings([]);
      setReferralCode("");
      setReferralCount(0);
      setReferralEarned(0);
      setReferralBalance(0);
      setEnrolledProgramIds([]);
      setRecordingWatches([]);
      setAttendanceHistory([]);
    } else {
      // Keep existing UI stable on non-user-switch refreshes.
      setIsProfileLoading(false);
    }

    if (userSwitched) {
      void Promise.allSettled([refreshAccountProfile(), loadMembershipState()]).finally(() => {
        hydratedUserIdRef.current = sessionUserId;
        setIsProfileLoading(false);
      });
    } else {
      void refreshAccountProfile();
      void loadMembershipState();
    }
  }, [
    authStatus,
    isAdmin,
    isAuthenticated,
    loadMembershipState,
    refreshAccountProfile,
    resetLocalState,
    sessionUserEmail,
    sessionUserId,
    sessionUserName,
  ]);

  const login = useCallback((email: string) => {
    void email;
    // Legacy no-op kept for compatibility while remaining views migrate to Auth.js APIs.
  }, []);

  const logout = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await nextAuthSignOut({ redirect: false });
      resetLocalState();
      if (typeof window !== "undefined") {
        window.location.replace("/");
      }
    } finally {
      setIsSigningOut(false);
    }
  }, [resetLocalState]);

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
      if (bookings.some((b) => b.classSlug === classSlug)) {
        return { success: false, message: "Already booked." };
      }
      return { success: false, message: "Session booking requires a specific class session." };
    },
    [bookings]
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

  const purchaseCredits = useCallback(
    async (count: number) => {
      try {
        const response = await fetch("/api/me/credits/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bundleSize: count }),
        });
        if (!response.ok) return;
        const payload = (await response.json().catch(() => null)) as unknown;
        const data = isApiSuccess<{ checkoutUrl?: string }>(payload)
          ? payload.data
          : (payload as { checkoutUrl?: string } | null);
        if (data?.checkoutUrl && typeof window !== "undefined") {
          window.location.href = data.checkoutUrl;
          return;
        }
        await loadMembershipState();
      } catch {
        // keep UI stable
      }
    },
    [loadMembershipState]
  );

  const purchaseDropIn = useCallback(() => {
    void purchaseCredits(1);
  }, [purchaseCredits]);

  const upgradeMembership = useCallback(async (plan: "movewell") => {
    if (typeof window !== "undefined") {
      window.location.href = `/dashboard/membership?subscribe=1&interval=monthly&plan=${plan}`;
    }
  }, []);

  const cancelMembership = useCallback(async () => {
    try {
      const response = await fetch("/api/me/membership/cancel", { method: "POST" });
      if (!response.ok) return;
      await loadMembershipState();
    } catch {
      // keep UI stable
    }
  }, [loadMembershipState]);

  const completeOnboarding = useCallback(async () => {
    setUser((prev) =>
      prev
        ? {
            ...prev,
            isOnboarded: true,
            onboarding: {
              isComplete: true,
              checklistComplete: true,
              nextStep: "complete",
              missingSteps: [],
            },
          }
        : prev
    );
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOnboarded: true }),
    }).catch(() => null);
  }, []);

  const acceptTermsAndHealth = useCallback(async (terms: boolean, health: boolean) => {
    const response = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hasAgreedToTerms: terms || undefined,
        hasAgreedToHealth: health || undefined,
      }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as unknown;
      throw new Error(getApiErrorMessage(payload, "Failed to update legal agreements."));
    }

    const payload = (await response.json().catch(() => null)) as unknown;
    const data = isApiSuccess<{
      profile?: {
        hasAgreedToTerms?: boolean;
        hasAgreedToHealth?: boolean;
        termsAgreedAt?: string | null;
        healthAgreedAt?: string | null;
        acceptedTermsVersion?: string | null;
        acceptedHealthWaiverVersion?: string | null;
        currentTermsVersion?: string;
        currentHealthWaiverVersion?: string;
        needsTermsReacceptance?: boolean;
        needsHealthWaiverReacceptance?: boolean;
        onboarding?: OnboardingStateDto;
      };
    }>(payload)
      ? payload.data
      : null;
    setUser((prev) =>
      prev
        ? {
            ...prev,
            hasAgreedToTerms: data?.profile?.hasAgreedToTerms ?? prev.hasAgreedToTerms,
            hasAgreedToHealth: data?.profile?.hasAgreedToHealth ?? prev.hasAgreedToHealth,
            termsAgreedAt: data?.profile?.termsAgreedAt ?? prev.termsAgreedAt,
            healthAgreedAt: data?.profile?.healthAgreedAt ?? prev.healthAgreedAt,
            acceptedTermsVersion: data?.profile?.acceptedTermsVersion ?? prev.acceptedTermsVersion,
            acceptedHealthWaiverVersion:
              data?.profile?.acceptedHealthWaiverVersion ?? prev.acceptedHealthWaiverVersion,
            currentTermsVersion: data?.profile?.currentTermsVersion ?? prev.currentTermsVersion,
            currentHealthWaiverVersion:
              data?.profile?.currentHealthWaiverVersion ?? prev.currentHealthWaiverVersion,
            needsTermsReacceptance:
              data?.profile?.needsTermsReacceptance ?? prev.needsTermsReacceptance,
            needsHealthWaiverReacceptance:
              data?.profile?.needsHealthWaiverReacceptance ?? prev.needsHealthWaiverReacceptance,
            onboarding: data?.profile?.onboarding ?? prev.onboarding,
          }
        : prev
    );
  }, []);

  const acceptHealthDataConsent = useCallback(async () => {
    const response = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hasConsentedToHealthData: true,
      }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as unknown;
      throw new Error(getApiErrorMessage(payload, "Failed to update health data consent."));
    }

    const payload = (await response.json().catch(() => null)) as unknown;
    const data = isApiSuccess<{
      profile?: {
        hasConsentedToHealthData?: boolean;
        healthDataConsentedAt?: string | null;
        acceptedHealthDataConsentVersion?: string | null;
        currentHealthDataConsentVersion?: string;
        needsHealthDataConsentRefresh?: boolean;
        onboarding?: OnboardingStateDto;
      };
    }>(payload)
      ? payload.data
      : null;

    setUser((prev) =>
      prev
        ? {
            ...prev,
            hasConsentedToHealthData:
              data?.profile?.hasConsentedToHealthData ?? prev.hasConsentedToHealthData,
            healthDataConsentedAt:
              data?.profile?.healthDataConsentedAt ?? prev.healthDataConsentedAt,
            acceptedHealthDataConsentVersion:
              data?.profile?.acceptedHealthDataConsentVersion ??
              prev.acceptedHealthDataConsentVersion,
            currentHealthDataConsentVersion:
              data?.profile?.currentHealthDataConsentVersion ??
              prev.currentHealthDataConsentVersion,
            needsHealthDataConsentRefresh:
              data?.profile?.needsHealthDataConsentRefresh ?? prev.needsHealthDataConsentRefresh,
            onboarding: data?.profile?.onboarding ?? prev.onboarding,
          }
        : prev
    );
  }, []);

  const saveOnboardingSource = useCallback(async (source: string, detail = "") => {
    const response = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        heardAboutSource: source,
        heardAboutDetail: detail || null,
      }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as unknown;
      throw new Error(getApiErrorMessage(payload, "Failed to save onboarding source."));
    }

    const payload = (await response.json().catch(() => null)) as unknown;
    const data = isApiSuccess<{
      profile?: {
        heardAboutSource?: string | null;
        heardAboutDetail?: string | null;
        onboarding?: OnboardingStateDto;
      };
    }>(payload)
      ? payload.data
      : null;

    setUser((prev) =>
      prev
        ? {
            ...prev,
            heardAboutSource: data?.profile?.heardAboutSource ?? source,
            heardAboutDetail: data?.profile?.heardAboutDetail ?? detail ?? null,
            onboarding: data?.profile?.onboarding ?? prev.onboarding,
          }
        : prev
    );
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
      if (membership.plan === "movewell" || membership.plan === "instructor") {
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
   * Mark a recording as watched. For capped memberships,
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
        authStatus,
        isProfileLoading,
        isSigningOut,
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
        acceptTermsAndHealth,
        acceptHealthDataConsent,
        saveOnboardingSource,
        refreshAccountProfile,
        isClassBooked,
        getBookingForClass,
        isAdmin,
        isCoachingClient,
        enrolledProgramIds,
        canWatchRecording,
        watchRecording,
        hasWatchedRecording,
        refreshMembershipState: loadMembershipState,
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
