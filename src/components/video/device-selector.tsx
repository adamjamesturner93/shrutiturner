import { useState } from "react";
import {
  X,
  Mic,
  Video,
  Volume2,
  Check,
  Monitor,
} from "lucide-react";
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
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#252540] rounded-xl border border-white/10 w-full max-w-sm shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-sm text-white">Device Settings</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-5 overflow-y-auto flex-1 min-h-0">
          {/* Camera */}
          <DeviceSection
            icon={Video}
            label="Camera"
            options={MOCK_CAMERAS}
            selected={selectedCamera}
            onSelect={setSelectedCamera}
          />

          {/* Camera preview */}
          <div className="rounded-lg overflow-hidden bg-[#1a1a2e] h-28 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-[#4B5B32] mx-auto flex items-center justify-center text-white text-lg">
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
              className="text-xs bg-white/5 hover:bg-white/10 text-white/60 px-3 py-1.5 rounded-md transition-colors"
            >
              {testingMic ? "Listening..." : "Test microphone"}
            </button>
            {testingMic && (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-1 bg-[#4B5B32] rounded-full animate-pulse"
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
            className="text-xs bg-white/5 hover:bg-white/10 text-white/60 px-3 py-1.5 rounded-md transition-colors"
          >
            {testingSpeaker ? "Playing test sound..." : "Test speaker"}
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <Button
            onClick={onClose}
            className="w-full bg-[#4B5B32] hover:bg-[#4B5B32]/90 text-white"
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
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-white/50" />
        <span className="text-xs text-white/50 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="space-y-1">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
              selected === opt.id
                ? "bg-[#4B5B32]/20 text-[#B5C49B]"
                : "text-white/70 hover:bg-white/5"
            }`}
          >
            <span className="truncate">{opt.label}</span>
            {selected === opt.id && (
              <Check className="w-4 h-4 flex-shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}