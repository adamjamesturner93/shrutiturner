export const DEDUPE_PREFIX = "st-ga-sent:";
export const DEDUPE_TTL = 180 * 86400000;
export function validDedupeRecord(value: string | null, now = Date.now()): boolean {
  try {
    const record = JSON.parse(value || "null");
    return (
      typeof record?.recordedAt === "number" &&
      Number.isFinite(record.recordedAt) &&
      record.recordedAt <= now &&
      record.recordedAt + DEDUPE_TTL > now
    );
  } catch {
    return false;
  }
}
export function cleanupDedupe(storage: Storage, withdraw = false, now = Date.now()) {
  for (let i = storage.length - 1; i >= 0; i--) {
    const key = storage.key(i);
    if (
      key?.startsWith(DEDUPE_PREFIX) &&
      (withdraw || !validDedupeRecord(storage.getItem(key), now))
    )
      storage.removeItem(key);
  }
}
