import { useEffect, useMemo, useRef, useState } from "react";
import { MicOff, VideoOff } from "lucide-react";
import {
  attachTrack,
  getPreviewStream,
  loadSavedDeviceSettings,
  stopMediaStream,
  type SavedDeviceSettings,
} from "@/lib/daily/client";

type LocalMediaPreviewProps = {
  cameraEnabled: boolean;
  micEnabled: boolean;
  className?: string;
  emptyLabel?: string;
};

export function LocalMediaPreview({
  cameraEnabled,
  micEnabled,
  className = "",
  emptyLabel = "Camera off",
}: LocalMediaPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<SavedDeviceSettings>(() => loadSavedDeviceSettings());
  const activeStream = cameraEnabled || micEnabled ? stream : null;

  useEffect(() => {
    const refresh = () => setSettings(loadSavedDeviceSettings());
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  useEffect(() => {
    let active = true;
    if (!cameraEnabled && !micEnabled) return;

    void (async () => {
      try {
        const nextStream = await getPreviewStream(settings, {
          camera: cameraEnabled,
          mic: micEnabled,
        });
        if (!active) {
          stopMediaStream(nextStream);
          return;
        }
        setError("");
        setStream((previous) => {
          stopMediaStream(previous);
          return nextStream;
        });
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Unable to access camera");
        setStream((previous) => {
          stopMediaStream(previous);
          return null;
        });
      }
    })();

    return () => {
      active = false;
    };
  }, [cameraEnabled, micEnabled, settings]);

  useEffect(() => {
    if (cameraEnabled || micEnabled || !stream) return;
    stopMediaStream(stream);
  }, [cameraEnabled, micEnabled, stream]);

  useEffect(() => {
    const element = videoRef.current;
    attachTrack(element, activeStream?.getVideoTracks()[0] || null, true);
    return () => {
      if (element) {
        element.srcObject = null;
      }
    };
  }, [activeStream]);

  useEffect(() => {
    return () => stopMediaStream(stream);
  }, [stream]);

  const hasVideo = useMemo(
    () => Boolean(activeStream?.getVideoTracks().length && cameraEnabled),
    [activeStream, cameraEnabled]
  );

  if (!hasVideo) {
    return (
      <div className={`bg-video-panel flex items-center justify-center ${className}`.trim()}>
        <div className="space-y-2 text-center text-white/70">
          {cameraEnabled ? (
            <VideoOff className="mx-auto h-10 w-10" />
          ) : (
            <VideoOff className="mx-auto h-10 w-10" />
          )}
          <p className="text-xs">{error ? "Camera unavailable" : emptyLabel}</p>
          {!micEnabled && (
            <div className="text-caption inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2 py-1 text-red-300">
              <MicOff className="h-3 w-3" />
              Muted
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-video-canvas relative overflow-hidden ${className}`.trim()}>
      <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
      {!micEnabled && (
        <div className="text-caption absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2 py-1 text-red-300">
          <MicOff className="h-3 w-3" />
          Muted
        </div>
      )}
    </div>
  );
}
