"use client";
import { useEffect, useState } from "react";
import { sessionLabel } from "@/lib/programmes/presentation";
export async function programmeRequest<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    cache: "no-store",
    ...(body === undefined
      ? {}
      : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Unable to complete your request");
  if (body !== undefined) window.dispatchEvent(new Event("programme:updated"));
  return data as T;
}
export function useProgrammeData<T>(url: string, refreshKey?: string) {
  const [result, setResult] = useState<{ url: string; data: T } | null>(null);
  const [failure, setFailure] = useState<{ url: string; message: string } | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const refresh = () => setVersion((value) => value + 1);
    window.addEventListener("focus", refresh);
    window.addEventListener("programme:updated", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("programme:updated", refresh);
    };
  }, []);
  useEffect(() => {
    let active = true;
    programmeRequest<T>(url)
      .then((value) => {
        if (active) {
          setResult({ url, data: value });
          setFailure(null);
        }
      })
      .catch((e: Error) => {
        if (active) {
          setFailure({ url, message: e.message });
          setResult(null);
        }
      });
    return () => {
      active = false;
    };
  }, [url, version, refreshKey]);
  return {
    data: result?.url === url ? result.data : null,
    error: failure?.url === url ? failure.message : "",
    reload: () => setVersion((value) => value + 1),
  };
}
export function When({ value }: { value?: string | null }) {
  return value ? <time dateTime={value}>{sessionLabel(value, "Europe/London")}</time> : null;
}
export const panelClass =
  "bg-background rounded-2xl border border-brand-dark/10 p-5 md:p-6 space-y-4 shadow-sm [&_h2]:text-2xl [&_h3]:text-xl [&_summary]:cursor-pointer [&_summary]:py-2 [&_summary]:font-semibold [&_summary]:text-lg [&_summary]:focus-visible:outline-2 [&_summary]:focus-visible:outline-offset-4";
