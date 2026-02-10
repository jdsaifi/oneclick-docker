import { NextRequest, NextResponse } from "next/server";
import { getDocker } from "@/lib/docker";

export async function GET() {
  try {
    const docker = getDocker();
    const networks = await docker.listNetworks();

    // Get containers to show which are attached to each network
    const containers = await docker.listContainers({ all: true });
    const containersByNetwork = new Map<string, { id: string; name: string }[]>();
    for (const c of containers) {
      const nets = c.NetworkSettings?.Networks;
      if (nets) {
        for (const netName of Object.keys(nets)) {
          if (!containersByNetwork.has(netName)) {
            containersByNetwork.set(netName, []);
          }
          containersByNetwork.get(netName)!.push({
            id: c.Id.substring(0, 12),
            name: (c.Names?.[0] ?? "").replace(/^\//, ""),
          });
        }
      }
    }

    const parsed = networks.map((n) => ({
      id: n.Id,
      name: n.Name,
      driver: n.Driver ?? "unknown",
      scope: n.Scope ?? "",
      internal: n.Internal ?? false,
      ipam: n.IPAM?.Config?.map((c) => ({
        subnet: c.Subnet ?? "",
        gateway: c.Gateway ?? "",
      })) ?? [],
      containers: containersByNetwork.get(n.Name) ?? [],
      createdAt: n.Created ?? "",
      builtIn: ["bridge", "host", "none"].includes(n.Name),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to list networks", details: message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const docker = getDocker();
    const { name, driver, internal, subnet, gateway } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Network name is required" },
        { status: 400 },
      );
    }

    const ipamConfig: { Subnet?: string; Gateway?: string }[] = [];
    if (subnet) {
      ipamConfig.push({ Subnet: subnet, Gateway: gateway || undefined });
    }

    const network = await docker.createNetwork({
      Name: name,
      Driver: driver || "bridge",
      Internal: internal ?? false,
      IPAM: ipamConfig.length > 0 ? { Config: ipamConfig } : undefined,
    });

    return NextResponse.json({ success: true, id: network.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create network", details: message },
      { status: 500 },
    );
  }
}
