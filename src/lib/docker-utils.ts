import type Docker from "dockerode";
import type { ContainerInfo, ContainerStatus, PortMapping } from "@/types/docker";

export function parseContainerInfo(container: Docker.ContainerInfo): ContainerInfo {
  const name = (container.Names?.[0] ?? "").replace(/^\//, "");
  const state = (container.State ?? "unknown").toLowerCase();

  const ports: PortMapping[] = (container.Ports ?? [])
    .filter((p) => p.PublicPort)
    .map((p) => ({
      containerPort: p.PrivatePort,
      hostPort: p.PublicPort!,
      protocol: (p.Type as "tcp" | "udp") ?? "tcp",
      hostIp: p.IP,
    }));

  return {
    id: container.Id,
    name,
    image: container.Image,
    status: state as ContainerStatus,
    state: container.Status ?? state,
    created: container.Created,
    ports,
    labels: container.Labels ?? {},
  };
}
