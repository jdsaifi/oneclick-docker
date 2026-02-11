import type { CreateFormState, PortEntry, VolumeEntry, EnvEntry, LabelEntry } from "@/stores/create-form-store";
import { RESOURCE_TIERS } from "@/types/docker";

interface ExportableState {
  imageName: string;
  imageTag: string;
  sizeId: string;
  customCpus: number;
  customMemoryMB: number;
  volumes: VolumeEntry[];
  ports: PortEntry[];
  networkMode: string;
  envVars: EnvEntry[];
  containerName: string;
  restartPolicy: string;
  hostname: string;
  command: string;
  labels: LabelEntry[];
}

export function toDockerRunCommand(state: ExportableState): string {
  const parts: string[] = ["docker run -d"];

  if (state.containerName) {
    parts.push(`--name ${shellEscape(state.containerName)}`);
  }

  if (state.hostname) {
    parts.push(`--hostname ${shellEscape(state.hostname)}`);
  }

  if (state.restartPolicy && state.restartPolicy !== "no") {
    parts.push(`--restart ${state.restartPolicy}`);
  }

  // Resource limits
  const tier = RESOURCE_TIERS.find((t) => t.id === state.sizeId);
  if (state.sizeId === "custom") {
    parts.push(`--cpus ${state.customCpus}`);
    parts.push(`--memory ${state.customMemoryMB}m`);
  } else if (tier) {
    parts.push(`--cpus ${tier.cpus}`);
    parts.push(`--memory ${Math.round(tier.memory / (1024 * 1024))}m`);
  }

  // Ports
  for (const p of state.ports) {
    if (p.container > 0) {
      const hostPart = p.host > 0 ? `${p.host}:` : "";
      parts.push(`-p ${hostPart}${p.container}/${p.protocol}`);
    }
  }

  // Volumes
  for (const v of state.volumes) {
    if (!v.containerPath) continue;
    if (v.type === "bind" && v.hostPath) {
      parts.push(`-v ${shellEscape(v.hostPath)}:${shellEscape(v.containerPath)}`);
    } else if (v.name) {
      parts.push(`-v ${shellEscape(v.name)}:${shellEscape(v.containerPath)}`);
    }
  }

  // Environment variables
  for (const e of state.envVars) {
    if (e.key) {
      parts.push(`-e ${shellEscape(e.key)}=${shellEscape(e.value)}`);
    }
  }

  // Labels
  for (const l of state.labels) {
    if (l.key) {
      parts.push(`--label ${shellEscape(l.key)}=${shellEscape(l.value)}`);
    }
  }

  // Network mode
  if (state.networkMode && state.networkMode !== "bridge") {
    parts.push(`--network ${state.networkMode}`);
  }

  // Image
  const imageRef = `${state.imageName}:${state.imageTag || "latest"}`;
  parts.push(shellEscape(imageRef));

  // Command
  if (state.command) {
    parts.push(state.command);
  }

  return parts.join(" \\\n  ");
}

export function toDockerCompose(state: ExportableState): string {
  const serviceName = state.containerName || state.imageName.split("/").pop() || "app";
  const imageRef = `${state.imageName}:${state.imageTag || "latest"}`;

  const lines: string[] = [];
  lines.push("services:");
  lines.push(`  ${serviceName}:`);
  lines.push(`    image: ${imageRef}`);

  if (state.containerName) {
    lines.push(`    container_name: ${state.containerName}`);
  }

  if (state.hostname) {
    lines.push(`    hostname: ${state.hostname}`);
  }

  if (state.restartPolicy && state.restartPolicy !== "no") {
    lines.push(`    restart: ${state.restartPolicy}`);
  }

  // Resource limits
  const tier = RESOURCE_TIERS.find((t) => t.id === state.sizeId);
  const cpus = state.sizeId === "custom" ? state.customCpus : tier?.cpus;
  const memMB = state.sizeId === "custom" ? state.customMemoryMB : tier ? Math.round(tier.memory / (1024 * 1024)) : undefined;

  if (cpus || memMB) {
    lines.push("    deploy:");
    lines.push("      resources:");
    lines.push("        limits:");
    if (cpus) lines.push(`          cpus: '${cpus}'`);
    if (memMB) lines.push(`          memory: ${memMB}M`);
  }

  // Ports
  const validPorts = state.ports.filter((p) => p.container > 0);
  if (validPorts.length > 0) {
    lines.push("    ports:");
    for (const p of validPorts) {
      const hostPart = p.host > 0 ? `${p.host}:` : "";
      lines.push(`      - "${hostPart}${p.container}/${p.protocol}"`);
    }
  }

  // Volumes
  const validVolumes = state.volumes.filter((v) => v.containerPath);
  if (validVolumes.length > 0) {
    lines.push("    volumes:");
    for (const v of validVolumes) {
      if (v.type === "bind" && v.hostPath) {
        lines.push(`      - ${v.hostPath}:${v.containerPath}`);
      } else if (v.name) {
        lines.push(`      - ${v.name}:${v.containerPath}`);
      }
    }
  }

  // Environment variables
  const validEnv = state.envVars.filter((e) => e.key);
  if (validEnv.length > 0) {
    lines.push("    environment:");
    for (const e of validEnv) {
      lines.push(`      - ${e.key}=${e.value}`);
    }
  }

  // Labels
  const validLabels = state.labels.filter((l) => l.key);
  if (validLabels.length > 0) {
    lines.push("    labels:");
    for (const l of validLabels) {
      lines.push(`      - ${l.key}=${l.value}`);
    }
  }

  // Network mode
  if (state.networkMode && state.networkMode !== "bridge") {
    lines.push(`    network_mode: ${state.networkMode}`);
  }

  // Command
  if (state.command) {
    lines.push(`    command: ${state.command}`);
  }

  // Top-level volumes section for named volumes
  const namedVolumes = validVolumes.filter((v) => v.type === "volume" && v.name);
  if (namedVolumes.length > 0) {
    lines.push("");
    lines.push("volumes:");
    for (const v of namedVolumes) {
      lines.push(`  ${v.name}:`);
    }
  }

  return lines.join("\n");
}

function shellEscape(s: string): string {
  if (/^[a-zA-Z0-9._:/@=-]+$/.test(s)) return s;
  return `'${s.replace(/'/g, "'\\''")}'`;
}
