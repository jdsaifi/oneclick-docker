"use client";

import { Cpu, MemoryStick, Network, HardDrive, Users, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useContainerStats } from "@/hooks/use-container-stats";
import { formatBytes } from "@/lib/format";

export function ContainerStats({
  containerId,
  isRunning,
}: {
  containerId: string;
  isRunning: boolean;
}) {
  const { stats, history, connected } = useContainerStats(containerId, isRunning);

  if (!isRunning) {
    return (
      <div className="flex items-center justify-center h-64 border border-dashed border-border rounded-lg">
        <p className="text-sm text-muted-foreground">
          Container is not running. Start it to see live stats.
        </p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection status */}
      <div className="flex justify-end">
        <Badge
          variant={connected ? "default" : "secondary"}
          className="gap-1 text-xs"
        >
          {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {connected ? "Live" : "Disconnected"}
        </Badge>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* CPU */}
        <StatCard
          icon={Cpu}
          title="CPU Usage"
          value={`${stats.cpuPercent.toFixed(1)}%`}
          bar={stats.cpuPercent}
          color="bg-blue-500"
        />

        {/* Memory */}
        <StatCard
          icon={MemoryStick}
          title="Memory"
          value={`${formatBytes(stats.memoryUsage)} / ${formatBytes(stats.memoryLimit)}`}
          bar={stats.memoryPercent}
          color="bg-green-500"
          subtitle={`${stats.memoryPercent.toFixed(1)}%`}
        />

        {/* Network */}
        <StatCard
          icon={Network}
          title="Network I/O"
          value={`${formatBytes(stats.networkRx)} / ${formatBytes(stats.networkTx)}`}
          subtitle="RX / TX"
        />

        {/* PIDs */}
        <StatCard
          icon={Users}
          title="Processes"
          value={String(stats.pids)}
          subtitle="PIDs"
        />
      </div>

      {/* CPU History Chart (simple bar chart) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">CPU History (last 60s)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-px h-24">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-blue-500/80 rounded-t-sm transition-all duration-300 min-w-[2px]"
                style={{ height: `${Math.min(h.cpuPercent, 100)}%` }}
                title={`${h.cpuPercent.toFixed(1)}%`}
              />
            ))}
            {history.length === 0 && (
              <p className="text-xs text-muted-foreground w-full text-center self-center">
                Collecting data...
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Memory History Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Memory History (last 60s)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-px h-24">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-green-500/80 rounded-t-sm transition-all duration-300 min-w-[2px]"
                style={{ height: `${Math.min(h.memoryPercent, 100)}%` }}
                title={`${h.memoryPercent.toFixed(1)}%`}
              />
            ))}
            {history.length === 0 && (
              <p className="text-xs text-muted-foreground w-full text-center self-center">
                Collecting data...
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Block I/O */}
      {(stats.blockRead > 0 || stats.blockWrite > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4" /> Block I/O
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-8 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Read</p>
                <p className="font-mono font-medium">{formatBytes(stats.blockRead)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Write</p>
                <p className="font-mono font-medium">{formatBytes(stats.blockWrite)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  bar,
  color,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  bar?: number;
  color?: string;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
        <p className="text-lg font-semibold font-mono">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {bar !== undefined && color && (
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${color} rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(bar, 100)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
