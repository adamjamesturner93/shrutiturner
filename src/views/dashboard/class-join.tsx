"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, Calendar, Clock, Heart } from "lucide-react";
import { DashboardLayout } from "../../components/dashboard-layout";
import { Button } from "../../components/ui/button";
import { PreJoinLobby } from "../../components/video/pre-join-lobby";
import { VideoRoom, type RoomMode } from "../../components/video/video-room";
import { SEO } from "../../components/seo";
import { useAuth } from "../../context/auth-context";
import type { ClassSessionDetailDto, ClassSessionListItemDto } from "@/lib/api/types";
import type { ClassDefinitionContent } from "@/lib/content";

type Stage = "too-early" | "access-denied" | "late-denied" | "pre-join" | "live" | "post-class";

const PRE_JOIN_WINDOW_MINUTES = 24 * 60;

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
  const { submitPostClassFeedback } = useAuth();
  const cls = classDetail && classDetail.slug === id ? classDetail : undefined;
  const sessionId = searchParams.get("sessionId");
  const [activeSession, setActiveSession] = useState<ClassSessionDetailDto | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [initialMuted, setInitialMuted] = useState(false);
  const [initialCameraOn, setInitialCameraOn] = useState(true);
  const [preClassEnergy, setPreClassEnergy] = useState<number | null>(null);
  const [preClassFlare, setPreClassFlare] = useState(false);
  const [postClassFeeling, setPostClassFeeling] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
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

  const roomOpensAt = classDatetime
    ? new Date(classDatetime.getTime() - PRE_JOIN_WINDOW_MINUTES * 60_000)
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

  const roomMode: RoomMode =
    cls?.type === "HIIT" || (cls?.maxSpaces || 0) <= 8 ? "small-group" : "live-class";
  const isLiveStageRequested = searchParams.get("stage") === "live";

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
        <div className="mx-auto max-w-md space-y-6 py-20 text-center">
          <div className="bg-brand-accent/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
            <Clock className="text-brand-accent h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-brand-dark text-2xl">You&apos;re a bit early</h1>
            <p className="text-muted-foreground leading-relaxed">
              The virtual studio for <span className="text-brand-dark">{cls.name}</span> opens 24
              hours before class starts.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <Link href={`/dashboard/classes/${cls.slug}`}>
              <Button variant="outline">Class Details</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (stage === "late-denied") {
    return (
      <DashboardLayout title="Warm-up Complete">
        <div className="mx-auto max-w-md space-y-6 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-brand-dark text-2xl">Warm-up has finished</h1>
            <p className="text-muted-foreground">
              New joins close 5 minutes after class starts so nobody misses the warm-up. You&apos;ll
              be able to join on time for the next session.
            </p>
          </div>
          <Link href="/dashboard/schedule">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Back to Schedule
            </Button>
          </Link>
        </div>
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

  if (isLiveStageRequested && activeSession) {
    return (
      <>
        <SEO title={`${cls.name} - Live - Shruti Turner`} noIndex />
        <VideoRoom
          sessionId={activeSession.id}
          mode={roomMode}
          isInstructor={false}
          className={cls.name}
          classTime={cls.time}
          classDuration={cls.duration}
          registeredCount={activeSession.bookedCount || cls.maxSpaces}
          initialMuted={initialMuted}
          initialCameraOn={initialCameraOn}
          initialCommunityMode={activeSession.communityModeEnabled}
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
                      onClick={() => setPreClassEnergy(level)}
                      className="border-border hover:border-brand-accent flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm transition-colors"
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setPreClassFlare((value) => !value)}
                className={`w-full rounded-lg border py-2 text-sm transition-colors ${
                  preClassFlare
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-border text-muted-foreground hover:border-amber-200"
                }`}
              >
                {preClassFlare ? "Flare day" : "Experiencing a flare?"}
              </button>
              <button
                onClick={() => setPreClassEnergy(3)}
                className="text-muted-foreground hover:text-foreground w-full text-center text-xs transition-colors"
              >
                Skip check-in
              </button>
            </div>
          </div>
        ) : null}
        <PreJoinLobby
          className={cls.name}
          classTime={cls.time}
          classDuration={cls.duration}
          classLevel={cls.level}
          instructor={cls.instructor}
          equipment={cls.equipment}
          registeredCount={activeSession?.bookedCount || cls.maxSpaces}
          maxSpaces={cls.maxSpaces}
          mode={roomMode}
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

  const FEELING_OPTIONS = [
    { value: "great", label: "Great" },
    { value: "good", label: "Good" },
    { value: "okay", label: "Okay" },
    { value: "tough", label: "Tough" },
    { value: "too-much", label: "Too much" },
  ];

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
                onClick={() => {
                  setPostClassFeeling(option.value);
                  submitPostClassFeedback(`att_${Date.now()}`, { feeling: option.value as never });
                  setFeedbackSubmitted(true);
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
        <div className="space-y-3">
          <Button
            onClick={() => router.push("/dashboard/schedule")}
            className="bg-brand-accent hover:bg-brand-accent/90 w-full text-white"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Back to Schedule
          </Button>
        </div>
      </div>
    </div>
  );
}
