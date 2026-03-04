import { useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Settings,
  ArrowRight,
  Clock,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { DeviceSelector } from "./device-selector";
import type { RoomMode } from "./video-room";

interface PreJoinLobbyProps {
  className: string;
  classTime: string;
  classDuration: string;
  classLevel: string;
  instructor: string;
  equipment: string[];
  registeredCount: number;
  maxSpaces: number;
  mode: RoomMode;
  onJoin: (settings: { isMuted: boolean; isCameraOn: boolean }) => void;
  onBack: () => void;
}

export function PreJoinLobby({
  className: classTitle,
  classTime,
  classDuration,
  classLevel,
  instructor,
  equipment,
  registeredCount,
  maxSpaces,
  mode,
  onJoin,
  onBack,
}: PreJoinLobbyProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1a1a2e] p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl text-white">{classTitle}</h1>
          <div className="mt-2 flex items-center justify-center gap-4 text-sm text-white/50">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {classTime} · {classDuration}
            </span>
            <span>{instructor}</span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {registeredCount}/{maxSpaces}
            </span>
          </div>
          {mode !== "live-class" && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <Badge className="border-[#4B5B32]/30 bg-[#4B5B32]/20 text-[#B5C49B]">
                <Eye className="mr-1 h-3 w-3" />
                Community mode on by default
              </Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Self preview */}
          <div className="space-y-4">
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-[#252540]">
              {isCameraOn ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#4B5B32]/30 to-[#2E1F33]/30">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#4B5B32]/60 text-2xl text-white">
                    YO
                  </div>
                  <div className="absolute top-3 left-3 h-2 w-2 rounded-full bg-green-500" />
                </div>
              ) : (
                <div className="space-y-2 text-center">
                  <VideoOff className="mx-auto h-10 w-10 text-white/30" />
                  <p className="text-xs text-white/30">Camera off</p>
                </div>
              )}

              {/* Mute indicator */}
              {isMuted && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-400">
                  <MicOff className="h-3 w-3" />
                  Muted
                </div>
              )}
            </div>

            {/* Quick controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`rounded-full p-3 transition-colors ${
                  isMuted
                    ? "bg-red-500/20 text-red-400"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setIsCameraOn(!isCameraOn)}
                className={`rounded-full p-3 transition-colors ${
                  !isCameraOn
                    ? "bg-red-500/20 text-red-400"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setShowDeviceSelector(true)}
                className="rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/15"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Class info & join */}
          <div className="flex flex-col justify-center space-y-6">
            {/* Equipment reminder */}
            <div className="rounded-lg bg-white/5 p-4">
              <p className="mb-2 text-xs tracking-wider text-white/50 uppercase">
                Equipment needed
              </p>
              <ul className="space-y-1">
                {equipment.slice(0, 4).map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-white/70">
                    <span className="mt-1 text-[#B5C49B]">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Class info */}
            <div className="space-y-2 rounded-lg bg-white/5 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Level</span>
                <span className="text-white/80">{classLevel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">View mode</span>
                <span className="text-white/80">
                  {mode === "live-class" ? "Focus (instructor only)" : "Community (see everyone)"}
                </span>
              </div>
              {mode !== "live-class" && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Chat</span>
                  <span className="text-white/80">Enabled</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={() => onJoin({ isMuted, isCameraOn })}
                className="h-12 w-full bg-[#4B5B32] text-white hover:bg-[#4B5B32]/90"
              >
                Join Class
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <button
                onClick={onBack}
                className="w-full py-2 text-sm text-white/40 transition-colors hover:text-white/60"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Device selector */}
      {showDeviceSelector && <DeviceSelector onClose={() => setShowDeviceSelector(false)} />}
    </div>
  );
}
