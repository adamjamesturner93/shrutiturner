"use client";
import { useEffect, useState } from "react";
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
  return data as T;
}
export function useProgrammeData<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    programmeRequest<T>(url)
      .then((value) => {
        if (active) {
          setData(value);
          setError("");
        }
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [url, version]);
  return { data, error, reload: () => setVersion((value) => value + 1) };
}
export function When({ value }: { value?: string | null }) {
  return value ? (
    <time dateTime={value}>
      {new Date(value).toLocaleString("en-GB", {
        timeZone: "Europe/London",
        dateStyle: "medium",
        timeStyle: "short",
      })}{" "}
      (UK time)
    </time>
  ) : null;
}
export const panelClass = "bg-background rounded-xl border p-5 space-y-3";
