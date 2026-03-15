const stores = new Map<string, Map<string, number[]>>();

export function isRateLimited(options: {
  scope: string;
  key: string;
  windowMs: number;
  max: number;
}) {
  const now = Date.now();
  const scopeStore = stores.get(options.scope) || new Map<string, number[]>();
  const attempts = scopeStore.get(options.key) || [];
  const recent = attempts.filter((timestamp) => now - timestamp < options.windowMs);

  if (recent.length >= options.max) {
    scopeStore.set(options.key, recent);
    stores.set(options.scope, scopeStore);
    return true;
  }

  recent.push(now);
  scopeStore.set(options.key, recent);
  stores.set(options.scope, scopeStore);
  return false;
}
