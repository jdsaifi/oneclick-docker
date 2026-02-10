"use client";

import Link from "next/link";
import {
  Box,
  Container,
  Database,
  Network,
  Plus,
  Server,
  Cpu,
  MemoryStick,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSystemInfo } from "@/hooks/use-system-info";
import { formatBytes } from "@/lib/format";

export default function DashboardPage() {
  const { data, error, loading } = useSystemInfo();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your Docker environment
          </p>
        </div>
        <Button asChild>
          <Link href="/containers/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Container
          </Link>
        </Button>
      </div>

      {/* Connection Status */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Docker Connection Failed</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Make sure Docker is running and the socket is accessible at /var/run/docker.sock
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Containers"
          icon={Box}
          loading={loading}
          value={data?.containers}
          subtitle={
            data
              ? `${data.containersRunning} running, ${data.containersStopped} stopped`
              : undefined
          }
          href="/containers"
        />
        <StatsCard
          title="Images"
          icon={Container}
          loading={loading}
          value={data?.images}
          subtitle="Local images"
          href="/images"
        />
        <StatsCard
          title="CPU Cores"
          icon={Cpu}
          loading={loading}
          value={data?.cpus}
          subtitle={data?.arch}
        />
        <StatsCard
          title="Memory"
          icon={MemoryStick}
          loading={loading}
          value={data ? formatBytes(data.totalMemory) : undefined}
          subtitle="Total available"
        />
      </div>

      {/* Docker Info */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Server className="h-5 w-5" />
              Docker Engine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem label="Version" value={data.dockerVersion} />
              <InfoItem label="API Version" value={data.apiVersion} />
              <InfoItem label="OS" value={data.os} />
              <InfoItem label="Kernel" value={data.kernelVersion} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            title="Create Container"
            description="Launch a new container with guided setup"
            icon={Plus}
            href="/containers/create"
          />
          <QuickAction
            title="Manage Volumes"
            description="Create and manage persistent storage"
            icon={Database}
            href="/volumes"
          />
          <QuickAction
            title="Manage Networks"
            description="Configure container networking"
            icon={Network}
            href="/networks"
          />
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  icon: Icon,
  loading,
  value,
  subtitle,
  href,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
  value?: string | number;
  subtitle?: string;
  href?: string;
}) {
  const content = (
    <Card className={href ? "hover:bg-muted/50 transition-colors cursor-pointer" : ""}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1">{value ?? "—"}</p>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground/50" />
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <Badge variant="secondary" className="mt-1 font-mono">
        {value}
      </Badge>
    </div>
  );
}

function QuickAction({
  title,
  description,
  icon: Icon,
  href,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
        <CardContent className="flex items-start gap-4 pt-6">
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
