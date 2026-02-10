"use client";

import { ImageList } from "@/components/images/image-list";
import { useDockerImages } from "@/hooks/use-docker-images";

export default function ImagesPage() {
  const { images, loading, error, refetch } = useDockerImages();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Images</h1>
        <p className="text-muted-foreground mt-1">Manage your Docker images</p>
      </div>
      <ImageList
        images={images}
        loading={loading}
        error={error}
        onRefetch={refetch}
      />
    </div>
  );
}
