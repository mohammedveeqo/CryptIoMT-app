"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CacheEntry<T> = { data: T; ts: number };

const memCache = new Map<string, CacheEntry<any>>();

export function useCachedQuery<T>(key: string, liveData: T | undefined, ttlMs = 1000 * 60 * 60 * 24 * 7) {
  const [value, setValue] = useState<T | undefined>(() => {
    const entry = memCache.get(key) ?? (() => {
      try {
        const raw = typeof window !== "undefined" ? localStorage.getItem(`cache:${key}`) : null;
        if (!raw) return undefined;
        const parsed = JSON.parse(raw) as CacheEntry<T>;
        if (Date.now() - parsed.ts > ttlMs) return undefined;
        memCache.set(key, parsed);
        return parsed;
      } catch {
        return undefined;
      }
    })();
    return entry?.data;
  });

  const prevLive = useRef<T | undefined>(undefined);

  useEffect(() => {
    if (liveData === undefined) return;
    if (prevLive.current === liveData) return;
    prevLive.current = liveData;
    const entry = { data: liveData, ts: Date.now() };
    memCache.set(key, entry);
    try {
      if (typeof window !== "undefined") localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
    } catch {}
    setValue(liveData);
  }, [key, liveData, ttlMs]);

  const invalidate = useMemo(() => {
    return () => {
      memCache.delete(key);
      try {
        if (typeof window !== "undefined") localStorage.removeItem(`cache:${key}`);
      } catch {}
      setValue(undefined);
      prevLive.current = undefined;
    };
  }, [key]);

  return { data: value, invalidate };
}

