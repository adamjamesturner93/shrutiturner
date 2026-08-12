import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
export interface ChatMessage {
  id: string;
  userId?: string;
  sender: string;
  text: string;
  time: string;
  isLocal: boolean;
  type?: "message" | "announcement";
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onClose: () => void;
  onSendMessage: (text: string) => void;
  onSendAnnouncement?: (text: string) => void;
}

export function ChatPanel({
  messages,
  onClose,
  onSendMessage,
  onSendAnnouncement,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-video-panel flex w-72 flex-shrink-0 flex-col border-l border-white/5 lg:w-80">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <span className="text-sm text-white/80">Live Chat</span>
        <button onClick={onClose} className="text-white/40 transition-colors hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={
              msg.type === "announcement"
                ? "rounded-lg border border-amber-300/25 bg-amber-300/10 p-2"
                : undefined
            }
          >
            <div className="flex items-baseline gap-2">
              <span
                className={`text-xs ${msg.isLocal ? "text-brand-accent-light" : "text-white/70"}`}
              >
                {msg.sender}
              </span>
              <span className="text-micro text-white/30">{msg.time}</span>
            </div>
            <p className="mt-0.5 text-sm leading-relaxed text-white/90">{msg.text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/5 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="focus:border-brand-accent flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors outline-none placeholder:text-white/30"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="bg-brand-accent hover:bg-brand-accent/80 rounded-lg p-2 text-white transition-colors disabled:opacity-30"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        {onSendAnnouncement ? (
          <button
            type="button"
            onClick={() => {
              if (!input.trim()) return;
              onSendAnnouncement(input.trim());
              setInput("");
            }}
            disabled={!input.trim()}
            className="mt-2 w-full rounded-lg border border-amber-300/30 px-3 py-2 text-xs text-amber-100 transition-colors hover:bg-amber-300/10 disabled:opacity-30"
          >
            Send as announcement
          </button>
        ) : null}
      </div>
    </div>
  );
}
