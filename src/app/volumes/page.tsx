"use client";

import { VolumeList } from "@/components/volumes/volume-list";

export default function VolumesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Volumes</h1>
        <p className="text-muted-foreground mt-1">Manage persistent storage</p>
      </div>
      <VolumeList />
    </div>
  );
}
