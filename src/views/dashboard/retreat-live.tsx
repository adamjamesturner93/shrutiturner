"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Video } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { PreJoinLobby } from "@/components/video/pre-join-lobby";
import { VideoRoom } from "@/components/video/video-room";

export type RetreatLiveLanding = {
  bookingId: string;
  retreatDateId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  capacity: number;
  state:
    | "registration_incomplete"
    | "cancelled"
    | "scheduled"
    | "waiting_room"
    | "pre_join"
    | "live"
    | "ended"
    | "replay_available";
  roomState: "unprepared" | "prepared" | "started" | "ended";
  displayMode: "gallery" | "presenter";
  displayVersion: number;
  focusedPresenterUserId: string | null;
  chatEnabled: boolean;
  isRecorded: boolean;
  recordingNotice: string | null;
  retentionNotice: string | null;
  defaultMicMuted: boolean;
  defaultCameraOff: boolean;
  registrationIncomplete: boolean;
  setupMissing: string[];
  requiredAcceptances: Array<{ type: string }>;
  replayAssetId: string | null;
};

function formatDateTime(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
    timeZoneName: "short",
  }).format(new Date(value));
}

function durationLabel(start: string, end: string) {
  const minutes = Math.max(
    1,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  );
  return minutes >= 60
    ? `${Math.floor(minutes / 60)} hr ${minutes % 60 || ""}`.trim()
    : `${minutes} min`;
}

function StateCard({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <DashboardLayout title="Online retreat">
      <main className="mx-auto max-w-2xl py-12">
        <div className="marketing-panel rounded-[1.75rem] p-7 text-center md:p-10">
          <div className="bg-brand-accent/10 text-brand-accent mx-auto flex h-14 w-14 items-center justify-center rounded-full">
            <Video className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-3xl">{title}</h1>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl leading-relaxed">{body}</p>
          {children ? (
            <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>
          ) : null}
        </div>
      </main>
    </DashboardLayout>
  );
}

function RetreatReplay({ assetId, title }: { assetId: string; title: string }) {
  const [playbackUrl, setPlaybackUrl] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    setError("");
    const response = await fetch(`/api/me/replays/${assetId}`, { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as {
      playbackUrl?: string;
      message?: string;
    } | null;
    if (!response.ok || !payload?.playbackUrl) {
      setError(payload?.message || "Replay is not available.");
      return;
    }
    setPlaybackUrl(payload.playbackUrl);
  };
  return (
    <StateCard
      title={`${title} replay`}
      body="Your replay is ready and available until the expiry shown in your retreat details."
    >
      {playbackUrl ? (
        <video className="mt-4 w-full rounded-xl bg-black" controls src={playbackUrl} />
      ) : (
        <Button onClick={() => void load()}>Play replay</Button>
      )}
      {error ? (
        <p className="w-full text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </StateCard>
  );
}

export function DashboardRetreatLive({ initialData }: { initialData: RetreatLiveLanding }) {
  const router = useRouter();
  const [entered, setEntered] = useState(false);
  const [initialMuted, setInitialMuted] = useState(initialData.defaultMicMuted);
  const [initialCameraOn, setInitialCameraOn] = useState(!initialData.defaultCameraOff);

  if (initialData.state === "registration_incomplete") {
    return (
      <StateCard
        title="Finish your retreat registration"
        body="Before joining, complete the workshop setup checklist for your account, health profile and current agreements."
      >
        <Button asChild>
          <Link href={`/dashboard/retreats/${initialData.bookingId}/setup`}>
            Finish workshop setup
          </Link>
        </Button>
      </StateCard>
    );
  }
  if (initialData.state === "cancelled") {
    return (
      <StateCard
        title="This workshop has been cancelled"
        body="The room and replay are no longer available. The purchaser will receive refund updates by email."
      >
        <Button variant="outline" asChild>
          <Link href="/contact">Contact Shruti</Link>
        </Button>
      </StateCard>
    );
  }
  if (initialData.state === "replay_available" && initialData.replayAssetId) {
    return <RetreatReplay assetId={initialData.replayAssetId} title={initialData.title} />;
  }
  if (initialData.state === "ended") {
    return (
      <StateCard
        title="This retreat has ended"
        body="If a replay is recorded, it will appear here only after a staff administrator publishes it."
      />
    );
  }
  if (initialData.state === "scheduled") {
    return (
      <StateCard
        title={initialData.title}
        body={`Your secure room opens closer to ${formatDateTime(initialData.startsAt, initialData.timezone)}.`}
      >
        <Button variant="outline" asChild>
          <a href={`/api/retreats/bookings/${initialData.bookingId}/calendar`}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Add to calendar
          </a>
        </Button>
      </StateCard>
    );
  }
  if (initialData.state === "waiting_room") {
    return (
      <StateCard
        title="The host is preparing the room"
        body="You are in the right place. Refresh shortly; the secure device check will appear as soon as the room is prepared."
      >
        <Button onClick={() => window.location.reload()}>Check again</Button>
        <Button variant="outline" asChild>
          <Link href="/contact">Get support</Link>
        </Button>
      </StateCard>
    );
  }
  if (entered) {
    return (
      <VideoRoom
        sessionId={initialData.bookingId}
        roomTokenEndpoint={`/api/retreats/bookings/${initialData.bookingId}/room-token`}
        attendanceEndpoint={`/api/retreats/bookings/${initialData.bookingId}/attendance`}
        chatEndpoint={`/api/retreats/live/${initialData.retreatDateId}/chat`}
        mode="retreat"
        isInstructor={false}
        className={initialData.title}
        classTime={formatDateTime(initialData.startsAt, initialData.timezone)}
        classDuration={durationLabel(initialData.startsAt, initialData.endsAt)}
        registeredCount={initialData.capacity}
        initialMuted={initialMuted}
        initialCameraOn={initialCameraOn}
        initialCommunityMode={initialData.displayMode === "gallery"}
        isRecorded={initialData.isRecorded}
        chatEnabled={initialData.chatEnabled}
        onLeave={() => setEntered(false)}
      />
    );
  }
  return (
    <PreJoinLobby
      className={initialData.title}
      classTime={formatDateTime(initialData.startsAt, initialData.timezone)}
      classDuration={durationLabel(initialData.startsAt, initialData.endsAt)}
      classLevel="Accessible options provided"
      instructor="Retreat host"
      equipment={["A quiet space", "Water", "Any retreat materials shared in advance"]}
      registeredCount={initialData.capacity}
      maxSpaces={initialData.capacity}
      mode="retreat"
      defaultMicMuted={initialData.defaultMicMuted}
      defaultCameraOff={initialData.defaultCameraOff}
      isRecorded={initialData.isRecorded}
      chatEnabled={initialData.chatEnabled}
      onJoin={(settings) => {
        setInitialMuted(settings.isMuted);
        setInitialCameraOn(settings.isCameraOn);
        setEntered(true);
      }}
      onBack={() => router.push(`/dashboard/retreats/${initialData.bookingId}`)}
    />
  );
}
