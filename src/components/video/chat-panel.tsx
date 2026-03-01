import { useI18n } from "../../lib/use-i18n";
import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import type { RoomMode } from "./video-room";

interface ChatPanelProps {
  mode: RoomMode;
  participantName: string;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isLocal: boolean;
}

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    sender: "Shruti",
    text: "Welcome everyone! We'll get started in a moment. Make sure you have your equipment ready.",
    time: "09:58",
    isLocal: false,
  },
  {
    id: "m2",
    sender: "Sarah",
    text: "Good morning! Ready to go.",
    time: "09:59",
    isLocal: false,
  },
  {
    id: "m3",
    sender: "James",
    text: "Morning all. Feeling good today.",
    time: "09:59",
    isLocal: false,
  },
  {
    id: "m4",
    sender: "Shruti",
    text: "Lovely to see you all. Remember, listen to your body today — scale as you need to.",
    time: "10:00",
    isLocal: false,
  },
];

export function ChatPanel({ participantName, onClose }: ChatPanelProps) {
  const { fmtTime } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg: ChatMessage = {
      id: `m${Date.now()}`,
      sender: participantName,
      text: input.trim(),
      time: fmtTime(new Date()),
      isLocal: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-72 lg:w-80 flex flex-col bg-[#252540] border-l border-white/5 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <span className="text-sm text-white/80">Live Chat</span>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id}>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-xs ${
                  msg.isLocal ? "text-[#B5C49B]" : "text-white/70"
                }`}
              >
                {msg.sender}
              </span>
              <span className="text-[10px] text-white/30">{msg.time}</span>
            </div>
            <p className="text-sm text-white/90 mt-0.5 leading-relaxed">
              {msg.text}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/5">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#4B5B32] transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 rounded-lg bg-[#4B5B32] hover:bg-[#4B5B32]/80 text-white disabled:opacity-30 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}