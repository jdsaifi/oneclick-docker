"use client";

import { useState, useEffect, useCallback } from "react";
import type { ContainerInfo } from "@/types/docker";

export function useContainers(pollInterval = 5000) {
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchContainers = useCallback(async () => {
    try {
      const res = await fetch("/api/containers");
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.details || body.error || "Failed to fetch");
      }
      const data: ContainerInfo[] = await res.json();
      setContainers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, pollInterval);
    return () => clearInterval(interval);
  }, [fetchContainers, pollInterval]);

  const performAction = useCallback(
    async (id: string, action: "start" | "stop" | "restart" | "remove") => {
      const url =
        action === "remove"
          ? `/api/containers/${id}`
          : `/api/containers/${id}/${action}`;
      const method = action === "remove" ? "DELETE" : "POST";

      const res = await fetch(url, { method });
      if (!res.ok && res.status !== 304) {
        const body = await res.json();
        throw new Error(body.details || body.error || `Failed to ${action}`);
      }

      // Refresh immediately after action
      await fetchContainers();
    },
    [fetchContainers],
  );

  return { containers, error, loading, refetch: fetchContainers, performAction };
}
