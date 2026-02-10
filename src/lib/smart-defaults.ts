import { IMAGE_CATALOG, type CatalogImage } from "./image-catalog";

export interface SmartDefaults {
  ports: { container: number; host: number; protocol: "tcp" | "udp" }[];
  volumes: { container: string; name: string }[];
  env: {
    key: string;
    value: string;
    required: boolean;
    secret: boolean;
    description: string;
  }[];
  size: string;
}

/**
 * Get smart defaults for an image.
 * 1. Check curated catalog first
 * 2. Fall back to Docker image inspect data
 */
export function getCatalogDefaults(imageName: string): SmartDefaults | null {
  const entry = IMAGE_CATALOG.find((img) => img.name === imageName);
  if (!entry) return null;
  return entry.defaults;
}

/**
 * Parse Docker image inspect data into smart defaults.
 * Used when the image isn't in our curated catalog.
 */
export function parseImageInspect(inspectData: {
  ExposedPorts?: Record<string, object>;
  Volumes?: Record<string, object>;
  Env?: string[];
}): SmartDefaults {
  const ports: SmartDefaults["ports"] = [];
  const volumes: SmartDefaults["volumes"] = [];
  const env: SmartDefaults["env"] = [];

  // Parse exposed ports
  if (inspectData.ExposedPorts) {
    for (const portSpec of Object.keys(inspectData.ExposedPorts)) {
      const [portStr, proto] = portSpec.split("/");
      const port = parseInt(portStr, 10);
      if (!isNaN(port)) {
        ports.push({
          container: port,
          host: port,
          protocol: (proto as "tcp" | "udp") ?? "tcp",
        });
      }
    }
  }

  // Parse volumes
  if (inspectData.Volumes) {
    for (const mountPath of Object.keys(inspectData.Volumes)) {
      const name = mountPath
        .replace(/^\//, "")
        .replace(/\//g, "_")
        .replace(/[^a-zA-Z0-9_-]/g, "");
      volumes.push({ container: mountPath, name });
    }
  }

  // Parse env vars (only ones with empty or placeholder values)
  if (inspectData.Env) {
    for (const envStr of inspectData.Env) {
      const eqIndex = envStr.indexOf("=");
      if (eqIndex === -1) continue;
      const key = envStr.slice(0, eqIndex);
      const value = envStr.slice(eqIndex + 1);
      // Skip internal vars
      if (key.startsWith("PATH") || key === "HOME" || key === "HOSTNAME") continue;
      const isSecret =
        key.toLowerCase().includes("password") ||
        key.toLowerCase().includes("secret") ||
        key.toLowerCase().includes("key");
      env.push({
        key,
        value,
        required: false,
        secret: isSecret,
        description: "",
      });
    }
  }

  return { ports, volumes, env, size: "small" };
}

export function findCatalogImage(name: string): CatalogImage | undefined {
  return IMAGE_CATALOG.find((img) => img.name === name);
}
