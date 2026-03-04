import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useAuth } from "../context/auth-context";
import { useI18n } from "../lib/use-i18n";
import Link from "next/link";
import { Play, Clock, AlertCircle, CheckCircle, Lock, Info, ShoppingCart } from "lucide-react";

/* ──────────── Types ──────────── */

export interface ClassRecording {
  classSlug: string;
  className: string;
  classType: string;
  recordedDate: string; // ISO date
  duration: string;
  /** Expiry date (7 days for regular classes, 30 days for programme recordings) */
  expiresAt: string;
  /** Whether this is a programme session recording */
  isProgrammeRecording?: boolean;
}

/* ──────────── Constants ──────────── */

/** Regular class recordings expire after 7 days */
const CLASS_RECORDING_RETENTION_DAYS = 7;
/** Programme session recordings have an extended retention window */
const PROGRAMME_RECORDING_RETENTION_DAYS = 30;

/* ──────────── Mock recordings (last 7 days) ──────────── */

function generateMockRecordings(): ClassRecording[] {
  const now = new Date();
  const recordings: ClassRecording[] = [];

  const classes = [
    {
      slug: "adaptive-yoga-flow",
      name: "Adaptive Yoga Flow",
      type: "Yoga",
      day: 1,
      time: "09:00",
      duration: "60 min",
    },
    {
      slug: "strength-foundations",
      name: "Strength Foundations",
      type: "Strength",
      day: 1,
      time: "18:30",
      duration: "45 min",
    },
    {
      slug: "gentle-morning-yoga",
      name: "Gentle Morning Yoga",
      type: "Yoga",
      day: 3,
      time: "07:30",
      duration: "45 min",
    },
    {
      slug: "modified-hiit",
      name: "Modified HIIT",
      type: "HIIT",
      day: 4,
      time: "12:00",
      duration: "30 min",
    },
    {
      slug: "chair-based-strength",
      name: "Chair-Based Strength",
      type: "Strength",
      day: 5,
      time: "10:00",
      duration: "45 min",
    },
  ];

  for (const cls of classes) {
    // Calculate most recent past occurrence of this class
    const today = now.getDay(); // 0=Sun
    let daysAgo = (today - cls.day + 7) % 7;
    if (daysAgo === 0) daysAgo = 7; // If today is that day, show last week's
    const recordedDate = new Date(now);
    recordedDate.setDate(recordedDate.getDate() - daysAgo);
    recordedDate.setHours(parseInt(cls.time.split(":")[0]), parseInt(cls.time.split(":")[1]), 0, 0);

    const expiresAt = new Date(recordedDate);
    expiresAt.setDate(expiresAt.getDate() + CLASS_RECORDING_RETENTION_DAYS);

    // Only include if not yet expired
    if (expiresAt > now) {
      recordings.push({
        classSlug: cls.slug,
        className: cls.name,
        classType: cls.type,
        recordedDate: recordedDate.toISOString(),
        duration: cls.duration,
        expiresAt: expiresAt.toISOString(),
      });
    }
  }

  return recordings.sort(
    (a, b) => new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime()
  );
}

/** Generate mock programme recordings with extended retention */
export function generateProgrammeRecordings(programmeId: string): ClassRecording[] {
  const now = new Date();
  const sessions = [
    { name: "Session 1: Assessment & Foundations", daysAgo: 21 },
    { name: "Session 2: Progressive Loading", daysAgo: 14 },
    { name: "Session 3: Adaptation Strategies", daysAgo: 7 },
  ];

  return sessions
    .map((session) => {
      const recordedDate = new Date(now);
      recordedDate.setDate(recordedDate.getDate() - session.daysAgo);
      recordedDate.setHours(10, 0, 0, 0);

      const expiresAt = new Date(recordedDate);
      expiresAt.setDate(expiresAt.getDate() + PROGRAMME_RECORDING_RETENTION_DAYS);

      return {
        classSlug: `${programmeId}-s${sessions.indexOf(session) + 1}`,
        className: session.name,
        classType: "Programme",
        recordedDate: recordedDate.toISOString(),
        duration: "60 min",
        expiresAt: expiresAt.toISOString(),
        isProgrammeRecording: true,
      };
    })
    .filter((r) => new Date(r.expiresAt) > now)
    .sort((a, b) => new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime());
}

export const MOCK_RECORDINGS = generateMockRecordings();

/* ──────────── Access check hook ──────────── */

export function useRecordingAccess() {
  const { membership, enrolledProgramIds, isAuthenticated } = useAuth();

  const hasAccess = isAuthenticated && (membership !== null || enrolledProgramIds.length > 0);

  const isMember = membership !== null;
  const isUnlimited = membership?.plan === "unlimited" || membership?.plan === "instructor";
  const isCapped = membership?.plan === "steady" || membership?.plan === "committed";
  const isProgramOnly = !isMember && enrolledProgramIds.length > 0;

  return { hasAccess, isMember, isUnlimited, isCapped, isProgramOnly, enrolledProgramIds };
}

/* ──────────── Recording card ──────────── */

interface RecordingCardProps {
  recording: ClassRecording;
  /** Whether this is shown in a programme context (free access) */
  isProgrammeRecording?: boolean;
}

export function RecordingCard({ recording, isProgrammeRecording = false }: RecordingCardProps) {
  const {
    membership,
    canWatchRecording,
    watchRecording,
    hasWatchedRecording,
    membershipClassesRemaining,
  } = useAuth();
  const { fmtDate, fmtTimeStr } = useI18n();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCreditWarning, setShowCreditWarning] = useState(false);

  const alreadyWatched = hasWatchedRecording(recording.classSlug);
  const watchCheck = canWatchRecording(recording.classSlug);
  const isUnlimited = membership?.plan === "unlimited" || membership?.plan === "instructor";

  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(recording.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const handleWatch = () => {
    if (isProgrammeRecording || isUnlimited || alreadyWatched) {
      // Free to watch — play directly
      watchRecording(recording.classSlug, recording.className);
      setIsPlaying(true);
      return;
    }

    // Capped membership — show warning first
    if (watchCheck.consumesCredit && !showCreditWarning) {
      setShowCreditWarning(true);
      return;
    }

    // User confirmed
    watchRecording(recording.classSlug, recording.className);
    setIsPlaying(true);
    setShowCreditWarning(false);
  };

  if (isPlaying) {
    return (
      <div className="overflow-hidden rounded-lg border">
        <div className="relative flex aspect-video items-center justify-center bg-[#1a1a2e]">
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#4B5B32]/30">
              <Play className="ml-1 h-8 w-8 text-[#B5C49B]" />
            </div>
            <p className="text-sm text-white/70">Recording playback would start here</p>
            <p className="text-xs text-white/40">[In production: Daily.co recording embed]</p>
          </div>
        </div>
        <div className="flex items-center justify-between p-4">
          <div>
            <h4 className="text-sm">{recording.className}</h4>
            <p className="text-muted-foreground text-xs">
              Recorded {fmtDate(recording.recordedDate)} · {recording.duration}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsPlaying(false)}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4 transition-shadow hover:shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-start gap-3">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
              recording.classType === "Yoga"
                ? "bg-[#4B5B32]/10 text-[#4B5B32]"
                : recording.classType === "HIIT"
                  ? "bg-orange-100 text-orange-600"
                  : "bg-primary/10 text-primary"
            }`}
          >
            <Play className="ml-0.5 h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm">{recording.className}</h4>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-xs">
                {fmtDate(recording.recordedDate)} · {recording.duration}
              </span>
              {daysRemaining <= 2 && (
                <Badge
                  variant="outline"
                  className="border-orange-200 px-1.5 py-0 text-[10px] text-orange-600"
                >
                  {daysRemaining === 0 ? "Expires today" : `${daysRemaining}d left`}
                </Badge>
              )}
              {alreadyWatched && (
                <Badge
                  variant="outline"
                  className="gap-0.5 border-[#4B5B32]/20 px-1.5 py-0 text-[10px] text-[#4B5B32]"
                >
                  <CheckCircle className="h-2.5 w-2.5" />
                  Watched
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:flex-shrink-0">
          {!watchCheck.allowed && !alreadyWatched && !isProgrammeRecording ? (
            <div className="flex items-center gap-2">
              <span className="max-w-[180px] text-xs text-orange-600">No weekly classes left</span>
              <Link href="/dashboard/membership">
                <Button size="sm" variant="outline" className="gap-1">
                  <ShoppingCart className="h-3 w-3" />
                  Get Credits
                </Button>
              </Link>
            </div>
          ) : showCreditWarning ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-orange-600">Uses 1 class credit</span>
              <Button size="sm" onClick={handleWatch}>
                Confirm
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCreditWarning(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={handleWatch}>
              <Play className="mr-1.5 h-3.5 w-3.5" />
              {alreadyWatched ? "Rewatch" : "Watch"}
            </Button>
          )}
        </div>
      </div>

      {/* Credit usage note for capped memberships */}
      {!isProgrammeRecording &&
        !isUnlimited &&
        !alreadyWatched &&
        !showCreditWarning &&
        watchCheck.allowed && (
          <p className="text-muted-foreground/60 mt-2 flex items-center gap-1 text-[10px]">
            <Info className="h-3 w-3" />
            First watch uses 1 of your {membership?.classesPerWeek} weekly classes (
            {membershipClassesRemaining} remaining). Rewatches are free.
          </p>
        )}
    </div>
  );
}

/* ──────────── Recordings section for class detail ──────────── */

interface ClassRecordingsSectionProps {
  classSlug: string;
}

export function ClassRecordingsSection({ classSlug }: ClassRecordingsSectionProps) {
  const { hasAccess, isMember, isProgramOnly, isUnlimited, isCapped } = useRecordingAccess();
  const { membership } = useAuth();

  const recordings = MOCK_RECORDINGS.filter((r) => r.classSlug === classSlug);

  if (recordings.length === 0) return null;

  // No access — show upsell
  if (!hasAccess) {
    return (
      <div className="space-y-3 rounded-lg border p-5">
        <div className="flex items-center gap-2">
          <Lock className="text-muted-foreground h-4 w-4" />
          <h3 className="text-sm">Recording Available</h3>
        </div>
        <p className="text-muted-foreground text-sm">
          Class recordings are available to members and programme participants. Join a membership to
          access all recordings for 7 days.
        </p>
        <Link href="/pricing">
          <Button size="sm" variant="outline">
            View Membership Options
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Play className="text-primary h-4 w-4" />
        <h3 className="text-lg">Recent Recording</h3>
        {isUnlimited && (
          <Badge
            variant="outline"
            className="border-[#4B5B32]/20 px-1.5 py-0 text-[10px] text-[#4B5B32]"
          >
            Unlimited access
          </Badge>
        )}
        {isCapped && (
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            Counts as class attended
          </Badge>
        )}
      </div>
      {recordings.map((rec) => (
        <RecordingCard key={rec.classSlug + rec.recordedDate} recording={rec} />
      ))}
    </div>
  );
}

/* ──────────── Recordings list for dashboard ──────────── */

export function RecordingsLibrary() {
  const { hasAccess, isMember, isUnlimited, isCapped, isProgramOnly } = useRecordingAccess();
  const { membership, membershipClassesRemaining, enrolledProgramIds } = useAuth();
  const recordings = MOCK_RECORDINGS;

  if (!hasAccess) {
    return (
      <div className="space-y-4 rounded-lg border p-8 text-center">
        <div className="bg-secondary mx-auto flex h-14 w-14 items-center justify-center rounded-full">
          <Lock className="text-muted-foreground h-7 w-7" />
        </div>
        <div>
          <h3 className="mb-1 text-lg">Recording Access</h3>
          <p className="text-muted-foreground text-sm">
            Class recordings are available to members and programme participants.
          </p>
        </div>
        <Link href="/pricing">
          <Button>View Membership Options</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Access info banner */}
      <div className="bg-secondary/30 flex items-start gap-3 rounded-lg border p-4">
        <Info className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
        <div className="text-muted-foreground space-y-1 text-sm">
          {isUnlimited && (
            <p>
              As an <span className="text-foreground">Unlimited</span> member, you can watch any
              class recording from the last 7 days at no extra cost.
            </p>
          )}
          {isCapped && (
            <p>
              With your <span className="text-foreground">{membership?.label}</span> membership,
              watching a new recording counts as 1 of your {membership?.classesPerWeek} weekly
              classes ({membershipClassesRemaining} remaining). Rewatching the same class is always
              free.
            </p>
          )}
          {isProgramOnly && (
            <p>
              You can access recordings for your enrolled programme sessions. For general class
              recordings, a membership is required.
            </p>
          )}
        </div>
      </div>

      {/* Recording list */}
      <div className="space-y-3">
        {recordings.map((rec) => (
          <RecordingCard key={rec.classSlug + rec.recordedDate} recording={rec} />
        ))}
      </div>

      {recordings.length === 0 && (
        <div className="text-muted-foreground py-8 text-center text-sm">
          No recordings available right now. Recordings appear after each live class and are
          available for 7 days.
        </div>
      )}
    </div>
  );
}
