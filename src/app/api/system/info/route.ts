import { NextResponse } from "next/server";
import { getDocker } from "@/lib/docker";
import type { SystemInfo } from "@/types/docker";

export async function GET() {
  try {
    const docker = getDocker();

    const [info, version] = await Promise.all([
      docker.info(),
      docker.version(),
    ]);

    const systemInfo: SystemInfo = {
      dockerVersion: version.Version,
      apiVersion: version.ApiVersion,
      os: info.OperatingSystem,
      arch: info.Architecture,
      kernelVersion: info.KernelVersion,
      totalMemory: info.MemTotal,
      cpus: info.NCPU,
      containers: info.Containers,
      containersRunning: info.ContainersRunning,
      containersStopped: info.ContainersStopped,
      containersPaused: info.ContainersPaused,
      images: info.Images,
      serverTime: new Date().toISOString(),
    };

    return NextResponse.json(systemInfo);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to connect to Docker",
        details: message,
      },
      { status: 503 },
    );
  }
}
