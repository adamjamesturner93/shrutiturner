const DEFAULT_DAILY_BASE = "https://api.daily.co/v1";

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

export async function createSessionRoom(sessionId: string, startsAtUtc: Date, endsAtUtc: Date) {
  const { baseUrl } = getDailyConfig();

  const roomName = `class-${sessionId}`;
  const exp = Math.floor(endsAtUtc.getTime() / 1000) + 2 * 60 * 60;
  const nbf = Math.floor(startsAtUtc.getTime() / 1000) - 15 * 60;

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
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DAILY_CREATE_ROOM_FAILED:${response.status}:${text}`);
  }

  const payload = (await response.json()) as { name: string; url: string };
  return {
    roomName: payload.name,
    roomUrl: payload.url,
  };
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
