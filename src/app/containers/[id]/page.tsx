"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Square,
  RotateCw,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContainerOverview } from "@/components/containers/container-overview";
import { ContainerLogs } from "@/components/containers/container-logs";
import { ContainerStats } from "@/components/containers/container-stats";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  running: "bg-green-500",
  exited: "bg-gray-500",
  created: "bg-blue-500",
  paused: "bg-yellow-500",
  restarting: "bg-orange-500",
  dead: "bg-red-700",
};

export default function ContainerDetailPage() {
  const { id } = useParams<{ id: string }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/containers/${id}`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.details || body.error || "Failed to fetch");
      }
      const info = await res.json();
      setData(info);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function handleAction(action: "start" | "stop" | "restart") {
    setActionLoading(action);
    try {
      const res = await fetch(`/api/containers/${id}/${action}`, {
        method: "POST",
      });
      if (!res.ok && res.status !== 304) {
        const body = await res.json();
        throw new Error(body.details || body.error || `Failed to ${action}`);
      }
      toast.success(`Container ${action}ed`);
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemove() {
    setShowRemoveDialog(false);
    setActionLoading("remove");
    try {
      const res = await fetch(`/api/containers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.details || body.error || "Failed to remove");
      }
      toast.success("Container removed");
      window.location.href = "/containers";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/containers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Error</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const name = data.Name?.replace(/^\//, "") ?? id.slice(0, 12);
  const isRunning = data.State?.Running ?? false;
  const status = data.State?.Status ?? "unknown";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/containers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${statusColors[status] ?? "bg-gray-500"}`}
              />
              <h1 className="text-2xl font-bold">{name}</h1>
              <Badge variant="outline">{status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 ml-5">
              {data.Config?.Image}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-5 sm:ml-0">
          {isRunning ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction("stop")}
                disabled={actionLoading !== null}
              >
                {actionLoading === "stop" ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Square className="h-4 w-4 mr-1.5" />
                )}
                Stop
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction("restart")}
                disabled={actionLoading !== null}
              >
                {actionLoading === "restart" ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <RotateCw className="h-4 w-4 mr-1.5" />
                )}
                Restart
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("start")}
              disabled={actionLoading !== null}
            >
              {actionLoading === "start" ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-1.5" />
              )}
              Start
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setShowRemoveDialog(true)}
            disabled={actionLoading !== null}
          >
            {actionLoading === "remove" ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-1.5" />
            )}
            Remove
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <ContainerOverview data={data} />
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <ContainerLogs containerId={id} isRunning={isRunning} />
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <ContainerStats containerId={id} isRunning={isRunning} />
        </TabsContent>
      </Tabs>

      {/* Remove confirmation dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Container</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">{name}</span>?
              {isRunning && " The container will be stopped first."}
              {" "}This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
