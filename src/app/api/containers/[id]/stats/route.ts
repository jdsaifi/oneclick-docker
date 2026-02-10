import { NextRequest } from "next/server";
import { getDocker } from "@/lib/docker";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const docker = getDocker();
    const container = docker.getContainer(id);

    // Verify container exists and is running
    const info = await container.inspect();
    if (!info.State.Running) {
      return Response.json(
        { error: "Container is not running" },
        { status: 400 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statsStream: any = await container.stats({ stream: true });
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        let buffer = "";

        statsStream.on("data", (chunk: Buffer) => {
          buffer += chunk.toString("utf-8");

          // Docker stats sends newline-delimited JSON
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const raw = JSON.parse(line);
              const parsed = parseStats(raw);
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`),
              );
            } catch {
              // Skip malformed JSON
            }
          }
        });

        statsStream.on("end", () => {
          try {
            controller.close();
          } catch {
            // Already closed
          }
        });

        statsStream.on("error", () => {
          try {
            controller.close();
          } catch {
            // Already closed
          }
        });

        request.signal.addEventListener("abort", () => {
          try {
            statsStream.destroy();
          } catch {
            // Ignore
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { error: "Failed to get stats", details: message },
      { status: 500 },
    );
  }
}

interface ContainerStats {
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

function parseStats(raw: Record<string, unknown>): ContainerStats {
  // CPU calculation
  const cpuStats = raw.cpu_stats as Record<string, unknown> | undefined;
  const preCpuStats = raw.precpu_stats as Record<string, unknown> | undefined;
  const cpuUsage = cpuStats?.cpu_usage as Record<string, unknown> | undefined;
  const preCpuUsage = preCpuStats?.cpu_usage as Record<string, unknown> | undefined;

  const cpuDelta =
    ((cpuUsage?.total_usage as number) ?? 0) -
    ((preCpuUsage?.total_usage as number) ?? 0);
  const systemDelta =
    ((cpuStats?.system_cpu_usage as number) ?? 0) -
    ((preCpuStats?.system_cpu_usage as number) ?? 0);
  const numCpus = ((cpuStats?.online_cpus as number) ?? 1);
  const cpuPercent =
    systemDelta > 0 ? (cpuDelta / systemDelta) * numCpus * 100 : 0;

  // Memory
  const memStats = raw.memory_stats as Record<string, unknown> | undefined;
  const memoryUsage = (memStats?.usage as number) ?? 0;
  const memoryLimit = (memStats?.limit as number) ?? 0;
  const memoryPercent = memoryLimit > 0 ? (memoryUsage / memoryLimit) * 100 : 0;

  // Network
  const networks = raw.networks as Record<string, Record<string, number>> | undefined;
  let networkRx = 0;
  let networkTx = 0;
  if (networks) {
    for (const iface of Object.values(networks)) {
      networkRx += iface.rx_bytes ?? 0;
      networkTx += iface.tx_bytes ?? 0;
    }
  }

  // Block I/O
  const blkio = raw.blkio_stats as Record<string, unknown> | undefined;
  const ioService = (blkio?.io_service_bytes_recursive as { op: string; value: number }[]) ?? [];
  let blockRead = 0;
  let blockWrite = 0;
  for (const entry of ioService) {
    if (entry.op === "read" || entry.op === "Read") blockRead += entry.value;
    if (entry.op === "write" || entry.op === "Write") blockWrite += entry.value;
  }

  // PIDs
  const pidStats = raw.pids_stats as Record<string, number> | undefined;
  const pids = pidStats?.current ?? 0;

  return {
    cpuPercent: Math.round(cpuPercent * 100) / 100,
    memoryUsage,
    memoryLimit,
    memoryPercent: Math.round(memoryPercent * 100) / 100,
    networkRx,
    networkTx,
    blockRead,
    blockWrite,
    pids,
    timestamp: (raw.read as string) ?? new Date().toISOString(),
  };
}
