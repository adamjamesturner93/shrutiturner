import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useAuth } from "../context/auth-context";
import { useI18n } from "../lib/use-i18n";
import Link from "next/link";
import {
  Play,
  Clock,
  AlertCircle,
  CheckCircle,
  Lock,
  Info,
  ShoppingCart,
} from "lucide-react";

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
    { slug: "adaptive-yoga-flow", name: "Adaptive Yoga Flow", type: "Yoga", day: 1, time: "09:00", duration: "60 min" },
    { slug: "strength-foundations", name: "Strength Foundations", type: "Strength", day: 1, time: "18:30", duration: "45 min" },
    { slug: "gentle-morning-yoga", name: "Gentle Morning Yoga", type: "Yoga", day: 3, time: "07:30", duration: "45 min" },
    { slug: "modified-hiit", name: "Modified HIIT", type: "HIIT", day: 4, time: "12:00", duration: "30 min" },
    { slug: "chair-based-strength", name: "Chair-Based Strength", type: "Strength", day: 5, time: "10:00", duration: "45 min" },
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

  const hasAccess = isAuthenticated && (
    membership !== null || enrolledProgramIds.length > 0
  );

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
    Math.ceil(
      (new Date(recording.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
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
      <div className="border rounded-lg overflow-hidden">
        <div className="aspect-video bg-[#1a1a2e] flex items-center justify-center relative">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#4B5B32]/30 mx-auto flex items-center justify-center">
              <Play className="w-8 h-8 text-[#B5C49B] ml-1" />
            </div>
            <p className="text-white/70 text-sm">
              Recording playback would start here
            </p>
            <p className="text-white/40 text-xs">
              [In production: Daily.co recording embed]
            </p>
          </div>
        </div>
        <div className="p-4 flex items-center justify-between">
          <div>
            <h4 className="text-sm">{recording.className}</h4>
            <p className="text-xs text-muted-foreground">
              Recorded {fmtDate(recording.recordedDate)} · {recording.duration}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPlaying(false)}
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              recording.classType === "Yoga"
                ? "bg-[#4B5B32]/10 text-[#4B5B32]"
                : recording.classType === "HIIT"
                ? "bg-orange-100 text-orange-600"
                : "bg-primary/10 text-primary"
            }`}
          >
            <Play className="w-4 h-4 ml-0.5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm">{recording.className}</h4>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {fmtDate(recording.recordedDate)} · {recording.duration}
              </span>
              {daysRemaining <= 2 && (
                <Badge
                  variant="outline"
                  className="text-orange-600 border-orange-200 text-[10px] px-1.5 py-0"
                >
                  {daysRemaining === 0 ? "Expires today" : `${daysRemaining}d left`}
                </Badge>
              )}
              {alreadyWatched && (
                <Badge
                  variant="outline"
                  className="text-[#4B5B32] border-[#4B5B32]/20 text-[10px] px-1.5 py-0 gap-0.5"
                >
                  <CheckCircle className="w-2.5 h-2.5" />
                  Watched
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:flex-shrink-0">
          {!watchCheck.allowed && !alreadyWatched && !isProgrammeRecording ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-orange-600 max-w-[180px]">No weekly classes left</span>
              <Link href="/dashboard/membership">
                <Button size="sm" variant="outline" className="gap-1">
                  <ShoppingCart className="w-3 h-3" />
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
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowCreditWarning(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={handleWatch}>
              <Play className="w-3.5 h-3.5 mr-1.5" />
              {alreadyWatched ? "Rewatch" : "Watch"}
            </Button>
          )}
        </div>
      </div>

      {/* Credit usage note for capped memberships */}
      {!isProgrammeRecording && !isUnlimited && !alreadyWatched && !showCreditWarning && watchCheck.allowed && (
        <p className="text-[10px] text-muted-foreground/60 mt-2 flex items-center gap-1">
          <Info className="w-3 h-3" />
          First watch uses 1 of your {membership?.classesPerWeek} weekly classes
          ({membershipClassesRemaining} remaining). Rewatches are free.
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
      <div className="border rounded-lg p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm">Recording Available</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Class recordings are available to members and programme participants.
          Join a membership to access all recordings for 7 days.
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
        <Play className="w-4 h-4 text-primary" />
        <h3 className="text-lg">Recent Recording</h3>
        {isUnlimited && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-[#4B5B32] border-[#4B5B32]/20">
            Unlimited access
          </Badge>
        )}
        {isCapped && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
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
      <div className="border rounded-lg p-8 text-center space-y-4">
        <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg mb-1">Recording Access</h3>
          <p className="text-sm text-muted-foreground">
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
      <div className="bg-secondary/30 border rounded-lg p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="text-sm text-muted-foreground space-y-1">
          {isUnlimited && (
            <p>
              As an <span className="text-foreground">Unlimited</span> member, you can
              watch any class recording from the last 7 days at no extra cost.
            </p>
          )}
          {isCapped && (
            <p>
              With your <span className="text-foreground">{membership?.label}</span> membership,
              watching a new recording counts as 1 of your {membership?.classesPerWeek} weekly
              classes ({membershipClassesRemaining} remaining). Rewatching the same class is always free.
            </p>
          )}
          {isProgramOnly && (
            <p>
              You can access recordings for your enrolled programme sessions.
              For general class recordings, a membership is required.
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
        <div className="text-center py-8 text-sm text-muted-foreground">
          No recordings available right now. Recordings appear after each live class
          and are available for 7 days.
        </div>
      )}
    </div>
  );
}