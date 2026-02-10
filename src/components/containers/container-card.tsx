"use client";

import Link from "next/link";
import {
  Play,
  Square,
  RotateCw,
  Trash2,
  MoreVertical,
  Globe,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ContainerInfo } from "@/types/docker";

const statusConfig: Record<
  string,
  { color: string; label: string }
> = {
  running: { color: "bg-green-500", label: "Running" },
  exited: { color: "bg-gray-500", label: "Stopped" },
  created: { color: "bg-blue-500", label: "Created" },
  paused: { color: "bg-yellow-500", label: "Paused" },
  restarting: { color: "bg-orange-500", label: "Restarting" },
  removing: { color: "bg-red-500", label: "Removing" },
  dead: { color: "bg-red-700", label: "Dead" },
};

interface ContainerCardProps {
  container: ContainerInfo;
  onAction: (id: string, action: "start" | "stop" | "restart" | "remove") => void;
  actionLoading?: string | null;
}

export function ContainerCard({ container, onAction, actionLoading }: ContainerCardProps) {
  const status = statusConfig[container.status] ?? {
    color: "bg-gray-500",
    label: container.status,
  };
  const isRunning = container.status === "running";
  const isThisLoading = actionLoading === container.id;

  return (
    <Card className="hover:bg-muted/30 transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className={`h-2.5 w-2.5 rounded-full ${status.color}`} />
              <Link
                href={`/containers/${container.id}`}
                className="font-semibold truncate hover:underline"
              >
                {container.name}
              </Link>
            </div>

            <p className="text-sm text-muted-foreground truncate mb-3">
              {container.image}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {status.label}
              </Badge>

              {container.ports.map((p) => (
                <Badge
                  key={`${p.hostPort}-${p.containerPort}-${p.protocol}`}
                  variant="secondary"
                  className="text-xs font-mono gap-1"
                >
                  <Globe className="h-3 w-3" />
                  {p.hostPort}:{p.containerPort}/{p.protocol}
                </Badge>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              {container.state}
            </p>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {isRunning ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onAction(container.id, "stop")}
                disabled={isThisLoading}
                title="Stop"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onAction(container.id, "start")}
                disabled={isThisLoading}
                title="Start"
              >
                <Play className="h-4 w-4" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isRunning ? (
                  <DropdownMenuItem onClick={() => onAction(container.id, "stop")}>
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onAction(container.id, "start")}>
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onAction(container.id, "restart")}>
                  <RotateCw className="h-4 w-4 mr-2" />
                  Restart
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onAction(container.id, "remove")}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ContainerCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-muted animate-pulse" />
              <div className="h-5 w-40 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-4 w-56 bg-muted animate-pulse rounded" />
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-muted animate-pulse rounded" />
              <div className="h-5 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
