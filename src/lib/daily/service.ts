const DEFAULT_DAILY_BASE = "https://api.daily.co/v1";

function getDailyConfig() {
  const apiKey = process.env.DAILY_API_KEY;
  const baseUrl = process.env.DAILY_API_BASE || DEFAULT_DAILY_BASE;
  return { apiKey, baseUrl };
}

export function isDailyConfigured() {
  return Boolean(getDailyConfig().apiKey);
}

export async function createSessionRoom(sessionId: string, startsAtUtc: Date, endsAtUtc: Date) {
  const { apiKey, baseUrl } = getDailyConfig();
  if (!apiKey) {
    throw new Error("DAILY_NOT_CONFIGURED");
  }

  const roomName = `class-${sessionId}`;
  const exp = Math.floor(endsAtUtc.getTime() / 1000) + 2 * 60 * 60;
  const nbf = Math.floor(startsAtUtc.getTime() / 1000) - 15 * 60;

  const response = await fetch(`${baseUrl}/rooms`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: roomName,
      privacy: "public",
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
  const { apiKey, baseUrl } = getDailyConfig();
  if (!apiKey) {
    throw new Error("DAILY_NOT_CONFIGURED");
  }

  const response = await fetch(`${baseUrl}/rooms/${roomName}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new Error(`DAILY_DELETE_ROOM_FAILED:${response.status}:${text}`);
  }
}
