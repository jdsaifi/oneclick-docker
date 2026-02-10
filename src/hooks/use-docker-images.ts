"use client";

import { useState, useEffect, useCallback } from "react";

export interface DockerImage {
  id: string;
  repoTags: string[];
  repoDigests: string[];
  created: number;
  size: number;
  virtualSize: number;
  labels: Record<string, string>;
}

export function useDockerImages() {
  const [images, setImages] = useState<DockerImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch("/api/images");
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.details || body.error || "Failed to fetch");
      }
      const data: DockerImage[] = await res.json();
      setImages(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return { images, error, loading, refetch: fetchImages };
}
