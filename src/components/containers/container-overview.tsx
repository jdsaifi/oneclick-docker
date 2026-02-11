"use client";

import { Globe, HardDrive, Key, Network, Clock, Tag, Box, Terminal, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/format";
import { toast } from "sonner";

interface ContainerInspect {
  Id: string;
  Name: string;
  State: {
    Status: string;
    Running: boolean;
    StartedAt: string;
    FinishedAt: string;
    Pid: number;
  };
  Config: {
    Image: string;
    Hostname: string;
    Env: string[];
    Cmd: string[] | null;
    Entrypoint: string[] | null;
    Labels: Record<string, string>;
    ExposedPorts?: Record<string, object>;
  };
  HostConfig: {
    PortBindings?: Record<string, { HostIp: string; HostPort: string }[]>;
    Binds?: string[];
    RestartPolicy?: { Name: string; MaximumRetryCount: number };
    NanoCpus?: number;
    Memory?: number;
    NetworkMode?: string;
  };
  NetworkSettings: {
    Networks?: Record<
      string,
      { IPAddress: string; Gateway: string; MacAddress: string }
    >;
    Ports?: Record<string, { HostIp: string; HostPort: string }[] | null>;
  };
  Mounts: { Type: string; Name?: string; Source: string; Destination: string; RW: boolean }[];
}

export function ContainerOverview({ data }: { data: ContainerInspect }) {
  const name = data.Name?.replace(/^\//, "");
  const isRunning = data.State.Running;
  const startedAt = data.State.StartedAt;

  // Parse ports
  const ports: { host: string; container: string }[] = [];
  if (data.NetworkSettings.Ports) {
    for (const [containerPort, bindings] of Object.entries(data.NetworkSettings.Ports)) {
      if (bindings) {
        for (const b of bindings) {
          ports.push({
            host: `${b.HostIp || "0.0.0.0"}:${b.HostPort}`,
            container: containerPort,
          });
        }
      }
    }
  }

  // Parse networks
  const networks = data.NetworkSettings.Networks
    ? Object.entries(data.NetworkSettings.Networks)
    : [];

  // Resources
  const cpus = data.HostConfig.NanoCpus
    ? data.HostConfig.NanoCpus / 1e9
    : null;
  const memory = data.HostConfig.Memory || null;

  // Env (filter out common internal ones)
  const env = (data.Config.Env || []).filter(
    (e) => !e.startsWith("PATH=") && !e.startsWith("HOME=") && !e.startsWith("HOSTNAME="),
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* General Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Box className="h-4 w-4" /> General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Name" value={name} />
          <Row label="Image" value={data.Config.Image} mono />
          <Row label="ID" value={data.Id.slice(0, 12)} mono />
          <Row
            label="Status"
            value={
              <Badge variant={isRunning ? "default" : "secondary"}>
                {data.State.Status}
              </Badge>
            }
          />
          {isRunning && data.State.Pid > 0 && (
            <Row label="PID" value={String(data.State.Pid)} mono />
          )}
          {startedAt && startedAt !== "0001-01-01T00:00:00Z" && (
            <Row
              label="Started"
              value={new Date(startedAt).toLocaleString()}
            />
          )}
          {data.Config.Cmd && (
            <Row label="Command" value={data.Config.Cmd.join(" ")} mono />
          )}
          {data.HostConfig.RestartPolicy?.Name && (
            <Row
              label="Restart Policy"
              value={data.HostConfig.RestartPolicy.Name || "no"}
            />
          )}
        </CardContent>
      </Card>

      {/* Ports */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" /> Ports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No published ports</p>
          ) : (
            <div className="space-y-2">
              {ports.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm font-mono p-2 rounded bg-muted/50"
                >
                  <span>{p.host}</span>
                  <span className="text-muted-foreground">→</span>
                  <span>{p.container}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Volumes / Mounts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <HardDrive className="h-4 w-4" /> Mounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.Mounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No mounts</p>
          ) : (
            <div className="space-y-2">
              {data.Mounts.map((m, i) => (
                <div key={i} className="text-sm p-2 rounded bg-muted/50 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {m.Type}
                    </Badge>
                    {m.Name && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {m.Name}
                      </span>
                    )}
                    <Badge variant={m.RW ? "secondary" : "outline"} className="text-[10px] ml-auto">
                      {m.RW ? "rw" : "ro"}
                    </Badge>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground truncate">
                    {m.Source} → {m.Destination}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Network */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Network className="h-4 w-4" /> Networks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {networks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No networks</p>
          ) : (
            <div className="space-y-2">
              {networks.map(([name, net]) => (
                <div key={name} className="text-sm p-2 rounded bg-muted/50 space-y-1">
                  <p className="font-medium">{name}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground font-mono">
                    {net.IPAddress && <span>IP: {net.IPAddress}</span>}
                    {net.Gateway && <span>GW: {net.Gateway}</span>}
                    {net.MacAddress && <span>MAC: {net.MacAddress}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resources */}
      {(cpus || memory) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" /> Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {cpus && <Row label="CPU Limit" value={`${cpus} cores`} />}
            {memory && <Row label="Memory Limit" value={formatBytes(memory)} />}
          </CardContent>
        </Card>
      )}

      {/* Environment Variables */}
      {env.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4" /> Environment Variables
              <Badge variant="secondary" className="text-xs ml-auto">
                {env.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {env.map((e, i) => {
                const eqIndex = e.indexOf("=");
                const key = e.slice(0, eqIndex);
                const val = e.slice(eqIndex + 1);
                const isSecret =
                  key.toLowerCase().includes("password") ||
                  key.toLowerCase().includes("secret") ||
                  key.toLowerCase().includes("key");
                return (
                  <div
                    key={i}
                    className="flex gap-2 text-xs font-mono p-1.5 rounded hover:bg-muted/50"
                  >
                    <span className="text-blue-400 shrink-0">{key}</span>
                    <span className="text-muted-foreground">=</span>
                    <span className="text-muted-foreground truncate">
                      {isSecret ? "••••••••" : val}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Connect */}
      {isRunning && <QuickConnectCard data={data} ports={ports} name={name} />}

      {/* Labels */}
      {Object.keys(data.Config.Labels || {}).length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" /> Labels
              <Badge variant="secondary" className="text-xs ml-auto">
                {Object.keys(data.Config.Labels).length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {Object.entries(data.Config.Labels).map(([k, v]) => (
                <div
                  key={k}
                  className="flex gap-2 text-xs font-mono p-1.5 rounded hover:bg-muted/50"
                >
                  <span className="text-green-400 shrink-0">{k}</span>
                  <span className="text-muted-foreground">=</span>
                  <span className="text-muted-foreground truncate">{v}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : ""}>{value}</span>
    </div>
  );
}

function QuickConnectCard({
  data,
  ports,
  name,
}: {
  data: ContainerInspect;
  ports: { host: string; container: string }[];
  name: string;
}) {
  const image = data.Config.Image.toLowerCase();
  const commands: { label: string; cmd: string }[] = [];

  // Shell access
  commands.push({
    label: "Open Shell",
    cmd: `docker exec -it ${name} /bin/sh`,
  });

  // Image-specific connection commands
  const portMap = new Map<number, number>();
  for (const p of ports) {
    const hostPort = parseInt(p.host.split(":").pop() || "0", 10);
    const containerPort = parseInt(p.container.split("/")[0], 10);
    if (hostPort > 0 && containerPort > 0) {
      portMap.set(containerPort, hostPort);
    }
  }

  if (image.includes("postgres")) {
    const port = portMap.get(5432) || 5432;
    commands.push({
      label: "Connect via psql",
      cmd: `psql -h localhost -p ${port} -U postgres`,
    });
  }
  if (image.includes("mysql") || image.includes("mariadb")) {
    const port = portMap.get(3306) || 3306;
    commands.push({
      label: "Connect via mysql",
      cmd: `mysql -h 127.0.0.1 -P ${port} -u root -p`,
    });
  }
  if (image.includes("redis")) {
    const port = portMap.get(6379) || 6379;
    commands.push({
      label: "Connect via redis-cli",
      cmd: `redis-cli -h localhost -p ${port}`,
    });
  }
  if (image.includes("mongo")) {
    const port = portMap.get(27017) || 27017;
    commands.push({
      label: "Connect via mongosh",
      cmd: `mongosh --host localhost --port ${port}`,
    });
  }
  if (image.includes("nginx") || image.includes("httpd") || image.includes("caddy")) {
    const port = portMap.get(80) || portMap.get(443);
    if (port) {
      commands.push({
        label: "Open in browser",
        cmd: `http://localhost:${port}`,
      });
    }
  }

  // Logs shortcut
  commands.push({
    label: "View logs",
    cmd: `docker logs -f ${name}`,
  });

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Terminal className="h-4 w-4" /> Quick Connect
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {commands.map((c, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2 rounded bg-muted/50 gap-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground mb-0.5">{c.label}</p>
                <p className="text-sm font-mono truncate">{c.cmd}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => copy(c.cmd)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
