import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Mic, Video, Volume2, X } from "lucide-react";
import { Button } from "../ui/button";
import {
  attachTrack,
  getPreviewStream,
  listMediaDevices,
  loadSavedDeviceSettings,
  saveDeviceSettings,
  stopMediaStream,
  type SavedDeviceSettings,
} from "@/lib/daily/client";

interface DeviceSelectorProps {
  onClose: () => void;
  onApply?: (settings: SavedDeviceSettings) => Promise<void> | void;
}

interface DeviceOption {
  id: string;
  label: string;
}

function toDeviceLabel(kind: "camera" | "microphone" | "speaker", label: string, index: number) {
  if (label.trim()) return label;
  if (kind === "camera") return `Camera ${index + 1}`;
  if (kind === "microphone") return `Microphone ${index + 1}`;
  return `Speaker ${index + 1}`;
}

export function DeviceSelector({ onClose, onApply }: DeviceSelectorProps) {
  const initialSettings = useMemo(() => loadSavedDeviceSettings(), []);
  const [selectedCamera, setSelectedCamera] = useState(initialSettings.cameraId);
  const [selectedMic, setSelectedMic] = useState(initialSettings.micId);
  const [selectedSpeaker, setSelectedSpeaker] = useState(initialSettings.speakerId);
  const [cameras, setCameras] = useState<DeviceOption[]>([]);
  const [mics, setMics] = useState<DeviceOption[]>([]);
  const [speakers, setSpeakers] = useState<DeviceOption[]>([]);
  const [permissionError, setPermissionError] = useState("");
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [testingSpeaker, setTestingSpeaker] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const displayMicLevel = previewStream?.getAudioTracks().length ? micLevel : 0;

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const dialog = closeButtonRef.current?.closest<HTMLElement>("[role=dialog]");
      const focusable = dialog?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [onClose]);

  useEffect(() => {
    let active = true;

    const loadDevices = async () => {
      const devices = await listMediaDevices();
      if (!active) return;

      const nextCameras = devices
        .filter((device) => device.kind === "videoinput")
        .map((device, index) => ({
          id: device.deviceId,
          label: toDeviceLabel("camera", device.label, index),
        }));
      const nextMics = devices
        .filter((device) => device.kind === "audioinput")
        .map((device, index) => ({
          id: device.deviceId,
          label: toDeviceLabel("microphone", device.label, index),
        }));
      const nextSpeakers = devices
        .filter((device) => device.kind === "audiooutput")
        .map((device, index) => ({
          id: device.deviceId,
          label: toDeviceLabel("speaker", device.label, index),
        }));

      setCameras(nextCameras);
      setMics(nextMics);
      setSpeakers(nextSpeakers);
      setSelectedCamera((current) => current || nextCameras[0]?.id || "");
      setSelectedMic((current) => current || nextMics[0]?.id || "");
      setSelectedSpeaker((current) => current || nextSpeakers[0]?.id || "");
    };

    void loadDevices();
    navigator.mediaDevices?.addEventListener?.("devicechange", loadDevices);

    return () => {
      active = false;
      navigator.mediaDevices?.removeEventListener?.("devicechange", loadDevices);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const settings = {
      cameraId: selectedCamera,
      micId: selectedMic,
      speakerId: selectedSpeaker,
    };

    void (async () => {
      try {
        const nextStream = await getPreviewStream(settings);
        if (!active) {
          stopMediaStream(nextStream);
          return;
        }
        setPermissionError("");
        setPreviewStream((previous) => {
          stopMediaStream(previous);
          return nextStream;
        });
      } catch (error) {
        if (!active) return;
        setPermissionError(
          error instanceof Error ? error.message : "Unable to access media devices"
        );
        setPreviewStream((previous) => {
          stopMediaStream(previous);
          return null;
        });
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedCamera, selectedMic, selectedSpeaker]);

  useEffect(() => {
    const videoElement = videoRef.current;
    attachTrack(videoElement, previewStream?.getVideoTracks()[0] || null, true);
    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [previewStream]);

  useEffect(() => {
    if (!previewStream?.getAudioTracks().length) {
      return;
    }

    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }

    const context = new AudioContextCtor();
    const source = context.createMediaStreamSource(previewStream);
    const analyser = context.createAnalyser();
    const data = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);

    let frameId = 0;
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const average = data.reduce((sum, value) => sum + value, 0) / Math.max(1, data.length);
      setMicLevel(Math.min(100, Math.round((average / 255) * 100)));
      frameId = window.requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.cancelAnimationFrame(frameId);
      void context.close();
    };
  }, [previewStream]);

  useEffect(() => {
    return () => stopMediaStream(previewStream);
  }, [previewStream]);

  const handleDone = async () => {
    const nextSettings = {
      cameraId: selectedCamera,
      micId: selectedMic,
      speakerId: selectedSpeaker,
    };

    saveDeviceSettings(nextSettings);
    setApplyError("");

    if (!onApply) {
      onClose();
      return;
    }

    setIsApplying(true);
    try {
      await onApply(nextSettings);
      onClose();
    } catch (error) {
      setApplyError(error instanceof Error ? error.message : "Unable to apply device changes");
    } finally {
      setIsApplying(false);
    }
  };

  const handleSpeakerTest = async () => {
    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    setTestingSpeaker(true);
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const destination = context.createMediaStreamDestination();
    const element = document.createElement("audio");
    element.autoplay = true;
    element.srcObject = destination.stream;

    if ("setSinkId" in element && selectedSpeaker) {
      try {
        await (
          element as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }
        ).setSinkId?.(selectedSpeaker);
      } catch {
        // Fallback to default output.
      }
    }

    oscillator.type = "sine";
    oscillator.frequency.value = 620;
    gain.gain.value = 0.04;
    oscillator.connect(gain);
    gain.connect(destination);
    gain.connect(context.destination);
    oscillator.start();
    await element.play().catch(() => undefined);

    window.setTimeout(() => {
      oscillator.stop();
      void context.close();
      setTestingSpeaker(false);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-settings-title"
        className="bg-video-panel relative flex max-h-[85vh] w-full max-w-sm flex-col rounded-xl border border-white/10 shadow-2xl"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 p-4">
          <h2 id="device-settings-title" className="text-sm text-white">
            Device Settings
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close device settings"
            onClick={onClose}
            className="text-white/50 transition-colors hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
          <DeviceSection
            icon={Video}
            label="Camera"
            options={cameras}
            selected={selectedCamera}
            onSelect={setSelectedCamera}
          />

          <div className="bg-video-control overflow-hidden rounded-lg">
            {previewStream?.getVideoTracks().length ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-32 w-full object-cover"
              />
            ) : (
              <div className="flex h-32 items-center justify-center text-xs text-white/40">
                {permissionError ? "Camera permission needed" : "No camera preview available"}
              </div>
            )}
          </div>

          <DeviceSection
            icon={Mic}
            label="Microphone"
            options={mics}
            selected={selectedMic}
            onSelect={setSelectedMic}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>Mic level</span>
              <span>{displayMicLevel}%</span>
            </div>
            <div
              role="meter"
              aria-label="Microphone level"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={displayMicLevel}
              className="h-2 overflow-hidden rounded-full bg-white/10"
            >
              <div
                className="bg-brand-accent h-full rounded-full transition-[width]"
                style={{ width: `${displayMicLevel}%` }}
              />
            </div>
          </div>

          <DeviceSection
            icon={Volume2}
            label="Speaker"
            options={speakers}
            selected={selectedSpeaker}
            onSelect={setSelectedSpeaker}
          />

          <button
            onClick={() => void handleSpeakerTest()}
            className="rounded-md bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10"
          >
            {testingSpeaker ? "Playing test tone..." : "Test speaker"}
          </button>

          {permissionError ? (
            <div
              role="alert"
              className="rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-100"
            >
              Camera or microphone access is blocked. Allow permissions in the browser to test
              devices.
            </div>
          ) : null}

          {applyError ? (
            <div
              role="alert"
              className="rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-100"
            >
              {applyError}
            </div>
          ) : null}
        </div>

        <div className="flex-shrink-0 border-t border-white/10 p-4">
          <Button
            onClick={() => void handleDone()}
            disabled={isApplying}
            className="bg-brand-accent hover:bg-brand-accent/90 w-full text-white"
          >
            {isApplying ? "Applying..." : "Done"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DeviceSection({
  icon: Icon,
  label,
  options,
  selected,
  onSelect,
}: {
  icon: typeof Mic;
  label: string;
  options: DeviceOption[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-white/50" />
        <span className="text-xs tracking-wider text-white/50 uppercase">{label}</span>
      </div>
      <div role="radiogroup" aria-label={`${label} devices`} className="space-y-1">
        {options.length === 0 && (
          <div className="rounded-md border border-white/5 bg-white/5 px-3 py-2 text-sm text-white/40">
            No {label.toLowerCase()}s detected
          </div>
        )}
        {options.map((option) => (
          <button
            type="button"
            role="radio"
            aria-checked={selected === option.id}
            key={option.id}
            onClick={() => onSelect(option.id)}
            onKeyDown={(event) => {
              if (
                !["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"].includes(
                  event.key
                )
              ) {
                return;
              }
              event.preventDefault();
              const buttons = Array.from(
                event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                  '[role="radio"]'
                ) || []
              );
              const currentIndex = buttons.indexOf(event.currentTarget);
              const nextIndex =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? buttons.length - 1
                    : event.key === "ArrowDown" || event.key === "ArrowRight"
                      ? (currentIndex + 1) % buttons.length
                      : (currentIndex - 1 + buttons.length) % buttons.length;
              const nextOption = options[nextIndex];
              if (!nextOption) return;
              onSelect(nextOption.id);
              buttons[nextIndex]?.focus();
            }}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
              selected === option.id
                ? "bg-brand-accent/20 text-brand-accent-light"
                : "text-white/70 hover:bg-white/5"
            }`}
          >
            <span className="truncate">{option.label}</span>
            {selected === option.id ? <Check className="h-4 w-4 flex-shrink-0" /> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
