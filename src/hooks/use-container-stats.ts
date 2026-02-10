"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface ContainerStats {
  cpuPercent: number;
  memoryUsage: number;
  memoryLimit: number;
  memoryPercent: number;
  networkRx: number;
  networkTx: number;
  blockRead: number;
  blockWrite: number;
  pids: number;
  timestamp: string;
}

export function useContainerStats(containerId: string, enabled = true) {
  const [stats, setStats] = useState<ContainerStats | null>(null);
  const [history, setHistory] = useState<ContainerStats[]>([]);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!containerId || !enabled) return;

    eventSourceRef.current?.close();

    const es = new EventSource(`/api/containers/${containerId}/stats`);
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const data: ContainerStats = JSON.parse(event.data);
        setStats(data);
        setHistory((prev) => {
          const next = [...prev, data];
          // Keep last 60 data points (~1 min at 1/s)
          return next.length > 60 ? next.slice(-60) : next;
        });
      } catch {
        // Skip
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
    };
  }, [containerId, enabled]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connect]);

  return { stats, history, connected };
}
