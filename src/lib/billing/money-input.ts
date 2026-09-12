/** Parse pounds without floating-point rounding or silently accepting excess decimals. */
export function parsePoundsToPence(value: string): number | null {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const result = Number(match[1]) * 100 + Number((match[2] || "").padEnd(2, "0"));
  return Number.isSafeInteger(result) && result > 0 ? result : null;
}
