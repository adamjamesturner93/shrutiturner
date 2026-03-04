import { useState } from "react";
import { X, Mic, Video, Volume2, Check, Monitor } from "lucide-react";
import { Button } from "../ui/button";

interface DeviceSelectorProps {
  onClose: () => void;
}

interface DeviceOption {
  id: string;
  label: string;
}

const MOCK_CAMERAS: DeviceOption[] = [
  { id: "cam1", label: "FaceTime HD Camera" },
  { id: "cam2", label: "External USB Webcam" },
];

const MOCK_MICS: DeviceOption[] = [
  { id: "mic1", label: "Built-in Microphone" },
  { id: "mic2", label: "External USB Microphone" },
  { id: "mic3", label: "AirPods Pro" },
];

const MOCK_SPEAKERS: DeviceOption[] = [
  { id: "spk1", label: "Built-in Speakers" },
  { id: "spk2", label: "External Monitor Speakers" },
  { id: "spk3", label: "AirPods Pro" },
];

export function DeviceSelector({ onClose }: DeviceSelectorProps) {
  const [selectedCamera, setSelectedCamera] = useState("cam1");
  const [selectedMic, setSelectedMic] = useState("mic1");
  const [selectedSpeaker, setSelectedSpeaker] = useState("spk1");
  const [testingMic, setTestingMic] = useState(false);
  const [testingSpeaker, setTestingSpeaker] = useState(false);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative flex max-h-[85vh] w-full max-w-sm flex-col rounded-xl border border-white/10 bg-[#252540] shadow-2xl">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 p-4">
          <h2 className="text-sm text-white">Device Settings</h2>
          <button onClick={onClose} className="text-white/50 transition-colors hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
          {/* Camera */}
          <DeviceSection
            icon={Video}
            label="Camera"
            options={MOCK_CAMERAS}
            selected={selectedCamera}
            onSelect={setSelectedCamera}
          />

          {/* Camera preview */}
          <div className="flex h-28 items-center justify-center overflow-hidden rounded-lg bg-[#1a1a2e]">
            <div className="space-y-2 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#4B5B32] text-lg text-white">
                YO
              </div>
              <p className="text-xs text-white/40">Camera preview</p>
            </div>
          </div>

          {/* Microphone */}
          <DeviceSection
            icon={Mic}
            label="Microphone"
            options={MOCK_MICS}
            selected={selectedMic}
            onSelect={setSelectedMic}
          />

          {/* Mic test */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setTestingMic(true);
                setTimeout(() => setTestingMic(false), 2000);
              }}
              className="rounded-md bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10"
            >
              {testingMic ? "Listening..." : "Test microphone"}
            </button>
            {testingMic && (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-1 animate-pulse rounded-full bg-[#4B5B32]"
                    style={{
                      height: `${8 + Math.random() * 12}px`,
                      animationDelay: `${i * 100}ms`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Speaker */}
          <DeviceSection
            icon={Volume2}
            label="Speaker"
            options={MOCK_SPEAKERS}
            selected={selectedSpeaker}
            onSelect={setSelectedSpeaker}
          />

          {/* Speaker test */}
          <button
            onClick={() => {
              setTestingSpeaker(true);
              setTimeout(() => setTestingSpeaker(false), 2000);
            }}
            className="rounded-md bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10"
          >
            {testingSpeaker ? "Playing test sound..." : "Test speaker"}
          </button>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-white/10 p-4">
          <Button
            onClick={onClose}
            className="w-full bg-[#4B5B32] text-white hover:bg-[#4B5B32]/90"
          >
            Done
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
      <div className="space-y-1">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
              selected === opt.id
                ? "bg-[#4B5B32]/20 text-[#B5C49B]"
                : "text-white/70 hover:bg-white/5"
            }`}
          >
            <span className="truncate">{opt.label}</span>
            {selected === opt.id && <Check className="h-4 w-4 flex-shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}
