import { NextRequest, NextResponse } from "next/server";
import { getDocker } from "@/lib/docker";

export async function GET() {
  try {
    const docker = getDocker();
    const { Volumes } = await docker.listVolumes();

    // Also get containers to find which volumes are in use
    const containers = await docker.listContainers({ all: true });
    const usedVolumes = new Set<string>();
    for (const c of containers) {
      for (const m of c.Mounts ?? []) {
        if (m.Name) usedVolumes.add(m.Name);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = (Volumes ?? []).map((v: any) => ({
      name: v.Name,
      driver: v.Driver,
      mountpoint: v.Mountpoint,
      createdAt: v.CreatedAt,
      labels: v.Labels ?? {},
      scope: v.Scope,
      inUse: usedVolumes.has(v.Name),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to list volumes", details: message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const docker = getDocker();
    const { name, driver, labels } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Volume name is required" },
        { status: 400 },
      );
    }

    const volume = await docker.createVolume({
      Name: name,
      Driver: driver || "local",
      Labels: labels || {},
    });

    return NextResponse.json({ success: true, name: volume.Name });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create volume", details: message },
      { status: 500 },
    );
  }
}
