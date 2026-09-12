"use client";

import { useSearchParams } from "next/navigation";

/** Persist only explicitly allowed, non-sensitive navigation values in the URL. */
export function useAdminSection<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T
): [T, (value: string) => void] {
  const searchParams = useSearchParams();
  const requested = searchParams.get(key);
  const selected = allowed.find((value) => value === requested) ?? fallback;
  return [
    selected,
    (value) => {
      if (!allowed.some((candidate) => candidate === value)) return;
      const url = new URL(window.location.href);
      if (value === fallback) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    },
  ];
}
