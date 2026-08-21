import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Eye,
  EyeOff,
  Maximize,
  MessageSquare,
  Mic,
  MicOff,
  Minimize,
  Phone,
  Settings,
  Users,
  Video,
  VideoOff,
  VolumeX,
  MonitorUp,
  Hand,
  Smile,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { ChatPanel, type ChatMessage } from "./chat-panel";
import { DeviceSelector } from "./device-selector";
import { useAuth } from "../../context/auth-context";
import type { ClassSessionDetailDto } from "@/lib/api/types";
import {
  attachTrack,
  createManagedCallObject,
  loadSavedDeviceSettings,
  releaseManagedCallObject,
  type SavedDeviceSettings,
  type DailyCallObject,
  type DailyParticipant,
} from "@/lib/daily/client";
import type { RoomMode as SharedRoomMode } from "@/lib/classes/room-mode";

export type RoomMode = SharedRoomMode;

type VideoRoomProps = {
  sessionId?: string;
  roomTokenEndpoint?: string;
  attendanceEndpoint?: string | null;
  chatEndpoint?: string | null;
  displayModeEndpoint?: string | null;
  moderationEndpoint?: string | null;
  mode: RoomMode;
  isInstructor: boolean;
  className: string;
  classTime: string;
  classDuration: string;
  registeredCount: number;
  initialMuted?: boolean;
  initialCameraOn?: boolean;
  initialCommunityMode?: boolean;
  initialRecording?: boolean;
  isRecorded?: boolean;
  chatEnabled?: boolean;
  onLeave: (reason: "left" | "ended" | "removed") => void;
  onEndSession?: () => Promise<void> | void;
  onStartRecording?: () => Promise<void> | void;
  onStopRecording?: () => Promise<void> | void;
};

type ParticipantTileModel = {
  id: string;
  userId: string;
  name: string;
  initials: string;
  isLocal: boolean;
  isInstructor: boolean;
  isMuted: boolean;
  isCameraOn: boolean;
  audioTrack: MediaStreamTrack | null;
  videoTrack: MediaStreamTrack | null;
};

type InstructorConsideration = {
  bookingId: string;
  name: string;
  healthConditions: string[];
  preClassEnergyLevel: 1 | 2 | 3 | 4 | 5 | null;
  preClassFlareToday: boolean;
};

type AcceptanceRequirementState = {
  type: string;
  surface: string;
  currentVersion: string;
  acceptedVersion: string | null;
  policyVersionId: string;
  acceptanceEventId: string | null;
  isCurrent: boolean;
};

const MAX_ROOM_JOIN_RETRIES = 3;
const ROOM_JOIN_RETRY_DELAYS_MS = [1500, 3000, 5000];

function getRoomJoinErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unable to join the live room";
}

function isRetryableRoomJoinError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("not ready yet") ||
    normalized.includes("room is not available yet") ||
    normalized.includes("please try later")
  );
}

export function VideoRoom({
  sessionId,
  roomTokenEndpoint,
  attendanceEndpoint,
  chatEndpoint,
  displayModeEndpoint,
  moderationEndpoint,
  mode,
  isInstructor,
  className: classTitle,
  classTime,
  classDuration,
  registeredCount,
  initialMuted = false,
  initialCameraOn = true,
  initialCommunityMode = false,
  isRecorded = false,
  chatEnabled = true,
  initialRecording = false,
  onLeave,
  onEndSession,
  onStartRecording,
  onStopRecording,
}: VideoRoomProps) {
  const { user } = useAuth();
  const [callObject, setCallObject] = useState<DailyCallObject | null>(null);
  const [participants, setParticipants] = useState<ParticipantTileModel[]>([]);
  const [roomError, setRoomError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [isCameraOn, setIsCameraOn] = useState(initialCameraOn);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSelfView, setShowSelfView] = useState(true);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [showChat, setShowChat] = useState(mode !== "live-class" && chatEnabled);
  const [communityMode, setCommunityMode] = useState(initialCommunityMode);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isEnding, setIsEnding] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(initialRecording);
  const [raisedHands, setRaisedHands] = useState<Array<{ userId: string; name: string }>>([]);
  const [reaction, setReaction] = useState("");
  const [statusText, setStatusText] = useState("Connecting to the live room...");
  const [joinAttempt, setJoinAttempt] = useState(0);
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);
  const [canRetryJoin, setCanRetryJoin] = useState(false);
  const [instructorConsiderations, setInstructorConsiderations] = useState<
    InstructorConsideration[]
  >([]);
  const [pendingAcceptances, setPendingAcceptances] = useState<AcceptanceRequirementState[]>([]);
  const [isRecordingAcceptanceSubmitting, setIsRecordingAcceptanceSubmitting] = useState(false);
  const [acceptanceError, setAcceptanceError] = useState("");
  const hasRecordedJoinRef = useRef(false);
  const currentUserIdRef = useRef(user?.id || "");
  const currentUserNameRef = useRef("");
  const onLeaveRef = useRef(onLeave);

  useEffect(() => {
    currentUserIdRef.current = user?.id || "";
  }, [user?.id]);

  useEffect(() => {
    onLeaveRef.current = onLeave;
  }, [onLeave]);

  const currentUserName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || user?.email || "You";

  useEffect(() => {
    currentUserNameRef.current = currentUserName;
  }, [currentUserName]);

  const appendChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages((previous) =>
      previous.some((item) => item.id === message.id) ? previous : [...previous, message]
    );
  }, []);

  useEffect(() => {
    if (!chatEndpoint || !chatEnabled) return;
    let active = true;
    void fetch(chatEndpoint, { cache: "no-store" })
      .then(async (response) => (response.ok ? response.json() : []))
      .then(
        (
          messages: Array<{
            id: string;
            userId: string;
            sender: string;
            text: string;
            type?: "message" | "announcement";
            createdAt: string;
          }>
        ) => {
          if (!active) return;
          setChatMessages(
            messages.map((message) => ({
              id: message.id,
              userId: message.userId,
              sender: message.sender,
              text: message.text,
              time: new Date(message.createdAt).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              isLocal: message.userId === currentUserIdRef.current,
              type: message.type,
            }))
          );
        }
      )
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [chatEnabled, chatEndpoint]);

  const mapParticipants = useCallback((nextCallObject: DailyCallObject) => {
    const nextParticipants = Object.values(nextCallObject.participants() || {}).map((participant) =>
      toParticipantModel(participant)
    );
    setParticipants(nextParticipants);
  }, []);

  const applyDeviceSettings = useCallback(
    async (settings: SavedDeviceSettings) => {
      if (!callObject) return;

      if (callObject.setInputDevicesAsync) {
        await callObject.setInputDevicesAsync({
          audioSource: settings.micId || undefined,
          videoSource: settings.cameraId || undefined,
        });
      }

      if (callObject.setOutputDeviceAsync && settings.speakerId) {
        await callObject.setOutputDeviceAsync(settings.speakerId);
      }
    },
    [callObject]
  );

  const sendChatMessage = useCallback(
    async (text: string, type: "message" | "announcement" = "message") => {
      if (!callObject?.sendAppMessage || mode === "live-class" || !chatEnabled) return;

      const timestamp = new Date();
      let message: ChatMessage = {
        id: `chat-${timestamp.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: user?.id,
        sender: currentUserName,
        text,
        time: timestamp.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isLocal: true,
        type,
      };

      if (chatEndpoint) {
        const response = await fetch(chatEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, type }),
        });
        const saved = (await response.json().catch(() => null)) as {
          id?: string;
          userId?: string;
          sender?: string;
          text?: string;
          type?: "message" | "announcement";
          createdAt?: string;
          message?: string;
        } | null;
        if (!response.ok || !saved?.id)
          throw new Error(saved?.message || "Unable to send message.");
        message = {
          id: saved.id,
          userId: saved.userId,
          sender: saved.sender || currentUserName,
          text: saved.text || text,
          time: new Date(saved.createdAt || timestamp).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isLocal: true,
          type: saved.type || type,
        };
      }

      appendChatMessage(message);
      await callObject.sendAppMessage(
        {
          type: "chat-message",
          message,
        },
        "*"
      );
    },
    [appendChatMessage, callObject, currentUserName, chatEnabled, chatEndpoint, mode, user?.id]
  );

  const localParticipant = participants.find((participant) => participant.isLocal);
  const instructorParticipant =
    participants.find((participant) => participant.isInstructor) || localParticipant || null;
  const otherParticipants = participants.filter(
    (participant) => !participant.isInstructor && !participant.isLocal
  );
  const joinedCount = Math.max(1, participants.length);

  const leaveRoom = useCallback(
    async (
      targetCallObject: DailyCallObject | null,
      suppressCallback = false,
      reason: "left" | "ended" | "removed" = "left"
    ) => {
      if (!targetCallObject) {
        if (!suppressCallback) onLeaveRef.current(reason);
        return;
      }

      if (hasRecordedJoinRef.current) {
        const localParticipant = Object.values(targetCallObject.participants() || {}).find(
          (participant) => Boolean(participant.local)
        );
        const resolvedAttendanceEndpoint =
          attendanceEndpoint === undefined
            ? `/api/classes/sessions/${sessionId}/attendance`
            : attendanceEndpoint;
        if (resolvedAttendanceEndpoint)
          await fetch(resolvedAttendanceEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "left",
              dailyParticipantId: localParticipant?.session_id || null,
            }),
          }).catch(() => undefined);
        hasRecordedJoinRef.current = false;
      }

      await releaseManagedCallObject(targetCallObject);
      setCallObject(null);
      setIsReady(false);

      if (!suppressCallback) {
        onLeaveRef.current(reason);
      }
    },
    [attendanceEndpoint, sessionId]
  );

  useEffect(() => {
    setJoinAttempt(0);
    setRoomError("");
    setCanRetryJoin(false);
    setIsAutoRetrying(false);
    setPendingAcceptances([]);
    setAcceptanceError("");
    setStatusText("Connecting to the live room...");
  }, [sessionId]);

  useEffect(() => {
    if (!isInstructor || !sessionId) {
      setInstructorConsiderations([]);
      return;
    }

    let active = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const loadConsiderations = async () => {
      try {
        const response = await fetch(`/api/admin/classes/sessions/${sessionId}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as ClassSessionDetailDto;
        if (!active) return;
        setInstructorConsiderations(
          payload.bookings
            .filter(
              (booking) =>
                booking.status === "booked" &&
                (booking.preClassFlareToday || booking.healthConditions.length > 0)
            )
            .map((booking) => ({
              bookingId: booking.id,
              name: `${booking.firstName} ${booking.lastName}`.trim() || booking.email,
              healthConditions: booking.healthConditions,
              preClassEnergyLevel: booking.preClassEnergyLevel,
              preClassFlareToday: booking.preClassFlareToday,
            }))
        );
      } catch {
        // Keep the live room available even if summary refresh fails.
      }
    };

    void loadConsiderations();
    intervalId = setInterval(() => {
      void loadConsiderations();
    }, 15_000);

    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [isInstructor, sessionId]);

  useEffect(() => {
    let cancelled = false;
    let nextCallObject: DailyCallObject | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    if (!sessionId) {
      setRoomError("This live room is not configured yet.");
      return;
    }

    void (async () => {
      try {
        const response = await fetch(
          roomTokenEndpoint || `/api/classes/sessions/${sessionId}/room-token`,
          {
            method: "POST",
            cache: "no-store",
          }
        );
        const payload = (await response.json().catch(() => ({}))) as {
          token?: string;
          roomUrl?: string;
          communityModeEnabled?: boolean;
          defaultMicMuted?: boolean;
          defaultCameraOff?: boolean;
          code?: string;
          requiredAcceptances?: AcceptanceRequirementState[];
          message?: string;
        };

        if (
          !response.ok &&
          payload.code === "LEGAL_ACCEPTANCE_REQUIRED" &&
          Array.isArray(payload.requiredAcceptances)
        ) {
          setPendingAcceptances(payload.requiredAcceptances);
          setRoomError("");
          setCanRetryJoin(false);
          setIsAutoRetrying(false);
          setStatusText("Additional acknowledgement required before you can join.");
          return;
        }

        if (!response.ok || !payload.token || !payload.roomUrl) {
          throw new Error(payload.message || "Unable to join the live room");
        }

        const startAudioOff = payload.defaultMicMuted ?? initialMuted;
        const startVideoOff = payload.defaultCameraOff ?? !initialCameraOn;
        setIsMuted(startAudioOff);
        setIsCameraOn(!startVideoOff);

        nextCallObject = await createManagedCallObject();

        const syncParticipants = () => mapParticipants(nextCallObject!);
        const handleRoomMessage = (event?: unknown) => {
          const payloadData = (event as { data?: Record<string, unknown> } | undefined)?.data;
          if (!payloadData || typeof payloadData.type !== "string") return;

          if (payloadData.type === "community-mode") {
            setCommunityMode(Boolean(payloadData.enabled));
          }

          if (payloadData.type === "display-mode") {
            setCommunityMode(payloadData.mode === "gallery");
          }

          if (payloadData.type === "raise-hand") {
            const handUserId = String(payloadData.userId || "");
            const handName = String(payloadData.name || "Guest");
            if (payloadData.raised) {
              setRaisedHands((current) =>
                current.some((item) => item.userId === handUserId)
                  ? current
                  : [...current, { userId: handUserId, name: handName }]
              );
            } else {
              setRaisedHands((current) => current.filter((item) => item.userId !== handUserId));
            }
          }

          if (payloadData.type === "reaction") {
            setReaction(String(payloadData.reaction || ""));
            window.setTimeout(() => setReaction(""), 1800);
          }

          if (payloadData.type === "moderation") {
            if (payloadData.targetUserId !== currentUserIdRef.current) return;

            if (payloadData.action === "mute") {
              setIsMuted(true);
              void nextCallObject?.setLocalAudio(false);
            }

            if (payloadData.action === "remove") {
              setStatusText("The instructor has removed you from class.");
              void leaveRoom(nextCallObject, false, "removed");
            }
          }

          if (payloadData.type === "room-ended") {
            setStatusText("Class has ended.");
            void leaveRoom(nextCallObject, false, "ended");
          }

          if (payloadData.type === "chat-message") {
            const message = payloadData.message as ChatMessage | undefined;
            if (!message || typeof message.id !== "string" || typeof message.text !== "string") {
              return;
            }
            appendChatMessage({
              ...message,
              isLocal: message.userId === currentUserIdRef.current,
            });
          }
        };

        nextCallObject.on("participant-joined", syncParticipants);
        nextCallObject.on("participant-updated", syncParticipants);
        nextCallObject.on("participant-left", syncParticipants);
        nextCallObject.on("app-message", handleRoomMessage);

        const deviceSettings = loadSavedDeviceSettings();
        if (nextCallObject.setInputDevicesAsync) {
          await nextCallObject.setInputDevicesAsync({
            audioSource: deviceSettings.micId || undefined,
            videoSource: deviceSettings.cameraId || undefined,
          });
        }
        if (nextCallObject.setOutputDeviceAsync && deviceSettings.speakerId) {
          await nextCallObject
            .setOutputDeviceAsync(deviceSettings.speakerId)
            .catch(() => undefined);
        }

        await nextCallObject.join({
          url: payload.roomUrl,
          token: payload.token,
          userName: currentUserNameRef.current || "You",
          startAudioOff,
          startVideoOff,
        });

        if (cancelled) {
          await releaseManagedCallObject(nextCallObject);
          return;
        }

        hasRecordedJoinRef.current = true;
        const localParticipant = Object.values(nextCallObject.participants() || {}).find(
          (participant) => Boolean(participant.local)
        );
        const resolvedAttendanceEndpoint =
          attendanceEndpoint === undefined
            ? `/api/classes/sessions/${sessionId}/attendance`
            : attendanceEndpoint;
        if (resolvedAttendanceEndpoint) {
          await fetch(resolvedAttendanceEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "joined",
              dailyParticipantId: localParticipant?.session_id || null,
            }),
          }).catch(() => undefined);
        }

        mapParticipants(nextCallObject);
        setCommunityMode(Boolean(payload.communityModeEnabled));
        setCallObject(nextCallObject);
        setIsReady(true);
        setRoomError("");
        setPendingAcceptances([]);
        setAcceptanceError("");
        setCanRetryJoin(false);
        setIsAutoRetrying(false);
        setStatusText("Live now");
      } catch (error) {
        if (cancelled) return;
        if (nextCallObject) {
          await releaseManagedCallObject(nextCallObject);
          nextCallObject = null;
        }

        const message = getRoomJoinErrorMessage(error);
        const retryable = isRetryableRoomJoinError(message);

        if (retryable && joinAttempt < MAX_ROOM_JOIN_RETRIES) {
          const delay =
            ROOM_JOIN_RETRY_DELAYS_MS[joinAttempt] || ROOM_JOIN_RETRY_DELAYS_MS.at(-1) || 3000;
          setStatusText("The studio is still opening. Retrying shortly...");
          setRoomError("");
          setCanRetryJoin(true);
          setIsAutoRetrying(true);
          retryTimeout = setTimeout(() => {
            if (!cancelled) {
              setJoinAttempt((attempt) => attempt + 1);
            }
          }, delay);
          return;
        }

        setIsAutoRetrying(false);
        setCanRetryJoin(retryable);
        setRoomError(message);
      }
    })();

    return () => {
      cancelled = true;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      void leaveRoom(nextCallObject, true, "left");
    };
  }, [
    appendChatMessage,
    initialCameraOn,
    initialMuted,
    joinAttempt,
    leaveRoom,
    mapParticipants,
    roomTokenEndpoint,
    sessionId,
    attendanceEndpoint,
  ]);

  const toggleLocalAudio = async () => {
    if (!callObject) return;
    const nextValue = !isMuted;
    setIsMuted(nextValue);
    await callObject.setLocalAudio(!nextValue);
  };

  const toggleLocalVideo = async () => {
    if (!callObject) return;
    const nextValue = !isCameraOn;
    setIsCameraOn(nextValue);
    await callObject.setLocalVideo(nextValue);
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => undefined);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => undefined);
      setIsFullscreen(false);
    }
  }, []);

  const broadcastModeration = async (
    action: "mute" | "remove",
    participantId: string,
    targetUserId: string
  ) => {
    if (!callObject?.sendAppMessage) return;
    if (moderationEndpoint) {
      const response = await fetch(moderationEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, participantId }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        setStatusText(payload?.message || "Unable to moderate this participant.");
        return;
      }
    }
    await callObject.sendAppMessage({ type: "moderation", action, targetUserId }, "*");
  };

  const toggleCommunityMode = async () => {
    const nextValue = !communityMode;
    if (!isInstructor) {
      setCommunityMode(nextValue);
      return;
    }
    const response = await fetch(
      displayModeEndpoint || `/api/classes/sessions/${sessionId}/community-mode`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          displayModeEndpoint
            ? { mode: nextValue ? "gallery" : "presenter" }
            : { enabled: nextValue }
        ),
      }
    );
    const payload = (await response.json().catch(() => null)) as {
      dailySyncStatus?: string;
      message?: string;
    } | null;
    if (!response.ok) {
      setStatusText(payload?.message || "Unable to update community mode right now.");
      return;
    }

    setCommunityMode(nextValue);
    if (payload?.dailySyncStatus === "failed") {
      setStatusText("Mode updated, but some participant permissions may need a retry.");
    }
    await callObject?.sendAppMessage?.(
      displayModeEndpoint
        ? { type: "display-mode", mode: nextValue ? "gallery" : "presenter" }
        : { type: "community-mode", enabled: nextValue },
      "*"
    );
  };

  const toggleScreenShare = async () => {
    if (!isInstructor || !callObject) return;
    if (isScreenSharing) await callObject.stopScreenShare?.();
    else await callObject.startScreenShare?.();
    setIsScreenSharing((value) => !value);
  };

  const toggleRaisedHand = async () => {
    if (!callObject?.sendAppMessage || !user?.id) return;
    const raised = !raisedHands.some((item) => item.userId === user.id);
    setRaisedHands((current) =>
      raised
        ? [...current, { userId: user.id, name: currentUserName }]
        : current.filter((item) => item.userId !== user.id)
    );
    await callObject.sendAppMessage(
      { type: "raise-hand", userId: user.id, name: currentUserName, raised },
      "*"
    );
  };

  const sendReaction = async () => {
    setReaction("👏");
    await callObject?.sendAppMessage?.({ type: "reaction", reaction: "👏", userId: user?.id }, "*");
    window.setTimeout(() => setReaction(""), 1800);
  };

  const endSession = async () => {
    if (!onEndSession) return;
    if (!window.confirm("End this session for everyone? Participants will be disconnected.")) {
      return;
    }
    setIsEnding(true);
    try {
      if (isRecording && onStopRecording) {
        await onStopRecording();
        setIsRecording(false);
      }
      await onEndSession();
      await callObject?.sendAppMessage?.({ type: "room-ended" }, "*");
      await leaveRoom(callObject, false, "ended");
    } finally {
      setIsEnding(false);
    }
  };

  const requiresOnlyRecordingNotice =
    pendingAcceptances.length > 0 &&
    pendingAcceptances.every((acceptance) => acceptance.type === "recording_notice");

  const acceptRecordingNotice = async () => {
    if (!requiresOnlyRecordingNotice) return;

    setIsRecordingAcceptanceSubmitting(true);
    setAcceptanceError("");

    try {
      await Promise.all(
        pendingAcceptances.map((acceptance) =>
          fetch("/api/me/acceptances", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: acceptance.type,
              surface: acceptance.surface,
              metadataJson: {
                sessionId,
                isRecorded,
                chatEnabled,
              },
            }),
          }).then(async (response) => {
            if (!response.ok) {
              const payload = (await response.json().catch(() => null)) as {
                message?: string;
              } | null;
              throw new Error(payload?.message || "Failed to record acknowledgement.");
            }
          })
        )
      );
      setPendingAcceptances([]);
      setJoinAttempt((attempt) => attempt + 1);
      setStatusText("Recording acknowledgement saved. Reconnecting...");
    } catch (error) {
      setAcceptanceError(
        error instanceof Error ? error.message : "Failed to record acknowledgement."
      );
    } finally {
      setIsRecordingAcceptanceSubmitting(false);
    }
  };

  if (pendingAcceptances.length > 0) {
    return (
      <div className="bg-video-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4 text-white">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="recording-acceptance-title"
          tabIndex={-1}
          autoFocus
          className="bg-video-panel max-w-lg space-y-4 rounded-xl border border-white/10 p-6"
        >
          <h2 id="recording-acceptance-title" className="text-xl">
            {requiresOnlyRecordingNotice
              ? "Recording acknowledgement required"
              : "Update your current acceptances"}
          </h2>
          {requiresOnlyRecordingNotice ? (
            <>
              <p className="text-sm text-white/70">
                This session is recorded. The instructor is intentionally recorded. Participants are
                not intended to be recorded, but incidental capture may happen if you unmute, turn
                on camera, or use chat.
              </p>
              <p className="text-sm text-white/70">
                Chat: {chatEnabled ? "Enabled." : "Disabled."}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void acceptRecordingNotice()}
                  disabled={isRecordingAcceptanceSubmitting}
                  className="rounded-md bg-white px-4 py-2 text-sm text-black transition-colors hover:bg-white/90 disabled:opacity-60"
                >
                  {isRecordingAcceptanceSubmitting
                    ? "Saving acknowledgement..."
                    : "I understand and want to join"}
                </button>
                <button
                  type="button"
                  onClick={() => onLeaveRef.current("left")}
                  className="rounded-md border border-white/15 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10"
                >
                  Go back
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-white/70">
                One or more required legal acceptances are out of date. Update them before joining
                the live room.
              </p>
              <ul className="space-y-2 text-sm text-white/70">
                {pendingAcceptances.map((acceptance) => (
                  <li key={`${acceptance.type}:${acceptance.currentVersion}`}>
                    {acceptance.type.replaceAll("_", " ")}: current version{" "}
                    {acceptance.currentVersion}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={
                    pendingAcceptances.some((acceptance) => acceptance.type === "health_data")
                      ? "/dashboard/health"
                      : "/dashboard/account"
                  }
                  className="rounded-md bg-white px-4 py-2 text-center text-sm text-black transition-colors hover:bg-white/90"
                >
                  Review and update
                </a>
                <button
                  type="button"
                  onClick={() => onLeaveRef.current("left")}
                  className="rounded-md border border-white/15 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10"
                >
                  Go back
                </button>
              </div>
            </>
          )}
          {acceptanceError ? (
            <p role="alert" className="text-sm text-red-300">
              {acceptanceError}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (roomError) {
    return (
      <div className="bg-video-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4 text-white">
        <div className="bg-video-panel max-w-sm space-y-4 rounded-xl border border-white/10 p-6 text-center">
          <h2 className="text-xl">Unable to enter room</h2>
          <p role="alert" className="text-sm text-white/60">
            {roomError}
          </p>
          <div className="flex flex-col gap-3">
            {canRetryJoin ? (
              <button
                type="button"
                onClick={() => {
                  setRoomError("");
                  setStatusText("Retrying connection...");
                  setIsAutoRetrying(false);
                  setJoinAttempt((attempt) => attempt + 1);
                }}
                className="rounded-md border border-white/15 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10"
              >
                Retry
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onLeaveRef.current("left")}
              className="text-sm text-white/70 underline"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-video-backdrop fixed inset-0 z-[100] flex flex-col text-white">
      <header className="bg-video-backdrop/90 flex flex-shrink-0 items-center justify-between border-b border-white/5 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`h-2 w-2 rounded-full ${isReady ? "animate-pulse bg-red-500" : "bg-amber-400"}`}
          />
          <div className="min-w-0">
            <h1 className="truncate text-sm">{classTitle}</h1>
            <p className="text-xs text-white/50">
              {classTime} · {classDuration}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1.5 text-xs text-white/60">
            <Users className="h-3.5 w-3.5" />
            <span>
              {joinedCount}/{registeredCount}
            </span>
          </div>

          {mode !== "live-class" || isInstructor ? (
            <button
              onClick={() => void toggleCommunityMode()}
              disabled={false}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs transition-colors ${
                communityMode
                  ? "bg-brand-accent text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
              title={communityMode ? "Community mode enabled" : "Focus mode enabled"}
            >
              {communityMode ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{communityMode ? "Community" : "Focus"}</span>
            </button>
          ) : null}

          <button
            onClick={() => void leaveRoom(callObject, false, "left")}
            className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/30"
          >
            <Phone className="h-3.5 w-3.5 rotate-135" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col gap-3 overflow-hidden p-3">
          {isReady ? (
            <div className="bg-video-panel flex items-center justify-between rounded-lg border border-white/5 px-3 py-2 text-xs text-white/70">
              <span>
                {communityMode
                  ? "Community mode is on. Participants can see one another."
                  : "Focus mode is on. Only the instructor can see participant video and you can still turn your camera off."}
              </span>
              <Badge
                className={
                  communityMode ? "bg-brand-accent text-white" : "bg-white/10 text-white/70"
                }
              >
                {communityMode ? "Community" : "Focus"}
              </Badge>
            </div>
          ) : null}
          {reaction ? (
            <div
              aria-live="polite"
              className="pointer-events-none absolute inset-x-0 top-20 z-20 text-center text-5xl"
            >
              {reaction}
            </div>
          ) : null}

          {!isReady ? (
            <div
              role="status"
              aria-live="polite"
              aria-busy="true"
              className="bg-video-panel flex flex-1 items-center justify-center rounded-lg border border-white/5 text-sm text-white/60"
            >
              {isAutoRetrying
                ? `${statusText} Attempt ${joinAttempt + 1} of ${MAX_ROOM_JOIN_RETRIES + 1}.`
                : statusText}
            </div>
          ) : isInstructor ? (
            <InstructorView
              instructor={localParticipant || instructorParticipant}
              participants={otherParticipants}
              communityMode={communityMode}
              considerations={instructorConsiderations}
              onMute={(participant) =>
                void broadcastModeration("mute", participant.id, participant.userId)
              }
              onRemove={(participant) =>
                void broadcastModeration("remove", participant.id, participant.userId)
              }
            />
          ) : communityMode ? (
            <CommunityView
              instructor={instructorParticipant}
              selfParticipant={localParticipant}
              participants={otherParticipants}
            />
          ) : (
            <FocusView
              instructor={instructorParticipant}
              selfParticipant={localParticipant}
              participantCount={otherParticipants.length}
              showSelfView={showSelfView}
            />
          )}

          {!communityMode && !isInstructor ? (
            <div className="hidden">
              {otherParticipants.map((participant) => (
                <ParticipantAudio key={participant.id} participant={participant} />
              ))}
            </div>
          ) : null}
        </div>

        {showChat && chatEnabled ? (
          <ChatPanel
            messages={chatMessages}
            onClose={() => setShowChat(false)}
            onSendMessage={(text) => sendChatMessage(text)}
            onSendAnnouncement={
              isInstructor && chatEndpoint
                ? (text) => sendChatMessage(text, "announcement")
                : undefined
            }
          />
        ) : null}
      </div>

      <footer className="bg-video-backdrop/90 flex flex-shrink-0 items-center justify-center gap-2 border-t border-white/5 px-4 py-3 sm:gap-3">
        <ControlButton
          active={!isMuted}
          onClick={() => void toggleLocalAudio()}
          icon={isMuted ? MicOff : Mic}
          label={isMuted ? "Unmute" : "Mute"}
          danger={isMuted}
        />
        <ControlButton
          active={raisedHands.some((item) => item.userId === user?.id)}
          onClick={() => void toggleRaisedHand()}
          icon={Hand}
          label="Raise hand"
        />
        <ControlButton
          active={Boolean(reaction)}
          onClick={() => void sendReaction()}
          icon={Smile}
          label="React"
        />
        {isInstructor && callObject?.startScreenShare ? (
          <ControlButton
            active={isScreenSharing}
            onClick={() => void toggleScreenShare()}
            icon={MonitorUp}
            label={isScreenSharing ? "Stop sharing" : "Share screen"}
          />
        ) : null}
        <ControlButton
          active={isCameraOn}
          onClick={() => void toggleLocalVideo()}
          icon={isCameraOn ? Video : VideoOff}
          label={isCameraOn ? "Stop video" : "Start video"}
          danger={!isCameraOn}
        />
        <ControlButton
          active={showSelfView}
          onClick={() => setShowSelfView((value) => !value)}
          icon={Users}
          label={showSelfView ? "Hide self" : "Show self"}
        />
        <ControlButton
          active={isFullscreen}
          onClick={toggleFullscreen}
          icon={isFullscreen ? Minimize : Maximize}
          label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        />
        {mode !== "live-class" && chatEnabled ? (
          <ControlButton
            active={showChat}
            onClick={() => setShowChat((value) => !value)}
            icon={MessageSquare}
            label={showChat ? "Hide chat" : "Show chat"}
          />
        ) : null}
        <ControlButton
          active={showDeviceSelector}
          onClick={() => setShowDeviceSelector((value) => !value)}
          icon={Settings}
          label="Devices"
        />
        {isInstructor && onEndSession ? (
          <button
            type="button"
            onClick={() => void endSession()}
            disabled={isEnding}
            aria-label="End workshop for everyone"
            className="rounded-lg bg-red-500/20 px-3 py-2 text-xs text-red-300 transition-colors hover:bg-red-500/30 disabled:opacity-50"
          >
            {isEnding ? "Ending..." : "End class"}
          </button>
        ) : null}
        {isInstructor && onStartRecording && onStopRecording ? (
          <button
            type="button"
            onClick={async () => {
              try {
                if (isRecording) await onStopRecording();
                else await onStartRecording();
                setIsRecording((value) => !value);
                setStatusText(isRecording ? "Recording stopped" : "Recording started");
              } catch (recordingError) {
                setStatusText(
                  recordingError instanceof Error
                    ? recordingError.message
                    : "Unable to update recording"
                );
              }
            }}
            aria-pressed={isRecording}
            aria-label={isRecording ? "Stop workshop recording" : "Start workshop recording"}
            className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/15"
          >
            {isRecording ? "Stop recording" : "Record"}
          </button>
        ) : null}
        {isInstructor && raisedHands.length > 0 ? (
          <div
            className="rounded-lg bg-amber-300/15 px-3 py-2 text-xs text-amber-100"
            aria-live="polite"
          >
            Hands: {raisedHands.map((item) => item.name).join(", ")}
          </div>
        ) : null}
      </footer>

      {showDeviceSelector ? (
        <DeviceSelector
          onClose={() => setShowDeviceSelector(false)}
          onApply={applyDeviceSettings}
        />
      ) : null}
    </div>
  );
}

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
      type="button"
      aria-label={label}
      aria-pressed={active}
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
      <span className="text-micro hidden sm:block">{label}</span>
    </button>
  );
}

function InstructorView({
  instructor,
  participants,
  communityMode,
  considerations,
  onMute,
  onRemove,
}: {
  instructor: ParticipantTileModel | null;
  participants: ParticipantTileModel[];
  communityMode: boolean;
  considerations: InstructorConsideration[];
  onMute: (participant: ParticipantTileModel) => void;
  onRemove: (participant: ParticipantTileModel) => void;
}) {
  return (
    <div className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
      <ParticipantTile participant={instructor} size="lg" isLocal />
      <div className="grid grid-cols-2 gap-3">
        {participants.map((participant) => (
          <ParticipantTile
            key={participant.id}
            participant={participant}
            size="sm"
            actionSlot={
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onMute(participant)}
                  className="rounded-full bg-black/40 p-1.5 text-white transition-colors hover:bg-red-500/50"
                  title={`Mute ${participant.name}`}
                  aria-label={`Mute ${participant.name}`}
                >
                  <VolumeX className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(participant)}
                  className="rounded-full bg-black/40 p-1.5 text-white transition-colors hover:bg-red-500/50"
                  title={`Remove ${participant.name}`}
                  aria-label={`Remove ${participant.name}`}
                >
                  <Phone className="h-3 w-3 rotate-135" />
                </button>
              </div>
            }
          />
        ))}
        {participants.length === 0 ? (
          <div className="bg-video-panel/60 col-span-2 flex items-center justify-center rounded-lg border border-white/5 text-sm text-white/40">
            Waiting for participants...
          </div>
        ) : null}
      </div>
      <div className="col-span-full flex items-center gap-2 text-xs text-white/50">
        <Badge
          className={communityMode ? "bg-brand-accent text-white" : "bg-white/10 text-white/70"}
        >
          {communityMode ? "Community mode enabled" : "Focus mode enabled"}
        </Badge>
      </div>
      {considerations.length > 0 ? (
        <div className="bg-video-panel/80 col-span-full rounded-lg border border-amber-300/20 p-3 text-xs text-white/80">
          <p className="mb-2 text-white">Today's considerations</p>
          <div className="space-y-2">
            {considerations.map((consideration) => (
              <div
                key={consideration.bookingId}
                className="rounded-md border border-white/10 bg-white/5 px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span>{consideration.name}</span>
                  {consideration.preClassFlareToday ? (
                    <Badge className="bg-amber-500/20 text-amber-200">Flare today</Badge>
                  ) : null}
                  {consideration.preClassEnergyLevel ? (
                    <Badge className="bg-white/10 text-white/80">
                      Energy {consideration.preClassEnergyLevel}/5
                    </Badge>
                  ) : null}
                </div>
                {consideration.healthConditions.length > 0 ? (
                  <p className="mt-1 text-white/60">{consideration.healthConditions.join(", ")}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CommunityView({
  instructor,
  selfParticipant,
  participants,
}: {
  instructor: ParticipantTileModel | null;
  selfParticipant: ParticipantTileModel | null;
  participants: ParticipantTileModel[];
}) {
  const [page, setPage] = useState(0);
  const galleryParticipants = [selfParticipant, ...participants].filter(
    (participant): participant is ParticipantTileModel => Boolean(participant)
  );
  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(galleryParticipants.length / pageSize));
  const visibleParticipants = galleryParticipants.slice(page * pageSize, (page + 1) * pageSize);
  return (
    <div className="flex flex-1 flex-col gap-3 overflow-hidden">
      <ParticipantTile participant={instructor} size="lg" />
      <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-3">
        {visibleParticipants.map((participant) => (
          <ParticipantTile
            key={participant.id}
            participant={participant}
            size="sm"
            isLocal={participant.isLocal}
          />
        ))}
      </div>
      {pageCount > 1 ? (
        <nav
          aria-label="Participant gallery pages"
          className="flex items-center justify-center gap-3 text-xs text-white/70"
        >
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((value) => Math.max(0, value - 1))}
            className="rounded border border-white/15 px-3 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {page + 1} of {pageCount}
          </span>
          <button
            type="button"
            disabled={page >= pageCount - 1}
            onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
            className="rounded border border-white/15 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      ) : null}
    </div>
  );
}

function FocusView({
  instructor,
  selfParticipant,
  participantCount,
  showSelfView,
}: {
  instructor: ParticipantTileModel | null;
  selfParticipant: ParticipantTileModel | null;
  participantCount: number;
  showSelfView: boolean;
}) {
  return (
    <div className="relative flex-1">
      <ParticipantTile participant={instructor} size="lg" />
      <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1.5 text-xs text-white/60">
        <Users className="h-3 w-3" />
        <span>{participantCount} others listening</span>
      </div>
      {showSelfView && selfParticipant ? (
        <div className="absolute right-4 bottom-4 w-40">
          <ParticipantTile participant={selfParticipant} size="pip" isLocal />
        </div>
      ) : null}
    </div>
  );
}

function ParticipantTile({
  participant,
  size = "md",
  isLocal = false,
  actionSlot,
}: {
  participant: ParticipantTileModel | null;
  size?: "lg" | "md" | "sm" | "pip";
  isLocal?: boolean;
  actionSlot?: ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sizeClasses = {
    lg: "min-h-[320px]",
    md: "min-h-[180px]",
    sm: "min-h-[140px]",
    pip: "min-h-[110px]",
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    attachTrack(videoElement, participant?.videoTrack || null, isLocal);
    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [isLocal, participant?.videoTrack]);

  if (!participant) {
    return (
      <div
        className={`bg-video-panel flex items-center justify-center rounded-lg border border-white/5 ${sizeClasses[size]}`}
      >
        <span className="text-sm text-white/40">No video yet</span>
      </div>
    );
  }

  const hasVideo = Boolean(participant.videoTrack && participant.isCameraOn);

  return (
    <div className={`bg-video-surface relative overflow-hidden rounded-lg ${sizeClasses[size]}`}>
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="from-brand-accent/25 to-video-panel flex h-full items-center justify-center bg-gradient-to-br">
          <div className="bg-brand-accent/40 flex h-20 w-20 items-center justify-center rounded-full text-2xl text-white">
            {participant.initials}
          </div>
        </div>
      )}
      {!isLocal && participant.audioTrack ? <ParticipantAudio participant={participant} /> : null}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {participant.isMuted ? <MicOff className="h-3 w-3 text-red-300" /> : null}
            <span className="truncate text-xs text-white/90">
              {participant.name}
              {isLocal ? " (You)" : ""}
            </span>
          </div>
          {participant.isInstructor ? (
            <Badge className="bg-brand-accent/80 text-white">Instructor</Badge>
          ) : null}
        </div>
      </div>
      {actionSlot ? <div className="absolute top-3 right-3">{actionSlot}</div> : null}
    </div>
  );
}

function ParticipantAudio({ participant }: { participant: ParticipantTileModel }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audioElement = audioRef.current;
    attachTrack(audioElement, participant.audioTrack, false);
    return () => {
      if (audioElement) {
        audioElement.srcObject = null;
      }
    };
  }, [participant.audioTrack]);

  return <audio ref={audioRef} autoPlay playsInline />;
}

function toParticipantModel(participant: DailyParticipant): ParticipantTileModel {
  const name = participant.user_name || (participant.local ? "You" : "Participant");
  return {
    id: participant.session_id,
    userId: participant.user_id || participant.session_id,
    name,
    initials: buildInitials(name),
    isLocal: Boolean(participant.local),
    isInstructor: Boolean(participant.owner),
    isMuted: participant.tracks?.audio?.state !== "playable",
    isCameraOn: participant.tracks?.video?.state === "playable",
    audioTrack: participant.local ? null : participant.tracks?.audio?.persistentTrack || null,
    videoTrack: participant.tracks?.video?.persistentTrack || null,
  };
}

function buildInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "YO";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}
