export type ContainerStatus = "running" | "exited" | "created" | "paused" | "restarting" | "removing" | "dead";

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: ContainerStatus;
  state: string;
  created: number;
  ports: PortMapping[];
  labels: Record<string, string>;
}

export interface PortMapping {
  containerPort: number;
  hostPort: number;
  protocol: "tcp" | "udp";
  hostIp?: string;
}

export interface SystemInfo {
  dockerVersion: string;
  apiVersion: string;
  os: string;
  arch: string;
  kernelVersion: string;
  totalMemory: number;
  cpus: number;
  containers: number;
  containersRunning: number;
  containersStopped: number;
  containersPaused: number;
  images: number;
  serverTime: string;
}

export interface ResourceTier {
  id: string;
  name: string;
  cpus: number;
  memory: number;
  description: string;
}

export const RESOURCE_TIERS: ResourceTier[] = [
  { id: "nano", name: "Nano", cpus: 0.25, memory: 256 * 1024 * 1024, description: "0.25 CPU / 256 MB" },
  { id: "small", name: "Small", cpus: 0.5, memory: 512 * 1024 * 1024, description: "0.5 CPU / 512 MB" },
  { id: "medium", name: "Medium", cpus: 1, memory: 1024 * 1024 * 1024, description: "1 CPU / 1 GB" },
  { id: "large", name: "Large", cpus: 2, memory: 2 * 1024 * 1024 * 1024, description: "2 CPU / 2 GB" },
  { id: "xl", name: "XL", cpus: 4, memory: 4 * 1024 * 1024 * 1024, description: "4 CPU / 4 GB" },
];
