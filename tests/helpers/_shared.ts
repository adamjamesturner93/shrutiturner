export function sanitizeSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function uniqueToken(label: string) {
  const segment = sanitizeSegment(label) || "item";
  return `${segment}-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;
}
