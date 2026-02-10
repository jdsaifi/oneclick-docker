import { NextRequest, NextResponse } from "next/server";
import { getDocker } from "@/lib/docker";
import { parseContainerInfo } from "@/lib/docker-utils";
import { RESOURCE_TIERS } from "@/types/docker";

export async function GET(request: NextRequest) {
  try {
    const docker = getDocker();
    const searchParams = request.nextUrl.searchParams;
    const all = searchParams.get("all") !== "false"; // show all by default
    const status = searchParams.get("status"); // running, exited, etc.

    const filters: Record<string, string[]> = {};
    if (status) {
      filters.status = [status];
    }

    const containers = await docker.listContainers({ all, filters });
    const parsed = containers.map(parseContainerInfo);

    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to list containers", details: message },
      { status: 500 },
    );
  }
}

interface CreateContainerBody {
  image: string;
  tag: string;
  name?: string;
  ports: { container: number; host: number; protocol: "tcp" | "udp" }[];
  volumes: {
    containerPath: string;
    name: string;
    type: "volume" | "bind";
    hostPath?: string;
  }[];
  env: { key: string; value: string }[];
  sizeId: string;
  customCpus?: number;
  customMemoryMB?: number;
  networkMode: string;
  restartPolicy: string;
  hostname?: string;
  command?: string;
  labels?: { key: string; value: string }[];
}

export async function POST(request: NextRequest) {
  try {
    const docker = getDocker();
    const body: CreateContainerBody = await request.json();
    const imageRef = `${body.image}:${body.tag}`;

    // Pull image if not available locally
    try {
      await docker.getImage(imageRef).inspect();
    } catch {
      // Image not found locally — pull it
      await new Promise<void>((resolve, reject) => {
        docker.pull(imageRef, (err: Error | null, stream: NodeJS.ReadableStream) => {
          if (err) return reject(err);
          docker.modem.followProgress(stream, (err: Error | null) => {
            if (err) return reject(err);
            resolve();
          });
        });
      });
    }

    // Build port bindings and exposed ports
    const exposedPorts: Record<string, object> = {};
    const portBindings: Record<string, { HostPort: string }[]> = {};
    for (const p of body.ports) {
      if (p.container > 0) {
        const key = `${p.container}/${p.protocol}`;
        exposedPorts[key] = {};
        portBindings[key] = [{ HostPort: String(p.host || 0) }];
      }
    }

    // Build volume binds and volume declarations
    const volumeDeclarations: Record<string, object> = {};
    const binds: string[] = [];
    for (const v of body.volumes) {
      if (!v.containerPath) continue;
      volumeDeclarations[v.containerPath] = {};
      if (v.type === "bind" && v.hostPath) {
        binds.push(`${v.hostPath}:${v.containerPath}`);
      } else if (v.name) {
        binds.push(`${v.name}:${v.containerPath}`);
      }
    }

    // Build env array
    const envArr = body.env
      .filter((e) => e.key)
      .map((e) => `${e.key}=${e.value}`);

    // Resolve resource limits
    let nanoCpus: number | undefined;
    let memory: number | undefined;
    if (body.sizeId === "custom") {
      nanoCpus = (body.customCpus ?? 1) * 1e9;
      memory = (body.customMemoryMB ?? 1024) * 1024 * 1024;
    } else {
      const tier = RESOURCE_TIERS.find((t) => t.id === body.sizeId);
      if (tier) {
        nanoCpus = tier.cpus * 1e9;
        memory = tier.memory;
      }
    }

    // Build labels
    const labels: Record<string, string> = { "managed-by": "oneclick-docker" };
    if (body.labels) {
      for (const l of body.labels) {
        if (l.key) labels[l.key] = l.value;
      }
    }

    // Parse command
    const cmd = body.command?.trim()
      ? body.command.trim().split(/\s+/)
      : undefined;

    // Map restart policy
    const restartPolicyMap: Record<string, { Name: string; MaximumRetryCount: number }> = {
      "no": { Name: "", MaximumRetryCount: 0 },
      "always": { Name: "always", MaximumRetryCount: 0 },
      "unless-stopped": { Name: "unless-stopped", MaximumRetryCount: 0 },
      "on-failure": { Name: "on-failure", MaximumRetryCount: 5 },
    };

    const container = await docker.createContainer({
      Image: imageRef,
      name: body.name || undefined,
      Hostname: body.hostname || undefined,
      Cmd: cmd,
      Env: envArr,
      ExposedPorts: exposedPorts,
      Volumes: volumeDeclarations,
      Labels: labels,
      HostConfig: {
        PortBindings: portBindings,
        Binds: binds.length > 0 ? binds : undefined,
        NanoCpus: nanoCpus,
        Memory: memory,
        NetworkMode: body.networkMode || "bridge",
        RestartPolicy: restartPolicyMap[body.restartPolicy] ?? restartPolicyMap["unless-stopped"],
      },
    });

    // Start the container
    await container.start();

    // Return container info
    const info = await container.inspect();
    const networkSettings = info.NetworkSettings as Record<string, unknown>;
    const ipAddress = (networkSettings?.IPAddress as string) || "";
    const gateway = (networkSettings?.Gateway as string) || "";

    return NextResponse.json({
      success: true,
      container: {
        id: info.Id,
        name: info.Name?.replace(/^\//, ""),
        image: imageRef,
        ipAddress,
        gateway,
        ports: body.ports,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create container", details: message },
      { status: 500 },
    );
  }
}
