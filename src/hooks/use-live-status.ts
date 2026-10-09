"use client";
import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";

export function useLiveStatus<T>(url: string, initial: T) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState(false);
  const sequence = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++sequence.current;
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("Status unavailable");
      const next = (await response.json()) as T;
      if (request === sequence.current) {
        setData(next);
        setError(false);
      }
    } catch {
      if (request === sequence.current) setError(true);
    }
  }, [url]);
  useEffect(() => {
    const requests = sequence;
    void refresh();
    const interval = window.setInterval(() => void refresh(), 5000);
    const update = () => void refresh();
    window.addEventListener("focus", update);
    window.addEventListener("online", update);
    return () => {
      requests.current++;
      window.clearInterval(interval);
      window.removeEventListener("focus", update);
      window.removeEventListener("online", update);
    };
  }, [refresh]);
  const update = useCallback((value: SetStateAction<T>) => {
    sequence.current++;
    setData(value);
  }, []);
  return { data, error, refresh, setData: update };
}
