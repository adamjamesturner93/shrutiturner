import { useState, useCallback } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Maximize,
  Minimize,
  Settings,
  LogOut,
  Users,
  UserCheck,
  Eye,
  EyeOff,
  MessageSquare,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Phone,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { DeviceSelector } from "./device-selector";
import { ChatPanel } from "./chat-panel";

// ── Types ──

export type RoomMode = "live-class" | "small-group" | "retreat";

export interface VideoParticipant {
  id: string;
  name: string;
  initials: string;
  isMuted: boolean;
  isCameraOn: boolean;
  isInstructor: boolean;
  color: string;
}

interface VideoRoomProps {
  mode: RoomMode;
  isInstructor: boolean;
  className: string;
  classTime: string;
  classDuration: string;
  registeredCount: number;
  onLeave: () => void;
}

// ── Mock participants ──

const MOCK_PARTICIPANTS: VideoParticipant[] = [
  {
    id: "instructor",
    name: "Shruti Turner",
    initials: "ST",
    isMuted: false,
    isCameraOn: true,
    isInstructor: true,
    color: "#4B5B32",
  },
  {
    id: "p1",
    name: "Sarah Chen",
    initials: "SC",
    isMuted: true,
    isCameraOn: true,
    isInstructor: false,
    color: "#6B7280",
  },
  {
    id: "p2",
    name: "James Whitfield",
    initials: "JW",
    isMuted: true,
    isCameraOn: true,
    isInstructor: false,
    color: "#7C3AED",
  },
  {
    id: "p3",
    name: "Emily Richards",
    initials: "ER",
    isMuted: true,
    isCameraOn: false,
    isInstructor: false,
    color: "#2563EB",
  },
  {
    id: "p4",
    name: "Marcus Lee",
    initials: "ML",
    isMuted: true,
    isCameraOn: true,
    isInstructor: false,
    color: "#DC2626",
  },
  {
    id: "p5",
    name: "Rachel Thompson",
    initials: "RT",
    isMuted: true,
    isCameraOn: true,
    isInstructor: false,
    color: "#059669",
  },
  {
    id: "p6",
    name: "Priya Patel",
    initials: "PP",
    isMuted: true,
    isCameraOn: false,
    isInstructor: false,
    color: "#D97706",
  },
  {
    id: "p7",
    name: "Tom Bennett",
    initials: "TB",
    isMuted: true,
    isCameraOn: true,
    isInstructor: false,
    color: "#4338CA",
  },
  {
    id: "p8",
    name: "Claire Wilson",
    initials: "CW",
    isMuted: true,
    isCameraOn: true,
    isInstructor: false,
    color: "#BE185D",
  },
];

const PARTICIPANTS_PER_PAGE = 6;

export function VideoRoom({
  mode,
  isInstructor,
  className: classTitle,
  classTime,
  classDuration,
  registeredCount,
  onLeave,
}: VideoRoomProps) {
  // Local controls
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSelfView, setShowSelfView] = useState(true);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [showChat, setShowChat] = useState(mode !== "live-class");
  const [communityMode, setCommunityMode] = useState(mode !== "live-class");

  // Instructor controls
  const [participants, setParticipants] = useState(MOCK_PARTICIPANTS);
  const [gridPage, setGridPage] = useState(0);

  const joinedCount = participants.length;
  const instructor = participants.find((p) => p.isInstructor);
  const nonInstructorParticipants = participants.filter((p) => !p.isInstructor);

  // Pagination for instructor grid
  const totalPages = Math.ceil(nonInstructorParticipants.length / PARTICIPANTS_PER_PAGE);
  const pagedParticipants = nonInstructorParticipants.slice(
    gridPage * PARTICIPANTS_PER_PAGE,
    (gridPage + 1) * PARTICIPANTS_PER_PAGE
  );

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Instructor: mute specific participant
  const muteParticipant = (id: string) => {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, isMuted: true } : p)));
  };

  // Instructor: mute all
  const muteAll = () => {
    setParticipants((prev) => prev.map((p) => (p.isInstructor ? p : { ...p, isMuted: true })));
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#1a1a2e] text-white">
      {/* ── Top bar ── */}
      <header className="flex flex-shrink-0 items-center justify-between border-b border-white/5 bg-[#1a1a2e]/90 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <div className="min-w-0">
            <h1 className="truncate text-sm">{classTitle}</h1>
            <p className="text-xs text-white/50">
              {classTime} · {classDuration}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Participant count */}
          <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1.5 text-xs text-white/60">
            <Users className="h-3.5 w-3.5" />
            <span>
              {joinedCount}/{registeredCount}
            </span>
          </div>

          {/* Community mode toggle */}
          <button
            onClick={() => setCommunityMode(!communityMode)}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs transition-colors ${
              communityMode
                ? "bg-[#4B5B32] text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
            title={
              communityMode
                ? "Community mode: see and hear everyone"
                : "Focus mode: see instructor only"
            }
          >
            {communityMode ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{communityMode ? "Community" : "Focus"}</span>
          </button>

          {/* Instructor: Mute all */}
          {isInstructor && (
            <button
              onClick={muteAll}
              className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10"
              title="Mute all participants"
            >
              <VolumeX className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mute all</span>
            </button>
          )}

          {/* Leave */}
          <button
            onClick={onLeave}
            className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/30"
          >
            <Phone className="h-3.5 w-3.5 rotate-135" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </header>

      {/* ── Main content area ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className="flex flex-1 flex-col gap-3 overflow-hidden p-3">
          {isInstructor ? (
            /* ── INSTRUCTOR VIEW: See everyone ── */
            <InstructorGrid
              instructor={instructor!}
              participants={pagedParticipants}
              gridPage={gridPage}
              totalPages={totalPages}
              onPageChange={setGridPage}
              onMuteParticipant={muteParticipant}
              showSelfView={showSelfView}
            />
          ) : communityMode ? (
            /* ── PARTICIPANT: Community mode ON — See everyone ── */
            <CommunityGrid
              instructor={instructor!}
              participants={nonInstructorParticipants}
              selfId="self"
              showSelfView={showSelfView}
              isMuted={isMuted}
              isCameraOn={isCameraOn}
            />
          ) : (
            /* ── PARTICIPANT: Focus mode — Instructor only ── */
            <FocusView
              instructor={instructor!}
              showSelfView={showSelfView}
              selfMuted={isMuted}
              selfCameraOn={isCameraOn}
              participantCount={nonInstructorParticipants.length}
            />
          )}
        </div>

        {/* Chat panel (small group / retreat) */}
        {showChat && (
          <ChatPanel
            mode={mode}
            participantName={isInstructor ? "Shruti" : "You"}
            onClose={() => setShowChat(false)}
          />
        )}
      </div>

      {/* ── Bottom control bar ── */}
      <footer className="flex flex-shrink-0 items-center justify-center gap-2 border-t border-white/5 bg-[#1a1a2e]/90 px-4 py-3 sm:gap-3">
        {/* Mic */}
        <ControlButton
          active={!isMuted}
          onClick={() => setIsMuted(!isMuted)}
          icon={isMuted ? MicOff : Mic}
          label={isMuted ? "Unmute" : "Mute"}
          danger={isMuted}
        />

        {/* Camera */}
        <ControlButton
          active={isCameraOn}
          onClick={() => setIsCameraOn(!isCameraOn)}
          icon={isCameraOn ? Video : VideoOff}
          label={isCameraOn ? "Stop video" : "Start video"}
          danger={!isCameraOn}
        />

        {/* Divider */}
        <div className="mx-1 hidden h-8 w-px bg-white/10 sm:block" />

        {/* Self view */}
        <ControlButton
          active={showSelfView}
          onClick={() => setShowSelfView(!showSelfView)}
          icon={showSelfView ? UserCheck : Users}
          label={showSelfView ? "Hide self" : "Show self"}
        />

        {/* Fullscreen */}
        <ControlButton
          active={isFullscreen}
          onClick={toggleFullscreen}
          icon={isFullscreen ? Minimize : Maximize}
          label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        />

        {/* Chat toggle (only for small group / retreat) */}
        {mode !== "live-class" && (
          <ControlButton
            active={showChat}
            onClick={() => setShowChat(!showChat)}
            icon={MessageSquare}
            label={showChat ? "Hide chat" : "Show chat"}
          />
        )}

        {/* Device selector */}
        <ControlButton
          active={showDeviceSelector}
          onClick={() => setShowDeviceSelector(!showDeviceSelector)}
          icon={Settings}
          label="Devices"
        />
      </footer>

      {/* Device selector modal */}
      {showDeviceSelector && <DeviceSelector onClose={() => setShowDeviceSelector(false)} />}
    </div>
  );
}

/* ── Control button ── */

function ControlButton({
  active,
  onClick,
  icon: Icon,
  label,
  danger,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Mic;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-lg p-2 transition-colors sm:px-3 sm:py-2 ${
        danger
          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
          : active
            ? "bg-white/10 text-white hover:bg-white/15"
            : "bg-white/5 text-white/50 hover:bg-white/10"
      }`}
      title={label}
    >
      <Icon className="h-5 w-5" />
      <span className="hidden text-[10px] sm:block">{label}</span>
    </button>
  );
}

/* ── Video tile ── */

function VideoTile({
  participant,
  size = "md",
  isLocal,
  showMuteButton,
  onMute,
}: {
  participant: VideoParticipant;
  size?: "lg" | "md" | "sm" | "pip";
  isLocal?: boolean;
  showMuteButton?: boolean;
  onMute?: () => void;
}) {
  const sizeClasses = {
    lg: "min-h-[300px]",
    md: "min-h-[160px]",
    sm: "min-h-[120px]",
    pip: "w-40 h-28",
  };

  return (
    <div
      className={`relative flex-1 overflow-hidden rounded-lg ${sizeClasses[size]} ${
        size === "pip" ? "flex-none" : ""
      }`}
    >
      {/* Video / avatar area */}
      {participant.isCameraOn ? (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${participant.color}40, ${participant.color}20)`,
          }}
        >
          {/* Simulated video feed — subtle animated gradient */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full text-2xl text-white/80"
              style={{ backgroundColor: participant.color + "60" }}
            >
              {participant.initials}
            </div>
          </div>
          {/* Subtle "video active" indicator */}
          <div className="absolute top-2 left-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[#252540]">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full text-xl text-white sm:h-20 sm:w-20"
            style={{ backgroundColor: participant.color }}
          >
            {participant.initials}
          </div>
        </div>
      )}

      {/* Name + status overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {participant.isMuted && <MicOff className="h-3 w-3 text-red-400" />}
            <span className="truncate text-xs text-white/90">
              {isLocal ? `${participant.name} (You)` : participant.name}
            </span>
          </div>
          {participant.isInstructor && (
            <Badge className="bg-[#4B5B32]/80 px-1.5 py-0 text-[9px] text-white">Instructor</Badge>
          )}
        </div>
      </div>

      {/* Instructor mute button */}
      {showMuteButton && !participant.isMuted && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMute?.();
          }}
          className="absolute top-2 right-2 rounded-full bg-black/40 p-1.5 text-white transition-colors hover:bg-red-500/50"
          title={`Mute ${participant.name}`}
        >
          <VolumeX className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/* ── Instructor grid view ── */

function InstructorGrid({
  instructor,
  participants,
  gridPage,
  totalPages,
  onPageChange,
  onMuteParticipant,
  showSelfView,
}: {
  instructor: VideoParticipant;
  participants: VideoParticipant[];
  gridPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onMuteParticipant: (id: string) => void;
  showSelfView: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col gap-3 overflow-hidden">
      {/* Participant grid */}
      <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-2 md:grid-cols-3">
        {participants.map((p) => (
          <VideoTile
            key={p.id}
            participant={p}
            size="md"
            showMuteButton={true}
            onMute={() => onMuteParticipant(p.id)}
          />
        ))}
        {/* Fill empty slots */}
        {Array.from({ length: Math.max(0, PARTICIPANTS_PER_PAGE - participants.length) }).map(
          (_, i) => (
            <div
              key={`empty-${i}`}
              className="flex min-h-[160px] items-center justify-center rounded-lg border border-white/5 bg-[#252540]/50"
            >
              <span className="text-xs text-white/20">Empty</span>
            </div>
          )
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onPageChange(Math.max(0, gridPage - 1))}
            disabled={gridPage === 0}
            className="rounded-full bg-white/5 p-1.5 transition-colors hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-white/50">
            {gridPage + 1} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, gridPage + 1))}
            disabled={gridPage === totalPages - 1}
            className="rounded-full bg-white/5 p-1.5 transition-colors hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Self view PIP */}
      {showSelfView && (
        <div className="absolute right-4 bottom-20 z-10">
          <VideoTile participant={instructor} size="pip" isLocal />
        </div>
      )}
    </div>
  );
}

/* ── Community grid (participant sees everyone) ── */

function CommunityGrid({
  instructor,
  participants,
  selfId,
  showSelfView,
  isMuted,
  isCameraOn,
}: {
  instructor: VideoParticipant;
  participants: VideoParticipant[];
  selfId: string;
  showSelfView: boolean;
  isMuted: boolean;
  isCameraOn: boolean;
}) {
  const selfParticipant: VideoParticipant = {
    id: "self",
    name: "You",
    initials: "YO",
    isMuted,
    isCameraOn,
    isInstructor: false,
    color: "#4B5B32",
  };

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-hidden">
      {/* Instructor spotlight (larger) */}
      <div className="flex-[2]">
        <VideoTile participant={instructor} size="lg" />
      </div>

      {/* Participant strip */}
      <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
        {showSelfView && (
          <div className="w-36 flex-shrink-0 sm:w-44">
            <VideoTile participant={selfParticipant} size="sm" isLocal />
          </div>
        )}
        {participants.map((p) => (
          <div key={p.id} className="w-36 flex-shrink-0 sm:w-44">
            <VideoTile participant={p} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Focus view (participant sees instructor only) ── */

function FocusView({
  instructor,
  showSelfView,
  selfMuted,
  selfCameraOn,
  participantCount,
}: {
  instructor: VideoParticipant;
  showSelfView: boolean;
  selfMuted: boolean;
  selfCameraOn: boolean;
  participantCount: number;
}) {
  const selfParticipant: VideoParticipant = {
    id: "self",
    name: "You",
    initials: "YO",
    isMuted: selfMuted,
    isCameraOn: selfCameraOn,
    isInstructor: false,
    color: "#4B5B32",
  };

  return (
    <div className="relative flex-1">
      {/* Instructor fills the space */}
      <VideoTile participant={instructor} size="lg" />

      {/* Audio indicator — you can hear others */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1.5 text-xs text-white/60">
        <Users className="h-3 w-3" />
        <span>{participantCount} others listening</span>
      </div>

      {/* Self view PIP */}
      {showSelfView && (
        <div className="absolute right-4 bottom-4">
          <VideoTile participant={selfParticipant} size="pip" isLocal />
        </div>
      )}
    </div>
  );
}
