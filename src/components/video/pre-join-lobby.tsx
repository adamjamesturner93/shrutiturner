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
    <div className="fixed inset-0 z-[100] bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl text-white">{classTitle}</h1>
          <div className="flex items-center justify-center gap-4 mt-2 text-sm text-white/50">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {classTime} · {classDuration}
            </span>
            <span>{instructor}</span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {registeredCount}/{maxSpaces}
            </span>
          </div>
          {mode !== "live-class" && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge className="bg-[#4B5B32]/20 text-[#B5C49B] border-[#4B5B32]/30">
                <Eye className="w-3 h-3 mr-1" />
                Community mode on by default
              </Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Self preview */}
          <div className="space-y-4">
            <div className="aspect-video rounded-xl overflow-hidden bg-[#252540] flex items-center justify-center relative">
              {isCameraOn ? (
                <div className="absolute inset-0 bg-gradient-to-br from-[#4B5B32]/30 to-[#2E1F33]/30 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-[#4B5B32]/60 flex items-center justify-center text-white text-2xl">
                    YO
                  </div>
                  <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-green-500" />
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <VideoOff className="w-10 h-10 text-white/30 mx-auto" />
                  <p className="text-xs text-white/30">Camera off</p>
                </div>
              )}

              {/* Mute indicator */}
              {isMuted && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs">
                  <MicOff className="w-3 h-3" />
                  Muted
                </div>
              )}
            </div>

            {/* Quick controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-full transition-colors ${
                  isMuted
                    ? "bg-red-500/20 text-red-400"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => setIsCameraOn(!isCameraOn)}
                className={`p-3 rounded-full transition-colors ${
                  !isCameraOn
                    ? "bg-red-500/20 text-red-400"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                {isCameraOn ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => setShowDeviceSelector(true)}
                className="p-3 rounded-full bg-white/10 text-white hover:bg-white/15 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Class info & join */}
          <div className="flex flex-col justify-center space-y-6">
            {/* Equipment reminder */}
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                Equipment needed
              </p>
              <ul className="space-y-1">
                {equipment.slice(0, 4).map((item) => (
                  <li
                    key={item}
                    className="text-sm text-white/70 flex items-start gap-2"
                  >
                    <span className="text-[#B5C49B] mt-1">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Class info */}
            <div className="bg-white/5 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Level</span>
                <span className="text-white/80">{classLevel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">View mode</span>
                <span className="text-white/80">
                  {mode === "live-class"
                    ? "Focus (instructor only)"
                    : "Community (see everyone)"}
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
                className="w-full bg-[#4B5B32] hover:bg-[#4B5B32]/90 text-white h-12"
              >
                Join Class
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <button
                onClick={onBack}
                className="w-full text-sm text-white/40 hover:text-white/60 transition-colors py-2"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Device selector */}
      {showDeviceSelector && (
        <DeviceSelector onClose={() => setShowDeviceSelector(false)} />
      )}
    </div>
  );
}
