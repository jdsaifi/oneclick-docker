import { create } from "zustand";
import type { SmartDefaults } from "@/lib/smart-defaults";

export interface PortEntry {
  container: number;
  host: number;
  protocol: "tcp" | "udp";
}

export interface VolumeEntry {
  containerPath: string;
  name: string;
  type: "volume" | "bind";
  hostPath?: string;
}

export interface EnvEntry {
  key: string;
  value: string;
  required: boolean;
  secret: boolean;
  description: string;
}

export interface LabelEntry {
  key: string;
  value: string;
}

export interface CreateFormState {
  // Section 1: Image
  imageName: string;
  imageTag: string;
  imageDisplayName: string;

  // Section 2: Size
  sizeId: string;
  customCpus: number;
  customMemoryMB: number;

  // Section 3: Volumes
  volumes: VolumeEntry[];

  // Section 4: Network & Ports
  ports: PortEntry[];
  networkMode: string;

  // Section 5: Environment
  envVars: EnvEntry[];

  // Section 6: Advanced
  containerName: string;
  restartPolicy: "no" | "unless-stopped" | "always" | "on-failure";
  hostname: string;
  command: string;
  labels: LabelEntry[];

  // Actions
  setImage: (name: string, tag: string, displayName: string) => void;
  applyDefaults: (defaults: SmartDefaults) => void;
  setSize: (id: string) => void;
  setCustomCpus: (cpus: number) => void;
  setCustomMemoryMB: (mb: number) => void;
  setPorts: (ports: PortEntry[]) => void;
  addPort: () => void;
  updatePort: (index: number, port: Partial<PortEntry>) => void;
  removePort: (index: number) => void;
  setVolumes: (volumes: VolumeEntry[]) => void;
  addVolume: () => void;
  updateVolume: (index: number, vol: Partial<VolumeEntry>) => void;
  removeVolume: (index: number) => void;
  setNetworkMode: (mode: string) => void;
  setEnvVars: (envVars: EnvEntry[]) => void;
  addEnvVar: () => void;
  updateEnvVar: (index: number, env: Partial<EnvEntry>) => void;
  removeEnvVar: (index: number) => void;
  setContainerName: (name: string) => void;
  setRestartPolicy: (policy: CreateFormState["restartPolicy"]) => void;
  setHostname: (hostname: string) => void;
  setCommand: (command: string) => void;
  setLabels: (labels: LabelEntry[]) => void;
  addLabel: () => void;
  updateLabel: (index: number, label: Partial<LabelEntry>) => void;
  removeLabel: (index: number) => void;
  reset: () => void;
}

const initialState = {
  imageName: "",
  imageTag: "latest",
  imageDisplayName: "",
  sizeId: "small",
  customCpus: 1,
  customMemoryMB: 1024,
  volumes: [] as VolumeEntry[],
  ports: [] as PortEntry[],
  networkMode: "bridge",
  envVars: [] as EnvEntry[],
  containerName: "",
  restartPolicy: "unless-stopped" as const,
  hostname: "",
  command: "",
  labels: [] as LabelEntry[],
};

export const useCreateFormStore = create<CreateFormState>((set) => ({
  ...initialState,

  setImage: (name, tag, displayName) =>
    set({ imageName: name, imageTag: tag, imageDisplayName: displayName }),

  applyDefaults: (defaults) =>
    set({
      ports: defaults.ports.map((p) => ({
        container: p.container,
        host: p.host,
        protocol: p.protocol,
      })),
      volumes: defaults.volumes.map((v) => ({
        containerPath: v.container,
        name: v.name,
        type: "volume" as const,
      })),
      envVars: defaults.env.map((e) => ({
        key: e.key,
        value: e.value,
        required: e.required,
        secret: e.secret,
        description: e.description,
      })),
      sizeId: defaults.size,
    }),

  setSize: (id) => set({ sizeId: id }),
  setCustomCpus: (cpus) => set({ customCpus: cpus }),
  setCustomMemoryMB: (mb) => set({ customMemoryMB: mb }),

  setPorts: (ports) => set({ ports }),
  addPort: () =>
    set((state) => ({
      ports: [...state.ports, { container: 0, host: 0, protocol: "tcp" }],
    })),
  updatePort: (index, port) =>
    set((state) => ({
      ports: state.ports.map((p, i) => (i === index ? { ...p, ...port } : p)),
    })),
  removePort: (index) =>
    set((state) => ({
      ports: state.ports.filter((_, i) => i !== index),
    })),

  setVolumes: (volumes) => set({ volumes }),
  addVolume: () =>
    set((state) => ({
      volumes: [
        ...state.volumes,
        { containerPath: "", name: "", type: "volume" },
      ],
    })),
  updateVolume: (index, vol) =>
    set((state) => ({
      volumes: state.volumes.map((v, i) =>
        i === index ? { ...v, ...vol } : v,
      ),
    })),
  removeVolume: (index) =>
    set((state) => ({
      volumes: state.volumes.filter((_, i) => i !== index),
    })),

  setNetworkMode: (mode) => set({ networkMode: mode }),

  setEnvVars: (envVars) => set({ envVars }),
  addEnvVar: () =>
    set((state) => ({
      envVars: [
        ...state.envVars,
        { key: "", value: "", required: false, secret: false, description: "" },
      ],
    })),
  updateEnvVar: (index, env) =>
    set((state) => ({
      envVars: state.envVars.map((e, i) =>
        i === index ? { ...e, ...env } : e,
      ),
    })),
  removeEnvVar: (index) =>
    set((state) => ({
      envVars: state.envVars.filter((_, i) => i !== index),
    })),

  setContainerName: (name) => set({ containerName: name }),
  setRestartPolicy: (policy) => set({ restartPolicy: policy }),
  setHostname: (hostname) => set({ hostname }),
  setCommand: (command) => set({ command }),

  setLabels: (labels) => set({ labels }),
  addLabel: () =>
    set((state) => ({
      labels: [...state.labels, { key: "", value: "" }],
    })),
  updateLabel: (index, label) =>
    set((state) => ({
      labels: state.labels.map((l, i) =>
        i === index ? { ...l, ...label } : l,
      ),
    })),
  removeLabel: (index) =>
    set((state) => ({
      labels: state.labels.filter((_, i) => i !== index),
    })),

  reset: () => set(initialState),
}));
