const DAILY_SCRIPT_SRC = "https://unpkg.com/@daily-co/daily-js/dist/daily-iframe.js";
const DEVICE_SETTINGS_KEY = "video-device-settings";

export type SavedDeviceSettings = {
  cameraId: string;
  micId: string;
  speakerId: string;
};

export type DailyParticipant = {
  session_id: string;
  user_id?: string;
  user_name?: string;
  local?: boolean;
  owner?: boolean;
  tracks?: {
    audio?: { state?: string; persistentTrack?: MediaStreamTrack | null };
    video?: { state?: string; persistentTrack?: MediaStreamTrack | null };
  };
};

export type DailyCallObject = {
  on: (event: string, callback: (event?: unknown) => void) => void;
  off: (event: string, callback?: (event?: unknown) => void) => void;
  join: (properties: Record<string, unknown>) => Promise<void>;
  leave: () => Promise<void>;
  destroy: () => void;
  participants: () => Record<string, DailyParticipant>;
  setLocalAudio: (enabled: boolean) => Promise<void> | void;
  setLocalVideo: (enabled: boolean) => Promise<void> | void;
  setInputDevicesAsync?: (devices: { audioSource?: string; videoSource?: string }) => Promise<void>;
  setOutputDeviceAsync?: (deviceId: string) => Promise<void>;
  sendAppMessage?: (message: Record<string, unknown>, to?: string | "*") => Promise<void> | void;
};

type DailyCreateCallObjectOptions = {
  allowMultipleCallInstances?: boolean;
};

declare global {
  interface Window {
    DailyIframe?: {
      createCallObject: (properties?: DailyCreateCallObjectOptions) => DailyCallObject;
    };
  }
}

let dailyScriptPromise: Promise<void> | null = null;
let activeCallObject: DailyCallObject | null = null;
let callLifecyclePromise: Promise<void> = Promise.resolve();
const releasingCallObjects = new WeakSet<DailyCallObject>();

export function loadSavedDeviceSettings(): SavedDeviceSettings {
  if (typeof window === "undefined") {
    return { cameraId: "", micId: "", speakerId: "" };
  }

  try {
    const saved = window.localStorage.getItem(DEVICE_SETTINGS_KEY);
    if (!saved) return { cameraId: "", micId: "", speakerId: "" };
    const parsed = JSON.parse(saved) as Partial<SavedDeviceSettings>;
    return {
      cameraId: parsed.cameraId || "",
      micId: parsed.micId || "",
      speakerId: parsed.speakerId || "",
    };
  } catch {
    return { cameraId: "", micId: "", speakerId: "" };
  }
}

export function saveDeviceSettings(settings: SavedDeviceSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEVICE_SETTINGS_KEY, JSON.stringify(settings));
}

export function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export async function getPreviewStream(
  settings: SavedDeviceSettings,
  options?: { camera?: boolean; mic?: boolean }
) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("MEDIA_DEVICES_UNSUPPORTED");
  }

  const constraints: MediaStreamConstraints = {
    audio:
      options?.mic === false
        ? false
        : {
            deviceId: settings.micId ? { exact: settings.micId } : undefined,
          },
    video:
      options?.camera === false
        ? false
        : {
            deviceId: settings.cameraId ? { exact: settings.cameraId } : undefined,
          },
  };

  return navigator.mediaDevices.getUserMedia(constraints);
}

export async function listMediaDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) {
    return [];
  }
  return navigator.mediaDevices.enumerateDevices();
}

export async function loadDailyIframe() {
  if (typeof window === "undefined") {
    throw new Error("WINDOW_UNAVAILABLE");
  }
  if (window.DailyIframe) {
    return window.DailyIframe;
  }

  if (!dailyScriptPromise) {
    dailyScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${DAILY_SCRIPT_SRC}"]`
      );
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("DAILY_SCRIPT_LOAD_FAILED")), {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.src = DAILY_SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("DAILY_SCRIPT_LOAD_FAILED"));
      document.head.appendChild(script);
    });
  }

  await dailyScriptPromise;

  if (!window.DailyIframe) {
    throw new Error("DAILY_NOT_AVAILABLE");
  }

  return window.DailyIframe;
}

async function releaseCallObjectInternally(callObject: DailyCallObject) {
  if (releasingCallObjects.has(callObject)) {
    return;
  }

  releasingCallObjects.add(callObject);
  try {
    await callObject.leave().catch(() => undefined);
  } finally {
    callObject.destroy();
    if (activeCallObject === callObject) {
      activeCallObject = null;
    }
  }
}

export async function createManagedCallObject(properties?: DailyCreateCallObjectOptions) {
  const daily = await loadDailyIframe();

  if (activeCallObject) {
    const previousCallObject = activeCallObject;
    activeCallObject = null;
    callLifecyclePromise = callLifecyclePromise.then(() =>
      releaseCallObjectInternally(previousCallObject)
    );
  }

  await callLifecyclePromise;
  const callObject = daily.createCallObject(properties);
  activeCallObject = callObject;
  return callObject;
}

export function releaseManagedCallObject(callObject: DailyCallObject | null) {
  if (!callObject) {
    return callLifecyclePromise;
  }

  if (activeCallObject === callObject) {
    activeCallObject = null;
  }

  callLifecyclePromise = callLifecyclePromise.then(() => releaseCallObjectInternally(callObject));
  return callLifecyclePromise;
}

export function attachTrack(
  element: HTMLMediaElement | null,
  track: MediaStreamTrack | null | undefined,
  muted = false
) {
  if (!element) return;
  element.muted = muted;

  if (!track) {
    element.srcObject = null;
    return;
  }

  const stream = new MediaStream([track]);
  element.srcObject = stream;
  void element.play().catch(() => undefined);
}
