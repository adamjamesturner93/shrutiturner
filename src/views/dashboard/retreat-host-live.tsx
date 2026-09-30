"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { VideoRoom } from "@/components/video/video-room";

type HostState = {
  retreatDateId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  capacity: number;
  registeredCount: number;
  roomState: "unprepared" | "prepared" | "started" | "ended";
  displayMode: "gallery" | "presenter";
  chatEnabled: boolean;
  isRecorded: boolean;
  recordingState: "idle" | "recording" | "stopped" | "failed";
};

export function DashboardRetreatHostLive({
  initialData,
  returnHref = "/dashboard",
}: {
  initialData: HostState;
  returnHref?: string;
}) {
  const [roomState, setRoomState] = useState(initialData.roomState);
  const router = useRouter();
  const lifecycle = async (action: string) => {
    const response = await fetch(`/api/retreats/host/${initialData.retreatDateId}/lifecycle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    if (!response.ok) throw new Error(payload?.message || "Unable to update session.");
    return payload;
  };
  if (roomState === "ended") {
    return (
      <DashboardLayout title="Online retreat">
        <div className="mx-auto max-w-xl py-16 text-center">
          <h1 className="text-3xl">Session ended</h1>
          <p className="text-muted-foreground mt-3">
            The workshop has finished. You can review attendance and session details from the event
            page.
          </p>
          <Link className="mt-4 inline-block underline" href={returnHref}>
            Back to event
          </Link>
        </div>
      </DashboardLayout>
    );
  }
  return (
    <VideoRoom
      sessionId={initialData.retreatDateId}
      roomTokenEndpoint={`/api/retreats/host/${initialData.retreatDateId}/room-token`}
      attendanceEndpoint={null}
      chatEndpoint={`/api/retreats/live/${initialData.retreatDateId}/chat`}
      displayModeEndpoint={`/api/retreats/host/${initialData.retreatDateId}/display-mode`}
      moderationEndpoint={`/api/retreats/host/${initialData.retreatDateId}/moderation`}
      mode="retreat"
      isInstructor
      className={initialData.title}
      classTime={new Date(initialData.startsAt).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: initialData.timezone,
      })}
      classDuration={`${Math.max(1, Math.round((new Date(initialData.endsAt).getTime() - new Date(initialData.startsAt).getTime()) / 60000))} min`}
      registeredCount={initialData.registeredCount}
      initialCommunityMode={initialData.displayMode === "gallery"}
      initialRecording={initialData.recordingState === "recording"}
      isRecorded={initialData.isRecorded}
      chatEnabled={initialData.chatEnabled}
      onLeave={(reason) => {
        if (reason === "ended") {
          setRoomState("ended");
          return;
        }
        router.push(returnHref);
        router.refresh();
      }}
      onStartSession={
        roomState !== "started"
          ? async () => {
              await lifecycle("start");
              setRoomState("started");
            }
          : undefined
      }
      onEndSession={
        roomState === "started"
          ? async () => {
              await lifecycle("end");
            }
          : undefined
      }
      onStartRecording={
        initialData.isRecorded && roomState === "started"
          ? async () => void (await lifecycle("start_recording"))
          : undefined
      }
      onStopRecording={
        initialData.isRecorded && roomState === "started"
          ? async () => void (await lifecycle("stop_recording"))
          : undefined
      }
    />
  );
}
