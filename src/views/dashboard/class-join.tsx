"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../context/auth-context";
import { Button } from "../../components/ui/button";
import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Clock, AlertCircle, Zap, Heart } from "lucide-react";
import { DashboardLayout } from "../../components/dashboard-layout";
import { PreJoinLobby } from "../../components/video/pre-join-lobby";
import { VideoRoom, type RoomMode } from "../../components/video/video-room";
import { SEO } from "../../components/seo";
import { useI18n } from "../../lib/use-i18n";
import type { ClassSessionDetailDto, ClassSessionListItemDto } from "@/lib/api/types";
import type { ClassDefinitionContent } from "@/lib/content";

type Stage = "too-early" | "access-denied" | "pre-join" | "live" | "post-class";

/**
 * Compute the next occurrence of a given day + time (HH:MM) from now.
 * Returns a Date for that upcoming slot.
 */
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

  const currentDay = now.getDay();
  let daysUntil = targetDay - currentDay;
  if (daysUntil < 0) daysUntil += 7;
  // If it's the same day but the time has passed, go to next week
  if (daysUntil === 0 && result <= now) daysUntil = 7;
  result.setDate(result.getDate() + daysUntil);

  return result;
}

export function DashboardClassJoin({ classDetail }: { classDetail: ClassDefinitionContent | null }) {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { submitPreClassCheckIn, submitPostClassFeedback } = useAuth();
  const router = useRouter();
  const navigate = (href: string, opts?: { replace?: boolean }) =>
    opts?.replace ? router.replace(href) : router.push(href);
  const cls = classDetail && classDetail.slug === id ? classDetail : undefined;
  const [activeSession, setActiveSession] = useState<ClassSessionDetailDto | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const { fmtTimeStr } = useI18n();
  const sessionId = searchParams.get("sessionId");

  useEffect(() => {
    let active = true;
    if (!cls) return;
    void (async () => {
      try {
        setLoadingSession(true);
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
        if (active && payload[0]) {
          setActiveSession({
            ...payload[0],
            notes: "",
            cancelReason: null,
            bookings: [],
            waitlist: [],
          });
        }
      } catch {
        // fallback to existing behavior
      } finally {
        if (active) setLoadingSession(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [cls, sessionId]);

  // Compute whether we're too early (>10 min before class)
  const classDatetime = activeSession
    ? new Date(activeSession.startsAtUtc)
    : cls
      ? getNextClassDatetime(cls.day, cls.time)
      : null;
  const now = new Date();
  const minutesUntilClass = classDatetime
    ? (classDatetime.getTime() - now.getTime()) / (1000 * 60)
    : 0;
  const isTooEarly = minutesUntilClass > 10;

  const initialStage: Stage = loadingSession
    ? "access-denied"
    : !cls
    ? "access-denied"
    : !activeSession?.isBookedByCurrentUser
      ? "access-denied"
      : isTooEarly
        ? "too-early"
        : "pre-join";

  const [stage, setStage] = useState<Stage>(initialStage);
  const [initialMuted, setInitialMuted] = useState(false);
  const [initialCameraOn, setInitialCameraOn] = useState(true);
  const [countdown, setCountdown] = useState("");
  const [preClassEnergy, setPreClassEnergy] = useState<number | null>(null);
  const [preClassFlare, setPreClassFlare] = useState(false);
  const [postClassFeeling, setPostClassFeeling] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    if (!cls) {
      setStage("access-denied");
      return;
    }
    if (loadingSession) return;
    const bookedNow = Boolean(activeSession?.isBookedByCurrentUser);
    if (!bookedNow) {
      setStage("access-denied");
      return;
    }
    if (isTooEarly) {
      setStage("too-early");
      return;
    }
    if (stage === "access-denied" || stage === "too-early") {
      setStage("pre-join");
    }
  }, [activeSession, cls, loadingSession, isTooEarly, stage]);

  if (loadingSession) {
    return (
      <DashboardLayout title="Joining Class">
        <div className="text-muted-foreground py-20 text-center">Loading class session...</div>
      </DashboardLayout>
    );
  }

  // Countdown timer for the too-early state
  useEffect(() => {
    if (stage !== "too-early" || !classDatetime) return;

    function updateCountdown() {
      const diff = classDatetime!.getTime() - Date.now();
      if (diff <= 10 * 60 * 1000) {
        setStage("pre-join");
        return;
      }
      const totalMin = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(totalMin / 60);
      const mins = totalMin % 60;
      setCountdown(hours > 0 ? `${hours}h ${mins}m` : `${mins} minute${mins !== 1 ? "s" : ""}`);
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 30_000);
    return () => clearInterval(interval);
  }, [stage, classDatetime]);

  if (!cls) {
    return (
      <DashboardLayout title="Class Not Found">
        <div className="space-y-4 py-20 text-center">
          <h1 className="text-3xl">Class Not Found</h1>
          <p className="text-muted-foreground">This class doesn't exist.</p>
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

  // Determine room mode based on class type
  const roomMode: RoomMode =
    cls.type === "HIIT" || cls.maxSpaces <= 8 ? "small-group" : "live-class";

  // Too early — class hasn't opened yet
  if (stage === "too-early") {
    return (
      <DashboardLayout title="Not Yet Open">
        <SEO title={`${cls.name} - Not Yet Open - Shruti Turner`} noIndex />
        <div className="mx-auto max-w-md space-y-6 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#4B5B32]/10">
            <Clock className="h-8 w-8 text-[#4B5B32]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl text-[#2E1F33]">You're a bit early</h1>
            <p className="text-muted-foreground leading-relaxed">
              The virtual studio for <span className="text-[#2E1F33]">{cls.name}</span> opens 10
              minutes before class starts. You'll be able to join at{" "}
              <span className="text-[#2E1F33]">
                {(() => {
                  const [h, m] = cls.time.split(":").map(Number);
                  const adjustedM = m - 10;
                  const finalH = adjustedM < 0 ? h - 1 : h;
                  const finalM = adjustedM < 0 ? adjustedM + 60 : adjustedM;
                  const timeStr = `${String(finalH).padStart(2, "0")}:${String(finalM).padStart(2, "0")}`;
                  return fmtTimeStr(timeStr);
                })()}
              </span>
              .
            </p>
          </div>

          {countdown && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-[#4B5B32]/15 bg-[#4B5B32]/5 px-4 py-2.5">
              <AlertCircle className="h-4 w-4 text-[#4B5B32]" />
              <span className="text-sm text-[#2E1F33]">
                Studio opens in <span className="text-[#4B5B32]">{countdown}</span>
              </span>
            </div>
          )}

          <div className="mx-auto mt-8 grid max-w-lg grid-cols-1 gap-4 text-left md:grid-cols-2">
            <div className="bg-secondary/20 space-y-2 rounded-lg p-4">
              <h3 className="font-medium text-[#2E1F33]">Get Ready</h3>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>• Clear a 2m x 2m space</li>
                <li>• Have water nearby</li>
                <li>• Check your camera & mic</li>
              </ul>
            </div>
            <div className="bg-secondary/20 space-y-2 rounded-lg p-4">
              <h3 className="font-medium text-[#2E1F33]">Settling In</h3>
              <p className="text-muted-foreground text-sm">
                Take a moment to arrive. Close your tabs, silence your phone.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-muted-foreground text-sm">
              In the meantime, you could review the class details or check your schedule.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={`/dashboard/classes/${cls.slug}`}>
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Class Details
                </Button>
              </Link>
              <Link href="/dashboard/schedule">
                <Button variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Schedule
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Access denied
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

  // Pre-join lobby
  if (stage === "pre-join") {
    return (
      <>
        <SEO title={`Joining ${cls.name} - Shruti Turner`} noIndex />
        {/* Pre-class check-in (optional) */}
        {preClassEnergy === null && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="bg-background animate-in fade-in zoom-in w-full max-w-sm space-y-5 rounded-lg border p-6 shadow-xl">
              <div className="space-y-2 text-center">
                <Heart className="mx-auto h-8 w-8 text-[#4B5B32]" />
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
                      className="border-border flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm transition-colors hover:border-[#4B5B32]"
                    >
                      {level === 1
                        ? "1"
                        : level === 2
                          ? "2"
                          : level === 3
                            ? "3"
                            : level === 4
                              ? "4"
                              : "5"}
                    </button>
                  ))}
                </div>
                <div className="text-muted-foreground mt-1 flex justify-between px-1 text-xs">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPreClassFlare(!preClassFlare)}
                  className={`flex-1 rounded-lg border py-2 text-sm transition-colors ${
                    preClassFlare
                      ? "border-amber-300 bg-amber-50 text-amber-700"
                      : "border-border text-muted-foreground hover:border-amber-200"
                  }`}
                >
                  {preClassFlare ? "Flare day" : "Experiencing a flare?"}
                </button>
              </div>
              <button
                onClick={() => {
                  setPreClassEnergy(3);
                }}
                className="text-muted-foreground hover:text-foreground w-full text-center text-xs transition-colors"
              >
                Skip check-in
              </button>
            </div>
          </div>
        )}
        <PreJoinLobby
          className={cls.name}
          classTime={cls.time}
          classDuration={cls.duration}
          classLevel={cls.level}
          instructor={cls.instructor}
          equipment={cls.equipment}
          registeredCount={Math.min(cls.maxSpaces, cls.maxSpaces - 2)}
          maxSpaces={cls.maxSpaces}
          mode={roomMode}
          onJoin={({ isMuted, isCameraOn }) => {
            setInitialMuted(isMuted);
            setInitialCameraOn(isCameraOn);
            setStage("live");
          }}
          onBack={() => navigate(`/dashboard/classes/${cls.slug}`)}
        />
      </>
    );
  }

  // Live video room
  if (stage === "live") {
    return (
      <>
        <SEO title={`${cls.name} - Live - Shruti Turner`} noIndex />
        <VideoRoom
          mode={roomMode}
          isInstructor={false}
          className={cls.name}
          classTime={cls.time}
          classDuration={cls.duration}
          registeredCount={Math.min(cls.maxSpaces, cls.maxSpaces - 2)}
          onLeave={() => setStage("post-class")}
        />
      </>
    );
  }

  // Post-class
  const FEELING_OPTIONS = [
    { value: "great", label: "Great", emoji: "+" },
    { value: "good", label: "Good", emoji: "~" },
    { value: "okay", label: "Okay", emoji: "=" },
    { value: "tough", label: "Tough", emoji: "-" },
    { value: "too-much", label: "Too much", emoji: "!" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1a1a2e] p-4">
      <SEO title={`${cls.name} - Session Ended - Shruti Turner`} noIndex />
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-white/10 bg-[#252540] p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#4B5B32]/20">
          <Calendar className="h-8 w-8 text-[#B5C49B]" />
        </div>
        <div>
          <h2 className="text-xl text-white">
            {feedbackSubmitted ? "Thanks for sharing." : "How did that feel?"}
          </h2>
          {!feedbackSubmitted && (
            <p className="mt-2 text-sm leading-relaxed text-white/50">
              Optional — this helps Shruti track what works for your body.
            </p>
          )}
        </div>

        {/* Post-class feeling buttons */}
        {!feedbackSubmitted && (
          <div className="flex justify-center gap-2">
            {FEELING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setPostClassFeeling(opt.value);
                  submitPostClassFeedback(`att_${Date.now()}`, {
                    feeling: opt.value as any,
                  });
                  setFeedbackSubmitted(true);
                }}
                className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                  postClassFeeling === opt.value
                    ? "border-[#B5C49B]/50 bg-[#4B5B32]/30 text-[#B5C49B]"
                    : "border-white/10 text-white/60 hover:border-white/30 hover:text-white/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={() => navigate("/dashboard/schedule")}
            className="w-full bg-[#4B5B32] text-white hover:bg-[#4B5B32]/90"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Reserve Next Week
          </Button>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-2 text-sm text-white/40 transition-colors hover:text-white/60"
          >
            Return to lobby
          </button>
        </div>
        {!feedbackSubmitted && (
          <button
            onClick={() => setFeedbackSubmitted(true)}
            className="text-xs text-white/20 transition-colors hover:text-white/40"
          >
            Skip feedback
          </button>
        )}
        <p className="text-xs text-white/30">The recording will be available for 7 days.</p>
      </div>
    </div>
  );
}
