"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, ArrowLeft, Calendar, Clock, Heart } from "lucide-react";
import { DashboardLayout } from "../../components/dashboard-layout";
import { Button } from "../../components/ui/button";
import { PreJoinLobby } from "../../components/video/pre-join-lobby";
import { VideoRoom, type RoomMode } from "../../components/video/video-room";
import { SEO } from "../../components/seo";
import { useAuth } from "@/context/auth-context";
import type {
  ClassSessionDetailDto,
  ClassSessionListItemDto,
  PostClassFeelingDto,
  SessionFeedbackRequestDto,
} from "@/lib/api/types";
import { getClassSessionRoomMode } from "@/lib/classes/room-mode";
import type { ClassDefinitionContent } from "@/lib/content/types";

type Stage = "too-early" | "access-denied" | "late-denied" | "pre-join" | "live" | "post-class";
const NEXT_WEEK_FALLBACK_HREF = "/dashboard/schedule?wk=1";
const FEELING_OPTIONS: Array<{ value: PostClassFeelingDto; label: string }> = [
  { value: "great", label: "Great" },
  { value: "good", label: "Good" },
  { value: "okay", label: "Okay" },
  { value: "tough", label: "Tough" },
  { value: "too-much", label: "Too much" },
];

function getNextClassDatetime(day: string, time: string): Date {
  const dayMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  const targetDay = dayMap[day] ?? 0;
  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();
  const result = new Date(now);
  result.setHours(hours, minutes, 0, 0);
  let daysUntil = targetDay - now.getDay();
  if (daysUntil < 0) daysUntil += 7;
  if (daysUntil === 0 && result <= now) daysUntil = 7;
  result.setDate(result.getDate() + daysUntil);
  return result;
}

export function DashboardClassJoin({
  classDetail,
}: {
  classDetail: ClassDefinitionContent | null;
}) {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const cls = classDetail && classDetail.slug === id ? classDetail : undefined;
  const sessionId = searchParams.get("sessionId");
  const [activeSession, setActiveSession] = useState<ClassSessionDetailDto | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [initialMuted, setInitialMuted] = useState(false);
  const [initialCameraOn, setInitialCameraOn] = useState(true);
  const [preClassEnergy, setPreClassEnergy] = useState<number | null>(null);
  const [preClassFlare, setPreClassFlare] = useState(false);
  const [postClassFeeling, setPostClassFeeling] = useState<PostClassFeelingDto | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [isSubmittingFeeling, setIsSubmittingFeeling] = useState(false);
  const [nextBookingHref, setNextBookingHref] = useState(NEXT_WEEK_FALLBACK_HREF);
  const liveHref = useMemo(() => {
    const params = new URLSearchParams();
    if (sessionId) params.set("sessionId", sessionId);
    params.set("stage", "live");
    return `/dashboard/classes/${cls?.slug || id}/join?${params.toString()}`;
  }, [cls?.slug, id, sessionId]);
  const baseJoinHref = useMemo(() => {
    const params = new URLSearchParams();
    if (sessionId) params.set("sessionId", sessionId);
    return `/dashboard/classes/${cls?.slug || id}/join${params.toString() ? `?${params.toString()}` : ""}`;
  }, [cls?.slug, id, sessionId]);

  useEffect(() => {
    let active = true;

    if (!cls) {
      setLoadingSession(false);
      return;
    }

    void (async () => {
      setLoadingSession(true);
      try {
        if (sessionId) {
          const response = await fetch(`/api/classes/sessions/${sessionId}`, { cache: "no-store" });
          if (response.ok) {
            const payload = (await response.json()) as ClassSessionDetailDto;
            if (active) setActiveSession(payload);
            return;
          }
        }

        const response = await fetch(`/api/classes/sessions?slug=${encodeURIComponent(cls.slug)}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as ClassSessionListItemDto[];
        if (!active || !payload[0]) return;

        setActiveSession({
          ...payload[0],
          notes: "",
          cancelReason: null,
          instructorUserId: "",
          bookings: [],
          waitlist: [],
        });
      } finally {
        if (active) setLoadingSession(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [cls, sessionId]);

  const classDatetime = activeSession
    ? new Date(activeSession.startsAtUtc)
    : cls
      ? getNextClassDatetime(cls.day, cls.time)
      : null;

  const roomOpensAt = activeSession?.joinWindowOpensAt
    ? new Date(activeSession.joinWindowOpensAt)
    : classDatetime
      ? new Date(classDatetime.getTime() - 10 * 60_000)
      : null;
  const isTooEarly = roomOpensAt ? Date.now() < roomOpensAt.getTime() : false;
  const lateJoinCutoffAt = activeSession?.lateJoinCutoffAt
    ? new Date(activeSession.lateJoinCutoffAt)
    : classDatetime
      ? new Date(classDatetime.getTime() + 5 * 60_000)
      : null;
  const isLateDenied = Boolean(
    activeSession?.isBookedByCurrentUser &&
    lateJoinCutoffAt &&
    Date.now() > lateJoinCutoffAt.getTime() &&
    !activeSession?.hasPreviouslyJoinedCurrentUser &&
    activeSession?.status !== "completed" &&
    activeSession?.status !== "cancelled"
  );

  const stage = useMemo<Stage>(() => {
    if (loadingSession) return "access-denied";
    if (!cls || !activeSession?.isBookedByCurrentUser) return "access-denied";
    if (searchParams.get("completed") === "1" || activeSession.status === "completed")
      return "post-class";
    if (isTooEarly) return "too-early";
    if (isLateDenied) return "late-denied";
    return "pre-join";
  }, [activeSession, cls, isLateDenied, isTooEarly, loadingSession, searchParams]);

  const roomMode: RoomMode = getClassSessionRoomMode({
    classType: activeSession?.type || cls?.type || "",
    capacity: activeSession?.capacity || cls?.maxSpaces || 0,
  });
  const checkInMode =
    activeSession?.currentUserCheckInMode ||
    (user?.healthDeclarationStatus === "context_declared" && user.tracksFlareCheckIns
      ? "energy_and_flare"
      : "energy_only");
  const isLiveStageRequested = searchParams.get("stage") === "live";

  useEffect(() => {
    if (stage !== "post-class" || !cls?.slug) return;

    let active = true;

    void (async () => {
      try {
        const response = await fetch(`/api/classes/sessions?slug=${encodeURIComponent(cls.slug)}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as ClassSessionListItemDto[];
        if (!active) return;
        const nextSession = payload.find((item) => item.id !== activeSession?.id);
        setNextBookingHref(
          nextSession
            ? `/dashboard/classes/${cls.slug}?sessionId=${encodeURIComponent(nextSession.id)}`
            : NEXT_WEEK_FALLBACK_HREF
        );
      } catch {
        if (active) setNextBookingHref(NEXT_WEEK_FALLBACK_HREF);
      }
    })();

    return () => {
      active = false;
    };
  }, [activeSession?.id, cls?.slug, stage]);

  const submitSessionFeedback = async (input: SessionFeedbackRequestDto) => {
    if (!activeSession) return;

    const response = await fetch(`/api/classes/sessions/${activeSession.id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      throw new Error(payload.message || "Failed to save feedback.");
    }
  };

  const handlePreClassSelection = (energyLevel: 1 | 2 | 3 | 4 | 5) => {
    setPreClassEnergy(energyLevel);
    void submitSessionFeedback({
      stage: "pre",
      energyLevel,
      flareToday: checkInMode === "energy_and_flare" ? preClassFlare : false,
    }).catch(() => {
      // Check-in should never block entry to the room.
    });
  };

  if (loadingSession) {
    return (
      <DashboardLayout title="Joining Class">
        <div className="text-muted-foreground py-20 text-center">Loading class session...</div>
      </DashboardLayout>
    );
  }

  if (!cls) {
    return (
      <DashboardLayout title="Class Not Found">
        <div className="space-y-4 py-20 text-center">
          <h1 className="text-3xl">Class Not Found</h1>
          <p className="text-muted-foreground">This class doesn&apos;t exist.</p>
          <Link href="/dashboard/schedule">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              View Schedule
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (stage === "too-early") {
    return (
      <DashboardLayout title="Not Yet Open">
        <SEO title={`${cls.name} - Not Yet Open - Shruti Turner`} noIndex />
        <JoinGateState
          icon={<Clock className="text-brand-accent h-8 w-8" />}
          title="The studio opens shortly"
          body={`You can join ${cls.name} ${activeSession?.preJoinWindowMinutes || 10} minutes before class starts. Use this time to settle in and come back when the room opens.`}
          primaryHref={`/dashboard/classes/${cls.slug}`}
          primaryLabel="Back to Class Details"
        />
      </DashboardLayout>
    );
  }

  if (stage === "late-denied") {
    return (
      <DashboardLayout title="Warm-up Complete">
        <JoinGateState
          icon={<AlertCircle className="h-8 w-8 text-amber-500" />}
          title="Warm-up has finished"
          body={`New joins close ${activeSession?.lateJoinCutoffMinutes || 5} minutes after class starts so nobody misses the warm-up. You’ll be able to join on time for the next session.`}
          primaryHref="/dashboard/schedule"
          primaryLabel="Back to Schedule"
        />
      </DashboardLayout>
    );
  }

  if (stage === "access-denied") {
    return (
      <DashboardLayout title="Access Denied">
        <div className="space-y-4 py-20 text-center">
          <h1 className="text-3xl">Access Restricted</h1>
          <p className="text-muted-foreground">
            You need to be booked into this class to join the session.
          </p>
          <Link href="/dashboard/schedule">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              View Schedule
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (
    user &&
    (user.healthDeclarationStatus === "incomplete" ||
      !user.hasConsentedToHealthData ||
      user.needsHealthDataConsentRefresh)
  ) {
    return (
      <DashboardLayout title="Health Declaration Required">
        <JoinGateState
          icon={<AlertCircle className="h-8 w-8 text-amber-500" />}
          title="Complete your health declaration first"
          body="Before you join class, update your health declaration so Shruti has the right context for safe adaptations."
          primaryHref="/dashboard/health"
          primaryLabel="Complete Health Declaration"
        />
      </DashboardLayout>
    );
  }

  if (isLiveStageRequested && activeSession) {
    return (
      <>
        <SEO title={`${cls.name} - Live - Shruti Turner`} noIndex />
        <VideoRoom
          sessionId={activeSession.id}
          mode={roomMode}
          isInstructor={false}
          className={cls.name}
          classTime={new Date(activeSession.startsAtUtc).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          classDuration={`${activeSession.durationMinutes} min`}
          registeredCount={activeSession.bookedCount || activeSession.capacity || cls.maxSpaces}
          initialMuted={initialMuted}
          initialCameraOn={initialCameraOn}
          initialCommunityMode={activeSession.communityModeEnabled}
          isRecorded={activeSession.isRecorded}
          chatEnabled={activeSession.chatEnabled}
          onLeave={(reason) => {
            if (reason === "ended") {
              const params = new URLSearchParams();
              if (sessionId) params.set("sessionId", sessionId);
              params.set("completed", "1");
              router.replace(`/dashboard/classes/${cls.slug}/join?${params.toString()}`);
              return;
            }
            router.replace(baseJoinHref);
          }}
        />
      </>
    );
  }

  if (stage === "pre-join") {
    return (
      <>
        <SEO title={`Joining ${cls.name} - Shruti Turner`} noIndex />
        {preClassEnergy === null ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="bg-background w-full max-w-sm space-y-5 rounded-lg border p-6 shadow-xl">
              <div className="space-y-2 text-center">
                <Heart className="text-brand-accent mx-auto h-8 w-8" />
                <h3 className="text-xl">Quick check-in</h3>
                <p className="text-muted-foreground text-sm">
                  How are you feeling right now? This helps Shruti adapt the session.
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-2 text-sm">Energy level today</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => handlePreClassSelection(level as 1 | 2 | 3 | 4 | 5)}
                      className="border-border hover:border-brand-accent flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm transition-colors"
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              {checkInMode === "energy_and_flare" ? (
                <button
                  onClick={() => setPreClassFlare((value) => !value)}
                  className={`w-full rounded-lg border py-2 text-sm transition-colors ${
                    preClassFlare
                      ? "border-amber-300 bg-amber-50 text-amber-700"
                      : "border-border text-muted-foreground hover:border-amber-200"
                  }`}
                >
                  {preClassFlare
                    ? "Flare or symptom spike today"
                    : "Any flare or symptom spike today?"}
                </button>
              ) : null}
              <button
                onClick={() => handlePreClassSelection(3)}
                className="text-muted-foreground hover:text-foreground w-full text-center text-xs transition-colors"
              >
                Skip check-in
              </button>
            </div>
          </div>
        ) : null}
        <PreJoinLobby
          className={cls.name}
          classTime={
            activeSession
              ? new Date(activeSession.startsAtUtc).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : cls.time
          }
          classDuration={activeSession ? `${activeSession.durationMinutes} min` : cls.duration}
          classLevel={activeSession?.level || cls.level}
          instructor={activeSession?.instructorName || cls.instructor}
          equipment={cls.equipment}
          registeredCount={activeSession?.bookedCount || activeSession?.capacity || cls.maxSpaces}
          maxSpaces={activeSession?.capacity || cls.maxSpaces}
          mode={roomMode}
          defaultMicMuted={activeSession?.participantMicDefaultMuted}
          defaultCameraOff={activeSession?.participantCameraDefaultOff}
          isRecorded={activeSession?.isRecorded}
          chatEnabled={activeSession?.chatEnabled}
          onJoin={({ isMuted, isCameraOn }) => {
            setInitialMuted(isMuted);
            setInitialCameraOn(isCameraOn);
            router.replace(liveHref);
          }}
          onBack={() => router.push(`/dashboard/classes/${cls.slug}`)}
        />
      </>
    );
  }

  return (
    <div className="bg-video-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4">
      <SEO title={`${cls.name} - Session Ended - Shruti Turner`} noIndex />
      <div className="bg-video-panel w-full max-w-sm space-y-6 rounded-xl border border-white/10 p-8 text-center">
        <div className="bg-brand-accent/20 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
          <Calendar className="text-brand-accent-light h-8 w-8" />
        </div>
        <div>
          <h2 className="text-xl text-white">
            {feedbackSubmitted ? "Thanks for sharing." : "How did that feel?"}
          </h2>
          {!feedbackSubmitted ? (
            <p className="mt-2 text-sm leading-relaxed text-white/50">
              Optional feedback that helps Shruti adapt future sessions.
            </p>
          ) : null}
        </div>
        {!feedbackSubmitted ? (
          <div className="flex justify-center gap-2">
            {FEELING_OPTIONS.map((option) => (
              <button
                key={option.value}
                disabled={isSubmittingFeeling}
                onClick={async () => {
                  setPostClassFeeling(option.value);
                  setFeedbackError("");
                  setIsSubmittingFeeling(true);
                  try {
                    await submitSessionFeedback({
                      stage: "post",
                      feeling: option.value,
                    });
                    setFeedbackSubmitted(true);
                  } catch (error) {
                    setFeedbackError(
                      error instanceof Error ? error.message : "Failed to save feedback."
                    );
                  } finally {
                    setIsSubmittingFeeling(false);
                  }
                }}
                className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                  postClassFeeling === option.value
                    ? "border-brand-accent-light/50 bg-brand-accent/30 text-brand-accent-light"
                    : "border-white/10 text-white/60 hover:border-white/30 hover:text-white/80"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
        {feedbackError ? <p className="text-sm text-red-300">{feedbackError}</p> : null}
        <div className="space-y-3">
          {feedbackSubmitted ? (
            <Button
              onClick={() => router.push(nextBookingHref)}
              className="bg-brand-accent hover:bg-brand-accent/90 w-full text-white"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Book next week
            </Button>
          ) : null}
          <Button
            onClick={() => router.push("/dashboard/schedule")}
            variant={feedbackSubmitted ? "outline" : "default"}
            className={
              feedbackSubmitted
                ? "w-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                : "bg-brand-accent hover:bg-brand-accent/90 w-full text-white"
            }
          >
            <Calendar className="mr-2 h-4 w-4" />
            Back to Schedule
          </Button>
        </div>
      </div>
    </div>
  );
}

function JoinGateState({
  icon,
  title,
  body,
  primaryHref,
  primaryLabel,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="border-brand-dark/10 bg-background overflow-hidden rounded-[1.75rem] border shadow-sm">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(228,180,92,0.18),_transparent_45%),linear-gradient(135deg,_rgba(13,51,52,0.06),_rgba(13,51,52,0))] px-8 py-10">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/80 shadow-sm">
              {icon}
            </div>
            <p className="text-brand-accent text-xs tracking-[0.22em] uppercase">Live Class</p>
            <h1 className="text-brand-dark mt-3 text-3xl tracking-[-0.02em] md:text-4xl">
              {title}
            </h1>
            <p className="text-muted-foreground mt-4 max-w-xl text-base leading-relaxed">{body}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={primaryHref}>
                <Button variant="outline">{primaryLabel}</Button>
              </Link>
              <Link href="/dashboard/schedule">
                <Button>
                  <Calendar className="mr-2 h-4 w-4" />
                  View Schedule
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
