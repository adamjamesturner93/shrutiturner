"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardLayout } from "../../components/dashboard-layout";
import { Button } from "../../components/ui/button";
import { useState } from "react";
import {
  ArrowLeft,
  Video,
  Calendar,
  Check,
  CheckCircle,
  Users,
  Play,
} from "lucide-react";
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
      { week: 1, session: 1, title: "Assessment & Baseline", completed: true, recordingAvailable: true },
      { week: 1, session: 2, title: "Rotator Cuff Foundations", completed: true, recordingAvailable: true },
      { week: 2, session: 1, title: "Scapular Stability", completed: true, recordingAvailable: true },
      { week: 2, session: 2, title: "Overhead Mobility Prep", completed: false, upcoming: true, recordingAvailable: false },
      { week: 3, session: 1, title: "Loaded Overhead Work", completed: false, recordingAvailable: false },
      { week: 3, session: 2, title: "Integration & Practice", completed: false, recordingAvailable: false },
    ],
  };

  const upcomingSession = program.sessions.find((s) => s.upcoming);

  // Recording playback
  if (stage === "recording" && activeRecording) {
    const session = program.sessions.find((s) => s.title === activeRecording);
    return (
      <div className="fixed inset-0 z-[100] bg-[#1a1a2e] flex flex-col">
        <SEO title={`Recording: ${activeRecording} - Shruti Turner`} noIndex />
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="text-white">
            <p className="text-sm text-white/50">Programme Recording</p>
            <p className="text-base">{program.title}: {activeRecording}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white"
            onClick={() => { setStage("detail"); setActiveRecording(null); }}
          >
            Close
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-[#4B5B32]/30 mx-auto flex items-center justify-center">
              <Play className="w-10 h-10 text-[#B5C49B] ml-1" />
            </div>
            <p className="text-white/70 text-sm">
              Session recording playback
            </p>
            <p className="text-white/40 text-xs">
              [In production: Daily.co recording embed]
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Pre-join lobby
  if (stage === "pre-join") {
    return (
      <>
        <SEO
          title={`Joining ${upcomingSession?.title || program.title} - Shruti Turner`}
          noIndex
        />
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
        <SEO
          title={`${upcomingSession?.title || program.title} - Live - Shruti Turner`}
          noIndex
        />
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
      <div className="fixed inset-0 z-[100] bg-[#1a1a2e] flex items-center justify-center p-4">
        <SEO title={`Session Complete - Shruti Turner`} noIndex />
        <div className="bg-[#252540] border border-white/10 rounded-xl max-w-sm w-full p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#4B5B32]/20 mx-auto flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-[#B5C49B]" />
          </div>
          <div>
            <h2 className="text-xl text-white">Session complete</h2>
            <p className="text-sm text-white/50 mt-2 leading-relaxed">
              Well done. Your progress has been updated.
            </p>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => setStage("detail")}
              className="w-full bg-[#4B5B32] hover:bg-[#4B5B32]/90 text-white"
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
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Programs
        </Link>
      </nav>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h1 className="text-3xl mb-2">{program.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {program.duration}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {program.cohortSize} in cohort
              </span>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl">Progress</h2>
              <span className="text-sm text-muted-foreground">
                {program.progress} / {program.totalSessions} sessions
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3">
              <div
                className="bg-[#4B5B32] h-3 rounded-full transition-all"
                style={{ width: `${(program.progress / program.totalSessions) * 100}%` }}
              />
            </div>
          </div>

          {/* Sessions */}
          <div>
            <h2 className="text-xl mb-4">Sessions</h2>
            <div className="space-y-3">
              {program.sessions.map((session, i) => (
                <div
                  key={i}
                  className={`border rounded-lg p-4 flex items-center justify-between ${
                    session.completed
                      ? "bg-[#4B5B32]/5 border-[#4B5B32]/20"
                      : session.upcoming
                      ? "border-primary"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        session.completed
                          ? "bg-[#4B5B32] text-[#FAFAF8]"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {session.completed ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <span className="text-xs">W{session.week}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm">{session.title}</p>
                      <p className="text-xs text-muted-foreground">
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
          <div className="bg-background border rounded-lg p-6 space-y-4 sticky top-6">
            <h3 className="text-lg">Your Cohort</h3>
            <div className="space-y-3">
              {["You", "Emma T.", "Marcus L.", "Priya K.", "Alex R."].map((name, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs">
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
