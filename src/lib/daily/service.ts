const DEFAULT_DAILY_BASE = "https://api.daily.co/v1";
const PRE_JOIN_WINDOW_SECONDS = 24 * 60 * 60;

export type DailyMediaPermission =
  | boolean
  | Array<"video" | "audio" | "screenVideo" | "screenAudio">;
export type DailyAdminPermission = boolean | Array<"participants" | "streaming" | "transcription">;

export type DailyCanReceivePermissions = {
  base?: DailyMediaPermission;
  byUserId?: Record<string, DailyMediaPermission>;
  byParticipantId?: Record<string, DailyMediaPermission>;
};

export type DailyParticipantPermissions = {
  hasPresence?: boolean;
  canSend?: DailyMediaPermission;
  canReceive?: DailyCanReceivePermissions;
  canAdmin?: DailyAdminPermission;
};

export type DailyRecordingSession = {
  id: string;
  roomName: string;
  status?: string;
  playbackUrl?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
};

function getDailyConfig() {
  const apiKey = process.env.DAILY_API_KEY;
  const baseUrl = process.env.DAILY_API_BASE || DEFAULT_DAILY_BASE;
  const webhookSecret = process.env.DAILY_WEBHOOK_SECRET;
  return { apiKey, baseUrl, webhookSecret };
}

function getDailyHeaders() {
  const { apiKey } = getDailyConfig();
  if (!apiKey) {
    throw new Error("DAILY_NOT_CONFIGURED");
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export function isDailyConfigured() {
  return Boolean(getDailyConfig().apiKey);
}

export async function createSessionRoom(
  sessionId: string,
  startsAtUtc: Date,
  endsAtUtc: Date,
  options?: { maxParticipants?: number }
) {
  const { baseUrl } = getDailyConfig();

  const roomName = `class-${sessionId}`;
  const exp = Math.floor(endsAtUtc.getTime() / 1000) + 2 * 60 * 60;
  const nbf = Math.floor(startsAtUtc.getTime() / 1000) - PRE_JOIN_WINDOW_SECONDS;

  const response = await fetch(`${baseUrl}/rooms`, {
    method: "POST",
    headers: getDailyHeaders(),
    body: JSON.stringify({
      name: roomName,
      privacy: "private",
      properties: {
        exp,
        nbf,
        enable_network_ui: true,
        enable_knocking: true,
        ...(options?.maxParticipants
          ? { max_participants: Math.max(2, options.maxParticipants) }
          : {}),
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    if (
      (response.status === 400 || response.status === 409) &&
      /already|exists|taken/i.test(text)
    ) {
      const existing = await fetch(`${baseUrl}/rooms/${roomName}`, {
        headers: getDailyHeaders(),
      });
      if (existing.ok) {
        const payload = (await existing.json()) as { name: string; url: string };
        return { roomName: payload.name, roomUrl: payload.url };
      }
    }
    throw new Error(`DAILY_CREATE_ROOM_FAILED:${response.status}:${text}`);
  }

  const payload = (await response.json()) as { name: string; url: string };
  return {
    roomName: payload.name,
    roomUrl: payload.url,
  };
}

export async function ejectRoomParticipant(roomName: string, participantId: string) {
  const { baseUrl } = getDailyConfig();
  const response = await fetch(`${baseUrl}/rooms/${roomName}/eject`, {
    method: "POST",
    headers: getDailyHeaders(),
    body: JSON.stringify({ ids: [participantId] }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DAILY_EJECT_PARTICIPANT_FAILED:${response.status}:${body}`);
  }
}

export async function deleteSessionRoom(roomName: string) {
  const { baseUrl } = getDailyConfig();

  const response = await fetch(`${baseUrl}/rooms/${roomName}`, {
    method: "DELETE",
    headers: getDailyHeaders(),
  });

  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new Error(`DAILY_DELETE_ROOM_FAILED:${response.status}:${text}`);
  }
}

export async function createMeetingToken(params: {
  roomName: string;
  userId: string;
  userName: string;
  isOwner: boolean;
  expiresAt?: Date;
  permissions?: DailyParticipantPermissions;
}) {
  const { baseUrl } = getDailyConfig();
  const exp = Math.floor((params.expiresAt?.getTime() || Date.now() + 4 * 60 * 60 * 1000) / 1000);

  const response = await fetch(`${baseUrl}/meeting-tokens`, {
    method: "POST",
    headers: getDailyHeaders(),
    body: JSON.stringify({
      properties: {
        room_name: params.roomName,
        is_owner: params.isOwner,
        user_name: params.userName,
        user_id: params.userId,
        exp,
        permissions: params.permissions,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DAILY_CREATE_TOKEN_FAILED:${response.status}:${text}`);
  }

  const payload = (await response.json()) as { token?: string };
  if (!payload.token) {
    throw new Error("DAILY_CREATE_TOKEN_MISSING");
  }

  return payload.token;
}

export async function updateRoomPermissions(params: {
  roomName: string;
  data: Record<string, DailyParticipantPermissions>;
}) {
  const { baseUrl } = getDailyConfig();

  const response = await fetch(`${baseUrl}/rooms/${params.roomName}/update-permissions`, {
    method: "POST",
    headers: getDailyHeaders(),
    body: JSON.stringify({
      data: params.data,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DAILY_UPDATE_PERMISSIONS_FAILED:${response.status}:${text}`);
  }

  return response.json().catch(() => null);
}

export function verifyDailyWebhookAuthorization(headers: Headers) {
  const { webhookSecret } = getDailyConfig();
  if (!webhookSecret) {
    return false;
  }

  const authorization = headers.get("authorization");
  if (!authorization) {
    return false;
  }

  return authorization === `Bearer ${webhookSecret}`;
}

function normalizeDailyRecording(
  payload: Record<string, unknown>,
  roomName: string
): DailyRecordingSession {
  return {
    id:
      typeof payload.id === "string"
        ? payload.id
        : typeof payload.recordingId === "string"
          ? payload.recordingId
          : typeof payload.recording_id === "string"
            ? payload.recording_id
            : "",
    roomName,
    status: typeof payload.status === "string" ? payload.status : undefined,
    playbackUrl:
      typeof payload.playbackUrl === "string"
        ? payload.playbackUrl
        : typeof payload.playback_url === "string"
          ? payload.playback_url
          : typeof payload.url === "string"
            ? payload.url
            : null,
    startedAt:
      typeof payload.startedAt === "string"
        ? payload.startedAt
        : typeof payload.started_at === "string"
          ? payload.started_at
          : null,
    completedAt:
      typeof payload.completedAt === "string"
        ? payload.completedAt
        : typeof payload.completed_at === "string"
          ? payload.completed_at
          : null,
  };
}

export async function startRoomRecording(roomName: string) {
  const { baseUrl } = getDailyConfig();

  const response = await fetch(`${baseUrl}/rooms/${roomName}/recordings/start`, {
    method: "POST",
    headers: getDailyHeaders(),
    body: JSON.stringify({
      type: "cloud",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DAILY_START_RECORDING_FAILED:${response.status}:${text}`);
  }

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return normalizeDailyRecording(payload, roomName);
}

export async function stopRoomRecording(roomName: string) {
  const { baseUrl } = getDailyConfig();

  const response = await fetch(`${baseUrl}/rooms/${roomName}/recordings/stop`, {
    method: "POST",
    headers: getDailyHeaders(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DAILY_STOP_RECORDING_FAILED:${response.status}:${text}`);
  }

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return normalizeDailyRecording(payload, roomName);
}

export async function deleteRecording(recordingId: string) {
  const { baseUrl } = getDailyConfig();

  const response = await fetch(`${baseUrl}/recordings/${recordingId}`, {
    method: "DELETE",
    headers: getDailyHeaders(),
  });

  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new Error(`DAILY_DELETE_RECORDING_FAILED:${response.status}:${text}`);
  }

  return { deleted: response.status !== 404 };
}
