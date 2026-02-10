"use client";

import { useState, useEffect } from "react";
import type { SystemInfo } from "@/types/docker";

export function useSystemInfo() {
  const [data, setData] = useState<SystemInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInfo() {
      try {
        const res = await fetch("/api/system/info");
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.details || body.error || "Failed to fetch");
        }
        const info: SystemInfo = await res.json();
        setData(info);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchInfo();
    const interval = setInterval(fetchInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  return { data, error, loading };
}
