"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
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
};

export function DashboardRetreatHostLive({ initialData }: { initialData: HostState }) {
  const [roomState, setRoomState] = useState(initialData.roomState);
  const [entered, setEntered] = useState(false);
  const lifecycle = async (action: string) => {
    const response = await fetch(`/api/retreats/host/${initialData.retreatDateId}/lifecycle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!response.ok) throw new Error("Unable to update session.");
    return response.json();
  };
  if (roomState === "ended" && !entered) {
    return (
      <DashboardLayout title="Online retreat">
        <div className="mx-auto max-w-xl py-16 text-center">
          <h1 className="text-3xl">Session ended</h1>
          <p className="text-muted-foreground mt-3">
            Attendance and the retained transcript remain available to authorised staff.
          </p>
        </div>
      </DashboardLayout>
    );
  }
  if (!entered) {
    return (
      <DashboardLayout title="Host online retreat">
        <div className="marketing-panel mx-auto max-w-2xl rounded-[1.75rem] p-8 text-center">
          <h1 className="text-3xl">{initialData.title}</h1>
          <p className="text-muted-foreground mt-3">
            {initialData.registeredCount} registered · capacity {initialData.capacity}
          </p>
          <p className="text-muted-foreground mt-2">
            Starting prepares the Daily room if needed. Assigned instructors receive access only to
            this retreat.
          </p>
          <Button
            className="mt-6"
            onClick={async () => {
              await lifecycle("start");
              setRoomState("started");
              setEntered(true);
            }}
          >
            Start session and enter
          </Button>
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
      isRecorded={initialData.isRecorded}
      chatEnabled={initialData.chatEnabled}
      onLeave={() => setEntered(false)}
      onEndSession={async () => {
        await lifecycle("end");
        setRoomState("ended");
      }}
      onStartRecording={initialData.isRecorded ? () => lifecycle("start_recording") : undefined}
      onStopRecording={initialData.isRecorded ? () => lifecycle("stop_recording") : undefined}
    />
  );
}
