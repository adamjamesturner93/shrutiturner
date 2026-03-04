"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardLayout } from "../../components/dashboard-layout";
import { Button } from "../../components/ui/button";
import { useState } from "react";
import { ArrowLeft, Video, Calendar, Check, CheckCircle, Users, Play } from "lucide-react";
import { PreJoinLobby } from "../../components/video/pre-join-lobby";
import { VideoRoom } from "../../components/video/video-room";
import { SEO } from "../../components/seo";
import { useI18n } from "../../lib/use-i18n";

type Stage = "detail" | "pre-join" | "live" | "post-session" | "recording";

export function DashboardProgramDetail() {
  const { id } = useParams<{ id: string }>();
  const [stage, setStage] = useState<Stage>("detail");
  const [activeRecording, setActiveRecording] = useState<string | null>(null);
  const { fmtDate } = useI18n();

  // Mock program data
  const program = {
    title: "Shoulder Resilience & Mobility",
    duration: "6 weeks",
    startDate: "2026-03-17",
    progress: 3,
    totalSessions: 12,
    cohortSize: 5,
    sessions: [
      {
        week: 1,
        session: 1,
        title: "Assessment & Baseline",
        completed: true,
        recordingAvailable: true,
      },
      {
        week: 1,
        session: 2,
        title: "Rotator Cuff Foundations",
        completed: true,
        recordingAvailable: true,
      },
      {
        week: 2,
        session: 1,
        title: "Scapular Stability",
        completed: true,
        recordingAvailable: true,
      },
      {
        week: 2,
        session: 2,
        title: "Overhead Mobility Prep",
        completed: false,
        upcoming: true,
        recordingAvailable: false,
      },
      {
        week: 3,
        session: 1,
        title: "Loaded Overhead Work",
        completed: false,
        recordingAvailable: false,
      },
      {
        week: 3,
        session: 2,
        title: "Integration & Practice",
        completed: false,
        recordingAvailable: false,
      },
    ],
  };

  const upcomingSession = program.sessions.find((s) => s.upcoming);

  // Recording playback
  if (stage === "recording" && activeRecording) {
    const session = program.sessions.find((s) => s.title === activeRecording);
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-[#1a1a2e]">
        <SEO title={`Recording: ${activeRecording} - Shruti Turner`} noIndex />
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="text-white">
            <p className="text-sm text-white/50">Programme Recording</p>
            <p className="text-base">
              {program.title}: {activeRecording}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white"
            onClick={() => {
              setStage("detail");
              setActiveRecording(null);
            }}
          >
            Close
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#4B5B32]/30">
              <Play className="ml-1 h-10 w-10 text-[#B5C49B]" />
            </div>
            <p className="text-sm text-white/70">Session recording playback</p>
            <p className="text-xs text-white/40">[In production: Daily.co recording embed]</p>
          </div>
        </div>
      </div>
    );
  }

  // Pre-join lobby
  if (stage === "pre-join") {
    return (
      <>
        <SEO title={`Joining ${upcomingSession?.title || program.title} - Shruti Turner`} noIndex />
        <PreJoinLobby
          className={`${program.title}: ${upcomingSession?.title || "Session"}`}
          classTime="11:00"
          classDuration="45 min"
          classLevel="Programme"
          instructor="Shruti Turner"
          equipment={[
            "Light dumbbells (2-5kg)",
            "Resistance band (light-medium)",
            "Yoga mat",
            "Chair for support",
          ]}
          registeredCount={program.cohortSize}
          maxSpaces={program.cohortSize}
          mode="small-group"
          onJoin={() => setStage("live")}
          onBack={() => setStage("detail")}
        />
      </>
    );
  }

  // Live video room
  if (stage === "live") {
    return (
      <>
        <SEO title={`${upcomingSession?.title || program.title} - Live - Shruti Turner`} noIndex />
        <VideoRoom
          mode="small-group"
          isInstructor={false}
          className={`${program.title}: ${upcomingSession?.title || "Session"}`}
          classTime="11:00"
          classDuration="45 min"
          registeredCount={program.cohortSize}
          onLeave={() => setStage("post-session")}
        />
      </>
    );
  }

  // Post-session
  if (stage === "post-session") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1a1a2e] p-4">
        <SEO title={`Session Complete - Shruti Turner`} noIndex />
        <div className="w-full max-w-sm space-y-6 rounded-xl border border-white/10 bg-[#252540] p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#4B5B32]/20">
            <CheckCircle className="h-8 w-8 text-[#B5C49B]" />
          </div>
          <div>
            <h2 className="text-xl text-white">Session complete</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/50">
              Well done. Your progress has been updated.
            </p>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => setStage("detail")}
              className="w-full bg-[#4B5B32] text-white hover:bg-[#4B5B32]/90"
            >
              Back to Programme
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title={`${program.title} - Private Studio`}>
      <nav className="mb-6">
        <Link
          href="/dashboard/programs"
          className="text-muted-foreground hover:text-primary inline-flex items-center text-sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Programs
        </Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div>
            <h1 className="mb-2 text-3xl">{program.title}</h1>
            <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {program.duration}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {program.cohortSize} in cohort
              </span>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xl">Progress</h2>
              <span className="text-muted-foreground text-sm">
                {program.progress} / {program.totalSessions} sessions
              </span>
            </div>
            <div className="bg-secondary h-3 w-full rounded-full">
              <div
                className="h-3 rounded-full bg-[#4B5B32] transition-all"
                style={{ width: `${(program.progress / program.totalSessions) * 100}%` }}
              />
            </div>
          </div>

          {/* Sessions */}
          <div>
            <h2 className="mb-4 text-xl">Sessions</h2>
            <div className="space-y-3">
              {program.sessions.map((session, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-lg border p-4 ${
                    session.completed
                      ? "border-[#4B5B32]/20 bg-[#4B5B32]/5"
                      : session.upcoming
                        ? "border-primary"
                        : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        session.completed
                          ? "bg-[#4B5B32] text-[#FAFAF8]"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {session.completed ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <span className="text-xs">W{session.week}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm">{session.title}</p>
                      <p className="text-muted-foreground text-xs">
                        Week {session.week}, Session {session.session}
                      </p>
                    </div>
                  </div>
                  {session.upcoming && (
                    <Button size="sm" onClick={() => setStage("pre-join")}>
                      <Video className="mr-2 h-3.5 w-3.5" />
                      Join
                    </Button>
                  )}
                  {session.completed && session.recordingAvailable && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveRecording(session.title);
                        setStage("recording");
                      }}
                    >
                      <Play className="mr-1.5 h-3.5 w-3.5" />
                      Recording
                    </Button>
                  )}
                  {session.completed && !session.recordingAvailable && (
                    <span className="text-xs text-[#4B5B32]">Completed</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-background sticky top-6 space-y-4 rounded-lg border p-6">
            <h3 className="text-lg">Your Cohort</h3>
            <div className="space-y-3">
              {["You", "Emma T.", "Marcus L.", "Priya K.", "Alex R."].map((name, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="bg-secondary flex h-8 w-8 items-center justify-center rounded-full text-xs">
                    {name[0]}
                  </div>
                  <span className="text-sm">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
