"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface LogEntry {
  stream: "stdout" | "stderr";
  text: string;
}

export function useContainerLogs(containerId: string, enabled = true) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!containerId || !enabled) return;

    // Close existing connection
    eventSourceRef.current?.close();

    const es = new EventSource(
      `/api/containers/${containerId}/logs?tail=500&follow=true`,
    );
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      if (event.data === "[DONE]") {
        setConnected(false);
        return;
      }
      try {
        const entry: LogEntry = JSON.parse(event.data);
        setLogs((prev) => {
          // Cap at 5000 lines to avoid memory issues
          const next = [...prev, entry];
          return next.length > 5000 ? next.slice(-5000) : next;
        });
      } catch {
        // Skip malformed data
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

  const clear = useCallback(() => setLogs([]), []);

  return { logs, connected, clear, reconnect: connect };
}
