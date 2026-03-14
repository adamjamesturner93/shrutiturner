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
  EyeOff,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { DeviceSelector } from "./device-selector";
import { LocalMediaPreview } from "./local-media-preview";
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
    <div className="bg-video-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4">
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
              <Badge className="border-brand-accent/30 bg-brand-accent/20 text-brand-accent-light">
                <EyeOff className="mr-1 h-3 w-3" />
                Starts in focus mode
              </Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Self preview */}
          <div className="space-y-4">
            <LocalMediaPreview
              cameraEnabled={isCameraOn}
              micEnabled={!isMuted}
              className="aspect-video rounded-xl"
            />

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
                    <span className="text-brand-accent-light mt-1">·</span>
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
                  {mode === "live-class"
                    ? "Focus (instructor only)"
                    : "Focus to start, instructor can enable community"}
                </span>
              </div>
              {mode !== "live-class" && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Community mode</span>
                  <span className="text-white/80">Instructor controlled</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={() => onJoin({ isMuted, isCameraOn })}
                className="bg-brand-accent hover:bg-brand-accent/90 h-12 w-full text-white"
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
